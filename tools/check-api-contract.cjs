const { readdirSync, readFileSync } = require('node:fs');
const { join, relative } = require('node:path');

const repoRoot = join(__dirname, '..');
const backendRoot = join(repoRoot, 'pbs-backend', 'src', 'modules');
const clientRoots = [
  join(repoRoot, 'pbs-webapp', 'src', 'app'),
  join(repoRoot, 'pbs-mobile', 'src', 'app'),
];

function walk(dir, predicate) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      return walk(fullPath, predicate);
    }
    return predicate(fullPath) ? [fullPath] : [];
  });
}

function normalizePath(path) {
  const withoutQuery = path.split('?')[0].replace(/\/+/g, '/').replace(/\/$/, '');
  const withLeadingSlash = withoutQuery.startsWith('/') ? withoutQuery : `/${withoutQuery}`;
  return withLeadingSlash.replace(/:\w+/g, ':param');
}

function joinRoute(base, route) {
  return normalizePath([base, route].filter(Boolean).join('/'));
}

function extractBackendRoutes() {
  const routes = new Set();
  const files = walk(backendRoot, (file) => file.endsWith('.controller.ts'));

  for (const file of files) {
    const source = readFileSync(file, 'utf8');
    const controllerMatch = source.match(/@Controller\(\s*['"`]([^'"`]*)['"`]\s*\)/);
    if (!controllerMatch) {
      continue;
    }

    const controllerPath = controllerMatch[1];
    const routePattern = /@(Get|Post|Put|Patch|Delete)\(\s*(?:['"`]([^'"`]*)['"`])?\s*\)/g;
    for (const match of source.matchAll(routePattern)) {
      routes.add(joinRoute(controllerPath, match[2] ?? ''));
    }
  }

  return routes;
}

function normalizeClientLiteral(rawLiteral) {
  const replacedExpressions = rawLiteral.replace(/\$\{[^}]+\}/g, ':param');
  const apiMatch = replacedExpressions.match(/\/api(?:\/|$)/);
  const apiStart = apiMatch?.index ?? -1;
  if (apiStart >= 0) {
    return normalizePath(replacedExpressions.slice(apiStart));
  }

  const baseRouteStart = replacedExpressions.match(/^:param\/(.+)$/);
  if (baseRouteStart) {
    return normalizePath(`/api/${baseRouteStart[1]}`);
  }

  return null;
}

function extractClientRoutes() {
  const routes = new Map();
  const files = clientRoots.flatMap((root) =>
    walk(root, (file) => file.endsWith('.ts') && !file.endsWith('.spec.ts')),
  );

  for (const file of files) {
    const source = readFileSync(file, 'utf8');
    const baseRoutes = new Map();
    for (const match of source.matchAll(/(?:readonly\s+)?(basis|baseUrl)\s*=\s*['"`](\/api[^'"`]*)['"`]/g)) {
      baseRoutes.set(`this.${match[1]}`, match[2]);
    }
    const literals = source.matchAll(/(['"`])((?:\\.|(?!\1)[\s\S])*?)\1/g);

    for (const match of literals) {
      const literal = match[2];
      const nearbySource = source.slice(Math.max(0, match.index - 160), match.index);
      const isUrlCall =
        /(?:http|this\.http)\s*\.\s*(?:get|post|put|patch|delete)(?:\s*<[^>]+>)?\s*\([^)]*$/.test(
          nearbySource,
        ) || /fetch\s*\([^)]*$/.test(nearbySource);

      if (!isUrlCall) {
        continue;
      }

      const directRoute = normalizeClientLiteral(literal);
      if (directRoute) {
        addRoute(routes, directRoute, file);
        continue;
      }

      for (const [baseName, baseRoute] of baseRoutes) {
        const basePrefix = `\${${baseName}}/`;
        if (literal.startsWith(basePrefix)) {
          addRoute(routes, normalizePath(`${baseRoute}/${literal.slice(basePrefix.length)}`), file);
        }
      }
    }
  }

  return routes;
}

function addRoute(routes, route, file) {
  if (!routes.has(route)) {
    routes.set(route, new Set());
  }
  routes.get(route).add(relative(repoRoot, file));
}

const backendRoutes = extractBackendRoutes();
const clientRoutes = extractClientRoutes();
const missingRoutes = Array.from(clientRoutes.keys())
  .filter((route) => !Array.from(backendRoutes).some((backendRoute) => routeMatches(backendRoute, route)))
  .sort();

function routeMatches(backendRoute, clientRoute) {
  const backendSegments = backendRoute.split('/').filter(Boolean);
  const clientSegments = clientRoute.split('/').filter(Boolean);
  if (backendSegments.length !== clientSegments.length) {
    return false;
  }
  return backendSegments.every(
    (segment, index) => segment === ':param' || clientSegments[index] === ':param' || segment === clientSegments[index],
  );
}

if (missingRoutes.length > 0) {
  console.error('API contract drift detected. Client route(s) without matching Nest controller route:');
  for (const route of missingRoutes) {
    console.error(`- ${route}`);
    for (const file of clientRoutes.get(route)) {
      console.error(`  ${file}`);
    }
  }
  process.exit(1);
}

console.log(`API contract check passed: ${clientRoutes.size} client route(s), ${backendRoutes.size} backend route(s).`);

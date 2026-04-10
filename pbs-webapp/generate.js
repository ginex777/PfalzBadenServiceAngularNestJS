const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, 'src');

function walk(dir, files = []) {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);

    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath, files);
    } else {
      files.push(fullPath);
    }
  });
  return files;
}

// ------------------------------
// TYPE DETECTION
// ------------------------------
function getType(file) {
  if (file.includes('.component.')) return 'component';
  if (file.includes('.service.')) return 'service';
  if (file.includes('.pipe.')) return 'pipe';
  if (file.includes('.directive.')) return 'directive';
  if (file.includes('.facade.')) return 'service'; // Angular treats like service
  return 'class';
}

// ------------------------------
// CLASS NAME DETECTION
// ------------------------------
function getClassName(content) {
  const match = content.match(/export class (\w+)/);
  return match ? match[1] : null;
}

// ------------------------------
// ANGULAR-LIKE SPEC GENERATION
// ------------------------------
function createSpec(file, className, type) {
  const importPath = `./${path.basename(file).replace('.ts', '')}`;

  // ---------------- COMPONENT ----------------
  if (type === 'component') {
    return `import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ${className} } from '${importPath}';

describe('${className}', () => {
  let component: ${className};
  let fixture: ComponentFixture<${className}>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [${className}]
    }).compileComponents();

    fixture = TestBed.createComponent(${className});
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
`;
  }

  // ---------------- SERVICE / FACADE ----------------
  if (type === 'service') {
    return `import { TestBed } from '@angular/core/testing';
import { ${className} } from '${importPath}';

describe('${className}', () => {
  let service: ${className};

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [${className}]
    });

    service = TestBed.inject(${className});
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
`;
  }

  // ---------------- PIPE ----------------
  if (type === 'pipe') {
    return `import { ${className} } from '${importPath}';

describe('${className}', () => {
  it('create an instance', () => {
    const pipe = new ${className}();
    expect(pipe).toBeTruthy();
  });
});
`;
  }

  // ---------------- DIRECTIVE ----------------
  if (type === 'directive') {
    return `import { ${className} } from '${importPath}';

describe('${className}', () => {
  it('should create instance', () => {
    const directive = new ${className}();
    expect(directive).toBeTruthy();
  });
});
`;
  }

  // ---------------- FALLBACK ----------------
  return `import { ${className} } from '${importPath}';

describe('${className}', () => {
  it('should create', () => {
    expect(new ${className}()).toBeTruthy();
  });
});
`;
}

// ------------------------------
// MAIN RUNNER
// ------------------------------
const files = walk(SRC_DIR);

files
  .filter(f =>
    f.endsWith('.component.ts') ||
    f.endsWith('.service.ts') ||
    f.endsWith('.pipe.ts') ||
    f.endsWith('.directive.ts') ||
    f.endsWith('.facade.ts')
  )
  .forEach(file => {
    const specFile = file.replace('.ts', '.spec.ts');

    if (fs.existsSync(specFile)) return;

    const content = fs.readFileSync(file, 'utf8');
    const className = getClassName(content);

    if (!className) return;

    const type = getType(file);
    const spec = createSpec(file, className, type);

    fs.writeFileSync(specFile, spec, 'utf8');
    console.log('Created:', specFile);
  });

console.log('Done ✔ Angular-like specs generated');
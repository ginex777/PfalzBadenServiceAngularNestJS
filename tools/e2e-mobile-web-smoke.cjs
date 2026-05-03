const assert = require('node:assert/strict');

const apiBase = (process.env.PBS_API_BASE ?? 'http://localhost:3000/api').replace(/\/$/, '');
const employeeEmail = process.env.PBS_EMPLOYEE_EMAIL;
const employeePassword = process.env.PBS_EMPLOYEE_PASSWORD;
const reviewerEmail = process.env.PBS_REVIEW_EMAIL;
const reviewerPassword = process.env.PBS_REVIEW_PASSWORD;
const configuredObjectId = process.env.PBS_OBJECT_ID ? Number(process.env.PBS_OBJECT_ID) : null;
const configuredTemplateId = process.env.PBS_TEMPLATE_ID ? Number(process.env.PBS_TEMPLATE_ID) : null;

if (!employeeEmail || !employeePassword) {
  console.error('Missing PBS_EMPLOYEE_EMAIL or PBS_EMPLOYEE_PASSWORD.');
  console.error('Example:');
  console.error(
    '$env:PBS_EMPLOYEE_EMAIL="employee@example.test"; $env:PBS_EMPLOYEE_PASSWORD="secret"; npm run smoke:e2e-mobile-web',
  );
  process.exit(1);
}

async function request(path, options = {}) {
  const response = await fetch(`${apiBase}${path}`, options);
  const contentType = response.headers.get('content-type') ?? '';
  const body = contentType.includes('application/json') ? await response.json() : await response.text();
  if (!response.ok) {
    throw new Error(`${options.method ?? 'GET'} ${path} failed (${response.status}): ${JSON.stringify(body)}`);
  }
  return body;
}

async function login(email, password) {
  const result = await request('/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  assert.equal(typeof result.accessToken, 'string');
  assert.equal(typeof result.mitarbeiterId, 'number');
  return result;
}

function authHeaders(token) {
  return { authorization: `Bearer ${token}` };
}

function tinyPngBlob() {
  const bytes = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=',
    'base64',
  );
  return new Blob([bytes], { type: 'image/png' });
}

async function uploadEvidence(token, objectId, note) {
  const form = new FormData();
  form.append('photo', tinyPngBlob(), 'pbs-smoke.png');
  form.append('objectId', String(objectId));
  form.append('note', note);
  return request('/nachweise/upload', {
    method: 'POST',
    headers: authHeaders(token),
    body: form,
  });
}

function answerForField(field, evidenceId) {
  if (field.type === 'foto') return evidenceId;
  if (field.type === 'boolean') return true;
  if (field.type === 'number') return 1;
  if (field.type === 'select') return field.options?.[0] ?? 'OK';
  return 'PBS smoke check';
}

async function main() {
  const employee = await login(employeeEmail, employeePassword);
  const employeeToken = employee.accessToken;

  const objects = await request('/objekte/all', { headers: authHeaders(employeeToken) });
  assert.ok(Array.isArray(objects) && objects.length > 0, 'employee needs at least one accessible object');
  const object = configuredObjectId
    ? objects.find((item) => Number(item.id) === configuredObjectId)
    : objects[0];
  assert.ok(object, `object ${configuredObjectId} is not accessible to the employee`);
  const objectId = Number(object.id);

  const started = await request(`/mitarbeiter/${employee.mitarbeiterId}/stempel/start`, {
    method: 'POST',
    headers: { ...authHeaders(employeeToken), 'content-type': 'application/json' },
    body: JSON.stringify({ objektId: objectId, notiz: 'PBS smoke start' }),
  });
  assert.equal(Number(started.objekt_id), objectId);

  const stopped = await request(`/mitarbeiter/${employee.mitarbeiterId}/stempel/stop`, {
    method: 'POST',
    headers: { ...authHeaders(employeeToken), 'content-type': 'application/json' },
    body: JSON.stringify({}),
  });
  assert.ok(stopped.stop, 'time entry should be stopped');

  const evidence = await uploadEvidence(employeeToken, objectId, 'PBS smoke evidence');
  assert.equal(Number(evidence.objekt_id), objectId);

  const templates = await request(`/checklisten/templates/for-object/${objectId}`, {
    headers: authHeaders(employeeToken),
  });
  assert.ok(Array.isArray(templates) && templates.length > 0, 'object needs at least one checklist template');
  const template = configuredTemplateId
    ? templates.find((item) => Number(item.id) === configuredTemplateId)
    : templates[0];
  assert.ok(template, `template ${configuredTemplateId} is not assigned to object ${objectId}`);

  const answers = (template.fields ?? []).map((field) => ({
    fieldId: field.fieldId,
    value: answerForField(field, Number(evidence.id)),
  }));
  const submission = await request('/checklisten/submissions', {
    method: 'POST',
    headers: { ...authHeaders(employeeToken), 'content-type': 'application/json' },
    body: JSON.stringify({
      templateId: Number(template.id),
      objectId,
      note: 'PBS smoke checklist',
      answers,
    }),
  });
  assert.equal(typeof submission.id, 'number');

  let feedbackToken = employeeToken;
  if (reviewerEmail && reviewerPassword) {
    feedbackToken = (await login(reviewerEmail, reviewerPassword)).accessToken;
  }

  const feedback = await request(`/mobile-feedback?objectId=${objectId}&page=1&pageSize=25`, {
    headers: authHeaders(feedbackToken),
  });
  const items = feedback.data ?? [];
  assert.ok(
    items.some((item) => item.kind === 'EVIDENCE' && Number(item.id) === Number(evidence.id)),
    'web feedback should include the uploaded evidence',
  );
  assert.ok(
    items.some((item) => item.kind === 'CHECKLIST' && Number(item.id) === Number(submission.id)),
    'web feedback should include the submitted checklist',
  );

  console.log(
    `Smoke passed for object ${objectId}: evidence ${evidence.id}, checklist submission ${submission.id}.`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src');

let failures = 0;
let warnings = 0;

function fail(msg) {
  failures += 1;
  console.error(`❌ ${msg}`);
}

function warn(msg) {
  warnings += 1;
  console.warn(`⚠️  ${msg}`);
}

function pass(msg) {
  console.log(`✅ ${msg}`);
}

function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else if (entry.name.endsWith('.js')) acc.push(full);
  }
  return acc;
}

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

function assertIncludes(rel, needle, label) {
  const content = read(rel);
  if (!content.includes(needle)) {
    fail(`${label}: ${rel} não contém "${needle}"`);
    return false;
  }
  pass(label);
  return true;
}

function assertNotIncludes(rel, needle, label) {
  const content = read(rel);
  if (content.includes(needle)) {
    fail(`${label}: ${rel} ainda contém "${needle}"`);
    return false;
  }
  pass(label);
  return true;
}

assertIncludes('src/app.js', 'helmet(', 'Helmet activo');
assertIncludes('src/app.js', 'responseSanitizeMiddleware', 'Sanitização de respostas JSON');
assertIncludes('src/utils/password-crypto.js', 'argon2id', 'Hash Argon2id');
assertIncludes('src/middlewares/csrf.middleware.js', 'X-CSRF-Token', 'CSRF double-submit');
assertIncludes('src/middlewares/error.middleware.js', 'sanitizeClientDetails', 'Erros sanitizados em produção');
assertIncludes('src/middlewares/log-sanitization.middleware.js', 'password', 'Logs sanitizam passwords');
assertNotIncludes(
  'src/db/supabase/repositories/firm-users.repository.js',
  'passwordHash: row.password_hash',
  'mapFirmUser não expõe passwordHash',
);

const legalService = read('src/modules/legal/legal-consents.service.js');
if (/jaelsonsilva345@gmail\.com|331759276|\+351916447990/.test(legalService)) {
  fail('legal-consents.service.js contém PII do operador hardcoded — use LEGAL_OPERATOR_* no ambiente');
} else {
  pass('Dados do operador legal');
}


assertIncludes('src/utils/auth-rate-limit.js', 'createRateLimitStore', 'Rate limits auth usam Redis store');

const apiFiles = walk(SRC).filter(
  (f) => f.includes(`${path.sep}routes${path.sep}`) || f.includes(`${path.sep}controllers${path.sep}`),
);

const leakPattern = /res\.(json|send)\([^)]*(password_hash|passwordHash)/i;
for (const file of apiFiles) {
  const rel = path.relative(ROOT, file);
  const content = fs.readFileSync(file, 'utf8');
  if (leakPattern.test(content) && !rel.includes('response-sanitize')) {
    warn(`Possível exposição de password em resposta: ${rel}`);
  }
}

for (const file of walk(SRC)) {
  const rel = path.relative(ROOT, file);
  const content = fs.readFileSync(file, 'utf8');
  if (/\beval\s*\(/.test(content) || /new Function\s*\(/.test(content)) {
    fail(`eval/Function detectado em ${rel}`);
  }
}
const envContent = read('src/config/env.js');
if (/ALLOW_BEARER_AUTH:\s*true/.test(envContent)) {
  fail('ALLOW_BEARER_AUTH está true por defeito — cookies HttpOnly devem ser obrigatórios');
} else {
  pass('Bearer auth não forçado por defeito');
}

console.log('\n--- Relatório auditoria estática ---');
console.log(`Falhas: ${failures}`);
console.log(`Avisos: ${warnings}`);

if (failures > 0) {
  process.exit(1);
}

console.log('\n✅ Auditoria estática APROVADA.');
process.exit(0);

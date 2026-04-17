import { readFileSync } from 'fs';

const env = readFileSync('.env.local', 'utf8');
const vars = {};
env.split('\n').forEach(l => {
  const idx = l.indexOf('=');
  if (idx > 0) vars[l.slice(0, idx).trim()] = l.slice(idx + 1).trim();
});

const url = vars['SUPABASE_URL'];
const key = vars['SUPABASE_SERVICE_ROLE_KEY'];

// جلب schema عبر REST API
const res = await fetch(`${url}/rest/v1/`, {
  headers: {
    'apikey': key,
    'Authorization': `Bearer ${key}`,
  }
});

const text = await res.text();
console.log('Status:', res.status);
// استخراج أسماء الجداول من الـ OpenAPI spec
const matches = text.match(/"([a-z_]+)":\s*\{[^}]*"description"/g);
if (matches) {
  const tables = matches.map(m => m.match(/"([a-z_]+)"/)[1]);
  console.log('Tables found:', tables.join(', '));
} else {
  // طباعة أول 2000 حرف
  console.log(text.slice(0, 2000));
}

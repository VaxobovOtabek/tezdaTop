const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const { pathToFileURL } = require('node:url');
const requireApi = createRequire(path.resolve(__dirname, '../apps/api/package.json'));
const root = path.resolve(__dirname, '..');
const config = requireApi('dotenv').parse(fs.readFileSync(path.join(root, '.env')));
for (const [key, value] of Object.entries(config)) if (process.env[key] === undefined) process.env[key] = value;
process.env.VERCEL = '1'; process.env.NODE_ENV = 'production';

(async () => {
  const { app, ensureDbInitialized } = await import(pathToFileURL(path.join(root, 'apps/api/dist/server.js')));
  const { db } = await import(pathToFileURL(path.join(root, 'apps/api/dist/db/in-memory-db.js')));
  const { createSignedSessionToken } = await import(pathToFileURL(path.join(root, 'apps/api/dist/services/session.service.js')));
  await ensureDbInitialized();
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  try {
    const admin = [...db.users.values()].find(u => u.role === 'SUPERADMIN');
    const owner = [...db.users.values()].find(u => u.role === 'OWNER');
    const checks = [['/api/v1/health/live'], ['/api/v1/stores'], ['/api/v1/products'], ['/api/v1/admin/overview', admin], ['/api/v1/merchant/context', owner], ['/api/v1/merchant/dashboard', owner]];
    for (const [endpoint, user] of checks) {
      if (endpoint.includes('/merchant') && !user) continue;
      const response = await fetch(origin + endpoint, { headers: user ? { Authorization: `Bearer ${createSignedSessionToken(user.id)}` } : {} });
      const body = await response.json();
      if (response.status !== 200) throw new Error(`${endpoint}: ${response.status} ${body.code || ''}`);
      if (/"(?:passwordHash|password_hash|plainPassword)":/.test(JSON.stringify(body))) throw new Error('Secret field exposed');
      console.log(JSON.stringify({ endpoint, status: response.status }));
    }
    if (admin.email === 'adminka' && process.argv.includes('--login')) {
      const credentials = JSON.parse(fs.readFileSync(path.join(root, '.local/credentials/administrator.json')));
      const login = await fetch(origin + '/api/v1/auth/login', { method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(credentials) });
      const result = await login.json(); if (login.status !== 200) throw new Error('Administrator login failed');
      const authorization = { Authorization:`Bearer ${result.token}` };
      const logout = await fetch(origin + '/api/v1/auth/logout', {method:'POST',headers:authorization});
      const replay = await fetch(origin + '/api/v1/auth/me', {headers:authorization});
      if(logout.status !== 200 || replay.status !== 401) throw new Error('Persistent logout failed');
      console.log(JSON.stringify({adminLogin:true,logout:true,revokedTokenRejected:true}));
    }
  } finally { await new Promise(resolve => server.close(resolve)); }
})().catch(error => { console.error(error.message); process.exitCode = 1; });

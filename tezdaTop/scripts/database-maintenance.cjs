// Operational helper: never logs credentials or database row contents.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { createRequire } = require('node:module');
const apiRequire = createRequire(path.resolve(__dirname, '../apps/api/package.json'));
const root = path.resolve(__dirname, '..');
const cfg = apiRequire('dotenv').parse(fs.readFileSync(path.join(root, '.env')));
const ref = new URL(cfg.SUPABASE_URL).hostname.split('.')[0];
const directory = path.join(root, '.local', 'database-backups');

async function query(sql, readOnly = true) {
  if (!readOnly && process.argv.includes('--direct')) {
    const { Client } = apiRequire('pg');
    let connection = { host: `db.${ref}.supabase.co`, port: 5432, user: 'postgres', database: 'postgres' };
    if (process.argv.includes('--pooler')) {
      const response = await fetch(`https://api.supabase.com/v1/projects/${ref}/config/database/pooler`, { headers: { Authorization: `Bearer ${cfg.SUPABASE_ACCESS_TOKEN}` }, signal: AbortSignal.timeout(15000) });
      if (!response.ok) throw new Error(`Pooler configuration unavailable (${response.status})`);
      const configs = await response.json(); const selected = configs.find(c => c.database_type === 'PRIMARY') || configs[0];
      if (!selected?.db_host) throw new Error('No pooler host configured');
      connection = { host: selected.db_host, port: selected.db_port, user: selected.db_user, database: selected.db_name };
    }
    const certificateResponse = await fetch('https://supabase-downloads.s3-ap-southeast-1.amazonaws.com/prod/ssl/prod-ca-2021.crt', { signal: AbortSignal.timeout(15000) });
    if (!certificateResponse.ok) throw new Error('Official Supabase CA certificate unavailable');
    const ca = await certificateResponse.text();
    const certificate = new crypto.X509Certificate(ca);
    if (!certificate.ca || !certificate.subject.includes('Supabase')) throw new Error('Unexpected Supabase CA certificate');
    const client = new Client({ ...connection, password: cfg.DATABASE_SUPPABASE_PASSWORD, ssl: { rejectUnauthorized: true, ca }, connectionTimeoutMillis: 15000 });
    try { await client.connect(); const result = await client.query(sql); return Array.isArray(result) ? { commands: result.length, affected: result.filter(r => r.rowCount > 0).map(r => ({ command: r.command, rows: r.rows, rowCount: r.rowCount })), completed: result.at(-1).command } : result.rows; }
    finally { await client.end(); }
  }
  const response = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query${readOnly ? '/read-only' : ''}`, {
    method: 'POST', headers: { Authorization: `Bearer ${cfg.SUPABASE_ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql, read_only: readOnly }), signal: AbortSignal.timeout(60_000)
  });
  const result = await response.json();
  if (!response.ok) throw new Error(`Database query failed (${response.status}): ${result.message || result.error || 'unknown'}`);
  return result;
}

async function main() {
  const [command, file] = process.argv.slice(2);
  if (command === 'backup') {
    const tables = await query("SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename");
    const safe = tables.map(row => row.tablename).filter(name => /^[a-z_][a-z_0-9]*$/.test(name));
    const sql = `SELECT jsonb_build_object(${safe.map(name => `'${name}',(SELECT coalesce(jsonb_agg(to_jsonb(t)),'[]'::jsonb) FROM public."${name}" t)`).join(',')}) AS data`;
    const data = await query(sql);
    const schema = await query("SELECT 'column' AS kind,to_jsonb(c) AS definition FROM information_schema.columns c WHERE table_schema='public' UNION ALL SELECT 'constraint',jsonb_build_object('table',conrelid::regclass::text,'name',conname,'definition',pg_get_constraintdef(oid)) FROM pg_constraint WHERE connamespace='public'::regnamespace UNION ALL SELECT 'policy',to_jsonb(p) FROM pg_policies p WHERE schemaname='public' UNION ALL SELECT 'index',to_jsonb(i) FROM pg_indexes i WHERE schemaname='public'");
    fs.mkdirSync(directory, { recursive: true });
    const key = crypto.randomBytes(32); const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    const plaintext = Buffer.from(JSON.stringify({ project: ref, at: new Date().toISOString(), data: data[0].data, schema }));
    const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const stem = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(directory, `${stem}.enc`);
    fs.writeFileSync(backupPath, Buffer.concat([iv, cipher.getAuthTag(), encrypted]), { mode: 0o600 });
    fs.writeFileSync(`${backupPath}.key`, key, { mode: 0o600 });
    // Verify decryption and JSON parsing before reporting a usable backup.
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv); decipher.setAuthTag(cipher.getAuthTag());
    const restored = JSON.parse(Buffer.concat([decipher.update(encrypted), decipher.final()]).toString());
    console.log(JSON.stringify({ backup: backupPath, verified: true, tables: Object.fromEntries(Object.entries(restored.data).map(([name, rows]) => [name, rows.length])) }));
  } else if (command === 'plan-cleanup') {
    const login = file;
    if (!/^[a-z][a-z0-9_.-]{2,63}$/i.test(login || '')) throw new Error('A valid administrator login is required');
    const last = fs.readdirSync(directory).filter(f => f.endsWith('.enc')).sort().at(-1);
    const encrypted = fs.readFileSync(path.join(directory, last));
    const decipher = crypto.createDecipheriv('aes-256-gcm', fs.readFileSync(path.join(directory, `${last}.key`)), encrypted.subarray(0,12));
    decipher.setAuthTag(encrypted.subarray(12,28));
    const { data } = JSON.parse(Buffer.concat([decipher.update(encrypted.subarray(28)),decipher.final()]).toString());
    const literal = value => `'${String(value).replaceAll("'", "''")}'`;
    const credentialFile = path.join(root, '.local', 'credentials', 'administrator.json');
    fs.mkdirSync(path.dirname(credentialFile), { recursive: true });
    const credentials = fs.existsSync(credentialFile) ? JSON.parse(fs.readFileSync(credentialFile)) : { login, password: crypto.randomBytes(30).toString('base64url') };
    if (credentials.login !== login) throw new Error('Existing credential file has a different login');
    fs.writeFileSync(credentialFile, JSON.stringify(credentials,null,2), { mode:0o600 });
    const hash = password => { const salt=crypto.randomBytes(16).toString('hex'); return `scrypt:${salt}:${crypto.scryptSync(password,salt,64).toString('hex')}`; };
    let sql = "BEGIN;\nSET LOCAL lock_timeout='5s';\nSET LOCAL statement_timeout='60s';\nSELECT set_config('yaqintop.atomic_commit','on',true);\n";
    const retire = (table, condition) => { sql += `WITH removed AS(DELETE FROM public.${table} WHERE ${condition} RETURNING id) INSERT INTO public.retired_demo_records(table_name,record_id) SELECT '${table}',id FROM removed ON CONFLICT DO NOTHING;\n`; };
    const demoStores = [ ['66666666-6666-4666-a666-666666666666','Yangi Savdo (Ariza)'], ['77777777-7777-4777-a777-777777777777','To‘xtatilgan Do‘kon'], ['44444444-4444-4444-a444-444444444444','Baraka Supermarket'] ].filter(([id,name])=>data.stores.some(s=>s.id===id && s.name===name));
    const ids = demoStores.map(([id])=>literal(id)).join(',') || "''";
    retire('reports',`target_id IN(${ids}) OR id IN('rep-sample-1','rep-sample-2','rep-sample-3')`);
    retire('reports',"target_id='22222222-2222-4222-a222-222222222222' AND user_id='cccc1111-1111-4ccc-cccc-111111111111' AND reason='WRONG_PRICE' AND details='Ilovada 8 000 so‘m, kassada esa 9 000 so‘m deyishdi.'");
    retire('corrections',`target_id IN(${ids}) OR (target_id='22222222-2222-4222-a222-222222222222' AND proposed_data->>'message'='Snickers 50 g narxini tekshirib, amaldagi narxni kiriting va javob yuboring.')`);
    retire('inquiries',"name='Navbahor Market' AND message IN('Hurmatli do‘kon egasi! Mijozlar qulayligi uchun yangi kirish eshigi fotosuratlarini yuklashingiz va yakshanba kungi ish tartibingizni tasdiqlashingizni so‘raymiz.','Assalomu alaykum. Do‘koningizda barcha turdagi plastik kartalar qabul qilinishini tekshirish yuzasidan so‘rov.')");
    retire('stock_documents',"store_id='22222222-2222-4222-a222-222222222222' AND jsonb_array_length(lines)=1 AND ((document_number='KRM-001' AND note='Haftalik tovar kirimi' AND lines->0->>'variantId'='aaaa7777-7777-4aaa-aaaa-777777777777' AND (lines->0->>'quantity')::numeric=10 AND (lines->0->>'unitPriceOrCost')::numeric=12000) OR (document_number='STV-001' AND note='Kassa sotuvi' AND lines->0->>'variantId'='aaaa6666-6666-4aaa-aaaa-666666666666' AND (lines->0->>'quantity')::numeric=1 AND (lines->0->>'unitPriceOrCost')::numeric=16000))");
    retire('expenses',"store_id='22222222-2222-4222-a222-222222222222' AND category='IJARA' AND amount=60000 AND note='Filial kunlik hisoblangan ijara xarajati'");
    retire('reviews',"user_id='cccc1111-1111-4ccc-cccc-111111111111' AND comment='Do‘konda barcha shirinliklar bor ekan, narxlari ham qulay va toza joy.'");
    for (const [id,name] of demoStores) retire('stores',`id=${literal(id)} AND name=${literal(name)}`);
    const demoUsers = [ ['cccc1111-1111-4ccc-cccc-111111111111','customer@yaqintop.uz'], ['cccc3333-3333-4ccc-cccc-333333333333','operator@navbahor.uz'], ['cccc4444-4444-4ccc-cccc-444444444444','moderator@yaqintop.uz'] ];
    for (const [id,email] of demoUsers) retire('users',`id=${literal(id)} AND email=${literal(email)} AND password_hash=${literal('DemoPass123!')}`);
    for (const u of data.users) {
      if (demoUsers.some(([id,email])=>u.id===id && u.email===email && u.password_hash==='DemoPass123!')) continue;
      if (u.role==='SUPERADMIN') {
        sql += `UPDATE public.users SET email=${literal(login)},password_hash=${literal(hash(credentials.password))},updated_at=now(),app_data=coalesce(app_data,'{}'::jsonb)||jsonb_build_object('tokenVersion',1,'credentialsProtected',true) WHERE id=${literal(u.id)} AND password_hash=${literal(u.password_hash)};\n`;
      } else if (!u.password_hash?.startsWith('scrypt:')) {
        sql += `UPDATE public.users SET password_hash=${literal(hash(u.password_hash))},updated_at=now(),app_data=coalesce(app_data,'{}'::jsonb)||jsonb_build_object('tokenVersion',1,'credentialsProtected',true) WHERE id=${literal(u.id)} AND password_hash=${literal(u.password_hash)};\n`;
      }
    }
    retire('organizations',"((name='Mahalla Savdo XK' AND inn='307654321') OR (name='Baraka Minimarket XK' AND inn='306987654') OR (name='Chorsu Ulgurji Baza MCHJ' AND inn='305112233') OR (name='To‘xtatilgan Savdo MCHJ' AND inn='304998877')) AND NOT EXISTS(SELECT 1 FROM public.stores s WHERE s.organization_id=organizations.id) AND NOT EXISTS(SELECT 1 FROM public.variants v WHERE v.organization_id=organizations.id) AND NOT EXISTS(SELECT 1 FROM public.memberships m WHERE m.organization_id=organizations.id) AND NOT EXISTS(SELECT 1 FROM public.users u WHERE u.organization_id=organizations.id) AND NOT EXISTS(SELECT 1 FROM public.stock_documents d WHERE d.organization_id=organizations.id) AND NOT EXISTS(SELECT 1 FROM public.expenses e WHERE e.organization_id=organizations.id) AND NOT EXISTS(SELECT 1 FROM public.credential_requests c WHERE c.organization_id=organizations.id)");
    retire('audit_logs',"id LIKE 'aud-seed-%'");
    sql += `DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM public.users WHERE role='SUPERADMIN' AND status='ACTIVE' AND email=${literal(login)}) THEN RAISE EXCEPTION 'Administrator preservation failed'; END IF; IF EXISTS(SELECT 1 FROM public.users WHERE password_hash IS NULL OR password_hash NOT LIKE 'scrypt:%') THEN RAISE EXCEPTION 'Unmigrated password'; END IF; END $$;\nUPDATE public.app_persistence_state SET version=version+1 WHERE id;\nCOMMIT;\n`;
    fs.writeFileSync(path.join(root,'.local','demo-cleanup.sql'),sql,{mode:0o600});
    console.log(JSON.stringify({ plannedDemoStores:demoStores.length, plannedDemoUsers:demoUsers.length, credentialFile, cleanupFile:'.local/demo-cleanup.sql', note:'Customized seed records and real accounts are preserved' }));
  } else if (command === 'query' || command === 'apply') {
    if (!file) throw new Error('SQL file required');
    if (command === 'apply' && !fs.existsSync(directory)) throw new Error('Create and verify a backup first');
    console.log(JSON.stringify(await query(fs.readFileSync(path.resolve(root, file), 'utf8'), command !== 'apply')));
  } else if (command === 'advisors') {
    for (const kind of ['security','performance']) {
      const response = await fetch(`https://api.supabase.com/v1/projects/${ref}/advisors/${kind}`, { headers: { Authorization: `Bearer ${cfg.SUPABASE_ACCESS_TOKEN}` }, signal: AbortSignal.timeout(20000) });
      const result = await response.json();
      console.log(JSON.stringify({ kind, status:response.status, findings:(result.lints || []).map(item=>({name:item.name,level:item.level,title:item.title})) }));
    }
  } else if (command === 'inventory') {
    console.log(JSON.stringify(await query("SELECT id,email,full_name,role,status,(password_hash='DemoPass123!') AS demo_password, password_hash LIKE 'scrypt:%' AS has_scrypt FROM public.users ORDER BY role,email")));
    console.log(JSON.stringify(await query("SELECT id,name,status FROM public.organizations ORDER BY name")));
  } else throw new Error('Use backup, inventory, query <sql>, or apply <sql>');
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });

import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import express from 'express';
import type { Server } from 'node:http';
import { db } from '../src/db/in-memory-db.js';
const persistence = vi.hoisted(() => ({ read: vi.fn(), write: vi.fn() }));
vi.mock('../src/db/supabase.js', () => ({ isSupabaseConfigured:()=>true, syncAllFromSupabase:persistence.read, syncAllToSupabase:persistence.write }));
import { persistenceMiddleware } from '../src/db/persistence-middleware.js';

let server: Server; let origin: string;
beforeEach(async()=>{
  vi.stubEnv('NODE_ENV','development'); persistence.read.mockReset().mockResolvedValue(true); persistence.write.mockReset().mockResolvedValue(true);
  db.restoreSnapshot(Object.fromEntries(Object.keys(db.exportSnapshot()).map(k=>[k,[]])));
  const app=express(); app.use(persistenceMiddleware);
  app.post('/change',(_req,res)=>{db.organizations.set('test',{id:'test',name:'test',type:'RETAIL',status:'ACTIVE',createdAt:new Date().toISOString()});res.cookie('session_token','should-not-leak');res.status(201).json({ok:true});});
  app.post('/reject',(_req,res)=>{db.organizations.clear();res.status(400).json({ok:false});});
  server=app.listen(0,'127.0.0.1'); await new Promise<void>(resolve=>server.once('listening',resolve)); const addr=server.address(); if(!addr||typeof addr==='string')throw new Error('No server'); origin=`http://127.0.0.1:${addr.port}`;
});
afterEach(async()=>{await new Promise<void>(resolve=>server.close(()=>resolve()));vi.unstubAllEnvs();});
it('awaits durable commit before returning success',async()=>{const r=await fetch(origin+'/change',{method:'POST'});expect(r.status).toBe(201);expect(persistence.write).toHaveBeenCalledOnce();expect(db.organizations.has('test')).toBe(true);});
it('rolls back and removes the session cookie when persistence fails',async()=>{persistence.write.mockRejectedValue(new Error('Database unavailable'));const r=await fetch(origin+'/change',{method:'POST'});expect(r.status).toBe(503);expect(r.headers.get('set-cookie')).toBeNull();expect(db.organizations.size).toBe(0);expect((await r.json()).code).toBe('PERSISTENCE_FAILED');});
it('returns conflicts without committing a stale in-memory update',async()=>{persistence.write.mockRejectedValue(Object.assign(new Error('Retry'),{status:409,code:'WRITE_CONFLICT'}));const r=await fetch(origin+'/change',{method:'POST'});expect(r.status).toBe(409);expect(db.organizations.size).toBe(0);});
it('does not persist rejected operations',async()=>{const r=await fetch(origin+'/reject',{method:'POST'});expect(r.status).toBe(400);expect(persistence.write).not.toHaveBeenCalled();});

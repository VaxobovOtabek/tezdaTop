import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiFetch, apiJson, loadApiResources } from '../../../packages/ui/src/api-client';

let values: Map<string,string>;
beforeEach(()=>{
  values=new Map();
  vi.stubGlobal('localStorage',{getItem:(key:string)=>values.get(key) ?? null});
  vi.stubGlobal('window',{location:{href:'https://yaqintop.uz/admin'}});
  vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response('{}',{status:200})));
});
afterEach(()=>vi.unstubAllGlobals());
const lastOptions=()=>vi.mocked(fetch).mock.calls.at(-1)![1]!;

describe('authenticated browser API transport',()=>{
  it('announces successful local mutations but not rejected requests or external calls', async () => {
    const dispatchEvent = vi.fn();
    vi.stubGlobal('window', { location: { href: 'https://yaqintop.uz/admin' }, dispatchEvent });
    await apiFetch('/api/v1/admin/users/test', { method: 'PATCH' });
    expect(dispatchEvent).toHaveBeenCalledTimes(1);
    expect((dispatchEvent.mock.calls[0][0] as any).detail.path).toBe('/api/v1/admin/users/test');
    vi.mocked(fetch).mockResolvedValueOnce(new Response('{}', { status: 403 }));
    await apiFetch('/api/v1/admin/users/test', { method: 'PATCH' });
    await apiFetch('https://example.test/api/test', { method: 'POST' });
    expect(dispatchEvent).toHaveBeenCalledTimes(1);
  });
  it('uses the current token after login without requiring a page reload',async()=>{
    await apiFetch('/api/v1/admin/organizations');
    expect(new Headers(lastOptions().headers).has('Authorization')).toBe(false);
    values.set('yaqintop_token','new-session');
    await apiFetch('/api/v1/admin/organizations');
    expect(new Headers(lastOptions().headers).get('Authorization')).toBe('Bearer new-session');
    expect(lastOptions().credentials).toBe('include');
  });
  it('merges authentication with JSON mutation headers',async()=>{
    values.set('yaqintop_token','session');
    await apiFetch('/api/v1/admin/stores/store',{method:'PATCH',headers:{'Content-Type':'application/json'},body:'{}'});
    const headers=new Headers(lastOptions().headers);
    expect(headers.get('Authorization')).toBe('Bearer session');
    expect(headers.get('Content-Type')).toBe('application/json');
    expect(lastOptions().method).toBe('PATCH');
  });
  it('supports legacy session storage and preserves explicit authentication',async()=>{
    values.set('yaqintop_session_token','legacy');
    await apiFetch('/api/v1/admin/users');
    expect(new Headers(lastOptions().headers).get('Authorization')).toBe('Bearer legacy');
    await apiFetch('/api/v1/admin/users',{headers:{Authorization:'Bearer explicit'}});
    expect(new Headers(lastOptions().headers).get('Authorization')).toBe('Bearer explicit');
  });
  it.each(['https://other.example/api/v1/users','//other.example/api/v1/users','/assets/image.svg'])('never leaks a session to %s',async url=>{
    values.set('yaqintop_token','private-session'); await apiFetch(url);
    expect(new Headers(lastOptions().headers).has('Authorization')).toBe(false);
    expect(lastOptions().credentials).toBeUndefined();
  });
  it('reports API authentication errors with their actual status',async()=>{
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({message:'Tizimga kiring'}),{status:401}));
    await expect(apiJson('/api/v1/admin/organizations')).rejects.toMatchObject({status:401,message:'Tizimga kiring'});
  });
  it('does not turn an HTML rewrite fallback into an empty dataset',async()=>{
    vi.mocked(fetch).mockResolvedValue(new Response('<html>SPA fallback</html>',{status:200}));
    await expect(apiJson('/api/v1/admin/organizations')).rejects.toThrow('JSON');
  });
  it('keeps successful lists when another dashboard section fails',async()=>{
    vi.mocked(fetch).mockImplementation(async input=>{
      if(String(input).endsWith('/organizations'))return new Response(JSON.stringify({organizations:[{id:'real-org'}]}));
      if(String(input).endsWith('/users'))throw new Error('network unavailable');
      return new Response(JSON.stringify({message:'Ayrim ma’lumotlar mavjud emas'}),{status:503});
    });
    const result=await loadApiResources({organizations:'/api/v1/admin/organizations',users:'/api/v1/admin/users',audit:'/api/v1/admin/audit'});
    expect(result.data.organizations.organizations).toEqual([{id:'real-org'}]);
    expect(result.errors.map(error=>error.resource)).toEqual(['users','audit']);
    expect(result.errors[1].status).toBe(503);
  });
});

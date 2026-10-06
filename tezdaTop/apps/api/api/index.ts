import app, { ensureDbInitialized } from '../src/server.js';

export default async function handler(req: any, res: any) {
  await ensureDbInitialized();
  return (app as any)(req, res);
}

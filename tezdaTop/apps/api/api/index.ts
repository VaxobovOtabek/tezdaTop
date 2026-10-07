import app, { ensureDbInitialized } from '../src/server.js';

export default async function handler(req: any, res: any) {
  try {
    await ensureDbInitialized();
    return app(req, res);
  } catch (err: any) {
    console.error('[YaqinTop API Handler Error]', err);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: err?.message || String(err)
    });
  }
}

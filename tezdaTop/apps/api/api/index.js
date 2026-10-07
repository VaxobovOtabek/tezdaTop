const server = require('../dist/server.js');
const app = server.default || server.app || server;
const ensureDbInitialized = server.ensureDbInitialized;

module.exports = async (req, res) => {
  try {
    if (ensureDbInitialized) {
      await ensureDbInitialized();
    }
    return app(req, res);
  } catch (err) {
    console.error('[YaqinTop Lambda Error]', err);
    return res.status(500).json({
      code: 'SERVER_ERROR',
      message: 'Serverda xatolik yuz berdi',
      error: err?.message || String(err)
    });
  }
};

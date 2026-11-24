import { onRequest } from 'firebase-functions/v2/https';

export const health = onRequest((req, res) => {
  res.json({
    ok: true,
    note: 'Optional Firebase Blaze Functions endpoint. On Spark free tier, run server/index.js.'
  });
});

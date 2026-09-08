import { Hono } from "hono";
import api from "./api/route.js";
import { errorResponse } from './api/http.js';

const app = new Hono();
app.onError(error => errorResponse(error));
app.use('/api/*', async (c, next) => {
  await next();
  c.header('Cache-Control', 'no-store');
  c.header('X-Content-Type-Options', 'nosniff');
});

// APIルートをマウント
app.route("/api", api);

// 404 fallback
app.all("*", (c) => c.json({ error: 'Not Found' }, 404));

export default app;

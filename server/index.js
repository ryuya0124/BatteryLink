import { Hono } from "hono";
import api from "./api/route.js";

const app = new Hono();

// APIルートをマウント
app.route("/api", api);

// 404 fallback
app.all("*", (c) => c.text("Not Found", 404));

export default app;

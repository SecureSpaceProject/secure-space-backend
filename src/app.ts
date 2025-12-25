import "reflect-metadata";
import express from "express";
import routes from "./routes";
import mockAuth from "./middlewares/mockAuth";
import db from "./data-source";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./swagger";

export async function createApp() {
  if (!db.isInitialized) {
    await db.initialize();
  }

  const app = express();
  app.use(express.json());
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.use(mockAuth);

  // routes
  app.use(routes);

  // health
  app.get("/health", (_req, res) => res.json({ ok: true }));


  app.use((err: any, _req: any, res: any, _next: any) => {
    const status = err?.status ?? 500;
    return res.status(status).json({
      ok: false,
      error: err?.message ?? "Internal error",
    });
  });

  return app;
}

if (require.main === module) {
  (async () => {
    const app = await createApp();
    const port = Number(process.env.PORT ?? 3000);
    app.listen(port, () => console.log(`API on http://localhost:${port}`));
  })().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

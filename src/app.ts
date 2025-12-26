import "reflect-metadata";
import express from "express";
import swaggerUi from "swagger-ui-express";

import routes from "./routes";
import db from "./data-source";
import { swaggerSpec } from "./swagger";

import jwtAuth from "./middlewares/jwtAuth";
import { AppError } from "./errors/AppError";
import { pickLang, t } from "./errors/errors";

export async function createApp() {
  if (!db.isInitialized) {
    await db.initialize();
  }

  const app = express();
  app.use(express.json());

  app.use(
    "/docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      swaggerOptions: {
        requestInterceptor: (req: any) => {
          try {
            const raw = (window as any)?.localStorage?.getItem("authorized");
            if (raw) {
              const auth = JSON.parse(raw);

              const langVal =
                auth?.lang?.value ??
                auth?.lang ??
                auth?.Lang?.value ??
                auth?.Lang;

              if (langVal) {
                req.headers["X-Lang"] = String(langVal);
              }
            }
          } catch (_) {}

          return req;
        },
      },
    })
  );

  app.use(jwtAuth);
  app.use(routes);

  app.use((err: any, req: any, res: any, _next: any) => {
    const lang = pickLang(
      req.headers["x-lang"] as string | undefined,
      req.headers["accept-language"] as string | undefined
    );

    if (err instanceof AppError) {
      return res.status(err.status).json({
        ok: false,
        error: t(err.code, lang),
        code: err.code,
      });
    }

    return res.status(500).json({
      ok: false,
      error: t("INTERNAL", lang),
      code: "INTERNAL",
    });
  });

  return app;
}

if (require.main === module) {
  (async () => {
    const app = await createApp();
    const port = Number(process.env.PORT ?? 3000);
    app.listen(port, () => console.log(`API on http://localhost:${port}`));
  })();
}

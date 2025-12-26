import swaggerJSDoc from "swagger-jsdoc";

function ensureLangSecurity(spec: any) {
  if (!spec?.paths) return spec;

  const methods = ["get", "post", "put", "patch", "delete", "options", "head"];

  for (const path of Object.keys(spec.paths)) {
    const item = spec.paths[path];
    if (!item) continue;

    for (const m of methods) {
      const op = item[m];
      if (!op) continue;

      // If operation has its own security, it overrides global security.
      // We ensure that lang is always included.
      const sec = Array.isArray(op.security) ? op.security : [];

      const hasLang = sec.some(
        (s: any) =>
          s &&
          typeof s === "object" &&
          Object.prototype.hasOwnProperty.call(s, "lang")
      );
      if (!hasLang) sec.push({ lang: [] });

      op.security = sec;
    }
  }

  return spec;
}

export const swaggerSpec = (() => {
  const spec = swaggerJSDoc({
    definition: {
      openapi: "3.0.0",
      info: {
        title: "SecureSpace API",
        version: "1.0.0",
        description: "API for SecureSpace (home security system)",
      },

      // keep your global security as-is
      security: [{ bearerAuth: [] }, { lang: [] }],

      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
          lang: {
            type: "apiKey",
            in: "header",
            name: "X-Lang",
            description: "Response language: uk | en",
          },
        },
      },
    },

    apis: ["./src/routes/**/*.ts"],
  });

  return ensureLangSecurity(spec);
})();

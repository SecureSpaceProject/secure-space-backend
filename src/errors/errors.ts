export type Lang = "uk" | "en";

export type ErrorCode =
  | "INTERNAL"
  | "VALIDATION_FAILED"
  | "AUTH_REQUIRED"
  | "FORBIDDEN"
  | "USER_BLOCKED"
  | "NOT_FOUND"
  | "ROOM_NOT_FOUND"
  | "SENSOR_NOT_FOUND"
  | "BACKUP_FAILED"
  | "INVALID_CREDENTIALS"
  | "USER_NOT_FOUND";

const MESSAGES: Record<Lang, Record<ErrorCode, string>> = {
  uk: {
    INTERNAL: "Внутрішня помилка сервера",
    VALIDATION_FAILED: "Помилка валідації даних",
    AUTH_REQUIRED: "Потрібна авторизація",
    FORBIDDEN: "Недостатньо прав доступу",
    USER_BLOCKED: "Користувача заблоковано",
    NOT_FOUND: "Ресурс не знайдено",
    ROOM_NOT_FOUND: "Кімнату не знайдено",
    SENSOR_NOT_FOUND: "Датчик не знайдено",
    BACKUP_FAILED: "Не вдалося створити резервну копію",
    INVALID_CREDENTIALS: "Невірні облікові дані",
    USER_NOT_FOUND: "Користувача не знайдено",
  },
  en: {
    INTERNAL: "Internal server error",
    VALIDATION_FAILED: "Validation failed",
    AUTH_REQUIRED: "Authentication required",
    FORBIDDEN: "Forbidden",
    USER_BLOCKED: "User is blocked",
    NOT_FOUND: "Resource not found",
    ROOM_NOT_FOUND: "Room not found",
    SENSOR_NOT_FOUND: "Sensor not found",
    BACKUP_FAILED: "Backup failed",
    INVALID_CREDENTIALS: "Invalid credentials",
    USER_NOT_FOUND: "User not found",
  },
};

function normalizeLang(value?: string): Lang | undefined {
  if (!value) return undefined;
  const v = String(value).trim().toLowerCase();
  if (v === "uk" || v === "ua" || v.startsWith("uk-") || v.startsWith("ua-"))
    return "uk";
  if (v === "en" || v.startsWith("en-")) return "en";
  return undefined;
}

function parseQ(token: string): number {
  const parts = token.split(";").map((p) => p.trim());
  const qPart = parts.find((p) => p.startsWith("q="));
  if (!qPart) return 1;
  const q = Number(qPart.slice(2));
  return Number.isFinite(q) ? q : 1;
}

export function pickLang(xLang?: string, acceptLanguage?: string): Lang {
  const direct = normalizeLang(xLang);
  if (direct) return direct;

  const header = (acceptLanguage ?? "").trim();
  if (!header) return "en";

  const candidates = header
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((token, idx) => {
      const langRange = token.split(";")[0]?.trim();
      const lang = normalizeLang(langRange);
      const q = parseQ(token);
      return { lang, q, idx };
    })
    .filter((x): x is { lang: Lang; q: number; idx: number } => !!x.lang);

  if (candidates.length === 0) return "en";

  candidates.sort((a, b) => b.q - a.q || a.idx - b.idx);
  return candidates[0].lang;
}

export function t(code: ErrorCode, lang: Lang): string {
  return MESSAGES[lang]?.[code] ?? MESSAGES[lang].INTERNAL;
}

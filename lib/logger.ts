/**
 * Minimal structured logger.
 *
 * - Production: emits single-line JSON so CloudWatch / log aggregators can
 *   parse and query it.
 * - Development: human-readable.
 *
 * IMPORTANT: never pass PHI (resident names, DOB, diagnoses, note text, etc.)
 * into log messages or context — logs are not a PHI-controlled store. Log IDs
 * and non-identifying metadata only.
 *
 * Error-tracking hook: register a sink (e.g. Sentry) once at startup via
 * `setErrorSink`. `logger.error` forwards to it. Until then it's a no-op, so
 * the app has zero hard dependency on an external tracker.
 */

type Level = "debug" | "info" | "warn" | "error";

type Context = Record<string, unknown>;

type ErrorSink = (error: unknown, context?: Context) => void;

let errorSink: ErrorSink | null = null;

/** Register an external error tracker (e.g. Sentry.captureException). */
export function setErrorSink(sink: ErrorSink): void {
  errorSink = sink;
}

const isProd = process.env.NODE_ENV === "production";

function emit(level: Level, message: string, context?: Context): void {
  const entry = {
    level,
    message,
    time: new Date().toISOString(),
    ...(context ?? {}),
  };

  const line = isProd ? JSON.stringify(entry) : formatDev(level, message, context);

  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

function formatDev(level: Level, message: string, context?: Context): string {
  const ctx = context && Object.keys(context).length ? ` ${JSON.stringify(context)}` : "";
  return `[${level.toUpperCase()}] ${message}${ctx}`;
}

export const logger = {
  debug: (message: string, context?: Context) => {
    if (!isProd) emit("debug", message, context);
  },
  info: (message: string, context?: Context) => emit("info", message, context),
  warn: (message: string, context?: Context) => emit("warn", message, context),
  /**
   * Log an error and forward it to the registered error sink (if any).
   * Pass the caught error as `error` and only non-PHI metadata as `context`.
   */
  error: (message: string, error?: unknown, context?: Context) => {
    emit("error", message, {
      ...context,
      error:
        error instanceof Error
          ? { name: error.name, message: error.message, stack: error.stack }
          : error,
    });
    if (errorSink) {
      try {
        errorSink(error ?? new Error(message), context);
      } catch {
        // Never let the error tracker break the request path.
      }
    }
  },
};

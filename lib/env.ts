import { z } from "zod";

/**
 * Centralized environment-variable validation.
 *
 * Required vars cause a hard failure (so the app fails fast at startup via
 * instrumentation.ts instead of throwing deep inside a request later).
 * Optional-but-important vars produce a warning so misconfiguration is
 * visible in logs without taking the app down.
 */

const requiredSchema = z.object({
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid connection URL"),
  NEXTAUTH_SECRET: z.string().min(1, "NEXTAUTH_SECRET is required"),
});

// Optional / inferable — warn if missing, don't crash.
// NEXTAUTH_URL is intentionally optional: NextAuth infers it from request
// headers on most hosts (incl. Amplify), so requiring it would break
// deployments that legitimately don't set it.
const OPTIONAL_VARS = [
  "NEXTAUTH_URL",
  "RESEND_API_KEY",
  "RESEND_FROM_EMAIL",
  "ANTHROPIC_API_KEY",
  "S3_BUCKET",
  "S3_REGION",
  "S3_ACCESS_KEY_ID",
  "S3_SECRET_ACCESS_KEY",
  "AWS_REGION",
  "AWS_S3_BUCKET",
  "SENTRY_DSN",
] as const;

export type AppEnv = z.infer<typeof requiredSchema>;

let cached: AppEnv | null = null;

/**
 * Validate required env vars. Throws with a clear, aggregated message listing
 * everything that's missing/invalid. Safe to call multiple times (memoized).
 */
export function validateEnv(): AppEnv {
  if (cached) return cached;

  const parsed = requiredSchema.safeParse(process.env);

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(
      `Invalid environment configuration. Fix the following and restart:\n${issues}`
    );
  }

  const missingOptional = OPTIONAL_VARS.filter((v) => !process.env[v]);
  if (missingOptional.length > 0) {
    // eslint-disable-next-line no-console
    console.warn(
      `[env] Optional vars not set (some features may be disabled): ${missingOptional.join(
        ", "
      )}`
    );
  }

  cached = parsed.data;
  return cached;
}

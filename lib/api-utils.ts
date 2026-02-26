import { NextRequest, NextResponse } from "next/server";

// =====================================================
// JSON Body Parsing Utilities
// =====================================================

export type JsonParseResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: NextResponse };

export async function parseJsonBody<T = unknown>(
  request: NextRequest
): Promise<JsonParseResult<T>> {
  try {
    const data = (await request.json()) as T;
    return { success: true, data };
  } catch (error) {
    if (error instanceof SyntaxError) {
      return {
        success: false,
        error: NextResponse.json(
          { error: "Invalid JSON in request body" },
          { status: 400 }
        ),
      };
    }
    if (error instanceof TypeError && error.message.includes("body")) {
      return {
        success: false,
        error: NextResponse.json(
          { error: "Request body is required" },
          { status: 400 }
        ),
      };
    }
    return {
      success: false,
      error: NextResponse.json(
        { error: "Failed to parse request body" },
        { status: 400 }
      ),
    };
  }
}

export function isPlainObject(
  value: unknown
): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function parseJsonObjectBody(
  request: NextRequest
): Promise<JsonParseResult<Record<string, unknown>>> {
  const result = await parseJsonBody(request);
  if (!result.success) return result;
  if (!isPlainObject(result.data)) {
    return {
      success: false,
      error: NextResponse.json(
        { error: "Request body must be a JSON object" },
        { status: 400 }
      ),
    };
  }
  return { success: true, data: result.data };
}

// =====================================================
// Query Parameter Validation Utilities
// =====================================================

export type QueryParamResult<T> =
  | { success: true; value: T }
  | { success: false; error: string };

/**
 * Parse and validate an integer query parameter
 * Returns undefined if the parameter is not provided
 * Returns an error if the parameter is provided but invalid
 */
export function parseIntQueryParam(
  value: string | null,
  options?: {
    min?: number;
    max?: number;
    paramName?: string;
  }
): QueryParamResult<number | undefined> {
  if (value === null || value === "") {
    return { success: true, value: undefined };
  }

  const parsed = parseInt(value, 10);
  const paramName = options?.paramName || "Parameter";

  if (isNaN(parsed)) {
    return {
      success: false,
      error: `${paramName} must be a valid integer`,
    };
  }

  if (options?.min !== undefined && parsed < options.min) {
    return {
      success: false,
      error: `${paramName} must be at least ${options.min}`,
    };
  }

  if (options?.max !== undefined && parsed > options.max) {
    return {
      success: false,
      error: `${paramName} must be at most ${options.max}`,
    };
  }

  return { success: true, value: parsed };
}

/**
 * Parse and validate a month query parameter (1-12)
 */
export function parseMonthQueryParam(
  value: string | null
): QueryParamResult<number | undefined> {
  return parseIntQueryParam(value, {
    min: 1,
    max: 12,
    paramName: "Month",
  });
}

/**
 * Parse and validate a year query parameter (reasonable range)
 */
export function parseYearQueryParam(
  value: string | null
): QueryParamResult<number | undefined> {
  return parseIntQueryParam(value, {
    min: 1900,
    max: 2100,
    paramName: "Year",
  });
}

/**
 * Parse and validate pagination query parameters
 */
export function parsePaginationParams(searchParams: URLSearchParams): {
  page: number;
  limit: number;
  skip: number;
} {
  const pageResult = parseIntQueryParam(searchParams.get("page"), {
    min: 1,
    paramName: "Page",
  });
  const limitResult = parseIntQueryParam(searchParams.get("limit"), {
    min: 1,
    max: 100,
    paramName: "Limit",
  });

  const page = pageResult.success && pageResult.value ? pageResult.value : 1;
  const limit =
    limitResult.success && limitResult.value ? limitResult.value : 20;
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

/**
 * Helper to return a 400 error response for invalid query parameters
 */
export function invalidQueryParamResponse(message: string): NextResponse {
  return NextResponse.json(
    { error: "Invalid query parameter", details: message },
    { status: 400 }
  );
}

/**
 * Validate multiple query parameters and return the first error if any
 * Returns null if all validations pass
 */
export function validateQueryParams(
  validations: QueryParamResult<unknown>[]
): NextResponse | null {
  for (const result of validations) {
    if (!result.success) {
      return invalidQueryParamResponse(result.error);
    }
  }
  return null;
}

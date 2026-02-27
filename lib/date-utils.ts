/**
 * Safe date parsing utilities for API routes
 *
 * This module provides safe date parsing that:
 * - Validates date strings before conversion
 * - Returns null for invalid dates instead of Invalid Date objects
 * - Provides specific parsers for different date contexts (DOB, future dates, etc.)
 * - Handles timezone-aware date formatting
 */

export type DateParseResult =
  | { success: true; date: Date }
  | { success: false; error: string };

/**
 * Check if a value is a valid date string or Date object
 */
export function isValidDateInput(value: unknown): value is string | Date {
  if (value instanceof Date) {
    return !isNaN(value.getTime());
  }
  if (typeof value === "string") {
    return value.trim().length > 0;
  }
  return false;
}

/**
 * Parse a date string safely, returning null for invalid inputs
 * Does not validate date ranges - just parses the date
 */
export function parseDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (trimmed === "") {
    return null;
  }

  // Try to parse the date
  const timestamp = Date.parse(trimmed);
  if (isNaN(timestamp)) {
    return null;
  }

  return new Date(timestamp);
}

/**
 * Parse a date string with validation, returning a result object
 */
export function parseDateWithValidation(value: unknown): DateParseResult {
  if (value === null || value === undefined || value === "") {
    return { success: false, error: "Date value is required" };
  }

  if (value instanceof Date) {
    if (isNaN(value.getTime())) {
      return { success: false, error: "Invalid Date object provided" };
    }
    return { success: true, date: value };
  }

  if (typeof value !== "string") {
    return { success: false, error: `Expected string or Date, got ${typeof value}` };
  }

  const trimmed = value.trim();
  if (trimmed === "") {
    return { success: false, error: "Date string is empty" };
  }

  const timestamp = Date.parse(trimmed);
  if (isNaN(timestamp)) {
    return { success: false, error: `Invalid date format: "${trimmed}"` };
  }

  return { success: true, date: new Date(timestamp) };
}

/**
 * Parse an optional date - returns null for missing/empty values,
 * throws error for invalid date formats
 */
export function parseOptionalDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const result = parseDateWithValidation(value);
  if (!result.success) {
    throw new Error(result.error);
  }

  return result.date;
}

/**
 * Parse a required date - throws error for missing or invalid values
 */
export function parseRequiredDate(value: unknown, fieldName: string = "Date"): Date {
  if (value === null || value === undefined || value === "") {
    throw new Error(`${fieldName} is required`);
  }

  const result = parseDateWithValidation(value);
  if (!result.success) {
    throw new Error(`${fieldName}: ${result.error}`);
  }

  return result.date;
}

/**
 * Parse a date of birth with validation
 * - Must be a valid date
 * - Must be in the past
 * - Must be within reasonable range (not more than 150 years ago)
 */
export function parseDateOfBirth(value: unknown): DateParseResult {
  const result = parseDateWithValidation(value);
  if (!result.success) {
    return result;
  }

  const now = new Date();
  if (result.date > now) {
    return { success: false, error: "Date of birth cannot be in the future" };
  }

  const minDate = new Date();
  minDate.setFullYear(minDate.getFullYear() - 150);
  if (result.date < minDate) {
    return { success: false, error: "Date of birth is too far in the past" };
  }

  return result;
}

/**
 * Parse an optional date of birth
 * Returns null for missing values, validated Date for valid values
 */
export function parseOptionalDateOfBirth(value: unknown): Date | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const result = parseDateOfBirth(value);
  if (!result.success) {
    throw new Error(result.error);
  }

  return result.date;
}

/**
 * Parse a required date of birth
 */
export function parseRequiredDateOfBirth(value: unknown): Date {
  if (value === null || value === undefined || value === "") {
    throw new Error("Date of birth is required");
  }

  const result = parseDateOfBirth(value);
  if (!result.success) {
    throw new Error(result.error);
  }

  return result.date;
}

/**
 * Parse an expiration date with validation
 * - Must be a valid date
 * - Must be in the future (or today)
 */
export function parseExpirationDate(value: unknown): DateParseResult {
  const result = parseDateWithValidation(value);
  if (!result.success) {
    return result;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expirationDay = new Date(result.date);
  expirationDay.setHours(0, 0, 0, 0);

  if (expirationDay < today) {
    return { success: false, error: "Expiration date cannot be in the past" };
  }

  return result;
}

/**
 * Parse an optional expiration date
 * Returns null for missing values, validated Date for valid values
 */
export function parseOptionalExpirationDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const result = parseExpirationDate(value);
  if (!result.success) {
    throw new Error(result.error);
  }

  return result.date;
}

/**
 * Parse a past date (e.g., hire date, incident date)
 * - Must be a valid date
 * - Must be in the past or today
 * - Must be within reasonable range (not more than 100 years ago)
 */
export function parsePastDate(value: unknown): DateParseResult {
  const result = parseDateWithValidation(value);
  if (!result.success) {
    return result;
  }

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  if (result.date >= tomorrow) {
    return { success: false, error: "Date cannot be in the future" };
  }

  const minDate = new Date();
  minDate.setFullYear(minDate.getFullYear() - 100);
  if (result.date < minDate) {
    return { success: false, error: "Date is too far in the past" };
  }

  return result;
}

/**
 * Parse an optional past date
 */
export function parseOptionalPastDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const result = parsePastDate(value);
  if (!result.success) {
    throw new Error(result.error);
  }

  return result.date;
}

/**
 * Parse a required past date
 */
export function parseRequiredPastDate(value: unknown, fieldName: string = "Date"): Date {
  if (value === null || value === undefined || value === "") {
    throw new Error(`${fieldName} is required`);
  }

  const result = parsePastDate(value);
  if (!result.success) {
    throw new Error(`${fieldName}: ${result.error}`);
  }

  return result.date;
}

/**
 * Parse a future date (e.g., scheduled meeting)
 * - Must be a valid date
 * - Must be in the future or today
 */
export function parseFutureDate(value: unknown): DateParseResult {
  const result = parseDateWithValidation(value);
  if (!result.success) {
    return result;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dateDay = new Date(result.date);
  dateDay.setHours(0, 0, 0, 0);

  if (dateDay < today) {
    return { success: false, error: "Date cannot be in the past" };
  }

  return result;
}

/**
 * Parse an optional future date
 */
export function parseOptionalFutureDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const result = parseFutureDate(value);
  if (!result.success) {
    throw new Error(result.error);
  }

  return result.date;
}

/**
 * Parse a required future date
 */
export function parseRequiredFutureDate(value: unknown, fieldName: string = "Date"): Date {
  if (value === null || value === undefined || value === "") {
    throw new Error(`${fieldName} is required`);
  }

  const result = parseFutureDate(value);
  if (!result.success) {
    throw new Error(`${fieldName}: ${result.error}`);
  }

  return result.date;
}

/**
 * Parse a signature date (must be past or today, within last year)
 */
export function parseSignatureDate(value: unknown): DateParseResult {
  const result = parseDateWithValidation(value);
  if (!result.success) {
    return result;
  }

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  if (result.date >= tomorrow) {
    return { success: false, error: "Signature date cannot be in the future" };
  }

  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  if (result.date < oneYearAgo) {
    return { success: false, error: "Signature date is too far in the past (max 1 year)" };
  }

  return result;
}

/**
 * Parse an optional signature date
 */
export function parseOptionalSignatureDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const result = parseSignatureDate(value);
  if (!result.success) {
    throw new Error(result.error);
  }

  return result.date;
}

/**
 * Format a date for display in emails (timezone-aware)
 * Uses UTC to avoid timezone issues
 */
export function formatDateForEmail(date: Date | string | null | undefined): string | null {
  if (!date) return null;

  const d = date instanceof Date ? date : parseDate(date);
  if (!d) return null;

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return `${months[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

/**
 * Format a date for display (local time)
 */
export function formatDateLocal(date: Date | string | null | undefined): string | null {
  if (!date) return null;

  const d = date instanceof Date ? date : parseDate(date);
  if (!d) return null;

  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

/**
 * Format a date as ISO date string (YYYY-MM-DD)
 */
export function formatISODate(date: Date | string | null | undefined): string | null {
  if (!date) return null;

  const d = date instanceof Date ? date : parseDate(date);
  if (!d) return null;

  return d.toISOString().split("T")[0];
}

/**
 * Get the start of day for a date (midnight)
 */
export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get the end of day for a date (23:59:59.999)
 */
export function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * Check if a date is today
 */
export function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

/**
 * Check if a date is in the past (before today)
 */
export function isPast(date: Date): boolean {
  const today = startOfDay(new Date());
  return date < today;
}

/**
 * Check if a date is in the future (after today)
 */
export function isFuture(date: Date): boolean {
  const tomorrow = startOfDay(new Date());
  tomorrow.setDate(tomorrow.getDate() + 1);
  return date >= tomorrow;
}

/**
 * Calculate age from date of birth
 */
export function calculateAge(dateOfBirth: Date): number {
  const today = new Date();
  let age = today.getFullYear() - dateOfBirth.getFullYear();
  const monthDiff = today.getMonth() - dateOfBirth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
    age--;
  }

  return age;
}

/**
 * Get month name from month number (1-12)
 */
export function getMonthName(month: number): string {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  return months[month - 1] || "";
}

/**
 * Create a UTC date from year, month, day to avoid timezone issues
 */
export function createUTCDate(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day));
}

/**
 * Parse a date and normalize to UTC midnight
 * Useful for date-only fields where time doesn't matter
 */
export function parseDateToUTC(value: unknown): Date | null {
  const date = parseDate(value);
  if (!date) return null;

  return new Date(Date.UTC(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  ));
}

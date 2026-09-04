import { z } from "zod";

/**
 * Common regex patterns and validation rules across the RMS platform.
 */

// Indian 10-digit mobile number with optional +91 or 0 prefix
export const INDIAN_PHONE_REGEX = /^(?:(?:\+91|0)?[6-9]\d{9})?$/;

// General international phone format for relaxed fallback
export const GENERAL_PHONE_REGEX = /^[+0-9\s-]{7,15}$/;

// Lowercase alphanumeric slug format
export const SLUG_REGEX = /^[a-z0-9-]+$/;

/**
 * Helper: Trims strings and enforces min/max length. Rejects whitespace-only inputs.
 */
export function trimmedString(min = 1, max = 255, label = "This field") {
  return z
    .string()
    .transform((val) => val?.trim() ?? "")
    .refine((val) => val.length >= min, {
      message: min === 1 ? `${label} is required` : `${label} must be at least ${min} characters`,
    })
    .refine((val) => val.length <= max, {
      message: `${label} cannot exceed ${max} characters`,
    });
}

/**
 * Helper: Optional string that trims whitespace and returns undefined if blank.
 */
export function optionalTrimmedString(max = 500, label = "This field") {
  return z
    .string()
    .optional()
    .transform((val) => (val ? val.trim() : undefined))
    .refine((val) => !val || val.length <= max, {
      message: `${label} cannot exceed ${max} characters`,
    });
}

/**
 * Standard Email Schema: trimmed, normalized to lowercase, RFC-compliant format.
 */
export const emailSchema = z
  .string()
  .transform((val) => val?.trim().toLowerCase() ?? "")
  .refine((val) => val.length > 0, "Email address is required")
  .refine((val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), "Please enter a valid email address")
  .refine((val) => val.length <= 255, "Email cannot exceed 255 characters");

/**
 * Standard Phone Schema: Trims whitespace, accepts optional blank or valid 10-digit phone.
 */
export const phoneSchema = z
  .string()
  .optional()
  .transform((val) => (val ? val.trim() : undefined))
  .refine(
    (val) => !val || INDIAN_PHONE_REGEX.test(val.replace(/[\s-]/g, "")) || GENERAL_PHONE_REGEX.test(val),
    "Please enter a valid 10-digit phone number"
  );

/**
 * Required Phone Schema
 */
export const requiredPhoneSchema = z
  .string()
  .transform((val) => val?.trim() ?? "")
  .refine((val) => val.length > 0, "Phone number is required")
  .refine(
    (val) => INDIAN_PHONE_REGEX.test(val.replace(/[\s-]/g, "")) || GENERAL_PHONE_REGEX.test(val),
    "Please enter a valid 10-digit phone number"
  );

/**
 * Standard Money / Currency Schema: Non-negative finite decimal ($\ge 0$)
 */
export const moneySchema = (label = "Amount", max = 10_000_000) =>
  z.coerce
    .number()
    .finite(`${label} must be a valid number`)
    .min(0, `${label} cannot be negative`)
    .max(max, `${label} cannot exceed ₹${max.toLocaleString("en-IN")}`);

/**
 * Positive Money Schema: Strictly positive currency ($> 0$)
 */
export const positiveMoneySchema = (label = "Amount", max = 10_000_000) =>
  z.coerce
    .number()
    .finite(`${label} must be a valid number`)
    .positive(`${label} must be greater than ₹0`)
    .max(max, `${label} cannot exceed ₹${max.toLocaleString("en-IN")}`);

/**
 * Standard Quantity Schema ($\ge 0$)
 */
export const quantitySchema = (label = "Quantity", max = 1_000_000) =>
  z.coerce
    .number()
    .finite(`${label} must be a valid number`)
    .min(0, `${label} cannot be negative`)
    .max(max, `${label} cannot exceed ${max.toLocaleString()}`);

/**
 * Positive Quantity Schema ($> 0$)
 */
export const positiveQuantitySchema = (label = "Quantity", max = 1_000_000) =>
  z.coerce
    .number()
    .finite(`${label} must be a valid number`)
    .positive(`${label} must be greater than 0`)
    .max(max, `${label} cannot exceed ${max.toLocaleString()}`);

/**
 * Standard Percentage Schema ($0 \le P \le 100$)
 */
export const percentageSchema = (label = "Percentage") =>
  z.coerce
    .number()
    .finite(`${label} must be a valid number`)
    .min(0, `${label} cannot be less than 0%`)
    .max(100, `${label} cannot exceed 100%`);

/**
 * Standard Slug Schema
 */
export const slugSchema = z
  .string()
  .transform((val) => val?.trim().toLowerCase() ?? "")
  .refine((val) => val.length >= 2, "Slug must be at least 2 characters")
  .refine((val) => val.length <= 50, "Slug cannot exceed 50 characters")
  .refine((val) => SLUG_REGEX.test(val), "Slug must contain only lowercase letters, numbers, and hyphens");

/**
 * Password Schema
 */
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password cannot exceed 128 characters");

/**
 * Client-Side Validation Helpers for React Components
 */
export function validatePhone(phone: string): { isValid: boolean; error?: string } {
  const trimmed = phone.trim();
  if (!trimmed) return { isValid: true };
  const cleaned = trimmed.replace(/[\s-]/g, "");
  if (!INDIAN_PHONE_REGEX.test(cleaned) && !GENERAL_PHONE_REGEX.test(trimmed)) {
    return { isValid: false, error: "Please enter a valid 10-digit phone number" };
  }
  return { isValid: true };
}

export function validateRequiredText(text: string, label = "This field"): { isValid: boolean; error?: string } {
  if (!text || !text.trim()) {
    return { isValid: false, error: `${label} is required` };
  }
  return { isValid: true };
}

export function validateNumberNonNegative(num: number | string, label = "Amount"): { isValid: boolean; error?: string } {
  const n = typeof num === "string" ? parseFloat(num) : num;
  if (isNaN(n) || !isFinite(n)) {
    return { isValid: false, error: `${label} must be a valid number` };
  }
  if (n < 0) {
    return { isValid: false, error: `${label} cannot be negative` };
  }
  return { isValid: true };
}

export function validateNumberPositive(num: number | string, label = "Amount"): { isValid: boolean; error?: string } {
  const n = typeof num === "string" ? parseFloat(num) : num;
  if (isNaN(n) || !isFinite(n)) {
    return { isValid: false, error: `${label} must be a valid number` };
  }
  if (n <= 0) {
    return { isValid: false, error: `${label} must be greater than 0` };
  }
  return { isValid: true };
}

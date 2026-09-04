// src/lib/currency.ts
// Standard Indian Rupee (INR / ₹) currency formatting utility for RMS.

export function formatINR(
  amount: number | string | null | undefined,
  options?: {
    showDecimals?: boolean;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  }
): string {
  const num = typeof amount === "number" ? amount : parseFloat(String(amount || 0));
  const safeNum = isNaN(num) ? 0 : num;

  const minDecimals =
    options?.minimumFractionDigits !== undefined
      ? options.minimumFractionDigits
      : options?.showDecimals
      ? 2
      : 0;

  const maxDecimals =
    options?.maximumFractionDigits !== undefined
      ? options.maximumFractionDigits
      : options?.showDecimals
      ? 2
      : 0;

  return `₹${safeNum.toLocaleString("en-IN", {
    minimumFractionDigits: minDecimals,
    maximumFractionDigits: maxDecimals,
  })}`;
}

// src/lib/bill-calculator.ts
// Pure utility for central bill total calculation.

export function calculateBillTotal(
  subtotal: number,
  taxRate: number = 0.05,
  packagingCharge: number = 0,
  serviceCharge: number = 0,
  splittingCharge: number = 0
) {
  const safeSubtotal = Math.max(0, subtotal);
  const tax = parseFloat((safeSubtotal * taxRate).toFixed(2));
  const pkg = Math.max(0, packagingCharge || 0);
  const svc = Math.max(0, serviceCharge || 0);
  const splt = Math.max(0, splittingCharge || 0);
  const grandTotal = parseFloat((safeSubtotal + tax + pkg + svc + splt).toFixed(2));

  return {
    subtotal: safeSubtotal,
    tax,
    packagingCharge: pkg,
    serviceCharge: svc,
    splittingCharge: splt,
    total: grandTotal,
  };
}

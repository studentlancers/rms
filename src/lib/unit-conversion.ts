// src/lib/unit-conversion.ts
// Utility functions for safe unit conversions across Inventory & Menu Recipe Management.

export type UnitCategory = "weight" | "volume" | "count";

interface UnitInfo {
  category: UnitCategory;
  factor: number; // Factor relative to base unit (g for weight, ml for volume, 1 for count)
  canonical: string;
}

const UNIT_MAP: Record<string, UnitInfo> = {
  // Weight
  kg: { category: "weight", factor: 1000, canonical: "kg" },
  kilo: { category: "weight", factor: 1000, canonical: "kg" },
  kilogram: { category: "weight", factor: 1000, canonical: "kg" },
  kilograms: { category: "weight", factor: 1000, canonical: "kg" },
  g: { category: "weight", factor: 1, canonical: "g" },
  gram: { category: "weight", factor: 1, canonical: "g" },
  grams: { category: "weight", factor: 1, canonical: "g" },

  // Volume
  l: { category: "volume", factor: 1000, canonical: "l" },
  liter: { category: "volume", factor: 1000, canonical: "l" },
  liters: { category: "volume", factor: 1000, canonical: "l" },
  litre: { category: "volume", factor: 1000, canonical: "l" },
  litres: { category: "volume", factor: 1000, canonical: "l" },
  ml: { category: "volume", factor: 1, canonical: "ml" },
  milliliter: { category: "volume", factor: 1, canonical: "ml" },
  milliliters: { category: "volume", factor: 1, canonical: "ml" },
  millilitre: { category: "volume", factor: 1, canonical: "ml" },
  millilitres: { category: "volume", factor: 1, canonical: "ml" },

  // Count / Discrete
  pcs: { category: "count", factor: 1, canonical: "pcs" },
  pc: { category: "count", factor: 1, canonical: "pcs" },
  piece: { category: "count", factor: 1, canonical: "pcs" },
  pieces: { category: "count", factor: 1, canonical: "pcs" },
  portion: { category: "count", factor: 1, canonical: "portions" },
  portions: { category: "count", factor: 1, canonical: "portions" },
  bottle: { category: "count", factor: 1, canonical: "bottles" },
  bottles: { category: "count", factor: 1, canonical: "bottles" },
  unit: { category: "count", factor: 1, canonical: "units" },
  units: { category: "count", factor: 1, canonical: "units" },
};

/**
 * Returns canonical unit string (e.g. "kg", "g", "l", "ml", "pcs", "portions", "bottles", "units").
 */
export function normalizeUnit(unit?: string): string {
  if (!unit) return "units";
  const cleaned = unit.trim().toLowerCase();
  return UNIT_MAP[cleaned]?.canonical || cleaned;
}

/**
 * Returns category of unit ("weight", "volume", or "count").
 */
export function getUnitCategory(unit?: string): UnitCategory {
  if (!unit) return "count";
  const cleaned = unit.trim().toLowerCase();
  return UNIT_MAP[cleaned]?.category || "count";
}

/**
 * Checks if two unit strings are compatible for conversion.
 */
export function areUnitsCompatible(unitA?: string, unitB?: string): boolean {
  const uA = (unitA || "units").trim().toLowerCase();
  const uB = (unitB || "units").trim().toLowerCase();

  if (uA === uB) return true;

  const infoA = UNIT_MAP[uA];
  const infoB = UNIT_MAP[uB];

  if (infoA && infoB) {
    return infoA.category === infoB.category;
  }

  return normalizeUnit(uA) === normalizeUnit(uB);
}

/**
 * Converts a numeric quantity from one unit to another.
 * Throws an Error if units are incompatible.
 *
 * Example:
 * convertQuantity(250, "g", "kg") => 0.25
 * convertQuantity(5, "kg", "g")   => 5000
 */
export function convertQuantity(
  quantity: number,
  fromUnit?: string,
  toUnit?: string
): number {
  const fromClean = (fromUnit || "units").trim().toLowerCase();
  const toClean = (toUnit || "units").trim().toLowerCase();

  if (fromClean === toClean) {
    return quantity;
  }

  const fromInfo = UNIT_MAP[fromClean];
  const toInfo = UNIT_MAP[toClean];

  if (fromInfo && toInfo && fromInfo.category === toInfo.category) {
    const baseQuantity = quantity * fromInfo.factor;
    return baseQuantity / toInfo.factor;
  }

  if (normalizeUnit(fromClean) === normalizeUnit(toClean)) {
    return quantity;
  }

  throw new Error(
    `Incompatible unit conversion: Cannot convert ${quantity} ${fromUnit || "unit"} to ${toUnit || "unit"}`
  );
}

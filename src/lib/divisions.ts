export const DIVISION_UNITS = [
  { value: "MINKU_SDM", label: "Minku (Adm. Keuangan) - SDM" },
  { value: "MINKU_TU", label: "Minku (Adm. Keuangan) - TU" },
  { value: "MINKU_AKUNTANSI", label: "Minku (Adm. Keuangan) - Akuntansi" },
  { value: "BISNIS", label: "Bisnis" },
  { value: "PENGADAAN", label: "Pengadaan" },
  { value: "OPP", label: "OPP" },
] as const;

export type DivisionUnit = (typeof DIVISION_UNITS)[number]["value"];

export const DIVISION_UNIT_VALUES = DIVISION_UNITS.map((unit) => unit.value);

export function isDivisionLetterCategory(category: string) {
  return category === "NOTA_VERIFIKASI" || category === "NOTA_DIVISI";
}

export function isValidDivisionUnit(value: string | null | undefined): value is DivisionUnit {
  return !!value && DIVISION_UNIT_VALUES.includes(value as DivisionUnit);
}

export function getDivisionUnitLabel(value: string | null | undefined) {
  return DIVISION_UNITS.find((unit) => unit.value === value)?.label || "-";
}

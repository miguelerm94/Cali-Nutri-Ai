/**
 * Conversión de unidades (A-03) — fuente única compartida backend↔mobile.
 * El backend SIEMPRE almacena en métrico (heightCm, weightKg); unit_preference
 * solo controla entrada/visualización en el cliente.
 */
export const UnitConversion = {
  lbsToKg(lbs: number): number {
    return Math.round(lbs * 0.45359237 * 100) / 100;
  },
  kgToLbs(kg: number): number {
    return Math.round((kg / 0.45359237) * 100) / 100;
  },
  inchesToCm(inches: number): number {
    return Math.round(inches * 2.54);
  },
  cmToInches(cm: number): number {
    return Math.round((cm / 2.54) * 10) / 10;
  },
  /** Pies+pulgadas → cm, para inputs de altura en imperial (ft/in). */
  feetInchesToCm(feet: number, inches: number): number {
    return this.inchesToCm(feet * 12 + inches);
  },
};

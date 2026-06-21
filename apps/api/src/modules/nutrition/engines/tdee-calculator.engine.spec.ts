import { TdeeCalculatorEngine } from './tdee-calculator.engine';
import { Sex } from '@prisma/client';

describe('TdeeCalculatorEngine (FD-05)', () => {
  const engine = new TdeeCalculatorEngine();

  it('calcula TMB con Mifflin-St Jeor para hombre', () => {
    expect(engine.calculateTmb(Sex.male, 78, 178, 28)).toBeCloseTo(10 * 78 + 6.25 * 178 - 5 * 28 + 5);
  });

  it('calcula TMB con Mifflin-St Jeor para mujer', () => {
    expect(engine.calculateTmb(Sex.female, 65, 165, 30)).toBeCloseTo(10 * 65 + 6.25 * 165 - 5 * 30 - 161);
  });

  it('mapea frecuencia de entrenamiento al factor de actividad canónico (FD-05)', () => {
    expect(engine.activityFactor(0)).toBe(1.2);
    expect(engine.activityFactor(2)).toBe(1.375);
    expect(engine.activityFactor(4)).toBe(1.55);
    expect(engine.activityFactor(6)).toBe(1.725);
    expect(engine.activityFactor(7)).toBe(1.9);
  });

  it('calcula TDEE = TMB × factor de actividad', () => {
    const tdee = engine.calculateTdee(Sex.male, 78, 178, 28, 4);
    const expectedTmb = 10 * 78 + 6.25 * 178 - 5 * 28 + 5;
    expect(tdee).toBe(Math.round(expectedTmb * 1.55));
  });
});

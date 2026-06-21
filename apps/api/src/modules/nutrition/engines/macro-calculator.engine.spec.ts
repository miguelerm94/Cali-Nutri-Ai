import { MacroCalculatorEngine } from './macro-calculator.engine';
import { GoalType } from '@prisma/client';

describe('MacroCalculatorEngine (FD-06)', () => {
  const engine = new MacroCalculatorEngine();

  it('aplica superávit de +300 kcal para ganancia muscular', () => {
    const result = engine.calculate(2650, 78, GoalType.muscle_gain);
    expect(result.targetCalories).toBe(2950);
  });

  it('aplica déficit de -400 kcal para pérdida de grasa', () => {
    const result = engine.calculate(2650, 78, GoalType.fat_loss);
    expect(result.targetCalories).toBe(2250);
  });

  it('aplica déficit de -150 kcal para recomposición', () => {
    const result = engine.calculate(2650, 78, GoalType.recomposition);
    expect(result.targetCalories).toBe(2500);
  });

  it('no ajusta calorías para mantenimiento', () => {
    const result = engine.calculate(2650, 78, GoalType.maintenance);
    expect(result.targetCalories).toBe(2650);
  });

  it('calcula proteína a 2.0 g/kg y grasas a 0.9 g/kg (defaults FD-06)', () => {
    const result = engine.calculate(2650, 80, GoalType.maintenance);
    expect(result.targetProteinG).toBe(160);
    expect(result.targetFatG).toBe(72);
  });

  it('asigna carbohidratos como calorías residuales tras proteína y grasas', () => {
    const result = engine.calculate(2650, 80, GoalType.maintenance);
    const proteinKcal = result.targetProteinG * 4;
    const fatKcal = result.targetFatG * 9;
    expect(result.targetCarbsG).toBeCloseTo((result.targetCalories - proteinKcal - fatKcal) / 4, 1);
  });

  it('aplica piso de seguridad de 1200 kcal aunque el déficit sea mayor', () => {
    const result = engine.calculate(1300, 60, GoalType.fat_loss); // 1300 - 400 = 900 < 1200
    expect(result.targetCalories).toBe(1200);
  });
});

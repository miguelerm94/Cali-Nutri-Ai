import { HydrationTargetEngine } from './hydration-target.engine';

describe('HydrationTargetEngine (FD-07)', () => {
  const engine = new HydrationTargetEngine();

  it('calcula el objetivo base como peso_kg × 40 sin actividad', () => {
    const result = engine.calculate(78, false, false);
    expect(result.baseMl).toBe(3120);
    expect(result.activityAdjustmentMl).toBe(0);
    expect(result.targetMl).toBe(3120);
  });

  it('agrega +500 ml si hubo sesión de entrenamiento de intensidad normal', () => {
    const result = engine.calculate(78, true, false);
    expect(result.activityAdjustmentMl).toBe(500);
    expect(result.targetMl).toBe(3620);
  });

  it('agrega +750 ml si la sesión fue de alta intensidad', () => {
    const result = engine.calculate(78, true, true);
    expect(result.activityAdjustmentMl).toBe(750);
    expect(result.targetMl).toBe(3870);
  });

  it('agrega +250 ml si los pasos del día superan 10000', () => {
    const result = engine.calculate(78, false, false, 12000);
    expect(result.stepsAdjustmentMl).toBe(250);
    expect(result.targetMl).toBe(3370);
  });

  it('no agrega ajuste de pasos si son 10000 o menos', () => {
    const result = engine.calculate(78, false, false, 10000);
    expect(result.stepsAdjustmentMl).toBe(0);
  });
});

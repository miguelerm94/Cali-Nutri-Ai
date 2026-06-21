import { AssessmentScoringEngine } from './assessment-scoring.engine';

describe('AssessmentScoringEngine (FD-01)', () => {
  const engine = new AssessmentScoringEngine();

  it('asigna 0 puntos con 0 dominadas y score creciente dentro de cada tramo', () => {
    expect(engine.scorePullups(0)).toBe(0);
    expect(engine.scorePullups(8)).toBeGreaterThanOrEqual(55);
    expect(engine.scorePullups(8)).toBeLessThanOrEqual(70);
    expect(engine.scorePullups(25)).toBe(100); // saturado
  });

  it('clasifica el nivel de presentación según los umbrales canónicos (0-54/55-74/75-100)', () => {
    expect(engine.toPresentationLevel(40)).toBe('beginner');
    expect(engine.toPresentationLevel(60)).toBe('intermediate');
    expect(engine.toPresentationLevel(80)).toBe('advanced');
  });

  it('computeAll pondera global_score como 40/30/15/15 (dominadas/flexiones/sentadillas/core)', () => {
    const result = engine.computeAll({ pullupsMax: 8, pushupsMax: 31, squatsMax: 41, plankSeconds: 61 });
    const expected =
      result.pullupsScore * 0.4 + result.pushupsScore * 0.3 + result.squatsScore * 0.15 + result.coreScore * 0.15;
    expect(result.globalScore).toBeCloseTo(Math.round(expected * 100) / 100, 1);
  });

  it('un usuario con todo en 0 obtiene global_score 0 y nivel beginner', () => {
    const result = engine.computeAll({ pullupsMax: 0, pushupsMax: 0, squatsMax: 0, plankSeconds: 0 });
    expect(result.globalScore).toBe(0);
    expect(result.presentationLevel).toBe('beginner');
  });
});

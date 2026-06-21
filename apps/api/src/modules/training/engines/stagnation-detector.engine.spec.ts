import { StagnationDetectorEngine } from './stagnation-detector.engine';

describe('StagnationDetectorEngine (FD-02)', () => {
  const engine = new StagnationDetectorEngine();

  // Lunes de 3 semanas consecutivas (ISO), 2 sesiones por semana cada una.
  const monday = (offsetWeeks: number, dayOffset: number) => {
    const base = new Date('2026-06-01T10:00:00Z'); // lunes
    base.setUTCDate(base.getUTCDate() + offsetWeeks * 7 + dayOffset);
    return base;
  };

  it('no marca alerta cuando el volumen crece semana a semana', () => {
    const sessions = [
      { startedAt: monday(0, 0), totalRepsCompleted: 80, totalRepsTarget: 80 },
      { startedAt: monday(0, 2), totalRepsCompleted: 82, totalRepsTarget: 80 },
      { startedAt: monday(1, 0), totalRepsCompleted: 90, totalRepsTarget: 84 },
      { startedAt: monday(1, 2), totalRepsCompleted: 92, totalRepsTarget: 84 },
      { startedAt: monday(2, 0), totalRepsCompleted: 100, totalRepsTarget: 88 },
      { startedAt: monday(2, 2), totalRepsCompleted: 104, totalRepsTarget: 88 },
    ];
    expect(engine.detect(sessions).alert).toBe(false);
  });

  it('marca no_improvement_3_weeks cuando el volumen no aumenta en 3 semanas consecutivas activas', () => {
    const sessions = [
      { startedAt: monday(0, 0), totalRepsCompleted: 100, totalRepsTarget: 80 },
      { startedAt: monday(0, 2), totalRepsCompleted: 100, totalRepsTarget: 80 },
      { startedAt: monday(1, 0), totalRepsCompleted: 100, totalRepsTarget: 80 },
      { startedAt: monday(1, 2), totalRepsCompleted: 95, totalRepsTarget: 80 },
      { startedAt: monday(2, 0), totalRepsCompleted: 90, totalRepsTarget: 80 },
      { startedAt: monday(2, 2), totalRepsCompleted: 90, totalRepsTarget: 80 },
    ];
    const result = engine.detect(sessions);
    expect(result.alert).toBe(true);
    expect(result.reason).toBe('no_improvement_3_weeks');
  });

  it('marca performance_drop_2_weeks cuando reps < objetivo durante 2 semanas consecutivas', () => {
    const sessions = [
      { startedAt: monday(0, 0), totalRepsCompleted: 60, totalRepsTarget: 80 },
      { startedAt: monday(0, 2), totalRepsCompleted: 65, totalRepsTarget: 80 },
      { startedAt: monday(1, 0), totalRepsCompleted: 62, totalRepsTarget: 80 },
      { startedAt: monday(1, 2), totalRepsCompleted: 68, totalRepsTarget: 80 },
    ];
    const result = engine.detect(sessions);
    expect(result.alert).toBe(true);
    expect(result.reason).toBe('performance_drop_2_weeks');
  });

  it('no marca alerta si una semana tuvo menos de 2 sesiones (no se considera activa)', () => {
    const sessions = [
      { startedAt: monday(0, 0), totalRepsCompleted: 100, totalRepsTarget: 80 },
      { startedAt: monday(1, 0), totalRepsCompleted: 100, totalRepsTarget: 80 },
      { startedAt: monday(2, 0), totalRepsCompleted: 100, totalRepsTarget: 80 },
    ];
    expect(engine.detect(sessions).alert).toBe(false);
  });
});

import { ProgressionEngine } from './progression.engine';

describe('ProgressionEngine (FD-04)', () => {
  const engine = new ProgressionEngine();
  const prescription = { workoutExerciseId: 'we_1', exerciseId: 'ex_1', sets: 3, repsTarget: 8 };

  it('dispara progresión cuando las 2 ejecuciones más recientes completaron el 100% de las series', () => {
    const current = [
      { exerciseId: 'ex_1', setNumber: 1, repsCompleted: 8 },
      { exerciseId: 'ex_1', setNumber: 2, repsCompleted: 9 },
      { exerciseId: 'ex_1', setNumber: 3, repsCompleted: 8 },
    ];
    const previous = [
      { exerciseId: 'ex_1', setNumber: 1, repsCompleted: 8 },
      { exerciseId: 'ex_1', setNumber: 2, repsCompleted: 8 },
      { exerciseId: 'ex_1', setNumber: 3, repsCompleted: 8 },
    ];
    const result = engine.evaluate([prescription], current, previous);
    expect(result[0].triggered).toBe(true);
  });

  it('no dispara si la sesión anterior no existe (primera ejecución)', () => {
    const current = [
      { exerciseId: 'ex_1', setNumber: 1, repsCompleted: 8 },
      { exerciseId: 'ex_1', setNumber: 2, repsCompleted: 8 },
      { exerciseId: 'ex_1', setNumber: 3, repsCompleted: 8 },
    ];
    const result = engine.evaluate([prescription], current, null);
    expect(result[0].triggered).toBe(false);
  });

  it('no dispara si alguna serie de la sesión actual quedó bajo el objetivo', () => {
    const current = [
      { exerciseId: 'ex_1', setNumber: 1, repsCompleted: 8 },
      { exerciseId: 'ex_1', setNumber: 2, repsCompleted: 6 },
      { exerciseId: 'ex_1', setNumber: 3, repsCompleted: 8 },
    ];
    const previous = [
      { exerciseId: 'ex_1', setNumber: 1, repsCompleted: 8 },
      { exerciseId: 'ex_1', setNumber: 2, repsCompleted: 8 },
      { exerciseId: 'ex_1', setNumber: 3, repsCompleted: 8 },
    ];
    const result = engine.evaluate([prescription], current, previous);
    expect(result[0].triggered).toBe(false);
  });

  it('no dispara si faltan series registradas respecto a las programadas', () => {
    const current = [
      { exerciseId: 'ex_1', setNumber: 1, repsCompleted: 8 },
      { exerciseId: 'ex_1', setNumber: 2, repsCompleted: 8 },
    ];
    const previous = [
      { exerciseId: 'ex_1', setNumber: 1, repsCompleted: 8 },
      { exerciseId: 'ex_1', setNumber: 2, repsCompleted: 8 },
      { exerciseId: 'ex_1', setNumber: 3, repsCompleted: 8 },
    ];
    const result = engine.evaluate([prescription], current, previous);
    expect(result[0].triggered).toBe(false);
  });
});

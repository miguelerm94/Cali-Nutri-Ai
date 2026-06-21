import { RoutineGeneratorEngine } from './routine-generator.engine';
import { ExerciseCategory, GoalType, PresentationLevel } from '@prisma/client';

function mockExercise(name: string, category: ExerciseCategory, id = name) {
  return {
    id,
    name,
    nameEs: name,
    category,
    primaryMuscle: 'core',
    secondaryMuscles: [],
    difficulty: 3,
    description: null,
    instructions: null,
    parentExerciseId: null,
    imageUrl: null,
    videoUrl: null,
    isActive: true,
    createdAt: new Date(),
  } as any;
}

const catalog = [
  mockExercise('Flexiones inclinadas', ExerciseCategory.push),
  mockExercise('Flexiones normales', ExerciseCategory.push),
  mockExercise('Pike Push Ups', ExerciseCategory.push),
  mockExercise('Dominadas negativas', ExerciseCategory.pull),
  mockExercise('Chin Ups supinados', ExerciseCategory.pull),
  mockExercise('Remo en mesa (bodyweight row)', ExerciseCategory.pull),
  mockExercise('Sentadilla', ExerciseCategory.squat),
  mockExercise('Zancada', ExerciseCategory.squat),
  mockExercise('Hip Thrust', ExerciseCategory.hinge),
  mockExercise('Puente de glúteos', ExerciseCategory.hinge),
  mockExercise('Extensión de espalda en suelo', ExerciseCategory.hinge),
  mockExercise('Plancha', ExerciseCategory.core),
  mockExercise('Plancha lateral', ExerciseCategory.core),
];

describe('RoutineGeneratorEngine (FD-03 + FD-04)', () => {
  const engine = new RoutineGeneratorEngine();

  const baseInput = {
    goalType: GoalType.muscle_gain,
    presentationLevel: PresentationLevel.beginner,
    globalScore: 30,
    assessment: { pullupsMax: 2, pushupsMax: 8, squatsMax: 15, plankSeconds: 20 },
    exercises: catalog,
  };

  it('3 días/semana → estructura full_body con 3 días (A/B/A)', () => {
    const routine = engine.generate({ ...baseInput, trainingFrequency: 3 });
    expect(routine.structure).toBe('full_body');
    expect(routine.days).toHaveLength(3);
    expect(routine.days[0].dayType).toBe('full_body_a');
    expect(routine.days[1].dayType).toBe('full_body_b');
  });

  it('5 días/semana → push_pull_legs con 2 días complementarios (FD-03)', () => {
    const routine = engine.generate({ ...baseInput, trainingFrequency: 5 });
    expect(routine.structure).toBe('push_pull_legs');
    expect(routine.days.map((d) => d.dayType)).toEqual(['push', 'pull', 'legs', 'complementary', 'complementary']);
  });

  it('6 días/semana → ppl_double con Push/Pull/Legs ×2', () => {
    const routine = engine.generate({ ...baseInput, trainingFrequency: 6 });
    expect(routine.structure).toBe('ppl_double');
    expect(routine.days).toHaveLength(6);
  });

  it('cada día generado tiene al menos 1 ejercicio asignado', () => {
    const routine = engine.generate({ ...baseInput, trainingFrequency: 4 });
    for (const day of routine.days) {
      expect(day.exercises.length).toBeGreaterThan(0);
    }
  });

  it('FD-04: reps_target = floor(max*0.70) para el ejercicio primario evaluado', () => {
    const routine = engine.generate({ ...baseInput, trainingFrequency: 3 });
    const pushExercise = routine.days[0].exercises.find((e) => e.exerciseId === 'Flexiones inclinadas');
    expect(pushExercise?.repsTarget).toBe(Math.floor(8 * 0.7));
  });
});

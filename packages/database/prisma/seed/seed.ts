/**
 * Seed inicial de catálogos públicos (exercises, foods).
 *
 * NOTA DE ALCANCE (S1 — Fundación):
 *   El catálogo de 50+ ejercicios de calistenia se puebla en S3 (Training)
 *   y la base curada de 500 alimentos en S4 (Nutrición), según FD-INFRA-01.
 *   Este runner queda listo para recibir esos datasets sin cambios de estructura.
 */
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function seedExercises() {
  const filePath = path.join(__dirname, 'data', 'exercises.json');
  if (!fs.existsSync(filePath)) {
    console.log('⏭  exercises.json no existe aún (se añade en S3) — omitiendo.');
    return;
  }
  const exercises = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  // Primera pasada: crear/actualizar SIN parentExerciseId (evita violar el self-FK
  // si el padre todavía no existe en esta corrida).
  for (const ex of exercises) {
    const data = {
      name: ex.name,
      nameEs: ex.name_es,
      category: ex.category,
      primaryMuscle: ex.primary_muscle,
      secondaryMuscles: ex.secondary_muscles ?? [],
      difficulty: ex.difficulty,
      description: ex.description,
      instructions: ex.instructions,
      isActive: ex.is_active ?? true,
    };
    await prisma.exercise.upsert({ where: { id: ex.id }, update: data, create: { id: ex.id, ...data } });
  }

  // Segunda pasada: fijar parentExerciseId (la cadena de progresión completa).
  for (const ex of exercises) {
    if (ex.parent_exercise_id) {
      await prisma.exercise.update({
        where: { id: ex.id },
        data: { parentExerciseId: ex.parent_exercise_id },
      });
    }
  }

  console.log(`✓ ${exercises.length} ejercicios sembrados (con cadenas de progresión).`);
}

async function seedFoodsBase() {
  const filePath = path.join(__dirname, 'data', 'foods-base.json');
  if (!fs.existsSync(filePath)) {
    console.log('⏭  foods-base.json no existe aún (se añade en S4) — omitiendo.');
    return;
  }
  const foods = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  for (const food of foods) {
    await prisma.food.upsert({
      where: { id: food.id },
      update: food,
      create: food,
    });
  }
  console.log(`✓ ${foods.length} alimentos base sembrados.`);
}

async function main() {
  console.log('🌱 Iniciando seed de CALI-NUTRI AI...\n');
  await seedExercises();
  await seedFoodsBase();
  console.log('\n✅ Seed completado.');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

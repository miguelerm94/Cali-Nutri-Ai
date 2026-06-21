import { Injectable } from '@nestjs/common';
import { FoodsRepository } from '../repositories/foods.repository';
import { UsdaApiAdapter } from '../adapters/usda-api.adapter';

/**
 * GET /nutrition/foods/search — USDA API + base local fallback
 * (BackendArchitecture.md §"searchFood"). Estrategia: buscar primero en la base
 * local (rápida, ya normalizada); si no hay suficientes resultados, completar con
 * USDA y persistir los nuevos alimentos vía upsert (cache permanente, no Redis TTL,
 * porque los datos nutricionales de un alimento no cambian con el tiempo).
 */
@Injectable()
export class SearchFoodUseCase {
  constructor(
    private readonly foodsRepository: FoodsRepository,
    private readonly usdaApiAdapter: UsdaApiAdapter,
  ) {}

  async execute(query: string, limit: number) {
    const localResults = await this.foodsRepository.search(query, limit);
    if (localResults.length >= limit) {
      return this.map(localResults);
    }

    const usdaResults = await this.usdaApiAdapter.search(query, limit - localResults.length);
    const persisted = await Promise.all(
      usdaResults.map((food) =>
        this.foodsRepository.upsertFromUsda(food.externalId, {
          name: food.name,
          servingSizeG: food.servingSizeG,
          calories: food.calories,
          proteinG: food.proteinG,
          carbsG: food.carbsG,
          fatG: food.fatG,
          fiberG: food.fiberG,
          sugarG: food.sugarG,
          sodiumMg: food.sodiumMg,
          isVerified: true,
        }),
      ),
    );

    const localIds = new Set(localResults.map((f) => f.id));
    const merged = [...localResults, ...persisted.filter((f) => !localIds.has(f.id))];
    return this.map(merged);
  }

  private map(foods: Awaited<ReturnType<FoodsRepository['search']>>) {
    return foods.map((food) => ({
      id: food.id,
      name: food.name,
      name_es: food.nameEs,
      brand: food.brand,
      source: food.source,
      per_100g: {
        calories_kcal: this.per100g(food.calories, food.servingSizeG),
        protein_g: this.per100g(food.proteinG, food.servingSizeG),
        fat_g: this.per100g(food.fatG, food.servingSizeG),
        carbs_g: this.per100g(food.carbsG, food.servingSizeG),
        fiber_g: food.fiberG != null ? this.per100g(food.fiberG, food.servingSizeG) : null,
        sugar_g: food.sugarG != null ? this.per100g(food.sugarG, food.servingSizeG) : null,
        sodium_mg: food.sodiumMg != null ? this.per100g(food.sodiumMg, food.servingSizeG) : null,
      },
    }));
  }

  private per100g(value: unknown, servingSizeG: unknown): number {
    return Math.round((Number(value) / Number(servingSizeG)) * 100 * 100) / 100;
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface UsdaFoodResult {
  externalId: string;
  name: string;
  servingSizeG: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number | null;
  sugarG: number | null;
  sodiumMg: number | null;
}

interface UsdaFdcNutrient {
  nutrientId: number;
  value: number;
}

interface UsdaFdcFood {
  fdcId: number;
  description: string;
  foodNutrients: UsdaFdcNutrient[];
}

// IDs de nutrientes USDA FoodData Central (formato "Foundation"/"SR Legacy").
const NUTRIENT_IDS = { calories: 1008, protein: 1003, fat: 1004, carbs: 1005, fiber: 1079, sugar: 2000, sodium: 1093 };

/**
 * Adaptador USDA FoodData Central — FD-Sección-9 / BackendArchitecture.md §"searchFood".
 * Fail-safe (BackendArchitecture.md §"Fail-Safe Degradation"): si la API no responde
 * o falta USDA_API_KEY, retorna [] y el caller (FoodsService) recurre a la base local.
 * Nunca lanza — un fallo de USDA jamás debe romper el flujo de registro de comida.
 */
@Injectable()
export class UsdaApiAdapter {
  private readonly logger = new Logger(UsdaApiAdapter.name);

  constructor(private readonly configService: ConfigService) {}

  async search(query: string, limit: number): Promise<UsdaFoodResult[]> {
    const apiKey = this.configService.get<string>('usda.apiKey');
    if (!apiKey) {
      this.logger.warn('USDA_API_KEY no configurada — usando solo base local.');
      return [];
    }

    const apiUrl = this.configService.get<string>('usda.apiUrl');
    const url = `${apiUrl}/foods/search?api_key=${apiKey}&query=${encodeURIComponent(query)}&pageSize=${limit}&dataType=Foundation,SR%20Legacy`;

    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (!response.ok) {
        this.logger.warn(`USDA API respondió ${response.status} — usando base local.`);
        return [];
      }
      const body = (await response.json()) as { foods: UsdaFdcFood[] };
      return body.foods.map((food) => this.normalize(food));
    } catch (error) {
      this.logger.warn(`USDA API no disponible: ${(error as Error).message} — usando base local.`);
      return [];
    }
  }

  private normalize(food: UsdaFdcFood): UsdaFoodResult {
    const nutrient = (id: number) => food.foodNutrients.find((n) => n.nutrientId === id)?.value ?? null;
    return {
      externalId: String(food.fdcId),
      name: food.description,
      servingSizeG: 100, // USDA reporta nutrientes por 100g
      calories: nutrient(NUTRIENT_IDS.calories) ?? 0,
      proteinG: nutrient(NUTRIENT_IDS.protein) ?? 0,
      carbsG: nutrient(NUTRIENT_IDS.carbs) ?? 0,
      fatG: nutrient(NUTRIENT_IDS.fat) ?? 0,
      fiberG: nutrient(NUTRIENT_IDS.fiber),
      sugarG: nutrient(NUTRIENT_IDS.sugar),
      sodiumMg: nutrient(NUTRIENT_IDS.sodium),
    };
  }
}

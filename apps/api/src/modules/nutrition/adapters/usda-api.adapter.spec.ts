import { UsdaApiAdapter } from './usda-api.adapter';
import { ConfigService } from '@nestjs/config';

describe('UsdaApiAdapter — fail-safe degradation', () => {
  it('retorna [] sin lanzar cuando USDA_API_KEY no está configurada', async () => {
    const configService = { get: jest.fn().mockReturnValue(undefined) } as unknown as ConfigService;
    const adapter = new UsdaApiAdapter(configService);

    const results = await adapter.search('pollo', 10);

    expect(results).toEqual([]);
  });

  it('retorna [] sin lanzar cuando la API responde con error de red', async () => {
    const configService = {
      get: jest.fn((key: string) => (key === 'usda.apiKey' ? 'fake-key' : 'https://api.nal.usda.gov/fdc/v1')),
    } as unknown as ConfigService;
    const adapter = new UsdaApiAdapter(configService);
    global.fetch = jest.fn().mockRejectedValue(new Error('network down'));

    const results = await adapter.search('pollo', 10);

    expect(results).toEqual([]);
  });
});

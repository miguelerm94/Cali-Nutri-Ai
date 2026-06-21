import { registerAs } from '@nestjs/config';

export default registerAs('usda', () => ({
  apiKey: process.env.USDA_API_KEY,
  apiUrl: process.env.USDA_API_URL ?? 'https://api.nal.usda.gov/fdc/v1',
}));

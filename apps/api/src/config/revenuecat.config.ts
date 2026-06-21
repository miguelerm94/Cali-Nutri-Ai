import { registerAs } from '@nestjs/config';

export default registerAs('revenuecat', () => ({
  apiKey: process.env.REVENUECAT_API_KEY,
  webhookSecret: process.env.REVENUECAT_WEBHOOK_SECRET,
}));

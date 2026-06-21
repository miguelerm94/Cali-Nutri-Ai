import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  apiVersion: process.env.API_VERSION ?? '1',
  globalPrefix: `v${process.env.API_VERSION ?? '1'}`, // Fuente: API.md "Base URL: https://api.calinutri.app/v1"
  nodeEnv: process.env.NODE_ENV ?? 'development',
  isProduction: process.env.NODE_ENV === 'production',
}));

import { registerAs } from '@nestjs/config';

export default registerAs('encryption', () => ({
  // FD-DB-06: clave de 32 bytes en hex. NUNCA loggear ni exponer.
  key: process.env.ENCRYPTION_KEY,
}));

import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** Marca una ruta como pública — JwtAuthGuard global la deja pasar sin token. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

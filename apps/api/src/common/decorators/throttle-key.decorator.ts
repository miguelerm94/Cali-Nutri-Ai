import { SetMetadata } from '@nestjs/common';

export const THROTTLE_KEY_META = 'throttleKey';

/** Personaliza la clave de rate limit usada por RateLimitMiddleware/Guard para este endpoint. */
export const ThrottleKey = (key: string) => SetMetadata(THROTTLE_KEY_META, key);

import { BadRequestException, PipeTransform } from '@nestjs/common';
import { ErrorCode } from '@cali-nutri/shared-types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class ParseUuidPipe implements PipeTransform<string> {
  transform(value: string): string {
    if (!UUID_REGEX.test(value)) {
      throw new BadRequestException({
        code: ErrorCode.VALIDATION_ERROR,
        message: `El parámetro "${value}" no es un UUID válido.`,
      });
    }
    return value;
  }
}

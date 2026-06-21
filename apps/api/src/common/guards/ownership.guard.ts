import { CanActivate, ExecutionContext, Injectable, NotFoundException } from '@nestjs/common';
import { ErrorCode } from '@cali-nutri/shared-types';

export interface OwnershipCheckable {
  findOwnerId(resourceId: string): Promise<string | null>;
}

/**
 * Guard genérico parametrizable: verifica que :id pertenece al usuario autenticado.
 * Uso: cada módulo provee su propio repositorio que implementa OwnershipCheckable
 * y extiende esta clase (BackendArchitecture.md §8 "Implementación: Genérico").
 */
@Injectable()
export abstract class BaseOwnershipGuard implements CanActivate {
  protected abstract getRepository(context: ExecutionContext): OwnershipCheckable;
  protected abstract getResourceIdParam(): string;

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const resourceId = request.params[this.getResourceIdParam()];
    const userId = request.user?.id;

    const ownerId = await this.getRepository(context).findOwnerId(resourceId);

    // No revela existencia del recurso a otros usuarios (404 genérico).
    if (!ownerId || ownerId !== userId) {
      throw new NotFoundException({
        code: ErrorCode.RESOURCE_NOT_FOUND,
        message: 'El recurso solicitado no existe.',
      });
    }
    return true;
  }
}

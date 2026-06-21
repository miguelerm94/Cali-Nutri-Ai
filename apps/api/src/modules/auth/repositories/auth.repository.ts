import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { Sex, UnitPreference } from '@prisma/client';

export interface CreateLocalUserInput {
  id: string; // = supabaseUserId (FD-ARCH-01: users.id === Supabase auth.users.id)
  email: string;
  passwordHash: string | null;
  firstName: string;
  lastName?: string;
  googleId?: string;
}

/**
 * Operaciones de la tabla `users` propias de Auth.
 * Nota: birthDate/sex/heightCm se completan en el Onboarding (S2, /assessment/initial).
 * Aquí se crean con placeholders mínimos válidos para no romper el NOT NULL del schema,
 * y onboardingStep queda en 0.
 */
@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  findByGoogleId(googleId: string) {
    return this.prisma.user.findUnique({ where: { googleId } });
  }

  createLocalUser(input: CreateLocalUserInput) {
    return this.prisma.user.create({
      data: {
        id: input.id,
        email: input.email,
        passwordHash: input.passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
        googleId: input.googleId,
        // Placeholders de onboarding — se completan en POST /assessment/initial (S2):
        birthDate: new Date('2000-01-01'),
        sex: Sex.male,
        heightCm: 170,
        unitPreference: UnitPreference.metric,
        onboardingStep: 0,
        onboardingComplete: false,
      },
    });
  }
}

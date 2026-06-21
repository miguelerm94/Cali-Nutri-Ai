export function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

/** Estado simplificado para UI — sin alertas/notificaciones (NotificationsModule, S6a). */
export function hydrationStatus(percentCompleted: number): 'on_track' | 'behind_schedule' {
  return percentCompleted >= 50 ? 'on_track' : 'behind_schedule';
}

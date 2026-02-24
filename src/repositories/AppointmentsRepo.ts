import { execute, query } from '../db/index';
import { rangesOverlap } from '../utils/overlap';

export type AppointmentStatus = 'ACTIVE' | 'CANCELED';

export type Appointment = {
  id: number;
  clientId: number;
  serviceId: number;
  startAt: string;
  durationMinutes: number;
  notes: string | null;
  status: AppointmentStatus;
  createdAt: string | null;
  updatedAt: string | null;
};

export type AppointmentWithRelations = Appointment & {
  clientName: string;
  clientPhone: string | null;
  serviceName: string;
  servicePrice: number | null;
};

export type CreateAppointmentInput = {
  clientId: number;
  serviceId: number;
  startAt: string;
  durationMinutes: number;
  notes?: string;
};

export const AppointmentsRepo = {
  create(input: CreateAppointmentInput) {
    const now = new Date().toISOString();

    execute(
      `INSERT INTO appointments (clientId, serviceId, startAt, durationMinutes, notes, status, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, 'ACTIVE', ?, ?);`,
      [input.clientId, input.serviceId, input.startAt, input.durationMinutes, input.notes ?? null, now, now],
    );

    const created = query<{ id: number }>('SELECT last_insert_rowid() as id;')[0];
    return this.getById(created.id);
  },

  getById(id: number) {
    const rows = query<Appointment>(
      'SELECT id, clientId, serviceId, startAt, durationMinutes, notes, status, createdAt, updatedAt FROM appointments WHERE id = ? LIMIT 1;',
      [id],
    );
    return rows[0] ?? null;
  },

  update(id: number, input: Partial<CreateAppointmentInput>) {
    const current = this.getById(id);
    if (!current) return null;

    const next = {
      ...current,
      ...input,
      updatedAt: new Date().toISOString(),
    };

    execute(
      `UPDATE appointments
         SET clientId = ?, serviceId = ?, startAt = ?, durationMinutes = ?, notes = ?, updatedAt = ?
       WHERE id = ?;`,
      [next.clientId, next.serviceId, next.startAt, next.durationMinutes, next.notes ?? null, next.updatedAt, id],
    );

    return this.getById(id);
  },

  cancel(id: number) {
    const now = new Date().toISOString();
    execute("UPDATE appointments SET status = 'CANCELED', updatedAt = ? WHERE id = ?;", [now, id]);
    return this.getById(id);
  },

  listByDate(dateKey: string) {
    return query<AppointmentWithRelations>(
      `SELECT
          a.id,
          a.clientId,
          a.serviceId,
          a.startAt,
          a.durationMinutes,
          a.notes,
          a.status,
          a.createdAt,
          a.updatedAt,
          c.name as clientName,
          c.phone as clientPhone,
          s.name as serviceName,
          s.price as servicePrice
       FROM appointments a
       JOIN clients c ON c.id = a.clientId
       JOIN services s ON s.id = a.serviceId
       WHERE substr(a.startAt, 1, 10) = ?
       ORDER BY a.startAt ASC;`,
      [dateKey],
    );
  },

  checkConflict(startAt: string, durationMinutes: number, excludeAppointmentId?: number) {
    const candidates = query<Appointment>(
      `SELECT id, clientId, serviceId, startAt, durationMinutes, notes, status, createdAt, updatedAt
       FROM appointments
       WHERE status = 'ACTIVE'${excludeAppointmentId ? ' AND id != ?' : ''};`,
      excludeAppointmentId ? [excludeAppointmentId] : [],
    );

    const newStart = new Date(startAt).getTime();
    const newEnd = newStart + durationMinutes * 60_000;

    return candidates.some((appointment) => {
      const currentStart = new Date(appointment.startAt).getTime();
      const currentEnd = currentStart + appointment.durationMinutes * 60_000;
      return rangesOverlap(newStart, newEnd, currentStart, currentEnd);
    });
  },
};

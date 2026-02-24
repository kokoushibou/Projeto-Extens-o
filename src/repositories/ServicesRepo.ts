import { execute, query } from '../db/index';

export type Service = {
  id: number;
  name: string;
  price: number | null;
  durationMinutes: number;
  createdAt: string | null;
};

export type CreateServiceInput = {
  name: string;
  price?: number;
  durationMinutes: number;
};

export const ServicesRepo = {
  create(input: CreateServiceInput) {
    const createdAt = new Date().toISOString();
    const result = execute('INSERT INTO services (name, price, durationMinutes, createdAt) VALUES (?, ?, ?, ?);', [
      input.name,
      input.price ?? 0,
      input.durationMinutes,
      createdAt,
    ]);

    return this.getById(Number(result.lastInsertRowId));
  },

  getById(id: number) {
    const rows = query<Service>('SELECT id, name, price, durationMinutes, createdAt FROM services WHERE id = ? LIMIT 1;', [id]);
    return rows[0] ?? null;
  },

  list() {
    return query<Service>('SELECT id, name, price, durationMinutes, createdAt FROM services ORDER BY name ASC;');
  },

  update(id: number, input: Partial<CreateServiceInput>) {
    const current = this.getById(id);
    if (!current) return null;

    execute('UPDATE services SET name = ?, price = ?, durationMinutes = ? WHERE id = ?;', [
      input.name ?? current.name,
      input.price ?? current.price,
      input.durationMinutes ?? current.durationMinutes,
      id,
    ]);

    return this.getById(id);
  },

  hasAppointments(id: number) {
    const rows = query<{ total: number }>('SELECT COUNT(*) as total FROM appointments WHERE serviceId = ?;', [id]);
    return (rows[0]?.total ?? 0) > 0;
  },

  remove(id: number) {
    execute('DELETE FROM services WHERE id = ?;', [id]);
  },
};

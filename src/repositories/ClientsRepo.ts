import { execute, query } from '../db/index';

export type Client = {
  id: number;
  name: string;
  phone: string | null;
  createdAt: string | null;
};

export type CreateClientInput = {
  name: string;
  phone?: string;
};

export const ClientsRepo = {
  create(input: CreateClientInput) {
    const createdAt = new Date().toISOString();
    const result = execute('INSERT INTO clients (name, phone, createdAt) VALUES (?, ?, ?);', [
      input.name,
      input.phone ?? null,
      createdAt,
    ]);

    return this.getById(Number(result.lastInsertRowId));
  },

  getById(id: number) {
    const rows = query<Client>('SELECT id, name, phone, createdAt FROM clients WHERE id = ? LIMIT 1;', [id]);
    return rows[0] ?? null;
  },

  list() {
    return query<Client>('SELECT id, name, phone, createdAt FROM clients ORDER BY name ASC;');
  },

  search(term: string) {
    const like = `%${term}%`;
    return query<Client>('SELECT id, name, phone, createdAt FROM clients WHERE name LIKE ? OR phone LIKE ? ORDER BY name ASC;', [
      like,
      like,
    ]);
  },

  update(id: number, input: Partial<CreateClientInput>) {
    const current = this.getById(id);
    if (!current) return null;

    execute('UPDATE clients SET name = ?, phone = ? WHERE id = ?;', [
      input.name ?? current.name,
      input.phone ?? current.phone,
      id,
    ]);

    return this.getById(id);
  },

  hasAppointments(id: number) {
    const rows = query<{ total: number }>('SELECT COUNT(*) as total FROM appointments WHERE clientId = ?;', [id]);
    return (rows[0]?.total ?? 0) > 0;
  },

  remove(id: number) {
    execute('DELETE FROM clients WHERE id = ?;', [id]);
  },
};

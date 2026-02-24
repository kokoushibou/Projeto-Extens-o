import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export function openDb(): SQLite.SQLiteDatabase {
  if (!db) {
    db = SQLite.openDatabaseSync('salao.db');
    db.execSync('PRAGMA foreign_keys = ON;');
  }

  return db;
}

type SQLParam = string | number | null;

export function execute(sql: string, params: SQLParam[] = []) {
  const database = openDb();
  return database.runSync(sql, params as SQLite.SQLiteBindParams);
}

export function query<T>(sql: string, params: SQLParam[] = []): T[] {
  const database = openDb();
  return database.getAllSync<T>(sql, params as SQLite.SQLiteBindParams);
}

function getCurrentVersion(): number {
  const rows = query<{ version: number }>('SELECT MAX(version) as version FROM schema_migrations;');
  return rows[0]?.version ?? 0;
}

function insertMigration(version: number) {
  execute('INSERT INTO schema_migrations (version, createdAt) VALUES (?, ?);', [version, new Date().toISOString()]);
}

export function migrate() {
  execute(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      version INTEGER NOT NULL UNIQUE,
      createdAt TEXT
    );
  `);

  let version = getCurrentVersion();

  if (version < 1) {
    execute(`
      CREATE TABLE IF NOT EXISTS clients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT,
        createdAt TEXT
      );
    `);

    execute(`
      CREATE TABLE IF NOT EXISTS services (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        price REAL,
        durationMinutes INTEGER NOT NULL,
        createdAt TEXT
      );
    `);

    execute(`
      CREATE TABLE IF NOT EXISTS appointments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        clientId INTEGER NOT NULL,
        serviceId INTEGER NOT NULL,
        startAt TEXT NOT NULL,
        durationMinutes INTEGER NOT NULL,
        notes TEXT,
        status TEXT NOT NULL,
        createdAt TEXT,
        updatedAt TEXT,
        FOREIGN KEY(clientId) REFERENCES clients(id),
        FOREIGN KEY(serviceId) REFERENCES services(id)
      );
    `);

    execute('CREATE INDEX IF NOT EXISTS idx_appointments_startAt ON appointments(startAt);');
    execute('CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);');

    insertMigration(1);
    version = 1;
  }

  const serviceCount = query<{ total: number }>('SELECT COUNT(*) as total FROM services;')[0]?.total ?? 0;
  if (serviceCount === 0) {
    const now = new Date().toISOString();
    execute('INSERT INTO services (name, price, durationMinutes, createdAt) VALUES (?, ?, ?, ?);', ['Corte', 0, 30, now]);
    execute('INSERT INTO services (name, price, durationMinutes, createdAt) VALUES (?, ?, ?, ?);', ['Escova', 0, 60, now]);
    console.log('[DB] Seed inicial de serviços aplicado.');
  }

  const migrationCount = query<{ total: number }>('SELECT COUNT(*) as total FROM schema_migrations;')[0]?.total ?? 0;
  console.log(`[DB] Migração concluída. Versão atual: ${version}. Migrações registradas: ${migrationCount}.`);
}

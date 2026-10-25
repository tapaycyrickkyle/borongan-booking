import { neon } from "@neondatabase/serverless";
import { getRequiredSecret } from "./env.js";

export function toPostgresSql(sql) {
  let index = 0;
  return sql.replace(/\?/g, () => `$${++index}`);
}

function normalizedBindings(bindings) {
  return bindings.map((value) => value === undefined ? null : value);
}

class NeonStatement {
  constructor(client, sql, bindings = []) {
    this.client = client;
    this.sql = toPostgresSql(sql);
    this.bindings = bindings;
  }

  bind(...bindings) {
    return new NeonStatement(this.client, this.sql, bindings);
  }

  async all() {
    const result = await this.client.query(this.sql, normalizedBindings(this.bindings), { fullResults: true });
    return { results: result.rows ?? [] };
  }

  async first() {
    return (await this.all()).results[0] ?? null;
  }

  async run() {
    const result = await this.client.query(this.sql, normalizedBindings(this.bindings), { fullResults: true });
    return { meta: { changes: result.rowCount ?? 0 } };
  }
}

class NeonDatabase {
  constructor(client) {
    this.client = client;
  }

  prepare(sql) {
    return new NeonStatement(this.client, sql);
  }

  async batch(statements) {
    const results = await this.client.transaction(
      statements.map((statement) => this.client.query(statement.sql, normalizedBindings(statement.bindings))),
      { fullResults: true },
    );
    return results.map((result) => ({ results: result.rows ?? [], meta: { changes: result.rowCount ?? 0 } }));
  }
}

const clients = new Map();

export async function getDb() {
  const connectionString = await getRequiredSecret("NEON_DATABASE_URL");
  if (!clients.has(connectionString)) clients.set(connectionString, new NeonDatabase(neon(connectionString)));
  return clients.get(connectionString);
}

export function prepared(db, sql, ...bindings) {
  return db.prepare(sql).bind(...bindings);
}

export async function first(sql, ...bindings) {
  return prepared(await getDb(), sql, ...bindings).first();
}

export async function all(sql, ...bindings) {
  return prepared(await getDb(), sql, ...bindings).all();
}

export async function run(sql, ...bindings) {
  return prepared(await getDb(), sql, ...bindings).run();
}

export async function batch(statements) {
  return (await getDb()).batch(statements);
}

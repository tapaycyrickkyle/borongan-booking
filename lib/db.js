import { getBindings } from "./env.js";

export async function getDb() {
  const { db } = await getBindings();
  if (!db) throw new Error("missing_binding:DB");
  return db;
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

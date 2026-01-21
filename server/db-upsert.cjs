"use strict";

function kebabCase(s) {
  return String(s)
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLowerCase();
}

function defaultResourceFromEntityCode(codigo) {
  // plural simples (POC)
  const base = kebabCase(codigo);
  return base.endsWith("s") ? base : `${base}s`;
}

function upsertEndpoint(db, { escopo, codigo, schema, resource, baseUrl }) {
  const id = `${escopo}.${codigo}`;
  const endpointUrl = `${baseUrl.replace(/\/+$/, "")}/${resource}`;

  const existing = db.get("endpoints").find({ id }).value();

  const record = {
    id,
    escopo,
    codigo,
    schema,
    endpoint: endpointUrl
  };

  if (!db.get("endpoints").value()) db.set("endpoints", []).write();

  if (existing) db.get("endpoints").find({ id }).assign(record).write();
  else db.get("endpoints").push(record).write();

  return record;
}

function writeMockData(db, { resource, items }) {
  if (!resource) throw new Error("resource é obrigatório para salvar mocks no db.json");
  if (!Array.isArray(items)) throw new Error("items deve ser um array");

  // Política simples: replace total da coleção
  db.set(resource, items).write();
}

module.exports = {
  kebabCase,
  defaultResourceFromEntityCode,
  upsertEndpoint,
  writeMockData
};

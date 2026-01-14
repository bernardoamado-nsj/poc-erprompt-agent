// entityStore.js (CommonJS)
async function getEntity(baseUrl, collection, id) {
  const res = await fetch(`${baseUrl}/${collection}/${encodeURIComponent(id)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GET failed (${res.status}): ${await res.text()}`);
  return await res.json();
}

async function createEntity(baseUrl, collection, entity) {
  const res = await fetch(`${baseUrl}/${collection}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entity),
  });
  if (!res.ok) throw new Error(`POST failed (${res.status}): ${await res.text()}`);
  return await res.json();
}

async function replaceEntity(baseUrl, collection, id, entity) {
  const res = await fetch(`${baseUrl}/${collection}/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entity),
  });
  if (!res.ok) throw new Error(`PUT failed (${res.status}): ${await res.text()}`);
  return await res.json();
}

/**
 * Upsert = GET then PUT/POST
 */
async function upsertEntity(baseUrl, collection, entity) {
  if (!entity || typeof entity !== "object") throw new Error("entity must be an object");
  if (!entity.id) throw new Error("entity.id is required");

  const existing = await getEntity(baseUrl, collection, entity.id);

  if (existing) {
    // PUT replaces the entire record
    return await replaceEntity(baseUrl, collection, entity.id, entity);
  } else {
    // Ensure id is present in the POST payload
    return await createEntity(baseUrl, collection, entity);
  }
}

module.exports = { upsertEntity };

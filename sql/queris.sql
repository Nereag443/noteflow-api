-- ============================================================
-- Consultas SQL principales
-- ============================================================

-- ------------------------------------------------------------
-- Obtener todas las notas con sus items y tags (JOIN completo)
-- ------------------------------------------------------------
-- SELECT n.* → selecciona todas las columnas de la tabla notes
-- json_agg(ci.*) → agrega todos los items en un array JSON
-- FILTER (WHERE ci.id IS NOT NULL) → excluye los NULL cuando no hay items
-- LEFT JOIN checklist_items → une los items a las notas (LEFT para incluir notas sin items)
-- LEFT JOIN note_tags → une los tags a las notas (LEFT para incluir notas sin tags)
-- GROUP BY n.id → agrupa por nota para que json_agg funcione correctamente
-- ORDER BY n.created_at DESC → las notas más recientes primero

SELECT
    n.*,
    json_agg(ci.*) FILTER (WHERE ci.id IS NOT NULL) as items,
    json_agg(nt.text) FILTER (WHERE nt.id IS NOT NULL) as tags
FROM notes n
LEFT JOIN checklist_items ci ON n.id = ci.note_id
LEFT JOIN note_tags nt ON n.id = nt.note_id
GROUP BY n.id
ORDER BY n.created_at DESC;

-- ------------------------------------------------------------
-- Obtener una nota específica con sus items y tags
-- ------------------------------------------------------------
-- WHERE n.id = $1 → filtra por el ID de la nota (parámetro)

SELECT
    n.*,
    json_agg(ci.*) FILTER (WHERE ci.id IS NOT NULL) as items,
    json_agg(nt.text) FILTER (WHERE nt.id IS NOT NULL) as tags
FROM notes n
LEFT JOIN checklist_items ci ON n.id = ci.note_id
LEFT JOIN note_tags nt ON n.id = nt.note_id
WHERE n.id = $1
GROUP BY n.id;

-- ------------------------------------------------------------
-- Obtener todas las checklists con sus items ordenados
-- ------------------------------------------------------------
-- WHERE n.type = 'checklist' → filtra solo las checklists
-- ORDER BY ci.id dentro del json_agg → mantiene el orden de los items

SELECT
    n.*,
    json_agg(ci.* ORDER BY ci.id) FILTER (WHERE ci.id IS NOT NULL) as items
FROM notes n
LEFT JOIN checklist_items ci ON n.id = ci.note_id
WHERE n.type = 'checklist'
GROUP BY n.id
ORDER BY n.created_at DESC;

-- ------------------------------------------------------------
-- Obtener todas las ideas con sus tags
-- ------------------------------------------------------------

SELECT
    n.*,
    json_agg(nt.text) FILTER (WHERE nt.id IS NOT NULL) as tags
FROM notes n
LEFT JOIN note_tags nt ON n.id = nt.note_id
WHERE n.type = 'idea'
GROUP BY n.id
-- PostgreSQL permite seleccionar n.* agrupando solo por la PK
-- porque el resto de columnas dependen funcionalmente de n.id
ORDER BY n.created_at DESC;

-- ------------------------------------------------------------
-- Actualizar una nota (COALESCE para updates parciales)
-- ------------------------------------------------------------
-- COALESCE($1, title) → si $1 es NULL, mantiene el valor actual
-- Permite actualizar solo los campos enviados sin tocar el resto
-- CASE WHEN $5::boolean IS NOT NULL → manejo especial para booleanos
-- COALESCE no sirve bien con booleanos cuando FALSE es un valor válido

UPDATE notes
SET
    title = COALESCE($1, title),
    content = COALESCE($2, content),
    color = COALESCE($3, color),
    priority = COALESCE($4, priority),
    archived = CASE WHEN $5::boolean IS NOT NULL THEN $5::boolean ELSE archived END,
    updated_at = NOW()
WHERE id = $6
RETURNING *;

-- ------------------------------------------------------------
-- Marcar/desmarcar un item de checklist
-- ------------------------------------------------------------
-- is_completed = COALESCE($1, is_completed) → actualiza solo si se envía el valor

UPDATE checklist_items
SET
    text = COALESCE($1, text),
    is_completed = COALESCE($2, is_completed)
WHERE id = $3
RETURNING *;
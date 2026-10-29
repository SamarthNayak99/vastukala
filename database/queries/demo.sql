-- Vastukala: queries to explain during the DBMS demonstration.

-- 1. A normalized public summary (INNER JOIN + view).
SELECT * FROM published_building_summary ORDER BY name;

-- 2. Combined location, type, material and element search.
SELECT b.name,s.name AS location,b.date_label
FROM buildings b
JOIN sites s ON s.id=b.site_id
JOIN building_types t ON t.id=b.type_id
WHERE b.status='published' AND s.name='Badami' AND t.name='Cave temple'
AND EXISTS(SELECT 1 FROM building_materials bm JOIN materials m ON m.id=bm.material_id
           WHERE bm.building_id=b.id AND m.name='Sandstone')
AND EXISTS(SELECT 1 FROM building_elements be JOIN elements e ON e.id=be.element_id
           WHERE be.building_id=b.id AND e.name='Carved pillar');

-- 3. Match ALL requested elements, a relational-division pattern.
WITH required(name) AS (VALUES ('Mandapa'),('Stone chariot shrine'))
SELECT b.name FROM buildings b WHERE b.status='published'
AND NOT EXISTS(
 SELECT 1 FROM required r WHERE NOT EXISTS(
  SELECT 1 FROM building_elements be JOIN elements e ON e.id=be.element_id
  WHERE be.building_id=b.id AND e.name=r.name
 )
);

-- 4. Building counts: COUNT(DISTINCT) prevents join multiplication.
SELECT s.name,count(DISTINCT b.id) AS buildings
FROM sites s LEFT JOIN buildings b ON b.site_id=s.id AND b.status='published'
LEFT JOIN citations c ON c.building_id=b.id
GROUP BY s.id ORDER BY buildings DESC,s.name;

-- 5. Shared architectural elements using INTERSECT.
SELECT e.name FROM elements e JOIN building_elements be ON be.element_id=e.id
JOIN buildings b ON b.id=be.building_id WHERE b.slug='badami-cave-3'
INTERSECT
SELECT e.name FROM elements e JOIN building_elements be ON be.element_id=e.id
JOIN buildings b ON b.id=be.building_id WHERE b.slug='virupaksha-temple-pattadakal';

-- 6. Alternate-name retrieval.
SELECT b.name,b.slug,a.alias FROM buildings b
JOIN building_aliases a ON a.building_id=b.id
WHERE b.status='published' AND a.alias ILIKE '%Lokeshwara%';

-- 7. Evidence attached to a material assertion.
SELECT b.name,m.name AS material,bm.usage_notes,s.title,c.locator
FROM buildings b JOIN building_materials bm ON bm.building_id=b.id
JOIN materials m ON m.id=bm.material_id
JOIN citations c ON c.building_material_id=bm.id AND c.building_id=b.id
JOIN sources s ON s.id=c.source_id;

-- 8. Examine a query plan. A tiny pilot may legitimately prefer a sequential scan.
EXPLAIN ANALYZE SELECT id,name FROM buildings
WHERE status='published' AND site_id=(SELECT id FROM sites WHERE slug='badami');

-- The API additionally demonstrates BEGIN/COMMIT/ROLLBACK when saving a building
-- and its linked records. The isolated integration test deliberately fails a
-- foreign-key insert and verifies that the previous state survives intact.

-- 9. Anatomy: join a reviewed image point to its local element and citation.
SELECT b.name,i.caption,h.label,h.x,h.y,e.name AS element,s.title,c.locator
FROM hotspots h JOIN buildings b ON b.id=h.building_id
JOIN images i ON i.building_id=h.building_id AND i.storage_key=h.storage_key
JOIN building_elements be ON be.building_id=h.building_id AND be.element_id=h.element_id
JOIN elements e ON e.id=be.element_id
JOIN citations c ON c.building_id=b.id AND c.building_element_id=be.id
JOIN sources s ON s.id=c.source_id
WHERE b.status='published' AND i.approved;

-- 10. Features documented at Halebidu but not in the Somanathapura record.
-- EXCEPT expresses a difference in recorded relationships, not physical absence.
SELECT be.element_id FROM building_elements be JOIN buildings b ON b.id=be.building_id
WHERE b.slug='hoysaleswara-temple-halebidu'
EXCEPT
SELECT be.element_id FROM building_elements be JOIN buildings b ON b.id=be.building_id
WHERE b.slug='keshava-temple-somanathapura';

-- 11. Inclusive temporal overlap. These are building-date ranges, not feature origins.
SELECT b.name,b.year_from,b.year_to,b.date_label FROM buildings b
WHERE b.status='published' AND b.year_from<=1300 AND b.year_to>=1200
ORDER BY b.year_from,b.name;
-- Undated records are queried separately; no inferred date is assigned to them.

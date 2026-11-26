CREATE TABLE empires (
 id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 slug text NOT NULL UNIQUE CHECK(slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
 name text NOT NULL UNIQUE,
 kind text NOT NULL CHECK(kind IN ('empire','dynasty','kingdom','sultanate','confederacy','colonial administration','civilisation','chiefdom','patron family')),
 region text NOT NULL,
 year_from integer CHECK(year_from BETWEEN -4000 AND 2100 AND year_from<>0),
 year_to integer CHECK(year_to BETWEEN -4000 AND 2100 AND year_to<>0),
 date_label text NOT NULL,
 summary text NOT NULL,
 history text NOT NULL,
 architectural_notes text NOT NULL,
 CHECK(year_from IS NULL OR year_to IS NULL OR year_from<=year_to)
);
CREATE TABLE empire_sources (
 empire_id integer NOT NULL REFERENCES empires(id) ON DELETE CASCADE,
 source_id integer NOT NULL REFERENCES sources(id) ON DELETE RESTRICT,
 topic text NOT NULL,
 locator text NOT NULL DEFAULT '',
 PRIMARY KEY(empire_id,source_id)
);
CREATE TABLE building_empires (
 id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 building_id integer NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
 empire_id integer NOT NULL REFERENCES empires(id) ON DELETE CASCADE,
 relationship text NOT NULL CHECK(relationship IN ('construction','patronage','addition','restoration','historical_context')),
 evidence text NOT NULL CHECK(length(trim(evidence))>0),
 source_id integer NOT NULL REFERENCES sources(id) ON DELETE RESTRICT,
 locator text NOT NULL DEFAULT '',
 year_from integer CHECK(year_from BETWEEN -4000 AND 2100 AND year_from<>0),
 year_to integer CHECK(year_to BETWEEN -4000 AND 2100 AND year_to<>0),
 UNIQUE(building_id,empire_id,relationship),
 CHECK(year_from IS NULL OR year_to IS NULL OR year_from<=year_to)
);
CREATE INDEX building_empires_empire_idx ON building_empires(empire_id,building_id);
CREATE INDEX building_empires_source_idx ON building_empires(source_id);
CREATE INDEX empire_sources_source_idx ON empire_sources(source_id);
CREATE VIEW empire_monument_summary AS
 SELECT e.id,e.slug,e.name,e.kind,e.region,e.date_label,count(DISTINCT b.id)::int AS monument_count
 FROM empires e LEFT JOIN building_empires be ON be.empire_id=e.id
 LEFT JOIN buildings b ON b.id=be.building_id AND b.status='published'
 GROUP BY e.id;

CREATE TABLE building_events (
 id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 building_id integer NOT NULL REFERENCES buildings ON DELETE CASCADE,
 kind text NOT NULL CHECK(kind IN ('construction','addition','alteration','restoration','use','recognition')),
 title text NOT NULL CHECK(length(trim(title)) BETWEEN 1 AND 200),
 description text NOT NULL DEFAULT '', year_from integer NOT NULL CHECK(year_from BETWEEN 1 AND 2100),
 year_to integer NOT NULL CHECK(year_to BETWEEN 1 AND 2100),
 precision text NOT NULL CHECK(precision IN ('year','approximate','range')),
 source_id integer NOT NULL REFERENCES sources ON DELETE RESTRICT,
 locator text NOT NULL DEFAULT '', CHECK(year_from<=year_to), UNIQUE(id,building_id)
);
CREATE INDEX building_events_chronology ON building_events(building_id,year_from);

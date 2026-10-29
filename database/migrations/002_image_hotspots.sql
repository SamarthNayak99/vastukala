ALTER TABLE images ADD CONSTRAINT images_building_asset_unique UNIQUE(building_id,storage_key);

CREATE TABLE hotspots (
 id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 building_id integer NOT NULL REFERENCES buildings ON DELETE CASCADE,
 storage_key text NOT NULL,
 element_id integer NOT NULL,
 label text NOT NULL CHECK(length(trim(label)) BETWEEN 1 AND 100),
 x numeric NOT NULL CHECK(x BETWEEN 0 AND 100),
 y numeric NOT NULL CHECK(y BETWEEN 0 AND 100),
 note text NOT NULL DEFAULT '',
 UNIQUE(building_id,storage_key,element_id),
 FOREIGN KEY(building_id,storage_key) REFERENCES images(building_id,storage_key) ON DELETE CASCADE,
 FOREIGN KEY(building_id,element_id) REFERENCES building_elements(building_id,element_id) ON DELETE CASCADE
);
CREATE INDEX hotspots_element_idx ON hotspots(element_id,building_id);

-- Data curation runs once; later administrator edits and removals survive startup.
CREATE TABLE seed_tasks (name text PRIMARY KEY,applied_at timestamptz NOT NULL DEFAULT now());

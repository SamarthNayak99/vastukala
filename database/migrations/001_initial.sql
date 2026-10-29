CREATE TABLE sites (
 id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 name text NOT NULL UNIQUE, slug text NOT NULL UNIQUE,
 locality text NOT NULL, district text NOT NULL, state text NOT NULL DEFAULT 'Karnataka', overview text NOT NULL DEFAULT ''
);
CREATE TABLE building_types (id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY, name text NOT NULL UNIQUE, description text NOT NULL DEFAULT '');
CREATE TABLE buildings (
 id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 site_id integer NOT NULL REFERENCES sites ON DELETE RESTRICT,
 type_id integer NOT NULL REFERENCES building_types ON DELETE RESTRICT,
 name text NOT NULL CHECK(length(trim(name))>0), slug text NOT NULL UNIQUE,
 summary text NOT NULL DEFAULT '', history text NOT NULL DEFAULT '', layout_notes text NOT NULL DEFAULT '',
 year_from integer, year_to integer, date_label text NOT NULL DEFAULT 'Not documented',
 date_precision text NOT NULL DEFAULT 'unknown' CHECK(date_precision IN ('year','approximate','range','unknown')),
 latitude numeric CHECK(latitude BETWEEN -90 AND 90), longitude numeric CHECK(longitude BETWEEN -180 AND 180),
 status text NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published','archived')),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK(year_from IS NULL OR year_to IS NULL OR year_from <= year_to)
);
CREATE TABLE building_aliases (id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY, building_id integer NOT NULL REFERENCES buildings ON DELETE CASCADE, alias text NOT NULL, UNIQUE(building_id,alias));
CREATE TABLE styles (id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY, name text NOT NULL UNIQUE, description text NOT NULL DEFAULT '');
CREATE TABLE materials (id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY, name text NOT NULL UNIQUE, description text NOT NULL DEFAULT '');
CREATE TABLE elements (id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY, name text NOT NULL UNIQUE, description text NOT NULL DEFAULT '', function text NOT NULL DEFAULT '');
CREATE TABLE building_styles (id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY, building_id integer NOT NULL REFERENCES buildings ON DELETE CASCADE, style_id integer NOT NULL REFERENCES styles ON DELETE RESTRICT, notes text NOT NULL DEFAULT '', UNIQUE(building_id,style_id), UNIQUE(id,building_id));
CREATE TABLE building_materials (id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY, building_id integer NOT NULL REFERENCES buildings ON DELETE CASCADE, material_id integer NOT NULL REFERENCES materials ON DELETE RESTRICT, usage_notes text NOT NULL DEFAULT '', UNIQUE(building_id,material_id), UNIQUE(id,building_id));
CREATE TABLE building_elements (id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY, building_id integer NOT NULL REFERENCES buildings ON DELETE CASCADE, element_id integer NOT NULL REFERENCES elements ON DELETE RESTRICT, description text NOT NULL DEFAULT '', location_notes text NOT NULL DEFAULT '', UNIQUE(building_id,element_id), UNIQUE(id,building_id));
CREATE TABLE sources (id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY, title text NOT NULL, author_or_publisher text NOT NULL, url text NOT NULL UNIQUE, publication_year integer, accessed_on date NOT NULL);
CREATE TABLE citations (
 id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY, building_id integer NOT NULL REFERENCES buildings ON DELETE CASCADE,
 source_id integer NOT NULL REFERENCES sources ON DELETE RESTRICT,
 claim_topic text NOT NULL, locator text NOT NULL DEFAULT '', note text NOT NULL DEFAULT '',
 building_style_id integer, building_material_id integer, building_element_id integer,
 CHECK(num_nonnulls(building_style_id,building_material_id,building_element_id)<=1),
 FOREIGN KEY(building_style_id,building_id) REFERENCES building_styles(id,building_id) ON DELETE CASCADE,
 FOREIGN KEY(building_material_id,building_id) REFERENCES building_materials(id,building_id) ON DELETE CASCADE,
 FOREIGN KEY(building_element_id,building_id) REFERENCES building_elements(id,building_id) ON DELETE CASCADE
);
CREATE TABLE images (
 id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY, building_id integer NOT NULL REFERENCES buildings ON DELETE CASCADE,
 building_element_id integer, storage_key text NOT NULL, source_page_url text NOT NULL, original_url text NOT NULL,
 author text NOT NULL, licence_code text NOT NULL, licence_url text NOT NULL, caption text NOT NULL, alt_text text NOT NULL,
 width integer NOT NULL CHECK(width>0), height integer NOT NULL CHECK(height>0), byte_size bigint NOT NULL CHECK(byte_size>0),
 modification_note text NOT NULL DEFAULT '', sort_order integer NOT NULL DEFAULT 0, is_cover boolean NOT NULL DEFAULT false,
 approved boolean NOT NULL DEFAULT false,
 UNIQUE(building_id,source_page_url),
 FOREIGN KEY(building_element_id,building_id) REFERENCES building_elements(id,building_id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX one_cover_per_building ON images(building_id) WHERE is_cover;
CREATE TABLE admins (id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY, email text NOT NULL UNIQUE, password_hash text NOT NULL);
CREATE TABLE sessions (sid varchar PRIMARY KEY, sess json NOT NULL, expire timestamp(6) NOT NULL);
CREATE INDEX sessions_expire_idx ON sessions(expire);
CREATE INDEX buildings_site_idx ON buildings(site_id);
CREATE INDEX buildings_type_idx ON buildings(type_id);
CREATE INDEX buildings_status_idx ON buildings(status);
CREATE INDEX aliases_building_idx ON building_aliases(building_id);
CREATE INDEX styles_reverse_idx ON building_styles(style_id,building_id);
CREATE INDEX materials_reverse_idx ON building_materials(material_id,building_id);
CREATE INDEX elements_reverse_idx ON building_elements(element_id,building_id);
CREATE INDEX citations_building_idx ON citations(building_id);
CREATE INDEX citations_source_idx ON citations(source_id);
CREATE INDEX images_building_idx ON images(building_id);
CREATE VIEW published_building_summary AS
 SELECT b.id,b.name,b.slug,b.summary,b.date_label,s.name AS site,t.name AS building_type
 FROM buildings b JOIN sites s ON s.id=b.site_id JOIN building_types t ON t.id=b.type_id WHERE b.status='published';

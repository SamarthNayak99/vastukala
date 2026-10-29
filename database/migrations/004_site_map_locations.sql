ALTER TABLE sites ADD COLUMN map_latitude numeric CHECK(map_latitude BETWEEN -90 AND 90);
ALTER TABLE sites ADD COLUMN map_longitude numeric CHECK(map_longitude BETWEEN -180 AND 180);
ALTER TABLE sites ADD COLUMN map_source_url text;

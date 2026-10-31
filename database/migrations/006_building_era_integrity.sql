ALTER TABLE buildings ADD CONSTRAINT buildings_year_from_no_zero CHECK(year_from IS NULL OR year_from<>0);
ALTER TABLE buildings ADD CONSTRAINT buildings_year_to_no_zero CHECK(year_to IS NULL OR year_to<>0);

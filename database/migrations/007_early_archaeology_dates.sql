ALTER TABLE building_events
 DROP CONSTRAINT building_events_year_from_check,
 DROP CONSTRAINT building_events_year_to_check,
 ADD CONSTRAINT building_events_year_from_check CHECK(year_from BETWEEN -4000 AND 2100 AND year_from<>0),
 ADD CONSTRAINT building_events_year_to_check CHECK(year_to BETWEEN -4000 AND 2100 AND year_to<>0);

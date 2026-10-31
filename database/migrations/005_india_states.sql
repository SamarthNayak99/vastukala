CREATE TABLE states (
 name text PRIMARY KEY,
 kind text NOT NULL CHECK(kind IN ('state','union territory'))
);
INSERT INTO states(name,kind) VALUES
('Andhra Pradesh','state'),('Arunachal Pradesh','state'),('Assam','state'),('Bihar','state'),('Chhattisgarh','state'),('Goa','state'),('Gujarat','state'),('Haryana','state'),('Himachal Pradesh','state'),('Jharkhand','state'),('Karnataka','state'),('Kerala','state'),('Madhya Pradesh','state'),('Maharashtra','state'),('Manipur','state'),('Meghalaya','state'),('Mizoram','state'),('Nagaland','state'),('Odisha','state'),('Punjab','state'),('Rajasthan','state'),('Sikkim','state'),('Tamil Nadu','state'),('Telangana','state'),('Tripura','state'),('Uttar Pradesh','state'),('Uttarakhand','state'),('West Bengal','state'),
('Andaman and Nicobar Islands','union territory'),('Chandigarh','union territory'),('Dadra and Nagar Haveli and Daman and Diu','union territory'),('Delhi','union territory'),('Jammu and Kashmir','union territory'),('Ladakh','union territory'),('Lakshadweep','union territory'),('Puducherry','union territory');
ALTER TABLE sites ADD CONSTRAINT sites_state_fk FOREIGN KEY(state) REFERENCES states(name) ON DELETE RESTRICT;
CREATE INDEX sites_state_idx ON sites(state);
ALTER TABLE building_events DROP CONSTRAINT building_events_year_from_check;
ALTER TABLE building_events DROP CONSTRAINT building_events_year_to_check;
ALTER TABLE building_events ADD CONSTRAINT building_events_year_from_check CHECK(year_from BETWEEN -1000 AND 2100 AND year_from<>0);
ALTER TABLE building_events ADD CONSTRAINT building_events_year_to_check CHECK(year_to BETWEEN -1000 AND 2100 AND year_to<>0);

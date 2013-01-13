CREATE TABLE crimes (
       _key			serial				not null	primary key,
       incident_timestamp	timestamp with time zone 	not null,
       reported_timestamp	timestamp with time zone 	not null,
       case_number		varchar(40)    			not null,
       street_address		varchar(255)			not null,
       city			varchar(80)			not null,
       zipcode			varchar(10)			not null,
       beat			integer,
       crime			varchar(40)			not null,
       category			integer				not null,
       division			varchar(40)			not null,
       sector			integer,
       incident_beat		integer,
       lat			real				not null,
       lon			real				not null,
       neighborhood		varchar(80)
);

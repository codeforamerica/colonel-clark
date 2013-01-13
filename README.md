# Louisville Neighborhood Crime Watch
## January Test Application: 2013 Code for America 


This application builds on data available from the City of Louisville's website by presenting information about crime at the neighborhood level. This public facing portal is designed to connect citizens with information about crime in their communities in simple, relevant ways using langage and geographies they use everyday.

Currently, the City of Louisville Open Data mapping portal visualizes crime information by administrative boundaries such as "beat"and "sector". By converting incident addresses into neighborhoods and simplifying aggregated data, crime information becomes more useful for citizens, newcomers, and grassroots groups organized around neighborhoods. 

Features:
* The **heat map** allows users to quickly understand the relative instances of crime across Louisville's neighborhoods. 
* The **neighborhood** spotlight provides a view into the nature of crime in the neighborhood during the period for which the City has published data. 
* The **subscription** feature connects users with what's going on in their neighborhood on a weekly basis, providing an easily accessible summary of events and linking them back to the site for additional information. 


## Development Setup

Please follow the instructions below to setup your development environment. In case you run into issues, please consult the [FAQ](#faq).

### For Mac OS X 10.8

1) Download the PostgreSQL database server from http://postgresapp.com/ and install it.

2) Create the PostgreSQL database and role (aka user).

    $ createuser -h localhost -DPSR bp
    $ createdb -h localhost -O bp louisville_crime

3) Enable PostGIS extension for the database.

    $ psql -h localhost louisville_crime

    louisville_crime=# CREATE EXTENSION postgis;

4) Clone this repository onto your local development machine:

    $ git clone <REPLACE THIS WITH REPO CLONE LOCATION>
    $ cd colonel-clark

5) Install dependencies.

    $ npm install

6) Setup database schema.

    $ node db/migrator.js

7) Start the REST API server.

    $ node api/server.js

## Directory Layout

This is the layout of directories relative to the current one (i.e. the one housing this README.md file).
* `api`: Contains code for the REST API.
* `bin`: Contains executable scripts to run by a human user. E.g.: command-line interfaces, etc.
* `config`: Contains application configuration files.
* `cron`: Contains executable scripts to be run periodically and automatically by a scheduler like cron.
* `db`: Contains database schema migration scripts.
* `lib`: Contains code that could be re-used by multiple application components. 
* `public`: Contains publicly-accessible, static code. E.g.: images, css, (browser-side) javascript, html, etc.
* `test`: Contains unit tests.

## FAQ

### When trying to enable the PostGIS extension in the database, I get this error: `ERROR:  could not load library ... Library not loaded: /usr/local/lib/libjpeg.8.dylib ...`. How do I fix this?
This error occurs when `libjpeg` is not installed on your computer. Here are a few ways to install `libjpeg` on your computer:
* Using [Homebrew](http://mxcl.github.com/homebrew/): `$ brew install libjpeg`
* From source (i.e. manually): follow the instructions [here](http://arcoleo.org/dsawiki/Wiki.jsp?page=How%20to%20Install%20Libjpeg%20on%20Mac#section-How+to+Install+Libjpeg+on+Mac-Manual).


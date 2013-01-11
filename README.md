# Colonel Clark
### January test application for 2013 Code for America Fellowship Louisville team

This web application allows citizens of Louisville to view aggregate crime statitics for their neighborhoods. It also allows them to sign up for periodic email alerts for new crimes in their neighborhoods.

## Development Setup (for Mac OS X 10.8)

1) Download the PostgreSQL database server from http://postgresapp.com/ and install it.

2) Create the PostgreSQL database and role (aka user).

    $ createuser -h localhost -DPSR bp
    $ createdb -h localhost -O bp louisville_crime

3) Clone this repository onto your local development machine:

    $ git clone ...
    $ cd colonel-clark

4) Install dependencies.

    $ npm install

5) Start the server. This will serve up the API as well as the web app.

    $ node app.js

## Directory Layout

This is the layout of directories relative to the current one (i.e. the one housing this README.md file).
* `public`: Contains publicly-accessible, static code. E.g.: images, css, (browser-side) javascript, html, etc.
* `bin`: Contains executable scripts to run by a human user. E.g.: command-line interfaces, etc.
* `cron`: Contains executable scripts to be run periodically and automatically by a scheduler like cron.
* `test`: Contains unit tests.
* `api`: Contains code for the REST API.

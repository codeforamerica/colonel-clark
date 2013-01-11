var postgrator = require('postgrator'),
    fs = require('fs');;

var migrationsDir = __dirname + '/migrations';

var applyMigrations = function(migrationId) {

    console.log("Target migration = " + migrationId);
    
    postgrator.setMigrationDirectory(__dirname + '/migrations');
    postgrator.setConnectionString("tcp://bp:bp@localhost/louisville_crime");
    postgrator.migrate(migrationId, function(err, migrationsRun) {
	if (err) {
	    console.error("Error: " + err);
	    process.exit(2);
	}
    });

}

var targetMigrationId = -1;
if (process.argv.length === 3) {

    // If target migration is specified at the commandline, use that.

    targetMigrationId = parseInt(process.argv[2]);

    if (targetMigrationId === NaN) {
	console.error('Error: migration specified must be numeric.');
	process.exit(1);
    }

    applyMigrations(targetMigrationId);

} else {

    // Else, try to figure out the latest migration and make that the target migration.

    fs.readdir(migrationsDir, function(err, filenames) {
	
	var migrationIds = [];
	for (index in filenames) {
	    var filename = filenames[index];
	    var match = filename.match(/(.*)\.do\.sql$/);
	    if (match) {
		var migrationId = match[1];
		migrationIds.push(parseInt(migrationId));
	    }
	}
	
	migrationIds = migrationIds.sort(function(a,b) { return b - a });
	targetMigrationId = migrationIds[0];
	
	applyMigrations(targetMigrationId);
		
    });
}



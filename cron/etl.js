var extractor = require(__dirname + '/../lib/extractor'),
    transformer = require(__dirname + '/../lib/transformer'),
    loader = require(__dirname + '/../lib/loader'),
    config = require('config');

// If there is a specific day this process should be run, exit if today is not that day
// This logic is here because Heroku cannot schedule at the weekly granularity.
if (process.env.RUN_DAY
    && ((new Date()).getDay() !== parseInt(process.env.RUN_DAY))) {

    console.info("Skipping run since today is not the day to run this");
    process.exit(0);

}

var e = extractor.createExtractor(config.extractor_source_url);
var t = transformer.createTransformer();
var l = loader.createLoader(process.env.DATABASE_URL || config.db_connection_string);

t.setLoader(l);
e.setTransformer(t);
e.run();

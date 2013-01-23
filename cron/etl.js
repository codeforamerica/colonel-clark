var extractor = require(__dirname + '/../lib/extractor'),
    transformer = require(__dirname + '/../lib/transformer'),
    loader = require(__dirname + '/../lib/loader'),
    config = require('config');

var e = extractor.createExtractor(config.extractor_source_url);
var t = transformer.createTransformer();
var l = loader.createLoader(process.env.DATABASE_URL || config.db_connection_string);

t.setLoader(l);
e.setTransformer(t);
e.run();

var extractor = require(__dirname + '/../lib/extractor'),
    transformer = require(__dirname + '/../lib/transformer'),
    loader = require(__dirname + '/../lib/loader');

var e = extractor.createExtractor('http://localhost/~shaunak/CrimeData.txt');
var t = transformer.createTransformer();
var l = loader.createLoader('tcp://bp:bp@localhost/louisville_crime');

t.setLoader(l);
e.setTransformer(t);
e.run();

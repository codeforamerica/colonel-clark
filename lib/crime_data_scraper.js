var nodeio = require('node.io');

exports.uriFrom = function(page_number) {
    page_number = page_number || 0;

    // TODO: Move to config
    switch(process.env.APP_ENV) {
	case 'production':
	  return 'http://portal.louisvilleky.gov/';
	  break;
	case 'development':
	default:
	  return 'http://localhost/~shaunak/crime_data_page_' + page_number + '.html';
	  break;
    }

};

exports.job = new nodeio.Job({

    input: false,

    run: function(pageNumber) {
	var uri = exports.uriFrom(pageNumber);

	this.getHtml(uri, function(err, $) {

	    if (err) {
		this.exit();
	    }

	    var rows = $('tbody tr');
	    var results = [];

	    rows.each(function(row) {

		record = {};

		row.children.each(function(cell) {
		    fieldClass = cell.attribs.class;
		    var matches = fieldClass.match(/views-field-(.*)$/);

		    record[matches[1]] = cell.text;

		}); // each cell

		results.push(record);

	    }); // each rows

	    this.emit(results);

	}); // getHtml

    }

});

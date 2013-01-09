var nodeio = require('node.io');
exports.job = new nodeio.Job({

    timeout:  10,        // How long should we wait before giving up on the origin server
    max: 20,             // Max. concurrent requests to the origin server
    wait: 1,             // Delay between requests to the origin server
    input: [0, 1], // Page numbers (TODO: Make dynamic)

    // This method will be called for each element in "input" above.
    run: function(page_number) {
	// var url = "http://portal.louisvilleky.gov/dataset/crime-data?Address=&Beat=&IncidentDate[min]=&IncidentDate[max]=&ZipCode=&items_per_page=25&page=" + page_number;
	var url = "http://localhost/~shaunak/crime_data_page_" + page_number + ".html";
	this.getHtml(url, function(err, $, data, headers) {
	    if (err)
		this.exit(err);

	    var field_map = {
		'IncidentDate': 'incident_date',
		'DateReported': 'date_reported',
		'TimeReported': 'time_reported',
		'CaseNumber':   'case_number',
		'Address':      'address',
		'City':         'city',
		'ZipCode':      'zip_code',
		'Beat':         'beat',
		'Crime':        'crime',
		'Category':     'category',
		'Division':     'division',
		'Sector':       'sector',
		'IncidentBeat': 'incident_beat'
	    };

	    var rows = [];
	    $('tbody tr').each(function(tr) {
		var row = {};
		tr.children.each(function(td) {

		    var c=td.attribs.class;

		    for (src_field in field_map) {
			dest_field = field_map[src_field];
			var regex = new RegExp(src_field + '$');
			if (c.match(regex)) {
			    row[dest_field] = td.text;
			}
		    }

		});

		rows.push(row);
	    });
	
	    this.emit(rows);

	});
    }

});

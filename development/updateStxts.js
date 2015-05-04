"use strict";

var cbc = require('communibase-connector-js').clone(process.env.STXT_API_KEY);
var fs = require('fs');

cbc.getAll('Stxt').then(function (stxts) {
	var countryCodes = {};

	stxts.forEach(function (stxt) {
		if (stxt.key.indexOf('Address.countryCode.') === -1 || stxt.administrationId) {
			return;
		}

		if (!countryCodes[stxt.language]) {
			countryCodes[stxt.language] = {};
		}

		countryCodes[stxt.language][stxt.key.substr(-2)] = stxt.value;
	});

	fs.writeFileSync(__dirname + '/../inc/countryCodeStxt.json', JSON.stringify(countryCodes));
	console.log('updated country code stxts');
}, function (err) {
	throw err;
});
'use strict';

var BaseSerializer = require('./Base.js');
var fs = require('fs');
var stxtFile = JSON.parse(fs.readFileSync(__dirname + '/../inc/countryCodeStxt.json'));

module.exports = function (entityTypeTitle, document, requestedPaths) {
	var countryCodes = stxtFile[this.language];

	return BaseSerializer.apply(this, arguments).then(function (templateData) {
		if (requestedPaths.indexOf('country') !== -1) {
			templateData.country = countryCodes[document.countryCode] || document.countryCode;
		}
		if (requestedPaths.indexOf('notNl') !== -1) {
			templateData.notNl = document.countryCode !== 'NL';
		}

		return templateData;
	});
};
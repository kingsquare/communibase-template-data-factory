'use strict';

var BaseSerializer = require('./Base.js');
var fs = require('fs');
var stxtFile = JSON.parse(fs.readFileSync(__dirname + '/../inc/countryCodeStxt.json'));

module.exports = function (entityTypeTitle, document, requestedPaths) {
	var countryCodes = stxtFile[this.language];
	var allVariablesAreRequested = (requestedPaths.length === 1 && requestedPaths[0].substring(0, 1) === '#');

	return BaseSerializer.apply(this, arguments).then(function (templateData) {
		if (allVariablesAreRequested || requestedPaths.indexOf('country') !== -1) {
			templateData.country = countryCodes[document.countryCode] || document.countryCode;
		}
		if (allVariablesAreRequested || requestedPaths.indexOf('notNl') !== -1) {
			templateData.notNl = document.countryCode !== 'NL';
		}

		return templateData;
	});
};
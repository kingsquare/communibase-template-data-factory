'use strict';

var BaseSerializer = require('./Base.js');
var countryCodes = {
	'NL': 'Nederland'
};

module.exports = function (entityTypeTitle, document, requestedPaths) {
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
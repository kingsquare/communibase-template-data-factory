'use strict';

var BaseSerializer = require('./Base.js');
var countryCodes = {
	'NL': 'Nederland'
};

module.exports = function (entityTypeTitle, document, nestLevel) {
	return BaseSerializer.apply(this, arguments).then(function (templateData) {
		templateData.country = countryCodes[templateData.countryCode] || templateData.countryCode;
		templateData.notNl = templateData.countryCode !== 'NL';
		return templateData;
	});
};
'use strict';

var BaseSerializer = require('./Base.js');

module.exports = {
	titleFields: ['property','street','streetNumber','streetNumberAddition','zipcode','city','countryCode','{{ - }}',
		'{type}'],

	getPromiseByPaths: function (entityTypeTitle, document, requestedPaths, parents) {
		var self = this;
		var allVariablesAreRequested = (requestedPaths.length === 1 && requestedPaths[0].substring(0, 1) === '#');

		return BaseSerializer.getPromiseByPaths.apply(this, arguments).then(function (templateData) {
			if (allVariablesAreRequested || requestedPaths.indexOf('country') !== -1) {
				templateData.country = self.stxt['Address.countryCode.' + document.countryCode] || document.countryCode;
			}
			if (allVariablesAreRequested || requestedPaths.indexOf('notNl') !== -1) {
				templateData.notNl = document.countryCode !== 'NL';
			}

			return templateData;
		});
	}
};
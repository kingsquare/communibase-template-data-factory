'use strict';

var BaseSerializer = require('./Base.js');

module.exports = {
	titleFields: ['number','{{ - }}','companyId','personId','{{ - }}','addressReference'],

	getPromiseByPaths: function (entityTypeTitle, document, requestedPaths) {
		var self = this;
		var allVariablesAreRequested = (requestedPaths.length === 1 && requestedPaths[0].substring(0, 1) === '#');

		return BaseSerializer.getPromiseByPaths.apply(this, arguments).then(function (templateData) {
			if (!allVariablesAreRequested && requestedPaths.indexOf('salutation') === -1) {
				return templateData;
			}

			templateData.salutation = 'Geachte crediteurenadministratie,';
			return self.cbc.getById('Person', document.personId).then(function (person) {
				if (person.salutation) {
					templateData.salutation = person.salutation;
				}
				return templateData;
			}).catch(function () {
				return templateData;
			});
		});
	}
};
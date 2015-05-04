'use strict';

var BaseSerializer = require('./Base.js');

module.exports = function (entityTypeTitle, document, requestedPaths) {
	var self = this;
	return BaseSerializer.apply(this, arguments).then(function (templateData) {
		if (requestedPaths.indexOf('salutation') === -1) {
			return templateData;
		}

		templateData.salutation = 'Geachte crediteurenadministratie,';
		return self.cbc.getById('Person', document.personId).then(function (person) {
			if (person.salutation) {
				templateData.salutation = person.salutation;
			}
			return templateData;
		}, function () {
			return templateData;
		});
	});
};
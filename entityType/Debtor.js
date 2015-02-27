'use strict';

var BaseSerializer = require('./Base.js');

module.exports = function (entityTypeTitle, document, nestLevel) {
	var self = this;
	return BaseSerializer.apply(this, arguments).then(function (templateData) {
		templateData.salutation = 'Geachte crediteurenadministratie,';
		return self.cbc.getById('Person', templateData.personId).then(function (person) {
			if (person.salutation) {
				templateData.salutation = person.salutation;
			}
			return templateData;
		}, function () {
			return templateData;
		});
	});
};
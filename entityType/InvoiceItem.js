'use strict';

var BaseSerializer = require('./Base.js');

module.exports = function (entityTypeTitle, document, nestLevel) {
	return BaseSerializer.apply(this, arguments).then(function (templateData) {
		var taxMultiplier = ((100 + (templateData.taxPercentage || 0)) / 100);
		templateData.totalEx = templateData.quantity * templateData.pricePerUnit;
		templateData.totalIn = templateData.totalEx * taxMultiplier;
		templateData.totalPerUnitEx = templateData.pricePerUnit;
		templateData.totalPerUnitIn = templateData.pricePerUnit * taxMultiplier;
		templateData.title = templateData.description;
		return templateData;
	});
};
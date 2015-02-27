'use strict';

var BaseSerializer = require('./Base.js');
var when = require('when');

module.exports = function (entityTypeTitle, document, nestLevel) {
	var self = this;

	return BaseSerializer.apply(this, arguments).then(function (templateData) {
		return when.all([
			self.cbc.getByRef(document).otherwise(function () {}),
			self.cbc.getById(templateData.rootDocumentEntityType, templateData.rootDocumentId).otherwise(function () {})
		]).spread(function (referredDocument, rootDocument) {
			templateData.document = referredDocument;
			if (!rootDocument) {
				return templateData;
			}
			return self.getPromise(templateData.rootDocumentEntityType, rootDocument, nestLevel + 1).then(
					function (rootDocumentTemplateData) {
				templateData.rootDocument = rootDocumentTemplateData;
				return templateData;
			}, function () {
				return templateData;
			});
		});
	});
};
'use strict';

var BaseSerializer = require('./Base.js');
var when = require('when');

module.exports = function (entityTypeTitle, document, requestedPaths) {
	var self = this;

	return BaseSerializer.apply(this, arguments).then(function (templateData) {
		var requestedSubVariables = self.getRequestedSubVariables(requestedPaths, 'rootDocument');
		if (requestedSubVariables.length === 0) {
			return templateData;
		}

		return when.all([
			self.cbc.getByRef(document).otherwise(function () {}),
			self.cbc.getById(document.rootDocumentEntityType, document.rootDocumentId).otherwise(function () {})
		]).spread(function (referredDocument, rootDocument) {
			templateData.document = referredDocument;
			if (!rootDocument) {
				return templateData;
			}
			return self.getPromise(document.rootDocumentEntityType, rootDocument, requestedSubVariables).then(
					function (rootDocumentTemplateData) {
				templateData.rootDocument = rootDocumentTemplateData;
				return templateData;
			}, function () {
				return templateData;
			});
		});
	});
};
'use strict';

var Promise = require('bluebird');
var BaseSerializer = require('./Base.js');
var helpers = require('../inc/helpers.js');

module.exports = {
	_getTitlePromise: function(titleFields, entityTypeTitle, document) {
		var self = this;

		//document-references do not have a regular ID: make one up based on the title!
		//empty DocumentReference may have a manually set name, e.g. "<< Zie specificatie >>"
		if (document._title) {
			return Promise.resolve([document._title]);
		}

		if (!document) {
			return Promise.resolve(["<< Zie specificatie >>"]);
		}

		var rootDocumentEntityType = document.rootDocumentEntityType;
		if (!rootDocumentEntityType) {
			return Promise.resolve(["<< Zie specificatie >>"]);
		}

		var title = 'Verwijzing naar ';
		title += (this.stxt[rootDocumentEntityType] || rootDocumentEntityType) + ' - ' + document.rootDocumentId;

		if (document.path && document.path.forEach) {
			document.path.forEach(function (nibble) {
				if (nibble && nibble.field && nibble.objectId) {
					title += ' - ' + (self.stxt[nibble.field] || nibble.field) + ' - ' + nibble.objectId;
				}
			});
		}
		return Promise.resolve([title]);
	},

	getPromiseByPaths: function (entityTypeTitle, document, requestedPaths, parents) {
		var self = this;
		return BaseSerializer.getPromiseByPaths.apply(this, arguments).then(function (templateData) {
			var rootDocumentPaths = helpers.getRequestedSubVariables(requestedPaths, 'rootDocument');
			if (rootDocumentPaths.length === 0) {
				return templateData;
			}

			var rootDocumentEntityTypeNibbles = document.rootDocumentEntityType.split('.');
			var parentPromise = ((rootDocumentEntityTypeNibbles[0] === 'parent') ?
				Promise.resolve(parents[rootDocumentEntityTypeNibbles.length - 1]) :
				self.cbc.getById(document.rootDocumentEntityType, document.rootDocumentId));
			return parentPromise.then(function (parent) {
				return self.getPromiseByPaths(parent.__cb_type__, parent, rootDocumentPaths, []);
			}).then(function (rootDocumentData) {
				templateData.rootDocument = rootDocumentData;
				return templateData;
			});
		});
	}
};
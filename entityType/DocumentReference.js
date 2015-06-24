/*global Promise:true */

'use strict';

var Promise = require('bluebird');

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
		document.path.forEach(function (nibble) {
			if (nibble && nibble.field && nibble.objectId) {
				title += ' - ' + (self.stxt[nibble.field] || nibble.field) + ' - ' + nibble.objectId;
			}
		});
		return Promise.resolve([title]);
	}
};
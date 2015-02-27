'use strict';
var fs = require('fs');

var entitiySerializers = {};
fs.readdirSync(__dirname + '/entityType').forEach(function (enityTypeFile) {
	entitiySerializers[enityTypeFile.substr(0, enityTypeFile.length - 3)] =
			require(__dirname + 'entityType/' + enityTypeFile);
});

module.exports = function (config) {
	this.cbc = config.cbc || require('communibase-connector-js');
	this.maxNestLevel = config.maxNestLevel || 5;
	this.entitiesHashPromise = this.cbc.getAll('EntityType').then(function (entities) {
		var entitiesHash = {};
		entities.forEach(function (entity) {
			entitiesHash[entity.title] = entity;
		});
		return entitiesHash;
	});

	/**
	 * Returns all data to be assign to template, based on the wizard-source object
	 * @param {String} entityTypeTitle - The entity type (i.e. Person, Shift, etc)
	 * @param {Object} document - The actual document (entity) instance which should be templatified
	 * @param {Number} [nestLevel] - Optional current nesting-level to prevent infinite loops. Requests will queue
	 * if nesting level is undefined to fix https://trello.com/c/Ia8QR75d/652-opstellen-herinneringen-blijft-hangen-op-
	 * @returns {Object}
	 */
	this.getPromise = function (entityTypeTitle, document, nestLevel) {
		var serializer = (entitiySerializers[entityTypeTitle] ?
				entitiySerializers[entityTypeTitle] :
				entitiySerializers.Base);
		return serializer.apply(this, arguments);
	};
};

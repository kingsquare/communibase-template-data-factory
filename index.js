'use strict';
var fs = require('fs');

/**
 * Gets all requested paths based on the given template. When inserting:
 * {{invoiceNumber}} - {{#invoiceItems}} {{totalEx}} {{/invoiceItems}}
 * It should return:
 * ["invoiceNumber", "invoiceItems.#.totalEx"]
 * @param node
 * @returns {Array} result - The requested paths
 */
function getPaths (node) {
	var result = [];

	switch (node.type) {
		// E.g. "date" / "debtor.debtorNumber"
		case 'ID':
			result.push(node.parts.join('.'));
			break;

		case 'program':
			node.statements.forEach(function (statement) {
				getPaths(statement).forEach(function (variable) {
					result.push(variable);
				});
			});
			break;

		// E.g. #each / #if / #compare / "#invoiceItems" / "#ifIsCredit"
		case 'block':
			var blockKeys = getPaths(node.mustache);

			if ((!node.mustache.isHelper || node.mustache.id.string === 'each') && node.program) {
				getPaths(node.program).forEach(function (subValue) {
					result.push(blockKeys[0] + '.#.' + subValue);
				});
				break;
			}

			result = blockKeys;

			if (node.program) {
				getPaths(node.program).forEach(function (variable) {
					result.push(variable);
				});
			}
			break;

		// E.g. "{{#compare person.gender 'M'}}"
		case 'mustache':
			if (!node.isHelper) {
				result.push(node.id.parts.join('.'));
				break;
			}

			node.params.forEach(function (param) {
				getPaths(param).forEach(function (variable) {
					result.push(variable);
				});
			});
			break;
	}

	return result;
}

var entitiySerializers = {};
fs.readdirSync(__dirname + '/entityType').forEach(function (enityTypeFile) {
	entitiySerializers[enityTypeFile.substr(0, enityTypeFile.length - 3)] =
			require(__dirname + '/entityType/' + enityTypeFile);
});

module.exports = function (config) {
	this.cbc = config.cbc || require('communibase-connector-js');
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
	 * @param {Handlebars.ProgramNode} template - The template this is based on
	 * @returns {Promise}
	 */
	this.getPromise = function (entityTypeTitle, document, template) {
		return this.getPromiseByPaths(entityTypeTitle, document, getPaths(template));
	};

	/**
	 * Returns all data to be assigned to template, based on the requested variables / paths
	 * @param {String} entityTypeTitle - The entity type (i.e. Person, Shift, etc)
	 * @param {Object} document - The actual document (entity) instance which should be templatified
	 * @param {Array} requestedPaths - An array of all values that are requested from the document
	 * @returns {Promise}
	 */
	this.getPromiseByPaths = function (entityTypeTitle, document, requestedPaths) {
		var serializer = (entitiySerializers[entityTypeTitle] ?
				entitiySerializers[entityTypeTitle] :
				entitiySerializers.Base);
		return serializer.apply(this, arguments);
	};
};

/*global require: false */

'use strict';

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

	if (!node || !node.type) {
		return result;
	}

	switch (node.type.toLowerCase()) {
		// E.g. "date" / "debtor.debtorNumber"
		case 'id':
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

var Promise = require('bluebird');

var entitySerializers = {
	Base: require('./entityType/Base.js'),
	Address: require('./entityType/Address.js'),
	Company: require('./entityType/Company.js'),
	Contact: require('./entityType/Contact.js'),
	ContactPersonMatchResult: require('./entityType/ContactPersonMatchResult.js'),
	Debtor: require('./entityType/Debtor.js'),
	DocumentReference: require('./entityType/DocumentReference.js'),
	EmailAddress: require('./entityType/EmailAddress.js'),
	EndpointDescription: require('./entityType/EndpointDescription.js'),
	Event: require('./entityType/Event.js'),
	File: require('./entityType/File.js'),
	Invoice: require('./entityType/Invoice.js'),
	InvoiceItem: require('./entityType/InvoiceItem.js'),
	Membership: require('./entityType/Membership.js'),
	Merchant: require('./entityType/Merchant.js'),
	MerchantData: require('./entityType/MerchantData.js'),
	Participant: require('./entityType/Participant.js'),
	PeriodicTariffList: require('./entityType/PeriodicTariffList.js'),
	Person: require('./entityType/Person.js'),
	PhoneNumber: require('./entityType/PhoneNumber.js'),
	Position: require('./entityType/Position.js'),
	PropertyAccessDescription: require('./entityType/PropertyAccessDescription.js'),
	TariffDecay: require('./entityType/TariffDecay.js'),
	User: require('./entityType/User.js'),
	VersionInformation: require('./entityType/VersionInformation.js')
};

function getCorrespondingSerializer(entityTypeTitle, propertyName) {
	return (entitySerializers[entityTypeTitle] && entitySerializers[entityTypeTitle][propertyName] ?
		entitySerializers[entityTypeTitle][propertyName] :
		entitySerializers.Base[propertyName]);
}

module.exports = function (config) {
	this.cbc = config.cbc || require('communibase-connector-js');
	this.stxt = config.stxt || {};

	/**
	 * Returns all data to be assign to template, based on the wizard-source object
	 * @param {String} entityTypeTitle - The entity type (i.e. Person, Shift, etc)
	 * @param {Object} document - The actual document (entity) instance which should be templatified
	 * @param {Handlebars} template - The template this is based on
	 * @returns {Promise}
	 */
	this.getPromise = function (entityTypeTitle, document, template) {
		return this.getPromiseByPaths(entityTypeTitle, document, getPaths(template));
	};

	this.getEntitiesHashPromise = function () {
		if (!this.entitiesHashPromise) {
			this.entitiesHashPromise = this.cbc.getAll('EntityType').then(function (entities) {
				var entitiesHash = {};
				entities.forEach(function (entity) {
					entitiesHash[entity.title] = entity;
				});
				return entitiesHash;
			}).then(function (entitiesHash) {
				entitiesHash.File = {
					isResource: true
				};
				return entitiesHash;
			});
		}
		return this.entitiesHashPromise;
	}

	/**
	 * Returns all data to be assigned to template, based on the requested variables / paths
	 * @param {String} entityTypeTitle - The entity type (i.e. Person, Shift, etc)
	 * @param {Object} document - The actual document (entity) instance which should be templatified
	 * @param {Array} requestedPaths - An array of all values that are requested from the document
	 * @returns {Promise}
	 */
	this.getPromiseByPaths = function (entityTypeTitle, document, requestedPaths, parents) {
		var serializer = getCorrespondingSerializer(entityTypeTitle, 'getPromiseByPaths');
		return serializer.apply(this, arguments);
	};

	this.getTitlePromise = function(entityTypeTitle, document, parents) {
		var self = this;

		if (entityTypeTitle.substr(-9) === 'Reference' && entityTypeTitle !== 'DocumentReference') {
			if (!document) {
				return Promise.resolve('');
			}

			// get the document reference title!
			if (document.documentReference && document.documentReference.rootDocumentEntityType) {
				if (!parents) {
					parents = [];
				}
				var parentDocument = null;
				var rootDocumentEntityTypeNibbles = document.documentReference.rootDocumentEntityType.split('.');
				if (rootDocumentEntityTypeNibbles[0] === 'parent') {
					parents.unshift(document);
					parentDocument = parents[rootDocumentEntityTypeNibbles.length-1];
				}
				return this.cbc.getByRef(document.documentReference, parentDocument).then(function (ref) {
					return self.getTitlePromise.apply(self, [entityTypeTitle.substr(0, entityTypeTitle.length -9), ref, parents]);
				}).catch(function () {
					return Promise.resolve('<< Verwijderd >>');
				});
			}

			// get the subdocument title!
			var subDocument = document[entityTypeTitle[0].toLowerCase() + entityTypeTitle.substring(1, entityTypeTitle.length - 9)];
			if (!subDocument) {
				return Promise.resolve('');
			}

			return this.getTitlePromise.apply(this, [entityTypeTitle.substring(0, entityTypeTitle.length - 9), subDocument]);
		}

		var _getTitlePromise = getCorrespondingSerializer(entityTypeTitle, '_getTitlePromise');
		var titleFields = getCorrespondingSerializer(entityTypeTitle, 'titleFields');
		var composeTitle = getCorrespondingSerializer(entityTypeTitle, 'composeTitle');

		return _getTitlePromise.apply(this, [titleFields, entityTypeTitle, document]).then(function (titleParts) {
			return composeTitle.apply(self, [titleParts, entityTypeTitle, document]);
		}).catch(function (err) {
			// this should never happen!
			console.log(err);
			return Promise.resolve('- kon niet worden gevonden -');
		});
	};

	this.getPaths = getPaths;

	this.setStxt = function(stxt) {
		this.stxt = stxt;
	};
};

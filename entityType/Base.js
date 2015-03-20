'use strict';

var Promise = require('bluebird');
var _ = require('lodash');

module.exports = function (entityTypeTitle, document, nestLevel) {
	if (nestLevel === undefined) {
		nestLevel = 0;
	}

	if (!document || (nestLevel > this.maxNestLevel)) {
		return Promise().resolve({});
	}

	var result = { _id: document._id };
	var subPromises = [];
	var self = this;

	return this.entitiesHashPromise.then(function (entitiesHash) {
		var entityType = entitiesHash[entityTypeTitle];

		//Expose _ALL_ attributes (not just commmunibase fields): https://trello.com/c/9yKbd7Zg/460-wat-klopt-er-nie
		_.each(entityType.attributes, function (attribute) {
			var value = document[attribute.title], arrayItemPromises;

			if (_.contains([undefined, null, true, false], value) || _.isDate(value) || _.isNumber(value)) {
				result[attribute.title] = value;
				return;
			}

			if (_.isArray(value)) {
				if (attribute.ref) {
					result[attribute.title] = attribute.ref;

					if (!entitiesHash[attribute.ref] || (attribute.title.substr(-3) !== 'Ids')) {
						return;
					}

					//applicableForGroupIds => applicableForGroups
					result[attribute.title.substr(-3) + 's'] = [];
					subPromises.push(self.cbc.getByIds(attribute.ref, value).then(function (subDocuments) {
						var subSubPromises = [];
						_.each(subDocuments, function (subDocument) {
							subSubPromises.push(
								self.getPromise(attribute.ref, subDocument, (nestLevel + 1)).then(
									function (templateData) {
										result[attribute.title.substr(-3) + 's'].push(templateData);
									},
									function () { }
								)
							);
						});
						return Promise.all(subSubPromises);
					}, function() { result[attribute.title.substr(-3) + 's'] = null; }));
					return;
				}

				result[attribute.title] = [];
				//We need to maintain the array order --> process and add them in order of the original array!
				arrayItemPromises = [];
				_.each(value, function (subDocument) {
					//check for strings, e.g. Vasmo Company.classifications

					if (subDocument && entitiesHash[attribute.items]) {
						arrayItemPromises.push(self.getPromise(attribute.items, subDocument,
								(nestLevel + 1)));
						return;
					}
					//Not a document? push the raw value (string)
					arrayItemPromises.push(value);
				});

				//We need to maintain the array order --> process and add them in order of the original array!
				subPromises.push(Promise.all(arrayItemPromises).then(function (templateDatas) {
					result[attribute.title] = templateDatas;
				}));
				return;
			}

			if (entitiesHash[attribute.type]) {
				if ((attribute.type === 'DocumentReference') || (attribute.title.substr(-9) !== 'Reference')) {
					subPromises.push(self.getPromise(attribute.type, value, (nestLevel + 1)).then(
							function (templateData) {
								result[attribute.title] = templateData;
							}
					));
					return;
				}

				//something like membership.emailAddressReference
				var referredDocumentProperty = attribute.title.substr(0, (attribute.title.length - 9));
				if (value.documentReference) {
					subPromises.push(
						self.cbc.getByRef(value.documentReference, value).then(
							function (referredDocument) {
								result[referredDocumentProperty] = referredDocument;
							}, function () {
								result[referredDocumentProperty] = null;
							}
						)
					);
					return;
				}

				// a custom defined address / phoneNumber / emailAddress within a reference
				result[referredDocumentProperty] = value[referredDocumentProperty];
			}

			// Default key-value store
			result[attribute.title] = value;
			if (value === '') {
				return;
			}

			// A special ObjectId-string? --- enrich the template data!
			if (attribute.type === 'ObjectId' &&
					attribute.ref &&
					entitiesHash[attribute.ref] &&
					entitiesHash[attribute.ref].isResource &&
					attribute.title.substr(-2) === 'Id') {

				subPromises.push(self.cbc.getById(attribute.ref, value).then(function (referredObject) {
					return self.getPromise(attribute.ref, referredObject, nestLevel + 1).then(
						function (templateData) {
							result[attribute.title.substr(0, (attribute.title.length - 2))] = templateData;
						}
					);
				}, function () { }));
			}
		});

		return Promise.all(subPromises).then(function () {
			return result;
		});
	});
};
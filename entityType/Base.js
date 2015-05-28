/*global Promise: true */

'use strict';

var Promise = require('bluebird');
var helpers = require('../inc/helpers.js');

module.exports = function (entityTypeTitle, document, requestedPaths) {
	var result = {}, subPromises = [], self = this;

	return this.entitiesHashPromise.then(function (entitiesHash) {
		var entityType = entitiesHash[entityTypeTitle];

		//Expose _ALL_ attributes (not just commmunibase fields): https://trello.com/c/9yKbd7Zg/460-wat-klopt-er-nie
		entityType.attributes.forEach(function (attribute) {
			var value = document[attribute.title], type = attribute.type, arrayItemPromises,
				requestedSubVariables, fieldNameIsRequested;

			fieldNameIsRequested = requestedPaths.some(function (requestedPath) {
				return ((requestedPath.indexOf(attribute.title) === 0) || (requestedPath.substr(0, 1) === '#'));
			});

			if (fieldNameIsRequested && ([undefined, null, true, false].indexOf(value) !== -1 ||
				type === 'Date' || type === 'int' || type === 'float')) {
				result[attribute.title] = value;
				return;
			}

			if (!value) {
				return;
			}

			if (!type) {
				type = ((attribute.type && attribute.type.type) ? attribute.type.type : attribute.type);
			}

			if (Array.isArray(value)) {
				if (attribute.ref) {
					if (fieldNameIsRequested) {
						result[attribute.title] = attribute.ref;
					}

					if (!entitiesHash[attribute.ref] || (attribute.title.substr(-3) !== 'Ids')) {
						return;
					}
					//applicableForGroupIds => applicableForGroups
					requestedSubVariables = helpers.getRequestedSubVariables(requestedPaths, attribute.title.substr(-3) + 's');
					if (requestedSubVariables.length === 0) {
						return;
					}

					result[attribute.title.substr(-3) + 's'] = [];

					subPromises.push(self.cbc.getByIds(attribute.ref, value).then(function (referredObjects) {
						var subSubPromises = [];

						referredObjects.forEach(function (referredObject) {
							subSubPromises.push(self.getPromiseByPaths(attribute.ref, referredObject,
									requestedSubVariables).then(function (templateData) {
								result[attribute.title.substr(-3) + 's'].push(templateData);
							}));
						});
						return Promise.all(subSubPromises);
					}, function () { }));
					return;
				}

				requestedSubVariables = helpers.getRequestedSubVariables(requestedPaths, attribute.title);
				if (requestedSubVariables.length === 0) {
					return;
				}

				result[attribute.title] = [];
				//We need to maintain the array order --> process and add them in order of the original array!
				arrayItemPromises = [];
				var requestedSubValuesForAll = helpers.getRequestedSubVariables(requestedPaths, attribute.title + '.#');
				value.forEach(function (subDocument, index) {
					var specificSubValues = helpers.getRequestedSubVariables(requestedPaths, attribute.title + '.' +
						index).concat(requestedSubValuesForAll);

					if (specificSubValues.length === 0) {
						arrayItemPromises.push(Promise.resolve(undefined));
						return;
					}

					//check for strings, e.g. Vasmo Company.classifications
					if (subDocument && entitiesHash[attribute.items]) {
						arrayItemPromises.push(self.getPromiseByPaths(attribute.items, subDocument,
							specificSubValues));
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

			if (entitiesHash[type] || typeof value === 'object') {
				if ((type === 'DocumentReference') || (attribute.title.substr(-9) !== 'Reference')) {
					var referencedSubVariables = helpers.getRequestedSubVariables(requestedPaths, attribute.title);
					if (referencedSubVariables.length > 0) {
						subPromises.push(self.getPromiseByPaths(attribute.type, value, referencedSubVariables).then(
							function (templateData) {
								result[attribute.title] = templateData;
							}
						));
					}
					return;
				}
				//something like membership.emailAddressReference
				var referredDocumentProperty = attribute.title.substr(0, (attribute.title.length - 9));
				var referenceType = attribute.type.substr(0, (attribute.type.length - 9));
				requestedSubVariables = helpers.getRequestedSubVariables(requestedPaths, referredDocumentProperty);
				if (requestedSubVariables.length === 0) {
					return;
				}

				if (value.documentReference && value.documentReference.rootDocumentId) {
					subPromises.push(Promise.all([
						self.cbc.getByRef(value.documentReference).catch(function () {}),
						self.cbc.getById(document.rootDocumentEntityType, document.rootDocumentId).catch(function () {})
					]).spread(function (referredDocument, rootDocument) {
						if (!rootDocument) {
							return self.getPromiseByPaths(referenceType, referredDocument, requestedSubVariables)
								.then(function (templateData) {
									result[referredDocumentProperty] = templateData;
								}
							);
						}

						return self.getPromiseByPaths(document.rootDocumentEntityType, rootDocument,
							requestedSubVariables).then(function (rootDocumentTemplateData) {
								result[referredDocumentProperty] = rootDocumentTemplateData;
							}
						);
					}));
					return;
				}
				// a custom defined address / phoneNumber / emailAddress within a reference
				subPromises.push(self.getPromiseByPaths(referenceType, value[referredDocumentProperty],
					requestedSubVariables).then(function (templateData) {
						result[referredDocumentProperty] = templateData;
					})
				);
				return;
			}

			if (fieldNameIsRequested) {
				result[attribute.title] = value;
			}

			if (type === 'ObjectId') {
				if (attribute.ref && entitiesHash[attribute.ref] && entitiesHash[attribute.ref].isResource &&
						(attribute.title.substr(-2) === 'Id')) {
					requestedSubVariables = helpers.getRequestedSubVariables(requestedPaths,
						attribute.title.substr(0, (attribute.title.length - 2)));

					if (requestedSubVariables.length === 0) {
						return;
					}

					subPromises.push(self.cbc.getById(attribute.ref, value).then(function (referredObject) {
						return self.getPromiseByPaths(attribute.ref, referredObject, requestedSubVariables).then(
							function (templateData) {
								result[attribute.title.substr(0, (attribute.title.length - 2))] = templateData;
							}
						);
					}, function () { }));
				}
			}
		});

		return Promise.all(subPromises).then(function () {
			return result;
		});
	});
};
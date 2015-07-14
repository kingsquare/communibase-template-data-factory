'use strict';

var _ = require('lodash');
var Promise = require('bluebird');
var helpers = require('../inc/helpers.js');

var checkIfIsRequested = function (fieldName, requestedPaths) {
	return requestedPaths.some(function (requestedPath) {
		return ((requestedPath.indexOf(fieldName) === 0) || (requestedPath.substr(0, 1) === '#'));
	});
};

var convertIdToDate = function (record) {
	// http://stackoverflow.com/questions/6452021/getting-timestamp-from-mongodb-id
	return new Date(parseInt(record._id.substring(0, 8), 16) * 1000);
};

function getNewParents(parents, document) {
	var result = parents.slice(0);
	result.unshift(document);
	return result;
}

function log(e) {
	if (process && process.env && process.env.NODE_ENV && process.env.NODE_ENV === 'development' && console) {
		console.log(e);
	}
}

module.exports = {
	titleFields: ['title'],
	getPromiseByPaths: function (entityTypeTitle, document, requestedPaths, parents) {
		if (!parents) {
			parents = [];
		}
		var self = this;
		var result = {};
		var subPromises = [];

		return this.entitiesHashPromise.then(function (entitiesHash) {
			if (document._id && checkIfIsRequested('_id', requestedPaths)) {
				result._id = document._id;
			}

			// add title if requested
			if (checkIfIsRequested('_title', requestedPaths)) {
				subPromises.push(self.getTitlePromise.apply(self, [entityTypeTitle, document, parents]).then(function(title) {
					result._title = title;
				}));
			}

			// add updatedAt if requested
			if (checkIfIsRequested('updatedAt', requestedPaths) && document.updatedAt) {
				result.updatedAt = new Date(document.updatedAt);
			}

			if (checkIfIsRequested('_createdAt', requestedPaths) && document._id) {
				result._createdAt = convertIdToDate(document);
			}

			// add updatedBy if requested
			if (checkIfIsRequested('updatedBy', requestedPaths) && document.updatedBy) {
				result.updatedBy = document.updatedBy;
			}

			//Expose _ALL_ attributes (not just commmunibase fields): https://trello.com/c/9yKbd7Zg/460-wat-klopt-er-nie
			_.each(entitiesHash[entityTypeTitle].attributes, function (attribute) {
				var fieldNameIsRequested = checkIfIsRequested(attribute.title, requestedPaths);
				var type = attribute.type;
				if (!type) {
					type = ((attribute.type && attribute.type.type) ? attribute.type.type : attribute.type);
				}

				var isReference =  (
					(type === 'ObjectId' && attribute.ref && entitiesHash[attribute.ref] &&
							entitiesHash[attribute.ref].isResource && attribute.title.substr(-2) === 'Id') ||
					((attribute.title.substr(-9) === 'Reference') && (type !== 'DocumentReference'))
				);
				if (!fieldNameIsRequested && !isReference) {
					return;
				}

				var value = document[attribute.title];
				if (type === 'Date') {
					if (fieldNameIsRequested && value) {
						result[attribute.title] = new Date(value);
					}
					return;
				}
				if (type === 'Mixed') {
					if (fieldNameIsRequested && value) {
						result[attribute.title] = value;
					}
					return;
				}

				if ([undefined, null, true, false].indexOf(value) !== -1 || type === 'int' || type === 'float') {
					if (fieldNameIsRequested) {
						result[attribute.title] = value;
					}
					return;
				}

				if (Array.isArray(value)) {
					var requestedSubVariables;
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
								subSubPromises.push(self.getPromiseByPaths.apply(self, [attribute.ref, referredObject,
									requestedSubVariables, getNewParents(parents, document)]).then(function (templateData) {
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
					// We need to maintain the array order --> process and add them in order of the original array!
					var arrayItemPromises = [];
					var requestedSubValuesForAll = helpers.getRequestedSubVariables(requestedPaths, attribute.title + '.#');
					value.forEach(function (subDocument, index) {
						// if the whole subDocument is required (by e.g. person.addresses.1)
						if (_.contains(requestedSubVariables, index.toString())) {
							arrayItemPromises.push(Promise.resolve(subDocument));
							return;
						}

						var specificSubValues = helpers.getRequestedSubVariables(
								requestedPaths, attribute.title + '.' +	index).concat(requestedSubValuesForAll
						);

						if (specificSubValues.length === 0) {
							arrayItemPromises.push(Promise.resolve(undefined));
							return;
						}

						// check for strings, e.g. Vasmo Company.classifications
						if (subDocument && entitiesHash[attribute.items]) {
							arrayItemPromises.push(self.getPromiseByPaths.apply(self, [attribute.items, subDocument,
								specificSubValues, getNewParents(parents, document)]));
							return;
						}
						// Not a document? push the raw value (string)
						arrayItemPromises.push(value);
					});
					// We need to maintain the array order --> process and add them in order of the original array!
					subPromises.push(Promise.all(arrayItemPromises).then(function (templateDatas) {
						result[attribute.title] = templateDatas;
					}));
					return;
				}

				if (entitiesHash[type] || typeof value === 'object') {
					if (!isReference) {
						var referencedSubVariables = helpers.getRequestedSubVariables(requestedPaths, attribute.title);
						if (referencedSubVariables.length > 0) {
							subPromises.push(self.getPromiseByPaths.apply(self, [attribute.type, value,
									referencedSubVariables, getNewParents(parents, document)]).then(function (templateData) {
								result[attribute.title] = templateData;
							}));
						}
						return;
					}
					// something like membership.emailAddressReference

					// find the referenced values for e.g. emailAddressReference
					requestedSubVariables = helpers.getRequestedSubVariables(requestedPaths, attribute.title);
					if (requestedSubVariables.length !== 0) {
						subPromises.push(self.getPromiseByPaths(attribute.type, value, requestedSubVariables,
								getNewParents(parents, document)).then(function (templateData) {
							result[attribute.title] = templateData;
						}));
					}

					// also get the referenced values for e.g. emailAddress
					var referredDocumentProperty = attribute.title.substr(0, (attribute.title.length - 9));
					var referenceType = attribute.type.substr(0, (attribute.type.length - 9));
					requestedSubVariables = helpers.getRequestedSubVariables(requestedPaths, referredDocumentProperty);
					if (requestedSubVariables.length === 0) {
						return;
					}

					if (value.documentReference && value.documentReference.rootDocumentEntityType) {
						var parentDocument = null;
						var documentReference = value.documentReference;
						var rootDocumentEntityType = documentReference.rootDocumentEntityType;
						var rootDocumentEntityTypeNibbles = rootDocumentEntityType.split('.');
						if (rootDocumentEntityTypeNibbles[0] === 'parent') {
							// @todo findout why 3 ??
							parentDocument = parents[rootDocumentEntityTypeNibbles.length-3];
						}
						subPromises.push(self.cbc.getByRef(documentReference, parentDocument).then(
							function (referredDocument) {
								// Break the "parents-chain": the proper parent is resolved and does not have to
								// processed any further
								return self.getPromiseByPaths.apply(self, [referenceType, referredDocument,
										requestedSubVariables, []]).then(function (templateData) {
									result[referredDocumentProperty] = templateData;
								});
							}
						).catch(function (e) {
							log(e);
						}));
						return;
					}
					// a custom defined address / phoneNumber / emailAddress within a reference
					subPromises.push(self.getPromiseByPaths.apply(self, [referenceType, value[referredDocumentProperty],
							requestedSubVariables, getNewParents(parents, document)]).then(function (templateData) {
								result[referredDocumentProperty] = templateData;
							})
					);
					return;
				}

				if (fieldNameIsRequested) {
					result[attribute.title] = value;
				}

				if (type === 'ObjectId' && isReference) {
					requestedSubVariables = helpers.getRequestedSubVariables(requestedPaths,
						attribute.title.substr(0, (attribute.title.length - 2)));

					if (requestedSubVariables.length === 0) {
						return;
					}

					subPromises.push(self.cbc.getById(attribute.ref, value).then(function (referredObject) {
						return self.getPromiseByPaths.apply(self, [attribute.ref, referredObject,
							requestedSubVariables, getNewParents(parents, document)]).then(function (templateData) {
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
	},

	/**
	 * Overloadable to manipulate getTitle behaviour (e.g. memberships and phonenumbers)
	 * Newlines and tabs need to be removed for e.g. AddressReferenceCombos to work properly
	 *
	 * @param {Array} chunks
	 * @param {String} entityTitle
	 * @param {Object} document
	 * @return {string}
	 */
	composeTitle: function (chunks, entityTitle, document) {
		var id = document._id;
		var title = chunks.join(' ').trim().replace(/[ \r\n\t]+/g, ' ').replace(/ ,/g, ',');
		return (title.length > 0 ? title : ('<< ' + (id ?
			(this.stxt[entityTitle] || entityTitle) + ' ' + id :
			'Nieuw "' + (this.stxt[entityTitle] || entityTitle) + '" document ') + ' >>'));
	},

	/**
	 * Overloadable and preferable over .get('_title')
	 *
	 * @param titleFields
	 * @param entityTypeTitle
	 * @param document
	 * @returns {*|Promise}
	 * @private
	 */
	_getTitlePromise: function (titleFields, entityTypeTitle, document) {
		var self = this;
		var titlePartPromises = [];

		_.each(titleFields, function (titlePart) {
			// addresses will be added later on for companies
			if (entityTypeTitle === 'Company' && titlePart === 'addresses') {
				return;
			}

			if (titlePart.substr(0, 2) === '{{') {
				titlePartPromises.push(titlePart.substr(2, titlePart.length - 4));
				return;
			}

			var doTranslate = (titlePart.substr(0, 1) === '{');
			if (doTranslate) {
				// E.g. type from Address should be translated from Private to Privé in the title
				titlePart = titlePart.substr(0, titlePart.length - 1).substr(1);
			}

			var titlePartValue = document[titlePart];

			if (!titlePartValue && titlePartValue !== 0) {
				titlePartPromises.push('');
				return;
			}

			if (titlePart.substr(-2) === 'Id') {
				var modelName = titlePart[0].toUpperCase() + titlePart.substring(1, titlePart.length - 2);
				titlePartPromises.push(self.cbc.getById(modelName, titlePartValue).then(function (record) {
					if (!record) {
						return '';
					}
					return self.getTitlePromise.apply(self, [modelName, record]);
				}));
				return;
			}

			if (titlePart.substr(-9) === 'Reference') {
				if (!titlePartValue) {
					return;
				}

				var entityName = titlePart[0].toUpperCase() + titlePart.substring(1, titlePart.length - 9);

				if (titlePartValue.documentReference && titlePartValue.documentReference.rootDocumentEntityType) {
					// get the document reference title!
					var parentDocument = null;
					var rootDocumentEntityTypeNibbles = titlePartValue.documentReference.rootDocumentEntityType.split('.');
					if (rootDocumentEntityTypeNibbles[0] === 'parent') {
						parentDocument = parents[rootDocumentEntityTypeNibbles.length-1];
					}
					titlePartPromises.push(self.cbc.getByRef(titlePartValue.documentReference, parentDocument).then(function (ref) {
						return self.getTitlePromise.apply(self, [entityName, ref]);
					}).catch(function (e) {
						log(e);
						return Promise.resolve(['<< Verwijderd >>']);
					}));
					return;
				}

				// get the subdocument title!
				var subDocument = titlePartValue[titlePart.substring(0, titlePart.length - 9)];
				if (!subDocument) {
					return;
				}

				titlePartPromises.push(self.getTitlePromise.apply(self, [titlePart[0].toUpperCase() +
					titlePart.substring(1, titlePart.length - 9), subDocument]));
				return;
			}

			if (doTranslate) {
				titlePartValue = self.stxt[entityTypeTitle + '.' + titlePart + '.' + titlePartValue] ||	titlePartValue;
			}

			titlePartPromises.push(titlePartValue);
		});

		return Promise.all(titlePartPromises).catch(function (e) {
			log(e);
			return ['<< Onbekend, informatie ontbreekt >>'];
		});
	}
};
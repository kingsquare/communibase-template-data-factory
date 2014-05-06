_ = require('lodash');
when = require('when');

module.exports = function (options) {
	var cbc = (options.cbc ? options.cbc : require('communibase-connector-js'));
	var maxNestLevel = (options.maxNestLevel ? options.maxNestLevel : 5);

	var entitiesHashPromise = cbc.getAll('EntityType').then(function (entities) {
		var entitiesHash = {};
		_.each(entities, function (entity) {
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
	this.getTemplateData = function (entityTypeTitle, document, nestLevel) {
		var result = {}, subPromises = [], self = this;

		if (nestLevel === undefined) {
			nestLevel = 0;
		}

		if (nestLevel > 5) {
			return when({});
		}

		return entitiesHashPromise.then(function (entitiesHash) {
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
						subPromises.push(cbc.getByIds(entitiesHash[attribute.ref], value).then(function (subDocuments) {
							var subSubPromises = [];
							_.each(subDocuments, function (subDocument) {
								subSubPromises.push(
									self.getTemplateData(attribute.ref, subDocument, (nestLevel + 1)).then(
											function (templateData) {
												result[attribute.title.substr(-3) + 's'].push(templateData);
											}
									)
								);
							});
							return when.all(subSubPromises);
						}));
						return;
					}

					result[attribute.title] = [];
					//We need to maintain the array order --> process and add them in order of the original array!
					arrayItemPromises = [];
					_.each(value, function (subDocument) {
						//check for strings, e.g. Vasmo Company.classifications

						if (subDocument && entitiesHash[attribute.items]) {
							arrayItemPromises.push(self.getTemplateData(attribute.items, subDocument,
									(nestLevel + 1)));
							return;
						}
						//Not a document? push the raw value (string)
						arrayItemPromises.push(value);
					});

					//We need to maintain the array order --> process and add them in order of the original array!
					subPromises.push(when.all(arrayItemPromises).then(function (templateDatas) {
						result[attribute.title] = templateDatas;
					}));
					return;
				}

				if (entitiesHash[attribute.type]) {
					subPromises.push(self.getTemplateData(attribute.type, value, (nestLevel + 1)).then(
						function (templateData) {
							result[attribute.title] = templateData;
						}
					));
					return;
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

					subPromises.push(cbc.getById(attribute.ref, value).then(function (referredObject) {
						return self.getTemplateData(attribute.ref, referredObject, nestLevel + 1).then(
							function (templateData) {
								result[attribute.title.substr(0, (attribute.title.length - 2))] = templateData;
							}
						);
					}, function (err) {
						return when.resolve({});
					}));
				}
			});

			return when.all(subPromises).then(function () {
				return result;
			});
		});
	};
}
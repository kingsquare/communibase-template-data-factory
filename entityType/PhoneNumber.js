"use strict";

var BaseSerializer = require('./Base.js');

var formatSubscriberNumber = function (subscriberNumber) {
	//just to be sure no double spacing is applied...
	var spaceLessNumber = subscriberNumber.replace(/ /g, '');
	if (spaceLessNumber.length >= 6) {
		var spacePos = ((subscriberNumber.length <= 7) ? 3: (subscriberNumber.length - 4));
		//just to be sure no double spacing is applied...
		subscriberNumber = (spaceLessNumber.slice(0, spacePos) + ' ' + spaceLessNumber.slice(spacePos));
	}

	return subscriberNumber;
};


module.exports = {
	titleFields: ['countryCode','areaCode','subscriberNumber','{{ - }}','{type}'],

	/**
	 * Overloadable to manipulate getTitle behaviour
	 *
	 * @param {Array} chunks
	 * @param {String} entityTypeTitle
	 * @param {Object} document
	 * @return {string}
	 */
	composeTitle: function (chunks, entityTypeTitle, document) {
		if (chunks.length > 2) {
			chunks[chunks.length - 3] = formatSubscriberNumber(chunks[chunks.length - 3]);
		}

		return BaseSerializer.composeTitle.apply(this, arguments);
	},

	getPromiseByPaths: function (entityTypeTitle, phoneNumber, requestedPaths, parents) {
		var allVariablesAreRequested = (requestedPaths.length === 1 && requestedPaths[0].substring(0, 1) === '#');

		return BaseSerializer.getPromiseByPaths.apply(this, arguments).then(function (templateData) {
			if (allVariablesAreRequested || requestedPaths.indexOf('combined') !== -1) {
				templateData.combined = phoneNumber.countryCode + phoneNumber.areaCode + phoneNumber.subscriberNumber;
			}

			return templateData;
		});
	}
};
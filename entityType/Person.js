'use strict';

var _ = require('lodash');
var BaseSerializer = require('./Base.js');
var Promise = require('bluebird');

module.exports = {
	titleFields: ['firstName','initials','middleName','lastName','maidenName'],
	composeTitle: function (chunks, entityTitle, document) {
		//Maiden name available: add the - but no spaces https://onzetaal.nl/taaladvies/advies/achternamen-combineren
		var maidenName = chunks.pop();
		if (!_.isEmpty(maidenName)) {
			chunks[3] = chunks[3] + '-' + maidenName;
		}

		//Initials available: pop off the firstName
		if (!_.isEmpty(chunks[1])) {
			chunks.shift();
		}

		return BaseSerializer.composeTitle.apply(this, arguments);
	},
	getPromiseByPaths: function (entityTypeTitle, document, requestedPaths, parents) {
		var self = this;
		var allVariablesAreRequested = (requestedPaths.length === 1 && requestedPaths[0].substring(0, 1) === '#');
		var membershipNumberRequested = (allVariablesAreRequested || requestedPaths.indexOf('membershipNumber') !== -1);
		var templateDataPromise = BaseSerializer.getPromiseByPaths.apply(this, arguments);
		if (!membershipNumberRequested) {
			return templateDataPromise;
		}

		//hydrate membershipNumber on request, see https://trello.com/c/bfsOJ1Mr/1569-exportcode-zou-toch-moeten
		return Promise.all([
			templateDataPromise,
			self.cbc.search('Membership', {
				'personId': document._id ,
				'membershipNumber': { '$gt': 0 }
			}, {
				'fields': 'membershipNumber',
				'limit': 1
			})
		]).spread(function (templateData, membershipData) {
			if (membershipData && membershipData.length) {
				templateData.membershipNumber = membershipData[0].membershipNumber;
			}
			return templateData;
		});
	}
};

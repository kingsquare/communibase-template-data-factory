'use strict';

var _ = require('lodash');
var BaseSerializer = require('./Base.js');

module.exports = {
	titleFields: ['groupId','companyId','personId','membershipNumber'],
	composeTitle: function(chunks, entityTitle, document) {
		var groupName, companyName, personName, membershipNumber, newChunks;

		groupName = chunks.shift();
		companyName = chunks.shift();
		personName = chunks.shift();
		membershipNumber = chunks.shift();

		newChunks = [groupName, ' - ', (_.isEmpty(personName) ? companyName : personName)];

		if (membershipNumber) {
			newChunks.push(' - ');
			newChunks.push(membershipNumber);
		}
		return BaseSerializer.composeTitle.apply(this, [newChunks, entityTitle, document]);
	}
};
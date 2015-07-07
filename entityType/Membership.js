'use strict';

var _ = require('lodash');
var BaseSerializer = require('./Base.js');

module.exports = {
	titleFields: ['groupId','companyId','personId','membershipNumber'],
	composeTitle: function(chunks, entityTitle, document) {
		var groupName = chunks.shift();
		var companyName = chunks.shift();
		var personName = chunks.shift();
		var membershipNumber = chunks.shift();

		var newChunks = [groupName, ' - ', (_.isEmpty(personName) ? companyName : personName)];

		if (membershipNumber) {
			newChunks.push(' - ');
			newChunks.push(membershipNumber);
		}
		return BaseSerializer.composeTitle.apply(this, [newChunks, entityTitle, document]);
	}
};
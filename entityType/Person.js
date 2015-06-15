"use strict";

var _ = require('lodash');
var BaseSerializer = require('./Base.js');

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
	}
};
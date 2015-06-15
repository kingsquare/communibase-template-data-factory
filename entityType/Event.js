'use strict';

var BaseSerializer = require('./Base.js');
var moment = require('moment');

module.exports = {
	titleFields: ['title','startDate'],

	/**
	 * https://trello.com/c/aSUzT0Ai/1330-verbetering-gebruikservaring-naar-evenement-slepen-naast-evenement-titel-ook-
	 *
	 * @param {Array} chunks
	 * @return {string}
	 */
	composeTitle: function (chunks, entityTitle, event) {
		if (chunks && chunks[1]) {
			chunks[1] = '(' + moment(chunks[1]).format('D-M-YYYY') + ')';
		}

		return BaseSerializer.composeTitle.apply(this, arguments);
	}
};
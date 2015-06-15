/*global Promise:true */

'use strict';

var BaseSerializer = require('./Base.js');

module.exports = {
	titleFields: ['title','{{ - }}','addresses'],

	_getTitlePromise: function (titleFields, entityTypeTitle, company) {
		var self = this;
		return BaseSerializer._getTitlePromise.apply(this, arguments).then(function (titleParts) {
			if (!company.addresses || company.addresses.length === 0) {
				return titleParts;
			}

			return self.getTitlePromise('Address', company.addresses[0]).then(function (addressTitles) {
				titleParts.push(addressTitles);
				return titleParts;
			}).catch(function () {
				return titleParts;
			});
		}).catch(function (err) {
			console.log(err);
			return ['<< Onbekend, informatie ontbreekt >>'];
		});
	}
};
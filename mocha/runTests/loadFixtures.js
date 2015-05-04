/*global Promise:true */

'use strict';

var Promise = require('bluebird');
var fs = require('fs');
var cbc = require('communibase-connector-js').clone(process.env.COMMUNIBASE_KEY);

module.exports = function () {
	return cbc.update('Debtor', JSON.parse(fs.readFileSync(__dirname + '/../fixtures/debtor.json'))).then(function (debtor) {
		var invoice = JSON.parse(fs.readFileSync(__dirname + '/../fixtures/invoice.json'));
		invoice.debtorId = debtor._id;
		return cbc.update('Invoice', invoice);
	}).then(function (invoice) {
		process.env.TEST_INVOICE_ID = invoice._id;
	});
};
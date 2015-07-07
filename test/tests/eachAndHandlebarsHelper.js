/* global describe: false, it: false */
'use strict';

var assert = require('assert');
var cbc = require('communibase-connector-js');
var Factory = require('../../index.js');
var Handlebars = require('handlebars');

var factory = new Factory({
	cbc: cbc
});

var expectedResult = {
	'invoiceItems': [
		{ 'totalEx': '€ 240,00' },
		{ 'totalEx': '-€ 10,00' }
	]
};
var template = Handlebars.parse('{{#each invoiceItems}}{{price totalEx}}{{/each}}');

describe('#getTemplateData() - Each loop / Handlebars helper', function(){
	it('should work', function(done) {
		cbc.getById('Invoice', process.env.TEST_INVOICE_ID).then(function (invoice) {
			return factory.getPromise('Invoice', invoice, template);
		}).then(function (result) {

			assert.equal(JSON.stringify(result), JSON.stringify(expectedResult));
			done();
		}).catch(done);
	});
});

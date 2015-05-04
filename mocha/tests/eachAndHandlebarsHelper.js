/* global describe: false, it: false */
'use strict';

var cbc, expectedResult, factory, template, Factory, Handlebars;

cbc = require('communibase-connector-js');
Factory = require('../../index.js');
Handlebars = require('handlebars');

factory = new Factory({
	cbc: cbc
});

expectedResult = {
	'invoiceItems': [
		{ 'totalEx': '€240,00' },
		{ 'totalEx': '€-10,00' }
	]
};

template = Handlebars.parse('{{#each invoiceItems}}{{price totalEx}}{{/each}}');
describe('Tool', function(){
	describe('#getTemplateData() - Each loop / Handlebars helper', function(){
		it('should work', function(done) {
			cbc.getById('Invoice', process.env.TEST_INVOICE_ID).then(function (invoice) {
				return factory.getPromise('Invoice', invoice, template);
			}).then(function (result) {
				if (JSON.stringify(result) !== JSON.stringify(expectedResult)) {
					throw new Error('Not all values are exactly the same!');
				}
				done();
			}).catch(done);
		});
	});
});

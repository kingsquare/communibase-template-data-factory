/* global describe: false, it: false */
'use strict';

var cbc, expectedResult, factory, template, Factory, Handlebars;

require('long-stack-traces');

cbc = require('communibase-connector-js');
Factory = require('../../index.js');
Handlebars = require('handlebars');

factory = new Factory({
	cbc: cbc
});

var input = [ 'invoiceNumber', 'invoiceItems.0.taxPercentage', 'invoiceItems.0.totals.ex', 'address.street'];

expectedResult = {
	'invoiceNumber': '100001',
	'invoiceItems': [
		{
			"taxPercentage": 21,
			"totals": {
				"ex": 240
			}
		}
	],
	'address': {
		'street': 'Straatje'
	}
};

template = Handlebars.parse('{{' + input.join('}};{{') +'}}');

describe('Tool', function(){
	describe('#getTemplateData() - Invoice', function(){
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

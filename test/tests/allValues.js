/* global describe: false, it: false */
'use strict';

var cbc, expectedResult, factory, helpers, Factory, Handlebars;

cbc = require('communibase-connector-js');
helpers = require('../../inc/helpers.js');
Factory = require('../../index.js');
Handlebars = require('handlebars');

factory = new Factory({
	cbc: cbc
});

expectedResult = {
	invoiceNumber: '100001',
	address: { street: 'Straatje',
		streetNumber: '12',
		zipcode: '4284VA',
		city: 'RIJSWIJK NB',
		type: 'visit',
		countryCode: 'NL',
		country: 'Nederland',
		notNl: false
	},
	date: '2013-01-22T23:00:00.000Z',
	dayBookNumber: '30',
	debtor: {
		"comment": "",
		"companyId": process.env.TEST_COMPANY_ID,
		"number": "1",
		"personId": process.env.TEST_PERSON_ID,
		"preferredPaymentType": "invoice",
		"preferredTypeOfContact": "mail",
		"salutation": "Geachte mevrouw Van Zutphen,"
	},
	firstAddressLine: 'Testaanhef',
	openAmount: 278.3,
	template: 'test',
	debtorId: process.env.TEST_DEBTOR_ID,
	isSent: false,
	exportRuns: [],
	reverseChargedVat: false,
	reminderCount: 0,
	invoiceItems: [],
	paymentType: 'invoice',
	isCredit: false,
	totals: []
};

describe('Tool', function(){
	describe('#getTemplateData() - All first-hand values (#.#)', function(){
		it('should work', function(done) {
			cbc.getById('Invoice', process.env.TEST_INVOICE_ID).then(function (invoice) {
				return factory.getPromiseByPaths('Invoice', invoice, ['#.#']);
			}).then(function (result) {
				var reality, expectation;
				reality = JSON.stringify(helpers.sortDictionaryByKey(result));
				expectation = JSON.stringify(helpers.sortDictionaryByKey(expectedResult));

				if (reality !== expectation) {
					throw new Error('Not all values are exactly the same!');
				}
				done();
			}).catch(done);
		});
	});
});

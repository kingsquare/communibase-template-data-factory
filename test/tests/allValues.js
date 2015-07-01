/* global describe: false, it: false */
'use strict';

var cbc, expectedResult, factory, helpers, Factory, Handlebars;

cbc = require('communibase-connector-js');
helpers = require('../../inc/helpers.js');
Factory = require('../../index.js');
Handlebars = require('handlebars');

factory = new Factory({
	cbc: cbc,
	stxt: {
		'Address.countryCode.NL': 'Nederland'
	}
});

expectedResult = {
	_id: process.env.TEST_INVOICE_ID,
	_title: "100001",
	invoiceNumber: '100001',
	address: {
		_title: 'Straatje 12 4284VA RIJSWIJK NB NL - visit',
		street: 'Straatje',
		streetNumber: '12',
		zipcode: '4284VA',
		city: 'RIJSWIJK NB',
		type: 'visit',
		countryCode: 'NL',
		country: 'Nederland',
		notNl: false
	},
	date: new Date('2013-01-22T23:00:00.000Z'),
	dayBookNumber: '30',
	debtor: {
		_id: process.env.TEST_DEBTOR_ID,
		_title: '1 - NEVI - Postbus 198 2700 AD ZOETERMEER DE - postal J. van Zutphen - Rijsenburgselaan 19 3972 EH ' +
			'DRIEBERGEN-RIJSENBURG NL - postal',
		comment: "",
		companyId: process.env.TEST_COMPANY_ID,
		number: "1",
		personId: process.env.TEST_PERSON_ID,
		preferredPaymentType: "invoice",
		preferredTypeOfContact: "mail",
		salutation: "Geachte mevrouw Van Zutphen,",
		updatedBy: 'The API unittest administration test key',
		updatedAt: new Date(process.env.TEST_DEBTOR_UPDATED_AT)
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
	totals: [],
	updatedBy: 'The API unittest administration test key',
	updatedAt: new Date(process.env.TEST_INVOICE_UPDATED_AT)
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

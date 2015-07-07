/* global describe: false, it: false */
'use strict';

var assert = require('assert');
var cbc = require('communibase-connector-js');
var helpers = require('../../inc/helpers.js');
var Factory = require('../../index.js');
var Handlebars = require('handlebars');

var factory = new Factory({
	cbc: cbc,
	stxt: {
		'Address.countryCode.NL': 'Nederland'
	}
});

var expectedResult = {
	_id: process.env.TEST_INVOICE_ID,
	_title: '100001',
	invoiceNumber: '100001',
	address: {
		point: {
			coordinates: {
				0: 0,
				1: 0
			},
			type: 'Point'
		},
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
		updatedAt: new Date(process.env.TEST_DEBTOR_UPDATED_AT),
		_createdAt: new Date(process.env.TEST_DEBTOR_UPDATED_AT)
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
	updatedAt: new Date(process.env.TEST_INVOICE_UPDATED_AT),
	_createdAt: new Date(process.env.TEST_INVOICE_UPDATED_AT)
};

describe('#getTemplateData() - All first-hand values (#.#)', function(){
	it('should work', function(done) {
		cbc.getById('Invoice', process.env.TEST_INVOICE_ID).then(function (invoice) {
			return factory.getPromiseByPaths('Invoice', invoice, ['#.#']);
		}).then(function (result) {
			var actual = JSON.stringify(helpers.sortDictionaryByKey(result));
			var expected = JSON.stringify(helpers.sortDictionaryByKey(expectedResult));

			assert.deepEqual(actual, expected);
			done();

		}).catch(done);
	});
});

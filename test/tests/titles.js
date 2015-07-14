/* global describe: false, it: false */
'use strict';

var cbc, factory, factoryWithStxt, Factory, Handlebars;

var assert = require('assert');
cbc = require('communibase-connector-js');
Factory = require('../../index.js');
Handlebars = require('handlebars');

factory = new Factory({
	cbc: cbc
});

factoryWithStxt = new Factory({
	cbc: cbc,
	stxt: {
		'Address.type.postal': 'Postadres'
	}
});

describe('#getTitlePromise()', function () {
	it('Company._title', function (done) {
		cbc.getById('Company', process.env.TEST_COMPANY_ID).then(function (company) {
			return factory.getPromise('Company', company, Handlebars.parse('{{_title}}'));
		}).then(function (actual) {
			var expected = { _title: "NEVI - Postbus 198 2700 AD ZOETERMEER DE - postal" };

			assert.deepEqual(actual, expected);
			done();
		}).catch(done);
	});

	it('Company._title (with stxt)', function (done) {
		cbc.getById('Company', process.env.TEST_COMPANY_ID).then(function (company) {
			return factoryWithStxt.getPromise('Company', company, Handlebars.parse('{{_title}}'));
		}).then(function (actual) {
			var expected = { _title: "NEVI - Postbus 198 2700 AD ZOETERMEER DE - Postadres" };

			assert.deepEqual(actual, expected);
			done();
		}).catch(done);
	});

	it('Debtor._title & Debtor.person._title', function (done) {
		cbc.getById('Debtor', process.env.TEST_DEBTOR_ID).then(function (debtor) {
			return factory.getPromise('Debtor', debtor, Handlebars.parse('{{_title}}{{person._title}}'));
		}).then(function (actual) {
			var expected = {
				person: { _title: 'J. van Zutphen' },
				_title: "1 - NEVI - Postbus 198 2700 AD ZOETERMEER DE - postal J. van Zutphen - " +
					"Rijsenburgselaan 19 3972 EH DRIEBERGEN-RIJSENBURG NL - postal"
			};

			assert.deepEqual(actual, expected);
			done();
		}).catch(done);
	});

	it('Debtor._title (document reference)', function (done) {
		cbc.getById('Debtor', process.env.TEST_DEBTOR_2_ID).then(function (debtor) {
			return factory.getTitlePromise('Debtor', debtor);
		}).then(function (actual) {
			var expected = "1 - NEVI - Postbus 198 2700 AD ZOETERMEER DE - postal J. van Zutphen - " +
					"Theodorus Backerlaan 8 3984PJ ODIJK NL - visit";

			assert.deepEqual(actual, expected, 'The title is not nicely formatted!');
			done();
		}).catch(done);
	});

	it('Event._title', function (done) {
		cbc.getById('Event', process.env.TEST_EVENT_ID).then(function (event) {
			return factory.getTitlePromise('Event', event).then(function (actual) {
				var expected = "Ooa Intervisieseizoen 2016 (1-1-2016)";

				assert.equal(actual, expected, 'The title is not nicely formatted!');
				done();
			});
		}).catch(done);
	});

	it('Group._title', function (done) {
		cbc.getById('Group', process.env.TEST_GROUP_ID).then(function (group) {
			return factory.getPromise('Group', group, Handlebars.parse('{{_title}}'));
		}).then(function (actual) {
			var expected = { _title: "Ooa Professionaliseringsabonnement" };

			assert.deepEqual(actual, expected);
			done();
		}).catch(done);
	});

	it('Invoice._title', function (done) {
		cbc.getById('Invoice', process.env.TEST_INVOICE_ID).then(function (invoice) {
			return factory.getPromise('Invoice', invoice, Handlebars.parse('{{_title}}'));
		}).then(function (actual) {
			var expected = { _title: "100001" };

			assert.deepEqual(actual, expected);
			done();
		}).catch(done);
	});

	it('Membership._title', function (done) {
		cbc.getById('Membership', process.env.TEST_MEMBERSHIP_ID).then(function (membership) {
			return factory.getPromise('Membership', membership, Handlebars.parse('{{_title}}'));
		}).then(function (actual) {
			var expected = { _title: "Ooa Professionaliseringsabonnement - J. van Zutphen - 302962" };

			assert.deepEqual(actual, expected);
			done();
		}).catch(done);
	});

	it('Person._title', function (done) {
		cbc.getById('Person', process.env.TEST_PERSON_ID).then(function (person) {
			return factory.getPromise('Person', person, Handlebars.parse('{{_title}}'));
		}).then(function (actual) {
			var expected = { _title: "J. van Zutphen" };

			assert.deepEqual(actual, expected);
			done();
		}).catch(done);
	});

	it('EmailAddressReference._title', function (done) {
		cbc.getById('Person', process.env.TEST_PERSON_ID).then(function (person) {
			return factory.getPromise('Person', person, Handlebars.parse('{{positions.0.emailAddressReference._title}}'));
		}).then(function (actual) {
			var expected = {
				"positions":[{"emailAddressReference":{"_title":"j.van.zutphen@belastingdienst.nl - private"}}]
			};
			assert.deepEqual(actual, expected);
			done();
		}).catch(done);
	});
});

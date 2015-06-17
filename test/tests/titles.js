/* global describe: false, it: false */
'use strict';

var cbc, factory, factoryWithStxt, Factory, Handlebars;

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

describe('Tool', function () {
	describe('#getTitlePromise()', function () {
		it('Company._title', function (done) {
			cbc.getById('Company', process.env.TEST_COMPANY_ID).then(function (company) {
				return factory.getPromise('Company', company, Handlebars.parse('{{_title}}'));
			}).then(function (results) {
				var expectedTitle = 'NEVI - Postbus 198 2700 AD ZOETERMEER DE - postal';
				if (JSON.stringify(results) !== JSON.stringify({ _title: expectedTitle })) {
					throw new Error('Not all values are exactly the same!');
				}
				done();
			}).catch(done);
		});

		it('Company._title (with stxt)', function (done) {
			cbc.getById('Company', process.env.TEST_COMPANY_ID).then(function (company) {
				return factoryWithStxt.getPromise('Company', company, Handlebars.parse('{{_title}}'));
			}).then(function (results) {
				var expectedTitle = 'NEVI - Postbus 198 2700 AD ZOETERMEER DE - Postadres';
				if (JSON.stringify(results) !== JSON.stringify({ _title: expectedTitle })) {
					throw new Error('Not all values are exactly the same!');
				}
				done();
			}).catch(done);
		});

		it('Debtor._title & Debtor.person._title', function (done) {
			cbc.getById('Debtor', process.env.TEST_DEBTOR_ID).then(function (debtor) {
				return factory.getPromise('Debtor', debtor, Handlebars.parse('{{_title}}{{person._title}}'));
			}).then(function (results) {
				var expectedResult = {
					person: { _title: 'J. van Zutphen' },
					_title: '1 - NEVI - Postbus 198 2700 AD ZOETERMEER DE - postal J. van Zutphen - ' +
						'Rijsenburgselaan 19 3972 EH DRIEBERGEN-RIJSENBURG NL - postal'
				};

				if (JSON.stringify(results) !== JSON.stringify(expectedResult)) {
					throw new Error('Not all values are exactly the same!');
				}
				done();
			}).catch(done);
		});

		it('Debtor._title (document reference)', function (done) {
			cbc.getById('Debtor', process.env.TEST_DEBTOR_2_ID).then(function (debtor) {
				return factory.getTitlePromise('Debtor', debtor);
			}).then(function (title) {
				if (title !== '1 - NEVI - Postbus 198 2700 AD ZOETERMEER DE - postal J. van Zutphen - ' +
					'Theodorus Backerlaan 8 3984PJ ODIJK NL - visit') {
					throw new Error('The title is not nicely formatted!');
				}

				done();
			}).catch(done);
		});

		it('Event._title', function (done) {
			cbc.getById('Event', process.env.TEST_EVENT_ID).then(function (event) {
				return factory.getTitlePromise('Event', event).then(function (title) {
					if (title !== 'Ooa Intervisieseizoen 2016 (1-1-2016)') {
						throw new Error('The title is not nicely formatted!');
					}
					done();
				});
			}).catch(done);
		});

		it('Group._title', function (done) {
			cbc.getById('Group', process.env.TEST_GROUP_ID).then(function (group) {
				return factory.getPromise('Group', group, Handlebars.parse('{{_title}}'));
			}).then(function (result) {
				if (JSON.stringify(result) !== JSON.stringify({ _title: "Ooa Professionaliseringsabonnement" })) {
					throw new Error('Not all values are exactly the same!');
				}
				done();
			}).catch(done);
		});

		it('Invoice._title', function (done) {
			cbc.getById('Invoice', process.env.TEST_INVOICE_ID).then(function (invoice) {
				return factory.getPromise('Invoice', invoice, Handlebars.parse('{{_title}}'));
			}).then(function (result) {
				if (JSON.stringify(result) !== JSON.stringify({ _title: "100001" })) {
					throw new Error('Not all values are exactly the same!');
				}
				done();
			}).catch(done);
		});

		it('Membership._title', function (done) {
			cbc.getById('Membership', process.env.TEST_MEMBERSHIP_ID).then(function (membership) {
				return factory.getPromise('Membership', membership, Handlebars.parse('{{_title}}'));
			}).then(function (result) {
				var expectedTitle = "Ooa Professionaliseringsabonnement - J. van Zutphen - 302962";

				if (JSON.stringify(result) !== JSON.stringify({ _title: expectedTitle })) {
					throw new Error('Not all values are exactly the same!');
				}
				done();
			}).catch(done);
		});

		it('Person._title', function (done) {
			cbc.getById('Person', process.env.TEST_PERSON_ID).then(function (person) {
				return factory.getPromise('Person', person, Handlebars.parse('{{_title}}'));
			}).then(function (result) {
				if (JSON.stringify(result) !== JSON.stringify({ _title: 'J. van Zutphen' })) {
					throw new Error('Not all values are exactly the same!');
				}
				done();
			}).catch(done);
		});
	});
});

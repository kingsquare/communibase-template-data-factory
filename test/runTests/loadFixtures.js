/*global Promise:true */

'use strict';

var Promise = require('bluebird');
var fs = require('fs');
var cbc = require('communibase-connector-js').clone(process.env.COMMUNIBASE_KEY);

module.exports = function () {
	var personData = JSON.parse(fs.readFileSync(__dirname + '/../fixtures/person.json'));
	var debtorData = JSON.parse(fs.readFileSync(__dirname + '/../fixtures/debtor.json'));
	var membershipData = JSON.parse(fs.readFileSync(__dirname + '/../fixtures/membership.json'));
	var groupData = JSON.parse(fs.readFileSync(__dirname + '/../fixtures/group.json'));
	var invoiceData = JSON.parse(fs.readFileSync(__dirname + '/../fixtures/invoice.json'));
	var companyData = JSON.parse(fs.readFileSync(__dirname + '/../fixtures/company.json'));
	var eventData = JSON.parse(fs.readFileSync(__dirname + '/../fixtures/event.json'));


	return Promise.all([
		cbc.update('Person', personData),
		cbc.update('Company', companyData),
		cbc.update('Group', groupData),
		cbc.update('Event', eventData)
	]).spread(function (person, company, group, event) {
		debtorData.personId = person._id;
		debtorData.companyId = company._id;
		membershipData.groupId = group._id;
		membershipData.personId = person._id;
		membershipData.addressReference = {
			documentReference: {
				"rootDocumentEntityType": "Person",
				"rootDocumentId": person._id,
				"path": [{
					"field": "addresses",
					"objectId": person.addresses[0]._id,
					"_id": "5538e68cbb1bf31f00dfee58"
				}]
			}
		};
		process.env.TEST_PERSON_ID = person._id;
		process.env.TEST_COMPANY_ID = company._id;
		process.env.TEST_GROUP_ID = group._id;
		process.env.TEST_EVENT_ID = event._id;
		return cbc.update('Debtor', debtorData);
	}).then(function (debtor) {
		membershipData.debtorId = debtor._id;

		invoiceData.debtorId = debtor._id;
		process.env.TEST_DEBTOR_ID = debtor._id;
		return cbc.update('Membership', membershipData);
	}).then(function (membership) {
		invoiceData.invoiceItems[0].documentReference = {
			"_id": null,
			"rootDocumentId": membership._id,
			"rootDocumentEntityType": "Membership",
			"path": [
				{
					"field": "invoicedPeriods",
					"objectId": membership.invoicedPeriods[3]._id
				}
			]
		};
		process.env.TEST_MEMBERSHIP_ID = membership._id;
		return cbc.update('Invoice', invoiceData);
	}).then(function (invoice) {
		process.env.TEST_INVOICE_ID = invoice._id;
	});
};
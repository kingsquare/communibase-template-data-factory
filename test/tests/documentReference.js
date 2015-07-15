/* global describe: false, it: false */
'use strict';

var assert = require('assert');
var fs = require('fs');
var cbc = require('communibase-connector-js');
var Factory = require('../../index.js');
var Handlebars = require('handlebars');
var helpers = require('../../inc/helpers.js');

var factory = new Factory({
	cbc: cbc
});
var expectedResult  = {
	phoneNumber: {
		countryCode: '+31'
	},
	address: {
		street: 'Theodorus Backerlaan'
	}
};
var template = Handlebars.parse(fs.readFileSync(__dirname + '/../templates/documentReference.hbs', 'utf-8'));

describe('#getTemplateData() - Document references', function(){
	it('should work', function(done) {
		cbc.getById('Membership', process.env.TEST_MEMBERSHIP_ID).then(function (membership) {
			return factory.getPromise('Membership', membership, template);
		}).then(function (result) {
			assert.equal(JSON.stringify(result), JSON.stringify(expectedResult));
			done();
		}).catch(done);
	});

	it('should be gained in detail', function(done) {
		cbc.getById('Person', process.env.TEST_PERSON_ID).then(function (person) {
			return factory.getPromiseByPaths('Person', person, ['positions.0.addressReference.address.street']);
		}).then(function (result) {
			var actual = JSON.stringify(helpers.sortDictionaryByKey(result));
			var expected = JSON.stringify(helpers.sortDictionaryByKey({
				positions: { 0: { addressReference: { address: { street: 'Teststraat' }	} } }
			}));

			assert.equal(actual, expected);
			done();
		}).catch(done);
	});

	it('should support parent referencing', function(done) {
		cbc.getById('Person', process.env.TEST_PERSON_ID).then(function (person) {
			return factory.getPromiseByPaths('Person', person, ['positions.0.emailAddress.emailAddress']);
		}).then(function (result) {
			if (JSON.stringify(result) !== '{"positions":[{"emailAddress":{"emailAddress":"j.van.zutphen@belastingdienst.nl"}}]}') {
				throw new Error('Got invalid result for parent reference!');
			}
			done();
		}).catch(done);
	});

	it('should expose rootDocument when requested', function(done) {
		cbc.getById('Person', process.env.TEST_PERSON_ID).then(function (person) {
			return factory.getPromiseByPaths('Person', person, ['positions.0.emailAddressReference.documentReference.rootDocument.firstName']);
		}).then(function (actual) {
			assert.deepEqual(actual, {"positions":[{"emailAddressReference":{"documentReference":{"rootDocument":{"firstName":"Janny"}}}}]});
			done();
		}).catch(done);
	});
});

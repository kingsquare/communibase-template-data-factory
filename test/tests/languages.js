/* global describe: false, it: false, Promise: true */
'use strict';

var assert = require('assert');
var cbc = require('communibase-connector-js');
var Factory = require('../../index.js');
var Handlebars = require('handlebars');
var Promise = require('bluebird');

var dutchFactory = new Factory({
	cbc: cbc,
	stxt: {
		'Address.countryCode.DE': 'Duitsland',
		'Address.countryCode.NL': 'Nederland'
	}
});

var englishFactory = new Factory({
	cbc: cbc,
	stxt: {
		'Address.countryCode.DE': 'Germany',
		'Address.countryCode.NL': 'Netherlands'
	}
});

var template = Handlebars.parse('{{#addresses}} {{country}} {{/addresses}}');

describe('#getTemplateData() - Languages', function(){
	it('should work', function(done) {
		cbc.getById('Company', process.env.TEST_COMPANY_ID).then(function (company) {
			return Promise.all([
				dutchFactory.getPromise('Company', company, template),
				englishFactory.getPromise('Company', company, template)
			]);
		}).then(function (actual) {
			var expected = [
				{
					'addresses': [
						{
							'country': 'Duitsland'
						},
						{
							'country': 'Nederland'
						}
					]
				},
				{
					'addresses': [
						{
							'country': 'Germany'
						},
						{
							'country': 'Netherlands'
						}
					]
				}
			];

			assert.deepEqual(actual, expected);
			done();
		}).catch(done);
	});
});

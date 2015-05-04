/* global describe: false, it: false, Promise: true */
'use strict';

var cbc, expectedResult, dutchFactory, englishFactory, template, Factory, Handlebars, Promise;

cbc = require('communibase-connector-js');
Factory = require('../../index.js');
Handlebars = require('handlebars');
Promise = require('bluebird');

dutchFactory = new Factory({
	cbc: cbc
});

englishFactory = new Factory({
	cbc: cbc,
	language: 'EN'
});

expectedResult = [
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

template = Handlebars.parse('{{#addresses}} {{country}} {{/addresses}}');

describe('Tool', function(){
	describe('#getTemplateData() - Languages', function(){
		it('should work', function(done) {
			cbc.getById('Company', process.env.TEST_COMPANY_ID).then(function (company) {
				return Promise.all([
					dutchFactory.getPromise('Company', company, template),
					englishFactory.getPromise('Company', company, template),
				]);
			}).then(function (result) {
				if (JSON.stringify(result) !== JSON.stringify(expectedResult)) {
					throw new Error('Not all values are exactly the same!');
				}
				done();
			}).catch(done);
		});
	});
});
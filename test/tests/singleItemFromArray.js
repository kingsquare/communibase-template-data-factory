/* global describe: false, it: false */
'use strict';

var cbc, expectedResult, helpers, factory, fs, template, Factory, Handlebars;

fs = require('fs');
cbc = require('communibase-connector-js');
helpers = require('../../inc/helpers.js');
Factory = require('../../index.js');
Handlebars = require('handlebars');

factory = new Factory({
	cbc: cbc
});

expectedResult = {
	"invoicedPeriods": {
		3: {
			"startDate": "Mon Mar 23 2015 00:00:00 GMT+0100 (CET)"
		}
	},

	"person": {
		"firstName": "Janny",
		"emailAddresses": [
			{
				"emailAddress": "j.van.zutphen@belastingdienst.nl"
			},
			{
				"emailAddress": "jannyz@xs4all.nl"
			}
		]
	},
	"debtor": {
		"company": {
			"title": "NEVI"
		}
	}
};

template = Handlebars.parse(fs.readFileSync(__dirname + '/../templates/singleItemFromArray.hbs', 'utf-8'));

describe('Tool', function(){
	describe('#getTemplateData() - Single item from array', function(){
		it('should work', function(done) {
			cbc.getById('Membership', process.env.TEST_MEMBERSHIP_ID).then(function (membership) {
				return factory.getPromise('Membership', membership, template);
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

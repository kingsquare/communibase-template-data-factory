/* global describe: false, it: false */
'use strict';

var cbc, expectedResult, factory, template, Factory, Handlebars;

var fs = require('fs');
cbc = require('communibase-connector-js');
Factory = require('../../index.js');
Handlebars = require('handlebars');

factory = new Factory({
	cbc: cbc
});

expectedResult = {
	"invoicedPeriods": [
		null, null, null, {
			"startDate": "2015-03-22T23:00:00.000Z"
		}
	],

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
				if (JSON.stringify(result) !== JSON.stringify(expectedResult)) {
					throw new Error('Not all values are exactly the same!');
				}
				done();
			}).catch(done);
		});
	});
});

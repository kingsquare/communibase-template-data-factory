/* global describe: false, it: false */
'use strict';

var assert = require('assert');
var fs = require('fs');
var cbc = require('communibase-connector-js');
var helpers = require('../../inc/helpers.js');
var Factory = require('../../index.js');
var Handlebars = require('handlebars');

var factory = new Factory({
	cbc: cbc
});

var expectedResult = {
	"invoicedPeriods": {
		0: {},
		1: {},
		2: {},
		3: {
			"startDate": new Date("2015-03-22T23:00:00.000Z")
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

var template = Handlebars.parse(fs.readFileSync(__dirname + '/../templates/singleItemFromArray.hbs', 'utf-8'));

describe('#getTemplateData() - Single item from array', function(){
	it('should work', function(done) {
		cbc.getById('Membership', process.env.TEST_MEMBERSHIP_ID).then(function (membership) {
			return factory.getPromise('Membership', membership, template);
		}).then(function (result) {
			var actual = JSON.stringify(helpers.sortDictionaryByKey(result));
			var expected = JSON.stringify(helpers.sortDictionaryByKey(expectedResult));

			assert.equal(actual, expected);
			done();
		}).catch(done);
	});
});

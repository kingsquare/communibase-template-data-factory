/* global describe: false, it: false */
'use strict';

var assert = require('assert');
var cbc = require('communibase-connector-js');
var helpers = require('../../inc/helpers.js');
var Factory = require('../../index.js');
var Handlebars = require('handlebars');

var factory = new Factory({
	cbc: cbc
});

var expectedResult = {
	phoneNumbers: {
		0: {
			combined: '0883300700'
		}
	}
};

describe('#getTemplateData() - PhoneNumber combined', function(){
	it('should work', function(done) {
		cbc.getById('Company', process.env.TEST_COMPANY_ID).then(function (company) {
			return factory.getPromiseByPaths('Company', company, ['phoneNumbers.0.combined']);
		}).then(function (result) {
			var actual = JSON.stringify(helpers.sortDictionaryByKey(result));
			var expected = JSON.stringify(helpers.sortDictionaryByKey(expectedResult));

			assert.equal(actual, expected);
			done();
		}).catch(done);
	});
});

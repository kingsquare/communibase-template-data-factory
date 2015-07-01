/* global describe: false, it: false */
'use strict';

var cbc, expectedResult, factory, helpers, Factory, Handlebars;

cbc = require('communibase-connector-js');
helpers = require('../../inc/helpers.js');
Factory = require('../../index.js');
Handlebars = require('handlebars');

factory = new Factory({
	cbc: cbc
});

expectedResult = {
	phoneNumbers: {
		0: {
			combined: '0883300700'
		}
	}
};

describe('Tool', function(){
	describe('#getTemplateData() - PhoneNumber combined', function(){
		it('should work', function(done) {
			cbc.getById('Company', process.env.TEST_COMPANY_ID).then(function (company) {
				return factory.getPromiseByPaths('Company', company, ['phoneNumbers.0.combined']);
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

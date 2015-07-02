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
	sectors: {
		1: "c"
	}
};

describe('Tool', function(){
	describe('#getTemplateData() - Specific array values (e.g. Person.sectors.[1])', function () {
		it('should work', function(done) {
			cbc.getById('Person', process.env.TEST_PERSON_ID).then(function (person) {
				return factory.getPromiseByPaths('Person', person, ['sectors.[1]']);
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

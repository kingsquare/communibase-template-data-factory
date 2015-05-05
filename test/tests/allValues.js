/* global describe: false, it: false */
'use strict';

var cbc, expectedResult, factory, Factory, Handlebars;

var fs = require('fs');
cbc = require('communibase-connector-js');
Factory = require('../../index.js');
Handlebars = require('handlebars');

factory = new Factory({
	cbc: cbc
});

expectedResult  = {
	title: 'NEVI',
	comment: 'Dit is een test'
};

describe('Tool', function(){
	describe('#getTemplateData() - All first-hand values (#.#)', function(){
		it('should work', function(done) {
			cbc.getById('Company', process.env.TEST_COMPANY_ID).then(function (company) {
				return factory.getPromiseByPaths('Company', company, ['#.#']);
			}).then(function (result) {
				if (JSON.stringify(result) !== JSON.stringify(expectedResult)) {
					throw new Error('Not all values are exactly the same!');
				}
				done();
			}).catch(done);
		});
	});
});

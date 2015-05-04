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

expectedResult  = {
	phoneNumber: {
		countryCode: '+31'
	},
	address: {
		street: 'Theodorus Backerlaan'
	}
};


template = Handlebars.parse(fs.readFileSync(__dirname + '/../templates/documentReference.hbs', 'utf-8'));

describe('Tool', function(){
	describe('#getTemplateData() - Document references', function(){
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

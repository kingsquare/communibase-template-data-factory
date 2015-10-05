/*global process:false */
'use strict';

var assert = require('assert');
var Factory = require('../../index.js');
var Handlebars = require('handlebars');
var Promise = require('bluebird');
var cbc = require('communibase-connector-js');
var factory = new Factory({
	cbc: cbc
});

var template = Handlebars.parse('{{firstName}} - {{membershipNumber}}');

describe('#Entity Magic()', function(){
	it('should expose membershipNumber for Person', function(done) {
		cbc.getById('Person', process.env.TEST_PERSON_ID).then(function (person) {
			factory.getPromise('Person', person, template).then(function (result) {
				assert.deepEqual(result, {
					"firstName": "Janny",
					"membershipNumber": 302962
				});
				done();
			});
		});
	});
});
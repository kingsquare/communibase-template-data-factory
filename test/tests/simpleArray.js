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

describe('#getTemplateData() - Specific array values (e.g. Person.sectors.[1])', function () {
	it('should work', function(done) {
		var paths = factory.getPaths(Handlebars.parse('{{sectors.[1]}}'));
		cbc.getById('Person', process.env.TEST_PERSON_ID).then(function (person) {
			return factory.getPromise('Person', person, Handlebars.parse('{{sectors.[1]}}'));
		}).then(function (result) {
			var actual = JSON.stringify(result);
			var expected = JSON.stringify({"sectors": ["a", "c", "e"]});
			assert.equal(actual, expected);
			done();
		}).catch(done);
	});

	it('should handle string arrays properly', function(done) {
		cbc.getById('Person', process.env.TEST_PERSON_ID).then(function (person) {
			return factory.getPromise('Person', person, Handlebars.parse('{{#each sectors}}{{.}}!{{/each}}'));
		}).then(function (result) {

			var paths = factory.getPaths(Handlebars.parse('{{#each sectors}}{{.}}!{{/each}}'));
			var actual = JSON.stringify(helpers.sortDictionaryByKey(result));
			var expected = JSON.stringify(helpers.sortDictionaryByKey({
				"sectors": ["a", "c", "e"]
			}));
			assert.equal(actual, expected);
			done();
		}).catch(done);
	});
});

/* global describe: false, it: false, Promise: true */
'use strict';

var assert = require('assert');
var Factory = require('../../index.js');
var Handlebars = require('handlebars');
var Promise = require('bluebird');
var cbc = require('communibase-connector-js');
var factory = new Factory({
	cbc: cbc
});


var template = Handlebars.parse('{{#each sessions}}{{#each participants}}{{csvEscape ../../title}} - {{../title}} {{person.firstName}} {{/each}}{{/each}}');

describe('#getPaths()', function(){
	it('should traverse to parents properly', function(done) {
		assert.deepEqual(factory.getPaths(template), [ 'title', 'sessions.#.title', 'sessions.#.participants.#.person.firstName']);
		done();
	});

	it('should support if-else constructs', function(done) {
		var paths = factory.getPaths(Handlebars.parse('{{#if person.firstName}}{{person.firstName}}{{else}}{{person.initials}}{{/if}}'));
		assert.deepEqual(paths, ['person.firstName', 'person.initials']);
		done();
	});

	it('should support filter constructs', function(done) {
		//factory.setDebug(true);
//		factory.setDebug(true)
		var paths = factory.getPaths(Handlebars.parse('{{#filter person.positions "_active" "eq" true}}{{#each results}}{{company.title}}{{/each}}{{/filter}}'));
//		factory.setDebug(false);
		assert.deepEqual(paths, ['person.positions.#._active', 'person.positions.#.company.title']);
		done();
	});

	it ('should hydrate proper data', function (done) {
		cbc.getById('Event', process.env.TEST_EVENT_ID).then(function (event) {
			return factory.getPromise('Event', event, template);
		}).then(function (result) {
			assert.deepEqual(result, {"title":"Ooa Intervisieseizoen 2016","sessions":[{"title":"Ooa Startbijeenkomst 2016","participants":[{"person":{"firstName":"Janny"}}]},{"title":"Ooa Kennismakingsbijeenkomst nieuwe leden","participants":[]},{"title":"Ooa Informatiebijeenkomst facilitators","participants":[]}]});
			done();
		}).catch(done);
	});
});
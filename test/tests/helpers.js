/* global describe: false, it: false */
'use strict';

var assert = require('assert');
var helpers = require('../../inc/helpers.js');

describe('helpers.getRequestedSubVariables()', function(){
	it('should get specific subvalues', function(done) {
		var actual = helpers.getRequestedSubVariables(['a.b', 'c.a.g', 'd', 'e.f'], 'a');

		assert.deepEqual(actual, ['b']);
		done();
	});

	it('should get specific sub-objects', function(done) {
		var actual = helpers.getRequestedSubVariables(['a.b', 'c.a.g', 'd', 'e.f'], 'c');

		assert.deepEqual(actual, ['a.g']);
		done();
	});

	it('should get specific sub-subvalues', function(done) {
		var actual = helpers.getRequestedSubVariables(['a.b', 'c.a.g', 'd', 'e.f'], 'c.a');

		assert.deepEqual(actual, ['g']);
		done();
	});

	it('should get all second-hand values', function(done) {
		var first = helpers.getRequestedSubVariables(['#.#'], 'e.f');
		var second = helpers.getRequestedSubVariables(['#.#'], 'e');

		assert.deepEqual(first, []);
		assert.deepEqual(second, ['#']);
		done();
	});
});
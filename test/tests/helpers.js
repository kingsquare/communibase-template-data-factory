/* global describe: false, it: false */
'use strict';

var helpers = require('../../inc/helpers.js');

describe('Tool', function(){
	describe('helpers.getRequestedSubVariables()', function(){
		it('should get specific subvalues', function(done) {
			var actualOutput = helpers.getRequestedSubVariables(['a.b', 'c.a.g', 'd', 'e.f'], 'a');
			if (JSON.stringify(actualOutput) !== JSON.stringify(['b'])) {
				throw new Error('Not all values are exactly the same!');
			}
			done();
		});

		it('should get specific sub-objects', function(done) {
			var actualOutput = helpers.getRequestedSubVariables(['a.b', 'c.a.g', 'd', 'e.f'], 'c');
			if (JSON.stringify(actualOutput) !== JSON.stringify(['a.g'])) {
				throw new Error('Not all values are exactly the same!');
			}
			done();
		});

		it('should get specific sub-subvalues', function(done) {
			var actualOutput = helpers.getRequestedSubVariables(['a.b', 'c.a.g', 'd', 'e.f'], 'c.a');
			if (JSON.stringify(actualOutput) !== JSON.stringify(['g'])) {
				throw new Error('Not all values are exactly the same!');
			}
			done();
		});

		it('should get all second-hand values', function(done) {
			var firstOutput = helpers.getRequestedSubVariables(['#.#'], 'e.f');
			var secondOutPut = helpers.getRequestedSubVariables(['#.#'], 'e');

			if (JSON.stringify(firstOutput) !== JSON.stringify([])) {
				throw new Error('Not all values are exactly the same!');
			}

			if (JSON.stringify(secondOutPut) !== JSON.stringify(['#'])) {
				throw new Error('Not all values are exactly the same!');
			}
			done();
		});
	});
});
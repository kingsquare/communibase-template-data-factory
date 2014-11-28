/* global describe: false, it: false */
'use strict';

var assert = require('assert');
var Factory = require('../index.js');
var cbc = require('communibase-connector-js');

require('when/monitor/console');

var factory = new Factory({
	cbc: cbc
});

describe('Tool', function(){
	describe('#getTemplateData()', function(){
		it('should work', function(done) {
			cbc.search('Membership', {}, { limit: 1 }).then(function (memberships) {
				factory.getTemplateData('Membership', memberships[0]).then(function (result) {
					assert.equal(typeof result, 'object');
					assert.equal(typeof result.address, 'object');
					done();
				});
			});
		});
	});
});

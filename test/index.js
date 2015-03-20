/* global describe: false, it: false */
'use strict';

require('long-stack-traces');

var assert = require('assert');
var Factory = require('../index.js');
var cbc = require('communibase-connector-js');


var factory = new Factory({
	cbc: cbc
});

describe('Tool', function(){
	describe('#getTemplateData()', function(){
		it('should work', function(done) {
			cbc.getById('Invoice', '54ec76b2bac4011f005a3b84').then(function (invoice) {
				return factory.getPromise('Invoice', invoice).then(function (result) {
					done();
				});
			}).catch(done);
		});
	});
});

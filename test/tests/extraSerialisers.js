/* global describe: false, it: false, Promise: true */
'use strict';

var assert = require('assert');
var Factory = require('../../index.js');
var cbc = require('communibase-connector-js');
var factory = new Factory({
	cbc: cbc
});

describe('#extraserializers()', function() {
	it('should work', function(done) {
		factory.setSerializers({
			'CustomEntity': {
				titleFields: ['weirdTitlishProp']
			}
		});
		factory.getTitlePromise('CustomEntity', {
			title: 'im not the title',
			weirdTitlishProp: 'bonjour'
		}).then(function (result) {
			assert.equal(result, 'bonjour');
			done();
		});
	});
});

/* global describe: false, it: false */
'use strict';

var assert = require('assert');
var cbc = require('communibase-connector-js');
var Factory = require('../../index.js');
var Handlebars = require('handlebars');
var factory = new Factory({
	cbc: cbc
});

var input = [ 'invoiceNumber', 'invoiceItems.0.taxPercentage', 'invoiceItems.0.totals.ex', 'address.street'];
var template = Handlebars.parse('{{' + input.join('}};{{') +'}}');

describe('#getTemplateData() - Invoice', function(){
	it('should work', function(done) {
		cbc.getById('Invoice', process.env.TEST_INVOICE_ID).then(function (invoice) {
			return factory.getPromise('Invoice', invoice, template);
		}).then(function (actual) {
			var expected = {
				invoiceNumber: "100001",
				invoiceItems: [
					{
						taxPercentage: 21,
						totals: {
							ex: 240
						}
					}, {}
				],
				address: {
					street: "Straatje"
				}
			};

			assert.deepEqual(actual, expected);
			done();
		}).catch(done);
	});

	it('should parse euro-sign correctly', function (done) {
		cbc.getById('Invoice', process.env.TEST_INVOICE_2_ID).then(function (invoice) {
			return factory.getPromise('Invoice', invoice, Handlebars.parse('{{ totalIn }}'));
		}).then(function (actual) {
			var expected = { totalIn: '-€ 200,00' };

			assert.deepEqual(actual, expected, "totalIn differ from expected");
			done();
		}).catch(done);
	});
});

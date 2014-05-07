var assert = require("assert")
var tools = require('./../index.js');
var cbc = require('communibase-connector-js');

require('when/monitor/console');

var factory = new tools.TemplateDataFactory({
	cbc: cbc
});

describe('Tool', function(){
	describe('#getTemplateData()', function(){
		it('should work', function(done) {
			var person = cbc.search('Membership', {}, { limit: 1 }).then(function (memberships) {
				factory.getTemplateData('Membership', memberships[0]).then(function (result) {
					assert.equal(typeof result, 'object');
					done();
				});
			});
		})
	})
})
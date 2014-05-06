var when, _;

when = require('when');
_ = require('lodash');

module.exports = {
	TemplateDataFactory: require('./TemplateDataFactory.js'),
	handlebarsHelpers: require('./handlebarsHelpers.js'),
	renderFile: require('./renderFile.js')
}
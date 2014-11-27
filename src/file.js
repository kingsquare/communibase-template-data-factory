'use strict';
var when = require('when');
var helpers = require('./handlebarsHelpers.js');
var fs = require('fs');
var Handlebars = require('handlebars');

/**
 *
 * @param {string} templatePath
 * @param {object} data
 * @returns {Promise} for rendered html string
 */
module.exports = function (templatePath, data) {
	var deferred = when.defer();

	fs.readFile(templatePath, function (err, source) {
		if (err) {
			deferred.reject(err);
			return;
		}

		try {
			var template = Handlebars.compile(source);
			deferred.resolve(template(data, {helpers: helpers}));
		} catch (e) {
			deferred.reject(e);
		}
	});
	return deferred.promise;
};
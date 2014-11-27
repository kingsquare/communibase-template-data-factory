var helpers = require('./handlebarsHelpers.js');
var fs = require('fs');
var Handlebars = require('handlebars');

/**
 *
 * @param {string} templatePath
 * @param {object} vars
 * @returns {Promise} for rendered html string
 */
module.exports = function (templatePath, vars) {
	var deferred = when.defer();

	fs.readFile(templatePath, function (err, data) {
		if (err) {
			deferred.reject(err);
			return;
		}

		try {
			var template = Handlebars.compile(source);
			deferred.resolve(template(vars, {helpers: helpers}));
		} catch (e) {
			deferred.reject(e);
		}
	});
	return deferred.promise;
};
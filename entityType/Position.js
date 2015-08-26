'use strict';

var BaseSerializer = require('./Base.js');
var helpers = require('../inc/helpers.js');
var _ = require('lodash');

module.exports = {
	getPromiseByPaths: function (entityTypeTitle, document, requestedPaths, parents) {
		var allVariablesAreRequested = (requestedPaths.length === 1 && requestedPaths[0].substring(0, 1) === '#');
		return BaseSerializer.getPromiseByPaths.apply(this, arguments).then(function (templateData) {
			if (allVariablesAreRequested || requestedPaths.indexOf('_active') !== -1) {
				templateData._active = !((document.startDate && new Date(document.startDate) > new Date()) ||
					(document.endDate && new Date(document.endDate) < new Date()));
			}
			return templateData;
		});
	}
};
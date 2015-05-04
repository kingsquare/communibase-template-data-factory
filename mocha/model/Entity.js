"use strict";

var _ = require('lodash');

module.exports = {
	create: function (entityType, params) {
		var object = {};

		_.each(require('./data/' + entityType).data, function (value, key) {
			object[key] = value;
		});

		_.each(params, function (value, key) {
			if (key.substr(-2) === 'Id') {
				// There is a need to call mongoose.Types.ObjectId, otherwise it doesn't work
				value = require('mongoose').Types.ObjectId(value.toString());
			}
			object[key] = value;
		});

		return object;
	},
	entityId: function (entityType) {
		return require('./data/' + entityType).entityId;
	}
};
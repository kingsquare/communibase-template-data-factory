"use strict";

var moment = require('moment');

module.exports = {
	_getTitlePromise: function (titleFields, entityTypeTitle, periodTariffList) {
		var result = periodTariffList.endOfTariff ?
			'Tarievenlijst t/m ' + moment(periodTariffList.endOfTariff).format('DD-MM-YYYY') :
			'Tarievenlijst zonder einddatum';
		return Promise.resolve([result]);
	}
};
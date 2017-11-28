'use strict';

var moment = require('moment');

module.exports = {
  _getTitlePromise: function _getTitlePromise(titleFields, entityTypeTitle, periodTariffList) {
    var result = periodTariffList.endOfTariff ? 'Tarievenlijst t/m ' + moment(periodTariffList.endOfTariff).format('D-M-YYYY') : 'Tarievenlijst zonder einddatum';
    return Promise.resolve([result]);
  }
};
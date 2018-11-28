const moment = require("moment");

module.exports = {
  _getTitlePromise(titleFields, entityTypeTitle, periodTariffList) {
    const result = periodTariffList.endOfTariff
      ? `Tarievenlijst t/m ${moment(periodTariffList.endOfTariff).format(
          "D-M-YYYY"
        )}`
      : "Tarievenlijst zonder einddatum";
    return Promise.resolve([result]);
  }
};

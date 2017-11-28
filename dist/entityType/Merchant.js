'use strict';

module.exports = {
  titleFields: ['merchantId'],
  _getTitlePromise: function _getTitlePromise(titleFields, entityTypeTitle, merchant) {
    var titles = [];

    titleFields.forEach(function (titleField) {
      titles.push(merchant[titleField]);
    });

    if (!merchant.data) {
      return Promise.resolve(titles);
    }

    return this.getTitlePromise('MerchantData', merchant.data).then(function (dataTitle) {
      titles.push(dataTitle);
      return titles;
    });
  }
};
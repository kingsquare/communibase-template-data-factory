

module.exports = {
  titleFields: ['merchantId'],
  _getTitlePromise(titleFields, entityTypeTitle, merchant) {
    const titles = [];

    titleFields.forEach((titleField) => {
      titles.push(merchant[titleField]);
    });

    if (!merchant.data) {
      return Promise.resolve(titles.join(' - '));
    }

    return this.getTitlePromise('MerchantData', merchant.data).then((dataTitle) => {
      titles.push(dataTitle);
      return titles;
    });
  }
};

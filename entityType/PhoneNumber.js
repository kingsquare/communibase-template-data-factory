

const BaseSerializer = require('./Base.js');

const formatSubscriberNumber = function (subscriberNumber) {
  // just to be sure no double spacing is applied...
  const spaceLessNumber = subscriberNumber.replace(/ /g, '');
  if (spaceLessNumber.length >= 6) {
    const spacePos = ((subscriberNumber.length <= 7) ? 3 : (subscriberNumber.length - 4));
    // just to be sure no double spacing is applied...
    subscriberNumber = (`${spaceLessNumber.slice(0, spacePos)} ${spaceLessNumber.slice(spacePos)}`);
  }

  return subscriberNumber;
};


module.exports = {
  titleFields: ['countryCode', 'areaCode', 'subscriberNumber', '{{ - }}', '{type}'],

  /**
   * Overloadable to manipulate getTitle behaviour
   *
   * @param {Array} chunks
   * @param {String} entityTypeTitle
   * @param {Object} document
   * @return {string}
   */
  composeTitle(chunks, entityTypeTitle, document) {
    if (chunks.length > 2) {
      chunks[chunks.length - 3] = formatSubscriberNumber(chunks[chunks.length - 3]);
    }

    return BaseSerializer.composeTitle.apply(this, arguments);
  },

  getPromiseByPaths(entityTypeTitle, phoneNumber, requestedPaths, parents) {
    const allVariablesAreRequested = (requestedPaths.length === 1 && requestedPaths[0].substring(0, 1) === '#');

    return BaseSerializer.getPromiseByPaths.apply(this, arguments).then((templateData) => {
      if (allVariablesAreRequested || requestedPaths.indexOf('combined') !== -1) {
        templateData.combined = phoneNumber.countryCode + phoneNumber.areaCode + phoneNumber.subscriberNumber;
      }

      return templateData;
    });
  }
};

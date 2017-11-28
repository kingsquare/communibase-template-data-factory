const _ = require('lodash');
const BaseSerializer = require('./Base.js');

module.exports = {
  titleFields: ['groupId', 'companyId', 'personId', 'membershipNumber'],
  composeTitle(chunks, entityTitle, document) {
    const groupName = chunks.shift();
    const companyName = chunks.shift();
    const personName = chunks.shift();
    const membershipNumber = chunks.shift();

    const newChunks = [groupName, ' - ', (_.isEmpty(personName) ? companyName : personName)];

    if (membershipNumber) {
      newChunks.push(' - ');
      newChunks.push(membershipNumber);
    }
    return BaseSerializer.composeTitle.apply(this, [newChunks, entityTitle, document]);
  },

  getPromiseByPaths(entityTypeTitle, document, requestedPaths, parents) {
    const allVariablesAreRequested = (requestedPaths.length === 1 && requestedPaths[0].substring(0, 1) === '#');
    return BaseSerializer.getPromiseByPaths.apply(this, arguments).then((templateData) => {
      if (allVariablesAreRequested || requestedPaths.indexOf('_active') !== -1) {
        templateData._active = !((document.startDate && new Date(document.startDate) > new Date())
          || (document.endDate && new Date(document.endDate) < new Date()));
      }
      return templateData;
    });
  }
};

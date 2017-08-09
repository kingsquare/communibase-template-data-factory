

const _ = require('lodash');
const BaseSerializer = require('./Base.js');
const Promise = require('bluebird');

module.exports = {
  titleFields: ['firstName', 'initials', 'middleName', 'lastName', 'maidenName'],
  composeTitle(chunks, entityTitle, document) {
    // Maiden name available: add the - but no spaces https://onzetaal.nl/taaladvies/advies/achternamen-combineren
    const maidenName = chunks.pop();
    if (!_.isEmpty(maidenName)) {
      chunks[3] = `${chunks[3]}-${maidenName}`;
    }

    // Initials available: pop off the firstName
    if (!_.isEmpty(chunks[1])) {
      chunks.shift();
    }

    return BaseSerializer.composeTitle.apply(this, arguments);
  },
  getPromiseByPaths(entityTypeTitle, document, requestedPaths, parents) {
    const self = this;
    const allVariablesAreRequested = (requestedPaths.length === 1 && requestedPaths[0].substring(0, 1) === '#');
    const membershipNumberRequested = (allVariablesAreRequested || requestedPaths.indexOf('membershipNumber') !== -1);
    const templateDataPromise = BaseSerializer.getPromiseByPaths.apply(this, arguments);
    if (!membershipNumberRequested) {
      return templateDataPromise;
    }

    // hydrate membershipNumber on request, see https://trello.com/c/bfsOJ1Mr/1569-exportcode-zou-toch-moeten
    return Promise.all([
      templateDataPromise,
      self.cbc.search('Membership', {
        personId: document._id,
        membershipNumber: { $gt: 0 }
      }, {
        fields: 'membershipNumber',
        limit: 1
      })
    ]).spread((templateData, membershipData) => {
      if (membershipData && membershipData.length) {
        templateData.membershipNumber = membershipData[0].membershipNumber;
      }
      return templateData;
    });
  }
};

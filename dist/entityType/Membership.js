'use strict';

var _ = require('lodash');
var BaseSerializer = require('./Base.js');

module.exports = {
  titleFields: ['groupId', 'companyId', 'personId', 'membershipNumber'],
  composeTitle: function composeTitle(chunks, entityTitle, document) {
    var groupName = chunks.shift();
    var companyName = chunks.shift();
    var personName = chunks.shift();
    var membershipNumber = chunks.shift();

    var newChunks = [groupName, ' - ', _.isEmpty(personName) ? companyName : personName];

    if (membershipNumber) {
      newChunks.push(' - ');
      newChunks.push(membershipNumber);
    }
    return BaseSerializer.composeTitle.apply(this, [newChunks, entityTitle, document]);
  },
  getPromiseByPaths: function getPromiseByPaths(entityTypeTitle, document, requestedPaths, parents) {
    var allVariablesAreRequested = requestedPaths.length === 1 && requestedPaths[0].substring(0, 1) === '#';
    return BaseSerializer.getPromiseByPaths.apply(this, arguments).then(function (templateData) {
      if (allVariablesAreRequested || requestedPaths.indexOf('_active') !== -1) {
        templateData._active = !(document.startDate && new Date(document.startDate) > new Date() || document.endDate && new Date(document.endDate) < new Date());
      }
      return templateData;
    });
  }
};
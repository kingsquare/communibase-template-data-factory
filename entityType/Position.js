

const BaseSerializer = require('./Base.js');
const helpers = require('../inc/helpers.js');
const _ = require('lodash');

module.exports = {
  getPromiseByPaths(entityTypeTitle, document, requestedPaths, parents) {
    const allVariablesAreRequested = (requestedPaths.length === 1 && requestedPaths[0].substring(0, 1) === '#');
    return BaseSerializer.getPromiseByPaths.apply(this, arguments).then((templateData) => {
      if (allVariablesAreRequested || requestedPaths.indexOf('_active') !== -1) {
        templateData._active = !((document.startDate && new Date(document.startDate) > new Date()) ||
          (document.endDate && new Date(document.endDate) < new Date()));
      }
      return templateData;
    });
  }
};

'use strict';

var BaseSerializer = require('./Base.js');
var helpers = require('../inc/helpers.js');
var _ = require('lodash');

module.exports = {
  titleFields: ['description'],
  getPromiseByPaths: function getPromiseByPaths(entityTypeTitle, document, requestedPaths, parents) {
    var allVariablesAreRequested = requestedPaths.length === 1 && requestedPaths[0].substring(0, 1) === '#';

    return BaseSerializer.getPromiseByPaths.apply(this, arguments).then(function (templateData) {
      var requestedTotalsVariables = helpers.getRequestedSubVariables(requestedPaths, 'totals');
      var incltaxMultiplier = document.taxPercentage ? (100 + document.taxPercentage) / 100 : 1;
      var totals = {
        ex: document.quantity * document.pricePerUnit,
        in: document.quantity * document.pricePerUnit * incltaxMultiplier,
        perUnitEx: document.pricePerUnit,
        perUnitIn: document.pricePerUnit * incltaxMultiplier
      };

      totals.exRounded = helpers.round(totals.ex, 2);
      totals.inRounded = helpers.round(totals.in, 2);
      totals.perUnitExRounded = helpers.round(totals.perUnitEx, 2);
      totals.perUnitInRounded = helpers.round(totals.perUnitIn, 2);

      if (requestedTotalsVariables.length !== 0) {
        templateData.totals = {};
      }

      _.each(totals, function (value, identifier) {
        if (requestedTotalsVariables.indexOf(identifier) !== -1) {
          templateData.totals[identifier] = value;
        }

        // support for legacy syntax -- deprecated!
        var dataKey = 'total' + helpers.ucfirst(identifier);
        if (requestedPaths.indexOf(dataKey) !== -1) {
          templateData[dataKey] = helpers.euro_format(value);
        }
      });

      if (allVariablesAreRequested || requestedPaths.indexOf('title') !== -1) {
        templateData.title = document.description;
      }

      return templateData;
    });
  }
};
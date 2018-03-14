'use strict';

var BaseSerializer = require('./Base.js');
var helpers = require('../inc/helpers.js');
var _ = require('lodash');

module.exports = {
  titleFields: ['invoiceNumber'],
  getPromiseByPaths: function getPromiseByPaths(entityTypeTitle, document, requestedPaths, parents) {
    var allVariablesAreRequested = requestedPaths.length === 1 && requestedPaths[0].substring(0, 1) === '#';

    return BaseSerializer.getPromiseByPaths.apply(this, arguments).then(function (templateData) {
      var totals = {
        ex: 0,
        exRounded: 0,
        exTaxes: {},
        exTaxesRounded: {},
        tax: 0,
        taxRounded: 0,
        taxes: {},
        taxesRounded: {},
        in: 0,
        inRounded: 0
      };

      document.invoiceItems.forEach(function (invoiceItem) {
        var taxPercentage = invoiceItem.taxPercentage;
        var taxMultiplier = taxPercentage ? taxPercentage / 100 : 0;
        var incltaxMultiplier = taxPercentage ? (100 + taxPercentage) / 100 : 1;

        var itemEx = invoiceItem.quantity * invoiceItem.pricePerUnit;
        var taxValue = itemEx * taxMultiplier;

        // https://trello.com/c/pdaBvS2Q/530-geen-prio-financieel-als-de-btw-grondslag-van-een-factuurregel-exact-0-
        if (itemEx !== 0) {
          if (totals.taxes[taxPercentage || 'null'] === undefined) {
            totals.taxes[taxPercentage || 'null'] = 0;
            totals.taxesRounded[taxPercentage || 'null'] = 0;
            totals.exTaxes[taxPercentage || 'null'] = 0;
            totals.exTaxesRounded[taxPercentage || 'null'] = 0;
          }
          totals.taxes[taxPercentage || 'null'] += taxValue;
          totals.taxesRounded[taxPercentage || 'null'] += helpers.round(taxValue, 2);
          totals.exTaxes[taxPercentage || 'null'] += itemEx;
          totals.exTaxesRounded[taxPercentage || 'null'] += helpers.round(itemEx, 2);
        }

        var itemExRounded = helpers.round(itemEx, 2);
        var taxValueRounded = helpers.round(taxValue, 2);
        totals.ex += itemEx;
        totals.exRounded += itemExRounded;
        totals.tax += taxValue;
        totals.taxRounded += taxValueRounded;
        totals.in += itemEx * (document.reverseChargedVat ? 1 : incltaxMultiplier);
        totals.inRounded += itemExRounded + (document.reverseChargedVat ? 0 : taxValueRounded);
      });

      _.each(totals, function (value, identifier) {
        if (_.isNumber(value)) {
          totals[identifier] = helpers.round(value, 2);
        }
      });

      _.each(['taxes', 'taxesRounded'], function (taxSumType) {
        _.each(totals[taxSumType], function (value, taxPercentage) {
          totals[taxSumType][taxPercentage] = helpers.round(value, 2);
        });
        var requestedTaxesVariables = helpers.getRequestedSubVariables(requestedPaths, taxSumType + '.#');
        if (requestedTaxesVariables.length !== 0) {
          templateData[taxSumType] = [];
          _.each(totals[taxSumType], function (value, taxPercentage) {
            var tax = {};

            if (taxPercentage === 'null') {
              return;
            }

            if (requestedTaxesVariables.indexOf('#') !== -1 || requestedTaxesVariables.indexOf('percentage') !== -1) {
              tax.percentage = taxPercentage;
            }
            if (requestedTaxesVariables.indexOf('#') !== -1 || requestedTaxesVariables.indexOf('value') !== -1) {
              tax.value = value;
            }
            if (requestedTaxesVariables.indexOf('#') !== -1 || requestedTaxesVariables.indexOf('total') !== -1) {
              tax.total = helpers.euro_format(value);
            }

            templateData[taxSumType].push(tax);
          });
        }
      });

      var requestedTotalsVariables = helpers.getRequestedSubVariables(requestedPaths, 'totals');
      if (requestedTotalsVariables.length !== 0) {
        templateData.totals = {};
      }
      _.each(totals, function (value, identifier) {
        if (requestedTotalsVariables.indexOf(identifier) !== -1) {
          templateData.totals[identifier] = value;
        }
        // support for legacy syntax -- deprecated!
        var dataKey = 'total' + helpers.ucfirst(identifier);
        if (requestedPaths.indexOf(dataKey) === -1) {
          return;
        }
        templateData[dataKey] = helpers.euro_format(totals[identifier]);
      });

      if (allVariablesAreRequested || requestedPaths.indexOf('isCredit') !== -1) {
        templateData.isCredit = totals.ex < -0.1;
      }

      if (!templateData.invoiceNumber && !document.invoiceNumber) {
        templateData.invoiceNumber = 'Pro forma';
      }
      return templateData;
    });
  }
};
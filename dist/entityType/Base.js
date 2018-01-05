'use strict';

var _ = require('lodash');
var Promise = require('bluebird');
var helpers = require('../inc/helpers.js');

var checkIfIsRequested = function checkIfIsRequested(fieldName, requestedPaths) {
  return requestedPaths.some(function (requestedPath) {
    return requestedPath.indexOf(fieldName) === 0 || requestedPath.substr(0, 1) === '#';
  });
};

// http://stackoverflow.com/questions/6452021/getting-timestamp-from-mongodb-id
var convertIdToDate = function convertIdToDate(record) {
  return new Date(parseInt(record._id.substring(0, 8), 16) * 1000);
};

function getNewParents(parents, document) {
  var result = parents.slice(0);
  result.unshift(document);
  return result;
}

function log(err) {
  if (process && process.env && process.env.NODE_ENV && process.env.NODE_ENV === 'development' && console) {
    // eslint-disable-next-line no-console
    console.error(err);
  }
}

module.exports = {
  titleFields: ['title'],
  getPromiseByPaths: function getPromiseByPaths(entityTypeTitle, document, requestedPaths, parents) {
    // jscs:disable requireCamelCaseOrUpperCaseIdentifiers
    document.__cb_type__ = entityTypeTitle;
    // jscs:enable requireCamelCaseOrUpperCaseIdentifiers
    if (!parents) {
      parents = [];
    }
    var self = this;
    var result = {};
    var subPromises = [];

    return this.getEntitiesHashPromise().then(function (entitiesHash) {
      if (document._id && checkIfIsRequested('_id', requestedPaths)) {
        result._id = document._id;
      }

      // add title if requested
      if (checkIfIsRequested('_title', requestedPaths)) {
        subPromises.push(self.getTitlePromise.apply(self, [entityTypeTitle, document, parents]).then(function (title) {
          result._title = title;
        }));
      }

      // add updatedAt if requested
      if (checkIfIsRequested('updatedAt', requestedPaths) && document.updatedAt) {
        result.updatedAt = new Date(document.updatedAt);
      }

      if (checkIfIsRequested('_createdAt', requestedPaths) && document._id) {
        result._createdAt = convertIdToDate(document);
      }

      // add updatedBy if requested
      if (checkIfIsRequested('updatedBy', requestedPaths) && document.updatedBy) {
        result.updatedBy = document.updatedBy;
      }

      // Expose _ALL_ attributes (not just commmunibase fields): https://trello.com/c/9yKbd7Zg/460-wat-klopt-er-nie
      /**
       * @param {Object} attribute
       * @param {string} attribute.ref
       */
      var entity = entitiesHash[entityTypeTitle];
      if (!entity) {
        // eslint-disable-next-line no-console
        console.log('Could not find entity', entityTypeTitle);
        return null;
      }

      _.each(entity.attributes, function (attribute) {
        var fieldNameIsRequested = checkIfIsRequested(attribute.title, requestedPaths);
        var type = attribute.type;
        if (!type) {
          type = attribute.type && attribute.type.type ? attribute.type.type : attribute.type;
        }

        // Do _NOT_ check attribute.title.substr(-2) === 'Id' --- Attributes may be named improperly
        // (e.g. Event.speaker)
        var isReference = type === 'ObjectId' && attribute.ref && entitiesHash[attribute.ref] && entitiesHash[attribute.ref].isResource || attribute.title.substr(-9) === 'Reference';
        if (!fieldNameIsRequested && !isReference) {
          return;
        }

        /* rewrite properties: emailAddressReference => emailAddress and documentReference => document */
        var referredDocumentProperty = attribute.title.substr(0, attribute.title.length - 9);
        var value = document[attribute.title];
        var requestedSubVariables = void 0;
        var requestedReferredSubVariables = void 0;

        switch (type) {
          case 'Date':
            if (fieldNameIsRequested && value) {
              result[attribute.title] = new Date(value);
            }
            return;

          case 'Mixed':
            if (fieldNameIsRequested && value) {
              result[attribute.title] = value;
            }
            return;

          case 'int':
          case 'float':
            if (fieldNameIsRequested) {
              result[attribute.title] = value;
            }
            return;

          case 'DocumentReference':
            if (!value) {
              return;
            }

            requestedSubVariables = helpers.getRequestedSubVariables(requestedPaths, attribute.title);
            requestedReferredSubVariables = helpers.getRequestedSubVariables(requestedPaths, referredDocumentProperty);

            if (requestedSubVariables.length) {
              subPromises.push(self.getPromiseByPaths.apply(self, ['DocumentReference', value, requestedSubVariables, getNewParents(parents, document)]).then(function (templateData) {
                result[attribute.title] = templateData;
              }));
            }

            if (requestedReferredSubVariables.length) {
              subPromises.push(self.cbc.getByRef(value, parents[parents.length - 1]).then(
              // Break the "parents-chain": the proper parent is resolved and does not have to
              // processed any further
              function (referredDocument) {
                return self.getPromiseByPaths.call(self,
                // The referered entity type...??
                entitiesHash[value.rootDocumentEntityType].attributes.find(function (obj) {
                  return obj.title === value.path[0].field;
                }).items, referredDocument, requestedReferredSubVariables, []).then(function (templateData) {
                  result[referredDocumentProperty] = templateData;
                });
              }).catch(function (e) {
                log(e);
              }));
            }

            return;
        }

        if ([undefined, null, true, false].indexOf(value) !== -1) {
          if (fieldNameIsRequested) {
            result[attribute.title] = value;
          }
          return;
        }

        if (Array.isArray(value)) {
          // is request for derived subdocument properties?
          var doTraverseSubdocuments = attribute.ref && entitiesHash[attribute.ref] && attribute.title.substr(-3) !== 'Ids';
          if (doTraverseSubdocuments) {
            if (fieldNameIsRequested) {
              result[attribute.title] = attribute.ref;
            }

            // applicableForGroupIds => applicableForGroups
            requestedSubVariables = helpers.getRequestedSubVariables(requestedPaths, attribute.title.substr(-3) + 's');
            if (requestedSubVariables.length === 0) {
              return;
            }

            result[attribute.title.substr(-3) + 's'] = [];

            subPromises.push(self.cbc.getByIds(attribute.ref, value).then(function (referredObjects) {
              var subSubPromises = [];

              referredObjects.forEach(function (referredObject) {
                subSubPromises.push(self.getPromiseByPaths.apply(self, [attribute.ref, referredObject, requestedSubVariables, getNewParents(parents, document)]).then(function (templateData) {
                  result[attribute.title.substr(-3) + 's'].push(templateData);
                }));
              });
              return Promise.all(subSubPromises);
            }, function () {}));
            return;
          }

          // @see https://trello.com/c/WFeSEuNT/1757-gin-export-regio-s-lukt-niet
          // May be literal request, for array of strings and used helpers
          //
          // requestedSubVariables = helpers.getRequestedSubVariables(requestedPaths, attribute.title);
          // if (requestedSubVariables.length === 0) {
          //  return;
          // }

          result[attribute.title] = [];
          // We need to maintain the array order --> process and add them in order of the original array!
          var arrayItemPromises = [];
          var requestedSubValuesForAll = helpers.getRequestedSubVariables(requestedPaths, attribute.title + '.#');
          value.forEach(function (subDocument, index) {
            // check for strings, e.g. Vasmo Company.classifications
            if (subDocument && entitiesHash[attribute.items]) {
              arrayItemPromises.push(self.getPromiseByPaths.apply(self, [attribute.items, subDocument, helpers.getRequestedSubVariables(requestedPaths, attribute.title + '.' + index).concat(requestedSubValuesForAll), getNewParents(parents, document)]));
              return;
            }

            // we dont know what to expect. Just add it all...
            arrayItemPromises.push(subDocument);
          });
          // We need to maintain the array order --> process and add them in order of the original array!
          subPromises.push(Promise.all(arrayItemPromises).then(function (templateDatas) {
            result[attribute.title] = templateDatas;
          }));
          return;
        }

        if (entitiesHash[type]) {
          if (!value) {
            return;
          }

          if (!isReference) {
            var referencedSubVariables = helpers.getRequestedSubVariables(requestedPaths, attribute.title);
            if (referencedSubVariables.length > 0) {
              subPromises.push(self.getPromiseByPaths.apply(self, [attribute.type, value, referencedSubVariables, getNewParents(parents, document)]).then(function (templateData) {
                result[attribute.title] = templateData;
              }));
            }
            return;
          }
          // something like membership.emailAddressReference

          // find the referenced values for e.g. emailAddressReference
          requestedSubVariables = helpers.getRequestedSubVariables(requestedPaths, attribute.title);
          if (requestedSubVariables.length !== 0) {
            subPromises.push(self.getPromiseByPaths(attribute.type, value, requestedSubVariables, getNewParents(parents, document)).then(function (templateData) {
              result[attribute.title] = templateData;
            }));
          }

          // also get the referenced values for e.g. emailAddress
          var referenceType = attribute.type.substr(0, attribute.type.length - 9);
          requestedSubVariables = helpers.getRequestedSubVariables(requestedPaths, referredDocumentProperty);
          if (!value || requestedSubVariables.length === 0) {
            return;
          }

          if (value.documentReference && value.documentReference.rootDocumentEntityType) {
            var parentDocument = null;
            var documentReference = value.documentReference;
            var rootDocumentEntityType = documentReference.rootDocumentEntityType;
            var rootDocumentEntityTypeNibbles = rootDocumentEntityType.split('.');
            if (rootDocumentEntityTypeNibbles[0] === 'parent') {
              // @todo findout why 3 ??
              parentDocument = parents[rootDocumentEntityTypeNibbles.length - 3];
            }
            subPromises.push(self.cbc.getByRef(documentReference, parentDocument).then(
            // Break the "parents-chain": the proper parent is resolved and does not have to
            // processed any further
            function (referredDocument) {
              return self.getPromiseByPaths.call(self, referenceType, referredDocument, requestedSubVariables, []).then(function (templateData) {
                result[referredDocumentProperty] = templateData;
              });
            }).catch(function (e) {
              log(e);
            }));
            return;
          }

          if (value[referredDocumentProperty]) {
            // a custom defined address / phoneNumber / emailAddress within a reference
            subPromises.push(self.getPromiseByPaths.apply(self, [referenceType, value[referredDocumentProperty], requestedSubVariables, getNewParents(parents, document)]).then(function (templateData) {
              result[referredDocumentProperty] = templateData;
            }));
          }
          return;
        }

        if (fieldNameIsRequested) {
          result[attribute.title] = value;
        }

        if (type === 'ObjectId' && isReference) {
          requestedSubVariables = helpers.getRequestedSubVariables(requestedPaths, attribute.title.substr(0, attribute.title.length - 2));

          if (requestedSubVariables.length === 0) {
            return;
          }

          subPromises.push(self.cbc.getById(attribute.ref, value).then(function (referredObject) {
            return self.getPromiseByPaths.apply(self, [attribute.ref, referredObject, requestedSubVariables, getNewParents(parents, document)]).then(function (templateData) {
              result[attribute.title.substr(0, attribute.title.length - 2)] = templateData;
            });
          }, function () {}));
        }
      });

      return Promise.all(subPromises).then(function () {
        return result;
      });
    });
  },


  /**
   * Overloadable to manipulate getTitle behaviour (e.g. memberships and phonenumbers)
   * Newlines and tabs need to be removed for e.g. AddressReferenceCombos to work properly
   *
   * @param {Array} chunks
   * @param {String} entityTitle
   * @param {Object} document
   * @return {string}
   */
  composeTitle: function composeTitle(chunks, entityTitle, document) {
    var id = document._id;
    var title = chunks.join(' ').trim().replace(/[ \r\n\t]+/g, ' ').replace(/ ,/g, ',');
    return title.length > 0 ? title : '<< ' + (id ? (this.stxt[entityTitle] || entityTitle) + ' ' + id : 'Nieuw "' + (this.stxt[entityTitle] || entityTitle) + '" document ') + ' >>';
  },


  /**
   * Overloadable and preferable over .get('_title')
   *
   * @param {Array} titleFields
   * @param {string} entityTypeTitle
   * @param {Object} document
   * @param {Array} parents
   * @returns {*|Promise}
   * @private
   */
  _getTitlePromise: function _getTitlePromise(titleFields, entityTypeTitle, document, parents) {
    var self = this;
    var titlePartPromises = [];

    _.each(titleFields, function (titlePart) {
      // addresses will be added later on for companies
      if (entityTypeTitle === 'Company' && titlePart === 'addresses') {
        return;
      }

      if (titlePart.substr(0, 2) === '{{') {
        titlePartPromises.push(titlePart.substr(2, titlePart.length - 4));
        return;
      }

      if (titlePart.substr(0, 1) === '{') {
        titlePart = titlePart.substr(0, titlePart.length - 1).substr(1);
      }

      var titlePartValue = document[titlePart];

      if (!titlePartValue && titlePartValue !== 0) {
        titlePartPromises.push('');
        return;
      }

      if (titlePart.substr(-2) === 'Id') {
        var modelName = titlePart[0].toUpperCase() + titlePart.substring(1, titlePart.length - 2);
        titlePartPromises.push(self.cbc.getById(modelName, titlePartValue).then(function (record) {
          if (!record) {
            return '';
          }
          return self.getTitlePromise.apply(self, [modelName, record]);
        }));
        return;
      }

      if (titlePart.substr(-9) === 'Reference') {
        if (!titlePartValue) {
          return;
        }

        var entityName = titlePart[0].toUpperCase() + titlePart.substring(1, titlePart.length - 9);

        if (titlePartValue.documentReference && titlePartValue.documentReference.rootDocumentEntityType) {
          // get the document reference title!
          var parentDocument = null;
          var rootDocumentEntityTypeNibbles = titlePartValue.documentReference.rootDocumentEntityType.split('.');
          if (rootDocumentEntityTypeNibbles[0] === 'parent') {
            parentDocument = parents[rootDocumentEntityTypeNibbles.length - 1];
          }
          titlePartPromises.push(self.cbc.getByRef(titlePartValue.documentReference, parentDocument).then(function (ref) {
            return self.getTitlePromise.call(self, entityName, ref);
          }).catch(function (e) {
            log(e);
            return Promise.resolve(['<< Verwijderd >>']);
          }));
          return;
        }

        // get the subdocument title!
        var subDocument = titlePartValue[titlePart.substring(0, titlePart.length - 9)];
        if (!subDocument) {
          return;
        }

        titlePartPromises.push(self.getTitlePromise.apply(self, [titlePart[0].toUpperCase() + titlePart.substring(1, titlePart.length - 9), subDocument]));
        return;
      }

      // E.g. type from Address should be translated from Private to Privé in the title{
      titlePartPromises.push(self.stxt[entityTypeTitle + '.' + titlePart + '.' + titlePartValue] || titlePartValue);
    });

    return Promise.all(titlePartPromises).catch(function (e) {
      log(e);
      return ['<< Onbekend, informatie ontbreekt >>'];
    });
  }
};
const _ = require('lodash');
const Promise = require('bluebird');
const helpers = require('../inc/helpers.js');

const checkIfIsRequested = (fieldName, requestedPaths) => requestedPaths.some(
  requestedPath => ((requestedPath.indexOf(fieldName) === 0) || (requestedPath.substr(0, 1) === '#'))
);

// http://stackoverflow.com/questions/6452021/getting-timestamp-from-mongodb-id
const convertIdToDate = record => new Date(parseInt(record._id.substring(0, 8), 16) * 1000);

function getNewParents(parents, document) {
  const result = parents.slice(0);
  result.unshift(document);
  return result;
}

function log(e) {
  if (process && process.env && process.env.NODE_ENV && process.env.NODE_ENV === 'development' && console) {
    console.log(e);
  }
}

module.exports = {
  titleFields: ['title'],
  getPromiseByPaths(entityTypeTitle, document, requestedPaths, parents) {
    // jscs:disable requireCamelCaseOrUpperCaseIdentifiers
    document.__cb_type__ = entityTypeTitle;
    // jscs:enable requireCamelCaseOrUpperCaseIdentifiers
    if (!parents) {
      parents = [];
    }
    const self = this;
    const result = {};
    const subPromises = [];

    return this.getEntitiesHashPromise().then((entitiesHash) => {
      if (document._id && checkIfIsRequested('_id', requestedPaths)) {
        result._id = document._id;
      }

      // add title if requested
      if (checkIfIsRequested('_title', requestedPaths)) {
        subPromises.push(self.getTitlePromise.apply(self, [entityTypeTitle, document, parents]).then((title) => {
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
      const entity = entitiesHash[entityTypeTitle];
      if (!entity) {
        console.log('Could not find entity', entityTypeTitle);
        return null;
      }

      _.each(entity.attributes, (attribute) => {
        const fieldNameIsRequested = checkIfIsRequested(attribute.title, requestedPaths);
        let type = attribute.type;
        if (!type) {
          type = ((attribute.type && attribute.type.type) ? attribute.type.type : attribute.type);
        }

        // Do _NOT_ check attribute.title.substr(-2) === 'Id' --- Attributes may be named improperly
        // (e.g. Event.speaker)
        const isReference = (
          (type === 'ObjectId' && attribute.ref && entitiesHash[attribute.ref] &&
              entitiesHash[attribute.ref].isResource) ||
          ((attribute.title.substr(-9) === 'Reference') && (type !== 'DocumentReference'))
        );
        if (!fieldNameIsRequested && !isReference) {
          return;
        }

        const value = document[attribute.title];
        if (type === 'Date') {
          if (fieldNameIsRequested && value) {
            result[attribute.title] = new Date(value);
          }
          return;
        }
        if (type === 'Mixed') {
          if (fieldNameIsRequested && value) {
            result[attribute.title] = value;
          }
          return;
        }

        if ([undefined, null, true, false].indexOf(value) !== -1 || type === 'int' || type === 'float') {
          if (fieldNameIsRequested) {
            result[attribute.title] = value;
          }
          return;
        }

        let requestedSubVariables;
        if (Array.isArray(value)) {
          if (attribute.ref) {
            if (fieldNameIsRequested) {
              result[attribute.title] = attribute.ref;
            }

            if (!entitiesHash[attribute.ref] || (attribute.title.substr(-3) !== 'Ids')) {
              return;
            }
            // applicableForGroupIds => applicableForGroups
            requestedSubVariables = helpers.getRequestedSubVariables(requestedPaths, `${attribute.title.substr(-3)}s`);
            if (requestedSubVariables.length === 0) {
              return;
            }

            result[`${attribute.title.substr(-3)}s`] = [];

            subPromises.push(self.cbc.getByIds(attribute.ref, value).then((referredObjects) => {
              const subSubPromises = [];

              referredObjects.forEach((referredObject) => {
                subSubPromises.push(self.getPromiseByPaths.apply(self, [attribute.ref, referredObject,
                  requestedSubVariables, getNewParents(parents, document)]).then((templateData) => {
                    result[`${attribute.title.substr(-3)}s`].push(templateData);
                  }));
              });
              return Promise.all(subSubPromises);
            }, () => { }));
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
          const arrayItemPromises = [];
          const requestedSubValuesForAll = helpers.getRequestedSubVariables(requestedPaths, `${attribute.title}.#`);
          value.forEach((subDocument, index) => {
            // check for strings, e.g. Vasmo Company.classifications
            if (subDocument && entitiesHash[attribute.items]) {
              arrayItemPromises.push(self.getPromiseByPaths.apply(self, [attribute.items, subDocument,
                helpers.getRequestedSubVariables(
                    requestedPaths, `${attribute.title}.${index}`).concat(requestedSubValuesForAll
                ), getNewParents(parents, document)]));
              return;
            }

            // we dont know what to expect. Just add it all...
            arrayItemPromises.push(subDocument);
          });
          // We need to maintain the array order --> process and add them in order of the original array!
          subPromises.push(Promise.all(arrayItemPromises).then((templateDatas) => {
            result[attribute.title] = templateDatas;
          }));
          return;
        }

        if (entitiesHash[type]) {
          if (!value) {
            return;
          }

          if (!isReference) {
            const referencedSubVariables = helpers.getRequestedSubVariables(requestedPaths, attribute.title);
            if (referencedSubVariables.length > 0) {
              subPromises.push(self.getPromiseByPaths.apply(self, [attribute.type, value,
                referencedSubVariables, getNewParents(parents, document)]).then((templateData) => {
                  result[attribute.title] = templateData;
                }));
            }
            return;
          }
          // something like membership.emailAddressReference

          // find the referenced values for e.g. emailAddressReference
          requestedSubVariables = helpers.getRequestedSubVariables(requestedPaths, attribute.title);
          if (requestedSubVariables.length !== 0) {
            subPromises.push(self.getPromiseByPaths(attribute.type, value, requestedSubVariables,
                getNewParents(parents, document)).then((templateData) => {
                  result[attribute.title] = templateData;
                }));
          }

          // also get the referenced values for e.g. emailAddress
          const referredDocumentProperty = attribute.title.substr(0, (attribute.title.length - 9));
          const referenceType = attribute.type.substr(0, (attribute.type.length - 9));
          requestedSubVariables = helpers.getRequestedSubVariables(requestedPaths, referredDocumentProperty);
          if (!value || (requestedSubVariables.length === 0)) {
            return;
          }

          if (value.documentReference && value.documentReference.rootDocumentEntityType) {
            let parentDocument = null;
            const documentReference = value.documentReference;
            const rootDocumentEntityType = documentReference.rootDocumentEntityType;
            const rootDocumentEntityTypeNibbles = rootDocumentEntityType.split('.');
            if (rootDocumentEntityTypeNibbles[0] === 'parent') {
              // @todo findout why 3 ??
              parentDocument = parents[rootDocumentEntityTypeNibbles.length - 3];
            }
            subPromises.push(self.cbc.getByRef(documentReference, parentDocument).then(
              // Break the "parents-chain": the proper parent is resolved and does not have to
              // processed any further
              referredDocument => self.getPromiseByPaths.call(
                self,
                referenceType,
                referredDocument,
                requestedSubVariables,
                []
              ).then((templateData) => {
                result[referredDocumentProperty] = templateData;
              })
            ).catch((e) => {
              log(e);
            }));
            return;
          }

          if (value[referredDocumentProperty]) {
            // a custom defined address / phoneNumber / emailAddress within a reference
            subPromises.push(self.getPromiseByPaths.apply(self, [referenceType, value[referredDocumentProperty],
              requestedSubVariables, getNewParents(parents, document)]).then((templateData) => {
                result[referredDocumentProperty] = templateData;
              })
            );
          }
          return;
        }

        if (fieldNameIsRequested) {
          result[attribute.title] = value;
        }

        if (type === 'ObjectId' && isReference) {
          requestedSubVariables = helpers.getRequestedSubVariables(requestedPaths,
            attribute.title.substr(0, (attribute.title.length - 2)));

          if (requestedSubVariables.length === 0) {
            return;
          }

          subPromises.push(self.cbc.getById(attribute.ref, value).then(
            referredObject => self.getPromiseByPaths.apply(self, [attribute.ref, referredObject,
              requestedSubVariables, getNewParents(parents, document)]).then((templateData) => {
                result[attribute.title.substr(0, (attribute.title.length - 2))] = templateData;
              }),
            () => { }
          ));
        }
      });

      return Promise.all(subPromises).then(() => result);
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
  composeTitle(chunks, entityTitle, document) {
    const id = document._id;
    const title = chunks.join(' ').trim().replace(/[ \r\n\t]+/g, ' ').replace(/ ,/g, ',');
    return (title.length > 0 ? title : (`<< ${id ?
      `${this.stxt[entityTitle] || entityTitle} ${id}` :
      `Nieuw "${this.stxt[entityTitle] || entityTitle}" document `} >>`));
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
  _getTitlePromise(titleFields, entityTypeTitle, document, parents) {
    const self = this;
    const titlePartPromises = [];

    _.each(titleFields, (titlePart) => {
      // addresses will be added later on for companies
      if (entityTypeTitle === 'Company' && titlePart === 'addresses') {
        return;
      }

      if (titlePart.substr(0, 2) === '{{') {
        titlePartPromises.push(titlePart.substr(2, titlePart.length - 4));
        return;
      }

      if ((titlePart.substr(0, 1) === '{')) {
        titlePart = titlePart.substr(0, titlePart.length - 1).substr(1);
      }

      const titlePartValue = document[titlePart];

      if (!titlePartValue && titlePartValue !== 0) {
        titlePartPromises.push('');
        return;
      }

      if (titlePart.substr(-2) === 'Id') {
        const modelName = titlePart[0].toUpperCase() + titlePart.substring(1, titlePart.length - 2);
        titlePartPromises.push(self.cbc.getById(modelName, titlePartValue).then((record) => {
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

        const entityName = titlePart[0].toUpperCase() + titlePart.substring(1, titlePart.length - 9);

        if (titlePartValue.documentReference && titlePartValue.documentReference.rootDocumentEntityType) {
          // get the document reference title!
          let parentDocument = null;
          const rootDocumentEntityTypeNibbles = titlePartValue.documentReference.rootDocumentEntityType.split('.');
          if (rootDocumentEntityTypeNibbles[0] === 'parent') {
            parentDocument = parents[rootDocumentEntityTypeNibbles.length - 1];
          }
          titlePartPromises.push(self.cbc.getByRef(titlePartValue.documentReference, parentDocument).then(
            ref => self.getTitlePromise.call(self, entityName, ref)
          ).catch((e) => {
            log(e);
            return Promise.resolve(['<< Verwijderd >>']);
          }));
          return;
        }

        // get the subdocument title!
        const subDocument = titlePartValue[titlePart.substring(0, titlePart.length - 9)];
        if (!subDocument) {
          return;
        }

        titlePartPromises.push(self.getTitlePromise.apply(self, [titlePart[0].toUpperCase() +
          titlePart.substring(1, titlePart.length - 9), subDocument]));
        return;
      }

      // E.g. type from Address should be translated from Private to Privé in the title{
      titlePartPromises.push(self.stxt[`${entityTypeTitle}.${titlePart}.${titlePartValue}`] || titlePartValue);
    });

    return Promise.all(titlePartPromises).catch((e) => {
      log(e);
      return ['<< Onbekend, informatie ontbreekt >>'];
    });
  }
};

/* eslint-disable global-require */
const Promise = require("bluebird");
const _ = require("lodash");

let debug = false;

/**
 * Gets all requested paths based on the given template. When inserting:
 * {{invoiceNumber}} - {{#invoiceItems}} {{totalEx}} {{/invoiceItems}}
 * It should return:
 * ["invoiceNumber", "invoiceItems.#.totalEx"]
 *
 * @param {object} node
 * @returns {Array} result - The requested paths
 */
function _getPaths(node) {
  let result = [];
  if (debug) {
    // eslint-disable-next-line no-console
    console.log(`${JSON.stringify(node)}\n\n`);
  }

  if (!node || !node.type) {
    return result;
  }

  let blockKeys;
  switch (node.type.toLowerCase()) {
    // E.g. 'date' / 'debtor.debtorNumber'
    case "id":
      result.push(node.idName);
      break;

    case "program":
      node.statements.forEach(statement => {
        _getPaths(statement).forEach(variable => {
          result.push(variable);
        });
      });
      break;

    // E.g. #each / #if / #compare / '#invoiceItems' / '#ifIsCredit'
    case "block":
      blockKeys = _getPaths(node.mustache);

      if (
        (!node.mustache.isHelper || node.mustache.id.string === "each") &&
        node.program
      ) {
        _getPaths(node.program).forEach(subValue => {
          result.push(`${blockKeys[0]}.#.${subValue}`);
        });
        break;
      }

      if (node.mustache.id.string === "filter") {
        // look for used properties in equation
        [
          node.mustache.params[1],
          node.mustache.params[node.mustache.params.length === 4 ? 3 : 2]
        ].forEach(possiblePropertyNode => {
          switch (possiblePropertyNode.type) {
            case "STRING":
              // e.g. ../session.personId
              result.push(`${blockKeys[0]}.#.${possiblePropertyNode.string}`);
              break;

            case "ID":
              // e.g. personId
              result.push(possiblePropertyNode.string);
              break;
          }
        });

        _getPaths(node.program).forEach(subValue => {
          // indexes may change due to filtering: always request __all__ subValues
          result.push(
            subValue.replace(/^results\.(\d+|#)\./, `${blockKeys[0]}.#.`)
          );
        });
        break;
      }

      result = blockKeys;

      if (node.program) {
        _getPaths(node.program).forEach(variable => {
          result.push(variable);
        });
      }
      if (node.inverse) {
        _getPaths(node.inverse).forEach(variable => {
          result.push(variable);
        });
      }
      break;

    // E.g. '{{#compare person.gender 'M'}}'
    case "mustache":
      if (!node.isHelper) {
        result.push(node.id.idName);
        break;
      }

      node.params.forEach(param => {
        _getPaths(param).forEach(variable => {
          result.push(variable);
        });
      });
      break;
  }

  return result;
}

const entitySerializers = {
  Base: require("./entityType/Base.js"),
  Address: require("./entityType/Address.js"),
  Company: require("./entityType/Company.js"),
  Contact: require("./entityType/Contact.js"),
  ContactPersonMatchResult: require("./entityType/ContactPersonMatchResult.js"),
  Debtor: require("./entityType/Debtor.js"),
  DocumentReference: require("./entityType/DocumentReference.js"),
  EmailAddress: require("./entityType/EmailAddress.js"),
  EndpointDescription: require("./entityType/EndpointDescription.js"),
  Event: require("./entityType/Event.js"),
  File: require("./entityType/File.js"),
  Invoice: require("./entityType/Invoice.js"),
  InvoiceItem: require("./entityType/InvoiceItem.js"),
  Membership: require("./entityType/Membership.js"),
  Merchant: require("./entityType/Merchant.js"),
  MerchantData: require("./entityType/MerchantData.js"),
  Participant: require("./entityType/Participant.js"),
  PeriodicTariffList: require("./entityType/PeriodicTariffList.js"),
  Person: require("./entityType/Person.js"),
  PhoneNumber: require("./entityType/PhoneNumber.js"),
  Position: require("./entityType/Position.js"),
  PropertyAccessDescription: require("./entityType/PropertyAccessDescription.js"),
  TariffDecay: require("./entityType/TariffDecay.js"),
  User: require("./entityType/User.js"),
  VersionInformation: require("./entityType/VersionInformation.js")
};

function getCorrespondingSerializer(entityTypeTitle, propertyName) {
  return entitySerializers[entityTypeTitle] &&
    entitySerializers[entityTypeTitle][propertyName]
    ? entitySerializers[entityTypeTitle][propertyName]
    : entitySerializers.Base[propertyName];
}

module.exports = function exports(config) {
  this.cbc = config.cbc || require("communibase-connector-js");
  this.stxt = config.stxt || {};

  /**
   * Returns all data to be assign to template, based on the wizard-source object
   *
   * @param {String} entityTypeTitle - The entity type (i.e. Person, Shift, etc)
   * @param {Object} document - The actual document (entity) instance which should be templatified
   * @param {Handlebars} template - The template this is based on
   * @returns {Promise}
   */
  this.getPromise = function getPromise(entityTypeTitle, document, template) {
    return this.getPromiseByPaths(
      entityTypeTitle,
      document,
      this.getPaths(template)
    );
  };

  this.getEntitiesHashPromise = function getEntitiesHashPromise() {
    if (!this.entitiesHashPromise) {
      this.entitiesHashPromise = this.cbc
        .getAll("EntityType")
        .then(entities => {
          const entitiesHash = {};
          entities.forEach(entity => {
            entitiesHash[entity.title] = entity;
          });
          return entitiesHash;
        })
        .then(entitiesHash => {
          entitiesHash.File = {
            isResource: true
          };
          return entitiesHash;
        });
    }
    return this.entitiesHashPromise;
  };

  /**
   * Returns all data to be assigned to template, based on the requested variables / paths
   *
   * @param {String} entityTypeTitle - The entity type (i.e. Person, Shift, etc)
   * @param {Object} document - The actual document (entity) instance which should be templatified
   * @param {Array} requestedPaths - An array of all values that are requested from the document
   * @param {Array} parents - An array of objects, introduce option to traverse back to parent objects
   * @returns {Promise}
   */
  this.getPromiseByPaths = function getPromiseByPaths(
    entityTypeTitle,
    document,
    requestedPaths,
    parents
  ) {
    const serializer = getCorrespondingSerializer(
      entityTypeTitle,
      "getPromiseByPaths"
    );
    return serializer.call(
      this,
      entityTypeTitle,
      document,
      requestedPaths,
      parents
    );
  };

  this.getTitlePromise = function getTitlePromise(
    entityTypeTitle,
    document,
    parents
  ) {
    if (
      entityTypeTitle.substr(-9) === "Reference" &&
      entityTypeTitle !== "DocumentReference"
    ) {
      if (!document) {
        return Promise.resolve("");
      }

      // get the document reference title!
      if (
        document.documentReference &&
        document.documentReference.rootDocumentEntityType
      ) {
        if (!parents) {
          parents = [];
        }
        let parentDocument = null;
        const rootDocumentEntityTypeNibbles = document.documentReference.rootDocumentEntityType.split(
          "."
        );
        if (rootDocumentEntityTypeNibbles[0] === "parent") {
          parents.unshift(document);
          parentDocument = parents[rootDocumentEntityTypeNibbles.length - 1];
        }
        return this.cbc
          .getByRef(document.documentReference, parentDocument)
          .then(ref =>
            this.getTitlePromise.call(
              this,
              entityTypeTitle.substr(0, entityTypeTitle.length - 9),
              ref,
              parents
            )
          )
          .catch(() => Promise.resolve("<< Verwijderd >>"));
      }

      // get the subdocument title!
      const subDocument =
        document[
          entityTypeTitle[0].toLowerCase() +
            entityTypeTitle.substring(1, entityTypeTitle.length - 9)
        ];
      if (!subDocument) {
        return Promise.resolve("");
      }

      return this.getTitlePromise.apply(this, [
        entityTypeTitle.substring(0, entityTypeTitle.length - 9),
        subDocument
      ]);
    }

    const _getTitlePromise = getCorrespondingSerializer(
      entityTypeTitle,
      "_getTitlePromise"
    );
    const titleFields = getCorrespondingSerializer(
      entityTypeTitle,
      "titleFields"
    );
    const composeTitle = getCorrespondingSerializer(
      entityTypeTitle,
      "composeTitle"
    );

    return _getTitlePromise
      .call(this, titleFields, entityTypeTitle, document)
      .then(titleParts =>
        composeTitle.call(this, titleParts, entityTypeTitle, document)
      )
      .catch(err => {
        // this should never happen!
        // eslint-disable-next-line no-console
        console.error(err);
        return Promise.resolve("- kon niet worden gevonden -");
      });
  };

  this.getPaths = function getPaths(node) {
    // sanitize paths
    return _.uniq(
      _getPaths(node).map(path => {
        // find and process parent references
        const newPath = [];
        // trim and split
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/Trim + dots
        const nibbles = path
          .replace(/^[\s\uFEFF\xA0.]+|[\s\uFEFF\xA0.]+$/g, "")
          .split(".");
        for (let i = 0; i < nibbles.length; i += 1) {
          let currentNibble = nibbles[i];

          // detect '..'
          let parentRequested =
            currentNibble === "" &&
            nibbles.length >= i + 2 &&
            nibbles[i + 1] === "" &&
            nibbles[i + 2].indexOf("/") === 0;
          while (parentRequested) {
            // traverse to parent...
            const poppedNibble = newPath.pop();
            // parent is array iterator?
            if (poppedNibble.match(/^(#|\d+)$/) !== null) {
              newPath.pop();
            }

            i += 2;
            // more parent refs coming...
            if (nibbles[i] === "/") {
              nibbles[i] = "";
            } else {
              currentNibble = nibbles[i].substr(1);
              parentRequested = false;
            }
          }
          newPath.push(currentNibble);
        }
        return newPath.join(".");
      })
    );
  };

  this.setStxt = function setStxt(stxt) {
    this.stxt = stxt;
  };

  this.setSerializers = serializers => {
    Object.assign(entitySerializers, serializers);
  };

  this.setDebug = function setDebug(enable) {
    debug = enable;
  };
};

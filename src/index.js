/* eslint-disable global-require */
const Promise = require("bluebird");
const { getTemplatePaths } = require("./inc/HandlebarsAST");

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
   * @param {Array} [parents] - An array of objects, introduce option to traverse back to parent objects
   * @returns {Promise}
   */
  this.getPromise = function getPromise(
    entityTypeTitle,
    document,
    template,
    parents
  ) {
    return this.getPromiseByPaths(
      entityTypeTitle,
      document,
      this.getPaths(template),
      parents
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
    return getTemplatePaths(node).map(path => {
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
    });
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

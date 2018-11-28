const Promise = require("bluebird");
const BaseSerializer = require("./Base.js");
const helpers = require("../inc/helpers.js");

module.exports = {
  _getTitlePromise(titleFields, entityTypeTitle, document) {
    const self = this;

    // document-references do not have a regular ID: make one up based on the title!
    // empty DocumentReference may have a manually set name, e.g. "<< Zie specificatie >>"
    if (document._title) {
      return Promise.resolve([document._title]);
    }

    if (!document) {
      return Promise.resolve(["<< Zie specificatie >>"]);
    }

    const rootDocumentEntityType = document.rootDocumentEntityType;
    if (!rootDocumentEntityType) {
      return Promise.resolve(["<< Zie specificatie >>"]);
    }

    let title = "Verwijzing naar ";
    title += `${this.stxt[rootDocumentEntityType] ||
      rootDocumentEntityType} - ${document.rootDocumentId}`;

    if (document.path && document.path.forEach) {
      document.path.forEach(nibble => {
        if (nibble && nibble.field && nibble.objectId) {
          title += ` - ${self.stxt[nibble.field] || nibble.field} - ${
            nibble.objectId
          }`;
        }
      });
    }
    return Promise.resolve([title]);
  },

  getPromiseByPaths(entityTypeTitle, document, requestedPaths, parents) {
    const self = this;
    return BaseSerializer.getPromiseByPaths
      .apply(this, arguments)
      .then(templateData => {
        const rootDocumentPaths = helpers.getRequestedSubVariables(
          requestedPaths,
          "rootDocument"
        );
        if (
          !document.rootDocumentEntityType ||
          rootDocumentPaths.length === 0
        ) {
          return templateData;
        }

        const rootDocumentEntityTypeNibbles = document.rootDocumentEntityType.split(
          "."
        );
        const parentPromise =
          rootDocumentEntityTypeNibbles[0] === "parent"
            ? Promise.resolve(parents[rootDocumentEntityTypeNibbles.length - 1])
            : self.cbc.getById(
                document.rootDocumentEntityType,
                document.rootDocumentId
              );
        return parentPromise
          .then(parent => {
            const parentType =
              rootDocumentEntityTypeNibbles[0] === "parent"
                ? parent.__cb_type__
                : document.rootDocumentEntityType;
            return self.getPromiseByPaths(
              parentType,
              parent,
              rootDocumentPaths,
              []
            );
          })
          .then(rootDocumentData => {
            templateData.rootDocument = rootDocumentData;
            return templateData;
          })
          .catch((/* err */) =>
            // e.g. parent unavailable?
            ({}));
      });
  }
};

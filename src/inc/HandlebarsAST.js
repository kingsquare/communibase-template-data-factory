const uniq = require("lodash/uniq");

const debug = false;

const isHelper = function(node) {
  // In v2 we had helper hints in the AST (`node.isHelper`)..
  if (typeof node.isHelper !== "undefined") {
    return node.isHelper;
  }
  // in v4 this information is not available in the AST so we need to
  // check this our self... To do this we use the following code taken from
  // https://github.com/wycats/handlebars.js/blob/95d84badcae89aa72a6f1433b851304700320920/lib/handlebars/compiler/ast.js
  return (
    node.type === "SubExpression" ||
    ((node.type === "MustacheStatement" || node.type === "BlockStatement") &&
      !!((node.params && node.params.length) || node.hash))
  );
};

module.exports.getV2Paths = node => {
  let result = [];

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
        this.getV2Paths(statement).forEach(variable => {
          result.push(variable);
        });
      });
      break;

    // E.g. #each / #if / #compare / '#invoiceItems' / '#ifIsCredit'
    case "block":
      blockKeys = this.getV2Paths(node.mustache);

      if (
        (!isHelper(node.mustache) || node.mustache.id.string === "each") &&
        node.program
      ) {
        this.getV2Paths(node.program).forEach(subValue => {
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

        this.getV2Paths(node.program).forEach(subValue => {
          // indexes may change due to filtering: always request __all__ subValues
          result.push(
            subValue.replace(/^results\.(\d+|#)\./, `${blockKeys[0]}.#.`)
          );
        });
        break;
      }

      result = blockKeys;

      if (node.program) {
        this.getV2Paths(node.program).forEach(variable => {
          result.push(variable);
        });
      }
      if (node.inverse) {
        this.getV2Paths(node.inverse).forEach(variable => {
          result.push(variable);
        });
      }
      break;

    // E.g. '{{#compare person.gender 'M'}}'
    case "mustache":
      if (!isHelper(node)) {
        result.push(node.id.idName);
        break;
      }

      node.params.forEach(param => {
        this.getV2Paths(param).forEach(variable => {
          result.push(variable);
        });
      });
      break;
  }

  return result;
};

module.exports.getV4Paths = node => {
  let result = [];
  if (!node || !node.type) {
    return result;
  }
  let blockKeys;
  switch (node.type) {
    case "Program":
      node.body.forEach(item => {
        this.getV4Paths(item).forEach(variable => {
          result.push(variable);
        });
      });
      break;
    case "BlockStatement":
      // const blockKeys = node.params.map(param => this.getV4Paths(param));
      blockKeys = [];
      node.params.forEach(param => {
        this.getV4Paths(param).forEach(variable => {
          blockKeys.push(variable);
        });
      });

      if (
        (!isHelper(node) || (node.path && node.path.original === "each")) &&
        node.program
      ) {
        this.getV4Paths(node.program).forEach(subValue => {
          result.push(`${blockKeys[0]}.#.${subValue}`);
        });
        break;
      }

      if (node.path && node.path.original === "filter") {
        // look for used properties in equation
        [node.params[1], node.params[node.params.length === 4 ? 3 : 2]].forEach(
          possiblePropertyNode => {
            switch (possiblePropertyNode.type) {
              case "StringLiteral":
                // e.g. ../session.personId
                result.push(
                  `${blockKeys[0]}.#.${possiblePropertyNode.original}`
                );
                break;

              // @ TODO BooleanLiteral ?
              // @ TODO the following
              case "ID":
                // e.g. personId
                result.push(possiblePropertyNode.original);
                break;
            }
          }
        );

        if (node.program) {
          this.getV4Paths(node.program).forEach(subValue => {
            // indexes may change due to filtering: always request __all__ subValues
            result.push(
              subValue.replace(/^results\.(\d+|#)\./, `${blockKeys[0]}.#.`)
            );
          });
        }
        break;
      }

      result = blockKeys;
      // if (node.path) {
      //   result = this.getV4Paths(node.path);
      // }

      if (node.program) {
        this.getV4Paths(node.program).forEach(variable => {
          result.push(variable);
        });
      }

      if (node.inverse) {
        this.getV4Paths(node.inverse).forEach(variable => {
          result.push(variable);
        });
      }
      break;

    case "MustacheStatement":
      if (!isHelper(node)) {
        result.push(node.path.original);
      }

      if (node.params) {
        node.params.forEach(param => {
          this.getV4Paths(param).forEach(variable => {
            result.push(variable);
          });
        });
      }
      break;
    case "PathExpression":
      result.push(node.original);
      break;
  }
  return result;
};

/**
 * Gets all requested paths based on the given template. When inserting:
 * {{invoiceNumber}} - {{#invoiceItems}} {{totalEx}} {{/invoiceItems}}
 * It should return:
 * ["invoiceNumber", "invoiceItems.#.totalEx"]
 *
 * This supports Handlebars >=2.0.0 <=4
 *
 * @param {object} node
 *
 * @returns {Array} result - The requested paths
 */
module.exports.getTemplatePaths = node => {
  if (debug) {
    // eslint-disable-next-line no-console
    console.log(`${JSON.stringify(node)}\n\n`);
  }

  let paths = [];

  // v2
  if (node.statements) {
    paths = this.getV2Paths(node);
  }

  // v3 / v4
  if (node.body) {
    paths = this.getV4Paths(node);
  }

  if (debug) {
    // eslint-disable-next-line no-console
    console.log(uniq(paths));
  }
  return uniq(paths);
};

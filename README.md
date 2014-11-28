communibase-render-tools
========================

A collection of helper functions to simplify the use of Communibase data in Templates.

Consists of

- TemplateDataFactory
Enrich Communibase-data in any way possible for easy use in dynamic templates.

- Handlebars helpers
A set of helpers for the Handlebars template engine, configured for datatypes as coming from the communibase service

- Promisified rendering of template files and string
A pre-promisified interface for the Handelbars render engine.


Example usage:

```
var tools = require('communibase-render-tools');
// optional config can be passed to the tools via i.e. var tools = require('communibase-render-tools')({tz: 'Europe/London', 'locale': 'gb'});
var factory = new tools.templateDataFacory({ ... your options ...});
factory.getTemplateDataPromise("Person", person).then(function () { ... })

// and / or

Handlebars.registerHelper(tools.handlebarsHelpers);

// and / or

tools.renderFile('myTemplate.hbs', {}).then(...)


```

Constructor options
===================

All options for the constructor are optional. Possible options:

__cbc__: an instance of the Communibase Connector. Will be spawned if not supplied

__maxNestLevel__: Default 5. How deep should ```getTemplateData``` iterate with retrieving data.


Tool methods
============

Expand all possible paths for a certain document, making it more easy to use it as a source for templates.

```
tool.getTemplateDataPromise(entityTypeTitle, document)
```


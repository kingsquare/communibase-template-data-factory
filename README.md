# communibase-template-data-factory

Enrich Communibase-data in any way possible for easy use in dynamic templates.

```
var Factory = require('communibase-template-data-factory');
// other deps

var factory = new Factory({ ... your options ...});
factory.getPromise("Person", person).then(function () { ... })

```

## Constructor options

All options for the constructor are optional. Possible options:

__cbc__: an instance of the Communibase Connector. Will be spawned if not supplied
__stxt__: a Javascript-object containing optional translations, e.g.:
```
{
    "Address.countryCode.NL": "Nederland",
    "Person.firstName": "Voornaam" 
 }
 ```
 
 ## Extra serializers
 
Extra (custom) serializers can be added to the factory using the `addSerializers`-method. See serializers in the
`entityType`-folder for examples and implementations

 ### PLEASE NOTE ###

 This library is compatible with Handlebars 2.0.0

 Later versions of Handlebars have a different AST and do not function properly!

'use strict';
module.exports =  function(config) {
    config.tz = config.tz || 'Europe/Amsterdam';
    config.locale = config.locale || 'nl';
    return {
        templateDataFactory: require('./src/templateDataFactory.js')(config),
        handlebarsHelpers: require('./src/handlebarsHelpers.js')(config),
        renderFile: require('./src/file.js')(config)
    };
};
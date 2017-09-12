

const Promise = require('bluebird');

module.exports = function () {
  let serverProcess;
  return new Promise((resolve) => {
    serverProcess = require('child_process').fork(`${__dirname}/../../node_modules/Communibase/server.js`, {
      env: process.env,
      execArgv: [] // disable any debugger on the main process for the child fork
    });

    serverProcess.on('message', (message) => {
      if (message === 'online') {
        resolve(serverProcess);
      }
    });
  });
};

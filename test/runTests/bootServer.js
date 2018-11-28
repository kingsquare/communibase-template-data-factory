const Promise = require("bluebird");
const ChildProcess = require("child_process");

module.exports = () => {
  let serverProcess;
  return new Promise(resolve => {
    serverProcess = ChildProcess.fork(
      `${__dirname}/../../node_modules/Communibase/server.js`,
      {
        env: process.env,
        execArgv: [] // disable any debugger on the main process for the child fork
      }
    );

    serverProcess.on("message", message => {
      if (message === "online") {
        resolve(serverProcess);
      }
    });
  });
};

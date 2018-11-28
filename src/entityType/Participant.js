const BaseSerializer = require("./Base.js");

module.exports = {
  titleFields: ["personId"],
  getPromiseByPaths(entityTypeTitle, document, requestedPaths, parents) {
    const self = this;
    const allVariablesAreRequested =
      requestedPaths.length === 1 && requestedPaths[0].substring(0, 1) === "#";
    const sessionDataRequested =
      allVariablesAreRequested ||
      !!requestedPaths.find(path => path.startsWith("sessions"));
    return BaseSerializer.getPromiseByPaths
      .apply(this, arguments)
      .then(templateData => {
        if (sessionDataRequested) {
          const event = parents[0];
          templateData.sessions = event.sessions.filter(
            session =>
              !!session.participants.find(
                participant =>
                  participant.personId === document.personId &&
                  ["cancelled", "queued", "absent", "deregistered"].indexOf(
                    participant.status
                  ) === -1
              )
          );
        }
        return templateData;
      });
  }
};

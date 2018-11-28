module.exports = {
  titleFields: ["passedPercentage"],
  composeTitle(chunks, entityTitle, document) {
    const id = document._id;
    const title = chunks
      .join(" ")
      .trim()
      .replace(/ +/g, " ");
    return title.length > 0
      ? `Korting na ${chunks[0]}% verstreken`
      : `<< ${
          id
            ? `${this.stxt[entityTitle] || entityTitle} ${id}`
            : `Nieuw "${this.stxt[entityTitle] || entityTitle}" document `
        } >>`;
  }
};

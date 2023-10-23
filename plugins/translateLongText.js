export default (context, inject) => {
  const translateLongText = (longText) => {
    let newText = longText
      .replace(/^### (.*$)/gim, "<h3>$1</h3>") // h3 tag
      .replace(/^## (.*$)/gim, "<h2>$1</h2>") // h2 tag
      .replace(/^# (.*$)/gim, "<h1>$1</h1>") // h1 tag
      .replace(/\*\*(.*)\*\*/gim, "<b>$1</b>") // bold text
      .replace(/\*(.*)\*/gim, "<i>$1</i>") // italic text
      .replace(/\r\n|\r|\n/gim, "<br>") // linebreaks
      .replace(/\[([^\[]+)\](\(([^)]*))\)/gim, '<a href="$3">$1</a>');
    return newText;
  };
  inject("translateLongText", translateLongText);
};

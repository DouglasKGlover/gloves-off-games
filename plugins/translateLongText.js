export default defineNuxtPlugin(() => {
  const translateLongText = (longText) => {
    const newText = longText
      .replace(/^### (.*$)/gim, "<h3>$1</h3>")
      .replace(/^## (.*$)/gim, "<h2>$1</h2>")
      .replace(/^# (.*$)/gim, "<h1>$1</h1>")
      .replace(/\*\*(.*)\*\*/gim, "<b>$1</b>")
      .replace(/\*(.*)\*/gim, "<i>$1</i>")
      .replace(/\r\n|\r|\n/gim, "<br>")
      .replace(
        /\[([^\[]+)\](\(([^)]*))\)/gim,
        '<a href="$3" target="_blank">$1</a>',
      );
    return newText;
  };

  return {
    provide: {
      translateLongText,
    },
  };
});

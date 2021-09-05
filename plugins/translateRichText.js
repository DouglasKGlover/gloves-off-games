import { BLOCKS, INLINES } from "@contentful/rich-text-types";
import { documentToHtmlString } from "@contentful/rich-text-html-renderer";

export default (context, inject) => {
  const translateRichText = (richText) => {
    const options = {
      renderNode: {
        [INLINES.HYPERLINK]: (node, next) => {
          return `<a href="${node.data.uri}"${
            !node.data.uri.includes(".") ? "" : ' target="_blank"'
          }>${next(node.content)}</a>`;
        },
      },
    };
    return documentToHtmlString(richText, options);
  };
  inject("translateRichText", translateRichText);
};

import { BLOCKS, INLINES } from "@contentful/rich-text-types";
import { documentToHtmlString } from "@contentful/rich-text-html-renderer";

export default defineNuxtPlugin(() => {
  const translateRichText = (richText) => {
    const options = {
      renderNode: {
        [INLINES.HYPERLINK]: (node, next) => {
          return `<a href="${node.data.uri}"${
            !node.data.uri.includes(".") ? "" : ' target="_blank"'
          }>${next(node.content)}</a>`;
        },
        [BLOCKS.PARAGRAPH]: (node, next) => {
          return `<p>${next(node.content).replace("&amp;nbsp;", "&nbsp;")}</p>`;
        },
      },
    };
    return documentToHtmlString(richText, options);
  };

  return {
    provide: {
      translateRichText,
    },
  };
});

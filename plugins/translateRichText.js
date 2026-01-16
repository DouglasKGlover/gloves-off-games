import { BLOCKS, INLINES } from "@contentful/rich-text-types";
import { documentToHtmlString } from "@contentful/rich-text-html-renderer";

export default defineNuxtPlugin(() => {
  // Accepts either { json, links } or just json
  const translateRichText = (input) => {
    let richText, assetBlocks;
    if (input && input.json && input.links) {
      richText = input.json;
      assetBlocks = input.links.assets?.block || [];
    } else {
      richText = input;
      assetBlocks = [];
    }

    const findAsset = (id) => assetBlocks.find((a) => a.sys.id === id);

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
        [BLOCKS.EMBEDDED_ASSET]: (node) => {
          const asset = findAsset(node.data.target.sys.id);
          if (!asset) return "";
          const url = asset.url
            ? asset.url.startsWith("http")
              ? asset.url
              : `https:${asset.url}`
            : "";
          const alt = asset.description || asset.title || "";
          if (!url) return "";
          return `<img src="${url}" alt="${alt}" role="img" loading="lazy" style="max-width:100%;height:auto;" />`;
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

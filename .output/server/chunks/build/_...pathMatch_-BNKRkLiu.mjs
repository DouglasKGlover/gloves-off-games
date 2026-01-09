import { _ as __nuxt_component_0 } from './nuxt-link-DFuu8Q15.mjs';
import { a as __nuxt_component_1, _ as __nuxt_component_2 } from './RegionIndicator-USLaeHk_.mjs';
import { withAsyncContext, computed, unref, withCtx, createTextVNode, toDisplayString, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrInterpolate, ssrRenderComponent, ssrRenderAttr, ssrRenderClass, ssrRenderList } from 'vue/server-renderer';
import { a as useRoute, u as useNuxtApp } from './server.mjs';
import { u as useAsyncData } from './asyncData-BDBD8M7T.mjs';
import { u as useHead } from './v3-DkGAEUz2.mjs';
import '../_/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';
import '../routes/renderer.mjs';
import 'vue-bundle-renderer/runtime';
import 'unhead/server';
import 'devalue';
import 'unhead/utils';
import 'unhead/plugins';
import 'vue-router';
import '@contentful/rich-text-types';
import '@contentful/rich-text-html-renderer';
import 'graphql-request';

var doc = { "kind": "Document", "definitions": [{ "kind": "OperationDefinition", "operation": "query", "name": { "kind": "Name", "value": "gameBySlugAndSystemQuery" }, "variableDefinitions": [{ "kind": "VariableDefinition", "variable": { "kind": "Variable", "name": { "kind": "Name", "value": "slug" } }, "type": { "kind": "NonNullType", "type": { "kind": "NamedType", "name": { "kind": "Name", "value": "String" } } }, "directives": [] }, { "kind": "VariableDefinition", "variable": { "kind": "Variable", "name": { "kind": "Name", "value": "system" } }, "type": { "kind": "NonNullType", "type": { "kind": "NamedType", "name": { "kind": "Name", "value": "String" } } }, "directives": [] }], "directives": [], "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "gameCollection" }, "arguments": [{ "kind": "Argument", "name": { "kind": "Name", "value": "where" }, "value": { "kind": "ObjectValue", "fields": [{ "kind": "ObjectField", "name": { "kind": "Name", "value": "slug" }, "value": { "kind": "Variable", "name": { "kind": "Name", "value": "slug" } } }, { "kind": "ObjectField", "name": { "kind": "Name", "value": "system" }, "value": { "kind": "ObjectValue", "fields": [{ "kind": "ObjectField", "name": { "kind": "Name", "value": "slug" }, "value": { "kind": "Variable", "name": { "kind": "Name", "value": "system" } } }] } }] } }, { "kind": "Argument", "name": { "kind": "Name", "value": "limit" }, "value": { "kind": "IntValue", "value": "1" } }], "directives": [], "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "items" }, "arguments": [], "directives": [], "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "sys" }, "arguments": [], "directives": [], "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "id" }, "arguments": [], "directives": [] }, { "kind": "Field", "name": { "kind": "Name", "value": "firstPublishedAt" }, "arguments": [], "directives": [] }, { "kind": "Field", "name": { "kind": "Name", "value": "publishedAt" }, "arguments": [], "directives": [] }] } }, { "kind": "Field", "name": { "kind": "Name", "value": "title" }, "arguments": [], "directives": [] }, { "kind": "Field", "name": { "kind": "Name", "value": "system" }, "arguments": [], "directives": [], "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "title" }, "arguments": [], "directives": [] }, { "kind": "Field", "name": { "kind": "Name", "value": "shortName" }, "arguments": [], "directives": [] }, { "kind": "Field", "name": { "kind": "Name", "value": "slug" }, "arguments": [], "directives": [] }, { "kind": "Field", "name": { "kind": "Name", "value": "manufacturer" }, "arguments": [], "directives": [], "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "title" }, "arguments": [], "directives": [] }] } }] } }, { "kind": "Field", "name": { "kind": "Name", "value": "region" }, "arguments": [], "directives": [] }, { "kind": "Field", "name": { "kind": "Name", "value": "playedStatus" }, "arguments": [], "directives": [] }, { "kind": "Field", "name": { "kind": "Name", "value": "highScore" }, "arguments": [], "directives": [] }, { "kind": "Field", "name": { "kind": "Name", "value": "digital" }, "arguments": [], "directives": [] }, { "kind": "Field", "name": { "kind": "Name", "value": "requirementsForCompletion" }, "arguments": [], "directives": [] }, { "kind": "Field", "name": { "kind": "Name", "value": "wtbWts" }, "arguments": [], "directives": [] }, { "kind": "Field", "name": { "kind": "Name", "value": "photosCollection" }, "arguments": [{ "kind": "Argument", "name": { "kind": "Name", "value": "limit" }, "value": { "kind": "IntValue", "value": "10" } }], "directives": [], "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "items" }, "arguments": [], "directives": [], "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "url" }, "arguments": [], "directives": [] }, { "kind": "Field", "alias": { "kind": "Name", "value": "thumbnail" }, "name": { "kind": "Name", "value": "url" }, "arguments": [{ "kind": "Argument", "name": { "kind": "Name", "value": "transform" }, "value": { "kind": "ObjectValue", "fields": [{ "kind": "ObjectField", "name": { "kind": "Name", "value": "width" }, "value": { "kind": "IntValue", "value": "300" } }, { "kind": "ObjectField", "name": { "kind": "Name", "value": "height" }, "value": { "kind": "IntValue", "value": "200" } }, { "kind": "ObjectField", "name": { "kind": "Name", "value": "resizeStrategy" }, "value": { "kind": "EnumValue", "value": "FILL" } }] } }], "directives": [] }] } }] } }] } }] } }, { "kind": "Field", "name": { "kind": "Name", "value": "gameLogCollection" }, "arguments": [{ "kind": "Argument", "name": { "kind": "Name", "value": "where" }, "value": { "kind": "ObjectValue", "fields": [{ "kind": "ObjectField", "name": { "kind": "Name", "value": "game" }, "value": { "kind": "ObjectValue", "fields": [{ "kind": "ObjectField", "name": { "kind": "Name", "value": "slug" }, "value": { "kind": "Variable", "name": { "kind": "Name", "value": "slug" } } }] } }] } }], "directives": [], "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "items" }, "arguments": [], "directives": [], "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "sys" }, "arguments": [], "directives": [], "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "firstPublishedAt" }, "arguments": [], "directives": [] }] } }, { "kind": "Field", "name": { "kind": "Name", "value": "title" }, "arguments": [], "directives": [] }, { "kind": "Field", "name": { "kind": "Name", "value": "slug" }, "arguments": [], "directives": [] }] } }] } }] } }], "loc": { "start": 0, "end": 869 } };
doc.loc.source = { "body": "query gameBySlugAndSystemQuery($slug: String!, $system: String!) {\r\n  gameCollection(where: { slug: $slug, system: { slug: $system } }, limit: 1) {\r\n    items {\r\n      sys {\r\n        id\r\n        firstPublishedAt\r\n        publishedAt\r\n      }\r\n      title\r\n      system {\r\n        title\r\n        shortName\r\n        slug\r\n        manufacturer {\r\n          title\r\n        }\r\n      }\r\n      region\r\n      playedStatus\r\n      highScore\r\n      digital\r\n      requirementsForCompletion\r\n      wtbWts\r\n      photosCollection(limit: 10) {\r\n        items {\r\n          url\r\n          thumbnail: url(\r\n            transform: { width: 300, height: 200, resizeStrategy: FILL }\r\n          )\r\n        }\r\n      }\r\n    }\r\n  }\r\n\r\n  gameLogCollection(where: { game: { slug: $slug } }) {\r\n    items {\r\n      sys {\r\n        firstPublishedAt\r\n      }\r\n      title\r\n      slug\r\n    }\r\n  }\r\n}\r\n", "name": "GraphQL request", "locationOffset": { "line": 1, "column": 1 } };
function collectFragmentReferences(node, refs) {
  if (node.kind === "FragmentSpread") {
    refs.add(node.name.value);
  } else if (node.kind === "VariableDefinition") {
    var type = node.type;
    if (type.kind === "NamedType") {
      refs.add(type.name.value);
    }
  }
  if (node.selectionSet) {
    node.selectionSet.selections.forEach(function(selection) {
      collectFragmentReferences(selection, refs);
    });
  }
  if (node.variableDefinitions) {
    node.variableDefinitions.forEach(function(def) {
      collectFragmentReferences(def, refs);
    });
  }
  if (node.definitions) {
    node.definitions.forEach(function(def) {
      collectFragmentReferences(def, refs);
    });
  }
}
var definitionRefs = {};
(function extractReferences() {
  doc.definitions.forEach(function(def) {
    if (def.name) {
      var refs = /* @__PURE__ */ new Set();
      collectFragmentReferences(def, refs);
      definitionRefs[def.name.value] = refs;
    }
  });
})();
function findOperation(doc2, name) {
  for (var i = 0; i < doc2.definitions.length; i++) {
    var element = doc2.definitions[i];
    if (element.name && element.name.value == name) {
      return element;
    }
  }
}
function oneQuery(doc2, operationName) {
  var newDoc = {
    kind: doc2.kind,
    definitions: [findOperation(doc2, operationName)]
  };
  if (doc2.hasOwnProperty("loc")) {
    newDoc.loc = doc2.loc;
  }
  var opRefs = definitionRefs[operationName] || /* @__PURE__ */ new Set();
  var allRefs = /* @__PURE__ */ new Set();
  var newRefs = /* @__PURE__ */ new Set();
  opRefs.forEach(function(refName) {
    newRefs.add(refName);
  });
  while (newRefs.size > 0) {
    var prevRefs = newRefs;
    newRefs = /* @__PURE__ */ new Set();
    prevRefs.forEach(function(refName) {
      if (!allRefs.has(refName)) {
        allRefs.add(refName);
        var childRefs = definitionRefs[refName] || /* @__PURE__ */ new Set();
        childRefs.forEach(function(childRef) {
          newRefs.add(childRef);
        });
      }
    });
  }
  allRefs.forEach(function(refName) {
    var op = findOperation(doc2, refName);
    if (op) {
      newDoc.definitions.push(op);
    }
  });
  return newDoc;
}
oneQuery(doc, "gameBySlugAndSystemQuery");
const _sfc_main = {
  __name: "[...pathMatch]",
  __ssrInlineRender: true,
  async setup(__props) {
    let __temp, __restore;
    const route = useRoute();
    const { $graphql } = useNuxtApp();
    const parsePathMatch = (pathArray) => {
      return {
        slug: pathArray[1],
        system: pathArray[0]
      };
    };
    const { data: gameData } = ([__temp, __restore] = withAsyncContext(() => useAsyncData(
      "gameDetail",
      () => $graphql.request(doc, {
        slug: parsePathMatch(route.params.pathMatch).slug,
        system: parsePathMatch(route.params.pathMatch).system
      })
    )), __temp = await __temp, __restore(), __temp);
    const game = computed(() => {
      var _a, _b, _c;
      return ((_c = (_b = (_a = gameData.value) == null ? void 0 : _a.gameCollection) == null ? void 0 : _b.items) == null ? void 0 : _c[0]) || {};
    });
    const glogs = computed(() => {
      var _a, _b;
      return ((_b = (_a = gameData.value) == null ? void 0 : _a.gameLogCollection) == null ? void 0 : _b.items) || [];
    });
    const photosList = computed(() => {
      var _a, _b;
      return ((_b = (_a = game.value) == null ? void 0 : _a.photosCollection) == null ? void 0 : _b.items) || [];
    });
    const ebayLink = computed(() => {
      if (!game.value.title) return "#";
      const concat = `${game.value.title}+${game.value.system.title}`;
      const searchTerm = concat.replaceAll("&", "&").replaceAll(" ", "+").replaceAll(":", "");
      return `https://www.ebay.ca/sch/i.html?_nkw=${searchTerm}&_in_kw=1&_ex_kw=&_sacat=0&LH_Sold=1&_udlo=&_udhi=&_samilow=&_samihi=&_sadis=15&_stpos=M4V+2E9&_sargn=-1&saslc=1&_salic=2&_sop=12&_dmd=1&_ipg=60&LH_Complete=1&_fosrp=1`;
    });
    useHead({
      title: computed(
        () => {
          var _a;
          return `Gloves Off Games - ${game.value.title} (${((_a = game.value.system) == null ? void 0 : _a.title) || ""})`;
        }
      )
    });
    return (_ctx, _push, _parent, _attrs) => {
      var _a;
      const _component_NuxtLink = __nuxt_component_0;
      const _component_GameRegionIndicator = __nuxt_component_1;
      const _component_GamePlayedStatusIndicator = __nuxt_component_2;
      _push(`<div${ssrRenderAttrs(_attrs)}>`);
      if (unref(game).title) {
        _push(`<div class="container"><div><div><h1>${ssrInterpolate(unref(game).title)}</h1><h2>`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: `/systems/${unref(game).system.slug}`
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`${ssrInterpolate(unref(game).system.title)}`);
            } else {
              return [
                createTextVNode(toDisplayString(unref(game).system.title), 1)
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</h2><div class="section"><h3>Overview</h3><ul><li>`);
        _push(ssrRenderComponent(_component_GameRegionIndicator, {
          region: unref(game).region
        }, null, _parent));
        _push(`</li>`);
        if (unref(game).requirementsForCompletion) {
          _push(`<li><strong>Requirements for Completion:</strong><div>${(_a = _ctx.$translateLongText(unref(game).requirementsForCompletion)) != null ? _a : ""}</div></li>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<li><strong>Played Status: </strong>`);
        _push(ssrRenderComponent(_component_GamePlayedStatusIndicator, {
          status: unref(game).playedStatus
        }, null, _parent));
        _push(`${ssrInterpolate(unref(game).playedStatus)}</li>`);
        if (unref(game).highScore) {
          _push(`<li><strong>High Score: </strong> ${ssrInterpolate(unref(game).highScore)}</li>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<li><strong>Added: </strong> ${ssrInterpolate(_ctx.$dateTranslate(unref(game).sys.firstPublishedAt).long)}</li><li><strong>Updated: </strong> ${ssrInterpolate(_ctx.$dateTranslate(unref(game).sys.publishedAt).long)}</li><li><a${ssrRenderAttr("href", unref(ebayLink))} target="_blank">\u{1F4B8} Price Check</a></li>`);
        if (unref(game).wtbWts) {
          _push(`<li class="${ssrRenderClass(unref(game).wtbWts.toLowerCase())}">`);
          if (unref(game).wtbWts == "WTS") {
            _push(`<strong>For sale!</strong>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</li>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</ul><p></p></div>`);
        if (unref(photosList).length) {
          _push(`<div class="section"><h3>Photos</h3><div><!--[-->`);
          ssrRenderList(unref(photosList), (photo, index) => {
            _push(`<div><button class="image-button"><img${ssrRenderAttr("src", photo.thumbnail)} width="300" height="200"></button><dialog${ssrRenderAttr("id", `photo-modal-${index}`)}><img${ssrRenderAttr("src", photo.url)}></dialog></div>`);
          });
          _push(`<!--]--></div></div>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(glogs).length) {
          _push(`<div class="section"><h3>Game Log`);
          if (unref(glogs).length > 1) {
            _push(`<span>s</span>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</h3><!--[-->`);
          ssrRenderList(unref(glogs), (glog, index) => {
            _push(`<div class="game-log-link">${ssrInterpolate(_ctx.$dateTranslate(glog.sys.firstPublishedAt).short)} - `);
            _push(ssrRenderComponent(_component_NuxtLink, {
              to: `/glog/${glog.slug}`
            }, {
              default: withCtx((_, _push2, _parent2, _scopeId) => {
                if (_push2) {
                  _push2(`${ssrInterpolate(glog.title)}`);
                } else {
                  return [
                    createTextVNode(toDisplayString(glog.title), 1)
                  ];
                }
              }),
              _: 2
            }, _parent));
            _push(`</div>`);
          });
          _push(`<!--]--></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/games/[...pathMatch].vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=_...pathMatch_-BNKRkLiu.mjs.map

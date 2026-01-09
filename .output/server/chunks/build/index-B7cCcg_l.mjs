import { _ as __nuxt_component_0 } from './nuxt-link-DFuu8Q15.mjs';
import { withAsyncContext, computed, unref, withCtx, createTextVNode, createVNode, createBlock, createCommentVNode, toDisplayString, openBlock, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderList, ssrRenderComponent, ssrInterpolate } from 'vue/server-renderer';
import { u as useHead } from './v3-DkGAEUz2.mjs';
import { u as useNuxtApp } from './server.mjs';
import { u as useAsyncData } from './asyncData-BDBD8M7T.mjs';
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

var doc$2 = { "kind": "Document", "definitions": [{ "kind": "OperationDefinition", "operation": "query", "name": { "kind": "Name", "value": "recentlyUpdatedQuery" }, "variableDefinitions": [], "directives": [], "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "gameCollection" }, "arguments": [{ "kind": "Argument", "name": { "kind": "Name", "value": "limit" }, "value": { "kind": "IntValue", "value": "3" } }, { "kind": "Argument", "name": { "kind": "Name", "value": "where" }, "value": { "kind": "ObjectValue", "fields": [{ "kind": "ObjectField", "name": { "kind": "Name", "value": "sys" }, "value": { "kind": "ObjectValue", "fields": [{ "kind": "ObjectField", "name": { "kind": "Name", "value": "publishedVersion_gt" }, "value": { "kind": "IntValue", "value": "4" } }] } }] } }], "directives": [], "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "items" }, "arguments": [], "directives": [], "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "sys" }, "arguments": [], "directives": [], "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "publishedAt" }, "arguments": [], "directives": [] }] } }, { "kind": "Field", "name": { "kind": "Name", "value": "title" }, "arguments": [], "directives": [] }, { "kind": "Field", "name": { "kind": "Name", "value": "system" }, "arguments": [], "directives": [], "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "slug" }, "arguments": [], "directives": [] }, { "kind": "Field", "name": { "kind": "Name", "value": "shortName" }, "arguments": [], "directives": [] }] } }, { "kind": "Field", "name": { "kind": "Name", "value": "digital" }, "arguments": [], "directives": [] }, { "kind": "Field", "name": { "kind": "Name", "value": "slug" }, "arguments": [], "directives": [] }, { "kind": "Field", "name": { "kind": "Name", "value": "region" }, "arguments": [], "directives": [] }] } }] } }] } }], "loc": { "start": 0, "end": 281 } };
doc$2.loc.source = { "body": "query recentlyUpdatedQuery {\r\n  gameCollection(limit: 3, where: {sys:{publishedVersion_gt:4}}) {\r\n    items {\r\n      sys {\r\n        publishedAt\r\n      }\r\n      title\r\n      system {\r\n        slug\r\n        shortName\r\n      }\r\n      digital\r\n      slug\r\n      region\r\n    }\r\n  }\r\n}\r\n", "name": "GraphQL request", "locationOffset": { "line": 1, "column": 1 } };
function collectFragmentReferences$2(node, refs) {
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
      collectFragmentReferences$2(selection, refs);
    });
  }
  if (node.variableDefinitions) {
    node.variableDefinitions.forEach(function(def) {
      collectFragmentReferences$2(def, refs);
    });
  }
  if (node.definitions) {
    node.definitions.forEach(function(def) {
      collectFragmentReferences$2(def, refs);
    });
  }
}
var definitionRefs$2 = {};
(function extractReferences() {
  doc$2.definitions.forEach(function(def) {
    if (def.name) {
      var refs = /* @__PURE__ */ new Set();
      collectFragmentReferences$2(def, refs);
      definitionRefs$2[def.name.value] = refs;
    }
  });
})();
function findOperation$2(doc2, name) {
  for (var i = 0; i < doc2.definitions.length; i++) {
    var element = doc2.definitions[i];
    if (element.name && element.name.value == name) {
      return element;
    }
  }
}
function oneQuery$2(doc2, operationName) {
  var newDoc = {
    kind: doc2.kind,
    definitions: [findOperation$2(doc2, operationName)]
  };
  if (doc2.hasOwnProperty("loc")) {
    newDoc.loc = doc2.loc;
  }
  var opRefs = definitionRefs$2[operationName] || /* @__PURE__ */ new Set();
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
        var childRefs = definitionRefs$2[refName] || /* @__PURE__ */ new Set();
        childRefs.forEach(function(childRef) {
          newRefs.add(childRef);
        });
      }
    });
  }
  allRefs.forEach(function(refName) {
    var op = findOperation$2(doc2, refName);
    if (op) {
      newDoc.definitions.push(op);
    }
  });
  return newDoc;
}
oneQuery$2(doc$2, "recentlyUpdatedQuery");
var doc$1 = { "kind": "Document", "definitions": [{ "kind": "OperationDefinition", "operation": "query", "name": { "kind": "Name", "value": "latestGamesQuery" }, "variableDefinitions": [], "directives": [], "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "gameCollection" }, "arguments": [{ "kind": "Argument", "name": { "kind": "Name", "value": "limit" }, "value": { "kind": "IntValue", "value": "3" } }, { "kind": "Argument", "name": { "kind": "Name", "value": "order" }, "value": { "kind": "ListValue", "values": [{ "kind": "EnumValue", "value": "sys_firstPublishedAt_DESC" }] } }], "directives": [], "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "items" }, "arguments": [], "directives": [], "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "sys" }, "arguments": [], "directives": [], "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "firstPublishedAt" }, "arguments": [], "directives": [] }] } }, { "kind": "Field", "name": { "kind": "Name", "value": "title" }, "arguments": [], "directives": [] }, { "kind": "Field", "name": { "kind": "Name", "value": "system" }, "arguments": [], "directives": [], "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "slug" }, "arguments": [], "directives": [] }, { "kind": "Field", "name": { "kind": "Name", "value": "shortName" }, "arguments": [], "directives": [] }] } }, { "kind": "Field", "name": { "kind": "Name", "value": "digital" }, "arguments": [], "directives": [] }, { "kind": "Field", "name": { "kind": "Name", "value": "slug" }, "arguments": [], "directives": [] }, { "kind": "Field", "name": { "kind": "Name", "value": "region" }, "arguments": [], "directives": [] }] } }] } }] } }], "loc": { "start": 0, "end": 280 } };
doc$1.loc.source = { "body": "query latestGamesQuery {\r\n  gameCollection(limit: 3, order: [sys_firstPublishedAt_DESC]) {\r\n    items {\r\n      sys {\r\n        firstPublishedAt\r\n      }\r\n      title\r\n      system {\r\n        slug\r\n        shortName\r\n      }\r\n      digital\r\n      slug\r\n      region\r\n    }\r\n  }\r\n}\r\n", "name": "GraphQL request", "locationOffset": { "line": 1, "column": 1 } };
function collectFragmentReferences$1(node, refs) {
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
      collectFragmentReferences$1(selection, refs);
    });
  }
  if (node.variableDefinitions) {
    node.variableDefinitions.forEach(function(def) {
      collectFragmentReferences$1(def, refs);
    });
  }
  if (node.definitions) {
    node.definitions.forEach(function(def) {
      collectFragmentReferences$1(def, refs);
    });
  }
}
var definitionRefs$1 = {};
(function extractReferences2() {
  doc$1.definitions.forEach(function(def) {
    if (def.name) {
      var refs = /* @__PURE__ */ new Set();
      collectFragmentReferences$1(def, refs);
      definitionRefs$1[def.name.value] = refs;
    }
  });
})();
function findOperation$1(doc2, name) {
  for (var i = 0; i < doc2.definitions.length; i++) {
    var element = doc2.definitions[i];
    if (element.name && element.name.value == name) {
      return element;
    }
  }
}
function oneQuery$1(doc2, operationName) {
  var newDoc = {
    kind: doc2.kind,
    definitions: [findOperation$1(doc2, operationName)]
  };
  if (doc2.hasOwnProperty("loc")) {
    newDoc.loc = doc2.loc;
  }
  var opRefs = definitionRefs$1[operationName] || /* @__PURE__ */ new Set();
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
        var childRefs = definitionRefs$1[refName] || /* @__PURE__ */ new Set();
        childRefs.forEach(function(childRef) {
          newRefs.add(childRef);
        });
      }
    });
  }
  allRefs.forEach(function(refName) {
    var op = findOperation$1(doc2, refName);
    if (op) {
      newDoc.definitions.push(op);
    }
  });
  return newDoc;
}
oneQuery$1(doc$1, "latestGamesQuery");
var doc = { "kind": "Document", "definitions": [{ "kind": "OperationDefinition", "operation": "query", "name": { "kind": "Name", "value": "currentlyPlayingGamesQuery" }, "variableDefinitions": [], "directives": [], "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "gameCollection" }, "arguments": [{ "kind": "Argument", "name": { "kind": "Name", "value": "where" }, "value": { "kind": "ObjectValue", "fields": [{ "kind": "ObjectField", "name": { "kind": "Name", "value": "currentlyPlaying" }, "value": { "kind": "BooleanValue", "value": true } }] } }, { "kind": "Argument", "name": { "kind": "Name", "value": "order" }, "value": { "kind": "ListValue", "values": [{ "kind": "EnumValue", "value": "title_ASC" }] } }], "directives": [], "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "items" }, "arguments": [], "directives": [], "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "sys" }, "arguments": [], "directives": [], "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "id" }, "arguments": [], "directives": [] }] } }, { "kind": "Field", "name": { "kind": "Name", "value": "title" }, "arguments": [], "directives": [] }, { "kind": "Field", "name": { "kind": "Name", "value": "slug" }, "arguments": [], "directives": [] }, { "kind": "Field", "name": { "kind": "Name", "value": "system" }, "arguments": [], "directives": [], "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "slug" }, "arguments": [], "directives": [] }, { "kind": "Field", "name": { "kind": "Name", "value": "shortName" }, "arguments": [], "directives": [] }] } }, { "kind": "Field", "name": { "kind": "Name", "value": "playedStatus" }, "arguments": [], "directives": [] }, { "kind": "Field", "name": { "kind": "Name", "value": "digital" }, "arguments": [], "directives": [] }, { "kind": "Field", "name": { "kind": "Name", "value": "region" }, "arguments": [], "directives": [] }] } }] } }] } }], "loc": { "start": 0, "end": 305 } };
doc.loc.source = { "body": "query currentlyPlayingGamesQuery {\r\n  gameCollection(where: { currentlyPlaying: true }, order: [title_ASC]) {\r\n    items {\r\n      sys {\r\n        id\r\n      }\r\n      title\r\n      slug\r\n      system {\r\n        slug\r\n        shortName\r\n      }\r\n      playedStatus\r\n      digital\r\n      region\r\n    }\r\n  }\r\n}\r\n", "name": "GraphQL request", "locationOffset": { "line": 1, "column": 1 } };
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
(function extractReferences3() {
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
oneQuery(doc, "currentlyPlayingGamesQuery");
const _sfc_main = {
  __name: "index",
  __ssrInlineRender: true,
  async setup(__props) {
    let __temp, __restore;
    useHead({
      title: "Gloves Off Games",
      meta: [
        {
          hid: "description",
          name: "description",
          content: "My personal collection tracking site with game collection management, stats, and gameplay logs."
        }
      ]
    });
    const { $graphql } = useNuxtApp();
    const { data: recentlyUpdatedData } = ([__temp, __restore] = withAsyncContext(() => useAsyncData(
      "recentlyUpdated",
      () => $graphql.request(doc$2)
    )), __temp = await __temp, __restore(), __temp);
    const recentlyUpdated = computed(
      () => {
        var _a, _b;
        return ((_b = (_a = recentlyUpdatedData.value) == null ? void 0 : _a.gameCollection) == null ? void 0 : _b.items) || [];
      }
    );
    const { data: latestGamesData } = ([__temp, __restore] = withAsyncContext(() => useAsyncData(
      "latestGames",
      () => $graphql.request(doc$1)
    )), __temp = await __temp, __restore(), __temp);
    const latestGames = computed(
      () => {
        var _a, _b;
        return ((_b = (_a = latestGamesData.value) == null ? void 0 : _a.gameCollection) == null ? void 0 : _b.items) || [];
      }
    );
    const { data: currentlyPlayingGamesData } = ([__temp, __restore] = withAsyncContext(() => useAsyncData(
      "currentlyPlayingGames",
      () => $graphql.request(doc)
    )), __temp = await __temp, __restore(), __temp);
    const currentlyPlayingGames = computed(
      () => {
        var _a, _b;
        return ((_b = (_a = currentlyPlayingGamesData.value) == null ? void 0 : _a.gameCollection) == null ? void 0 : _b.items) || [];
      }
    );
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      _push(`<main${ssrRenderAttrs(_attrs)}><div class="container"><div><h1>Gloves Off Games</h1><p>My personal collection tracking site.</p><hr></div>`);
      if (unref(currentlyPlayingGames).length) {
        _push(`<div class="section"><h2>Currently Playing</h2><ul><!--[-->`);
        ssrRenderList(unref(currentlyPlayingGames), (game, index) => {
          _push(`<li>`);
          _push(ssrRenderComponent(_component_NuxtLink, {
            to: `/games/${game.system.slug}/${game.slug}`
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`${ssrInterpolate(game.title)} <sup${_scopeId}>[${ssrInterpolate(game.system.shortName)}]</sup>`);
                if (game.digital) {
                  _push2(`<sup${_scopeId}>[Digital]</sup>`);
                } else {
                  _push2(`<!---->`);
                }
              } else {
                return [
                  createTextVNode(toDisplayString(game.title) + " ", 1),
                  createVNode("sup", null, "[" + toDisplayString(game.system.shortName) + "]", 1),
                  game.digital ? (openBlock(), createBlock("sup", { key: 0 }, "[Digital]")) : createCommentVNode("", true)
                ];
              }
            }),
            _: 2
          }, _parent));
          _push(`</li>`);
        });
        _push(`<!--]--></ul></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<div class="section"><h2>Recently Updated</h2><ul><!--[-->`);
      ssrRenderList(unref(recentlyUpdated), (game, index) => {
        _push(`<li><span class="small">${ssrInterpolate(_ctx.$dateTranslate(game.sys.publishedAt).short)}</span> - `);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: `/games/${game.system.slug}/${game.slug}`
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`${ssrInterpolate(game.title)} <sup${_scopeId}>[${ssrInterpolate(game.system.shortName)}]</sup>`);
              if (game.digital) {
                _push2(`<sup${_scopeId}>[Digital]</sup>`);
              } else {
                _push2(`<!---->`);
              }
            } else {
              return [
                createTextVNode(toDisplayString(game.title) + " ", 1),
                createVNode("sup", null, "[" + toDisplayString(game.system.shortName) + "]", 1),
                game.digital ? (openBlock(), createBlock("sup", { key: 0 }, "[Digital]")) : createCommentVNode("", true)
              ];
            }
          }),
          _: 2
        }, _parent));
        _push(`</li>`);
      });
      _push(`<!--]--></ul></div><div class="section"><h2>Latest Additions</h2><ul><!--[-->`);
      ssrRenderList(unref(latestGames), (game, index) => {
        _push(`<li><span class="small">${ssrInterpolate(_ctx.$dateTranslate(game.sys.firstPublishedAt).short)}</span> - `);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: `/games/${game.system.slug}/${game.slug}`
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`${ssrInterpolate(game.title)} <sup${_scopeId}>[${ssrInterpolate(game.system.shortName)}]</sup>`);
              if (game.digital) {
                _push2(`<sup${_scopeId}>[Digital]</sup>`);
              } else {
                _push2(`<!---->`);
              }
            } else {
              return [
                createTextVNode(toDisplayString(game.title) + " ", 1),
                createVNode("sup", null, "[" + toDisplayString(game.system.shortName) + "]", 1),
                game.digital ? (openBlock(), createBlock("sup", { key: 0 }, "[Digital]")) : createCommentVNode("", true)
              ];
            }
          }),
          _: 2
        }, _parent));
        _push(`</li>`);
      });
      _push(`<!--]--></ul></div></div></main>`);
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=index-B7cCcg_l.mjs.map

import { _ as __nuxt_component_0 } from './nuxt-link-DFuu8Q15.mjs';
import { withAsyncContext, computed, unref, withCtx, createTextVNode, toDisplayString, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderList, ssrInterpolate, ssrRenderComponent } from 'vue/server-renderer';
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

var doc = { "kind": "Document", "definitions": [{ "kind": "OperationDefinition", "operation": "query", "name": { "kind": "Name", "value": "allGameLogsQuery" }, "variableDefinitions": [], "directives": [], "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "gameLogCollection" }, "arguments": [{ "kind": "Argument", "name": { "kind": "Name", "value": "limit" }, "value": { "kind": "IntValue", "value": "999" } }, { "kind": "Argument", "name": { "kind": "Name", "value": "order" }, "value": { "kind": "EnumValue", "value": "sys_firstPublishedAt_DESC" } }], "directives": [], "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "items" }, "arguments": [], "directives": [], "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "sys" }, "arguments": [], "directives": [], "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "firstPublishedAt" }, "arguments": [], "directives": [] }] } }, { "kind": "Field", "name": { "kind": "Name", "value": "title" }, "arguments": [], "directives": [] }, { "kind": "Field", "name": { "kind": "Name", "value": "slug" }, "arguments": [], "directives": [] }, { "kind": "Field", "name": { "kind": "Name", "value": "game" }, "arguments": [], "directives": [], "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "title" }, "arguments": [], "directives": [] }, { "kind": "Field", "name": { "kind": "Name", "value": "slug" }, "arguments": [], "directives": [] }, { "kind": "Field", "name": { "kind": "Name", "value": "system" }, "arguments": [], "directives": [], "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "slug" }, "arguments": [], "directives": [] }] } }, { "kind": "Field", "name": { "kind": "Name", "value": "region" }, "arguments": [], "directives": [] }] } }] } }] } }] } }], "loc": { "start": 0, "end": 348 } };
doc.loc.source = { "body": "# TODO: Paginate instead of 999 limit\r\nquery allGameLogsQuery {\r\n  gameLogCollection(limit: 999, order: sys_firstPublishedAt_DESC) {\r\n    items {\r\n      sys {\r\n        firstPublishedAt\r\n      }\r\n      title\r\n      slug\r\n      game {\r\n        title\r\n        slug\r\n        system {\r\n          slug\r\n        }\r\n        region\r\n      }\r\n    }\r\n  }\r\n}\r\n", "name": "GraphQL request", "locationOffset": { "line": 1, "column": 1 } };
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
oneQuery(doc, "allGameLogsQuery");
const _sfc_main = {
  __name: "index",
  __ssrInlineRender: true,
  async setup(__props) {
    let __temp, __restore;
    useHead({
      title: "Gloves Off Games - Glog"
    });
    const { $graphql } = useNuxtApp();
    const { data: allGameLogsData } = ([__temp, __restore] = withAsyncContext(() => useAsyncData(
      "allGameLogs",
      () => $graphql.request(doc)
    )), __temp = await __temp, __restore(), __temp);
    const allGameLogs = computed(
      () => {
        var _a, _b;
        return ((_b = (_a = allGameLogsData.value) == null ? void 0 : _a.gameLogCollection) == null ? void 0 : _b.items) || [];
      }
    );
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      _push(`<main${ssrRenderAttrs(_attrs)}><div class="container"><div><div><h1>Glog</h1><p>Game log. <em>Eh?</em></p><hr><!--[-->`);
      ssrRenderList(unref(allGameLogs), (glog, index) => {
        _push(`<div class="game-log-link section"><span>${ssrInterpolate(_ctx.$dateTranslate(glog.sys.firstPublishedAt).long)} `);
        if (glog.game) {
          _push(`<span> - </span>`);
        } else {
          _push(`<!---->`);
        }
        if (glog.game) {
          _push(ssrRenderComponent(_component_NuxtLink, {
            to: `/games/${glog.game.system.slug}/${glog.game.slug}`
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`${ssrInterpolate(glog.game.title)}`);
              } else {
                return [
                  createTextVNode(toDisplayString(glog.game.title), 1)
                ];
              }
            }),
            _: 2
          }, _parent));
        } else {
          _push(`<!---->`);
        }
        _push(`</span><br><h2>`);
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
        _push(`</h2></div>`);
      });
      _push(`<!--]--></div></div></div></main>`);
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/glog/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=index-DlinhjEr.mjs.map

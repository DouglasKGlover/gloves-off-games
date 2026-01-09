import { _ as _sfc_main$1 } from './ListWithFilters-BPottIDW.mjs';
import { withAsyncContext, computed, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent } from 'vue/server-renderer';
import { u as useHead } from './v3-DkGAEUz2.mjs';
import { u as useNuxtApp } from './server.mjs';
import { u as useAsyncData } from './asyncData-BDBD8M7T.mjs';
import './RegionIndicator-USLaeHk_.mjs';
import './nuxt-link-DFuu8Q15.mjs';
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

var doc = { "kind": "Document", "definitions": [{ "kind": "OperationDefinition", "operation": "query", "name": { "kind": "Name", "value": "allGamesQuery" }, "variableDefinitions": [], "directives": [], "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "gameCollection" }, "arguments": [{ "kind": "Argument", "name": { "kind": "Name", "value": "limit" }, "value": { "kind": "IntValue", "value": "999" } }, { "kind": "Argument", "name": { "kind": "Name", "value": "order" }, "value": { "kind": "ListValue", "values": [{ "kind": "EnumValue", "value": "title_ASC" }] } }], "directives": [], "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "items" }, "arguments": [], "directives": [], "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "title" }, "arguments": [], "directives": [] }, { "kind": "Field", "name": { "kind": "Name", "value": "slug" }, "arguments": [], "directives": [] }, { "kind": "Field", "name": { "kind": "Name", "value": "system" }, "arguments": [], "directives": [], "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "slug" }, "arguments": [], "directives": [] }, { "kind": "Field", "name": { "kind": "Name", "value": "shortName" }, "arguments": [], "directives": [] }] } }, { "kind": "Field", "name": { "kind": "Name", "value": "playedStatus" }, "arguments": [], "directives": [] }, { "kind": "Field", "name": { "kind": "Name", "value": "digital" }, "arguments": [], "directives": [] }, { "kind": "Field", "name": { "kind": "Name", "value": "wtbWts" }, "arguments": [], "directives": [] }, { "kind": "Field", "name": { "kind": "Name", "value": "region" }, "arguments": [], "directives": [] }] } }] } }] } }], "loc": { "start": 0, "end": 288 } };
doc.loc.source = { "body": "# TODO: Paginate instead of 999 limit\r\nquery allGamesQuery {\r\n  gameCollection(limit: 999, order: [title_ASC]) {\r\n    items {\r\n      title\r\n      slug\r\n      system {\r\n        slug\r\n        shortName\r\n      }\r\n      playedStatus\r\n      digital\r\n      wtbWts\r\n      region\r\n    }\r\n  }\r\n}\r\n", "name": "GraphQL request", "locationOffset": { "line": 1, "column": 1 } };
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
oneQuery(doc, "allGamesQuery");
const _sfc_main = {
  __name: "index",
  __ssrInlineRender: true,
  async setup(__props) {
    let __temp, __restore;
    useHead({ title: "Gloves Off Games - Games" });
    const { $graphql } = useNuxtApp();
    const { data: allGamesData } = ([__temp, __restore] = withAsyncContext(() => useAsyncData(
      "allGames",
      () => $graphql.request(doc)
    )), __temp = await __temp, __restore(), __temp);
    const allGames = computed(
      () => {
        var _a, _b;
        return ((_b = (_a = allGamesData.value) == null ? void 0 : _a.gameCollection) == null ? void 0 : _b.items) || [];
      }
    );
    return (_ctx, _push, _parent, _attrs) => {
      const _component_GameListWithFilters = _sfc_main$1;
      _push(`<main${ssrRenderAttrs(_attrs)}><div class="container"><div><div><h1>Games</h1><p>Like, literally all my games.</p><hr>`);
      _push(ssrRenderComponent(_component_GameListWithFilters, { games: unref(allGames) }, null, _parent));
      _push(`</div></div></div></main>`);
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/games/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=index-Z4S8fzu5.mjs.map

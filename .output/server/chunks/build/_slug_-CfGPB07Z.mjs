import { _ as _sfc_main$1 } from './ListWithFilters-BPottIDW.mjs';
import { withAsyncContext, computed, mergeProps, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrInterpolate, ssrRenderComponent } from 'vue/server-renderer';
import { a as useRoute, u as useNuxtApp } from './server.mjs';
import { u as useAsyncData } from './asyncData-BDBD8M7T.mjs';
import { u as useHead } from './v3-DkGAEUz2.mjs';
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

var doc$1 = { "kind": "Document", "definitions": [{ "kind": "OperationDefinition", "operation": "query", "name": { "kind": "Name", "value": "systemBySlugQuery" }, "variableDefinitions": [{ "kind": "VariableDefinition", "variable": { "kind": "Variable", "name": { "kind": "Name", "value": "slug" } }, "type": { "kind": "NonNullType", "type": { "kind": "NamedType", "name": { "kind": "Name", "value": "String" } } }, "directives": [] }], "directives": [], "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "systemCollection" }, "arguments": [{ "kind": "Argument", "name": { "kind": "Name", "value": "where" }, "value": { "kind": "ObjectValue", "fields": [{ "kind": "ObjectField", "name": { "kind": "Name", "value": "slug" }, "value": { "kind": "Variable", "name": { "kind": "Name", "value": "slug" } } }] } }, { "kind": "Argument", "name": { "kind": "Name", "value": "limit" }, "value": { "kind": "IntValue", "value": "1" } }], "directives": [], "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "items" }, "arguments": [], "directives": [], "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "sys" }, "arguments": [], "directives": [], "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "id" }, "arguments": [], "directives": [] }] } }, { "kind": "Field", "name": { "kind": "Name", "value": "title" }, "arguments": [], "directives": [] }, { "kind": "Field", "name": { "kind": "Name", "value": "shortName" }, "arguments": [], "directives": [] }, { "kind": "Field", "name": { "kind": "Name", "value": "manufacturer" }, "arguments": [], "directives": [], "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "title" }, "arguments": [], "directives": [] }] } }] } }] } }] } }], "loc": { "start": 0, "end": 237 } };
doc$1.loc.source = { "body": "query systemBySlugQuery($slug: String!) {\r\n  systemCollection(where: { slug: $slug }, limit: 1) {\r\n    items {\r\n      sys {\r\n        id\r\n      }\r\n      title\r\n      shortName\r\n      manufacturer {\r\n        title\r\n      }\r\n    }\r\n  }\r\n}\r\n", "name": "GraphQL request", "locationOffset": { "line": 1, "column": 1 } };
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
(function extractReferences() {
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
oneQuery$1(doc$1, "systemBySlugQuery");
var doc = { "kind": "Document", "definitions": [{ "kind": "OperationDefinition", "operation": "query", "name": { "kind": "Name", "value": "gamesBySystemQuery" }, "variableDefinitions": [{ "kind": "VariableDefinition", "variable": { "kind": "Variable", "name": { "kind": "Name", "value": "system" } }, "type": { "kind": "NonNullType", "type": { "kind": "NamedType", "name": { "kind": "Name", "value": "String" } } }, "directives": [] }], "directives": [], "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "gameCollection" }, "arguments": [{ "kind": "Argument", "name": { "kind": "Name", "value": "limit" }, "value": { "kind": "IntValue", "value": "999" } }, { "kind": "Argument", "name": { "kind": "Name", "value": "where" }, "value": { "kind": "ObjectValue", "fields": [{ "kind": "ObjectField", "name": { "kind": "Name", "value": "system" }, "value": { "kind": "ObjectValue", "fields": [{ "kind": "ObjectField", "name": { "kind": "Name", "value": "slug" }, "value": { "kind": "Variable", "name": { "kind": "Name", "value": "system" } } }] } }] } }, { "kind": "Argument", "name": { "kind": "Name", "value": "order" }, "value": { "kind": "ListValue", "values": [{ "kind": "EnumValue", "value": "title_ASC" }] } }], "directives": [], "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "items" }, "arguments": [], "directives": [], "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "sys" }, "arguments": [], "directives": [], "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "id" }, "arguments": [], "directives": [] }] } }, { "kind": "Field", "name": { "kind": "Name", "value": "title" }, "arguments": [], "directives": [] }, { "kind": "Field", "name": { "kind": "Name", "value": "slug" }, "arguments": [], "directives": [] }, { "kind": "Field", "name": { "kind": "Name", "value": "playedStatus" }, "arguments": [], "directives": [] }, { "kind": "Field", "name": { "kind": "Name", "value": "digital" }, "arguments": [], "directives": [] }, { "kind": "Field", "name": { "kind": "Name", "value": "wtbWts" }, "arguments": [], "directives": [] }, { "kind": "Field", "name": { "kind": "Name", "value": "system" }, "arguments": [], "directives": [], "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "slug" }, "arguments": [], "directives": [] }] } }, { "kind": "Field", "name": { "kind": "Name", "value": "region" }, "arguments": [], "directives": [] }] } }] } }] } }], "loc": { "start": 0, "end": 325 } };
doc.loc.source = { "body": "query gamesBySystemQuery($system: String!) {\r\n  gameCollection(limit: 999, where: { system: { slug: $system } }, order: [title_ASC]) {\r\n    items {\r\n      sys {\r\n        id\r\n      }\r\n      title\r\n      slug\r\n      playedStatus\r\n      digital\r\n      wtbWts\r\n      system {\r\n        slug\r\n      }\r\n      region\r\n    }\r\n  }\r\n}\r\n", "name": "GraphQL request", "locationOffset": { "line": 1, "column": 1 } };
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
(function extractReferences2() {
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
oneQuery(doc, "gamesBySystemQuery");
const _sfc_main = {
  __name: "[slug]",
  __ssrInlineRender: true,
  async setup(__props) {
    let __temp, __restore;
    const route = useRoute();
    const { $graphql } = useNuxtApp();
    const { data: systemData } = ([__temp, __restore] = withAsyncContext(() => useAsyncData(
      "system",
      () => $graphql.request(doc$1, {
        slug: route.params.slug
      })
    )), __temp = await __temp, __restore(), __temp);
    const system = computed(
      () => {
        var _a, _b, _c;
        return ((_c = (_b = (_a = systemData.value) == null ? void 0 : _a.systemCollection) == null ? void 0 : _b.items) == null ? void 0 : _c[0]) || {};
      }
    );
    useHead(() => {
      var _a;
      return {
        title: ((_a = system.value) == null ? void 0 : _a.title) ? `Gloves Off Games - ${system.value.title}` : "Gloves Off Games - System"
      };
    });
    const { data: gamesData } = ([__temp, __restore] = withAsyncContext(() => useAsyncData(
      "gamesBySystem",
      () => $graphql.request(doc, {
        system: route.params.slug
      })
    )), __temp = await __temp, __restore(), __temp);
    const games = computed(() => {
      var _a, _b;
      return ((_b = (_a = gamesData.value) == null ? void 0 : _a.gameCollection) == null ? void 0 : _b.items) || [];
    });
    computed(() => {
      const gameStatuses = {};
      games.value.forEach((game) => {
        if (gameStatuses[game.playedStatus] == null) {
          gameStatuses[game.playedStatus] = 1;
        } else {
          gameStatuses[game.playedStatus] += 1;
        }
      });
      const series = [];
      for (let gameStatus in gameStatuses) {
        let color = "";
        if (gameStatus == "Untouched") {
          color = "#DB4C40";
        } else if (gameStatus == "Unfinished") {
          color = "#FFB940";
        } else if (gameStatus == "Beaten") {
          color = "#4B8F8C";
        } else if (gameStatus == "Completed") {
          color = "#FCD581";
        }
        series.push({
          name: gameStatus,
          y: gameStatuses[gameStatus],
          color
        });
      }
      return series;
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_GameListWithFilters = _sfc_main$1;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "container" }, _attrs))}><div><div><h1>${ssrInterpolate(unref(system).title)}</h1>`);
      if (unref(system).manufacturer) {
        _push(`<p>${ssrInterpolate(unref(system).manufacturer.title)}</p>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<hr><div><div><h2>Status Overview</h2><p><b>Total Games:</b> ${ssrInterpolate(unref(games).length)}</p></div><div><div id="games-status-chart"></div></div></div><hr>`);
      _push(ssrRenderComponent(_component_GameListWithFilters, { games: unref(games) }, null, _parent));
      _push(`</div></div></div>`);
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/systems/[slug].vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=_slug_-CfGPB07Z.mjs.map

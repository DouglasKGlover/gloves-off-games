import { ref, withAsyncContext, resolveComponent, withCtx, createVNode, unref, createTextVNode, toDisplayString, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate } from 'vue/server-renderer';
import { u as useHead } from './v3-DkGAEUz2.mjs';
import { u as useNuxtApp } from './server.mjs';
import { u as useAsyncData } from './asyncData-Cw6Cs_UY.mjs';
import '../routes/renderer.mjs';
import 'vue-bundle-renderer/runtime';
import '../_/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';
import 'unhead/server';
import 'devalue';
import 'unhead/utils';
import 'unhead/plugins';
import 'vue-router';
import '@contentful/rich-text-types';
import '@contentful/rich-text-html-renderer';
import 'bootstrap-vue-next';
import 'graphql-request';

var doc = { "kind": "Document", "definitions": [{ "kind": "OperationDefinition", "operation": "query", "name": { "kind": "Name", "value": "statistics" }, "variableDefinitions": [], "directives": [], "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "alias": { "kind": "Name", "value": "games" }, "name": { "kind": "Name", "value": "gameCollection" }, "arguments": [], "directives": [], "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "total" }, "arguments": [], "directives": [] }] } }, { "kind": "Field", "alias": { "kind": "Name", "value": "gamesBeaten" }, "name": { "kind": "Name", "value": "gameCollection" }, "arguments": [{ "kind": "Argument", "name": { "kind": "Name", "value": "where" }, "value": { "kind": "ObjectValue", "fields": [{ "kind": "ObjectField", "name": { "kind": "Name", "value": "playedStatus" }, "value": { "kind": "StringValue", "value": "Beaten", "block": false } }] } }], "directives": [], "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "total" }, "arguments": [], "directives": [] }] } }, { "kind": "Field", "alias": { "kind": "Name", "value": "gamesCompleted" }, "name": { "kind": "Name", "value": "gameCollection" }, "arguments": [{ "kind": "Argument", "name": { "kind": "Name", "value": "where" }, "value": { "kind": "ObjectValue", "fields": [{ "kind": "ObjectField", "name": { "kind": "Name", "value": "playedStatus" }, "value": { "kind": "StringValue", "value": "Completed", "block": false } }] } }], "directives": [], "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "total" }, "arguments": [], "directives": [] }] } }, { "kind": "Field", "alias": { "kind": "Name", "value": "gamesUnfinished" }, "name": { "kind": "Name", "value": "gameCollection" }, "arguments": [{ "kind": "Argument", "name": { "kind": "Name", "value": "where" }, "value": { "kind": "ObjectValue", "fields": [{ "kind": "ObjectField", "name": { "kind": "Name", "value": "playedStatus" }, "value": { "kind": "StringValue", "value": "Unfinished", "block": false } }] } }], "directives": [], "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "total" }, "arguments": [], "directives": [] }] } }, { "kind": "Field", "alias": { "kind": "Name", "value": "gamesUntouched" }, "name": { "kind": "Name", "value": "gameCollection" }, "arguments": [{ "kind": "Argument", "name": { "kind": "Name", "value": "where" }, "value": { "kind": "ObjectValue", "fields": [{ "kind": "ObjectField", "name": { "kind": "Name", "value": "playedStatus" }, "value": { "kind": "StringValue", "value": "Untouched", "block": false } }] } }], "directives": [], "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "total" }, "arguments": [], "directives": [] }] } }, { "kind": "Field", "alias": { "kind": "Name", "value": "gamesAbandoned" }, "name": { "kind": "Name", "value": "gameCollection" }, "arguments": [{ "kind": "Argument", "name": { "kind": "Name", "value": "where" }, "value": { "kind": "ObjectValue", "fields": [{ "kind": "ObjectField", "name": { "kind": "Name", "value": "playedStatus" }, "value": { "kind": "StringValue", "value": "Abandoned", "block": false } }] } }], "directives": [], "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "total" }, "arguments": [], "directives": [] }] } }, { "kind": "Field", "alias": { "kind": "Name", "value": "systems" }, "name": { "kind": "Name", "value": "systemCollection" }, "arguments": [{ "kind": "Argument", "name": { "kind": "Name", "value": "order" }, "value": { "kind": "ListValue", "values": [{ "kind": "EnumValue", "value": "title_ASC" }] } }], "directives": [], "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "total" }, "arguments": [], "directives": [] }, { "kind": "Field", "name": { "kind": "Name", "value": "items" }, "arguments": [], "directives": [], "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "title" }, "arguments": [], "directives": [] }, { "kind": "Field", "name": { "kind": "Name", "value": "shortName" }, "arguments": [], "directives": [] }, { "kind": "Field", "name": { "kind": "Name", "value": "linkedFrom" }, "arguments": [], "directives": [], "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "gameCollection" }, "arguments": [], "directives": [], "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "total" }, "arguments": [], "directives": [] }] } }] } }] } }] } }] } }], "loc": { "start": 0, "end": 712 } };
doc.loc.source = { "body": 'query statistics {\r\n  games: gameCollection {\r\n    total\r\n  }\r\n  gamesBeaten: gameCollection(where: { playedStatus: "Beaten" }) {\r\n    total\r\n  }\r\n  gamesCompleted: gameCollection(where: { playedStatus: "Completed" }) {\r\n    total\r\n  }\r\n  gamesUnfinished: gameCollection(where: { playedStatus: "Unfinished" }) {\r\n    total\r\n  }\r\n  gamesUntouched: gameCollection(where: { playedStatus: "Untouched" }) {\r\n    total\r\n  }\r\n  gamesAbandoned: gameCollection(where: { playedStatus: "Abandoned" }) {\r\n    total\r\n  }\r\n  systems: systemCollection(order: [title_ASC]) {\r\n    total\r\n    items {\r\n      title\r\n      shortName\r\n      linkedFrom {\r\n        gameCollection {\r\n          total\r\n        }\r\n      }\r\n    }\r\n  }\r\n}\r\n', "name": "GraphQL request", "locationOffset": { "line": 1, "column": 1 } };
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
oneQuery(doc, "statistics");
const _sfc_main = {
  __name: "index",
  __ssrInlineRender: true,
  async setup(__props) {
    let __temp, __restore;
    useHead({ title: "Gloves Off Games - Stats" });
    ref(null);
    const { $graphql } = useNuxtApp();
    const { data: stats } = ([__temp, __restore] = withAsyncContext(() => useAsyncData(
      "stats",
      () => $graphql.request(doc)
    )), __temp = await __temp, __restore(), __temp);
    return (_ctx, _push, _parent, _attrs) => {
      const _component_b_container = resolveComponent("b-container");
      const _component_b_row = resolveComponent("b-row");
      const _component_b_col = resolveComponent("b-col");
      _push(`<div${ssrRenderAttrs(_attrs)}>`);
      _push(ssrRenderComponent(_component_b_container, null, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(ssrRenderComponent(_component_b_row, null, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(ssrRenderComponent(_component_b_col, null, {
                    default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                      if (_push4) {
                        _push4(`<h1${_scopeId3}>Stats</h1>`);
                      } else {
                        return [
                          createVNode("h1", null, "Stats")
                        ];
                      }
                    }),
                    _: 1
                  }, _parent3, _scopeId2));
                } else {
                  return [
                    createVNode(_component_b_col, null, {
                      default: withCtx(() => [
                        createVNode("h1", null, "Stats")
                      ]),
                      _: 1
                    })
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
            _push2(ssrRenderComponent(_component_b_row, null, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(ssrRenderComponent(_component_b_col, { md: "6" }, {
                    default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                      if (_push4) {
                        _push4(`<h2${_scopeId3}>Games</h2><p${_scopeId3}><b${_scopeId3}>Total:</b> ${ssrInterpolate(unref(stats).games.total)}</p><div id="games-played-status-chart"${_scopeId3}></div>`);
                      } else {
                        return [
                          createVNode("h2", null, "Games"),
                          createVNode("p", null, [
                            createVNode("b", null, "Total:"),
                            createTextVNode(" " + toDisplayString(unref(stats).games.total), 1)
                          ]),
                          createVNode("div", { id: "games-played-status-chart" })
                        ];
                      }
                    }),
                    _: 1
                  }, _parent3, _scopeId2));
                  _push3(ssrRenderComponent(_component_b_col, { md: "6" }, {
                    default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                      if (_push4) {
                        _push4(`<h2${_scopeId3}>Systems</h2><p${_scopeId3}><b${_scopeId3}>Total:</b> ${ssrInterpolate(unref(stats).systems.total)}</p><div id="systems-totals-chart"${_scopeId3}></div>`);
                      } else {
                        return [
                          createVNode("h2", null, "Systems"),
                          createVNode("p", null, [
                            createVNode("b", null, "Total:"),
                            createTextVNode(" " + toDisplayString(unref(stats).systems.total), 1)
                          ]),
                          createVNode("div", { id: "systems-totals-chart" })
                        ];
                      }
                    }),
                    _: 1
                  }, _parent3, _scopeId2));
                } else {
                  return [
                    createVNode(_component_b_col, { md: "6" }, {
                      default: withCtx(() => [
                        createVNode("h2", null, "Games"),
                        createVNode("p", null, [
                          createVNode("b", null, "Total:"),
                          createTextVNode(" " + toDisplayString(unref(stats).games.total), 1)
                        ]),
                        createVNode("div", { id: "games-played-status-chart" })
                      ]),
                      _: 1
                    }),
                    createVNode(_component_b_col, { md: "6" }, {
                      default: withCtx(() => [
                        createVNode("h2", null, "Systems"),
                        createVNode("p", null, [
                          createVNode("b", null, "Total:"),
                          createTextVNode(" " + toDisplayString(unref(stats).systems.total), 1)
                        ]),
                        createVNode("div", { id: "systems-totals-chart" })
                      ]),
                      _: 1
                    })
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
          } else {
            return [
              createVNode(_component_b_row, null, {
                default: withCtx(() => [
                  createVNode(_component_b_col, null, {
                    default: withCtx(() => [
                      createVNode("h1", null, "Stats")
                    ]),
                    _: 1
                  })
                ]),
                _: 1
              }),
              createVNode(_component_b_row, null, {
                default: withCtx(() => [
                  createVNode(_component_b_col, { md: "6" }, {
                    default: withCtx(() => [
                      createVNode("h2", null, "Games"),
                      createVNode("p", null, [
                        createVNode("b", null, "Total:"),
                        createTextVNode(" " + toDisplayString(unref(stats).games.total), 1)
                      ]),
                      createVNode("div", { id: "games-played-status-chart" })
                    ]),
                    _: 1
                  }),
                  createVNode(_component_b_col, { md: "6" }, {
                    default: withCtx(() => [
                      createVNode("h2", null, "Systems"),
                      createVNode("p", null, [
                        createVNode("b", null, "Total:"),
                        createTextVNode(" " + toDisplayString(unref(stats).systems.total), 1)
                      ]),
                      createVNode("div", { id: "systems-totals-chart" })
                    ]),
                    _: 1
                  })
                ]),
                _: 1
              })
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div>`);
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/stats/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=index-BqWJrVrm.mjs.map

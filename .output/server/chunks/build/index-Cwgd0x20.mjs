import { _ as __nuxt_component_0 } from './nuxt-link-DFuu8Q15.mjs';
import { withAsyncContext, computed, resolveComponent, withCtx, createVNode, unref, createTextVNode, toDisplayString, createBlock, openBlock, Fragment, renderList, useSSRContext } from 'vue';
import { ssrRenderComponent, ssrRenderList, ssrInterpolate } from 'vue/server-renderer';
import { u as useHead } from './v3-DkGAEUz2.mjs';
import { u as useNuxtApp } from './server.mjs';
import { u as useAsyncData } from './asyncData-Cw6Cs_UY.mjs';
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
import 'bootstrap-vue-next';
import 'graphql-request';

var doc = { "kind": "Document", "definitions": [{ "kind": "OperationDefinition", "operation": "query", "name": { "kind": "Name", "value": "allSystemsQuery" }, "variableDefinitions": [], "directives": [], "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "systemCollection" }, "arguments": [{ "kind": "Argument", "name": { "kind": "Name", "value": "order" }, "value": { "kind": "ListValue", "values": [{ "kind": "EnumValue", "value": "title_ASC" }] } }], "directives": [], "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "items" }, "arguments": [], "directives": [], "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "title" }, "arguments": [], "directives": [] }, { "kind": "Field", "name": { "kind": "Name", "value": "shortName" }, "arguments": [], "directives": [] }, { "kind": "Field", "name": { "kind": "Name", "value": "slug" }, "arguments": [], "directives": [] }, { "kind": "Field", "name": { "kind": "Name", "value": "linkedFrom" }, "arguments": [], "directives": [], "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "gameCollection" }, "arguments": [], "directives": [], "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "total" }, "arguments": [], "directives": [] }] } }] } }] } }] } }] } }], "loc": { "start": 0, "end": 220 } };
doc.loc.source = { "body": "query allSystemsQuery {\r\n  systemCollection(order: [title_ASC]) {\r\n    items {\r\n      title\r\n      shortName\r\n      slug\r\n      linkedFrom {\r\n        gameCollection {\r\n          total\r\n        }\r\n      }\r\n    }\r\n  }\r\n}\r\n", "name": "GraphQL request", "locationOffset": { "line": 1, "column": 1 } };
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
oneQuery(doc, "allSystemsQuery");
const _sfc_main = {
  __name: "index",
  __ssrInlineRender: true,
  async setup(__props) {
    let __temp, __restore;
    useHead({
      title: "Gloves Off Games - Systems"
    });
    const { $graphql } = useNuxtApp();
    const { data: allSystemsData } = ([__temp, __restore] = withAsyncContext(() => useAsyncData(
      "allSystems",
      () => $graphql.request(doc)
    )), __temp = await __temp, __restore(), __temp);
    const allSystems = computed(
      () => {
        var _a, _b;
        return ((_b = (_a = allSystemsData.value) == null ? void 0 : _a.systemCollection) == null ? void 0 : _b.items) || [];
      }
    );
    return (_ctx, _push, _parent, _attrs) => {
      const _component_b_container = resolveComponent("b-container");
      const _component_b_row = resolveComponent("b-row");
      const _component_b_col = resolveComponent("b-col");
      const _component_NuxtLink = __nuxt_component_0;
      _push(ssrRenderComponent(_component_b_container, _attrs, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(ssrRenderComponent(_component_b_row, null, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(ssrRenderComponent(_component_b_col, null, {
                    default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                      if (_push4) {
                        _push4(`<h1${_scopeId3}>Systems</h1><p${_scopeId3}>Every single one of them.</p><hr${_scopeId3}>`);
                      } else {
                        return [
                          createVNode("h1", null, "Systems"),
                          createVNode("p", null, "Every single one of them."),
                          createVNode("hr")
                        ];
                      }
                    }),
                    _: 1
                  }, _parent3, _scopeId2));
                } else {
                  return [
                    createVNode(_component_b_col, null, {
                      default: withCtx(() => [
                        createVNode("h1", null, "Systems"),
                        createVNode("p", null, "Every single one of them."),
                        createVNode("hr")
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
                  _push3(ssrRenderComponent(_component_b_col, null, {
                    default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                      if (_push4) {
                        _push4(`<ul${_scopeId3}><!--[-->`);
                        ssrRenderList(unref(allSystems), (system, index) => {
                          _push4(`<li${_scopeId3}>`);
                          _push4(ssrRenderComponent(_component_NuxtLink, {
                            to: `/systems/${system.slug}`
                          }, {
                            default: withCtx((_4, _push5, _parent5, _scopeId4) => {
                              if (_push5) {
                                _push5(`${ssrInterpolate(system.title)} <sup${_scopeId4}> [${ssrInterpolate(system.linkedFrom.gameCollection.total)}]</sup>`);
                              } else {
                                return [
                                  createTextVNode(toDisplayString(system.title) + " ", 1),
                                  createVNode("sup", null, " [" + toDisplayString(system.linkedFrom.gameCollection.total) + "]", 1)
                                ];
                              }
                            }),
                            _: 2
                          }, _parent4, _scopeId3));
                          _push4(`</li>`);
                        });
                        _push4(`<!--]--></ul>`);
                      } else {
                        return [
                          createVNode("ul", null, [
                            (openBlock(true), createBlock(Fragment, null, renderList(unref(allSystems), (system, index) => {
                              return openBlock(), createBlock("li", {
                                key: `systems-list-item-${index}`
                              }, [
                                createVNode(_component_NuxtLink, {
                                  to: `/systems/${system.slug}`
                                }, {
                                  default: withCtx(() => [
                                    createTextVNode(toDisplayString(system.title) + " ", 1),
                                    createVNode("sup", null, " [" + toDisplayString(system.linkedFrom.gameCollection.total) + "]", 1)
                                  ]),
                                  _: 2
                                }, 1032, ["to"])
                              ]);
                            }), 128))
                          ])
                        ];
                      }
                    }),
                    _: 1
                  }, _parent3, _scopeId2));
                } else {
                  return [
                    createVNode(_component_b_col, null, {
                      default: withCtx(() => [
                        createVNode("ul", null, [
                          (openBlock(true), createBlock(Fragment, null, renderList(unref(allSystems), (system, index) => {
                            return openBlock(), createBlock("li", {
                              key: `systems-list-item-${index}`
                            }, [
                              createVNode(_component_NuxtLink, {
                                to: `/systems/${system.slug}`
                              }, {
                                default: withCtx(() => [
                                  createTextVNode(toDisplayString(system.title) + " ", 1),
                                  createVNode("sup", null, " [" + toDisplayString(system.linkedFrom.gameCollection.total) + "]", 1)
                                ]),
                                _: 2
                              }, 1032, ["to"])
                            ]);
                          }), 128))
                        ])
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
                      createVNode("h1", null, "Systems"),
                      createVNode("p", null, "Every single one of them."),
                      createVNode("hr")
                    ]),
                    _: 1
                  })
                ]),
                _: 1
              }),
              createVNode(_component_b_row, null, {
                default: withCtx(() => [
                  createVNode(_component_b_col, null, {
                    default: withCtx(() => [
                      createVNode("ul", null, [
                        (openBlock(true), createBlock(Fragment, null, renderList(unref(allSystems), (system, index) => {
                          return openBlock(), createBlock("li", {
                            key: `systems-list-item-${index}`
                          }, [
                            createVNode(_component_NuxtLink, {
                              to: `/systems/${system.slug}`
                            }, {
                              default: withCtx(() => [
                                createTextVNode(toDisplayString(system.title) + " ", 1),
                                createVNode("sup", null, " [" + toDisplayString(system.linkedFrom.gameCollection.total) + "]", 1)
                              ]),
                              _: 2
                            }, 1032, ["to"])
                          ]);
                        }), 128))
                      ])
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
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/systems/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=index-Cwgd0x20.mjs.map

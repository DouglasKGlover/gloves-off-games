import { withAsyncContext, computed, resolveComponent, resolveDirective, withCtx, unref, mergeProps, createVNode, withDirectives, createBlock, openBlock, Fragment, renderList, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrRenderList, ssrGetDirectiveProps } from 'vue/server-renderer';
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

var doc = { "kind": "Document", "definitions": [{ "kind": "OperationDefinition", "operation": "query", "name": { "kind": "Name", "value": "allImagesQuery" }, "variableDefinitions": [], "directives": [], "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "assetCollection" }, "arguments": [{ "kind": "Argument", "name": { "kind": "Name", "value": "limit" }, "value": { "kind": "IntValue", "value": "999" } }, { "kind": "Argument", "name": { "kind": "Name", "value": "order" }, "value": { "kind": "EnumValue", "value": "sys_firstPublishedAt_DESC" } }], "directives": [], "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "items" }, "arguments": [], "directives": [], "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "url" }, "arguments": [], "directives": [] }, { "kind": "Field", "alias": { "kind": "Name", "value": "thumbnail" }, "name": { "kind": "Name", "value": "url" }, "arguments": [{ "kind": "Argument", "name": { "kind": "Name", "value": "transform" }, "value": { "kind": "ObjectValue", "fields": [{ "kind": "ObjectField", "name": { "kind": "Name", "value": "width" }, "value": { "kind": "IntValue", "value": "300" } }, { "kind": "ObjectField", "name": { "kind": "Name", "value": "height" }, "value": { "kind": "IntValue", "value": "200" } }, { "kind": "ObjectField", "name": { "kind": "Name", "value": "resizeStrategy" }, "value": { "kind": "EnumValue", "value": "FILL" } }] } }], "directives": [] }] } }] } }] } }], "loc": { "start": 0, "end": 271 } };
doc.loc.source = { "body": "# TODO: Paginate instead of 999 limit\r\nquery allImagesQuery {\r\n  assetCollection(limit: 999, order: sys_firstPublishedAt_DESC) {\r\n    items {\r\n      url\r\n      thumbnail: url(\r\n        transform: { width: 300, height: 200, resizeStrategy: FILL }\r\n      )\r\n    }\r\n  }\r\n}\r\n", "name": "GraphQL request", "locationOffset": { "line": 1, "column": 1 } };
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
oneQuery(doc, "allImagesQuery");
const _sfc_main = {
  __name: "gallery",
  __ssrInlineRender: true,
  async setup(__props) {
    let __temp, __restore;
    const { $graphql } = useNuxtApp();
    const { data: allImagesData } = ([__temp, __restore] = withAsyncContext(() => useAsyncData(
      "allImages",
      () => $graphql.request(doc)
    )), __temp = await __temp, __restore(), __temp);
    const images = computed(
      () => {
        var _a, _b;
        return ((_b = (_a = allImagesData.value) == null ? void 0 : _a.assetCollection) == null ? void 0 : _b.items) || [];
      }
    );
    return (_ctx, _push, _parent, _attrs) => {
      const _component_b_container = resolveComponent("b-container");
      const _component_b_row = resolveComponent("b-row");
      const _component_b_col = resolveComponent("b-col");
      const _component_b_button = resolveComponent("b-button");
      const _component_b_img = resolveComponent("b-img");
      const _component_b_modal = resolveComponent("b-modal");
      const _directive_b_modal = resolveDirective("b-modal");
      _push(`<main${ssrRenderAttrs(_attrs)}>`);
      _push(ssrRenderComponent(_component_b_container, null, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(ssrRenderComponent(_component_b_row, { class: "mb-4" }, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(ssrRenderComponent(_component_b_col, null, {
                    default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                      if (_push4) {
                        _push4(`<h1 class="mb-4"${_scopeId3}>Photo Gallery</h1>`);
                        _push4(ssrRenderComponent(_component_b_row, null, {
                          default: withCtx((_4, _push5, _parent5, _scopeId4) => {
                            if (_push5) {
                              _push5(`<!--[-->`);
                              ssrRenderList(unref(images), (photo, index) => {
                                _push5(ssrRenderComponent(_component_b_col, {
                                  cols: "4",
                                  md: "3",
                                  key: `game-photo-${index}`,
                                  class: "mb-4"
                                }, {
                                  default: withCtx((_5, _push6, _parent6, _scopeId5) => {
                                    if (_push6) {
                                      _push6(ssrRenderComponent(_component_b_button, mergeProps({ class: "image-button" }, ssrGetDirectiveProps(_ctx, _directive_b_modal, `photo-modal-${index}`)), {
                                        default: withCtx((_6, _push7, _parent7, _scopeId6) => {
                                          if (_push7) {
                                            _push7(ssrRenderComponent(_component_b_img, {
                                              fluid: "",
                                              src: photo.thumbnail,
                                              width: "300",
                                              height: "200"
                                            }, null, _parent7, _scopeId6));
                                          } else {
                                            return [
                                              createVNode(_component_b_img, {
                                                fluid: "",
                                                src: photo.thumbnail,
                                                width: "300",
                                                height: "200"
                                              }, null, 8, ["src"])
                                            ];
                                          }
                                        }),
                                        _: 2
                                      }, _parent6, _scopeId5));
                                      _push6(ssrRenderComponent(_component_b_modal, {
                                        id: `photo-modal-${index}`,
                                        "hide-footer": "",
                                        size: "xl"
                                      }, {
                                        default: withCtx((_6, _push7, _parent7, _scopeId6) => {
                                          if (_push7) {
                                            _push7(ssrRenderComponent(_component_b_img, {
                                              src: photo.url,
                                              fluid: ""
                                            }, null, _parent7, _scopeId6));
                                          } else {
                                            return [
                                              createVNode(_component_b_img, {
                                                src: photo.url,
                                                fluid: ""
                                              }, null, 8, ["src"])
                                            ];
                                          }
                                        }),
                                        _: 2
                                      }, _parent6, _scopeId5));
                                    } else {
                                      return [
                                        withDirectives((openBlock(), createBlock(_component_b_button, { class: "image-button" }, {
                                          default: withCtx(() => [
                                            createVNode(_component_b_img, {
                                              fluid: "",
                                              src: photo.thumbnail,
                                              width: "300",
                                              height: "200"
                                            }, null, 8, ["src"])
                                          ]),
                                          _: 2
                                        }, 1024)), [
                                          [_directive_b_modal, `photo-modal-${index}`]
                                        ]),
                                        createVNode(_component_b_modal, {
                                          id: `photo-modal-${index}`,
                                          "hide-footer": "",
                                          size: "xl"
                                        }, {
                                          default: withCtx(() => [
                                            createVNode(_component_b_img, {
                                              src: photo.url,
                                              fluid: ""
                                            }, null, 8, ["src"])
                                          ]),
                                          _: 2
                                        }, 1032, ["id"])
                                      ];
                                    }
                                  }),
                                  _: 2
                                }, _parent5, _scopeId4));
                              });
                              _push5(`<!--]-->`);
                            } else {
                              return [
                                (openBlock(true), createBlock(Fragment, null, renderList(unref(images), (photo, index) => {
                                  return openBlock(), createBlock(_component_b_col, {
                                    cols: "4",
                                    md: "3",
                                    key: `game-photo-${index}`,
                                    class: "mb-4"
                                  }, {
                                    default: withCtx(() => [
                                      withDirectives((openBlock(), createBlock(_component_b_button, { class: "image-button" }, {
                                        default: withCtx(() => [
                                          createVNode(_component_b_img, {
                                            fluid: "",
                                            src: photo.thumbnail,
                                            width: "300",
                                            height: "200"
                                          }, null, 8, ["src"])
                                        ]),
                                        _: 2
                                      }, 1024)), [
                                        [_directive_b_modal, `photo-modal-${index}`]
                                      ]),
                                      createVNode(_component_b_modal, {
                                        id: `photo-modal-${index}`,
                                        "hide-footer": "",
                                        size: "xl"
                                      }, {
                                        default: withCtx(() => [
                                          createVNode(_component_b_img, {
                                            src: photo.url,
                                            fluid: ""
                                          }, null, 8, ["src"])
                                        ]),
                                        _: 2
                                      }, 1032, ["id"])
                                    ]),
                                    _: 2
                                  }, 1024);
                                }), 128))
                              ];
                            }
                          }),
                          _: 1
                        }, _parent4, _scopeId3));
                      } else {
                        return [
                          createVNode("h1", { class: "mb-4" }, "Photo Gallery"),
                          createVNode(_component_b_row, null, {
                            default: withCtx(() => [
                              (openBlock(true), createBlock(Fragment, null, renderList(unref(images), (photo, index) => {
                                return openBlock(), createBlock(_component_b_col, {
                                  cols: "4",
                                  md: "3",
                                  key: `game-photo-${index}`,
                                  class: "mb-4"
                                }, {
                                  default: withCtx(() => [
                                    withDirectives((openBlock(), createBlock(_component_b_button, { class: "image-button" }, {
                                      default: withCtx(() => [
                                        createVNode(_component_b_img, {
                                          fluid: "",
                                          src: photo.thumbnail,
                                          width: "300",
                                          height: "200"
                                        }, null, 8, ["src"])
                                      ]),
                                      _: 2
                                    }, 1024)), [
                                      [_directive_b_modal, `photo-modal-${index}`]
                                    ]),
                                    createVNode(_component_b_modal, {
                                      id: `photo-modal-${index}`,
                                      "hide-footer": "",
                                      size: "xl"
                                    }, {
                                      default: withCtx(() => [
                                        createVNode(_component_b_img, {
                                          src: photo.url,
                                          fluid: ""
                                        }, null, 8, ["src"])
                                      ]),
                                      _: 2
                                    }, 1032, ["id"])
                                  ]),
                                  _: 2
                                }, 1024);
                              }), 128))
                            ]),
                            _: 1
                          })
                        ];
                      }
                    }),
                    _: 1
                  }, _parent3, _scopeId2));
                } else {
                  return [
                    createVNode(_component_b_col, null, {
                      default: withCtx(() => [
                        createVNode("h1", { class: "mb-4" }, "Photo Gallery"),
                        createVNode(_component_b_row, null, {
                          default: withCtx(() => [
                            (openBlock(true), createBlock(Fragment, null, renderList(unref(images), (photo, index) => {
                              return openBlock(), createBlock(_component_b_col, {
                                cols: "4",
                                md: "3",
                                key: `game-photo-${index}`,
                                class: "mb-4"
                              }, {
                                default: withCtx(() => [
                                  withDirectives((openBlock(), createBlock(_component_b_button, { class: "image-button" }, {
                                    default: withCtx(() => [
                                      createVNode(_component_b_img, {
                                        fluid: "",
                                        src: photo.thumbnail,
                                        width: "300",
                                        height: "200"
                                      }, null, 8, ["src"])
                                    ]),
                                    _: 2
                                  }, 1024)), [
                                    [_directive_b_modal, `photo-modal-${index}`]
                                  ]),
                                  createVNode(_component_b_modal, {
                                    id: `photo-modal-${index}`,
                                    "hide-footer": "",
                                    size: "xl"
                                  }, {
                                    default: withCtx(() => [
                                      createVNode(_component_b_img, {
                                        src: photo.url,
                                        fluid: ""
                                      }, null, 8, ["src"])
                                    ]),
                                    _: 2
                                  }, 1032, ["id"])
                                ]),
                                _: 2
                              }, 1024);
                            }), 128))
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
            }, _parent2, _scopeId));
          } else {
            return [
              createVNode(_component_b_row, { class: "mb-4" }, {
                default: withCtx(() => [
                  createVNode(_component_b_col, null, {
                    default: withCtx(() => [
                      createVNode("h1", { class: "mb-4" }, "Photo Gallery"),
                      createVNode(_component_b_row, null, {
                        default: withCtx(() => [
                          (openBlock(true), createBlock(Fragment, null, renderList(unref(images), (photo, index) => {
                            return openBlock(), createBlock(_component_b_col, {
                              cols: "4",
                              md: "3",
                              key: `game-photo-${index}`,
                              class: "mb-4"
                            }, {
                              default: withCtx(() => [
                                withDirectives((openBlock(), createBlock(_component_b_button, { class: "image-button" }, {
                                  default: withCtx(() => [
                                    createVNode(_component_b_img, {
                                      fluid: "",
                                      src: photo.thumbnail,
                                      width: "300",
                                      height: "200"
                                    }, null, 8, ["src"])
                                  ]),
                                  _: 2
                                }, 1024)), [
                                  [_directive_b_modal, `photo-modal-${index}`]
                                ]),
                                createVNode(_component_b_modal, {
                                  id: `photo-modal-${index}`,
                                  "hide-footer": "",
                                  size: "xl"
                                }, {
                                  default: withCtx(() => [
                                    createVNode(_component_b_img, {
                                      src: photo.url,
                                      fluid: ""
                                    }, null, 8, ["src"])
                                  ]),
                                  _: 2
                                }, 1032, ["id"])
                              ]),
                              _: 2
                            }, 1024);
                          }), 128))
                        ]),
                        _: 1
                      })
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
      _push(`</main>`);
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/gallery.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=gallery-IckItPu7.mjs.map

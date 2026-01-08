import { _ as __nuxt_component_0 } from './nuxt-link-DFuu8Q15.mjs';
import { a as __nuxt_component_1, _ as __nuxt_component_2 } from './RegionIndicator-B0XM8soE.mjs';
import { withAsyncContext, computed, resolveComponent, resolveDirective, unref, withCtx, createTextVNode, toDisplayString, mergeProps, createVNode, withDirectives, createBlock, openBlock, Fragment, renderList, createCommentVNode, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate, ssrRenderAttr, ssrRenderClass, ssrRenderList, ssrGetDirectiveProps } from 'vue/server-renderer';
import { _ as _export_sfc, a as useRoute, u as useNuxtApp } from './server.mjs';
import { u as useAsyncData } from './asyncData-Cw6Cs_UY.mjs';
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
import 'bootstrap-vue-next';
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
      const _component_b_container = resolveComponent("b-container");
      const _component_b_row = resolveComponent("b-row");
      const _component_b_col = resolveComponent("b-col");
      const _component_NuxtLink = __nuxt_component_0;
      const _component_GameRegionIndicator = __nuxt_component_1;
      const _component_GamePlayedStatusIndicator = __nuxt_component_2;
      const _component_b_button = resolveComponent("b-button");
      const _component_b_img = resolveComponent("b-img");
      const _component_b_modal = resolveComponent("b-modal");
      const _directive_b_modal = resolveDirective("b-modal");
      _push(`<div${ssrRenderAttrs(_attrs)} data-v-6082ad8c>`);
      if (unref(game).title) {
        _push(ssrRenderComponent(_component_b_container, null, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(ssrRenderComponent(_component_b_row, null, {
                default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(ssrRenderComponent(_component_b_col, null, {
                      default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                        var _a;
                        if (_push4) {
                          _push4(`<h1 data-v-6082ad8c${_scopeId3}>${ssrInterpolate(unref(game).title)}</h1><h2 data-v-6082ad8c${_scopeId3}>`);
                          _push4(ssrRenderComponent(_component_NuxtLink, {
                            to: `/systems/${unref(game).system.slug}`
                          }, {
                            default: withCtx((_4, _push5, _parent5, _scopeId4) => {
                              if (_push5) {
                                _push5(`${ssrInterpolate(unref(game).system.title)}`);
                              } else {
                                return [
                                  createTextVNode(toDisplayString(unref(game).system.title), 1)
                                ];
                              }
                            }),
                            _: 1
                          }, _parent4, _scopeId3));
                          _push4(`</h2><div class="mt-4" data-v-6082ad8c${_scopeId3}><h3 data-v-6082ad8c${_scopeId3}>Overview</h3><ul data-v-6082ad8c${_scopeId3}><li data-v-6082ad8c${_scopeId3}>`);
                          _push4(ssrRenderComponent(_component_GameRegionIndicator, {
                            region: unref(game).region
                          }, null, _parent4, _scopeId3));
                          _push4(`</li>`);
                          if (unref(game).requirementsForCompletion) {
                            _push4(`<li data-v-6082ad8c${_scopeId3}><strong data-v-6082ad8c${_scopeId3}>Requirements for Completion:</strong><div class="d-inline" data-v-6082ad8c${_scopeId3}>${(_a = _ctx.$translateLongText(unref(game).requirementsForCompletion)) != null ? _a : ""}</div></li>`);
                          } else {
                            _push4(`<!---->`);
                          }
                          _push4(`<li data-v-6082ad8c${_scopeId3}><strong data-v-6082ad8c${_scopeId3}>Played Status: </strong>`);
                          _push4(ssrRenderComponent(_component_GamePlayedStatusIndicator, {
                            status: unref(game).playedStatus
                          }, null, _parent4, _scopeId3));
                          _push4(`${ssrInterpolate(unref(game).playedStatus)}</li>`);
                          if (unref(game).highScore) {
                            _push4(`<li data-v-6082ad8c${_scopeId3}><strong data-v-6082ad8c${_scopeId3}>High Score: </strong> ${ssrInterpolate(unref(game).highScore)}</li>`);
                          } else {
                            _push4(`<!---->`);
                          }
                          _push4(`<li data-v-6082ad8c${_scopeId3}><strong data-v-6082ad8c${_scopeId3}>Added: </strong> ${ssrInterpolate(_ctx.$dateTranslate(unref(game).sys.firstPublishedAt).long)}</li><li data-v-6082ad8c${_scopeId3}><strong data-v-6082ad8c${_scopeId3}>Updated: </strong> ${ssrInterpolate(_ctx.$dateTranslate(unref(game).sys.publishedAt).long)}</li><li data-v-6082ad8c${_scopeId3}><a${ssrRenderAttr("href", unref(ebayLink))} target="_blank" data-v-6082ad8c${_scopeId3}>\u{1F4B8} Price Check</a></li>`);
                          if (unref(game).wtbWts) {
                            _push4(`<li class="${ssrRenderClass(unref(game).wtbWts.toLowerCase())}" data-v-6082ad8c${_scopeId3}>`);
                            if (unref(game).wtbWts == "WTS") {
                              _push4(`<strong data-v-6082ad8c${_scopeId3}>For sale!</strong>`);
                            } else {
                              _push4(`<!---->`);
                            }
                            _push4(`</li>`);
                          } else {
                            _push4(`<!---->`);
                          }
                          _push4(`</ul><p data-v-6082ad8c${_scopeId3}></p></div>`);
                          if (unref(photosList).length) {
                            _push4(`<div class="mt-4" data-v-6082ad8c${_scopeId3}><h3 data-v-6082ad8c${_scopeId3}>Photos</h3>`);
                            _push4(ssrRenderComponent(_component_b_row, null, {
                              default: withCtx((_4, _push5, _parent5, _scopeId4) => {
                                if (_push5) {
                                  _push5(`<!--[-->`);
                                  ssrRenderList(unref(photosList), (photo, index) => {
                                    _push5(ssrRenderComponent(_component_b_col, {
                                      cols: "4",
                                      md: "2",
                                      key: `game-photo-${index}`,
                                      class: "mb-2"
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
                                    (openBlock(true), createBlock(Fragment, null, renderList(unref(photosList), (photo, index) => {
                                      return openBlock(), createBlock(_component_b_col, {
                                        cols: "4",
                                        md: "2",
                                        key: `game-photo-${index}`,
                                        class: "mb-2"
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
                            _push4(`</div>`);
                          } else {
                            _push4(`<!---->`);
                          }
                          if (unref(glogs).length) {
                            _push4(`<div class="mt-4" data-v-6082ad8c${_scopeId3}><h3 data-v-6082ad8c${_scopeId3}>Game Log`);
                            if (unref(glogs).length > 1) {
                              _push4(`<span data-v-6082ad8c${_scopeId3}>s</span>`);
                            } else {
                              _push4(`<!---->`);
                            }
                            _push4(`</h3><!--[-->`);
                            ssrRenderList(unref(glogs), (glog, index) => {
                              _push4(`<div class="game-log-link" data-v-6082ad8c${_scopeId3}>${ssrInterpolate(_ctx.$dateTranslate(glog.sys.firstPublishedAt).short)} - `);
                              _push4(ssrRenderComponent(_component_NuxtLink, {
                                to: `/glog/${glog.slug}`
                              }, {
                                default: withCtx((_4, _push5, _parent5, _scopeId4) => {
                                  if (_push5) {
                                    _push5(`${ssrInterpolate(glog.title)}`);
                                  } else {
                                    return [
                                      createTextVNode(toDisplayString(glog.title), 1)
                                    ];
                                  }
                                }),
                                _: 2
                              }, _parent4, _scopeId3));
                              _push4(`</div>`);
                            });
                            _push4(`<!--]--></div>`);
                          } else {
                            _push4(`<!---->`);
                          }
                        } else {
                          return [
                            createVNode("h1", null, toDisplayString(unref(game).title), 1),
                            createVNode("h2", null, [
                              createVNode(_component_NuxtLink, {
                                to: `/systems/${unref(game).system.slug}`
                              }, {
                                default: withCtx(() => [
                                  createTextVNode(toDisplayString(unref(game).system.title), 1)
                                ]),
                                _: 1
                              }, 8, ["to"])
                            ]),
                            createVNode("div", { class: "mt-4" }, [
                              createVNode("h3", null, "Overview"),
                              createVNode("ul", null, [
                                createVNode("li", null, [
                                  createVNode(_component_GameRegionIndicator, {
                                    region: unref(game).region
                                  }, null, 8, ["region"])
                                ]),
                                unref(game).requirementsForCompletion ? (openBlock(), createBlock("li", { key: 0 }, [
                                  createVNode("strong", null, "Requirements for Completion:"),
                                  createVNode("div", {
                                    class: "d-inline",
                                    innerHTML: _ctx.$translateLongText(unref(game).requirementsForCompletion)
                                  }, null, 8, ["innerHTML"])
                                ])) : createCommentVNode("", true),
                                createVNode("li", null, [
                                  createVNode("strong", null, "Played Status: "),
                                  createVNode(_component_GamePlayedStatusIndicator, {
                                    status: unref(game).playedStatus
                                  }, null, 8, ["status"]),
                                  createTextVNode(toDisplayString(unref(game).playedStatus), 1)
                                ]),
                                unref(game).highScore ? (openBlock(), createBlock("li", { key: 1 }, [
                                  createVNode("strong", null, "High Score: "),
                                  createTextVNode(" " + toDisplayString(unref(game).highScore), 1)
                                ])) : createCommentVNode("", true),
                                createVNode("li", null, [
                                  createVNode("strong", null, "Added: "),
                                  createTextVNode(" " + toDisplayString(_ctx.$dateTranslate(unref(game).sys.firstPublishedAt).long), 1)
                                ]),
                                createVNode("li", null, [
                                  createVNode("strong", null, "Updated: "),
                                  createTextVNode(" " + toDisplayString(_ctx.$dateTranslate(unref(game).sys.publishedAt).long), 1)
                                ]),
                                createVNode("li", null, [
                                  createVNode("a", {
                                    href: unref(ebayLink),
                                    target: "_blank"
                                  }, "\u{1F4B8} Price Check", 8, ["href"])
                                ]),
                                unref(game).wtbWts ? (openBlock(), createBlock("li", {
                                  key: 2,
                                  class: unref(game).wtbWts.toLowerCase()
                                }, [
                                  unref(game).wtbWts == "WTS" ? (openBlock(), createBlock("strong", { key: 0 }, "For sale!")) : createCommentVNode("", true)
                                ], 2)) : createCommentVNode("", true)
                              ]),
                              createVNode("p")
                            ]),
                            unref(photosList).length ? (openBlock(), createBlock("div", {
                              key: 0,
                              class: "mt-4"
                            }, [
                              createVNode("h3", null, "Photos"),
                              createVNode(_component_b_row, null, {
                                default: withCtx(() => [
                                  (openBlock(true), createBlock(Fragment, null, renderList(unref(photosList), (photo, index) => {
                                    return openBlock(), createBlock(_component_b_col, {
                                      cols: "4",
                                      md: "2",
                                      key: `game-photo-${index}`,
                                      class: "mb-2"
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
                            ])) : createCommentVNode("", true),
                            unref(glogs).length ? (openBlock(), createBlock("div", {
                              key: 1,
                              class: "mt-4"
                            }, [
                              createVNode("h3", null, [
                                createTextVNode("Game Log"),
                                unref(glogs).length > 1 ? (openBlock(), createBlock("span", { key: 0 }, "s")) : createCommentVNode("", true)
                              ]),
                              (openBlock(true), createBlock(Fragment, null, renderList(unref(glogs), (glog, index) => {
                                return openBlock(), createBlock("div", {
                                  class: "game-log-link",
                                  key: `game-log-${index}`
                                }, [
                                  createTextVNode(toDisplayString(_ctx.$dateTranslate(glog.sys.firstPublishedAt).short) + " - ", 1),
                                  createVNode(_component_NuxtLink, {
                                    to: `/glog/${glog.slug}`
                                  }, {
                                    default: withCtx(() => [
                                      createTextVNode(toDisplayString(glog.title), 1)
                                    ]),
                                    _: 2
                                  }, 1032, ["to"])
                                ]);
                              }), 128))
                            ])) : createCommentVNode("", true)
                          ];
                        }
                      }),
                      _: 1
                    }, _parent3, _scopeId2));
                  } else {
                    return [
                      createVNode(_component_b_col, null, {
                        default: withCtx(() => [
                          createVNode("h1", null, toDisplayString(unref(game).title), 1),
                          createVNode("h2", null, [
                            createVNode(_component_NuxtLink, {
                              to: `/systems/${unref(game).system.slug}`
                            }, {
                              default: withCtx(() => [
                                createTextVNode(toDisplayString(unref(game).system.title), 1)
                              ]),
                              _: 1
                            }, 8, ["to"])
                          ]),
                          createVNode("div", { class: "mt-4" }, [
                            createVNode("h3", null, "Overview"),
                            createVNode("ul", null, [
                              createVNode("li", null, [
                                createVNode(_component_GameRegionIndicator, {
                                  region: unref(game).region
                                }, null, 8, ["region"])
                              ]),
                              unref(game).requirementsForCompletion ? (openBlock(), createBlock("li", { key: 0 }, [
                                createVNode("strong", null, "Requirements for Completion:"),
                                createVNode("div", {
                                  class: "d-inline",
                                  innerHTML: _ctx.$translateLongText(unref(game).requirementsForCompletion)
                                }, null, 8, ["innerHTML"])
                              ])) : createCommentVNode("", true),
                              createVNode("li", null, [
                                createVNode("strong", null, "Played Status: "),
                                createVNode(_component_GamePlayedStatusIndicator, {
                                  status: unref(game).playedStatus
                                }, null, 8, ["status"]),
                                createTextVNode(toDisplayString(unref(game).playedStatus), 1)
                              ]),
                              unref(game).highScore ? (openBlock(), createBlock("li", { key: 1 }, [
                                createVNode("strong", null, "High Score: "),
                                createTextVNode(" " + toDisplayString(unref(game).highScore), 1)
                              ])) : createCommentVNode("", true),
                              createVNode("li", null, [
                                createVNode("strong", null, "Added: "),
                                createTextVNode(" " + toDisplayString(_ctx.$dateTranslate(unref(game).sys.firstPublishedAt).long), 1)
                              ]),
                              createVNode("li", null, [
                                createVNode("strong", null, "Updated: "),
                                createTextVNode(" " + toDisplayString(_ctx.$dateTranslate(unref(game).sys.publishedAt).long), 1)
                              ]),
                              createVNode("li", null, [
                                createVNode("a", {
                                  href: unref(ebayLink),
                                  target: "_blank"
                                }, "\u{1F4B8} Price Check", 8, ["href"])
                              ]),
                              unref(game).wtbWts ? (openBlock(), createBlock("li", {
                                key: 2,
                                class: unref(game).wtbWts.toLowerCase()
                              }, [
                                unref(game).wtbWts == "WTS" ? (openBlock(), createBlock("strong", { key: 0 }, "For sale!")) : createCommentVNode("", true)
                              ], 2)) : createCommentVNode("", true)
                            ]),
                            createVNode("p")
                          ]),
                          unref(photosList).length ? (openBlock(), createBlock("div", {
                            key: 0,
                            class: "mt-4"
                          }, [
                            createVNode("h3", null, "Photos"),
                            createVNode(_component_b_row, null, {
                              default: withCtx(() => [
                                (openBlock(true), createBlock(Fragment, null, renderList(unref(photosList), (photo, index) => {
                                  return openBlock(), createBlock(_component_b_col, {
                                    cols: "4",
                                    md: "2",
                                    key: `game-photo-${index}`,
                                    class: "mb-2"
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
                          ])) : createCommentVNode("", true),
                          unref(glogs).length ? (openBlock(), createBlock("div", {
                            key: 1,
                            class: "mt-4"
                          }, [
                            createVNode("h3", null, [
                              createTextVNode("Game Log"),
                              unref(glogs).length > 1 ? (openBlock(), createBlock("span", { key: 0 }, "s")) : createCommentVNode("", true)
                            ]),
                            (openBlock(true), createBlock(Fragment, null, renderList(unref(glogs), (glog, index) => {
                              return openBlock(), createBlock("div", {
                                class: "game-log-link",
                                key: `game-log-${index}`
                              }, [
                                createTextVNode(toDisplayString(_ctx.$dateTranslate(glog.sys.firstPublishedAt).short) + " - ", 1),
                                createVNode(_component_NuxtLink, {
                                  to: `/glog/${glog.slug}`
                                }, {
                                  default: withCtx(() => [
                                    createTextVNode(toDisplayString(glog.title), 1)
                                  ]),
                                  _: 2
                                }, 1032, ["to"])
                              ]);
                            }), 128))
                          ])) : createCommentVNode("", true)
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
                        createVNode("h1", null, toDisplayString(unref(game).title), 1),
                        createVNode("h2", null, [
                          createVNode(_component_NuxtLink, {
                            to: `/systems/${unref(game).system.slug}`
                          }, {
                            default: withCtx(() => [
                              createTextVNode(toDisplayString(unref(game).system.title), 1)
                            ]),
                            _: 1
                          }, 8, ["to"])
                        ]),
                        createVNode("div", { class: "mt-4" }, [
                          createVNode("h3", null, "Overview"),
                          createVNode("ul", null, [
                            createVNode("li", null, [
                              createVNode(_component_GameRegionIndicator, {
                                region: unref(game).region
                              }, null, 8, ["region"])
                            ]),
                            unref(game).requirementsForCompletion ? (openBlock(), createBlock("li", { key: 0 }, [
                              createVNode("strong", null, "Requirements for Completion:"),
                              createVNode("div", {
                                class: "d-inline",
                                innerHTML: _ctx.$translateLongText(unref(game).requirementsForCompletion)
                              }, null, 8, ["innerHTML"])
                            ])) : createCommentVNode("", true),
                            createVNode("li", null, [
                              createVNode("strong", null, "Played Status: "),
                              createVNode(_component_GamePlayedStatusIndicator, {
                                status: unref(game).playedStatus
                              }, null, 8, ["status"]),
                              createTextVNode(toDisplayString(unref(game).playedStatus), 1)
                            ]),
                            unref(game).highScore ? (openBlock(), createBlock("li", { key: 1 }, [
                              createVNode("strong", null, "High Score: "),
                              createTextVNode(" " + toDisplayString(unref(game).highScore), 1)
                            ])) : createCommentVNode("", true),
                            createVNode("li", null, [
                              createVNode("strong", null, "Added: "),
                              createTextVNode(" " + toDisplayString(_ctx.$dateTranslate(unref(game).sys.firstPublishedAt).long), 1)
                            ]),
                            createVNode("li", null, [
                              createVNode("strong", null, "Updated: "),
                              createTextVNode(" " + toDisplayString(_ctx.$dateTranslate(unref(game).sys.publishedAt).long), 1)
                            ]),
                            createVNode("li", null, [
                              createVNode("a", {
                                href: unref(ebayLink),
                                target: "_blank"
                              }, "\u{1F4B8} Price Check", 8, ["href"])
                            ]),
                            unref(game).wtbWts ? (openBlock(), createBlock("li", {
                              key: 2,
                              class: unref(game).wtbWts.toLowerCase()
                            }, [
                              unref(game).wtbWts == "WTS" ? (openBlock(), createBlock("strong", { key: 0 }, "For sale!")) : createCommentVNode("", true)
                            ], 2)) : createCommentVNode("", true)
                          ]),
                          createVNode("p")
                        ]),
                        unref(photosList).length ? (openBlock(), createBlock("div", {
                          key: 0,
                          class: "mt-4"
                        }, [
                          createVNode("h3", null, "Photos"),
                          createVNode(_component_b_row, null, {
                            default: withCtx(() => [
                              (openBlock(true), createBlock(Fragment, null, renderList(unref(photosList), (photo, index) => {
                                return openBlock(), createBlock(_component_b_col, {
                                  cols: "4",
                                  md: "2",
                                  key: `game-photo-${index}`,
                                  class: "mb-2"
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
                        ])) : createCommentVNode("", true),
                        unref(glogs).length ? (openBlock(), createBlock("div", {
                          key: 1,
                          class: "mt-4"
                        }, [
                          createVNode("h3", null, [
                            createTextVNode("Game Log"),
                            unref(glogs).length > 1 ? (openBlock(), createBlock("span", { key: 0 }, "s")) : createCommentVNode("", true)
                          ]),
                          (openBlock(true), createBlock(Fragment, null, renderList(unref(glogs), (glog, index) => {
                            return openBlock(), createBlock("div", {
                              class: "game-log-link",
                              key: `game-log-${index}`
                            }, [
                              createTextVNode(toDisplayString(_ctx.$dateTranslate(glog.sys.firstPublishedAt).short) + " - ", 1),
                              createVNode(_component_NuxtLink, {
                                to: `/glog/${glog.slug}`
                              }, {
                                default: withCtx(() => [
                                  createTextVNode(toDisplayString(glog.title), 1)
                                ]),
                                _: 2
                              }, 1032, ["to"])
                            ]);
                          }), 128))
                        ])) : createCommentVNode("", true)
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
const ____pathMatch_ = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-6082ad8c"]]);

export { ____pathMatch_ as default };
//# sourceMappingURL=_...pathMatch_-D0_i5UdT.mjs.map

import { _ as __nuxt_component_0$1 } from './nuxt-link-DFuu8Q15.mjs';
import { mergeProps, ref, watch, resolveComponent, unref, withCtx, createTextVNode, createVNode, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent } from 'vue/server-renderer';
import { _ as _export_sfc, d as __nuxt_component_1$1, a as useRoute } from './server.mjs';
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

const _sfc_main$2 = {
  __name: "SwitchColorScheme",
  __ssrInlineRender: true,
  setup(__props) {
    const colorScheme = ref("light");
    watch(colorScheme, (newScheme) => {
      switch (newScheme) {
        case "dark":
          (void 0).documentElement.style.setProperty("--foreground", "#ddd");
          (void 0).documentElement.style.setProperty("--foreground-darker", "#eee");
          (void 0).documentElement.style.setProperty("--background", "#222");
          (void 0).documentElement.style.setProperty(
            "--background-lighter",
            "#111"
          );
          (void 0).documentElement.style.setProperty("--highlight", "#000");
          localStorage.setItem("color-scheme", newScheme);
          break;
        case "light":
          (void 0).documentElement.style.setProperty("--foreground", "#333");
          (void 0).documentElement.style.setProperty("--foreground-darker", "#111");
          (void 0).documentElement.style.setProperty("--background", "#ddd");
          (void 0).documentElement.style.setProperty(
            "--background-lighter",
            "#eee"
          );
          (void 0).documentElement.style.setProperty("--highlight", "#fff");
          localStorage.setItem("color-scheme", newScheme);
          break;
      }
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<button${ssrRenderAttrs(mergeProps({
        name: "theme",
        "aria-label": "switch light and dark theme"
      }, _attrs))} data-v-e8fb0716></button>`);
    };
  }
};
const _sfc_setup$2 = _sfc_main$2.setup;
_sfc_main$2.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/site/SwitchColorScheme.vue");
  return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
const __nuxt_component_1 = /* @__PURE__ */ _export_sfc(_sfc_main$2, [["__scopeId", "data-v-e8fb0716"]]);
const _sfc_main$1 = {
  __name: "Header",
  __ssrInlineRender: true,
  setup(__props) {
    const active = ref(false);
    const toggle = (state) => {
      {
        active.value = false;
        return;
      }
    };
    const route = useRoute();
    watch(
      () => route.path,
      () => {
        toggle();
      }
    );
    return (_ctx, _push, _parent, _attrs) => {
      const _component_b_container = resolveComponent("b-container");
      const _component_b_row = resolveComponent("b-row");
      const _component_b_col = resolveComponent("b-col");
      const _component_NuxtLink = __nuxt_component_0$1;
      const _component_SiteSwitchColorScheme = __nuxt_component_1;
      _push(`<header${ssrRenderAttrs(mergeProps({
        class: { active: unref(active) }
      }, _attrs))} data-v-41d340c7>`);
      _push(ssrRenderComponent(_component_b_container, null, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(ssrRenderComponent(_component_b_row, null, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(ssrRenderComponent(_component_b_col, null, {
                    default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                      if (_push4) {
                        _push4(`<nav data-v-41d340c7${_scopeId3}><div data-v-41d340c7${_scopeId3}>`);
                        _push4(ssrRenderComponent(_component_NuxtLink, { to: "/" }, {
                          default: withCtx((_4, _push5, _parent5, _scopeId4) => {
                            if (_push5) {
                              _push5(`Home`);
                            } else {
                              return [
                                createTextVNode("Home")
                              ];
                            }
                          }),
                          _: 1
                        }, _parent4, _scopeId3));
                        _push4(ssrRenderComponent(_component_NuxtLink, { to: "/systems/" }, {
                          default: withCtx((_4, _push5, _parent5, _scopeId4) => {
                            if (_push5) {
                              _push5(`Systems`);
                            } else {
                              return [
                                createTextVNode("Systems")
                              ];
                            }
                          }),
                          _: 1
                        }, _parent4, _scopeId3));
                        _push4(ssrRenderComponent(_component_NuxtLink, { to: "/games/" }, {
                          default: withCtx((_4, _push5, _parent5, _scopeId4) => {
                            if (_push5) {
                              _push5(`Games`);
                            } else {
                              return [
                                createTextVNode("Games")
                              ];
                            }
                          }),
                          _: 1
                        }, _parent4, _scopeId3));
                        _push4(ssrRenderComponent(_component_NuxtLink, { to: "/stats/" }, {
                          default: withCtx((_4, _push5, _parent5, _scopeId4) => {
                            if (_push5) {
                              _push5(`Stats`);
                            } else {
                              return [
                                createTextVNode("Stats")
                              ];
                            }
                          }),
                          _: 1
                        }, _parent4, _scopeId3));
                        _push4(ssrRenderComponent(_component_NuxtLink, { to: "/gallery/" }, {
                          default: withCtx((_4, _push5, _parent5, _scopeId4) => {
                            if (_push5) {
                              _push5(`Gallery`);
                            } else {
                              return [
                                createTextVNode("Gallery")
                              ];
                            }
                          }),
                          _: 1
                        }, _parent4, _scopeId3));
                        _push4(ssrRenderComponent(_component_NuxtLink, { to: "/glog/" }, {
                          default: withCtx((_4, _push5, _parent5, _scopeId4) => {
                            if (_push5) {
                              _push5(`Glog`);
                            } else {
                              return [
                                createTextVNode("Glog")
                              ];
                            }
                          }),
                          _: 1
                        }, _parent4, _scopeId3));
                        _push4(`</div>`);
                        _push4(ssrRenderComponent(_component_SiteSwitchColorScheme, null, null, _parent4, _scopeId3));
                        _push4(`</nav>`);
                      } else {
                        return [
                          createVNode("nav", null, [
                            createVNode("div", null, [
                              createVNode(_component_NuxtLink, { to: "/" }, {
                                default: withCtx(() => [
                                  createTextVNode("Home")
                                ]),
                                _: 1
                              }),
                              createVNode(_component_NuxtLink, { to: "/systems/" }, {
                                default: withCtx(() => [
                                  createTextVNode("Systems")
                                ]),
                                _: 1
                              }),
                              createVNode(_component_NuxtLink, { to: "/games/" }, {
                                default: withCtx(() => [
                                  createTextVNode("Games")
                                ]),
                                _: 1
                              }),
                              createVNode(_component_NuxtLink, { to: "/stats/" }, {
                                default: withCtx(() => [
                                  createTextVNode("Stats")
                                ]),
                                _: 1
                              }),
                              createVNode(_component_NuxtLink, { to: "/gallery/" }, {
                                default: withCtx(() => [
                                  createTextVNode("Gallery")
                                ]),
                                _: 1
                              }),
                              createVNode(_component_NuxtLink, { to: "/glog/" }, {
                                default: withCtx(() => [
                                  createTextVNode("Glog")
                                ]),
                                _: 1
                              })
                            ]),
                            createVNode(_component_SiteSwitchColorScheme)
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
                        createVNode("nav", null, [
                          createVNode("div", null, [
                            createVNode(_component_NuxtLink, { to: "/" }, {
                              default: withCtx(() => [
                                createTextVNode("Home")
                              ]),
                              _: 1
                            }),
                            createVNode(_component_NuxtLink, { to: "/systems/" }, {
                              default: withCtx(() => [
                                createTextVNode("Systems")
                              ]),
                              _: 1
                            }),
                            createVNode(_component_NuxtLink, { to: "/games/" }, {
                              default: withCtx(() => [
                                createTextVNode("Games")
                              ]),
                              _: 1
                            }),
                            createVNode(_component_NuxtLink, { to: "/stats/" }, {
                              default: withCtx(() => [
                                createTextVNode("Stats")
                              ]),
                              _: 1
                            }),
                            createVNode(_component_NuxtLink, { to: "/gallery/" }, {
                              default: withCtx(() => [
                                createTextVNode("Gallery")
                              ]),
                              _: 1
                            }),
                            createVNode(_component_NuxtLink, { to: "/glog/" }, {
                              default: withCtx(() => [
                                createTextVNode("Glog")
                              ]),
                              _: 1
                            })
                          ]),
                          createVNode(_component_SiteSwitchColorScheme)
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
                      createVNode("nav", null, [
                        createVNode("div", null, [
                          createVNode(_component_NuxtLink, { to: "/" }, {
                            default: withCtx(() => [
                              createTextVNode("Home")
                            ]),
                            _: 1
                          }),
                          createVNode(_component_NuxtLink, { to: "/systems/" }, {
                            default: withCtx(() => [
                              createTextVNode("Systems")
                            ]),
                            _: 1
                          }),
                          createVNode(_component_NuxtLink, { to: "/games/" }, {
                            default: withCtx(() => [
                              createTextVNode("Games")
                            ]),
                            _: 1
                          }),
                          createVNode(_component_NuxtLink, { to: "/stats/" }, {
                            default: withCtx(() => [
                              createTextVNode("Stats")
                            ]),
                            _: 1
                          }),
                          createVNode(_component_NuxtLink, { to: "/gallery/" }, {
                            default: withCtx(() => [
                              createTextVNode("Gallery")
                            ]),
                            _: 1
                          }),
                          createVNode(_component_NuxtLink, { to: "/glog/" }, {
                            default: withCtx(() => [
                              createTextVNode("Glog")
                            ]),
                            _: 1
                          })
                        ]),
                        createVNode(_component_SiteSwitchColorScheme)
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
      _push(`<button class="d-md-none toggle" aria-label="Navigation Toggle" data-v-41d340c7></button></header>`);
    };
  }
};
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/site/Header.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const __nuxt_component_0 = /* @__PURE__ */ _export_sfc(_sfc_main$1, [["__scopeId", "data-v-41d340c7"]]);
const _sfc_main = {};
function _sfc_ssrRender(_ctx, _push, _parent, _attrs) {
  const _component_SiteHeader = __nuxt_component_0;
  const _component_NuxtPage = __nuxt_component_1$1;
  _push(`<div${ssrRenderAttrs(mergeProps({ class: "py-5" }, _attrs))}>`);
  _push(ssrRenderComponent(_component_SiteHeader, null, null, _parent));
  _push(ssrRenderComponent(_component_NuxtPage, null, null, _parent));
  _push(`</div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("layouts/default.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const _default = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);

export { _default as default };
//# sourceMappingURL=default-CdZ9i-vK.mjs.map

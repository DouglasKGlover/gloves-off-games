import { _ as __nuxt_component_2, a as __nuxt_component_1 } from './RegionIndicator-USLaeHk_.mjs';
import { _ as __nuxt_component_0 } from './nuxt-link-DFuu8Q15.mjs';
import { ref, computed, mergeProps, unref, withCtx, createTextVNode, createVNode, createBlock, createCommentVNode, toDisplayString, openBlock, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrInterpolate, ssrRenderList, ssrRenderAttr, ssrIncludeBooleanAttr, ssrLooseContain, ssrLooseEqual, ssrRenderClass, ssrRenderComponent } from 'vue/server-renderer';

const _sfc_main = {
  __name: "ListWithFilters",
  __ssrInlineRender: true,
  props: {
    games: {
      type: Array,
      required: true
    }
  },
  setup(__props) {
    const props = __props;
    const totalToShow = ref(999);
    const filterStatuses = ref([
      {
        value: null,
        text: "By Status"
      },
      {
        label: "Statuses",
        options: []
      }
    ]);
    const filterDigital = ref([
      {
        value: null,
        text: "By Physical/Digital"
      },
      {
        label: "Physical/Digital",
        options: []
      }
    ]);
    const filterWtbWts = ref([
      {
        value: null,
        text: "By WTB/WTS"
      },
      {
        label: "Wanting to:",
        options: []
      }
    ]);
    const filters = ref({
      status: null,
      digital: null,
      wtbWts: null
    });
    const filteredGames = computed(() => {
      let filtered = props.games;
      if (filters.value.wtbWts) {
        filtered = filtered.filter((game) => game.wtbWts == filters.value.wtbWts);
      }
      if (filters.value.status) {
        filtered = filtered.filter(
          (game) => game.playedStatus == filters.value.status
        );
      }
      if (filters.value.digital !== null) {
        filtered = filtered.filter((game) => {
          if (game.digital && filters.value.digital) {
            return true;
          } else if (!game.digital && !filters.value.digital) {
            return true;
          }
        });
      }
      return filtered;
    });
    const loadedGames = computed(() => {
      return filteredGames.value.slice(0, totalToShow.value);
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_GamePlayedStatusIndicator = __nuxt_component_2;
      const _component_NuxtLink = __nuxt_component_0;
      const _component_GameRegionIndicator = __nuxt_component_1;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "container" }, _attrs))}><div class="game-list-wrapper">`);
      if (unref(filterStatuses)[1].options.length > 1 || unref(filterWtbWts)[1].options.length) {
        _push(`<div class="mobile-no-pad filters-column"><div id="game-filters"><div class="container"><div class="filter-header"><div class="mobile-no-pad"><h2>Filter</h2></div><div class="mobile-no-pad filter-count"><p>${ssrInterpolate(unref(filteredGames).length)}/${ssrInterpolate(__props.games.length)}</p></div></div></div><div class="container"><div class="filter-options">`);
        if (unref(filterStatuses)[1].options.length > 1) {
          _push(`<div class="filter-item"><select class="filter-select"><!--[-->`);
          ssrRenderList(unref(filterStatuses), (group, index) => {
            _push(`<optgroup${ssrRenderAttr("label", group.label)}>`);
            if (!group.label) {
              _push(`<option${ssrRenderAttr("value", group.value)}${ssrIncludeBooleanAttr(Array.isArray(unref(filters).status) ? ssrLooseContain(unref(filters).status, group.value) : ssrLooseEqual(unref(filters).status, group.value)) ? " selected" : ""}>${ssrInterpolate(group.text)}</option>`);
            } else {
              _push(`<!---->`);
            }
            _push(`<!--[-->`);
            ssrRenderList(group.options, (option, optIndex) => {
              _push(`<option${ssrRenderAttr("value", option)}${ssrIncludeBooleanAttr(Array.isArray(unref(filters).status) ? ssrLooseContain(unref(filters).status, option) : ssrLooseEqual(unref(filters).status, option)) ? " selected" : ""}>${ssrInterpolate(option)}</option>`);
            });
            _push(`<!--]--></optgroup>`);
          });
          _push(`<!--]--></select></div>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(filterDigital)[1].options.length > 1) {
          _push(`<div class="filter-item"><select class="filter-select"><!--[-->`);
          ssrRenderList(unref(filterDigital), (group, index) => {
            _push(`<optgroup${ssrRenderAttr("label", group.label)}>`);
            if (!group.label) {
              _push(`<option${ssrRenderAttr("value", group.value)}${ssrIncludeBooleanAttr(Array.isArray(unref(filters).digital) ? ssrLooseContain(unref(filters).digital, group.value) : ssrLooseEqual(unref(filters).digital, group.value)) ? " selected" : ""}>${ssrInterpolate(group.text)}</option>`);
            } else {
              _push(`<!---->`);
            }
            _push(`<!--[-->`);
            ssrRenderList(group.options, (option, optIndex) => {
              _push(`<option${ssrRenderAttr("value", option.value)}${ssrIncludeBooleanAttr(Array.isArray(unref(filters).digital) ? ssrLooseContain(unref(filters).digital, option.value) : ssrLooseEqual(unref(filters).digital, option.value)) ? " selected" : ""}>${ssrInterpolate(option.text)}</option>`);
            });
            _push(`<!--]--></optgroup>`);
          });
          _push(`<!--]--></select></div>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(filterWtbWts)[1].options.length) {
          _push(`<div class="filter-item"><select class="filter-select"><!--[-->`);
          ssrRenderList(unref(filterWtbWts), (group, index) => {
            _push(`<optgroup${ssrRenderAttr("label", group.label)}>`);
            if (!group.label) {
              _push(`<option${ssrRenderAttr("value", group.value)}${ssrIncludeBooleanAttr(Array.isArray(unref(filters).wtbWts) ? ssrLooseContain(unref(filters).wtbWts, group.value) : ssrLooseEqual(unref(filters).wtbWts, group.value)) ? " selected" : ""}>${ssrInterpolate(group.text)}</option>`);
            } else {
              _push(`<!---->`);
            }
            _push(`<!--[-->`);
            ssrRenderList(group.options, (option, optIndex) => {
              _push(`<option${ssrRenderAttr("value", option.value)}${ssrIncludeBooleanAttr(Array.isArray(unref(filters).wtbWts) ? ssrLooseContain(unref(filters).wtbWts, option.value) : ssrLooseEqual(unref(filters).wtbWts, option.value)) ? " selected" : ""}>${ssrInterpolate(option.text)}</option>`);
            });
            _push(`<!--]--></optgroup>`);
          });
          _push(`<!--]--></select></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
        if (unref(filteredGames).length < __props.games.length) {
          _push(`<div class="filter-reset"><div><button>Remove Filters</button></div></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<div class="mobile-no-pad games-column"><!--[-->`);
      ssrRenderList(unref(loadedGames), (game, index) => {
        _push(`<div class="${ssrRenderClass(game.playedStatus)}">`);
        _push(ssrRenderComponent(_component_GamePlayedStatusIndicator, {
          status: game.playedStatus
        }, null, _parent));
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: `/games/${game.system.slug}/${game.slug}`
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`${ssrInterpolate(game.title)} `);
              _push2(ssrRenderComponent(_component_GameRegionIndicator, {
                region: game.region
              }, null, _parent2, _scopeId));
              if (game.system.shortName) {
                _push2(`<sup${_scopeId}> [${ssrInterpolate(game.system.shortName)}]</sup>`);
              } else {
                _push2(`<!---->`);
              }
              if (game.digital) {
                _push2(`<sup${_scopeId}> [Digital]</sup>`);
              } else {
                _push2(`<!---->`);
              }
            } else {
              return [
                createTextVNode(toDisplayString(game.title) + " ", 1),
                createVNode(_component_GameRegionIndicator, {
                  region: game.region
                }, null, 8, ["region"]),
                game.system.shortName ? (openBlock(), createBlock("sup", { key: 0 }, " [" + toDisplayString(game.system.shortName) + "]", 1)) : createCommentVNode("", true),
                game.digital ? (openBlock(), createBlock("sup", { key: 1 }, " [Digital]")) : createCommentVNode("", true)
              ];
            }
          }),
          _: 2
        }, _parent));
        _push(`</div>`);
      });
      _push(`<!--]--><div class="load-more">`);
      if (unref(loadedGames).length < unref(filteredGames).length) {
        _push(`<button> Load More </button>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div></div></div>`);
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/game/ListWithFilters.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as _ };
//# sourceMappingURL=ListWithFilters-BPottIDW.mjs.map

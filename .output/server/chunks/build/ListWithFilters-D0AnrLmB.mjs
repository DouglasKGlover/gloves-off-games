import { _ as __nuxt_component_2, a as __nuxt_component_1 } from './RegionIndicator-B0XM8soE.mjs';
import { _ as __nuxt_component_0 } from './nuxt-link-DFuu8Q15.mjs';
import { ref, computed, resolveComponent, withCtx, unref, createVNode, toDisplayString, createBlock, createCommentVNode, openBlock, createTextVNode, Fragment, renderList, useSSRContext } from 'vue';
import { ssrRenderComponent, ssrInterpolate, ssrRenderList, ssrRenderClass } from 'vue/server-renderer';

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
    const loadMore = () => {
      totalToShow.value = totalToShow.value + 25;
    };
    const removeFilters = () => {
      filters.value = {
        status: null,
        digital: null,
        wtbWts: null
      };
    };
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
      const _component_b_container = resolveComponent("b-container");
      const _component_b_row = resolveComponent("b-row");
      const _component_b_col = resolveComponent("b-col");
      const _component_b_form_select = resolveComponent("b-form-select");
      const _component_GamePlayedStatusIndicator = __nuxt_component_2;
      const _component_NuxtLink = __nuxt_component_0;
      const _component_GameRegionIndicator = __nuxt_component_1;
      _push(ssrRenderComponent(_component_b_container, _attrs, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(ssrRenderComponent(_component_b_row, null, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  if (unref(filterStatuses)[1].options.length > 1 || unref(filterWtbWts)[1].options.length) {
                    _push3(ssrRenderComponent(_component_b_col, {
                      md: "6",
                      "order-md": "2",
                      class: "mobile-no-pad"
                    }, {
                      default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(`<div id="game-filters"${_scopeId3}>`);
                          _push4(ssrRenderComponent(_component_b_container, null, {
                            default: withCtx((_4, _push5, _parent5, _scopeId4) => {
                              if (_push5) {
                                _push5(ssrRenderComponent(_component_b_row, null, {
                                  default: withCtx((_5, _push6, _parent6, _scopeId5) => {
                                    if (_push6) {
                                      _push6(ssrRenderComponent(_component_b_col, {
                                        lg: "3",
                                        class: "mobile-no-pad"
                                      }, {
                                        default: withCtx((_6, _push7, _parent7, _scopeId6) => {
                                          if (_push7) {
                                            _push7(`<h2${_scopeId6}>Filter</h2>`);
                                          } else {
                                            return [
                                              createVNode("h2", null, "Filter")
                                            ];
                                          }
                                        }),
                                        _: 1
                                      }, _parent6, _scopeId5));
                                      _push6(ssrRenderComponent(_component_b_col, {
                                        lg: "2",
                                        "align-self": "end",
                                        class: "mobile-no-pad"
                                      }, {
                                        default: withCtx((_6, _push7, _parent7, _scopeId6) => {
                                          if (_push7) {
                                            _push7(`<p${_scopeId6}>${ssrInterpolate(unref(filteredGames).length)}/${ssrInterpolate(__props.games.length)}</p>`);
                                          } else {
                                            return [
                                              createVNode("p", null, toDisplayString(unref(filteredGames).length) + "/" + toDisplayString(__props.games.length), 1)
                                            ];
                                          }
                                        }),
                                        _: 1
                                      }, _parent6, _scopeId5));
                                    } else {
                                      return [
                                        createVNode(_component_b_col, {
                                          lg: "3",
                                          class: "mobile-no-pad"
                                        }, {
                                          default: withCtx(() => [
                                            createVNode("h2", null, "Filter")
                                          ]),
                                          _: 1
                                        }),
                                        createVNode(_component_b_col, {
                                          lg: "2",
                                          "align-self": "end",
                                          class: "mobile-no-pad"
                                        }, {
                                          default: withCtx(() => [
                                            createVNode("p", null, toDisplayString(unref(filteredGames).length) + "/" + toDisplayString(__props.games.length), 1)
                                          ]),
                                          _: 1
                                        })
                                      ];
                                    }
                                  }),
                                  _: 1
                                }, _parent5, _scopeId4));
                              } else {
                                return [
                                  createVNode(_component_b_row, null, {
                                    default: withCtx(() => [
                                      createVNode(_component_b_col, {
                                        lg: "3",
                                        class: "mobile-no-pad"
                                      }, {
                                        default: withCtx(() => [
                                          createVNode("h2", null, "Filter")
                                        ]),
                                        _: 1
                                      }),
                                      createVNode(_component_b_col, {
                                        lg: "2",
                                        "align-self": "end",
                                        class: "mobile-no-pad"
                                      }, {
                                        default: withCtx(() => [
                                          createVNode("p", null, toDisplayString(unref(filteredGames).length) + "/" + toDisplayString(__props.games.length), 1)
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
                          }, _parent4, _scopeId3));
                          _push4(ssrRenderComponent(_component_b_container, null, {
                            default: withCtx((_4, _push5, _parent5, _scopeId4) => {
                              if (_push5) {
                                _push5(ssrRenderComponent(_component_b_row, null, {
                                  default: withCtx((_5, _push6, _parent6, _scopeId5) => {
                                    if (_push6) {
                                      if (unref(filterStatuses)[1].options.length > 1) {
                                        _push6(ssrRenderComponent(_component_b_col, { lg: "4" }, {
                                          default: withCtx((_6, _push7, _parent7, _scopeId6) => {
                                            if (_push7) {
                                              _push7(ssrRenderComponent(_component_b_form_select, {
                                                modelValue: unref(filters).status,
                                                "onUpdate:modelValue": ($event) => unref(filters).status = $event,
                                                options: unref(filterStatuses),
                                                class: "mb-4"
                                              }, null, _parent7, _scopeId6));
                                            } else {
                                              return [
                                                createVNode(_component_b_form_select, {
                                                  modelValue: unref(filters).status,
                                                  "onUpdate:modelValue": ($event) => unref(filters).status = $event,
                                                  options: unref(filterStatuses),
                                                  class: "mb-4"
                                                }, null, 8, ["modelValue", "onUpdate:modelValue", "options"])
                                              ];
                                            }
                                          }),
                                          _: 1
                                        }, _parent6, _scopeId5));
                                      } else {
                                        _push6(`<!---->`);
                                      }
                                      if (unref(filterDigital)[1].options.length > 1) {
                                        _push6(ssrRenderComponent(_component_b_col, { lg: "4" }, {
                                          default: withCtx((_6, _push7, _parent7, _scopeId6) => {
                                            if (_push7) {
                                              _push7(ssrRenderComponent(_component_b_form_select, {
                                                modelValue: unref(filters).digital,
                                                "onUpdate:modelValue": ($event) => unref(filters).digital = $event,
                                                options: unref(filterDigital),
                                                class: "mb-4"
                                              }, null, _parent7, _scopeId6));
                                            } else {
                                              return [
                                                createVNode(_component_b_form_select, {
                                                  modelValue: unref(filters).digital,
                                                  "onUpdate:modelValue": ($event) => unref(filters).digital = $event,
                                                  options: unref(filterDigital),
                                                  class: "mb-4"
                                                }, null, 8, ["modelValue", "onUpdate:modelValue", "options"])
                                              ];
                                            }
                                          }),
                                          _: 1
                                        }, _parent6, _scopeId5));
                                      } else {
                                        _push6(`<!---->`);
                                      }
                                      if (unref(filterWtbWts)[1].options.length) {
                                        _push6(ssrRenderComponent(_component_b_col, { lg: "4" }, {
                                          default: withCtx((_6, _push7, _parent7, _scopeId6) => {
                                            if (_push7) {
                                              _push7(ssrRenderComponent(_component_b_form_select, {
                                                modelValue: unref(filters).wtbWts,
                                                "onUpdate:modelValue": ($event) => unref(filters).wtbWts = $event,
                                                options: unref(filterWtbWts),
                                                class: "mb-4"
                                              }, null, _parent7, _scopeId6));
                                            } else {
                                              return [
                                                createVNode(_component_b_form_select, {
                                                  modelValue: unref(filters).wtbWts,
                                                  "onUpdate:modelValue": ($event) => unref(filters).wtbWts = $event,
                                                  options: unref(filterWtbWts),
                                                  class: "mb-4"
                                                }, null, 8, ["modelValue", "onUpdate:modelValue", "options"])
                                              ];
                                            }
                                          }),
                                          _: 1
                                        }, _parent6, _scopeId5));
                                      } else {
                                        _push6(`<!---->`);
                                      }
                                    } else {
                                      return [
                                        unref(filterStatuses)[1].options.length > 1 ? (openBlock(), createBlock(_component_b_col, {
                                          key: 0,
                                          lg: "4"
                                        }, {
                                          default: withCtx(() => [
                                            createVNode(_component_b_form_select, {
                                              modelValue: unref(filters).status,
                                              "onUpdate:modelValue": ($event) => unref(filters).status = $event,
                                              options: unref(filterStatuses),
                                              class: "mb-4"
                                            }, null, 8, ["modelValue", "onUpdate:modelValue", "options"])
                                          ]),
                                          _: 1
                                        })) : createCommentVNode("", true),
                                        unref(filterDigital)[1].options.length > 1 ? (openBlock(), createBlock(_component_b_col, {
                                          key: 1,
                                          lg: "4"
                                        }, {
                                          default: withCtx(() => [
                                            createVNode(_component_b_form_select, {
                                              modelValue: unref(filters).digital,
                                              "onUpdate:modelValue": ($event) => unref(filters).digital = $event,
                                              options: unref(filterDigital),
                                              class: "mb-4"
                                            }, null, 8, ["modelValue", "onUpdate:modelValue", "options"])
                                          ]),
                                          _: 1
                                        })) : createCommentVNode("", true),
                                        unref(filterWtbWts)[1].options.length ? (openBlock(), createBlock(_component_b_col, {
                                          key: 2,
                                          lg: "4"
                                        }, {
                                          default: withCtx(() => [
                                            createVNode(_component_b_form_select, {
                                              modelValue: unref(filters).wtbWts,
                                              "onUpdate:modelValue": ($event) => unref(filters).wtbWts = $event,
                                              options: unref(filterWtbWts),
                                              class: "mb-4"
                                            }, null, 8, ["modelValue", "onUpdate:modelValue", "options"])
                                          ]),
                                          _: 1
                                        })) : createCommentVNode("", true)
                                      ];
                                    }
                                  }),
                                  _: 1
                                }, _parent5, _scopeId4));
                                if (unref(filteredGames).length < __props.games.length) {
                                  _push5(ssrRenderComponent(_component_b_row, null, {
                                    default: withCtx((_5, _push6, _parent6, _scopeId5) => {
                                      if (_push6) {
                                        _push6(ssrRenderComponent(_component_b_col, null, {
                                          default: withCtx((_6, _push7, _parent7, _scopeId6) => {
                                            if (_push7) {
                                              _push7(`<button${_scopeId6}>Remove Filters</button>`);
                                            } else {
                                              return [
                                                createVNode("button", { onClick: removeFilters }, "Remove Filters")
                                              ];
                                            }
                                          }),
                                          _: 1
                                        }, _parent6, _scopeId5));
                                      } else {
                                        return [
                                          createVNode(_component_b_col, null, {
                                            default: withCtx(() => [
                                              createVNode("button", { onClick: removeFilters }, "Remove Filters")
                                            ]),
                                            _: 1
                                          })
                                        ];
                                      }
                                    }),
                                    _: 1
                                  }, _parent5, _scopeId4));
                                } else {
                                  _push5(`<!---->`);
                                }
                              } else {
                                return [
                                  createVNode(_component_b_row, null, {
                                    default: withCtx(() => [
                                      unref(filterStatuses)[1].options.length > 1 ? (openBlock(), createBlock(_component_b_col, {
                                        key: 0,
                                        lg: "4"
                                      }, {
                                        default: withCtx(() => [
                                          createVNode(_component_b_form_select, {
                                            modelValue: unref(filters).status,
                                            "onUpdate:modelValue": ($event) => unref(filters).status = $event,
                                            options: unref(filterStatuses),
                                            class: "mb-4"
                                          }, null, 8, ["modelValue", "onUpdate:modelValue", "options"])
                                        ]),
                                        _: 1
                                      })) : createCommentVNode("", true),
                                      unref(filterDigital)[1].options.length > 1 ? (openBlock(), createBlock(_component_b_col, {
                                        key: 1,
                                        lg: "4"
                                      }, {
                                        default: withCtx(() => [
                                          createVNode(_component_b_form_select, {
                                            modelValue: unref(filters).digital,
                                            "onUpdate:modelValue": ($event) => unref(filters).digital = $event,
                                            options: unref(filterDigital),
                                            class: "mb-4"
                                          }, null, 8, ["modelValue", "onUpdate:modelValue", "options"])
                                        ]),
                                        _: 1
                                      })) : createCommentVNode("", true),
                                      unref(filterWtbWts)[1].options.length ? (openBlock(), createBlock(_component_b_col, {
                                        key: 2,
                                        lg: "4"
                                      }, {
                                        default: withCtx(() => [
                                          createVNode(_component_b_form_select, {
                                            modelValue: unref(filters).wtbWts,
                                            "onUpdate:modelValue": ($event) => unref(filters).wtbWts = $event,
                                            options: unref(filterWtbWts),
                                            class: "mb-4"
                                          }, null, 8, ["modelValue", "onUpdate:modelValue", "options"])
                                        ]),
                                        _: 1
                                      })) : createCommentVNode("", true)
                                    ]),
                                    _: 1
                                  }),
                                  unref(filteredGames).length < __props.games.length ? (openBlock(), createBlock(_component_b_row, { key: 0 }, {
                                    default: withCtx(() => [
                                      createVNode(_component_b_col, null, {
                                        default: withCtx(() => [
                                          createVNode("button", { onClick: removeFilters }, "Remove Filters")
                                        ]),
                                        _: 1
                                      })
                                    ]),
                                    _: 1
                                  })) : createCommentVNode("", true)
                                ];
                              }
                            }),
                            _: 1
                          }, _parent4, _scopeId3));
                          _push4(`</div>`);
                        } else {
                          return [
                            createVNode("div", { id: "game-filters" }, [
                              createVNode(_component_b_container, null, {
                                default: withCtx(() => [
                                  createVNode(_component_b_row, null, {
                                    default: withCtx(() => [
                                      createVNode(_component_b_col, {
                                        lg: "3",
                                        class: "mobile-no-pad"
                                      }, {
                                        default: withCtx(() => [
                                          createVNode("h2", null, "Filter")
                                        ]),
                                        _: 1
                                      }),
                                      createVNode(_component_b_col, {
                                        lg: "2",
                                        "align-self": "end",
                                        class: "mobile-no-pad"
                                      }, {
                                        default: withCtx(() => [
                                          createVNode("p", null, toDisplayString(unref(filteredGames).length) + "/" + toDisplayString(__props.games.length), 1)
                                        ]),
                                        _: 1
                                      })
                                    ]),
                                    _: 1
                                  })
                                ]),
                                _: 1
                              }),
                              createVNode(_component_b_container, null, {
                                default: withCtx(() => [
                                  createVNode(_component_b_row, null, {
                                    default: withCtx(() => [
                                      unref(filterStatuses)[1].options.length > 1 ? (openBlock(), createBlock(_component_b_col, {
                                        key: 0,
                                        lg: "4"
                                      }, {
                                        default: withCtx(() => [
                                          createVNode(_component_b_form_select, {
                                            modelValue: unref(filters).status,
                                            "onUpdate:modelValue": ($event) => unref(filters).status = $event,
                                            options: unref(filterStatuses),
                                            class: "mb-4"
                                          }, null, 8, ["modelValue", "onUpdate:modelValue", "options"])
                                        ]),
                                        _: 1
                                      })) : createCommentVNode("", true),
                                      unref(filterDigital)[1].options.length > 1 ? (openBlock(), createBlock(_component_b_col, {
                                        key: 1,
                                        lg: "4"
                                      }, {
                                        default: withCtx(() => [
                                          createVNode(_component_b_form_select, {
                                            modelValue: unref(filters).digital,
                                            "onUpdate:modelValue": ($event) => unref(filters).digital = $event,
                                            options: unref(filterDigital),
                                            class: "mb-4"
                                          }, null, 8, ["modelValue", "onUpdate:modelValue", "options"])
                                        ]),
                                        _: 1
                                      })) : createCommentVNode("", true),
                                      unref(filterWtbWts)[1].options.length ? (openBlock(), createBlock(_component_b_col, {
                                        key: 2,
                                        lg: "4"
                                      }, {
                                        default: withCtx(() => [
                                          createVNode(_component_b_form_select, {
                                            modelValue: unref(filters).wtbWts,
                                            "onUpdate:modelValue": ($event) => unref(filters).wtbWts = $event,
                                            options: unref(filterWtbWts),
                                            class: "mb-4"
                                          }, null, 8, ["modelValue", "onUpdate:modelValue", "options"])
                                        ]),
                                        _: 1
                                      })) : createCommentVNode("", true)
                                    ]),
                                    _: 1
                                  }),
                                  unref(filteredGames).length < __props.games.length ? (openBlock(), createBlock(_component_b_row, { key: 0 }, {
                                    default: withCtx(() => [
                                      createVNode(_component_b_col, null, {
                                        default: withCtx(() => [
                                          createVNode("button", { onClick: removeFilters }, "Remove Filters")
                                        ]),
                                        _: 1
                                      })
                                    ]),
                                    _: 1
                                  })) : createCommentVNode("", true)
                                ]),
                                _: 1
                              })
                            ])
                          ];
                        }
                      }),
                      _: 1
                    }, _parent3, _scopeId2));
                  } else {
                    _push3(`<!---->`);
                  }
                  _push3(ssrRenderComponent(_component_b_col, {
                    md: "6",
                    class: "mobile-no-pad"
                  }, {
                    default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                      if (_push4) {
                        _push4(`<!--[-->`);
                        ssrRenderList(unref(loadedGames), (game, index) => {
                          _push4(`<div class="${ssrRenderClass(game.playedStatus)}"${_scopeId3}>`);
                          _push4(ssrRenderComponent(_component_GamePlayedStatusIndicator, {
                            status: game.playedStatus
                          }, null, _parent4, _scopeId3));
                          _push4(ssrRenderComponent(_component_NuxtLink, {
                            to: `/games/${game.system.slug}/${game.slug}`
                          }, {
                            default: withCtx((_4, _push5, _parent5, _scopeId4) => {
                              if (_push5) {
                                _push5(`${ssrInterpolate(game.title)} `);
                                _push5(ssrRenderComponent(_component_GameRegionIndicator, {
                                  region: game.region
                                }, null, _parent5, _scopeId4));
                                if (game.system.shortName) {
                                  _push5(`<sup${_scopeId4}> [${ssrInterpolate(game.system.shortName)}]</sup>`);
                                } else {
                                  _push5(`<!---->`);
                                }
                                if (game.digital) {
                                  _push5(`<sup${_scopeId4}> [Digital]</sup>`);
                                } else {
                                  _push5(`<!---->`);
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
                          }, _parent4, _scopeId3));
                          _push4(`</div>`);
                        });
                        _push4(`<!--]--><div class="mt-3"${_scopeId3}>`);
                        if (unref(loadedGames).length < unref(filteredGames).length) {
                          _push4(`<button${_scopeId3}> Load More </button>`);
                        } else {
                          _push4(`<!---->`);
                        }
                        _push4(`</div>`);
                      } else {
                        return [
                          (openBlock(true), createBlock(Fragment, null, renderList(unref(loadedGames), (game, index) => {
                            return openBlock(), createBlock("div", {
                              key: `game-${index}`,
                              class: game.playedStatus
                            }, [
                              createVNode(_component_GamePlayedStatusIndicator, {
                                status: game.playedStatus
                              }, null, 8, ["status"]),
                              createVNode(_component_NuxtLink, {
                                to: `/games/${game.system.slug}/${game.slug}`
                              }, {
                                default: withCtx(() => [
                                  createTextVNode(toDisplayString(game.title) + " ", 1),
                                  createVNode(_component_GameRegionIndicator, {
                                    region: game.region
                                  }, null, 8, ["region"]),
                                  game.system.shortName ? (openBlock(), createBlock("sup", { key: 0 }, " [" + toDisplayString(game.system.shortName) + "]", 1)) : createCommentVNode("", true),
                                  game.digital ? (openBlock(), createBlock("sup", { key: 1 }, " [Digital]")) : createCommentVNode("", true)
                                ]),
                                _: 2
                              }, 1032, ["to"])
                            ], 2);
                          }), 128)),
                          createVNode("div", { class: "mt-3" }, [
                            unref(loadedGames).length < unref(filteredGames).length ? (openBlock(), createBlock("button", {
                              key: 0,
                              onClick: ($event) => loadMore()
                            }, " Load More ", 8, ["onClick"])) : createCommentVNode("", true)
                          ])
                        ];
                      }
                    }),
                    _: 1
                  }, _parent3, _scopeId2));
                } else {
                  return [
                    unref(filterStatuses)[1].options.length > 1 || unref(filterWtbWts)[1].options.length ? (openBlock(), createBlock(_component_b_col, {
                      key: 0,
                      md: "6",
                      "order-md": "2",
                      class: "mobile-no-pad"
                    }, {
                      default: withCtx(() => [
                        createVNode("div", { id: "game-filters" }, [
                          createVNode(_component_b_container, null, {
                            default: withCtx(() => [
                              createVNode(_component_b_row, null, {
                                default: withCtx(() => [
                                  createVNode(_component_b_col, {
                                    lg: "3",
                                    class: "mobile-no-pad"
                                  }, {
                                    default: withCtx(() => [
                                      createVNode("h2", null, "Filter")
                                    ]),
                                    _: 1
                                  }),
                                  createVNode(_component_b_col, {
                                    lg: "2",
                                    "align-self": "end",
                                    class: "mobile-no-pad"
                                  }, {
                                    default: withCtx(() => [
                                      createVNode("p", null, toDisplayString(unref(filteredGames).length) + "/" + toDisplayString(__props.games.length), 1)
                                    ]),
                                    _: 1
                                  })
                                ]),
                                _: 1
                              })
                            ]),
                            _: 1
                          }),
                          createVNode(_component_b_container, null, {
                            default: withCtx(() => [
                              createVNode(_component_b_row, null, {
                                default: withCtx(() => [
                                  unref(filterStatuses)[1].options.length > 1 ? (openBlock(), createBlock(_component_b_col, {
                                    key: 0,
                                    lg: "4"
                                  }, {
                                    default: withCtx(() => [
                                      createVNode(_component_b_form_select, {
                                        modelValue: unref(filters).status,
                                        "onUpdate:modelValue": ($event) => unref(filters).status = $event,
                                        options: unref(filterStatuses),
                                        class: "mb-4"
                                      }, null, 8, ["modelValue", "onUpdate:modelValue", "options"])
                                    ]),
                                    _: 1
                                  })) : createCommentVNode("", true),
                                  unref(filterDigital)[1].options.length > 1 ? (openBlock(), createBlock(_component_b_col, {
                                    key: 1,
                                    lg: "4"
                                  }, {
                                    default: withCtx(() => [
                                      createVNode(_component_b_form_select, {
                                        modelValue: unref(filters).digital,
                                        "onUpdate:modelValue": ($event) => unref(filters).digital = $event,
                                        options: unref(filterDigital),
                                        class: "mb-4"
                                      }, null, 8, ["modelValue", "onUpdate:modelValue", "options"])
                                    ]),
                                    _: 1
                                  })) : createCommentVNode("", true),
                                  unref(filterWtbWts)[1].options.length ? (openBlock(), createBlock(_component_b_col, {
                                    key: 2,
                                    lg: "4"
                                  }, {
                                    default: withCtx(() => [
                                      createVNode(_component_b_form_select, {
                                        modelValue: unref(filters).wtbWts,
                                        "onUpdate:modelValue": ($event) => unref(filters).wtbWts = $event,
                                        options: unref(filterWtbWts),
                                        class: "mb-4"
                                      }, null, 8, ["modelValue", "onUpdate:modelValue", "options"])
                                    ]),
                                    _: 1
                                  })) : createCommentVNode("", true)
                                ]),
                                _: 1
                              }),
                              unref(filteredGames).length < __props.games.length ? (openBlock(), createBlock(_component_b_row, { key: 0 }, {
                                default: withCtx(() => [
                                  createVNode(_component_b_col, null, {
                                    default: withCtx(() => [
                                      createVNode("button", { onClick: removeFilters }, "Remove Filters")
                                    ]),
                                    _: 1
                                  })
                                ]),
                                _: 1
                              })) : createCommentVNode("", true)
                            ]),
                            _: 1
                          })
                        ])
                      ]),
                      _: 1
                    })) : createCommentVNode("", true),
                    createVNode(_component_b_col, {
                      md: "6",
                      class: "mobile-no-pad"
                    }, {
                      default: withCtx(() => [
                        (openBlock(true), createBlock(Fragment, null, renderList(unref(loadedGames), (game, index) => {
                          return openBlock(), createBlock("div", {
                            key: `game-${index}`,
                            class: game.playedStatus
                          }, [
                            createVNode(_component_GamePlayedStatusIndicator, {
                              status: game.playedStatus
                            }, null, 8, ["status"]),
                            createVNode(_component_NuxtLink, {
                              to: `/games/${game.system.slug}/${game.slug}`
                            }, {
                              default: withCtx(() => [
                                createTextVNode(toDisplayString(game.title) + " ", 1),
                                createVNode(_component_GameRegionIndicator, {
                                  region: game.region
                                }, null, 8, ["region"]),
                                game.system.shortName ? (openBlock(), createBlock("sup", { key: 0 }, " [" + toDisplayString(game.system.shortName) + "]", 1)) : createCommentVNode("", true),
                                game.digital ? (openBlock(), createBlock("sup", { key: 1 }, " [Digital]")) : createCommentVNode("", true)
                              ]),
                              _: 2
                            }, 1032, ["to"])
                          ], 2);
                        }), 128)),
                        createVNode("div", { class: "mt-3" }, [
                          unref(loadedGames).length < unref(filteredGames).length ? (openBlock(), createBlock("button", {
                            key: 0,
                            onClick: ($event) => loadMore()
                          }, " Load More ", 8, ["onClick"])) : createCommentVNode("", true)
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
                  unref(filterStatuses)[1].options.length > 1 || unref(filterWtbWts)[1].options.length ? (openBlock(), createBlock(_component_b_col, {
                    key: 0,
                    md: "6",
                    "order-md": "2",
                    class: "mobile-no-pad"
                  }, {
                    default: withCtx(() => [
                      createVNode("div", { id: "game-filters" }, [
                        createVNode(_component_b_container, null, {
                          default: withCtx(() => [
                            createVNode(_component_b_row, null, {
                              default: withCtx(() => [
                                createVNode(_component_b_col, {
                                  lg: "3",
                                  class: "mobile-no-pad"
                                }, {
                                  default: withCtx(() => [
                                    createVNode("h2", null, "Filter")
                                  ]),
                                  _: 1
                                }),
                                createVNode(_component_b_col, {
                                  lg: "2",
                                  "align-self": "end",
                                  class: "mobile-no-pad"
                                }, {
                                  default: withCtx(() => [
                                    createVNode("p", null, toDisplayString(unref(filteredGames).length) + "/" + toDisplayString(__props.games.length), 1)
                                  ]),
                                  _: 1
                                })
                              ]),
                              _: 1
                            })
                          ]),
                          _: 1
                        }),
                        createVNode(_component_b_container, null, {
                          default: withCtx(() => [
                            createVNode(_component_b_row, null, {
                              default: withCtx(() => [
                                unref(filterStatuses)[1].options.length > 1 ? (openBlock(), createBlock(_component_b_col, {
                                  key: 0,
                                  lg: "4"
                                }, {
                                  default: withCtx(() => [
                                    createVNode(_component_b_form_select, {
                                      modelValue: unref(filters).status,
                                      "onUpdate:modelValue": ($event) => unref(filters).status = $event,
                                      options: unref(filterStatuses),
                                      class: "mb-4"
                                    }, null, 8, ["modelValue", "onUpdate:modelValue", "options"])
                                  ]),
                                  _: 1
                                })) : createCommentVNode("", true),
                                unref(filterDigital)[1].options.length > 1 ? (openBlock(), createBlock(_component_b_col, {
                                  key: 1,
                                  lg: "4"
                                }, {
                                  default: withCtx(() => [
                                    createVNode(_component_b_form_select, {
                                      modelValue: unref(filters).digital,
                                      "onUpdate:modelValue": ($event) => unref(filters).digital = $event,
                                      options: unref(filterDigital),
                                      class: "mb-4"
                                    }, null, 8, ["modelValue", "onUpdate:modelValue", "options"])
                                  ]),
                                  _: 1
                                })) : createCommentVNode("", true),
                                unref(filterWtbWts)[1].options.length ? (openBlock(), createBlock(_component_b_col, {
                                  key: 2,
                                  lg: "4"
                                }, {
                                  default: withCtx(() => [
                                    createVNode(_component_b_form_select, {
                                      modelValue: unref(filters).wtbWts,
                                      "onUpdate:modelValue": ($event) => unref(filters).wtbWts = $event,
                                      options: unref(filterWtbWts),
                                      class: "mb-4"
                                    }, null, 8, ["modelValue", "onUpdate:modelValue", "options"])
                                  ]),
                                  _: 1
                                })) : createCommentVNode("", true)
                              ]),
                              _: 1
                            }),
                            unref(filteredGames).length < __props.games.length ? (openBlock(), createBlock(_component_b_row, { key: 0 }, {
                              default: withCtx(() => [
                                createVNode(_component_b_col, null, {
                                  default: withCtx(() => [
                                    createVNode("button", { onClick: removeFilters }, "Remove Filters")
                                  ]),
                                  _: 1
                                })
                              ]),
                              _: 1
                            })) : createCommentVNode("", true)
                          ]),
                          _: 1
                        })
                      ])
                    ]),
                    _: 1
                  })) : createCommentVNode("", true),
                  createVNode(_component_b_col, {
                    md: "6",
                    class: "mobile-no-pad"
                  }, {
                    default: withCtx(() => [
                      (openBlock(true), createBlock(Fragment, null, renderList(unref(loadedGames), (game, index) => {
                        return openBlock(), createBlock("div", {
                          key: `game-${index}`,
                          class: game.playedStatus
                        }, [
                          createVNode(_component_GamePlayedStatusIndicator, {
                            status: game.playedStatus
                          }, null, 8, ["status"]),
                          createVNode(_component_NuxtLink, {
                            to: `/games/${game.system.slug}/${game.slug}`
                          }, {
                            default: withCtx(() => [
                              createTextVNode(toDisplayString(game.title) + " ", 1),
                              createVNode(_component_GameRegionIndicator, {
                                region: game.region
                              }, null, 8, ["region"]),
                              game.system.shortName ? (openBlock(), createBlock("sup", { key: 0 }, " [" + toDisplayString(game.system.shortName) + "]", 1)) : createCommentVNode("", true),
                              game.digital ? (openBlock(), createBlock("sup", { key: 1 }, " [Digital]")) : createCommentVNode("", true)
                            ]),
                            _: 2
                          }, 1032, ["to"])
                        ], 2);
                      }), 128)),
                      createVNode("div", { class: "mt-3" }, [
                        unref(loadedGames).length < unref(filteredGames).length ? (openBlock(), createBlock("button", {
                          key: 0,
                          onClick: ($event) => loadMore()
                        }, " Load More ", 8, ["onClick"])) : createCommentVNode("", true)
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/game/ListWithFilters.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as _ };
//# sourceMappingURL=ListWithFilters-D0AnrLmB.mjs.map

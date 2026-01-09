import process from 'node:process';globalThis._importMeta_=globalThis._importMeta_||{url:"file:///_entry.js",env:process.env};import http from 'node:http';
import https from 'node:https';
import { EventEmitter } from 'node:events';
import { Buffer as Buffer$1 } from 'node:buffer';
import { promises, existsSync } from 'node:fs';
import { resolve as resolve$1, dirname as dirname$1, join } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const suspectProtoRx = /"(?:_|\\u0{2}5[Ff]){2}(?:p|\\u0{2}70)(?:r|\\u0{2}72)(?:o|\\u0{2}6[Ff])(?:t|\\u0{2}74)(?:o|\\u0{2}6[Ff])(?:_|\\u0{2}5[Ff]){2}"\s*:/;
const suspectConstructorRx = /"(?:c|\\u0063)(?:o|\\u006[Ff])(?:n|\\u006[Ee])(?:s|\\u0073)(?:t|\\u0074)(?:r|\\u0072)(?:u|\\u0075)(?:c|\\u0063)(?:t|\\u0074)(?:o|\\u006[Ff])(?:r|\\u0072)"\s*:/;
const JsonSigRx = /^\s*["[{]|^\s*-?\d{1,16}(\.\d{1,17})?([Ee][+-]?\d+)?\s*$/;
function jsonParseTransform(key, value) {
  if (key === "__proto__" || key === "constructor" && value && typeof value === "object" && "prototype" in value) {
    warnKeyDropped(key);
    return;
  }
  return value;
}
function warnKeyDropped(key) {
  console.warn(`[destr] Dropping "${key}" key to prevent prototype pollution.`);
}
function destr(value, options = {}) {
  if (typeof value !== "string") {
    return value;
  }
  if (value[0] === '"' && value[value.length - 1] === '"' && value.indexOf("\\") === -1) {
    return value.slice(1, -1);
  }
  const _value = value.trim();
  if (_value.length <= 9) {
    switch (_value.toLowerCase()) {
      case "true": {
        return true;
      }
      case "false": {
        return false;
      }
      case "undefined": {
        return void 0;
      }
      case "null": {
        return null;
      }
      case "nan": {
        return Number.NaN;
      }
      case "infinity": {
        return Number.POSITIVE_INFINITY;
      }
      case "-infinity": {
        return Number.NEGATIVE_INFINITY;
      }
    }
  }
  if (!JsonSigRx.test(value)) {
    if (options.strict) {
      throw new SyntaxError("[destr] Invalid JSON");
    }
    return value;
  }
  try {
    if (suspectProtoRx.test(value) || suspectConstructorRx.test(value)) {
      if (options.strict) {
        throw new Error("[destr] Possible prototype pollution");
      }
      return JSON.parse(value, jsonParseTransform);
    }
    return JSON.parse(value);
  } catch (error) {
    if (options.strict) {
      throw error;
    }
    return value;
  }
}

const HASH_RE = /#/g;
const AMPERSAND_RE = /&/g;
const SLASH_RE = /\//g;
const EQUAL_RE = /=/g;
const PLUS_RE = /\+/g;
const ENC_CARET_RE = /%5e/gi;
const ENC_BACKTICK_RE = /%60/gi;
const ENC_PIPE_RE = /%7c/gi;
const ENC_SPACE_RE = /%20/gi;
const ENC_SLASH_RE = /%2f/gi;
function encode(text) {
  return encodeURI("" + text).replace(ENC_PIPE_RE, "|");
}
function encodeQueryValue(input) {
  return encode(typeof input === "string" ? input : JSON.stringify(input)).replace(PLUS_RE, "%2B").replace(ENC_SPACE_RE, "+").replace(HASH_RE, "%23").replace(AMPERSAND_RE, "%26").replace(ENC_BACKTICK_RE, "`").replace(ENC_CARET_RE, "^").replace(SLASH_RE, "%2F");
}
function encodeQueryKey(text) {
  return encodeQueryValue(text).replace(EQUAL_RE, "%3D");
}
function decode(text = "") {
  try {
    return decodeURIComponent("" + text);
  } catch {
    return "" + text;
  }
}
function decodePath(text) {
  return decode(text.replace(ENC_SLASH_RE, "%252F"));
}
function decodeQueryKey(text) {
  return decode(text.replace(PLUS_RE, " "));
}
function decodeQueryValue(text) {
  return decode(text.replace(PLUS_RE, " "));
}

function parseQuery(parametersString = "") {
  const object = /* @__PURE__ */ Object.create(null);
  if (parametersString[0] === "?") {
    parametersString = parametersString.slice(1);
  }
  for (const parameter of parametersString.split("&")) {
    const s = parameter.match(/([^=]+)=?(.*)/) || [];
    if (s.length < 2) {
      continue;
    }
    const key = decodeQueryKey(s[1]);
    if (key === "__proto__" || key === "constructor") {
      continue;
    }
    const value = decodeQueryValue(s[2] || "");
    if (object[key] === void 0) {
      object[key] = value;
    } else if (Array.isArray(object[key])) {
      object[key].push(value);
    } else {
      object[key] = [object[key], value];
    }
  }
  return object;
}
function encodeQueryItem(key, value) {
  if (typeof value === "number" || typeof value === "boolean") {
    value = String(value);
  }
  if (!value) {
    return encodeQueryKey(key);
  }
  if (Array.isArray(value)) {
    return value.map(
      (_value) => `${encodeQueryKey(key)}=${encodeQueryValue(_value)}`
    ).join("&");
  }
  return `${encodeQueryKey(key)}=${encodeQueryValue(value)}`;
}
function stringifyQuery(query) {
  return Object.keys(query).filter((k) => query[k] !== void 0).map((k) => encodeQueryItem(k, query[k])).filter(Boolean).join("&");
}

const PROTOCOL_STRICT_REGEX = /^[\s\w\0+.-]{2,}:([/\\]{1,2})/;
const PROTOCOL_REGEX = /^[\s\w\0+.-]{2,}:([/\\]{2})?/;
const PROTOCOL_RELATIVE_REGEX = /^([/\\]\s*){2,}[^/\\]/;
const PROTOCOL_SCRIPT_RE = /^[\s\0]*(blob|data|javascript|vbscript):$/i;
const TRAILING_SLASH_RE = /\/$|\/\?|\/#/;
const JOIN_LEADING_SLASH_RE = /^\.?\//;
function hasProtocol(inputString, opts = {}) {
  if (typeof opts === "boolean") {
    opts = { acceptRelative: opts };
  }
  if (opts.strict) {
    return PROTOCOL_STRICT_REGEX.test(inputString);
  }
  return PROTOCOL_REGEX.test(inputString) || (opts.acceptRelative ? PROTOCOL_RELATIVE_REGEX.test(inputString) : false);
}
function isScriptProtocol(protocol) {
  return !!protocol && PROTOCOL_SCRIPT_RE.test(protocol);
}
function hasTrailingSlash(input = "", respectQueryAndFragment) {
  if (!respectQueryAndFragment) {
    return input.endsWith("/");
  }
  return TRAILING_SLASH_RE.test(input);
}
function withoutTrailingSlash(input = "", respectQueryAndFragment) {
  if (!respectQueryAndFragment) {
    return (hasTrailingSlash(input) ? input.slice(0, -1) : input) || "/";
  }
  if (!hasTrailingSlash(input, true)) {
    return input || "/";
  }
  let path = input;
  let fragment = "";
  const fragmentIndex = input.indexOf("#");
  if (fragmentIndex !== -1) {
    path = input.slice(0, fragmentIndex);
    fragment = input.slice(fragmentIndex);
  }
  const [s0, ...s] = path.split("?");
  const cleanPath = s0.endsWith("/") ? s0.slice(0, -1) : s0;
  return (cleanPath || "/") + (s.length > 0 ? `?${s.join("?")}` : "") + fragment;
}
function withTrailingSlash(input = "", respectQueryAndFragment) {
  if (!respectQueryAndFragment) {
    return input.endsWith("/") ? input : input + "/";
  }
  if (hasTrailingSlash(input, true)) {
    return input || "/";
  }
  let path = input;
  let fragment = "";
  const fragmentIndex = input.indexOf("#");
  if (fragmentIndex !== -1) {
    path = input.slice(0, fragmentIndex);
    fragment = input.slice(fragmentIndex);
    if (!path) {
      return fragment;
    }
  }
  const [s0, ...s] = path.split("?");
  return s0 + "/" + (s.length > 0 ? `?${s.join("?")}` : "") + fragment;
}
function hasLeadingSlash(input = "") {
  return input.startsWith("/");
}
function withLeadingSlash(input = "") {
  return hasLeadingSlash(input) ? input : "/" + input;
}
function withBase(input, base) {
  if (isEmptyURL(base) || hasProtocol(input)) {
    return input;
  }
  const _base = withoutTrailingSlash(base);
  if (input.startsWith(_base)) {
    return input;
  }
  return joinURL(_base, input);
}
function withoutBase(input, base) {
  if (isEmptyURL(base)) {
    return input;
  }
  const _base = withoutTrailingSlash(base);
  if (!input.startsWith(_base)) {
    return input;
  }
  const trimmed = input.slice(_base.length);
  return trimmed[0] === "/" ? trimmed : "/" + trimmed;
}
function withQuery(input, query) {
  const parsed = parseURL(input);
  const mergedQuery = { ...parseQuery(parsed.search), ...query };
  parsed.search = stringifyQuery(mergedQuery);
  return stringifyParsedURL(parsed);
}
function getQuery$1(input) {
  return parseQuery(parseURL(input).search);
}
function isEmptyURL(url) {
  return !url || url === "/";
}
function isNonEmptyURL(url) {
  return url && url !== "/";
}
function joinURL(base, ...input) {
  let url = base || "";
  for (const segment of input.filter((url2) => isNonEmptyURL(url2))) {
    if (url) {
      const _segment = segment.replace(JOIN_LEADING_SLASH_RE, "");
      url = withTrailingSlash(url) + _segment;
    } else {
      url = segment;
    }
  }
  return url;
}
function joinRelativeURL(..._input) {
  const JOIN_SEGMENT_SPLIT_RE = /\/(?!\/)/;
  const input = _input.filter(Boolean);
  const segments = [];
  let segmentsDepth = 0;
  for (const i of input) {
    if (!i || i === "/") {
      continue;
    }
    for (const [sindex, s] of i.split(JOIN_SEGMENT_SPLIT_RE).entries()) {
      if (!s || s === ".") {
        continue;
      }
      if (s === "..") {
        if (segments.length === 1 && hasProtocol(segments[0])) {
          continue;
        }
        segments.pop();
        segmentsDepth--;
        continue;
      }
      if (sindex === 1 && segments[segments.length - 1]?.endsWith(":/")) {
        segments[segments.length - 1] += "/" + s;
        continue;
      }
      segments.push(s);
      segmentsDepth++;
    }
  }
  let url = segments.join("/");
  if (segmentsDepth >= 0) {
    if (input[0]?.startsWith("/") && !url.startsWith("/")) {
      url = "/" + url;
    } else if (input[0]?.startsWith("./") && !url.startsWith("./")) {
      url = "./" + url;
    }
  } else {
    url = "../".repeat(-1 * segmentsDepth) + url;
  }
  if (input[input.length - 1]?.endsWith("/") && !url.endsWith("/")) {
    url += "/";
  }
  return url;
}

const protocolRelative = Symbol.for("ufo:protocolRelative");
function parseURL(input = "", defaultProto) {
  const _specialProtoMatch = input.match(
    /^[\s\0]*(blob:|data:|javascript:|vbscript:)(.*)/i
  );
  if (_specialProtoMatch) {
    const [, _proto, _pathname = ""] = _specialProtoMatch;
    return {
      protocol: _proto.toLowerCase(),
      pathname: _pathname,
      href: _proto + _pathname,
      auth: "",
      host: "",
      search: "",
      hash: ""
    };
  }
  if (!hasProtocol(input, { acceptRelative: true })) {
    return parsePath(input);
  }
  const [, protocol = "", auth, hostAndPath = ""] = input.replace(/\\/g, "/").match(/^[\s\0]*([\w+.-]{2,}:)?\/\/([^/@]+@)?(.*)/) || [];
  let [, host = "", path = ""] = hostAndPath.match(/([^#/?]*)(.*)?/) || [];
  if (protocol === "file:") {
    path = path.replace(/\/(?=[A-Za-z]:)/, "");
  }
  const { pathname, search, hash } = parsePath(path);
  return {
    protocol: protocol.toLowerCase(),
    auth: auth ? auth.slice(0, Math.max(0, auth.length - 1)) : "",
    host,
    pathname,
    search,
    hash,
    [protocolRelative]: !protocol
  };
}
function parsePath(input = "") {
  const [pathname = "", search = "", hash = ""] = (input.match(/([^#?]*)(\?[^#]*)?(#.*)?/) || []).splice(1);
  return {
    pathname,
    search,
    hash
  };
}
function stringifyParsedURL(parsed) {
  const pathname = parsed.pathname || "";
  const search = parsed.search ? (parsed.search.startsWith("?") ? "" : "?") + parsed.search : "";
  const hash = parsed.hash || "";
  const auth = parsed.auth ? parsed.auth + "@" : "";
  const host = parsed.host || "";
  const proto = parsed.protocol || parsed[protocolRelative] ? (parsed.protocol || "") + "//" : "";
  return proto + auth + host + pathname + search + hash;
}

const NODE_TYPES = {
  NORMAL: 0,
  WILDCARD: 1,
  PLACEHOLDER: 2
};

function createRouter$1(options = {}) {
  const ctx = {
    options,
    rootNode: createRadixNode(),
    staticRoutesMap: {}
  };
  const normalizeTrailingSlash = (p) => options.strictTrailingSlash ? p : p.replace(/\/$/, "") || "/";
  if (options.routes) {
    for (const path in options.routes) {
      insert(ctx, normalizeTrailingSlash(path), options.routes[path]);
    }
  }
  return {
    ctx,
    lookup: (path) => lookup(ctx, normalizeTrailingSlash(path)),
    insert: (path, data) => insert(ctx, normalizeTrailingSlash(path), data),
    remove: (path) => remove(ctx, normalizeTrailingSlash(path))
  };
}
function lookup(ctx, path) {
  const staticPathNode = ctx.staticRoutesMap[path];
  if (staticPathNode) {
    return staticPathNode.data;
  }
  const sections = path.split("/");
  const params = {};
  let paramsFound = false;
  let wildcardNode = null;
  let node = ctx.rootNode;
  let wildCardParam = null;
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    if (node.wildcardChildNode !== null) {
      wildcardNode = node.wildcardChildNode;
      wildCardParam = sections.slice(i).join("/");
    }
    const nextNode = node.children.get(section);
    if (nextNode === void 0) {
      if (node && node.placeholderChildren.length > 1) {
        const remaining = sections.length - i;
        node = node.placeholderChildren.find((c) => c.maxDepth === remaining) || null;
      } else {
        node = node.placeholderChildren[0] || null;
      }
      if (!node) {
        break;
      }
      if (node.paramName) {
        params[node.paramName] = section;
      }
      paramsFound = true;
    } else {
      node = nextNode;
    }
  }
  if ((node === null || node.data === null) && wildcardNode !== null) {
    node = wildcardNode;
    params[node.paramName || "_"] = wildCardParam;
    paramsFound = true;
  }
  if (!node) {
    return null;
  }
  if (paramsFound) {
    return {
      ...node.data,
      params: paramsFound ? params : void 0
    };
  }
  return node.data;
}
function insert(ctx, path, data) {
  let isStaticRoute = true;
  const sections = path.split("/");
  let node = ctx.rootNode;
  let _unnamedPlaceholderCtr = 0;
  const matchedNodes = [node];
  for (const section of sections) {
    let childNode;
    if (childNode = node.children.get(section)) {
      node = childNode;
    } else {
      const type = getNodeType(section);
      childNode = createRadixNode({ type, parent: node });
      node.children.set(section, childNode);
      if (type === NODE_TYPES.PLACEHOLDER) {
        childNode.paramName = section === "*" ? `_${_unnamedPlaceholderCtr++}` : section.slice(1);
        node.placeholderChildren.push(childNode);
        isStaticRoute = false;
      } else if (type === NODE_TYPES.WILDCARD) {
        node.wildcardChildNode = childNode;
        childNode.paramName = section.slice(
          3
          /* "**:" */
        ) || "_";
        isStaticRoute = false;
      }
      matchedNodes.push(childNode);
      node = childNode;
    }
  }
  for (const [depth, node2] of matchedNodes.entries()) {
    node2.maxDepth = Math.max(matchedNodes.length - depth, node2.maxDepth || 0);
  }
  node.data = data;
  if (isStaticRoute === true) {
    ctx.staticRoutesMap[path] = node;
  }
  return node;
}
function remove(ctx, path) {
  let success = false;
  const sections = path.split("/");
  let node = ctx.rootNode;
  for (const section of sections) {
    node = node.children.get(section);
    if (!node) {
      return success;
    }
  }
  if (node.data) {
    const lastSection = sections.at(-1) || "";
    node.data = null;
    if (Object.keys(node.children).length === 0 && node.parent) {
      node.parent.children.delete(lastSection);
      node.parent.wildcardChildNode = null;
      node.parent.placeholderChildren = [];
    }
    success = true;
  }
  return success;
}
function createRadixNode(options = {}) {
  return {
    type: options.type || NODE_TYPES.NORMAL,
    maxDepth: 0,
    parent: options.parent || null,
    children: /* @__PURE__ */ new Map(),
    data: options.data || null,
    paramName: options.paramName || null,
    wildcardChildNode: null,
    placeholderChildren: []
  };
}
function getNodeType(str) {
  if (str.startsWith("**")) {
    return NODE_TYPES.WILDCARD;
  }
  if (str[0] === ":" || str === "*") {
    return NODE_TYPES.PLACEHOLDER;
  }
  return NODE_TYPES.NORMAL;
}

function toRouteMatcher(router) {
  const table = _routerNodeToTable("", router.ctx.rootNode);
  return _createMatcher(table, router.ctx.options.strictTrailingSlash);
}
function _createMatcher(table, strictTrailingSlash) {
  return {
    ctx: { table },
    matchAll: (path) => _matchRoutes(path, table, strictTrailingSlash)
  };
}
function _createRouteTable() {
  return {
    static: /* @__PURE__ */ new Map(),
    wildcard: /* @__PURE__ */ new Map(),
    dynamic: /* @__PURE__ */ new Map()
  };
}
function _matchRoutes(path, table, strictTrailingSlash) {
  if (strictTrailingSlash !== true && path.endsWith("/")) {
    path = path.slice(0, -1) || "/";
  }
  const matches = [];
  for (const [key, value] of _sortRoutesMap(table.wildcard)) {
    if (path === key || path.startsWith(key + "/")) {
      matches.push(value);
    }
  }
  for (const [key, value] of _sortRoutesMap(table.dynamic)) {
    if (path.startsWith(key + "/")) {
      const subPath = "/" + path.slice(key.length).split("/").splice(2).join("/");
      matches.push(..._matchRoutes(subPath, value));
    }
  }
  const staticMatch = table.static.get(path);
  if (staticMatch) {
    matches.push(staticMatch);
  }
  return matches.filter(Boolean);
}
function _sortRoutesMap(m) {
  return [...m.entries()].sort((a, b) => a[0].length - b[0].length);
}
function _routerNodeToTable(initialPath, initialNode) {
  const table = _createRouteTable();
  function _addNode(path, node) {
    if (path) {
      if (node.type === NODE_TYPES.NORMAL && !(path.includes("*") || path.includes(":"))) {
        if (node.data) {
          table.static.set(path, node.data);
        }
      } else if (node.type === NODE_TYPES.WILDCARD) {
        table.wildcard.set(path.replace("/**", ""), node.data);
      } else if (node.type === NODE_TYPES.PLACEHOLDER) {
        const subTable = _routerNodeToTable("", node);
        if (node.data) {
          subTable.static.set("/", node.data);
        }
        table.dynamic.set(path.replace(/\/\*|\/:\w+/, ""), subTable);
        return;
      }
    }
    for (const [childPath, child] of node.children.entries()) {
      _addNode(`${path}/${childPath}`.replace("//", "/"), child);
    }
  }
  _addNode(initialPath, initialNode);
  return table;
}

function isPlainObject(value) {
  if (value === null || typeof value !== "object") {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== null && prototype !== Object.prototype && Object.getPrototypeOf(prototype) !== null) {
    return false;
  }
  if (Symbol.iterator in value) {
    return false;
  }
  if (Symbol.toStringTag in value) {
    return Object.prototype.toString.call(value) === "[object Module]";
  }
  return true;
}

function _defu(baseObject, defaults, namespace = ".", merger) {
  if (!isPlainObject(defaults)) {
    return _defu(baseObject, {}, namespace, merger);
  }
  const object = Object.assign({}, defaults);
  for (const key in baseObject) {
    if (key === "__proto__" || key === "constructor") {
      continue;
    }
    const value = baseObject[key];
    if (value === null || value === void 0) {
      continue;
    }
    if (merger && merger(object, key, value, namespace)) {
      continue;
    }
    if (Array.isArray(value) && Array.isArray(object[key])) {
      object[key] = [...value, ...object[key]];
    } else if (isPlainObject(value) && isPlainObject(object[key])) {
      object[key] = _defu(
        value,
        object[key],
        (namespace ? `${namespace}.` : "") + key.toString(),
        merger
      );
    } else {
      object[key] = value;
    }
  }
  return object;
}
function createDefu(merger) {
  return (...arguments_) => (
    // eslint-disable-next-line unicorn/no-array-reduce
    arguments_.reduce((p, c) => _defu(p, c, "", merger), {})
  );
}
const defu = createDefu();
const defuFn = createDefu((object, key, currentValue) => {
  if (object[key] !== void 0 && typeof currentValue === "function") {
    object[key] = currentValue(object[key]);
    return true;
  }
});

function o(n){throw new Error(`${n} is not implemented yet!`)}let i$1 = class i extends EventEmitter{__unenv__={};readableEncoding=null;readableEnded=true;readableFlowing=false;readableHighWaterMark=0;readableLength=0;readableObjectMode=false;readableAborted=false;readableDidRead=false;closed=false;errored=null;readable=false;destroyed=false;static from(e,t){return new i(t)}constructor(e){super();}_read(e){}read(e){}setEncoding(e){return this}pause(){return this}resume(){return this}isPaused(){return  true}unpipe(e){return this}unshift(e,t){}wrap(e){return this}push(e,t){return  false}_destroy(e,t){this.removeAllListeners();}destroy(e){return this.destroyed=true,this._destroy(e),this}pipe(e,t){return {}}compose(e,t){throw new Error("Method not implemented.")}[Symbol.asyncDispose](){return this.destroy(),Promise.resolve()}async*[Symbol.asyncIterator](){throw o("Readable.asyncIterator")}iterator(e){throw o("Readable.iterator")}map(e,t){throw o("Readable.map")}filter(e,t){throw o("Readable.filter")}forEach(e,t){throw o("Readable.forEach")}reduce(e,t,r){throw o("Readable.reduce")}find(e,t){throw o("Readable.find")}findIndex(e,t){throw o("Readable.findIndex")}some(e,t){throw o("Readable.some")}toArray(e){throw o("Readable.toArray")}every(e,t){throw o("Readable.every")}flatMap(e,t){throw o("Readable.flatMap")}drop(e,t){throw o("Readable.drop")}take(e,t){throw o("Readable.take")}asIndexedPairs(e){throw o("Readable.asIndexedPairs")}};let l$1 = class l extends EventEmitter{__unenv__={};writable=true;writableEnded=false;writableFinished=false;writableHighWaterMark=0;writableLength=0;writableObjectMode=false;writableCorked=0;closed=false;errored=null;writableNeedDrain=false;writableAborted=false;destroyed=false;_data;_encoding="utf8";constructor(e){super();}pipe(e,t){return {}}_write(e,t,r){if(this.writableEnded){r&&r();return}if(this._data===void 0)this._data=e;else {const s=typeof this._data=="string"?Buffer$1.from(this._data,this._encoding||t||"utf8"):this._data,a=typeof e=="string"?Buffer$1.from(e,t||this._encoding||"utf8"):e;this._data=Buffer$1.concat([s,a]);}this._encoding=t,r&&r();}_writev(e,t){}_destroy(e,t){}_final(e){}write(e,t,r){const s=typeof t=="string"?this._encoding:"utf8",a=typeof t=="function"?t:typeof r=="function"?r:void 0;return this._write(e,s,a),true}setDefaultEncoding(e){return this}end(e,t,r){const s=typeof e=="function"?e:typeof t=="function"?t:typeof r=="function"?r:void 0;if(this.writableEnded)return s&&s(),this;const a=e===s?void 0:e;if(a){const u=t===s?void 0:t;this.write(a,u,s);}return this.writableEnded=true,this.writableFinished=true,this.emit("close"),this.emit("finish"),this}cork(){}uncork(){}destroy(e){return this.destroyed=true,delete this._data,this.removeAllListeners(),this}compose(e,t){throw new Error("Method not implemented.")}[Symbol.asyncDispose](){return Promise.resolve()}};const c=class{allowHalfOpen=true;_destroy;constructor(e=new i$1,t=new l$1){Object.assign(this,e),Object.assign(this,t),this._destroy=m(e._destroy,t._destroy);}};function _(){return Object.assign(c.prototype,i$1.prototype),Object.assign(c.prototype,l$1.prototype),c}function m(...n){return function(...e){for(const t of n)t(...e);}}const g=_();class A extends g{__unenv__={};bufferSize=0;bytesRead=0;bytesWritten=0;connecting=false;destroyed=false;pending=false;localAddress="";localPort=0;remoteAddress="";remoteFamily="";remotePort=0;autoSelectFamilyAttemptedAddresses=[];readyState="readOnly";constructor(e){super();}write(e,t,r){return  false}connect(e,t,r){return this}end(e,t,r){return this}setEncoding(e){return this}pause(){return this}resume(){return this}setTimeout(e,t){return this}setNoDelay(e){return this}setKeepAlive(e,t){return this}address(){return {}}unref(){return this}ref(){return this}destroySoon(){this.destroy();}resetAndDestroy(){const e=new Error("ERR_SOCKET_CLOSED");return e.code="ERR_SOCKET_CLOSED",this.destroy(e),this}}class y extends i$1{aborted=false;httpVersion="1.1";httpVersionMajor=1;httpVersionMinor=1;complete=true;connection;socket;headers={};trailers={};method="GET";url="/";statusCode=200;statusMessage="";closed=false;errored=null;readable=false;constructor(e){super(),this.socket=this.connection=e||new A;}get rawHeaders(){const e=this.headers,t=[];for(const r in e)if(Array.isArray(e[r]))for(const s of e[r])t.push(r,s);else t.push(r,e[r]);return t}get rawTrailers(){return []}setTimeout(e,t){return this}get headersDistinct(){return p(this.headers)}get trailersDistinct(){return p(this.trailers)}}function p(n){const e={};for(const[t,r]of Object.entries(n))t&&(e[t]=(Array.isArray(r)?r:[r]).filter(Boolean));return e}class w extends l$1{statusCode=200;statusMessage="";upgrading=false;chunkedEncoding=false;shouldKeepAlive=false;useChunkedEncodingByDefault=false;sendDate=false;finished=false;headersSent=false;strictContentLength=false;connection=null;socket=null;req;_headers={};constructor(e){super(),this.req=e;}assignSocket(e){e._httpMessage=this,this.socket=e,this.connection=e,this.emit("socket",e),this._flush();}_flush(){this.flushHeaders();}detachSocket(e){}writeContinue(e){}writeHead(e,t,r){e&&(this.statusCode=e),typeof t=="string"&&(this.statusMessage=t,t=void 0);const s=r||t;if(s&&!Array.isArray(s))for(const a in s)this.setHeader(a,s[a]);return this.headersSent=true,this}writeProcessing(){}setTimeout(e,t){return this}appendHeader(e,t){e=e.toLowerCase();const r=this._headers[e],s=[...Array.isArray(r)?r:[r],...Array.isArray(t)?t:[t]].filter(Boolean);return this._headers[e]=s.length>1?s:s[0],this}setHeader(e,t){return this._headers[e.toLowerCase()]=t,this}setHeaders(e){for(const[t,r]of Object.entries(e))this.setHeader(t,r);return this}getHeader(e){return this._headers[e.toLowerCase()]}getHeaders(){return this._headers}getHeaderNames(){return Object.keys(this._headers)}hasHeader(e){return e.toLowerCase()in this._headers}removeHeader(e){delete this._headers[e.toLowerCase()];}addTrailers(e){}flushHeaders(){}writeEarlyHints(e,t){typeof t=="function"&&t();}}const E=(()=>{const n=function(){};return n.prototype=Object.create(null),n})();function R(n={}){const e=new E,t=Array.isArray(n)||H(n)?n:Object.entries(n);for(const[r,s]of t)if(s){if(e[r]===void 0){e[r]=s;continue}e[r]=[...Array.isArray(e[r])?e[r]:[e[r]],...Array.isArray(s)?s:[s]];}return e}function H(n){return typeof n?.entries=="function"}function v(n={}){if(n instanceof Headers)return n;const e=new Headers;for(const[t,r]of Object.entries(n))if(r!==void 0){if(Array.isArray(r)){for(const s of r)e.append(t,String(s));continue}e.set(t,String(r));}return e}const S=new Set([101,204,205,304]);async function b(n,e){const t=new y,r=new w(t);t.url=e.url?.toString()||"/";let s;if(!t.url.startsWith("/")){const d=new URL(t.url);s=d.host,t.url=d.pathname+d.search+d.hash;}t.method=e.method||"GET",t.headers=R(e.headers||{}),t.headers.host||(t.headers.host=e.host||s||"localhost"),t.connection.encrypted=t.connection.encrypted||e.protocol==="https",t.body=e.body||null,t.__unenv__=e.context,await n(t,r);let a=r._data;(S.has(r.statusCode)||t.method.toUpperCase()==="HEAD")&&(a=null,delete r._headers["content-length"]);const u={status:r.statusCode,statusText:r.statusMessage,headers:r._headers,body:a};return t.destroy(),r.destroy(),u}async function C(n,e,t={}){try{const r=await b(n,{url:e,...t});return new Response(r.body,{status:r.status,statusText:r.statusText,headers:v(r.headers)})}catch(r){return new Response(r.toString(),{status:Number.parseInt(r.statusCode||r.code)||500,statusText:r.statusText})}}

function hasProp(obj, prop) {
  try {
    return prop in obj;
  } catch {
    return false;
  }
}

class H3Error extends Error {
  static __h3_error__ = true;
  statusCode = 500;
  fatal = false;
  unhandled = false;
  statusMessage;
  data;
  cause;
  constructor(message, opts = {}) {
    super(message, opts);
    if (opts.cause && !this.cause) {
      this.cause = opts.cause;
    }
  }
  toJSON() {
    const obj = {
      message: this.message,
      statusCode: sanitizeStatusCode(this.statusCode, 500)
    };
    if (this.statusMessage) {
      obj.statusMessage = sanitizeStatusMessage(this.statusMessage);
    }
    if (this.data !== void 0) {
      obj.data = this.data;
    }
    return obj;
  }
}
function createError$1(input) {
  if (typeof input === "string") {
    return new H3Error(input);
  }
  if (isError(input)) {
    return input;
  }
  const err = new H3Error(input.message ?? input.statusMessage ?? "", {
    cause: input.cause || input
  });
  if (hasProp(input, "stack")) {
    try {
      Object.defineProperty(err, "stack", {
        get() {
          return input.stack;
        }
      });
    } catch {
      try {
        err.stack = input.stack;
      } catch {
      }
    }
  }
  if (input.data) {
    err.data = input.data;
  }
  if (input.statusCode) {
    err.statusCode = sanitizeStatusCode(input.statusCode, err.statusCode);
  } else if (input.status) {
    err.statusCode = sanitizeStatusCode(input.status, err.statusCode);
  }
  if (input.statusMessage) {
    err.statusMessage = input.statusMessage;
  } else if (input.statusText) {
    err.statusMessage = input.statusText;
  }
  if (err.statusMessage) {
    const originalMessage = err.statusMessage;
    const sanitizedMessage = sanitizeStatusMessage(err.statusMessage);
    if (sanitizedMessage !== originalMessage) {
      console.warn(
        "[h3] Please prefer using `message` for longer error messages instead of `statusMessage`. In the future, `statusMessage` will be sanitized by default."
      );
    }
  }
  if (input.fatal !== void 0) {
    err.fatal = input.fatal;
  }
  if (input.unhandled !== void 0) {
    err.unhandled = input.unhandled;
  }
  return err;
}
function sendError(event, error, debug) {
  if (event.handled) {
    return;
  }
  const h3Error = isError(error) ? error : createError$1(error);
  const responseBody = {
    statusCode: h3Error.statusCode,
    statusMessage: h3Error.statusMessage,
    stack: [],
    data: h3Error.data
  };
  if (debug) {
    responseBody.stack = (h3Error.stack || "").split("\n").map((l) => l.trim());
  }
  if (event.handled) {
    return;
  }
  const _code = Number.parseInt(h3Error.statusCode);
  setResponseStatus(event, _code, h3Error.statusMessage);
  event.node.res.setHeader("content-type", MIMES.json);
  event.node.res.end(JSON.stringify(responseBody, void 0, 2));
}
function isError(input) {
  return input?.constructor?.__h3_error__ === true;
}

function getQuery(event) {
  return getQuery$1(event.path || "");
}
function isMethod(event, expected, allowHead) {
  if (typeof expected === "string") {
    if (event.method === expected) {
      return true;
    }
  } else if (expected.includes(event.method)) {
    return true;
  }
  return false;
}
function assertMethod(event, expected, allowHead) {
  if (!isMethod(event, expected)) {
    throw createError$1({
      statusCode: 405,
      statusMessage: "HTTP method is not allowed."
    });
  }
}
function getRequestHeaders(event) {
  const _headers = {};
  for (const key in event.node.req.headers) {
    const val = event.node.req.headers[key];
    _headers[key] = Array.isArray(val) ? val.filter(Boolean).join(", ") : val;
  }
  return _headers;
}
function getRequestHeader(event, name) {
  const headers = getRequestHeaders(event);
  const value = headers[name.toLowerCase()];
  return value;
}
function getRequestHost(event, opts = {}) {
  if (opts.xForwardedHost) {
    const _header = event.node.req.headers["x-forwarded-host"];
    const xForwardedHost = (_header || "").split(",").shift()?.trim();
    if (xForwardedHost) {
      return xForwardedHost;
    }
  }
  return event.node.req.headers.host || "localhost";
}
function getRequestProtocol(event, opts = {}) {
  if (opts.xForwardedProto !== false && event.node.req.headers["x-forwarded-proto"] === "https") {
    return "https";
  }
  return event.node.req.connection?.encrypted ? "https" : "http";
}
function getRequestURL(event, opts = {}) {
  const host = getRequestHost(event, opts);
  const protocol = getRequestProtocol(event, opts);
  const path = (event.node.req.originalUrl || event.path).replace(
    /^[/\\]+/g,
    "/"
  );
  return new URL(path, `${protocol}://${host}`);
}

const RawBodySymbol = Symbol.for("h3RawBody");
const PayloadMethods$1 = ["PATCH", "POST", "PUT", "DELETE"];
function readRawBody(event, encoding = "utf8") {
  assertMethod(event, PayloadMethods$1);
  const _rawBody = event._requestBody || event.web?.request?.body || event.node.req[RawBodySymbol] || event.node.req.rawBody || event.node.req.body;
  if (_rawBody) {
    const promise2 = Promise.resolve(_rawBody).then((_resolved) => {
      if (Buffer.isBuffer(_resolved)) {
        return _resolved;
      }
      if (typeof _resolved.pipeTo === "function") {
        return new Promise((resolve, reject) => {
          const chunks = [];
          _resolved.pipeTo(
            new WritableStream({
              write(chunk) {
                chunks.push(chunk);
              },
              close() {
                resolve(Buffer.concat(chunks));
              },
              abort(reason) {
                reject(reason);
              }
            })
          ).catch(reject);
        });
      } else if (typeof _resolved.pipe === "function") {
        return new Promise((resolve, reject) => {
          const chunks = [];
          _resolved.on("data", (chunk) => {
            chunks.push(chunk);
          }).on("end", () => {
            resolve(Buffer.concat(chunks));
          }).on("error", reject);
        });
      }
      if (_resolved.constructor === Object) {
        return Buffer.from(JSON.stringify(_resolved));
      }
      if (_resolved instanceof URLSearchParams) {
        return Buffer.from(_resolved.toString());
      }
      if (_resolved instanceof FormData) {
        return new Response(_resolved).bytes().then((uint8arr) => Buffer.from(uint8arr));
      }
      return Buffer.from(_resolved);
    });
    return encoding ? promise2.then((buff) => buff.toString(encoding)) : promise2;
  }
  if (!Number.parseInt(event.node.req.headers["content-length"] || "") && !String(event.node.req.headers["transfer-encoding"] ?? "").split(",").map((e) => e.trim()).filter(Boolean).includes("chunked")) {
    return Promise.resolve(void 0);
  }
  const promise = event.node.req[RawBodySymbol] = new Promise(
    (resolve, reject) => {
      const bodyData = [];
      event.node.req.on("error", (err) => {
        reject(err);
      }).on("data", (chunk) => {
        bodyData.push(chunk);
      }).on("end", () => {
        resolve(Buffer.concat(bodyData));
      });
    }
  );
  const result = encoding ? promise.then((buff) => buff.toString(encoding)) : promise;
  return result;
}
function getRequestWebStream(event) {
  if (!PayloadMethods$1.includes(event.method)) {
    return;
  }
  const bodyStream = event.web?.request?.body || event._requestBody;
  if (bodyStream) {
    return bodyStream;
  }
  const _hasRawBody = RawBodySymbol in event.node.req || "rawBody" in event.node.req || "body" in event.node.req || "__unenv__" in event.node.req;
  if (_hasRawBody) {
    return new ReadableStream({
      async start(controller) {
        const _rawBody = await readRawBody(event, false);
        if (_rawBody) {
          controller.enqueue(_rawBody);
        }
        controller.close();
      }
    });
  }
  return new ReadableStream({
    start: (controller) => {
      event.node.req.on("data", (chunk) => {
        controller.enqueue(chunk);
      });
      event.node.req.on("end", () => {
        controller.close();
      });
      event.node.req.on("error", (err) => {
        controller.error(err);
      });
    }
  });
}

function handleCacheHeaders(event, opts) {
  const cacheControls = ["public", ...opts.cacheControls || []];
  let cacheMatched = false;
  if (opts.maxAge !== void 0) {
    cacheControls.push(`max-age=${+opts.maxAge}`, `s-maxage=${+opts.maxAge}`);
  }
  if (opts.modifiedTime) {
    const modifiedTime = new Date(opts.modifiedTime);
    const ifModifiedSince = event.node.req.headers["if-modified-since"];
    event.node.res.setHeader("last-modified", modifiedTime.toUTCString());
    if (ifModifiedSince && new Date(ifModifiedSince) >= modifiedTime) {
      cacheMatched = true;
    }
  }
  if (opts.etag) {
    event.node.res.setHeader("etag", opts.etag);
    const ifNonMatch = event.node.req.headers["if-none-match"];
    if (ifNonMatch === opts.etag) {
      cacheMatched = true;
    }
  }
  event.node.res.setHeader("cache-control", cacheControls.join(", "));
  if (cacheMatched) {
    event.node.res.statusCode = 304;
    if (!event.handled) {
      event.node.res.end();
    }
    return true;
  }
  return false;
}

const MIMES = {
  html: "text/html",
  json: "application/json"
};

const DISALLOWED_STATUS_CHARS = /[^\u0009\u0020-\u007E]/g;
function sanitizeStatusMessage(statusMessage = "") {
  return statusMessage.replace(DISALLOWED_STATUS_CHARS, "");
}
function sanitizeStatusCode(statusCode, defaultStatusCode = 200) {
  if (!statusCode) {
    return defaultStatusCode;
  }
  if (typeof statusCode === "string") {
    statusCode = Number.parseInt(statusCode, 10);
  }
  if (statusCode < 100 || statusCode > 999) {
    return defaultStatusCode;
  }
  return statusCode;
}
function splitCookiesString(cookiesString) {
  if (Array.isArray(cookiesString)) {
    return cookiesString.flatMap((c) => splitCookiesString(c));
  }
  if (typeof cookiesString !== "string") {
    return [];
  }
  const cookiesStrings = [];
  let pos = 0;
  let start;
  let ch;
  let lastComma;
  let nextStart;
  let cookiesSeparatorFound;
  const skipWhitespace = () => {
    while (pos < cookiesString.length && /\s/.test(cookiesString.charAt(pos))) {
      pos += 1;
    }
    return pos < cookiesString.length;
  };
  const notSpecialChar = () => {
    ch = cookiesString.charAt(pos);
    return ch !== "=" && ch !== ";" && ch !== ",";
  };
  while (pos < cookiesString.length) {
    start = pos;
    cookiesSeparatorFound = false;
    while (skipWhitespace()) {
      ch = cookiesString.charAt(pos);
      if (ch === ",") {
        lastComma = pos;
        pos += 1;
        skipWhitespace();
        nextStart = pos;
        while (pos < cookiesString.length && notSpecialChar()) {
          pos += 1;
        }
        if (pos < cookiesString.length && cookiesString.charAt(pos) === "=") {
          cookiesSeparatorFound = true;
          pos = nextStart;
          cookiesStrings.push(cookiesString.slice(start, lastComma));
          start = pos;
        } else {
          pos = lastComma + 1;
        }
      } else {
        pos += 1;
      }
    }
    if (!cookiesSeparatorFound || pos >= cookiesString.length) {
      cookiesStrings.push(cookiesString.slice(start));
    }
  }
  return cookiesStrings;
}

const defer = typeof setImmediate === "undefined" ? (fn) => fn() : setImmediate;
function send(event, data, type) {
  if (type) {
    defaultContentType(event, type);
  }
  return new Promise((resolve) => {
    defer(() => {
      if (!event.handled) {
        event.node.res.end(data);
      }
      resolve();
    });
  });
}
function sendNoContent(event, code) {
  if (event.handled) {
    return;
  }
  if (!code && event.node.res.statusCode !== 200) {
    code = event.node.res.statusCode;
  }
  const _code = sanitizeStatusCode(code, 204);
  if (_code === 204) {
    event.node.res.removeHeader("content-length");
  }
  event.node.res.writeHead(_code);
  event.node.res.end();
}
function setResponseStatus(event, code, text) {
  if (code) {
    event.node.res.statusCode = sanitizeStatusCode(
      code,
      event.node.res.statusCode
    );
  }
  if (text) {
    event.node.res.statusMessage = sanitizeStatusMessage(text);
  }
}
function getResponseStatus(event) {
  return event.node.res.statusCode;
}
function getResponseStatusText(event) {
  return event.node.res.statusMessage;
}
function defaultContentType(event, type) {
  if (type && event.node.res.statusCode !== 304 && !event.node.res.getHeader("content-type")) {
    event.node.res.setHeader("content-type", type);
  }
}
function sendRedirect(event, location, code = 302) {
  event.node.res.statusCode = sanitizeStatusCode(
    code,
    event.node.res.statusCode
  );
  event.node.res.setHeader("location", location);
  const encodedLoc = location.replace(/"/g, "%22");
  const html = `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0; url=${encodedLoc}"></head></html>`;
  return send(event, html, MIMES.html);
}
function getResponseHeader(event, name) {
  return event.node.res.getHeader(name);
}
function setResponseHeaders(event, headers) {
  for (const [name, value] of Object.entries(headers)) {
    event.node.res.setHeader(
      name,
      value
    );
  }
}
const setHeaders = setResponseHeaders;
function setResponseHeader(event, name, value) {
  event.node.res.setHeader(name, value);
}
function appendResponseHeader(event, name, value) {
  let current = event.node.res.getHeader(name);
  if (!current) {
    event.node.res.setHeader(name, value);
    return;
  }
  if (!Array.isArray(current)) {
    current = [current.toString()];
  }
  event.node.res.setHeader(name, [...current, value]);
}
function removeResponseHeader(event, name) {
  return event.node.res.removeHeader(name);
}
function isStream(data) {
  if (!data || typeof data !== "object") {
    return false;
  }
  if (typeof data.pipe === "function") {
    if (typeof data._read === "function") {
      return true;
    }
    if (typeof data.abort === "function") {
      return true;
    }
  }
  if (typeof data.pipeTo === "function") {
    return true;
  }
  return false;
}
function isWebResponse(data) {
  return typeof Response !== "undefined" && data instanceof Response;
}
function sendStream(event, stream) {
  if (!stream || typeof stream !== "object") {
    throw new Error("[h3] Invalid stream provided.");
  }
  event.node.res._data = stream;
  if (!event.node.res.socket) {
    event._handled = true;
    return Promise.resolve();
  }
  if (hasProp(stream, "pipeTo") && typeof stream.pipeTo === "function") {
    return stream.pipeTo(
      new WritableStream({
        write(chunk) {
          event.node.res.write(chunk);
        }
      })
    ).then(() => {
      event.node.res.end();
    });
  }
  if (hasProp(stream, "pipe") && typeof stream.pipe === "function") {
    return new Promise((resolve, reject) => {
      stream.pipe(event.node.res);
      if (stream.on) {
        stream.on("end", () => {
          event.node.res.end();
          resolve();
        });
        stream.on("error", (error) => {
          reject(error);
        });
      }
      event.node.res.on("close", () => {
        if (stream.abort) {
          stream.abort();
        }
      });
    });
  }
  throw new Error("[h3] Invalid or incompatible stream provided.");
}
function sendWebResponse(event, response) {
  for (const [key, value] of response.headers) {
    if (key === "set-cookie") {
      event.node.res.appendHeader(key, splitCookiesString(value));
    } else {
      event.node.res.setHeader(key, value);
    }
  }
  if (response.status) {
    event.node.res.statusCode = sanitizeStatusCode(
      response.status,
      event.node.res.statusCode
    );
  }
  if (response.statusText) {
    event.node.res.statusMessage = sanitizeStatusMessage(response.statusText);
  }
  if (response.redirected) {
    event.node.res.setHeader("location", response.url);
  }
  if (!response.body) {
    event.node.res.end();
    return;
  }
  return sendStream(event, response.body);
}

const PayloadMethods = /* @__PURE__ */ new Set(["PATCH", "POST", "PUT", "DELETE"]);
const ignoredHeaders = /* @__PURE__ */ new Set([
  "transfer-encoding",
  "accept-encoding",
  "connection",
  "keep-alive",
  "upgrade",
  "expect",
  "host",
  "accept"
]);
async function proxyRequest(event, target, opts = {}) {
  let body;
  let duplex;
  if (PayloadMethods.has(event.method)) {
    if (opts.streamRequest) {
      body = getRequestWebStream(event);
      duplex = "half";
    } else {
      body = await readRawBody(event, false).catch(() => void 0);
    }
  }
  const method = opts.fetchOptions?.method || event.method;
  const fetchHeaders = mergeHeaders$1(
    getProxyRequestHeaders(event, { host: target.startsWith("/") }),
    opts.fetchOptions?.headers,
    opts.headers
  );
  return sendProxy(event, target, {
    ...opts,
    fetchOptions: {
      method,
      body,
      duplex,
      ...opts.fetchOptions,
      headers: fetchHeaders
    }
  });
}
async function sendProxy(event, target, opts = {}) {
  let response;
  try {
    response = await _getFetch(opts.fetch)(target, {
      headers: opts.headers,
      ignoreResponseError: true,
      // make $ofetch.raw transparent
      ...opts.fetchOptions
    });
  } catch (error) {
    throw createError$1({
      status: 502,
      statusMessage: "Bad Gateway",
      cause: error
    });
  }
  event.node.res.statusCode = sanitizeStatusCode(
    response.status,
    event.node.res.statusCode
  );
  event.node.res.statusMessage = sanitizeStatusMessage(response.statusText);
  const cookies = [];
  for (const [key, value] of response.headers.entries()) {
    if (key === "content-encoding") {
      continue;
    }
    if (key === "content-length") {
      continue;
    }
    if (key === "set-cookie") {
      cookies.push(...splitCookiesString(value));
      continue;
    }
    event.node.res.setHeader(key, value);
  }
  if (cookies.length > 0) {
    event.node.res.setHeader(
      "set-cookie",
      cookies.map((cookie) => {
        if (opts.cookieDomainRewrite) {
          cookie = rewriteCookieProperty(
            cookie,
            opts.cookieDomainRewrite,
            "domain"
          );
        }
        if (opts.cookiePathRewrite) {
          cookie = rewriteCookieProperty(
            cookie,
            opts.cookiePathRewrite,
            "path"
          );
        }
        return cookie;
      })
    );
  }
  if (opts.onResponse) {
    await opts.onResponse(event, response);
  }
  if (response._data !== void 0) {
    return response._data;
  }
  if (event.handled) {
    return;
  }
  if (opts.sendStream === false) {
    const data = new Uint8Array(await response.arrayBuffer());
    return event.node.res.end(data);
  }
  if (response.body) {
    for await (const chunk of response.body) {
      event.node.res.write(chunk);
    }
  }
  return event.node.res.end();
}
function getProxyRequestHeaders(event, opts) {
  const headers = /* @__PURE__ */ Object.create(null);
  const reqHeaders = getRequestHeaders(event);
  for (const name in reqHeaders) {
    if (!ignoredHeaders.has(name) || name === "host" && opts?.host) {
      headers[name] = reqHeaders[name];
    }
  }
  return headers;
}
function fetchWithEvent(event, req, init, options) {
  return _getFetch(options?.fetch)(req, {
    ...init,
    context: init?.context || event.context,
    headers: {
      ...getProxyRequestHeaders(event, {
        host: typeof req === "string" && req.startsWith("/")
      }),
      ...init?.headers
    }
  });
}
function _getFetch(_fetch) {
  if (_fetch) {
    return _fetch;
  }
  if (globalThis.fetch) {
    return globalThis.fetch;
  }
  throw new Error(
    "fetch is not available. Try importing `node-fetch-native/polyfill` for Node.js."
  );
}
function rewriteCookieProperty(header, map, property) {
  const _map = typeof map === "string" ? { "*": map } : map;
  return header.replace(
    new RegExp(`(;\\s*${property}=)([^;]+)`, "gi"),
    (match, prefix, previousValue) => {
      let newValue;
      if (previousValue in _map) {
        newValue = _map[previousValue];
      } else if ("*" in _map) {
        newValue = _map["*"];
      } else {
        return match;
      }
      return newValue ? prefix + newValue : "";
    }
  );
}
function mergeHeaders$1(defaults, ...inputs) {
  const _inputs = inputs.filter(Boolean);
  if (_inputs.length === 0) {
    return defaults;
  }
  const merged = new Headers(defaults);
  for (const input of _inputs) {
    const entries = Array.isArray(input) ? input : typeof input.entries === "function" ? input.entries() : Object.entries(input);
    for (const [key, value] of entries) {
      if (value !== void 0) {
        merged.set(key, value);
      }
    }
  }
  return merged;
}

class H3Event {
  "__is_event__" = true;
  // Context
  node;
  // Node
  web;
  // Web
  context = {};
  // Shared
  // Request
  _method;
  _path;
  _headers;
  _requestBody;
  // Response
  _handled = false;
  // Hooks
  _onBeforeResponseCalled;
  _onAfterResponseCalled;
  constructor(req, res) {
    this.node = { req, res };
  }
  // --- Request ---
  get method() {
    if (!this._method) {
      this._method = (this.node.req.method || "GET").toUpperCase();
    }
    return this._method;
  }
  get path() {
    return this._path || this.node.req.url || "/";
  }
  get headers() {
    if (!this._headers) {
      this._headers = _normalizeNodeHeaders(this.node.req.headers);
    }
    return this._headers;
  }
  // --- Respoonse ---
  get handled() {
    return this._handled || this.node.res.writableEnded || this.node.res.headersSent;
  }
  respondWith(response) {
    return Promise.resolve(response).then(
      (_response) => sendWebResponse(this, _response)
    );
  }
  // --- Utils ---
  toString() {
    return `[${this.method}] ${this.path}`;
  }
  toJSON() {
    return this.toString();
  }
  // --- Deprecated ---
  /** @deprecated Please use `event.node.req` instead. */
  get req() {
    return this.node.req;
  }
  /** @deprecated Please use `event.node.res` instead. */
  get res() {
    return this.node.res;
  }
}
function isEvent(input) {
  return hasProp(input, "__is_event__");
}
function createEvent(req, res) {
  return new H3Event(req, res);
}
function _normalizeNodeHeaders(nodeHeaders) {
  const headers = new Headers();
  for (const [name, value] of Object.entries(nodeHeaders)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        headers.append(name, item);
      }
    } else if (value) {
      headers.set(name, value);
    }
  }
  return headers;
}

function defineEventHandler(handler) {
  if (typeof handler === "function") {
    handler.__is_handler__ = true;
    return handler;
  }
  const _hooks = {
    onRequest: _normalizeArray(handler.onRequest),
    onBeforeResponse: _normalizeArray(handler.onBeforeResponse)
  };
  const _handler = (event) => {
    return _callHandler(event, handler.handler, _hooks);
  };
  _handler.__is_handler__ = true;
  _handler.__resolve__ = handler.handler.__resolve__;
  _handler.__websocket__ = handler.websocket;
  return _handler;
}
function _normalizeArray(input) {
  return input ? Array.isArray(input) ? input : [input] : void 0;
}
async function _callHandler(event, handler, hooks) {
  if (hooks.onRequest) {
    for (const hook of hooks.onRequest) {
      await hook(event);
      if (event.handled) {
        return;
      }
    }
  }
  const body = await handler(event);
  const response = { body };
  if (hooks.onBeforeResponse) {
    for (const hook of hooks.onBeforeResponse) {
      await hook(event, response);
    }
  }
  return response.body;
}
const eventHandler = defineEventHandler;
function isEventHandler(input) {
  return hasProp(input, "__is_handler__");
}
function toEventHandler(input, _, _route) {
  if (!isEventHandler(input)) {
    console.warn(
      "[h3] Implicit event handler conversion is deprecated. Use `eventHandler()` or `fromNodeMiddleware()` to define event handlers.",
      _route && _route !== "/" ? `
     Route: ${_route}` : "",
      `
     Handler: ${input}`
    );
  }
  return input;
}
function defineLazyEventHandler(factory) {
  let _promise;
  let _resolved;
  const resolveHandler = () => {
    if (_resolved) {
      return Promise.resolve(_resolved);
    }
    if (!_promise) {
      _promise = Promise.resolve(factory()).then((r) => {
        const handler2 = r.default || r;
        if (typeof handler2 !== "function") {
          throw new TypeError(
            "Invalid lazy handler result. It should be a function:",
            handler2
          );
        }
        _resolved = { handler: toEventHandler(r.default || r) };
        return _resolved;
      });
    }
    return _promise;
  };
  const handler = eventHandler((event) => {
    if (_resolved) {
      return _resolved.handler(event);
    }
    return resolveHandler().then((r) => r.handler(event));
  });
  handler.__resolve__ = resolveHandler;
  return handler;
}
const lazyEventHandler = defineLazyEventHandler;

function createApp(options = {}) {
  const stack = [];
  const handler = createAppEventHandler(stack, options);
  const resolve = createResolver(stack);
  handler.__resolve__ = resolve;
  const getWebsocket = cachedFn(() => websocketOptions(resolve, options));
  const app = {
    // @ts-expect-error
    use: (arg1, arg2, arg3) => use(app, arg1, arg2, arg3),
    resolve,
    handler,
    stack,
    options,
    get websocket() {
      return getWebsocket();
    }
  };
  return app;
}
function use(app, arg1, arg2, arg3) {
  if (Array.isArray(arg1)) {
    for (const i of arg1) {
      use(app, i, arg2, arg3);
    }
  } else if (Array.isArray(arg2)) {
    for (const i of arg2) {
      use(app, arg1, i, arg3);
    }
  } else if (typeof arg1 === "string") {
    app.stack.push(
      normalizeLayer({ ...arg3, route: arg1, handler: arg2 })
    );
  } else if (typeof arg1 === "function") {
    app.stack.push(normalizeLayer({ ...arg2, handler: arg1 }));
  } else {
    app.stack.push(normalizeLayer({ ...arg1 }));
  }
  return app;
}
function createAppEventHandler(stack, options) {
  const spacing = options.debug ? 2 : void 0;
  return eventHandler(async (event) => {
    event.node.req.originalUrl = event.node.req.originalUrl || event.node.req.url || "/";
    const _reqPath = event._path || event.node.req.url || "/";
    let _layerPath;
    if (options.onRequest) {
      await options.onRequest(event);
    }
    for (const layer of stack) {
      if (layer.route.length > 1) {
        if (!_reqPath.startsWith(layer.route)) {
          continue;
        }
        _layerPath = _reqPath.slice(layer.route.length) || "/";
      } else {
        _layerPath = _reqPath;
      }
      if (layer.match && !layer.match(_layerPath, event)) {
        continue;
      }
      event._path = _layerPath;
      event.node.req.url = _layerPath;
      const val = await layer.handler(event);
      const _body = val === void 0 ? void 0 : await val;
      if (_body !== void 0) {
        const _response = { body: _body };
        if (options.onBeforeResponse) {
          event._onBeforeResponseCalled = true;
          await options.onBeforeResponse(event, _response);
        }
        await handleHandlerResponse(event, _response.body, spacing);
        if (options.onAfterResponse) {
          event._onAfterResponseCalled = true;
          await options.onAfterResponse(event, _response);
        }
        return;
      }
      if (event.handled) {
        if (options.onAfterResponse) {
          event._onAfterResponseCalled = true;
          await options.onAfterResponse(event, void 0);
        }
        return;
      }
    }
    if (!event.handled) {
      throw createError$1({
        statusCode: 404,
        statusMessage: `Cannot find any path matching ${event.path || "/"}.`
      });
    }
    if (options.onAfterResponse) {
      event._onAfterResponseCalled = true;
      await options.onAfterResponse(event, void 0);
    }
  });
}
function createResolver(stack) {
  return async (path) => {
    let _layerPath;
    for (const layer of stack) {
      if (layer.route === "/" && !layer.handler.__resolve__) {
        continue;
      }
      if (!path.startsWith(layer.route)) {
        continue;
      }
      _layerPath = path.slice(layer.route.length) || "/";
      if (layer.match && !layer.match(_layerPath, void 0)) {
        continue;
      }
      let res = { route: layer.route, handler: layer.handler };
      if (res.handler.__resolve__) {
        const _res = await res.handler.__resolve__(_layerPath);
        if (!_res) {
          continue;
        }
        res = {
          ...res,
          ..._res,
          route: joinURL(res.route || "/", _res.route || "/")
        };
      }
      return res;
    }
  };
}
function normalizeLayer(input) {
  let handler = input.handler;
  if (handler.handler) {
    handler = handler.handler;
  }
  if (input.lazy) {
    handler = lazyEventHandler(handler);
  } else if (!isEventHandler(handler)) {
    handler = toEventHandler(handler, void 0, input.route);
  }
  return {
    route: withoutTrailingSlash(input.route),
    match: input.match,
    handler
  };
}
function handleHandlerResponse(event, val, jsonSpace) {
  if (val === null) {
    return sendNoContent(event);
  }
  if (val) {
    if (isWebResponse(val)) {
      return sendWebResponse(event, val);
    }
    if (isStream(val)) {
      return sendStream(event, val);
    }
    if (val.buffer) {
      return send(event, val);
    }
    if (val.arrayBuffer && typeof val.arrayBuffer === "function") {
      return val.arrayBuffer().then((arrayBuffer) => {
        return send(event, Buffer.from(arrayBuffer), val.type);
      });
    }
    if (val instanceof Error) {
      throw createError$1(val);
    }
    if (typeof val.end === "function") {
      return true;
    }
  }
  const valType = typeof val;
  if (valType === "string") {
    return send(event, val, MIMES.html);
  }
  if (valType === "object" || valType === "boolean" || valType === "number") {
    return send(event, JSON.stringify(val, void 0, jsonSpace), MIMES.json);
  }
  if (valType === "bigint") {
    return send(event, val.toString(), MIMES.json);
  }
  throw createError$1({
    statusCode: 500,
    statusMessage: `[h3] Cannot send ${valType} as response.`
  });
}
function cachedFn(fn) {
  let cache;
  return () => {
    if (!cache) {
      cache = fn();
    }
    return cache;
  };
}
function websocketOptions(evResolver, appOptions) {
  return {
    ...appOptions.websocket,
    async resolve(info) {
      const url = info.request?.url || info.url || "/";
      const { pathname } = typeof url === "string" ? parseURL(url) : url;
      const resolved = await evResolver(pathname);
      return resolved?.handler?.__websocket__ || {};
    }
  };
}

const RouterMethods = [
  "connect",
  "delete",
  "get",
  "head",
  "options",
  "post",
  "put",
  "trace",
  "patch"
];
function createRouter(opts = {}) {
  const _router = createRouter$1({});
  const routes = {};
  let _matcher;
  const router = {};
  const addRoute = (path, handler, method) => {
    let route = routes[path];
    if (!route) {
      routes[path] = route = { path, handlers: {} };
      _router.insert(path, route);
    }
    if (Array.isArray(method)) {
      for (const m of method) {
        addRoute(path, handler, m);
      }
    } else {
      route.handlers[method] = toEventHandler(handler, void 0, path);
    }
    return router;
  };
  router.use = router.add = (path, handler, method) => addRoute(path, handler, method || "all");
  for (const method of RouterMethods) {
    router[method] = (path, handle) => router.add(path, handle, method);
  }
  const matchHandler = (path = "/", method = "get") => {
    const qIndex = path.indexOf("?");
    if (qIndex !== -1) {
      path = path.slice(0, Math.max(0, qIndex));
    }
    const matched = _router.lookup(path);
    if (!matched || !matched.handlers) {
      return {
        error: createError$1({
          statusCode: 404,
          name: "Not Found",
          statusMessage: `Cannot find any route matching ${path || "/"}.`
        })
      };
    }
    let handler = matched.handlers[method] || matched.handlers.all;
    if (!handler) {
      if (!_matcher) {
        _matcher = toRouteMatcher(_router);
      }
      const _matches = _matcher.matchAll(path).reverse();
      for (const _match of _matches) {
        if (_match.handlers[method]) {
          handler = _match.handlers[method];
          matched.handlers[method] = matched.handlers[method] || handler;
          break;
        }
        if (_match.handlers.all) {
          handler = _match.handlers.all;
          matched.handlers.all = matched.handlers.all || handler;
          break;
        }
      }
    }
    if (!handler) {
      return {
        error: createError$1({
          statusCode: 405,
          name: "Method Not Allowed",
          statusMessage: `Method ${method} is not allowed on this route.`
        })
      };
    }
    return { matched, handler };
  };
  const isPreemptive = opts.preemptive || opts.preemtive;
  router.handler = eventHandler((event) => {
    const match = matchHandler(
      event.path,
      event.method.toLowerCase()
    );
    if ("error" in match) {
      if (isPreemptive) {
        throw match.error;
      } else {
        return;
      }
    }
    event.context.matchedRoute = match.matched;
    const params = match.matched.params || {};
    event.context.params = params;
    return Promise.resolve(match.handler(event)).then((res) => {
      if (res === void 0 && isPreemptive) {
        return null;
      }
      return res;
    });
  });
  router.handler.__resolve__ = async (path) => {
    path = withLeadingSlash(path);
    const match = matchHandler(path);
    if ("error" in match) {
      return;
    }
    let res = {
      route: match.matched.path,
      handler: match.handler
    };
    if (match.handler.__resolve__) {
      const _res = await match.handler.__resolve__(path);
      if (!_res) {
        return;
      }
      res = { ...res, ..._res };
    }
    return res;
  };
  return router;
}
function toNodeListener(app) {
  const toNodeHandle = async function(req, res) {
    const event = createEvent(req, res);
    try {
      await app.handler(event);
    } catch (_error) {
      const error = createError$1(_error);
      if (!isError(_error)) {
        error.unhandled = true;
      }
      setResponseStatus(event, error.statusCode, error.statusMessage);
      if (app.options.onError) {
        await app.options.onError(error, event);
      }
      if (event.handled) {
        return;
      }
      if (error.unhandled || error.fatal) {
        console.error("[h3]", error.fatal ? "[fatal]" : "[unhandled]", error);
      }
      if (app.options.onBeforeResponse && !event._onBeforeResponseCalled) {
        await app.options.onBeforeResponse(event, { body: error });
      }
      await sendError(event, error, !!app.options.debug);
      if (app.options.onAfterResponse && !event._onAfterResponseCalled) {
        await app.options.onAfterResponse(event, { body: error });
      }
    }
  };
  return toNodeHandle;
}

function flatHooks(configHooks, hooks = {}, parentName) {
  for (const key in configHooks) {
    const subHook = configHooks[key];
    const name = parentName ? `${parentName}:${key}` : key;
    if (typeof subHook === "object" && subHook !== null) {
      flatHooks(subHook, hooks, name);
    } else if (typeof subHook === "function") {
      hooks[name] = subHook;
    }
  }
  return hooks;
}
const defaultTask = { run: (function_) => function_() };
const _createTask = () => defaultTask;
const createTask = typeof console.createTask !== "undefined" ? console.createTask : _createTask;
function serialTaskCaller(hooks, args) {
  const name = args.shift();
  const task = createTask(name);
  return hooks.reduce(
    (promise, hookFunction) => promise.then(() => task.run(() => hookFunction(...args))),
    Promise.resolve()
  );
}
function parallelTaskCaller(hooks, args) {
  const name = args.shift();
  const task = createTask(name);
  return Promise.all(hooks.map((hook) => task.run(() => hook(...args))));
}
function callEachWith(callbacks, arg0) {
  for (const callback of [...callbacks]) {
    callback(arg0);
  }
}

class Hookable {
  constructor() {
    this._hooks = {};
    this._before = void 0;
    this._after = void 0;
    this._deprecatedMessages = void 0;
    this._deprecatedHooks = {};
    this.hook = this.hook.bind(this);
    this.callHook = this.callHook.bind(this);
    this.callHookWith = this.callHookWith.bind(this);
  }
  hook(name, function_, options = {}) {
    if (!name || typeof function_ !== "function") {
      return () => {
      };
    }
    const originalName = name;
    let dep;
    while (this._deprecatedHooks[name]) {
      dep = this._deprecatedHooks[name];
      name = dep.to;
    }
    if (dep && !options.allowDeprecated) {
      let message = dep.message;
      if (!message) {
        message = `${originalName} hook has been deprecated` + (dep.to ? `, please use ${dep.to}` : "");
      }
      if (!this._deprecatedMessages) {
        this._deprecatedMessages = /* @__PURE__ */ new Set();
      }
      if (!this._deprecatedMessages.has(message)) {
        console.warn(message);
        this._deprecatedMessages.add(message);
      }
    }
    if (!function_.name) {
      try {
        Object.defineProperty(function_, "name", {
          get: () => "_" + name.replace(/\W+/g, "_") + "_hook_cb",
          configurable: true
        });
      } catch {
      }
    }
    this._hooks[name] = this._hooks[name] || [];
    this._hooks[name].push(function_);
    return () => {
      if (function_) {
        this.removeHook(name, function_);
        function_ = void 0;
      }
    };
  }
  hookOnce(name, function_) {
    let _unreg;
    let _function = (...arguments_) => {
      if (typeof _unreg === "function") {
        _unreg();
      }
      _unreg = void 0;
      _function = void 0;
      return function_(...arguments_);
    };
    _unreg = this.hook(name, _function);
    return _unreg;
  }
  removeHook(name, function_) {
    if (this._hooks[name]) {
      const index = this._hooks[name].indexOf(function_);
      if (index !== -1) {
        this._hooks[name].splice(index, 1);
      }
      if (this._hooks[name].length === 0) {
        delete this._hooks[name];
      }
    }
  }
  deprecateHook(name, deprecated) {
    this._deprecatedHooks[name] = typeof deprecated === "string" ? { to: deprecated } : deprecated;
    const _hooks = this._hooks[name] || [];
    delete this._hooks[name];
    for (const hook of _hooks) {
      this.hook(name, hook);
    }
  }
  deprecateHooks(deprecatedHooks) {
    Object.assign(this._deprecatedHooks, deprecatedHooks);
    for (const name in deprecatedHooks) {
      this.deprecateHook(name, deprecatedHooks[name]);
    }
  }
  addHooks(configHooks) {
    const hooks = flatHooks(configHooks);
    const removeFns = Object.keys(hooks).map(
      (key) => this.hook(key, hooks[key])
    );
    return () => {
      for (const unreg of removeFns.splice(0, removeFns.length)) {
        unreg();
      }
    };
  }
  removeHooks(configHooks) {
    const hooks = flatHooks(configHooks);
    for (const key in hooks) {
      this.removeHook(key, hooks[key]);
    }
  }
  removeAllHooks() {
    for (const key in this._hooks) {
      delete this._hooks[key];
    }
  }
  callHook(name, ...arguments_) {
    arguments_.unshift(name);
    return this.callHookWith(serialTaskCaller, name, ...arguments_);
  }
  callHookParallel(name, ...arguments_) {
    arguments_.unshift(name);
    return this.callHookWith(parallelTaskCaller, name, ...arguments_);
  }
  callHookWith(caller, name, ...arguments_) {
    const event = this._before || this._after ? { name, args: arguments_, context: {} } : void 0;
    if (this._before) {
      callEachWith(this._before, event);
    }
    const result = caller(
      name in this._hooks ? [...this._hooks[name]] : [],
      arguments_
    );
    if (result instanceof Promise) {
      return result.finally(() => {
        if (this._after && event) {
          callEachWith(this._after, event);
        }
      });
    }
    if (this._after && event) {
      callEachWith(this._after, event);
    }
    return result;
  }
  beforeEach(function_) {
    this._before = this._before || [];
    this._before.push(function_);
    return () => {
      if (this._before !== void 0) {
        const index = this._before.indexOf(function_);
        if (index !== -1) {
          this._before.splice(index, 1);
        }
      }
    };
  }
  afterEach(function_) {
    this._after = this._after || [];
    this._after.push(function_);
    return () => {
      if (this._after !== void 0) {
        const index = this._after.indexOf(function_);
        if (index !== -1) {
          this._after.splice(index, 1);
        }
      }
    };
  }
}
function createHooks() {
  return new Hookable();
}

const s$1=globalThis.Headers,i=globalThis.AbortController,l=globalThis.fetch||(()=>{throw new Error("[node-fetch-native] Failed to fetch: `globalThis.fetch` is not available!")});

class FetchError extends Error {
  constructor(message, opts) {
    super(message, opts);
    this.name = "FetchError";
    if (opts?.cause && !this.cause) {
      this.cause = opts.cause;
    }
  }
}
function createFetchError(ctx) {
  const errorMessage = ctx.error?.message || ctx.error?.toString() || "";
  const method = ctx.request?.method || ctx.options?.method || "GET";
  const url = ctx.request?.url || String(ctx.request) || "/";
  const requestStr = `[${method}] ${JSON.stringify(url)}`;
  const statusStr = ctx.response ? `${ctx.response.status} ${ctx.response.statusText}` : "<no response>";
  const message = `${requestStr}: ${statusStr}${errorMessage ? ` ${errorMessage}` : ""}`;
  const fetchError = new FetchError(
    message,
    ctx.error ? { cause: ctx.error } : void 0
  );
  for (const key of ["request", "options", "response"]) {
    Object.defineProperty(fetchError, key, {
      get() {
        return ctx[key];
      }
    });
  }
  for (const [key, refKey] of [
    ["data", "_data"],
    ["status", "status"],
    ["statusCode", "status"],
    ["statusText", "statusText"],
    ["statusMessage", "statusText"]
  ]) {
    Object.defineProperty(fetchError, key, {
      get() {
        return ctx.response && ctx.response[refKey];
      }
    });
  }
  return fetchError;
}

const payloadMethods = new Set(
  Object.freeze(["PATCH", "POST", "PUT", "DELETE"])
);
function isPayloadMethod(method = "GET") {
  return payloadMethods.has(method.toUpperCase());
}
function isJSONSerializable(value) {
  if (value === void 0) {
    return false;
  }
  const t = typeof value;
  if (t === "string" || t === "number" || t === "boolean" || t === null) {
    return true;
  }
  if (t !== "object") {
    return false;
  }
  if (Array.isArray(value)) {
    return true;
  }
  if (value.buffer) {
    return false;
  }
  if (value instanceof FormData || value instanceof URLSearchParams) {
    return false;
  }
  return value.constructor && value.constructor.name === "Object" || typeof value.toJSON === "function";
}
const textTypes = /* @__PURE__ */ new Set([
  "image/svg",
  "application/xml",
  "application/xhtml",
  "application/html"
]);
const JSON_RE = /^application\/(?:[\w!#$%&*.^`~-]*\+)?json(;.+)?$/i;
function detectResponseType(_contentType = "") {
  if (!_contentType) {
    return "json";
  }
  const contentType = _contentType.split(";").shift() || "";
  if (JSON_RE.test(contentType)) {
    return "json";
  }
  if (contentType === "text/event-stream") {
    return "stream";
  }
  if (textTypes.has(contentType) || contentType.startsWith("text/")) {
    return "text";
  }
  return "blob";
}
function resolveFetchOptions(request, input, defaults, Headers) {
  const headers = mergeHeaders(
    input?.headers ?? request?.headers,
    defaults?.headers,
    Headers
  );
  let query;
  if (defaults?.query || defaults?.params || input?.params || input?.query) {
    query = {
      ...defaults?.params,
      ...defaults?.query,
      ...input?.params,
      ...input?.query
    };
  }
  return {
    ...defaults,
    ...input,
    query,
    params: query,
    headers
  };
}
function mergeHeaders(input, defaults, Headers) {
  if (!defaults) {
    return new Headers(input);
  }
  const headers = new Headers(defaults);
  if (input) {
    for (const [key, value] of Symbol.iterator in input || Array.isArray(input) ? input : new Headers(input)) {
      headers.set(key, value);
    }
  }
  return headers;
}
async function callHooks(context, hooks) {
  if (hooks) {
    if (Array.isArray(hooks)) {
      for (const hook of hooks) {
        await hook(context);
      }
    } else {
      await hooks(context);
    }
  }
}

const retryStatusCodes = /* @__PURE__ */ new Set([
  408,
  // Request Timeout
  409,
  // Conflict
  425,
  // Too Early (Experimental)
  429,
  // Too Many Requests
  500,
  // Internal Server Error
  502,
  // Bad Gateway
  503,
  // Service Unavailable
  504
  // Gateway Timeout
]);
const nullBodyResponses = /* @__PURE__ */ new Set([101, 204, 205, 304]);
function createFetch(globalOptions = {}) {
  const {
    fetch = globalThis.fetch,
    Headers = globalThis.Headers,
    AbortController = globalThis.AbortController
  } = globalOptions;
  async function onError(context) {
    const isAbort = context.error && context.error.name === "AbortError" && !context.options.timeout || false;
    if (context.options.retry !== false && !isAbort) {
      let retries;
      if (typeof context.options.retry === "number") {
        retries = context.options.retry;
      } else {
        retries = isPayloadMethod(context.options.method) ? 0 : 1;
      }
      const responseCode = context.response && context.response.status || 500;
      if (retries > 0 && (Array.isArray(context.options.retryStatusCodes) ? context.options.retryStatusCodes.includes(responseCode) : retryStatusCodes.has(responseCode))) {
        const retryDelay = typeof context.options.retryDelay === "function" ? context.options.retryDelay(context) : context.options.retryDelay || 0;
        if (retryDelay > 0) {
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
        }
        return $fetchRaw(context.request, {
          ...context.options,
          retry: retries - 1
        });
      }
    }
    const error = createFetchError(context);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(error, $fetchRaw);
    }
    throw error;
  }
  const $fetchRaw = async function $fetchRaw2(_request, _options = {}) {
    const context = {
      request: _request,
      options: resolveFetchOptions(
        _request,
        _options,
        globalOptions.defaults,
        Headers
      ),
      response: void 0,
      error: void 0
    };
    if (context.options.method) {
      context.options.method = context.options.method.toUpperCase();
    }
    if (context.options.onRequest) {
      await callHooks(context, context.options.onRequest);
      if (!(context.options.headers instanceof Headers)) {
        context.options.headers = new Headers(
          context.options.headers || {}
          /* compat */
        );
      }
    }
    if (typeof context.request === "string") {
      if (context.options.baseURL) {
        context.request = withBase(context.request, context.options.baseURL);
      }
      if (context.options.query) {
        context.request = withQuery(context.request, context.options.query);
        delete context.options.query;
      }
      if ("query" in context.options) {
        delete context.options.query;
      }
      if ("params" in context.options) {
        delete context.options.params;
      }
    }
    if (context.options.body && isPayloadMethod(context.options.method)) {
      if (isJSONSerializable(context.options.body)) {
        const contentType = context.options.headers.get("content-type");
        if (typeof context.options.body !== "string") {
          context.options.body = contentType === "application/x-www-form-urlencoded" ? new URLSearchParams(
            context.options.body
          ).toString() : JSON.stringify(context.options.body);
        }
        if (!contentType) {
          context.options.headers.set("content-type", "application/json");
        }
        if (!context.options.headers.has("accept")) {
          context.options.headers.set("accept", "application/json");
        }
      } else if (
        // ReadableStream Body
        "pipeTo" in context.options.body && typeof context.options.body.pipeTo === "function" || // Node.js Stream Body
        typeof context.options.body.pipe === "function"
      ) {
        if (!("duplex" in context.options)) {
          context.options.duplex = "half";
        }
      }
    }
    let abortTimeout;
    if (!context.options.signal && context.options.timeout) {
      const controller = new AbortController();
      abortTimeout = setTimeout(() => {
        const error = new Error(
          "[TimeoutError]: The operation was aborted due to timeout"
        );
        error.name = "TimeoutError";
        error.code = 23;
        controller.abort(error);
      }, context.options.timeout);
      context.options.signal = controller.signal;
    }
    try {
      context.response = await fetch(
        context.request,
        context.options
      );
    } catch (error) {
      context.error = error;
      if (context.options.onRequestError) {
        await callHooks(
          context,
          context.options.onRequestError
        );
      }
      return await onError(context);
    } finally {
      if (abortTimeout) {
        clearTimeout(abortTimeout);
      }
    }
    const hasBody = (context.response.body || // https://github.com/unjs/ofetch/issues/324
    // https://github.com/unjs/ofetch/issues/294
    // https://github.com/JakeChampion/fetch/issues/1454
    context.response._bodyInit) && !nullBodyResponses.has(context.response.status) && context.options.method !== "HEAD";
    if (hasBody) {
      const responseType = (context.options.parseResponse ? "json" : context.options.responseType) || detectResponseType(context.response.headers.get("content-type") || "");
      switch (responseType) {
        case "json": {
          const data = await context.response.text();
          const parseFunction = context.options.parseResponse || destr;
          context.response._data = parseFunction(data);
          break;
        }
        case "stream": {
          context.response._data = context.response.body || context.response._bodyInit;
          break;
        }
        default: {
          context.response._data = await context.response[responseType]();
        }
      }
    }
    if (context.options.onResponse) {
      await callHooks(
        context,
        context.options.onResponse
      );
    }
    if (!context.options.ignoreResponseError && context.response.status >= 400 && context.response.status < 600) {
      if (context.options.onResponseError) {
        await callHooks(
          context,
          context.options.onResponseError
        );
      }
      return await onError(context);
    }
    return context.response;
  };
  const $fetch = async function $fetch2(request, options) {
    const r = await $fetchRaw(request, options);
    return r._data;
  };
  $fetch.raw = $fetchRaw;
  $fetch.native = (...args) => fetch(...args);
  $fetch.create = (defaultOptions = {}, customGlobalOptions = {}) => createFetch({
    ...globalOptions,
    ...customGlobalOptions,
    defaults: {
      ...globalOptions.defaults,
      ...customGlobalOptions.defaults,
      ...defaultOptions
    }
  });
  return $fetch;
}

function createNodeFetch() {
  const useKeepAlive = JSON.parse(process.env.FETCH_KEEP_ALIVE || "false");
  if (!useKeepAlive) {
    return l;
  }
  const agentOptions = { keepAlive: true };
  const httpAgent = new http.Agent(agentOptions);
  const httpsAgent = new https.Agent(agentOptions);
  const nodeFetchOptions = {
    agent(parsedURL) {
      return parsedURL.protocol === "http:" ? httpAgent : httpsAgent;
    }
  };
  return function nodeFetchWithKeepAlive(input, init) {
    return l(input, { ...nodeFetchOptions, ...init });
  };
}
const fetch = globalThis.fetch ? (...args) => globalThis.fetch(...args) : createNodeFetch();
const Headers$1 = globalThis.Headers || s$1;
const AbortController = globalThis.AbortController || i;
const ofetch = createFetch({ fetch, Headers: Headers$1, AbortController });
const $fetch = ofetch;

function wrapToPromise(value) {
  if (!value || typeof value.then !== "function") {
    return Promise.resolve(value);
  }
  return value;
}
function asyncCall(function_, ...arguments_) {
  try {
    return wrapToPromise(function_(...arguments_));
  } catch (error) {
    return Promise.reject(error);
  }
}
function isPrimitive(value) {
  const type = typeof value;
  return value === null || type !== "object" && type !== "function";
}
function isPureObject(value) {
  const proto = Object.getPrototypeOf(value);
  return !proto || proto.isPrototypeOf(Object);
}
function stringify(value) {
  if (isPrimitive(value)) {
    return String(value);
  }
  if (isPureObject(value) || Array.isArray(value)) {
    return JSON.stringify(value);
  }
  if (typeof value.toJSON === "function") {
    return stringify(value.toJSON());
  }
  throw new Error("[unstorage] Cannot stringify value!");
}
const BASE64_PREFIX = "base64:";
function serializeRaw(value) {
  if (typeof value === "string") {
    return value;
  }
  return BASE64_PREFIX + base64Encode(value);
}
function deserializeRaw(value) {
  if (typeof value !== "string") {
    return value;
  }
  if (!value.startsWith(BASE64_PREFIX)) {
    return value;
  }
  return base64Decode(value.slice(BASE64_PREFIX.length));
}
function base64Decode(input) {
  if (globalThis.Buffer) {
    return Buffer.from(input, "base64");
  }
  return Uint8Array.from(
    globalThis.atob(input),
    (c) => c.codePointAt(0)
  );
}
function base64Encode(input) {
  if (globalThis.Buffer) {
    return Buffer.from(input).toString("base64");
  }
  return globalThis.btoa(String.fromCodePoint(...input));
}

const storageKeyProperties = [
  "has",
  "hasItem",
  "get",
  "getItem",
  "getItemRaw",
  "set",
  "setItem",
  "setItemRaw",
  "del",
  "remove",
  "removeItem",
  "getMeta",
  "setMeta",
  "removeMeta",
  "getKeys",
  "clear",
  "mount",
  "unmount"
];
function prefixStorage(storage, base) {
  base = normalizeBaseKey(base);
  if (!base) {
    return storage;
  }
  const nsStorage = { ...storage };
  for (const property of storageKeyProperties) {
    nsStorage[property] = (key = "", ...args) => (
      // @ts-ignore
      storage[property](base + key, ...args)
    );
  }
  nsStorage.getKeys = (key = "", ...arguments_) => storage.getKeys(base + key, ...arguments_).then((keys) => keys.map((key2) => key2.slice(base.length)));
  nsStorage.keys = nsStorage.getKeys;
  nsStorage.getItems = async (items, commonOptions) => {
    const prefixedItems = items.map(
      (item) => typeof item === "string" ? base + item : { ...item, key: base + item.key }
    );
    const results = await storage.getItems(prefixedItems, commonOptions);
    return results.map((entry) => ({
      key: entry.key.slice(base.length),
      value: entry.value
    }));
  };
  nsStorage.setItems = async (items, commonOptions) => {
    const prefixedItems = items.map((item) => ({
      key: base + item.key,
      value: item.value,
      options: item.options
    }));
    return storage.setItems(prefixedItems, commonOptions);
  };
  return nsStorage;
}
function normalizeKey$1(key) {
  if (!key) {
    return "";
  }
  return key.split("?")[0]?.replace(/[/\\]/g, ":").replace(/:+/g, ":").replace(/^:|:$/g, "") || "";
}
function joinKeys(...keys) {
  return normalizeKey$1(keys.join(":"));
}
function normalizeBaseKey(base) {
  base = normalizeKey$1(base);
  return base ? base + ":" : "";
}
function filterKeyByDepth(key, depth) {
  if (depth === void 0) {
    return true;
  }
  let substrCount = 0;
  let index = key.indexOf(":");
  while (index > -1) {
    substrCount++;
    index = key.indexOf(":", index + 1);
  }
  return substrCount <= depth;
}
function filterKeyByBase(key, base) {
  if (base) {
    return key.startsWith(base) && key[key.length - 1] !== "$";
  }
  return key[key.length - 1] !== "$";
}

function defineDriver$1(factory) {
  return factory;
}

const DRIVER_NAME$1 = "memory";
const memory = defineDriver$1(() => {
  const data = /* @__PURE__ */ new Map();
  return {
    name: DRIVER_NAME$1,
    getInstance: () => data,
    hasItem(key) {
      return data.has(key);
    },
    getItem(key) {
      return data.get(key) ?? null;
    },
    getItemRaw(key) {
      return data.get(key) ?? null;
    },
    setItem(key, value) {
      data.set(key, value);
    },
    setItemRaw(key, value) {
      data.set(key, value);
    },
    removeItem(key) {
      data.delete(key);
    },
    getKeys() {
      return [...data.keys()];
    },
    clear() {
      data.clear();
    },
    dispose() {
      data.clear();
    }
  };
});

function createStorage(options = {}) {
  const context = {
    mounts: { "": options.driver || memory() },
    mountpoints: [""],
    watching: false,
    watchListeners: [],
    unwatch: {}
  };
  const getMount = (key) => {
    for (const base of context.mountpoints) {
      if (key.startsWith(base)) {
        return {
          base,
          relativeKey: key.slice(base.length),
          driver: context.mounts[base]
        };
      }
    }
    return {
      base: "",
      relativeKey: key,
      driver: context.mounts[""]
    };
  };
  const getMounts = (base, includeParent) => {
    return context.mountpoints.filter(
      (mountpoint) => mountpoint.startsWith(base) || includeParent && base.startsWith(mountpoint)
    ).map((mountpoint) => ({
      relativeBase: base.length > mountpoint.length ? base.slice(mountpoint.length) : void 0,
      mountpoint,
      driver: context.mounts[mountpoint]
    }));
  };
  const onChange = (event, key) => {
    if (!context.watching) {
      return;
    }
    key = normalizeKey$1(key);
    for (const listener of context.watchListeners) {
      listener(event, key);
    }
  };
  const startWatch = async () => {
    if (context.watching) {
      return;
    }
    context.watching = true;
    for (const mountpoint in context.mounts) {
      context.unwatch[mountpoint] = await watch(
        context.mounts[mountpoint],
        onChange,
        mountpoint
      );
    }
  };
  const stopWatch = async () => {
    if (!context.watching) {
      return;
    }
    for (const mountpoint in context.unwatch) {
      await context.unwatch[mountpoint]();
    }
    context.unwatch = {};
    context.watching = false;
  };
  const runBatch = (items, commonOptions, cb) => {
    const batches = /* @__PURE__ */ new Map();
    const getBatch = (mount) => {
      let batch = batches.get(mount.base);
      if (!batch) {
        batch = {
          driver: mount.driver,
          base: mount.base,
          items: []
        };
        batches.set(mount.base, batch);
      }
      return batch;
    };
    for (const item of items) {
      const isStringItem = typeof item === "string";
      const key = normalizeKey$1(isStringItem ? item : item.key);
      const value = isStringItem ? void 0 : item.value;
      const options2 = isStringItem || !item.options ? commonOptions : { ...commonOptions, ...item.options };
      const mount = getMount(key);
      getBatch(mount).items.push({
        key,
        value,
        relativeKey: mount.relativeKey,
        options: options2
      });
    }
    return Promise.all([...batches.values()].map((batch) => cb(batch))).then(
      (r) => r.flat()
    );
  };
  const storage = {
    // Item
    hasItem(key, opts = {}) {
      key = normalizeKey$1(key);
      const { relativeKey, driver } = getMount(key);
      return asyncCall(driver.hasItem, relativeKey, opts);
    },
    getItem(key, opts = {}) {
      key = normalizeKey$1(key);
      const { relativeKey, driver } = getMount(key);
      return asyncCall(driver.getItem, relativeKey, opts).then(
        (value) => destr(value)
      );
    },
    getItems(items, commonOptions = {}) {
      return runBatch(items, commonOptions, (batch) => {
        if (batch.driver.getItems) {
          return asyncCall(
            batch.driver.getItems,
            batch.items.map((item) => ({
              key: item.relativeKey,
              options: item.options
            })),
            commonOptions
          ).then(
            (r) => r.map((item) => ({
              key: joinKeys(batch.base, item.key),
              value: destr(item.value)
            }))
          );
        }
        return Promise.all(
          batch.items.map((item) => {
            return asyncCall(
              batch.driver.getItem,
              item.relativeKey,
              item.options
            ).then((value) => ({
              key: item.key,
              value: destr(value)
            }));
          })
        );
      });
    },
    getItemRaw(key, opts = {}) {
      key = normalizeKey$1(key);
      const { relativeKey, driver } = getMount(key);
      if (driver.getItemRaw) {
        return asyncCall(driver.getItemRaw, relativeKey, opts);
      }
      return asyncCall(driver.getItem, relativeKey, opts).then(
        (value) => deserializeRaw(value)
      );
    },
    async setItem(key, value, opts = {}) {
      if (value === void 0) {
        return storage.removeItem(key);
      }
      key = normalizeKey$1(key);
      const { relativeKey, driver } = getMount(key);
      if (!driver.setItem) {
        return;
      }
      await asyncCall(driver.setItem, relativeKey, stringify(value), opts);
      if (!driver.watch) {
        onChange("update", key);
      }
    },
    async setItems(items, commonOptions) {
      await runBatch(items, commonOptions, async (batch) => {
        if (batch.driver.setItems) {
          return asyncCall(
            batch.driver.setItems,
            batch.items.map((item) => ({
              key: item.relativeKey,
              value: stringify(item.value),
              options: item.options
            })),
            commonOptions
          );
        }
        if (!batch.driver.setItem) {
          return;
        }
        await Promise.all(
          batch.items.map((item) => {
            return asyncCall(
              batch.driver.setItem,
              item.relativeKey,
              stringify(item.value),
              item.options
            );
          })
        );
      });
    },
    async setItemRaw(key, value, opts = {}) {
      if (value === void 0) {
        return storage.removeItem(key, opts);
      }
      key = normalizeKey$1(key);
      const { relativeKey, driver } = getMount(key);
      if (driver.setItemRaw) {
        await asyncCall(driver.setItemRaw, relativeKey, value, opts);
      } else if (driver.setItem) {
        await asyncCall(driver.setItem, relativeKey, serializeRaw(value), opts);
      } else {
        return;
      }
      if (!driver.watch) {
        onChange("update", key);
      }
    },
    async removeItem(key, opts = {}) {
      if (typeof opts === "boolean") {
        opts = { removeMeta: opts };
      }
      key = normalizeKey$1(key);
      const { relativeKey, driver } = getMount(key);
      if (!driver.removeItem) {
        return;
      }
      await asyncCall(driver.removeItem, relativeKey, opts);
      if (opts.removeMeta || opts.removeMata) {
        await asyncCall(driver.removeItem, relativeKey + "$", opts);
      }
      if (!driver.watch) {
        onChange("remove", key);
      }
    },
    // Meta
    async getMeta(key, opts = {}) {
      if (typeof opts === "boolean") {
        opts = { nativeOnly: opts };
      }
      key = normalizeKey$1(key);
      const { relativeKey, driver } = getMount(key);
      const meta = /* @__PURE__ */ Object.create(null);
      if (driver.getMeta) {
        Object.assign(meta, await asyncCall(driver.getMeta, relativeKey, opts));
      }
      if (!opts.nativeOnly) {
        const value = await asyncCall(
          driver.getItem,
          relativeKey + "$",
          opts
        ).then((value_) => destr(value_));
        if (value && typeof value === "object") {
          if (typeof value.atime === "string") {
            value.atime = new Date(value.atime);
          }
          if (typeof value.mtime === "string") {
            value.mtime = new Date(value.mtime);
          }
          Object.assign(meta, value);
        }
      }
      return meta;
    },
    setMeta(key, value, opts = {}) {
      return this.setItem(key + "$", value, opts);
    },
    removeMeta(key, opts = {}) {
      return this.removeItem(key + "$", opts);
    },
    // Keys
    async getKeys(base, opts = {}) {
      base = normalizeBaseKey(base);
      const mounts = getMounts(base, true);
      let maskedMounts = [];
      const allKeys = [];
      let allMountsSupportMaxDepth = true;
      for (const mount of mounts) {
        if (!mount.driver.flags?.maxDepth) {
          allMountsSupportMaxDepth = false;
        }
        const rawKeys = await asyncCall(
          mount.driver.getKeys,
          mount.relativeBase,
          opts
        );
        for (const key of rawKeys) {
          const fullKey = mount.mountpoint + normalizeKey$1(key);
          if (!maskedMounts.some((p) => fullKey.startsWith(p))) {
            allKeys.push(fullKey);
          }
        }
        maskedMounts = [
          mount.mountpoint,
          ...maskedMounts.filter((p) => !p.startsWith(mount.mountpoint))
        ];
      }
      const shouldFilterByDepth = opts.maxDepth !== void 0 && !allMountsSupportMaxDepth;
      return allKeys.filter(
        (key) => (!shouldFilterByDepth || filterKeyByDepth(key, opts.maxDepth)) && filterKeyByBase(key, base)
      );
    },
    // Utils
    async clear(base, opts = {}) {
      base = normalizeBaseKey(base);
      await Promise.all(
        getMounts(base, false).map(async (m) => {
          if (m.driver.clear) {
            return asyncCall(m.driver.clear, m.relativeBase, opts);
          }
          if (m.driver.removeItem) {
            const keys = await m.driver.getKeys(m.relativeBase || "", opts);
            return Promise.all(
              keys.map((key) => m.driver.removeItem(key, opts))
            );
          }
        })
      );
    },
    async dispose() {
      await Promise.all(
        Object.values(context.mounts).map((driver) => dispose(driver))
      );
    },
    async watch(callback) {
      await startWatch();
      context.watchListeners.push(callback);
      return async () => {
        context.watchListeners = context.watchListeners.filter(
          (listener) => listener !== callback
        );
        if (context.watchListeners.length === 0) {
          await stopWatch();
        }
      };
    },
    async unwatch() {
      context.watchListeners = [];
      await stopWatch();
    },
    // Mount
    mount(base, driver) {
      base = normalizeBaseKey(base);
      if (base && context.mounts[base]) {
        throw new Error(`already mounted at ${base}`);
      }
      if (base) {
        context.mountpoints.push(base);
        context.mountpoints.sort((a, b) => b.length - a.length);
      }
      context.mounts[base] = driver;
      if (context.watching) {
        Promise.resolve(watch(driver, onChange, base)).then((unwatcher) => {
          context.unwatch[base] = unwatcher;
        }).catch(console.error);
      }
      return storage;
    },
    async unmount(base, _dispose = true) {
      base = normalizeBaseKey(base);
      if (!base || !context.mounts[base]) {
        return;
      }
      if (context.watching && base in context.unwatch) {
        context.unwatch[base]?.();
        delete context.unwatch[base];
      }
      if (_dispose) {
        await dispose(context.mounts[base]);
      }
      context.mountpoints = context.mountpoints.filter((key) => key !== base);
      delete context.mounts[base];
    },
    getMount(key = "") {
      key = normalizeKey$1(key) + ":";
      const m = getMount(key);
      return {
        driver: m.driver,
        base: m.base
      };
    },
    getMounts(base = "", opts = {}) {
      base = normalizeKey$1(base);
      const mounts = getMounts(base, opts.parents);
      return mounts.map((m) => ({
        driver: m.driver,
        base: m.mountpoint
      }));
    },
    // Aliases
    keys: (base, opts = {}) => storage.getKeys(base, opts),
    get: (key, opts = {}) => storage.getItem(key, opts),
    set: (key, value, opts = {}) => storage.setItem(key, value, opts),
    has: (key, opts = {}) => storage.hasItem(key, opts),
    del: (key, opts = {}) => storage.removeItem(key, opts),
    remove: (key, opts = {}) => storage.removeItem(key, opts)
  };
  return storage;
}
function watch(driver, onChange, base) {
  return driver.watch ? driver.watch((event, key) => onChange(event, base + key)) : () => {
  };
}
async function dispose(driver) {
  if (typeof driver.dispose === "function") {
    await asyncCall(driver.dispose);
  }
}

const _assets = {

};

const normalizeKey = function normalizeKey(key) {
  if (!key) {
    return "";
  }
  return key.split("?")[0]?.replace(/[/\\]/g, ":").replace(/:+/g, ":").replace(/^:|:$/g, "") || "";
};

const assets$1 = {
  getKeys() {
    return Promise.resolve(Object.keys(_assets))
  },
  hasItem (id) {
    id = normalizeKey(id);
    return Promise.resolve(id in _assets)
  },
  getItem (id) {
    id = normalizeKey(id);
    return Promise.resolve(_assets[id] ? _assets[id].import() : null)
  },
  getMeta (id) {
    id = normalizeKey(id);
    return Promise.resolve(_assets[id] ? _assets[id].meta : {})
  }
};

function defineDriver(factory) {
  return factory;
}
function createError(driver, message, opts) {
  const err = new Error(`[unstorage] [${driver}] ${message}`, opts);
  if (Error.captureStackTrace) {
    Error.captureStackTrace(err, createError);
  }
  return err;
}
function createRequiredError(driver, name) {
  if (Array.isArray(name)) {
    return createError(
      driver,
      `Missing some of the required options ${name.map((n) => "`" + n + "`").join(", ")}`
    );
  }
  return createError(driver, `Missing required option \`${name}\`.`);
}

function ignoreNotfound(err) {
  return err.code === "ENOENT" || err.code === "EISDIR" ? null : err;
}
function ignoreExists(err) {
  return err.code === "EEXIST" ? null : err;
}
async function writeFile(path, data, encoding) {
  await ensuredir(dirname$1(path));
  return promises.writeFile(path, data, encoding);
}
function readFile(path, encoding) {
  return promises.readFile(path, encoding).catch(ignoreNotfound);
}
function unlink(path) {
  return promises.unlink(path).catch(ignoreNotfound);
}
function readdir(dir) {
  return promises.readdir(dir, { withFileTypes: true }).catch(ignoreNotfound).then((r) => r || []);
}
async function ensuredir(dir) {
  if (existsSync(dir)) {
    return;
  }
  await ensuredir(dirname$1(dir)).catch(ignoreExists);
  await promises.mkdir(dir).catch(ignoreExists);
}
async function readdirRecursive(dir, ignore, maxDepth) {
  if (ignore && ignore(dir)) {
    return [];
  }
  const entries = await readdir(dir);
  const files = [];
  await Promise.all(
    entries.map(async (entry) => {
      const entryPath = resolve$1(dir, entry.name);
      if (entry.isDirectory()) {
        if (maxDepth === void 0 || maxDepth > 0) {
          const dirFiles = await readdirRecursive(
            entryPath,
            ignore,
            maxDepth === void 0 ? void 0 : maxDepth - 1
          );
          files.push(...dirFiles.map((f) => entry.name + "/" + f));
        }
      } else {
        if (!(ignore && ignore(entry.name))) {
          files.push(entry.name);
        }
      }
    })
  );
  return files;
}
async function rmRecursive(dir) {
  const entries = await readdir(dir);
  await Promise.all(
    entries.map((entry) => {
      const entryPath = resolve$1(dir, entry.name);
      if (entry.isDirectory()) {
        return rmRecursive(entryPath).then(() => promises.rmdir(entryPath));
      } else {
        return promises.unlink(entryPath);
      }
    })
  );
}

const PATH_TRAVERSE_RE = /\.\.:|\.\.$/;
const DRIVER_NAME = "fs-lite";
const unstorage_47drivers_47fs_45lite = defineDriver((opts = {}) => {
  if (!opts.base) {
    throw createRequiredError(DRIVER_NAME, "base");
  }
  opts.base = resolve$1(opts.base);
  const r = (key) => {
    if (PATH_TRAVERSE_RE.test(key)) {
      throw createError(
        DRIVER_NAME,
        `Invalid key: ${JSON.stringify(key)}. It should not contain .. segments`
      );
    }
    const resolved = join(opts.base, key.replace(/:/g, "/"));
    return resolved;
  };
  return {
    name: DRIVER_NAME,
    options: opts,
    flags: {
      maxDepth: true
    },
    hasItem(key) {
      return existsSync(r(key));
    },
    getItem(key) {
      return readFile(r(key), "utf8");
    },
    getItemRaw(key) {
      return readFile(r(key));
    },
    async getMeta(key) {
      const { atime, mtime, size, birthtime, ctime } = await promises.stat(r(key)).catch(() => ({}));
      return { atime, mtime, size, birthtime, ctime };
    },
    setItem(key, value) {
      if (opts.readOnly) {
        return;
      }
      return writeFile(r(key), value, "utf8");
    },
    setItemRaw(key, value) {
      if (opts.readOnly) {
        return;
      }
      return writeFile(r(key), value);
    },
    removeItem(key) {
      if (opts.readOnly) {
        return;
      }
      return unlink(r(key));
    },
    getKeys(_base, topts) {
      return readdirRecursive(r("."), opts.ignore, topts?.maxDepth);
    },
    async clear() {
      if (opts.readOnly || opts.noClear) {
        return;
      }
      await rmRecursive(r("."));
    }
  };
});

const storage = createStorage({});

storage.mount('/assets', assets$1);

storage.mount('data', unstorage_47drivers_47fs_45lite({"driver":"fsLite","base":"./.data/kv"}));

function useStorage(base = "") {
  return base ? prefixStorage(storage, base) : storage;
}

const e=globalThis.process?.getBuiltinModule?.("crypto")?.hash,r="sha256",s="base64url";function digest(t){if(e)return e(r,t,s);const o=createHash(r).update(t);return globalThis.process?.versions?.webcontainer?o.digest().toString(s):o.digest(s)}

const Hasher = /* @__PURE__ */ (() => {
  class Hasher2 {
    buff = "";
    #context = /* @__PURE__ */ new Map();
    write(str) {
      this.buff += str;
    }
    dispatch(value) {
      const type = value === null ? "null" : typeof value;
      return this[type](value);
    }
    object(object) {
      if (object && typeof object.toJSON === "function") {
        return this.object(object.toJSON());
      }
      const objString = Object.prototype.toString.call(object);
      let objType = "";
      const objectLength = objString.length;
      objType = objectLength < 10 ? "unknown:[" + objString + "]" : objString.slice(8, objectLength - 1);
      objType = objType.toLowerCase();
      let objectNumber = null;
      if ((objectNumber = this.#context.get(object)) === void 0) {
        this.#context.set(object, this.#context.size);
      } else {
        return this.dispatch("[CIRCULAR:" + objectNumber + "]");
      }
      if (typeof Buffer !== "undefined" && Buffer.isBuffer && Buffer.isBuffer(object)) {
        this.write("buffer:");
        return this.write(object.toString("utf8"));
      }
      if (objType !== "object" && objType !== "function" && objType !== "asyncfunction") {
        if (this[objType]) {
          this[objType](object);
        } else {
          this.unknown(object, objType);
        }
      } else {
        const keys = Object.keys(object).sort();
        const extraKeys = [];
        this.write("object:" + (keys.length + extraKeys.length) + ":");
        const dispatchForKey = (key) => {
          this.dispatch(key);
          this.write(":");
          this.dispatch(object[key]);
          this.write(",");
        };
        for (const key of keys) {
          dispatchForKey(key);
        }
        for (const key of extraKeys) {
          dispatchForKey(key);
        }
      }
    }
    array(arr, unordered) {
      unordered = unordered === void 0 ? false : unordered;
      this.write("array:" + arr.length + ":");
      if (!unordered || arr.length <= 1) {
        for (const entry of arr) {
          this.dispatch(entry);
        }
        return;
      }
      const contextAdditions = /* @__PURE__ */ new Map();
      const entries = arr.map((entry) => {
        const hasher = new Hasher2();
        hasher.dispatch(entry);
        for (const [key, value] of hasher.#context) {
          contextAdditions.set(key, value);
        }
        return hasher.toString();
      });
      this.#context = contextAdditions;
      entries.sort();
      return this.array(entries, false);
    }
    date(date) {
      return this.write("date:" + date.toJSON());
    }
    symbol(sym) {
      return this.write("symbol:" + sym.toString());
    }
    unknown(value, type) {
      this.write(type);
      if (!value) {
        return;
      }
      this.write(":");
      if (value && typeof value.entries === "function") {
        return this.array(
          [...value.entries()],
          true
          /* ordered */
        );
      }
    }
    error(err) {
      return this.write("error:" + err.toString());
    }
    boolean(bool) {
      return this.write("bool:" + bool);
    }
    string(string) {
      this.write("string:" + string.length + ":");
      this.write(string);
    }
    function(fn) {
      this.write("fn:");
      if (isNativeFunction(fn)) {
        this.dispatch("[native]");
      } else {
        this.dispatch(fn.toString());
      }
    }
    number(number) {
      return this.write("number:" + number);
    }
    null() {
      return this.write("Null");
    }
    undefined() {
      return this.write("Undefined");
    }
    regexp(regex) {
      return this.write("regex:" + regex.toString());
    }
    arraybuffer(arr) {
      this.write("arraybuffer:");
      return this.dispatch(new Uint8Array(arr));
    }
    url(url) {
      return this.write("url:" + url.toString());
    }
    map(map) {
      this.write("map:");
      const arr = [...map];
      return this.array(arr, false);
    }
    set(set) {
      this.write("set:");
      const arr = [...set];
      return this.array(arr, false);
    }
    bigint(number) {
      return this.write("bigint:" + number.toString());
    }
  }
  for (const type of [
    "uint8array",
    "uint8clampedarray",
    "unt8array",
    "uint16array",
    "unt16array",
    "uint32array",
    "unt32array",
    "float32array",
    "float64array"
  ]) {
    Hasher2.prototype[type] = function(arr) {
      this.write(type + ":");
      return this.array([...arr], false);
    };
  }
  function isNativeFunction(f) {
    if (typeof f !== "function") {
      return false;
    }
    return Function.prototype.toString.call(f).slice(
      -15
      /* "[native code] }".length */
    ) === "[native code] }";
  }
  return Hasher2;
})();
function serialize(object) {
  const hasher = new Hasher();
  hasher.dispatch(object);
  return hasher.buff;
}
function hash(value) {
  return digest(typeof value === "string" ? value : serialize(value)).replace(/[-_]/g, "").slice(0, 10);
}

function defaultCacheOptions() {
  return {
    name: "_",
    base: "/cache",
    swr: true,
    maxAge: 1
  };
}
function defineCachedFunction(fn, opts = {}) {
  opts = { ...defaultCacheOptions(), ...opts };
  const pending = {};
  const group = opts.group || "nitro/functions";
  const name = opts.name || fn.name || "_";
  const integrity = opts.integrity || hash([fn, opts]);
  const validate = opts.validate || ((entry) => entry.value !== void 0);
  async function get(key, resolver, shouldInvalidateCache, event) {
    const cacheKey = [opts.base, group, name, key + ".json"].filter(Boolean).join(":").replace(/:\/$/, ":index");
    let entry = await useStorage().getItem(cacheKey).catch((error) => {
      console.error(`[cache] Cache read error.`, error);
      useNitroApp().captureError(error, { event, tags: ["cache"] });
    }) || {};
    if (typeof entry !== "object") {
      entry = {};
      const error = new Error("Malformed data read from cache.");
      console.error("[cache]", error);
      useNitroApp().captureError(error, { event, tags: ["cache"] });
    }
    const ttl = (opts.maxAge ?? 0) * 1e3;
    if (ttl) {
      entry.expires = Date.now() + ttl;
    }
    const expired = shouldInvalidateCache || entry.integrity !== integrity || ttl && Date.now() - (entry.mtime || 0) > ttl || validate(entry) === false;
    const _resolve = async () => {
      const isPending = pending[key];
      if (!isPending) {
        if (entry.value !== void 0 && (opts.staleMaxAge || 0) >= 0 && opts.swr === false) {
          entry.value = void 0;
          entry.integrity = void 0;
          entry.mtime = void 0;
          entry.expires = void 0;
        }
        pending[key] = Promise.resolve(resolver());
      }
      try {
        entry.value = await pending[key];
      } catch (error) {
        if (!isPending) {
          delete pending[key];
        }
        throw error;
      }
      if (!isPending) {
        entry.mtime = Date.now();
        entry.integrity = integrity;
        delete pending[key];
        if (validate(entry) !== false) {
          let setOpts;
          if (opts.maxAge && !opts.swr) {
            setOpts = { ttl: opts.maxAge };
          }
          const promise = useStorage().setItem(cacheKey, entry, setOpts).catch((error) => {
            console.error(`[cache] Cache write error.`, error);
            useNitroApp().captureError(error, { event, tags: ["cache"] });
          });
          if (event?.waitUntil) {
            event.waitUntil(promise);
          }
        }
      }
    };
    const _resolvePromise = expired ? _resolve() : Promise.resolve();
    if (entry.value === void 0) {
      await _resolvePromise;
    } else if (expired && event && event.waitUntil) {
      event.waitUntil(_resolvePromise);
    }
    if (opts.swr && validate(entry) !== false) {
      _resolvePromise.catch((error) => {
        console.error(`[cache] SWR handler error.`, error);
        useNitroApp().captureError(error, { event, tags: ["cache"] });
      });
      return entry;
    }
    return _resolvePromise.then(() => entry);
  }
  return async (...args) => {
    const shouldBypassCache = await opts.shouldBypassCache?.(...args);
    if (shouldBypassCache) {
      return fn(...args);
    }
    const key = await (opts.getKey || getKey)(...args);
    const shouldInvalidateCache = await opts.shouldInvalidateCache?.(...args);
    const entry = await get(
      key,
      () => fn(...args),
      shouldInvalidateCache,
      args[0] && isEvent(args[0]) ? args[0] : void 0
    );
    let value = entry.value;
    if (opts.transform) {
      value = await opts.transform(entry, ...args) || value;
    }
    return value;
  };
}
function cachedFunction(fn, opts = {}) {
  return defineCachedFunction(fn, opts);
}
function getKey(...args) {
  return args.length > 0 ? hash(args) : "";
}
function escapeKey(key) {
  return String(key).replace(/\W/g, "");
}
function defineCachedEventHandler(handler, opts = defaultCacheOptions()) {
  const variableHeaderNames = (opts.varies || []).filter(Boolean).map((h) => h.toLowerCase()).sort();
  const _opts = {
    ...opts,
    getKey: async (event) => {
      const customKey = await opts.getKey?.(event);
      if (customKey) {
        return escapeKey(customKey);
      }
      const _path = event.node.req.originalUrl || event.node.req.url || event.path;
      let _pathname;
      try {
        _pathname = escapeKey(decodeURI(parseURL(_path).pathname)).slice(0, 16) || "index";
      } catch {
        _pathname = "-";
      }
      const _hashedPath = `${_pathname}.${hash(_path)}`;
      const _headers = variableHeaderNames.map((header) => [header, event.node.req.headers[header]]).map(([name, value]) => `${escapeKey(name)}.${hash(value)}`);
      return [_hashedPath, ..._headers].join(":");
    },
    validate: (entry) => {
      if (!entry.value) {
        return false;
      }
      if (entry.value.code >= 400) {
        return false;
      }
      if (entry.value.body === void 0) {
        return false;
      }
      if (entry.value.headers.etag === "undefined" || entry.value.headers["last-modified"] === "undefined") {
        return false;
      }
      return true;
    },
    group: opts.group || "nitro/handlers",
    integrity: opts.integrity || hash([handler, opts])
  };
  const _cachedHandler = cachedFunction(
    async (incomingEvent) => {
      const variableHeaders = {};
      for (const header of variableHeaderNames) {
        const value = incomingEvent.node.req.headers[header];
        if (value !== void 0) {
          variableHeaders[header] = value;
        }
      }
      const reqProxy = cloneWithProxy(incomingEvent.node.req, {
        headers: variableHeaders
      });
      const resHeaders = {};
      let _resSendBody;
      const resProxy = cloneWithProxy(incomingEvent.node.res, {
        statusCode: 200,
        writableEnded: false,
        writableFinished: false,
        headersSent: false,
        closed: false,
        getHeader(name) {
          return resHeaders[name];
        },
        setHeader(name, value) {
          resHeaders[name] = value;
          return this;
        },
        getHeaderNames() {
          return Object.keys(resHeaders);
        },
        hasHeader(name) {
          return name in resHeaders;
        },
        removeHeader(name) {
          delete resHeaders[name];
        },
        getHeaders() {
          return resHeaders;
        },
        end(chunk, arg2, arg3) {
          if (typeof chunk === "string") {
            _resSendBody = chunk;
          }
          if (typeof arg2 === "function") {
            arg2();
          }
          if (typeof arg3 === "function") {
            arg3();
          }
          return this;
        },
        write(chunk, arg2, arg3) {
          if (typeof chunk === "string") {
            _resSendBody = chunk;
          }
          if (typeof arg2 === "function") {
            arg2(void 0);
          }
          if (typeof arg3 === "function") {
            arg3();
          }
          return true;
        },
        writeHead(statusCode, headers2) {
          this.statusCode = statusCode;
          if (headers2) {
            if (Array.isArray(headers2) || typeof headers2 === "string") {
              throw new TypeError("Raw headers  is not supported.");
            }
            for (const header in headers2) {
              const value = headers2[header];
              if (value !== void 0) {
                this.setHeader(
                  header,
                  value
                );
              }
            }
          }
          return this;
        }
      });
      const event = createEvent(reqProxy, resProxy);
      event.fetch = (url, fetchOptions) => fetchWithEvent(event, url, fetchOptions, {
        fetch: useNitroApp().localFetch
      });
      event.$fetch = (url, fetchOptions) => fetchWithEvent(event, url, fetchOptions, {
        fetch: globalThis.$fetch
      });
      event.waitUntil = incomingEvent.waitUntil;
      event.context = incomingEvent.context;
      event.context.cache = {
        options: _opts
      };
      const body = await handler(event) || _resSendBody;
      const headers = event.node.res.getHeaders();
      headers.etag = String(
        headers.Etag || headers.etag || `W/"${hash(body)}"`
      );
      headers["last-modified"] = String(
        headers["Last-Modified"] || headers["last-modified"] || (/* @__PURE__ */ new Date()).toUTCString()
      );
      const cacheControl = [];
      if (opts.swr) {
        if (opts.maxAge) {
          cacheControl.push(`s-maxage=${opts.maxAge}`);
        }
        if (opts.staleMaxAge) {
          cacheControl.push(`stale-while-revalidate=${opts.staleMaxAge}`);
        } else {
          cacheControl.push("stale-while-revalidate");
        }
      } else if (opts.maxAge) {
        cacheControl.push(`max-age=${opts.maxAge}`);
      }
      if (cacheControl.length > 0) {
        headers["cache-control"] = cacheControl.join(", ");
      }
      const cacheEntry = {
        code: event.node.res.statusCode,
        headers,
        body
      };
      return cacheEntry;
    },
    _opts
  );
  return defineEventHandler(async (event) => {
    if (opts.headersOnly) {
      if (handleCacheHeaders(event, { maxAge: opts.maxAge })) {
        return;
      }
      return handler(event);
    }
    const response = await _cachedHandler(
      event
    );
    if (event.node.res.headersSent || event.node.res.writableEnded) {
      return response.body;
    }
    if (handleCacheHeaders(event, {
      modifiedTime: new Date(response.headers["last-modified"]),
      etag: response.headers.etag,
      maxAge: opts.maxAge
    })) {
      return;
    }
    event.node.res.statusCode = response.code;
    for (const name in response.headers) {
      const value = response.headers[name];
      if (name === "set-cookie") {
        event.node.res.appendHeader(
          name,
          splitCookiesString(value)
        );
      } else {
        if (value !== void 0) {
          event.node.res.setHeader(name, value);
        }
      }
    }
    return response.body;
  });
}
function cloneWithProxy(obj, overrides) {
  return new Proxy(obj, {
    get(target, property, receiver) {
      if (property in overrides) {
        return overrides[property];
      }
      return Reflect.get(target, property, receiver);
    },
    set(target, property, value, receiver) {
      if (property in overrides) {
        overrides[property] = value;
        return true;
      }
      return Reflect.set(target, property, value, receiver);
    }
  });
}
const cachedEventHandler = defineCachedEventHandler;

function klona(x) {
	if (typeof x !== 'object') return x;

	var k, tmp, str=Object.prototype.toString.call(x);

	if (str === '[object Object]') {
		if (x.constructor !== Object && typeof x.constructor === 'function') {
			tmp = new x.constructor();
			for (k in x) {
				if (x.hasOwnProperty(k) && tmp[k] !== x[k]) {
					tmp[k] = klona(x[k]);
				}
			}
		} else {
			tmp = {}; // null
			for (k in x) {
				if (k === '__proto__') {
					Object.defineProperty(tmp, k, {
						value: klona(x[k]),
						configurable: true,
						enumerable: true,
						writable: true,
					});
				} else {
					tmp[k] = klona(x[k]);
				}
			}
		}
		return tmp;
	}

	if (str === '[object Array]') {
		k = x.length;
		for (tmp=Array(k); k--;) {
			tmp[k] = klona(x[k]);
		}
		return tmp;
	}

	if (str === '[object Set]') {
		tmp = new Set;
		x.forEach(function (val) {
			tmp.add(klona(val));
		});
		return tmp;
	}

	if (str === '[object Map]') {
		tmp = new Map;
		x.forEach(function (val, key) {
			tmp.set(klona(key), klona(val));
		});
		return tmp;
	}

	if (str === '[object Date]') {
		return new Date(+x);
	}

	if (str === '[object RegExp]') {
		tmp = new RegExp(x.source, x.flags);
		tmp.lastIndex = x.lastIndex;
		return tmp;
	}

	if (str === '[object DataView]') {
		return new x.constructor( klona(x.buffer) );
	}

	if (str === '[object ArrayBuffer]') {
		return x.slice(0);
	}

	// ArrayBuffer.isView(x)
	// ~> `new` bcuz `Buffer.slice` => ref
	if (str.slice(-6) === 'Array]') {
		return new x.constructor(x);
	}

	return x;
}

const inlineAppConfig = {
  "nuxt": {}
};



const appConfig = defuFn(inlineAppConfig);

const NUMBER_CHAR_RE = /\d/;
const STR_SPLITTERS = ["-", "_", "/", "."];
function isUppercase(char = "") {
  if (NUMBER_CHAR_RE.test(char)) {
    return void 0;
  }
  return char !== char.toLowerCase();
}
function splitByCase(str, separators) {
  const splitters = STR_SPLITTERS;
  const parts = [];
  if (!str || typeof str !== "string") {
    return parts;
  }
  let buff = "";
  let previousUpper;
  let previousSplitter;
  for (const char of str) {
    const isSplitter = splitters.includes(char);
    if (isSplitter === true) {
      parts.push(buff);
      buff = "";
      previousUpper = void 0;
      continue;
    }
    const isUpper = isUppercase(char);
    if (previousSplitter === false) {
      if (previousUpper === false && isUpper === true) {
        parts.push(buff);
        buff = char;
        previousUpper = isUpper;
        continue;
      }
      if (previousUpper === true && isUpper === false && buff.length > 1) {
        const lastChar = buff.at(-1);
        parts.push(buff.slice(0, Math.max(0, buff.length - 1)));
        buff = lastChar + char;
        previousUpper = isUpper;
        continue;
      }
    }
    buff += char;
    previousUpper = isUpper;
    previousSplitter = isSplitter;
  }
  parts.push(buff);
  return parts;
}
function kebabCase(str, joiner) {
  return str ? (Array.isArray(str) ? str : splitByCase(str)).map((p) => p.toLowerCase()).join(joiner) : "";
}
function snakeCase(str) {
  return kebabCase(str || "", "_");
}

function getEnv(key, opts) {
  const envKey = snakeCase(key).toUpperCase();
  return destr(
    process.env[opts.prefix + envKey] ?? process.env[opts.altPrefix + envKey]
  );
}
function _isObject(input) {
  return typeof input === "object" && !Array.isArray(input);
}
function applyEnv(obj, opts, parentKey = "") {
  for (const key in obj) {
    const subKey = parentKey ? `${parentKey}_${key}` : key;
    const envValue = getEnv(subKey, opts);
    if (_isObject(obj[key])) {
      if (_isObject(envValue)) {
        obj[key] = { ...obj[key], ...envValue };
        applyEnv(obj[key], opts, subKey);
      } else if (envValue === void 0) {
        applyEnv(obj[key], opts, subKey);
      } else {
        obj[key] = envValue ?? obj[key];
      }
    } else {
      obj[key] = envValue ?? obj[key];
    }
    if (opts.envExpansion && typeof obj[key] === "string") {
      obj[key] = _expandFromEnv(obj[key]);
    }
  }
  return obj;
}
const envExpandRx = /\{\{([^{}]*)\}\}/g;
function _expandFromEnv(value) {
  return value.replace(envExpandRx, (match, key) => {
    return process.env[key] || match;
  });
}

const _inlineRuntimeConfig = {
  "app": {
    "baseURL": "/",
    "buildId": "2f16dce3-6d7b-4f60-81d7-04137cf66de1",
    "buildAssetsDir": "/_nuxt/",
    "cdnURL": ""
  },
  "nitro": {
    "envPrefix": "NUXT_",
    "routeRules": {
      "/__nuxt_error": {
        "cache": false
      },
      "/_nuxt/builds/meta/**": {
        "headers": {
          "cache-control": "public, max-age=31536000, immutable"
        }
      },
      "/_nuxt/builds/**": {
        "headers": {
          "cache-control": "public, max-age=1, immutable"
        }
      },
      "/_nuxt/**": {
        "headers": {
          "cache-control": "public, max-age=31536000, immutable"
        }
      }
    }
  },
  "public": {
    "CTF_HOST": "cdn.contentful.com",
    "CTF_PREVIEW": false,
    "CTF_SPACE_ID": "gxu1rby54im7",
    "CTF_CDA_ACCESS_TOKEN": "QcKy1gRlFJbtTFFOlx2Y4L5OcVUEAzkrFfCavtNUiTg"
  },
  "CTF_HOST": "cdn.contentful.com"
};
const envOptions = {
  prefix: "NITRO_",
  altPrefix: _inlineRuntimeConfig.nitro.envPrefix ?? process.env.NITRO_ENV_PREFIX ?? "_",
  envExpansion: _inlineRuntimeConfig.nitro.envExpansion ?? process.env.NITRO_ENV_EXPANSION ?? false
};
const _sharedRuntimeConfig = _deepFreeze(
  applyEnv(klona(_inlineRuntimeConfig), envOptions)
);
function useRuntimeConfig(event) {
  if (!event) {
    return _sharedRuntimeConfig;
  }
  if (event.context.nitro.runtimeConfig) {
    return event.context.nitro.runtimeConfig;
  }
  const runtimeConfig = klona(_inlineRuntimeConfig);
  applyEnv(runtimeConfig, envOptions);
  event.context.nitro.runtimeConfig = runtimeConfig;
  return runtimeConfig;
}
_deepFreeze(klona(appConfig));
function _deepFreeze(object) {
  const propNames = Object.getOwnPropertyNames(object);
  for (const name of propNames) {
    const value = object[name];
    if (value && typeof value === "object") {
      _deepFreeze(value);
    }
  }
  return Object.freeze(object);
}
new Proxy(/* @__PURE__ */ Object.create(null), {
  get: (_, prop) => {
    console.warn(
      "Please use `useRuntimeConfig()` instead of accessing config directly."
    );
    const runtimeConfig = useRuntimeConfig();
    if (prop in runtimeConfig) {
      return runtimeConfig[prop];
    }
    return void 0;
  }
});

function createContext(opts = {}) {
  let currentInstance;
  let isSingleton = false;
  const checkConflict = (instance) => {
    if (currentInstance && currentInstance !== instance) {
      throw new Error("Context conflict");
    }
  };
  let als;
  if (opts.asyncContext) {
    const _AsyncLocalStorage = opts.AsyncLocalStorage || globalThis.AsyncLocalStorage;
    if (_AsyncLocalStorage) {
      als = new _AsyncLocalStorage();
    } else {
      console.warn("[unctx] `AsyncLocalStorage` is not provided.");
    }
  }
  const _getCurrentInstance = () => {
    if (als) {
      const instance = als.getStore();
      if (instance !== void 0) {
        return instance;
      }
    }
    return currentInstance;
  };
  return {
    use: () => {
      const _instance = _getCurrentInstance();
      if (_instance === void 0) {
        throw new Error("Context is not available");
      }
      return _instance;
    },
    tryUse: () => {
      return _getCurrentInstance();
    },
    set: (instance, replace) => {
      if (!replace) {
        checkConflict(instance);
      }
      currentInstance = instance;
      isSingleton = true;
    },
    unset: () => {
      currentInstance = void 0;
      isSingleton = false;
    },
    call: (instance, callback) => {
      checkConflict(instance);
      currentInstance = instance;
      try {
        return als ? als.run(instance, callback) : callback();
      } finally {
        if (!isSingleton) {
          currentInstance = void 0;
        }
      }
    },
    async callAsync(instance, callback) {
      currentInstance = instance;
      const onRestore = () => {
        currentInstance = instance;
      };
      const onLeave = () => currentInstance === instance ? onRestore : void 0;
      asyncHandlers.add(onLeave);
      try {
        const r = als ? als.run(instance, callback) : callback();
        if (!isSingleton) {
          currentInstance = void 0;
        }
        return await r;
      } finally {
        asyncHandlers.delete(onLeave);
      }
    }
  };
}
function createNamespace(defaultOpts = {}) {
  const contexts = {};
  return {
    get(key, opts = {}) {
      if (!contexts[key]) {
        contexts[key] = createContext({ ...defaultOpts, ...opts });
      }
      return contexts[key];
    }
  };
}
const _globalThis = typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : typeof global !== "undefined" ? global : {};
const globalKey = "__unctx__";
const defaultNamespace = _globalThis[globalKey] || (_globalThis[globalKey] = createNamespace());
const getContext = (key, opts = {}) => defaultNamespace.get(key, opts);
const asyncHandlersKey = "__unctx_async_handlers__";
const asyncHandlers = _globalThis[asyncHandlersKey] || (_globalThis[asyncHandlersKey] = /* @__PURE__ */ new Set());
function executeAsync(function_) {
  const restores = [];
  for (const leaveHandler of asyncHandlers) {
    const restore2 = leaveHandler();
    if (restore2) {
      restores.push(restore2);
    }
  }
  const restore = () => {
    for (const restore2 of restores) {
      restore2();
    }
  };
  let awaitable = function_();
  if (awaitable && typeof awaitable === "object" && "catch" in awaitable) {
    awaitable = awaitable.catch((error) => {
      restore();
      throw error;
    });
  }
  return [awaitable, restore];
}

const config = useRuntimeConfig();
const _routeRulesMatcher = toRouteMatcher(
  createRouter$1({ routes: config.nitro.routeRules })
);
function createRouteRulesHandler(ctx) {
  return eventHandler((event) => {
    const routeRules = getRouteRules(event);
    if (routeRules.headers) {
      setHeaders(event, routeRules.headers);
    }
    if (routeRules.redirect) {
      let target = routeRules.redirect.to;
      if (target.endsWith("/**")) {
        let targetPath = event.path;
        const strpBase = routeRules.redirect._redirectStripBase;
        if (strpBase) {
          targetPath = withoutBase(targetPath, strpBase);
        }
        target = joinURL(target.slice(0, -3), targetPath);
      } else if (event.path.includes("?")) {
        const query = getQuery$1(event.path);
        target = withQuery(target, query);
      }
      return sendRedirect(event, target, routeRules.redirect.statusCode);
    }
    if (routeRules.proxy) {
      let target = routeRules.proxy.to;
      if (target.endsWith("/**")) {
        let targetPath = event.path;
        const strpBase = routeRules.proxy._proxyStripBase;
        if (strpBase) {
          targetPath = withoutBase(targetPath, strpBase);
        }
        target = joinURL(target.slice(0, -3), targetPath);
      } else if (event.path.includes("?")) {
        const query = getQuery$1(event.path);
        target = withQuery(target, query);
      }
      return proxyRequest(event, target, {
        fetch: ctx.localFetch,
        ...routeRules.proxy
      });
    }
  });
}
function getRouteRules(event) {
  event.context._nitro = event.context._nitro || {};
  if (!event.context._nitro.routeRules) {
    event.context._nitro.routeRules = getRouteRulesForPath(
      withoutBase(event.path.split("?")[0], useRuntimeConfig().app.baseURL)
    );
  }
  return event.context._nitro.routeRules;
}
function getRouteRulesForPath(path) {
  return defu({}, ..._routeRulesMatcher.matchAll(path).reverse());
}

function _captureError(error, type) {
  console.error(`[${type}]`, error);
  useNitroApp().captureError(error, { tags: [type] });
}
function trapUnhandledNodeErrors() {
  process.on(
    "unhandledRejection",
    (error) => _captureError(error, "unhandledRejection")
  );
  process.on(
    "uncaughtException",
    (error) => _captureError(error, "uncaughtException")
  );
}
function joinHeaders(value) {
  return Array.isArray(value) ? value.join(", ") : String(value);
}
function normalizeFetchResponse(response) {
  if (!response.headers.has("set-cookie")) {
    return response;
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: normalizeCookieHeaders(response.headers)
  });
}
function normalizeCookieHeader(header = "") {
  return splitCookiesString(joinHeaders(header));
}
function normalizeCookieHeaders(headers) {
  const outgoingHeaders = new Headers();
  for (const [name, header] of headers) {
    if (name === "set-cookie") {
      for (const cookie of normalizeCookieHeader(header)) {
        outgoingHeaders.append("set-cookie", cookie);
      }
    } else {
      outgoingHeaders.set(name, joinHeaders(header));
    }
  }
  return outgoingHeaders;
}

function isJsonRequest(event) {
  if (hasReqHeader(event, "accept", "text/html")) {
    return false;
  }
  return hasReqHeader(event, "accept", "application/json") || hasReqHeader(event, "user-agent", "curl/") || hasReqHeader(event, "user-agent", "httpie/") || hasReqHeader(event, "sec-fetch-mode", "cors") || event.path.startsWith("/api/") || event.path.endsWith(".json");
}
function hasReqHeader(event, name, includes) {
  const value = getRequestHeader(event, name);
  return value && typeof value === "string" && value.toLowerCase().includes(includes);
}

const errorHandler$0 = (async function errorhandler(error, event, { defaultHandler }) {
  if (event.handled || isJsonRequest(event)) {
    return;
  }
  const defaultRes = await defaultHandler(error, event, { json: true });
  const statusCode = error.statusCode || 500;
  if (statusCode === 404 && defaultRes.status === 302) {
    setResponseHeaders(event, defaultRes.headers);
    setResponseStatus(event, defaultRes.status, defaultRes.statusText);
    return send(event, JSON.stringify(defaultRes.body, null, 2));
  }
  const errorObject = defaultRes.body;
  const url = new URL(errorObject.url);
  errorObject.url = withoutBase(url.pathname, useRuntimeConfig(event).app.baseURL) + url.search + url.hash;
  errorObject.message ||= "Server Error";
  errorObject.data ||= error.data;
  errorObject.statusMessage ||= error.statusMessage;
  delete defaultRes.headers["content-type"];
  delete defaultRes.headers["content-security-policy"];
  setResponseHeaders(event, defaultRes.headers);
  const reqHeaders = getRequestHeaders(event);
  const isRenderingError = event.path.startsWith("/__nuxt_error") || !!reqHeaders["x-nuxt-error"];
  const res = isRenderingError ? null : await useNitroApp().localFetch(
    withQuery(joinURL(useRuntimeConfig(event).app.baseURL, "/__nuxt_error"), errorObject),
    {
      headers: { ...reqHeaders, "x-nuxt-error": "true" },
      redirect: "manual"
    }
  ).catch(() => null);
  if (event.handled) {
    return;
  }
  if (!res) {
    const { template } = await import('./error-500.mjs');
    setResponseHeader(event, "Content-Type", "text/html;charset=UTF-8");
    return send(event, template(errorObject));
  }
  const html = await res.text();
  for (const [header, value] of res.headers.entries()) {
    if (header === "set-cookie") {
      appendResponseHeader(event, header, value);
      continue;
    }
    setResponseHeader(event, header, value);
  }
  setResponseStatus(event, res.status && res.status !== 200 ? res.status : defaultRes.status, res.statusText || defaultRes.statusText);
  return send(event, html);
});

function defineNitroErrorHandler(handler) {
  return handler;
}

const errorHandler$1 = defineNitroErrorHandler(
  function defaultNitroErrorHandler(error, event) {
    const res = defaultHandler(error, event);
    setResponseHeaders(event, res.headers);
    setResponseStatus(event, res.status, res.statusText);
    return send(event, JSON.stringify(res.body, null, 2));
  }
);
function defaultHandler(error, event, opts) {
  const isSensitive = error.unhandled || error.fatal;
  const statusCode = error.statusCode || 500;
  const statusMessage = error.statusMessage || "Server Error";
  const url = getRequestURL(event, { xForwardedHost: true, xForwardedProto: true });
  if (statusCode === 404) {
    const baseURL = "/";
    if (/^\/[^/]/.test(baseURL) && !url.pathname.startsWith(baseURL)) {
      const redirectTo = `${baseURL}${url.pathname.slice(1)}${url.search}`;
      return {
        status: 302,
        statusText: "Found",
        headers: { location: redirectTo },
        body: `Redirecting...`
      };
    }
  }
  if (isSensitive && !opts?.silent) {
    const tags = [error.unhandled && "[unhandled]", error.fatal && "[fatal]"].filter(Boolean).join(" ");
    console.error(`[request error] ${tags} [${event.method}] ${url}
`, error);
  }
  const headers = {
    "content-type": "application/json",
    // Prevent browser from guessing the MIME types of resources.
    "x-content-type-options": "nosniff",
    // Prevent error page from being embedded in an iframe
    "x-frame-options": "DENY",
    // Prevent browsers from sending the Referer header
    "referrer-policy": "no-referrer",
    // Disable the execution of any js
    "content-security-policy": "script-src 'none'; frame-ancestors 'none';"
  };
  setResponseStatus(event, statusCode, statusMessage);
  if (statusCode === 404 || !getResponseHeader(event, "cache-control")) {
    headers["cache-control"] = "no-cache";
  }
  const body = {
    error: true,
    url: url.href,
    statusCode,
    statusMessage,
    message: isSensitive ? "Server Error" : error.message,
    data: isSensitive ? void 0 : error.data
  };
  return {
    status: statusCode,
    statusText: statusMessage,
    headers,
    body
  };
}

const errorHandlers = [errorHandler$0, errorHandler$1];

async function errorHandler(error, event) {
  for (const handler of errorHandlers) {
    try {
      await handler(error, event, { defaultHandler });
      if (event.handled) {
        return; // Response handled
      }
    } catch(error) {
      // Handler itself thrown, log and continue
      console.error(error);
    }
  }
  // H3 will handle fallback
}

const plugins = [
  
];

const assets = {
  "/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d15-l2/CLTkvLXIbSX9eZXrSDlyHcNM\"",
    "mtime": "2026-01-08T06:14:06.093Z",
    "size": 3349,
    "path": "../public/index.html"
  },
  "/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"54b-jGz3bws+pwh8G+kyKzGsnPJrTe4\"",
    "mtime": "2026-01-08T06:14:06.210Z",
    "size": 1355,
    "path": "../public/_payload.json"
  },
  "/gallery/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"80d5-idTziXMNxbGDHH8l8VkO3jutb2I\"",
    "mtime": "2026-01-08T06:14:06.639Z",
    "size": 32981,
    "path": "../public/gallery/index.html"
  },
  "/gallery/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"55bc-VAKFqavD4jNal4C5ZGV2Zj9fLbs\"",
    "mtime": "2026-01-08T06:14:10.422Z",
    "size": 21948,
    "path": "../public/gallery/_payload.json"
  },
  "/games/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"2069b-uabe73iIJ4YduC6p7N0ESsUBTjI\"",
    "mtime": "2026-01-08T06:14:06.977Z",
    "size": 132763,
    "path": "../public/games/index.html"
  },
  "/games/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"17c7c-P4Xih8cNPoambGsy32GLxyHBSe0\"",
    "mtime": "2026-01-08T06:14:09.958Z",
    "size": 97404,
    "path": "../public/games/_payload.json"
  },
  "/stats/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"a5e-shYzj3dQWskj1Nre9nx6wRxEIOQ\"",
    "mtime": "2026-01-08T06:14:06.607Z",
    "size": 2654,
    "path": "../public/stats/index.html"
  },
  "/stats/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"a21-BQk693RX/aCAxwhjyDy1W4JBI4A\"",
    "mtime": "2026-01-08T06:14:06.296Z",
    "size": 2593,
    "path": "../public/stats/_payload.json"
  },
  "/systems/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"10e9-yT2rQ1sDKEXNGyf+ZeCX8P2bKNY\"",
    "mtime": "2026-01-08T06:14:06.477Z",
    "size": 4329,
    "path": "../public/systems/index.html"
  },
  "/systems/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"b7d-lK+iAJ5Wgnm+Z3BIfmXQPuv0hBE\"",
    "mtime": "2026-01-08T06:14:10.068Z",
    "size": 2941,
    "path": "../public/systems/_payload.json"
  },
  "/_nuxt/5JkYTT3_.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"d73-IvIxnjfzukl2Tix9vsLgP3Xnj4Q\"",
    "mtime": "2026-01-08T06:14:01.435Z",
    "size": 3443,
    "path": "../public/_nuxt/5JkYTT3_.js"
  },
  "/_nuxt/B5frNqD5.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1192-7qNC1vtPSfoZUl5aRtDEs2TkTYg\"",
    "mtime": "2026-01-08T06:14:01.435Z",
    "size": 4498,
    "path": "../public/_nuxt/B5frNqD5.js"
  },
  "/_nuxt/BBZElu4H.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"44c1d-GuDe2l5SYI9u5+hGmmJqL4B4gD0\"",
    "mtime": "2026-01-08T06:14:01.435Z",
    "size": 281629,
    "path": "../public/_nuxt/BBZElu4H.js"
  },
  "/_nuxt/BcUGUDmH.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"108e-+tw76EqXAgdjPW4OjkW8cssYjO4\"",
    "mtime": "2026-01-08T06:14:01.435Z",
    "size": 4238,
    "path": "../public/_nuxt/BcUGUDmH.js"
  },
  "/_nuxt/BDBL0v1s.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"13f1-F15+oYir7HmFk+5pVMDNPTRQ55U\"",
    "mtime": "2026-01-08T06:14:01.435Z",
    "size": 5105,
    "path": "../public/_nuxt/BDBL0v1s.js"
  },
  "/_nuxt/BiSYcTYW.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1ff-RqIM6DsdKnoY1jeF9SuvhlYytzI\"",
    "mtime": "2026-01-08T06:14:01.435Z",
    "size": 511,
    "path": "../public/_nuxt/BiSYcTYW.js"
  },
  "/_nuxt/By9Vomb5.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"ea6-pHFBjd8jPXlqpDpvFGUUXi9Pqpc\"",
    "mtime": "2026-01-08T06:14:01.434Z",
    "size": 3750,
    "path": "../public/_nuxt/By9Vomb5.js"
  },
  "/_nuxt/C3-fu-dz.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"2737-m6MRgGk4QedmnEslld8Mw5SYZFw\"",
    "mtime": "2026-01-08T06:14:01.435Z",
    "size": 10039,
    "path": "../public/_nuxt/C3-fu-dz.js"
  },
  "/_nuxt/C3ascW_E.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"37a-2PkO5tJBmVKWnf7fXF9t+Ly7p6U\"",
    "mtime": "2026-01-08T06:14:01.435Z",
    "size": 890,
    "path": "../public/_nuxt/C3ascW_E.js"
  },
  "/_nuxt/CCah1w5J.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"d3e-rGc12HaOjhc7xqvWJqTAP7GiJTA\"",
    "mtime": "2026-01-08T06:14:01.435Z",
    "size": 3390,
    "path": "../public/_nuxt/CCah1w5J.js"
  },
  "/_nuxt/CdtAEXek.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"3d640-2e+nBYeTpD05DmWwFe/tGCi4PZ0\"",
    "mtime": "2026-01-08T06:14:01.435Z",
    "size": 251456,
    "path": "../public/_nuxt/CdtAEXek.js"
  },
  "/_nuxt/CkHy7J42.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"21c2-BcMUm3EYHXkscXffhWqIXcNwDt0\"",
    "mtime": "2026-01-08T06:14:01.435Z",
    "size": 8642,
    "path": "../public/_nuxt/CkHy7J42.js"
  },
  "/_nuxt/D0k9heKV.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"dd0-mxDRelpKxNDRlzpdx7nj03BqXnI\"",
    "mtime": "2026-01-08T06:14:01.435Z",
    "size": 3536,
    "path": "../public/_nuxt/D0k9heKV.js"
  },
  "/_nuxt/D2TpY2px.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1212-cTRUOSuzxKpVizLRPbzc23f8yO0\"",
    "mtime": "2026-01-08T06:14:01.435Z",
    "size": 4626,
    "path": "../public/_nuxt/D2TpY2px.js"
  },
  "/_nuxt/D48uTKFM.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"22a30-ipDN3JjGPW314eFZLPY8OLktFfc\"",
    "mtime": "2026-01-08T06:14:01.435Z",
    "size": 141872,
    "path": "../public/_nuxt/D48uTKFM.js"
  },
  "/_nuxt/Do91pP82.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"2c65-s8vhIvfANt11w2p+FpZzBy0IyeU\"",
    "mtime": "2026-01-08T06:14:01.434Z",
    "size": 11365,
    "path": "../public/_nuxt/Do91pP82.js"
  },
  "/_nuxt/DsidGJoe.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1bc5-KK+IbSOnlV1/xn7/HsGbo3fJkqE\"",
    "mtime": "2026-01-08T06:14:01.435Z",
    "size": 7109,
    "path": "../public/_nuxt/DsidGJoe.js"
  },
  "/_nuxt/error-404.CYUhy3y9.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"dca-005xQIrTNdE7LUqKJ7YOCC8lzEw\"",
    "mtime": "2026-01-08T06:14:01.432Z",
    "size": 3530,
    "path": "../public/_nuxt/error-404.CYUhy3y9.css"
  },
  "/_nuxt/error-500.CVLkTsZM.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"75a-W5VxOFBjAs2NvcF8lJBDWJ0iI/o\"",
    "mtime": "2026-01-08T06:14:01.434Z",
    "size": 1882,
    "path": "../public/_nuxt/error-500.CVLkTsZM.css"
  },
  "/_nuxt/JxbDBjlQ.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"d3e-oLo4NB2NGaHqWDcQjWIBUGZfAEA\"",
    "mtime": "2026-01-08T06:14:01.435Z",
    "size": 3390,
    "path": "../public/_nuxt/JxbDBjlQ.js"
  },
  "/_nuxt/p7noJKId.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"2038-gG0h2AyDLVjDhcECBY82jOlZ4Rk\"",
    "mtime": "2026-01-08T06:14:01.435Z",
    "size": 8248,
    "path": "../public/_nuxt/p7noJKId.js"
  },
  "/glog/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"2897-QuIKNKd8ydciklGjnv2ba3eghcA\"",
    "mtime": "2026-01-08T06:14:06.636Z",
    "size": 10391,
    "path": "../public/glog/index.html"
  },
  "/glog/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"1e2f-ZAAkBs+cUyge3Pps7+zjWnb6UTk\"",
    "mtime": "2026-01-08T06:14:10.398Z",
    "size": 7727,
    "path": "../public/glog/_payload.json"
  },
  "/systems/game-boy/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"11f4-bVB/7vVWstFRAKQxYeTzzlIoh6k\"",
    "mtime": "2026-01-08T06:14:10.306Z",
    "size": 4596,
    "path": "../public/systems/game-boy/index.html"
  },
  "/systems/game-boy/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"768-zSVEOtyF88h866WWJgtRZHzSm+8\"",
    "mtime": "2026-01-08T06:14:11.730Z",
    "size": 1896,
    "path": "../public/systems/game-boy/_payload.json"
  },
  "/systems/game-boy-advance/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"156d-dEjDHRObdHzONtO1N7AFBtfL4/E\"",
    "mtime": "2026-01-08T06:14:10.283Z",
    "size": 5485,
    "path": "../public/systems/game-boy-advance/index.html"
  },
  "/systems/game-boy-advance/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"a19-ZlsJmySxNJiiISmOpyi8ysT5uKc\"",
    "mtime": "2026-01-08T06:14:11.712Z",
    "size": 2585,
    "path": "../public/systems/game-boy-advance/_payload.json"
  },
  "/systems/game-boy-color/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"1187-rlUxbXdx9D3Vd+Iz15C9SWBu6+k\"",
    "mtime": "2026-01-08T06:14:10.276Z",
    "size": 4487,
    "path": "../public/systems/game-boy-color/index.html"
  },
  "/systems/game-boy-color/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"6cd-Wz3QIiE34KcInvbnwDOBLr+FNOg\"",
    "mtime": "2026-01-08T06:14:11.712Z",
    "size": 1741,
    "path": "../public/systems/game-boy-color/_payload.json"
  },
  "/systems/gamecube/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"16e5-QYU+Qk7j0SZTRbsGML7/q9JLLV0\"",
    "mtime": "2026-01-08T06:14:10.283Z",
    "size": 5861,
    "path": "../public/systems/gamecube/index.html"
  },
  "/systems/gamecube/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"bdd-UQLXM1OXe8E7WcfFxfw55dlnlfo\"",
    "mtime": "2026-01-08T06:14:11.730Z",
    "size": 3037,
    "path": "../public/systems/gamecube/_payload.json"
  },
  "/systems/nintendo-3ds/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"149f-A7YuPwkasqGYJg1GZ9Qm/oPJoLg\"",
    "mtime": "2026-01-08T06:14:10.312Z",
    "size": 5279,
    "path": "../public/systems/nintendo-3ds/index.html"
  },
  "/systems/nintendo-3ds/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"9a5-aDhIYXw1wisnfJ2BRoBiUTN/YkI\"",
    "mtime": "2026-01-08T06:14:11.730Z",
    "size": 2469,
    "path": "../public/systems/nintendo-3ds/_payload.json"
  },
  "/systems/nintendo-64/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"266a-rk0rrZ0lcWhwwr1lKGsPYmyna+0\"",
    "mtime": "2026-01-08T06:14:10.338Z",
    "size": 9834,
    "path": "../public/systems/nintendo-64/index.html"
  },
  "/systems/nintendo-64/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"1a1c-0MTkmx9NE9A69fPHe7uNqEFEZDA\"",
    "mtime": "2026-01-08T06:14:11.749Z",
    "size": 6684,
    "path": "../public/systems/nintendo-64/_payload.json"
  },
  "/systems/nintendo-ds/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"17a0-4mnXoEGWv44Mc4U/9eB5d4Bcmls\"",
    "mtime": "2026-01-08T06:14:10.306Z",
    "size": 6048,
    "path": "../public/systems/nintendo-ds/index.html"
  },
  "/systems/nintendo-ds/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"c82-r8MgAdLBD0sbGSEeDWuzc1BD8tU\"",
    "mtime": "2026-01-08T06:14:11.730Z",
    "size": 3202,
    "path": "../public/systems/nintendo-ds/_payload.json"
  },
  "/systems/nintendo-entertainment-system/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"4583-YJROg0i8lpkG1qOgVUFcRbCz8x0\"",
    "mtime": "2026-01-08T06:14:10.321Z",
    "size": 17795,
    "path": "../public/systems/nintendo-entertainment-system/index.html"
  },
  "/systems/nintendo-entertainment-system/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"3251-vVT4E9DbawC3AG6zzbojuHG97Nw\"",
    "mtime": "2026-01-08T06:14:11.749Z",
    "size": 12881,
    "path": "../public/systems/nintendo-entertainment-system/_payload.json"
  },
  "/systems/pc/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"1350-Sbq29oknLnGhu9tl72ao/e0/ZxU\"",
    "mtime": "2026-01-08T06:14:10.339Z",
    "size": 4944,
    "path": "../public/systems/pc/index.html"
  },
  "/systems/pc/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"89c-GpDL9YMXWUP/iPcufOLILrO6crY\"",
    "mtime": "2026-01-08T06:14:11.767Z",
    "size": 2204,
    "path": "../public/systems/pc/_payload.json"
  },
  "/systems/playstation/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3373-whV/pHYOxXD4lbK2eT59GDOzqkc\"",
    "mtime": "2026-01-08T06:14:10.281Z",
    "size": 13171,
    "path": "../public/systems/playstation/index.html"
  },
  "/systems/playstation/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"262f-gGSxlwDYA8MfgQzsjcPNkPzESfE\"",
    "mtime": "2026-01-08T06:14:11.712Z",
    "size": 9775,
    "path": "../public/systems/playstation/_payload.json"
  },
  "/systems/playstation-2/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"6671-qkbTBdaJaupaYRfWimiYU8Ffpdg\"",
    "mtime": "2026-01-08T06:14:10.338Z",
    "size": 26225,
    "path": "../public/systems/playstation-2/index.html"
  },
  "/systems/playstation-2/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"548c-uhE7FwJt3AwZ8c7TOvMMRnWTK8U\"",
    "mtime": "2026-01-08T06:14:11.749Z",
    "size": 21644,
    "path": "../public/systems/playstation-2/_payload.json"
  },
  "/systems/playstation-3/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3899-2kwWlZJ6MCHvsXJF5iiKvi1eS+A\"",
    "mtime": "2026-01-08T06:14:10.325Z",
    "size": 14489,
    "path": "../public/systems/playstation-3/index.html"
  },
  "/systems/playstation-3/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"2a88-L2M+BTQ+dy4+LvH3lV49arw3GN4\"",
    "mtime": "2026-01-08T06:14:11.749Z",
    "size": 10888,
    "path": "../public/systems/playstation-3/_payload.json"
  },
  "/systems/playstation-4/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"311d-Njly2c5OmmRJ6q9xAdTPj93hjF4\"",
    "mtime": "2026-01-08T06:14:10.283Z",
    "size": 12573,
    "path": "../public/systems/playstation-4/index.html"
  },
  "/systems/playstation-4/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"23d4-DPU/PTJAGsvnvYTEadyqm/mIUfs\"",
    "mtime": "2026-01-08T06:14:11.712Z",
    "size": 9172,
    "path": "../public/systems/playstation-4/_payload.json"
  },
  "/systems/playstation-5/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"1b40-KLqcM6QdqawHpWBNoO402ckCFK4\"",
    "mtime": "2026-01-08T06:14:10.348Z",
    "size": 6976,
    "path": "../public/systems/playstation-5/index.html"
  },
  "/systems/playstation-5/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"f94-KnobTLTfxp2ESDEnEwobclbzwbA\"",
    "mtime": "2026-01-08T06:14:11.768Z",
    "size": 3988,
    "path": "../public/systems/playstation-5/_payload.json"
  },
  "/systems/playstation-portable/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"1b26-HmTVsbw19/EtbcfyPtN9cCXsxUY\"",
    "mtime": "2026-01-08T06:14:10.275Z",
    "size": 6950,
    "path": "../public/systems/playstation-portable/index.html"
  },
  "/systems/playstation-portable/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"f16-JQ4SNpbDB98rmyeGnmRyQ58FUro\"",
    "mtime": "2026-01-08T06:14:11.712Z",
    "size": 3862,
    "path": "../public/systems/playstation-portable/_payload.json"
  },
  "/systems/playstation-vita/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"10ad-yxVGzpWnO8+YpZSqSYv9UfkZ/8Y\"",
    "mtime": "2026-01-08T06:14:10.306Z",
    "size": 4269,
    "path": "../public/systems/playstation-vita/index.html"
  },
  "/systems/playstation-vita/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"604-fkrufjX7MtTLQmo+tRFSGWva/zs\"",
    "mtime": "2026-01-08T06:14:11.730Z",
    "size": 1540,
    "path": "../public/systems/playstation-vita/_payload.json"
  },
  "/systems/sega-genesis/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"1174-3XbuuehBWo11XkuZt9pnEifdYJo\"",
    "mtime": "2026-01-08T06:14:10.306Z",
    "size": 4468,
    "path": "../public/systems/sega-genesis/index.html"
  },
  "/systems/sega-genesis/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"6ca-QMfy2BEICeBtUDRHXM2NSzWYqI4\"",
    "mtime": "2026-01-08T06:14:11.730Z",
    "size": 1738,
    "path": "../public/systems/sega-genesis/_payload.json"
  },
  "/systems/super-nintendo-entertainment-system/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"35b2-27PfdyVnN3QKaAW7SYLoZv3megA\"",
    "mtime": "2026-01-08T06:14:10.281Z",
    "size": 13746,
    "path": "../public/systems/super-nintendo-entertainment-system/index.html"
  },
  "/systems/super-nintendo-entertainment-system/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"2436-4zbkPjShTduJB28jwWc5jerUsYo\"",
    "mtime": "2026-01-08T06:14:11.712Z",
    "size": 9270,
    "path": "../public/systems/super-nintendo-entertainment-system/_payload.json"
  },
  "/systems/switch/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"2840-8V0WMiTPJx8BRWNsmeLptHQwxD0\"",
    "mtime": "2026-01-08T06:14:10.283Z",
    "size": 10304,
    "path": "../public/systems/switch/index.html"
  },
  "/systems/switch/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"1ca2-AwTCVRtPRlIejABJNqxvgiD400c\"",
    "mtime": "2026-01-08T06:14:11.730Z",
    "size": 7330,
    "path": "../public/systems/switch/_payload.json"
  },
  "/_nuxt/builds/latest.json": {
    "type": "application/json",
    "etag": "\"47-bJZzqW2ssNRDdKQqcld5a0hfBdA\"",
    "mtime": "2026-01-08T06:14:11.792Z",
    "size": 71,
    "path": "../public/_nuxt/builds/latest.json"
  },
  "/systems/wii-u/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"e17-pOUSge6H2DKJsJjy4rHYzr7mW38\"",
    "mtime": "2026-01-08T06:14:10.278Z",
    "size": 3607,
    "path": "../public/systems/wii-u/index.html"
  },
  "/systems/wii-u/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"3d5-sLAbpnt+hU3LSll6S5S8qj1Mg7M\"",
    "mtime": "2026-01-08T06:14:11.712Z",
    "size": 981,
    "path": "../public/systems/wii-u/_payload.json"
  },
  "/systems/wii/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"134f-B8unl3KvFPCOQriyla0ayBvpkIc\"",
    "mtime": "2026-01-08T06:14:10.306Z",
    "size": 4943,
    "path": "../public/systems/wii/index.html"
  },
  "/systems/wii/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"8cf-FnStopkh1kNiFqIUO8rQf93C9l8\"",
    "mtime": "2026-01-08T06:14:11.730Z",
    "size": 2255,
    "path": "../public/systems/wii/_payload.json"
  },
  "/glog/d-os2-playthrough-part-1/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"e48-7T6zhGfk2osJjFsLrxzdl/jpgeI\"",
    "mtime": "2026-01-08T06:14:10.338Z",
    "size": 3656,
    "path": "../public/glog/d-os2-playthrough-part-1/index.html"
  },
  "/glog/d-os2-playthrough-part-1/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"6af-Ocblq3m1TRAgQYtkkU5gOZoIGvc\"",
    "mtime": "2026-01-08T06:14:11.749Z",
    "size": 1711,
    "path": "../public/glog/d-os2-playthrough-part-1/_payload.json"
  },
  "/glog/d-os2-playthrough-part-2-end/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"13e1-kuMYSNoRnNQGo3oNwAf75OdrN6k\"",
    "mtime": "2026-01-08T06:14:10.358Z",
    "size": 5089,
    "path": "../public/glog/d-os2-playthrough-part-2-end/index.html"
  },
  "/glog/d-os2-playthrough-part-2-end/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"f5b-mC1I5sQrdYR4KvVR15+9WxvF0+8\"",
    "mtime": "2026-01-08T06:14:11.771Z",
    "size": 3931,
    "path": "../public/glog/d-os2-playthrough-part-2-end/_payload.json"
  },
  "/glog/dead-space-remake-playthrough-part-2-end/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"11f9-2PkrWuXKqP8XqLtnCdA0/6bs8wI\"",
    "mtime": "2026-01-08T06:14:10.453Z",
    "size": 4601,
    "path": "../public/glog/dead-space-remake-playthrough-part-2-end/index.html"
  },
  "/glog/dead-space-remake-playthrough-part-2-end/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"c04-A3M14XzRvwjhgRKb0Mmw4SSp+Hk\"",
    "mtime": "2026-01-08T06:14:11.773Z",
    "size": 3076,
    "path": "../public/glog/dead-space-remake-playthrough-part-2-end/_payload.json"
  },
  "/glog/dead-space-remake-playthrough-part-1/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"1097-5mhUuUayPhJS0XHTm0nvtXU7E5o\"",
    "mtime": "2026-01-08T06:14:10.339Z",
    "size": 4247,
    "path": "../public/glog/dead-space-remake-playthrough-part-1/index.html"
  },
  "/glog/dead-space-remake-playthrough-part-1/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"942-QOglRHY9TNzjSFNARXpj5YDh0K4\"",
    "mtime": "2026-01-08T06:14:11.763Z",
    "size": 2370,
    "path": "../public/glog/dead-space-remake-playthrough-part-1/_payload.json"
  },
  "/glog/dino-crisis-playthrough-1/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"14ca-9XjrkxgvVug4+NEpa2BtgZzU11M\"",
    "mtime": "2026-01-08T06:14:10.539Z",
    "size": 5322,
    "path": "../public/glog/dino-crisis-playthrough-1/index.html"
  },
  "/glog/dino-crisis-playthrough-1/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"1009-T30r0dmnXWzgUyfbUfaUs8dztrM\"",
    "mtime": "2026-01-08T06:14:11.773Z",
    "size": 4105,
    "path": "../public/glog/dino-crisis-playthrough-1/_payload.json"
  },
  "/glog/dino-crisis-playthrough-2/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"106d-Qf5DDQSvLIB83Z2vVwjXuUi5Pm8\"",
    "mtime": "2026-01-08T06:14:10.521Z",
    "size": 4205,
    "path": "../public/glog/dino-crisis-playthrough-2/index.html"
  },
  "/glog/dino-crisis-playthrough-2/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"b01-8+XrOMT4uJSH2C1uC+umohRBg/w\"",
    "mtime": "2026-01-08T06:14:11.773Z",
    "size": 2817,
    "path": "../public/glog/dino-crisis-playthrough-2/_payload.json"
  },
  "/glog/dino-crisis-playthrough-3/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"1556-Dv7hJlZ47+ol9+nALvzBj8Gm5Yg\"",
    "mtime": "2026-01-08T06:14:10.359Z",
    "size": 5462,
    "path": "../public/glog/dino-crisis-playthrough-3/index.html"
  },
  "/glog/dino-crisis-playthrough-3/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"eee-4hDeH6eDOKd+NHO2krkzJAW/WCg\"",
    "mtime": "2026-01-08T06:14:11.771Z",
    "size": 3822,
    "path": "../public/glog/dino-crisis-playthrough-3/_payload.json"
  },
  "/glog/dino-riki-2021-vgs-weekly-contest/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"c74-B7b5SgGyBCjx5W3vu/gOuI0N+ug\"",
    "mtime": "2026-01-08T06:14:10.339Z",
    "size": 3188,
    "path": "../public/glog/dino-riki-2021-vgs-weekly-contest/index.html"
  },
  "/glog/dino-riki-2021-vgs-weekly-contest/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"58d-QIvI5dDyKer2N+YeMWzEnRvXNtg\"",
    "mtime": "2026-01-08T06:14:11.767Z",
    "size": 1421,
    "path": "../public/glog/dino-riki-2021-vgs-weekly-contest/_payload.json"
  },
  "/glog/extermination-playthrough-1/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"e61-gSUC9GMQEpS3bXztEaWGsnyTyyw\"",
    "mtime": "2026-01-08T06:14:10.338Z",
    "size": 3681,
    "path": "../public/glog/extermination-playthrough-1/index.html"
  },
  "/glog/extermination-playthrough-1/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"716-ZPpW28RvFBAB9P2Q5vtbeBdu1lQ\"",
    "mtime": "2026-01-08T06:14:11.763Z",
    "size": 1814,
    "path": "../public/glog/extermination-playthrough-1/_payload.json"
  },
  "/glog/final-fantasy-legend-ii-playthrough-1/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"1200-onu3fzjOC4FTUG7zqdTLvnEPkNo\"",
    "mtime": "2026-01-08T06:14:10.339Z",
    "size": 4608,
    "path": "../public/glog/final-fantasy-legend-ii-playthrough-1/index.html"
  },
  "/glog/final-fantasy-legend-ii-playthrough-1/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"a8a-NT8XIQPoWk8vDZZaes2EhzYFko0\"",
    "mtime": "2026-01-08T06:14:11.763Z",
    "size": 2698,
    "path": "../public/glog/final-fantasy-legend-ii-playthrough-1/_payload.json"
  },
  "/glog/final-fantasy-7-playthrough-1/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"1038-U/N4/r5vFBCSo+2wZFgQIONj4I8\"",
    "mtime": "2026-01-08T06:14:10.339Z",
    "size": 4152,
    "path": "../public/glog/final-fantasy-7-playthrough-1/index.html"
  },
  "/glog/final-fantasy-7-playthrough-1/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"8ca-0THbU81y1sb+TSJILBxPPzf72Hk\"",
    "mtime": "2026-01-08T06:14:11.767Z",
    "size": 2250,
    "path": "../public/glog/final-fantasy-7-playthrough-1/_payload.json"
  },
  "/glog/joe-and-mac-nes-review/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"11a9-/glnJMjc9fyY0a1cOpfFWb+UQUU\"",
    "mtime": "2026-01-08T06:14:10.338Z",
    "size": 4521,
    "path": "../public/glog/joe-and-mac-nes-review/index.html"
  },
  "/glog/joe-and-mac-nes-review/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"ad8-ryTz5kJbtjT9tY2wAf5RgqD2fV4\"",
    "mtime": "2026-01-08T06:14:11.749Z",
    "size": 2776,
    "path": "../public/glog/joe-and-mac-nes-review/_payload.json"
  },
  "/glog/gta-san-andreas-review/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"187d-O+439F4sj2bVJbvdM+feRIytfW4\"",
    "mtime": "2026-01-08T06:14:10.358Z",
    "size": 6269,
    "path": "../public/glog/gta-san-andreas-review/index.html"
  },
  "/glog/gta-san-andreas-review/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"1644-/wSTuW0YRHU8/611sSaYnsGvSrs\"",
    "mtime": "2026-01-08T06:14:11.768Z",
    "size": 5700,
    "path": "../public/glog/gta-san-andreas-review/_payload.json"
  },
  "/glog/life-is-strange-true-colors-review/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"ef4-QkN6k1jYlOMNZusZ4k96XfKbaYw\"",
    "mtime": "2026-01-08T06:14:10.339Z",
    "size": 3828,
    "path": "../public/glog/life-is-strange-true-colors-review/index.html"
  },
  "/glog/life-is-strange-true-colors-review/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"7ad-SJX9pnj11wz+Mb6GHSLVTWOWwxA\"",
    "mtime": "2026-01-08T06:14:11.767Z",
    "size": 1965,
    "path": "../public/glog/life-is-strange-true-colors-review/_payload.json"
  },
  "/glog/mario-galaxy-playthrough-part-1/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"ef7-u/FjbCsfI6XT6DffKV7vH5+Oirw\"",
    "mtime": "2026-01-08T06:14:10.339Z",
    "size": 3831,
    "path": "../public/glog/mario-galaxy-playthrough-part-1/index.html"
  },
  "/glog/mario-galaxy-playthrough-part-1/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"822-4evGytuKOkYwVZsSZwDKQ5yG8sY\"",
    "mtime": "2026-01-08T06:14:11.763Z",
    "size": 2082,
    "path": "../public/glog/mario-galaxy-playthrough-part-1/_payload.json"
  },
  "/glog/mario-galaxy-playthrough-part-2-end/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"ffe-fcgvacaZoIDRKcknq4eueabFhDI\"",
    "mtime": "2026-01-08T06:14:10.338Z",
    "size": 4094,
    "path": "../public/glog/mario-galaxy-playthrough-part-2-end/index.html"
  },
  "/glog/mario-galaxy-playthrough-part-2-end/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"887-h1ju4ISd9SjjlE6KA2xHdwDWsvE\"",
    "mtime": "2026-01-08T06:14:11.749Z",
    "size": 2183,
    "path": "../public/glog/mario-galaxy-playthrough-part-2-end/_payload.json"
  },
  "/glog/medal-of-honor-review/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"173c-RgMHFmCFs4qvHRZLr0WTRdRhQlI\"",
    "mtime": "2026-01-08T06:14:10.358Z",
    "size": 5948,
    "path": "../public/glog/medal-of-honor-review/index.html"
  },
  "/glog/medal-of-honor-review/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"1055-RbxblErYKjqr0h64+88EDGXj9Lw\"",
    "mtime": "2026-01-08T06:14:11.771Z",
    "size": 4181,
    "path": "../public/glog/medal-of-honor-review/_payload.json"
  },
  "/glog/nes-completion-thread-2022-super-sprint/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"dad-xqJhk9Vc9qKQz+KDg2Z0lmCPAMk\"",
    "mtime": "2026-01-08T06:14:10.338Z",
    "size": 3501,
    "path": "../public/glog/nes-completion-thread-2022-super-sprint/index.html"
  },
  "/glog/nes-completion-thread-2022-super-sprint/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"5e7-yTKU5fJ/R20GLPskFnkgySLY8S4\"",
    "mtime": "2026-01-08T06:14:11.763Z",
    "size": 1511,
    "path": "../public/glog/nes-completion-thread-2022-super-sprint/_payload.json"
  },
  "/glog/prince-of-persia-sands-of-time-playthrough-1/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"13ea-VLgzmPGrlVCN2F++kurIiEoqSlo\"",
    "mtime": "2026-01-08T06:14:10.359Z",
    "size": 5098,
    "path": "../public/glog/prince-of-persia-sands-of-time-playthrough-1/index.html"
  },
  "/glog/prince-of-persia-sands-of-time-playthrough-1/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"e68-Rx8tGmZ5245aC7TEB9NSn6sHbyI\"",
    "mtime": "2026-01-08T06:14:11.771Z",
    "size": 3688,
    "path": "../public/glog/prince-of-persia-sands-of-time-playthrough-1/_payload.json"
  },
  "/glog/prince-of-persia-sands-of-time-playthrough-2/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d31-upPv9NYlzehLxHGRDW+tyWlBVb0\"",
    "mtime": "2026-01-08T06:14:10.339Z",
    "size": 3377,
    "path": "../public/glog/prince-of-persia-sands-of-time-playthrough-2/index.html"
  },
  "/glog/prince-of-persia-sands-of-time-playthrough-2/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"563-z+0S6AkpXYRCaX/P1rsrbBaeydY\"",
    "mtime": "2026-01-08T06:14:11.763Z",
    "size": 1379,
    "path": "../public/glog/prince-of-persia-sands-of-time-playthrough-2/_payload.json"
  },
  "/glog/prince-of-persia-sands-of-time-playthrough-3/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"e5a-oaa/1KgJY0HdWbMsmCmQfrSS/DM\"",
    "mtime": "2026-01-08T06:14:10.338Z",
    "size": 3674,
    "path": "../public/glog/prince-of-persia-sands-of-time-playthrough-3/index.html"
  },
  "/glog/prince-of-persia-sands-of-time-playthrough-3/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"6e2-WN90yluIMF3LgqtY1rsL5wgmxag\"",
    "mtime": "2026-01-08T06:14:11.763Z",
    "size": 1762,
    "path": "../public/glog/prince-of-persia-sands-of-time-playthrough-3/_payload.json"
  },
  "/glog/retroachievements-org/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"1556-W5PbfSj51NBRJuY23W9WWcL59+E\"",
    "mtime": "2026-01-08T06:14:10.358Z",
    "size": 5462,
    "path": "../public/glog/retroachievements-org/index.html"
  },
  "/glog/retroachievements-org/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"1130-3k0MoOTwUn/PSAXzUCa0pnuBJjQ\"",
    "mtime": "2026-01-08T06:14:11.771Z",
    "size": 4400,
    "path": "../public/glog/retroachievements-org/_payload.json"
  },
  "/glog/revisiting-mario-galaxy/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"f9f-5w8NaOY39fY8K6uqUb8sv0hPDTk\"",
    "mtime": "2026-01-08T06:14:10.398Z",
    "size": 3999,
    "path": "../public/glog/revisiting-mario-galaxy/index.html"
  },
  "/glog/revisiting-mario-galaxy/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"848-nFEm3MRjqHm2ihFMid5CDu0Zbss\"",
    "mtime": "2026-01-08T06:14:11.771Z",
    "size": 2120,
    "path": "../public/glog/revisiting-mario-galaxy/_payload.json"
  },
  "/glog/shadow-of-mordor-review/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"1511-+3+4Py14TxtTZu/Smx2bcxbSAi0\"",
    "mtime": "2026-01-08T06:14:10.358Z",
    "size": 5393,
    "path": "../public/glog/shadow-of-mordor-review/index.html"
  },
  "/glog/shadow-of-mordor-review/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"f09-FyvnqZK9cylSmH5mY6Bk6NqGVnc\"",
    "mtime": "2026-01-08T06:14:11.771Z",
    "size": 3849,
    "path": "../public/glog/shadow-of-mordor-review/_payload.json"
  },
  "/glog/the-quarry-playthrough-part-1/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"fc3-CmpajmecCEi0m68sEDpedouW3TE\"",
    "mtime": "2026-01-08T06:14:10.338Z",
    "size": 4035,
    "path": "../public/glog/the-quarry-playthrough-part-1/index.html"
  },
  "/glog/the-quarry-playthrough-part-1/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"886-L2lLH3Aj/awDNeJqLMip+EDk7UM\"",
    "mtime": "2026-01-08T06:14:11.749Z",
    "size": 2182,
    "path": "../public/glog/the-quarry-playthrough-part-1/_payload.json"
  },
  "/glog/the-quarry-playthrough-part-2-end/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"1435-SIb7Tgkxe/tMJH4nWV9xhL5sS4U\"",
    "mtime": "2026-01-08T06:14:10.358Z",
    "size": 5173,
    "path": "../public/glog/the-quarry-playthrough-part-2-end/index.html"
  },
  "/glog/the-quarry-playthrough-part-2-end/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"d0e-BS+RSNeT2g8hUuROR9Ozad8Wa9w\"",
    "mtime": "2026-01-08T06:14:11.768Z",
    "size": 3342,
    "path": "../public/glog/the-quarry-playthrough-part-2-end/_payload.json"
  },
  "/glog/timesplitters-review/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"14a6-qWLotCTwONaNGr4VzdtjJA+HkfA\"",
    "mtime": "2026-01-08T06:14:10.438Z",
    "size": 5286,
    "path": "../public/glog/timesplitters-review/index.html"
  },
  "/glog/timesplitters-review/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"f03-BTfZgJBZQq/u9e/CBBtn/ypLFAA\"",
    "mtime": "2026-01-08T06:14:11.771Z",
    "size": 3843,
    "path": "../public/glog/timesplitters-review/_payload.json"
  },
  "/glog/tony-hawks-pro-skater-2-playthrough/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d42-ZV0mE/hO/2Nv1vFUFCO3Im+y+K0\"",
    "mtime": "2026-01-08T06:14:10.339Z",
    "size": 3394,
    "path": "../public/glog/tony-hawks-pro-skater-2-playthrough/index.html"
  },
  "/glog/tony-hawks-pro-skater-2-playthrough/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"65b-yjhy7xzTy7PaAPc57dvuO/ViyLU\"",
    "mtime": "2026-01-08T06:14:11.767Z",
    "size": 1627,
    "path": "../public/glog/tony-hawks-pro-skater-2-playthrough/_payload.json"
  },
  "/glog/wild-of-arms-playthrough-1/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"11a5-hB/gd9BqDnzuXBenrZiqfZYIpew\"",
    "mtime": "2026-01-08T06:14:10.339Z",
    "size": 4517,
    "path": "../public/glog/wild-of-arms-playthrough-1/index.html"
  },
  "/glog/wild-of-arms-playthrough-1/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"a2d-R+xa7522yNQ4dymLlTHBcVlkoWg\"",
    "mtime": "2026-01-08T06:14:11.763Z",
    "size": 2605,
    "path": "../public/glog/wild-of-arms-playthrough-1/_payload.json"
  },
  "/games/game-boy/final-fantasy-adventure/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d45-N1xM2mIbyBjwW0SrcpsfCQ6kb04\"",
    "mtime": "2026-01-08T06:14:07.743Z",
    "size": 3397,
    "path": "../public/games/game-boy/final-fantasy-adventure/index.html"
  },
  "/games/game-boy/final-fantasy-adventure/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"264-hNXsJpOBw0HfV0FZOG89XQ09Ztc\"",
    "mtime": "2026-01-08T06:14:10.783Z",
    "size": 612,
    "path": "../public/games/game-boy/final-fantasy-adventure/_payload.json"
  },
  "/games/game-boy/final-fantasy-legend/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d2d-tzwkgjxt3xX35CFeauKnCP9CKNo\"",
    "mtime": "2026-01-08T06:14:07.795Z",
    "size": 3373,
    "path": "../public/games/game-boy/final-fantasy-legend/index.html"
  },
  "/games/game-boy/final-fantasy-legend/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25f-GzhFRVY/3B6cYKCL0Ps7dAXER4s\"",
    "mtime": "2026-01-08T06:14:10.797Z",
    "size": 607,
    "path": "../public/games/game-boy/final-fantasy-legend/_payload.json"
  },
  "/games/game-boy/final-fantasy-legend-ii/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"17fd-W0mc3OhI60gi+Ym8GlJj+LWri0Y\"",
    "mtime": "2026-01-08T06:14:07.883Z",
    "size": 6141,
    "path": "../public/games/game-boy/final-fantasy-legend-ii/index.html"
  },
  "/games/game-boy/final-fantasy-legend-ii/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"a31-qQuAFk7R3PdNw7UY9NXi94hxRF8\"",
    "mtime": "2026-01-08T06:14:10.854Z",
    "size": 2609,
    "path": "../public/games/game-boy/final-fantasy-legend-ii/_payload.json"
  },
  "/games/game-boy/final-fantasy-legend-iii/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d4b-9l2Ia2br3x8ONa4ZPOtWnZZHudI\"",
    "mtime": "2026-01-08T06:14:07.795Z",
    "size": 3403,
    "path": "../public/games/game-boy/final-fantasy-legend-iii/index.html"
  },
  "/games/game-boy/final-fantasy-legend-iii/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"266-F8pwnV/Ftl2P2fYjpGlqSQCsPoc\"",
    "mtime": "2026-01-08T06:14:10.792Z",
    "size": 614,
    "path": "../public/games/game-boy/final-fantasy-legend-iii/_payload.json"
  },
  "/games/game-boy/kirbys-dream-land/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d2b-Bp8KLmKZaT1jidAqsHKRlcSM6Jw\"",
    "mtime": "2026-01-08T06:14:08.322Z",
    "size": 3371,
    "path": "../public/games/game-boy/kirbys-dream-land/index.html"
  },
  "/games/game-boy/kirbys-dream-land/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25c-QsATj/xMsZF+HDmCGZEL/eL6yMU\"",
    "mtime": "2026-01-08T06:14:10.996Z",
    "size": 604,
    "path": "../public/games/game-boy/kirbys-dream-land/_payload.json"
  },
  "/games/game-boy/pokemon-blue/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"cfd-YIDieSCIQZp5KyL7IoP1KyT0f/k\"",
    "mtime": "2026-01-08T06:14:08.903Z",
    "size": 3325,
    "path": "../public/games/game-boy/pokemon-blue/index.html"
  },
  "/games/game-boy/pokemon-blue/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"257-PigxtFH7npwY3Wr89jvQKC1Z7/8\"",
    "mtime": "2026-01-08T06:14:11.276Z",
    "size": 599,
    "path": "../public/games/game-boy/pokemon-blue/_payload.json"
  },
  "/games/game-boy/pokemon-red/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"cf7-wDnwg/+n5a0YL/Cftj8sLxWfCyY\"",
    "mtime": "2026-01-08T06:14:08.998Z",
    "size": 3319,
    "path": "../public/games/game-boy/pokemon-red/index.html"
  },
  "/games/game-boy/pokemon-red/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"256-0gx/FLgTxYAVuMce0rHxOi2wMx0\"",
    "mtime": "2026-01-08T06:14:11.291Z",
    "size": 598,
    "path": "../public/games/game-boy/pokemon-red/_payload.json"
  },
  "/games/game-boy/pokemon-yellow/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"dba-2BsILACIbZFWDeJtBhxX2wuyaQY\"",
    "mtime": "2026-01-08T06:14:09.127Z",
    "size": 3514,
    "path": "../public/games/game-boy/pokemon-yellow/index.html"
  },
  "/games/game-boy/pokemon-yellow/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"2b5-krcCjj5WgESyJOu+vagnPvLN0u4\"",
    "mtime": "2026-01-08T06:14:11.304Z",
    "size": 693,
    "path": "../public/games/game-boy/pokemon-yellow/_payload.json"
  },
  "/games/game-boy-color/legend-of-zelda-oracle-of-ages/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d9b-OBceghUmWk9P4NftkUh4QiNdwFg\"",
    "mtime": "2026-01-08T06:14:08.502Z",
    "size": 3483,
    "path": "../public/games/game-boy-color/legend-of-zelda-oracle-of-ages/index.html"
  },
  "/games/game-boy-color/legend-of-zelda-oracle-of-ages/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"27a-1uiJngD9TQQIBMzN9KYHdYAJnfc\"",
    "mtime": "2026-01-08T06:14:11.077Z",
    "size": 634,
    "path": "../public/games/game-boy-color/legend-of-zelda-oracle-of-ages/_payload.json"
  },
  "/games/game-boy-color/legend-of-zelda-oracle-of-seasons/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"dad-YTfM0/5oSBQ6sONW4fwBnYkeWlA\"",
    "mtime": "2026-01-08T06:14:08.538Z",
    "size": 3501,
    "path": "../public/games/game-boy-color/legend-of-zelda-oracle-of-seasons/index.html"
  },
  "/games/game-boy-color/legend-of-zelda-oracle-of-seasons/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"27d-ospaV2Z5kwUOGK4wgLdIHPzcBmY\"",
    "mtime": "2026-01-08T06:14:11.078Z",
    "size": 637,
    "path": "../public/games/game-boy-color/legend-of-zelda-oracle-of-seasons/_payload.json"
  },
  "/games/game-boy-color/pokemon-crystal/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d39-tSGSXi6DTxI3cjHG71zWjYXU0a8\"",
    "mtime": "2026-01-08T06:14:08.966Z",
    "size": 3385,
    "path": "../public/games/game-boy-color/pokemon-crystal/index.html"
  },
  "/games/game-boy-color/pokemon-crystal/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"266-itFLIaHb2iAFIN9eyaanhn6AbJs\"",
    "mtime": "2026-01-08T06:14:11.276Z",
    "size": 614,
    "path": "../public/games/game-boy-color/pokemon-crystal/_payload.json"
  },
  "/games/game-boy-color/pokemon-gold/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d27-3UTMWlHCHzpgJvns6FoZ38/nVuA\"",
    "mtime": "2026-01-08T06:14:08.974Z",
    "size": 3367,
    "path": "../public/games/game-boy-color/pokemon-gold/index.html"
  },
  "/games/game-boy-color/pokemon-gold/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"263-6qv1epNHC/9qqQk6i79IYJdFa7E\"",
    "mtime": "2026-01-08T06:14:11.276Z",
    "size": 611,
    "path": "../public/games/game-boy-color/pokemon-gold/_payload.json"
  },
  "/games/game-boy-color/pokemon-pinball/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d39-43pTqTeWnMKp21QELw80ooEM+ac\"",
    "mtime": "2026-01-08T06:14:08.996Z",
    "size": 3385,
    "path": "../public/games/game-boy-color/pokemon-pinball/index.html"
  },
  "/games/game-boy-color/pokemon-pinball/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"267-6YEy1vDQADu+ngCExL9zQSImc+0\"",
    "mtime": "2026-01-08T06:14:11.276Z",
    "size": 615,
    "path": "../public/games/game-boy-color/pokemon-pinball/_payload.json"
  },
  "/games/game-boy-color/pokemon-silver/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d33-DO1sopa3u8KdKeS/+435T2mbJ+s\"",
    "mtime": "2026-01-08T06:14:09.014Z",
    "size": 3379,
    "path": "../public/games/game-boy-color/pokemon-silver/index.html"
  },
  "/games/game-boy-color/pokemon-silver/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"265-OLtbAivEF8Ryd2fcKE00ol7/KsY\"",
    "mtime": "2026-01-08T06:14:11.291Z",
    "size": 613,
    "path": "../public/games/game-boy-color/pokemon-silver/_payload.json"
  },
  "/games/game-boy-color/pokemon-trading-card-game/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"e27-hmKwmkTlm5b5vJ8E2N49VckFCb8\"",
    "mtime": "2026-01-08T06:14:09.098Z",
    "size": 3623,
    "path": "../public/games/game-boy-color/pokemon-trading-card-game/index.html"
  },
  "/games/game-boy-color/pokemon-trading-card-game/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"2ce-etxpoeRg6Ni05cyxS1Ip5RPHIb0\"",
    "mtime": "2026-01-08T06:14:11.291Z",
    "size": 718,
    "path": "../public/games/game-boy-color/pokemon-trading-card-game/_payload.json"
  },
  "/games/game-boy-advance/final-fantasy-i-and-ii-dawn-of-souls/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"e3a-w6XF9gF1WYn5V795X05IgHFLT7k\"",
    "mtime": "2026-01-08T06:14:07.760Z",
    "size": 3642,
    "path": "../public/games/game-boy-advance/final-fantasy-i-and-ii-dawn-of-souls/index.html"
  },
  "/games/game-boy-advance/final-fantasy-i-and-ii-dawn-of-souls/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"2b5-SF7oaKmplOvkT92t4OC0EMp5yls\"",
    "mtime": "2026-01-08T06:14:10.783Z",
    "size": 693,
    "path": "../public/games/game-boy-advance/final-fantasy-i-and-ii-dawn-of-souls/_payload.json"
  },
  "/games/game-boy-advance/final-fantasy-tactics-advance/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"da1-EKI7kN+9U1666TXaCL+joDOXTkc\"",
    "mtime": "2026-01-08T06:14:07.795Z",
    "size": 3489,
    "path": "../public/games/game-boy-advance/final-fantasy-tactics-advance/index.html"
  },
  "/games/game-boy-advance/final-fantasy-tactics-advance/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"27b-tlSKXZn1P3ej23OqmsCQj+mIkBA\"",
    "mtime": "2026-01-08T06:14:10.783Z",
    "size": 635,
    "path": "../public/games/game-boy-advance/final-fantasy-tactics-advance/_payload.json"
  },
  "/games/game-boy-advance/final-fantasy-iv-gba/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d77-Wr1wMP2ZLO3TQDlqlt0RqIp4vGI\"",
    "mtime": "2026-01-08T06:14:07.786Z",
    "size": 3447,
    "path": "../public/games/game-boy-advance/final-fantasy-iv-gba/index.html"
  },
  "/games/game-boy-advance/final-fantasy-iv-gba/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"277-eGyTr952k6fhxgCrGFS2LWjqe3Q\"",
    "mtime": "2026-01-08T06:14:10.783Z",
    "size": 631,
    "path": "../public/games/game-boy-advance/final-fantasy-iv-gba/_payload.json"
  },
  "/games/game-boy-advance/final-fantasy-v-advance/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d7d-oZvA6R6DrA3d0N7FJnv+YT48R+o\"",
    "mtime": "2026-01-08T06:14:07.795Z",
    "size": 3453,
    "path": "../public/games/game-boy-advance/final-fantasy-v-advance/index.html"
  },
  "/games/game-boy-advance/final-fantasy-v-advance/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"275-R3tb8jaqP7HVUjW4GNzRw4bGtmk\"",
    "mtime": "2026-01-08T06:14:10.812Z",
    "size": 629,
    "path": "../public/games/game-boy-advance/final-fantasy-v-advance/_payload.json"
  },
  "/games/game-boy-advance/final-fantasy-vi-advance/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d83-toN/gPusUtcp5FaZfYkeKeLnROs\"",
    "mtime": "2026-01-08T06:14:07.795Z",
    "size": 3459,
    "path": "../public/games/game-boy-advance/final-fantasy-vi-advance/index.html"
  },
  "/games/game-boy-advance/final-fantasy-vi-advance/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"277-GpH0QuB5rGelqzg+oAnEeCzijaM\"",
    "mtime": "2026-01-08T06:14:10.797Z",
    "size": 631,
    "path": "../public/games/game-boy-advance/final-fantasy-vi-advance/_payload.json"
  },
  "/games/game-boy-advance/legend-of-zelda-a-link-to-the-past-gba/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"dcd-dRnbYFWyULa0hMZA8PO502JyNCk\"",
    "mtime": "2026-01-08T06:14:08.322Z",
    "size": 3533,
    "path": "../public/games/game-boy-advance/legend-of-zelda-a-link-to-the-past-gba/index.html"
  },
  "/games/game-boy-advance/legend-of-zelda-a-link-to-the-past-gba/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"282-hvAjG/3NJha3NyBqfqtJugXJCDA\"",
    "mtime": "2026-01-08T06:14:11.011Z",
    "size": 642,
    "path": "../public/games/game-boy-advance/legend-of-zelda-a-link-to-the-past-gba/_payload.json"
  },
  "/games/game-boy-advance/legend-of-zelda-minish-cap/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d8b-0eFn6GqcO0nHrTSVKKShFA+H25o\"",
    "mtime": "2026-01-08T06:14:08.367Z",
    "size": 3467,
    "path": "../public/games/game-boy-advance/legend-of-zelda-minish-cap/index.html"
  },
  "/games/game-boy-advance/legend-of-zelda-minish-cap/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"276-DfJvPg158t6Qz4NMvJeYeV3dEcc\"",
    "mtime": "2026-01-08T06:14:11.034Z",
    "size": 630,
    "path": "../public/games/game-boy-advance/legend-of-zelda-minish-cap/_payload.json"
  },
  "/games/game-boy-advance/pokemon-emerald/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d4d-30nnCeo00k4rD1LT/PhMaPj+6cY\"",
    "mtime": "2026-01-08T06:14:08.973Z",
    "size": 3405,
    "path": "../public/games/game-boy-advance/pokemon-emerald/index.html"
  },
  "/games/game-boy-advance/pokemon-emerald/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"26e-ygoyTXO2wVoS2Xp/xapNggVfrj0\"",
    "mtime": "2026-01-08T06:14:11.276Z",
    "size": 622,
    "path": "../public/games/game-boy-advance/pokemon-emerald/_payload.json"
  },
  "/games/game-boy-advance/pokemon-ruby/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d3b-qTctBYjNve9ayd3c7PPh0kC82TY\"",
    "mtime": "2026-01-08T06:14:08.998Z",
    "size": 3387,
    "path": "../public/games/game-boy-advance/pokemon-ruby/index.html"
  },
  "/games/game-boy-advance/pokemon-ruby/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"26b-5uQpqHMN1Juv4l5dD2gptlCQwx4\"",
    "mtime": "2026-01-08T06:14:11.291Z",
    "size": 619,
    "path": "../public/games/game-boy-advance/pokemon-ruby/_payload.json"
  },
  "/games/game-boy-advance/pokemon-sapphire/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d53-29ctEtiyrKJJ9Co0KHhV+sMNb2o\"",
    "mtime": "2026-01-08T06:14:08.998Z",
    "size": 3411,
    "path": "../public/games/game-boy-advance/pokemon-sapphire/index.html"
  },
  "/games/game-boy-advance/pokemon-sapphire/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"26f-WCZF+n5nAq091QfjgvUjRBW3EF4\"",
    "mtime": "2026-01-08T06:14:11.276Z",
    "size": 623,
    "path": "../public/games/game-boy-advance/pokemon-sapphire/_payload.json"
  },
  "/games/gamecube/conflict-desert-storm/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d3b-Y6nYCxsKGIvz1x5L+MunDfqG8oQ\"",
    "mtime": "2026-01-08T06:14:07.270Z",
    "size": 3387,
    "path": "../public/games/gamecube/conflict-desert-storm/index.html"
  },
  "/games/gamecube/conflict-desert-storm/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"265-KnYbmDS4pSfLVCVuylIZ0jmypGI\"",
    "mtime": "2026-01-08T06:14:10.648Z",
    "size": 613,
    "path": "../public/games/gamecube/conflict-desert-storm/_payload.json"
  },
  "/games/game-boy-advance/sigma-star-saga/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d4f-yY1kVYOUuLQ9TmB4GGV5lt1CvTM\"",
    "mtime": "2026-01-08T06:14:09.381Z",
    "size": 3407,
    "path": "../public/games/game-boy-advance/sigma-star-saga/index.html"
  },
  "/games/game-boy-advance/sigma-star-saga/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"26f-W3Ai5l978l7T3nSJmfwHbJ9uDhI\"",
    "mtime": "2026-01-08T06:14:11.433Z",
    "size": 623,
    "path": "../public/games/game-boy-advance/sigma-star-saga/_payload.json"
  },
  "/games/gamecube/final-fantasy-crystal-chronicles/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d7d-VApWHCRWIz5SEYW48nyhro2YaA8\"",
    "mtime": "2026-01-08T06:14:07.807Z",
    "size": 3453,
    "path": "../public/games/gamecube/final-fantasy-crystal-chronicles/index.html"
  },
  "/games/gamecube/final-fantasy-crystal-chronicles/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"270-TUyY27toXT6R4ntvneO8TrRYp40\"",
    "mtime": "2026-01-08T06:14:10.835Z",
    "size": 624,
    "path": "../public/games/gamecube/final-fantasy-crystal-chronicles/_payload.json"
  },
  "/games/gamecube/legend-of-zelda-collection/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d66-EmXzO+6uBxczNBmvOtr9VFSS4gg\"",
    "mtime": "2026-01-08T06:14:08.322Z",
    "size": 3430,
    "path": "../public/games/gamecube/legend-of-zelda-collection/index.html"
  },
  "/games/gamecube/legend-of-zelda-collection/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"26e-xhtc7tqp12eA2i++BKMd2tgLxLw\"",
    "mtime": "2026-01-08T06:14:11.011Z",
    "size": 622,
    "path": "../public/games/gamecube/legend-of-zelda-collection/_payload.json"
  },
  "/games/gamecube/legend-of-zelda-four-sword-adventures/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"daa-Utwg0MPwSs5e1BSzHF3MkHQit5o\"",
    "mtime": "2026-01-08T06:14:08.322Z",
    "size": 3498,
    "path": "../public/games/gamecube/legend-of-zelda-four-sword-adventures/index.html"
  },
  "/games/gamecube/legend-of-zelda-four-sword-adventures/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"27a-oNWT0UHwB9P76/FqODEz0P0jFh0\"",
    "mtime": "2026-01-08T06:14:11.011Z",
    "size": 634,
    "path": "../public/games/gamecube/legend-of-zelda-four-sword-adventures/_payload.json"
  },
  "/games/gamecube/legend-of-zelda-ocarina-of-time-master-quest/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"dda-V+h/XmAbNoVxdEZaT7BFjRMOA0w\"",
    "mtime": "2026-01-08T06:14:08.367Z",
    "size": 3546,
    "path": "../public/games/gamecube/legend-of-zelda-ocarina-of-time-master-quest/index.html"
  },
  "/games/gamecube/legend-of-zelda-ocarina-of-time-master-quest/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"282-CWxQlEAfIR76ZyEOh6GD4kGPIU4\"",
    "mtime": "2026-01-08T06:14:11.033Z",
    "size": 642,
    "path": "../public/games/gamecube/legend-of-zelda-ocarina-of-time-master-quest/_payload.json"
  },
  "/games/gamecube/legend-of-zelda-windwaker-the/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d6e-iIy4sUHLtqK/vps7sXCowFEZz1k\"",
    "mtime": "2026-01-08T06:14:08.495Z",
    "size": 3438,
    "path": "../public/games/gamecube/legend-of-zelda-windwaker-the/index.html"
  },
  "/games/gamecube/legend-of-zelda-windwaker-the/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"26e-AKGqG3jq1p3YeukBGNzFnkt9Yoo\"",
    "mtime": "2026-01-08T06:14:11.056Z",
    "size": 622,
    "path": "../public/games/gamecube/legend-of-zelda-windwaker-the/_payload.json"
  },
  "/games/gamecube/metal-gear-solid-the-twin-snakes/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d7d-CA3XQJYSCEV4epDxp0VRHRwdY74\"",
    "mtime": "2026-01-08T06:14:08.725Z",
    "size": 3453,
    "path": "../public/games/gamecube/metal-gear-solid-the-twin-snakes/index.html"
  },
  "/games/gamecube/metal-gear-solid-the-twin-snakes/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"270-rf0ExaOv/wTqCw67PqDLmSx7DRA\"",
    "mtime": "2026-01-08T06:14:11.176Z",
    "size": 624,
    "path": "../public/games/gamecube/metal-gear-solid-the-twin-snakes/_payload.json"
  },
  "/games/gamecube/metroid-prime/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d09-tBuFyOHfUT6+lPszpMxmhVuPgGM\"",
    "mtime": "2026-01-08T06:14:08.742Z",
    "size": 3337,
    "path": "../public/games/gamecube/metroid-prime/index.html"
  },
  "/games/gamecube/metroid-prime/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25b-IU3Q+eGzHSRZEtCkSfF4HA/O9T0\"",
    "mtime": "2026-01-08T06:14:11.176Z",
    "size": 603,
    "path": "../public/games/gamecube/metroid-prime/_payload.json"
  },
  "/games/gamecube/resident-evil/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d09-VWR0UppdnQwrkgKPlv/mFffkxuI\"",
    "mtime": "2026-01-08T06:14:09.133Z",
    "size": 3337,
    "path": "../public/games/gamecube/resident-evil/index.html"
  },
  "/games/gamecube/resident-evil/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25c-f/MCqmeolJAsyaskKuT0AI9+O5M\"",
    "mtime": "2026-01-08T06:14:11.340Z",
    "size": 604,
    "path": "../public/games/gamecube/resident-evil/_payload.json"
  },
  "/games/gamecube/resident-evil-0/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d15-TXhaF9BV3sTH8POyN1qqS1vJaJ8\"",
    "mtime": "2026-01-08T06:14:09.144Z",
    "size": 3349,
    "path": "../public/games/gamecube/resident-evil-0/index.html"
  },
  "/games/gamecube/resident-evil-0/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25e-zAP/rILe97Was8VMSn5ps19dlCs\"",
    "mtime": "2026-01-08T06:14:11.340Z",
    "size": 606,
    "path": "../public/games/gamecube/resident-evil-0/_payload.json"
  },
  "/games/gamecube/soulcalibur-ii-gcn/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d15-X9mFbtZbJU7vHQ0RSlFOqCO/S34\"",
    "mtime": "2026-01-08T06:14:09.458Z",
    "size": 3349,
    "path": "../public/games/gamecube/soulcalibur-ii-gcn/index.html"
  },
  "/games/gamecube/soulcalibur-ii-gcn/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25a-BhhY0DCtLlSysgt5IW9YruFWQtQ\"",
    "mtime": "2026-01-08T06:14:11.452Z",
    "size": 602,
    "path": "../public/games/gamecube/soulcalibur-ii-gcn/_payload.json"
  },
  "/games/gamecube/super-mario-sunshine/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d35-vVEZfav/0ftiE0sunJ2zhjcVtZU\"",
    "mtime": "2026-01-08T06:14:09.665Z",
    "size": 3381,
    "path": "../public/games/gamecube/super-mario-sunshine/index.html"
  },
  "/games/gamecube/super-mario-sunshine/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"264-9EWLzn0RUyQjZHxto5XYrMx5/vI\"",
    "mtime": "2026-01-08T06:14:11.530Z",
    "size": 612,
    "path": "../public/games/gamecube/super-mario-sunshine/_payload.json"
  },
  "/games/gamecube/super-smash-bros-melee/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d3c-/WhFYv2r2bbmw70UucvCSte3kLQ\"",
    "mtime": "2026-01-08T06:14:09.772Z",
    "size": 3388,
    "path": "../public/games/gamecube/super-smash-bros-melee/index.html"
  },
  "/games/gamecube/super-smash-bros-melee/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"263-UOZ/CdB8k0o5FuC04fmHWB3tC9A\"",
    "mtime": "2026-01-08T06:14:11.566Z",
    "size": 611,
    "path": "../public/games/gamecube/super-smash-bros-melee/_payload.json"
  },
  "/games/nintendo-3ds/legend-of-zelda-a-link-between-worlds-the/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"dcc-si7+L+GQAc5eomR84UlCcZ2iG/o\"",
    "mtime": "2026-01-08T06:14:08.322Z",
    "size": 3532,
    "path": "../public/games/nintendo-3ds/legend-of-zelda-a-link-between-worlds-the/index.html"
  },
  "/games/nintendo-3ds/legend-of-zelda-a-link-between-worlds-the/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"27f-OeoPNLDygKRHQrpWHKPdSf4OzYQ\"",
    "mtime": "2026-01-08T06:14:11.033Z",
    "size": 639,
    "path": "../public/games/nintendo-3ds/legend-of-zelda-a-link-between-worlds-the/_payload.json"
  },
  "/games/nintendo-3ds/fire-emblem-awakening/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d59-ODMniHgFIav2aX33vl1+tIxooeE\"",
    "mtime": "2026-01-08T06:14:07.915Z",
    "size": 3417,
    "path": "../public/games/nintendo-3ds/fire-emblem-awakening/index.html"
  },
  "/games/nintendo-3ds/fire-emblem-awakening/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"26e-NwASvH/cUWUWQQD8oWypHxKzrAQ\"",
    "mtime": "2026-01-08T06:14:10.854Z",
    "size": 622,
    "path": "../public/games/nintendo-3ds/fire-emblem-awakening/_payload.json"
  },
  "/games/nintendo-3ds/legend-of-zelda-majoras-mask-3d-the/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"db8-Iy4zEJXy2WkPbUkCkzHrn8Rvp6Q\"",
    "mtime": "2026-01-08T06:14:08.333Z",
    "size": 3512,
    "path": "../public/games/nintendo-3ds/legend-of-zelda-majoras-mask-3d-the/index.html"
  },
  "/games/nintendo-3ds/legend-of-zelda-majoras-mask-3d-the/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"27a-0MQkOb+l6zPSoQ1ohhqWzS2bDZ4\"",
    "mtime": "2026-01-08T06:14:11.033Z",
    "size": 634,
    "path": "../public/games/nintendo-3ds/legend-of-zelda-majoras-mask-3d-the/_payload.json"
  },
  "/games/nintendo-3ds/legend-of-zelda-ocarina-of-time-3d-the/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"dc2-2kIBFsj6W2lkleCchtI/IimhGsI\"",
    "mtime": "2026-01-08T06:14:08.367Z",
    "size": 3522,
    "path": "../public/games/nintendo-3ds/legend-of-zelda-ocarina-of-time-3d-the/index.html"
  },
  "/games/nintendo-3ds/legend-of-zelda-ocarina-of-time-3d-the/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"280-B+AHzTVS9h5/jw7NKLzAzB0fOuA\"",
    "mtime": "2026-01-08T06:14:11.033Z",
    "size": 640,
    "path": "../public/games/nintendo-3ds/legend-of-zelda-ocarina-of-time-3d-the/_payload.json"
  },
  "/games/nintendo-3ds/pokemon-omega-ruby/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d43-WoOUFZIafiJCxXLtTT7PO5pCKkE\"",
    "mtime": "2026-01-08T06:14:08.974Z",
    "size": 3395,
    "path": "../public/games/nintendo-3ds/pokemon-omega-ruby/index.html"
  },
  "/games/nintendo-3ds/pokemon-omega-ruby/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"269-4xMhQrao+U7btRDjDBLhv9lHSeo\"",
    "mtime": "2026-01-08T06:14:11.276Z",
    "size": 617,
    "path": "../public/games/nintendo-3ds/pokemon-omega-ruby/_payload.json"
  },
  "/games/nintendo-3ds/pokemon-sun/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d1b-ljEuqrdWS0viUdhrY2Z8eATlr7Y\"",
    "mtime": "2026-01-08T06:14:09.050Z",
    "size": 3355,
    "path": "../public/games/nintendo-3ds/pokemon-sun/index.html"
  },
  "/games/nintendo-3ds/pokemon-sun/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"263-K2OUdR8QNcXsvXBY47FkpCkdQaM\"",
    "mtime": "2026-01-08T06:14:11.291Z",
    "size": 611,
    "path": "../public/games/nintendo-3ds/pokemon-sun/_payload.json"
  },
  "/games/nintendo-3ds/pokemon-y/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d0f-VQvJtHT+GTp8AmFYJDhGUDBc2xY\"",
    "mtime": "2026-01-08T06:14:09.121Z",
    "size": 3343,
    "path": "../public/games/nintendo-3ds/pokemon-y/index.html"
  },
  "/games/nintendo-3ds/pokemon-y/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"261-2UUGf9Xl0GytsnRGioDddv7MR+E\"",
    "mtime": "2026-01-08T06:14:11.304Z",
    "size": 609,
    "path": "../public/games/nintendo-3ds/pokemon-y/_payload.json"
  },
  "/games/nintendo-3ds/resident-evil-the-mercenaries-3d/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"de3-qokN9lHCBT/eh1yEhgHmEr73rBs\"",
    "mtime": "2026-01-08T06:14:09.197Z",
    "size": 3555,
    "path": "../public/games/nintendo-3ds/resident-evil-the-mercenaries-3d/index.html"
  },
  "/games/nintendo-3ds/resident-evil-the-mercenaries-3d/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"294-tI0ktFupethNj4aRZ3mzcS0CXHY\"",
    "mtime": "2026-01-08T06:14:11.364Z",
    "size": 660,
    "path": "../public/games/nintendo-3ds/resident-evil-the-mercenaries-3d/_payload.json"
  },
  "/games/nintendo-3ds/theatrhythm-final-fantasy/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d6f-oeTws6UwonlXc1VBEqK/KkLuEOg\"",
    "mtime": "2026-01-08T06:14:09.860Z",
    "size": 3439,
    "path": "../public/games/nintendo-3ds/theatrhythm-final-fantasy/index.html"
  },
  "/games/nintendo-3ds/theatrhythm-final-fantasy/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"271-rit+daQXPtYUqUALgHn7VklxtFs\"",
    "mtime": "2026-01-08T06:14:11.600Z",
    "size": 625,
    "path": "../public/games/nintendo-3ds/theatrhythm-final-fantasy/_payload.json"
  },
  "/games/nintendo-3ds/theatrhythm-final-fantasy-curtain-call/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"dbd-v9KH2tKV7eE00U6OlSgNyrH7mAw\"",
    "mtime": "2026-01-08T06:14:09.860Z",
    "size": 3517,
    "path": "../public/games/nintendo-3ds/theatrhythm-final-fantasy-curtain-call/index.html"
  },
  "/games/nintendo-3ds/theatrhythm-final-fantasy-curtain-call/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"27e-AbnVeLLM5WR2/jZViIARvzsNr+8\"",
    "mtime": "2026-01-08T06:14:11.600Z",
    "size": 638,
    "path": "../public/games/nintendo-3ds/theatrhythm-final-fantasy-curtain-call/_payload.json"
  },
  "/games/nintendo-64/007-goldeneye/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"dce-591t1P8nZ/W+V6cb6vdBDvn+/HI\"",
    "mtime": "2026-01-08T06:14:06.710Z",
    "size": 3534,
    "path": "../public/games/nintendo-64/007-goldeneye/index.html"
  },
  "/games/nintendo-64/007-goldeneye/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"2bf-G3gYnCRzZqi+GwZaWOzo6KaZhZ8\"",
    "mtime": "2026-01-08T06:14:10.469Z",
    "size": 703,
    "path": "../public/games/nintendo-64/007-goldeneye/_payload.json"
  },
  "/games/nintendo-64/007-the-world-is-not-enough/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d6e-5CrkdUqMRiyru0vPnbPvGxBzhy8\"",
    "mtime": "2026-01-08T06:14:06.710Z",
    "size": 3438,
    "path": "../public/games/nintendo-64/007-the-world-is-not-enough/index.html"
  },
  "/games/nintendo-64/007-the-world-is-not-enough/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"26e-6CZQZj//nfP6hjd7woSbjPi/mdw\"",
    "mtime": "2026-01-08T06:14:10.469Z",
    "size": 622,
    "path": "../public/games/nintendo-64/007-the-world-is-not-enough/_payload.json"
  },
  "/games/nintendo-64/aidyn-chronicles-the-first-mage/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"dd4-8od1aBb7a4t0T9Y/Qs9xHyX4fSw\"",
    "mtime": "2026-01-08T06:14:06.710Z",
    "size": 3540,
    "path": "../public/games/nintendo-64/aidyn-chronicles-the-first-mage/index.html"
  },
  "/games/nintendo-64/aidyn-chronicles-the-first-mage/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"286-nmiAD11dWmJ00fUnl1TrYwG4XQY\"",
    "mtime": "2026-01-08T06:14:10.457Z",
    "size": 646,
    "path": "../public/games/nintendo-64/aidyn-chronicles-the-first-mage/_payload.json"
  },
  "/games/nintendo-64/banjo-kazooie/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d18-cIZUc/pIDrK48vLEOMjv4Ho9Bws\"",
    "mtime": "2026-01-08T06:14:06.932Z",
    "size": 3352,
    "path": "../public/games/nintendo-64/banjo-kazooie/index.html"
  },
  "/games/nintendo-64/banjo-kazooie/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25f-MYdukwhfLMgr/dj0g+FRsscWA2I\"",
    "mtime": "2026-01-08T06:14:10.482Z",
    "size": 607,
    "path": "../public/games/nintendo-64/banjo-kazooie/_payload.json"
  },
  "/games/nintendo-64/banjo-tooie/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d12-/kIthIbHQ/p2hh7ae37vVwmG3j8\"",
    "mtime": "2026-01-08T06:14:06.932Z",
    "size": 3346,
    "path": "../public/games/nintendo-64/banjo-tooie/index.html"
  },
  "/games/nintendo-64/banjo-tooie/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"260-VFoyubOHMyzl2XEz5qkM1Z6gghU\"",
    "mtime": "2026-01-08T06:14:10.481Z",
    "size": 608,
    "path": "../public/games/nintendo-64/banjo-tooie/_payload.json"
  },
  "/games/nintendo-64/conkers-bad-fur-day/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d52-U0RAFETD7sQj3bTbJ/8di/t4plk\"",
    "mtime": "2026-01-08T06:14:07.242Z",
    "size": 3410,
    "path": "../public/games/nintendo-64/conkers-bad-fur-day/index.html"
  },
  "/games/nintendo-64/conkers-bad-fur-day/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"268-BT+fpoB2/dYQiIIYni3lttIw+ys\"",
    "mtime": "2026-01-08T06:14:10.569Z",
    "size": 616,
    "path": "../public/games/nintendo-64/conkers-bad-fur-day/_payload.json"
  },
  "/games/nintendo-64/diddy-kong-racing/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"de4-e8+Qa+LGMAzSeZOUIjhx1ewJo5c\"",
    "mtime": "2026-01-08T06:14:07.271Z",
    "size": 3556,
    "path": "../public/games/nintendo-64/diddy-kong-racing/index.html"
  },
  "/games/nintendo-64/diddy-kong-racing/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"2c2-vtCre0T96OynK4KApoMKjkwNOWg\"",
    "mtime": "2026-01-08T06:14:10.664Z",
    "size": 706,
    "path": "../public/games/nintendo-64/diddy-kong-racing/_payload.json"
  },
  "/games/nintendo-64/doom-64/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"cfa-onibS5tzYbEo2DA6sj4LPrn4rB8\"",
    "mtime": "2026-01-08T06:14:07.522Z",
    "size": 3322,
    "path": "../public/games/nintendo-64/doom-64/index.html"
  },
  "/games/nintendo-64/doom-64/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"262-8L15CzKqWbFqlR5WbpMd3x3ADTM\"",
    "mtime": "2026-01-08T06:14:10.698Z",
    "size": 610,
    "path": "../public/games/nintendo-64/doom-64/_payload.json"
  },
  "/games/nintendo-64/forsaken-64/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"db7-Fefl9dF6vCYCcOPBdyNq0t6S24o\"",
    "mtime": "2026-01-08T06:14:06.681Z",
    "size": 3511,
    "path": "../public/games/nintendo-64/forsaken-64/index.html"
  },
  "/games/nintendo-64/forsaken-64/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"2bc-ngM+c83zrkpeLFK7gOnsL4L1q8g\"",
    "mtime": "2026-01-08T06:14:10.438Z",
    "size": 700,
    "path": "../public/games/nintendo-64/forsaken-64/_payload.json"
  },
  "/games/nintendo-64/gauntlet-legends/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d2a-tjczlB5xfkTnZ8kD6WcXCKUCM+M\"",
    "mtime": "2026-01-08T06:14:07.983Z",
    "size": 3370,
    "path": "../public/games/nintendo-64/gauntlet-legends/index.html"
  },
  "/games/nintendo-64/gauntlet-legends/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"262-DWSfHh7CGqT6EuDKCSt7PNl0Kq8\"",
    "mtime": "2026-01-08T06:14:10.871Z",
    "size": 610,
    "path": "../public/games/nintendo-64/gauntlet-legends/_payload.json"
  },
  "/games/nintendo-64/glover/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"cee-F1ahsvNa5P0gz+DEXZyFMOjDXaU\"",
    "mtime": "2026-01-08T06:14:08.039Z",
    "size": 3310,
    "path": "../public/games/nintendo-64/glover/index.html"
  },
  "/games/nintendo-64/glover/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"258-2IOQknXpcndD+8Z0qB3GRlkF3YA\"",
    "mtime": "2026-01-08T06:14:10.872Z",
    "size": 600,
    "path": "../public/games/nintendo-64/glover/_payload.json"
  },
  "/games/nintendo-64/hexen/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"1026-7I8AwfZb7ApIojb8ZmsItRMet6g\"",
    "mtime": "2026-01-08T06:14:08.174Z",
    "size": 4134,
    "path": "../public/games/nintendo-64/hexen/index.html"
  },
  "/games/nintendo-64/hexen/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"468-tMBE9NDbCgGRvvCi6rz/xGK+lEE\"",
    "mtime": "2026-01-08T06:14:10.962Z",
    "size": 1128,
    "path": "../public/games/nintendo-64/hexen/_payload.json"
  },
  "/games/nintendo-64/legend-of-zelda-majoras-mask-jp/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d9c-h2HbBH9uncaHE1OGsbbZcoU1xvs\"",
    "mtime": "2026-01-08T06:14:08.376Z",
    "size": 3484,
    "path": "../public/games/nintendo-64/legend-of-zelda-majoras-mask-jp/index.html"
  },
  "/games/nintendo-64/legend-of-zelda-majoras-mask-jp/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"275-qwoZ42QaUtg5gxexaYGGtri9yfg\"",
    "mtime": "2026-01-08T06:14:11.034Z",
    "size": 629,
    "path": "../public/games/nintendo-64/legend-of-zelda-majoras-mask-jp/_payload.json"
  },
  "/games/nintendo-64/legend-of-zelda-ocarina-of-time-the/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"e1f-2vjEn/IFSf4qOIF9KshV9gWIaHU\"",
    "mtime": "2026-01-08T06:14:08.519Z",
    "size": 3615,
    "path": "../public/games/nintendo-64/legend-of-zelda-ocarina-of-time-the/index.html"
  },
  "/games/nintendo-64/legend-of-zelda-ocarina-of-time-the/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"2be-KmD2HnIIGsgDCZS6SfNFfMvT8fg\"",
    "mtime": "2026-01-08T06:14:11.077Z",
    "size": 702,
    "path": "../public/games/nintendo-64/legend-of-zelda-ocarina-of-time-the/_payload.json"
  },
  "/games/nintendo-64/mario-kart-64/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d88-v6N6YmY5UIIIhJphl1XRz10tkSw\"",
    "mtime": "2026-01-08T06:14:08.608Z",
    "size": 3464,
    "path": "../public/games/nintendo-64/mario-kart-64/index.html"
  },
  "/games/nintendo-64/mario-kart-64/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"295-W6ZrJCloI8jexP7EeRn6tW1HQQs\"",
    "mtime": "2026-01-08T06:14:11.108Z",
    "size": 661,
    "path": "../public/games/nintendo-64/mario-kart-64/_payload.json"
  },
  "/games/nintendo-64/mario-party/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d0c-yII3Rq3brLAfTR99foSV3nUu3zk\"",
    "mtime": "2026-01-08T06:14:08.686Z",
    "size": 3340,
    "path": "../public/games/nintendo-64/mario-party/index.html"
  },
  "/games/nintendo-64/mario-party/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"263-zb2nvPnvTS3K1MCrlTrCUPfsudI\"",
    "mtime": "2026-01-08T06:14:11.153Z",
    "size": 611,
    "path": "../public/games/nintendo-64/mario-party/_payload.json"
  },
  "/games/nintendo-64/legend-of-zelda-majoras-mask/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d93-zynA3fEW3fEnt7IODSAgvXIs+iE\"",
    "mtime": "2026-01-08T06:14:08.367Z",
    "size": 3475,
    "path": "../public/games/nintendo-64/legend-of-zelda-majoras-mask/index.html"
  },
  "/games/nintendo-64/legend-of-zelda-majoras-mask/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"274-vDbVqcvaqTJYnw14r2lCerH/Ii8\"",
    "mtime": "2026-01-08T06:14:11.034Z",
    "size": 628,
    "path": "../public/games/nintendo-64/legend-of-zelda-majoras-mask/_payload.json"
  },
  "/games/nintendo-64/mario-tennis/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d12-LOzlJK5k77ih1TMlOsjLbBF4XM0\"",
    "mtime": "2026-01-08T06:14:08.608Z",
    "size": 3346,
    "path": "../public/games/nintendo-64/mario-tennis/index.html"
  },
  "/games/nintendo-64/mario-tennis/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25d-uGQkRpZDdBNL9VOO+79yrMMuE+c\"",
    "mtime": "2026-01-08T06:14:11.092Z",
    "size": 605,
    "path": "../public/games/nintendo-64/mario-tennis/_payload.json"
  },
  "/games/nintendo-64/mischief-makers/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d7c-2nTa86zTKoy4ow7ahBtIPPQcuuw\"",
    "mtime": "2026-01-08T06:14:06.675Z",
    "size": 3452,
    "path": "../public/games/nintendo-64/mischief-makers/index.html"
  },
  "/games/nintendo-64/mischief-makers/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"281-TVeGgjpDghfuG3n7vEJN7wR9LpU\"",
    "mtime": "2026-01-08T06:14:10.436Z",
    "size": 641,
    "path": "../public/games/nintendo-64/mischief-makers/_payload.json"
  },
  "/games/nintendo-64/paper-mario/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d0c-oYj3idxQVBhmzqL49KVUiJEE4G0\"",
    "mtime": "2026-01-08T06:14:08.866Z",
    "size": 3340,
    "path": "../public/games/nintendo-64/paper-mario/index.html"
  },
  "/games/nintendo-64/paper-mario/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25d-QKD+yuTexmxEVFE6vmOxi4MK80o\"",
    "mtime": "2026-01-08T06:14:11.259Z",
    "size": 605,
    "path": "../public/games/nintendo-64/paper-mario/_payload.json"
  },
  "/games/nintendo-64/perfect-dark/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"dc0-1rNY/fAIze4R5RfMUjGkHRw0IQE\"",
    "mtime": "2026-01-08T06:14:08.895Z",
    "size": 3520,
    "path": "../public/games/nintendo-64/perfect-dark/index.html"
  },
  "/games/nintendo-64/perfect-dark/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"2c0-c+bHPaUmERMjmqonLwKj4DJSHXI\"",
    "mtime": "2026-01-08T06:14:11.259Z",
    "size": 704,
    "path": "../public/games/nintendo-64/perfect-dark/_payload.json"
  },
  "/games/nintendo-64/pokemon-snap/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d12-w98wytw5YEMmsHn+Usb0Mn7aZEg\"",
    "mtime": "2026-01-08T06:14:09.023Z",
    "size": 3346,
    "path": "../public/games/nintendo-64/pokemon-snap/index.html"
  },
  "/games/nintendo-64/pokemon-snap/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25e-wynMYc2Hby68BuL6M2NYbDAJYPY\"",
    "mtime": "2026-01-08T06:14:11.291Z",
    "size": 606,
    "path": "../public/games/nintendo-64/pokemon-snap/_payload.json"
  },
  "/games/nintendo-64/pokemon-stadium-2/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d36-0lKRayjqMwv0fxtWnUEHMRI1w70\"",
    "mtime": "2026-01-08T06:14:09.039Z",
    "size": 3382,
    "path": "../public/games/nintendo-64/pokemon-stadium-2/index.html"
  },
  "/games/nintendo-64/pokemon-stadium-2/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"266-lldjjEzrqtQ2xKpU4Wu8nruUgHk\"",
    "mtime": "2026-01-08T06:14:11.291Z",
    "size": 614,
    "path": "../public/games/nintendo-64/pokemon-stadium-2/_payload.json"
  },
  "/games/nintendo-64/quest-64/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"cfa-gKeUB+U6zq5H6V7qWzF2J3X4cK4\"",
    "mtime": "2026-01-08T06:14:09.127Z",
    "size": 3322,
    "path": "../public/games/nintendo-64/quest-64/index.html"
  },
  "/games/nintendo-64/quest-64/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25a-M/KO9BXof15xv4hTIltn10aLLuE\"",
    "mtime": "2026-01-08T06:14:11.304Z",
    "size": 602,
    "path": "../public/games/nintendo-64/quest-64/_payload.json"
  },
  "/games/nintendo-64/south-park-64/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d0f-HrjsMQo0dPiJKAepFIzRdlqwjdc\"",
    "mtime": "2026-01-08T06:14:09.466Z",
    "size": 3343,
    "path": "../public/games/nintendo-64/south-park-64/index.html"
  },
  "/games/nintendo-64/south-park-64/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25c-ZSiwkr7iiBX00aHKHkEecZF0m50\"",
    "mtime": "2026-01-08T06:14:11.467Z",
    "size": 604,
    "path": "../public/games/nintendo-64/south-park-64/_payload.json"
  },
  "/games/nintendo-64/star-fox-64/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d0c-xgFlGxV8Wm9rdWb+fqiqPyGSGdA\"",
    "mtime": "2026-01-08T06:14:09.514Z",
    "size": 3340,
    "path": "../public/games/nintendo-64/star-fox-64/index.html"
  },
  "/games/nintendo-64/star-fox-64/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25d-DRJMNGgSCn0LnuX6yW1gqRhJBKs\"",
    "mtime": "2026-01-08T06:14:11.467Z",
    "size": 605,
    "path": "../public/games/nintendo-64/star-fox-64/_payload.json"
  },
  "/games/nintendo-64/star-wars-episode-1-racer/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d62-GHgCGtyCQ+sOE2aLG4gegLe1QTo\"",
    "mtime": "2026-01-08T06:14:09.535Z",
    "size": 3426,
    "path": "../public/games/nintendo-64/star-wars-episode-1-racer/index.html"
  },
  "/games/nintendo-64/star-wars-episode-1-racer/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"26c-jYNHMXYZrJ8pEhH7Trl9LaV3mbI\"",
    "mtime": "2026-01-08T06:14:11.483Z",
    "size": 620,
    "path": "../public/games/nintendo-64/star-wars-episode-1-racer/_payload.json"
  },
  "/games/nintendo-64/star-wars-rogue-squadron/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d5c-VmKmPMLV4JpXX7PZzzAfBNZxesE\"",
    "mtime": "2026-01-08T06:14:09.535Z",
    "size": 3420,
    "path": "../public/games/nintendo-64/star-wars-rogue-squadron/index.html"
  },
  "/games/nintendo-64/star-wars-rogue-squadron/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"26b-oGKKf5qfEZmfvye1Z6X0n4eeX50\"",
    "mtime": "2026-01-08T06:14:11.483Z",
    "size": 619,
    "path": "../public/games/nintendo-64/star-wars-rogue-squadron/_payload.json"
  },
  "/games/nintendo-64/star-wars-shadows-of-the-empire/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"e09-5aWcvW8fAbXfReqA0s2wCilyosw\"",
    "mtime": "2026-01-08T06:14:09.576Z",
    "size": 3593,
    "path": "../public/games/nintendo-64/star-wars-shadows-of-the-empire/index.html"
  },
  "/games/nintendo-64/star-wars-shadows-of-the-empire/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"2c4-UIogFOoYCJjnp5kjqWHUFc36JJs\"",
    "mtime": "2026-01-08T06:14:11.496Z",
    "size": 708,
    "path": "../public/games/nintendo-64/star-wars-shadows-of-the-empire/_payload.json"
  },
  "/games/nintendo-64/super-mario-64/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d1e-So3lHkdPubew8GkIDXYU0Pi27dU\"",
    "mtime": "2026-01-08T06:14:09.619Z",
    "size": 3358,
    "path": "../public/games/nintendo-64/super-mario-64/index.html"
  },
  "/games/nintendo-64/super-mario-64/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"260-XV8OnS6adkMC0dIiAveiKOp1+h8\"",
    "mtime": "2026-01-08T06:14:11.497Z",
    "size": 608,
    "path": "../public/games/nintendo-64/super-mario-64/_payload.json"
  },
  "/games/nintendo-64/super-smash-bros/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d2d-sQ2NXvb8mUBZNX8Uzbsa4n7HgwM\"",
    "mtime": "2026-01-08T06:14:09.694Z",
    "size": 3373,
    "path": "../public/games/nintendo-64/super-smash-bros/index.html"
  },
  "/games/nintendo-64/super-smash-bros/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"262-wr0ezWmor9CWsSnWmIEyPtsrpC4\"",
    "mtime": "2026-01-08T06:14:11.530Z",
    "size": 610,
    "path": "../public/games/nintendo-64/super-smash-bros/_payload.json"
  },
  "/games/nintendo-64/yoshis-story/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d22-/HnsmGdgkWO2W/Wm6v/tRsQCcsI\"",
    "mtime": "2026-01-08T06:14:10.001Z",
    "size": 3362,
    "path": "../public/games/nintendo-64/yoshis-story/index.html"
  },
  "/games/nintendo-64/yoshis-story/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25f-RiVO6//XTpiJyHzAyO3b67JhADQ\"",
    "mtime": "2026-01-08T06:14:11.675Z",
    "size": 607,
    "path": "../public/games/nintendo-64/yoshis-story/_payload.json"
  },
  "/games/nintendo-64/turok-2-seeds-of-evil/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d50-6TqxTgRVrOZkDg9kSNY4eZUxVzk\"",
    "mtime": "2026-01-08T06:14:09.890Z",
    "size": 3408,
    "path": "../public/games/nintendo-64/turok-2-seeds-of-evil/index.html"
  },
  "/games/nintendo-64/turok-2-seeds-of-evil/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"26b-7xNPaNvzXWYduw3XfoV/3N5X0y8\"",
    "mtime": "2026-01-08T06:14:11.613Z",
    "size": 619,
    "path": "../public/games/nintendo-64/turok-2-seeds-of-evil/_payload.json"
  },
  "/games/nintendo-ds/chrono-trigger-ds/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d2d-JO/vU3xtLR6RnfaA/If+TfINC9U\"",
    "mtime": "2026-01-08T06:14:07.170Z",
    "size": 3373,
    "path": "../public/games/nintendo-ds/chrono-trigger-ds/index.html"
  },
  "/games/nintendo-ds/chrono-trigger-ds/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"262-hGEeNRf/c9Tj9wNM+Uo1DFkX9gg\"",
    "mtime": "2026-01-08T06:14:10.569Z",
    "size": 610,
    "path": "../public/games/nintendo-ds/chrono-trigger-ds/_payload.json"
  },
  "/games/nintendo-ds/dementium-ii/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d12-yjDzfdW8b6kEc1qkFblXTCz2Zcg\"",
    "mtime": "2026-01-08T06:14:07.250Z",
    "size": 3346,
    "path": "../public/games/nintendo-ds/dementium-ii/index.html"
  },
  "/games/nintendo-ds/dementium-ii/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25d-ql9Z14VfyynMHVIBK/Mr1KTdM9Y\"",
    "mtime": "2026-01-08T06:14:10.624Z",
    "size": 605,
    "path": "../public/games/nintendo-ds/dementium-ii/_payload.json"
  },
  "/games/nintendo-ds/dementium-the-ward/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d38-9BB6JAor11L8Va1HfYaZys0i51A\"",
    "mtime": "2026-01-08T06:14:07.271Z",
    "size": 3384,
    "path": "../public/games/nintendo-ds/dementium-the-ward/index.html"
  },
  "/games/nintendo-ds/dementium-the-ward/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"264-RhQPYjpyzci7l6nB64waZjWyHlg\"",
    "mtime": "2026-01-08T06:14:10.648Z",
    "size": 612,
    "path": "../public/games/nintendo-ds/dementium-the-ward/_payload.json"
  },
  "/games/nintendo-ds/final-fantasy-crystal-chronicles-echoes-of-time-ds/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"df5-t6U68M0DvyoF2WdalZCxzQ07TEs\"",
    "mtime": "2026-01-08T06:14:07.720Z",
    "size": 3573,
    "path": "../public/games/nintendo-ds/final-fantasy-crystal-chronicles-echoes-of-time-ds/index.html"
  },
  "/games/nintendo-ds/final-fantasy-crystal-chronicles-echoes-of-time-ds/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"284-JkX9mv+GmUvS2lVSYCEwf+q8GeE\"",
    "mtime": "2026-01-08T06:14:10.770Z",
    "size": 644,
    "path": "../public/games/nintendo-ds/final-fantasy-crystal-chronicles-echoes-of-time-ds/_payload.json"
  },
  "/games/nintendo-ds/final-fantasy-crystal-chronicles-ring-of-fates/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"de0-gvaSFfAbNKF7P9yvXsST/6MIkaA\"",
    "mtime": "2026-01-08T06:14:07.720Z",
    "size": 3552,
    "path": "../public/games/nintendo-ds/final-fantasy-crystal-chronicles-ring-of-fates/index.html"
  },
  "/games/nintendo-ds/final-fantasy-crystal-chronicles-ring-of-fates/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"280-mwJiT+zrtWRswX8OV7pdFUxknZc\"",
    "mtime": "2026-01-08T06:14:10.769Z",
    "size": 640,
    "path": "../public/games/nintendo-ds/final-fantasy-crystal-chronicles-ring-of-fates/_payload.json"
  },
  "/games/nintendo-ds/final-fantasy-iv/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d30-dKVs44gRu/xGxvk9NARB+iVq0jQ\"",
    "mtime": "2026-01-08T06:14:07.780Z",
    "size": 3376,
    "path": "../public/games/nintendo-ds/final-fantasy-iv/index.html"
  },
  "/games/nintendo-ds/final-fantasy-iv/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"264-jMRXR25Pd2Xo1EUA2VSoqFEkZCs\"",
    "mtime": "2026-01-08T06:14:10.783Z",
    "size": 612,
    "path": "../public/games/nintendo-ds/final-fantasy-iv/_payload.json"
  },
  "/games/nintendo-ds/final-fantasy-iii-ds/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d39-YHSedf9ox3lxexgb+Q5b6/EKBYE\"",
    "mtime": "2026-01-08T06:14:07.798Z",
    "size": 3385,
    "path": "../public/games/nintendo-ds/final-fantasy-iii-ds/index.html"
  },
  "/games/nintendo-ds/final-fantasy-iii-ds/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"262-rjvsC/NaTEDLokeG699SDNU1mKA\"",
    "mtime": "2026-01-08T06:14:10.835Z",
    "size": 610,
    "path": "../public/games/nintendo-ds/final-fantasy-iii-ds/_payload.json"
  },
  "/games/nintendo-ds/final-fantasy-xii-revenant-wings/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d8c-R05WHM48+ZV5+N8x9KU1im1RvOg\"",
    "mtime": "2026-01-08T06:14:07.798Z",
    "size": 3468,
    "path": "../public/games/nintendo-ds/final-fantasy-xii-revenant-wings/index.html"
  },
  "/games/nintendo-ds/final-fantasy-xii-revenant-wings/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"272-ZV1i73NzdRU6zerUsqO+aR3jxLs\"",
    "mtime": "2026-01-08T06:14:10.835Z",
    "size": 626,
    "path": "../public/games/nintendo-ds/final-fantasy-xii-revenant-wings/_payload.json"
  },
  "/games/nintendo-ds/legend-of-zelda-phantom-hourglass-the/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"db3-79i8n3mGcKF7Y8e+QkhRgmEjCbI\"",
    "mtime": "2026-01-08T06:14:08.435Z",
    "size": 3507,
    "path": "../public/games/nintendo-ds/legend-of-zelda-phantom-hourglass-the/index.html"
  },
  "/games/nintendo-ds/legend-of-zelda-phantom-hourglass-the/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"27b-v3j1cIfRRRK/I3pd1QwgHt9/POM\"",
    "mtime": "2026-01-08T06:14:11.055Z",
    "size": 635,
    "path": "../public/games/nintendo-ds/legend-of-zelda-phantom-hourglass-the/_payload.json"
  },
  "/games/nintendo-ds/legend-of-zelda-spirit-tracks-the/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d9b-xT57l3NFPe/5/MqzJigqNhAhbxY\"",
    "mtime": "2026-01-08T06:14:08.463Z",
    "size": 3483,
    "path": "../public/games/nintendo-ds/legend-of-zelda-spirit-tracks-the/index.html"
  },
  "/games/nintendo-ds/legend-of-zelda-spirit-tracks-the/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"277-aQ3wy8OdAXgBRuM64KnMXsmFHeQ\"",
    "mtime": "2026-01-08T06:14:11.055Z",
    "size": 631,
    "path": "../public/games/nintendo-ds/legend-of-zelda-spirit-tracks-the/_payload.json"
  },
  "/games/nintendo-ds/moon/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d38-fFt43Kdh5HzSqI2W6HxR4X/uzHg\"",
    "mtime": "2026-01-08T06:14:08.781Z",
    "size": 3384,
    "path": "../public/games/nintendo-ds/moon/index.html"
  },
  "/games/nintendo-ds/moon/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"277-/AkWpGUXduT5fmTYZL/4hf4G79c\"",
    "mtime": "2026-01-08T06:14:11.176Z",
    "size": 631,
    "path": "../public/games/nintendo-ds/moon/_payload.json"
  },
  "/games/nintendo-ds/okamiden/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d00-XGCRtXGSo6b0aEoQ5W9nnMjsuOI\"",
    "mtime": "2026-01-08T06:14:08.866Z",
    "size": 3328,
    "path": "../public/games/nintendo-ds/okamiden/index.html"
  },
  "/games/nintendo-ds/okamiden/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25b-tJUkBy4BEScDbrXW8kUFY0G2ry8\"",
    "mtime": "2026-01-08T06:14:11.244Z",
    "size": 603,
    "path": "../public/games/nintendo-ds/okamiden/_payload.json"
  },
  "/games/nintendo-ds/pokemon-white/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d1e-JIXZD3FYJjg9rB2Uj2qlIodOpuA\"",
    "mtime": "2026-01-08T06:14:09.121Z",
    "size": 3358,
    "path": "../public/games/nintendo-ds/pokemon-white/index.html"
  },
  "/games/nintendo-ds/pokemon-white/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"261-CWfqEWPiVFSM0KZayFxL9grXBSY\"",
    "mtime": "2026-01-08T06:14:11.304Z",
    "size": 609,
    "path": "../public/games/nintendo-ds/pokemon-white/_payload.json"
  },
  "/games/nintendo-ds/super-mario-64-ds/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d30-hH+TTiCN8DV2PD9714Qfjk7uTic\"",
    "mtime": "2026-01-08T06:14:09.619Z",
    "size": 3376,
    "path": "../public/games/nintendo-ds/super-mario-64-ds/index.html"
  },
  "/games/nintendo-ds/super-mario-64-ds/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"261-BokP3s8apwULI/SLNPHMh3ASpTs\"",
    "mtime": "2026-01-08T06:14:11.511Z",
    "size": 609,
    "path": "../public/games/nintendo-ds/super-mario-64-ds/_payload.json"
  },
  "/games/pc/age-of-empires/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"ea2-bG/Cls9G4GKmMc9yZytOlS7d2Bw\"",
    "mtime": "2026-01-08T06:14:06.710Z",
    "size": 3746,
    "path": "../public/games/pc/age-of-empires/index.html"
  },
  "/games/pc/age-of-empires/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"331-Ig1ikZBq51oP2heV692rb/YMSL0\"",
    "mtime": "2026-01-08T06:14:10.456Z",
    "size": 817,
    "path": "../public/games/pc/age-of-empires/_payload.json"
  },
  "/games/pc/chasm-the-rift/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"f04-daayjht3wj9t5PoEithKnelTylk\"",
    "mtime": "2026-01-08T06:14:06.702Z",
    "size": 3844,
    "path": "../public/games/pc/chasm-the-rift/index.html"
  },
  "/games/pc/chasm-the-rift/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"395-2rvoKtejYBOV7qM4fjA6qBerL08\"",
    "mtime": "2026-01-08T06:14:10.456Z",
    "size": 917,
    "path": "../public/games/pc/chasm-the-rift/_payload.json"
  },
  "/games/pc/divinity-original-sin-2/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"eab-k1jFiqGvLE7bfji9y1ReecIRUyI\"",
    "mtime": "2026-01-08T06:14:07.464Z",
    "size": 3755,
    "path": "../public/games/pc/divinity-original-sin-2/index.html"
  },
  "/games/pc/divinity-original-sin-2/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"37f-7Wa337+LOqibVp4SCOUqIhIhhbg\"",
    "mtime": "2026-01-08T06:14:10.683Z",
    "size": 895,
    "path": "../public/games/pc/divinity-original-sin-2/_payload.json"
  },
  "/games/pc/elden-ring/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d12-TcI5/iFFNcYiaH49wvZBVzY7T3U\"",
    "mtime": "2026-01-08T06:14:07.531Z",
    "size": 3346,
    "path": "../public/games/pc/elden-ring/index.html"
  },
  "/games/pc/elden-ring/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"244-qgO4mM1+toFgteAAZV2ec2o52wk\"",
    "mtime": "2026-01-08T06:14:10.737Z",
    "size": 580,
    "path": "../public/games/pc/elden-ring/_payload.json"
  },
  "/games/pc/icewind-dale/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"cd9-UAb22Ky6ms1d7MjQcm7ERxB9EUk\"",
    "mtime": "2026-01-08T06:14:08.082Z",
    "size": 3289,
    "path": "../public/games/pc/icewind-dale/index.html"
  },
  "/games/pc/icewind-dale/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"237-hiTu/ZXVsxE7W9q3v4i0yUm/4HM\"",
    "mtime": "2026-01-08T06:14:10.943Z",
    "size": 567,
    "path": "../public/games/pc/icewind-dale/_payload.json"
  },
  "/games/pc/iron-storm/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"11e2-OFL2Z2Leu4j4BgR2SFyzUidum1U\"",
    "mtime": "2026-01-08T06:14:06.681Z",
    "size": 4578,
    "path": "../public/games/pc/iron-storm/index.html"
  },
  "/games/pc/iron-storm/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"5af-fazZMsOKCu9aEey8idhIjDxJYpE\"",
    "mtime": "2026-01-08T06:14:10.436Z",
    "size": 1455,
    "path": "../public/games/pc/iron-storm/_payload.json"
  },
  "/games/pc/life-is-strange-true-colors/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"e4a-k5ZZB9XIgVWnJ+d9Mv5aXsSOIEI\"",
    "mtime": "2026-01-08T06:14:08.522Z",
    "size": 3658,
    "path": "../public/games/pc/life-is-strange-true-colors/index.html"
  },
  "/games/pc/life-is-strange-true-colors/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"2fd-DpY61pfhHBxAAU/NQHDyipSnd2o\"",
    "mtime": "2026-01-08T06:14:11.078Z",
    "size": 765,
    "path": "../public/games/pc/life-is-strange-true-colors/_payload.json"
  },
  "/games/pc/might-and-magic-vii-for-blood-and-honor/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"1148-MeuWrsDWg7+CwYLu4OaJn54zIRs\"",
    "mtime": "2026-01-08T06:14:08.835Z",
    "size": 4424,
    "path": "../public/games/pc/might-and-magic-vii-for-blood-and-honor/index.html"
  },
  "/games/pc/might-and-magic-vii-for-blood-and-honor/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"4d5-jGIJsxC2dpH8+1u6J1VOvfeDH7k\"",
    "mtime": "2026-01-08T06:14:11.205Z",
    "size": 1237,
    "path": "../public/games/pc/might-and-magic-vii-for-blood-and-honor/_payload.json"
  },
  "/games/pc/nox/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"11b0-lelcOKWz/796q9fNq+BSTpsDh/w\"",
    "mtime": "2026-01-08T06:14:06.702Z",
    "size": 4528,
    "path": "../public/games/pc/nox/index.html"
  },
  "/games/pc/nox/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"5a0-8yKHlicAwMpKt18HG00UFIYgfQo\"",
    "mtime": "2026-01-08T06:14:10.453Z",
    "size": 1440,
    "path": "../public/games/pc/nox/_payload.json"
  },
  "/games/pc/realms-of-the-haunting/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"f3e-TdNzPJbMsMycaFM/GZmo44/mi7s\"",
    "mtime": "2026-01-08T06:14:09.127Z",
    "size": 3902,
    "path": "../public/games/pc/realms-of-the-haunting/index.html"
  },
  "/games/pc/realms-of-the-haunting/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"3a4-kvzjGMnurWr6m17oFdMMVC5UFro\"",
    "mtime": "2026-01-08T06:14:11.320Z",
    "size": 932,
    "path": "../public/games/pc/realms-of-the-haunting/_payload.json"
  },
  "/games/nintendo-entertainment-system/1943-the-battle-of-midway/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"e2d-w3SUMyRxAoQtHvm7v0FPCoEbRGc\"",
    "mtime": "2026-01-08T06:14:06.731Z",
    "size": 3629,
    "path": "../public/games/nintendo-entertainment-system/1943-the-battle-of-midway/index.html"
  },
  "/games/nintendo-entertainment-system/1943-the-battle-of-midway/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"2a9-SKI+AyVgwkxIcM+0UQ0x7zJYNto\"",
    "mtime": "2026-01-08T06:14:10.469Z",
    "size": 681,
    "path": "../public/games/nintendo-entertainment-system/1943-the-battle-of-midway/_payload.json"
  },
  "/games/nintendo-entertainment-system/8-bit-xmas-2022/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"1037-8dHN1alExhFYNysGRolV40kIOdw\"",
    "mtime": "2026-01-08T06:14:06.744Z",
    "size": 4151,
    "path": "../public/games/nintendo-entertainment-system/8-bit-xmas-2022/index.html"
  },
  "/games/nintendo-entertainment-system/8-bit-xmas-2022/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"405-WoZZP4HeGZ8znW0YWKtGhmYmuXs\"",
    "mtime": "2026-01-08T06:14:10.469Z",
    "size": 1029,
    "path": "../public/games/nintendo-entertainment-system/8-bit-xmas-2022/_payload.json"
  },
  "/games/nintendo-entertainment-system/abadox-the-deadly-inner-war/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"e45-toIKsh+zIoV6VG5Ldn+j5Zw6L6Q\"",
    "mtime": "2026-01-08T06:14:06.744Z",
    "size": 3653,
    "path": "../public/games/nintendo-entertainment-system/abadox-the-deadly-inner-war/index.html"
  },
  "/games/nintendo-entertainment-system/abadox-the-deadly-inner-war/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"2b1-E9YsUR487fg50WCjq8/nZzDOaDo\"",
    "mtime": "2026-01-08T06:14:10.469Z",
    "size": 689,
    "path": "../public/games/nintendo-entertainment-system/abadox-the-deadly-inner-war/_payload.json"
  },
  "/games/nintendo-entertainment-system/adventure-island/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"e5b-BrdvfG2Nh+U/nY2wgiJSx3Tz/l0\"",
    "mtime": "2026-01-08T06:14:06.744Z",
    "size": 3675,
    "path": "../public/games/nintendo-entertainment-system/adventure-island/index.html"
  },
  "/games/nintendo-entertainment-system/adventure-island/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"2e9-LoySrxplqWgmrEwz5xC+GuTTtLk\"",
    "mtime": "2026-01-08T06:14:10.469Z",
    "size": 745,
    "path": "../public/games/nintendo-entertainment-system/adventure-island/_payload.json"
  },
  "/games/nintendo-entertainment-system/adventure-island-3/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"db4-ho6Ad0e93sQ7ykdqoxYBB3AMOxg\"",
    "mtime": "2026-01-08T06:14:06.744Z",
    "size": 3508,
    "path": "../public/games/nintendo-entertainment-system/adventure-island-3/index.html"
  },
  "/games/nintendo-entertainment-system/adventure-island-3/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"288-MGLVRcNCvjBZVWsuF4xYJbKac7Q\"",
    "mtime": "2026-01-08T06:14:10.469Z",
    "size": 648,
    "path": "../public/games/nintendo-entertainment-system/adventure-island-3/_payload.json"
  },
  "/games/nintendo-entertainment-system/adventures-of-dino-riki/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"10ff-9gmkUjx6S3M36g6Mbyf163koWuA\"",
    "mtime": "2026-01-08T06:14:06.744Z",
    "size": 4351,
    "path": "../public/games/nintendo-entertainment-system/adventures-of-dino-riki/index.html"
  },
  "/games/nintendo-entertainment-system/adventures-of-dino-riki/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"48c-KwdFoKGdwuWLMsXUp0+R3Lm/YA4\"",
    "mtime": "2026-01-08T06:14:10.469Z",
    "size": 1164,
    "path": "../public/games/nintendo-entertainment-system/adventures-of-dino-riki/_payload.json"
  },
  "/games/nintendo-entertainment-system/adventure-island-ii/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"e6d-eBRNGm55nHjIqbnHGxN/bPYq7hM\"",
    "mtime": "2026-01-08T06:14:06.932Z",
    "size": 3693,
    "path": "../public/games/nintendo-entertainment-system/adventure-island-ii/index.html"
  },
  "/games/nintendo-entertainment-system/adventure-island-ii/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"2ed-lvKTSwqEFn8Lq3c4pdq1TSdnMrk\"",
    "mtime": "2026-01-08T06:14:10.481Z",
    "size": 749,
    "path": "../public/games/nintendo-entertainment-system/adventure-island-ii/_payload.json"
  },
  "/games/nintendo-entertainment-system/alwas-awakening/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"db8-8G6sgEvCn+Q+WnxZ9S+GegplPXI\"",
    "mtime": "2026-01-08T06:14:06.837Z",
    "size": 3512,
    "path": "../public/games/nintendo-entertainment-system/alwas-awakening/index.html"
  },
  "/games/nintendo-entertainment-system/alwas-awakening/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"28f-+Ta6KijsLk/NYjO5HmY3b+oJGFg\"",
    "mtime": "2026-01-08T06:14:10.469Z",
    "size": 655,
    "path": "../public/games/nintendo-entertainment-system/alwas-awakening/_payload.json"
  },
  "/games/nintendo-entertainment-system/astyanax/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"dd1-2SSQaJ8DO701iIaIWvG4TwxZ5s4\"",
    "mtime": "2026-01-08T06:14:06.940Z",
    "size": 3537,
    "path": "../public/games/nintendo-entertainment-system/astyanax/index.html"
  },
  "/games/nintendo-entertainment-system/astyanax/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"29d-jJ49Z2nGi04CKoWcBfuG1pjV804\"",
    "mtime": "2026-01-08T06:14:10.496Z",
    "size": 669,
    "path": "../public/games/nintendo-entertainment-system/astyanax/_payload.json"
  },
  "/games/nintendo-entertainment-system/battletoads/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d90-VgnGntzaA5wTCRCd/hpQj97hZ4Y\"",
    "mtime": "2026-01-08T06:14:06.940Z",
    "size": 3472,
    "path": "../public/games/nintendo-entertainment-system/battletoads/index.html"
  },
  "/games/nintendo-entertainment-system/battletoads/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"284-UcFIoAYbadN7qx3MkHO1jXV0/xc\"",
    "mtime": "2026-01-08T06:14:10.496Z",
    "size": 644,
    "path": "../public/games/nintendo-entertainment-system/battletoads/_payload.json"
  },
  "/games/nintendo-entertainment-system/batman/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d6c-n55sHs3PfY+/zhBjBhdrbAmsrQc\"",
    "mtime": "2026-01-08T06:14:06.940Z",
    "size": 3436,
    "path": "../public/games/nintendo-entertainment-system/batman/index.html"
  },
  "/games/nintendo-entertainment-system/batman/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"27c-YKNuZNWBfpN0Pu5u11mHPZ9jqbA\"",
    "mtime": "2026-01-08T06:14:10.488Z",
    "size": 636,
    "path": "../public/games/nintendo-entertainment-system/batman/_payload.json"
  },
  "/games/nintendo-entertainment-system/blaster-master/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"da4-jM7ID8ewBkEP3a7pFmzIIIKbqiI\"",
    "mtime": "2026-01-08T06:14:06.932Z",
    "size": 3492,
    "path": "../public/games/nintendo-entertainment-system/blaster-master/index.html"
  },
  "/games/nintendo-entertainment-system/blaster-master/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"288-ZW41oq8cHz4yXcXytPYNQclaqUc\"",
    "mtime": "2026-01-08T06:14:10.481Z",
    "size": 648,
    "path": "../public/games/nintendo-entertainment-system/blaster-master/_payload.json"
  },
  "/games/nintendo-entertainment-system/castlevania/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d8a-ya/OgwsscEsG+2X2c/Ht1Nea5PE\"",
    "mtime": "2026-01-08T06:14:06.977Z",
    "size": 3466,
    "path": "../public/games/nintendo-entertainment-system/castlevania/index.html"
  },
  "/games/nintendo-entertainment-system/castlevania/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"281-5QyEjj0GiuYw+h4LQJo52c3whUw\"",
    "mtime": "2026-01-08T06:14:10.538Z",
    "size": 641,
    "path": "../public/games/nintendo-entertainment-system/castlevania/_payload.json"
  },
  "/games/nintendo-entertainment-system/castlevania-ii-simons-quest/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"e02-VhiyGBHNDpaAQfA8fPEfq5mNLDs\"",
    "mtime": "2026-01-08T06:14:07.026Z",
    "size": 3586,
    "path": "../public/games/nintendo-entertainment-system/castlevania-ii-simons-quest/index.html"
  },
  "/games/nintendo-entertainment-system/castlevania-ii-simons-quest/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"296-VOVxHGxQyaNqslUlkWquEjn7J8k\"",
    "mtime": "2026-01-08T06:14:10.569Z",
    "size": 662,
    "path": "../public/games/nintendo-entertainment-system/castlevania-ii-simons-quest/_payload.json"
  },
  "/games/nintendo-entertainment-system/castlevania-iii-draculas-curse/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"e14-lXImu0mGQWeIati/RnTzPaYij+k\"",
    "mtime": "2026-01-08T06:14:07.011Z",
    "size": 3604,
    "path": "../public/games/nintendo-entertainment-system/castlevania-iii-draculas-curse/index.html"
  },
  "/games/nintendo-entertainment-system/castlevania-iii-draculas-curse/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"299-ArsDLhU2KtRvHdBJbWOh+XemUfs\"",
    "mtime": "2026-01-08T06:14:10.554Z",
    "size": 665,
    "path": "../public/games/nintendo-entertainment-system/castlevania-iii-draculas-curse/_payload.json"
  },
  "/games/nintendo-entertainment-system/contra/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"dc5-q0A1GbCM5h5JEAqfPFJeqLPmYOk\"",
    "mtime": "2026-01-08T06:14:07.242Z",
    "size": 3525,
    "path": "../public/games/nintendo-entertainment-system/contra/index.html"
  },
  "/games/nintendo-entertainment-system/contra/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"29b-KGla6SDdM8kK3qnla50jHJYHa6o\"",
    "mtime": "2026-01-08T06:14:10.579Z",
    "size": 667,
    "path": "../public/games/nintendo-entertainment-system/contra/_payload.json"
  },
  "/games/nintendo-entertainment-system/darkwing-duck/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"dec-td5CbrRVAEPI8MCqktbsgyX37TM\"",
    "mtime": "2026-01-08T06:14:07.250Z",
    "size": 3564,
    "path": "../public/games/nintendo-entertainment-system/darkwing-duck/index.html"
  },
  "/games/nintendo-entertainment-system/darkwing-duck/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"2a1-eGGQfmjIHwNe/8tNuikRL3gW80o\"",
    "mtime": "2026-01-08T06:14:10.602Z",
    "size": 673,
    "path": "../public/games/nintendo-entertainment-system/darkwing-duck/_payload.json"
  },
  "/games/nintendo-entertainment-system/double-dragon/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"def-LfcWAIQItEeD0sTgqlcPKbeV2mI\"",
    "mtime": "2026-01-08T06:14:07.522Z",
    "size": 3567,
    "path": "../public/games/nintendo-entertainment-system/double-dragon/index.html"
  },
  "/games/nintendo-entertainment-system/double-dragon/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"2a1-Unhlvie/w0b2BPAEKofzB3afSKc\"",
    "mtime": "2026-01-08T06:14:10.693Z",
    "size": 673,
    "path": "../public/games/nintendo-entertainment-system/double-dragon/_payload.json"
  },
  "/games/nintendo-entertainment-system/dr-mario/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d7b-KgPhQld+tVXlIY2bI19l7o2c2mE\"",
    "mtime": "2026-01-08T06:14:07.531Z",
    "size": 3451,
    "path": "../public/games/nintendo-entertainment-system/dr-mario/index.html"
  },
  "/games/nintendo-entertainment-system/dr-mario/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"27f-kiV8hdBr9u6p+Y+5sekRiOHeQ3U\"",
    "mtime": "2026-01-08T06:14:10.737Z",
    "size": 639,
    "path": "../public/games/nintendo-entertainment-system/dr-mario/_payload.json"
  },
  "/games/nintendo-entertainment-system/dragon-warrior/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d9c-JoJ9wDvMdW6pzuoohPndejxkfoQ\"",
    "mtime": "2026-01-08T06:14:07.522Z",
    "size": 3484,
    "path": "../public/games/nintendo-entertainment-system/dragon-warrior/index.html"
  },
  "/games/nintendo-entertainment-system/dragon-warrior/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"284-dPKkYi7/ljzHEFbfVJhGQjbeKIc\"",
    "mtime": "2026-01-08T06:14:10.698Z",
    "size": 644,
    "path": "../public/games/nintendo-entertainment-system/dragon-warrior/_payload.json"
  },
  "/games/nintendo-entertainment-system/dragon-warrior-ii/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"db4-F2oIC1pTrzuOa4r/lMhewO26HXk\"",
    "mtime": "2026-01-08T06:14:07.522Z",
    "size": 3508,
    "path": "../public/games/nintendo-entertainment-system/dragon-warrior-ii/index.html"
  },
  "/games/nintendo-entertainment-system/dragon-warrior-ii/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"28a-8OGpmNhLTH2UHYAn67XLwaiP9AY\"",
    "mtime": "2026-01-08T06:14:10.698Z",
    "size": 650,
    "path": "../public/games/nintendo-entertainment-system/dragon-warrior-ii/_payload.json"
  },
  "/games/nintendo-entertainment-system/dragon-warrior-iii/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"dba-lxbEi5dl+7kd3PqqSC3F6uDhZ+g\"",
    "mtime": "2026-01-08T06:14:07.522Z",
    "size": 3514,
    "path": "../public/games/nintendo-entertainment-system/dragon-warrior-iii/index.html"
  },
  "/games/nintendo-entertainment-system/dragon-warrior-iii/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"28b-GXKqWptBSbQo2tsEmfKkSB6019k\"",
    "mtime": "2026-01-08T06:14:10.714Z",
    "size": 651,
    "path": "../public/games/nintendo-entertainment-system/dragon-warrior-iii/_payload.json"
  },
  "/games/nintendo-entertainment-system/dragon-warrior-iv/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"db4-vYB0q06D1r3M/3A2Epoy3dm0xcc\"",
    "mtime": "2026-01-08T06:14:07.522Z",
    "size": 3508,
    "path": "../public/games/nintendo-entertainment-system/dragon-warrior-iv/index.html"
  },
  "/games/nintendo-entertainment-system/dragon-warrior-iv/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"28a-2jA80fKVKt2d57dn/+xAq9GEkwU\"",
    "mtime": "2026-01-08T06:14:10.714Z",
    "size": 650,
    "path": "../public/games/nintendo-entertainment-system/dragon-warrior-iv/_payload.json"
  },
  "/games/nintendo-entertainment-system/ducktales/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d7e-KURK8H1sF5nHSe71knlOu8zSN8g\"",
    "mtime": "2026-01-08T06:14:07.531Z",
    "size": 3454,
    "path": "../public/games/nintendo-entertainment-system/ducktales/index.html"
  },
  "/games/nintendo-entertainment-system/ducktales/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"27f-wt+ilnLw9E4FnG+tsT3I2iRKaZs\"",
    "mtime": "2026-01-08T06:14:10.715Z",
    "size": 639,
    "path": "../public/games/nintendo-entertainment-system/ducktales/_payload.json"
  },
  "/games/nintendo-entertainment-system/dynowarz-destruction-of-spondylus/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"e10-mrND2mf0lkCe8fyo2Lw0xNI7TdQ\"",
    "mtime": "2026-01-08T06:14:07.531Z",
    "size": 3600,
    "path": "../public/games/nintendo-entertainment-system/dynowarz-destruction-of-spondylus/index.html"
  },
  "/games/nintendo-entertainment-system/dynowarz-destruction-of-spondylus/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"298-0mI6HLX4lPq4n5XCLsj5hriOmVo\"",
    "mtime": "2026-01-08T06:14:10.715Z",
    "size": 664,
    "path": "../public/games/nintendo-entertainment-system/dynowarz-destruction-of-spondylus/_payload.json"
  },
  "/games/nintendo-entertainment-system/final-fantasy/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"e15-Pbhn1HHFFg3GLBUJgx5gxTdreag\"",
    "mtime": "2026-01-08T06:14:07.711Z",
    "size": 3605,
    "path": "../public/games/nintendo-entertainment-system/final-fantasy/index.html"
  },
  "/games/nintendo-entertainment-system/final-fantasy/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"2c8-JNAO8+ktcUD7LIZR3FkAtryZMFw\"",
    "mtime": "2026-01-08T06:14:10.769Z",
    "size": 712,
    "path": "../public/games/nintendo-entertainment-system/final-fantasy/_payload.json"
  },
  "/games/nintendo-entertainment-system/friday-the-13th/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"da8-3cSn5QAzt6R1KYWkKIY6Bz3v1y4\"",
    "mtime": "2026-01-08T06:14:07.883Z",
    "size": 3496,
    "path": "../public/games/nintendo-entertainment-system/friday-the-13th/index.html"
  },
  "/games/nintendo-entertainment-system/friday-the-13th/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"288-0YGvW/q5KWJEVAUDytx0woEk8fk\"",
    "mtime": "2026-01-08T06:14:10.854Z",
    "size": 648,
    "path": "../public/games/nintendo-entertainment-system/friday-the-13th/_payload.json"
  },
  "/games/nintendo-entertainment-system/get-em-gary/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d9a-vwjK4st9G1cbkrpkezszGzFkVsg\"",
    "mtime": "2026-01-08T06:14:07.951Z",
    "size": 3482,
    "path": "../public/games/nintendo-entertainment-system/get-em-gary/index.html"
  },
  "/games/nintendo-entertainment-system/get-em-gary/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"282-1BYtaw4FB3rnQ26dV2dVHcoXlL8\"",
    "mtime": "2026-01-08T06:14:10.854Z",
    "size": 642,
    "path": "../public/games/nintendo-entertainment-system/get-em-gary/_payload.json"
  },
  "/games/nintendo-entertainment-system/gold-guardian-gun-girl/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"dcc-aYDlf4e6m1MolQs8ReMfaAgWLyY\"",
    "mtime": "2026-01-08T06:14:08.063Z",
    "size": 3532,
    "path": "../public/games/nintendo-entertainment-system/gold-guardian-gun-girl/index.html"
  },
  "/games/nintendo-entertainment-system/gold-guardian-gun-girl/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"28c-tvTyck0/TET1csx7aC/02ZCCJaA\"",
    "mtime": "2026-01-08T06:14:10.885Z",
    "size": 652,
    "path": "../public/games/nintendo-entertainment-system/gold-guardian-gun-girl/_payload.json"
  },
  "/games/nintendo-entertainment-system/gremlins-2/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d84-roM6+nD1r/ig3AVeVwuKOdnVJYI\"",
    "mtime": "2026-01-08T06:14:08.063Z",
    "size": 3460,
    "path": "../public/games/nintendo-entertainment-system/gremlins-2/index.html"
  },
  "/games/nintendo-entertainment-system/gremlins-2/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"280-3JJZTorsVGUJ9snUlipVbk/cMSo\"",
    "mtime": "2026-01-08T06:14:10.885Z",
    "size": 640,
    "path": "../public/games/nintendo-entertainment-system/gremlins-2/_payload.json"
  },
  "/games/nintendo-entertainment-system/guntner/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d72-Zlbt4ETeTD9zQV7JiVmF88ycAbg\"",
    "mtime": "2026-01-08T06:14:08.071Z",
    "size": 3442,
    "path": "../public/games/nintendo-entertainment-system/guntner/index.html"
  },
  "/games/nintendo-entertainment-system/guntner/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"268-lNvOjqrgG7BUDXlPoeyiJbuG8oY\"",
    "mtime": "2026-01-08T06:14:10.922Z",
    "size": 616,
    "path": "../public/games/nintendo-entertainment-system/guntner/_payload.json"
  },
  "/games/nintendo-entertainment-system/ice-hockey/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d84-4QKlc9jW42ihxCBs5yy1SP3EWkY\"",
    "mtime": "2026-01-08T06:14:08.081Z",
    "size": 3460,
    "path": "../public/games/nintendo-entertainment-system/ice-hockey/index.html"
  },
  "/games/nintendo-entertainment-system/ice-hockey/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"280-0aAjws3Yg9yfT31JRUgBhwr9DdE\"",
    "mtime": "2026-01-08T06:14:10.943Z",
    "size": 640,
    "path": "../public/games/nintendo-entertainment-system/ice-hockey/_payload.json"
  },
  "/games/nintendo-entertainment-system/jaws/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"db9-4yDx+WHVWRFbJ96uR2BPgKZ0QA8\"",
    "mtime": "2026-01-08T06:14:08.309Z",
    "size": 3513,
    "path": "../public/games/nintendo-entertainment-system/jaws/index.html"
  },
  "/games/nintendo-entertainment-system/jaws/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"299-pieoRRGk2/3ABLEdabB+N9hYPXI\"",
    "mtime": "2026-01-08T06:14:10.980Z",
    "size": 665,
    "path": "../public/games/nintendo-entertainment-system/jaws/_payload.json"
  },
  "/games/nintendo-entertainment-system/kabuki-quantum-fighter/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"e27-1/VAYFeDct6x0PDNzDXnSsUqoek\"",
    "mtime": "2026-01-08T06:14:08.309Z",
    "size": 3623,
    "path": "../public/games/nintendo-entertainment-system/kabuki-quantum-fighter/index.html"
  },
  "/games/nintendo-entertainment-system/kabuki-quantum-fighter/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"2ac-cr3n2wyZtbm/I/c0bizcuCXQBM0\"",
    "mtime": "2026-01-08T06:14:10.996Z",
    "size": 684,
    "path": "../public/games/nintendo-entertainment-system/kabuki-quantum-fighter/_payload.json"
  },
  "/games/nintendo-entertainment-system/legend-of-zelda-the/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"e0d-JBxgHT1AC5bKxLlXkIOEELo7Vrc\"",
    "mtime": "2026-01-08T06:14:08.322Z",
    "size": 3597,
    "path": "../public/games/nintendo-entertainment-system/legend-of-zelda-the/index.html"
  },
  "/games/nintendo-entertainment-system/legend-of-zelda-the/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"2a3-5Lc6KJJHIJ4SHnZOAP8IRmTAz6s\"",
    "mtime": "2026-01-08T06:14:11.011Z",
    "size": 675,
    "path": "../public/games/nintendo-entertainment-system/legend-of-zelda-the/_payload.json"
  },
  "/games/nintendo-entertainment-system/little-nemo-the-dream-master/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"e49-7UC8oGL2s3sDlgYAP/n7kD3ts80\"",
    "mtime": "2026-01-08T06:14:08.535Z",
    "size": 3657,
    "path": "../public/games/nintendo-entertainment-system/little-nemo-the-dream-master/index.html"
  },
  "/games/nintendo-entertainment-system/little-nemo-the-dream-master/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"2b1-zgWVjgP37Q1zS86vZKNkiI7+7o4\"",
    "mtime": "2026-01-08T06:14:11.077Z",
    "size": 689,
    "path": "../public/games/nintendo-entertainment-system/little-nemo-the-dream-master/_payload.json"
  },
  "/games/nintendo-entertainment-system/little-ninja-brothers/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"dcc-iR6IVhmt6KyIlTzp1rCvo0MfAwQ\"",
    "mtime": "2026-01-08T06:14:08.538Z",
    "size": 3532,
    "path": "../public/games/nintendo-entertainment-system/little-ninja-brothers/index.html"
  },
  "/games/nintendo-entertainment-system/little-ninja-brothers/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"278-HPbmkcQT3h2waSDUKJDOQx3SJFw\"",
    "mtime": "2026-01-08T06:14:11.077Z",
    "size": 632,
    "path": "../public/games/nintendo-entertainment-system/little-ninja-brothers/_payload.json"
  },
  "/games/nintendo-entertainment-system/metal-gear/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d8a-OaJZMF9/mqMnaI2KvbUvmjN9SIc\"",
    "mtime": "2026-01-08T06:14:08.609Z",
    "size": 3466,
    "path": "../public/games/nintendo-entertainment-system/metal-gear/index.html"
  },
  "/games/nintendo-entertainment-system/metal-gear/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"283-aNLEIdOqqfDQTUaaAYvo5EHQ/1I\"",
    "mtime": "2026-01-08T06:14:11.108Z",
    "size": 643,
    "path": "../public/games/nintendo-entertainment-system/metal-gear/_payload.json"
  },
  "/games/nintendo-entertainment-system/micro-mages/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d8a-6R0Q1lG2yx1AYpc+NMe+Zee1bbk\"",
    "mtime": "2026-01-08T06:14:08.742Z",
    "size": 3466,
    "path": "../public/games/nintendo-entertainment-system/micro-mages/index.html"
  },
  "/games/nintendo-entertainment-system/micro-mages/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"281-MiECgA9D/suAGAMXhxATB6Bk77Q\"",
    "mtime": "2026-01-08T06:14:11.176Z",
    "size": 641,
    "path": "../public/games/nintendo-entertainment-system/micro-mages/_payload.json"
  },
  "/games/nintendo-entertainment-system/mule/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"dca-beoleLgm0/sq0v5QlSpNDXn9Mhk\"",
    "mtime": "2026-01-08T06:14:08.608Z",
    "size": 3530,
    "path": "../public/games/nintendo-entertainment-system/mule/index.html"
  },
  "/games/nintendo-entertainment-system/mule/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"2a2-us+lDSqRPv3t+1HGK/dGaAGXTJ8\"",
    "mtime": "2026-01-08T06:14:11.092Z",
    "size": 674,
    "path": "../public/games/nintendo-entertainment-system/mule/_payload.json"
  },
  "/games/nintendo-entertainment-system/nebs-n-debs/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"df3-/9Vr5SqXJrSQaGnY+N/YVpFs2nw\"",
    "mtime": "2026-01-08T06:14:08.847Z",
    "size": 3571,
    "path": "../public/games/nintendo-entertainment-system/nebs-n-debs/index.html"
  },
  "/games/nintendo-entertainment-system/nebs-n-debs/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"2a0-+7NoAdKWmt1oeMoWCLzRe5Qyp1o\"",
    "mtime": "2026-01-08T06:14:11.205Z",
    "size": 672,
    "path": "../public/games/nintendo-entertainment-system/nebs-n-debs/_payload.json"
  },
  "/games/nintendo-entertainment-system/ninja-gaiden/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"e3d-idrQnz4Nm8ZzyneO83w1ZPBa92E\"",
    "mtime": "2026-01-08T06:14:08.866Z",
    "size": 3645,
    "path": "../public/games/nintendo-entertainment-system/ninja-gaiden/index.html"
  },
  "/games/nintendo-entertainment-system/ninja-gaiden/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"2dd-UICo5gVXsyIq22wuDTn29OYfM8k\"",
    "mtime": "2026-01-08T06:14:11.244Z",
    "size": 733,
    "path": "../public/games/nintendo-entertainment-system/ninja-gaiden/_payload.json"
  },
  "/games/nintendo-entertainment-system/ninja-gaiden-ii-the-dark-sword-of-chaos/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"e3a-MGhHhHvCzRpDzGKu3KSHDRI7TyU\"",
    "mtime": "2026-01-08T06:14:08.866Z",
    "size": 3642,
    "path": "../public/games/nintendo-entertainment-system/ninja-gaiden-ii-the-dark-sword-of-chaos/index.html"
  },
  "/games/nintendo-entertainment-system/ninja-gaiden-ii-the-dark-sword-of-chaos/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"2a1-zPQ8IF2Mncnt1tO/GeS/Y5mRq3Q\"",
    "mtime": "2026-01-08T06:14:11.243Z",
    "size": 673,
    "path": "../public/games/nintendo-entertainment-system/ninja-gaiden-ii-the-dark-sword-of-chaos/_payload.json"
  },
  "/games/nintendo-entertainment-system/parodius/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"dcd-mqhf4jegEV+ZHqNgLiVypEK5zao\"",
    "mtime": "2026-01-08T06:14:08.872Z",
    "size": 3533,
    "path": "../public/games/nintendo-entertainment-system/parodius/index.html"
  },
  "/games/nintendo-entertainment-system/parodius/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"29c-cR3W0u7zstHzTtl9DY31GHAm7io\"",
    "mtime": "2026-01-08T06:14:11.259Z",
    "size": 668,
    "path": "../public/games/nintendo-entertainment-system/parodius/_payload.json"
  },
  "/games/nintendo-entertainment-system/rainbow-islands/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"dfb-0LNINtE6XN6w+PZunvFZj/x3Vgc\"",
    "mtime": "2026-01-08T06:14:09.127Z",
    "size": 3579,
    "path": "../public/games/nintendo-entertainment-system/rainbow-islands/index.html"
  },
  "/games/nintendo-entertainment-system/rainbow-islands/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"2a4-v89wXmKsU0rev/OPEADwojt7E20\"",
    "mtime": "2026-01-08T06:14:11.320Z",
    "size": 676,
    "path": "../public/games/nintendo-entertainment-system/rainbow-islands/_payload.json"
  },
  "/games/nintendo-entertainment-system/snakes-revenge/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"db2-HM9rKjAwwaISAk11GdPll7VoowQ\"",
    "mtime": "2026-01-08T06:14:09.498Z",
    "size": 3506,
    "path": "../public/games/nintendo-entertainment-system/snakes-revenge/index.html"
  },
  "/games/nintendo-entertainment-system/snakes-revenge/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"288-shi5VuN8/Epxb6Bnl3UNb4C8WYk\"",
    "mtime": "2026-01-08T06:14:11.467Z",
    "size": 648,
    "path": "../public/games/nintendo-entertainment-system/snakes-revenge/_payload.json"
  },
  "/games/nintendo-entertainment-system/shmupspeed/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"e38-3+ITH02GEt0TAJCjlTFJqeso600\"",
    "mtime": "2026-01-08T06:14:09.366Z",
    "size": 3640,
    "path": "../public/games/nintendo-entertainment-system/shmupspeed/index.html"
  },
  "/games/nintendo-entertainment-system/shmupspeed/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"2e5-Mn/cNwasWZlVHpus1ok7bH3R8UE\"",
    "mtime": "2026-01-08T06:14:11.413Z",
    "size": 741,
    "path": "../public/games/nintendo-entertainment-system/shmupspeed/_payload.json"
  },
  "/games/nintendo-entertainment-system/solomons-key/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"da6-kM5HRXZf53t5zwhXAScM8m6ovHE\"",
    "mtime": "2026-01-08T06:14:09.426Z",
    "size": 3494,
    "path": "../public/games/nintendo-entertainment-system/solomons-key/index.html"
  },
  "/games/nintendo-entertainment-system/solomons-key/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"270-I/65ADQEl5Eb0w2taqjYS8kRC+o\"",
    "mtime": "2026-01-08T06:14:11.452Z",
    "size": 624,
    "path": "../public/games/nintendo-entertainment-system/solomons-key/_payload.json"
  },
  "/games/nintendo-entertainment-system/spook-o-tron/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d98-KyZvsRvCmi8S7rm86DLaZT97Wio\"",
    "mtime": "2026-01-08T06:14:09.514Z",
    "size": 3480,
    "path": "../public/games/nintendo-entertainment-system/spook-o-tron/index.html"
  },
  "/games/nintendo-entertainment-system/spook-o-tron/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"285-3Qi9RtTP2vdXBvBOlkj4eFQ4GJQ\"",
    "mtime": "2026-01-08T06:14:11.483Z",
    "size": 645,
    "path": "../public/games/nintendo-entertainment-system/spook-o-tron/_payload.json"
  },
  "/games/nintendo-entertainment-system/star-tropics/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d90-J5WEhnfD9b4gzMRws42mURwt+C4\"",
    "mtime": "2026-01-08T06:14:09.515Z",
    "size": 3472,
    "path": "../public/games/nintendo-entertainment-system/star-tropics/index.html"
  },
  "/games/nintendo-entertainment-system/star-tropics/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"282-lvBBi1PXOvcjk4pV6knCJJ6B/cM\"",
    "mtime": "2026-01-08T06:14:11.483Z",
    "size": 642,
    "path": "../public/games/nintendo-entertainment-system/star-tropics/_payload.json"
  },
  "/games/nintendo-entertainment-system/super-mario-bros/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"e04-9x+rCJMegXSCddjsCpKiknKNEHc\"",
    "mtime": "2026-01-08T06:14:09.619Z",
    "size": 3588,
    "path": "../public/games/nintendo-entertainment-system/super-mario-bros/index.html"
  },
  "/games/nintendo-entertainment-system/super-mario-bros/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"2a8-Z/UBdpyZMYQOU9AcGFrqG3a8G1k\"",
    "mtime": "2026-01-08T06:14:11.511Z",
    "size": 680,
    "path": "../public/games/nintendo-entertainment-system/super-mario-bros/_payload.json"
  },
  "/games/nintendo-entertainment-system/super-mario-bros-2/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"db4-XtrqjThsUSr8jgw7Vgedrk7Zu0A\"",
    "mtime": "2026-01-08T06:14:09.619Z",
    "size": 3508,
    "path": "../public/games/nintendo-entertainment-system/super-mario-bros-2/index.html"
  },
  "/games/nintendo-entertainment-system/super-mario-bros-2/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"287-cTgno0EpkPnTGQGHDRdmCVqQB6E\"",
    "mtime": "2026-01-08T06:14:11.511Z",
    "size": 647,
    "path": "../public/games/nintendo-entertainment-system/super-mario-bros-2/_payload.json"
  },
  "/games/nintendo-entertainment-system/super-mario-bros-3/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"e67-Z9bVUdBNC7LpJJ+LdAlYmBALQdo\"",
    "mtime": "2026-01-08T06:14:09.619Z",
    "size": 3687,
    "path": "../public/games/nintendo-entertainment-system/super-mario-bros-3/index.html"
  },
  "/games/nintendo-entertainment-system/super-mario-bros-3/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"2e6-uwSmH6nDIpB+JB7T1Yh05ilK47U\"",
    "mtime": "2026-01-08T06:14:11.511Z",
    "size": 742,
    "path": "../public/games/nintendo-entertainment-system/super-mario-bros-3/_payload.json"
  },
  "/games/nintendo-entertainment-system/super-sprint/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"f3d-+2e3beqRad+8oyptbE4CYqDgN0Q\"",
    "mtime": "2026-01-08T06:14:09.740Z",
    "size": 3901,
    "path": "../public/games/nintendo-entertainment-system/super-sprint/index.html"
  },
  "/games/nintendo-entertainment-system/super-sprint/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"392-VBrjAA9LNN9i0V7lQ8dNCes6o18\"",
    "mtime": "2026-01-08T06:14:11.548Z",
    "size": 914,
    "path": "../public/games/nintendo-entertainment-system/super-sprint/_payload.json"
  },
  "/games/nintendo-entertainment-system/super-tilt-bro/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"e52-Gl4bgF+4yYWjCZIhLdAfg/Fpd24\"",
    "mtime": "2026-01-08T06:14:09.740Z",
    "size": 3666,
    "path": "../public/games/nintendo-entertainment-system/super-tilt-bro/index.html"
  },
  "/games/nintendo-entertainment-system/super-tilt-bro/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"2e8-IlCHUrvw5Ug0gXis9PdyholNYhE\"",
    "mtime": "2026-01-08T06:14:11.548Z",
    "size": 744,
    "path": "../public/games/nintendo-entertainment-system/super-tilt-bro/_payload.json"
  },
  "/games/nintendo-entertainment-system/teenage-mutant-ninja-turtles/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"df8-p1URRpnMG+Vvg/8FW1MLM+VXwQI\"",
    "mtime": "2026-01-08T06:14:09.757Z",
    "size": 3576,
    "path": "../public/games/nintendo-entertainment-system/teenage-mutant-ninja-turtles/index.html"
  },
  "/games/nintendo-entertainment-system/teenage-mutant-ninja-turtles/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"296-RGCevMHKxZFj0w4peOBDAp15OMY\"",
    "mtime": "2026-01-08T06:14:11.566Z",
    "size": 662,
    "path": "../public/games/nintendo-entertainment-system/teenage-mutant-ninja-turtles/_payload.json"
  },
  "/games/nintendo-entertainment-system/teenage-mutant-ninja-turtles-2-the-arcade-game/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"e5e-0qXao6umnSAw5zSOAI5Qf+tYxGg\"",
    "mtime": "2026-01-08T06:14:09.772Z",
    "size": 3678,
    "path": "../public/games/nintendo-entertainment-system/teenage-mutant-ninja-turtles-2-the-arcade-game/index.html"
  },
  "/games/nintendo-entertainment-system/teenage-mutant-ninja-turtles-2-the-arcade-game/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"2a5-jEJSgNuzs0KAWmpVlqs4XpujIDc\"",
    "mtime": "2026-01-08T06:14:11.585Z",
    "size": 677,
    "path": "../public/games/nintendo-entertainment-system/teenage-mutant-ninja-turtles-2-the-arcade-game/_payload.json"
  },
  "/games/nintendo-entertainment-system/temple-dilemma/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"fc7-SVx14tnM1+Ycy2oCH65y6rABv1I\"",
    "mtime": "2026-01-08T06:14:09.772Z",
    "size": 4039,
    "path": "../public/games/nintendo-entertainment-system/temple-dilemma/index.html"
  },
  "/games/nintendo-entertainment-system/temple-dilemma/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"3ec-Wj9XDpTDGtynFwBrW36bu4puC+4\"",
    "mtime": "2026-01-08T06:14:11.566Z",
    "size": 1004,
    "path": "../public/games/nintendo-entertainment-system/temple-dilemma/_payload.json"
  },
  "/games/nintendo-entertainment-system/the-incident/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d98-2RRazXG0x35vSpc2wlo1j3u3qiU\"",
    "mtime": "2026-01-08T06:14:09.817Z",
    "size": 3480,
    "path": "../public/games/nintendo-entertainment-system/the-incident/index.html"
  },
  "/games/nintendo-entertainment-system/the-incident/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"286-mw5uze9XBBQsVi0KIYHs55jy53k\"",
    "mtime": "2026-01-08T06:14:11.585Z",
    "size": 646,
    "path": "../public/games/nintendo-entertainment-system/the-incident/_payload.json"
  },
  "/games/nintendo-entertainment-system/totally-rad/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d8d-q0izsQ1V4adSny+Fz5mf/AlXMuY\"",
    "mtime": "2026-01-08T06:14:09.890Z",
    "size": 3469,
    "path": "../public/games/nintendo-entertainment-system/totally-rad/index.html"
  },
  "/games/nintendo-entertainment-system/totally-rad/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"282-Iw2rOPD84COcPlRKijRP4Ku5veI\"",
    "mtime": "2026-01-08T06:14:11.613Z",
    "size": 642,
    "path": "../public/games/nintendo-entertainment-system/totally-rad/_payload.json"
  },
  "/games/nintendo-entertainment-system/trog/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"dd1-JEpRjmgrhkO9gNwTQb7I+SjaBAA\"",
    "mtime": "2026-01-08T06:14:09.878Z",
    "size": 3537,
    "path": "../public/games/nintendo-entertainment-system/trog/index.html"
  },
  "/games/nintendo-entertainment-system/trog/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"2af-ygxrvr8i1k4KRza89X8lVklEZFA\"",
    "mtime": "2026-01-08T06:14:11.613Z",
    "size": 687,
    "path": "../public/games/nintendo-entertainment-system/trog/_payload.json"
  },
  "/games/nintendo-entertainment-system/twin-dragons/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d96-WnqFfQpP5mmJOiwP6bpKXk5sko0\"",
    "mtime": "2026-01-08T06:14:09.878Z",
    "size": 3478,
    "path": "../public/games/nintendo-entertainment-system/twin-dragons/index.html"
  },
  "/games/nintendo-entertainment-system/twin-dragons/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"285-+0CdT8NSvV0yorWk+dYFkITX6h4\"",
    "mtime": "2026-01-08T06:14:11.613Z",
    "size": 645,
    "path": "../public/games/nintendo-entertainment-system/twin-dragons/_payload.json"
  },
  "/games/nintendo-entertainment-system/witch-n-wiz/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"da0-S2sAIF0yPeBBglqoKH6YTOXVSZc\"",
    "mtime": "2026-01-08T06:14:09.959Z",
    "size": 3488,
    "path": "../public/games/nintendo-entertainment-system/witch-n-wiz/index.html"
  },
  "/games/nintendo-entertainment-system/witch-n-wiz/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"26f-QUFFb5q0DpUejS414WWy6Q1cmO8\"",
    "mtime": "2026-01-08T06:14:11.652Z",
    "size": 623,
    "path": "../public/games/nintendo-entertainment-system/witch-n-wiz/_payload.json"
  },
  "/games/nintendo-entertainment-system/yo-noid/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d7b-zh5LgF60lMN96KJxbXXHBwr+DQY\"",
    "mtime": "2026-01-08T06:14:09.999Z",
    "size": 3451,
    "path": "../public/games/nintendo-entertainment-system/yo-noid/index.html"
  },
  "/games/nintendo-entertainment-system/yo-noid/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"280-HU7Q1Szdx+KfiOYE1dcZwgxIbes\"",
    "mtime": "2026-01-08T06:14:11.675Z",
    "size": 640,
    "path": "../public/games/nintendo-entertainment-system/yo-noid/_payload.json"
  },
  "/games/nintendo-entertainment-system/zelda-ii-the-adventure-of-link/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"dfe-cdi9dPvxodTy/UNGNOY8SGPzbm8\"",
    "mtime": "2026-01-08T06:14:10.061Z",
    "size": 3582,
    "path": "../public/games/nintendo-entertainment-system/zelda-ii-the-adventure-of-link/index.html"
  },
  "/games/nintendo-entertainment-system/zelda-ii-the-adventure-of-link/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"295-D2lkWsf9ypn8RMmkBKsPc68yBs0\"",
    "mtime": "2026-01-08T06:14:11.712Z",
    "size": 661,
    "path": "../public/games/nintendo-entertainment-system/zelda-ii-the-adventure-of-link/_payload.json"
  },
  "/games/playstation/blood-omen-legacy-of-kain/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d6a-uzSez1NXBohcXSAXxLpG9NFfFeY\"",
    "mtime": "2026-01-08T06:14:07.026Z",
    "size": 3434,
    "path": "../public/games/playstation/blood-omen-legacy-of-kain/index.html"
  },
  "/games/playstation/blood-omen-legacy-of-kain/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"26c-JXiHme3UF1Bw/JQBQarKMBP91bA\"",
    "mtime": "2026-01-08T06:14:10.569Z",
    "size": 620,
    "path": "../public/games/playstation/blood-omen-legacy-of-kain/_payload.json"
  },
  "/games/playstation/castlevania-symphony-of-the-night/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"12f1-JEkKfDmFRlaEDQH62TpbhM6KbQQ\"",
    "mtime": "2026-01-08T06:14:07.249Z",
    "size": 4849,
    "path": "../public/games/playstation/castlevania-symphony-of-the-night/index.html"
  },
  "/games/playstation/castlevania-symphony-of-the-night/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"614-0odniAS0IdlOY/NAEHDZx+/Iark\"",
    "mtime": "2026-01-08T06:14:10.584Z",
    "size": 1556,
    "path": "../public/games/playstation/castlevania-symphony-of-the-night/_payload.json"
  },
  "/games/playstation/chocobo-racing/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d81-tPxJKxEnVqcdJToWuDUinklQbLI\"",
    "mtime": "2026-01-08T06:14:07.091Z",
    "size": 3457,
    "path": "../public/games/playstation/chocobo-racing/index.html"
  },
  "/games/playstation/chocobo-racing/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"284-NdLfqqRuDMECVU87sxLQplA3cBw\"",
    "mtime": "2026-01-08T06:14:10.569Z",
    "size": 644,
    "path": "../public/games/playstation/chocobo-racing/_payload.json"
  },
  "/games/playstation/dino-crisis/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"15d0-a0zDFRW/NQ3/kpHVDgCr1Mn3c+M\"",
    "mtime": "2026-01-08T06:14:07.393Z",
    "size": 5584,
    "path": "../public/games/playstation/dino-crisis/index.html"
  },
  "/games/playstation/dino-crisis/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"8f3-Sm/obsQSXmxE2pFi/TqMrwTu96I\"",
    "mtime": "2026-01-08T06:14:10.664Z",
    "size": 2291,
    "path": "../public/games/playstation/dino-crisis/_payload.json"
  },
  "/games/playstation/dino-crisis-2/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"13c8-Tn6wG8TFngkeKv33Lthl2WFOxuc\"",
    "mtime": "2026-01-08T06:14:07.393Z",
    "size": 5064,
    "path": "../public/games/playstation/dino-crisis-2/index.html"
  },
  "/games/playstation/dino-crisis-2/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"71c-XdYWWNFEmagEvApaxG/pbNT56Q4\"",
    "mtime": "2026-01-08T06:14:10.664Z",
    "size": 1820,
    "path": "../public/games/playstation/dino-crisis-2/_payload.json"
  },
  "/games/playstation/dragonball-z-ultimate-battle-22/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d86-mrVgGhZme986ue4fk7Vc/G0FK+A\"",
    "mtime": "2026-01-08T06:14:07.529Z",
    "size": 3462,
    "path": "../public/games/playstation/dragonball-z-ultimate-battle-22/index.html"
  },
  "/games/playstation/dragonball-z-ultimate-battle-22/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"26e-xVJEQL0chXMNFgpfeounOovYlR0\"",
    "mtime": "2026-01-08T06:14:10.714Z",
    "size": 622,
    "path": "../public/games/playstation/dragonball-z-ultimate-battle-22/_payload.json"
  },
  "/games/playstation/einhander/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d09-eCTiU/3R5gSDnimvYAtM1rue33c\"",
    "mtime": "2026-01-08T06:14:07.531Z",
    "size": 3337,
    "path": "../public/games/playstation/einhander/index.html"
  },
  "/games/playstation/einhander/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25b-j//VK3rvLHY/a08jtvK/DQVxJbk\"",
    "mtime": "2026-01-08T06:14:10.737Z",
    "size": 603,
    "path": "../public/games/playstation/einhander/_payload.json"
  },
  "/games/playstation/final-fantasy-anthology/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d5c-Qy7qBPBhWKPKD6vMKpMQNzE3LUk\"",
    "mtime": "2026-01-08T06:14:07.780Z",
    "size": 3420,
    "path": "../public/games/playstation/final-fantasy-anthology/index.html"
  },
  "/games/playstation/final-fantasy-anthology/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"269-sng1ZhGGlRE5e+HXxaf06Jz/Ao4\"",
    "mtime": "2026-01-08T06:14:10.783Z",
    "size": 617,
    "path": "../public/games/playstation/final-fantasy-anthology/_payload.json"
  },
  "/games/playstation/final-fantasy-chronicles/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d5a-Wjj96hT0/YyqqreC9BW5aq90bGo\"",
    "mtime": "2026-01-08T06:14:07.720Z",
    "size": 3418,
    "path": "../public/games/playstation/final-fantasy-chronicles/index.html"
  },
  "/games/playstation/final-fantasy-chronicles/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"265-ZwvYXN1snsAVRst/lz4TT6/6prg\"",
    "mtime": "2026-01-08T06:14:10.770Z",
    "size": 613,
    "path": "../public/games/playstation/final-fantasy-chronicles/_payload.json"
  },
  "/games/playstation/final-fantasy-ix/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d2a-+HF/+lYCeYr5XXt4LCWp4DI8ZxI\"",
    "mtime": "2026-01-08T06:14:07.795Z",
    "size": 3370,
    "path": "../public/games/playstation/final-fantasy-ix/index.html"
  },
  "/games/playstation/final-fantasy-ix/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25e-1ijZfbOIL3TRV07N/wx79KhVOUQ\"",
    "mtime": "2026-01-08T06:14:10.797Z",
    "size": 606,
    "path": "../public/games/playstation/final-fantasy-ix/_payload.json"
  },
  "/games/playstation/final-fantasy-origins/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d48-JN89tEqKFAK0sFTXjDnYx3KjcoU\"",
    "mtime": "2026-01-08T06:14:07.795Z",
    "size": 3400,
    "path": "../public/games/playstation/final-fantasy-origins/index.html"
  },
  "/games/playstation/final-fantasy-origins/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"263-oJaLj6bgpXLn5QFM9fXYPo2uFD4\"",
    "mtime": "2026-01-08T06:14:10.797Z",
    "size": 611,
    "path": "../public/games/playstation/final-fantasy-origins/_payload.json"
  },
  "/games/playstation/final-fantasy-vii/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"e82-z6GriTT52+u3AMQAsniGfBrGgS4\"",
    "mtime": "2026-01-08T06:14:07.795Z",
    "size": 3714,
    "path": "../public/games/playstation/final-fantasy-vii/index.html"
  },
  "/games/playstation/final-fantasy-vii/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"34c-YOpeNMtwvLvu/TqnX8nwaweYwe4\"",
    "mtime": "2026-01-08T06:14:10.812Z",
    "size": 844,
    "path": "../public/games/playstation/final-fantasy-vii/_payload.json"
  },
  "/games/playstation/final-fantasy-tactics/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d50-9hpOTguvcphFcfWMFpJdv2+yISk\"",
    "mtime": "2026-01-08T06:14:07.795Z",
    "size": 3408,
    "path": "../public/games/playstation/final-fantasy-tactics/index.html"
  },
  "/games/playstation/final-fantasy-tactics/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"267-WqgZe8oKI6lEu7mC9GRXWCIxzH8\"",
    "mtime": "2026-01-08T06:14:10.812Z",
    "size": 615,
    "path": "../public/games/playstation/final-fantasy-tactics/_payload.json"
  },
  "/games/playstation/final-fantasy-viii/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d3c-ddwv3vyEM28jlQrmwxE7s900KuI\"",
    "mtime": "2026-01-08T06:14:07.795Z",
    "size": 3388,
    "path": "../public/games/playstation/final-fantasy-viii/index.html"
  },
  "/games/playstation/final-fantasy-viii/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"263-Ur3Cep9RfhURuzb3KIcYM8l6M6s\"",
    "mtime": "2026-01-08T06:14:10.812Z",
    "size": 611,
    "path": "../public/games/playstation/final-fantasy-viii/_payload.json"
  },
  "/games/playstation/gradius-gaiden/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d24-dlTTlUPB3N2wkcaVCoTowgz8VqE\"",
    "mtime": "2026-01-08T06:14:08.063Z",
    "size": 3364,
    "path": "../public/games/playstation/gradius-gaiden/index.html"
  },
  "/games/playstation/gradius-gaiden/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25f-MDNxwgt4bAGcSTuVQGN7rBmmqbc\"",
    "mtime": "2026-01-08T06:14:10.885Z",
    "size": 607,
    "path": "../public/games/playstation/gradius-gaiden/_payload.json"
  },
  "/games/playstation/jade-cocoon-story-of-the-tamamayu/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d98-oPX4qw903Az6sJ51O58mb9bKu1o\"",
    "mtime": "2026-01-08T06:14:08.207Z",
    "size": 3480,
    "path": "../public/games/playstation/jade-cocoon-story-of-the-tamamayu/index.html"
  },
  "/games/playstation/jade-cocoon-story-of-the-tamamayu/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"273-IDzkGoYT0uBI02INKCEZ/ZiF36Y\"",
    "mtime": "2026-01-08T06:14:10.962Z",
    "size": 627,
    "path": "../public/games/playstation/jade-cocoon-story-of-the-tamamayu/_payload.json"
  },
  "/games/playstation/legend-of-dragoon-the/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d4b-pC28KiaRlIJreMw56fKsK0hOChY\"",
    "mtime": "2026-01-08T06:14:08.322Z",
    "size": 3403,
    "path": "../public/games/playstation/legend-of-dragoon-the/index.html"
  },
  "/games/playstation/legend-of-dragoon-the/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"264-MCsrq/8DLciEJ6Che0ACYmIwn6I\"",
    "mtime": "2026-01-08T06:14:11.011Z",
    "size": 612,
    "path": "../public/games/playstation/legend-of-dragoon-the/_payload.json"
  },
  "/games/playstation/marvel-vs-capcom/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d2d-FO3WMORflwoV34DiMcgK/bp3zTs\"",
    "mtime": "2026-01-08T06:14:08.608Z",
    "size": 3373,
    "path": "../public/games/playstation/marvel-vs-capcom/index.html"
  },
  "/games/playstation/marvel-vs-capcom/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25f-J+4QF1lju6PQWmMrNJFBvm9Yafc\"",
    "mtime": "2026-01-08T06:14:11.092Z",
    "size": 607,
    "path": "../public/games/playstation/marvel-vs-capcom/_payload.json"
  },
  "/games/playstation/medal-of-honor/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"e1b-I2mI3HZCnqCCG9mEHUMqujXEFl8\"",
    "mtime": "2026-01-08T06:14:08.608Z",
    "size": 3611,
    "path": "../public/games/playstation/medal-of-honor/index.html"
  },
  "/games/playstation/medal-of-honor/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"2fe-wynSBLBkD/AtVMMASQ4GSaRGStU\"",
    "mtime": "2026-01-08T06:14:11.092Z",
    "size": 766,
    "path": "../public/games/playstation/medal-of-honor/_payload.json"
  },
  "/games/playstation/mdk/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"cdc-VXxQuMmaTUKathuYTisVkwVuCC4\"",
    "mtime": "2026-01-08T06:14:08.608Z",
    "size": 3292,
    "path": "../public/games/playstation/mdk/index.html"
  },
  "/games/playstation/mdk/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"251-8sS1QaZartyDLEETkb5gWsqOY2c\"",
    "mtime": "2026-01-08T06:14:11.092Z",
    "size": 593,
    "path": "../public/games/playstation/mdk/_payload.json"
  },
  "/games/playstation/mega-man-legends/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d30-INGF3lWjOX1KKwgUbxJp/8i/1Zg\"",
    "mtime": "2026-01-08T06:14:08.608Z",
    "size": 3376,
    "path": "../public/games/playstation/mega-man-legends/index.html"
  },
  "/games/playstation/mega-man-legends/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"261-2bHCDUjWyAB8lhDJ725s5Pcb/RU\"",
    "mtime": "2026-01-08T06:14:11.108Z",
    "size": 609,
    "path": "../public/games/playstation/mega-man-legends/_payload.json"
  },
  "/games/playstation/metal-gear-solid/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d2a-n12as6Sx17gN7KDBU4kPd/xwltE\"",
    "mtime": "2026-01-08T06:14:08.620Z",
    "size": 3370,
    "path": "../public/games/playstation/metal-gear-solid/index.html"
  },
  "/games/playstation/metal-gear-solid/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25e-wQnfIIBhcFibU2TGahcSyRCxbS0\"",
    "mtime": "2026-01-08T06:14:11.126Z",
    "size": 606,
    "path": "../public/games/playstation/metal-gear-solid/_payload.json"
  },
  "/games/playstation/metal-gear-solid-integral/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"1275-rclUEX57wL6PjO0B7LEAv8seYO4\"",
    "mtime": "2026-01-08T06:14:08.740Z",
    "size": 4725,
    "path": "../public/games/playstation/metal-gear-solid-integral/index.html"
  },
  "/games/playstation/metal-gear-solid-integral/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"5f8-Gk02vdbLehcapZ9RHxm8HyZoB/0\"",
    "mtime": "2026-01-08T06:14:11.176Z",
    "size": 1528,
    "path": "../public/games/playstation/metal-gear-solid-integral/_payload.json"
  },
  "/games/playstation/metal-gear-solid-trilogy-set-hayter-autographed/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"1633-N3gsXQgiHHU7FLKLMjQ7VY9Qfgw\"",
    "mtime": "2026-01-08T06:14:08.725Z",
    "size": 5683,
    "path": "../public/games/playstation/metal-gear-solid-trilogy-set-hayter-autographed/index.html"
  },
  "/games/playstation/metal-gear-solid-trilogy-set-hayter-autographed/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"86e-A1FAU+ZFcAdrHsjJnBA5/iG04dg\"",
    "mtime": "2026-01-08T06:14:11.154Z",
    "size": 2158,
    "path": "../public/games/playstation/metal-gear-solid-trilogy-set-hayter-autographed/_payload.json"
  },
  "/games/playstation/metal-gear-solid-vr-missions/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d7c-yrIn/3OLn873xVYObiuDOX/hFdA\"",
    "mtime": "2026-01-08T06:14:08.725Z",
    "size": 3452,
    "path": "../public/games/playstation/metal-gear-solid-vr-missions/index.html"
  },
  "/games/playstation/metal-gear-solid-vr-missions/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"26f-PBYqRdRqrJhMMq5ZI1ZxL3KJHeQ\"",
    "mtime": "2026-01-08T06:14:11.158Z",
    "size": 623,
    "path": "../public/games/playstation/metal-gear-solid-vr-missions/_payload.json"
  },
  "/games/playstation/night-striker/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d1e-GDBE/q+3wiU1xcQyIuwkyDeGwYg\"",
    "mtime": "2026-01-08T06:14:08.847Z",
    "size": 3358,
    "path": "../public/games/playstation/night-striker/index.html"
  },
  "/games/playstation/night-striker/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25e-h2AahcQI54XbEu1sGMhZTGApK0E\"",
    "mtime": "2026-01-08T06:14:11.224Z",
    "size": 606,
    "path": "../public/games/playstation/night-striker/_payload.json"
  },
  "/games/playstation/nightmare-creatures/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d42-c/Xl06McPwTS/K+HLHxV71SZMTk\"",
    "mtime": "2026-01-08T06:14:08.861Z",
    "size": 3394,
    "path": "../public/games/playstation/nightmare-creatures/index.html"
  },
  "/games/playstation/nightmare-creatures/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"264-GOawm90TtZ7DgDZaHDa9XTFmQXY\"",
    "mtime": "2026-01-08T06:14:11.224Z",
    "size": 612,
    "path": "../public/games/playstation/nightmare-creatures/_payload.json"
  },
  "/games/playstation/parasite-eve/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d12-gvi55VHLUInWORiRGftSSmta5y8\"",
    "mtime": "2026-01-08T06:14:08.866Z",
    "size": 3346,
    "path": "../public/games/playstation/parasite-eve/index.html"
  },
  "/games/playstation/parasite-eve/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25a-PqwGYk7OR4lVxpp/KkXud8yRNzg\"",
    "mtime": "2026-01-08T06:14:11.259Z",
    "size": 602,
    "path": "../public/games/playstation/parasite-eve/_payload.json"
  },
  "/games/playstation/nightmare-creatures-ii/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d54-5UCxGoRB8XFa9OcFEzc1hbRFKlU\"",
    "mtime": "2026-01-08T06:14:08.847Z",
    "size": 3412,
    "path": "../public/games/playstation/nightmare-creatures-ii/index.html"
  },
  "/games/playstation/nightmare-creatures-ii/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"267-KhVq3BpiR9vwJFVIysZr8Oa4QE4\"",
    "mtime": "2026-01-08T06:14:11.224Z",
    "size": 615,
    "path": "../public/games/playstation/nightmare-creatures-ii/_payload.json"
  },
  "/games/playstation/parasite-eve-ii/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d2a-8jl5VFAYtjD2YNdHwxgnCjP5R9I\"",
    "mtime": "2026-01-08T06:14:08.866Z",
    "size": 3370,
    "path": "../public/games/playstation/parasite-eve-ii/index.html"
  },
  "/games/playstation/parasite-eve-ii/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"260-SAjExGjptOLq++UibDG55wNNrAU\"",
    "mtime": "2026-01-08T06:14:11.259Z",
    "size": 608,
    "path": "../public/games/playstation/parasite-eve-ii/_payload.json"
  },
  "/games/playstation/resident-evil-2/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"f92-T+HOadf397KN/03UiS+aKn+Hx4I\"",
    "mtime": "2026-01-08T06:14:09.127Z",
    "size": 3986,
    "path": "../public/games/playstation/resident-evil-2/index.html"
  },
  "/games/playstation/resident-evil-2/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"3ea-pK2B2INd2hSz0jfs2NGZeclgE3o\"",
    "mtime": "2026-01-08T06:14:11.320Z",
    "size": 1002,
    "path": "../public/games/playstation/resident-evil-2/_payload.json"
  },
  "/games/playstation/resident-evil-3-nemesis/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d5c-HvDlniXwgVtMROzumJDsGvrQ3jQ\"",
    "mtime": "2026-01-08T06:14:09.133Z",
    "size": 3420,
    "path": "../public/games/playstation/resident-evil-3-nemesis/index.html"
  },
  "/games/playstation/resident-evil-3-nemesis/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"269-pVut11kTWHgER789nJsA4k01+Fs\"",
    "mtime": "2026-01-08T06:14:11.320Z",
    "size": 617,
    "path": "../public/games/playstation/resident-evil-3-nemesis/_payload.json"
  },
  "/games/playstation/resident-evil-directors-cut/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d84-wtjTi4FSj1kQtXE51buPcmoBv3Q\"",
    "mtime": "2026-01-08T06:14:09.144Z",
    "size": 3460,
    "path": "../public/games/playstation/resident-evil-directors-cut/index.html"
  },
  "/games/playstation/resident-evil-directors-cut/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"26e-sl06WQRJ0qgiUiHfNw4rf0f0yfM\"",
    "mtime": "2026-01-08T06:14:11.340Z",
    "size": 622,
    "path": "../public/games/playstation/resident-evil-directors-cut/_payload.json"
  },
  "/games/playstation/resident-evil-survivor/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d56-pQ4A3ucXGBn0N9LrQ31onph2Qak\"",
    "mtime": "2026-01-08T06:14:09.149Z",
    "size": 3414,
    "path": "../public/games/playstation/resident-evil-survivor/index.html"
  },
  "/games/playstation/resident-evil-survivor/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"268-tjwaoFV/vWSia6m6gO/+FCVvmbs\"",
    "mtime": "2026-01-08T06:14:11.340Z",
    "size": 616,
    "path": "../public/games/playstation/resident-evil-survivor/_payload.json"
  },
  "/games/playstation/silent-hill/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d0c-t6hgVpbg6jIwMRtf0siZLcQoHqE\"",
    "mtime": "2026-01-08T06:14:09.378Z",
    "size": 3340,
    "path": "../public/games/playstation/silent-hill/index.html"
  },
  "/games/playstation/silent-hill/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"259-EmFvmMNRjFPR3jc+AjyUzuAjBeE\"",
    "mtime": "2026-01-08T06:14:11.413Z",
    "size": 601,
    "path": "../public/games/playstation/silent-hill/_payload.json"
  },
  "/games/playstation/south-park/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d54-tVHDLemavsfJJwJNkk4mLe8cCIo\"",
    "mtime": "2026-01-08T06:14:09.458Z",
    "size": 3412,
    "path": "../public/games/playstation/south-park/index.html"
  },
  "/games/playstation/south-park/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"26c-mBQmkYLu/PlEsHcMX8bfMpdNEpo\"",
    "mtime": "2026-01-08T06:14:11.452Z",
    "size": 620,
    "path": "../public/games/playstation/south-park/_payload.json"
  },
  "/games/playstation/suikoden/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d02-yaLX6XidvMYw8MM320OTDUchU/w\"",
    "mtime": "2026-01-08T06:14:09.597Z",
    "size": 3330,
    "path": "../public/games/playstation/suikoden/index.html"
  },
  "/games/playstation/suikoden/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25a-9CfJowg4/Y0Q3jox7a28xz+8OIo\"",
    "mtime": "2026-01-08T06:14:11.496Z",
    "size": 602,
    "path": "../public/games/playstation/suikoden/_payload.json"
  },
  "/games/playstation/syphon-filter/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d1e-wrHzWk6p2b7LZd0w4jBOX+hTzPU\"",
    "mtime": "2026-01-08T06:14:09.767Z",
    "size": 3358,
    "path": "../public/games/playstation/syphon-filter/index.html"
  },
  "/games/playstation/syphon-filter/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"249-jFOJ6me6hUVtE22W+flyz1WIM2E\"",
    "mtime": "2026-01-08T06:14:11.566Z",
    "size": 585,
    "path": "../public/games/playstation/syphon-filter/_payload.json"
  },
  "/games/playstation/suikoden-ii/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d12-PHKi+sFWFUU4hnBCJRN1m3ot3K0\"",
    "mtime": "2026-01-08T06:14:09.619Z",
    "size": 3346,
    "path": "../public/games/playstation/suikoden-ii/index.html"
  },
  "/games/playstation/suikoden-ii/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25c-8IMdYTfl+LH538nnuVlIa4C9RFQ\"",
    "mtime": "2026-01-08T06:14:11.497Z",
    "size": 604,
    "path": "../public/games/playstation/suikoden-ii/_payload.json"
  },
  "/games/playstation/syphon-filter-2/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d2a-eDmPTEey1LeF+CIn2KdvQDBQKMM\"",
    "mtime": "2026-01-08T06:14:09.756Z",
    "size": 3370,
    "path": "../public/games/playstation/syphon-filter-2/index.html"
  },
  "/games/playstation/syphon-filter-2/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"24a-4L4/jxWcYd29DT8osvLYfWgYW2k\"",
    "mtime": "2026-01-08T06:14:11.548Z",
    "size": 586,
    "path": "../public/games/playstation/syphon-filter-2/_payload.json"
  },
  "/games/playstation/tony-hawks-pro-skater-2/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"e86-ZJBSke00shFz/qHpwSyJlIXP6x0\"",
    "mtime": "2026-01-08T06:14:09.878Z",
    "size": 3718,
    "path": "../public/games/playstation/tony-hawks-pro-skater-2/index.html"
  },
  "/games/playstation/tony-hawks-pro-skater-2/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"336-Pq1X+3a0I9i5cAcYvH2UYJktTyE\"",
    "mtime": "2026-01-08T06:14:11.613Z",
    "size": 822,
    "path": "../public/games/playstation/tony-hawks-pro-skater-2/_payload.json"
  },
  "/games/playstation/tenchu-stealth-assassins/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d5c-piuzMGddCE3fu9gGYXCvBnzJp54\"",
    "mtime": "2026-01-08T06:14:09.772Z",
    "size": 3420,
    "path": "../public/games/playstation/tenchu-stealth-assassins/index.html"
  },
  "/games/playstation/tenchu-stealth-assassins/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"267-Et/1gVw1kD0gtXsB5eoDfj3SPHE\"",
    "mtime": "2026-01-08T06:14:11.566Z",
    "size": 615,
    "path": "../public/games/playstation/tenchu-stealth-assassins/_payload.json"
  },
  "/games/playstation/vagrant-story/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d1e-eQIpgPWusyAbX/RZiyTCB340b+k\"",
    "mtime": "2026-01-08T06:14:09.905Z",
    "size": 3358,
    "path": "../public/games/playstation/vagrant-story/index.html"
  },
  "/games/playstation/vagrant-story/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25d-lQxcE+IX1WMyTmw5i6B7rH4tjnU\"",
    "mtime": "2026-01-08T06:14:11.632Z",
    "size": 605,
    "path": "../public/games/playstation/vagrant-story/_payload.json"
  },
  "/games/playstation/valkyrie-profile/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d30-4y54D4r26btofsg33E327RCSDzc\"",
    "mtime": "2026-01-08T06:14:09.926Z",
    "size": 3376,
    "path": "../public/games/playstation/valkyrie-profile/index.html"
  },
  "/games/playstation/valkyrie-profile/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"261-qL07KciB3eRpLAv7YBFfgD0KL0Q\"",
    "mtime": "2026-01-08T06:14:11.632Z",
    "size": 609,
    "path": "../public/games/playstation/valkyrie-profile/_payload.json"
  },
  "/games/playstation/vib-ribbon/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d06-PoIqXMCs7+DLy4zjglL2+oCjqoo\"",
    "mtime": "2026-01-08T06:14:09.999Z",
    "size": 3334,
    "path": "../public/games/playstation/vib-ribbon/index.html"
  },
  "/games/playstation/vib-ribbon/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"258-g4Tg9HyqP7KaUIQCW2gdxkpdr/w\"",
    "mtime": "2026-01-08T06:14:11.675Z",
    "size": 600,
    "path": "../public/games/playstation/vib-ribbon/_payload.json"
  },
  "/games/playstation/wild-arms/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"dc5-lvXxO3A8HGkHqqFvSg+QlA7X5Fs\"",
    "mtime": "2026-01-08T06:14:09.950Z",
    "size": 3525,
    "path": "../public/games/playstation/wild-arms/index.html"
  },
  "/games/playstation/wild-arms/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"2ee-F/lEVdeAayaAXyyRg0rf6QmZ7lU\"",
    "mtime": "2026-01-08T06:14:11.632Z",
    "size": 750,
    "path": "../public/games/playstation/wild-arms/_payload.json"
  },
  "/games/playstation/xenogears/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d08-EhzB6KwLBTUMvRa+0G4JCEBtEOI\"",
    "mtime": "2026-01-08T06:14:09.987Z",
    "size": 3336,
    "path": "../public/games/playstation/xenogears/index.html"
  },
  "/games/playstation/xenogears/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25b-R0DPH6Q4QJvxz2744AfQUmNqY8o\"",
    "mtime": "2026-01-08T06:14:11.674Z",
    "size": 603,
    "path": "../public/games/playstation/xenogears/_payload.json"
  },
  "/games/playstation/wild-arms-2/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d12-fsFzR4eRd15/Nil5UuYUjpX9N9o\"",
    "mtime": "2026-01-08T06:14:09.955Z",
    "size": 3346,
    "path": "../public/games/playstation/wild-arms-2/index.html"
  },
  "/games/playstation/wild-arms-2/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25c-B6JhnkxRACSB2cOFKoKLCKL0GMc\"",
    "mtime": "2026-01-08T06:14:11.632Z",
    "size": 604,
    "path": "../public/games/playstation/wild-arms-2/_payload.json"
  },
  "/games/playstation-2/blood-will-tell-tezuka-asamus-dororo/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"dc8-JgD2r7o2jvEJbG+ydDYso9hw84Q\"",
    "mtime": "2026-01-08T06:14:06.932Z",
    "size": 3528,
    "path": "../public/games/playstation-2/blood-will-tell-tezuka-asamus-dororo/index.html"
  },
  "/games/playstation-2/blood-will-tell-tezuka-asamus-dororo/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"27a-aYZUuY2QKuNlB6gMHdlVlRY2ubo\"",
    "mtime": "2026-01-08T06:14:10.481Z",
    "size": 634,
    "path": "../public/games/playstation-2/blood-will-tell-tezuka-asamus-dororo/_payload.json"
  },
  "/games/playstation-2/bully/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"ec1-SJ7v/Kh5MZj0VfXi4c1SZXorep4\"",
    "mtime": "2026-01-08T06:14:06.932Z",
    "size": 3777,
    "path": "../public/games/playstation-2/bully/index.html"
  },
  "/games/playstation-2/bully/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"360-vHY9ukWMseVxi9g8z3SSmDgYfJo\"",
    "mtime": "2026-01-08T06:14:10.481Z",
    "size": 864,
    "path": "../public/games/playstation-2/bully/_payload.json"
  },
  "/games/playstation-2/burnout-revenge/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d38-R5VlV5D3z5wxRPEnCHh3YtJz4rI\"",
    "mtime": "2026-01-08T06:14:06.978Z",
    "size": 3384,
    "path": "../public/games/playstation-2/burnout-revenge/index.html"
  },
  "/games/playstation-2/burnout-revenge/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"264-Zx1gOI5QUI5LKHALA+JYjr9mqRA\"",
    "mtime": "2026-01-08T06:14:10.554Z",
    "size": 612,
    "path": "../public/games/playstation-2/burnout-revenge/_payload.json"
  },
  "/games/playstation-2/call-of-duty-2-big-red-one/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"dc3-tdXWeVoy2M8l4EjGtBCDWg+MhOw\"",
    "mtime": "2026-01-08T06:14:06.943Z",
    "size": 3523,
    "path": "../public/games/playstation-2/call-of-duty-2-big-red-one/index.html"
  },
  "/games/playstation-2/call-of-duty-2-big-red-one/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"282-904i1HCJWtsRIr/ViwtGW1m1m+A\"",
    "mtime": "2026-01-08T06:14:10.521Z",
    "size": 642,
    "path": "../public/games/playstation-2/call-of-duty-2-big-red-one/_payload.json"
  },
  "/games/playstation-2/call-of-duty-3/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d79-S0PGbPY+7QfgUwtGqgGtYdCfPHo\"",
    "mtime": "2026-01-08T06:14:06.930Z",
    "size": 3449,
    "path": "../public/games/playstation-2/call-of-duty-3/index.html"
  },
  "/games/playstation-2/call-of-duty-3/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"276-pbKOyi0yoU6RUNKrUHMQY6Ifkx4\"",
    "mtime": "2026-01-08T06:14:10.481Z",
    "size": 630,
    "path": "../public/games/playstation-2/call-of-duty-3/_payload.json"
  },
  "/games/playstation-2/call-of-duty-finest-hour/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"dc4-vTPZPZhwTE4dv5w1OAvWL2qyghk\"",
    "mtime": "2026-01-08T06:14:06.940Z",
    "size": 3524,
    "path": "../public/games/playstation-2/call-of-duty-finest-hour/index.html"
  },
  "/games/playstation-2/call-of-duty-finest-hour/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"291-9VIcKaf+hDz7bvciO8w1W+JEm5w\"",
    "mtime": "2026-01-08T06:14:10.496Z",
    "size": 657,
    "path": "../public/games/playstation-2/call-of-duty-finest-hour/_payload.json"
  },
  "/games/playstation-2/clock-tower-3/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d2c-Z/iYUp2qYk3deqMqbBli4v9Nppk\"",
    "mtime": "2026-01-08T06:14:07.184Z",
    "size": 3372,
    "path": "../public/games/playstation-2/clock-tower-3/index.html"
  },
  "/games/playstation-2/clock-tower-3/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"262-NhqRxeIrZPPW8zty/ObW+4ms6eI\"",
    "mtime": "2026-01-08T06:14:10.569Z",
    "size": 610,
    "path": "../public/games/playstation-2/clock-tower-3/_payload.json"
  },
  "/games/playstation-2/dance-dance-revolution-supernova/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d9e-by5D+KSCY3JPVcsM7IPJv2kIqgA\"",
    "mtime": "2026-01-08T06:14:07.249Z",
    "size": 3486,
    "path": "../public/games/playstation-2/dance-dance-revolution-supernova/index.html"
  },
  "/games/playstation-2/dance-dance-revolution-supernova/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"275-3Mj67Y1qdhVNipPeRza+tVgp/2w\"",
    "mtime": "2026-01-08T06:14:10.584Z",
    "size": 629,
    "path": "../public/games/playstation-2/dance-dance-revolution-supernova/_payload.json"
  },
  "/games/playstation-2/devil-may-cry/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d2c-g7wRe2lHftGQP6Ctjh/8H55ZtOY\"",
    "mtime": "2026-01-08T06:14:07.270Z",
    "size": 3372,
    "path": "../public/games/playstation-2/devil-may-cry/index.html"
  },
  "/games/playstation-2/devil-may-cry/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"261-+oxKrHtyh1OlU6SwwpbPS29h1cU\"",
    "mtime": "2026-01-08T06:14:10.648Z",
    "size": 609,
    "path": "../public/games/playstation-2/devil-may-cry/_payload.json"
  },
  "/games/playstation-2/devil-may-cry-2/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d38-WfcQi9LW/rsi+fSdrm84+DKOsVo\"",
    "mtime": "2026-01-08T06:14:07.271Z",
    "size": 3384,
    "path": "../public/games/playstation-2/devil-may-cry-2/index.html"
  },
  "/games/playstation-2/devil-may-cry-2/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"264-O8y4glecr+p24h2+Fmgf3yc80xU\"",
    "mtime": "2026-01-08T06:14:10.664Z",
    "size": 612,
    "path": "../public/games/playstation-2/devil-may-cry-2/_payload.json"
  },
  "/games/playstation-2/devil-may-cry-3/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d38-nqxHONkhIRSj7MeoFzWzkb/CYV4\"",
    "mtime": "2026-01-08T06:14:07.272Z",
    "size": 3384,
    "path": "../public/games/playstation-2/devil-may-cry-3/index.html"
  },
  "/games/playstation-2/devil-may-cry-3/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"264-p1bLjI+RK33lX6zpqJTl93abCR0\"",
    "mtime": "2026-01-08T06:14:10.664Z",
    "size": 612,
    "path": "../public/games/playstation-2/devil-may-cry-3/_payload.json"
  },
  "/games/playstation-2/dodonpachi-dai-ou-jou/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d56-k/9kX9yQ7mEZm/29J2viPfgLZF4\"",
    "mtime": "2026-01-08T06:14:07.464Z",
    "size": 3414,
    "path": "../public/games/playstation-2/dodonpachi-dai-ou-jou/index.html"
  },
  "/games/playstation-2/dodonpachi-dai-ou-jou/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"267-ocv7zIqmI67mFUqLpsHU/foUUWs\"",
    "mtime": "2026-01-08T06:14:10.683Z",
    "size": 615,
    "path": "../public/games/playstation-2/dodonpachi-dai-ou-jou/_payload.json"
  },
  "/games/playstation-2/echo-night-beyond/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d44-v28UWsGJyHbs5eZlUxFAri+O8Ak\"",
    "mtime": "2026-01-08T06:14:07.531Z",
    "size": 3396,
    "path": "../public/games/playstation-2/echo-night-beyond/index.html"
  },
  "/games/playstation-2/echo-night-beyond/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"266-suUCluUv0kggpTYF3NFb4cEvdSg\"",
    "mtime": "2026-01-08T06:14:10.732Z",
    "size": 614,
    "path": "../public/games/playstation-2/echo-night-beyond/_payload.json"
  },
  "/games/playstation-2/extermination/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"e47-rkRC/w+Jevi1deRBA0u75rWprKw\"",
    "mtime": "2026-01-08T06:14:07.531Z",
    "size": 3655,
    "path": "../public/games/playstation-2/extermination/index.html"
  },
  "/games/playstation-2/extermination/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"31b-x1hB++n5T+DvvRla8eGivN2rq6s\"",
    "mtime": "2026-01-08T06:14:10.754Z",
    "size": 795,
    "path": "../public/games/playstation-2/extermination/_payload.json"
  },
  "/games/playstation-2/fatal-frame/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d22-Fni95B9AiwFjAmTxq32dzQsEpdc\"",
    "mtime": "2026-01-08T06:14:07.591Z",
    "size": 3362,
    "path": "../public/games/playstation-2/fatal-frame/index.html"
  },
  "/games/playstation-2/fatal-frame/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"261-DphbrtvYMKvmjdcOURZi2WsaSNU\"",
    "mtime": "2026-01-08T06:14:10.754Z",
    "size": 609,
    "path": "../public/games/playstation-2/fatal-frame/_payload.json"
  },
  "/games/playstation-2/fatal-frame-iii-the-tormented/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d8e-8XYjKSkSy7WmrlNs2/eXMrEF+3E\"",
    "mtime": "2026-01-08T06:14:07.595Z",
    "size": 3470,
    "path": "../public/games/playstation-2/fatal-frame-iii-the-tormented/index.html"
  },
  "/games/playstation-2/fatal-frame-iii-the-tormented/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"273-QzWg1ZLowbMQhLNvl3yLT23sc10\"",
    "mtime": "2026-01-08T06:14:10.769Z",
    "size": 627,
    "path": "../public/games/playstation-2/fatal-frame-iii-the-tormented/_payload.json"
  },
  "/games/playstation-2/fatal-frame-ii-crimson-butterfly/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"da0-N9/gacyKAG/OSusFvqI0oQp4iUE\"",
    "mtime": "2026-01-08T06:14:07.540Z",
    "size": 3488,
    "path": "../public/games/playstation-2/fatal-frame-ii-crimson-butterfly/index.html"
  },
  "/games/playstation-2/fatal-frame-ii-crimson-butterfly/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"275-2KtGu1JLo0QzjutFJkArxpuU53s\"",
    "mtime": "2026-01-08T06:14:10.754Z",
    "size": 629,
    "path": "../public/games/playstation-2/fatal-frame-ii-crimson-butterfly/_payload.json"
  },
  "/games/playstation-2/final-fantasy-vii-dirge-of-cerberus/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"dac-EFt/8YUkdYIeP/9xS1GSLYXFaRw\"",
    "mtime": "2026-01-08T06:14:07.795Z",
    "size": 3500,
    "path": "../public/games/playstation-2/final-fantasy-vii-dirge-of-cerberus/index.html"
  },
  "/games/playstation-2/final-fantasy-vii-dirge-of-cerberus/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"276-PrqxcvIgCtH7PpKkhQHKD3Tp3EI\"",
    "mtime": "2026-01-08T06:14:10.812Z",
    "size": 630,
    "path": "../public/games/playstation-2/final-fantasy-vii-dirge-of-cerberus/_payload.json"
  },
  "/games/playstation-2/final-fantasy-x/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d38-ZHcM3G+Ag/Ea9ry8heX1VgYf1tg\"",
    "mtime": "2026-01-08T06:14:07.798Z",
    "size": 3384,
    "path": "../public/games/playstation-2/final-fantasy-x/index.html"
  },
  "/games/playstation-2/final-fantasy-x/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"264-lxfhoGzRffi4zdxTrhNYp/cDQKQ\"",
    "mtime": "2026-01-08T06:14:10.835Z",
    "size": 612,
    "path": "../public/games/playstation-2/final-fantasy-x/_payload.json"
  },
  "/games/playstation-2/final-fantasy-xi/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d38-aRPhfmwOwvkshzrWLVd6wSjuaD4\"",
    "mtime": "2026-01-08T06:14:07.795Z",
    "size": 3384,
    "path": "../public/games/playstation-2/final-fantasy-xi/index.html"
  },
  "/games/playstation-2/final-fantasy-xi/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"262-VhJdbQwn4lkaR5PACtqzGPKfsjs\"",
    "mtime": "2026-01-08T06:14:10.812Z",
    "size": 610,
    "path": "../public/games/playstation-2/final-fantasy-xi/_payload.json"
  },
  "/games/playstation-2/final-fantasy-xii/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"da8-/T86Cmeh8BjCzVhutwiq1kZylLo\"",
    "mtime": "2026-01-08T06:14:07.890Z",
    "size": 3496,
    "path": "../public/games/playstation-2/final-fantasy-xii/index.html"
  },
  "/games/playstation-2/final-fantasy-xii/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"293-B1ITn4GnwnnURX+gsSJiQksv0hQ\"",
    "mtime": "2026-01-08T06:14:10.854Z",
    "size": 659,
    "path": "../public/games/playstation-2/final-fantasy-xii/_payload.json"
  },
  "/games/playstation-2/freedom-fighters/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d38-8T+0LLW5LkXNVAWwJTmTyclvC8s\"",
    "mtime": "2026-01-08T06:14:08.022Z",
    "size": 3384,
    "path": "../public/games/playstation-2/freedom-fighters/index.html"
  },
  "/games/playstation-2/freedom-fighters/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"262-ssq1+Nruki7MP7H/sSLkE+jTKPM\"",
    "mtime": "2026-01-08T06:14:10.871Z",
    "size": 610,
    "path": "../public/games/playstation-2/freedom-fighters/_payload.json"
  },
  "/games/playstation-2/gitaroo-man/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d20-pMzZDW6zTmVnwVqrexD81TlnV+w\"",
    "mtime": "2026-01-08T06:14:08.022Z",
    "size": 3360,
    "path": "../public/games/playstation-2/gitaroo-man/index.html"
  },
  "/games/playstation-2/gitaroo-man/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25f-wh+qNjm8OLGWyXf3CPCY+8XwcEY\"",
    "mtime": "2026-01-08T06:14:10.872Z",
    "size": 607,
    "path": "../public/games/playstation-2/gitaroo-man/_payload.json"
  },
  "/games/playstation-2/god-hand/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d0e-XPUXqyYYHfXldWx7LQCpIywRvJs\"",
    "mtime": "2026-01-08T06:14:08.052Z",
    "size": 3342,
    "path": "../public/games/playstation-2/god-hand/index.html"
  },
  "/games/playstation-2/god-hand/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25d-dNuoT5sFzypkbZ3mqBnfk20BE18\"",
    "mtime": "2026-01-08T06:14:10.872Z",
    "size": 605,
    "path": "../public/games/playstation-2/god-hand/_payload.json"
  },
  "/games/playstation-2/god-of-war/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d14-zeqe2N9yeQBfC22Sd8kqD0X0Mmk\"",
    "mtime": "2026-01-08T06:14:08.044Z",
    "size": 3348,
    "path": "../public/games/playstation-2/god-of-war/index.html"
  },
  "/games/playstation-2/god-of-war/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25c-xWcDhkl9SKhxgQCSQz4VEHOOV9g\"",
    "mtime": "2026-01-08T06:14:10.872Z",
    "size": 604,
    "path": "../public/games/playstation-2/god-of-war/_payload.json"
  },
  "/games/playstation-2/god-of-war-ii/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d26-wd8SIp32n/mKPCwG4uAVDoYtBeU\"",
    "mtime": "2026-01-08T06:14:08.063Z",
    "size": 3366,
    "path": "../public/games/playstation-2/god-of-war-ii/index.html"
  },
  "/games/playstation-2/god-of-war-ii/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25f-V0SBVSEX+kUVCTLfRaO+zy+y6+s\"",
    "mtime": "2026-01-08T06:14:10.885Z",
    "size": 607,
    "path": "../public/games/playstation-2/god-of-war-ii/_payload.json"
  },
  "/games/playstation-2/grand-theft-auto-iii/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d56-+IVwPnHoZk5Y23ccwd8eftfYrlA\"",
    "mtime": "2026-01-08T06:14:08.063Z",
    "size": 3414,
    "path": "../public/games/playstation-2/grand-theft-auto-iii/index.html"
  },
  "/games/playstation-2/grand-theft-auto-iii/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"269-9lnD8Z1itCyEEpKAFwgXosNRjc0\"",
    "mtime": "2026-01-08T06:14:10.885Z",
    "size": 617,
    "path": "../public/games/playstation-2/grand-theft-auto-iii/_payload.json"
  },
  "/games/playstation-2/grand-theft-auto-san-andreas/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"e31-NPmS0vSzBMYBb3d6+oEB+SJBVg0\"",
    "mtime": "2026-01-08T06:14:08.063Z",
    "size": 3633,
    "path": "../public/games/playstation-2/grand-theft-auto-san-andreas/index.html"
  },
  "/games/playstation-2/grand-theft-auto-san-andreas/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"2f5-RKEsR+0VjqWEXMAvhlUu4CpLqEM\"",
    "mtime": "2026-01-08T06:14:10.885Z",
    "size": 757,
    "path": "../public/games/playstation-2/grand-theft-auto-san-andreas/_payload.json"
  },
  "/games/playstation-2/grand-theft-auto-vice-city/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d7a-aQAyMANHkeUYeAAYlAmpHbIRS6g\"",
    "mtime": "2026-01-08T06:14:08.063Z",
    "size": 3450,
    "path": "../public/games/playstation-2/grand-theft-auto-vice-city/index.html"
  },
  "/games/playstation-2/grand-theft-auto-vice-city/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"26f-/aiIKo1MOJhpi0YBg/9eVQIILLE\"",
    "mtime": "2026-01-08T06:14:10.902Z",
    "size": 623,
    "path": "../public/games/playstation-2/grand-theft-auto-vice-city/_payload.json"
  },
  "/games/playstation-2/guitar-hero/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d1a-O6jgIIMj7t0JhXvV7K+iiwdVoXY\"",
    "mtime": "2026-01-08T06:14:08.063Z",
    "size": 3354,
    "path": "../public/games/playstation-2/guitar-hero/index.html"
  },
  "/games/playstation-2/guitar-hero/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25c-858daaCH1PZ7FL0cPOaCCVJtRKY\"",
    "mtime": "2026-01-08T06:14:10.902Z",
    "size": 604,
    "path": "../public/games/playstation-2/guitar-hero/_payload.json"
  },
  "/games/playstation-2/guitar-hero-iii/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d32-1I4BR8XZgb++7Rz3jpDxskqtcL4\"",
    "mtime": "2026-01-08T06:14:08.063Z",
    "size": 3378,
    "path": "../public/games/playstation-2/guitar-hero-iii/index.html"
  },
  "/games/playstation-2/guitar-hero-iii/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"261-Rd/ygusob76yyniUbCldYhBUBSE\"",
    "mtime": "2026-01-08T06:14:10.902Z",
    "size": 609,
    "path": "../public/games/playstation-2/guitar-hero-iii/_payload.json"
  },
  "/games/playstation-2/guitar-hero-ii/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d2c-C6cfv6AgMdpZs3mhiZdPCGr/tJY\"",
    "mtime": "2026-01-08T06:14:08.063Z",
    "size": 3372,
    "path": "../public/games/playstation-2/guitar-hero-ii/index.html"
  },
  "/games/playstation-2/guitar-hero-ii/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"260-j4YdrCW2oeqzqFnYwZw3Hs4KrtU\"",
    "mtime": "2026-01-08T06:14:10.902Z",
    "size": 608,
    "path": "../public/games/playstation-2/guitar-hero-ii/_payload.json"
  },
  "/games/playstation-2/haunting-ground/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d32-g2AXldGYlkPGVAffyJhgLfFcRA8\"",
    "mtime": "2026-01-08T06:14:08.136Z",
    "size": 3378,
    "path": "../public/games/playstation-2/haunting-ground/index.html"
  },
  "/games/playstation-2/haunting-ground/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"260-9MLJaXPY/SbQMlKMPEPCnU8jCUU\"",
    "mtime": "2026-01-08T06:14:10.943Z",
    "size": 608,
    "path": "../public/games/playstation-2/haunting-ground/_payload.json"
  },
  "/games/playstation-2/ico/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"cf0-ifjts4AHmpco4uR5evIe5ljFQbQ\"",
    "mtime": "2026-01-08T06:14:08.195Z",
    "size": 3312,
    "path": "../public/games/playstation-2/ico/index.html"
  },
  "/games/playstation-2/ico/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"258-d8G2vK40Q4vKqQ3LzLhFO4W6d5w\"",
    "mtime": "2026-01-08T06:14:10.962Z",
    "size": 600,
    "path": "../public/games/playstation-2/ico/_payload.json"
  },
  "/games/playstation-2/jade-cocoon-2/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d2c-UtY/ryHKH/K7q2X9GyADrQighHg\"",
    "mtime": "2026-01-08T06:14:08.148Z",
    "size": 3372,
    "path": "../public/games/playstation-2/jade-cocoon-2/index.html"
  },
  "/games/playstation-2/jade-cocoon-2/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"262-3/FW9Stta4cc+L/0u2a7mQROiOU\"",
    "mtime": "2026-01-08T06:14:10.943Z",
    "size": 610,
    "path": "../public/games/playstation-2/jade-cocoon-2/_payload.json"
  },
  "/games/playstation-2/jak-and-daxter-the-precursor-legacy/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"dac-NQx/8yHvbwtytWxB70TSN8qskU4\"",
    "mtime": "2026-01-08T06:14:08.309Z",
    "size": 3500,
    "path": "../public/games/playstation-2/jak-and-daxter-the-precursor-legacy/index.html"
  },
  "/games/playstation-2/jak-and-daxter-the-precursor-legacy/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"276-ol6TPHHD2u4i6zg/CFCoE0R6eig\"",
    "mtime": "2026-01-08T06:14:10.980Z",
    "size": 630,
    "path": "../public/games/playstation-2/jak-and-daxter-the-precursor-legacy/_payload.json"
  },
  "/games/playstation-2/jak-3/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"cfc-CTm7maQCgCyDgmtT7cnNPOG9ymM\"",
    "mtime": "2026-01-08T06:14:08.228Z",
    "size": 3324,
    "path": "../public/games/playstation-2/jak-3/index.html"
  },
  "/games/playstation-2/jak-3/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25a-+wa5futGAyr4wG6ZZPCJNuKpwGg\"",
    "mtime": "2026-01-08T06:14:10.962Z",
    "size": 602,
    "path": "../public/games/playstation-2/jak-3/_payload.json"
  },
  "/games/playstation-2/jak-ii/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d02-yz3FzYSP5NhV/rs8WO6NZQsd8T8\"",
    "mtime": "2026-01-08T06:14:08.245Z",
    "size": 3330,
    "path": "../public/games/playstation-2/jak-ii/index.html"
  },
  "/games/playstation-2/jak-ii/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25b-7IO7QQIiTRKfB7KzPxYVMPLh3VM\"",
    "mtime": "2026-01-08T06:14:10.962Z",
    "size": 603,
    "path": "../public/games/playstation-2/jak-ii/_payload.json"
  },
  "/games/playstation-2/jak-x-combat-racing/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"dfa-P3HstrKp2BR/pufhWSiEqbHZaJs\"",
    "mtime": "2026-01-08T06:14:08.306Z",
    "size": 3578,
    "path": "../public/games/playstation-2/jak-x-combat-racing/index.html"
  },
  "/games/playstation-2/jak-x-combat-racing/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"2c2-UF/JbYnAD7osXdELzope+9Vxj0o\"",
    "mtime": "2026-01-08T06:14:10.980Z",
    "size": 706,
    "path": "../public/games/playstation-2/jak-x-combat-racing/_payload.json"
  },
  "/games/playstation-2/katamari-damacy/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d32-I1GWH3Em2Zqy5z+jOAlOpUfrv7E\"",
    "mtime": "2026-01-08T06:14:08.367Z",
    "size": 3378,
    "path": "../public/games/playstation-2/katamari-damacy/index.html"
  },
  "/games/playstation-2/katamari-damacy/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"261-JwxFL+2PeZVzIglPdM7hLWSi4l0\"",
    "mtime": "2026-01-08T06:14:11.033Z",
    "size": 609,
    "path": "../public/games/playstation-2/katamari-damacy/_payload.json"
  },
  "/games/playstation-2/killzone/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d70-4Z55ABZrH7jfgujszMPJRGnHlZ8\"",
    "mtime": "2026-01-08T06:14:08.322Z",
    "size": 3440,
    "path": "../public/games/playstation-2/killzone/index.html"
  },
  "/games/playstation-2/killzone/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"288-aMcCVytwUWjn4rvGfN1J2GBvjPw\"",
    "mtime": "2026-01-08T06:14:10.996Z",
    "size": 648,
    "path": "../public/games/playstation-2/killzone/_payload.json"
  },
  "/games/playstation-2/kingdom-hearts/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d32-rZ5xx/oqfzzZA2T6/FFoVBAMB1Q\"",
    "mtime": "2026-01-08T06:14:08.322Z",
    "size": 3378,
    "path": "../public/games/playstation-2/kingdom-hearts/index.html"
  },
  "/games/playstation-2/kingdom-hearts/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"263-Om5mUkd0C0w8+0M/HpVwY73ZY4I\"",
    "mtime": "2026-01-08T06:14:11.011Z",
    "size": 611,
    "path": "../public/games/playstation-2/kingdom-hearts/_payload.json"
  },
  "/games/playstation-2/kings-field-the-ancient-city/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d98-HfX5e/MwK+YBvc4RWf6BdFKlb68\"",
    "mtime": "2026-01-08T06:14:08.322Z",
    "size": 3480,
    "path": "../public/games/playstation-2/kings-field-the-ancient-city/index.html"
  },
  "/games/playstation-2/kings-field-the-ancient-city/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"273-sw+1jqWrobpCvM+4zmm4xNXAX6k\"",
    "mtime": "2026-01-08T06:14:11.011Z",
    "size": 627,
    "path": "../public/games/playstation-2/kings-field-the-ancient-city/_payload.json"
  },
  "/games/playstation-2/kuon/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"cf6-3qpx4Jpz4Q/oxTDYj85y4xcO+v4\"",
    "mtime": "2026-01-08T06:14:08.435Z",
    "size": 3318,
    "path": "../public/games/playstation-2/kuon/index.html"
  },
  "/games/playstation-2/kuon/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25f-ur5PCFfnmKLoZusAxExiXrJigoE\"",
    "mtime": "2026-01-08T06:14:11.055Z",
    "size": 607,
    "path": "../public/games/playstation-2/kuon/_payload.json"
  },
  "/games/playstation-2/lord-of-the-rings-the-two-towers/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"da9-jh7CCTuESVdKRbe0fsAFcAiHbnY\"",
    "mtime": "2026-01-08T06:14:08.608Z",
    "size": 3497,
    "path": "../public/games/playstation-2/lord-of-the-rings-the-two-towers/index.html"
  },
  "/games/playstation-2/lord-of-the-rings-the-two-towers/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"277-fmRbzJ1xdnFqDariEECdvETDNaw\"",
    "mtime": "2026-01-08T06:14:11.092Z",
    "size": 631,
    "path": "../public/games/playstation-2/lord-of-the-rings-the-two-towers/_payload.json"
  },
  "/games/playstation-2/manhunt/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d0a-g85d0BYsHgg6tESdImX1kg+6vOs\"",
    "mtime": "2026-01-08T06:14:08.608Z",
    "size": 3338,
    "path": "../public/games/playstation-2/manhunt/index.html"
  },
  "/games/playstation-2/manhunt/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25d-bGrKZhKYNRFJXR6cLR9xYkaz+hc\"",
    "mtime": "2026-01-08T06:14:11.093Z",
    "size": 605,
    "path": "../public/games/playstation-2/manhunt/_payload.json"
  },
  "/games/playstation-2/manhunt-2/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d14-WzA6e64G+xgLqkOdJ8c0Dy5RYTI\"",
    "mtime": "2026-01-08T06:14:08.620Z",
    "size": 3348,
    "path": "../public/games/playstation-2/manhunt-2/index.html"
  },
  "/games/playstation-2/manhunt-2/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25e-FgdsJ5SBkMu2+0Ug6o88X6uCTJo\"",
    "mtime": "2026-01-08T06:14:11.126Z",
    "size": 606,
    "path": "../public/games/playstation-2/manhunt-2/_payload.json"
  },
  "/games/playstation-2/max-payne/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d0e-eNqT8P2MpejtBH58aOXRAlkp7/k\"",
    "mtime": "2026-01-08T06:14:08.620Z",
    "size": 3342,
    "path": "../public/games/playstation-2/max-payne/index.html"
  },
  "/games/playstation-2/max-payne/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25b-u+z58FHqc8Cw7oBdlt1YtAASSAQ\"",
    "mtime": "2026-01-08T06:14:11.126Z",
    "size": 603,
    "path": "../public/games/playstation-2/max-payne/_payload.json"
  },
  "/games/playstation-2/max-payne-2-the-fall-of-max-payne/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"da6-zmc5/ebgb+i0AbQuckrZuDcDdB4\"",
    "mtime": "2026-01-08T06:14:08.608Z",
    "size": 3494,
    "path": "../public/games/playstation-2/max-payne-2-the-fall-of-max-payne/index.html"
  },
  "/games/playstation-2/max-payne-2-the-fall-of-max-payne/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"277-uSQCvxDcUnuOB5jUl/ALkfOXpCA\"",
    "mtime": "2026-01-08T06:14:11.108Z",
    "size": 631,
    "path": "../public/games/playstation-2/max-payne-2-the-fall-of-max-payne/_payload.json"
  },
  "/games/playstation-2/mdk-2-armageddon/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d40-N25ryBYCPjP5cfj0Z/dq+dbXb8k\"",
    "mtime": "2026-01-08T06:14:08.609Z",
    "size": 3392,
    "path": "../public/games/playstation-2/mdk-2-armageddon/index.html"
  },
  "/games/playstation-2/mdk-2-armageddon/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"266-Z7t7rfK5eO3AnAlc/7B2+6Jr0oM\"",
    "mtime": "2026-01-08T06:14:11.108Z",
    "size": 614,
    "path": "../public/games/playstation-2/mdk-2-armageddon/_payload.json"
  },
  "/games/playstation-2/metal-gear-solid-2-sons-of-liberty/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"da6-KalMhFtG5YTEqjlotPfQx/kdtxU\"",
    "mtime": "2026-01-08T06:14:08.620Z",
    "size": 3494,
    "path": "../public/games/playstation-2/metal-gear-solid-2-sons-of-liberty/index.html"
  },
  "/games/playstation-2/metal-gear-solid-2-sons-of-liberty/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"275-JdFfAO0BuPC9rpdFeZdfc07l5Lw\"",
    "mtime": "2026-01-08T06:14:11.126Z",
    "size": 629,
    "path": "../public/games/playstation-2/metal-gear-solid-2-sons-of-liberty/_payload.json"
  },
  "/games/playstation-2/metal-gear-solid-2-the-document-of/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"da7-wjUoVCjJx5N+bL/F0dAdviTbbdc\"",
    "mtime": "2026-01-08T06:14:08.621Z",
    "size": 3495,
    "path": "../public/games/playstation-2/metal-gear-solid-2-the-document-of/index.html"
  },
  "/games/playstation-2/metal-gear-solid-2-the-document-of/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"274-UzzugwzjD7IYHKnb+93ZF3pn/J4\"",
    "mtime": "2026-01-08T06:14:11.126Z",
    "size": 628,
    "path": "../public/games/playstation-2/metal-gear-solid-2-the-document-of/_payload.json"
  },
  "/games/playstation-2/metal-gear-solid-3-snake-eater/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d8e-DlSAHWss5o8lYxtRMZfQ0LqIgaM\"",
    "mtime": "2026-01-08T06:14:08.621Z",
    "size": 3470,
    "path": "../public/games/playstation-2/metal-gear-solid-3-snake-eater/index.html"
  },
  "/games/playstation-2/metal-gear-solid-3-snake-eater/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"271-tTeEukpPKq66jNBkGeOXkcKB3GY\"",
    "mtime": "2026-01-08T06:14:11.126Z",
    "size": 625,
    "path": "../public/games/playstation-2/metal-gear-solid-3-snake-eater/_payload.json"
  },
  "/games/playstation-2/metal-gear-solid-3-subsistance/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d8e-Qn3vffhOQLOaMmSLbeWZ5GgHw2E\"",
    "mtime": "2026-01-08T06:14:08.621Z",
    "size": 3470,
    "path": "../public/games/playstation-2/metal-gear-solid-3-subsistance/index.html"
  },
  "/games/playstation-2/metal-gear-solid-3-subsistance/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"271-Rd2GO6DTF/UJJABT+GuNOQQdwsc\"",
    "mtime": "2026-01-08T06:14:11.126Z",
    "size": 625,
    "path": "../public/games/playstation-2/metal-gear-solid-3-subsistance/_payload.json"
  },
  "/games/playstation-2/ninja-assault/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"f4f-HSKfRBmhN4Y8eIePio3pfO8KfAc\"",
    "mtime": "2026-01-08T06:14:08.866Z",
    "size": 3919,
    "path": "../public/games/playstation-2/ninja-assault/index.html"
  },
  "/games/playstation-2/ninja-assault/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"3c6-EMQXbie8yt7s481F+NsMGTyTSP8\"",
    "mtime": "2026-01-08T06:14:11.244Z",
    "size": 966,
    "path": "../public/games/playstation-2/ninja-assault/_payload.json"
  },
  "/games/playstation-2/okami/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"cfc-DIWaVRS07NIbtT1OdTeWcgBlXt0\"",
    "mtime": "2026-01-08T06:14:08.866Z",
    "size": 3324,
    "path": "../public/games/playstation-2/okami/index.html"
  },
  "/games/playstation-2/okami/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25a-f2ZNawoCl5pyl9SOOgHBVu24PX0\"",
    "mtime": "2026-01-08T06:14:11.224Z",
    "size": 602,
    "path": "../public/games/playstation-2/okami/_payload.json"
  },
  "/games/playstation-2/onimusha-2-samurais-destiny/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d92-6qXRO5kEF+74t8WPLKwrNA1cO+A\"",
    "mtime": "2026-01-08T06:14:08.866Z",
    "size": 3474,
    "path": "../public/games/playstation-2/onimusha-2-samurais-destiny/index.html"
  },
  "/games/playstation-2/onimusha-2-samurais-destiny/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"272-4CCYZH4POhHy4VbVjR7hjpVZvXg\"",
    "mtime": "2026-01-08T06:14:11.224Z",
    "size": 626,
    "path": "../public/games/playstation-2/onimusha-2-samurais-destiny/_payload.json"
  },
  "/games/playstation-2/onimusha-3-demon-siege/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d64-qmnFtYSUUt5rEgOjO42pV5Jo968\"",
    "mtime": "2026-01-08T06:14:08.973Z",
    "size": 3428,
    "path": "../public/games/playstation-2/onimusha-3-demon-siege/index.html"
  },
  "/games/playstation-2/onimusha-3-demon-siege/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"26c-xulnff6TBc/rHeZ5bolUvbDuGj4\"",
    "mtime": "2026-01-08T06:14:11.276Z",
    "size": 620,
    "path": "../public/games/playstation-2/onimusha-3-demon-siege/_payload.json"
  },
  "/games/playstation-2/onimusha-warlords/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d46-s7dF3bX/mW/gqDnhk2utgbKxpYw\"",
    "mtime": "2026-01-08T06:14:08.866Z",
    "size": 3398,
    "path": "../public/games/playstation-2/onimusha-warlords/index.html"
  },
  "/games/playstation-2/onimusha-warlords/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"267-VeI02pZaLX1t280tjpjytyUcVHQ\"",
    "mtime": "2026-01-08T06:14:11.244Z",
    "size": 615,
    "path": "../public/games/playstation-2/onimusha-warlords/_payload.json"
  },
  "/games/playstation-2/prince-of-persia-the-sands-of-time/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"1010-v8kxeSQLQEvtT/Q99YGK+Di5suI\"",
    "mtime": "2026-01-08T06:14:09.197Z",
    "size": 4112,
    "path": "../public/games/playstation-2/prince-of-persia-the-sands-of-time/index.html"
  },
  "/games/playstation-2/prince-of-persia-the-sands-of-time/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"49b-IXdmZe81ZFhWPsx0bxcdoyFzn3w\"",
    "mtime": "2026-01-08T06:14:11.364Z",
    "size": 1179,
    "path": "../public/games/playstation-2/prince-of-persia-the-sands-of-time/_payload.json"
  },
  "/games/playstation-2/prince-of-persia-the-two-thrones/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"da0-pP3XawOFUYNuZUBozgaL4kY5yrI\"",
    "mtime": "2026-01-08T06:14:09.127Z",
    "size": 3488,
    "path": "../public/games/playstation-2/prince-of-persia-the-two-thrones/index.html"
  },
  "/games/playstation-2/prince-of-persia-the-two-thrones/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"276-fswOBgijgZEXJK708w8AUkI/0p8\"",
    "mtime": "2026-01-08T06:14:11.304Z",
    "size": 630,
    "path": "../public/games/playstation-2/prince-of-persia-the-two-thrones/_payload.json"
  },
  "/games/playstation-2/prince-of-persia-warrior-within/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d9a-lR8k5DAI3oRMMvsP2QKe2D4mykE\"",
    "mtime": "2026-01-08T06:14:09.127Z",
    "size": 3482,
    "path": "../public/games/playstation-2/prince-of-persia-warrior-within/index.html"
  },
  "/games/playstation-2/prince-of-persia-warrior-within/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"275-lbiLdHlnQYSFoNUiEc+v5FSHWtw\"",
    "mtime": "2026-01-08T06:14:11.320Z",
    "size": 629,
    "path": "../public/games/playstation-2/prince-of-persia-warrior-within/_payload.json"
  },
  "/games/playstation-2/ratchet-and-clank/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d92-epSgDsJcRIvhf1Cnj5AjX3OuEQA\"",
    "mtime": "2026-01-08T06:14:09.144Z",
    "size": 3474,
    "path": "../public/games/playstation-2/ratchet-and-clank/index.html"
  },
  "/games/playstation-2/ratchet-and-clank/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"278-pruHmStL1FaGXGL5t3ZnmDSWHFY\"",
    "mtime": "2026-01-08T06:14:11.340Z",
    "size": 632,
    "path": "../public/games/playstation-2/ratchet-and-clank/_payload.json"
  },
  "/games/playstation-2/ratchet-and-clank-going-commando/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"da6-RP6nmH/d8gVbSJ1HebBrvWhgm4o\"",
    "mtime": "2026-01-08T06:14:09.127Z",
    "size": 3494,
    "path": "../public/games/playstation-2/ratchet-and-clank-going-commando/index.html"
  },
  "/games/playstation-2/ratchet-and-clank-going-commando/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"274-8f89WuOidXyswi5fBI5y4aFGFvk\"",
    "mtime": "2026-01-08T06:14:11.304Z",
    "size": 628,
    "path": "../public/games/playstation-2/ratchet-and-clank-going-commando/_payload.json"
  },
  "/games/playstation-2/ratchet-and-clank-up-your-arsenal/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"dac-UM1LPxNh4V+UB+yaurnkKUom8bg\"",
    "mtime": "2026-01-08T06:14:09.127Z",
    "size": 3500,
    "path": "../public/games/playstation-2/ratchet-and-clank-up-your-arsenal/index.html"
  },
  "/games/playstation-2/ratchet-and-clank-up-your-arsenal/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"274-raF0IoYrEiG5uhh7rALJrdj1+6s\"",
    "mtime": "2026-01-08T06:14:11.320Z",
    "size": 628,
    "path": "../public/games/playstation-2/ratchet-and-clank-up-your-arsenal/_payload.json"
  },
  "/games/playstation-2/red-star-the/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d23-K+8j0rDbaK5b2xUKUuYboQ9EqUM\"",
    "mtime": "2026-01-08T06:14:09.127Z",
    "size": 3363,
    "path": "../public/games/playstation-2/red-star-the/index.html"
  },
  "/games/playstation-2/red-star-the/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25e-9RMyBRzTEZFxqAy314a8fP1R1gk\"",
    "mtime": "2026-01-08T06:14:11.320Z",
    "size": 606,
    "path": "../public/games/playstation-2/red-star-the/_payload.json"
  },
  "/games/playstation-2/resident-evil-4/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d9a-CWR7bj3PjDHvunPtPC8O7CKXRig\"",
    "mtime": "2026-01-08T06:14:09.231Z",
    "size": 3482,
    "path": "../public/games/playstation-2/resident-evil-4/index.html"
  },
  "/games/playstation-2/resident-evil-4/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"28f-FRdZQpRs60kXnPU9J0E/5buhwFU\"",
    "mtime": "2026-01-08T06:14:11.364Z",
    "size": 655,
    "path": "../public/games/playstation-2/resident-evil-4/_payload.json"
  },
  "/games/playstation-2/resident-evil-code-veronica-x/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d8e-OVwY074dryMkYKrfUygcMPTSs08\"",
    "mtime": "2026-01-08T06:14:09.144Z",
    "size": 3470,
    "path": "../public/games/playstation-2/resident-evil-code-veronica-x/index.html"
  },
  "/games/playstation-2/resident-evil-code-veronica-x/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"273-QOXv0qkaAOlkEzR5qUuEIC/rqOs\"",
    "mtime": "2026-01-08T06:14:11.340Z",
    "size": 627,
    "path": "../public/games/playstation-2/resident-evil-code-veronica-x/_payload.json"
  },
  "/games/playstation-2/resident-evil-dead-aim/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d64-71TG/CbXtrh/9hF1/1Y8BBHHBOg\"",
    "mtime": "2026-01-08T06:14:09.156Z",
    "size": 3428,
    "path": "../public/games/playstation-2/resident-evil-dead-aim/index.html"
  },
  "/games/playstation-2/resident-evil-dead-aim/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"26c-4yjAqgH4Nu2WAVFf2XDi/72Ic+A\"",
    "mtime": "2026-01-08T06:14:11.364Z",
    "size": 620,
    "path": "../public/games/playstation-2/resident-evil-dead-aim/_payload.json"
  },
  "/games/playstation-2/rule-of-rose/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d26-SoAX4n/f7RDGq6dFMjDU5YrijGA\"",
    "mtime": "2026-01-08T06:14:09.265Z",
    "size": 3366,
    "path": "../public/games/playstation-2/rule-of-rose/index.html"
  },
  "/games/playstation-2/rule-of-rose/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"260-umCZexDyPpWoUPwFSp22AUOJKJw\"",
    "mtime": "2026-01-08T06:14:11.382Z",
    "size": 608,
    "path": "../public/games/playstation-2/rule-of-rose/_payload.json"
  },
  "/games/playstation-2/samurai-western/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d38-jKfiPCXZfz3gVc1cq8E8aZZ/ldU\"",
    "mtime": "2026-01-08T06:14:09.290Z",
    "size": 3384,
    "path": "../public/games/playstation-2/samurai-western/index.html"
  },
  "/games/playstation-2/samurai-western/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"263-aD+hy1EaIy+mv6o2uFbHkQ9NQQY\"",
    "mtime": "2026-01-08T06:14:11.398Z",
    "size": 611,
    "path": "../public/games/playstation-2/samurai-western/_payload.json"
  },
  "/games/playstation-2/sega-ages-2500-series-vol-25-gunstar-heroes-treasure-box/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"e33-dM6vRr8hrCQ3qgWT/NVVr/97WEg\"",
    "mtime": "2026-01-08T06:14:09.298Z",
    "size": 3635,
    "path": "../public/games/playstation-2/sega-ages-2500-series-vol-25-gunstar-heroes-treasure-box/index.html"
  },
  "/games/playstation-2/sega-ages-2500-series-vol-25-gunstar-heroes-treasure-box/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"279-ad4hQpiG0DsYV80UZerMUSf/XJA\"",
    "mtime": "2026-01-08T06:14:11.398Z",
    "size": 633,
    "path": "../public/games/playstation-2/sega-ages-2500-series-vol-25-gunstar-heroes-treasure-box/_payload.json"
  },
  "/games/playstation-2/shadow-of-the-colossus/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d5c-bjgUmxM0HVx9imJCT2Pdg0dP074\"",
    "mtime": "2026-01-08T06:14:09.334Z",
    "size": 3420,
    "path": "../public/games/playstation-2/shadow-of-the-colossus/index.html"
  },
  "/games/playstation-2/shadow-of-the-colossus/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"268-cP8PiaP4GWX3r4M5Xo+UkLTrREM\"",
    "mtime": "2026-01-08T06:14:11.398Z",
    "size": 616,
    "path": "../public/games/playstation-2/shadow-of-the-colossus/_payload.json"
  },
  "/games/playstation-2/shining-force-exa/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d44-p0MwX4gdLHzT6KjO7FtPoKnkOjg\"",
    "mtime": "2026-01-08T06:14:09.366Z",
    "size": 3396,
    "path": "../public/games/playstation-2/shining-force-exa/index.html"
  },
  "/games/playstation-2/shining-force-exa/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"266-Z4CkkiEkn7uweoteHp6+0POCKzE\"",
    "mtime": "2026-01-08T06:14:11.413Z",
    "size": 614,
    "path": "../public/games/playstation-2/shining-force-exa/_payload.json"
  },
  "/games/playstation-2/shining-force-neo/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d44-vlyD1dbpbSKT9/5ZW+Wx51zeAgk\"",
    "mtime": "2026-01-08T06:14:09.366Z",
    "size": 3396,
    "path": "../public/games/playstation-2/shining-force-neo/index.html"
  },
  "/games/playstation-2/shining-force-neo/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"266-KIPSvoavpQQZlXCiE/syQ6k070I\"",
    "mtime": "2026-01-08T06:14:11.398Z",
    "size": 614,
    "path": "../public/games/playstation-2/shining-force-neo/_payload.json"
  },
  "/games/playstation-2/shining-tears/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d2c-XCilCrcKM3EIMmsYvVKjG3Fvs/Y\"",
    "mtime": "2026-01-08T06:14:09.366Z",
    "size": 3372,
    "path": "../public/games/playstation-2/shining-tears/index.html"
  },
  "/games/playstation-2/shining-tears/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"262-ZmfZzqE0a4RXFCZKDzrQGKilWuM\"",
    "mtime": "2026-01-08T06:14:11.413Z",
    "size": 610,
    "path": "../public/games/playstation-2/shining-tears/_payload.json"
  },
  "/games/playstation-2/shinobi/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d08-CbeMXgA9lwVW9UIZTFHPEQEfw5g\"",
    "mtime": "2026-01-08T06:14:09.366Z",
    "size": 3336,
    "path": "../public/games/playstation-2/shinobi/index.html"
  },
  "/games/playstation-2/shinobi/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25b-ggJIuZgVhcwIyyCwqxEUa5HZp+A\"",
    "mtime": "2026-01-08T06:14:11.413Z",
    "size": 603,
    "path": "../public/games/playstation-2/shinobi/_payload.json"
  },
  "/games/playstation-2/silent-hill-2/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d2e-qv62oSBpNsGsJhk0f6VivoECgTA\"",
    "mtime": "2026-01-08T06:14:09.381Z",
    "size": 3374,
    "path": "../public/games/playstation-2/silent-hill-2/index.html"
  },
  "/games/playstation-2/silent-hill-2/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"263-5tISRK1dmF8TBqW9iq8LZBHv4JE\"",
    "mtime": "2026-01-08T06:14:11.433Z",
    "size": 611,
    "path": "../public/games/playstation-2/silent-hill-2/_payload.json"
  },
  "/games/playstation-2/silent-hill-3/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d2c-h14rG7E7WIPNqKXwXaw1ReW/Ysw\"",
    "mtime": "2026-01-08T06:14:09.366Z",
    "size": 3372,
    "path": "../public/games/playstation-2/silent-hill-3/index.html"
  },
  "/games/playstation-2/silent-hill-3/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"262-4s98w0xeufyjtA4EEHwDVNd3a3o\"",
    "mtime": "2026-01-08T06:14:11.413Z",
    "size": 610,
    "path": "../public/games/playstation-2/silent-hill-3/_payload.json"
  },
  "/games/playstation-2/silent-hill-4-the-room/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d5e-kgUEZIFJoU6iRC7xdlTmnAjwdAE\"",
    "mtime": "2026-01-08T06:14:09.381Z",
    "size": 3422,
    "path": "../public/games/playstation-2/silent-hill-4-the-room/index.html"
  },
  "/games/playstation-2/silent-hill-4-the-room/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"268-zzbbF6Ah1/xZhNJFyPeQUHs4m/c\"",
    "mtime": "2026-01-08T06:14:11.433Z",
    "size": 616,
    "path": "../public/games/playstation-2/silent-hill-4-the-room/_payload.json"
  },
  "/games/playstation-2/silent-hill-origins/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d4c-zMeSYMlw+T83lGOJy5McxqR1CG0\"",
    "mtime": "2026-01-08T06:14:09.381Z",
    "size": 3404,
    "path": "../public/games/playstation-2/silent-hill-origins/index.html"
  },
  "/games/playstation-2/silent-hill-origins/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"265-LVFn7XbCD4STqtV++aVa3VSKgj4\"",
    "mtime": "2026-01-08T06:14:11.413Z",
    "size": 613,
    "path": "../public/games/playstation-2/silent-hill-origins/_payload.json"
  },
  "/games/playstation-2/silent-hill-shattered-memories/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d94-DvG/pj00UJIfAwx7GmifKBCfSlM\"",
    "mtime": "2026-01-08T06:14:09.381Z",
    "size": 3476,
    "path": "../public/games/playstation-2/silent-hill-shattered-memories/index.html"
  },
  "/games/playstation-2/silent-hill-shattered-memories/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"273-oUSAHTwN6aK/rClNtO2KDrmQeMY\"",
    "mtime": "2026-01-08T06:14:11.433Z",
    "size": 627,
    "path": "../public/games/playstation-2/silent-hill-shattered-memories/_payload.json"
  },
  "/games/playstation-2/sly-2-band-of-thieves/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d58-lyfGY2l6V1x8VvjabADRQZkKEIk\"",
    "mtime": "2026-01-08T06:14:09.477Z",
    "size": 3416,
    "path": "../public/games/playstation-2/sly-2-band-of-thieves/index.html"
  },
  "/games/playstation-2/sly-2-band-of-thieves/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"268-2UThG/KZuZ1f0Lb42tQoNwYmyyU\"",
    "mtime": "2026-01-08T06:14:11.467Z",
    "size": 616,
    "path": "../public/games/playstation-2/sly-2-band-of-thieves/_payload.json"
  },
  "/games/playstation-2/siren/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"cfc-JhPf5YcVbHV+YxPU1K14018TFkk\"",
    "mtime": "2026-01-08T06:14:09.382Z",
    "size": 3324,
    "path": "../public/games/playstation-2/siren/index.html"
  },
  "/games/playstation-2/siren/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25a-CKSWUDmTEzZxtpdGPiCv45+oTcM\"",
    "mtime": "2026-01-08T06:14:11.433Z",
    "size": 602,
    "path": "../public/games/playstation-2/siren/_payload.json"
  },
  "/games/playstation-2/sly-cooper-and-the-thievius-raccoonus/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"db6-jWsnXMNEcBBBxWZ4AxlruvbS0Ho\"",
    "mtime": "2026-01-08T06:14:09.423Z",
    "size": 3510,
    "path": "../public/games/playstation-2/sly-cooper-and-the-thievius-raccoonus/index.html"
  },
  "/games/playstation-2/sly-cooper-and-the-thievius-raccoonus/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"277-wP2lTDgpaTWNJPUfaJopsL6Q0jg\"",
    "mtime": "2026-01-08T06:14:11.452Z",
    "size": 631,
    "path": "../public/games/playstation-2/sly-cooper-and-the-thievius-raccoonus/_payload.json"
  },
  "/games/playstation-2/sly-3-band-of-thieves/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d58-Gh9ckNJnQ4kLbBXgq9fuNPZobUY\"",
    "mtime": "2026-01-08T06:14:09.390Z",
    "size": 3416,
    "path": "../public/games/playstation-2/sly-3-band-of-thieves/index.html"
  },
  "/games/playstation-2/sly-3-band-of-thieves/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"268-U8hlQnS4DNw86XDyskBR2ZRyOMw\"",
    "mtime": "2026-01-08T06:14:11.452Z",
    "size": 616,
    "path": "../public/games/playstation-2/sly-3-band-of-thieves/_payload.json"
  },
  "/games/playstation-2/soulcalibur-ii/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d2c-Su2hKBT64Pv3/OvhJL+/bMTYsWY\"",
    "mtime": "2026-01-08T06:14:09.535Z",
    "size": 3372,
    "path": "../public/games/playstation-2/soulcalibur-ii/index.html"
  },
  "/games/playstation-2/soulcalibur-ii/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"260-B6uQKNqA2I8ZRlTg3Y0bUPxo9nE\"",
    "mtime": "2026-01-08T06:14:11.483Z",
    "size": 608,
    "path": "../public/games/playstation-2/soulcalibur-ii/_payload.json"
  },
  "/games/playstation-2/soulcalibur-iii/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d32-ENAVtc4qP9nPAui73BVOZyAvyfU\"",
    "mtime": "2026-01-08T06:14:09.458Z",
    "size": 3378,
    "path": "../public/games/playstation-2/soulcalibur-iii/index.html"
  },
  "/games/playstation-2/soulcalibur-iii/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"260-fpwQ1+llFwG7YOe+8DDes9YNv7g\"",
    "mtime": "2026-01-08T06:14:11.452Z",
    "size": 608,
    "path": "../public/games/playstation-2/soulcalibur-iii/_payload.json"
  },
  "/games/playstation-2/star-wars-battlefront/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d56-uByqjsCWj49B3RZMl0VoB3gNc3A\"",
    "mtime": "2026-01-08T06:14:09.526Z",
    "size": 3414,
    "path": "../public/games/playstation-2/star-wars-battlefront/index.html"
  },
  "/games/playstation-2/star-wars-battlefront/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"267-YYW1tDrdIIgvDiizWZjmjkxJIBA\"",
    "mtime": "2026-01-08T06:14:11.483Z",
    "size": 615,
    "path": "../public/games/playstation-2/star-wars-battlefront/_payload.json"
  },
  "/games/playstation-2/star-wars-battlefront-ii/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d68-2i0RaAqsaVe2omQqwKxq1mvDr2U\"",
    "mtime": "2026-01-08T06:14:09.549Z",
    "size": 3432,
    "path": "../public/games/playstation-2/star-wars-battlefront-ii/index.html"
  },
  "/games/playstation-2/star-wars-battlefront-ii/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"26a-5DHVtgxjCdBUB1v8CC0IqZg1+ts\"",
    "mtime": "2026-01-08T06:14:11.483Z",
    "size": 618,
    "path": "../public/games/playstation-2/star-wars-battlefront-ii/_payload.json"
  },
  "/games/playstation-2/suffering-the/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d2f-fzppSFHrZce2A8Wg1JRxiQAn/dw\"",
    "mtime": "2026-01-08T06:14:09.607Z",
    "size": 3375,
    "path": "../public/games/playstation-2/suffering-the/index.html"
  },
  "/games/playstation-2/suffering-the/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"263-rK+lGUd+dJn6C47UlKaJHS8rXIU\"",
    "mtime": "2026-01-08T06:14:11.496Z",
    "size": 611,
    "path": "../public/games/playstation-2/suffering-the/_payload.json"
  },
  "/games/playstation-2/taito-legends/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d7f-4SPS+sEF1PkcVnctWDwgTw381HY\"",
    "mtime": "2026-01-08T06:14:09.757Z",
    "size": 3455,
    "path": "../public/games/playstation-2/taito-legends/index.html"
  },
  "/games/playstation-2/taito-legends/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"287-G8HjdvaJNy5pH8HTLUPxVDx7N8o\"",
    "mtime": "2026-01-08T06:14:11.566Z",
    "size": 647,
    "path": "../public/games/playstation-2/taito-legends/_payload.json"
  },
  "/games/playstation-2/taito-legends-2/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d9c-hljkMSR5+35JGUJV6ksnZm+sc4A\"",
    "mtime": "2026-01-08T06:14:09.756Z",
    "size": 3484,
    "path": "../public/games/playstation-2/taito-legends-2/index.html"
  },
  "/games/playstation-2/taito-legends-2/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"296-WIEG0RZsar7h4vsNKqOCwjvVj1Q\"",
    "mtime": "2026-01-08T06:14:11.548Z",
    "size": 662,
    "path": "../public/games/playstation-2/taito-legends-2/_payload.json"
  },
  "/games/playstation-2/takahashi-meijin-no-b-ken-jima/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d95-1YYux5+kfslfMBpefMXV5kWcCBg\"",
    "mtime": "2026-01-08T06:14:09.757Z",
    "size": 3477,
    "path": "../public/games/playstation-2/takahashi-meijin-no-b-ken-jima/index.html"
  },
  "/games/playstation-2/takahashi-meijin-no-b-ken-jima/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"27a-f+sJp2u69rvSBv8U9qHjfhbn5o8\"",
    "mtime": "2026-01-08T06:14:11.566Z",
    "size": 634,
    "path": "../public/games/playstation-2/takahashi-meijin-no-b-ken-jima/_payload.json"
  },
  "/games/playstation-2/tenchu-fatal-shadows/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d52-Z4ySwOfEHMrSqQCXaKtJt5Dh9iA\"",
    "mtime": "2026-01-08T06:14:09.772Z",
    "size": 3410,
    "path": "../public/games/playstation-2/tenchu-fatal-shadows/index.html"
  },
  "/games/playstation-2/tenchu-fatal-shadows/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"267-y00h/prBuNOpEKaCSV02Wwa2wso\"",
    "mtime": "2026-01-08T06:14:11.566Z",
    "size": 615,
    "path": "../public/games/playstation-2/tenchu-fatal-shadows/_payload.json"
  },
  "/games/playstation-2/tenchu-wrath-of-heaven/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d5e-TxNKv5KDiIuN9F0u9GwTch+h9ts\"",
    "mtime": "2026-01-08T06:14:09.781Z",
    "size": 3422,
    "path": "../public/games/playstation-2/tenchu-wrath-of-heaven/index.html"
  },
  "/games/playstation-2/tenchu-wrath-of-heaven/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"268-twIeHaBs3inknwKSx4gYTclEy7U\"",
    "mtime": "2026-01-08T06:14:11.585Z",
    "size": 616,
    "path": "../public/games/playstation-2/tenchu-wrath-of-heaven/_payload.json"
  },
  "/games/playstation-2/thunder-force-vi/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d38-7R4ItGOBi/2ihFl5HoMUM0ZsxRw\"",
    "mtime": "2026-01-08T06:14:09.860Z",
    "size": 3384,
    "path": "../public/games/playstation-2/thunder-force-vi/index.html"
  },
  "/games/playstation-2/thunder-force-vi/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"262-Aw9mTfpQi8nmk1ireBqmJuir6bI\"",
    "mtime": "2026-01-08T06:14:11.600Z",
    "size": 610,
    "path": "../public/games/playstation-2/thunder-force-vi/_payload.json"
  },
  "/games/playstation-2/timesplitters/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"e3a-uhqdI0/VP3a7cMV9uxFnxWCghGw\"",
    "mtime": "2026-01-08T06:14:09.860Z",
    "size": 3642,
    "path": "../public/games/playstation-2/timesplitters/index.html"
  },
  "/games/playstation-2/timesplitters/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"318-I0dhQEzZ4RgmRXl/Eymg0Di/uHQ\"",
    "mtime": "2026-01-08T06:14:11.600Z",
    "size": 792,
    "path": "../public/games/playstation-2/timesplitters/_payload.json"
  },
  "/games/playstation-2/timesplitters-2/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d38-+8ojwJRd193NgVY1wsecUQY5ujU\"",
    "mtime": "2026-01-08T06:14:09.878Z",
    "size": 3384,
    "path": "../public/games/playstation-2/timesplitters-2/index.html"
  },
  "/games/playstation-2/timesplitters-2/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"26a-haOjAC1taqD0EIWkmdDanInknJg\"",
    "mtime": "2026-01-08T06:14:11.613Z",
    "size": 618,
    "path": "../public/games/playstation-2/timesplitters-2/_payload.json"
  },
  "/games/playstation-2/tony-hawks-pro-skater-3/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d78-zY0ZitGRkdXX4gCsZ+HtB5M9rkI\"",
    "mtime": "2026-01-08T06:14:09.871Z",
    "size": 3448,
    "path": "../public/games/playstation-2/tony-hawks-pro-skater-3/index.html"
  },
  "/games/playstation-2/tony-hawks-pro-skater-3/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"273-htJM1rAEh6JjAp2tuGNna5owM0c\"",
    "mtime": "2026-01-08T06:14:11.600Z",
    "size": 627,
    "path": "../public/games/playstation-2/tony-hawks-pro-skater-3/_payload.json"
  },
  "/games/playstation-2/valkyrie-profile-2-silmeria/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d82-ItpDP8W9maFj6aD8zrZR9UceyAA\"",
    "mtime": "2026-01-08T06:14:09.936Z",
    "size": 3458,
    "path": "../public/games/playstation-2/valkyrie-profile-2-silmeria/index.html"
  },
  "/games/playstation-2/valkyrie-profile-2-silmeria/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"271-aFjke9BO9u3SBk7FD19HwfExjK0\"",
    "mtime": "2026-01-08T06:14:11.632Z",
    "size": 625,
    "path": "../public/games/playstation-2/valkyrie-profile-2-silmeria/_payload.json"
  },
  "/games/playstation-2/we-love-katamari/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d38-xdN60RhlZ1VJOOZzDUOzY95TS0Y\"",
    "mtime": "2026-01-08T06:14:10.001Z",
    "size": 3384,
    "path": "../public/games/playstation-2/we-love-katamari/index.html"
  },
  "/games/playstation-2/we-love-katamari/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"262-1RtOfmQl/K3zYEn4pDlIiewtbzA\"",
    "mtime": "2026-01-08T06:14:11.675Z",
    "size": 610,
    "path": "../public/games/playstation-2/we-love-katamari/_payload.json"
  },
  "/games/playstation-2/wild-arms-3/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d20-UAuYXQiKmPMyrLc9ZIIXW3b166k\"",
    "mtime": "2026-01-08T06:14:09.959Z",
    "size": 3360,
    "path": "../public/games/playstation-2/wild-arms-3/index.html"
  },
  "/games/playstation-2/wild-arms-3/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25f-ZqCTpgrtWMByX4cfrAjFbikTNcg\"",
    "mtime": "2026-01-08T06:14:11.652Z",
    "size": 607,
    "path": "../public/games/playstation-2/wild-arms-3/_payload.json"
  },
  "/games/playstation-2/wild-arms-alter-code-f/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d64-6d9MeFWibET4pvg+Hy0swZ7NrZs\"",
    "mtime": "2026-01-08T06:14:09.959Z",
    "size": 3428,
    "path": "../public/games/playstation-2/wild-arms-alter-code-f/index.html"
  },
  "/games/playstation-2/wild-arms-alter-code-f/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"26c-akkfEn0ialv1jBgqpT83Rl3SSW0\"",
    "mtime": "2026-01-08T06:14:11.652Z",
    "size": 620,
    "path": "../public/games/playstation-2/wild-arms-alter-code-f/_payload.json"
  },
  "/games/playstation-2/xenosaga/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d0e-2Uus4OB8dxWVC1O16dkvPJIYn3I\"",
    "mtime": "2026-01-08T06:14:09.959Z",
    "size": 3342,
    "path": "../public/games/playstation-2/xenosaga/index.html"
  },
  "/games/playstation-2/xenosaga/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25d-VYBAu9biEjz6qjJP7GbItduK8pc\"",
    "mtime": "2026-01-08T06:14:11.652Z",
    "size": 605,
    "path": "../public/games/playstation-2/xenosaga/_payload.json"
  },
  "/games/playstation-2/xenosaga-ii/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d20-CCuVkG7LLKJUCbYSWSNCg/+oAWo\"",
    "mtime": "2026-01-08T06:14:10.001Z",
    "size": 3360,
    "path": "../public/games/playstation-2/xenosaga-ii/index.html"
  },
  "/games/playstation-2/xenosaga-ii/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"260-MrjDbZ+CRY7C3gi0UEiJGvbzuNg\"",
    "mtime": "2026-01-08T06:14:11.675Z",
    "size": 608,
    "path": "../public/games/playstation-2/xenosaga-ii/_payload.json"
  },
  "/games/playstation-2/ys-the-ark-of-napishtim/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d6a-lF3zQMIlCsn5ftC5EcK5Yxvm28E\"",
    "mtime": "2026-01-08T06:14:10.026Z",
    "size": 3434,
    "path": "../public/games/playstation-2/ys-the-ark-of-napishtim/index.html"
  },
  "/games/playstation-2/ys-the-ark-of-napishtim/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"273-G5aBrUN9l8BugnrsKe8ZJ3+xhHk\"",
    "mtime": "2026-01-08T06:14:11.698Z",
    "size": 627,
    "path": "../public/games/playstation-2/ys-the-ark-of-napishtim/_payload.json"
  },
  "/games/playstation-3/army-of-two/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"edf-xZIul1flboOMzyqFqS1981/ZwHM\"",
    "mtime": "2026-01-08T06:14:06.940Z",
    "size": 3807,
    "path": "../public/games/playstation-3/army-of-two/index.html"
  },
  "/games/playstation-3/army-of-two/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"362-kAEthPdmem+EpASYy3Wg1OX+s8c\"",
    "mtime": "2026-01-08T06:14:10.496Z",
    "size": 866,
    "path": "../public/games/playstation-3/army-of-two/_payload.json"
  },
  "/games/playstation-3/assassins-creed/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d48-hbnMLVlHVKHimhiYpJEVt4RUR80\"",
    "mtime": "2026-01-08T06:14:06.940Z",
    "size": 3400,
    "path": "../public/games/playstation-3/assassins-creed/index.html"
  },
  "/games/playstation-3/assassins-creed/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"265-ugYNQqyexI5fA4XmxLOuT9jG7PA\"",
    "mtime": "2026-01-08T06:14:10.521Z",
    "size": 613,
    "path": "../public/games/playstation-3/assassins-creed/_payload.json"
  },
  "/games/playstation-3/assassins-creed-brotherhood/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"dda-Qtnr5VEhFXwet3xpBp8AQDa3wZ8\"",
    "mtime": "2026-01-08T06:14:06.977Z",
    "size": 3546,
    "path": "../public/games/playstation-3/assassins-creed-brotherhood/index.html"
  },
  "/games/playstation-3/assassins-creed-brotherhood/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"285-66BRKEX1sElEcCrq/5aIaIVGC88\"",
    "mtime": "2026-01-08T06:14:10.538Z",
    "size": 645,
    "path": "../public/games/playstation-3/assassins-creed-brotherhood/_payload.json"
  },
  "/games/playstation-3/assassins-creed-ii/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"da8-ESD1XXPn5ony0EbFAEGX5Zw+qjc\"",
    "mtime": "2026-01-08T06:14:06.979Z",
    "size": 3496,
    "path": "../public/games/playstation-3/assassins-creed-ii/index.html"
  },
  "/games/playstation-3/assassins-creed-ii/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"27f-f9tZC+w7y2+1oI+KoU9oj9i2HaE\"",
    "mtime": "2026-01-08T06:14:10.554Z",
    "size": 639,
    "path": "../public/games/playstation-3/assassins-creed-ii/_payload.json"
  },
  "/games/playstation-3/assassins-creed-revelations/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"dda-bJ4jXgMxJJXuSQtu+4ZJCkrtgiI\"",
    "mtime": "2026-01-08T06:14:06.977Z",
    "size": 3546,
    "path": "../public/games/playstation-3/assassins-creed-revelations/index.html"
  },
  "/games/playstation-3/assassins-creed-revelations/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"286-pR4LCHJAKKJvN3Dl+WAKSdGw9vY\"",
    "mtime": "2026-01-08T06:14:10.538Z",
    "size": 646,
    "path": "../public/games/playstation-3/assassins-creed-revelations/_payload.json"
  },
  "/games/playstation-3/batman-arkham-asylum/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"da6-SK0KCsoRGQDYaJJf/aoiWZRJHEs\"",
    "mtime": "2026-01-08T06:14:06.940Z",
    "size": 3494,
    "path": "../public/games/playstation-3/batman-arkham-asylum/index.html"
  },
  "/games/playstation-3/batman-arkham-asylum/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"281-8u+Eh1/i5Dw0UKi6tRFnqxquVII\"",
    "mtime": "2026-01-08T06:14:10.496Z",
    "size": 641,
    "path": "../public/games/playstation-3/batman-arkham-asylum/_payload.json"
  },
  "/games/playstation-3/batman-arkham-city/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d94-l+S7lHhlCJLPaTZwwNDs/iJUmaE\"",
    "mtime": "2026-01-08T06:14:06.978Z",
    "size": 3476,
    "path": "../public/games/playstation-3/batman-arkham-city/index.html"
  },
  "/games/playstation-3/batman-arkham-city/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"282-IolDX1Co8CNskossMCVIzN/2BIg\"",
    "mtime": "2026-01-08T06:14:10.554Z",
    "size": 642,
    "path": "../public/games/playstation-3/batman-arkham-city/_payload.json"
  },
  "/games/playstation-3/call-of-duty-4-modern-warfare/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"dd5-i69/3VRH9A3GZ8JFbxmwcw+FFec\"",
    "mtime": "2026-01-08T06:14:06.947Z",
    "size": 3541,
    "path": "../public/games/playstation-3/call-of-duty-4-modern-warfare/index.html"
  },
  "/games/playstation-3/call-of-duty-4-modern-warfare/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"28c-D3BjkwfBcL9xWOjHbv71tETjUOU\"",
    "mtime": "2026-01-08T06:14:10.521Z",
    "size": 652,
    "path": "../public/games/playstation-3/call-of-duty-4-modern-warfare/_payload.json"
  },
  "/games/playstation-3/call-of-duty-black-ops-ii/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d76-HN7exI0MJTorKkQ9Nh/HALe1sPc\"",
    "mtime": "2026-01-08T06:14:07.021Z",
    "size": 3446,
    "path": "../public/games/playstation-3/call-of-duty-black-ops-ii/index.html"
  },
  "/games/playstation-3/call-of-duty-black-ops-ii/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"275-i/HyxbEcaZGyFuIEDs1V67TE5jI\"",
    "mtime": "2026-01-08T06:14:10.569Z",
    "size": 629,
    "path": "../public/games/playstation-3/call-of-duty-black-ops-ii/_payload.json"
  },
  "/games/playstation-3/call-of-duty-black-ops/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"dac-pyQKK+3ZNTx4OJ2ymWVP9bABsEo\"",
    "mtime": "2026-01-08T06:14:06.979Z",
    "size": 3500,
    "path": "../public/games/playstation-3/call-of-duty-black-ops/index.html"
  },
  "/games/playstation-3/call-of-duty-black-ops/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"286-xMzR8uX+Q7k/dRh59tscBRF4uEo\"",
    "mtime": "2026-01-08T06:14:10.554Z",
    "size": 646,
    "path": "../public/games/playstation-3/call-of-duty-black-ops/_payload.json"
  },
  "/games/playstation-3/call-of-duty-ghosts/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d4c-W6BisyT06HV+fKFdlnVmyIUKy3g\"",
    "mtime": "2026-01-08T06:14:06.993Z",
    "size": 3404,
    "path": "../public/games/playstation-3/call-of-duty-ghosts/index.html"
  },
  "/games/playstation-3/call-of-duty-ghosts/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"26c-Cyj8QMbfIxNpfGia7yNslyJ6fKg\"",
    "mtime": "2026-01-08T06:14:10.554Z",
    "size": 620,
    "path": "../public/games/playstation-3/call-of-duty-ghosts/_payload.json"
  },
  "/games/playstation-3/call-of-duty-modern-warfare-2/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"ddc-fzK1Stt0t3aVdRoZ/ZvvhUM8URU\"",
    "mtime": "2026-01-08T06:14:06.940Z",
    "size": 3548,
    "path": "../public/games/playstation-3/call-of-duty-modern-warfare-2/index.html"
  },
  "/games/playstation-3/call-of-duty-modern-warfare-2/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"290-oeuHXS6KgyuBaB1DKCGh2ov7Onw\"",
    "mtime": "2026-01-08T06:14:10.482Z",
    "size": 656,
    "path": "../public/games/playstation-3/call-of-duty-modern-warfare-2/_payload.json"
  },
  "/games/playstation-3/call-of-duty-world-at-war/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"dc4-Lt45grbmGOFT64g/VFU7fSUF9bM\"",
    "mtime": "2026-01-08T06:14:06.978Z",
    "size": 3524,
    "path": "../public/games/playstation-3/call-of-duty-world-at-war/index.html"
  },
  "/games/playstation-3/call-of-duty-world-at-war/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"28c-70jF4M1IlXbk7N2Q9tzML5XNlQo\"",
    "mtime": "2026-01-08T06:14:10.554Z",
    "size": 652,
    "path": "../public/games/playstation-3/call-of-duty-world-at-war/_payload.json"
  },
  "/games/playstation-3/call-of-duty-modern-warfare-3/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"ddc-hlUq1d5dMTHMlx9ozEJM33TLezI\"",
    "mtime": "2026-01-08T06:14:06.977Z",
    "size": 3548,
    "path": "../public/games/playstation-3/call-of-duty-modern-warfare-3/index.html"
  },
  "/games/playstation-3/call-of-duty-modern-warfare-3/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"290-bLbLVy+SvIiiHJjUmBzpQA7vNZQ\"",
    "mtime": "2026-01-08T06:14:10.534Z",
    "size": 656,
    "path": "../public/games/playstation-3/call-of-duty-modern-warfare-3/_payload.json"
  },
  "/games/playstation-3/catherine/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d0e-riSg9DWIAHQdopQUe60vN9BNup4\"",
    "mtime": "2026-01-08T06:14:07.011Z",
    "size": 3342,
    "path": "../public/games/playstation-3/catherine/index.html"
  },
  "/games/playstation-3/catherine/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25b-rZPLSUms4dFc8PWIPEG7VPscQso\"",
    "mtime": "2026-01-08T06:14:10.554Z",
    "size": 603,
    "path": "../public/games/playstation-3/catherine/_payload.json"
  },
  "/games/playstation-3/dantes-inferno/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d9d-fXZbmDK8Jx7e9n9lR4UYDMo9rSg\"",
    "mtime": "2026-01-08T06:14:07.522Z",
    "size": 3485,
    "path": "../public/games/playstation-3/dantes-inferno/index.html"
  },
  "/games/playstation-3/dantes-inferno/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"288-Q8p81H+hcACoVCY4IHdNko5efZ0\"",
    "mtime": "2026-01-08T06:14:10.698Z",
    "size": 648,
    "path": "../public/games/playstation-3/dantes-inferno/_payload.json"
  },
  "/games/playstation-3/dead-space/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"ed7-gmbTto0VApEWCDweVeWyrRAgo7M\"",
    "mtime": "2026-01-08T06:14:07.271Z",
    "size": 3799,
    "path": "../public/games/playstation-3/dead-space/index.html"
  },
  "/games/playstation-3/dead-space/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"3c9-GChknEoCb7eR/5pTLr6+FkDUY0w\"",
    "mtime": "2026-01-08T06:14:10.648Z",
    "size": 969,
    "path": "../public/games/playstation-3/dead-space/_payload.json"
  },
  "/games/playstation-3/dead-space-2/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d20-jtCSWl+dEB9ox+sXznZ+J7tbysc\"",
    "mtime": "2026-01-08T06:14:07.250Z",
    "size": 3360,
    "path": "../public/games/playstation-3/dead-space-2/index.html"
  },
  "/games/playstation-3/dead-space-2/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25e-h/fp1UDN4tG07MT+3+mwizWQrMU\"",
    "mtime": "2026-01-08T06:14:10.624Z",
    "size": 606,
    "path": "../public/games/playstation-3/dead-space-2/_payload.json"
  },
  "/games/playstation-3/deadly-premonition/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d4a-IYslTGGBzTeit0j9N2GbuB7sq6g\"",
    "mtime": "2026-01-08T06:14:07.250Z",
    "size": 3402,
    "path": "../public/games/playstation-3/deadly-premonition/index.html"
  },
  "/games/playstation-3/deadly-premonition/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"266-LM6DLh+SUUKEVMU8438OGq+6bTE\"",
    "mtime": "2026-01-08T06:14:10.624Z",
    "size": 614,
    "path": "../public/games/playstation-3/deadly-premonition/_payload.json"
  },
  "/games/playstation-3/demons-souls/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d82-MGfcU5VK06x07yLxkYdRmFmy/mU\"",
    "mtime": "2026-01-08T06:14:07.271Z",
    "size": 3458,
    "path": "../public/games/playstation-3/demons-souls/index.html"
  },
  "/games/playstation-3/demons-souls/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"277-eL0LXQqjaNgUpsUVOGH15EDUXa0\"",
    "mtime": "2026-01-08T06:14:10.660Z",
    "size": 631,
    "path": "../public/games/playstation-3/demons-souls/_payload.json"
  },
  "/games/playstation-3/disgaea-3-absence-of-justice/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d88-9fYW0ljiZgcwgigGi+SjwlwZVYo\"",
    "mtime": "2026-01-08T06:14:07.418Z",
    "size": 3464,
    "path": "../public/games/playstation-3/disgaea-3-absence-of-justice/index.html"
  },
  "/games/playstation-3/disgaea-3-absence-of-justice/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"272-kHsAG5ziKJS5RMS53l7eo3BXmow\"",
    "mtime": "2026-01-08T06:14:10.683Z",
    "size": 626,
    "path": "../public/games/playstation-3/disgaea-3-absence-of-justice/_payload.json"
  },
  "/games/playstation-3/demons-souls-jp/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d8b-3Opgc5nXTpvoIzw7zHV19VragnM\"",
    "mtime": "2026-01-08T06:14:07.271Z",
    "size": 3467,
    "path": "../public/games/playstation-3/demons-souls-jp/index.html"
  },
  "/games/playstation-3/demons-souls-jp/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"277-oYgff8kuGgqQaX+w5PfsDfqkhyQ\"",
    "mtime": "2026-01-08T06:14:10.648Z",
    "size": 631,
    "path": "../public/games/playstation-3/demons-souls-jp/_payload.json"
  },
  "/games/playstation-3/disgaea-4-a-promise-forgotten/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d8e-bGTWzwNUTNs8+Oc5NJMWmJvDL5s\"",
    "mtime": "2026-01-08T06:14:07.393Z",
    "size": 3470,
    "path": "../public/games/playstation-3/disgaea-4-a-promise-forgotten/index.html"
  },
  "/games/playstation-3/disgaea-4-a-promise-forgotten/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"273-CnmM370fvmRRuMNvy6dN/K/tyzY\"",
    "mtime": "2026-01-08T06:14:10.664Z",
    "size": 627,
    "path": "../public/games/playstation-3/disgaea-4-a-promise-forgotten/_payload.json"
  },
  "/games/playstation-3/dragon-age-ii/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d74-EmKF+FTyxeztd6eas0iuQrZYSjo\"",
    "mtime": "2026-01-08T06:14:07.531Z",
    "size": 3444,
    "path": "../public/games/playstation-3/dragon-age-ii/index.html"
  },
  "/games/playstation-3/dragon-age-ii/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"27c-psx3MkiSFW7xBzmIsSh6Soq/q1g\"",
    "mtime": "2026-01-08T06:14:10.754Z",
    "size": 636,
    "path": "../public/games/playstation-3/dragon-age-ii/_payload.json"
  },
  "/games/playstation-3/dragon-age-origins/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d9a-/UN5MQrU24lMElkSNJUWqH1iBe8\"",
    "mtime": "2026-01-08T06:14:07.522Z",
    "size": 3482,
    "path": "../public/games/playstation-3/dragon-age-origins/index.html"
  },
  "/games/playstation-3/dragon-age-origins/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"285-SfvR7YzkJWGpl6T7jWT0qIBDMgU\"",
    "mtime": "2026-01-08T06:14:10.698Z",
    "size": 645,
    "path": "../public/games/playstation-3/dragon-age-origins/_payload.json"
  },
  "/games/playstation-3/fear-2-project-origin/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d64-EhLkhG3yXGZ4Oqspjpaqu8wZzkk\"",
    "mtime": "2026-01-08T06:14:07.531Z",
    "size": 3428,
    "path": "../public/games/playstation-3/fear-2-project-origin/index.html"
  },
  "/games/playstation-3/fear-2-project-origin/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"26c-ldfbEGnV0byKMWm0DDpmH1nFfkc\"",
    "mtime": "2026-01-08T06:14:10.754Z",
    "size": 620,
    "path": "../public/games/playstation-3/fear-2-project-origin/_payload.json"
  },
  "/games/playstation-3/fear-first-encounter-assault-recon/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"db2-p6tHyJMkfEAsi4tKc1xYDhjG8Do\"",
    "mtime": "2026-01-08T06:14:07.591Z",
    "size": 3506,
    "path": "../public/games/playstation-3/fear-first-encounter-assault-recon/index.html"
  },
  "/games/playstation-3/fear-first-encounter-assault-recon/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"279-8m8cYbnaY1q16oB7XXQxxoE/Jp4\"",
    "mtime": "2026-01-08T06:14:10.764Z",
    "size": 633,
    "path": "../public/games/playstation-3/fear-first-encounter-assault-recon/_payload.json"
  },
  "/games/playstation-3/final-fantasy-xiii/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d44-Ngu3slQeSssdnEYbhP9RYZbXI2M\"",
    "mtime": "2026-01-08T06:14:07.798Z",
    "size": 3396,
    "path": "../public/games/playstation-3/final-fantasy-xiii/index.html"
  },
  "/games/playstation-3/final-fantasy-xiii/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"264-+Fp4FW5kN6eXm1Bw0ld5eZY+AZE\"",
    "mtime": "2026-01-08T06:14:10.835Z",
    "size": 612,
    "path": "../public/games/playstation-3/final-fantasy-xiii/_payload.json"
  },
  "/games/playstation-3/final-fantasy-xiii-2/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d56-rDwPkMXNzYyUqdAAiXht4HvKmlk\"",
    "mtime": "2026-01-08T06:14:07.807Z",
    "size": 3414,
    "path": "../public/games/playstation-3/final-fantasy-xiii-2/index.html"
  },
  "/games/playstation-3/final-fantasy-xiii-2/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"269-mw0yFQ9jwvUtzz/WwmOauL6kvQs\"",
    "mtime": "2026-01-08T06:14:10.854Z",
    "size": 617,
    "path": "../public/games/playstation-3/final-fantasy-xiii-2/_payload.json"
  },
  "/games/playstation-3/final-fantasy-xiv-a-realm-reborn/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"e08-NuAxFM3QdPlu7pJO6s6LWjxA/e8\"",
    "mtime": "2026-01-08T06:14:07.807Z",
    "size": 3592,
    "path": "../public/games/playstation-3/final-fantasy-xiv-a-realm-reborn/index.html"
  },
  "/games/playstation-3/final-fantasy-xiv-a-realm-reborn/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"2a7-IrgaM3xat1dhcXePvAuLjeBjBd0\"",
    "mtime": "2026-01-08T06:14:10.835Z",
    "size": 679,
    "path": "../public/games/playstation-3/final-fantasy-xiv-a-realm-reborn/_payload.json"
  },
  "/games/playstation-3/god-of-war-ascension/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"da6-+AANv5K6V3mbbn0mfVNzopxBzio\"",
    "mtime": "2026-01-08T06:14:08.063Z",
    "size": 3494,
    "path": "../public/games/playstation-3/god-of-war-ascension/index.html"
  },
  "/games/playstation-3/god-of-war-ascension/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"281-HQe/fJ5YfOQsc8Ll58nCwmwcm5Q\"",
    "mtime": "2026-01-08T06:14:10.885Z",
    "size": 641,
    "path": "../public/games/playstation-3/god-of-war-ascension/_payload.json"
  },
  "/games/playstation-3/god-of-war-iii/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d7a-qH1+elrz/qxkpZjYEsmxvbSe1d0\"",
    "mtime": "2026-01-08T06:14:08.063Z",
    "size": 3450,
    "path": "../public/games/playstation-3/god-of-war-iii/index.html"
  },
  "/games/playstation-3/god-of-war-iii/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"277-fvM9R0972r5ax0g7ZhgzD74YmXI\"",
    "mtime": "2026-01-08T06:14:10.902Z",
    "size": 631,
    "path": "../public/games/playstation-3/god-of-war-iii/_payload.json"
  },
  "/games/playstation-3/heavy-rain/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d69-UBLGbgHzq192CvizK1lTWUlqcyU\"",
    "mtime": "2026-01-08T06:14:08.081Z",
    "size": 3433,
    "path": "../public/games/playstation-3/heavy-rain/index.html"
  },
  "/games/playstation-3/heavy-rain/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"280-ui4yt10Kf/BizLU+x1FYwqEUduE\"",
    "mtime": "2026-01-08T06:14:10.922Z",
    "size": 640,
    "path": "../public/games/playstation-3/heavy-rain/_payload.json"
  },
  "/games/playstation-3/hitman-absolution/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d94-RIFPPFOG/045mTY/FjjiSUgzVLo\"",
    "mtime": "2026-01-08T06:14:08.081Z",
    "size": 3476,
    "path": "../public/games/playstation-3/hitman-absolution/index.html"
  },
  "/games/playstation-3/hitman-absolution/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"283-Mf4vD0MOf0M08X47HAUy2ziogPY\"",
    "mtime": "2026-01-08T06:14:10.922Z",
    "size": 643,
    "path": "../public/games/playstation-3/hitman-absolution/_payload.json"
  },
  "/games/playstation-3/house-of-the-dead-overkill-extended-cut/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"dc4-vP8GTPeWrXAwCl1yYyYO/AtaVqk\"",
    "mtime": "2026-01-08T06:14:08.081Z",
    "size": 3524,
    "path": "../public/games/playstation-3/house-of-the-dead-overkill-extended-cut/index.html"
  },
  "/games/playstation-3/house-of-the-dead-overkill-extended-cut/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"27a-vz2LfupW1u2kuRNe+HZRJlbNWBU\"",
    "mtime": "2026-01-08T06:14:10.922Z",
    "size": 634,
    "path": "../public/games/playstation-3/house-of-the-dead-overkill-extended-cut/_payload.json"
  },
  "/games/playstation-3/katamari-forever/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d38-H1YmXqaZZeHaAHVQSWaJmz4MhSk\"",
    "mtime": "2026-01-08T06:14:08.309Z",
    "size": 3384,
    "path": "../public/games/playstation-3/katamari-forever/index.html"
  },
  "/games/playstation-3/katamari-forever/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"262-zFIXJRe4A1YS3PhJ/EV+347tvbU\"",
    "mtime": "2026-01-08T06:14:10.980Z",
    "size": 610,
    "path": "../public/games/playstation-3/katamari-forever/_payload.json"
  },
  "/games/playstation-3/killzone-2/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d97-0HKluhKdPgsanytvQAcl+XsY0wY\"",
    "mtime": "2026-01-08T06:14:08.322Z",
    "size": 3479,
    "path": "../public/games/playstation-3/killzone-2/index.html"
  },
  "/games/playstation-3/killzone-2/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"2a5-xfjfNSaLzAZ60Qe/+SX7FiHn9X0\"",
    "mtime": "2026-01-08T06:14:10.996Z",
    "size": 677,
    "path": "../public/games/playstation-3/killzone-2/_payload.json"
  },
  "/games/playstation-3/killzone-3/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d97-nLDqDv2n3rlHX48pXJw2ssuYwHQ\"",
    "mtime": "2026-01-08T06:14:08.318Z",
    "size": 3479,
    "path": "../public/games/playstation-3/killzone-3/index.html"
  },
  "/games/playstation-3/killzone-3/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"2ab-c7reI/cJJLFVkvk5Ra3GwQaXzmY\"",
    "mtime": "2026-01-08T06:14:10.996Z",
    "size": 683,
    "path": "../public/games/playstation-3/killzone-3/_payload.json"
  },
  "/games/playstation-3/littlebigplanet/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d32-pUIBDeLeBQ0q/bI7lGB1tGQZJhM\"",
    "mtime": "2026-01-08T06:14:08.608Z",
    "size": 3378,
    "path": "../public/games/playstation-3/littlebigplanet/index.html"
  },
  "/games/playstation-3/littlebigplanet/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"261-wa1weSAo7Y0YIQG6OgbvGUc98pw\"",
    "mtime": "2026-01-08T06:14:11.092Z",
    "size": 609,
    "path": "../public/games/playstation-3/littlebigplanet/_payload.json"
  },
  "/games/playstation-3/lightning-returns-final-fantasy-xiii/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"db8-oKatHePR9pgECZd3oP0urJ1d01w\"",
    "mtime": "2026-01-08T06:14:08.502Z",
    "size": 3512,
    "path": "../public/games/playstation-3/lightning-returns-final-fantasy-xiii/index.html"
  },
  "/games/playstation-3/lightning-returns-final-fantasy-xiii/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"27a-82ACCC33tbEeeJvu4g51+jaRjBs\"",
    "mtime": "2026-01-08T06:14:11.077Z",
    "size": 634,
    "path": "../public/games/playstation-3/lightning-returns-final-fantasy-xiii/_payload.json"
  },
  "/games/playstation-3/max-payne-3/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d7b-hs6v74xSzoc5K+gYe72NYEPOPlo\"",
    "mtime": "2026-01-08T06:14:08.608Z",
    "size": 3451,
    "path": "../public/games/playstation-3/max-payne-3/index.html"
  },
  "/games/playstation-3/max-payne-3/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"28a-39m/LakK/FSvFRoo2ZSGghpsHg8\"",
    "mtime": "2026-01-08T06:14:11.107Z",
    "size": 650,
    "path": "../public/games/playstation-3/max-payne-3/_payload.json"
  },
  "/games/playstation-3/metal-gear-rising-revengeance/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d8e-VbFhRoBWbkV8Memsd6oUtUXNmR4\"",
    "mtime": "2026-01-08T06:14:08.608Z",
    "size": 3470,
    "path": "../public/games/playstation-3/metal-gear-rising-revengeance/index.html"
  },
  "/games/playstation-3/metal-gear-rising-revengeance/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"272-oC5ZEs4mG9tTXZIyCSI5O5XKMeA\"",
    "mtime": "2026-01-08T06:14:11.107Z",
    "size": 626,
    "path": "../public/games/playstation-3/metal-gear-rising-revengeance/_payload.json"
  },
  "/games/playstation-3/metal-gear-solid-hd-collection-ps3/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d9e-TYMXqvGKDnjHZJeScVdK7TEj77g\"",
    "mtime": "2026-01-08T06:14:08.621Z",
    "size": 3486,
    "path": "../public/games/playstation-3/metal-gear-solid-hd-collection-ps3/index.html"
  },
  "/games/playstation-3/metal-gear-solid-hd-collection-ps3/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"273-3/nJmF3uy2Ply2zdAYZycWoziz0\"",
    "mtime": "2026-01-08T06:14:11.156Z",
    "size": 627,
    "path": "../public/games/playstation-3/metal-gear-solid-hd-collection-ps3/_payload.json"
  },
  "/games/playstation-3/metal-gear-solid-the-legacy-collection/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"dc4-rvbGlATypy7Zjq11ZZgd0AizSyE\"",
    "mtime": "2026-01-08T06:14:08.725Z",
    "size": 3524,
    "path": "../public/games/playstation-3/metal-gear-solid-the-legacy-collection/index.html"
  },
  "/games/playstation-3/metal-gear-solid-the-legacy-collection/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"27c-phCp+gImnDT4XWxyzW1ypBTrJZ0\"",
    "mtime": "2026-01-08T06:14:11.153Z",
    "size": 636,
    "path": "../public/games/playstation-3/metal-gear-solid-the-legacy-collection/_payload.json"
  },
  "/games/playstation-3/ratchet-and-clank-future-tools-of-destruction/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"df4-cloSEKcHrjwpaxCeoSKF2y2Wf3s\"",
    "mtime": "2026-01-08T06:14:09.127Z",
    "size": 3572,
    "path": "../public/games/playstation-3/ratchet-and-clank-future-tools-of-destruction/index.html"
  },
  "/games/playstation-3/ratchet-and-clank-future-tools-of-destruction/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"281-nDOX+BjOhJD5vwIX5Jrs1wibuak\"",
    "mtime": "2026-01-08T06:14:11.320Z",
    "size": 641,
    "path": "../public/games/playstation-3/ratchet-and-clank-future-tools-of-destruction/_payload.json"
  },
  "/games/playstation-3/resistance-2/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d81-WHnNz/GujGCr46SUE2k5REuIdTA\"",
    "mtime": "2026-01-08T06:14:09.197Z",
    "size": 3457,
    "path": "../public/games/playstation-3/resistance-2/index.html"
  },
  "/games/playstation-3/resistance-2/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"285-j/dpIsc6iHqvLlOgxbTmx+jHf9E\"",
    "mtime": "2026-01-08T06:14:11.364Z",
    "size": 645,
    "path": "../public/games/playstation-3/resistance-2/_payload.json"
  },
  "/games/playstation-3/resistance-fall-of-man/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"dba-BP/SwjvXdnzZttvmlM8IvtGO2rg\"",
    "mtime": "2026-01-08T06:14:09.231Z",
    "size": 3514,
    "path": "../public/games/playstation-3/resistance-fall-of-man/index.html"
  },
  "/games/playstation-3/resistance-fall-of-man/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"28e-vPdECj8Vc4CB7ls7CHLeZcb4naw\"",
    "mtime": "2026-01-08T06:14:11.364Z",
    "size": 654,
    "path": "../public/games/playstation-3/resistance-fall-of-man/_payload.json"
  },
  "/games/playstation-3/resonance-of-fate/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d3e-5Dy1b9hh9pRGJ/Kpx5NhPRWPGcA\"",
    "mtime": "2026-01-08T06:14:09.249Z",
    "size": 3390,
    "path": "../public/games/playstation-3/resonance-of-fate/index.html"
  },
  "/games/playstation-3/resonance-of-fate/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"263-vukiczmI5ZuGThf3CimGj6y4otQ\"",
    "mtime": "2026-01-08T06:14:11.382Z",
    "size": 611,
    "path": "../public/games/playstation-3/resonance-of-fate/_payload.json"
  },
  "/games/playstation-3/silent-hill-homecoming/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"dba-hlTOix9XQLQ4130nvUKySkrhbSA\"",
    "mtime": "2026-01-08T06:14:09.381Z",
    "size": 3514,
    "path": "../public/games/playstation-3/silent-hill-homecoming/index.html"
  },
  "/games/playstation-3/silent-hill-homecoming/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"28e-dIwWqk+WN7diGykM5RkiG1oqhXI\"",
    "mtime": "2026-01-08T06:14:11.433Z",
    "size": 654,
    "path": "../public/games/playstation-3/silent-hill-homecoming/_payload.json"
  },
  "/games/playstation-3/silent-hill-downpour/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d58-XGw6dIFrf/Bho2XpXa6dDZqRkD4\"",
    "mtime": "2026-01-08T06:14:09.381Z",
    "size": 3416,
    "path": "../public/games/playstation-3/silent-hill-downpour/index.html"
  },
  "/games/playstation-3/silent-hill-downpour/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"26a-ftjdoD0HizqtcLCzDCP14U160qQ\"",
    "mtime": "2026-01-08T06:14:11.413Z",
    "size": 618,
    "path": "../public/games/playstation-3/silent-hill-downpour/_payload.json"
  },
  "/games/playstation-3/south-park-the-stick-of-truth/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d88-4EEQdDEwiKgsby1J8xaHYaYOMBI\"",
    "mtime": "2026-01-08T06:14:09.477Z",
    "size": 3464,
    "path": "../public/games/playstation-3/south-park-the-stick-of-truth/index.html"
  },
  "/games/playstation-3/south-park-the-stick-of-truth/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"270-wCfB0naxMdjDxqHSZPm/Dxp9Jt8\"",
    "mtime": "2026-01-08T06:14:11.467Z",
    "size": 624,
    "path": "../public/games/playstation-3/south-park-the-stick-of-truth/_payload.json"
  },
  "/games/playstation-3/valkyria-chrolicles/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d50-Y2+ati833e6Nz4pAw3uO2Iv70Ak\"",
    "mtime": "2026-01-08T06:14:09.913Z",
    "size": 3408,
    "path": "../public/games/playstation-3/valkyria-chrolicles/index.html"
  },
  "/games/playstation-3/valkyria-chrolicles/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"26e-R8EgJRuXqySv5p3QU/wLcP5bpG0\"",
    "mtime": "2026-01-08T06:14:11.632Z",
    "size": 622,
    "path": "../public/games/playstation-3/valkyria-chrolicles/_payload.json"
  },
  "/games/playstation-4/bloodborne-goty/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"da8-BwEu9itrg4nXlwl/N3paEWkZLIE\"",
    "mtime": "2026-01-08T06:14:06.977Z",
    "size": 3496,
    "path": "../public/games/playstation-4/bloodborne-goty/index.html"
  },
  "/games/playstation-4/bloodborne-goty/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"29d-+aBoLnGxQjxwRMOueXZLgNTSPzA\"",
    "mtime": "2026-01-08T06:14:10.554Z",
    "size": 669,
    "path": "../public/games/playstation-4/bloodborne-goty/_payload.json"
  },
  "/games/playstation-4/cladun-returns-this-is-sengoku/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d91-VcrDl52O09xbEgICPnDKlvaB2o4\"",
    "mtime": "2026-01-08T06:14:07.105Z",
    "size": 3473,
    "path": "../public/games/playstation-4/cladun-returns-this-is-sengoku/index.html"
  },
  "/games/playstation-4/cladun-returns-this-is-sengoku/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"272-/UN/+4cp6dco6E3ij/jMgvVOs58\"",
    "mtime": "2026-01-08T06:14:10.569Z",
    "size": 626,
    "path": "../public/games/playstation-4/cladun-returns-this-is-sengoku/_payload.json"
  },
  "/games/playstation-4/danganronpa-1-2-reload/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d62-3YaCIoDY8vmwlV6JpNKsZuKKGgg\"",
    "mtime": "2026-01-08T06:14:07.250Z",
    "size": 3426,
    "path": "../public/games/playstation-4/danganronpa-1-2-reload/index.html"
  },
  "/games/playstation-4/danganronpa-1-2-reload/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"26b-LoLOBd7Csdb89uahzzJkJAOlDD8\"",
    "mtime": "2026-01-08T06:14:10.602Z",
    "size": 619,
    "path": "../public/games/playstation-4/danganronpa-1-2-reload/_payload.json"
  },
  "/games/playstation-4/dark-picture-anthologies-little-hope/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"e08-VgQz3lObt7eRl3Vjt7r079Duewk\"",
    "mtime": "2026-01-08T06:14:07.249Z",
    "size": 3592,
    "path": "../public/games/playstation-4/dark-picture-anthologies-little-hope/index.html"
  },
  "/games/playstation-4/dark-picture-anthologies-little-hope/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"298-/mtzdwPjeIOICFxxFRcnLGtX1/s\"",
    "mtime": "2026-01-08T06:14:10.584Z",
    "size": 664,
    "path": "../public/games/playstation-4/dark-picture-anthologies-little-hope/_payload.json"
  },
  "/games/playstation-4/dark-picture-anthologies-man-of-medan/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"dcf-i1ipJ5JJMm27OmYARuAFF06YSGY\"",
    "mtime": "2026-01-08T06:14:07.250Z",
    "size": 3535,
    "path": "../public/games/playstation-4/dark-picture-anthologies-man-of-medan/index.html"
  },
  "/games/playstation-4/dark-picture-anthologies-man-of-medan/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"281-A0Av+6YavxbF49qqz72uhMCuZAc\"",
    "mtime": "2026-01-08T06:14:10.584Z",
    "size": 641,
    "path": "../public/games/playstation-4/dark-picture-anthologies-man-of-medan/_payload.json"
  },
  "/games/playstation-4/dark-souls-trilogy/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"dbb-hFrKekWuYmc51VSsLmd+4b+TXZ8\"",
    "mtime": "2026-01-08T06:14:07.250Z",
    "size": 3515,
    "path": "../public/games/playstation-4/dark-souls-trilogy/index.html"
  },
  "/games/playstation-4/dark-souls-trilogy/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"2a1-zSnfWYHiuAUHsVOsUlTNcZygSb4\"",
    "mtime": "2026-01-08T06:14:10.602Z",
    "size": 673,
    "path": "../public/games/playstation-4/dark-souls-trilogy/_payload.json"
  },
  "/games/playstation-4/downwell/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d0e-48cYC5u0wyOHdMFSYnhW75v5poc\"",
    "mtime": "2026-01-08T06:14:07.522Z",
    "size": 3342,
    "path": "../public/games/playstation-4/downwell/index.html"
  },
  "/games/playstation-4/downwell/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"263-g/XbItVf/zp7wtEGwWK0v4c6Qmo\"",
    "mtime": "2026-01-08T06:14:10.683Z",
    "size": 611,
    "path": "../public/games/playstation-4/downwell/_payload.json"
  },
  "/games/playstation-4/final-fantasy-xii-the-zodiac-age/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"da0-JjzOL+NUoYY2uCQnrSLXVriV60M\"",
    "mtime": "2026-01-08T06:14:07.799Z",
    "size": 3488,
    "path": "../public/games/playstation-4/final-fantasy-xii-the-zodiac-age/index.html"
  },
  "/games/playstation-4/final-fantasy-xii-the-zodiac-age/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"276-ebcMlRB7NauknvlgE936XvddVPQ\"",
    "mtime": "2026-01-08T06:14:10.835Z",
    "size": 630,
    "path": "../public/games/playstation-4/final-fantasy-xii-the-zodiac-age/_payload.json"
  },
  "/games/playstation-4/final-fantasy-xv/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d38-9hOhsqn1TxQ7mWwmBWyYPOZLkWc\"",
    "mtime": "2026-01-08T06:14:07.817Z",
    "size": 3384,
    "path": "../public/games/playstation-4/final-fantasy-xv/index.html"
  },
  "/games/playstation-4/final-fantasy-xv/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"261-QnHtZ/rxtjsvdmXjuGkQKCFeG7M\"",
    "mtime": "2026-01-08T06:14:10.854Z",
    "size": 609,
    "path": "../public/games/playstation-4/final-fantasy-xv/_payload.json"
  },
  "/games/playstation-4/enter-the-gungeon/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d44-4L4eb0HxrXaTO0+tY3+AU3TEdQ0\"",
    "mtime": "2026-01-08T06:14:07.531Z",
    "size": 3396,
    "path": "../public/games/playstation-4/enter-the-gungeon/index.html"
  },
  "/games/playstation-4/enter-the-gungeon/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"26c-/U2jW7SJYAuY01cWxtzqPUIe/Ig\"",
    "mtime": "2026-01-08T06:14:10.737Z",
    "size": 620,
    "path": "../public/games/playstation-4/enter-the-gungeon/_payload.json"
  },
  "/games/playstation-4/god-of-war-ps4/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d75-tsmO9Q4JK8UD/jOsNDCcTerE950\"",
    "mtime": "2026-01-08T06:14:08.044Z",
    "size": 3445,
    "path": "../public/games/playstation-4/god-of-war-ps4/index.html"
  },
  "/games/playstation-4/god-of-war-ps4/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"27a-ZhZ0t4lPIg6L9RUtixfFYQrkDL4\"",
    "mtime": "2026-01-08T06:14:10.872Z",
    "size": 634,
    "path": "../public/games/playstation-4/god-of-war-ps4/_payload.json"
  },
  "/games/playstation-4/gundemoniums/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d76-LM9yukiBmM7lxrQy2Czk8T0TqV8\"",
    "mtime": "2026-01-08T06:14:08.063Z",
    "size": 3446,
    "path": "../public/games/playstation-4/gundemoniums/index.html"
  },
  "/games/playstation-4/gundemoniums/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"27d-a16b2YHC891Rk6kF2oM3eTO+FxE\"",
    "mtime": "2026-01-08T06:14:10.902Z",
    "size": 637,
    "path": "../public/games/playstation-4/gundemoniums/_payload.json"
  },
  "/games/playstation-4/horizon-zero-dawn/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d3e-q83V6clUFwc3VWArhR1omb6EC3s\"",
    "mtime": "2026-01-08T06:14:08.148Z",
    "size": 3390,
    "path": "../public/games/playstation-4/horizon-zero-dawn/index.html"
  },
  "/games/playstation-4/horizon-zero-dawn/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"263-VMKWclOHqwBEdt/jL3sG2vUahtk\"",
    "mtime": "2026-01-08T06:14:10.962Z",
    "size": 611,
    "path": "../public/games/playstation-4/horizon-zero-dawn/_payload.json"
  },
  "/games/playstation-4/hotline-miami/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d73-cE0W4K+xGPTdjwG4B/IuvHHUpcU\"",
    "mtime": "2026-01-08T06:14:08.081Z",
    "size": 3443,
    "path": "../public/games/playstation-4/hotline-miami/index.html"
  },
  "/games/playstation-4/hotline-miami/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"278-hK7D6oaQChkn0uyyQgBiRH2F3oM\"",
    "mtime": "2026-01-08T06:14:10.922Z",
    "size": 632,
    "path": "../public/games/playstation-4/hotline-miami/_payload.json"
  },
  "/games/playstation-4/hotline-miami-2-wrong-number/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"dc9-F7srNFNEBWbznYr9u8WEVzPf1QQ\"",
    "mtime": "2026-01-08T06:14:08.081Z",
    "size": 3529,
    "path": "../public/games/playstation-4/hotline-miami-2-wrong-number/index.html"
  },
  "/games/playstation-4/hotline-miami-2-wrong-number/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"285-EHsWcQRTDjkr4COH5T9EjbnEDtk\"",
    "mtime": "2026-01-08T06:14:10.922Z",
    "size": 645,
    "path": "../public/games/playstation-4/hotline-miami-2-wrong-number/_payload.json"
  },
  "/games/playstation-4/injustice-2-legendary-edition/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"dea-tl4GblFwN5babtv9s4fd387T5I4\"",
    "mtime": "2026-01-08T06:14:08.136Z",
    "size": 3562,
    "path": "../public/games/playstation-4/injustice-2-legendary-edition/index.html"
  },
  "/games/playstation-4/injustice-2-legendary-edition/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"275-vlOla3C+WEuwj5B1heu/JAI/Xx4\"",
    "mtime": "2026-01-08T06:14:10.943Z",
    "size": 629,
    "path": "../public/games/playstation-4/injustice-2-legendary-edition/_payload.json"
  },
  "/games/playstation-4/injustice-gods-among-us-ultimate-edition/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"e2e-iMgwXDobFzdN7wy1guAny/oACJ0\"",
    "mtime": "2026-01-08T06:14:08.142Z",
    "size": 3630,
    "path": "../public/games/playstation-4/injustice-gods-among-us-ultimate-edition/index.html"
  },
  "/games/playstation-4/injustice-gods-among-us-ultimate-edition/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"29e-t97pWrTlkJr4pcI/IbuFwC5Q0Gw\"",
    "mtime": "2026-01-08T06:14:10.943Z",
    "size": 670,
    "path": "../public/games/playstation-4/injustice-gods-among-us-ultimate-edition/_payload.json"
  },
  "/games/playstation-4/kamiwaza-way-of-the-thief/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"dc6-J6mImoiBt6aOcbVziUve/LH6hws\"",
    "mtime": "2026-01-08T06:14:08.318Z",
    "size": 3526,
    "path": "../public/games/playstation-4/kamiwaza-way-of-the-thief/index.html"
  },
  "/games/playstation-4/kamiwaza-way-of-the-thief/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"28d-VKGNVr6yPjswcMxRJm5k6IgXO0k\"",
    "mtime": "2026-01-08T06:14:10.996Z",
    "size": 653,
    "path": "../public/games/playstation-4/kamiwaza-way-of-the-thief/_payload.json"
  },
  "/games/playstation-4/middle-earth-shadow-of-war/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"dcc-99Sx2bxKPnReXSY0ayfVL2Ng1Xc\"",
    "mtime": "2026-01-08T06:14:08.768Z",
    "size": 3532,
    "path": "../public/games/playstation-4/middle-earth-shadow-of-war/index.html"
  },
  "/games/playstation-4/middle-earth-shadow-of-war/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"28e-zmHuIUwJnkNr1PS1oCMCe5fjRb8\"",
    "mtime": "2026-01-08T06:14:11.176Z",
    "size": 654,
    "path": "../public/games/playstation-4/middle-earth-shadow-of-war/_payload.json"
  },
  "/games/playstation-4/mystery-chronicle-one-way-heroics/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"da0-meYbMjO+Xe/9cEQhyFFewKWUK/c\"",
    "mtime": "2026-01-08T06:14:08.805Z",
    "size": 3488,
    "path": "../public/games/playstation-4/mystery-chronicle-one-way-heroics/index.html"
  },
  "/games/playstation-4/mystery-chronicle-one-way-heroics/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"274-nK4K7us4Uj6Q8k99HY8sIp+DU+4\"",
    "mtime": "2026-01-08T06:14:11.206Z",
    "size": 628,
    "path": "../public/games/playstation-4/mystery-chronicle-one-way-heroics/_payload.json"
  },
  "/games/playstation-4/nioh/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"cf6-MYnNf3cE6xNHNEEYuXKKH+wxuCU\"",
    "mtime": "2026-01-08T06:14:08.866Z",
    "size": 3318,
    "path": "../public/games/playstation-4/nioh/index.html"
  },
  "/games/playstation-4/nioh/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"259-inYI+CwdoHxNZ74JwFUu1iDgasg\"",
    "mtime": "2026-01-08T06:14:11.244Z",
    "size": 601,
    "path": "../public/games/playstation-4/nioh/_payload.json"
  },
  "/games/playstation-4/nier-automata/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d2e-tj1wHxCE7BVIcfZLwAvbvLN3v74\"",
    "mtime": "2026-01-08T06:14:08.847Z",
    "size": 3374,
    "path": "../public/games/playstation-4/nier-automata/index.html"
  },
  "/games/playstation-4/nier-automata/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"263-D2a/NJiDGyE+Q1rjztgqioVXMFQ\"",
    "mtime": "2026-01-08T06:14:11.224Z",
    "size": 611,
    "path": "../public/games/playstation-4/nier-automata/_payload.json"
  },
  "/games/playstation-4/outlast-trinity/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d97-Nfeoc9Wh2SnYL2/LEv+3MvJamm8\"",
    "mtime": "2026-01-08T06:14:08.866Z",
    "size": 3479,
    "path": "../public/games/playstation-4/outlast-trinity/index.html"
  },
  "/games/playstation-4/outlast-trinity/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"28b-gO8Rwhuc3lsaWOASMi/1o9UQT8I\"",
    "mtime": "2026-01-08T06:14:11.244Z",
    "size": 651,
    "path": "../public/games/playstation-4/outlast-trinity/_payload.json"
  },
  "/games/playstation-4/persona-5/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d16-iIT55mtpcZStE6a2g/ms21pyfHI\"",
    "mtime": "2026-01-08T06:14:08.895Z",
    "size": 3350,
    "path": "../public/games/playstation-4/persona-5/index.html"
  },
  "/games/playstation-4/persona-5/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25f-mex25UtMdWoJ9o6qMo0uGwGazHE\"",
    "mtime": "2026-01-08T06:14:11.259Z",
    "size": 607,
    "path": "../public/games/playstation-4/persona-5/_payload.json"
  },
  "/games/playstation-4/pix-the-cat/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d68-lEg7GsFhyNz2vhMR2hsG9c6hg+U\"",
    "mtime": "2026-01-08T06:14:08.895Z",
    "size": 3432,
    "path": "../public/games/playstation-4/pix-the-cat/index.html"
  },
  "/games/playstation-4/pix-the-cat/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"279-T2HTju/E0WPTRXHoNz/Dh0Xs8Pg\"",
    "mtime": "2026-01-08T06:14:11.259Z",
    "size": 633,
    "path": "../public/games/playstation-4/pix-the-cat/_payload.json"
  },
  "/games/playstation-4/rocksmith-2014-edition/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d5c-sHELeCFT223sKhACUEPWk18w9dA\"",
    "mtime": "2026-01-08T06:14:09.265Z",
    "size": 3420,
    "path": "../public/games/playstation-4/rocksmith-2014-edition/index.html"
  },
  "/games/playstation-4/rocksmith-2014-edition/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"268-VUj2V7T70dfcaeZY/VP5i+7uMtM\"",
    "mtime": "2026-01-08T06:14:11.382Z",
    "size": 616,
    "path": "../public/games/playstation-4/rocksmith-2014-edition/_payload.json"
  },
  "/games/playstation-4/raiden-v-directors-cut/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d6e-Je16csYJk6glhTZXhQi6o4twzgI\"",
    "mtime": "2026-01-08T06:14:09.127Z",
    "size": 3438,
    "path": "../public/games/playstation-4/raiden-v-directors-cut/index.html"
  },
  "/games/playstation-4/raiden-v-directors-cut/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"26a-xDJRUcAkWn4MKbDoDYX1gav6uYw\"",
    "mtime": "2026-01-08T06:14:11.304Z",
    "size": 618,
    "path": "../public/games/playstation-4/raiden-v-directors-cut/_payload.json"
  },
  "/games/playstation-4/secret-of-mana/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d32-///r0chiXdR9InJDgqFkYwIBWSE\"",
    "mtime": "2026-01-08T06:14:09.281Z",
    "size": 3378,
    "path": "../public/games/playstation-4/secret-of-mana/index.html"
  },
  "/games/playstation-4/secret-of-mana/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"263-W5OvGpU9/fyfMbTDaycRwseiCp4\"",
    "mtime": "2026-01-08T06:14:11.382Z",
    "size": 611,
    "path": "../public/games/playstation-4/secret-of-mana/_payload.json"
  },
  "/games/playstation-4/shadow-of-the-colossus-ps4/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d68-ZftcwFyN6smSev2mzgX/2m2JM60\"",
    "mtime": "2026-01-08T06:14:09.290Z",
    "size": 3432,
    "path": "../public/games/playstation-4/shadow-of-the-colossus-ps4/index.html"
  },
  "/games/playstation-4/shadow-of-the-colossus-ps4/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"268-A1RyaENVxbgFovPNXf2y7d3cJSE\"",
    "mtime": "2026-01-08T06:14:11.398Z",
    "size": 616,
    "path": "../public/games/playstation-4/shadow-of-the-colossus-ps4/_payload.json"
  },
  "/games/playstation-4/shadow-of-mordor-game-of-the-year-edition/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"efd-U1Ot4Sz+0xCNFpv954EIQIMZFS8\"",
    "mtime": "2026-01-08T06:14:08.742Z",
    "size": 3837,
    "path": "../public/games/playstation-4/shadow-of-mordor-game-of-the-year-edition/index.html"
  },
  "/games/playstation-4/shadow-of-mordor-game-of-the-year-edition/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"331-i4bk783dzrgcDaUrKXlLXtHkDlo\"",
    "mtime": "2026-01-08T06:14:11.176Z",
    "size": 817,
    "path": "../public/games/playstation-4/shadow-of-mordor-game-of-the-year-edition/_payload.json"
  },
  "/games/playstation-4/sine-mora-ex/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d20-1mezNkxvjtygSCnqbX3lNMNb0AY\"",
    "mtime": "2026-01-08T06:14:09.390Z",
    "size": 3360,
    "path": "../public/games/playstation-4/sine-mora-ex/index.html"
  },
  "/games/playstation-4/sine-mora-ex/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25e-TeBApqov6bd7N4IwqOG9LUWpWkw\"",
    "mtime": "2026-01-08T06:14:11.451Z",
    "size": 606,
    "path": "../public/games/playstation-4/sine-mora-ex/_payload.json"
  },
  "/games/playstation-4/spyro-reignited-trilogy/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d6a-pPlbVUR2kJiZmcBMly+gpAJsjTk\"",
    "mtime": "2026-01-08T06:14:09.515Z",
    "size": 3434,
    "path": "../public/games/playstation-4/spyro-reignited-trilogy/index.html"
  },
  "/games/playstation-4/spyro-reignited-trilogy/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"26d-9Mesf/YFeZQZtNNxDIAUoCZRSKg\"",
    "mtime": "2026-01-08T06:14:11.483Z",
    "size": 621,
    "path": "../public/games/playstation-4/spyro-reignited-trilogy/_payload.json"
  },
  "/games/playstation-4/the-evil-within/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d80-d8rcNDI6lH4fyTYFT1gko0/VpXc\"",
    "mtime": "2026-01-08T06:14:09.808Z",
    "size": 3456,
    "path": "../public/games/playstation-4/the-evil-within/index.html"
  },
  "/games/playstation-4/the-evil-within/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"27d-6iYec8KmE0mufIFK9nDPsADAA9Y\"",
    "mtime": "2026-01-08T06:14:11.585Z",
    "size": 637,
    "path": "../public/games/playstation-4/the-evil-within/_payload.json"
  },
  "/games/playstation-4/the-evil-within-2/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d44-yWsP3cUPoQ0s7l9jwA53LOAnJmk\"",
    "mtime": "2026-01-08T06:14:09.808Z",
    "size": 3396,
    "path": "../public/games/playstation-4/the-evil-within-2/index.html"
  },
  "/games/playstation-4/the-evil-within-2/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"266-n9VJNed4sLciiFAgPdDUXfblt/k\"",
    "mtime": "2026-01-08T06:14:11.585Z",
    "size": 614,
    "path": "../public/games/playstation-4/the-evil-within-2/_payload.json"
  },
  "/games/playstation-4/uncharted-the-nathan-drake-collection/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"e0c-xPx0TrOrsABJICacnMBoBMOemAw\"",
    "mtime": "2026-01-08T06:14:09.905Z",
    "size": 3596,
    "path": "../public/games/playstation-4/uncharted-the-nathan-drake-collection/index.html"
  },
  "/games/playstation-4/uncharted-the-nathan-drake-collection/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"298-Uu95D8uM55Q0BV48tYZ7X8LpQCg\"",
    "mtime": "2026-01-08T06:14:11.613Z",
    "size": 664,
    "path": "../public/games/playstation-4/uncharted-the-nathan-drake-collection/_payload.json"
  },
  "/games/playstation-4/the-walking-dead-the-telltale-definitive-series/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"e48-KhfU9mM4ymnLUFX36Utsthb0riM\"",
    "mtime": "2026-01-08T06:14:09.846Z",
    "size": 3656,
    "path": "../public/games/playstation-4/the-walking-dead-the-telltale-definitive-series/index.html"
  },
  "/games/playstation-4/the-walking-dead-the-telltale-definitive-series/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"2a2-XwvcIl/Mqg4/TeoHgOk4XMSt6wQ\"",
    "mtime": "2026-01-08T06:14:11.600Z",
    "size": 674,
    "path": "../public/games/playstation-4/the-walking-dead-the-telltale-definitive-series/_payload.json"
  },
  "/games/playstation-4/until-dawn/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"db3-XurjNB6rAJ8COW/lbFBnU++/1cw\"",
    "mtime": "2026-01-08T06:14:06.668Z",
    "size": 3507,
    "path": "../public/games/playstation-4/until-dawn/index.html"
  },
  "/games/playstation-4/until-dawn/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"2af-h+Q81ixJq5DGXaQEuJ+sWT6y/Zw\"",
    "mtime": "2026-01-08T06:14:10.438Z",
    "size": 687,
    "path": "../public/games/playstation-4/until-dawn/_payload.json"
  },
  "/games/playstation-4/wolfenstein-ii-the-new-colossus/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"de8-qKZBDNh2Ic8lWsEWl6UjBlLpaJU\"",
    "mtime": "2026-01-08T06:14:09.959Z",
    "size": 3560,
    "path": "../public/games/playstation-4/wolfenstein-ii-the-new-colossus/index.html"
  },
  "/games/playstation-4/wolfenstein-ii-the-new-colossus/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"292-YiaSPByAeNw6Npau1Y3Xy2cbJeg\"",
    "mtime": "2026-01-08T06:14:11.652Z",
    "size": 658,
    "path": "../public/games/playstation-4/wolfenstein-ii-the-new-colossus/_payload.json"
  },
  "/games/playstation-4/wolfenstein-the-new-order/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"dc4-Hp3n7bgT9D6bmb/Dd8/vJVx+aUw\"",
    "mtime": "2026-01-08T06:14:09.959Z",
    "size": 3524,
    "path": "../public/games/playstation-4/wolfenstein-the-new-order/index.html"
  },
  "/games/playstation-4/wolfenstein-the-new-order/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"28b-by3ZyhRTkPuDua1RGV9x2G+8YVo\"",
    "mtime": "2026-01-08T06:14:11.653Z",
    "size": 651,
    "path": "../public/games/playstation-4/wolfenstein-the-new-order/_payload.json"
  },
  "/games/playstation-4/wolfenstein-the-old-blood/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"dc4-rTapxtBmhUKF2a6FgbMAjdUR8Eo\"",
    "mtime": "2026-01-08T06:14:09.958Z",
    "size": 3524,
    "path": "../public/games/playstation-4/wolfenstein-the-old-blood/index.html"
  },
  "/games/playstation-4/wolfenstein-the-old-blood/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"28c-m4bxTIoeAIlrnv1vfX7lT1ZzQAI\"",
    "mtime": "2026-01-08T06:14:11.652Z",
    "size": 652,
    "path": "../public/games/playstation-4/wolfenstein-the-old-blood/_payload.json"
  },
  "/games/playstation-4/world-of-final-fantasy/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d62-znbwO1OWYBApfkqef6aLX4GpOmU\"",
    "mtime": "2026-01-08T06:14:09.959Z",
    "size": 3426,
    "path": "../public/games/playstation-4/world-of-final-fantasy/index.html"
  },
  "/games/playstation-4/world-of-final-fantasy/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"26b-B7L3g6Z/ZxbeR2BAkEQZ4XxW6ro\"",
    "mtime": "2026-01-08T06:14:11.652Z",
    "size": 619,
    "path": "../public/games/playstation-4/world-of-final-fantasy/_payload.json"
  },
  "/games/playstation-4/ys-origin/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d0e-+UZdfNBfTJp+wHp0wU5mKzMlMfU\"",
    "mtime": "2026-01-08T06:14:10.001Z",
    "size": 3342,
    "path": "../public/games/playstation-4/ys-origin/index.html"
  },
  "/games/playstation-4/ys-origin/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25b-i+29r7ly/zAJ+ElVPVrbIzNzb3M\"",
    "mtime": "2026-01-08T06:14:11.675Z",
    "size": 603,
    "path": "../public/games/playstation-4/ys-origin/_payload.json"
  },
  "/games/playstation-4/ys-viii-lacrimosa-of-dana/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d70-tElfUB1hLVyTmfTJTvYMsWFwaos\"",
    "mtime": "2026-01-08T06:14:10.022Z",
    "size": 3440,
    "path": "../public/games/playstation-4/ys-viii-lacrimosa-of-dana/index.html"
  },
  "/games/playstation-4/ys-viii-lacrimosa-of-dana/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"26b-mbRhjUsKDxNCHTXY3shp96zdDdg\"",
    "mtime": "2026-01-08T06:14:11.698Z",
    "size": 619,
    "path": "../public/games/playstation-4/ys-viii-lacrimosa-of-dana/_payload.json"
  },
  "/games/playstation-5/a-plague-tale-innocence/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"db2-KNqJviWHq9FHItGlXOYwirSIoEk\"",
    "mtime": "2026-01-08T06:14:06.731Z",
    "size": 3506,
    "path": "../public/games/playstation-5/a-plague-tale-innocence/index.html"
  },
  "/games/playstation-5/a-plague-tale-innocence/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"287-xjpe01leZrdWLQtwcZ1chq/xOpY\"",
    "mtime": "2026-01-08T06:14:10.469Z",
    "size": 647,
    "path": "../public/games/playstation-5/a-plague-tale-innocence/_payload.json"
  },
  "/games/playstation-5/crisis-core-final-fantasy-vii-reunion/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"dbc-dTpFuW8DvWLVgYFBaxGdUJeaRi4\"",
    "mtime": "2026-01-08T06:14:07.248Z",
    "size": 3516,
    "path": "../public/games/playstation-5/crisis-core-final-fantasy-vii-reunion/index.html"
  },
  "/games/playstation-5/crisis-core-final-fantasy-vii-reunion/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"265-/1WwEg/c4pRaXF/Dxu02ILNOpeE\"",
    "mtime": "2026-01-08T06:14:10.584Z",
    "size": 613,
    "path": "../public/games/playstation-5/crisis-core-final-fantasy-vii-reunion/_payload.json"
  },
  "/games/playstation-5/dark-picture-anthologies-house-of-ashes/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"e1a-C6paUyPc9oSGJnIQLmDZuI/HsUY\"",
    "mtime": "2026-01-08T06:14:07.250Z",
    "size": 3610,
    "path": "../public/games/playstation-5/dark-picture-anthologies-house-of-ashes/index.html"
  },
  "/games/playstation-5/dark-picture-anthologies-house-of-ashes/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"29b-LopTyhpSqu4MffmIAidXCGIpEF0\"",
    "mtime": "2026-01-08T06:14:10.602Z",
    "size": 667,
    "path": "../public/games/playstation-5/dark-picture-anthologies-house-of-ashes/_payload.json"
  },
  "/games/playstation-5/dead-space/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"ed3-WUfxZBH1Hky/Ky5ujRr/2rn/YuA\"",
    "mtime": "2026-01-08T06:14:07.250Z",
    "size": 3795,
    "path": "../public/games/playstation-5/dead-space/index.html"
  },
  "/games/playstation-5/dead-space/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"3ce-A4OqVn4RDl31kR+fDUKTs+TSs/8\"",
    "mtime": "2026-01-08T06:14:10.624Z",
    "size": 974,
    "path": "../public/games/playstation-5/dead-space/_payload.json"
  },
  "/games/playstation-5/death-stranding-directors-cut/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"de3-ofFUr04SI3EaGplSdpykLkcnhGc\"",
    "mtime": "2026-01-08T06:14:07.250Z",
    "size": 3555,
    "path": "../public/games/playstation-5/death-stranding-directors-cut/index.html"
  },
  "/games/playstation-5/death-stranding-directors-cut/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"292-USChYeenvxBgkazLuaOJ8qMywyg\"",
    "mtime": "2026-01-08T06:14:10.602Z",
    "size": 658,
    "path": "../public/games/playstation-5/death-stranding-directors-cut/_payload.json"
  },
  "/games/playstation-5/deathloop/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d63-CNVWwsaGjaM3snYw8H/7FDMD3aA\"",
    "mtime": "2026-01-08T06:14:07.250Z",
    "size": 3427,
    "path": "../public/games/playstation-5/deathloop/index.html"
  },
  "/games/playstation-5/deathloop/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"27c-DYRC889PvEfG7rgJ/GhJ56XDzww\"",
    "mtime": "2026-01-08T06:14:10.624Z",
    "size": 636,
    "path": "../public/games/playstation-5/deathloop/_payload.json"
  },
  "/games/playstation-5/deaths-door/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d7f-qek3YeAbR4p+wqr2sdkaDgNm44o\"",
    "mtime": "2026-01-08T06:14:07.257Z",
    "size": 3455,
    "path": "../public/games/playstation-5/deaths-door/index.html"
  },
  "/games/playstation-5/deaths-door/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"27f-sERbmp2YNLHDRDW9XGnGsHxHAc4\"",
    "mtime": "2026-01-08T06:14:10.624Z",
    "size": 639,
    "path": "../public/games/playstation-5/deaths-door/_payload.json"
  },
  "/games/playstation-5/demons-souls-ps5/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d91-ouSbIw4tJp48113HGxOOJuz0afU\"",
    "mtime": "2026-01-08T06:14:07.271Z",
    "size": 3473,
    "path": "../public/games/playstation-5/demons-souls-ps5/index.html"
  },
  "/games/playstation-5/demons-souls-ps5/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"280-xy31+7GgrHiHhgU6YCX+78SoXj4\"",
    "mtime": "2026-01-08T06:14:10.648Z",
    "size": 640,
    "path": "../public/games/playstation-5/demons-souls-ps5/_payload.json"
  },
  "/games/playstation-5/eiyuden-chronicle-hundred-heroes/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"dee-J6HED6q1rL4PABqvqqOnJ6Bhnd8\"",
    "mtime": "2026-01-08T06:14:07.531Z",
    "size": 3566,
    "path": "../public/games/playstation-5/eiyuden-chronicle-hundred-heroes/index.html"
  },
  "/games/playstation-5/eiyuden-chronicle-hundred-heroes/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"278-+ihidSliuDftL7vi/g5ZBTczUbE\"",
    "mtime": "2026-01-08T06:14:10.737Z",
    "size": 632,
    "path": "../public/games/playstation-5/eiyuden-chronicle-hundred-heroes/_payload.json"
  },
  "/games/playstation-5/elden-ring/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d68-FD5u80yYrOlWCeKbR+d1Xn+5GwI\"",
    "mtime": "2026-01-08T06:14:07.531Z",
    "size": 3432,
    "path": "../public/games/playstation-5/elden-ring/index.html"
  },
  "/games/playstation-5/elden-ring/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"27c-fCuiEWGK6pQSG+aCgVwEe4serBc\"",
    "mtime": "2026-01-08T06:14:10.737Z",
    "size": 636,
    "path": "../public/games/playstation-5/elden-ring/_payload.json"
  },
  "/games/playstation-5/final-fantasy-vii-remake-intergrade/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"e00-BGsb2vGwvTkSlzgyj5DCk7zSSEo\"",
    "mtime": "2026-01-08T06:14:07.795Z",
    "size": 3584,
    "path": "../public/games/playstation-5/final-fantasy-vii-remake-intergrade/index.html"
  },
  "/games/playstation-5/final-fantasy-vii-remake-intergrade/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"296-KaEA3c3NzHzLYnU9cLIAFAuGdqk\"",
    "mtime": "2026-01-08T06:14:10.812Z",
    "size": 662,
    "path": "../public/games/playstation-5/final-fantasy-vii-remake-intergrade/_payload.json"
  },
  "/games/playstation-5/ghost-of-tsushima-directors-cut/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"def-FinCCV6U66axl9A6+lnA3USPDCs\"",
    "mtime": "2026-01-08T06:14:07.950Z",
    "size": 3567,
    "path": "../public/games/playstation-5/ghost-of-tsushima-directors-cut/index.html"
  },
  "/games/playstation-5/ghost-of-tsushima-directors-cut/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"294-ocK8sGGJrMKVsQ7up12JWXkEfAg\"",
    "mtime": "2026-01-08T06:14:10.872Z",
    "size": 660,
    "path": "../public/games/playstation-5/ghost-of-tsushima-directors-cut/_payload.json"
  },
  "/games/playstation-5/inscryption/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d6e-8sJ/Or/IBhz4ZFJ2V8/bbcM26Io\"",
    "mtime": "2026-01-08T06:14:08.174Z",
    "size": 3438,
    "path": "../public/games/playstation-5/inscryption/index.html"
  },
  "/games/playstation-5/inscryption/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"27d-zDl/+1PdiyXTIjKqqIFQRAsWKio\"",
    "mtime": "2026-01-08T06:14:10.962Z",
    "size": 637,
    "path": "../public/games/playstation-5/inscryption/_payload.json"
  },
  "/games/playstation-5/nioh-collection/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d94-jlZotylWSIue2JO+VIOJkzoKxZM\"",
    "mtime": "2026-01-08T06:14:08.866Z",
    "size": 3476,
    "path": "../public/games/playstation-5/nioh-collection/index.html"
  },
  "/games/playstation-5/nioh-collection/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"28f-E5sl0uibbxOtLHwhMwZPJiiRRqU\"",
    "mtime": "2026-01-08T06:14:11.244Z",
    "size": 655,
    "path": "../public/games/playstation-5/nioh-collection/_payload.json"
  },
  "/games/playstation-5/returnal/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d72-3d93nnXhQHTx0vZpHuDpXC4GKTM\"",
    "mtime": "2026-01-08T06:14:09.265Z",
    "size": 3442,
    "path": "../public/games/playstation-5/returnal/index.html"
  },
  "/games/playstation-5/returnal/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"27f-ghYeckdWg8TdNELoNoEuERgXB9E\"",
    "mtime": "2026-01-08T06:14:11.382Z",
    "size": 639,
    "path": "../public/games/playstation-5/returnal/_payload.json"
  },
  "/games/playstation-5/the-binding-of-isaac-repentance/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d9a-+SqPMjUtjswYdLv62MpVusq+oZs\"",
    "mtime": "2026-01-08T06:14:09.808Z",
    "size": 3482,
    "path": "../public/games/playstation-5/the-binding-of-isaac-repentance/index.html"
  },
  "/games/playstation-5/the-binding-of-isaac-repentance/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"27b-fZzA3I2Zoms0gT8UcAwVk8DtXa4\"",
    "mtime": "2026-01-08T06:14:11.585Z",
    "size": 635,
    "path": "../public/games/playstation-5/the-binding-of-isaac-repentance/_payload.json"
  },
  "/games/playstation-5/the-quarry/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"eb9-tBlPd+OBHd9MennETEjkzUc7n9M\"",
    "mtime": "2026-01-08T06:14:09.836Z",
    "size": 3769,
    "path": "../public/games/playstation-5/the-quarry/index.html"
  },
  "/games/playstation-5/the-quarry/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"3b2-TprfiijoNiLaHMPVhyVPWePI0U0\"",
    "mtime": "2026-01-08T06:14:11.585Z",
    "size": 946,
    "path": "../public/games/playstation-5/the-quarry/_payload.json"
  },
  "/games/playstation-5/tony-hawks-pro-skater-1-2-ps5/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"de1-9b8vpo+wZj/XIgrOBVnTDFbaoI4\"",
    "mtime": "2026-01-08T06:14:09.860Z",
    "size": 3553,
    "path": "../public/games/playstation-5/tony-hawks-pro-skater-1-2-ps5/index.html"
  },
  "/games/playstation-5/tony-hawks-pro-skater-1-2-ps5/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"28e-N7DMJZc/VJH1kRNmC5ask0UYtPo\"",
    "mtime": "2026-01-08T06:14:11.600Z",
    "size": 654,
    "path": "../public/games/playstation-5/tony-hawks-pro-skater-1-2-ps5/_payload.json"
  },
  "/games/playstation-vita/army-corps-of-hell/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d59-jSXpPnuUybll/Wtb9aleYS0gUWM\"",
    "mtime": "2026-01-08T06:14:06.975Z",
    "size": 3417,
    "path": "../public/games/playstation-vita/army-corps-of-hell/index.html"
  },
  "/games/playstation-vita/army-corps-of-hell/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"26a-tiBhLN+uF8OAu24hm02KSCPpSFo\"",
    "mtime": "2026-01-08T06:14:10.521Z",
    "size": 618,
    "path": "../public/games/playstation-vita/army-corps-of-hell/_payload.json"
  },
  "/games/playstation-vita/god-of-war-collection/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d6b-YEHz8xQfKNcfjZoHMU0B64g5S8o\"",
    "mtime": "2026-01-08T06:14:08.063Z",
    "size": 3435,
    "path": "../public/games/playstation-vita/god-of-war-collection/index.html"
  },
  "/games/playstation-vita/god-of-war-collection/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"26d-5kyUQD6SyrAfiZ3e+aZM9d5mCpM\"",
    "mtime": "2026-01-08T06:14:10.885Z",
    "size": 621,
    "path": "../public/games/playstation-vita/god-of-war-collection/_payload.json"
  },
  "/games/playstation-vita/metal-gear-solid-hd-collection/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"da1-9s+MDJjE/OA12L4N3EpjJv767mA\"",
    "mtime": "2026-01-08T06:14:08.621Z",
    "size": 3489,
    "path": "../public/games/playstation-vita/metal-gear-solid-hd-collection/index.html"
  },
  "/games/playstation-vita/metal-gear-solid-hd-collection/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"276-n3N5Ac01et+EZRPSHfWCqPb28E0\"",
    "mtime": "2026-01-08T06:14:11.153Z",
    "size": 630,
    "path": "../public/games/playstation-vita/metal-gear-solid-hd-collection/_payload.json"
  },
  "/games/playstation-vita/soul-sacrifice/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d96-B0kyFbc28XBy46wSo26V3imgGYE\"",
    "mtime": "2026-01-08T06:14:09.419Z",
    "size": 3478,
    "path": "../public/games/playstation-vita/soul-sacrifice/index.html"
  },
  "/games/playstation-vita/soul-sacrifice/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"287-Ql08rbpzrWDzBczXse95CA3eo+8\"",
    "mtime": "2026-01-08T06:14:11.452Z",
    "size": 647,
    "path": "../public/games/playstation-vita/soul-sacrifice/_payload.json"
  },
  "/games/playstation-vita/ys-memories-of-celceta/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d7b-yP372ogMCGlDfp5lfI+MqIvuPho\"",
    "mtime": "2026-01-08T06:14:10.026Z",
    "size": 3451,
    "path": "../public/games/playstation-vita/ys-memories-of-celceta/index.html"
  },
  "/games/playstation-vita/ys-memories-of-celceta/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"273-jrMmWYVbabknD4VWbuZ2sevXVJA\"",
    "mtime": "2026-01-08T06:14:11.698Z",
    "size": 627,
    "path": "../public/games/playstation-vita/ys-memories-of-celceta/_payload.json"
  },
  "/games/playstation-vita/ys-origin-vita/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d32-q17ML5LMXti+Yrp9/Yteji9hICE\"",
    "mtime": "2026-01-08T06:14:10.001Z",
    "size": 3378,
    "path": "../public/games/playstation-vita/ys-origin-vita/index.html"
  },
  "/games/playstation-vita/ys-origin-vita/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"261-azqTItotTJtTDmGZ6faGR7T9W78\"",
    "mtime": "2026-01-08T06:14:11.697Z",
    "size": 609,
    "path": "../public/games/playstation-vita/ys-origin-vita/_payload.json"
  },
  "/games/playstation-portable/3rd-birthday-the/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d72-J6bBVa+KPf0R1dzHSQk4fUpxK08\"",
    "mtime": "2026-01-08T06:14:06.731Z",
    "size": 3442,
    "path": "../public/games/playstation-portable/3rd-birthday-the/index.html"
  },
  "/games/playstation-portable/3rd-birthday-the/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"274-3j4JBLp10KgvxEQGUc8JUgTIZm0\"",
    "mtime": "2026-01-08T06:14:10.469Z",
    "size": 628,
    "path": "../public/games/playstation-portable/3rd-birthday-the/_payload.json"
  },
  "/games/playstation-portable/disgaea-2-dark-hero-days/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"da1-S3qPPz1rmKYKOQbdJQg/DDPCZiM\"",
    "mtime": "2026-01-08T06:14:07.393Z",
    "size": 3489,
    "path": "../public/games/playstation-portable/disgaea-2-dark-hero-days/index.html"
  },
  "/games/playstation-portable/disgaea-2-dark-hero-days/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"27c-0B/NdjMMWWgJPEQpGqX6EwM87g4\"",
    "mtime": "2026-01-08T06:14:10.683Z",
    "size": 636,
    "path": "../public/games/playstation-portable/disgaea-2-dark-hero-days/_payload.json"
  },
  "/games/playstation-portable/dissidia-012-duodecim-final-fantasy/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"ddd-clNGsGCdeSUudb1lOdb/Bs79+GI\"",
    "mtime": "2026-01-08T06:14:07.418Z",
    "size": 3549,
    "path": "../public/games/playstation-portable/dissidia-012-duodecim-final-fantasy/index.html"
  },
  "/games/playstation-portable/dissidia-012-duodecim-final-fantasy/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"284-xgfAXY56mUUun15+TaGo9JStiX0\"",
    "mtime": "2026-01-08T06:14:10.683Z",
    "size": 644,
    "path": "../public/games/playstation-portable/dissidia-012-duodecim-final-fantasy/_payload.json"
  },
  "/games/playstation-portable/dissidia-final-fantasy/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d8f-QR/bRd9U32Dk1EWbGZDGfX5F4QE\"",
    "mtime": "2026-01-08T06:14:07.444Z",
    "size": 3471,
    "path": "../public/games/playstation-portable/dissidia-final-fantasy/index.html"
  },
  "/games/playstation-portable/dissidia-final-fantasy/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"277-iNe/B5FATI1Sp9q3pssYboW/zPU\"",
    "mtime": "2026-01-08T06:14:10.683Z",
    "size": 631,
    "path": "../public/games/playstation-portable/dissidia-final-fantasy/_payload.json"
  },
  "/games/playstation-portable/final-fantasy-ii/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d71-mrz10mmeCoJooE90212DIhtBVio\"",
    "mtime": "2026-01-08T06:14:07.729Z",
    "size": 3441,
    "path": "../public/games/playstation-portable/final-fantasy-ii/index.html"
  },
  "/games/playstation-portable/final-fantasy-ii/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"274-+Ysl3wKMjqV8Gz5tqemMJwVVsA8\"",
    "mtime": "2026-01-08T06:14:10.778Z",
    "size": 628,
    "path": "../public/games/playstation-portable/final-fantasy-ii/_payload.json"
  },
  "/games/playstation-portable/final-fantasy-iv-the-complete-collection/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"e60-6oGwic4RcUGPr0brrrJEMJMJN7M\"",
    "mtime": "2026-01-08T06:14:07.795Z",
    "size": 3680,
    "path": "../public/games/playstation-portable/final-fantasy-iv-the-complete-collection/index.html"
  },
  "/games/playstation-portable/final-fantasy-iv-the-complete-collection/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"2b3-FgFWTRDmXD4YvgAm77dWx8SAUqg\"",
    "mtime": "2026-01-08T06:14:10.797Z",
    "size": 691,
    "path": "../public/games/playstation-portable/final-fantasy-iv-the-complete-collection/_payload.json"
  },
  "/games/playstation-portable/final-fantasy-tactics-the-war-of-the-lions/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"e0d-GXCdChYdq9FWEpnbDNo3e9Yy0LM\"",
    "mtime": "2026-01-08T06:14:07.795Z",
    "size": 3597,
    "path": "../public/games/playstation-portable/final-fantasy-tactics-the-war-of-the-lions/index.html"
  },
  "/games/playstation-portable/final-fantasy-tactics-the-war-of-the-lions/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"28e-63hgrP0zAh8iW0bg9IOU/lnPZv4\"",
    "mtime": "2026-01-08T06:14:10.797Z",
    "size": 654,
    "path": "../public/games/playstation-portable/final-fantasy-tactics-the-war-of-the-lions/_payload.json"
  },
  "/games/playstation-portable/final-fantasy-psp/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d63-82ccn4qAz4M7GbLZ83NTh5rchhI\"",
    "mtime": "2026-01-08T06:14:07.669Z",
    "size": 3427,
    "path": "../public/games/playstation-portable/final-fantasy-psp/index.html"
  },
  "/games/playstation-portable/final-fantasy-psp/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"26d-mgyLDI4skTpYfCLWDkKb74WMmco\"",
    "mtime": "2026-01-08T06:14:10.769Z",
    "size": 621,
    "path": "../public/games/playstation-portable/final-fantasy-psp/_payload.json"
  },
  "/games/playstation-portable/final-fantasy-vii-crisis-core/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"e0f-pqKn2+ZfEeGmGghyyYuNBW8lrv4\"",
    "mtime": "2026-01-08T06:14:07.795Z",
    "size": 3599,
    "path": "../public/games/playstation-portable/final-fantasy-vii-crisis-core/index.html"
  },
  "/games/playstation-portable/final-fantasy-vii-crisis-core/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"29a-txBTlQC/tsRvAE+VhKmtvtXej0s\"",
    "mtime": "2026-01-08T06:14:10.812Z",
    "size": 666,
    "path": "../public/games/playstation-portable/final-fantasy-vii-crisis-core/_payload.json"
  },
  "/games/playstation-portable/jeanne-darc/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d5b-+FY3Zfy3Lxyd0Yf4R27/U1K/Azc\"",
    "mtime": "2026-01-08T06:14:08.309Z",
    "size": 3419,
    "path": "../public/games/playstation-portable/jeanne-darc/index.html"
  },
  "/games/playstation-portable/jeanne-darc/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"26c-voEiWzuao9bBSv1dURMAejos6Uo\"",
    "mtime": "2026-01-08T06:14:10.980Z",
    "size": 620,
    "path": "../public/games/playstation-portable/jeanne-darc/_payload.json"
  },
  "/games/playstation-portable/metal-gear-acid/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d69-pxDviKkCqV1iOxxY2wKgX9JOWNc\"",
    "mtime": "2026-01-08T06:14:08.609Z",
    "size": 3433,
    "path": "../public/games/playstation-portable/metal-gear-acid/index.html"
  },
  "/games/playstation-portable/metal-gear-acid/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"272-znH7Uc6kybaD3FRbfkw6ADk+mAI\"",
    "mtime": "2026-01-08T06:14:11.108Z",
    "size": 626,
    "path": "../public/games/playstation-portable/metal-gear-acid/_payload.json"
  },
  "/games/playstation-portable/metal-gear-solid-peace-walker/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"db9-mwvA7+S4rbt6TlCB6BDTz1rrbTU\"",
    "mtime": "2026-01-08T06:14:08.630Z",
    "size": 3513,
    "path": "../public/games/playstation-portable/metal-gear-solid-peace-walker/index.html"
  },
  "/games/playstation-portable/metal-gear-solid-peace-walker/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"27e-nLojVqdHyst40c+4MpLoowbkXM4\"",
    "mtime": "2026-01-08T06:14:11.153Z",
    "size": 638,
    "path": "../public/games/playstation-portable/metal-gear-solid-peace-walker/_payload.json"
  },
  "/games/playstation-portable/metal-gear-solid-portable-ops/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"dbf-9OyrXUFDab3ir0iKC7VjtFV+KWA\"",
    "mtime": "2026-01-08T06:14:08.725Z",
    "size": 3519,
    "path": "../public/games/playstation-portable/metal-gear-solid-portable-ops/index.html"
  },
  "/games/playstation-portable/metal-gear-solid-portable-ops/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"281-bywFJYCA3gR/8O54trVrKxSzqXM\"",
    "mtime": "2026-01-08T06:14:11.153Z",
    "size": 641,
    "path": "../public/games/playstation-portable/metal-gear-solid-portable-ops/_payload.json"
  },
  "/games/playstation-portable/valkyrie-profile-lenneth/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"da1-zB9LBUQEwZkru2Ed07vGO8nSAg0\"",
    "mtime": "2026-01-08T06:14:09.950Z",
    "size": 3489,
    "path": "../public/games/playstation-portable/valkyrie-profile-lenneth/index.html"
  },
  "/games/playstation-portable/valkyrie-profile-lenneth/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"27c-GHX6lEg/g6wZbMFirDLEzVje9sg\"",
    "mtime": "2026-01-08T06:14:11.632Z",
    "size": 636,
    "path": "../public/games/playstation-portable/valkyrie-profile-lenneth/_payload.json"
  },
  "/games/playstation-portable/ys-i-and-ii-chronicles/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d9b-GFQtEDmDU/gLzffqx2NVg71tuks\"",
    "mtime": "2026-01-08T06:14:10.026Z",
    "size": 3483,
    "path": "../public/games/playstation-portable/ys-i-and-ii-chronicles/index.html"
  },
  "/games/playstation-portable/ys-i-and-ii-chronicles/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"278-V+l7xNWWWFQ0CUxS3THdahxF7f0\"",
    "mtime": "2026-01-08T06:14:11.698Z",
    "size": 632,
    "path": "../public/games/playstation-portable/ys-i-and-ii-chronicles/_payload.json"
  },
  "/games/playstation-portable/ys-seven/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d3b-Wd6bWOLJiS3jOdPl5p8fMw3b8PY\"",
    "mtime": "2026-01-08T06:14:10.053Z",
    "size": 3387,
    "path": "../public/games/playstation-portable/ys-seven/index.html"
  },
  "/games/playstation-portable/ys-seven/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"269-4P6vB4pF8p9FIzIwiwC3rugLOhs\"",
    "mtime": "2026-01-08T06:14:11.698Z",
    "size": 617,
    "path": "../public/games/playstation-portable/ys-seven/_payload.json"
  },
  "/games/playstation-portable/ys-the-oath-in-felghana/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d95-616OSJSskxQMWxXVo0o2Yav/BeM\"",
    "mtime": "2026-01-08T06:14:10.026Z",
    "size": 3477,
    "path": "../public/games/playstation-portable/ys-the-oath-in-felghana/index.html"
  },
  "/games/playstation-portable/ys-the-oath-in-felghana/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"278-sdWMFV8cpYq812hhpVh2Do2622o\"",
    "mtime": "2026-01-08T06:14:11.698Z",
    "size": 632,
    "path": "../public/games/playstation-portable/ys-the-oath-in-felghana/_payload.json"
  },
  "/games/sega-genesis/contra-hard-corps/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d3f-XXP0boY5S+ijO3oygHQOPNeIOCQ\"",
    "mtime": "2026-01-08T06:14:07.270Z",
    "size": 3391,
    "path": "../public/games/sega-genesis/contra-hard-corps/index.html"
  },
  "/games/sega-genesis/contra-hard-corps/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"265-NFlXqfnKy65f04iD1JApogGxaLk\"",
    "mtime": "2026-01-08T06:14:10.641Z",
    "size": 613,
    "path": "../public/games/sega-genesis/contra-hard-corps/_payload.json"
  },
  "/games/sega-genesis/diamond-thieves/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d31-mDjd72Utlilys6Nvz4CG8ru7j7Q\"",
    "mtime": "2026-01-08T06:14:07.271Z",
    "size": 3377,
    "path": "../public/games/sega-genesis/diamond-thieves/index.html"
  },
  "/games/sega-genesis/diamond-thieves/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"24c-Bjh5qyCaywOAeC1A0IFjyhDGKtY\"",
    "mtime": "2026-01-08T06:14:10.664Z",
    "size": 588,
    "path": "../public/games/sega-genesis/diamond-thieves/_payload.json"
  },
  "/games/sega-genesis/gunstar-heroes/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d25-Fh1/Ni8sHAhYYmNCWZ7AqI6Ix0g\"",
    "mtime": "2026-01-08T06:14:08.063Z",
    "size": 3365,
    "path": "../public/games/sega-genesis/gunstar-heroes/index.html"
  },
  "/games/sega-genesis/gunstar-heroes/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25e-ndXzFmsznX+8gMKwoBInEQJQnm4\"",
    "mtime": "2026-01-08T06:14:10.902Z",
    "size": 606,
    "path": "../public/games/sega-genesis/gunstar-heroes/_payload.json"
  },
  "/games/sega-genesis/handy-harvy/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d19-z8zQkD0b0HVwh/I2gmQBsGW18ts\"",
    "mtime": "2026-01-08T06:14:08.081Z",
    "size": 3353,
    "path": "../public/games/sega-genesis/handy-harvy/index.html"
  },
  "/games/sega-genesis/handy-harvy/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25e-Tvq08pEt+gnxxTrc1wjgWtfy+6c\"",
    "mtime": "2026-01-08T06:14:10.923Z",
    "size": 606,
    "path": "../public/games/sega-genesis/handy-harvy/_payload.json"
  },
  "/games/sega-genesis/revenge-of-shinobi-the/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d60-zyx2P/YRfBDCypZlWH0mZfOyn5M\"",
    "mtime": "2026-01-08T06:14:09.281Z",
    "size": 3424,
    "path": "../public/games/sega-genesis/revenge-of-shinobi-the/index.html"
  },
  "/games/sega-genesis/revenge-of-shinobi-the/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"26b-AqVk7F89DcIirvBZwitoluO4ngg\"",
    "mtime": "2026-01-08T06:14:11.382Z",
    "size": 619,
    "path": "../public/games/sega-genesis/revenge-of-shinobi-the/_payload.json"
  },
  "/games/sega-genesis/rocket-knight-adventures/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d61-93Mtbow9sBwVJP4q/6l/II/QqSs\"",
    "mtime": "2026-01-08T06:14:09.264Z",
    "size": 3425,
    "path": "../public/games/sega-genesis/rocket-knight-adventures/index.html"
  },
  "/games/sega-genesis/rocket-knight-adventures/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"268-b4TneTN3l0iGmD8MigMXUAt/fKc\"",
    "mtime": "2026-01-08T06:14:11.382Z",
    "size": 616,
    "path": "../public/games/sega-genesis/rocket-knight-adventures/_payload.json"
  },
  "/games/sega-genesis/shinobi-iii-return-of-the-ninja-master/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"dbd-yQBVd58apMw/rFFMb16wVGx52k8\"",
    "mtime": "2026-01-08T06:14:09.366Z",
    "size": 3517,
    "path": "../public/games/sega-genesis/shinobi-iii-return-of-the-ninja-master/index.html"
  },
  "/games/sega-genesis/shinobi-iii-return-of-the-ninja-master/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"27a-zEqug4VsLz0J6PLmDXXfwdfFpS4\"",
    "mtime": "2026-01-08T06:14:11.398Z",
    "size": 634,
    "path": "../public/games/sega-genesis/shinobi-iii-return-of-the-ninja-master/_payload.json"
  },
  "/games/super-nintendo-entertainment-system/aladdin/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"e0a-z/IGK0kOoDoeKP2s/+mmckOUfNE\"",
    "mtime": "2026-01-08T06:14:06.741Z",
    "size": 3594,
    "path": "../public/games/super-nintendo-entertainment-system/aladdin/index.html"
  },
  "/games/super-nintendo-entertainment-system/aladdin/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"2be-yYRihAdOnZIsGDAoakOlLKKWgqA\"",
    "mtime": "2026-01-08T06:14:10.469Z",
    "size": 702,
    "path": "../public/games/super-nintendo-entertainment-system/aladdin/_payload.json"
  },
  "/games/super-nintendo-entertainment-system/axelay/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d9c-WaUvnrocUaRUiQFF4wjmEbUM73c\"",
    "mtime": "2026-01-08T06:14:06.932Z",
    "size": 3484,
    "path": "../public/games/super-nintendo-entertainment-system/axelay/index.html"
  },
  "/games/super-nintendo-entertainment-system/axelay/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"28c-cyJ5Qr5fGt3iapZR4xngxz5zFJc\"",
    "mtime": "2026-01-08T06:14:10.481Z",
    "size": 652,
    "path": "../public/games/super-nintendo-entertainment-system/axelay/_payload.json"
  },
  "/games/super-nintendo-entertainment-system/batman-forever/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"dc6-U8YImqWNeKQ2YzfQ0pPTk+8Giys\"",
    "mtime": "2026-01-08T06:14:06.940Z",
    "size": 3526,
    "path": "../public/games/super-nintendo-entertainment-system/batman-forever/index.html"
  },
  "/games/super-nintendo-entertainment-system/batman-forever/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"291-cBh7sdFGKTHi8AcmRtupk8vb8MQ\"",
    "mtime": "2026-01-08T06:14:10.512Z",
    "size": 657,
    "path": "../public/games/super-nintendo-entertainment-system/batman-forever/_payload.json"
  },
  "/games/super-nintendo-entertainment-system/batman-returns/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"e72-6sl5qUP+5YCpI8vu9lWb7rfqn2g\"",
    "mtime": "2026-01-08T06:14:06.940Z",
    "size": 3698,
    "path": "../public/games/super-nintendo-entertainment-system/batman-returns/index.html"
  },
  "/games/super-nintendo-entertainment-system/batman-returns/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"2eb-FlB9sdDgmx7FbxVbLzbIO74jamo\"",
    "mtime": "2026-01-08T06:14:10.482Z",
    "size": 747,
    "path": "../public/games/super-nintendo-entertainment-system/batman-returns/_payload.json"
  },
  "/games/super-nintendo-entertainment-system/chrono-trigger/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"1609-mHpGeCbdmzbmQbf+M2CYolAQNKY\"",
    "mtime": "2026-01-08T06:14:07.249Z",
    "size": 5641,
    "path": "../public/games/super-nintendo-entertainment-system/chrono-trigger/index.html"
  },
  "/games/super-nintendo-entertainment-system/chrono-trigger/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"87e-TDxexJ55rHW4eXUZaWx+u5KsGg0\"",
    "mtime": "2026-01-08T06:14:10.584Z",
    "size": 2174,
    "path": "../public/games/super-nintendo-entertainment-system/chrono-trigger/_payload.json"
  },
  "/games/super-nintendo-entertainment-system/claymates/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"dae-7AfAbVa6iffHZwcpEi6i+gNPEIw\"",
    "mtime": "2026-01-08T06:14:07.154Z",
    "size": 3502,
    "path": "../public/games/super-nintendo-entertainment-system/claymates/index.html"
  },
  "/games/super-nintendo-entertainment-system/claymates/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"28f-NmZPYiNp/5TRhEJkaWE5bP+K0mw\"",
    "mtime": "2026-01-08T06:14:10.569Z",
    "size": 655,
    "path": "../public/games/super-nintendo-entertainment-system/claymates/_payload.json"
  },
  "/games/super-nintendo-entertainment-system/contra-iii-the-alien-wars/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"16a6-N9z2HTuFD5foPNSdLXNMIhkwGgQ\"",
    "mtime": "2026-01-08T06:14:07.270Z",
    "size": 5798,
    "path": "../public/games/super-nintendo-entertainment-system/contra-iii-the-alien-wars/index.html"
  },
  "/games/super-nintendo-entertainment-system/contra-iii-the-alien-wars/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"8a9-EHSWo0B6mab2QL2YiFyBLaPgjwE\"",
    "mtime": "2026-01-08T06:14:10.648Z",
    "size": 2217,
    "path": "../public/games/super-nintendo-entertainment-system/contra-iii-the-alien-wars/_payload.json"
  },
  "/games/super-nintendo-entertainment-system/cool-world/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"db4-CMpjAWl1Cyd1ECBbzQCHpTeC0ZA\"",
    "mtime": "2026-01-08T06:14:07.250Z",
    "size": 3508,
    "path": "../public/games/super-nintendo-entertainment-system/cool-world/index.html"
  },
  "/games/super-nintendo-entertainment-system/cool-world/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"28f-e3Zn1zKAYrkXIp4neTUN4EQ5p7Q\"",
    "mtime": "2026-01-08T06:14:10.602Z",
    "size": 655,
    "path": "../public/games/super-nintendo-entertainment-system/cool-world/_payload.json"
  },
  "/games/super-nintendo-entertainment-system/donkey-kong-country/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"de4-GQc0Yj4PsBt9xDgxvpr+PrctH5w\"",
    "mtime": "2026-01-08T06:14:07.517Z",
    "size": 3556,
    "path": "../public/games/super-nintendo-entertainment-system/donkey-kong-country/index.html"
  },
  "/games/super-nintendo-entertainment-system/donkey-kong-country/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"296-ffGXwvDxQ9jS5KF/4nKtuzFLQE0\"",
    "mtime": "2026-01-08T06:14:10.683Z",
    "size": 662,
    "path": "../public/games/super-nintendo-entertainment-system/donkey-kong-country/_payload.json"
  },
  "/games/super-nintendo-entertainment-system/donkey-kong-country-2-diddys-kong-quest/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"e6e-XtJO2SDGEmdXhwbb9JSw91+g2rE\"",
    "mtime": "2026-01-08T06:14:07.522Z",
    "size": 3694,
    "path": "../public/games/super-nintendo-entertainment-system/donkey-kong-country-2-diddys-kong-quest/index.html"
  },
  "/games/super-nintendo-entertainment-system/donkey-kong-country-2-diddys-kong-quest/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"2ac-FKkrzeiFDyxNVFBJ5EAULIRR8xk\"",
    "mtime": "2026-01-08T06:14:10.714Z",
    "size": 684,
    "path": "../public/games/super-nintendo-entertainment-system/donkey-kong-country-2-diddys-kong-quest/_payload.json"
  },
  "/games/super-nintendo-entertainment-system/donkey-kong-country-3-dixie-kongs-double-trouble/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"ef7-+ObDf5isgAGG/DmudkhQ1kIfHbQ\"",
    "mtime": "2026-01-08T06:14:07.522Z",
    "size": 3831,
    "path": "../public/games/super-nintendo-entertainment-system/donkey-kong-country-3-dixie-kongs-double-trouble/index.html"
  },
  "/games/super-nintendo-entertainment-system/donkey-kong-country-3-dixie-kongs-double-trouble/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"2cc-cZEy8FGkUCl4ldQkZu586rL1L5o\"",
    "mtime": "2026-01-08T06:14:10.698Z",
    "size": 716,
    "path": "../public/games/super-nintendo-entertainment-system/donkey-kong-country-3-dixie-kongs-double-trouble/_payload.json"
  },
  "/games/super-nintendo-entertainment-system/earthworm-jim/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"dc0-58g9lSFVx1fd59b49Nrr+kCj9xo\"",
    "mtime": "2026-01-08T06:14:07.531Z",
    "size": 3520,
    "path": "../public/games/super-nintendo-entertainment-system/earthworm-jim/index.html"
  },
  "/games/super-nintendo-entertainment-system/earthworm-jim/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"296-y+yIYUVYtZ3ebCnZDmCucpLERig\"",
    "mtime": "2026-01-08T06:14:10.737Z",
    "size": 662,
    "path": "../public/games/super-nintendo-entertainment-system/earthworm-jim/_payload.json"
  },
  "/games/super-nintendo-entertainment-system/earthworm-jim-2/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"dcc-ob3gK1EE58RWoIWwj00iT0TX49M\"",
    "mtime": "2026-01-08T06:14:07.531Z",
    "size": 3532,
    "path": "../public/games/super-nintendo-entertainment-system/earthworm-jim-2/index.html"
  },
  "/games/super-nintendo-entertainment-system/earthworm-jim-2/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"292-Q5uSzyHaL4TeLWjDttl0Y3cCuUg\"",
    "mtime": "2026-01-08T06:14:10.715Z",
    "size": 658,
    "path": "../public/games/super-nintendo-entertainment-system/earthworm-jim-2/_payload.json"
  },
  "/games/super-nintendo-entertainment-system/evo-search-for-eden/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"19b4-unNsGpxs/b26JpkVzYiHlTXKrNY\"",
    "mtime": "2026-01-08T06:14:07.659Z",
    "size": 6580,
    "path": "../public/games/super-nintendo-entertainment-system/evo-search-for-eden/index.html"
  },
  "/games/super-nintendo-entertainment-system/evo-search-for-eden/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"af9-HNHLcBkjv1Wfkipdu+kT+VX7Plo\"",
    "mtime": "2026-01-08T06:14:10.769Z",
    "size": 2809,
    "path": "../public/games/super-nintendo-entertainment-system/evo-search-for-eden/_payload.json"
  },
  "/games/super-nintendo-entertainment-system/final-fantasy-ii-snes/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"de9-0t+z9CM07zBkDW+I2EqQ7/pDRvI\"",
    "mtime": "2026-01-08T06:14:07.743Z",
    "size": 3561,
    "path": "../public/games/super-nintendo-entertainment-system/final-fantasy-ii-snes/index.html"
  },
  "/games/super-nintendo-entertainment-system/final-fantasy-ii-snes/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"297-demhPuZuHWEFYaGBsKAwPSPII68\"",
    "mtime": "2026-01-08T06:14:10.783Z",
    "size": 663,
    "path": "../public/games/super-nintendo-entertainment-system/final-fantasy-ii-snes/_payload.json"
  },
  "/games/super-nintendo-entertainment-system/final-fantasy-iii/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"161b-CGmX07N8/JU1lFgmwq7QnDdsr0s\"",
    "mtime": "2026-01-08T06:14:07.807Z",
    "size": 5659,
    "path": "../public/games/super-nintendo-entertainment-system/final-fantasy-iii/index.html"
  },
  "/games/super-nintendo-entertainment-system/final-fantasy-iii/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"881-I0PPrJIbW7MkSJIXFoVwv/f9vzw\"",
    "mtime": "2026-01-08T06:14:10.835Z",
    "size": 2177,
    "path": "../public/games/super-nintendo-entertainment-system/final-fantasy-iii/_payload.json"
  },
  "/games/super-nintendo-entertainment-system/final-fantasy-mystic-quest/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"e14-qX9xCM/SIiyfrq7MQq8b9Zlu0Uk\"",
    "mtime": "2026-01-08T06:14:07.795Z",
    "size": 3604,
    "path": "../public/games/super-nintendo-entertainment-system/final-fantasy-mystic-quest/index.html"
  },
  "/games/super-nintendo-entertainment-system/final-fantasy-mystic-quest/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"2a0-EuxsdplVKATKyGc9RrGPKxWtmvM\"",
    "mtime": "2026-01-08T06:14:10.797Z",
    "size": 672,
    "path": "../public/games/super-nintendo-entertainment-system/final-fantasy-mystic-quest/_payload.json"
  },
  "/games/super-nintendo-entertainment-system/joe-and-mac/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"f47-20CMCWLX7Vot+Ylj9vw7ZxH1fgw\"",
    "mtime": "2026-01-08T06:14:08.309Z",
    "size": 3911,
    "path": "../public/games/super-nintendo-entertainment-system/joe-and-mac/index.html"
  },
  "/games/super-nintendo-entertainment-system/joe-and-mac/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"376-qQ8dWg1R/QASGNQouromK0lOnKo\"",
    "mtime": "2026-01-08T06:14:10.980Z",
    "size": 886,
    "path": "../public/games/super-nintendo-entertainment-system/joe-and-mac/_payload.json"
  },
  "/games/super-nintendo-entertainment-system/jungle-book-the/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"dcf-lhKzaYanevp2kss/lV+55bDjUTE\"",
    "mtime": "2026-01-08T06:14:08.309Z",
    "size": 3535,
    "path": "../public/games/super-nintendo-entertainment-system/jungle-book-the/index.html"
  },
  "/games/super-nintendo-entertainment-system/jungle-book-the/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"293-W15saunptlJP40Wo2QYld0Orims\"",
    "mtime": "2026-01-08T06:14:10.980Z",
    "size": 659,
    "path": "../public/games/super-nintendo-entertainment-system/jungle-book-the/_payload.json"
  },
  "/games/super-nintendo-entertainment-system/jurassic-park/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"dc6-aLYVrpH6xNJ7k7pokZBf+c2rPcs\"",
    "mtime": "2026-01-08T06:14:08.309Z",
    "size": 3526,
    "path": "../public/games/super-nintendo-entertainment-system/jurassic-park/index.html"
  },
  "/games/super-nintendo-entertainment-system/jurassic-park/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"293-eXixXsT3rB1zqVFEzpvrUrXAaLw\"",
    "mtime": "2026-01-08T06:14:10.980Z",
    "size": 659,
    "path": "../public/games/super-nintendo-entertainment-system/jurassic-park/_payload.json"
  },
  "/games/super-nintendo-entertainment-system/kirby-super-star/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"dd2-/AhwWuym9fs0fmidN51QWn1Fr8w\"",
    "mtime": "2026-01-08T06:14:08.322Z",
    "size": 3538,
    "path": "../public/games/super-nintendo-entertainment-system/kirby-super-star/index.html"
  },
  "/games/super-nintendo-entertainment-system/kirby-super-star/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"293-zi67mGAo1GpqKZAIcxyaVNnyWV8\"",
    "mtime": "2026-01-08T06:14:10.996Z",
    "size": 659,
    "path": "../public/games/super-nintendo-entertainment-system/kirby-super-star/_payload.json"
  },
  "/games/super-nintendo-entertainment-system/legend-of-zelda-a-link-to-the-past/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"ebc-jb5tFHxlC1FWpWkIXqUaW7uJmzM\"",
    "mtime": "2026-01-08T06:14:08.440Z",
    "size": 3772,
    "path": "../public/games/super-nintendo-entertainment-system/legend-of-zelda-a-link-to-the-past/index.html"
  },
  "/games/super-nintendo-entertainment-system/legend-of-zelda-a-link-to-the-past/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"2dd-wOtm51K670zzTgShnuKAiChouKc\"",
    "mtime": "2026-01-08T06:14:11.056Z",
    "size": 733,
    "path": "../public/games/super-nintendo-entertainment-system/legend-of-zelda-a-link-to-the-past/_payload.json"
  },
  "/games/super-nintendo-entertainment-system/lion-king/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"db7-UafWpS7Aqjltsc2MbTBI5zRroAU\"",
    "mtime": "2026-01-08T06:14:08.519Z",
    "size": 3511,
    "path": "../public/games/super-nintendo-entertainment-system/lion-king/index.html"
  },
  "/games/super-nintendo-entertainment-system/lion-king/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"291-RUmwV4AHVe4UhVH8Xr/rV8s2y6s\"",
    "mtime": "2026-01-08T06:14:11.077Z",
    "size": 657,
    "path": "../public/games/super-nintendo-entertainment-system/lion-king/_payload.json"
  },
  "/games/super-nintendo-entertainment-system/mortal-kombat/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"dc0-VjzXtOTPnZjshdx+ZDwc4eTEJ8M\"",
    "mtime": "2026-01-08T06:14:08.847Z",
    "size": 3520,
    "path": "../public/games/super-nintendo-entertainment-system/mortal-kombat/index.html"
  },
  "/games/super-nintendo-entertainment-system/mortal-kombat/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"28f-MN/PQP5v0R5zXJJKZybkpfS6tqM\"",
    "mtime": "2026-01-08T06:14:11.205Z",
    "size": 655,
    "path": "../public/games/super-nintendo-entertainment-system/mortal-kombat/_payload.json"
  },
  "/games/super-nintendo-entertainment-system/mortal-kombat-3/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"dcc-xCMgvAeR83LkTsFLR+SSNZapnK8\"",
    "mtime": "2026-01-08T06:14:08.809Z",
    "size": 3532,
    "path": "../public/games/super-nintendo-entertainment-system/mortal-kombat-3/index.html"
  },
  "/games/super-nintendo-entertainment-system/mortal-kombat-3/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"292-eu/gIhrLeWynX1kVFkQ2SYI1qpU\"",
    "mtime": "2026-01-08T06:14:11.205Z",
    "size": 658,
    "path": "../public/games/super-nintendo-entertainment-system/mortal-kombat-3/_payload.json"
  },
  "/games/super-nintendo-entertainment-system/mortal-kombat-ii/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"dd2-oNoLBUN8KhNkNpefVU3RPyofIkU\"",
    "mtime": "2026-01-08T06:14:08.805Z",
    "size": 3538,
    "path": "../public/games/super-nintendo-entertainment-system/mortal-kombat-ii/index.html"
  },
  "/games/super-nintendo-entertainment-system/mortal-kombat-ii/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"292-B1e6PqYYSB+lVp0pIdwDrewBHdM\"",
    "mtime": "2026-01-08T06:14:11.205Z",
    "size": 658,
    "path": "../public/games/super-nintendo-entertainment-system/mortal-kombat-ii/_payload.json"
  },
  "/games/super-nintendo-entertainment-system/nba-hang-time/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"dc6-HnAp0qN0tboAq6fvxUOjw5gF5RI\"",
    "mtime": "2026-01-08T06:14:08.847Z",
    "size": 3526,
    "path": "../public/games/super-nintendo-entertainment-system/nba-hang-time/index.html"
  },
  "/games/super-nintendo-entertainment-system/nba-hang-time/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"299-rjz0etTdLSXj4L0l/pi2O8Guwk4\"",
    "mtime": "2026-01-08T06:14:11.205Z",
    "size": 665,
    "path": "../public/games/super-nintendo-entertainment-system/nba-hang-time/_payload.json"
  },
  "/games/super-nintendo-entertainment-system/parodius-da/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"db7-UdOP7MZHyek0889GP0VY6OrvJNk\"",
    "mtime": "2026-01-08T06:14:08.903Z",
    "size": 3511,
    "path": "../public/games/super-nintendo-entertainment-system/parodius-da/index.html"
  },
  "/games/super-nintendo-entertainment-system/parodius-da/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"28f-28ePIYMc+J2qVdLO9IWUqWM3Wq4\"",
    "mtime": "2026-01-08T06:14:11.259Z",
    "size": 655,
    "path": "../public/games/super-nintendo-entertainment-system/parodius-da/_payload.json"
  },
  "/games/super-nintendo-entertainment-system/simpsons-barts-nightmare/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"e29-XH/20iTs09qJKHU0CrjtbGnJz9E\"",
    "mtime": "2026-01-08T06:14:09.381Z",
    "size": 3625,
    "path": "../public/games/super-nintendo-entertainment-system/simpsons-barts-nightmare/index.html"
  },
  "/games/super-nintendo-entertainment-system/simpsons-barts-nightmare/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"2a4-rSYzL5ahEPnV8J8h+4Wmpkk3mw4\"",
    "mtime": "2026-01-08T06:14:11.433Z",
    "size": 676,
    "path": "../public/games/super-nintendo-entertainment-system/simpsons-barts-nightmare/_payload.json"
  },
  "/games/super-nintendo-entertainment-system/space-megaforce/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"dd2-CvvTGqMa8O9W8GrteOflDPWYUrs\"",
    "mtime": "2026-01-08T06:14:09.570Z",
    "size": 3538,
    "path": "../public/games/super-nintendo-entertainment-system/space-megaforce/index.html"
  },
  "/games/super-nintendo-entertainment-system/space-megaforce/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"29b-o2E/sijVtmH83eyvfXTf+4y3+O4\"",
    "mtime": "2026-01-08T06:14:11.496Z",
    "size": 667,
    "path": "../public/games/super-nintendo-entertainment-system/space-megaforce/_payload.json"
  },
  "/games/super-nintendo-entertainment-system/spankys-quest/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"dd6-tQUSDZ5j33m4+iIo7eMrW2U/ZkI\"",
    "mtime": "2026-01-08T06:14:09.477Z",
    "size": 3542,
    "path": "../public/games/super-nintendo-entertainment-system/spankys-quest/index.html"
  },
  "/games/super-nintendo-entertainment-system/spankys-quest/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"294-FAJAqdgw6FZZ2hsocfWniiebasQ\"",
    "mtime": "2026-01-08T06:14:11.467Z",
    "size": 660,
    "path": "../public/games/super-nintendo-entertainment-system/spankys-quest/_payload.json"
  },
  "/games/super-nintendo-entertainment-system/star-fox/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"da2-Ccf24r+Ap6I1R4UydhLdBWXoWNU\"",
    "mtime": "2026-01-08T06:14:09.515Z",
    "size": 3490,
    "path": "../public/games/super-nintendo-entertainment-system/star-fox/index.html"
  },
  "/games/super-nintendo-entertainment-system/star-fox/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"28a-OGSTsWNzGu9DMWqHH0ptHUvRMrE\"",
    "mtime": "2026-01-08T06:14:11.467Z",
    "size": 650,
    "path": "../public/games/super-nintendo-entertainment-system/star-fox/_payload.json"
  },
  "/games/super-nintendo-entertainment-system/street-fighter-ii-turbo/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"dfc-co307oJJijvEKML/hQ5Zs5Rhddg\"",
    "mtime": "2026-01-08T06:14:09.597Z",
    "size": 3580,
    "path": "../public/games/super-nintendo-entertainment-system/street-fighter-ii-turbo/index.html"
  },
  "/games/super-nintendo-entertainment-system/street-fighter-ii-turbo/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"29a-QCiyIEMsIXHaBWBmL2Wme4cjU3g\"",
    "mtime": "2026-01-08T06:14:11.496Z",
    "size": 666,
    "path": "../public/games/super-nintendo-entertainment-system/street-fighter-ii-turbo/_payload.json"
  },
  "/games/super-nintendo-entertainment-system/super-castlevania-iv/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"dea-+PPvy8kAj7oDjMag9fZsDXWNZ9w\"",
    "mtime": "2026-01-08T06:14:09.694Z",
    "size": 3562,
    "path": "../public/games/super-nintendo-entertainment-system/super-castlevania-iv/index.html"
  },
  "/games/super-nintendo-entertainment-system/super-castlevania-iv/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"297-/kni/JWPY6k1je79LzR/pMXiUQQ\"",
    "mtime": "2026-01-08T06:14:11.530Z",
    "size": 663,
    "path": "../public/games/super-nintendo-entertainment-system/super-castlevania-iv/_payload.json"
  },
  "/games/super-nintendo-entertainment-system/super-mario-all-stars/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"e43-Ww2w0iYsimIYwsOzQH+hTxDD5WM\"",
    "mtime": "2026-01-08T06:14:09.619Z",
    "size": 3651,
    "path": "../public/games/super-nintendo-entertainment-system/super-mario-all-stars/index.html"
  },
  "/games/super-nintendo-entertainment-system/super-mario-all-stars/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"2b1-cM29uFS1vSz5dwTqBJ1DD5L5BrU\"",
    "mtime": "2026-01-08T06:14:11.511Z",
    "size": 689,
    "path": "../public/games/super-nintendo-entertainment-system/super-mario-all-stars/_payload.json"
  },
  "/games/super-nintendo-entertainment-system/super-mario-kart/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"dd2-6usGDO6U0c0sCppOLhRGJfqx2Zg\"",
    "mtime": "2026-01-08T06:14:09.636Z",
    "size": 3538,
    "path": "../public/games/super-nintendo-entertainment-system/super-mario-kart/index.html"
  },
  "/games/super-nintendo-entertainment-system/super-mario-kart/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"293-IxTIOBECL9Sw6Dadba27Op/nkQ4\"",
    "mtime": "2026-01-08T06:14:11.511Z",
    "size": 659,
    "path": "../public/games/super-nintendo-entertainment-system/super-mario-kart/_payload.json"
  },
  "/games/super-nintendo-entertainment-system/super-mario-rpg/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"dcc-xMip1v0Y1e2GpYi7OsJIiFg6eS0\"",
    "mtime": "2026-01-08T06:14:09.650Z",
    "size": 3532,
    "path": "../public/games/super-nintendo-entertainment-system/super-mario-rpg/index.html"
  },
  "/games/super-nintendo-entertainment-system/super-mario-rpg/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"292-auJFLBibQImPzuScEo2gx2FDPKY\"",
    "mtime": "2026-01-08T06:14:11.530Z",
    "size": 658,
    "path": "../public/games/super-nintendo-entertainment-system/super-mario-rpg/_payload.json"
  },
  "/games/super-nintendo-entertainment-system/super-mario-world/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"ffb-P60kg7yooyK4+iuXIGeXbEaZ4mY\"",
    "mtime": "2026-01-08T06:14:09.649Z",
    "size": 4091,
    "path": "../public/games/super-nintendo-entertainment-system/super-mario-world/index.html"
  },
  "/games/super-nintendo-entertainment-system/super-mario-world/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"3d9-KemEohumu7CJoF+xUuAhfiSSmcg\"",
    "mtime": "2026-01-08T06:14:11.529Z",
    "size": 985,
    "path": "../public/games/super-nintendo-entertainment-system/super-mario-world/_payload.json"
  },
  "/games/super-nintendo-entertainment-system/super-mario-world-2-yoshis-island/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"e4a-itPxsNuBqL6Jd55LU7x+8VykM5E\"",
    "mtime": "2026-01-08T06:14:09.756Z",
    "size": 3658,
    "path": "../public/games/super-nintendo-entertainment-system/super-mario-world-2-yoshis-island/index.html"
  },
  "/games/super-nintendo-entertainment-system/super-mario-world-2-yoshis-island/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"2a6-y8eEnzYf68JnObkvEw+UuaD7Sr4\"",
    "mtime": "2026-01-08T06:14:11.549Z",
    "size": 678,
    "path": "../public/games/super-nintendo-entertainment-system/super-mario-world-2-yoshis-island/_payload.json"
  },
  "/games/super-nintendo-entertainment-system/super-ninja-boy/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"dd2-jQ63FkuooVonIczghW7vOrlXfvc\"",
    "mtime": "2026-01-08T06:14:09.694Z",
    "size": 3538,
    "path": "../public/games/super-nintendo-entertainment-system/super-ninja-boy/index.html"
  },
  "/games/super-nintendo-entertainment-system/super-ninja-boy/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"27e-iEdKJoXSVsXkhHloMWXDwXfEgTQ\"",
    "mtime": "2026-01-08T06:14:11.548Z",
    "size": 638,
    "path": "../public/games/super-nintendo-entertainment-system/super-ninja-boy/_payload.json"
  },
  "/games/super-nintendo-entertainment-system/super-r-type/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"dba-nhcB/Sko6jUrtN8x3NgQDdw/2YI\"",
    "mtime": "2026-01-08T06:14:09.703Z",
    "size": 3514,
    "path": "../public/games/super-nintendo-entertainment-system/super-r-type/index.html"
  },
  "/games/super-nintendo-entertainment-system/super-r-type/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"28f-0FTs7AYA2vlUu5OoQBAggKbXW+s\"",
    "mtime": "2026-01-08T06:14:11.548Z",
    "size": 655,
    "path": "../public/games/super-nintendo-entertainment-system/super-r-type/_payload.json"
  },
  "/games/super-nintendo-entertainment-system/teenage-mutant-ninja-turtles-iv-turtles-in-time/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"ef8-SlalgDJbXIJ7gBkvM41FlKvuscc\"",
    "mtime": "2026-01-08T06:14:09.772Z",
    "size": 3832,
    "path": "../public/games/super-nintendo-entertainment-system/teenage-mutant-ninja-turtles-iv-turtles-in-time/index.html"
  },
  "/games/super-nintendo-entertainment-system/teenage-mutant-ninja-turtles-iv-turtles-in-time/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"2e3-J8vy+EQr498ZTnnIBvVosz8cd5E\"",
    "mtime": "2026-01-08T06:14:11.585Z",
    "size": 739,
    "path": "../public/games/super-nintendo-entertainment-system/teenage-mutant-ninja-turtles-iv-turtles-in-time/_payload.json"
  },
  "/games/super-nintendo-entertainment-system/ultimate-mortal-kombat-3/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"e02-tR+cBWSbiyv7jeNq0sW1iWKyMKs\"",
    "mtime": "2026-01-08T06:14:09.905Z",
    "size": 3586,
    "path": "../public/games/super-nintendo-entertainment-system/ultimate-mortal-kombat-3/index.html"
  },
  "/games/super-nintendo-entertainment-system/ultimate-mortal-kombat-3/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"29b-3EhXXHDiquV1x7+cvCJmpnEEH5w\"",
    "mtime": "2026-01-08T06:14:11.632Z",
    "size": 667,
    "path": "../public/games/super-nintendo-entertainment-system/ultimate-mortal-kombat-3/_payload.json"
  },
  "/games/super-nintendo-entertainment-system/un-squadron/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"e6c-9szC3zOe6ks7FV0sLMVWrZ0rAj4\"",
    "mtime": "2026-01-08T06:14:09.878Z",
    "size": 3692,
    "path": "../public/games/super-nintendo-entertainment-system/un-squadron/index.html"
  },
  "/games/super-nintendo-entertainment-system/un-squadron/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"2ed-Mkp3nx6YnpaUDmLQxNtFMesz6UU\"",
    "mtime": "2026-01-08T06:14:11.613Z",
    "size": 749,
    "path": "../public/games/super-nintendo-entertainment-system/un-squadron/_payload.json"
  },
  "/games/super-nintendo-entertainment-system/ys-iii-wanderers-from-ys/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"e0a-QkS/ny1D0phZK8CN5JB49NGa6WE\"",
    "mtime": "2026-01-08T06:14:10.001Z",
    "size": 3594,
    "path": "../public/games/super-nintendo-entertainment-system/ys-iii-wanderers-from-ys/index.html"
  },
  "/games/super-nintendo-entertainment-system/ys-iii-wanderers-from-ys/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"29f-8/vPjWEVdve4vSFk77xrM4MxXkA\"",
    "mtime": "2026-01-08T06:14:11.675Z",
    "size": 671,
    "path": "../public/games/super-nintendo-entertainment-system/ys-iii-wanderers-from-ys/_payload.json"
  },
  "/games/switch/binding-of-isaac-afterbirth-the/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d69-3yzKv0XoJtHqxVRzvUeqsA99oS0\"",
    "mtime": "2026-01-08T06:14:06.968Z",
    "size": 3433,
    "path": "../public/games/switch/binding-of-isaac-afterbirth-the/index.html"
  },
  "/games/switch/binding-of-isaac-afterbirth-the/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"269-xiiwJfv9mTsLDQ2nl/jueMZihK4\"",
    "mtime": "2026-01-08T06:14:10.521Z",
    "size": 617,
    "path": "../public/games/switch/binding-of-isaac-afterbirth-the/_payload.json"
  },
  "/games/switch/caladrius-blaze/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d01-oFmOs4FI4bidOKiaVTZIzLCngZ0\"",
    "mtime": "2026-01-08T06:14:06.977Z",
    "size": 3329,
    "path": "../public/games/switch/caladrius-blaze/index.html"
  },
  "/games/switch/caladrius-blaze/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"256-9d+p8ZQ2CsBHWUfAwjn/IT97w8U\"",
    "mtime": "2026-01-08T06:14:10.538Z",
    "size": 598,
    "path": "../public/games/switch/caladrius-blaze/_payload.json"
  },
  "/games/switch/carrion/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"cd7-uf8ZgQll4eLxNoSbMHoiUuHwLCs\"",
    "mtime": "2026-01-08T06:14:06.977Z",
    "size": 3287,
    "path": "../public/games/switch/carrion/index.html"
  },
  "/games/switch/carrion/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"251-drCdiR7G849opGdUGz/AXy8EE3Q\"",
    "mtime": "2026-01-08T06:14:10.538Z",
    "size": 593,
    "path": "../public/games/switch/carrion/_payload.json"
  },
  "/games/switch/collection-of-mana/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d19-N+fl5mVBuFrRvYvnf0f9f9wGT3E\"",
    "mtime": "2026-01-08T06:14:07.242Z",
    "size": 3353,
    "path": "../public/games/switch/collection-of-mana/index.html"
  },
  "/games/switch/collection-of-mana/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25d-E0yxSVhmJ4sbyhkyTRkKVKz0QV8\"",
    "mtime": "2026-01-08T06:14:10.584Z",
    "size": 605,
    "path": "../public/games/switch/collection-of-mana/_payload.json"
  },
  "/games/switch/dark-souls-remastered/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d73-UkghKj04NVPzMrdvOsPoBfSr9w0\"",
    "mtime": "2026-01-08T06:14:07.250Z",
    "size": 3443,
    "path": "../public/games/switch/dark-souls-remastered/index.html"
  },
  "/games/switch/dark-souls-remastered/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"271-pE58bVz88B4eU44hUMVwpnkuePM\"",
    "mtime": "2026-01-08T06:14:10.602Z",
    "size": 625,
    "path": "../public/games/switch/dark-souls-remastered/_payload.json"
  },
  "/games/switch/dead-cells/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"ce3-u7vSldPGgDWuh5LRRU7Vrznh1f8\"",
    "mtime": "2026-01-08T06:14:07.250Z",
    "size": 3299,
    "path": "../public/games/switch/dead-cells/index.html"
  },
  "/games/switch/dead-cells/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"252-81U/oO12jO5Lxs/2y2+OFuJtWYg\"",
    "mtime": "2026-01-08T06:14:10.617Z",
    "size": 594,
    "path": "../public/games/switch/dead-cells/_payload.json"
  },
  "/games/switch/disgaea-1-complete/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d19-YhUmMbb89MgWOqQ4fq81tJxvU/g\"",
    "mtime": "2026-01-08T06:14:07.351Z",
    "size": 3353,
    "path": "../public/games/switch/disgaea-1-complete/index.html"
  },
  "/games/switch/disgaea-1-complete/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25d-i6inggKJx6BabAOO40AUKhToC7k\"",
    "mtime": "2026-01-08T06:14:10.664Z",
    "size": 605,
    "path": "../public/games/switch/disgaea-1-complete/_payload.json"
  },
  "/games/switch/dragon-quest-xi/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d07-XqCcnjvv9BUKUl9vzFpjMcQdXBI\"",
    "mtime": "2026-01-08T06:14:07.522Z",
    "size": 3335,
    "path": "../public/games/switch/dragon-quest-xi/index.html"
  },
  "/games/switch/dragon-quest-xi/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25a-AQxFH+vuYcQsG1oB5fjdUA/lc7Y\"",
    "mtime": "2026-01-08T06:14:10.698Z",
    "size": 602,
    "path": "../public/games/switch/dragon-quest-xi/_payload.json"
  },
  "/games/switch/elder-scrolls-v-skyrim-the/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"db8-SxDwsaQCNk6nEQHB1uYoac0YCV0\"",
    "mtime": "2026-01-08T06:14:07.531Z",
    "size": 3512,
    "path": "../public/games/switch/elder-scrolls-v-skyrim-the/index.html"
  },
  "/games/switch/elder-scrolls-v-skyrim-the/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"29a-aI/gcoSdc7bAcD6cvob8LPIptPs\"",
    "mtime": "2026-01-08T06:14:10.754Z",
    "size": 666,
    "path": "../public/games/switch/elder-scrolls-v-skyrim-the/_payload.json"
  },
  "/games/switch/end-is-nigh-the/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d04-CRKkuXoYw8CS1lPt0+jgQLLJwcE\"",
    "mtime": "2026-01-08T06:14:07.531Z",
    "size": 3332,
    "path": "../public/games/switch/end-is-nigh-the/index.html"
  },
  "/games/switch/end-is-nigh-the/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"258-P+IcGLf+1mW1u79gZh1TdKdj+fQ\"",
    "mtime": "2026-01-08T06:14:10.754Z",
    "size": 600,
    "path": "../public/games/switch/end-is-nigh-the/_payload.json"
  },
  "/games/switch/final-fantasy-xii-the-zodiac-age-switch/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d84-OewCOtdphD24cFaJd3SMQ2s4Vzc\"",
    "mtime": "2026-01-08T06:14:07.807Z",
    "size": 3460,
    "path": "../public/games/switch/final-fantasy-xii-the-zodiac-age-switch/index.html"
  },
  "/games/switch/final-fantasy-xii-the-zodiac-age-switch/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"26c-zBXQtZdZ1jafvnxrCKMbUlIn4BE\"",
    "mtime": "2026-01-08T06:14:10.854Z",
    "size": 620,
    "path": "../public/games/switch/final-fantasy-xii-the-zodiac-age-switch/_payload.json"
  },
  "/games/switch/hades/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"cc5-H+vSKpTCX0AYch0u18ls5An5fnI\"",
    "mtime": "2026-01-08T06:14:08.066Z",
    "size": 3269,
    "path": "../public/games/switch/hades/index.html"
  },
  "/games/switch/hades/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"24d-hredqLwvCyg9CPhGT6Ch3THztYc\"",
    "mtime": "2026-01-08T06:14:10.902Z",
    "size": 589,
    "path": "../public/games/switch/hades/_payload.json"
  },
  "/games/switch/hollow-knight/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"cfb-gaaJv7OEUtrdJD1qFUtNz0D27VA\"",
    "mtime": "2026-01-08T06:14:08.081Z",
    "size": 3323,
    "path": "../public/games/switch/hollow-knight/index.html"
  },
  "/games/switch/hollow-knight/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"257-DbHaOIae9/EVZZ0Ei6m2peazDnE\"",
    "mtime": "2026-01-08T06:14:10.943Z",
    "size": 599,
    "path": "../public/games/switch/hollow-knight/_payload.json"
  },
  "/games/switch/hyrule-warriors-age-of-calamity/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d63-/QoTd3TyvMVEsJgw1oebTDacYco\"",
    "mtime": "2026-01-08T06:14:08.083Z",
    "size": 3427,
    "path": "../public/games/switch/hyrule-warriors-age-of-calamity/index.html"
  },
  "/games/switch/hyrule-warriors-age-of-calamity/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"268-bC0b0pmbG9wH+ZTF1DoXWazIdTM\"",
    "mtime": "2026-01-08T06:14:10.944Z",
    "size": 616,
    "path": "../public/games/switch/hyrule-warriors-age-of-calamity/_payload.json"
  },
  "/games/switch/katamari-reroll/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d07-m+6KeeQeUy1fVFW+IYo+M9HyZ/E\"",
    "mtime": "2026-01-08T06:14:08.309Z",
    "size": 3335,
    "path": "../public/games/switch/katamari-reroll/index.html"
  },
  "/games/switch/katamari-reroll/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25a-mNPEgQhrHKxScsuqaxP4Arl1zlY\"",
    "mtime": "2026-01-08T06:14:10.996Z",
    "size": 602,
    "path": "../public/games/switch/katamari-reroll/_payload.json"
  },
  "/games/switch/legend-of-zelda-breath-of-the-wild/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d75-trXHW1DZ2Na9P3gRaG0lHp5nuCc\"",
    "mtime": "2026-01-08T06:14:08.322Z",
    "size": 3445,
    "path": "../public/games/switch/legend-of-zelda-breath-of-the-wild/index.html"
  },
  "/games/switch/legend-of-zelda-breath-of-the-wild/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"26b-KzWd9GvbOGIR+WUXbOqvnH/k8dM\"",
    "mtime": "2026-01-08T06:14:11.011Z",
    "size": 619,
    "path": "../public/games/switch/legend-of-zelda-breath-of-the-wild/_payload.json"
  },
  "/games/switch/minit/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"ccd-zpUg8LDX+ygUjAjJnP+mVGLlkP8\"",
    "mtime": "2026-01-08T06:14:08.788Z",
    "size": 3277,
    "path": "../public/games/switch/minit/index.html"
  },
  "/games/switch/minit/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"251-lJgWi9mM0YmK3F2dPhC6YUc7I4M\"",
    "mtime": "2026-01-08T06:14:11.176Z",
    "size": 593,
    "path": "../public/games/switch/minit/_payload.json"
  },
  "/games/switch/mario-kart-8-deluxe/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d19-X5hwKMy2J47HUw0YrqO5+yjrjko\"",
    "mtime": "2026-01-08T06:14:08.615Z",
    "size": 3353,
    "path": "../public/games/switch/mario-kart-8-deluxe/index.html"
  },
  "/games/switch/mario-kart-8-deluxe/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25b-wmKl752m2kzEn4erHp6DkUn5VmY\"",
    "mtime": "2026-01-08T06:14:11.126Z",
    "size": 603,
    "path": "../public/games/switch/mario-kart-8-deluxe/_payload.json"
  },
  "/games/switch/my-hero-ones-justice/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d37-Utyhu4zMHh1PLITWp21vkEYSXIY\"",
    "mtime": "2026-01-08T06:14:08.847Z",
    "size": 3383,
    "path": "../public/games/switch/my-hero-ones-justice/index.html"
  },
  "/games/switch/my-hero-ones-justice/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"261-FjAqCn/9z+DDH2GGCCa6tzpQyYU\"",
    "mtime": "2026-01-08T06:14:11.224Z",
    "size": 609,
    "path": "../public/games/switch/my-hero-ones-justice/_payload.json"
  },
  "/games/switch/new-pokemon-snap/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d0f-IQfiJ04MjVla4k5kee4/Yd8KNwk\"",
    "mtime": "2026-01-08T06:14:08.847Z",
    "size": 3343,
    "path": "../public/games/switch/new-pokemon-snap/index.html"
  },
  "/games/switch/new-pokemon-snap/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25c-sJHLXwWqWamCXH1OnPgVpJp4Oz0\"",
    "mtime": "2026-01-08T06:14:11.205Z",
    "size": 604,
    "path": "../public/games/switch/new-pokemon-snap/_payload.json"
  },
  "/games/switch/okami-switch/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"ce2-IbcFE0xlYdyULU/sRLg/dAIzrUs\"",
    "mtime": "2026-01-08T06:14:08.866Z",
    "size": 3298,
    "path": "../public/games/switch/okami-switch/index.html"
  },
  "/games/switch/okami-switch/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"251-gUb0d1VslttiuvJXsZZFQVuMMSo\"",
    "mtime": "2026-01-08T06:14:11.224Z",
    "size": 593,
    "path": "../public/games/switch/okami-switch/_payload.json"
  },
  "/games/switch/pokemon-shield/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"cfb-ec/RLkklXT1H331NDRBhoVDYhC8\"",
    "mtime": "2026-01-08T06:14:08.998Z",
    "size": 3323,
    "path": "../public/games/switch/pokemon-shield/index.html"
  },
  "/games/switch/pokemon-shield/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"256-yfuPd5DmfEGiqQbgaVJv49Mkzw8\"",
    "mtime": "2026-01-08T06:14:11.291Z",
    "size": 598,
    "path": "../public/games/switch/pokemon-shield/_payload.json"
  },
  "/games/switch/pokemon-sword/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"cf5-gXsQYIpKbnvaNyHIMWAtP/LlIbQ\"",
    "mtime": "2026-01-08T06:14:09.121Z",
    "size": 3317,
    "path": "../public/games/switch/pokemon-sword/index.html"
  },
  "/games/switch/pokemon-sword/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"255-cEyQnDqZ37Cjsen1iae8tle4O5U\"",
    "mtime": "2026-01-08T06:14:11.304Z",
    "size": 597,
    "path": "../public/games/switch/pokemon-sword/_payload.json"
  },
  "/games/switch/resident-evil-revelations-collection/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d7f-vjjJlEYodh7IL7Af2Ti+quL74Kw\"",
    "mtime": "2026-01-08T06:14:09.144Z",
    "size": 3455,
    "path": "../public/games/switch/resident-evil-revelations-collection/index.html"
  },
  "/games/switch/resident-evil-revelations-collection/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"26c-upNpsX3bmrFUDJqHVFv1cWVGBoI\"",
    "mtime": "2026-01-08T06:14:11.340Z",
    "size": 620,
    "path": "../public/games/switch/resident-evil-revelations-collection/_payload.json"
  },
  "/games/switch/ring-fit-adventure/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d1b-97QXY8/7uHeRKMDGv233kO+9thE\"",
    "mtime": "2026-01-08T06:14:09.264Z",
    "size": 3355,
    "path": "../public/games/switch/ring-fit-adventure/index.html"
  },
  "/games/switch/ring-fit-adventure/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25e-WVh5X8j1TQEHtYkURSFtynEKYhw\"",
    "mtime": "2026-01-08T06:14:11.382Z",
    "size": 606,
    "path": "../public/games/switch/ring-fit-adventure/_payload.json"
  },
  "/games/switch/shikhondo/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"cdd-hjdlevt4+4CRmuz7MROp2zirkWk\"",
    "mtime": "2026-01-08T06:14:09.321Z",
    "size": 3293,
    "path": "../public/games/switch/shikhondo/index.html"
  },
  "/games/switch/shikhondo/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"251-u+yIJjjPURLCav0Fl4dfAZf3v7w\"",
    "mtime": "2026-01-08T06:14:11.398Z",
    "size": 593,
    "path": "../public/games/switch/shikhondo/_payload.json"
  },
  "/games/switch/shin-megami-tensei-v/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d25-TLdxfTSxHjnDOtKyURs2+Zlz4CQ\"",
    "mtime": "2026-01-08T06:14:09.361Z",
    "size": 3365,
    "path": "../public/games/switch/shin-megami-tensei-v/index.html"
  },
  "/games/switch/shin-megami-tensei-v/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25f-npugIlr8VZY0nImd1h48mAO6m1s\"",
    "mtime": "2026-01-08T06:14:11.398Z",
    "size": 607,
    "path": "../public/games/switch/shin-megami-tensei-v/_payload.json"
  },
  "/games/switch/south-park-the-fractured-but-whole/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d7b-X68+NfCRmTYkes6PDfDdh2mZFDQ\"",
    "mtime": "2026-01-08T06:14:09.458Z",
    "size": 3451,
    "path": "../public/games/switch/south-park-the-fractured-but-whole/index.html"
  },
  "/games/switch/south-park-the-fractured-but-whole/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"26e-fxxFRSghPlZNSL8MHzJ5VnUW/As\"",
    "mtime": "2026-01-08T06:14:11.467Z",
    "size": 622,
    "path": "../public/games/switch/south-park-the-fractured-but-whole/_payload.json"
  },
  "/games/switch/super-mario-3d-all-stars/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d3f-6f4upq0V9ZkePTXCpBT8Yv849OU\"",
    "mtime": "2026-01-08T06:14:09.619Z",
    "size": 3391,
    "path": "../public/games/switch/super-mario-3d-all-stars/index.html"
  },
  "/games/switch/super-mario-3d-all-stars/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"264-b/Hgel4yKu1ck/hAEdrHL//BoHs\"",
    "mtime": "2026-01-08T06:14:11.496Z",
    "size": 612,
    "path": "../public/games/switch/super-mario-3d-all-stars/_payload.json"
  },
  "/games/switch/super-mario-3d-world-bowsers-fury/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d83-d6rtZLAhtxYqC2DntUsBUlnLuSM\"",
    "mtime": "2026-01-08T06:14:09.619Z",
    "size": 3459,
    "path": "../public/games/switch/super-mario-3d-world-bowsers-fury/index.html"
  },
  "/games/switch/super-mario-3d-world-bowsers-fury/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"26c-eXXilm0z71pITs+XSi0nEtFxE/8\"",
    "mtime": "2026-01-08T06:14:11.511Z",
    "size": 620,
    "path": "../public/games/switch/super-mario-3d-world-bowsers-fury/_payload.json"
  },
  "/games/switch/super-meat-boy/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"cfb-jAVSGurabl4t1Y2s07eb5MikdA4\"",
    "mtime": "2026-01-08T06:14:09.662Z",
    "size": 3323,
    "path": "../public/games/switch/super-meat-boy/index.html"
  },
  "/games/switch/super-meat-boy/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"256-fSMaUeBgcaE95klWHWDQ3C5qgKY\"",
    "mtime": "2026-01-08T06:14:11.529Z",
    "size": 598,
    "path": "../public/games/switch/super-meat-boy/_payload.json"
  },
  "/games/switch/super-mario-odyssey/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d19-hIYsNwQjG8DI+GcJ1I+ljfYcHlo\"",
    "mtime": "2026-01-08T06:14:09.649Z",
    "size": 3353,
    "path": "../public/games/switch/super-mario-odyssey/index.html"
  },
  "/games/switch/super-mario-odyssey/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25b-J2oRMNSnysdsWVqJK3iCO8FH1rk\"",
    "mtime": "2026-01-08T06:14:11.530Z",
    "size": 603,
    "path": "../public/games/switch/super-mario-odyssey/_payload.json"
  },
  "/games/switch/super-smash-bros-ultimate/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d40-O3j4OAOfcMh+hjJ8KRiYU/GI99I\"",
    "mtime": "2026-01-08T06:14:09.740Z",
    "size": 3392,
    "path": "../public/games/switch/super-smash-bros-ultimate/index.html"
  },
  "/games/switch/super-smash-bros-ultimate/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"262-sSDhM1EmNeUS0e13u6ivyFhg7Jg\"",
    "mtime": "2026-01-08T06:14:11.548Z",
    "size": 610,
    "path": "../public/games/switch/super-smash-bros-ultimate/_payload.json"
  },
  "/games/switch/tony-hawks-pro-skater-1-2/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d53-o8Qqim4lpR//7ctkfUvLMLMJbuY\"",
    "mtime": "2026-01-08T06:14:09.860Z",
    "size": 3411,
    "path": "../public/games/switch/tony-hawks-pro-skater-1-2/index.html"
  },
  "/games/switch/tony-hawks-pro-skater-1-2/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"26b-QGKcKW+psdxHICJuVHzTYDg8GUI\"",
    "mtime": "2026-01-08T06:14:11.600Z",
    "size": 619,
    "path": "../public/games/switch/tony-hawks-pro-skater-1-2/_payload.json"
  },
  "/games/switch/ys-ix-monstrum-nox/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d1d-YJtsn1Qf9xv3Oxm2+SfLJdRY0TA\"",
    "mtime": "2026-01-08T06:14:10.003Z",
    "size": 3357,
    "path": "../public/games/switch/ys-ix-monstrum-nox/index.html"
  },
  "/games/switch/ys-ix-monstrum-nox/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25f-QyZFI0shZ4jEqTSKaHnrFEt9VDE\"",
    "mtime": "2026-01-08T06:14:11.698Z",
    "size": 607,
    "path": "../public/games/switch/ys-ix-monstrum-nox/_payload.json"
  },
  "/games/wii/donkey-kong-country-returns/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d3a-A1ae7cz1SKjm5DBlYKikAoCIbfg\"",
    "mtime": "2026-01-08T06:14:07.590Z",
    "size": 3386,
    "path": "../public/games/wii/donkey-kong-country-returns/index.html"
  },
  "/games/wii/donkey-kong-country-returns/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"266-gHtxefrhe4tzYBxrwInxnvO6dTs\"",
    "mtime": "2026-01-08T06:14:10.754Z",
    "size": 614,
    "path": "../public/games/wii/donkey-kong-country-returns/_payload.json"
  },
  "/games/wii/house-of-the-dead-2-and-3-return-the/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d73-Tqg9+CcRFcaSNpvlF2Z7YmFnT0E\"",
    "mtime": "2026-01-08T06:14:08.081Z",
    "size": 3443,
    "path": "../public/games/wii/house-of-the-dead-2-and-3-return-the/index.html"
  },
  "/games/wii/house-of-the-dead-2-and-3-return-the/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"265-SEzuORSPyC8luoPGhS4DFlmXfXk\"",
    "mtime": "2026-01-08T06:14:10.922Z",
    "size": 613,
    "path": "../public/games/wii/house-of-the-dead-2-and-3-return-the/_payload.json"
  },
  "/games/wii/legend-of-zelda-skyward-sword-the/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d63-DWl2gllFqGD2M+egFvRFAD33Eps\"",
    "mtime": "2026-01-08T06:14:08.463Z",
    "size": 3427,
    "path": "../public/games/wii/legend-of-zelda-skyward-sword-the/index.html"
  },
  "/games/wii/legend-of-zelda-skyward-sword-the/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"267-jH0n9Lf76mAcwTxuAiSrwsepKUg\"",
    "mtime": "2026-01-08T06:14:11.055Z",
    "size": 615,
    "path": "../public/games/wii/legend-of-zelda-skyward-sword-the/_payload.json"
  },
  "/games/wii/resident-evil-4-wii/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"cfe-uIzBN3NuPmmgWO9tRY8smhC7Ato\"",
    "mtime": "2026-01-08T06:14:09.144Z",
    "size": 3326,
    "path": "../public/games/wii/resident-evil-4-wii/index.html"
  },
  "/games/wii/resident-evil-4-wii/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"254-kt5rvcIKg2JOlkc16P6jzswgwhE\"",
    "mtime": "2026-01-08T06:14:11.340Z",
    "size": 596,
    "path": "../public/games/wii/resident-evil-4-wii/_payload.json"
  },
  "/games/wii/resident-evil-the-darkside-chronicles/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d78-DKjKhFe3zaWlFpj8kbFWio+POzg\"",
    "mtime": "2026-01-08T06:14:09.205Z",
    "size": 3448,
    "path": "../public/games/wii/resident-evil-the-darkside-chronicles/index.html"
  },
  "/games/wii/resident-evil-the-darkside-chronicles/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"26b-Kai7vcWpQB8XYFtNSHeS7y3RQbM\"",
    "mtime": "2026-01-08T06:14:11.364Z",
    "size": 619,
    "path": "../public/games/wii/resident-evil-the-darkside-chronicles/_payload.json"
  },
  "/games/wii/resident-evil-the-umbrella-chronicles/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d78-eMUJPS1uEyT9MqFO20UEiGkmsQE\"",
    "mtime": "2026-01-08T06:14:09.197Z",
    "size": 3448,
    "path": "../public/games/wii/resident-evil-the-umbrella-chronicles/index.html"
  },
  "/games/wii/resident-evil-the-umbrella-chronicles/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"26b-vf04/bTRAeOK1SWk4C6OOjcavhw\"",
    "mtime": "2026-01-08T06:14:11.364Z",
    "size": 619,
    "path": "../public/games/wii/resident-evil-the-umbrella-chronicles/_payload.json"
  },
  "/games/wii/sin-and-punishment-star-successor/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d60-xXbFeQlcDjKBN3ziyZ1kgwlcw7M\"",
    "mtime": "2026-01-08T06:14:09.381Z",
    "size": 3424,
    "path": "../public/games/wii/sin-and-punishment-star-successor/index.html"
  },
  "/games/wii/sin-and-punishment-star-successor/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"267-nH6pEG6c/QKZt9vFTMBwFTTFChA\"",
    "mtime": "2026-01-08T06:14:11.433Z",
    "size": 615,
    "path": "../public/games/wii/sin-and-punishment-star-successor/_payload.json"
  },
  "/games/wii/super-mario-galaxy/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"f3d-XmrwDUd2+CxST8A6ckQzO0NkDpo\"",
    "mtime": "2026-01-08T06:14:09.649Z",
    "size": 3901,
    "path": "../public/games/wii/super-mario-galaxy/index.html"
  },
  "/games/wii/super-mario-galaxy/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"459-D4YJ+M/BPBvAsG9iAAn0Vj9zshE\"",
    "mtime": "2026-01-08T06:14:11.529Z",
    "size": 1113,
    "path": "../public/games/wii/super-mario-galaxy/_payload.json"
  },
  "/games/wii/super-mario-galaxy-2/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d10-tb9if1Kw0QBk0nzkd3I4/164Qbc\"",
    "mtime": "2026-01-08T06:14:09.619Z",
    "size": 3344,
    "path": "../public/games/wii/super-mario-galaxy-2/index.html"
  },
  "/games/wii/super-mario-galaxy-2/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"259-A8LJvgX+P2NM4cJrzKtQw0X7kV0\"",
    "mtime": "2026-01-08T06:14:11.511Z",
    "size": 601,
    "path": "../public/games/wii/super-mario-galaxy-2/_payload.json"
  },
  "/games/wii-u/hyrule-warriors/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d00-JK9ckrjC9Gn3LZL1zlRU17VpXZs\"",
    "mtime": "2026-01-08T06:14:08.174Z",
    "size": 3328,
    "path": "../public/games/wii-u/hyrule-warriors/index.html"
  },
  "/games/wii-u/hyrule-warriors/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"259-jA5FqmiGuhSIKvMo2ghO8AR+h1o\"",
    "mtime": "2026-01-08T06:14:10.962Z",
    "size": 601,
    "path": "../public/games/wii-u/hyrule-warriors/_payload.json"
  },
  "/games/wii-u/legend-of-zelda-twilight-princess-hd-the/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d9b-D5ZeD75Q6huzbUDT0DEHPURJJcU\"",
    "mtime": "2026-01-08T06:14:08.463Z",
    "size": 3483,
    "path": "../public/games/wii-u/legend-of-zelda-twilight-princess-hd-the/index.html"
  },
  "/games/wii-u/legend-of-zelda-twilight-princess-hd-the/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"274-PA0G+q6gkBMnd8Rz+zGbBzmyBcw\"",
    "mtime": "2026-01-08T06:14:11.056Z",
    "size": 628,
    "path": "../public/games/wii-u/legend-of-zelda-twilight-princess-hd-the/_payload.json"
  },
  "/games/wii-u/the-legend-of-zelda-the-windwaker-hd/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"d83-0UBlfTWgM2/CoXFaz89n4pNBd3s\"",
    "mtime": "2026-01-08T06:14:08.463Z",
    "size": 3459,
    "path": "../public/games/wii-u/the-legend-of-zelda-the-windwaker-hd/index.html"
  },
  "/games/wii-u/the-legend-of-zelda-the-windwaker-hd/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"26f-IgLHknDn2+nQefIVUKagQ+IL/4Q\"",
    "mtime": "2026-01-08T06:14:11.056Z",
    "size": 623,
    "path": "../public/games/wii-u/the-legend-of-zelda-the-windwaker-hd/_payload.json"
  },
  "/_nuxt/builds/meta/2f16dce3-6d7b-4f60-81d7-04137cf66de1.json": {
    "type": "application/json",
    "etag": "\"6c87-PsbfBm0kqX58+mdoMHUklthWD24\"",
    "mtime": "2026-01-08T06:14:11.793Z",
    "size": 27783,
    "path": "../public/_nuxt/builds/meta/2f16dce3-6d7b-4f60-81d7-04137cf66de1.json"
  }
};

const _DRIVE_LETTER_START_RE = /^[A-Za-z]:\//;
function normalizeWindowsPath(input = "") {
  if (!input) {
    return input;
  }
  return input.replace(/\\/g, "/").replace(_DRIVE_LETTER_START_RE, (r) => r.toUpperCase());
}
const _IS_ABSOLUTE_RE = /^[/\\](?![/\\])|^[/\\]{2}(?!\.)|^[A-Za-z]:[/\\]/;
const _DRIVE_LETTER_RE = /^[A-Za-z]:$/;
function cwd() {
  if (typeof process !== "undefined" && typeof process.cwd === "function") {
    return process.cwd().replace(/\\/g, "/");
  }
  return "/";
}
const resolve = function(...arguments_) {
  arguments_ = arguments_.map((argument) => normalizeWindowsPath(argument));
  let resolvedPath = "";
  let resolvedAbsolute = false;
  for (let index = arguments_.length - 1; index >= -1 && !resolvedAbsolute; index--) {
    const path = index >= 0 ? arguments_[index] : cwd();
    if (!path || path.length === 0) {
      continue;
    }
    resolvedPath = `${path}/${resolvedPath}`;
    resolvedAbsolute = isAbsolute(path);
  }
  resolvedPath = normalizeString(resolvedPath, !resolvedAbsolute);
  if (resolvedAbsolute && !isAbsolute(resolvedPath)) {
    return `/${resolvedPath}`;
  }
  return resolvedPath.length > 0 ? resolvedPath : ".";
};
function normalizeString(path, allowAboveRoot) {
  let res = "";
  let lastSegmentLength = 0;
  let lastSlash = -1;
  let dots = 0;
  let char = null;
  for (let index = 0; index <= path.length; ++index) {
    if (index < path.length) {
      char = path[index];
    } else if (char === "/") {
      break;
    } else {
      char = "/";
    }
    if (char === "/") {
      if (lastSlash === index - 1 || dots === 1) ; else if (dots === 2) {
        if (res.length < 2 || lastSegmentLength !== 2 || res[res.length - 1] !== "." || res[res.length - 2] !== ".") {
          if (res.length > 2) {
            const lastSlashIndex = res.lastIndexOf("/");
            if (lastSlashIndex === -1) {
              res = "";
              lastSegmentLength = 0;
            } else {
              res = res.slice(0, lastSlashIndex);
              lastSegmentLength = res.length - 1 - res.lastIndexOf("/");
            }
            lastSlash = index;
            dots = 0;
            continue;
          } else if (res.length > 0) {
            res = "";
            lastSegmentLength = 0;
            lastSlash = index;
            dots = 0;
            continue;
          }
        }
        if (allowAboveRoot) {
          res += res.length > 0 ? "/.." : "..";
          lastSegmentLength = 2;
        }
      } else {
        if (res.length > 0) {
          res += `/${path.slice(lastSlash + 1, index)}`;
        } else {
          res = path.slice(lastSlash + 1, index);
        }
        lastSegmentLength = index - lastSlash - 1;
      }
      lastSlash = index;
      dots = 0;
    } else if (char === "." && dots !== -1) {
      ++dots;
    } else {
      dots = -1;
    }
  }
  return res;
}
const isAbsolute = function(p) {
  return _IS_ABSOLUTE_RE.test(p);
};
const dirname = function(p) {
  const segments = normalizeWindowsPath(p).replace(/\/$/, "").split("/").slice(0, -1);
  if (segments.length === 1 && _DRIVE_LETTER_RE.test(segments[0])) {
    segments[0] += "/";
  }
  return segments.join("/") || (isAbsolute(p) ? "/" : ".");
};

function readAsset (id) {
  const serverDir = dirname(fileURLToPath(globalThis._importMeta_.url));
  return promises.readFile(resolve(serverDir, assets[id].path))
}

const publicAssetBases = {"/_nuxt/builds/meta/":{"maxAge":31536000},"/_nuxt/builds/":{"maxAge":1},"/_nuxt/":{"maxAge":31536000}};

function isPublicAssetURL(id = '') {
  if (assets[id]) {
    return true
  }
  for (const base in publicAssetBases) {
    if (id.startsWith(base)) { return true }
  }
  return false
}

function getAsset (id) {
  return assets[id]
}

const METHODS = /* @__PURE__ */ new Set(["HEAD", "GET"]);
const EncodingMap = { gzip: ".gz", br: ".br" };
const _oBNMKg = eventHandler((event) => {
  if (event.method && !METHODS.has(event.method)) {
    return;
  }
  let id = decodePath(
    withLeadingSlash(withoutTrailingSlash(parseURL(event.path).pathname))
  );
  let asset;
  const encodingHeader = String(
    getRequestHeader(event, "accept-encoding") || ""
  );
  const encodings = [
    ...encodingHeader.split(",").map((e) => EncodingMap[e.trim()]).filter(Boolean).sort(),
    ""
  ];
  if (encodings.length > 1) {
    appendResponseHeader(event, "Vary", "Accept-Encoding");
  }
  for (const encoding of encodings) {
    for (const _id of [id + encoding, joinURL(id, "index.html" + encoding)]) {
      const _asset = getAsset(_id);
      if (_asset) {
        asset = _asset;
        id = _id;
        break;
      }
    }
  }
  if (!asset) {
    if (isPublicAssetURL(id)) {
      removeResponseHeader(event, "Cache-Control");
      throw createError$1({ statusCode: 404 });
    }
    return;
  }
  const ifNotMatch = getRequestHeader(event, "if-none-match") === asset.etag;
  if (ifNotMatch) {
    setResponseStatus(event, 304, "Not Modified");
    return "";
  }
  const ifModifiedSinceH = getRequestHeader(event, "if-modified-since");
  const mtimeDate = new Date(asset.mtime);
  if (ifModifiedSinceH && asset.mtime && new Date(ifModifiedSinceH) >= mtimeDate) {
    setResponseStatus(event, 304, "Not Modified");
    return "";
  }
  if (asset.type && !getResponseHeader(event, "Content-Type")) {
    setResponseHeader(event, "Content-Type", asset.type);
  }
  if (asset.etag && !getResponseHeader(event, "ETag")) {
    setResponseHeader(event, "ETag", asset.etag);
  }
  if (asset.mtime && !getResponseHeader(event, "Last-Modified")) {
    setResponseHeader(event, "Last-Modified", mtimeDate.toUTCString());
  }
  if (asset.encoding && !getResponseHeader(event, "Content-Encoding")) {
    setResponseHeader(event, "Content-Encoding", asset.encoding);
  }
  if (asset.size > 0 && !getResponseHeader(event, "Content-Length")) {
    setResponseHeader(event, "Content-Length", asset.size);
  }
  return readAsset(id);
});

const _SxA8c9 = defineEventHandler(() => {});

const _lazy_HRgO2K = () => import('../routes/renderer.mjs').then(function (n) { return n.r; });

const handlers = [
  { route: '', handler: _oBNMKg, lazy: false, middleware: true, method: undefined },
  { route: '/__nuxt_error', handler: _lazy_HRgO2K, lazy: true, middleware: false, method: undefined },
  { route: '/__nuxt_island/**', handler: _SxA8c9, lazy: false, middleware: false, method: undefined },
  { route: '/**', handler: _lazy_HRgO2K, lazy: true, middleware: false, method: undefined }
];

function createNitroApp() {
  const config = useRuntimeConfig();
  const hooks = createHooks();
  const captureError = (error, context = {}) => {
    const promise = hooks.callHookParallel("error", error, context).catch((error_) => {
      console.error("Error while capturing another error", error_);
    });
    if (context.event && isEvent(context.event)) {
      const errors = context.event.context.nitro?.errors;
      if (errors) {
        errors.push({ error, context });
      }
      if (context.event.waitUntil) {
        context.event.waitUntil(promise);
      }
    }
  };
  const h3App = createApp({
    debug: destr(false),
    onError: (error, event) => {
      captureError(error, { event, tags: ["request"] });
      return errorHandler(error, event);
    },
    onRequest: async (event) => {
      event.context.nitro = event.context.nitro || { errors: [] };
      const fetchContext = event.node.req?.__unenv__;
      if (fetchContext?._platform) {
        event.context = {
          _platform: fetchContext?._platform,
          // #3335
          ...fetchContext._platform,
          ...event.context
        };
      }
      if (!event.context.waitUntil && fetchContext?.waitUntil) {
        event.context.waitUntil = fetchContext.waitUntil;
      }
      event.fetch = (req, init) => fetchWithEvent(event, req, init, { fetch: localFetch });
      event.$fetch = (req, init) => fetchWithEvent(event, req, init, {
        fetch: $fetch
      });
      event.waitUntil = (promise) => {
        if (!event.context.nitro._waitUntilPromises) {
          event.context.nitro._waitUntilPromises = [];
        }
        event.context.nitro._waitUntilPromises.push(promise);
        if (event.context.waitUntil) {
          event.context.waitUntil(promise);
        }
      };
      event.captureError = (error, context) => {
        captureError(error, { event, ...context });
      };
      await nitroApp.hooks.callHook("request", event).catch((error) => {
        captureError(error, { event, tags: ["request"] });
      });
    },
    onBeforeResponse: async (event, response) => {
      await nitroApp.hooks.callHook("beforeResponse", event, response).catch((error) => {
        captureError(error, { event, tags: ["request", "response"] });
      });
    },
    onAfterResponse: async (event, response) => {
      await nitroApp.hooks.callHook("afterResponse", event, response).catch((error) => {
        captureError(error, { event, tags: ["request", "response"] });
      });
    }
  });
  const router = createRouter({
    preemptive: true
  });
  const nodeHandler = toNodeListener(h3App);
  const localCall = (aRequest) => b(
    nodeHandler,
    aRequest
  );
  const localFetch = (input, init) => {
    if (!input.toString().startsWith("/")) {
      return globalThis.fetch(input, init);
    }
    return C(
      nodeHandler,
      input,
      init
    ).then((response) => normalizeFetchResponse(response));
  };
  const $fetch = createFetch({
    fetch: localFetch,
    Headers: Headers$1,
    defaults: { baseURL: config.app.baseURL }
  });
  globalThis.$fetch = $fetch;
  h3App.use(createRouteRulesHandler({ localFetch }));
  for (const h of handlers) {
    let handler = h.lazy ? lazyEventHandler(h.handler) : h.handler;
    if (h.middleware || !h.route) {
      const middlewareBase = (config.app.baseURL + (h.route || "/")).replace(
        /\/+/g,
        "/"
      );
      h3App.use(middlewareBase, handler);
    } else {
      const routeRules = getRouteRulesForPath(
        h.route.replace(/:\w+|\*\*/g, "_")
      );
      if (routeRules.cache) {
        handler = cachedEventHandler(handler, {
          group: "nitro/routes",
          ...routeRules.cache
        });
      }
      router.use(h.route, handler, h.method);
    }
  }
  h3App.use(config.app.baseURL, router.handler);
  const app = {
    hooks,
    h3App,
    router,
    localCall,
    localFetch,
    captureError
  };
  return app;
}
function runNitroPlugins(nitroApp2) {
  for (const plugin of plugins) {
    try {
      plugin(nitroApp2);
    } catch (error) {
      nitroApp2.captureError(error, { tags: ["plugin"] });
      throw error;
    }
  }
}
const nitroApp = createNitroApp();
function useNitroApp() {
  return nitroApp;
}
runNitroPlugins(nitroApp);

function defineRenderHandler(render) {
  const runtimeConfig = useRuntimeConfig();
  return eventHandler(async (event) => {
    const nitroApp = useNitroApp();
    const ctx = { event, render, response: void 0 };
    await nitroApp.hooks.callHook("render:before", ctx);
    if (!ctx.response) {
      if (event.path === `${runtimeConfig.app.baseURL}favicon.ico`) {
        setResponseHeader(event, "Content-Type", "image/x-icon");
        return send(
          event,
          "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
        );
      }
      ctx.response = await ctx.render(event);
      if (!ctx.response) {
        const _currentStatus = getResponseStatus(event);
        setResponseStatus(event, _currentStatus === 200 ? 500 : _currentStatus);
        return send(
          event,
          "No response returned from render handler: " + event.path
        );
      }
    }
    await nitroApp.hooks.callHook("render:response", ctx.response, ctx);
    if (ctx.response.headers) {
      setResponseHeaders(event, ctx.response.headers);
    }
    if (ctx.response.statusCode || ctx.response.statusMessage) {
      setResponseStatus(
        event,
        ctx.response.statusCode,
        ctx.response.statusMessage
      );
    }
    return ctx.response.body;
  });
}

const debug = (...args) => {
};
function GracefulShutdown(server, opts) {
  opts = opts || {};
  const options = Object.assign(
    {
      signals: "SIGINT SIGTERM",
      timeout: 3e4,
      development: false,
      forceExit: true,
      onShutdown: (signal) => Promise.resolve(signal),
      preShutdown: (signal) => Promise.resolve(signal)
    },
    opts
  );
  let isShuttingDown = false;
  const connections = {};
  let connectionCounter = 0;
  const secureConnections = {};
  let secureConnectionCounter = 0;
  let failed = false;
  let finalRun = false;
  function onceFactory() {
    let called = false;
    return (emitter, events, callback) => {
      function call() {
        if (!called) {
          called = true;
          return Reflect.apply(callback, this, arguments);
        }
      }
      for (const e of events) {
        emitter.on(e, call);
      }
    };
  }
  const signals = options.signals.split(" ").map((s) => s.trim()).filter((s) => s.length > 0);
  const once = onceFactory();
  once(process, signals, (signal) => {
    debug("received shut down signal", signal);
    shutdown(signal).then(() => {
      if (options.forceExit) {
        process.exit(failed ? 1 : 0);
      }
    }).catch((error) => {
      debug("server shut down error occurred", error);
      process.exit(1);
    });
  });
  function isFunction(functionToCheck) {
    const getType = Object.prototype.toString.call(functionToCheck);
    return /^\[object\s([A-Za-z]+)?Function]$/.test(getType);
  }
  function destroy(socket, force = false) {
    if (socket._isIdle && isShuttingDown || force) {
      socket.destroy();
      if (socket.server instanceof http.Server) {
        delete connections[socket._connectionId];
      } else {
        delete secureConnections[socket._connectionId];
      }
    }
  }
  function destroyAllConnections(force = false) {
    debug("Destroy Connections : " + (force ? "forced close" : "close"));
    let counter = 0;
    let secureCounter = 0;
    for (const key of Object.keys(connections)) {
      const socket = connections[key];
      const serverResponse = socket._httpMessage;
      if (serverResponse && !force) {
        if (!serverResponse.headersSent) {
          serverResponse.setHeader("connection", "close");
        }
      } else {
        counter++;
        destroy(socket);
      }
    }
    debug("Connections destroyed : " + counter);
    debug("Connection Counter    : " + connectionCounter);
    for (const key of Object.keys(secureConnections)) {
      const socket = secureConnections[key];
      const serverResponse = socket._httpMessage;
      if (serverResponse && !force) {
        if (!serverResponse.headersSent) {
          serverResponse.setHeader("connection", "close");
        }
      } else {
        secureCounter++;
        destroy(socket);
      }
    }
    debug("Secure Connections destroyed : " + secureCounter);
    debug("Secure Connection Counter    : " + secureConnectionCounter);
  }
  server.on("request", (req, res) => {
    req.socket._isIdle = false;
    if (isShuttingDown && !res.headersSent) {
      res.setHeader("connection", "close");
    }
    res.on("finish", () => {
      req.socket._isIdle = true;
      destroy(req.socket);
    });
  });
  server.on("connection", (socket) => {
    if (isShuttingDown) {
      socket.destroy();
    } else {
      const id = connectionCounter++;
      socket._isIdle = true;
      socket._connectionId = id;
      connections[id] = socket;
      socket.once("close", () => {
        delete connections[socket._connectionId];
      });
    }
  });
  server.on("secureConnection", (socket) => {
    if (isShuttingDown) {
      socket.destroy();
    } else {
      const id = secureConnectionCounter++;
      socket._isIdle = true;
      socket._connectionId = id;
      secureConnections[id] = socket;
      socket.once("close", () => {
        delete secureConnections[socket._connectionId];
      });
    }
  });
  process.on("close", () => {
    debug("closed");
  });
  function shutdown(sig) {
    function cleanupHttp() {
      destroyAllConnections();
      debug("Close http server");
      return new Promise((resolve, reject) => {
        server.close((err) => {
          if (err) {
            return reject(err);
          }
          return resolve(true);
        });
      });
    }
    debug("shutdown signal - " + sig);
    if (options.development) {
      debug("DEV-Mode - immediate forceful shutdown");
      return process.exit(0);
    }
    function finalHandler() {
      if (!finalRun) {
        finalRun = true;
        if (options.finally && isFunction(options.finally)) {
          debug("executing finally()");
          options.finally();
        }
      }
      return Promise.resolve();
    }
    function waitForReadyToShutDown(totalNumInterval) {
      debug(`waitForReadyToShutDown... ${totalNumInterval}`);
      if (totalNumInterval === 0) {
        debug(
          `Could not close connections in time (${options.timeout}ms), will forcefully shut down`
        );
        return Promise.resolve(true);
      }
      const allConnectionsClosed = Object.keys(connections).length === 0 && Object.keys(secureConnections).length === 0;
      if (allConnectionsClosed) {
        debug("All connections closed. Continue to shutting down");
        return Promise.resolve(false);
      }
      debug("Schedule the next waitForReadyToShutdown");
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(waitForReadyToShutDown(totalNumInterval - 1));
        }, 250);
      });
    }
    if (isShuttingDown) {
      return Promise.resolve();
    }
    debug("shutting down");
    return options.preShutdown(sig).then(() => {
      isShuttingDown = true;
      cleanupHttp();
    }).then(() => {
      const pollIterations = options.timeout ? Math.round(options.timeout / 250) : 0;
      return waitForReadyToShutDown(pollIterations);
    }).then((force) => {
      debug("Do onShutdown now");
      if (force) {
        destroyAllConnections(force);
      }
      return options.onShutdown(sig);
    }).then(finalHandler).catch((error) => {
      const errString = typeof error === "string" ? error : JSON.stringify(error);
      debug(errString);
      failed = true;
      throw errString;
    });
  }
  function shutdownManual() {
    return shutdown("manual");
  }
  return shutdownManual;
}

function getGracefulShutdownConfig() {
  return {
    disabled: !!process.env.NITRO_SHUTDOWN_DISABLED,
    signals: (process.env.NITRO_SHUTDOWN_SIGNALS || "SIGTERM SIGINT").split(" ").map((s) => s.trim()),
    timeout: Number.parseInt(process.env.NITRO_SHUTDOWN_TIMEOUT || "", 10) || 3e4,
    forceExit: !process.env.NITRO_SHUTDOWN_NO_FORCE_EXIT
  };
}
function setupGracefulShutdown(listener, nitroApp) {
  const shutdownConfig = getGracefulShutdownConfig();
  if (shutdownConfig.disabled) {
    return;
  }
  GracefulShutdown(listener, {
    signals: shutdownConfig.signals.join(" "),
    timeout: shutdownConfig.timeout,
    forceExit: shutdownConfig.forceExit,
    onShutdown: async () => {
      await new Promise((resolve) => {
        const timeout = setTimeout(() => {
          console.warn("Graceful shutdown timeout, force exiting...");
          resolve();
        }, shutdownConfig.timeout);
        nitroApp.hooks.callHook("close").catch((error) => {
          console.error(error);
        }).finally(() => {
          clearTimeout(timeout);
          resolve();
        });
      });
    }
  });
}

export { $fetch as $, withoutTrailingSlash as A, trapUnhandledNodeErrors as a, useNitroApp as b, getResponseStatus as c, destr as d, defineRenderHandler as e, getQuery as f, getResponseStatusText as g, createError$1 as h, getRouteRules as i, joinRelativeURL as j, hasProtocol as k, isScriptProtocol as l, joinURL as m, sanitizeStatusCode as n, getContext as o, createHooks as p, executeAsync as q, toRouteMatcher as r, setupGracefulShutdown as s, toNodeListener as t, useRuntimeConfig as u, createRouter$1 as v, withQuery as w, defu as x, parseQuery as y, withTrailingSlash as z };
//# sourceMappingURL=nitro.mjs.map

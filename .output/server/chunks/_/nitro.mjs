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
    "buildId": "3be60665-aef4-4503-b459-8215434bcc8f",
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
    "etag": "\"3dd40-P0EBQ9icQCsfWzPfka+SYEckyjQ\"",
    "mtime": "2026-01-08T05:39:02.632Z",
    "size": 253248,
    "path": "../public/index.html"
  },
  "/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"54b-97jEVbuSPObP3nppAu6Ozf4EcKE\"",
    "mtime": "2026-01-08T05:39:02.776Z",
    "size": 1355,
    "path": "../public/_payload.json"
  },
  "/gallery/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"54fa9-7bn15AxvPNcVU6Pi9l8u05M6SnQ\"",
    "mtime": "2026-01-08T05:39:03.534Z",
    "size": 348073,
    "path": "../public/gallery/index.html"
  },
  "/gallery/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"55bc-XQYiqVLj3vGUQAlHBornOBt/tp8\"",
    "mtime": "2026-01-08T05:39:04.344Z",
    "size": 21948,
    "path": "../public/gallery/_payload.json"
  },
  "/games/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"626b8-Lfhz9DnnaOdeA5CIQlp4o7RIst4\"",
    "mtime": "2026-01-08T05:39:04.240Z",
    "size": 403128,
    "path": "../public/games/index.html"
  },
  "/games/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"17c7c-yYUylN4ugNDq1mtkNMo8KOJc1tQ\"",
    "mtime": "2026-01-08T05:39:10.208Z",
    "size": 97404,
    "path": "../public/games/_payload.json"
  },
  "/stats/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3da9e-gCYjCYvZjzhI7b04qg1rLq9a4zY\"",
    "mtime": "2026-01-08T05:39:03.545Z",
    "size": 252574,
    "path": "../public/stats/index.html"
  },
  "/stats/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"a21-M62xn6989eOlSSTZlhwDcTvIo2w\"",
    "mtime": "2026-01-08T05:39:04.399Z",
    "size": 2593,
    "path": "../public/stats/_payload.json"
  },
  "/_nuxt/B7oQHY4k.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"288a-gSO9LebplliXmz6gr/DwhTdgFYM\"",
    "mtime": "2026-01-08T05:38:54.916Z",
    "size": 10378,
    "path": "../public/_nuxt/B7oQHY4k.js"
  },
  "/_nuxt/BDp4s5ML.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"ea6-iIvO76ZH82iQs3y6wlqmD4v+69Y\"",
    "mtime": "2026-01-08T05:38:54.916Z",
    "size": 3750,
    "path": "../public/_nuxt/BDp4s5ML.js"
  },
  "/_nuxt/Bgj-y29-.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"e9c-2zp0j6vMELs9u6KLzOqlxu0dZyU\"",
    "mtime": "2026-01-08T05:38:54.916Z",
    "size": 3740,
    "path": "../public/_nuxt/Bgj-y29-.js"
  },
  "/_nuxt/BQ1wW11r.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"22a30-xA14rg6HthDVloY369ED9gM9xZs\"",
    "mtime": "2026-01-08T05:38:54.916Z",
    "size": 141872,
    "path": "../public/_nuxt/BQ1wW11r.js"
  },
  "/_nuxt/BT_t_JTR.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"13f1-3Cg6fvJgq4uYDvbNGcQDGWmW9pY\"",
    "mtime": "2026-01-08T05:38:54.916Z",
    "size": 5105,
    "path": "../public/_nuxt/BT_t_JTR.js"
  },
  "/_nuxt/Bw4UYVbR.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"7bffc-9NukxNy01TEhGy+j3I7XaI3jQIQ\"",
    "mtime": "2026-01-08T05:38:54.916Z",
    "size": 507900,
    "path": "../public/_nuxt/Bw4UYVbR.js"
  },
  "/_nuxt/CFNkqz9o.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"987-zQ6CPLrFX05oF2i8n5/EhMx/zbc\"",
    "mtime": "2026-01-08T05:38:54.916Z",
    "size": 2439,
    "path": "../public/_nuxt/CFNkqz9o.js"
  },
  "/_nuxt/CQ4thxpi.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"23f-ikxPlQ85Woq6W3xqoMPAGK9otss\"",
    "mtime": "2026-01-08T05:38:54.916Z",
    "size": 575,
    "path": "../public/_nuxt/CQ4thxpi.js"
  },
  "/_nuxt/CQQaGMDr.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"2d6d-Tx6FTp2mxghLVza0noSHFt2Fnss\"",
    "mtime": "2026-01-08T05:38:54.916Z",
    "size": 11629,
    "path": "../public/_nuxt/CQQaGMDr.js"
  },
  "/_nuxt/CwVJMaaF.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"e2b-Yvj3AAW7J037zUXL85Pw0k509kE\"",
    "mtime": "2026-01-08T05:38:54.916Z",
    "size": 3627,
    "path": "../public/_nuxt/CwVJMaaF.js"
  },
  "/_nuxt/D3Fi0JlG.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"d3e-Xm5fxxPVUTBJFaX75Wu4Gl9s2nM\"",
    "mtime": "2026-01-08T05:38:54.916Z",
    "size": 3390,
    "path": "../public/_nuxt/D3Fi0JlG.js"
  },
  "/_nuxt/default.BXKEN6ug.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"ae6-rwX6a94QIu/0uNBDi3WCl162JjY\"",
    "mtime": "2026-01-08T05:38:54.916Z",
    "size": 2790,
    "path": "../public/_nuxt/default.BXKEN6ug.css"
  },
  "/_nuxt/DhULXLPT.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"2102-3IxxDQJkY2h0ixmDOfIfu1kg/iA\"",
    "mtime": "2026-01-08T05:38:54.916Z",
    "size": 8450,
    "path": "../public/_nuxt/DhULXLPT.js"
  },
  "/_nuxt/DY9rp1b1.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"eee-aNJL+pBnzw6Ba2d8+/k5d1l4/lw\"",
    "mtime": "2026-01-08T05:38:54.916Z",
    "size": 3822,
    "path": "../public/_nuxt/DY9rp1b1.js"
  },
  "/_nuxt/El5NK-oV.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"dd0-uS6n7q8HoYPBKLsXALSB6AynL7o\"",
    "mtime": "2026-01-08T05:38:54.916Z",
    "size": 3536,
    "path": "../public/_nuxt/El5NK-oV.js"
  },
  "/_nuxt/entry.ChkhECp8.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"3ba46-7dZRpL1VxutWPEnylF+7rhnxZvQ\"",
    "mtime": "2026-01-08T05:38:54.915Z",
    "size": 244294,
    "path": "../public/_nuxt/entry.ChkhECp8.css"
  },
  "/_nuxt/error-404.CYUhy3y9.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"dca-005xQIrTNdE7LUqKJ7YOCC8lzEw\"",
    "mtime": "2026-01-08T05:38:54.915Z",
    "size": 3530,
    "path": "../public/_nuxt/error-404.CYUhy3y9.css"
  },
  "/_nuxt/error-500.CVLkTsZM.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"75a-W5VxOFBjAs2NvcF8lJBDWJ0iI/o\"",
    "mtime": "2026-01-08T05:38:54.911Z",
    "size": 1882,
    "path": "../public/_nuxt/error-500.CVLkTsZM.css"
  },
  "/_nuxt/index.CyHn1aRg.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"22-UtXnaX8rqwjF3tkR9noME+qjoMo\"",
    "mtime": "2026-01-08T05:38:54.916Z",
    "size": 34,
    "path": "../public/_nuxt/index.CyHn1aRg.css"
  },
  "/_nuxt/lEKn_iO7.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"44c1d-wD0TrEjYdUi5FH94CQzozsMEuys\"",
    "mtime": "2026-01-08T05:38:54.916Z",
    "size": 281629,
    "path": "../public/_nuxt/lEKn_iO7.js"
  },
  "/_nuxt/ListWithFilters.Cc2ZW8cN.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"2b-0tCxq+DVjdWh5gwqrKjsOVQberI\"",
    "mtime": "2026-01-08T05:38:54.916Z",
    "size": 43,
    "path": "../public/_nuxt/ListWithFilters.Cc2ZW8cN.css"
  },
  "/_nuxt/lOV7V0OA.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"12bf-mR94TjvIM7QQprhcG6qGzZcZnlc\"",
    "mtime": "2026-01-08T05:38:54.916Z",
    "size": 4799,
    "path": "../public/_nuxt/lOV7V0OA.js"
  },
  "/_nuxt/Q9jVvtBV.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1bca-E/h7I7v8I8bGgtm0+OEPvJhEG7c\"",
    "mtime": "2026-01-08T05:38:54.916Z",
    "size": 7114,
    "path": "../public/_nuxt/Q9jVvtBV.js"
  },
  "/_nuxt/QQeYT5r9.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"2284-esnKB3itrjuGabQMllefy8EIVAA\"",
    "mtime": "2026-01-08T05:38:54.916Z",
    "size": 8836,
    "path": "../public/_nuxt/QQeYT5r9.js"
  },
  "/_nuxt/RegionIndicator.CkQhoCdG.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"93d-VdiwANxHGskdio8Dgog0+/BIF/g\"",
    "mtime": "2026-01-08T05:38:54.916Z",
    "size": 2365,
    "path": "../public/_nuxt/RegionIndicator.CkQhoCdG.css"
  },
  "/_nuxt/xHQrB4qa.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"10da-dlsZ0eDC0pETvKAjdcQmAqJJ8Y0\"",
    "mtime": "2026-01-08T05:38:54.916Z",
    "size": 4314,
    "path": "../public/_nuxt/xHQrB4qa.js"
  },
  "/_nuxt/_...DZp3ftKL.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"45-g1OAoEyxTcit2Ov6TMObJro/7nE\"",
    "mtime": "2026-01-08T05:38:54.916Z",
    "size": 69,
    "path": "../public/_nuxt/_...DZp3ftKL.css"
  },
  "/_nuxt/_slug_.C7RMBbgc.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"3c-aiWXcEwBA7fEJoHcZC70IfneKMY\"",
    "mtime": "2026-01-08T05:38:54.915Z",
    "size": 60,
    "path": "../public/_nuxt/_slug_.C7RMBbgc.css"
  },
  "/_nuxt/_slug_.DQkueFTY.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"a3-Ys/I7XtMC5seDA6I5SOt5I4/uKI\"",
    "mtime": "2026-01-08T05:38:54.916Z",
    "size": 163,
    "path": "../public/_nuxt/_slug_.DQkueFTY.css"
  },
  "/glog/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3f7f0-PgKsYPXTMP7lhDFY2Ll3lQ3CL+I\"",
    "mtime": "2026-01-08T05:39:03.436Z",
    "size": 260080,
    "path": "../public/glog/index.html"
  },
  "/glog/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"1e2f-6Wp7jjQtKsyp1LixmfaT43ZhjpI\"",
    "mtime": "2026-01-08T05:39:04.285Z",
    "size": 7727,
    "path": "../public/glog/_payload.json"
  },
  "/systems/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e0d0-AmSd2nhOD3Y5YdBtj2Wquv9H4kY\"",
    "mtime": "2026-01-08T05:39:03.354Z",
    "size": 254160,
    "path": "../public/systems/index.html"
  },
  "/systems/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"b7d-wSN9TbQdvJLPOgI3GpkzAH4ezIA\"",
    "mtime": "2026-01-08T05:39:02.981Z",
    "size": 2941,
    "path": "../public/systems/_payload.json"
  },
  "/_nuxt/builds/latest.json": {
    "type": "application/json",
    "etag": "\"47-aBLvOafhGbShuwLJ4RZMl6Ds5s4\"",
    "mtime": "2026-01-08T05:39:11.887Z",
    "size": 71,
    "path": "../public/_nuxt/builds/latest.json"
  },
  "/glog/d-os2-playthrough-part-1/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3df92-OuXSPZUK8FmlVvr3wxj7352ebF0\"",
    "mtime": "2026-01-08T05:39:04.236Z",
    "size": 253842,
    "path": "../public/glog/d-os2-playthrough-part-1/index.html"
  },
  "/glog/d-os2-playthrough-part-1/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"6af-QhNXASmfbJJW5BbuIvOaWE81vg8\"",
    "mtime": "2026-01-08T05:39:10.406Z",
    "size": 1711,
    "path": "../public/glog/d-os2-playthrough-part-1/_payload.json"
  },
  "/glog/d-os2-playthrough-part-2-end/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e52b-hOgfCsWxoan3uPk83xjFtUA5VQE\"",
    "mtime": "2026-01-08T05:39:04.236Z",
    "size": 255275,
    "path": "../public/glog/d-os2-playthrough-part-2-end/index.html"
  },
  "/glog/d-os2-playthrough-part-2-end/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"f5b-G+TUsL7zwobVncLzc85wdwyRRuY\"",
    "mtime": "2026-01-08T05:39:10.406Z",
    "size": 3931,
    "path": "../public/glog/d-os2-playthrough-part-2-end/_payload.json"
  },
  "/glog/dead-space-remake-playthrough-part-1/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e1e1-WgshEDOZbefOwY07QDyg3v5/Gvc\"",
    "mtime": "2026-01-08T05:39:04.236Z",
    "size": 254433,
    "path": "../public/glog/dead-space-remake-playthrough-part-1/index.html"
  },
  "/glog/dead-space-remake-playthrough-part-1/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"942-U5I57vH/fe8804I/7ZlRe8sPDCc\"",
    "mtime": "2026-01-08T05:39:10.374Z",
    "size": 2370,
    "path": "../public/glog/dead-space-remake-playthrough-part-1/_payload.json"
  },
  "/glog/dead-space-remake-playthrough-part-2-end/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e343-/UEHvrSJTmoOf6HNz7imteB+oes\"",
    "mtime": "2026-01-08T05:39:04.236Z",
    "size": 254787,
    "path": "../public/glog/dead-space-remake-playthrough-part-2-end/index.html"
  },
  "/glog/dead-space-remake-playthrough-part-2-end/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"c04-avJACWxTJr4Tgv54N/diFGQfpLw\"",
    "mtime": "2026-01-08T05:39:10.389Z",
    "size": 3076,
    "path": "../public/glog/dead-space-remake-playthrough-part-2-end/_payload.json"
  },
  "/glog/dino-crisis-playthrough-1/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e614-tOcZ2kNi78ef0CXoQDryHHBKoi4\"",
    "mtime": "2026-01-08T05:39:04.612Z",
    "size": 255508,
    "path": "../public/glog/dino-crisis-playthrough-1/index.html"
  },
  "/glog/dino-crisis-playthrough-1/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"1009-Mssc+VTYKc+CRuxRz8GTNzQg3R0\"",
    "mtime": "2026-01-08T05:39:10.476Z",
    "size": 4105,
    "path": "../public/glog/dino-crisis-playthrough-1/_payload.json"
  },
  "/glog/dino-crisis-playthrough-3/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e6a0-SiRylt0OE6SWdU9fz+rrF2K8co8\"",
    "mtime": "2026-01-08T05:39:04.612Z",
    "size": 255648,
    "path": "../public/glog/dino-crisis-playthrough-3/index.html"
  },
  "/glog/dino-crisis-playthrough-3/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"eee-UIL0TSyO6BtqlJMX1F+dXmStBrI\"",
    "mtime": "2026-01-08T05:39:10.459Z",
    "size": 3822,
    "path": "../public/glog/dino-crisis-playthrough-3/_payload.json"
  },
  "/glog/dino-crisis-playthrough-2/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e1b7-QKPX4+wFKHI02UxLaJ6r2oBIkAg\"",
    "mtime": "2026-01-08T05:39:04.545Z",
    "size": 254391,
    "path": "../public/glog/dino-crisis-playthrough-2/index.html"
  },
  "/glog/dino-crisis-playthrough-2/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"b01-UqwwFJM2zENOeRm3H7oHmsZh7Fk\"",
    "mtime": "2026-01-08T05:39:10.459Z",
    "size": 2817,
    "path": "../public/glog/dino-crisis-playthrough-2/_payload.json"
  },
  "/glog/dino-riki-2021-vgs-weekly-contest/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3ddbe-kGygmme2bw72xPbL3GvVtXYx/D0\"",
    "mtime": "2026-01-08T05:39:04.545Z",
    "size": 253374,
    "path": "../public/glog/dino-riki-2021-vgs-weekly-contest/index.html"
  },
  "/glog/dino-riki-2021-vgs-weekly-contest/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"58d-QPGsdl88qXAKg4LLcHvGs33m5y4\"",
    "mtime": "2026-01-08T05:39:10.454Z",
    "size": 1421,
    "path": "../public/glog/dino-riki-2021-vgs-weekly-contest/_payload.json"
  },
  "/glog/extermination-playthrough-1/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3dfab-LpkNEZlQll3xQGktJd7LvM2Pkeg\"",
    "mtime": "2026-01-08T05:39:04.545Z",
    "size": 253867,
    "path": "../public/glog/extermination-playthrough-1/index.html"
  },
  "/glog/extermination-playthrough-1/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"716-zNBXGkL/NXYIQhSYiQNLYHKaLUI\"",
    "mtime": "2026-01-08T05:39:10.459Z",
    "size": 1814,
    "path": "../public/glog/extermination-playthrough-1/_payload.json"
  },
  "/glog/final-fantasy-7-playthrough-1/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e182-KQZpKg1WBCan2+CgEPbAa48FoxQ\"",
    "mtime": "2026-01-08T05:39:04.545Z",
    "size": 254338,
    "path": "../public/glog/final-fantasy-7-playthrough-1/index.html"
  },
  "/glog/final-fantasy-7-playthrough-1/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"8ca-/Or9btpQLZFHb08uM4T2cLzNqrw\"",
    "mtime": "2026-01-08T05:39:10.439Z",
    "size": 2250,
    "path": "../public/glog/final-fantasy-7-playthrough-1/_payload.json"
  },
  "/glog/final-fantasy-legend-ii-playthrough-1/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e34a-34E5KQCLhXD5wrJayAmUB7PoGyc\"",
    "mtime": "2026-01-08T05:39:04.514Z",
    "size": 254794,
    "path": "../public/glog/final-fantasy-legend-ii-playthrough-1/index.html"
  },
  "/glog/final-fantasy-legend-ii-playthrough-1/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"a8a-jDFp3eWTTyTZDsxt8HqsmohZSnQ\"",
    "mtime": "2026-01-08T05:39:10.439Z",
    "size": 2698,
    "path": "../public/glog/final-fantasy-legend-ii-playthrough-1/_payload.json"
  },
  "/glog/gta-san-andreas-review/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e9c7-msW3bCs9hxLNrAoorGoRLA9/Nuc\"",
    "mtime": "2026-01-08T05:39:04.236Z",
    "size": 256455,
    "path": "../public/glog/gta-san-andreas-review/index.html"
  },
  "/glog/gta-san-andreas-review/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"1644-cn2vjWdBY+Sfpjn535fJ8hGtLQI\"",
    "mtime": "2026-01-08T05:39:10.390Z",
    "size": 5700,
    "path": "../public/glog/gta-san-andreas-review/_payload.json"
  },
  "/glog/joe-and-mac-nes-review/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e2f3-6paw3cbNsiUIQfOEHGcd3pJG2dg\"",
    "mtime": "2026-01-08T05:39:04.236Z",
    "size": 254707,
    "path": "../public/glog/joe-and-mac-nes-review/index.html"
  },
  "/glog/joe-and-mac-nes-review/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"ad8-gTfSQrdKDTZfRAEiROYS/1tCoUU\"",
    "mtime": "2026-01-08T05:39:10.390Z",
    "size": 2776,
    "path": "../public/glog/joe-and-mac-nes-review/_payload.json"
  },
  "/glog/life-is-strange-true-colors-review/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e03e-lKFyVZTdSjgkXfay/TpnNidZiVg\"",
    "mtime": "2026-01-08T05:39:04.514Z",
    "size": 254014,
    "path": "../public/glog/life-is-strange-true-colors-review/index.html"
  },
  "/glog/life-is-strange-true-colors-review/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"7ad-o0Z2kPP1JrKEMcU3Tmno1p+pISg\"",
    "mtime": "2026-01-08T05:39:10.439Z",
    "size": 1965,
    "path": "../public/glog/life-is-strange-true-colors-review/_payload.json"
  },
  "/glog/mario-galaxy-playthrough-part-1/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e041-6OYC4Io0eFFBpPzxcEko9Iz44aU\"",
    "mtime": "2026-01-08T05:39:04.236Z",
    "size": 254017,
    "path": "../public/glog/mario-galaxy-playthrough-part-1/index.html"
  },
  "/glog/mario-galaxy-playthrough-part-1/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"822-YB8oEUrTDUJD/Ys1hKNwqE8mvdU\"",
    "mtime": "2026-01-08T05:39:10.406Z",
    "size": 2082,
    "path": "../public/glog/mario-galaxy-playthrough-part-1/_payload.json"
  },
  "/glog/mario-galaxy-playthrough-part-2-end/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e148-vl00rw64DKCk6QxCrD5ia+hyBWo\"",
    "mtime": "2026-01-08T05:39:04.236Z",
    "size": 254280,
    "path": "../public/glog/mario-galaxy-playthrough-part-2-end/index.html"
  },
  "/glog/mario-galaxy-playthrough-part-2-end/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"887-9XjtgYQvTreTA6K4Z/7bbyzMRIs\"",
    "mtime": "2026-01-08T05:39:10.390Z",
    "size": 2183,
    "path": "../public/glog/mario-galaxy-playthrough-part-2-end/_payload.json"
  },
  "/glog/medal-of-honor-review/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e886-oB61FqZTNo8he5SyMHSNPgkiGvE\"",
    "mtime": "2026-01-08T05:39:04.236Z",
    "size": 256134,
    "path": "../public/glog/medal-of-honor-review/index.html"
  },
  "/glog/medal-of-honor-review/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"1055-Cz3gWIigWmCw+VbCsoWQPwPjy/4\"",
    "mtime": "2026-01-08T05:39:10.390Z",
    "size": 4181,
    "path": "../public/glog/medal-of-honor-review/_payload.json"
  },
  "/glog/nes-completion-thread-2022-super-sprint/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3def7-CAu/OrYEJNi1J9PjZtJvn7X5sgk\"",
    "mtime": "2026-01-08T05:39:04.532Z",
    "size": 253687,
    "path": "../public/glog/nes-completion-thread-2022-super-sprint/index.html"
  },
  "/glog/nes-completion-thread-2022-super-sprint/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"5e7-niK35TXOvCxzM54AWLDqHuXuskg\"",
    "mtime": "2026-01-08T05:39:10.439Z",
    "size": 1511,
    "path": "../public/glog/nes-completion-thread-2022-super-sprint/_payload.json"
  },
  "/glog/prince-of-persia-sands-of-time-playthrough-2/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3de7b-N5GpKT0gV4bYSPP3ujure4a9/qo\"",
    "mtime": "2026-01-08T05:39:04.545Z",
    "size": 253563,
    "path": "../public/glog/prince-of-persia-sands-of-time-playthrough-2/index.html"
  },
  "/glog/prince-of-persia-sands-of-time-playthrough-2/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"563-8cCOCbgbEG5fn2Sxdu0SnscfB+o\"",
    "mtime": "2026-01-08T05:39:10.459Z",
    "size": 1379,
    "path": "../public/glog/prince-of-persia-sands-of-time-playthrough-2/_payload.json"
  },
  "/glog/prince-of-persia-sands-of-time-playthrough-1/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e534-JGJYWqpwXhbZXI2rnO65kNnUEsE\"",
    "mtime": "2026-01-08T05:39:04.612Z",
    "size": 255284,
    "path": "../public/glog/prince-of-persia-sands-of-time-playthrough-1/index.html"
  },
  "/glog/prince-of-persia-sands-of-time-playthrough-1/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"e68-9vsSuR/d1zW/IQmegd/cNmStXTU\"",
    "mtime": "2026-01-08T05:39:10.476Z",
    "size": 3688,
    "path": "../public/glog/prince-of-persia-sands-of-time-playthrough-1/_payload.json"
  },
  "/glog/retroachievements-org/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e690-sJOqV6Qo7/eDRBtdXErzkBhlNMo\"",
    "mtime": "2026-01-08T05:39:04.236Z",
    "size": 255632,
    "path": "../public/glog/retroachievements-org/index.html"
  },
  "/glog/retroachievements-org/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"1130-iL7naUSoQj4ZYDlpAdQ6apq5cMc\"",
    "mtime": "2026-01-08T05:39:10.390Z",
    "size": 4400,
    "path": "../public/glog/retroachievements-org/_payload.json"
  },
  "/glog/prince-of-persia-sands-of-time-playthrough-3/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3dfa4-KZ/v+bMkGw512rrwSALJbeCcNQY\"",
    "mtime": "2026-01-08T05:39:04.545Z",
    "size": 253860,
    "path": "../public/glog/prince-of-persia-sands-of-time-playthrough-3/index.html"
  },
  "/glog/prince-of-persia-sands-of-time-playthrough-3/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"6e2-Ymsoehu9IfJnQdFl+LU98IDnvcc\"",
    "mtime": "2026-01-08T05:39:10.459Z",
    "size": 1762,
    "path": "../public/glog/prince-of-persia-sands-of-time-playthrough-3/_payload.json"
  },
  "/glog/revisiting-mario-galaxy/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e0e9-HaTBA+hmthsVs4FGtRO/52KtR+Q\"",
    "mtime": "2026-01-08T05:39:04.514Z",
    "size": 254185,
    "path": "../public/glog/revisiting-mario-galaxy/index.html"
  },
  "/glog/revisiting-mario-galaxy/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"848-NOusX/zxvWVQTWKmuZN4vQ9h0AM\"",
    "mtime": "2026-01-08T05:39:10.421Z",
    "size": 2120,
    "path": "../public/glog/revisiting-mario-galaxy/_payload.json"
  },
  "/glog/shadow-of-mordor-review/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e65b-kvJHHBkeGAgLTXpaTwjJJo5UwmQ\"",
    "mtime": "2026-01-08T05:39:04.545Z",
    "size": 255579,
    "path": "../public/glog/shadow-of-mordor-review/index.html"
  },
  "/glog/shadow-of-mordor-review/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"f09-z4EoR0wEuX9ZgsGVVdMcQ9TiQw4\"",
    "mtime": "2026-01-08T05:39:10.439Z",
    "size": 3849,
    "path": "../public/glog/shadow-of-mordor-review/_payload.json"
  },
  "/glog/the-quarry-playthrough-part-1/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e10d-cNxUEllO3+mXvw6PgO3cZb91DKM\"",
    "mtime": "2026-01-08T05:39:04.236Z",
    "size": 254221,
    "path": "../public/glog/the-quarry-playthrough-part-1/index.html"
  },
  "/glog/the-quarry-playthrough-part-1/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"886-cSHJTKHgjjxNzcXrLRnRZ5xgFLE\"",
    "mtime": "2026-01-08T05:39:10.406Z",
    "size": 2182,
    "path": "../public/glog/the-quarry-playthrough-part-1/_payload.json"
  },
  "/glog/the-quarry-playthrough-part-2-end/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e57f-SafKKUv2wxV2tPefmjpc8Cy38AE\"",
    "mtime": "2026-01-08T05:39:04.236Z",
    "size": 255359,
    "path": "../public/glog/the-quarry-playthrough-part-2-end/index.html"
  },
  "/glog/the-quarry-playthrough-part-2-end/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"d0e-GBX3wtRh7jBOWD/zTtw+Js0YtVY\"",
    "mtime": "2026-01-08T05:39:10.390Z",
    "size": 3342,
    "path": "../public/glog/the-quarry-playthrough-part-2-end/_payload.json"
  },
  "/glog/timesplitters-review/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e5f0-5N0Rd7axiv9CB+PLY7tagpo0iRU\"",
    "mtime": "2026-01-08T05:39:04.545Z",
    "size": 255472,
    "path": "../public/glog/timesplitters-review/index.html"
  },
  "/glog/timesplitters-review/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"f03-KgmJI9gdlzWYGKiYJnO9pE/7nMc\"",
    "mtime": "2026-01-08T05:39:10.439Z",
    "size": 3843,
    "path": "../public/glog/timesplitters-review/_payload.json"
  },
  "/glog/wild-of-arms-playthrough-1/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e2ef-wzImqMWQjzmHWoocrxODTdIB808\"",
    "mtime": "2026-01-08T05:39:04.514Z",
    "size": 254703,
    "path": "../public/glog/wild-of-arms-playthrough-1/index.html"
  },
  "/glog/wild-of-arms-playthrough-1/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"a2d-5J2VweJZa1kmvhdOVtcVNy45CXU\"",
    "mtime": "2026-01-08T05:39:10.421Z",
    "size": 2605,
    "path": "../public/glog/wild-of-arms-playthrough-1/_payload.json"
  },
  "/glog/tony-hawks-pro-skater-2-playthrough/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3de8c-9DL5mBJfWw/99oVLbwo8HlViVQ0\"",
    "mtime": "2026-01-08T05:39:04.514Z",
    "size": 253580,
    "path": "../public/glog/tony-hawks-pro-skater-2-playthrough/index.html"
  },
  "/glog/tony-hawks-pro-skater-2-playthrough/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"65b-Onaro1UksTe3SmcuUiKgeL58ZLU\"",
    "mtime": "2026-01-08T05:39:10.439Z",
    "size": 1627,
    "path": "../public/glog/tony-hawks-pro-skater-2-playthrough/_payload.json"
  },
  "/systems/game-boy/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3ed9a-KTRp6cCw7SWisudV7674Sq+c3Eo\"",
    "mtime": "2026-01-08T05:39:03.924Z",
    "size": 257434,
    "path": "../public/systems/game-boy/index.html"
  },
  "/systems/game-boy/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"768-z+lEleyr3Z9Co0Hi5lUYgkzFpIU\"",
    "mtime": "2026-01-08T05:39:10.212Z",
    "size": 1896,
    "path": "../public/systems/game-boy/_payload.json"
  },
  "/systems/game-boy-advance/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3f173-S3lv0n9WUgzFJJy/KCbA8n4wEXI\"",
    "mtime": "2026-01-08T05:39:03.925Z",
    "size": 258419,
    "path": "../public/systems/game-boy-advance/index.html"
  },
  "/systems/game-boy-advance/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"a19-0S5P2lFVmdNI9v2uIAfWb9wSRcY\"",
    "mtime": "2026-01-08T05:39:10.350Z",
    "size": 2585,
    "path": "../public/systems/game-boy-advance/_payload.json"
  },
  "/systems/gamecube/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3f32b-5hnLbX+VAh8Dv7zHSUn6uWV020Y\"",
    "mtime": "2026-01-08T05:39:03.925Z",
    "size": 258859,
    "path": "../public/systems/gamecube/index.html"
  },
  "/systems/gamecube/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"bdd-q5cWp0xmFjmF/dWq5GRvZH1AxG4\"",
    "mtime": "2026-01-08T05:39:10.282Z",
    "size": 3037,
    "path": "../public/systems/gamecube/_payload.json"
  },
  "/systems/game-boy-color/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3ed0d-fgAQgcx+S6PSzp6voKgckFnKgrY\"",
    "mtime": "2026-01-08T05:39:03.925Z",
    "size": 257293,
    "path": "../public/systems/game-boy-color/index.html"
  },
  "/systems/game-boy-color/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"6cd-eumO4jBWHmOG6Tv5T08C4BXN15U\"",
    "mtime": "2026-01-08T05:39:10.309Z",
    "size": 1741,
    "path": "../public/systems/game-boy-color/_payload.json"
  },
  "/systems/nintendo-3ds/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3f085-UHrPQq0dws076nWttcRaaQQ64TA\"",
    "mtime": "2026-01-08T05:39:03.924Z",
    "size": 258181,
    "path": "../public/systems/nintendo-3ds/index.html"
  },
  "/systems/nintendo-3ds/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"9a5-y2DUpqkHhxJU+NruX8PCaLNMGxU\"",
    "mtime": "2026-01-08T05:39:04.711Z",
    "size": 2469,
    "path": "../public/systems/nintendo-3ds/_payload.json"
  },
  "/systems/nintendo-64/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"40530-//Xl0fHBxfsyPSc/EJTo6CzHuj0\"",
    "mtime": "2026-01-08T05:39:03.924Z",
    "size": 263472,
    "path": "../public/systems/nintendo-64/index.html"
  },
  "/systems/nintendo-64/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"1a1c-XhWyjskgU0LXyQxyEyDp0yz8K30\"",
    "mtime": "2026-01-08T05:39:10.220Z",
    "size": 6684,
    "path": "../public/systems/nintendo-64/_payload.json"
  },
  "/systems/nintendo-ds/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3f406-NLufXFEq0DgFSvlVlJPX/hKztfc\"",
    "mtime": "2026-01-08T05:39:03.924Z",
    "size": 259078,
    "path": "../public/systems/nintendo-ds/index.html"
  },
  "/systems/nintendo-ds/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"c82-R84yfra1SqGjdEJ2qzYizpQw+wc\"",
    "mtime": "2026-01-08T05:39:10.220Z",
    "size": 3202,
    "path": "../public/systems/nintendo-ds/_payload.json"
  },
  "/systems/nintendo-entertainment-system/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"42849-ciJR1hSSvuS6KRXSK1BivaxhE98\"",
    "mtime": "2026-01-08T05:39:03.925Z",
    "size": 272457,
    "path": "../public/systems/nintendo-entertainment-system/index.html"
  },
  "/systems/nintendo-entertainment-system/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"3251-HTzU1rX1fW8TNktRaQ4pQ1MhWYA\"",
    "mtime": "2026-01-08T05:39:10.350Z",
    "size": 12881,
    "path": "../public/systems/nintendo-entertainment-system/_payload.json"
  },
  "/systems/pc/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3ef36-oNOIkVgeIXJpKCM7ixD6D2VWypg\"",
    "mtime": "2026-01-08T05:39:03.925Z",
    "size": 257846,
    "path": "../public/systems/pc/index.html"
  },
  "/systems/pc/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"89c-184RTnd64CWbh8aiGrAtsYISnKc\"",
    "mtime": "2026-01-08T05:39:10.350Z",
    "size": 2204,
    "path": "../public/systems/pc/_payload.json"
  },
  "/systems/playstation/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"41419-Hpx+aMllafw7nKXkrtqWwCNGLAM\"",
    "mtime": "2026-01-08T05:39:03.925Z",
    "size": 267289,
    "path": "../public/systems/playstation/index.html"
  },
  "/systems/playstation/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"262f-wmfQj9OYMSM/hMsBSOFppsWXM2c\"",
    "mtime": "2026-01-08T05:39:10.324Z",
    "size": 9775,
    "path": "../public/systems/playstation/_payload.json"
  },
  "/systems/playstation-2/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"44e77-IYm5b/JO7KbbeFj9w2LmdO2cHTM\"",
    "mtime": "2026-01-08T05:39:03.935Z",
    "size": 282231,
    "path": "../public/systems/playstation-2/index.html"
  },
  "/systems/playstation-2/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"548c-63ynds05bxrjxjaY0z9fk/kN2dQ\"",
    "mtime": "2026-01-08T05:39:10.350Z",
    "size": 21644,
    "path": "../public/systems/playstation-2/_payload.json"
  },
  "/systems/playstation-3/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"419bf-paBQ857tVDNWAHyLJjTq0QLa7vU\"",
    "mtime": "2026-01-08T05:39:03.934Z",
    "size": 268735,
    "path": "../public/systems/playstation-3/index.html"
  },
  "/systems/playstation-3/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"2a88-nlIlysv+y6yfO1iw7wQitlzKuk4\"",
    "mtime": "2026-01-08T05:39:10.350Z",
    "size": 10888,
    "path": "../public/systems/playstation-3/_payload.json"
  },
  "/systems/playstation-4/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"41123-1zf5urFoBChIFZfNaICNUkW17wI\"",
    "mtime": "2026-01-08T05:39:03.925Z",
    "size": 266531,
    "path": "../public/systems/playstation-4/index.html"
  },
  "/systems/playstation-4/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"23d4-EfMf3ZWA6D1Xsqwmfr678vJtmlA\"",
    "mtime": "2026-01-08T05:39:10.350Z",
    "size": 9172,
    "path": "../public/systems/playstation-4/_payload.json"
  },
  "/systems/playstation-5/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3f826-1sK2Bz6JgsN4UImtPl8foDkvH4M\"",
    "mtime": "2026-01-08T05:39:03.925Z",
    "size": 260134,
    "path": "../public/systems/playstation-5/index.html"
  },
  "/systems/playstation-5/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"f94-yXbhpc7AT4UF+09FaW8H/YxW4j4\"",
    "mtime": "2026-01-08T05:39:10.350Z",
    "size": 3988,
    "path": "../public/systems/playstation-5/_payload.json"
  },
  "/systems/playstation-portable/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3f7ec-2+krIkq3Lh0i0GRBaEQqbSKGHp4\"",
    "mtime": "2026-01-08T05:39:03.924Z",
    "size": 260076,
    "path": "../public/systems/playstation-portable/index.html"
  },
  "/systems/playstation-portable/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"f16-oWeTXK29r9Lh+KLVmPb6qHAVOLk\"",
    "mtime": "2026-01-08T05:39:10.220Z",
    "size": 3862,
    "path": "../public/systems/playstation-portable/_payload.json"
  },
  "/systems/sega-genesis/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3ecfa-Zj0BD8jayXQ7/Q17mFVwubO/bzA\"",
    "mtime": "2026-01-08T05:39:03.924Z",
    "size": 257274,
    "path": "../public/systems/sega-genesis/index.html"
  },
  "/systems/sega-genesis/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"6ca-fnoMNnnNSkiE2LGJtKwfXzK+d+o\"",
    "mtime": "2026-01-08T05:39:04.513Z",
    "size": 1738,
    "path": "../public/systems/sega-genesis/_payload.json"
  },
  "/systems/playstation-vita/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3ec13-fgKEHZHN6O+NsO5CNrsi9oFNCkQ\"",
    "mtime": "2026-01-08T05:39:03.924Z",
    "size": 257043,
    "path": "../public/systems/playstation-vita/index.html"
  },
  "/systems/playstation-vita/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"604-LZQLgxbyiGv1UY6+nzk/QliJW4I\"",
    "mtime": "2026-01-08T05:39:10.220Z",
    "size": 1540,
    "path": "../public/systems/playstation-vita/_payload.json"
  },
  "/systems/super-nintendo-entertainment-system/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"415f8-VfqsBDMBVks/GR8iuKhzZlyBQ8A\"",
    "mtime": "2026-01-08T05:39:03.925Z",
    "size": 267768,
    "path": "../public/systems/super-nintendo-entertainment-system/index.html"
  },
  "/systems/super-nintendo-entertainment-system/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"2436-wgTYgA8RuQjiUYbpL06nMnJsGLY\"",
    "mtime": "2026-01-08T05:39:10.350Z",
    "size": 9270,
    "path": "../public/systems/super-nintendo-entertainment-system/_payload.json"
  },
  "/systems/switch/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"40746-lG2EFheSiQ9D9mz4H7+GDctevzI\"",
    "mtime": "2026-01-08T05:39:03.925Z",
    "size": 264006,
    "path": "../public/systems/switch/index.html"
  },
  "/systems/switch/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"1ca2-sRXUl4vkpcGfoVuMKpByKdhYsls\"",
    "mtime": "2026-01-08T05:39:10.282Z",
    "size": 7330,
    "path": "../public/systems/switch/_payload.json"
  },
  "/systems/wii-u/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e91d-cKvbJ45+qH/Jk2yPc1YYmxWBIk4\"",
    "mtime": "2026-01-08T05:39:03.924Z",
    "size": 256285,
    "path": "../public/systems/wii-u/index.html"
  },
  "/systems/wii-u/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"3d5-60Jdme9x1v9QIjxIR1FFSFsN2uU\"",
    "mtime": "2026-01-08T05:39:04.513Z",
    "size": 981,
    "path": "../public/systems/wii-u/_payload.json"
  },
  "/systems/wii/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3ef15-Re3weimaqZljdY8Gujm14kieeFk\"",
    "mtime": "2026-01-08T05:39:03.925Z",
    "size": 257813,
    "path": "../public/systems/wii/index.html"
  },
  "/systems/wii/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"8cf-f58qiNHwLQuTWR3wpDdJDgVBwKI\"",
    "mtime": "2026-01-08T05:39:10.309Z",
    "size": 2255,
    "path": "../public/systems/wii/_payload.json"
  },
  "/games/game-boy-advance/final-fantasy-i-and-ii-dawn-of-souls/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e9a7-MbsOsMJG1A8tefR2Mj67lNJZm1w\"",
    "mtime": "2026-01-08T05:39:06.589Z",
    "size": 256423,
    "path": "../public/games/game-boy-advance/final-fantasy-i-and-ii-dawn-of-souls/index.html"
  },
  "/games/game-boy-advance/final-fantasy-i-and-ii-dawn-of-souls/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"2b5-rMULLGjw93GqyB9vLH6CIojHamo\"",
    "mtime": "2026-01-08T05:39:10.930Z",
    "size": 693,
    "path": "../public/games/game-boy-advance/final-fantasy-i-and-ii-dawn-of-souls/_payload.json"
  },
  "/games/game-boy-advance/final-fantasy-iv-gba/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8a3-35K7HQ8RgDLDNvB0HpVOumdE0jQ\"",
    "mtime": "2026-01-08T05:39:06.589Z",
    "size": 256163,
    "path": "../public/games/game-boy-advance/final-fantasy-iv-gba/index.html"
  },
  "/games/game-boy-advance/final-fantasy-iv-gba/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"277-wocmV2Q8/ENOWT7+0Xvm9sRCdyg\"",
    "mtime": "2026-01-08T05:39:10.930Z",
    "size": 631,
    "path": "../public/games/game-boy-advance/final-fantasy-iv-gba/_payload.json"
  },
  "/games/game-boy-advance/final-fantasy-tactics-advance/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8cd-EJCzVkVdl8SBj5Y4k3lHY/6Q5KE\"",
    "mtime": "2026-01-08T05:39:06.590Z",
    "size": 256205,
    "path": "../public/games/game-boy-advance/final-fantasy-tactics-advance/index.html"
  },
  "/games/game-boy-advance/final-fantasy-tactics-advance/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"27b-JaTUHN1x+HrTsHS5b0mghDorJrQ\"",
    "mtime": "2026-01-08T05:39:10.946Z",
    "size": 635,
    "path": "../public/games/game-boy-advance/final-fantasy-tactics-advance/_payload.json"
  },
  "/games/game-boy-advance/final-fantasy-v-advance/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8a9-EJSlv9S9EfXEBlvOjQEZyv+B6EI\"",
    "mtime": "2026-01-08T05:39:06.630Z",
    "size": 256169,
    "path": "../public/games/game-boy-advance/final-fantasy-v-advance/index.html"
  },
  "/games/game-boy-advance/final-fantasy-v-advance/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"275-G4LF/uVbGNS0sWZ3P2yVCLOEOhY\"",
    "mtime": "2026-01-08T05:39:10.946Z",
    "size": 629,
    "path": "../public/games/game-boy-advance/final-fantasy-v-advance/_payload.json"
  },
  "/games/game-boy-advance/final-fantasy-vi-advance/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8af-dCxCHjY4i+PniqLbpqpyi0xTTOk\"",
    "mtime": "2026-01-08T05:39:06.630Z",
    "size": 256175,
    "path": "../public/games/game-boy-advance/final-fantasy-vi-advance/index.html"
  },
  "/games/game-boy-advance/final-fantasy-vi-advance/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"277-yr+qYg3KLMupQLp56PAt7VYGiPo\"",
    "mtime": "2026-01-08T05:39:10.946Z",
    "size": 631,
    "path": "../public/games/game-boy-advance/final-fantasy-vi-advance/_payload.json"
  },
  "/games/game-boy-advance/legend-of-zelda-minish-cap/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8b7-D2I1NA2kLfkusTYVTAmvrDAqu3Q\"",
    "mtime": "2026-01-08T05:39:07.622Z",
    "size": 256183,
    "path": "../public/games/game-boy-advance/legend-of-zelda-minish-cap/index.html"
  },
  "/games/game-boy-advance/legend-of-zelda-minish-cap/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"276-b+tkILgorXxK/z4QyqkTsgbvS0o\"",
    "mtime": "2026-01-08T05:39:11.202Z",
    "size": 630,
    "path": "../public/games/game-boy-advance/legend-of-zelda-minish-cap/_payload.json"
  },
  "/games/game-boy-advance/legend-of-zelda-a-link-to-the-past-gba/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8f9-vBZHILZM1hJjeajJU6WDed8F9fw\"",
    "mtime": "2026-01-08T05:39:07.464Z",
    "size": 256249,
    "path": "../public/games/game-boy-advance/legend-of-zelda-a-link-to-the-past-gba/index.html"
  },
  "/games/game-boy-advance/legend-of-zelda-a-link-to-the-past-gba/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"282-4KDf1WumZ9Rvx+7vBYX7WRZc8M8\"",
    "mtime": "2026-01-08T05:39:11.178Z",
    "size": 642,
    "path": "../public/games/game-boy-advance/legend-of-zelda-a-link-to-the-past-gba/_payload.json"
  },
  "/games/game-boy-advance/pokemon-emerald/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e879-7JdBLtWPfeaZ7AFbZBk8/Msu/50\"",
    "mtime": "2026-01-08T05:39:08.345Z",
    "size": 256121,
    "path": "../public/games/game-boy-advance/pokemon-emerald/index.html"
  },
  "/games/game-boy-advance/pokemon-emerald/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"26e-iKwS3kpqx3ylzVV8Jjk2I+37Pvs\"",
    "mtime": "2026-01-08T05:39:11.416Z",
    "size": 622,
    "path": "../public/games/game-boy-advance/pokemon-emerald/_payload.json"
  },
  "/games/game-boy-advance/pokemon-ruby/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e867-wimrt8XE8QiJObN8RfmRhAYI7cQ\"",
    "mtime": "2026-01-08T05:39:08.357Z",
    "size": 256103,
    "path": "../public/games/game-boy-advance/pokemon-ruby/index.html"
  },
  "/games/game-boy-advance/pokemon-ruby/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"26b-aYZ7Uz6xvzwmjTBZ03BUImAb0RM\"",
    "mtime": "2026-01-08T05:39:11.435Z",
    "size": 619,
    "path": "../public/games/game-boy-advance/pokemon-ruby/_payload.json"
  },
  "/games/game-boy-advance/pokemon-sapphire/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e87f-CqKLtbGuQGOhrxRs7nedAfAcfNo\"",
    "mtime": "2026-01-08T05:39:08.547Z",
    "size": 256127,
    "path": "../public/games/game-boy-advance/pokemon-sapphire/index.html"
  },
  "/games/game-boy-advance/pokemon-sapphire/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"26f-eFzczASNPjc9EeaBleI+qenHJro\"",
    "mtime": "2026-01-08T05:39:11.435Z",
    "size": 623,
    "path": "../public/games/game-boy-advance/pokemon-sapphire/_payload.json"
  },
  "/games/game-boy-advance/sigma-star-saga/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e87b-LA25mGdtKbnaH+wgxltVbWL+QYs\"",
    "mtime": "2026-01-08T05:39:09.258Z",
    "size": 256123,
    "path": "../public/games/game-boy-advance/sigma-star-saga/index.html"
  },
  "/games/game-boy-advance/sigma-star-saga/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"26f-WXSAnQECq9EZQDQW+ms+/db6ZIo\"",
    "mtime": "2026-01-08T05:39:11.597Z",
    "size": 623,
    "path": "../public/games/game-boy-advance/sigma-star-saga/_payload.json"
  },
  "/games/game-boy/final-fantasy-adventure/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e871-eR3mD7nRrW456RgZAEDFKjryEaA\"",
    "mtime": "2026-01-08T05:39:06.418Z",
    "size": 256113,
    "path": "../public/games/game-boy/final-fantasy-adventure/index.html"
  },
  "/games/game-boy/final-fantasy-adventure/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"264-CFAb01uo1W9g6Bio4VfNNtjor40\"",
    "mtime": "2026-01-08T05:39:10.913Z",
    "size": 612,
    "path": "../public/games/game-boy/final-fantasy-adventure/_payload.json"
  },
  "/games/game-boy/final-fantasy-legend/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e859-im7xXJ0TKXFkLniYqIELHhYXaKc\"",
    "mtime": "2026-01-08T05:39:06.590Z",
    "size": 256089,
    "path": "../public/games/game-boy/final-fantasy-legend/index.html"
  },
  "/games/game-boy/final-fantasy-legend/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25f-pZL5ZU2eVhDzFVOWJdOUQARcs6M\"",
    "mtime": "2026-01-08T05:39:10.930Z",
    "size": 607,
    "path": "../public/games/game-boy/final-fantasy-legend/_payload.json"
  },
  "/games/game-boy/final-fantasy-legend-ii/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"40b55-Xcc7r6QQjggcytRw5TsZWH8z57Y\"",
    "mtime": "2026-01-08T05:39:04.611Z",
    "size": 265045,
    "path": "../public/games/game-boy/final-fantasy-legend-ii/index.html"
  },
  "/games/game-boy/final-fantasy-legend-ii/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"a31-4EW/qvJAFQCqfInomLolnrdUnxE\"",
    "mtime": "2026-01-08T05:39:10.459Z",
    "size": 2609,
    "path": "../public/games/game-boy/final-fantasy-legend-ii/_payload.json"
  },
  "/games/game-boy/final-fantasy-legend-iii/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e877-N5iIObdI0fWnjw4xRCpsKsNrDo0\"",
    "mtime": "2026-01-08T05:39:06.589Z",
    "size": 256119,
    "path": "../public/games/game-boy/final-fantasy-legend-iii/index.html"
  },
  "/games/game-boy/final-fantasy-legend-iii/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"266-qGw1m6Je1/1mJ7kfFXX/9t6UKyI\"",
    "mtime": "2026-01-08T05:39:10.930Z",
    "size": 614,
    "path": "../public/games/game-boy/final-fantasy-legend-iii/_payload.json"
  },
  "/games/game-boy/kirbys-dream-land/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e857-B1Jyg+Wv+PX8keVRhkyDqpnmuRU\"",
    "mtime": "2026-01-08T05:39:07.463Z",
    "size": 256087,
    "path": "../public/games/game-boy/kirbys-dream-land/index.html"
  },
  "/games/game-boy/kirbys-dream-land/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25c-rd2Dpi4mlOoZXTXmaNJ2KOLi1l8\"",
    "mtime": "2026-01-08T05:39:11.178Z",
    "size": 604,
    "path": "../public/games/game-boy/kirbys-dream-land/_payload.json"
  },
  "/games/game-boy/pokemon-red/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e823-gnZdq3yZ6HB1qsEdKtZUrR8M/Gs\"",
    "mtime": "2026-01-08T05:39:08.345Z",
    "size": 256035,
    "path": "../public/games/game-boy/pokemon-red/index.html"
  },
  "/games/game-boy/pokemon-red/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"256-WoMlwya5bea6LUrYczhJg1l+jDs\"",
    "mtime": "2026-01-08T05:39:11.417Z",
    "size": 598,
    "path": "../public/games/game-boy/pokemon-red/_payload.json"
  },
  "/games/game-boy/pokemon-blue/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e829-sJEBp4Dy5Lk4XaSgfEMmbk4xOvw\"",
    "mtime": "2026-01-08T05:39:08.345Z",
    "size": 256041,
    "path": "../public/games/game-boy/pokemon-blue/index.html"
  },
  "/games/game-boy/pokemon-blue/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"257-Pv7nLNqbSNcqy41n8zsssHrG39E\"",
    "mtime": "2026-01-08T05:39:11.416Z",
    "size": 599,
    "path": "../public/games/game-boy/pokemon-blue/_payload.json"
  },
  "/games/game-boy/pokemon-yellow/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e927-tcO6+ATveyjEYyeNDG+Hu1avMeM\"",
    "mtime": "2026-01-08T05:39:08.597Z",
    "size": 256295,
    "path": "../public/games/game-boy/pokemon-yellow/index.html"
  },
  "/games/game-boy/pokemon-yellow/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"2b5-/WKp4NeLbRsF70StoANAkgQtMQA\"",
    "mtime": "2026-01-08T05:39:11.465Z",
    "size": 693,
    "path": "../public/games/game-boy/pokemon-yellow/_payload.json"
  },
  "/games/game-boy-color/legend-of-zelda-oracle-of-seasons/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8d9-Px1uSil/bY6hPlDwB8ZU5uekm4o\"",
    "mtime": "2026-01-08T05:39:07.629Z",
    "size": 256217,
    "path": "../public/games/game-boy-color/legend-of-zelda-oracle-of-seasons/index.html"
  },
  "/games/game-boy-color/legend-of-zelda-oracle-of-seasons/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"27d-FBbFSkUpFHrlJfe7ezPJLzG4cp4\"",
    "mtime": "2026-01-08T05:39:11.201Z",
    "size": 637,
    "path": "../public/games/game-boy-color/legend-of-zelda-oracle-of-seasons/_payload.json"
  },
  "/games/game-boy-color/legend-of-zelda-oracle-of-ages/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8c7-8ImQOOz5DIC+GmJ3DunbhTj5Q3k\"",
    "mtime": "2026-01-08T05:39:07.667Z",
    "size": 256199,
    "path": "../public/games/game-boy-color/legend-of-zelda-oracle-of-ages/index.html"
  },
  "/games/game-boy-color/legend-of-zelda-oracle-of-ages/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"27a-oqo5dsOxZ8VZtbefnennPbHpOlA\"",
    "mtime": "2026-01-08T05:39:11.219Z",
    "size": 634,
    "path": "../public/games/game-boy-color/legend-of-zelda-oracle-of-ages/_payload.json"
  },
  "/games/game-boy-color/pokemon-crystal/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e865-k8lbosusJFOeD6rkawDqUPsQ3Ms\"",
    "mtime": "2026-01-08T05:39:08.345Z",
    "size": 256101,
    "path": "../public/games/game-boy-color/pokemon-crystal/index.html"
  },
  "/games/game-boy-color/pokemon-crystal/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"266-fMlyLAG+boddUSeyJNIwfkqbBPM\"",
    "mtime": "2026-01-08T05:39:11.417Z",
    "size": 614,
    "path": "../public/games/game-boy-color/pokemon-crystal/_payload.json"
  },
  "/games/game-boy-color/pokemon-gold/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e853-w8LbkUKKophbiiTSWWhiP61Lvg8\"",
    "mtime": "2026-01-08T05:39:08.345Z",
    "size": 256083,
    "path": "../public/games/game-boy-color/pokemon-gold/index.html"
  },
  "/games/game-boy-color/pokemon-gold/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"263-JQkLHqpNDpvaM3bqFzqbX1j4PjU\"",
    "mtime": "2026-01-08T05:39:11.435Z",
    "size": 611,
    "path": "../public/games/game-boy-color/pokemon-gold/_payload.json"
  },
  "/games/game-boy-color/pokemon-pinball/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e865-Ug+7FYLqTHoa5lXLTU+N/XE6UUQ\"",
    "mtime": "2026-01-08T05:39:08.346Z",
    "size": 256101,
    "path": "../public/games/game-boy-color/pokemon-pinball/index.html"
  },
  "/games/game-boy-color/pokemon-pinball/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"267-30X5CeMSAA7Stj/coJGozWZ8oAE\"",
    "mtime": "2026-01-08T05:39:11.435Z",
    "size": 615,
    "path": "../public/games/game-boy-color/pokemon-pinball/_payload.json"
  },
  "/games/game-boy-color/pokemon-silver/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e85f-8TzR/0ydL+pIM7t3KLhRHC2X8Iw\"",
    "mtime": "2026-01-08T05:39:08.555Z",
    "size": 256095,
    "path": "../public/games/game-boy-color/pokemon-silver/index.html"
  },
  "/games/game-boy-color/pokemon-silver/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"265-TRJMzalGQgqPOhQEBe4CNF9dWj8\"",
    "mtime": "2026-01-08T05:39:11.435Z",
    "size": 613,
    "path": "../public/games/game-boy-color/pokemon-silver/_payload.json"
  },
  "/games/game-boy-color/pokemon-trading-card-game/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e994-DQ/fDBLUKkM8/vsHu32/9AHisX4\"",
    "mtime": "2026-01-08T05:39:08.597Z",
    "size": 256404,
    "path": "../public/games/game-boy-color/pokemon-trading-card-game/index.html"
  },
  "/games/game-boy-color/pokemon-trading-card-game/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"2ce-DqDvL5FjJlU7lR7rLG89as/Dz1g\"",
    "mtime": "2026-01-08T05:39:11.492Z",
    "size": 718,
    "path": "../public/games/game-boy-color/pokemon-trading-card-game/_payload.json"
  },
  "/games/nintendo-3ds/fire-emblem-awakening/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e885-ljd3WSQrDZs4rZcLaEypXCGIJsM\"",
    "mtime": "2026-01-08T05:39:04.835Z",
    "size": 256133,
    "path": "../public/games/nintendo-3ds/fire-emblem-awakening/index.html"
  },
  "/games/nintendo-3ds/fire-emblem-awakening/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"26e-gYK7QwFIX0pIwchR37c3qw0bE4c\"",
    "mtime": "2026-01-08T05:39:10.490Z",
    "size": 622,
    "path": "../public/games/nintendo-3ds/fire-emblem-awakening/_payload.json"
  },
  "/games/nintendo-3ds/legend-of-zelda-a-link-between-worlds-the/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8f8-qzd0xTOlZxi2MKJrzsbVdz8eUdA\"",
    "mtime": "2026-01-08T05:39:04.870Z",
    "size": 256248,
    "path": "../public/games/nintendo-3ds/legend-of-zelda-a-link-between-worlds-the/index.html"
  },
  "/games/nintendo-3ds/legend-of-zelda-a-link-between-worlds-the/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"27f-FldmNh8zGMMYVjiIz9wC/ri9Ty8\"",
    "mtime": "2026-01-08T05:39:10.524Z",
    "size": 639,
    "path": "../public/games/nintendo-3ds/legend-of-zelda-a-link-between-worlds-the/_payload.json"
  },
  "/games/nintendo-3ds/legend-of-zelda-majoras-mask-3d-the/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8e4-eTHFvaIE9DGu7FttNdfYBipRUZU\"",
    "mtime": "2026-01-08T05:39:04.868Z",
    "size": 256228,
    "path": "../public/games/nintendo-3ds/legend-of-zelda-majoras-mask-3d-the/index.html"
  },
  "/games/nintendo-3ds/legend-of-zelda-majoras-mask-3d-the/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"27a-17BBOJz6au2786lugjYYB9KVCDs\"",
    "mtime": "2026-01-08T05:39:10.524Z",
    "size": 634,
    "path": "../public/games/nintendo-3ds/legend-of-zelda-majoras-mask-3d-the/_payload.json"
  },
  "/games/nintendo-3ds/legend-of-zelda-ocarina-of-time-3d-the/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8ee-2DexaX1Qwk8Uz32qr54+wbzjE8U\"",
    "mtime": "2026-01-08T05:39:04.925Z",
    "size": 256238,
    "path": "../public/games/nintendo-3ds/legend-of-zelda-ocarina-of-time-3d-the/index.html"
  },
  "/games/nintendo-3ds/legend-of-zelda-ocarina-of-time-3d-the/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"280-Qxp/I7k/Oms/RfYOrP2YtMwjVDk\"",
    "mtime": "2026-01-08T05:39:10.573Z",
    "size": 640,
    "path": "../public/games/nintendo-3ds/legend-of-zelda-ocarina-of-time-3d-the/_payload.json"
  },
  "/games/nintendo-3ds/pokemon-omega-ruby/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e86f-uN267gesTxCjHI3j9DJm6T8WED4\"",
    "mtime": "2026-01-08T05:39:04.812Z",
    "size": 256111,
    "path": "../public/games/nintendo-3ds/pokemon-omega-ruby/index.html"
  },
  "/games/nintendo-3ds/pokemon-omega-ruby/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"269-QkIjLRoI+Uqc0sPzTgJnPoRXPhA\"",
    "mtime": "2026-01-08T05:39:10.476Z",
    "size": 617,
    "path": "../public/games/nintendo-3ds/pokemon-omega-ruby/_payload.json"
  },
  "/games/nintendo-3ds/pokemon-sun/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e847-+PQBDqg2LLSmOZB8GAFPN6NkbYc\"",
    "mtime": "2026-01-08T05:39:04.831Z",
    "size": 256071,
    "path": "../public/games/nintendo-3ds/pokemon-sun/index.html"
  },
  "/games/nintendo-3ds/pokemon-sun/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"263-M5h/AdVBbFmPSrjQ6yc9LGwliCg\"",
    "mtime": "2026-01-08T05:39:10.476Z",
    "size": 611,
    "path": "../public/games/nintendo-3ds/pokemon-sun/_payload.json"
  },
  "/games/nintendo-3ds/pokemon-y/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e83b-2fWArSo+tg4MFvWYSascUkESLq0\"",
    "mtime": "2026-01-08T05:39:04.845Z",
    "size": 256059,
    "path": "../public/games/nintendo-3ds/pokemon-y/index.html"
  },
  "/games/nintendo-3ds/pokemon-y/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"261-LWaaq4HBsMESJl8OXI5ZCb+U/lM\"",
    "mtime": "2026-01-08T05:39:10.523Z",
    "size": 609,
    "path": "../public/games/nintendo-3ds/pokemon-y/_payload.json"
  },
  "/games/nintendo-3ds/resident-evil-the-mercenaries-3d/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e950-aZQ3YQG1nGcSPHKMvY9so+hK2/8\"",
    "mtime": "2026-01-08T05:39:04.859Z",
    "size": 256336,
    "path": "../public/games/nintendo-3ds/resident-evil-the-mercenaries-3d/index.html"
  },
  "/games/nintendo-3ds/resident-evil-the-mercenaries-3d/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"294-DHV2byQV/PAfb3onoDhJAHsmauA\"",
    "mtime": "2026-01-08T05:39:10.523Z",
    "size": 660,
    "path": "../public/games/nintendo-3ds/resident-evil-the-mercenaries-3d/_payload.json"
  },
  "/games/nintendo-3ds/theatrhythm-final-fantasy/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e89b-mV3NAj0vOnbd20zuTd83jk+oQrk\"",
    "mtime": "2026-01-08T05:39:04.845Z",
    "size": 256155,
    "path": "../public/games/nintendo-3ds/theatrhythm-final-fantasy/index.html"
  },
  "/games/nintendo-3ds/theatrhythm-final-fantasy/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"271-0OC7cNPYDZEQVpUQ2GA7RehyttE\"",
    "mtime": "2026-01-08T05:39:10.505Z",
    "size": 625,
    "path": "../public/games/nintendo-3ds/theatrhythm-final-fantasy/_payload.json"
  },
  "/games/nintendo-3ds/theatrhythm-final-fantasy-curtain-call/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8e9-OeVNKCkw86yDYUVLfKiEoSUg6JE\"",
    "mtime": "2026-01-08T05:39:04.845Z",
    "size": 256233,
    "path": "../public/games/nintendo-3ds/theatrhythm-final-fantasy-curtain-call/index.html"
  },
  "/games/nintendo-3ds/theatrhythm-final-fantasy-curtain-call/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"27e-VxkIz/gX75DAqrxh0WoBF8KySyU\"",
    "mtime": "2026-01-08T05:39:10.513Z",
    "size": 638,
    "path": "../public/games/nintendo-3ds/theatrhythm-final-fantasy-curtain-call/_payload.json"
  },
  "/games/nintendo-64/aidyn-chronicles-the-first-mage/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e941-mICReuvRfAxlfc1H/ciSjuuy5j8\"",
    "mtime": "2026-01-08T05:39:05.021Z",
    "size": 256321,
    "path": "../public/games/nintendo-64/aidyn-chronicles-the-first-mage/index.html"
  },
  "/games/nintendo-64/aidyn-chronicles-the-first-mage/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"286-OU4TQZ4rOueiUa3qN6P5ZKlJgLg\"",
    "mtime": "2026-01-08T05:39:10.600Z",
    "size": 646,
    "path": "../public/games/nintendo-64/aidyn-chronicles-the-first-mage/_payload.json"
  },
  "/games/nintendo-64/007-goldeneye/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e93b-iX3CpITVF2BLKBbFmTQKCYBem3w\"",
    "mtime": "2026-01-08T05:39:04.890Z",
    "size": 256315,
    "path": "../public/games/nintendo-64/007-goldeneye/index.html"
  },
  "/games/nintendo-64/007-goldeneye/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"2bf-Fc2unJldMUD4kozOed12Cp6hT/A\"",
    "mtime": "2026-01-08T05:39:10.525Z",
    "size": 703,
    "path": "../public/games/nintendo-64/007-goldeneye/_payload.json"
  },
  "/games/nintendo-64/banjo-kazooie/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e844-qRm4hefLiO4pcfkRDYOMwmpKmQI\"",
    "mtime": "2026-01-08T05:39:05.075Z",
    "size": 256068,
    "path": "../public/games/nintendo-64/banjo-kazooie/index.html"
  },
  "/games/nintendo-64/banjo-kazooie/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25f-7L1sFoyjkDogzIrA42RrU/7RO2U\"",
    "mtime": "2026-01-08T05:39:10.622Z",
    "size": 607,
    "path": "../public/games/nintendo-64/banjo-kazooie/_payload.json"
  },
  "/games/nintendo-64/conkers-bad-fur-day/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e87e-MuHDP6Z4l7CJg8eGeIvgQN6nWjE\"",
    "mtime": "2026-01-08T05:39:05.541Z",
    "size": 256126,
    "path": "../public/games/nintendo-64/conkers-bad-fur-day/index.html"
  },
  "/games/nintendo-64/conkers-bad-fur-day/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"268-7nRs1r7StVwBran7oG/T1XvXFr4\"",
    "mtime": "2026-01-08T05:39:10.725Z",
    "size": 616,
    "path": "../public/games/nintendo-64/conkers-bad-fur-day/_payload.json"
  },
  "/games/nintendo-64/banjo-tooie/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e83e-nhj/7L50Z9+XW/F6XXoNdq65ikc\"",
    "mtime": "2026-01-08T05:39:05.076Z",
    "size": 256062,
    "path": "../public/games/nintendo-64/banjo-tooie/index.html"
  },
  "/games/nintendo-64/banjo-tooie/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"260-hMSaxrGcOo+tozPRtbjRUcCEJ68\"",
    "mtime": "2026-01-08T05:39:10.624Z",
    "size": 608,
    "path": "../public/games/nintendo-64/banjo-tooie/_payload.json"
  },
  "/games/nintendo-64/doom-64/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e826-xhtxNAhkzgRoJ80bzD2579KiAQs\"",
    "mtime": "2026-01-08T05:39:06.043Z",
    "size": 256038,
    "path": "../public/games/nintendo-64/doom-64/index.html"
  },
  "/games/nintendo-64/doom-64/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"262-P4pJjBMYXL53ry1LEB1teUX9HJg\"",
    "mtime": "2026-01-08T05:39:10.816Z",
    "size": 610,
    "path": "../public/games/nintendo-64/doom-64/_payload.json"
  },
  "/games/nintendo-64/diddy-kong-racing/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e951-ApXOeaTWn++LmXW2kqMqm4N3jok\"",
    "mtime": "2026-01-08T05:39:05.846Z",
    "size": 256337,
    "path": "../public/games/nintendo-64/diddy-kong-racing/index.html"
  },
  "/games/nintendo-64/diddy-kong-racing/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"2c2-hDxgmp8jNccOp+qJfVvFKNApuf0\"",
    "mtime": "2026-01-08T05:39:10.800Z",
    "size": 706,
    "path": "../public/games/nintendo-64/diddy-kong-racing/_payload.json"
  },
  "/games/nintendo-64/007-the-world-is-not-enough/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e89a-IGC8uA21k5z5fXNfvj2xgdFDvhs\"",
    "mtime": "2026-01-08T05:39:04.925Z",
    "size": 256154,
    "path": "../public/games/nintendo-64/007-the-world-is-not-enough/index.html"
  },
  "/games/nintendo-64/007-the-world-is-not-enough/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"26e-ybMj3/5w8bMT+HomN96cDHitzk0\"",
    "mtime": "2026-01-08T05:39:10.524Z",
    "size": 622,
    "path": "../public/games/nintendo-64/007-the-world-is-not-enough/_payload.json"
  },
  "/games/nintendo-64/forsaken-64/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e924-yIcjvOAsy+bNFm80gJWGlgv/3ig\"",
    "mtime": "2026-01-08T05:39:04.073Z",
    "size": 256292,
    "path": "../public/games/nintendo-64/forsaken-64/index.html"
  },
  "/games/nintendo-64/forsaken-64/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"2bc-Zp+z2rAJwSIeGXhPgY8xyVZi73s\"",
    "mtime": "2026-01-08T05:39:10.373Z",
    "size": 700,
    "path": "../public/games/nintendo-64/forsaken-64/_payload.json"
  },
  "/games/nintendo-64/gauntlet-legends/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e856-2ChIv8a70tr0XpOkzSOYY1ZYUBk\"",
    "mtime": "2026-01-08T05:39:06.792Z",
    "size": 256086,
    "path": "../public/games/nintendo-64/gauntlet-legends/index.html"
  },
  "/games/nintendo-64/gauntlet-legends/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"262-GK4d0LgeaPzMZUEhxVieA8I3+z4\"",
    "mtime": "2026-01-08T05:39:11.009Z",
    "size": 610,
    "path": "../public/games/nintendo-64/gauntlet-legends/_payload.json"
  },
  "/games/nintendo-64/glover/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e81a-QxEepOBPKZlkaRvAlACS0aHP0EM\"",
    "mtime": "2026-01-08T05:39:06.801Z",
    "size": 256026,
    "path": "../public/games/nintendo-64/glover/index.html"
  },
  "/games/nintendo-64/glover/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"258-4CON5Yi9uTVWS0s0xC5w+LgScPk\"",
    "mtime": "2026-01-08T05:39:11.009Z",
    "size": 600,
    "path": "../public/games/nintendo-64/glover/_payload.json"
  },
  "/games/nintendo-64/hexen/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3f37d-iXhCw8LUwmnS2k9S1ZUAGnsm5vs\"",
    "mtime": "2026-01-08T05:39:07.154Z",
    "size": 258941,
    "path": "../public/games/nintendo-64/hexen/index.html"
  },
  "/games/nintendo-64/hexen/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"468-/03I6z9FHzc22wz5CJ63VQ/DXB4\"",
    "mtime": "2026-01-08T05:39:11.077Z",
    "size": 1128,
    "path": "../public/games/nintendo-64/hexen/_payload.json"
  },
  "/games/nintendo-64/legend-of-zelda-majoras-mask/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8bf-hVofnb+ppZW0kRt1WN9DDiEdQgA\"",
    "mtime": "2026-01-08T05:39:07.464Z",
    "size": 256191,
    "path": "../public/games/nintendo-64/legend-of-zelda-majoras-mask/index.html"
  },
  "/games/nintendo-64/legend-of-zelda-majoras-mask/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"274-p0+e+vKtnuZyrxiPP/kvX8zwpqo\"",
    "mtime": "2026-01-08T05:39:11.178Z",
    "size": 628,
    "path": "../public/games/nintendo-64/legend-of-zelda-majoras-mask/_payload.json"
  },
  "/games/nintendo-64/legend-of-zelda-majoras-mask-jp/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8c8-sW67tPzWKsOBRJjy6TuLIN2g4RI\"",
    "mtime": "2026-01-08T05:39:07.517Z",
    "size": 256200,
    "path": "../public/games/nintendo-64/legend-of-zelda-majoras-mask-jp/index.html"
  },
  "/games/nintendo-64/legend-of-zelda-majoras-mask-jp/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"275-ir4mtrmteufGE6+u1PFUt3aekNk\"",
    "mtime": "2026-01-08T05:39:11.179Z",
    "size": 629,
    "path": "../public/games/nintendo-64/legend-of-zelda-majoras-mask-jp/_payload.json"
  },
  "/games/nintendo-64/mario-kart-64/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8f5-eVjy9TzLWUdFq66zIDC+15TX6BI\"",
    "mtime": "2026-01-08T05:39:07.668Z",
    "size": 256245,
    "path": "../public/games/nintendo-64/mario-kart-64/index.html"
  },
  "/games/nintendo-64/mario-kart-64/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"295-gJxjMo33oKScbThOiGo8oPbJXOU\"",
    "mtime": "2026-01-08T05:39:11.238Z",
    "size": 661,
    "path": "../public/games/nintendo-64/mario-kart-64/_payload.json"
  },
  "/games/nintendo-64/legend-of-zelda-ocarina-of-time-the/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e98c-iYCHx4dq2m7jJDjzKvJyEJATUC4\"",
    "mtime": "2026-01-08T05:39:07.629Z",
    "size": 256396,
    "path": "../public/games/nintendo-64/legend-of-zelda-ocarina-of-time-the/index.html"
  },
  "/games/nintendo-64/legend-of-zelda-ocarina-of-time-the/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"2be-+r/EkKyuvAMdJU9Mh4VZs59q7n0\"",
    "mtime": "2026-01-08T05:39:11.202Z",
    "size": 702,
    "path": "../public/games/nintendo-64/legend-of-zelda-ocarina-of-time-the/_payload.json"
  },
  "/games/nintendo-64/mario-party/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e838-vF3SsOnINDLrItTOSgUleJwlfto\"",
    "mtime": "2026-01-08T05:39:07.668Z",
    "size": 256056,
    "path": "../public/games/nintendo-64/mario-party/index.html"
  },
  "/games/nintendo-64/mario-party/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"263-0MqYj4o31ag2wd+O85Jkb26659M\"",
    "mtime": "2026-01-08T05:39:11.238Z",
    "size": 611,
    "path": "../public/games/nintendo-64/mario-party/_payload.json"
  },
  "/games/nintendo-64/mario-tennis/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e83e-duci6eOtjyEFoDSIrpGZzB8liqE\"",
    "mtime": "2026-01-08T05:39:07.668Z",
    "size": 256062,
    "path": "../public/games/nintendo-64/mario-tennis/index.html"
  },
  "/games/nintendo-64/mario-tennis/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25d-1//pgmRTHIaxOOFcRSTPywv4PUk\"",
    "mtime": "2026-01-08T05:39:11.257Z",
    "size": 605,
    "path": "../public/games/nintendo-64/mario-tennis/_payload.json"
  },
  "/games/nintendo-64/mischief-makers/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8e9-b2CgjhDgC0PVg78jPk8ivEtuaPg\"",
    "mtime": "2026-01-08T05:39:03.935Z",
    "size": 256233,
    "path": "../public/games/nintendo-64/mischief-makers/index.html"
  },
  "/games/nintendo-64/mischief-makers/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"281-neTc0bKdaRZ9Jed8VBgsdR2F3kY\"",
    "mtime": "2026-01-08T05:39:10.350Z",
    "size": 641,
    "path": "../public/games/nintendo-64/mischief-makers/_payload.json"
  },
  "/games/nintendo-64/paper-mario/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e838-r8Y1w63OwWoYfdMhjroPIzfOunw\"",
    "mtime": "2026-01-08T05:39:08.345Z",
    "size": 256056,
    "path": "../public/games/nintendo-64/paper-mario/index.html"
  },
  "/games/nintendo-64/paper-mario/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25d-rgV97MMSZ546FUO+m4tOyvnWYa0\"",
    "mtime": "2026-01-08T05:39:11.374Z",
    "size": 605,
    "path": "../public/games/nintendo-64/paper-mario/_payload.json"
  },
  "/games/nintendo-64/pokemon-snap/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e83e-UmbN1r1+3rB/DtcY3s7YsI7BhaU\"",
    "mtime": "2026-01-08T05:39:08.555Z",
    "size": 256062,
    "path": "../public/games/nintendo-64/pokemon-snap/index.html"
  },
  "/games/nintendo-64/pokemon-snap/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25e-tyeChcKP99QhHuvlPsDlL7wxBfI\"",
    "mtime": "2026-01-08T05:39:11.435Z",
    "size": 606,
    "path": "../public/games/nintendo-64/pokemon-snap/_payload.json"
  },
  "/games/nintendo-64/perfect-dark/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e92d-/zsTHOQ0ePEu7DfS/XLlQ0j+ywg\"",
    "mtime": "2026-01-08T05:39:08.345Z",
    "size": 256301,
    "path": "../public/games/nintendo-64/perfect-dark/index.html"
  },
  "/games/nintendo-64/perfect-dark/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"2c0-nICtykDumZxLCGuDlteOXlyApYI\"",
    "mtime": "2026-01-08T05:39:11.416Z",
    "size": 704,
    "path": "../public/games/nintendo-64/perfect-dark/_payload.json"
  },
  "/games/nintendo-64/pokemon-stadium-2/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e862-8SuHus+cYVmhBc+IDxr4//8Ny1A\"",
    "mtime": "2026-01-08T05:39:08.596Z",
    "size": 256098,
    "path": "../public/games/nintendo-64/pokemon-stadium-2/index.html"
  },
  "/games/nintendo-64/pokemon-stadium-2/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"266-4v+H4bxCtEvQ8KMZb1HXPB8fgac\"",
    "mtime": "2026-01-08T05:39:11.512Z",
    "size": 614,
    "path": "../public/games/nintendo-64/pokemon-stadium-2/_payload.json"
  },
  "/games/nintendo-64/quest-64/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e826-Bmq3JyQsScyyG9DjcTQSQtuIn/Y\"",
    "mtime": "2026-01-08T05:39:08.597Z",
    "size": 256038,
    "path": "../public/games/nintendo-64/quest-64/index.html"
  },
  "/games/nintendo-64/quest-64/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25a-OVnb8J4ddBzSpjj6Ob71vhvIsSM\"",
    "mtime": "2026-01-08T05:39:11.467Z",
    "size": 602,
    "path": "../public/games/nintendo-64/quest-64/_payload.json"
  },
  "/games/nintendo-64/south-park-64/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e83b-ZDJxQd+MfIyrfWvRllz0zQr+eZo\"",
    "mtime": "2026-01-08T05:39:09.259Z",
    "size": 256059,
    "path": "../public/games/nintendo-64/south-park-64/index.html"
  },
  "/games/nintendo-64/south-park-64/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25c-aQhQBDCeKjO32qZO8EolZ1QCFLs\"",
    "mtime": "2026-01-08T05:39:11.669Z",
    "size": 604,
    "path": "../public/games/nintendo-64/south-park-64/_payload.json"
  },
  "/games/nintendo-64/star-fox-64/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e838-AIiqtL9yvFMkhLazxx9qQGmoY8g\"",
    "mtime": "2026-01-08T05:39:09.478Z",
    "size": 256056,
    "path": "../public/games/nintendo-64/star-fox-64/index.html"
  },
  "/games/nintendo-64/star-fox-64/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25d-tkYHRSzMw89NZZzWRc9gOZwA/QA\"",
    "mtime": "2026-01-08T05:39:11.689Z",
    "size": 605,
    "path": "../public/games/nintendo-64/star-fox-64/_payload.json"
  },
  "/games/nintendo-64/star-wars-episode-1-racer/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e88e-2bAxYhb+Yrrg7BaeffFEUBG7nEs\"",
    "mtime": "2026-01-08T05:39:09.477Z",
    "size": 256142,
    "path": "../public/games/nintendo-64/star-wars-episode-1-racer/index.html"
  },
  "/games/nintendo-64/star-wars-episode-1-racer/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"26c-+dvXpRUGMpRFe9A7izYjjbxZTRY\"",
    "mtime": "2026-01-08T05:39:11.689Z",
    "size": 620,
    "path": "../public/games/nintendo-64/star-wars-episode-1-racer/_payload.json"
  },
  "/games/nintendo-64/star-wars-rogue-squadron/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e888-UE9u68mdqZnawP39riaq/PqJeCA\"",
    "mtime": "2026-01-08T05:39:09.478Z",
    "size": 256136,
    "path": "../public/games/nintendo-64/star-wars-rogue-squadron/index.html"
  },
  "/games/nintendo-64/star-wars-rogue-squadron/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"26b-XSkqeNCozD34cIwXYDdnhLFbGXM\"",
    "mtime": "2026-01-08T05:39:11.707Z",
    "size": 619,
    "path": "../public/games/nintendo-64/star-wars-rogue-squadron/_payload.json"
  },
  "/games/nintendo-64/star-wars-shadows-of-the-empire/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e976-+LhBWt5qtVz8nVUQGTLA7a8RW2E\"",
    "mtime": "2026-01-08T05:39:09.478Z",
    "size": 256374,
    "path": "../public/games/nintendo-64/star-wars-shadows-of-the-empire/index.html"
  },
  "/games/nintendo-64/star-wars-shadows-of-the-empire/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"2c4-c9/C3YHoycPK6ATWYZNkRKfBLeo\"",
    "mtime": "2026-01-08T05:39:11.707Z",
    "size": 708,
    "path": "../public/games/nintendo-64/star-wars-shadows-of-the-empire/_payload.json"
  },
  "/games/nintendo-64/super-mario-64/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e84a-tleqC2U9517GhXv74W4C4dS6LS0\"",
    "mtime": "2026-01-08T05:39:09.760Z",
    "size": 256074,
    "path": "../public/games/nintendo-64/super-mario-64/index.html"
  },
  "/games/nintendo-64/super-mario-64/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"260-KvmpRJpvyTyQ4vbfHIVEH11xUp8\"",
    "mtime": "2026-01-08T05:39:11.725Z",
    "size": 608,
    "path": "../public/games/nintendo-64/super-mario-64/_payload.json"
  },
  "/games/nintendo-64/super-smash-bros/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e859-ksRJMTOeLi1GIuXVb7Dxs+BFffA\"",
    "mtime": "2026-01-08T05:39:09.761Z",
    "size": 256089,
    "path": "../public/games/nintendo-64/super-smash-bros/index.html"
  },
  "/games/nintendo-64/super-smash-bros/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"262-leTIF/L4nmY9UZ9R/dqDdlgHhtM\"",
    "mtime": "2026-01-08T05:39:11.777Z",
    "size": 610,
    "path": "../public/games/nintendo-64/super-smash-bros/_payload.json"
  },
  "/games/nintendo-64/turok-2-seeds-of-evil/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e87c-vcwaxWwnwJYMGmrdidze8lXq2Z0\"",
    "mtime": "2026-01-08T05:39:10.208Z",
    "size": 256124,
    "path": "../public/games/nintendo-64/turok-2-seeds-of-evil/index.html"
  },
  "/games/nintendo-64/turok-2-seeds-of-evil/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"26b-pKfoVw7feyXSnL+FAXqFYSR0wNQ\"",
    "mtime": "2026-01-08T05:39:11.836Z",
    "size": 619,
    "path": "../public/games/nintendo-64/turok-2-seeds-of-evil/_payload.json"
  },
  "/games/nintendo-64/yoshis-story/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e84e-lUtWVE61MLLNNOT5crAKCuZLDRE\"",
    "mtime": "2026-01-08T05:39:10.221Z",
    "size": 256078,
    "path": "../public/games/nintendo-64/yoshis-story/index.html"
  },
  "/games/nintendo-64/yoshis-story/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25f-9GlZT8B3DjZBKLuqEDXHHIWEBvY\"",
    "mtime": "2026-01-08T05:39:11.862Z",
    "size": 607,
    "path": "../public/games/nintendo-64/yoshis-story/_payload.json"
  },
  "/games/gamecube/conflict-desert-storm/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e867-fXazJawLs6asj0q6W1g68FmI064\"",
    "mtime": "2026-01-08T05:39:05.628Z",
    "size": 256103,
    "path": "../public/games/gamecube/conflict-desert-storm/index.html"
  },
  "/games/gamecube/conflict-desert-storm/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"265-71QfdkGrk2EnccgkUKSt2yeazBk\"",
    "mtime": "2026-01-08T05:39:10.740Z",
    "size": 613,
    "path": "../public/games/gamecube/conflict-desert-storm/_payload.json"
  },
  "/games/gamecube/final-fantasy-crystal-chronicles/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8a9-24O5yTzB7OYxIawckfU226Zs5lk\"",
    "mtime": "2026-01-08T05:39:06.792Z",
    "size": 256169,
    "path": "../public/games/gamecube/final-fantasy-crystal-chronicles/index.html"
  },
  "/games/gamecube/final-fantasy-crystal-chronicles/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"270-PSikjt68GXE8bip/Bq497YyZLvk\"",
    "mtime": "2026-01-08T05:39:10.988Z",
    "size": 624,
    "path": "../public/games/gamecube/final-fantasy-crystal-chronicles/_payload.json"
  },
  "/games/gamecube/legend-of-zelda-collection/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e892-DkxpTwVE4qCbylfHoPanmgafHA0\"",
    "mtime": "2026-01-08T05:39:07.464Z",
    "size": 256146,
    "path": "../public/games/gamecube/legend-of-zelda-collection/index.html"
  },
  "/games/gamecube/legend-of-zelda-collection/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"26e-8eP4knj95Jo4UFOkUbv+9FE4xuc\"",
    "mtime": "2026-01-08T05:39:11.178Z",
    "size": 622,
    "path": "../public/games/gamecube/legend-of-zelda-collection/_payload.json"
  },
  "/games/gamecube/legend-of-zelda-four-sword-adventures/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8d6-vqGXsyN4aXfan4hAwJk4Y/qYBCM\"",
    "mtime": "2026-01-08T05:39:07.464Z",
    "size": 256214,
    "path": "../public/games/gamecube/legend-of-zelda-four-sword-adventures/index.html"
  },
  "/games/gamecube/legend-of-zelda-four-sword-adventures/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"27a-3YYtK3AobO9gAj7HvYvqNCbnHPI\"",
    "mtime": "2026-01-08T05:39:11.178Z",
    "size": 634,
    "path": "../public/games/gamecube/legend-of-zelda-four-sword-adventures/_payload.json"
  },
  "/games/gamecube/legend-of-zelda-windwaker-the/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e89a-uaT1p361QbhYFvKKprTxmLUL95Q\"",
    "mtime": "2026-01-08T05:39:07.629Z",
    "size": 256154,
    "path": "../public/games/gamecube/legend-of-zelda-windwaker-the/index.html"
  },
  "/games/gamecube/legend-of-zelda-windwaker-the/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"26e-C/rDFbCwTdYU5T4QsEeEPOYJShw\"",
    "mtime": "2026-01-08T05:39:11.220Z",
    "size": 622,
    "path": "../public/games/gamecube/legend-of-zelda-windwaker-the/_payload.json"
  },
  "/games/gamecube/metal-gear-solid-the-twin-snakes/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8a9-eGDRLuxm5UrEEwImvwDBOJBdh+M\"",
    "mtime": "2026-01-08T05:39:07.917Z",
    "size": 256169,
    "path": "../public/games/gamecube/metal-gear-solid-the-twin-snakes/index.html"
  },
  "/games/gamecube/metal-gear-solid-the-twin-snakes/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"270-PDH86jGPNCHugRONNSo3cOKdKzE\"",
    "mtime": "2026-01-08T05:39:11.297Z",
    "size": 624,
    "path": "../public/games/gamecube/metal-gear-solid-the-twin-snakes/_payload.json"
  },
  "/games/gamecube/legend-of-zelda-ocarina-of-time-master-quest/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e906-n1bgGWYENwC8sKUY5zpApyiNZEo\"",
    "mtime": "2026-01-08T05:39:07.591Z",
    "size": 256262,
    "path": "../public/games/gamecube/legend-of-zelda-ocarina-of-time-master-quest/index.html"
  },
  "/games/gamecube/legend-of-zelda-ocarina-of-time-master-quest/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"282-UjYhK6mXiq1f3Lgkx/SBkYG70KE\"",
    "mtime": "2026-01-08T05:39:11.202Z",
    "size": 642,
    "path": "../public/games/gamecube/legend-of-zelda-ocarina-of-time-master-quest/_payload.json"
  },
  "/games/gamecube/resident-evil/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e835-g7Reggd0O6kyULn4TpPgcdoOn5k\"",
    "mtime": "2026-01-08T05:39:08.599Z",
    "size": 256053,
    "path": "../public/games/gamecube/resident-evil/index.html"
  },
  "/games/gamecube/resident-evil/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25c-aZMSgv62HiHx3udHrR4FU+1vM4I\"",
    "mtime": "2026-01-08T05:39:11.492Z",
    "size": 604,
    "path": "../public/games/gamecube/resident-evil/_payload.json"
  },
  "/games/gamecube/metroid-prime/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e835-1xa1IfVu0QGanc7xaL/lAwzv3mo\"",
    "mtime": "2026-01-08T05:39:08.024Z",
    "size": 256053,
    "path": "../public/games/gamecube/metroid-prime/index.html"
  },
  "/games/gamecube/metroid-prime/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25b-T5CDUyMB5xTHHZym1tozbalWSoQ\"",
    "mtime": "2026-01-08T05:39:11.297Z",
    "size": 603,
    "path": "../public/games/gamecube/metroid-prime/_payload.json"
  },
  "/games/gamecube/resident-evil-0/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e841-we6lT/43weUsl+AWG0MKVon2fkg\"",
    "mtime": "2026-01-08T05:39:08.599Z",
    "size": 256065,
    "path": "../public/games/gamecube/resident-evil-0/index.html"
  },
  "/games/gamecube/resident-evil-0/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25e-o0SrrqVAR5ODqrSEQ3fep+8P1B8\"",
    "mtime": "2026-01-08T05:39:11.512Z",
    "size": 606,
    "path": "../public/games/gamecube/resident-evil-0/_payload.json"
  },
  "/games/gamecube/soulcalibur-ii-gcn/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e841-kj8YZaeX4jlgg6qLhZ2PnRigqVg\"",
    "mtime": "2026-01-08T05:39:09.259Z",
    "size": 256065,
    "path": "../public/games/gamecube/soulcalibur-ii-gcn/index.html"
  },
  "/games/gamecube/soulcalibur-ii-gcn/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25a-U/UjDF6LMW0ctbjEZKWT1EqbQZM\"",
    "mtime": "2026-01-08T05:39:11.669Z",
    "size": 602,
    "path": "../public/games/gamecube/soulcalibur-ii-gcn/_payload.json"
  },
  "/games/gamecube/super-mario-sunshine/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e861-nlj9E4kF82N400GUT9honXIq1D0\"",
    "mtime": "2026-01-08T05:39:09.761Z",
    "size": 256097,
    "path": "../public/games/gamecube/super-mario-sunshine/index.html"
  },
  "/games/gamecube/super-mario-sunshine/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"264-1xHbUFbuHYzfLyxv7J3Ixwse+jA\"",
    "mtime": "2026-01-08T05:39:11.742Z",
    "size": 612,
    "path": "../public/games/gamecube/super-mario-sunshine/_payload.json"
  },
  "/games/gamecube/super-smash-bros-melee/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e868-0AK0oMX8bmgZ+hcCIH0f8hwnVMM\"",
    "mtime": "2026-01-08T05:39:09.761Z",
    "size": 256104,
    "path": "../public/games/gamecube/super-smash-bros-melee/index.html"
  },
  "/games/gamecube/super-smash-bros-melee/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"263-dE+ENZNTtMqXCp9fIRvBAMV8wVU\"",
    "mtime": "2026-01-08T05:39:11.758Z",
    "size": 611,
    "path": "../public/games/gamecube/super-smash-bros-melee/_payload.json"
  },
  "/games/nintendo-ds/chrono-trigger-ds/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e859-WkVq9yWXkqhZeQX9qLBWqqB0kio\"",
    "mtime": "2026-01-08T05:39:05.592Z",
    "size": 256089,
    "path": "../public/games/nintendo-ds/chrono-trigger-ds/index.html"
  },
  "/games/nintendo-ds/chrono-trigger-ds/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"262-JmwTP348W5P4i7BPcsUI4ZvIaSs\"",
    "mtime": "2026-01-08T05:39:10.725Z",
    "size": 610,
    "path": "../public/games/nintendo-ds/chrono-trigger-ds/_payload.json"
  },
  "/games/nintendo-ds/dementium-ii/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e83e-jMmNdsoBM69h1+Dd5jDVctpa/8M\"",
    "mtime": "2026-01-08T05:39:05.793Z",
    "size": 256062,
    "path": "../public/games/nintendo-ds/dementium-ii/index.html"
  },
  "/games/nintendo-ds/dementium-ii/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25d-Qi+4MZdRc9uObu9MEBxZFlUR6T0\"",
    "mtime": "2026-01-08T05:39:10.783Z",
    "size": 605,
    "path": "../public/games/nintendo-ds/dementium-ii/_payload.json"
  },
  "/games/nintendo-ds/dementium-the-ward/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e864-nDewWroIk/keIjt/OtcfL9IzR3c\"",
    "mtime": "2026-01-08T05:39:05.793Z",
    "size": 256100,
    "path": "../public/games/nintendo-ds/dementium-the-ward/index.html"
  },
  "/games/nintendo-ds/dementium-the-ward/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"264-Q9LS5HPTRD3gPfoph3GldUEtPSI\"",
    "mtime": "2026-01-08T05:39:10.783Z",
    "size": 612,
    "path": "../public/games/nintendo-ds/dementium-the-ward/_payload.json"
  },
  "/games/nintendo-ds/final-fantasy-crystal-chronicles-echoes-of-time-ds/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e921-MRDvPjiCNULmjWRV7e/e4CtJC5Y\"",
    "mtime": "2026-01-08T05:39:06.418Z",
    "size": 256289,
    "path": "../public/games/nintendo-ds/final-fantasy-crystal-chronicles-echoes-of-time-ds/index.html"
  },
  "/games/nintendo-ds/final-fantasy-crystal-chronicles-echoes-of-time-ds/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"284-c015rTN7WmaFykQKLqA2aMBGf+4\"",
    "mtime": "2026-01-08T05:39:10.894Z",
    "size": 644,
    "path": "../public/games/nintendo-ds/final-fantasy-crystal-chronicles-echoes-of-time-ds/_payload.json"
  },
  "/games/nintendo-ds/final-fantasy-crystal-chronicles-ring-of-fates/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e90c-61oI/H/VJDg6/r2x8S5ks9o7A9E\"",
    "mtime": "2026-01-08T05:39:06.508Z",
    "size": 256268,
    "path": "../public/games/nintendo-ds/final-fantasy-crystal-chronicles-ring-of-fates/index.html"
  },
  "/games/nintendo-ds/final-fantasy-crystal-chronicles-ring-of-fates/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"280-W2DdcWLyphCnmBcg6r0apPj53/c\"",
    "mtime": "2026-01-08T05:39:10.913Z",
    "size": 640,
    "path": "../public/games/nintendo-ds/final-fantasy-crystal-chronicles-ring-of-fates/_payload.json"
  },
  "/games/nintendo-ds/final-fantasy-iii-ds/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e865-Husbe9aqVBTZMUPV/QoH/thwv+Y\"",
    "mtime": "2026-01-08T05:39:06.583Z",
    "size": 256101,
    "path": "../public/games/nintendo-ds/final-fantasy-iii-ds/index.html"
  },
  "/games/nintendo-ds/final-fantasy-iii-ds/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"262-u5vt38Td4J78/QBcfbekJySSyCc\"",
    "mtime": "2026-01-08T05:39:10.913Z",
    "size": 610,
    "path": "../public/games/nintendo-ds/final-fantasy-iii-ds/_payload.json"
  },
  "/games/nintendo-ds/final-fantasy-iv/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e85c-HoGiDGO3LmlbBAs5NGp9HK/GipE\"",
    "mtime": "2026-01-08T05:39:06.590Z",
    "size": 256092,
    "path": "../public/games/nintendo-ds/final-fantasy-iv/index.html"
  },
  "/games/nintendo-ds/final-fantasy-iv/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"264-L1sO+RNNlGBlonjF9TuKpMb7LW0\"",
    "mtime": "2026-01-08T05:39:10.930Z",
    "size": 612,
    "path": "../public/games/nintendo-ds/final-fantasy-iv/_payload.json"
  },
  "/games/nintendo-ds/final-fantasy-xii-revenant-wings/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8b8-7q/t63/GROld7r2AaRtopcYqJNg\"",
    "mtime": "2026-01-08T05:39:06.726Z",
    "size": 256184,
    "path": "../public/games/nintendo-ds/final-fantasy-xii-revenant-wings/index.html"
  },
  "/games/nintendo-ds/final-fantasy-xii-revenant-wings/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"272-iOX4XheqW9fFy0oumbHTBjB1WiQ\"",
    "mtime": "2026-01-08T05:39:10.969Z",
    "size": 626,
    "path": "../public/games/nintendo-ds/final-fantasy-xii-revenant-wings/_payload.json"
  },
  "/games/nintendo-ds/legend-of-zelda-phantom-hourglass-the/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8df-pQsfchPsNq7/FkDtZeyh0hS27Gs\"",
    "mtime": "2026-01-08T05:39:07.629Z",
    "size": 256223,
    "path": "../public/games/nintendo-ds/legend-of-zelda-phantom-hourglass-the/index.html"
  },
  "/games/nintendo-ds/legend-of-zelda-phantom-hourglass-the/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"27b-QuxWBEECzW1w8IzOwRYar1O2U7s\"",
    "mtime": "2026-01-08T05:39:11.201Z",
    "size": 635,
    "path": "../public/games/nintendo-ds/legend-of-zelda-phantom-hourglass-the/_payload.json"
  },
  "/games/nintendo-ds/moon/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8a5-ESzdjCc1grLgkWq0m7ly/zuKspo\"",
    "mtime": "2026-01-08T05:39:08.068Z",
    "size": 256165,
    "path": "../public/games/nintendo-ds/moon/index.html"
  },
  "/games/nintendo-ds/moon/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"277-+xguLt5QhS0/MqXNMhxuBIsk+h4\"",
    "mtime": "2026-01-08T05:39:11.314Z",
    "size": 631,
    "path": "../public/games/nintendo-ds/moon/_payload.json"
  },
  "/games/nintendo-ds/legend-of-zelda-spirit-tracks-the/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8c7-LWYvUoxjyjQVukgQF80KCNvQPJ4\"",
    "mtime": "2026-01-08T05:39:07.629Z",
    "size": 256199,
    "path": "../public/games/nintendo-ds/legend-of-zelda-spirit-tracks-the/index.html"
  },
  "/games/nintendo-ds/legend-of-zelda-spirit-tracks-the/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"277-5qGN4qZX82jW41UeV3tYNxahxmE\"",
    "mtime": "2026-01-08T05:39:11.202Z",
    "size": 631,
    "path": "../public/games/nintendo-ds/legend-of-zelda-spirit-tracks-the/_payload.json"
  },
  "/games/nintendo-ds/okamiden/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e82c-7GqTRtn9UgvfIbk8nhNriMdRe+U\"",
    "mtime": "2026-01-08T05:39:08.107Z",
    "size": 256044,
    "path": "../public/games/nintendo-ds/okamiden/index.html"
  },
  "/games/nintendo-ds/okamiden/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25b-BvSTLf7lGqlw+WMpA1KdzYadL9M\"",
    "mtime": "2026-01-08T05:39:11.351Z",
    "size": 603,
    "path": "../public/games/nintendo-ds/okamiden/_payload.json"
  },
  "/games/nintendo-ds/pokemon-white/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e84a-+QCRRGiVIVDh0vs5sFRiOsI16OA\"",
    "mtime": "2026-01-08T05:39:08.596Z",
    "size": 256074,
    "path": "../public/games/nintendo-ds/pokemon-white/index.html"
  },
  "/games/nintendo-ds/pokemon-white/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"261-TYcaPxMzluS6PsEaoH9e0HmKSf4\"",
    "mtime": "2026-01-08T05:39:11.435Z",
    "size": 609,
    "path": "../public/games/nintendo-ds/pokemon-white/_payload.json"
  },
  "/games/nintendo-ds/super-mario-64-ds/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e85c-0N92AHvSdwMD5Y4K1VOeq/lz3r8\"",
    "mtime": "2026-01-08T05:39:09.760Z",
    "size": 256092,
    "path": "../public/games/nintendo-ds/super-mario-64-ds/index.html"
  },
  "/games/nintendo-ds/super-mario-64-ds/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"261-Fj+MaijrMl7i7BHDuevS9xcpw+8\"",
    "mtime": "2026-01-08T05:39:11.725Z",
    "size": 609,
    "path": "../public/games/nintendo-ds/super-mario-64-ds/_payload.json"
  },
  "/games/pc/age-of-empires/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3ee08-BJfWewwh5GIgKd8Pge8sD5WXdMw\"",
    "mtime": "2026-01-08T05:39:05.021Z",
    "size": 257544,
    "path": "../public/games/pc/age-of-empires/index.html"
  },
  "/games/pc/age-of-empires/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"331-z5OZoLIczPolbXyNxXFE8SBnE8k\"",
    "mtime": "2026-01-08T05:39:10.600Z",
    "size": 817,
    "path": "../public/games/pc/age-of-empires/_payload.json"
  },
  "/games/pc/chasm-the-rift/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3ee6a-MKypTH7RY6siU9HvmsZ5/WbnZdE\"",
    "mtime": "2026-01-08T05:39:03.935Z",
    "size": 257642,
    "path": "../public/games/pc/chasm-the-rift/index.html"
  },
  "/games/pc/chasm-the-rift/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"395-1N/d6TRvMNGxqEc1pMuV0DHJswo\"",
    "mtime": "2026-01-08T05:39:10.350Z",
    "size": 917,
    "path": "../public/games/pc/chasm-the-rift/_payload.json"
  },
  "/games/pc/divinity-original-sin-2/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3ea85-xWncdgZCLVEHTX4Pu5zZnIWwCDY\"",
    "mtime": "2026-01-08T05:39:04.075Z",
    "size": 256645,
    "path": "../public/games/pc/divinity-original-sin-2/index.html"
  },
  "/games/pc/divinity-original-sin-2/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"37f-E6LdHKKwHCEEvMCXW7qKmXgw5o4\"",
    "mtime": "2026-01-08T05:39:10.374Z",
    "size": 895,
    "path": "../public/games/pc/divinity-original-sin-2/_payload.json"
  },
  "/games/pc/elden-ring/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e87f-dY+6VbsD+5cIifY6l43zJj81r2I\"",
    "mtime": "2026-01-08T05:39:06.329Z",
    "size": 256127,
    "path": "../public/games/pc/elden-ring/index.html"
  },
  "/games/pc/elden-ring/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"244-M5XPPS3Q9/o0u2TN1HjoROkfhds\"",
    "mtime": "2026-01-08T05:39:10.874Z",
    "size": 580,
    "path": "../public/games/pc/elden-ring/_payload.json"
  },
  "/games/pc/icewind-dale/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e805-Biv3aIMjxWxyONfO93tN+RZSpD0\"",
    "mtime": "2026-01-08T05:39:07.184Z",
    "size": 256005,
    "path": "../public/games/pc/icewind-dale/index.html"
  },
  "/games/pc/icewind-dale/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"237-8cl9ODmKwOhySzsnJuttp3tmrvM\"",
    "mtime": "2026-01-08T05:39:11.077Z",
    "size": 567,
    "path": "../public/games/pc/icewind-dale/_payload.json"
  },
  "/games/pc/iron-storm/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3f92a-LoQDMVrxav6OdjYFvQwGi0BF2/E\"",
    "mtime": "2026-01-08T05:39:04.073Z",
    "size": 260394,
    "path": "../public/games/pc/iron-storm/index.html"
  },
  "/games/pc/iron-storm/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"5af-KE8ZqZtnB/fb+yKRLzFlnnQ8cCU\"",
    "mtime": "2026-01-08T05:39:10.374Z",
    "size": 1455,
    "path": "../public/games/pc/iron-storm/_payload.json"
  },
  "/games/pc/life-is-strange-true-colors/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e9f4-7UlCJhY9nEHt6QYrX803POs82Pg\"",
    "mtime": "2026-01-08T05:39:04.399Z",
    "size": 256500,
    "path": "../public/games/pc/life-is-strange-true-colors/index.html"
  },
  "/games/pc/life-is-strange-true-colors/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"2fd-wU4gUQjqpSYWtc2heCTuXnNMsHU\"",
    "mtime": "2026-01-08T05:39:10.406Z",
    "size": 765,
    "path": "../public/games/pc/life-is-strange-true-colors/_payload.json"
  },
  "/games/pc/might-and-magic-vii-for-blood-and-honor/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3f4e0-xNfujT4wh7t+TJVRhkQnSCJXQZI\"",
    "mtime": "2026-01-08T05:39:08.148Z",
    "size": 259296,
    "path": "../public/games/pc/might-and-magic-vii-for-blood-and-honor/index.html"
  },
  "/games/pc/might-and-magic-vii-for-blood-and-honor/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"4d5-nkxbs7nnSY7LmydqFn8UBRTfYB8\"",
    "mtime": "2026-01-08T05:39:11.374Z",
    "size": 1237,
    "path": "../public/games/pc/might-and-magic-vii-for-blood-and-honor/_payload.json"
  },
  "/games/pc/nox/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3f8f8-H9XfzdfOyavh7JDKPNDfti8mmCw\"",
    "mtime": "2026-01-08T05:39:04.073Z",
    "size": 260344,
    "path": "../public/games/pc/nox/index.html"
  },
  "/games/pc/nox/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"5a0-9ZYIVTK5nRNxa1km+NG3u8pbPt8\"",
    "mtime": "2026-01-08T05:39:10.374Z",
    "size": 1440,
    "path": "../public/games/pc/nox/_payload.json"
  },
  "/games/pc/realms-of-the-haunting/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3eea4-16QTVdQ9gigQEm4kV0hHX6saGU0\"",
    "mtime": "2026-01-08T05:39:08.598Z",
    "size": 257700,
    "path": "../public/games/pc/realms-of-the-haunting/index.html"
  },
  "/games/pc/realms-of-the-haunting/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"3a4-jOS/KZy1NGF2wM6yAY42L5YN64o\"",
    "mtime": "2026-01-08T05:39:11.492Z",
    "size": 932,
    "path": "../public/games/pc/realms-of-the-haunting/_payload.json"
  },
  "/games/nintendo-entertainment-system/1943-the-battle-of-midway/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e99a-3P2Wm7Eu8bo+VIDxBeeRo2TWdF0\"",
    "mtime": "2026-01-08T05:39:04.978Z",
    "size": 256410,
    "path": "../public/games/nintendo-entertainment-system/1943-the-battle-of-midway/index.html"
  },
  "/games/nintendo-entertainment-system/1943-the-battle-of-midway/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"2a9-hPkQRkGg3p9kcTCyiXxsnzRQkRs\"",
    "mtime": "2026-01-08T05:39:10.573Z",
    "size": 681,
    "path": "../public/games/nintendo-entertainment-system/1943-the-battle-of-midway/_payload.json"
  },
  "/games/nintendo-entertainment-system/8-bit-xmas-2022/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3effe-u0NhT7dVtRDEcRMr8wUbdUhpSo8\"",
    "mtime": "2026-01-08T05:39:04.978Z",
    "size": 258046,
    "path": "../public/games/nintendo-entertainment-system/8-bit-xmas-2022/index.html"
  },
  "/games/nintendo-entertainment-system/8-bit-xmas-2022/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"405-vLH3XLY3MGGl36efQeYg978UGs4\"",
    "mtime": "2026-01-08T05:39:10.571Z",
    "size": 1029,
    "path": "../public/games/nintendo-entertainment-system/8-bit-xmas-2022/_payload.json"
  },
  "/games/nintendo-entertainment-system/abadox-the-deadly-inner-war/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e9b2-mFmcsOdfFN2KAC1bH9J4bbfwUqg\"",
    "mtime": "2026-01-08T05:39:04.978Z",
    "size": 256434,
    "path": "../public/games/nintendo-entertainment-system/abadox-the-deadly-inner-war/index.html"
  },
  "/games/nintendo-entertainment-system/abadox-the-deadly-inner-war/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"2b1-zcf79tCmLqEgzK/Vev39rf0ZH34\"",
    "mtime": "2026-01-08T05:39:10.571Z",
    "size": 689,
    "path": "../public/games/nintendo-entertainment-system/abadox-the-deadly-inner-war/_payload.json"
  },
  "/games/nintendo-entertainment-system/adventure-island-3/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8e0-T6l7aF7dNYgMCN25VwZJT+taqRU\"",
    "mtime": "2026-01-08T05:39:05.006Z",
    "size": 256224,
    "path": "../public/games/nintendo-entertainment-system/adventure-island-3/index.html"
  },
  "/games/nintendo-entertainment-system/adventure-island-3/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"288-Xexb/r+EtdfyiRlmuFWh+0xUU6Y\"",
    "mtime": "2026-01-08T05:39:10.573Z",
    "size": 648,
    "path": "../public/games/nintendo-entertainment-system/adventure-island-3/_payload.json"
  },
  "/games/nintendo-entertainment-system/adventure-island/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e9c8-olq4q2mtM4gRKo8pHRg7AkVb9Eo\"",
    "mtime": "2026-01-08T05:39:05.021Z",
    "size": 256456,
    "path": "../public/games/nintendo-entertainment-system/adventure-island/index.html"
  },
  "/games/nintendo-entertainment-system/adventure-island/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"2e9-dj3fwSHNGw536bErkRe4wkORyeo\"",
    "mtime": "2026-01-08T05:39:10.598Z",
    "size": 745,
    "path": "../public/games/nintendo-entertainment-system/adventure-island/_payload.json"
  },
  "/games/nintendo-entertainment-system/alwas-awakening/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8e4-0u+ZuGyVijqWrKB3anylHqKnfl4\"",
    "mtime": "2026-01-08T05:39:05.021Z",
    "size": 256228,
    "path": "../public/games/nintendo-entertainment-system/alwas-awakening/index.html"
  },
  "/games/nintendo-entertainment-system/alwas-awakening/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"28f-xJ8j001035Gd+pMs8KnLU2jMXCY\"",
    "mtime": "2026-01-08T05:39:10.592Z",
    "size": 655,
    "path": "../public/games/nintendo-entertainment-system/alwas-awakening/_payload.json"
  },
  "/games/nintendo-entertainment-system/adventures-of-dino-riki/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3f103-DjQ5eufwbhnwRni2S8/UtyWnZ9I\"",
    "mtime": "2026-01-08T05:39:04.545Z",
    "size": 258307,
    "path": "../public/games/nintendo-entertainment-system/adventures-of-dino-riki/index.html"
  },
  "/games/nintendo-entertainment-system/adventures-of-dino-riki/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"48c-eERlMMdjCPWE1v6dd/4w07ehoNM\"",
    "mtime": "2026-01-08T05:39:10.459Z",
    "size": 1164,
    "path": "../public/games/nintendo-entertainment-system/adventures-of-dino-riki/_payload.json"
  },
  "/games/nintendo-entertainment-system/adventure-island-ii/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e9da-Xcg/stjJIVHvjRlJ6HM1pthxjvY\"",
    "mtime": "2026-01-08T05:39:05.021Z",
    "size": 256474,
    "path": "../public/games/nintendo-entertainment-system/adventure-island-ii/index.html"
  },
  "/games/nintendo-entertainment-system/adventure-island-ii/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"2ed-vwsoeQFg2kYJbuLb4iIOhe00n8Y\"",
    "mtime": "2026-01-08T05:39:10.571Z",
    "size": 749,
    "path": "../public/games/nintendo-entertainment-system/adventure-island-ii/_payload.json"
  },
  "/games/nintendo-entertainment-system/astyanax/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e93e-0ipHpVjn5PN/7nk1BQPjyj8jMo0\"",
    "mtime": "2026-01-08T05:39:05.022Z",
    "size": 256318,
    "path": "../public/games/nintendo-entertainment-system/astyanax/index.html"
  },
  "/games/nintendo-entertainment-system/astyanax/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"29d-fltu8fOqTxXW1su/EP9KCFXvwq0\"",
    "mtime": "2026-01-08T05:39:10.600Z",
    "size": 669,
    "path": "../public/games/nintendo-entertainment-system/astyanax/_payload.json"
  },
  "/games/nintendo-entertainment-system/batman/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e898-bMh6C6acBR7Wxj8b8Pqv8P1j8Qc\"",
    "mtime": "2026-01-08T05:39:05.075Z",
    "size": 256152,
    "path": "../public/games/nintendo-entertainment-system/batman/index.html"
  },
  "/games/nintendo-entertainment-system/batman/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"27c-b1tM1+kJy+yJBvswo2YS1GmL9og\"",
    "mtime": "2026-01-08T05:39:10.600Z",
    "size": 636,
    "path": "../public/games/nintendo-entertainment-system/batman/_payload.json"
  },
  "/games/nintendo-entertainment-system/battletoads/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8bc-nuc4QXmnfRtgh8JK3Jyy3hnREeY\"",
    "mtime": "2026-01-08T05:39:05.192Z",
    "size": 256188,
    "path": "../public/games/nintendo-entertainment-system/battletoads/index.html"
  },
  "/games/nintendo-entertainment-system/battletoads/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"284-hH0FiB4TarKiGbux5J/rj56jkI4\"",
    "mtime": "2026-01-08T05:39:10.644Z",
    "size": 644,
    "path": "../public/games/nintendo-entertainment-system/battletoads/_payload.json"
  },
  "/games/nintendo-entertainment-system/blaster-master/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8d0-0Gd+YVa/IJ60eZGHx/CTVi754XQ\"",
    "mtime": "2026-01-08T05:39:05.280Z",
    "size": 256208,
    "path": "../public/games/nintendo-entertainment-system/blaster-master/index.html"
  },
  "/games/nintendo-entertainment-system/blaster-master/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"288-WLTCjqfgxGNC2JqfB/FTejsVYRM\"",
    "mtime": "2026-01-08T05:39:10.644Z",
    "size": 648,
    "path": "../public/games/nintendo-entertainment-system/blaster-master/_payload.json"
  },
  "/games/nintendo-entertainment-system/castlevania/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8b6-HCClJ6s4rT1O4S2ZnaWtH9gL918\"",
    "mtime": "2026-01-08T05:39:05.431Z",
    "size": 256182,
    "path": "../public/games/nintendo-entertainment-system/castlevania/index.html"
  },
  "/games/nintendo-entertainment-system/castlevania/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"281-qGvJRqXDjCAY/omgcjoic0V6lic\"",
    "mtime": "2026-01-08T05:39:10.695Z",
    "size": 641,
    "path": "../public/games/nintendo-entertainment-system/castlevania/_payload.json"
  },
  "/games/nintendo-entertainment-system/castlevania-ii-simons-quest/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e92e-gwTBrqBVLfrmZL/gYKq/j+mIwM0\"",
    "mtime": "2026-01-08T05:39:05.492Z",
    "size": 256302,
    "path": "../public/games/nintendo-entertainment-system/castlevania-ii-simons-quest/index.html"
  },
  "/games/nintendo-entertainment-system/castlevania-ii-simons-quest/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"296-6R7uUQLCb0qX+SeDXseCd32w7m4\"",
    "mtime": "2026-01-08T05:39:10.709Z",
    "size": 662,
    "path": "../public/games/nintendo-entertainment-system/castlevania-ii-simons-quest/_payload.json"
  },
  "/games/nintendo-entertainment-system/castlevania-iii-draculas-curse/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e940-SasMXQ/7xGk06d0RTmBPlkSZDxw\"",
    "mtime": "2026-01-08T05:39:05.492Z",
    "size": 256320,
    "path": "../public/games/nintendo-entertainment-system/castlevania-iii-draculas-curse/index.html"
  },
  "/games/nintendo-entertainment-system/castlevania-iii-draculas-curse/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"299-CfbcUYMHMYWQQ6I/evrYkXlOTjI\"",
    "mtime": "2026-01-08T05:39:10.709Z",
    "size": 665,
    "path": "../public/games/nintendo-entertainment-system/castlevania-iii-draculas-curse/_payload.json"
  },
  "/games/nintendo-entertainment-system/contra/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e932-AfJ2X772kkLwRZYJg4yOH3zH3UM\"",
    "mtime": "2026-01-08T05:39:05.541Z",
    "size": 256306,
    "path": "../public/games/nintendo-entertainment-system/contra/index.html"
  },
  "/games/nintendo-entertainment-system/contra/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"29b-2CEd8B9cTP466iLD6fLGC9P/aIY\"",
    "mtime": "2026-01-08T05:39:10.725Z",
    "size": 667,
    "path": "../public/games/nintendo-entertainment-system/contra/_payload.json"
  },
  "/games/nintendo-entertainment-system/darkwing-duck/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e959-SZm7o3aqq1H8fqXhdLx7zdTJsy4\"",
    "mtime": "2026-01-08T05:39:05.684Z",
    "size": 256345,
    "path": "../public/games/nintendo-entertainment-system/darkwing-duck/index.html"
  },
  "/games/nintendo-entertainment-system/darkwing-duck/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"2a1-sde6UufOffZf20RmrDiRsJQfhfU\"",
    "mtime": "2026-01-08T05:39:10.763Z",
    "size": 673,
    "path": "../public/games/nintendo-entertainment-system/darkwing-duck/_payload.json"
  },
  "/games/nintendo-entertainment-system/double-dragon/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e95c-e03Az/PGpDZHlzza3rzhAoazg8o\"",
    "mtime": "2026-01-08T05:39:06.043Z",
    "size": 256348,
    "path": "../public/games/nintendo-entertainment-system/double-dragon/index.html"
  },
  "/games/nintendo-entertainment-system/double-dragon/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"2a1-jG1s96vX5tcECBMDJylZ0uOgUzg\"",
    "mtime": "2026-01-08T05:39:10.833Z",
    "size": 673,
    "path": "../public/games/nintendo-entertainment-system/double-dragon/_payload.json"
  },
  "/games/nintendo-entertainment-system/dr-mario/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8a7-OHkOBnVozSQuvTu/b1No49GCn7M\"",
    "mtime": "2026-01-08T05:39:06.043Z",
    "size": 256167,
    "path": "../public/games/nintendo-entertainment-system/dr-mario/index.html"
  },
  "/games/nintendo-entertainment-system/dr-mario/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"27f-YEWNQEnSBzsxBp6ucgsQY6DoZ1g\"",
    "mtime": "2026-01-08T05:39:10.833Z",
    "size": 639,
    "path": "../public/games/nintendo-entertainment-system/dr-mario/_payload.json"
  },
  "/games/nintendo-entertainment-system/dragon-warrior/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8c8-VIPSQLBLDuEWdm7riiPAnPOh1lo\"",
    "mtime": "2026-01-08T05:39:06.116Z",
    "size": 256200,
    "path": "../public/games/nintendo-entertainment-system/dragon-warrior/index.html"
  },
  "/games/nintendo-entertainment-system/dragon-warrior/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"284-SUTCLANJErJ/DmrsDlcU4QsMMq0\"",
    "mtime": "2026-01-08T05:39:10.833Z",
    "size": 644,
    "path": "../public/games/nintendo-entertainment-system/dragon-warrior/_payload.json"
  },
  "/games/nintendo-entertainment-system/dragon-warrior-ii/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8e0-NlReGbKeUsMhjV0SK0lrEtvJsMQ\"",
    "mtime": "2026-01-08T05:39:06.117Z",
    "size": 256224,
    "path": "../public/games/nintendo-entertainment-system/dragon-warrior-ii/index.html"
  },
  "/games/nintendo-entertainment-system/dragon-warrior-ii/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"28a-FuRoZpah2QSI0PwxKsarIygU5w4\"",
    "mtime": "2026-01-08T05:39:10.850Z",
    "size": 650,
    "path": "../public/games/nintendo-entertainment-system/dragon-warrior-ii/_payload.json"
  },
  "/games/nintendo-entertainment-system/dragon-warrior-iii/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8e6-XIOA9g+6Zuy9yOtfWZBlmIBcPgQ\"",
    "mtime": "2026-01-08T05:39:06.117Z",
    "size": 256230,
    "path": "../public/games/nintendo-entertainment-system/dragon-warrior-iii/index.html"
  },
  "/games/nintendo-entertainment-system/dragon-warrior-iii/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"28b-+F6aa3DADRmrfK0/+rbsVbc9R3E\"",
    "mtime": "2026-01-08T05:39:10.850Z",
    "size": 651,
    "path": "../public/games/nintendo-entertainment-system/dragon-warrior-iii/_payload.json"
  },
  "/games/nintendo-entertainment-system/dragon-warrior-iv/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8e0-NCK9/tI2ygXZSrtn4dD+cXPzx+Y\"",
    "mtime": "2026-01-08T05:39:06.116Z",
    "size": 256224,
    "path": "../public/games/nintendo-entertainment-system/dragon-warrior-iv/index.html"
  },
  "/games/nintendo-entertainment-system/dragon-warrior-iv/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"28a-SGqG8BbQsmUP/TQseiQCW3jYPe8\"",
    "mtime": "2026-01-08T05:39:10.833Z",
    "size": 650,
    "path": "../public/games/nintendo-entertainment-system/dragon-warrior-iv/_payload.json"
  },
  "/games/nintendo-entertainment-system/ducktales/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8aa-TrBMgqQCkEeAJaNvnO8M/8DpJ88\"",
    "mtime": "2026-01-08T05:39:06.265Z",
    "size": 256170,
    "path": "../public/games/nintendo-entertainment-system/ducktales/index.html"
  },
  "/games/nintendo-entertainment-system/ducktales/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"27f-BPyA38yWSXlB6ktHBxHJyKNLjJ0\"",
    "mtime": "2026-01-08T05:39:10.850Z",
    "size": 639,
    "path": "../public/games/nintendo-entertainment-system/ducktales/_payload.json"
  },
  "/games/nintendo-entertainment-system/dynowarz-destruction-of-spondylus/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e93c-el/edcPkM8+HbAVsMajM02VAy90\"",
    "mtime": "2026-01-08T05:39:06.266Z",
    "size": 256316,
    "path": "../public/games/nintendo-entertainment-system/dynowarz-destruction-of-spondylus/index.html"
  },
  "/games/nintendo-entertainment-system/dynowarz-destruction-of-spondylus/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"298-zI14qI03z7WWrILyLFX4DBh0ivQ\"",
    "mtime": "2026-01-08T05:39:10.851Z",
    "size": 664,
    "path": "../public/games/nintendo-entertainment-system/dynowarz-destruction-of-spondylus/_payload.json"
  },
  "/games/nintendo-entertainment-system/final-fantasy/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e982-NF0IwUMFE/sMDkcQFEH6Z5uA18M\"",
    "mtime": "2026-01-08T05:39:06.432Z",
    "size": 256386,
    "path": "../public/games/nintendo-entertainment-system/final-fantasy/index.html"
  },
  "/games/nintendo-entertainment-system/final-fantasy/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"2c8-P22vLTFng0Gn5jiyYtOxTmvnSyk\"",
    "mtime": "2026-01-08T05:39:10.913Z",
    "size": 712,
    "path": "../public/games/nintendo-entertainment-system/final-fantasy/_payload.json"
  },
  "/games/nintendo-entertainment-system/friday-the-13th/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8d4-jU3ulu9yGEWm51x4JmiL/9N1FfY\"",
    "mtime": "2026-01-08T05:39:06.792Z",
    "size": 256212,
    "path": "../public/games/nintendo-entertainment-system/friday-the-13th/index.html"
  },
  "/games/nintendo-entertainment-system/friday-the-13th/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"288-5lAqe/yKtgbOG/We1MlS+QOX3u8\"",
    "mtime": "2026-01-08T05:39:10.988Z",
    "size": 648,
    "path": "../public/games/nintendo-entertainment-system/friday-the-13th/_payload.json"
  },
  "/games/nintendo-entertainment-system/get-em-gary/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8c6-o16Ke1oNrCRaXe3HKXg2ItgzqOA\"",
    "mtime": "2026-01-08T05:39:06.792Z",
    "size": 256198,
    "path": "../public/games/nintendo-entertainment-system/get-em-gary/index.html"
  },
  "/games/nintendo-entertainment-system/get-em-gary/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"282-46aheShOiFzSJifzxajokuV/oYU\"",
    "mtime": "2026-01-08T05:39:11.009Z",
    "size": 642,
    "path": "../public/games/nintendo-entertainment-system/get-em-gary/_payload.json"
  },
  "/games/nintendo-entertainment-system/gold-guardian-gun-girl/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8f8-8n/eDS3NCq0+/y9Q/RZdEO4m2eU\"",
    "mtime": "2026-01-08T05:39:07.023Z",
    "size": 256248,
    "path": "../public/games/nintendo-entertainment-system/gold-guardian-gun-girl/index.html"
  },
  "/games/nintendo-entertainment-system/gold-guardian-gun-girl/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"28c-IGwXwWcaDwdJy/0qNd+XgTGIyuY\"",
    "mtime": "2026-01-08T05:39:11.027Z",
    "size": 652,
    "path": "../public/games/nintendo-entertainment-system/gold-guardian-gun-girl/_payload.json"
  },
  "/games/nintendo-entertainment-system/gremlins-2/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8b0-cGs++2aJE63ZQLK+7RP1vFGHUIw\"",
    "mtime": "2026-01-08T05:39:07.024Z",
    "size": 256176,
    "path": "../public/games/nintendo-entertainment-system/gremlins-2/index.html"
  },
  "/games/nintendo-entertainment-system/gremlins-2/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"280-IXh1swdWmBVOwFhSsaD56SmheoM\"",
    "mtime": "2026-01-08T05:39:11.048Z",
    "size": 640,
    "path": "../public/games/nintendo-entertainment-system/gremlins-2/_payload.json"
  },
  "/games/nintendo-entertainment-system/guntner/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e89e-WOISJymXfGsTVCOOVJ2u9xo/fkw\"",
    "mtime": "2026-01-08T05:39:07.024Z",
    "size": 256158,
    "path": "../public/games/nintendo-entertainment-system/guntner/index.html"
  },
  "/games/nintendo-entertainment-system/guntner/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"268-s7GQacdOvBakkEohdxGplEZL/ZY\"",
    "mtime": "2026-01-08T05:39:11.049Z",
    "size": 616,
    "path": "../public/games/nintendo-entertainment-system/guntner/_payload.json"
  },
  "/games/nintendo-entertainment-system/ice-hockey/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8b0-2WC5+U8dmpxYvcujapjeNlimqf4\"",
    "mtime": "2026-01-08T05:39:07.203Z",
    "size": 256176,
    "path": "../public/games/nintendo-entertainment-system/ice-hockey/index.html"
  },
  "/games/nintendo-entertainment-system/ice-hockey/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"280-A/s7AJdPPRuOw11qNrwdFps1POM\"",
    "mtime": "2026-01-08T05:39:11.100Z",
    "size": 640,
    "path": "../public/games/nintendo-entertainment-system/ice-hockey/_payload.json"
  },
  "/games/nintendo-entertainment-system/jaws/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e926-BNLR8t9AJvJdXti7oqOZQv8l2Y0\"",
    "mtime": "2026-01-08T05:39:07.236Z",
    "size": 256294,
    "path": "../public/games/nintendo-entertainment-system/jaws/index.html"
  },
  "/games/nintendo-entertainment-system/jaws/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"299-uI9HvOLw+vjCsPsj5W0JrnyKJVs\"",
    "mtime": "2026-01-08T05:39:11.116Z",
    "size": 665,
    "path": "../public/games/nintendo-entertainment-system/jaws/_payload.json"
  },
  "/games/nintendo-entertainment-system/kabuki-quantum-fighter/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e994-Cua+mBShxbbazObSwEA5WhnGDyk\"",
    "mtime": "2026-01-08T05:39:07.237Z",
    "size": 256404,
    "path": "../public/games/nintendo-entertainment-system/kabuki-quantum-fighter/index.html"
  },
  "/games/nintendo-entertainment-system/kabuki-quantum-fighter/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"2ac-gsM6E0Z2B2jtcim5qPRtOD3S274\"",
    "mtime": "2026-01-08T05:39:11.135Z",
    "size": 684,
    "path": "../public/games/nintendo-entertainment-system/kabuki-quantum-fighter/_payload.json"
  },
  "/games/nintendo-entertainment-system/legend-of-zelda-the/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e97a-6Q2jPDCPSjmsRRiTjJjDG/IfT6E\"",
    "mtime": "2026-01-08T05:39:07.464Z",
    "size": 256378,
    "path": "../public/games/nintendo-entertainment-system/legend-of-zelda-the/index.html"
  },
  "/games/nintendo-entertainment-system/legend-of-zelda-the/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"2a3-hJQXidsnnY+IAXnXuUyKH7QavBo\"",
    "mtime": "2026-01-08T05:39:11.154Z",
    "size": 675,
    "path": "../public/games/nintendo-entertainment-system/legend-of-zelda-the/_payload.json"
  },
  "/games/nintendo-entertainment-system/little-ninja-brothers/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8f8-dB2X8nDon4y46z1ibFFQq8ISCYo\"",
    "mtime": "2026-01-08T05:39:07.668Z",
    "size": 256248,
    "path": "../public/games/nintendo-entertainment-system/little-ninja-brothers/index.html"
  },
  "/games/nintendo-entertainment-system/little-ninja-brothers/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"278-29/3N7fXZTVNv05hRvNbCo/rWHU\"",
    "mtime": "2026-01-08T05:39:11.220Z",
    "size": 632,
    "path": "../public/games/nintendo-entertainment-system/little-ninja-brothers/_payload.json"
  },
  "/games/nintendo-entertainment-system/little-nemo-the-dream-master/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e9b6-1vXheNUXICnvOqVyBGDnBIXbWwA\"",
    "mtime": "2026-01-08T05:39:07.662Z",
    "size": 256438,
    "path": "../public/games/nintendo-entertainment-system/little-nemo-the-dream-master/index.html"
  },
  "/games/nintendo-entertainment-system/little-nemo-the-dream-master/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"2b1-89/itVwQpr5R/DskO1bNhF1EUm4\"",
    "mtime": "2026-01-08T05:39:11.219Z",
    "size": 689,
    "path": "../public/games/nintendo-entertainment-system/little-nemo-the-dream-master/_payload.json"
  },
  "/games/nintendo-entertainment-system/metal-gear/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8b6-t6JHWefClXz7Rv1H2SIDagX90cI\"",
    "mtime": "2026-01-08T05:39:07.892Z",
    "size": 256182,
    "path": "../public/games/nintendo-entertainment-system/metal-gear/index.html"
  },
  "/games/nintendo-entertainment-system/metal-gear/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"283-C9dr9NQcKOOOQGhZ+WNc/PdtvPQ\"",
    "mtime": "2026-01-08T05:39:11.257Z",
    "size": 643,
    "path": "../public/games/nintendo-entertainment-system/metal-gear/_payload.json"
  },
  "/games/nintendo-entertainment-system/micro-mages/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8b6-aka47ml64Hf8o0RjTxxh4OIgi1I\"",
    "mtime": "2026-01-08T05:39:08.068Z",
    "size": 256182,
    "path": "../public/games/nintendo-entertainment-system/micro-mages/index.html"
  },
  "/games/nintendo-entertainment-system/micro-mages/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"281-f1UM9WDodumMCJgXSOOWNd8fJv8\"",
    "mtime": "2026-01-08T05:39:11.297Z",
    "size": 641,
    "path": "../public/games/nintendo-entertainment-system/micro-mages/_payload.json"
  },
  "/games/nintendo-entertainment-system/mule/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e937-b4CcE4wj2SYXHf9/ioVMIQKEoMA\"",
    "mtime": "2026-01-08T05:39:07.668Z",
    "size": 256311,
    "path": "../public/games/nintendo-entertainment-system/mule/index.html"
  },
  "/games/nintendo-entertainment-system/mule/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"2a2-BRQJW70OuWfkhQ6xoIm3qUQWL3k\"",
    "mtime": "2026-01-08T05:39:11.220Z",
    "size": 674,
    "path": "../public/games/nintendo-entertainment-system/mule/_payload.json"
  },
  "/games/nintendo-entertainment-system/nebs-n-debs/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e960-KFslp5eXxMV94H/SpReQuVTYn3o\"",
    "mtime": "2026-01-08T05:39:08.107Z",
    "size": 256352,
    "path": "../public/games/nintendo-entertainment-system/nebs-n-debs/index.html"
  },
  "/games/nintendo-entertainment-system/nebs-n-debs/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"2a0-sw/vX9PbBn/AsKbXzCEvxOxdr4Y\"",
    "mtime": "2026-01-08T05:39:11.331Z",
    "size": 672,
    "path": "../public/games/nintendo-entertainment-system/nebs-n-debs/_payload.json"
  },
  "/games/nintendo-entertainment-system/ninja-gaiden/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e9aa-4+2R8b1RCy2vRab8k3t7tCrarvU\"",
    "mtime": "2026-01-08T05:39:08.107Z",
    "size": 256426,
    "path": "../public/games/nintendo-entertainment-system/ninja-gaiden/index.html"
  },
  "/games/nintendo-entertainment-system/ninja-gaiden/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"2dd-I9MOiO1txPtzvlf0Qwk0Btj5jdA\"",
    "mtime": "2026-01-08T05:39:11.331Z",
    "size": 733,
    "path": "../public/games/nintendo-entertainment-system/ninja-gaiden/_payload.json"
  },
  "/games/nintendo-entertainment-system/ninja-gaiden-ii-the-dark-sword-of-chaos/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e966-YVaP0BjAJ4YggsfB6303cr8/zL4\"",
    "mtime": "2026-01-08T05:39:08.107Z",
    "size": 256358,
    "path": "../public/games/nintendo-entertainment-system/ninja-gaiden-ii-the-dark-sword-of-chaos/index.html"
  },
  "/games/nintendo-entertainment-system/ninja-gaiden-ii-the-dark-sword-of-chaos/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"2a1-aO4/1dT/8OvC2ZUD0wTHqtofZdA\"",
    "mtime": "2026-01-08T05:39:11.351Z",
    "size": 673,
    "path": "../public/games/nintendo-entertainment-system/ninja-gaiden-ii-the-dark-sword-of-chaos/_payload.json"
  },
  "/games/nintendo-entertainment-system/parodius/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e93a-gy8sTlWB8dzIAYDu1tJMbPNShdk\"",
    "mtime": "2026-01-08T05:39:08.345Z",
    "size": 256314,
    "path": "../public/games/nintendo-entertainment-system/parodius/index.html"
  },
  "/games/nintendo-entertainment-system/parodius/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"29c-bO/PYK3NMyaBpkuIwk7WP5vhETg\"",
    "mtime": "2026-01-08T05:39:11.374Z",
    "size": 668,
    "path": "../public/games/nintendo-entertainment-system/parodius/_payload.json"
  },
  "/games/nintendo-entertainment-system/rainbow-islands/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e968-1BsZAAGlefJ4DVY+y3DxP43AspM\"",
    "mtime": "2026-01-08T05:39:08.598Z",
    "size": 256360,
    "path": "../public/games/nintendo-entertainment-system/rainbow-islands/index.html"
  },
  "/games/nintendo-entertainment-system/rainbow-islands/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"2a4-zqINFM5r3tyZFAEanOFJfX2ST1M\"",
    "mtime": "2026-01-08T05:39:11.492Z",
    "size": 676,
    "path": "../public/games/nintendo-entertainment-system/rainbow-islands/_payload.json"
  },
  "/games/nintendo-entertainment-system/shmupspeed/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e9a5-wEmeQAJ3lXBAcGzvFVoTC+AAZvE\"",
    "mtime": "2026-01-08T05:39:09.258Z",
    "size": 256421,
    "path": "../public/games/nintendo-entertainment-system/shmupspeed/index.html"
  },
  "/games/nintendo-entertainment-system/shmupspeed/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"2e5-7wJlbh7mqNr3MKO3MtYkNmFlbfI\"",
    "mtime": "2026-01-08T05:39:11.597Z",
    "size": 741,
    "path": "../public/games/nintendo-entertainment-system/shmupspeed/_payload.json"
  },
  "/games/nintendo-entertainment-system/snakes-revenge/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8de-y+J0XHn4uBUW2bWKnPkRFfTUP9I\"",
    "mtime": "2026-01-08T05:39:09.259Z",
    "size": 256222,
    "path": "../public/games/nintendo-entertainment-system/snakes-revenge/index.html"
  },
  "/games/nintendo-entertainment-system/snakes-revenge/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"288-W9G/6EvOB8bqiEiYstg/nxCQp2E\"",
    "mtime": "2026-01-08T05:39:11.650Z",
    "size": 648,
    "path": "../public/games/nintendo-entertainment-system/snakes-revenge/_payload.json"
  },
  "/games/nintendo-entertainment-system/solomons-key/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8d2-CieBhxklwo5v5voK1YslLhYfBhc\"",
    "mtime": "2026-01-08T05:39:09.259Z",
    "size": 256210,
    "path": "../public/games/nintendo-entertainment-system/solomons-key/index.html"
  },
  "/games/nintendo-entertainment-system/solomons-key/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"270-wpZWPAbrBhsprB4sRphfGABUJXs\"",
    "mtime": "2026-01-08T05:39:11.669Z",
    "size": 624,
    "path": "../public/games/nintendo-entertainment-system/solomons-key/_payload.json"
  },
  "/games/nintendo-entertainment-system/spook-o-tron/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8c4-wvwrkWO2RL5PdLVqmxbg6KxYyUg\"",
    "mtime": "2026-01-08T05:39:09.477Z",
    "size": 256196,
    "path": "../public/games/nintendo-entertainment-system/spook-o-tron/index.html"
  },
  "/games/nintendo-entertainment-system/spook-o-tron/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"285-HkyctSx/9L0Z/eAR0ZVyGwqfJ8o\"",
    "mtime": "2026-01-08T05:39:11.689Z",
    "size": 645,
    "path": "../public/games/nintendo-entertainment-system/spook-o-tron/_payload.json"
  },
  "/games/nintendo-entertainment-system/star-tropics/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8bc-Ww3X1OG540xW6+HliH4FmKaowiA\"",
    "mtime": "2026-01-08T05:39:09.477Z",
    "size": 256188,
    "path": "../public/games/nintendo-entertainment-system/star-tropics/index.html"
  },
  "/games/nintendo-entertainment-system/star-tropics/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"282-gaD3g5aqOv9YDjkz9gFnLSFg+zs\"",
    "mtime": "2026-01-08T05:39:11.689Z",
    "size": 642,
    "path": "../public/games/nintendo-entertainment-system/star-tropics/_payload.json"
  },
  "/games/nintendo-entertainment-system/super-mario-bros/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e971-5QE5DdsUdb6vnDCYtG9fpwM8GU8\"",
    "mtime": "2026-01-08T05:39:09.761Z",
    "size": 256369,
    "path": "../public/games/nintendo-entertainment-system/super-mario-bros/index.html"
  },
  "/games/nintendo-entertainment-system/super-mario-bros/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"2a8-F/pQFS9yovdJhdd4l0Z5Z9JMwRw\"",
    "mtime": "2026-01-08T05:39:11.725Z",
    "size": 680,
    "path": "../public/games/nintendo-entertainment-system/super-mario-bros/_payload.json"
  },
  "/games/nintendo-entertainment-system/super-mario-bros-2/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8e0-bJqjl63EPZKYGedsaCqOrRiphNw\"",
    "mtime": "2026-01-08T05:39:09.761Z",
    "size": 256224,
    "path": "../public/games/nintendo-entertainment-system/super-mario-bros-2/index.html"
  },
  "/games/nintendo-entertainment-system/super-mario-bros-2/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"287-9eKluArplnFZ5nSu1YPNNSbASBA\"",
    "mtime": "2026-01-08T05:39:11.742Z",
    "size": 647,
    "path": "../public/games/nintendo-entertainment-system/super-mario-bros-2/_payload.json"
  },
  "/games/nintendo-entertainment-system/super-sprint/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3eb07-OtPW6B0eZ9H6HqcnuUtLPJQ5VHo\"",
    "mtime": "2026-01-08T05:39:04.532Z",
    "size": 256775,
    "path": "../public/games/nintendo-entertainment-system/super-sprint/index.html"
  },
  "/games/nintendo-entertainment-system/super-sprint/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"392-DMiqLx+vOTiVqF19J+VFLsgOgk8\"",
    "mtime": "2026-01-08T05:39:10.439Z",
    "size": 914,
    "path": "../public/games/nintendo-entertainment-system/super-sprint/_payload.json"
  },
  "/games/nintendo-entertainment-system/super-mario-bros-3/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e9d4-y8J+T7V/mudXgbjGxljng0LkSM8\"",
    "mtime": "2026-01-08T05:39:09.761Z",
    "size": 256468,
    "path": "../public/games/nintendo-entertainment-system/super-mario-bros-3/index.html"
  },
  "/games/nintendo-entertainment-system/super-mario-bros-3/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"2e6-bqXXwoqoOgqoLCLCWMkttEyAOG0\"",
    "mtime": "2026-01-08T05:39:11.742Z",
    "size": 742,
    "path": "../public/games/nintendo-entertainment-system/super-mario-bros-3/_payload.json"
  },
  "/games/nintendo-entertainment-system/super-tilt-bro/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e9bf-7iyHTPGjriYbk3UBJIHvAz6fa2Q\"",
    "mtime": "2026-01-08T05:39:09.761Z",
    "size": 256447,
    "path": "../public/games/nintendo-entertainment-system/super-tilt-bro/index.html"
  },
  "/games/nintendo-entertainment-system/super-tilt-bro/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"2e8-0IMfi6RoLguX0vTab2K0hQKVUus\"",
    "mtime": "2026-01-08T05:39:11.759Z",
    "size": 744,
    "path": "../public/games/nintendo-entertainment-system/super-tilt-bro/_payload.json"
  },
  "/games/nintendo-entertainment-system/teenage-mutant-ninja-turtles/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e924-kYLPp1sOsZSyZCv4H0KhTq7BYM8\"",
    "mtime": "2026-01-08T05:39:09.968Z",
    "size": 256292,
    "path": "../public/games/nintendo-entertainment-system/teenage-mutant-ninja-turtles/index.html"
  },
  "/games/nintendo-entertainment-system/teenage-mutant-ninja-turtles/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"296-o6Wb/obHN54Sw6T2ittVCTiGrEc\"",
    "mtime": "2026-01-08T05:39:11.777Z",
    "size": 662,
    "path": "../public/games/nintendo-entertainment-system/teenage-mutant-ninja-turtles/_payload.json"
  },
  "/games/nintendo-entertainment-system/teenage-mutant-ninja-turtles-2-the-arcade-game/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e98a-vzVBW6tm/4hOKYT2XVpF0QbLQm4\"",
    "mtime": "2026-01-08T05:39:09.977Z",
    "size": 256394,
    "path": "../public/games/nintendo-entertainment-system/teenage-mutant-ninja-turtles-2-the-arcade-game/index.html"
  },
  "/games/nintendo-entertainment-system/teenage-mutant-ninja-turtles-2-the-arcade-game/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"2a5-t6KnV1HeuqfAxNpM3WSA7kUqoNc\"",
    "mtime": "2026-01-08T05:39:11.777Z",
    "size": 677,
    "path": "../public/games/nintendo-entertainment-system/teenage-mutant-ninja-turtles-2-the-arcade-game/_payload.json"
  },
  "/games/nintendo-entertainment-system/temple-dilemma/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3ef2d-WD6oi+zsO7+mcQhL1d4e9emDAK0\"",
    "mtime": "2026-01-08T05:39:09.977Z",
    "size": 257837,
    "path": "../public/games/nintendo-entertainment-system/temple-dilemma/index.html"
  },
  "/games/nintendo-entertainment-system/temple-dilemma/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"3ec-20RyTiDAs3Ll8dD/urjxP46H5Lw\"",
    "mtime": "2026-01-08T05:39:11.799Z",
    "size": 1004,
    "path": "../public/games/nintendo-entertainment-system/temple-dilemma/_payload.json"
  },
  "/games/nintendo-entertainment-system/the-incident/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8c4-GIir4QO49/zAKs518Q6Vbppgxcs\"",
    "mtime": "2026-01-08T05:39:09.977Z",
    "size": 256196,
    "path": "../public/games/nintendo-entertainment-system/the-incident/index.html"
  },
  "/games/nintendo-entertainment-system/the-incident/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"286-RKu7ifjUeoCYDWImLevb/iu0P48\"",
    "mtime": "2026-01-08T05:39:11.799Z",
    "size": 646,
    "path": "../public/games/nintendo-entertainment-system/the-incident/_payload.json"
  },
  "/games/nintendo-entertainment-system/totally-rad/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8b9-3kb4O/W08Ym0GxTm+Rs0/Q/NDvg\"",
    "mtime": "2026-01-08T05:39:10.038Z",
    "size": 256185,
    "path": "../public/games/nintendo-entertainment-system/totally-rad/index.html"
  },
  "/games/nintendo-entertainment-system/totally-rad/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"282-ng4RKx4DuIMFcq6LjwRtK7AFyT0\"",
    "mtime": "2026-01-08T05:39:11.820Z",
    "size": 642,
    "path": "../public/games/nintendo-entertainment-system/totally-rad/_payload.json"
  },
  "/games/nintendo-entertainment-system/trog/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e93e-a+5e7nR8X5GMA+1o9RdfnlVafp8\"",
    "mtime": "2026-01-08T05:39:10.194Z",
    "size": 256318,
    "path": "../public/games/nintendo-entertainment-system/trog/index.html"
  },
  "/games/nintendo-entertainment-system/trog/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"2af-ZR6iF+yLfOBHKw9utpawYniUV84\"",
    "mtime": "2026-01-08T05:39:11.820Z",
    "size": 687,
    "path": "../public/games/nintendo-entertainment-system/trog/_payload.json"
  },
  "/games/nintendo-entertainment-system/twin-dragons/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8c2-Mdei/FVjgoN7NoLL3SieZTWXGng\"",
    "mtime": "2026-01-08T05:39:10.208Z",
    "size": 256194,
    "path": "../public/games/nintendo-entertainment-system/twin-dragons/index.html"
  },
  "/games/nintendo-entertainment-system/twin-dragons/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"285-8ALjhsbx2r2OCjA7dQgqp8wUVtA\"",
    "mtime": "2026-01-08T05:39:11.836Z",
    "size": 645,
    "path": "../public/games/nintendo-entertainment-system/twin-dragons/_payload.json"
  },
  "/games/nintendo-entertainment-system/witch-n-wiz/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8cc-5HEQRn6wrjHxcyf2RnoP+tc3EUQ\"",
    "mtime": "2026-01-08T05:39:10.209Z",
    "size": 256204,
    "path": "../public/games/nintendo-entertainment-system/witch-n-wiz/index.html"
  },
  "/games/nintendo-entertainment-system/witch-n-wiz/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"26f-6VPpoKja6329IZqRPkP7VKV9kzo\"",
    "mtime": "2026-01-08T05:39:11.862Z",
    "size": 623,
    "path": "../public/games/nintendo-entertainment-system/witch-n-wiz/_payload.json"
  },
  "/games/nintendo-entertainment-system/yo-noid/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8a7-LEHMfAW8tjsyc1BbIQl+iJmzAWQ\"",
    "mtime": "2026-01-08T05:39:10.230Z",
    "size": 256167,
    "path": "../public/games/nintendo-entertainment-system/yo-noid/index.html"
  },
  "/games/nintendo-entertainment-system/yo-noid/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"280-RvQEpQWvJxUcJxCAJmS4L4jkjjM\"",
    "mtime": "2026-01-08T05:39:11.867Z",
    "size": 640,
    "path": "../public/games/nintendo-entertainment-system/yo-noid/_payload.json"
  },
  "/games/nintendo-entertainment-system/zelda-ii-the-adventure-of-link/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e92a-VYGW0lhWVI2aUoPZkcjA7VQaAJs\"",
    "mtime": "2026-01-08T05:39:10.325Z",
    "size": 256298,
    "path": "../public/games/nintendo-entertainment-system/zelda-ii-the-adventure-of-link/index.html"
  },
  "/games/nintendo-entertainment-system/zelda-ii-the-adventure-of-link/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"295-LyOMRlb0k5hxWMvXQ1k+yczGaUM\"",
    "mtime": "2026-01-08T05:39:11.869Z",
    "size": 661,
    "path": "../public/games/nintendo-entertainment-system/zelda-ii-the-adventure-of-link/_payload.json"
  },
  "/games/playstation/blood-omen-legacy-of-kain/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e896-z6haedf25sxv1JNsI/dfB1+0uUk\"",
    "mtime": "2026-01-08T05:39:05.253Z",
    "size": 256150,
    "path": "../public/games/playstation/blood-omen-legacy-of-kain/index.html"
  },
  "/games/playstation/blood-omen-legacy-of-kain/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"26c-aSAVnWbohk2xiExeuieoL5qYk+c\"",
    "mtime": "2026-01-08T05:39:10.644Z",
    "size": 620,
    "path": "../public/games/playstation/blood-omen-legacy-of-kain/_payload.json"
  },
  "/games/playstation/castlevania-symphony-of-the-night/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3fa7a-iksfep1//sI4pnpFn+NWiDqN9Iw\"",
    "mtime": "2026-01-08T05:39:05.593Z",
    "size": 260730,
    "path": "../public/games/playstation/castlevania-symphony-of-the-night/index.html"
  },
  "/games/playstation/castlevania-symphony-of-the-night/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"614-o7zbH/x171hrIameuxk+KBdtr24\"",
    "mtime": "2026-01-08T05:39:10.735Z",
    "size": 1556,
    "path": "../public/games/playstation/castlevania-symphony-of-the-night/_payload.json"
  },
  "/games/playstation/chocobo-racing/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8ee-XPAate3cHOUfG5ZHrmIv0g7AzUU\"",
    "mtime": "2026-01-08T05:39:05.492Z",
    "size": 256238,
    "path": "../public/games/playstation/chocobo-racing/index.html"
  },
  "/games/playstation/chocobo-racing/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"284-hEVPpBLo2Wy1SQvftd74nzJxMVA\"",
    "mtime": "2026-01-08T05:39:10.709Z",
    "size": 644,
    "path": "../public/games/playstation/chocobo-racing/_payload.json"
  },
  "/games/playstation/dino-crisis/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"401d7-g8oS3Ig1HgefOcc8PM2xlQKo1SU\"",
    "mtime": "2026-01-08T05:39:04.545Z",
    "size": 262615,
    "path": "../public/games/playstation/dino-crisis/index.html"
  },
  "/games/playstation/dino-crisis/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"8f3-K3TR07suKsNuA2oxpq4MyaIH2go\"",
    "mtime": "2026-01-08T05:39:10.459Z",
    "size": 2291,
    "path": "../public/games/playstation/dino-crisis/_payload.json"
  },
  "/games/playstation/dino-crisis-2/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3ff01-ATKqP2PpNIxXALzzdbCyOP1MY1U\"",
    "mtime": "2026-01-08T05:39:05.996Z",
    "size": 261889,
    "path": "../public/games/playstation/dino-crisis-2/index.html"
  },
  "/games/playstation/dino-crisis-2/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"71c-NV2XJn6FHzyGL+nh3QUXjA87t5Q\"",
    "mtime": "2026-01-08T05:39:10.800Z",
    "size": 1820,
    "path": "../public/games/playstation/dino-crisis-2/_payload.json"
  },
  "/games/playstation/dragonball-z-ultimate-battle-22/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8b2-P3HOXlkKsTcIIkR4q0GccGz0/Zk\"",
    "mtime": "2026-01-08T05:39:06.129Z",
    "size": 256178,
    "path": "../public/games/playstation/dragonball-z-ultimate-battle-22/index.html"
  },
  "/games/playstation/dragonball-z-ultimate-battle-22/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"26e-CX19/vNYkNTkIQOGvjvaHalPwXg\"",
    "mtime": "2026-01-08T05:39:10.850Z",
    "size": 622,
    "path": "../public/games/playstation/dragonball-z-ultimate-battle-22/_payload.json"
  },
  "/games/playstation/einhander/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e835-hAtWXzcCPG7zLRHgmRoWszYQ/IQ\"",
    "mtime": "2026-01-08T05:39:06.329Z",
    "size": 256053,
    "path": "../public/games/playstation/einhander/index.html"
  },
  "/games/playstation/einhander/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25b-FktsoqWhCOuBQ/IyfuT/rxo7f9g\"",
    "mtime": "2026-01-08T05:39:10.874Z",
    "size": 603,
    "path": "../public/games/playstation/einhander/_payload.json"
  },
  "/games/playstation/final-fantasy-anthology/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e888-OzFhqRR8HAHuJfVfZOxhBSmJuu8\"",
    "mtime": "2026-01-08T05:39:06.418Z",
    "size": 256136,
    "path": "../public/games/playstation/final-fantasy-anthology/index.html"
  },
  "/games/playstation/final-fantasy-anthology/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"269-7dbagjmPZNOA/fFXwW/V8eiD01o\"",
    "mtime": "2026-01-08T05:39:10.913Z",
    "size": 617,
    "path": "../public/games/playstation/final-fantasy-anthology/_payload.json"
  },
  "/games/playstation/final-fantasy-chronicles/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e886-zEt4rVmI+grdql2VmuRj1bXIuRs\"",
    "mtime": "2026-01-08T05:39:06.418Z",
    "size": 256134,
    "path": "../public/games/playstation/final-fantasy-chronicles/index.html"
  },
  "/games/playstation/final-fantasy-chronicles/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"265-U5P9bWNPbc2fGiUi7SeyDXdbw2k\"",
    "mtime": "2026-01-08T05:39:10.913Z",
    "size": 613,
    "path": "../public/games/playstation/final-fantasy-chronicles/_payload.json"
  },
  "/games/playstation/final-fantasy-ix/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e856-yxnzeOMJGrtiBXviUp18DYhLRQ0\"",
    "mtime": "2026-01-08T05:39:06.589Z",
    "size": 256086,
    "path": "../public/games/playstation/final-fantasy-ix/index.html"
  },
  "/games/playstation/final-fantasy-ix/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25e-B3ipcLpEBD1p0mHQz7i2bfvWW6g\"",
    "mtime": "2026-01-08T05:39:10.930Z",
    "size": 606,
    "path": "../public/games/playstation/final-fantasy-ix/_payload.json"
  },
  "/games/playstation/final-fantasy-origins/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e874-mD2TPjhrC2zh/Z1jBlACxW2vofQ\"",
    "mtime": "2026-01-08T05:39:06.590Z",
    "size": 256116,
    "path": "../public/games/playstation/final-fantasy-origins/index.html"
  },
  "/games/playstation/final-fantasy-origins/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"263-6bAYWNXPM4nMRL65ro1HFUDZ8Rw\"",
    "mtime": "2026-01-08T05:39:10.930Z",
    "size": 611,
    "path": "../public/games/playstation/final-fantasy-origins/_payload.json"
  },
  "/games/playstation/final-fantasy-vii/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3ea2c-fk+ndufCuRQ9OlDOTt2P6TNsND8\"",
    "mtime": "2026-01-08T05:39:04.449Z",
    "size": 256556,
    "path": "../public/games/playstation/final-fantasy-vii/index.html"
  },
  "/games/playstation/final-fantasy-vii/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"34c-J7ukH6gEsEEwm4PfVMOrNs1Kt7E\"",
    "mtime": "2026-01-08T05:39:10.421Z",
    "size": 844,
    "path": "../public/games/playstation/final-fantasy-vii/_payload.json"
  },
  "/games/playstation/final-fantasy-viii/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e868-n64EFH/RGrIVvLAIPhyFkwu4fzs\"",
    "mtime": "2026-01-08T05:39:06.731Z",
    "size": 256104,
    "path": "../public/games/playstation/final-fantasy-viii/index.html"
  },
  "/games/playstation/final-fantasy-viii/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"263-jwF4hQiq6N+r+i3IOXBaj9w00kE\"",
    "mtime": "2026-01-08T05:39:10.969Z",
    "size": 611,
    "path": "../public/games/playstation/final-fantasy-viii/_payload.json"
  },
  "/games/playstation/final-fantasy-tactics/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e87c-codyXY+k26ojoqrbTg3lk9VYBns\"",
    "mtime": "2026-01-08T05:39:06.590Z",
    "size": 256124,
    "path": "../public/games/playstation/final-fantasy-tactics/index.html"
  },
  "/games/playstation/final-fantasy-tactics/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"267-F8kG8XhV6BXU2ZYLEh1upnzLm4k\"",
    "mtime": "2026-01-08T05:39:10.946Z",
    "size": 615,
    "path": "../public/games/playstation/final-fantasy-tactics/_payload.json"
  },
  "/games/playstation/gradius-gaiden/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e850-35TJvW5VWQr3I3NOyTZ5tJQLmFQ\"",
    "mtime": "2026-01-08T05:39:07.024Z",
    "size": 256080,
    "path": "../public/games/playstation/gradius-gaiden/index.html"
  },
  "/games/playstation/gradius-gaiden/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25f-e+z3OFWgCM1HVbgYalxXj3Pr7Lg\"",
    "mtime": "2026-01-08T05:39:11.027Z",
    "size": 607,
    "path": "../public/games/playstation/gradius-gaiden/_payload.json"
  },
  "/games/playstation/jade-cocoon-story-of-the-tamamayu/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8c4-pHhmaXNFtwT4bOjVJ6NwXErPAvQ\"",
    "mtime": "2026-01-08T05:39:07.237Z",
    "size": 256196,
    "path": "../public/games/playstation/jade-cocoon-story-of-the-tamamayu/index.html"
  },
  "/games/playstation/jade-cocoon-story-of-the-tamamayu/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"273-KGn1oYQiXP4OMbuwWtL+QIkpYvs\"",
    "mtime": "2026-01-08T05:39:11.136Z",
    "size": 627,
    "path": "../public/games/playstation/jade-cocoon-story-of-the-tamamayu/_payload.json"
  },
  "/games/playstation/marvel-vs-capcom/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e859-QrsbRrf/zSGzmnvC02ACzVNCrCU\"",
    "mtime": "2026-01-08T05:39:07.668Z",
    "size": 256089,
    "path": "../public/games/playstation/marvel-vs-capcom/index.html"
  },
  "/games/playstation/marvel-vs-capcom/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25f-BNqPmFLf0KMj3CrPeil1Z73NfUs\"",
    "mtime": "2026-01-08T05:39:11.257Z",
    "size": 607,
    "path": "../public/games/playstation/marvel-vs-capcom/_payload.json"
  },
  "/games/playstation/legend-of-dragoon-the/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e877-4XpwXKhphtuzNXCMaKEOnITZako\"",
    "mtime": "2026-01-08T05:39:07.464Z",
    "size": 256119,
    "path": "../public/games/playstation/legend-of-dragoon-the/index.html"
  },
  "/games/playstation/legend-of-dragoon-the/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"264-EjyDmgYTaWQcL9qgQixsmgJnzk8\"",
    "mtime": "2026-01-08T05:39:11.154Z",
    "size": 612,
    "path": "../public/games/playstation/legend-of-dragoon-the/_payload.json"
  },
  "/games/playstation/mdk/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e808-vpQHIj5KTE2foBidhFFEg7vOkIY\"",
    "mtime": "2026-01-08T05:39:07.668Z",
    "size": 256008,
    "path": "../public/games/playstation/mdk/index.html"
  },
  "/games/playstation/mdk/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"251-M2+I7s0Kmakf1JR054AdFLeKOqA\"",
    "mtime": "2026-01-08T05:39:11.239Z",
    "size": 593,
    "path": "../public/games/playstation/mdk/_payload.json"
  },
  "/games/playstation/medal-of-honor/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e9c5-ohH/UPsXsr3XccdKKWuqJydNY/o\"",
    "mtime": "2026-01-08T05:39:03.935Z",
    "size": 256453,
    "path": "../public/games/playstation/medal-of-honor/index.html"
  },
  "/games/playstation/medal-of-honor/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"2fe-/IzBfRcMz3dq3uznFBO/D2ic/lg\"",
    "mtime": "2026-01-08T05:39:10.373Z",
    "size": 766,
    "path": "../public/games/playstation/medal-of-honor/_payload.json"
  },
  "/games/playstation/mega-man-legends/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e85c-n5+/uTqm392iH8jxd+GydnZHwRg\"",
    "mtime": "2026-01-08T05:39:07.860Z",
    "size": 256092,
    "path": "../public/games/playstation/mega-man-legends/index.html"
  },
  "/games/playstation/mega-man-legends/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"261-xNZcZxfzSlu2qbYqOLJqol7lUZM\"",
    "mtime": "2026-01-08T05:39:11.257Z",
    "size": 609,
    "path": "../public/games/playstation/mega-man-legends/_payload.json"
  },
  "/games/playstation/metal-gear-solid/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e856-yBUR3zIEJb4it3zZ17C9C/kIRns\"",
    "mtime": "2026-01-08T05:39:07.910Z",
    "size": 256086,
    "path": "../public/games/playstation/metal-gear-solid/index.html"
  },
  "/games/playstation/metal-gear-solid/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25e-g5y1pUQt5NWGVtC2nc6FqI8oMys\"",
    "mtime": "2026-01-08T05:39:11.276Z",
    "size": 606,
    "path": "../public/games/playstation/metal-gear-solid/_payload.json"
  },
  "/games/playstation/metal-gear-solid-trilogy-set-hayter-autographed/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"4055d-41TgbnmdBuYB7djvsrLZjgGgAAA\"",
    "mtime": "2026-01-08T05:39:08.024Z",
    "size": 263517,
    "path": "../public/games/playstation/metal-gear-solid-trilogy-set-hayter-autographed/index.html"
  },
  "/games/playstation/metal-gear-solid-trilogy-set-hayter-autographed/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"86e-oF/s0w7PybbNB2Qzovznbzf8hHs\"",
    "mtime": "2026-01-08T05:39:11.297Z",
    "size": 2158,
    "path": "../public/games/playstation/metal-gear-solid-trilogy-set-hayter-autographed/_payload.json"
  },
  "/games/playstation/metal-gear-solid-integral/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3f9bd-doaulZnnlAh1XmxZ4BaLFKnsyyY\"",
    "mtime": "2026-01-08T05:39:08.067Z",
    "size": 260541,
    "path": "../public/games/playstation/metal-gear-solid-integral/index.html"
  },
  "/games/playstation/metal-gear-solid-integral/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"5f8-Ak3Q7FHKSbm1GUBDv6oqcoyScPg\"",
    "mtime": "2026-01-08T05:39:11.297Z",
    "size": 1528,
    "path": "../public/games/playstation/metal-gear-solid-integral/_payload.json"
  },
  "/games/playstation/metal-gear-solid-vr-missions/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8a8-vH71S8Btqr7xWyysnIn1rNSZNyU\"",
    "mtime": "2026-01-08T05:39:07.911Z",
    "size": 256168,
    "path": "../public/games/playstation/metal-gear-solid-vr-missions/index.html"
  },
  "/games/playstation/metal-gear-solid-vr-missions/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"26f-NQ/YgLmTWdMlSFdlcF4KvhtbxYI\"",
    "mtime": "2026-01-08T05:39:11.297Z",
    "size": 623,
    "path": "../public/games/playstation/metal-gear-solid-vr-missions/_payload.json"
  },
  "/games/playstation/night-striker/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e84a-PBRkCrza2K3NxXZr8Cj0h6+sYmk\"",
    "mtime": "2026-01-08T05:39:08.107Z",
    "size": 256074,
    "path": "../public/games/playstation/night-striker/index.html"
  },
  "/games/playstation/night-striker/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25e-QZDBSxcliJ4IXrFAh9zIjdjD2Bs\"",
    "mtime": "2026-01-08T05:39:11.331Z",
    "size": 606,
    "path": "../public/games/playstation/night-striker/_payload.json"
  },
  "/games/playstation/nightmare-creatures-ii/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e880-nE/aCC+Ia+BgAQYBbvSVQtxALKs\"",
    "mtime": "2026-01-08T05:39:08.107Z",
    "size": 256128,
    "path": "../public/games/playstation/nightmare-creatures-ii/index.html"
  },
  "/games/playstation/nightmare-creatures-ii/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"267-gfXHRZey7mTY+HtabnB4C94Jn6U\"",
    "mtime": "2026-01-08T05:39:11.331Z",
    "size": 615,
    "path": "../public/games/playstation/nightmare-creatures-ii/_payload.json"
  },
  "/games/playstation/nightmare-creatures/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e86e-cNPHVhlcZtQ1idBEip/2snW+hyY\"",
    "mtime": "2026-01-08T05:39:08.107Z",
    "size": 256110,
    "path": "../public/games/playstation/nightmare-creatures/index.html"
  },
  "/games/playstation/nightmare-creatures/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"264-w3Gqfc+VxZZErdHCdKqWmW7XYUQ\"",
    "mtime": "2026-01-08T05:39:11.331Z",
    "size": 612,
    "path": "../public/games/playstation/nightmare-creatures/_payload.json"
  },
  "/games/playstation/parasite-eve/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e83e-/f0/Iukk7uhAUe0OgbWSl/XKuHo\"",
    "mtime": "2026-01-08T05:39:08.345Z",
    "size": 256062,
    "path": "../public/games/playstation/parasite-eve/index.html"
  },
  "/games/playstation/parasite-eve/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25a-5TxmO/CMYLtEpbVxemtoZ7Gy7MA\"",
    "mtime": "2026-01-08T05:39:11.374Z",
    "size": 602,
    "path": "../public/games/playstation/parasite-eve/_payload.json"
  },
  "/games/playstation/parasite-eve-ii/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e856-GNJlDoJ9EixQFJQX2gWFjsf6Hoo\"",
    "mtime": "2026-01-08T05:39:08.345Z",
    "size": 256086,
    "path": "../public/games/playstation/parasite-eve-ii/index.html"
  },
  "/games/playstation/parasite-eve-ii/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"260-n1PWqmZIilimIQ9o7c20g8v4FOc\"",
    "mtime": "2026-01-08T05:39:11.416Z",
    "size": 608,
    "path": "../public/games/playstation/parasite-eve-ii/_payload.json"
  },
  "/games/playstation/resident-evil-2/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3ef39-xLZEL4P3rhEwC76wDiLAClcDvE8\"",
    "mtime": "2026-01-08T05:39:08.599Z",
    "size": 257849,
    "path": "../public/games/playstation/resident-evil-2/index.html"
  },
  "/games/playstation/resident-evil-2/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"3ea-os3WDY+aBeO4mNb9bIQNdC25W44\"",
    "mtime": "2026-01-08T05:39:11.512Z",
    "size": 1002,
    "path": "../public/games/playstation/resident-evil-2/_payload.json"
  },
  "/games/playstation/resident-evil-3-nemesis/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e888-sp52hDUZJV71KH78lwhVW9RlDds\"",
    "mtime": "2026-01-08T05:39:08.599Z",
    "size": 256136,
    "path": "../public/games/playstation/resident-evil-3-nemesis/index.html"
  },
  "/games/playstation/resident-evil-3-nemesis/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"269-wBobXyM8EOfcBKHsHwH6Z/CFwOQ\"",
    "mtime": "2026-01-08T05:39:11.492Z",
    "size": 617,
    "path": "../public/games/playstation/resident-evil-3-nemesis/_payload.json"
  },
  "/games/playstation/resident-evil-directors-cut/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8b0-omLC+XM5/QAjuyCktRg0S3ddwOE\"",
    "mtime": "2026-01-08T05:39:08.637Z",
    "size": 256176,
    "path": "../public/games/playstation/resident-evil-directors-cut/index.html"
  },
  "/games/playstation/resident-evil-directors-cut/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"26e-GzbsFaqQhU/2Dg1VGgO4PJMPuUQ\"",
    "mtime": "2026-01-08T05:39:11.536Z",
    "size": 622,
    "path": "../public/games/playstation/resident-evil-directors-cut/_payload.json"
  },
  "/games/playstation/resident-evil-survivor/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e882-VOLNKpXJRqZ0JPikKm+/U6f6SEY\"",
    "mtime": "2026-01-08T05:39:08.646Z",
    "size": 256130,
    "path": "../public/games/playstation/resident-evil-survivor/index.html"
  },
  "/games/playstation/resident-evil-survivor/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"268-ZAEv+3eNBRRgFzBZwfsb+yjOGEU\"",
    "mtime": "2026-01-08T05:39:11.536Z",
    "size": 616,
    "path": "../public/games/playstation/resident-evil-survivor/_payload.json"
  },
  "/games/playstation/silent-hill/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e838-HXit10Ju2jAzKUur0xUO0t22Vpc\"",
    "mtime": "2026-01-08T05:39:09.258Z",
    "size": 256056,
    "path": "../public/games/playstation/silent-hill/index.html"
  },
  "/games/playstation/silent-hill/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"259-YWIaeUyzxa5NOFaPOQSPNEKPErE\"",
    "mtime": "2026-01-08T05:39:11.627Z",
    "size": 601,
    "path": "../public/games/playstation/silent-hill/_payload.json"
  },
  "/games/playstation/south-park/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8c1-Wp02rmBWVHVO3gvGr4NgQbzW1ZQ\"",
    "mtime": "2026-01-08T05:39:09.323Z",
    "size": 256193,
    "path": "../public/games/playstation/south-park/index.html"
  },
  "/games/playstation/south-park/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"26c-xXEzE17tt3SETvdR+Z+7tjubtn4\"",
    "mtime": "2026-01-08T05:39:11.669Z",
    "size": 620,
    "path": "../public/games/playstation/south-park/_payload.json"
  },
  "/games/playstation/suikoden/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e82e-e3Y3EgDNAwpom87msEl5i2i8kk8\"",
    "mtime": "2026-01-08T05:39:09.549Z",
    "size": 256046,
    "path": "../public/games/playstation/suikoden/index.html"
  },
  "/games/playstation/suikoden/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25a-JQgmzhEHU0hmZrFRdZT1du4eQ8w\"",
    "mtime": "2026-01-08T05:39:11.707Z",
    "size": 602,
    "path": "../public/games/playstation/suikoden/_payload.json"
  },
  "/games/playstation/suikoden-ii/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e83e-Ao3LEkT435weS4Jgho9DtwBiL18\"",
    "mtime": "2026-01-08T05:39:09.572Z",
    "size": 256062,
    "path": "../public/games/playstation/suikoden-ii/index.html"
  },
  "/games/playstation/suikoden-ii/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25c-0dU7KMKz3WVF4RmaVby2iLNKsz8\"",
    "mtime": "2026-01-08T05:39:11.707Z",
    "size": 604,
    "path": "../public/games/playstation/suikoden-ii/_payload.json"
  },
  "/games/playstation/syphon-filter/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e84a-+WnMKQlDh2QYMbBfZouhukEy/bE\"",
    "mtime": "2026-01-08T05:39:09.761Z",
    "size": 256074,
    "path": "../public/games/playstation/syphon-filter/index.html"
  },
  "/games/playstation/syphon-filter/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"249-oU75lvilDFGyR1alfWvlULpOcWw\"",
    "mtime": "2026-01-08T05:39:11.758Z",
    "size": 585,
    "path": "../public/games/playstation/syphon-filter/_payload.json"
  },
  "/games/playstation/syphon-filter-2/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e856-B4zKkcUd6GFVVbuLRBl2lWy7bTk\"",
    "mtime": "2026-01-08T05:39:09.763Z",
    "size": 256086,
    "path": "../public/games/playstation/syphon-filter-2/index.html"
  },
  "/games/playstation/syphon-filter-2/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"24a-EkDzQN27y9360R82upk6+KUdMBg\"",
    "mtime": "2026-01-08T05:39:11.777Z",
    "size": 586,
    "path": "../public/games/playstation/syphon-filter-2/_payload.json"
  },
  "/games/playstation/tenchu-stealth-assassins/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e888-OxE+mQ1ioZvMvG3S6hys8d5FjGA\"",
    "mtime": "2026-01-08T05:39:09.976Z",
    "size": 256136,
    "path": "../public/games/playstation/tenchu-stealth-assassins/index.html"
  },
  "/games/playstation/tenchu-stealth-assassins/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"267-EBgCznoAtFmf2/nC8SCtMCfjvzg\"",
    "mtime": "2026-01-08T05:39:11.777Z",
    "size": 615,
    "path": "../public/games/playstation/tenchu-stealth-assassins/_payload.json"
  },
  "/games/playstation/tony-hawks-pro-skater-2/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3ea30-L+Ps+F8CeqlA4K8KSj2Q58kSl2U\"",
    "mtime": "2026-01-08T05:39:04.399Z",
    "size": 256560,
    "path": "../public/games/playstation/tony-hawks-pro-skater-2/index.html"
  },
  "/games/playstation/tony-hawks-pro-skater-2/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"336-PL/Xa0y1L3v3dps0g7Lf3f+wxhg\"",
    "mtime": "2026-01-08T05:39:10.406Z",
    "size": 822,
    "path": "../public/games/playstation/tony-hawks-pro-skater-2/_payload.json"
  },
  "/games/playstation/vagrant-story/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e84a-ICYMgf/6aEiwNKf4QC7JVCSMF2A\"",
    "mtime": "2026-01-08T05:39:10.209Z",
    "size": 256074,
    "path": "../public/games/playstation/vagrant-story/index.html"
  },
  "/games/playstation/vagrant-story/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25d-xyUioVx2gUYrdpYcRnop0R6PXoo\"",
    "mtime": "2026-01-08T05:39:11.836Z",
    "size": 605,
    "path": "../public/games/playstation/vagrant-story/_payload.json"
  },
  "/games/playstation/valkyrie-profile/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e85c-aqHeSUrpZmQytwQ1EX3W6x/LZjM\"",
    "mtime": "2026-01-08T05:39:10.209Z",
    "size": 256092,
    "path": "../public/games/playstation/valkyrie-profile/index.html"
  },
  "/games/playstation/valkyrie-profile/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"261-jy/KwfP8aLxhwt2XYkijysxBmpo\"",
    "mtime": "2026-01-08T05:39:11.836Z",
    "size": 609,
    "path": "../public/games/playstation/valkyrie-profile/_payload.json"
  },
  "/games/playstation/vib-ribbon/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e832-nmfkC/OBXTvaCSVbXsyf1HWEbu4\"",
    "mtime": "2026-01-08T05:39:10.209Z",
    "size": 256050,
    "path": "../public/games/playstation/vib-ribbon/index.html"
  },
  "/games/playstation/vib-ribbon/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"258-rn/owJKIybXY8uVEDB2tZ+I4FX8\"",
    "mtime": "2026-01-08T05:39:11.853Z",
    "size": 600,
    "path": "../public/games/playstation/vib-ribbon/_payload.json"
  },
  "/games/playstation/wild-arms/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e92e-pjSbvc66u7hdnqBfBZJFEKJjYVs\"",
    "mtime": "2026-01-08T05:39:04.399Z",
    "size": 256302,
    "path": "../public/games/playstation/wild-arms/index.html"
  },
  "/games/playstation/wild-arms/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"2ee-O0lvYVcZ7p+GzaUCBGZa50wF9i4\"",
    "mtime": "2026-01-08T05:39:10.416Z",
    "size": 750,
    "path": "../public/games/playstation/wild-arms/_payload.json"
  },
  "/games/playstation/xenogears/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e834-xg603hrCauLwCqqmH2quz6Q+RyE\"",
    "mtime": "2026-01-08T05:39:10.209Z",
    "size": 256052,
    "path": "../public/games/playstation/xenogears/index.html"
  },
  "/games/playstation/xenogears/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25b-BbDTKLznFz5JG4gDk+OpJPYBJXk\"",
    "mtime": "2026-01-08T05:39:11.862Z",
    "size": 603,
    "path": "../public/games/playstation/xenogears/_payload.json"
  },
  "/games/playstation/wild-arms-2/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e83e-LW50IOvuaVMyHAo8YSCo667mCz0\"",
    "mtime": "2026-01-08T05:39:10.209Z",
    "size": 256062,
    "path": "../public/games/playstation/wild-arms-2/index.html"
  },
  "/games/playstation/wild-arms-2/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25c-5cdIXHegy2P1h5UlgOJkUSdJI58\"",
    "mtime": "2026-01-08T05:39:11.852Z",
    "size": 604,
    "path": "../public/games/playstation/wild-arms-2/_payload.json"
  },
  "/games/playstation-2/bully/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3ee27-ZBHz33T1RCWxKi0dB0YmwdG6xIQ\"",
    "mtime": "2026-01-08T05:39:05.325Z",
    "size": 257575,
    "path": "../public/games/playstation-2/bully/index.html"
  },
  "/games/playstation-2/bully/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"360-eAbg2lpEAbYkDm2GIdDNGVnHjV4\"",
    "mtime": "2026-01-08T05:39:10.660Z",
    "size": 864,
    "path": "../public/games/playstation-2/bully/_payload.json"
  },
  "/games/playstation-2/blood-will-tell-tezuka-asamus-dororo/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8f4-enoeOTyDgvxWaeVHfhl4dQbha1Y\"",
    "mtime": "2026-01-08T05:39:05.325Z",
    "size": 256244,
    "path": "../public/games/playstation-2/blood-will-tell-tezuka-asamus-dororo/index.html"
  },
  "/games/playstation-2/blood-will-tell-tezuka-asamus-dororo/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"27a-Z6No+VuvagX8bTqWNqphYDAoSY4\"",
    "mtime": "2026-01-08T05:39:10.644Z",
    "size": 634,
    "path": "../public/games/playstation-2/blood-will-tell-tezuka-asamus-dororo/_payload.json"
  },
  "/games/playstation-2/burnout-revenge/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e864-nJicoZp69/Nr3V16NKePQl4AavM\"",
    "mtime": "2026-01-08T05:39:05.326Z",
    "size": 256100,
    "path": "../public/games/playstation-2/burnout-revenge/index.html"
  },
  "/games/playstation-2/burnout-revenge/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"264-5K1mgZUjUuIZK7RJte8yfBUlMbI\"",
    "mtime": "2026-01-08T05:39:10.675Z",
    "size": 612,
    "path": "../public/games/playstation-2/burnout-revenge/_payload.json"
  },
  "/games/playstation-2/call-of-duty-2-big-red-one/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e930-tqjBu+4xU+j1rWbWhGy4IKeG0dU\"",
    "mtime": "2026-01-08T05:39:05.326Z",
    "size": 256304,
    "path": "../public/games/playstation-2/call-of-duty-2-big-red-one/index.html"
  },
  "/games/playstation-2/call-of-duty-2-big-red-one/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"282-dVqqTwNZNbbx5eRPhxqwJ1QlX+U\"",
    "mtime": "2026-01-08T05:39:10.675Z",
    "size": 642,
    "path": "../public/games/playstation-2/call-of-duty-2-big-red-one/_payload.json"
  },
  "/games/playstation-2/call-of-duty-3/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8e6-32i+0PS4+SfDYuBPjibGw8mBiWw\"",
    "mtime": "2026-01-08T05:39:05.326Z",
    "size": 256230,
    "path": "../public/games/playstation-2/call-of-duty-3/index.html"
  },
  "/games/playstation-2/call-of-duty-3/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"276-z/JHvwBVU8DIc+gqW3dbGzTzCgQ\"",
    "mtime": "2026-01-08T05:39:10.675Z",
    "size": 630,
    "path": "../public/games/playstation-2/call-of-duty-3/_payload.json"
  },
  "/games/playstation-2/call-of-duty-finest-hour/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e931-oAvqtR5zp3MB/VY6EPXKuQx/tjQ\"",
    "mtime": "2026-01-08T05:39:05.362Z",
    "size": 256305,
    "path": "../public/games/playstation-2/call-of-duty-finest-hour/index.html"
  },
  "/games/playstation-2/call-of-duty-finest-hour/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"291-RiH3tPowsZFMgyxb2twx4AMMJcg\"",
    "mtime": "2026-01-08T05:39:10.694Z",
    "size": 657,
    "path": "../public/games/playstation-2/call-of-duty-finest-hour/_payload.json"
  },
  "/games/playstation-2/clock-tower-3/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e858-ENANqibkA8duAzFjrAbXNz82J7E\"",
    "mtime": "2026-01-08T05:39:05.540Z",
    "size": 256088,
    "path": "../public/games/playstation-2/clock-tower-3/index.html"
  },
  "/games/playstation-2/clock-tower-3/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"262-Nx340yLm2KG869utmuf3CFtguac\"",
    "mtime": "2026-01-08T05:39:10.720Z",
    "size": 610,
    "path": "../public/games/playstation-2/clock-tower-3/_payload.json"
  },
  "/games/playstation-2/dance-dance-revolution-supernova/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8ca-4F4yBxz1c9658/OIW/XAVPpmjAc\"",
    "mtime": "2026-01-08T05:39:05.563Z",
    "size": 256202,
    "path": "../public/games/playstation-2/dance-dance-revolution-supernova/index.html"
  },
  "/games/playstation-2/dance-dance-revolution-supernova/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"275-tUn3u+nETvi+6LNaFfKljro3Fqg\"",
    "mtime": "2026-01-08T05:39:10.725Z",
    "size": 629,
    "path": "../public/games/playstation-2/dance-dance-revolution-supernova/_payload.json"
  },
  "/games/playstation-2/devil-may-cry/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e858-Mt8LMu5A7P4C7FF40p+RSjy8cq8\"",
    "mtime": "2026-01-08T05:39:05.846Z",
    "size": 256088,
    "path": "../public/games/playstation-2/devil-may-cry/index.html"
  },
  "/games/playstation-2/devil-may-cry/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"261-MMJxm6Mqz+vDdoJkmIakRtuPSLQ\"",
    "mtime": "2026-01-08T05:39:10.800Z",
    "size": 609,
    "path": "../public/games/playstation-2/devil-may-cry/_payload.json"
  },
  "/games/playstation-2/devil-may-cry-2/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e864-JIBUk5QNNQHHRIOJKuE+RTaQ0Ao\"",
    "mtime": "2026-01-08T05:39:05.846Z",
    "size": 256100,
    "path": "../public/games/playstation-2/devil-may-cry-2/index.html"
  },
  "/games/playstation-2/devil-may-cry-2/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"264-KK6aVU0dygZgYeupaV/BuihTZJE\"",
    "mtime": "2026-01-08T05:39:10.800Z",
    "size": 612,
    "path": "../public/games/playstation-2/devil-may-cry-2/_payload.json"
  },
  "/games/playstation-2/devil-may-cry-3/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e864-5nWKzCR10pRB3aZOgdqKehJeYGg\"",
    "mtime": "2026-01-08T05:39:05.846Z",
    "size": 256100,
    "path": "../public/games/playstation-2/devil-may-cry-3/index.html"
  },
  "/games/playstation-2/devil-may-cry-3/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"264-GwXdRenHqtW4X4B/UNyTUi07Yrc\"",
    "mtime": "2026-01-08T05:39:10.783Z",
    "size": 612,
    "path": "../public/games/playstation-2/devil-may-cry-3/_payload.json"
  },
  "/games/playstation-2/dodonpachi-dai-ou-jou/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e882-cAjvhXm+tBDPzDd0oMtpgA8fiM4\"",
    "mtime": "2026-01-08T05:39:06.042Z",
    "size": 256130,
    "path": "../public/games/playstation-2/dodonpachi-dai-ou-jou/index.html"
  },
  "/games/playstation-2/dodonpachi-dai-ou-jou/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"267-r/H4cn/QNAXraOa0MWj0F5dn9Qs\"",
    "mtime": "2026-01-08T05:39:10.816Z",
    "size": 615,
    "path": "../public/games/playstation-2/dodonpachi-dai-ou-jou/_payload.json"
  },
  "/games/playstation-2/echo-night-beyond/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e870-lPLDZYnJtYkzL5mGlwePGttjgeo\"",
    "mtime": "2026-01-08T05:39:06.265Z",
    "size": 256112,
    "path": "../public/games/playstation-2/echo-night-beyond/index.html"
  },
  "/games/playstation-2/echo-night-beyond/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"266-mlfn7id3+yDnDQtyu7hVfuZ2jr8\"",
    "mtime": "2026-01-08T05:39:10.851Z",
    "size": 614,
    "path": "../public/games/playstation-2/echo-night-beyond/_payload.json"
  },
  "/games/playstation-2/extermination/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e9f1-alIqJ5ctUBta3bozjepXx4m393k\"",
    "mtime": "2026-01-08T05:39:04.484Z",
    "size": 256497,
    "path": "../public/games/playstation-2/extermination/index.html"
  },
  "/games/playstation-2/extermination/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"31b-TRB1Khb9hlT1LqzTPMjhpiv4Scc\"",
    "mtime": "2026-01-08T05:39:10.421Z",
    "size": 795,
    "path": "../public/games/playstation-2/extermination/_payload.json"
  },
  "/games/playstation-2/fatal-frame/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e84e-EcQj1b1F+FjCccAdaAGiC2fDV54\"",
    "mtime": "2026-01-08T05:39:06.386Z",
    "size": 256078,
    "path": "../public/games/playstation-2/fatal-frame/index.html"
  },
  "/games/playstation-2/fatal-frame/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"261-LEkzoI2YhVQgockJzP19TG1nJkM\"",
    "mtime": "2026-01-08T05:39:10.893Z",
    "size": 609,
    "path": "../public/games/playstation-2/fatal-frame/_payload.json"
  },
  "/games/playstation-2/fatal-frame-ii-crimson-butterfly/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8cc-71iRMra8Og7e5MGfceCow7TMYlE\"",
    "mtime": "2026-01-08T05:39:06.386Z",
    "size": 256204,
    "path": "../public/games/playstation-2/fatal-frame-ii-crimson-butterfly/index.html"
  },
  "/games/playstation-2/fatal-frame-ii-crimson-butterfly/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"275-/YD3jTrpkcNVryWXIHWpNBbvUR0\"",
    "mtime": "2026-01-08T05:39:10.893Z",
    "size": 629,
    "path": "../public/games/playstation-2/fatal-frame-ii-crimson-butterfly/_payload.json"
  },
  "/games/playstation-2/fatal-frame-iii-the-tormented/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8ba-Dx49XP0Mbav+MJQUQcLYxgiGb+Q\"",
    "mtime": "2026-01-08T05:39:06.406Z",
    "size": 256186,
    "path": "../public/games/playstation-2/fatal-frame-iii-the-tormented/index.html"
  },
  "/games/playstation-2/fatal-frame-iii-the-tormented/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"273-Yljl9a8uNODbfbMhn5rLoTb/mxg\"",
    "mtime": "2026-01-08T05:39:10.893Z",
    "size": 627,
    "path": "../public/games/playstation-2/fatal-frame-iii-the-tormented/_payload.json"
  },
  "/games/playstation-2/final-fantasy-vii-dirge-of-cerberus/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8d8-O3y2qq87v7PRs8GNnyQaebPoTeQ\"",
    "mtime": "2026-01-08T05:39:06.630Z",
    "size": 256216,
    "path": "../public/games/playstation-2/final-fantasy-vii-dirge-of-cerberus/index.html"
  },
  "/games/playstation-2/final-fantasy-vii-dirge-of-cerberus/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"276-qzwiJ4a56rY5Sk3IrABA6Dgw0cI\"",
    "mtime": "2026-01-08T05:39:10.969Z",
    "size": 630,
    "path": "../public/games/playstation-2/final-fantasy-vii-dirge-of-cerberus/_payload.json"
  },
  "/games/playstation-2/final-fantasy-x/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e864-xHhxuIEEUJBSiQp/eiMYPV5TlW8\"",
    "mtime": "2026-01-08T05:39:06.726Z",
    "size": 256100,
    "path": "../public/games/playstation-2/final-fantasy-x/index.html"
  },
  "/games/playstation-2/final-fantasy-x/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"264-Fk8jDIN8rkG1Ttr+HZufJ7GzKKs\"",
    "mtime": "2026-01-08T05:39:10.969Z",
    "size": 612,
    "path": "../public/games/playstation-2/final-fantasy-x/_payload.json"
  },
  "/games/playstation-2/final-fantasy-xi/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e864-nNVnZ58o8Tpfa8GZivX7KrTrLWo\"",
    "mtime": "2026-01-08T05:39:06.726Z",
    "size": 256100,
    "path": "../public/games/playstation-2/final-fantasy-xi/index.html"
  },
  "/games/playstation-2/final-fantasy-xi/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"262-Z04COnFZ0xZxFK9qNMPoN31MTEY\"",
    "mtime": "2026-01-08T05:39:10.969Z",
    "size": 610,
    "path": "../public/games/playstation-2/final-fantasy-xi/_payload.json"
  },
  "/games/playstation-2/final-fantasy-xii/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e915-TBrMBJKvy87WzlgDc1SWr1bLZVc\"",
    "mtime": "2026-01-08T05:39:06.726Z",
    "size": 256277,
    "path": "../public/games/playstation-2/final-fantasy-xii/index.html"
  },
  "/games/playstation-2/final-fantasy-xii/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"293-tzSfPTmC/gsmSTwIEIhfkJ7kCQY\"",
    "mtime": "2026-01-08T05:39:10.969Z",
    "size": 659,
    "path": "../public/games/playstation-2/final-fantasy-xii/_payload.json"
  },
  "/games/playstation-2/freedom-fighters/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e864-2fD/Z5JijPp8/DA6/FWGaf2456U\"",
    "mtime": "2026-01-08T05:39:06.792Z",
    "size": 256100,
    "path": "../public/games/playstation-2/freedom-fighters/index.html"
  },
  "/games/playstation-2/freedom-fighters/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"262-mHkyxKN3eH5CTSFBANkxSz6ZXkc\"",
    "mtime": "2026-01-08T05:39:10.988Z",
    "size": 610,
    "path": "../public/games/playstation-2/freedom-fighters/_payload.json"
  },
  "/games/playstation-2/gitaroo-man/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e84c-MMP8chHKIMPcSMSSskEgwpTQvJI\"",
    "mtime": "2026-01-08T05:39:06.792Z",
    "size": 256076,
    "path": "../public/games/playstation-2/gitaroo-man/index.html"
  },
  "/games/playstation-2/gitaroo-man/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25f-p+spvvCp4kISLXJjASwvZivnqXs\"",
    "mtime": "2026-01-08T05:39:11.009Z",
    "size": 607,
    "path": "../public/games/playstation-2/gitaroo-man/_payload.json"
  },
  "/games/playstation-2/god-of-war/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e840-oVtp9KjrnELy0fzzdt7JylL9O5Q\"",
    "mtime": "2026-01-08T05:39:06.928Z",
    "size": 256064,
    "path": "../public/games/playstation-2/god-of-war/index.html"
  },
  "/games/playstation-2/god-of-war/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25c-RVuYdgfNPY0FH7rJpj64Cj6j2Og\"",
    "mtime": "2026-01-08T05:39:11.009Z",
    "size": 604,
    "path": "../public/games/playstation-2/god-of-war/_payload.json"
  },
  "/games/playstation-2/god-hand/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e83a-20WgBOGBBPrf90xTwct6ZvJE1m4\"",
    "mtime": "2026-01-08T05:39:06.928Z",
    "size": 256058,
    "path": "../public/games/playstation-2/god-hand/index.html"
  },
  "/games/playstation-2/god-hand/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25d-lL5KK/rL5Lf3FSvTJ8LcR7FCto0\"",
    "mtime": "2026-01-08T05:39:11.009Z",
    "size": 605,
    "path": "../public/games/playstation-2/god-hand/_payload.json"
  },
  "/games/playstation-2/god-of-war-ii/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e852-hFGVjwJlsDX+gjLc9j0VoOUSorE\"",
    "mtime": "2026-01-08T05:39:06.928Z",
    "size": 256082,
    "path": "../public/games/playstation-2/god-of-war-ii/index.html"
  },
  "/games/playstation-2/god-of-war-ii/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25f-zhSb0516oe+XVIzxvfvzT4F8rLw\"",
    "mtime": "2026-01-08T05:39:11.026Z",
    "size": 607,
    "path": "../public/games/playstation-2/god-of-war-ii/_payload.json"
  },
  "/games/playstation-2/grand-theft-auto-iii/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e882-MQxTLE8BnHbM4s6pIPJPZVY88hY\"",
    "mtime": "2026-01-08T05:39:07.024Z",
    "size": 256130,
    "path": "../public/games/playstation-2/grand-theft-auto-iii/index.html"
  },
  "/games/playstation-2/grand-theft-auto-iii/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"269-PAsuQrRTZq5f8jG+7ulb4W8i+5Q\"",
    "mtime": "2026-01-08T05:39:11.027Z",
    "size": 617,
    "path": "../public/games/playstation-2/grand-theft-auto-iii/_payload.json"
  },
  "/games/playstation-2/grand-theft-auto-san-andreas/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e99a-xeROwOiXiEMKulKpwTv9XZyviEQ\"",
    "mtime": "2026-01-08T05:39:03.935Z",
    "size": 256410,
    "path": "../public/games/playstation-2/grand-theft-auto-san-andreas/index.html"
  },
  "/games/playstation-2/grand-theft-auto-san-andreas/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"2f5-Q6FYLurCyevZIsXOEeE2Wb+FiLI\"",
    "mtime": "2026-01-08T05:39:10.373Z",
    "size": 757,
    "path": "../public/games/playstation-2/grand-theft-auto-san-andreas/_payload.json"
  },
  "/games/playstation-2/grand-theft-auto-vice-city/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8a6-2H4oyX5JK+4bLqMKJM04F/2bfww\"",
    "mtime": "2026-01-08T05:39:07.024Z",
    "size": 256166,
    "path": "../public/games/playstation-2/grand-theft-auto-vice-city/index.html"
  },
  "/games/playstation-2/grand-theft-auto-vice-city/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"26f-y5T/nVmPCSv0SJhBM50tS/RY2Ok\"",
    "mtime": "2026-01-08T05:39:11.027Z",
    "size": 623,
    "path": "../public/games/playstation-2/grand-theft-auto-vice-city/_payload.json"
  },
  "/games/playstation-2/guitar-hero/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e846-gTk4OvjSoAwdpC+WKJE1GmH1mXk\"",
    "mtime": "2026-01-08T05:39:07.024Z",
    "size": 256070,
    "path": "../public/games/playstation-2/guitar-hero/index.html"
  },
  "/games/playstation-2/guitar-hero/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25c-4mvXuXKi110VKBmvzkrc5owNano\"",
    "mtime": "2026-01-08T05:39:11.049Z",
    "size": 604,
    "path": "../public/games/playstation-2/guitar-hero/_payload.json"
  },
  "/games/playstation-2/guitar-hero-ii/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e858-2ngXtk2y5c2Xkg6v/R0Vzt/BhiI\"",
    "mtime": "2026-01-08T05:39:07.024Z",
    "size": 256088,
    "path": "../public/games/playstation-2/guitar-hero-ii/index.html"
  },
  "/games/playstation-2/guitar-hero-ii/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"260-Um6a2wQm9PtJ5Xeo5cQ5lC+7HSg\"",
    "mtime": "2026-01-08T05:39:11.049Z",
    "size": 608,
    "path": "../public/games/playstation-2/guitar-hero-ii/_payload.json"
  },
  "/games/playstation-2/guitar-hero-iii/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e85e-MUjYe7Fo2phIX6jUBIxJ8WDgLLs\"",
    "mtime": "2026-01-08T05:39:07.024Z",
    "size": 256094,
    "path": "../public/games/playstation-2/guitar-hero-iii/index.html"
  },
  "/games/playstation-2/guitar-hero-iii/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"261-eylOm0g/35FQwZEhos1tYR4zFJI\"",
    "mtime": "2026-01-08T05:39:11.049Z",
    "size": 609,
    "path": "../public/games/playstation-2/guitar-hero-iii/_payload.json"
  },
  "/games/playstation-2/haunting-ground/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e85e-lgtfnjVb7PH8znSFnS4yk8EeaUk\"",
    "mtime": "2026-01-08T05:39:07.035Z",
    "size": 256094,
    "path": "../public/games/playstation-2/haunting-ground/index.html"
  },
  "/games/playstation-2/haunting-ground/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"260-wd0iePaXV6rhENxrciCfrBKHhrc\"",
    "mtime": "2026-01-08T05:39:11.077Z",
    "size": 608,
    "path": "../public/games/playstation-2/haunting-ground/_payload.json"
  },
  "/games/playstation-2/jade-cocoon-2/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e858-t7vZTXAvqGxma7MxMjsmGQ2YGSk\"",
    "mtime": "2026-01-08T05:39:07.236Z",
    "size": 256088,
    "path": "../public/games/playstation-2/jade-cocoon-2/index.html"
  },
  "/games/playstation-2/jade-cocoon-2/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"262-sBUcphSFvWamziQY9dlov2+BMGs\"",
    "mtime": "2026-01-08T05:39:11.116Z",
    "size": 610,
    "path": "../public/games/playstation-2/jade-cocoon-2/_payload.json"
  },
  "/games/playstation-2/ico/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e81c-Bm+mkWmD47d1CFfdQNdo7HiKkBk\"",
    "mtime": "2026-01-08T05:39:07.184Z",
    "size": 256028,
    "path": "../public/games/playstation-2/ico/index.html"
  },
  "/games/playstation-2/ico/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"258-Ed3eoDnwURO08lXixzfaojsQhCo\"",
    "mtime": "2026-01-08T05:39:11.099Z",
    "size": 600,
    "path": "../public/games/playstation-2/ico/_payload.json"
  },
  "/games/playstation-2/jak-3/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e828-0yMst9OT2pUzeiaiHV7E7n86wMM\"",
    "mtime": "2026-01-08T05:39:07.236Z",
    "size": 256040,
    "path": "../public/games/playstation-2/jak-3/index.html"
  },
  "/games/playstation-2/jak-3/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25a-zWuo3uhGe0GlWlkszUldHDddCH0\"",
    "mtime": "2026-01-08T05:39:11.116Z",
    "size": 602,
    "path": "../public/games/playstation-2/jak-3/_payload.json"
  },
  "/games/playstation-2/jak-and-daxter-the-precursor-legacy/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8d8-UmkKTP/2Q1B1n6Yyx+JiVflhXQ4\"",
    "mtime": "2026-01-08T05:39:07.236Z",
    "size": 256216,
    "path": "../public/games/playstation-2/jak-and-daxter-the-precursor-legacy/index.html"
  },
  "/games/playstation-2/jak-and-daxter-the-precursor-legacy/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"276-RO0zKbZjxkAj28qalCfZ86P6avU\"",
    "mtime": "2026-01-08T05:39:11.116Z",
    "size": 630,
    "path": "../public/games/playstation-2/jak-and-daxter-the-precursor-legacy/_payload.json"
  },
  "/games/playstation-2/jak-x-combat-racing/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e967-MxScezM1Xu8upyHeZr4V9bGm1Aw\"",
    "mtime": "2026-01-08T05:39:07.236Z",
    "size": 256359,
    "path": "../public/games/playstation-2/jak-x-combat-racing/index.html"
  },
  "/games/playstation-2/jak-x-combat-racing/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"2c2-2p1IdYo550ZZIEsAJ9Vnnni3Dqo\"",
    "mtime": "2026-01-08T05:39:11.116Z",
    "size": 706,
    "path": "../public/games/playstation-2/jak-x-combat-racing/_payload.json"
  },
  "/games/playstation-2/jak-ii/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e82e-ozRQtcm3lHqhWO78JvOHslpPFy4\"",
    "mtime": "2026-01-08T05:39:07.236Z",
    "size": 256046,
    "path": "../public/games/playstation-2/jak-ii/index.html"
  },
  "/games/playstation-2/jak-ii/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25b-TTIBFfD+SS6cpnwQ1QhN35S3DOc\"",
    "mtime": "2026-01-08T05:39:11.116Z",
    "size": 603,
    "path": "../public/games/playstation-2/jak-ii/_payload.json"
  },
  "/games/playstation-2/killzone/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8dd-pRQhuq2PqDhM3GbMLvbKQDyzxio\"",
    "mtime": "2026-01-08T05:39:07.430Z",
    "size": 256221,
    "path": "../public/games/playstation-2/killzone/index.html"
  },
  "/games/playstation-2/killzone/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"288-IDCG8f2AiTKzmS/ZAYhYH6T5gn8\"",
    "mtime": "2026-01-08T05:39:11.136Z",
    "size": 648,
    "path": "../public/games/playstation-2/killzone/_payload.json"
  },
  "/games/playstation-2/katamari-damacy/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e85e-f/zSmZ0O9RwY7cZxbMvm0BYjbZA\"",
    "mtime": "2026-01-08T05:39:07.390Z",
    "size": 256094,
    "path": "../public/games/playstation-2/katamari-damacy/index.html"
  },
  "/games/playstation-2/katamari-damacy/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"261-cQYRoTxJfHdbiFAHSSr7AmHpAGQ\"",
    "mtime": "2026-01-08T05:39:11.135Z",
    "size": 609,
    "path": "../public/games/playstation-2/katamari-damacy/_payload.json"
  },
  "/games/playstation-2/kingdom-hearts/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e85e-Wefp6yU6VaU7IVAs/Pc8Sb28T+E\"",
    "mtime": "2026-01-08T05:39:07.463Z",
    "size": 256094,
    "path": "../public/games/playstation-2/kingdom-hearts/index.html"
  },
  "/games/playstation-2/kingdom-hearts/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"263-3Mb/9y4aQQZ2xEKwEKXA+rGZwvc\"",
    "mtime": "2026-01-08T05:39:11.154Z",
    "size": 611,
    "path": "../public/games/playstation-2/kingdom-hearts/_payload.json"
  },
  "/games/playstation-2/kings-field-the-ancient-city/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8c4-RZialvrAyjxmeJTlkYcqERTCnhE\"",
    "mtime": "2026-01-08T05:39:07.463Z",
    "size": 256196,
    "path": "../public/games/playstation-2/kings-field-the-ancient-city/index.html"
  },
  "/games/playstation-2/kings-field-the-ancient-city/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"273-MHSekisL37N9LzwNRSvcsbJy+9I\"",
    "mtime": "2026-01-08T05:39:11.154Z",
    "size": 627,
    "path": "../public/games/playstation-2/kings-field-the-ancient-city/_payload.json"
  },
  "/games/playstation-2/kuon/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e822-ysOi14i0xQ5mqnEr9vY7bLqRbxc\"",
    "mtime": "2026-01-08T05:39:07.464Z",
    "size": 256034,
    "path": "../public/games/playstation-2/kuon/index.html"
  },
  "/games/playstation-2/kuon/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25f-xY9o6KquiAPUSasHkowb3lgPzZM\"",
    "mtime": "2026-01-08T05:39:11.154Z",
    "size": 607,
    "path": "../public/games/playstation-2/kuon/_payload.json"
  },
  "/games/playstation-2/lord-of-the-rings-the-two-towers/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8d5-k8T3gY3C1QsTP4LpCdETVoJxork\"",
    "mtime": "2026-01-08T05:39:07.668Z",
    "size": 256213,
    "path": "../public/games/playstation-2/lord-of-the-rings-the-two-towers/index.html"
  },
  "/games/playstation-2/lord-of-the-rings-the-two-towers/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"277-xPXFleG728kwUDUq+SC+xXvBvEA\"",
    "mtime": "2026-01-08T05:39:11.219Z",
    "size": 631,
    "path": "../public/games/playstation-2/lord-of-the-rings-the-two-towers/_payload.json"
  },
  "/games/playstation-2/manhunt-2/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e840-u19NNi35V8bJFGboYBvROS+GSkI\"",
    "mtime": "2026-01-08T05:39:07.668Z",
    "size": 256064,
    "path": "../public/games/playstation-2/manhunt-2/index.html"
  },
  "/games/playstation-2/manhunt-2/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25e-nNLoVrTxBwyX6zSBAaSFCJCIjCg\"",
    "mtime": "2026-01-08T05:39:11.236Z",
    "size": 606,
    "path": "../public/games/playstation-2/manhunt-2/_payload.json"
  },
  "/games/playstation-2/manhunt/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e836-90TPp71lsZY4dJWGOdPf+PIUQ6U\"",
    "mtime": "2026-01-08T05:39:07.668Z",
    "size": 256054,
    "path": "../public/games/playstation-2/manhunt/index.html"
  },
  "/games/playstation-2/manhunt/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25d-67mNkn0Y0/6dhvbEsrLB610eLfo\"",
    "mtime": "2026-01-08T05:39:11.236Z",
    "size": 605,
    "path": "../public/games/playstation-2/manhunt/_payload.json"
  },
  "/games/playstation-2/max-payne/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e83a-mw2/L33OBBqe5eKVfZuVJmkkIKQ\"",
    "mtime": "2026-01-08T05:39:07.668Z",
    "size": 256058,
    "path": "../public/games/playstation-2/max-payne/index.html"
  },
  "/games/playstation-2/max-payne/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25b-puMi6eYx77olKAhQqRKPRU1Be08\"",
    "mtime": "2026-01-08T05:39:11.238Z",
    "size": 603,
    "path": "../public/games/playstation-2/max-payne/_payload.json"
  },
  "/games/playstation-2/max-payne-2-the-fall-of-max-payne/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8d2-C6RxlRO7oHkYC0b0hVXHDcg/7gw\"",
    "mtime": "2026-01-08T05:39:07.668Z",
    "size": 256210,
    "path": "../public/games/playstation-2/max-payne-2-the-fall-of-max-payne/index.html"
  },
  "/games/playstation-2/max-payne-2-the-fall-of-max-payne/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"277-fsFHxeqpAsGC420g7ti73vZVF+E\"",
    "mtime": "2026-01-08T05:39:11.238Z",
    "size": 631,
    "path": "../public/games/playstation-2/max-payne-2-the-fall-of-max-payne/_payload.json"
  },
  "/games/playstation-2/mdk-2-armageddon/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e86c-9c6Vwi53AV4qXMzckFl90IqiZ/Y\"",
    "mtime": "2026-01-08T05:39:07.729Z",
    "size": 256108,
    "path": "../public/games/playstation-2/mdk-2-armageddon/index.html"
  },
  "/games/playstation-2/mdk-2-armageddon/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"266-TWnPLrbe9os2RwBKTLaRh0SrVwc\"",
    "mtime": "2026-01-08T05:39:11.257Z",
    "size": 614,
    "path": "../public/games/playstation-2/mdk-2-armageddon/_payload.json"
  },
  "/games/playstation-2/metal-gear-solid-2-sons-of-liberty/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8d2-rQ2CBr7pJzPlPKtsfH4nzfRKjYc\"",
    "mtime": "2026-01-08T05:39:07.910Z",
    "size": 256210,
    "path": "../public/games/playstation-2/metal-gear-solid-2-sons-of-liberty/index.html"
  },
  "/games/playstation-2/metal-gear-solid-2-sons-of-liberty/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"275-TOEPmwTsr3VA5eDlnr7GKWKVY6g\"",
    "mtime": "2026-01-08T05:39:11.257Z",
    "size": 629,
    "path": "../public/games/playstation-2/metal-gear-solid-2-sons-of-liberty/_payload.json"
  },
  "/games/playstation-2/metal-gear-solid-2-the-document-of/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8d3-mvo8sHMsjFCeA72r1p5yWAalKPM\"",
    "mtime": "2026-01-08T05:39:07.910Z",
    "size": 256211,
    "path": "../public/games/playstation-2/metal-gear-solid-2-the-document-of/index.html"
  },
  "/games/playstation-2/metal-gear-solid-2-the-document-of/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"274-T948CBBCRtnW55eD/2+eVVfyHDE\"",
    "mtime": "2026-01-08T05:39:11.276Z",
    "size": 628,
    "path": "../public/games/playstation-2/metal-gear-solid-2-the-document-of/_payload.json"
  },
  "/games/playstation-2/metal-gear-solid-3-snake-eater/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8ba-N8j3hyOP26I8kMzrJWlLw8Hj7SQ\"",
    "mtime": "2026-01-08T05:39:07.910Z",
    "size": 256186,
    "path": "../public/games/playstation-2/metal-gear-solid-3-snake-eater/index.html"
  },
  "/games/playstation-2/metal-gear-solid-3-snake-eater/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"271-uv6iVnENrfw7rpqEu/fA3zJDu7A\"",
    "mtime": "2026-01-08T05:39:11.276Z",
    "size": 625,
    "path": "../public/games/playstation-2/metal-gear-solid-3-snake-eater/_payload.json"
  },
  "/games/playstation-2/metal-gear-solid-3-subsistance/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8ba-JIKSrA0a0dPEp+/DCEGMqfVseF4\"",
    "mtime": "2026-01-08T05:39:07.910Z",
    "size": 256186,
    "path": "../public/games/playstation-2/metal-gear-solid-3-subsistance/index.html"
  },
  "/games/playstation-2/metal-gear-solid-3-subsistance/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"271-hQx05AhIzN81vO0Cyk8PIlRQoKA\"",
    "mtime": "2026-01-08T05:39:11.276Z",
    "size": 625,
    "path": "../public/games/playstation-2/metal-gear-solid-3-subsistance/_payload.json"
  },
  "/games/playstation-2/ninja-assault/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3eeb5-m9bvdUo4xbJW8kpQOhPE9qb/LVM\"",
    "mtime": "2026-01-08T05:39:08.107Z",
    "size": 257717,
    "path": "../public/games/playstation-2/ninja-assault/index.html"
  },
  "/games/playstation-2/ninja-assault/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"3c6-dmsz4IvpTBNio9GtK5JxnQBSDjs\"",
    "mtime": "2026-01-08T05:39:11.351Z",
    "size": 966,
    "path": "../public/games/playstation-2/ninja-assault/_payload.json"
  },
  "/games/playstation-2/okami/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e828-0AtBUJR2GcHBp2ivWO2WfDN55BQ\"",
    "mtime": "2026-01-08T05:39:08.107Z",
    "size": 256040,
    "path": "../public/games/playstation-2/okami/index.html"
  },
  "/games/playstation-2/okami/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25a-YSf/QLWDXjbvQCOCzHGaaiEB/T0\"",
    "mtime": "2026-01-08T05:39:11.351Z",
    "size": 602,
    "path": "../public/games/playstation-2/okami/_payload.json"
  },
  "/games/playstation-2/onimusha-2-samurais-destiny/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8be-kZ9GWi1znLEQxgyO8Rj65ukVybg\"",
    "mtime": "2026-01-08T05:39:08.107Z",
    "size": 256190,
    "path": "../public/games/playstation-2/onimusha-2-samurais-destiny/index.html"
  },
  "/games/playstation-2/onimusha-2-samurais-destiny/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"272-K7VReIhUzUNU0lcXFGYHlwDvZ40\"",
    "mtime": "2026-01-08T05:39:11.351Z",
    "size": 626,
    "path": "../public/games/playstation-2/onimusha-2-samurais-destiny/_payload.json"
  },
  "/games/playstation-2/onimusha-3-demon-siege/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e890-6MT+3Qqc6HLdOnr8qSjFeHSxmkg\"",
    "mtime": "2026-01-08T05:39:08.148Z",
    "size": 256144,
    "path": "../public/games/playstation-2/onimusha-3-demon-siege/index.html"
  },
  "/games/playstation-2/onimusha-3-demon-siege/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"26c-88I47lMnJf/6HryCQlgESCnjLhI\"",
    "mtime": "2026-01-08T05:39:11.374Z",
    "size": 620,
    "path": "../public/games/playstation-2/onimusha-3-demon-siege/_payload.json"
  },
  "/games/playstation-2/onimusha-warlords/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e872-PNqfDmDD1owNVx4UJpJlE8zMO8A\"",
    "mtime": "2026-01-08T05:39:08.148Z",
    "size": 256114,
    "path": "../public/games/playstation-2/onimusha-warlords/index.html"
  },
  "/games/playstation-2/onimusha-warlords/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"267-Ofz/aEtDSWC/n4oNM7Gyk4VJAPo\"",
    "mtime": "2026-01-08T05:39:11.374Z",
    "size": 615,
    "path": "../public/games/playstation-2/onimusha-warlords/_payload.json"
  },
  "/games/playstation-2/prince-of-persia-the-sands-of-time/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3ec0a-penwWPN+jEfNpRpM4j7Yg9vHXiI\"",
    "mtime": "2026-01-08T05:39:04.545Z",
    "size": 257034,
    "path": "../public/games/playstation-2/prince-of-persia-the-sands-of-time/index.html"
  },
  "/games/playstation-2/prince-of-persia-the-sands-of-time/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"49b-Q/0SAPNuHEbVhgooj+FMBYJEImE\"",
    "mtime": "2026-01-08T05:39:10.459Z",
    "size": 1179,
    "path": "../public/games/playstation-2/prince-of-persia-the-sands-of-time/_payload.json"
  },
  "/games/playstation-2/prince-of-persia-the-two-thrones/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8cc-H6n7y3kcyPXLU5HviPQPjrKIV7g\"",
    "mtime": "2026-01-08T05:39:08.597Z",
    "size": 256204,
    "path": "../public/games/playstation-2/prince-of-persia-the-two-thrones/index.html"
  },
  "/games/playstation-2/prince-of-persia-the-two-thrones/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"276-5D0AxrjzEn1RJUXRE1eWxcoCFSg\"",
    "mtime": "2026-01-08T05:39:11.465Z",
    "size": 630,
    "path": "../public/games/playstation-2/prince-of-persia-the-two-thrones/_payload.json"
  },
  "/games/playstation-2/prince-of-persia-warrior-within/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8c6-9faGUGg+3JaWsPe2XGFPPLmf1Bw\"",
    "mtime": "2026-01-08T05:39:08.597Z",
    "size": 256198,
    "path": "../public/games/playstation-2/prince-of-persia-warrior-within/index.html"
  },
  "/games/playstation-2/prince-of-persia-warrior-within/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"275-yGZqIDLLg4e7NqxEyasfKH45ukw\"",
    "mtime": "2026-01-08T05:39:11.465Z",
    "size": 629,
    "path": "../public/games/playstation-2/prince-of-persia-warrior-within/_payload.json"
  },
  "/games/playstation-2/ratchet-and-clank/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8ff-uFLUIYsIjEe0tM6dbzXPJaCf0bs\"",
    "mtime": "2026-01-08T05:39:08.598Z",
    "size": 256255,
    "path": "../public/games/playstation-2/ratchet-and-clank/index.html"
  },
  "/games/playstation-2/ratchet-and-clank/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"278-ueBrBkVZS13v6v7/qkAFcMEUzMk\"",
    "mtime": "2026-01-08T05:39:11.492Z",
    "size": 632,
    "path": "../public/games/playstation-2/ratchet-and-clank/_payload.json"
  },
  "/games/playstation-2/ratchet-and-clank-going-commando/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8d2-ccpeEJ+A0qxyzclsq1K2v8qkoQQ\"",
    "mtime": "2026-01-08T05:39:08.597Z",
    "size": 256210,
    "path": "../public/games/playstation-2/ratchet-and-clank-going-commando/index.html"
  },
  "/games/playstation-2/ratchet-and-clank-going-commando/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"274-SGKjVRhM5UELabuxSv15mGsRytw\"",
    "mtime": "2026-01-08T05:39:11.465Z",
    "size": 628,
    "path": "../public/games/playstation-2/ratchet-and-clank-going-commando/_payload.json"
  },
  "/games/playstation-2/ratchet-and-clank-up-your-arsenal/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8d8-aNMGEW5GIfAyYnbTeP7YWU41E6k\"",
    "mtime": "2026-01-08T05:39:08.598Z",
    "size": 256216,
    "path": "../public/games/playstation-2/ratchet-and-clank-up-your-arsenal/index.html"
  },
  "/games/playstation-2/ratchet-and-clank-up-your-arsenal/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"274-GhlxjSaEVaNn/F+eFFEu+nXayFA\"",
    "mtime": "2026-01-08T05:39:11.492Z",
    "size": 628,
    "path": "../public/games/playstation-2/ratchet-and-clank-up-your-arsenal/_payload.json"
  },
  "/games/playstation-2/red-star-the/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e84f-mC6tB7v1mMo8b3mwXb/Q20Dw8ls\"",
    "mtime": "2026-01-08T05:39:08.599Z",
    "size": 256079,
    "path": "../public/games/playstation-2/red-star-the/index.html"
  },
  "/games/playstation-2/red-star-the/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25e-0X//Sq8pxXAfv6XnQZusHdJao34\"",
    "mtime": "2026-01-08T05:39:11.492Z",
    "size": 606,
    "path": "../public/games/playstation-2/red-star-the/_payload.json"
  },
  "/games/playstation-2/resident-evil-4/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e907-E4rmQze8gylIO9wu/JTjrsYNCGk\"",
    "mtime": "2026-01-08T05:39:08.599Z",
    "size": 256263,
    "path": "../public/games/playstation-2/resident-evil-4/index.html"
  },
  "/games/playstation-2/resident-evil-4/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"28f-gliXh2dbza2Eh1w4eE2JjgEY6u8\"",
    "mtime": "2026-01-08T05:39:11.512Z",
    "size": 655,
    "path": "../public/games/playstation-2/resident-evil-4/_payload.json"
  },
  "/games/playstation-2/resident-evil-code-veronica-x/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8ba-Z7J5O68rc8BwTrXx6CKYyKkq6Kg\"",
    "mtime": "2026-01-08T05:39:08.600Z",
    "size": 256186,
    "path": "../public/games/playstation-2/resident-evil-code-veronica-x/index.html"
  },
  "/games/playstation-2/resident-evil-code-veronica-x/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"273-tKge13atTNkwLTsRyGlOcUMnTWw\"",
    "mtime": "2026-01-08T05:39:11.512Z",
    "size": 627,
    "path": "../public/games/playstation-2/resident-evil-code-veronica-x/_payload.json"
  },
  "/games/playstation-2/resident-evil-dead-aim/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e890-HwV0zxkmB1Y8GMjE5QZHnWmt8Kw\"",
    "mtime": "2026-01-08T05:39:08.637Z",
    "size": 256144,
    "path": "../public/games/playstation-2/resident-evil-dead-aim/index.html"
  },
  "/games/playstation-2/resident-evil-dead-aim/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"26c-pbNbAEliA5TAXqpiIgFLqDET+Eg\"",
    "mtime": "2026-01-08T05:39:11.512Z",
    "size": 620,
    "path": "../public/games/playstation-2/resident-evil-dead-aim/_payload.json"
  },
  "/games/playstation-2/rule-of-rose/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e852-6k5zX2WWuzaA4rjpziGBCY/rY6c\"",
    "mtime": "2026-01-08T05:39:09.039Z",
    "size": 256082,
    "path": "../public/games/playstation-2/rule-of-rose/index.html"
  },
  "/games/playstation-2/rule-of-rose/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"260-uqBIfyZxuJ2CJKhF6Uy0tt7DAow\"",
    "mtime": "2026-01-08T05:39:11.569Z",
    "size": 608,
    "path": "../public/games/playstation-2/rule-of-rose/_payload.json"
  },
  "/games/playstation-2/samurai-western/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e864-yHgWknckl4HV+3ypE86NMaTNSMQ\"",
    "mtime": "2026-01-08T05:39:09.039Z",
    "size": 256100,
    "path": "../public/games/playstation-2/samurai-western/index.html"
  },
  "/games/playstation-2/samurai-western/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"263-A7Cq63ygfwTh8UDFK8LUOUTM9AU\"",
    "mtime": "2026-01-08T05:39:11.569Z",
    "size": 611,
    "path": "../public/games/playstation-2/samurai-western/_payload.json"
  },
  "/games/playstation-2/sega-ages-2500-series-vol-25-gunstar-heroes-treasure-box/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e95f-wXPWJ3qHzyxyjB+tz/F4sn5JwRU\"",
    "mtime": "2026-01-08T05:39:09.039Z",
    "size": 256351,
    "path": "../public/games/playstation-2/sega-ages-2500-series-vol-25-gunstar-heroes-treasure-box/index.html"
  },
  "/games/playstation-2/sega-ages-2500-series-vol-25-gunstar-heroes-treasure-box/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"279-pgqTIEXzaeItNZMd28V/FH7lK5g\"",
    "mtime": "2026-01-08T05:39:11.569Z",
    "size": 633,
    "path": "../public/games/playstation-2/sega-ages-2500-series-vol-25-gunstar-heroes-treasure-box/_payload.json"
  },
  "/games/playstation-2/shadow-of-the-colossus/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e888-z/PZcvZML/t+oQ76t8h5PmwN/PU\"",
    "mtime": "2026-01-08T05:39:09.039Z",
    "size": 256136,
    "path": "../public/games/playstation-2/shadow-of-the-colossus/index.html"
  },
  "/games/playstation-2/shadow-of-the-colossus/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"268-DSGGhhrtlnu4Sz4aUM0Cuw04a3E\"",
    "mtime": "2026-01-08T05:39:11.569Z",
    "size": 616,
    "path": "../public/games/playstation-2/shadow-of-the-colossus/_payload.json"
  },
  "/games/playstation-2/shining-force-exa/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e870-crFGBRilFiNLl5nEO70XKy/geQw\"",
    "mtime": "2026-01-08T05:39:09.149Z",
    "size": 256112,
    "path": "../public/games/playstation-2/shining-force-exa/index.html"
  },
  "/games/playstation-2/shining-force-exa/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"266-1Ju9Z/Q1f4xoOfDHuDkY1k6l48A\"",
    "mtime": "2026-01-08T05:39:11.597Z",
    "size": 614,
    "path": "../public/games/playstation-2/shining-force-exa/_payload.json"
  },
  "/games/playstation-2/shining-force-neo/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e870-3+d1uYUk8jhsZOJx6/TTSxOD3nU\"",
    "mtime": "2026-01-08T05:39:09.258Z",
    "size": 256112,
    "path": "../public/games/playstation-2/shining-force-neo/index.html"
  },
  "/games/playstation-2/shining-force-neo/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"266-sWBklOmLsR5b5Ps3h8qskKREcQY\"",
    "mtime": "2026-01-08T05:39:11.598Z",
    "size": 614,
    "path": "../public/games/playstation-2/shining-force-neo/_payload.json"
  },
  "/games/playstation-2/shining-tears/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e858-H0dS30giLaYJm/60T2GXVCMM8yc\"",
    "mtime": "2026-01-08T05:39:09.258Z",
    "size": 256088,
    "path": "../public/games/playstation-2/shining-tears/index.html"
  },
  "/games/playstation-2/shining-tears/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"262-cJYV9uE22ToSYPAklR68lwc6Md0\"",
    "mtime": "2026-01-08T05:39:11.627Z",
    "size": 610,
    "path": "../public/games/playstation-2/shining-tears/_payload.json"
  },
  "/games/playstation-2/shinobi/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e834-kBhboHbkX0P1i3I9GbXQ+GlyuOU\"",
    "mtime": "2026-01-08T05:39:09.258Z",
    "size": 256052,
    "path": "../public/games/playstation-2/shinobi/index.html"
  },
  "/games/playstation-2/shinobi/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25b-0qiWoceP48v7t3fZFCK+1WFrMcg\"",
    "mtime": "2026-01-08T05:39:11.598Z",
    "size": 603,
    "path": "../public/games/playstation-2/shinobi/_payload.json"
  },
  "/games/playstation-2/silent-hill-2/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e85a-cb5IhguL1iPRoFOu6Azf1Ldhyok\"",
    "mtime": "2026-01-08T05:39:09.258Z",
    "size": 256090,
    "path": "../public/games/playstation-2/silent-hill-2/index.html"
  },
  "/games/playstation-2/silent-hill-2/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"263-D/11FwCDIVdKqSGaL4huauNJWSE\"",
    "mtime": "2026-01-08T05:39:11.598Z",
    "size": 611,
    "path": "../public/games/playstation-2/silent-hill-2/_payload.json"
  },
  "/games/playstation-2/silent-hill-3/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e858-Y13wWXPI4gxEPnBwgO/L9kgtDNs\"",
    "mtime": "2026-01-08T05:39:09.258Z",
    "size": 256088,
    "path": "../public/games/playstation-2/silent-hill-3/index.html"
  },
  "/games/playstation-2/silent-hill-3/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"262-YGQ/G7yBjCB+oB5W9EP3qAdrm7Y\"",
    "mtime": "2026-01-08T05:39:11.627Z",
    "size": 610,
    "path": "../public/games/playstation-2/silent-hill-3/_payload.json"
  },
  "/games/playstation-2/silent-hill-4-the-room/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e88a-N6yw/ZsJbofus7koGrqTasgH0Aw\"",
    "mtime": "2026-01-08T05:39:09.258Z",
    "size": 256138,
    "path": "../public/games/playstation-2/silent-hill-4-the-room/index.html"
  },
  "/games/playstation-2/silent-hill-4-the-room/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"268-wfGm+UrfnKD721eco7xxFXLg+sA\"",
    "mtime": "2026-01-08T05:39:11.627Z",
    "size": 616,
    "path": "../public/games/playstation-2/silent-hill-4-the-room/_payload.json"
  },
  "/games/playstation-2/silent-hill-origins/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e878-0Cj2YZz+ccYFoXlKK02VTRfs/qc\"",
    "mtime": "2026-01-08T05:39:09.258Z",
    "size": 256120,
    "path": "../public/games/playstation-2/silent-hill-origins/index.html"
  },
  "/games/playstation-2/silent-hill-origins/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"265-cUiZqHdumnX6Y9xnfBsaDgqZGEI\"",
    "mtime": "2026-01-08T05:39:11.627Z",
    "size": 613,
    "path": "../public/games/playstation-2/silent-hill-origins/_payload.json"
  },
  "/games/playstation-2/silent-hill-shattered-memories/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8c0-I6yB4Fc1yblOrZGsGIP9+tVPILA\"",
    "mtime": "2026-01-08T05:39:09.258Z",
    "size": 256192,
    "path": "../public/games/playstation-2/silent-hill-shattered-memories/index.html"
  },
  "/games/playstation-2/silent-hill-shattered-memories/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"273-jNAmDfb8K3PG3qfO8uiy7izg9x8\"",
    "mtime": "2026-01-08T05:39:11.628Z",
    "size": 627,
    "path": "../public/games/playstation-2/silent-hill-shattered-memories/_payload.json"
  },
  "/games/playstation-2/siren/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e828-WXy3Q1sJhoag1nD9k8pyvs3mwKs\"",
    "mtime": "2026-01-08T05:39:09.258Z",
    "size": 256040,
    "path": "../public/games/playstation-2/siren/index.html"
  },
  "/games/playstation-2/siren/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25a-q21FrgXjtPasSGWWgDcVqv7An6I\"",
    "mtime": "2026-01-08T05:39:11.650Z",
    "size": 602,
    "path": "../public/games/playstation-2/siren/_payload.json"
  },
  "/games/playstation-2/sly-2-band-of-thieves/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e884-y2T+OYRWGxkNNAqUXwMAe0tg9vs\"",
    "mtime": "2026-01-08T05:39:09.259Z",
    "size": 256132,
    "path": "../public/games/playstation-2/sly-2-band-of-thieves/index.html"
  },
  "/games/playstation-2/sly-2-band-of-thieves/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"268-3YEekoVumiNE8v1n1ITE7K7s/EU\"",
    "mtime": "2026-01-08T05:39:11.669Z",
    "size": 616,
    "path": "../public/games/playstation-2/sly-2-band-of-thieves/_payload.json"
  },
  "/games/playstation-2/sly-3-band-of-thieves/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e884-2j9EH6Pou9uzEv8+TTZuVrq75zQ\"",
    "mtime": "2026-01-08T05:39:09.258Z",
    "size": 256132,
    "path": "../public/games/playstation-2/sly-3-band-of-thieves/index.html"
  },
  "/games/playstation-2/sly-3-band-of-thieves/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"268-BaieRWVdBWSDW6cSgQsfCuu/eGE\"",
    "mtime": "2026-01-08T05:39:11.650Z",
    "size": 616,
    "path": "../public/games/playstation-2/sly-3-band-of-thieves/_payload.json"
  },
  "/games/playstation-2/sly-cooper-and-the-thievius-raccoonus/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8e2-Toh4brnyVb/MvRPTyEc72ukK3Tk\"",
    "mtime": "2026-01-08T05:39:09.258Z",
    "size": 256226,
    "path": "../public/games/playstation-2/sly-cooper-and-the-thievius-raccoonus/index.html"
  },
  "/games/playstation-2/sly-cooper-and-the-thievius-raccoonus/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"277-dyFp1v/umWKW1LVoag9qrkZKr74\"",
    "mtime": "2026-01-08T05:39:11.650Z",
    "size": 631,
    "path": "../public/games/playstation-2/sly-cooper-and-the-thievius-raccoonus/_payload.json"
  },
  "/games/playstation-2/soulcalibur-ii/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e858-hzWS8LMsnZ3MfXyWH5E3EOAzQJk\"",
    "mtime": "2026-01-08T05:39:09.259Z",
    "size": 256088,
    "path": "../public/games/playstation-2/soulcalibur-ii/index.html"
  },
  "/games/playstation-2/soulcalibur-ii/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"260-f13yuYnOC9fo/YRteeJd3Jg92LA\"",
    "mtime": "2026-01-08T05:39:11.669Z",
    "size": 608,
    "path": "../public/games/playstation-2/soulcalibur-ii/_payload.json"
  },
  "/games/playstation-2/soulcalibur-iii/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e85e-E/EJ95DRaGehifE+mC99OfP0HAo\"",
    "mtime": "2026-01-08T05:39:09.259Z",
    "size": 256094,
    "path": "../public/games/playstation-2/soulcalibur-iii/index.html"
  },
  "/games/playstation-2/soulcalibur-iii/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"260-4w6KATASkcoKba03nhSRHsFw4l0\"",
    "mtime": "2026-01-08T05:39:11.669Z",
    "size": 608,
    "path": "../public/games/playstation-2/soulcalibur-iii/_payload.json"
  },
  "/games/playstation-2/star-wars-battlefront/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e882-tyqgLPpvHHnK6keoU71i4rpTIMs\"",
    "mtime": "2026-01-08T05:39:09.477Z",
    "size": 256130,
    "path": "../public/games/playstation-2/star-wars-battlefront/index.html"
  },
  "/games/playstation-2/star-wars-battlefront/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"267-Nin0VbcK19vSnwSCP9ojncfXBus\"",
    "mtime": "2026-01-08T05:39:11.689Z",
    "size": 615,
    "path": "../public/games/playstation-2/star-wars-battlefront/_payload.json"
  },
  "/games/playstation-2/star-wars-battlefront-ii/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e894-EGzfR8GWN/e5UkqM0QYtrIdq33w\"",
    "mtime": "2026-01-08T05:39:09.478Z",
    "size": 256148,
    "path": "../public/games/playstation-2/star-wars-battlefront-ii/index.html"
  },
  "/games/playstation-2/star-wars-battlefront-ii/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"26a-0MsKxxir7L5k7hPea4Gy613L6Oo\"",
    "mtime": "2026-01-08T05:39:11.689Z",
    "size": 618,
    "path": "../public/games/playstation-2/star-wars-battlefront-ii/_payload.json"
  },
  "/games/playstation-2/suffering-the/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e85b-tVqeo9O9dfVsqGuEVLJMl1epS1Q\"",
    "mtime": "2026-01-08T05:39:09.549Z",
    "size": 256091,
    "path": "../public/games/playstation-2/suffering-the/index.html"
  },
  "/games/playstation-2/suffering-the/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"263-BNUB4mCAsqGgkAWTnjBHkz44Pz4\"",
    "mtime": "2026-01-08T05:39:11.707Z",
    "size": 611,
    "path": "../public/games/playstation-2/suffering-the/_payload.json"
  },
  "/games/playstation-2/taito-legends/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8ec-mq+38Mw3L7Z5DJ1Fjo5NELA3mIo\"",
    "mtime": "2026-01-08T05:39:09.781Z",
    "size": 256236,
    "path": "../public/games/playstation-2/taito-legends/index.html"
  },
  "/games/playstation-2/taito-legends/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"287-Bsphvs3FP9iOr0ty0vXIuwQhpdE\"",
    "mtime": "2026-01-08T05:39:11.777Z",
    "size": 647,
    "path": "../public/games/playstation-2/taito-legends/_payload.json"
  },
  "/games/playstation-2/taito-legends-2/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e909-v1vo5IIjhiY/dA5764LI13/Skfs\"",
    "mtime": "2026-01-08T05:39:09.781Z",
    "size": 256265,
    "path": "../public/games/playstation-2/taito-legends-2/index.html"
  },
  "/games/playstation-2/taito-legends-2/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"296-nInda/O739SEIO/Llsf4mxnxwcw\"",
    "mtime": "2026-01-08T05:39:11.777Z",
    "size": 662,
    "path": "../public/games/playstation-2/taito-legends-2/_payload.json"
  },
  "/games/playstation-2/tenchu-fatal-shadows/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e87e-nB7ztYXhXknPN8xw5EBA2L6UGbA\"",
    "mtime": "2026-01-08T05:39:09.977Z",
    "size": 256126,
    "path": "../public/games/playstation-2/tenchu-fatal-shadows/index.html"
  },
  "/games/playstation-2/tenchu-fatal-shadows/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"267-iokB5ZgtY4iCkaiQMtnQGWoZbik\"",
    "mtime": "2026-01-08T05:39:11.799Z",
    "size": 615,
    "path": "../public/games/playstation-2/tenchu-fatal-shadows/_payload.json"
  },
  "/games/playstation-2/takahashi-meijin-no-b-ken-jima/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8c1-YEtu9xxCLTBy06X0eqwi/TXdjYc\"",
    "mtime": "2026-01-08T05:39:09.800Z",
    "size": 256193,
    "path": "../public/games/playstation-2/takahashi-meijin-no-b-ken-jima/index.html"
  },
  "/games/playstation-2/takahashi-meijin-no-b-ken-jima/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"27a-3DXsZYxrHEOOPiQOsDCMY37FopA\"",
    "mtime": "2026-01-08T05:39:11.777Z",
    "size": 634,
    "path": "../public/games/playstation-2/takahashi-meijin-no-b-ken-jima/_payload.json"
  },
  "/games/playstation-2/tenchu-wrath-of-heaven/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e88a-U2BqrJVAV8C11DoYRvG8ngXgY1s\"",
    "mtime": "2026-01-08T05:39:09.977Z",
    "size": 256138,
    "path": "../public/games/playstation-2/tenchu-wrath-of-heaven/index.html"
  },
  "/games/playstation-2/tenchu-wrath-of-heaven/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"268-OGnh/Q869lA8vICbztnBYORNuKY\"",
    "mtime": "2026-01-08T05:39:11.799Z",
    "size": 616,
    "path": "../public/games/playstation-2/tenchu-wrath-of-heaven/_payload.json"
  },
  "/games/playstation-2/thunder-force-vi/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e864-NSokVpAo9R7RyVVk2WT+a5T+//k\"",
    "mtime": "2026-01-08T05:39:10.028Z",
    "size": 256100,
    "path": "../public/games/playstation-2/thunder-force-vi/index.html"
  },
  "/games/playstation-2/thunder-force-vi/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"262-uN5Hnz8+Rl/0ALo/QTHPnhLfyxE\"",
    "mtime": "2026-01-08T05:39:11.820Z",
    "size": 610,
    "path": "../public/games/playstation-2/thunder-force-vi/_payload.json"
  },
  "/games/playstation-2/timesplitters/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e9e4-qbqCLQAcZ6Bop+LY6x17JsMdYIE\"",
    "mtime": "2026-01-08T05:39:04.399Z",
    "size": 256484,
    "path": "../public/games/playstation-2/timesplitters/index.html"
  },
  "/games/playstation-2/timesplitters/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"318-XaCnNWF5lSBxbDCU1gXzBndh/Gs\"",
    "mtime": "2026-01-08T05:39:10.421Z",
    "size": 792,
    "path": "../public/games/playstation-2/timesplitters/_payload.json"
  },
  "/games/playstation-2/timesplitters-2/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e864-1fbdW0/Z+ObMPbcNpBH1obe7ge4\"",
    "mtime": "2026-01-08T05:39:10.028Z",
    "size": 256100,
    "path": "../public/games/playstation-2/timesplitters-2/index.html"
  },
  "/games/playstation-2/timesplitters-2/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"26a-4uqH5auHLM3iG8WBoCsv0XLSYFY\"",
    "mtime": "2026-01-08T05:39:11.820Z",
    "size": 618,
    "path": "../public/games/playstation-2/timesplitters-2/_payload.json"
  },
  "/games/playstation-2/tony-hawks-pro-skater-3/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8a4-ywVOq5avsuspvpcINUIZp/guwXY\"",
    "mtime": "2026-01-08T05:39:10.028Z",
    "size": 256164,
    "path": "../public/games/playstation-2/tony-hawks-pro-skater-3/index.html"
  },
  "/games/playstation-2/tony-hawks-pro-skater-3/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"273-aSMO18AiSTSD3XRXVQjGQ5lvkyY\"",
    "mtime": "2026-01-08T05:39:11.820Z",
    "size": 627,
    "path": "../public/games/playstation-2/tony-hawks-pro-skater-3/_payload.json"
  },
  "/games/playstation-2/valkyrie-profile-2-silmeria/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8ae-UsV6jd4cbO1dw4JkSH94NFF0FAo\"",
    "mtime": "2026-01-08T05:39:10.209Z",
    "size": 256174,
    "path": "../public/games/playstation-2/valkyrie-profile-2-silmeria/index.html"
  },
  "/games/playstation-2/valkyrie-profile-2-silmeria/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"271-4v8GEwsfJTyFNgs/jQH7ojOcnxA\"",
    "mtime": "2026-01-08T05:39:11.836Z",
    "size": 625,
    "path": "../public/games/playstation-2/valkyrie-profile-2-silmeria/_payload.json"
  },
  "/games/playstation-2/we-love-katamari/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e864-oAXmZ/oG4/LUyutKILxnc/8c63o\"",
    "mtime": "2026-01-08T05:39:10.209Z",
    "size": 256100,
    "path": "../public/games/playstation-2/we-love-katamari/index.html"
  },
  "/games/playstation-2/we-love-katamari/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"262-fINy1Q36ua9zkVm+sSadJJpwqAI\"",
    "mtime": "2026-01-08T05:39:11.852Z",
    "size": 610,
    "path": "../public/games/playstation-2/we-love-katamari/_payload.json"
  },
  "/games/playstation-2/wild-arms-3/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e84c-jNxiOezSe8R5BqHokQgEei2ggiw\"",
    "mtime": "2026-01-08T05:39:10.209Z",
    "size": 256076,
    "path": "../public/games/playstation-2/wild-arms-3/index.html"
  },
  "/games/playstation-2/wild-arms-3/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25f-5vjVPDbS0qb6wZv4Fecc+VO1MxM\"",
    "mtime": "2026-01-08T05:39:11.853Z",
    "size": 607,
    "path": "../public/games/playstation-2/wild-arms-3/_payload.json"
  },
  "/games/playstation-2/wild-arms-alter-code-f/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e890-QaB+itBhd1/LhbtqArQ7vP3jduk\"",
    "mtime": "2026-01-08T05:39:10.209Z",
    "size": 256144,
    "path": "../public/games/playstation-2/wild-arms-alter-code-f/index.html"
  },
  "/games/playstation-2/wild-arms-alter-code-f/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"26c-X73aB1yvVE6LyPkb2KW/PHDOM58\"",
    "mtime": "2026-01-08T05:39:11.853Z",
    "size": 620,
    "path": "../public/games/playstation-2/wild-arms-alter-code-f/_payload.json"
  },
  "/games/playstation-2/xenosaga/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e83a-8ftCTI9JXbIiPBFNDLANmN8nwuw\"",
    "mtime": "2026-01-08T05:39:10.221Z",
    "size": 256058,
    "path": "../public/games/playstation-2/xenosaga/index.html"
  },
  "/games/playstation-2/xenosaga/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25d-8ogPIYJC6IU+GfJ85jZEEKaZN9Q\"",
    "mtime": "2026-01-08T05:39:11.862Z",
    "size": 605,
    "path": "../public/games/playstation-2/xenosaga/_payload.json"
  },
  "/games/playstation-2/xenosaga-ii/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e84c-OisqxTBl5S5R8SSzSTk1lBu4VwA\"",
    "mtime": "2026-01-08T05:39:10.216Z",
    "size": 256076,
    "path": "../public/games/playstation-2/xenosaga-ii/index.html"
  },
  "/games/playstation-2/xenosaga-ii/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"260-0K7/dPEmMx8Vmy0ZRSvD6MkWT3o\"",
    "mtime": "2026-01-08T05:39:11.862Z",
    "size": 608,
    "path": "../public/games/playstation-2/xenosaga-ii/_payload.json"
  },
  "/games/playstation-2/ys-the-ark-of-napishtim/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e896-9u3nYuqrMg9QwIM1iBZLU+lOKHM\"",
    "mtime": "2026-01-08T05:39:10.310Z",
    "size": 256150,
    "path": "../public/games/playstation-2/ys-the-ark-of-napishtim/index.html"
  },
  "/games/playstation-2/ys-the-ark-of-napishtim/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"273-478WExlYjpLShM0B8kHNcIhlnEY\"",
    "mtime": "2026-01-08T05:39:11.866Z",
    "size": 627,
    "path": "../public/games/playstation-2/ys-the-ark-of-napishtim/_payload.json"
  },
  "/games/playstation-3/army-of-two/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3ee45-mIzQy2mCFl7Q4Q0eyp0eAe7lyQ4\"",
    "mtime": "2026-01-08T05:39:05.124Z",
    "size": 257605,
    "path": "../public/games/playstation-3/army-of-two/index.html"
  },
  "/games/playstation-3/army-of-two/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"362-HxUnu5WPbdG4pSdFgQP2TCfnpkw\"",
    "mtime": "2026-01-08T05:39:10.625Z",
    "size": 866,
    "path": "../public/games/playstation-3/army-of-two/_payload.json"
  },
  "/games/playstation-3/assassins-creed/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e874-Uw+AjJwHdTDEwswgjuwZtV5l2Ik\"",
    "mtime": "2026-01-08T05:39:05.183Z",
    "size": 256116,
    "path": "../public/games/playstation-3/assassins-creed/index.html"
  },
  "/games/playstation-3/assassins-creed/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"265-3A+kEy2lUDHuCkEuBUFQ/mJnx0Y\"",
    "mtime": "2026-01-08T05:39:10.643Z",
    "size": 613,
    "path": "../public/games/playstation-3/assassins-creed/_payload.json"
  },
  "/games/playstation-3/assassins-creed-brotherhood/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e947-KwhALY5ePakSiaoa4yFOEJAkk5Y\"",
    "mtime": "2026-01-08T05:39:05.158Z",
    "size": 256327,
    "path": "../public/games/playstation-3/assassins-creed-brotherhood/index.html"
  },
  "/games/playstation-3/assassins-creed-brotherhood/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"285-U8DsFAn37ZOCDQ72CoYC5hx1zms\"",
    "mtime": "2026-01-08T05:39:10.625Z",
    "size": 645,
    "path": "../public/games/playstation-3/assassins-creed-brotherhood/_payload.json"
  },
  "/games/playstation-3/assassins-creed-ii/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e915-arEUZVYh+zUeAcZszDsCC5b4KTM\"",
    "mtime": "2026-01-08T05:39:05.158Z",
    "size": 256277,
    "path": "../public/games/playstation-3/assassins-creed-ii/index.html"
  },
  "/games/playstation-3/assassins-creed-ii/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"27f-/aS02wYtq3MgDBSo5JRxQijx3Lg\"",
    "mtime": "2026-01-08T05:39:10.636Z",
    "size": 639,
    "path": "../public/games/playstation-3/assassins-creed-ii/_payload.json"
  },
  "/games/playstation-3/assassins-creed-revelations/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e947-Xg/ElorBDhZDK84g7UgHNV9tooU\"",
    "mtime": "2026-01-08T05:39:05.191Z",
    "size": 256327,
    "path": "../public/games/playstation-3/assassins-creed-revelations/index.html"
  },
  "/games/playstation-3/assassins-creed-revelations/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"286-q7/IcJ9xtwT4LOAkaq61CF4B4Mo\"",
    "mtime": "2026-01-08T05:39:10.644Z",
    "size": 646,
    "path": "../public/games/playstation-3/assassins-creed-revelations/_payload.json"
  },
  "/games/playstation-3/batman-arkham-asylum/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e913-O1gHQHktLsmCaCw3t8yLq6N6AnM\"",
    "mtime": "2026-01-08T05:39:05.146Z",
    "size": 256275,
    "path": "../public/games/playstation-3/batman-arkham-asylum/index.html"
  },
  "/games/playstation-3/batman-arkham-asylum/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"281-EbB9UhOc9RqwwIhRF5Y62jCpDrA\"",
    "mtime": "2026-01-08T05:39:10.625Z",
    "size": 641,
    "path": "../public/games/playstation-3/batman-arkham-asylum/_payload.json"
  },
  "/games/playstation-3/batman-arkham-city/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e901-y//6/FDDhtKguUzkVQkQEP9wgbU\"",
    "mtime": "2026-01-08T05:39:05.232Z",
    "size": 256257,
    "path": "../public/games/playstation-3/batman-arkham-city/index.html"
  },
  "/games/playstation-3/batman-arkham-city/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"282-fSd8QeEunPOQ97QBz7IdY1BR4Zg\"",
    "mtime": "2026-01-08T05:39:10.644Z",
    "size": 642,
    "path": "../public/games/playstation-3/batman-arkham-city/_payload.json"
  },
  "/games/playstation-3/call-of-duty-4-modern-warfare/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e942-sejgX9SCkS4621xM0KFmQYgpRNE\"",
    "mtime": "2026-01-08T05:39:05.337Z",
    "size": 256322,
    "path": "../public/games/playstation-3/call-of-duty-4-modern-warfare/index.html"
  },
  "/games/playstation-3/call-of-duty-4-modern-warfare/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"28c-4kjR84LBrfDSBL4gTFaME910ENc\"",
    "mtime": "2026-01-08T05:39:10.675Z",
    "size": 652,
    "path": "../public/games/playstation-3/call-of-duty-4-modern-warfare/_payload.json"
  },
  "/games/playstation-3/call-of-duty-black-ops/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e919-Pci9s+OI2KmIHEnKNoRVWT0uzMM\"",
    "mtime": "2026-01-08T05:39:05.362Z",
    "size": 256281,
    "path": "../public/games/playstation-3/call-of-duty-black-ops/index.html"
  },
  "/games/playstation-3/call-of-duty-black-ops/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"286-ID1i/KPKZNHGCggygxxVu8Y5eQY\"",
    "mtime": "2026-01-08T05:39:10.694Z",
    "size": 646,
    "path": "../public/games/playstation-3/call-of-duty-black-ops/_payload.json"
  },
  "/games/playstation-3/call-of-duty-black-ops-ii/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8a2-fQleNGtZzISi7GDErMSSwAgyU0U\"",
    "mtime": "2026-01-08T05:39:05.362Z",
    "size": 256162,
    "path": "../public/games/playstation-3/call-of-duty-black-ops-ii/index.html"
  },
  "/games/playstation-3/call-of-duty-black-ops-ii/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"275-k4t5bGCybX7BhPkVhWo0vJA7730\"",
    "mtime": "2026-01-08T05:39:10.694Z",
    "size": 629,
    "path": "../public/games/playstation-3/call-of-duty-black-ops-ii/_payload.json"
  },
  "/games/playstation-3/call-of-duty-ghosts/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e878-GPyGtt/j9Zb1EsZJcEGVedvqfrk\"",
    "mtime": "2026-01-08T05:39:05.362Z",
    "size": 256120,
    "path": "../public/games/playstation-3/call-of-duty-ghosts/index.html"
  },
  "/games/playstation-3/call-of-duty-ghosts/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"26c-Gp/N5U/W7zgvCEYqoweyQ+1ANW4\"",
    "mtime": "2026-01-08T05:39:10.694Z",
    "size": 620,
    "path": "../public/games/playstation-3/call-of-duty-ghosts/_payload.json"
  },
  "/games/playstation-3/call-of-duty-modern-warfare-2/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e949-0lDdD7QYZXNeWBcCwZT8XJuuQDA\"",
    "mtime": "2026-01-08T05:39:05.362Z",
    "size": 256329,
    "path": "../public/games/playstation-3/call-of-duty-modern-warfare-2/index.html"
  },
  "/games/playstation-3/call-of-duty-modern-warfare-2/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"290-uxqtYI8dELbkXCSG2nTGa/iwVsQ\"",
    "mtime": "2026-01-08T05:39:10.695Z",
    "size": 656,
    "path": "../public/games/playstation-3/call-of-duty-modern-warfare-2/_payload.json"
  },
  "/games/playstation-3/call-of-duty-modern-warfare-3/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e949-lw5Bv0Gz2tQBgCAogkAQ04v8ibM\"",
    "mtime": "2026-01-08T05:39:05.386Z",
    "size": 256329,
    "path": "../public/games/playstation-3/call-of-duty-modern-warfare-3/index.html"
  },
  "/games/playstation-3/call-of-duty-modern-warfare-3/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"290-k/qTlJJlanIc7wnI+ogVU9Xd+QQ\"",
    "mtime": "2026-01-08T05:39:10.694Z",
    "size": 656,
    "path": "../public/games/playstation-3/call-of-duty-modern-warfare-3/_payload.json"
  },
  "/games/playstation-3/call-of-duty-world-at-war/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e931-8IM9pXP9CI83HPgRESMi+Ypp0ew\"",
    "mtime": "2026-01-08T05:39:05.431Z",
    "size": 256305,
    "path": "../public/games/playstation-3/call-of-duty-world-at-war/index.html"
  },
  "/games/playstation-3/call-of-duty-world-at-war/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"28c-rbhtky7ufzispSYHvch/MszgOw0\"",
    "mtime": "2026-01-08T05:39:10.704Z",
    "size": 652,
    "path": "../public/games/playstation-3/call-of-duty-world-at-war/_payload.json"
  },
  "/games/playstation-3/catherine/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e83a-0kUKgsNqVnInePCDZ7qBqQKNGlQ\"",
    "mtime": "2026-01-08T05:39:05.492Z",
    "size": 256058,
    "path": "../public/games/playstation-3/catherine/index.html"
  },
  "/games/playstation-3/catherine/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25b-Bkbu1LjwRnT/7MlSsevdrSns2s8\"",
    "mtime": "2026-01-08T05:39:10.709Z",
    "size": 603,
    "path": "../public/games/playstation-3/catherine/_payload.json"
  },
  "/games/playstation-3/dantes-inferno/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e90a-oisAc+2RdgEhP/EeP6+YLP7wfvE\"",
    "mtime": "2026-01-08T05:39:05.608Z",
    "size": 256266,
    "path": "../public/games/playstation-3/dantes-inferno/index.html"
  },
  "/games/playstation-3/dantes-inferno/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"288-zbL9zyldtJNAVIs+vxnENk38Tys\"",
    "mtime": "2026-01-08T05:39:10.740Z",
    "size": 648,
    "path": "../public/games/playstation-3/dantes-inferno/_payload.json"
  },
  "/games/playstation-3/dead-space/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3eab1-xw9L89w34LbF/Gl1lE8O3Jx0UHU\"",
    "mtime": "2026-01-08T05:39:05.725Z",
    "size": 256689,
    "path": "../public/games/playstation-3/dead-space/index.html"
  },
  "/games/playstation-3/dead-space/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"3c9-FSFm3qE/gulNlCZcl5j3D2HSHdw\"",
    "mtime": "2026-01-08T05:39:10.763Z",
    "size": 969,
    "path": "../public/games/playstation-3/dead-space/_payload.json"
  },
  "/games/playstation-3/deadly-premonition/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e876-0rM7ICo3pICZMo6h3IUzHnXZqqo\"",
    "mtime": "2026-01-08T05:39:05.793Z",
    "size": 256118,
    "path": "../public/games/playstation-3/deadly-premonition/index.html"
  },
  "/games/playstation-3/deadly-premonition/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"266-miTEu67PVb7n2tMeHgjE2x4cboM\"",
    "mtime": "2026-01-08T05:39:10.763Z",
    "size": 614,
    "path": "../public/games/playstation-3/deadly-premonition/_payload.json"
  },
  "/games/playstation-3/dead-space-2/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e84c-LLXV/NQzvNw+Ty/8rHSc0LmAtXw\"",
    "mtime": "2026-01-08T05:39:05.755Z",
    "size": 256076,
    "path": "../public/games/playstation-3/dead-space-2/index.html"
  },
  "/games/playstation-3/dead-space-2/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25e-rVsf+KnU8PWPiCE+m2+e+2cfEPM\"",
    "mtime": "2026-01-08T05:39:10.763Z",
    "size": 606,
    "path": "../public/games/playstation-3/dead-space-2/_payload.json"
  },
  "/games/playstation-3/demons-souls/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8ef-3hHqBMvfUrAqxLt+/bvIK4tdRBY\"",
    "mtime": "2026-01-08T05:39:05.846Z",
    "size": 256239,
    "path": "../public/games/playstation-3/demons-souls/index.html"
  },
  "/games/playstation-3/demons-souls/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"277-7mayODqo4HuhF9O1e98eS1NmVYc\"",
    "mtime": "2026-01-08T05:39:10.800Z",
    "size": 631,
    "path": "../public/games/playstation-3/demons-souls/_payload.json"
  },
  "/games/playstation-3/demons-souls-jp/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8f8-MKI4rsKZ+x4SWGe70MQ95uON4fE\"",
    "mtime": "2026-01-08T05:39:05.816Z",
    "size": 256248,
    "path": "../public/games/playstation-3/demons-souls-jp/index.html"
  },
  "/games/playstation-3/demons-souls-jp/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"277-beOktRT17eEYTDOot6kyV6fja1Q\"",
    "mtime": "2026-01-08T05:39:10.782Z",
    "size": 631,
    "path": "../public/games/playstation-3/demons-souls-jp/_payload.json"
  },
  "/games/playstation-3/disgaea-3-absence-of-justice/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8b4-28QDFxu6B3fHtvRA88cgmcs70CI\"",
    "mtime": "2026-01-08T05:39:05.996Z",
    "size": 256180,
    "path": "../public/games/playstation-3/disgaea-3-absence-of-justice/index.html"
  },
  "/games/playstation-3/disgaea-3-absence-of-justice/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"272-nPK71nZKXRkz3qcMAE6s15irYUw\"",
    "mtime": "2026-01-08T05:39:10.816Z",
    "size": 626,
    "path": "../public/games/playstation-3/disgaea-3-absence-of-justice/_payload.json"
  },
  "/games/playstation-3/disgaea-4-a-promise-forgotten/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8ba-2ssjAz4++akkP5blJkz4zmQTAZ8\"",
    "mtime": "2026-01-08T05:39:05.955Z",
    "size": 256186,
    "path": "../public/games/playstation-3/disgaea-4-a-promise-forgotten/index.html"
  },
  "/games/playstation-3/disgaea-4-a-promise-forgotten/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"273-PcPwnzcaPdukMEjY+ldsciNo00w\"",
    "mtime": "2026-01-08T05:39:10.800Z",
    "size": 627,
    "path": "../public/games/playstation-3/disgaea-4-a-promise-forgotten/_payload.json"
  },
  "/games/playstation-3/dragon-age-ii/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8e1-TvhrV4RjWAc0yIdGGwyYfTt14/Q\"",
    "mtime": "2026-01-08T05:39:06.068Z",
    "size": 256225,
    "path": "../public/games/playstation-3/dragon-age-ii/index.html"
  },
  "/games/playstation-3/dragon-age-ii/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"27c-u1DfZKmTUdiK4ekptTR1QnLg6lM\"",
    "mtime": "2026-01-08T05:39:10.833Z",
    "size": 636,
    "path": "../public/games/playstation-3/dragon-age-ii/_payload.json"
  },
  "/games/playstation-3/fear-2-project-origin/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e890-iliHAXqz68EDKSu0EXc8jAv6cr4\"",
    "mtime": "2026-01-08T05:39:06.385Z",
    "size": 256144,
    "path": "../public/games/playstation-3/fear-2-project-origin/index.html"
  },
  "/games/playstation-3/fear-2-project-origin/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"26c-907Sd/tLy0b9q/BLT9MpGHhk4sA\"",
    "mtime": "2026-01-08T05:39:10.874Z",
    "size": 620,
    "path": "../public/games/playstation-3/fear-2-project-origin/_payload.json"
  },
  "/games/playstation-3/dragon-age-origins/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e907-ZL1cwbsr85AENAeyAiLSonW6zNE\"",
    "mtime": "2026-01-08T05:39:06.043Z",
    "size": 256263,
    "path": "../public/games/playstation-3/dragon-age-origins/index.html"
  },
  "/games/playstation-3/dragon-age-origins/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"285-TfziISFu35QRsH+cV7ILwGVEIxg\"",
    "mtime": "2026-01-08T05:39:10.833Z",
    "size": 645,
    "path": "../public/games/playstation-3/dragon-age-origins/_payload.json"
  },
  "/games/playstation-3/fear-first-encounter-assault-recon/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8de-9eOrTyO7Rw4GZh4ecqLoi8fL3Bw\"",
    "mtime": "2026-01-08T05:39:06.386Z",
    "size": 256222,
    "path": "../public/games/playstation-3/fear-first-encounter-assault-recon/index.html"
  },
  "/games/playstation-3/fear-first-encounter-assault-recon/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"279-eaSwGUULhzciGIjyj8FH22PrDBE\"",
    "mtime": "2026-01-08T05:39:10.893Z",
    "size": 633,
    "path": "../public/games/playstation-3/fear-first-encounter-assault-recon/_payload.json"
  },
  "/games/playstation-3/final-fantasy-xiii/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e870-3iU/6lDjwsZMhDg5i4c9MacpGNI\"",
    "mtime": "2026-01-08T05:39:06.792Z",
    "size": 256112,
    "path": "../public/games/playstation-3/final-fantasy-xiii/index.html"
  },
  "/games/playstation-3/final-fantasy-xiii/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"264-txklRMwHPoYvv3gXzLCP3A0lTIk\"",
    "mtime": "2026-01-08T05:39:10.988Z",
    "size": 612,
    "path": "../public/games/playstation-3/final-fantasy-xiii/_payload.json"
  },
  "/games/playstation-3/final-fantasy-xiii-2/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e882-NFEvAdhUY5h55SXfnUzA/ZVp7yw\"",
    "mtime": "2026-01-08T05:39:06.792Z",
    "size": 256130,
    "path": "../public/games/playstation-3/final-fantasy-xiii-2/index.html"
  },
  "/games/playstation-3/final-fantasy-xiii-2/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"269-HZEEo7a6bBIz5Z7sw6oPhQDe10I\"",
    "mtime": "2026-01-08T05:39:10.988Z",
    "size": 617,
    "path": "../public/games/playstation-3/final-fantasy-xiii-2/_payload.json"
  },
  "/games/playstation-3/final-fantasy-xiv-a-realm-reborn/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e975-KZiYuRNHcICFAyIdNWVgQR5/DlY\"",
    "mtime": "2026-01-08T05:39:06.792Z",
    "size": 256373,
    "path": "../public/games/playstation-3/final-fantasy-xiv-a-realm-reborn/index.html"
  },
  "/games/playstation-3/final-fantasy-xiv-a-realm-reborn/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"2a7-CiYp6Nn46M2przWlC7l+K3LyLT4\"",
    "mtime": "2026-01-08T05:39:10.988Z",
    "size": 679,
    "path": "../public/games/playstation-3/final-fantasy-xiv-a-realm-reborn/_payload.json"
  },
  "/games/playstation-3/god-of-war-iii/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8e7-Y042EeXxGjtU/v+osmEeZnoq/Ng\"",
    "mtime": "2026-01-08T05:39:06.969Z",
    "size": 256231,
    "path": "../public/games/playstation-3/god-of-war-iii/index.html"
  },
  "/games/playstation-3/god-of-war-iii/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"277-H7PxIwycFqgxkfeEoVLijXFSknA\"",
    "mtime": "2026-01-08T05:39:11.026Z",
    "size": 631,
    "path": "../public/games/playstation-3/god-of-war-iii/_payload.json"
  },
  "/games/playstation-3/god-of-war-ascension/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e913-WR6oyz53bbcHuHhPYe1apFMUsko\"",
    "mtime": "2026-01-08T05:39:06.991Z",
    "size": 256275,
    "path": "../public/games/playstation-3/god-of-war-ascension/index.html"
  },
  "/games/playstation-3/god-of-war-ascension/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"281-8bz91WvqShFFViORZO+LlqBnuVM\"",
    "mtime": "2026-01-08T05:39:11.027Z",
    "size": 641,
    "path": "../public/games/playstation-3/god-of-war-ascension/_payload.json"
  },
  "/games/playstation-3/heavy-rain/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8d6-bY+yXqV51W/wOgDFr+6edUnDmDQ\"",
    "mtime": "2026-01-08T05:39:07.024Z",
    "size": 256214,
    "path": "../public/games/playstation-3/heavy-rain/index.html"
  },
  "/games/playstation-3/heavy-rain/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"280-OA1KBrOTzGxgqzH9wUb7R2J3FzU\"",
    "mtime": "2026-01-08T05:39:11.048Z",
    "size": 640,
    "path": "../public/games/playstation-3/heavy-rain/_payload.json"
  },
  "/games/playstation-3/hitman-absolution/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e901-fr7e2yBYnUQ4eGDH9k3C+w7f2zU\"",
    "mtime": "2026-01-08T05:39:07.069Z",
    "size": 256257,
    "path": "../public/games/playstation-3/hitman-absolution/index.html"
  },
  "/games/playstation-3/hitman-absolution/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"283-UHFHR38cUBWbQbXbyQP5AowrPzg\"",
    "mtime": "2026-01-08T05:39:11.078Z",
    "size": 643,
    "path": "../public/games/playstation-3/hitman-absolution/_payload.json"
  },
  "/games/playstation-3/house-of-the-dead-overkill-extended-cut/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8f0-nabtX+i7DNfD0c5Qjue57+w+ass\"",
    "mtime": "2026-01-08T05:39:07.184Z",
    "size": 256240,
    "path": "../public/games/playstation-3/house-of-the-dead-overkill-extended-cut/index.html"
  },
  "/games/playstation-3/house-of-the-dead-overkill-extended-cut/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"27a-SraYpjFl59Q4kTLnvvT5WgU/MUo\"",
    "mtime": "2026-01-08T05:39:11.100Z",
    "size": 634,
    "path": "../public/games/playstation-3/house-of-the-dead-overkill-extended-cut/_payload.json"
  },
  "/games/playstation-3/katamari-forever/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e864-mZWR9NdLASi9ogElcsxLCNBXyBU\"",
    "mtime": "2026-01-08T05:39:07.424Z",
    "size": 256100,
    "path": "../public/games/playstation-3/katamari-forever/index.html"
  },
  "/games/playstation-3/katamari-forever/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"262-eZEJ+Mdp9mikVwyHxUzoxLyXyaY\"",
    "mtime": "2026-01-08T05:39:11.136Z",
    "size": 610,
    "path": "../public/games/playstation-3/katamari-forever/_payload.json"
  },
  "/games/playstation-3/killzone-2/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e904-EWVu5huZKlfaB7FsJxJh+iLXMbQ\"",
    "mtime": "2026-01-08T05:39:07.455Z",
    "size": 256260,
    "path": "../public/games/playstation-3/killzone-2/index.html"
  },
  "/games/playstation-3/killzone-2/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"2a5-Dl0HMwAae8xAWE+2DL+DaPO6f94\"",
    "mtime": "2026-01-08T05:39:11.154Z",
    "size": 677,
    "path": "../public/games/playstation-3/killzone-2/_payload.json"
  },
  "/games/playstation-3/killzone-3/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e904-ZYviVbkBBKrU5S9LD9roD+EAVJw\"",
    "mtime": "2026-01-08T05:39:07.430Z",
    "size": 256260,
    "path": "../public/games/playstation-3/killzone-3/index.html"
  },
  "/games/playstation-3/killzone-3/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"2ab-n4QVddHsAz3SOc7HiYnEUrvn4ZI\"",
    "mtime": "2026-01-08T05:39:11.154Z",
    "size": 683,
    "path": "../public/games/playstation-3/killzone-3/_payload.json"
  },
  "/games/playstation-3/lightning-returns-final-fantasy-xiii/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8e4-Ivr6bjCc+o8UbACgVw7dJNbrnA4\"",
    "mtime": "2026-01-08T05:39:07.629Z",
    "size": 256228,
    "path": "../public/games/playstation-3/lightning-returns-final-fantasy-xiii/index.html"
  },
  "/games/playstation-3/lightning-returns-final-fantasy-xiii/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"27a-d/ss1n9mikiL/VjONUxqz2p7ifg\"",
    "mtime": "2026-01-08T05:39:11.202Z",
    "size": 634,
    "path": "../public/games/playstation-3/lightning-returns-final-fantasy-xiii/_payload.json"
  },
  "/games/playstation-3/littlebigplanet/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e85e-VYccxagBJzPhZRzYVpZ1hZXYzD4\"",
    "mtime": "2026-01-08T05:39:07.668Z",
    "size": 256094,
    "path": "../public/games/playstation-3/littlebigplanet/index.html"
  },
  "/games/playstation-3/littlebigplanet/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"261-4lvdjq2b6KbxVlNcdDF1pgzOSks\"",
    "mtime": "2026-01-08T05:39:11.219Z",
    "size": 609,
    "path": "../public/games/playstation-3/littlebigplanet/_payload.json"
  },
  "/games/playstation-3/max-payne-3/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8e8-mtLfDT+UScq8fGDnFiNPLSEUUmg\"",
    "mtime": "2026-01-08T05:39:07.670Z",
    "size": 256232,
    "path": "../public/games/playstation-3/max-payne-3/index.html"
  },
  "/games/playstation-3/max-payne-3/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"28a-u9JR/8cUOwg1iW0fuZh+FGEZ1rQ\"",
    "mtime": "2026-01-08T05:39:11.257Z",
    "size": 650,
    "path": "../public/games/playstation-3/max-payne-3/_payload.json"
  },
  "/games/playstation-3/metal-gear-rising-revengeance/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8ba-qQUkF1nkJYrNMnY4kmgKnyDx6As\"",
    "mtime": "2026-01-08T05:39:07.910Z",
    "size": 256186,
    "path": "../public/games/playstation-3/metal-gear-rising-revengeance/index.html"
  },
  "/games/playstation-3/metal-gear-rising-revengeance/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"272-RCVZVaTSi0lmA0YIf8UeUJGE2/k\"",
    "mtime": "2026-01-08T05:39:11.276Z",
    "size": 626,
    "path": "../public/games/playstation-3/metal-gear-rising-revengeance/_payload.json"
  },
  "/games/playstation-3/metal-gear-solid-hd-collection-ps3/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8ca-eSfGllJ+z1mSOwChtWmhaf5tTCY\"",
    "mtime": "2026-01-08T05:39:07.910Z",
    "size": 256202,
    "path": "../public/games/playstation-3/metal-gear-solid-hd-collection-ps3/index.html"
  },
  "/games/playstation-3/metal-gear-solid-hd-collection-ps3/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"273-OxC3W8InFUQ5H/c9n2KW0AiVOZs\"",
    "mtime": "2026-01-08T05:39:11.276Z",
    "size": 627,
    "path": "../public/games/playstation-3/metal-gear-solid-hd-collection-ps3/_payload.json"
  },
  "/games/playstation-3/metal-gear-solid-the-legacy-collection/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8f0-mwz9w6QIL0x38CUDSM89z8mt3EY\"",
    "mtime": "2026-01-08T05:39:07.911Z",
    "size": 256240,
    "path": "../public/games/playstation-3/metal-gear-solid-the-legacy-collection/index.html"
  },
  "/games/playstation-3/metal-gear-solid-the-legacy-collection/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"27c-MRvajK91rD50RQkBCI7Pf9c8JBk\"",
    "mtime": "2026-01-08T05:39:11.297Z",
    "size": 636,
    "path": "../public/games/playstation-3/metal-gear-solid-the-legacy-collection/_payload.json"
  },
  "/games/playstation-3/ratchet-and-clank-future-tools-of-destruction/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e920-cUExGZuAI/Md4EttptCDMJk0RpM\"",
    "mtime": "2026-01-08T05:39:08.598Z",
    "size": 256288,
    "path": "../public/games/playstation-3/ratchet-and-clank-future-tools-of-destruction/index.html"
  },
  "/games/playstation-3/ratchet-and-clank-future-tools-of-destruction/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"281-9W/HvbMqDcUzMzyc9ttCwgZ3vM0\"",
    "mtime": "2026-01-08T05:39:11.467Z",
    "size": 641,
    "path": "../public/games/playstation-3/ratchet-and-clank-future-tools-of-destruction/_payload.json"
  },
  "/games/playstation-3/resistance-2/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8ee-T/ClYqLLT9WqZO8Aie2VF8yzvpw\"",
    "mtime": "2026-01-08T05:39:09.039Z",
    "size": 256238,
    "path": "../public/games/playstation-3/resistance-2/index.html"
  },
  "/games/playstation-3/resistance-2/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"285-t6ujWDuwLIZvDs9/amU1LCwKKzc\"",
    "mtime": "2026-01-08T05:39:11.536Z",
    "size": 645,
    "path": "../public/games/playstation-3/resistance-2/_payload.json"
  },
  "/games/playstation-3/resistance-fall-of-man/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e927-winanKjfyKfvqC97yzB6v09bq14\"",
    "mtime": "2026-01-08T05:39:09.039Z",
    "size": 256295,
    "path": "../public/games/playstation-3/resistance-fall-of-man/index.html"
  },
  "/games/playstation-3/resistance-fall-of-man/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"28e-15Z85NG6/O5nU9asCwiGMB7Ypxo\"",
    "mtime": "2026-01-08T05:39:11.536Z",
    "size": 654,
    "path": "../public/games/playstation-3/resistance-fall-of-man/_payload.json"
  },
  "/games/playstation-3/resonance-of-fate/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e86a-K0nzKnJGJ82cbNQcgwe+WNKtaQ8\"",
    "mtime": "2026-01-08T05:39:09.039Z",
    "size": 256106,
    "path": "../public/games/playstation-3/resonance-of-fate/index.html"
  },
  "/games/playstation-3/resonance-of-fate/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"263-wuhBcn9wW5WYV+BpJKWmFJWSKVU\"",
    "mtime": "2026-01-08T05:39:11.569Z",
    "size": 611,
    "path": "../public/games/playstation-3/resonance-of-fate/_payload.json"
  },
  "/games/playstation-3/silent-hill-downpour/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e884-KX+uGDwNAoZ8b4M0c8aTtSMRVQY\"",
    "mtime": "2026-01-08T05:39:09.258Z",
    "size": 256132,
    "path": "../public/games/playstation-3/silent-hill-downpour/index.html"
  },
  "/games/playstation-3/silent-hill-downpour/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"26a-2FSS8JzdN9LILSZU6UvJ9lYlCbc\"",
    "mtime": "2026-01-08T05:39:11.627Z",
    "size": 618,
    "path": "../public/games/playstation-3/silent-hill-downpour/_payload.json"
  },
  "/games/playstation-3/silent-hill-homecoming/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e927-7B7ylQ7iQMEzNp4rXhz1KSLR8Qg\"",
    "mtime": "2026-01-08T05:39:09.258Z",
    "size": 256295,
    "path": "../public/games/playstation-3/silent-hill-homecoming/index.html"
  },
  "/games/playstation-3/silent-hill-homecoming/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"28e-0XNXrVJHpn+CR/NjSpm3jV7cfNM\"",
    "mtime": "2026-01-08T05:39:11.627Z",
    "size": 654,
    "path": "../public/games/playstation-3/silent-hill-homecoming/_payload.json"
  },
  "/games/playstation-3/south-park-the-stick-of-truth/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8b4-MY7AoSVHYPd9xEJW0zi4Akefzgw\"",
    "mtime": "2026-01-08T05:39:09.744Z",
    "size": 256180,
    "path": "../public/games/playstation-3/south-park-the-stick-of-truth/index.html"
  },
  "/games/playstation-3/south-park-the-stick-of-truth/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"270-DUsa1cAVzvFOfFmRNzuBL0jiRbM\"",
    "mtime": "2026-01-08T05:39:11.725Z",
    "size": 624,
    "path": "../public/games/playstation-3/south-park-the-stick-of-truth/_payload.json"
  },
  "/games/playstation-4/bloodborne-goty/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e915-L8xDz0ceJv+0DqktIQu5IKz+TxM\"",
    "mtime": "2026-01-08T05:39:05.326Z",
    "size": 256277,
    "path": "../public/games/playstation-4/bloodborne-goty/index.html"
  },
  "/games/playstation-4/bloodborne-goty/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"29d-JTaNtUOBeme2VIu2XOJNzWpFHpU\"",
    "mtime": "2026-01-08T05:39:10.675Z",
    "size": 669,
    "path": "../public/games/playstation-4/bloodborne-goty/_payload.json"
  },
  "/games/playstation-3/valkyria-chrolicles/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e87c-5v/l9czhwXUMKwLvHh4ojhprvIo\"",
    "mtime": "2026-01-08T05:39:10.209Z",
    "size": 256124,
    "path": "../public/games/playstation-3/valkyria-chrolicles/index.html"
  },
  "/games/playstation-3/valkyria-chrolicles/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"26e-ZxMJ+7ClqknjlGRwT6RKcizB0bQ\"",
    "mtime": "2026-01-08T05:39:11.852Z",
    "size": 622,
    "path": "../public/games/playstation-3/valkyria-chrolicles/_payload.json"
  },
  "/games/playstation-4/danganronpa-1-2-reload/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e88e-BTrv0zWt3AoFaoZUND9tnH4QAMg\"",
    "mtime": "2026-01-08T05:39:05.593Z",
    "size": 256142,
    "path": "../public/games/playstation-4/danganronpa-1-2-reload/index.html"
  },
  "/games/playstation-4/danganronpa-1-2-reload/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"26b-qJNiV/RmbNYDiWbNQzJaQWgddN8\"",
    "mtime": "2026-01-08T05:39:10.740Z",
    "size": 619,
    "path": "../public/games/playstation-4/danganronpa-1-2-reload/_payload.json"
  },
  "/games/playstation-4/cladun-returns-this-is-sengoku/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8bd-D+PlDKiZ3YX69YDJ3JRFmkJMJjI\"",
    "mtime": "2026-01-08T05:39:05.492Z",
    "size": 256189,
    "path": "../public/games/playstation-4/cladun-returns-this-is-sengoku/index.html"
  },
  "/games/playstation-4/cladun-returns-this-is-sengoku/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"272-XgdibIvxtCI0QQ9Fy0uE5MYqYgk\"",
    "mtime": "2026-01-08T05:39:10.709Z",
    "size": 626,
    "path": "../public/games/playstation-4/cladun-returns-this-is-sengoku/_payload.json"
  },
  "/games/playstation-4/dark-picture-anthologies-little-hope/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e975-CxMuvwEanjaMoS+2mq/maMVt98U\"",
    "mtime": "2026-01-08T05:39:05.657Z",
    "size": 256373,
    "path": "../public/games/playstation-4/dark-picture-anthologies-little-hope/index.html"
  },
  "/games/playstation-4/dark-picture-anthologies-little-hope/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"298-7Pa8bHewbX27qS/x+CG7C0Z3bLg\"",
    "mtime": "2026-01-08T05:39:10.740Z",
    "size": 664,
    "path": "../public/games/playstation-4/dark-picture-anthologies-little-hope/_payload.json"
  },
  "/games/playstation-4/dark-picture-anthologies-man-of-medan/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8fb-ani5gksakwXxyIYzVoBZbEOW/Hg\"",
    "mtime": "2026-01-08T05:39:05.657Z",
    "size": 256251,
    "path": "../public/games/playstation-4/dark-picture-anthologies-man-of-medan/index.html"
  },
  "/games/playstation-4/dark-picture-anthologies-man-of-medan/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"281-/8w0/hWaxoyXJyEWcqgUQTuyr3E\"",
    "mtime": "2026-01-08T05:39:10.754Z",
    "size": 641,
    "path": "../public/games/playstation-4/dark-picture-anthologies-man-of-medan/_payload.json"
  },
  "/games/playstation-4/dark-souls-trilogy/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e928-nFg4Fp6KXnF24kKoHwmflPwSq0w\"",
    "mtime": "2026-01-08T05:39:05.657Z",
    "size": 256296,
    "path": "../public/games/playstation-4/dark-souls-trilogy/index.html"
  },
  "/games/playstation-4/dark-souls-trilogy/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"2a1-DvpGX52F54py8Aj+FWYrRzdoZk0\"",
    "mtime": "2026-01-08T05:39:10.763Z",
    "size": 673,
    "path": "../public/games/playstation-4/dark-souls-trilogy/_payload.json"
  },
  "/games/playstation-4/downwell/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e83a-Klx0Zz6VE/F2RJ4jiiImYh5sFag\"",
    "mtime": "2026-01-08T05:39:06.043Z",
    "size": 256058,
    "path": "../public/games/playstation-4/downwell/index.html"
  },
  "/games/playstation-4/downwell/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"263-8l/i2avx8vW2JiurpZI7btJKBLg\"",
    "mtime": "2026-01-08T05:39:10.833Z",
    "size": 611,
    "path": "../public/games/playstation-4/downwell/_payload.json"
  },
  "/games/playstation-4/enter-the-gungeon/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e870-mz1uzt57TT6vqdhXBtIiFgq7Ilc\"",
    "mtime": "2026-01-08T05:39:06.385Z",
    "size": 256112,
    "path": "../public/games/playstation-4/enter-the-gungeon/index.html"
  },
  "/games/playstation-4/enter-the-gungeon/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"26c-PKugfOAZiKX8Tl75dZqHJa0dFRY\"",
    "mtime": "2026-01-08T05:39:10.874Z",
    "size": 620,
    "path": "../public/games/playstation-4/enter-the-gungeon/_payload.json"
  },
  "/games/playstation-4/final-fantasy-xii-the-zodiac-age/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8cc-ISsYRWYtr59YrbmNXO8GXdQavMo\"",
    "mtime": "2026-01-08T05:39:06.792Z",
    "size": 256204,
    "path": "../public/games/playstation-4/final-fantasy-xii-the-zodiac-age/index.html"
  },
  "/games/playstation-4/final-fantasy-xii-the-zodiac-age/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"276-K/dKn8VQ11OwE3s4Jr3mKgJAIuE\"",
    "mtime": "2026-01-08T05:39:10.988Z",
    "size": 630,
    "path": "../public/games/playstation-4/final-fantasy-xii-the-zodiac-age/_payload.json"
  },
  "/games/playstation-4/final-fantasy-xv/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e864-EoEs37ChYFT861Re7NQyAI/b7nw\"",
    "mtime": "2026-01-08T05:39:06.792Z",
    "size": 256100,
    "path": "../public/games/playstation-4/final-fantasy-xv/index.html"
  },
  "/games/playstation-4/final-fantasy-xv/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"261-Ext9+2/a5OXeqjTT4afTlH2G+Eo\"",
    "mtime": "2026-01-08T05:39:10.988Z",
    "size": 609,
    "path": "../public/games/playstation-4/final-fantasy-xv/_payload.json"
  },
  "/games/playstation-4/god-of-war-ps4/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8e2-TD1sq9/CRgHpQmn/dxwnimzt3tw\"",
    "mtime": "2026-01-08T05:39:06.928Z",
    "size": 256226,
    "path": "../public/games/playstation-4/god-of-war-ps4/index.html"
  },
  "/games/playstation-4/god-of-war-ps4/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"27a-VKaG6zMRiofxnGsyfUE/f1pfijM\"",
    "mtime": "2026-01-08T05:39:11.009Z",
    "size": 634,
    "path": "../public/games/playstation-4/god-of-war-ps4/_payload.json"
  },
  "/games/playstation-4/gundemoniums/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8e3-hS8F8KC/xnGSYPRPrH3LJwgmf6U\"",
    "mtime": "2026-01-08T05:39:07.024Z",
    "size": 256227,
    "path": "../public/games/playstation-4/gundemoniums/index.html"
  },
  "/games/playstation-4/gundemoniums/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"27d-0Pg0jcfdEyLtI1ywPRReaTN4zwI\"",
    "mtime": "2026-01-08T05:39:11.048Z",
    "size": 637,
    "path": "../public/games/playstation-4/gundemoniums/_payload.json"
  },
  "/games/playstation-4/horizon-zero-dawn/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e86a-6VM0/+8Q+G7TA4v8hNhvHSoqzTI\"",
    "mtime": "2026-01-08T05:39:07.184Z",
    "size": 256106,
    "path": "../public/games/playstation-4/horizon-zero-dawn/index.html"
  },
  "/games/playstation-4/horizon-zero-dawn/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"263-56leezNr3j3by0FUndt+jsq4If8\"",
    "mtime": "2026-01-08T05:39:11.078Z",
    "size": 611,
    "path": "../public/games/playstation-4/horizon-zero-dawn/_payload.json"
  },
  "/games/playstation-4/hotline-miami/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8e0-Kb4nWvxQdHOs8ayaFOiaKX9SSJE\"",
    "mtime": "2026-01-08T05:39:07.153Z",
    "size": 256224,
    "path": "../public/games/playstation-4/hotline-miami/index.html"
  },
  "/games/playstation-4/hotline-miami/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"278-JMU1nF0hHuiDSXGbpmYovyLC5ss\"",
    "mtime": "2026-01-08T05:39:11.077Z",
    "size": 632,
    "path": "../public/games/playstation-4/hotline-miami/_payload.json"
  },
  "/games/playstation-4/hotline-miami-2-wrong-number/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e936-GTqHNR91R/IeB50vlqRujIiui1Q\"",
    "mtime": "2026-01-08T05:39:07.184Z",
    "size": 256310,
    "path": "../public/games/playstation-4/hotline-miami-2-wrong-number/index.html"
  },
  "/games/playstation-4/hotline-miami-2-wrong-number/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"285-gOdgJ+Uu2aFxO13ekk+JjjQPNUQ\"",
    "mtime": "2026-01-08T05:39:11.099Z",
    "size": 645,
    "path": "../public/games/playstation-4/hotline-miami-2-wrong-number/_payload.json"
  },
  "/games/playstation-4/injustice-2-legendary-edition/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e967-OgRZCZrj7TckIAl3ZgJGMehRTHg\"",
    "mtime": "2026-01-08T05:39:07.184Z",
    "size": 256359,
    "path": "../public/games/playstation-4/injustice-2-legendary-edition/index.html"
  },
  "/games/playstation-4/injustice-2-legendary-edition/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"275-V6poaeNVxAKePgdd4y4bxYI5oes\"",
    "mtime": "2026-01-08T05:39:11.100Z",
    "size": 629,
    "path": "../public/games/playstation-4/injustice-2-legendary-edition/_payload.json"
  },
  "/games/playstation-4/injustice-gods-among-us-ultimate-edition/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e9ab-KC5h3MEwlplm33aoDAbaqJxG5rU\"",
    "mtime": "2026-01-08T05:39:07.184Z",
    "size": 256427,
    "path": "../public/games/playstation-4/injustice-gods-among-us-ultimate-edition/index.html"
  },
  "/games/playstation-4/injustice-gods-among-us-ultimate-edition/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"29e-T+PV1NBuluWs2o6T8CIOSbFBrWM\"",
    "mtime": "2026-01-08T05:39:11.099Z",
    "size": 670,
    "path": "../public/games/playstation-4/injustice-gods-among-us-ultimate-edition/_payload.json"
  },
  "/games/playstation-4/kamiwaza-way-of-the-thief/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e933-hriehPV/0S1FEKCcL1G3osDdAdU\"",
    "mtime": "2026-01-08T05:39:07.241Z",
    "size": 256307,
    "path": "../public/games/playstation-4/kamiwaza-way-of-the-thief/index.html"
  },
  "/games/playstation-4/kamiwaza-way-of-the-thief/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"28d-KiJttn2dob6DGHNCBYWBYodqDJ4\"",
    "mtime": "2026-01-08T05:39:11.135Z",
    "size": 653,
    "path": "../public/games/playstation-4/kamiwaza-way-of-the-thief/_payload.json"
  },
  "/games/playstation-4/middle-earth-shadow-of-war/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e939-2pQgBAYYuYUdNbw2VNkNUKWdDVc\"",
    "mtime": "2026-01-08T05:39:08.068Z",
    "size": 256313,
    "path": "../public/games/playstation-4/middle-earth-shadow-of-war/index.html"
  },
  "/games/playstation-4/middle-earth-shadow-of-war/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"28e-22Wn1sziuXlRhpm5UJvNsXg28y8\"",
    "mtime": "2026-01-08T05:39:11.314Z",
    "size": 654,
    "path": "../public/games/playstation-4/middle-earth-shadow-of-war/_payload.json"
  },
  "/games/playstation-4/mystery-chronicle-one-way-heroics/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8cc-QORsFOwf93jym7YNWxVxyTaFM4Y\"",
    "mtime": "2026-01-08T05:39:08.107Z",
    "size": 256204,
    "path": "../public/games/playstation-4/mystery-chronicle-one-way-heroics/index.html"
  },
  "/games/playstation-4/mystery-chronicle-one-way-heroics/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"274-5TYb6I4NfZ1TewUP4WfF3eKGrOw\"",
    "mtime": "2026-01-08T05:39:11.330Z",
    "size": 628,
    "path": "../public/games/playstation-4/mystery-chronicle-one-way-heroics/_payload.json"
  },
  "/games/playstation-4/nier-automata/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e85a-zmHhHPwS28vFH1gAeEzR4BA2Has\"",
    "mtime": "2026-01-08T05:39:08.107Z",
    "size": 256090,
    "path": "../public/games/playstation-4/nier-automata/index.html"
  },
  "/games/playstation-4/nier-automata/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"263-MAoAY3QsQFu7R5KxMlVSPhB3TpA\"",
    "mtime": "2026-01-08T05:39:11.330Z",
    "size": 611,
    "path": "../public/games/playstation-4/nier-automata/_payload.json"
  },
  "/games/playstation-4/nioh/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e822-FP/wDtujhFklRRM/nZf+RbpMBR8\"",
    "mtime": "2026-01-08T05:39:08.107Z",
    "size": 256034,
    "path": "../public/games/playstation-4/nioh/index.html"
  },
  "/games/playstation-4/nioh/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"259-sgepIL8CfBsvfWROSsI2AL6y2OE\"",
    "mtime": "2026-01-08T05:39:11.351Z",
    "size": 601,
    "path": "../public/games/playstation-4/nioh/_payload.json"
  },
  "/games/playstation-4/outlast-trinity/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e904-fogx0KbbpNYrb4zWGbe1Ct2r3KY\"",
    "mtime": "2026-01-08T05:39:08.345Z",
    "size": 256260,
    "path": "../public/games/playstation-4/outlast-trinity/index.html"
  },
  "/games/playstation-4/outlast-trinity/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"28b-vqZfBAJ280phkn48ngNz8378LX4\"",
    "mtime": "2026-01-08T05:39:11.374Z",
    "size": 651,
    "path": "../public/games/playstation-4/outlast-trinity/_payload.json"
  },
  "/games/playstation-4/persona-5/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e842-D1y+lWttOp5Za1ocF8Q7QlkmqK4\"",
    "mtime": "2026-01-08T05:39:08.345Z",
    "size": 256066,
    "path": "../public/games/playstation-4/persona-5/index.html"
  },
  "/games/playstation-4/persona-5/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25f-IjlQRotv2CfLPD1P3hUFIdNJx7s\"",
    "mtime": "2026-01-08T05:39:11.416Z",
    "size": 607,
    "path": "../public/games/playstation-4/persona-5/_payload.json"
  },
  "/games/playstation-4/pix-the-cat/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8d5-CCTEAjibxsTI8F8+JfNa9F9NOd0\"",
    "mtime": "2026-01-08T05:39:08.345Z",
    "size": 256213,
    "path": "../public/games/playstation-4/pix-the-cat/index.html"
  },
  "/games/playstation-4/pix-the-cat/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"279-BSZqe8Of/PH3NAViZUeoQ9v9/Mk\"",
    "mtime": "2026-01-08T05:39:11.416Z",
    "size": 633,
    "path": "../public/games/playstation-4/pix-the-cat/_payload.json"
  },
  "/games/playstation-4/raiden-v-directors-cut/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e89a-F/rqzhmK8OiSaGlZzLO0oj85skQ\"",
    "mtime": "2026-01-08T05:39:08.597Z",
    "size": 256154,
    "path": "../public/games/playstation-4/raiden-v-directors-cut/index.html"
  },
  "/games/playstation-4/raiden-v-directors-cut/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"26a-E0MxgCFL33rigX4nE+5jEM8GNbg\"",
    "mtime": "2026-01-08T05:39:11.467Z",
    "size": 618,
    "path": "../public/games/playstation-4/raiden-v-directors-cut/_payload.json"
  },
  "/games/playstation-4/rocksmith-2014-edition/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e888-t8WWcBiYDFJcG0nxOSqzuH74YEs\"",
    "mtime": "2026-01-08T05:39:09.039Z",
    "size": 256136,
    "path": "../public/games/playstation-4/rocksmith-2014-edition/index.html"
  },
  "/games/playstation-4/rocksmith-2014-edition/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"268-l/L/aklBGGAhA/VlffQbAJKg4ag\"",
    "mtime": "2026-01-08T05:39:11.536Z",
    "size": 616,
    "path": "../public/games/playstation-4/rocksmith-2014-edition/_payload.json"
  },
  "/games/playstation-4/secret-of-mana/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e85e-cNJ2lu/d8kYb+ayVi7pe2k0Scn0\"",
    "mtime": "2026-01-08T05:39:09.039Z",
    "size": 256094,
    "path": "../public/games/playstation-4/secret-of-mana/index.html"
  },
  "/games/playstation-4/secret-of-mana/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"263-IYNmITE6Gix6XFRrkmzUSd9/mro\"",
    "mtime": "2026-01-08T05:39:11.569Z",
    "size": 611,
    "path": "../public/games/playstation-4/secret-of-mana/_payload.json"
  },
  "/games/playstation-4/shadow-of-mordor-game-of-the-year-edition/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3eaa7-GxFm4wY7S+EMvXQmVCwOlCLkFP8\"",
    "mtime": "2026-01-08T05:39:04.399Z",
    "size": 256679,
    "path": "../public/games/playstation-4/shadow-of-mordor-game-of-the-year-edition/index.html"
  },
  "/games/playstation-4/shadow-of-mordor-game-of-the-year-edition/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"331-wvlzj/7V+wpc16CWUmlLWfuUdlg\"",
    "mtime": "2026-01-08T05:39:10.406Z",
    "size": 817,
    "path": "../public/games/playstation-4/shadow-of-mordor-game-of-the-year-edition/_payload.json"
  },
  "/games/playstation-4/shadow-of-the-colossus-ps4/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e894-kwa6MXTP54qMZFHba35dOFaETWs\"",
    "mtime": "2026-01-08T05:39:09.039Z",
    "size": 256148,
    "path": "../public/games/playstation-4/shadow-of-the-colossus-ps4/index.html"
  },
  "/games/playstation-4/shadow-of-the-colossus-ps4/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"268-7c4qGvX5JygLfWP1Pz1kE7vXVsI\"",
    "mtime": "2026-01-08T05:39:11.569Z",
    "size": 616,
    "path": "../public/games/playstation-4/shadow-of-the-colossus-ps4/_payload.json"
  },
  "/games/playstation-4/sine-mora-ex/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e84c-Jqqg6l+P1fcGzpkZrWnG/TLa3gY\"",
    "mtime": "2026-01-08T05:39:09.258Z",
    "size": 256076,
    "path": "../public/games/playstation-4/sine-mora-ex/index.html"
  },
  "/games/playstation-4/sine-mora-ex/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25e-5XZhXiI6C2WT1U+FK209T9UoeS4\"",
    "mtime": "2026-01-08T05:39:11.650Z",
    "size": 606,
    "path": "../public/games/playstation-4/sine-mora-ex/_payload.json"
  },
  "/games/playstation-4/spyro-reignited-trilogy/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e896-wil6tFzu36l2CnX3QEArveqwPxY\"",
    "mtime": "2026-01-08T05:39:09.477Z",
    "size": 256150,
    "path": "../public/games/playstation-4/spyro-reignited-trilogy/index.html"
  },
  "/games/playstation-4/spyro-reignited-trilogy/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"26d-YsllGixMQf+lxv+3Jn/nkPevKic\"",
    "mtime": "2026-01-08T05:39:11.689Z",
    "size": 621,
    "path": "../public/games/playstation-4/spyro-reignited-trilogy/_payload.json"
  },
  "/games/playstation-4/the-evil-within/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8ed-U3aJRWUCv6HBiyj3/7m6WMaOK50\"",
    "mtime": "2026-01-08T05:39:09.977Z",
    "size": 256237,
    "path": "../public/games/playstation-4/the-evil-within/index.html"
  },
  "/games/playstation-4/the-evil-within/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"27d-TaEWkMazqOpuEEkiaf2++3oKmII\"",
    "mtime": "2026-01-08T05:39:11.799Z",
    "size": 637,
    "path": "../public/games/playstation-4/the-evil-within/_payload.json"
  },
  "/games/playstation-4/the-evil-within-2/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e870-P3Pc4kqv3+4jnZ3jIhgSYfzw7Sk\"",
    "mtime": "2026-01-08T05:39:10.027Z",
    "size": 256112,
    "path": "../public/games/playstation-4/the-evil-within-2/index.html"
  },
  "/games/playstation-4/the-evil-within-2/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"266-ctg5eu3dzKWHQW+7elmoUmES0Do\"",
    "mtime": "2026-01-08T05:39:11.799Z",
    "size": 614,
    "path": "../public/games/playstation-4/the-evil-within-2/_payload.json"
  },
  "/games/playstation-4/the-walking-dead-the-telltale-definitive-series/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e9b5-Maa+dd9X1yhjIeCp0nlWx7eDAuc\"",
    "mtime": "2026-01-08T05:39:10.028Z",
    "size": 256437,
    "path": "../public/games/playstation-4/the-walking-dead-the-telltale-definitive-series/index.html"
  },
  "/games/playstation-4/the-walking-dead-the-telltale-definitive-series/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"2a2-7z2H8qMxPA6iNgY+l3Pgu7mca54\"",
    "mtime": "2026-01-08T05:39:11.820Z",
    "size": 674,
    "path": "../public/games/playstation-4/the-walking-dead-the-telltale-definitive-series/_payload.json"
  },
  "/games/playstation-4/uncharted-the-nathan-drake-collection/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e979-HP8vS5Q+Yp4V2mCJIhz7GxiqCWs\"",
    "mtime": "2026-01-08T05:39:10.209Z",
    "size": 256377,
    "path": "../public/games/playstation-4/uncharted-the-nathan-drake-collection/index.html"
  },
  "/games/playstation-4/uncharted-the-nathan-drake-collection/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"298-6Epo+47IVa1mk9YXioatjA7ujC0\"",
    "mtime": "2026-01-08T05:39:11.836Z",
    "size": 664,
    "path": "../public/games/playstation-4/uncharted-the-nathan-drake-collection/_payload.json"
  },
  "/games/playstation-4/until-dawn/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e920-9QOIB0peD+E+TCBSvh1SW4xiLA4\"",
    "mtime": "2026-01-08T05:39:03.935Z",
    "size": 256288,
    "path": "../public/games/playstation-4/until-dawn/index.html"
  },
  "/games/playstation-4/until-dawn/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"2af-lYuOujva7v+BTSPNumN8K30Atlg\"",
    "mtime": "2026-01-08T05:39:10.350Z",
    "size": 687,
    "path": "../public/games/playstation-4/until-dawn/_payload.json"
  },
  "/games/playstation-4/wolfenstein-ii-the-new-colossus/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e955-NtlJBsEYLWty/dl8kHFlAUqb/TQ\"",
    "mtime": "2026-01-08T05:39:10.209Z",
    "size": 256341,
    "path": "../public/games/playstation-4/wolfenstein-ii-the-new-colossus/index.html"
  },
  "/games/playstation-4/wolfenstein-ii-the-new-colossus/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"292-uAeTBun8/j6vNkMtGHECL1VAye8\"",
    "mtime": "2026-01-08T05:39:11.854Z",
    "size": 658,
    "path": "../public/games/playstation-4/wolfenstein-ii-the-new-colossus/_payload.json"
  },
  "/games/playstation-4/wolfenstein-the-new-order/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e931-xFSH1mW1l50GyC/RFQGKTiEROQk\"",
    "mtime": "2026-01-08T05:39:10.209Z",
    "size": 256305,
    "path": "../public/games/playstation-4/wolfenstein-the-new-order/index.html"
  },
  "/games/playstation-4/wolfenstein-the-new-order/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"28b-crN1x6sdq1ADHEGVu3UlSHyeHJI\"",
    "mtime": "2026-01-08T05:39:11.862Z",
    "size": 651,
    "path": "../public/games/playstation-4/wolfenstein-the-new-order/_payload.json"
  },
  "/games/playstation-4/wolfenstein-the-old-blood/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e931-lgeBowJsRMWqPREEFh0a2wc0L50\"",
    "mtime": "2026-01-08T05:39:10.209Z",
    "size": 256305,
    "path": "../public/games/playstation-4/wolfenstein-the-old-blood/index.html"
  },
  "/games/playstation-4/wolfenstein-the-old-blood/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"28c-mxhY5hpeKFsnKleUpK7AxdjNZEQ\"",
    "mtime": "2026-01-08T05:39:11.862Z",
    "size": 652,
    "path": "../public/games/playstation-4/wolfenstein-the-old-blood/_payload.json"
  },
  "/games/playstation-4/world-of-final-fantasy/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e88e-77kCjgH9DuoJKxx8lFIq+OSRQoA\"",
    "mtime": "2026-01-08T05:39:10.209Z",
    "size": 256142,
    "path": "../public/games/playstation-4/world-of-final-fantasy/index.html"
  },
  "/games/playstation-4/world-of-final-fantasy/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"26b-w5gGFZJDbT71oVl8rYeoX5iBG8E\"",
    "mtime": "2026-01-08T05:39:11.862Z",
    "size": 619,
    "path": "../public/games/playstation-4/world-of-final-fantasy/_payload.json"
  },
  "/games/playstation-4/ys-origin/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e83a-aLzj/rWdhD3XQAiPKV3R2yv7XO0\"",
    "mtime": "2026-01-08T05:39:10.221Z",
    "size": 256058,
    "path": "../public/games/playstation-4/ys-origin/index.html"
  },
  "/games/playstation-4/ys-origin/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25b-koq2iU4NkrEFNsOutD7IaCWCs9o\"",
    "mtime": "2026-01-08T05:39:11.866Z",
    "size": 603,
    "path": "../public/games/playstation-4/ys-origin/_payload.json"
  },
  "/games/playstation-4/ys-viii-lacrimosa-of-dana/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e89c-Hos/HAThNRGG1eGdg2LdvGSJWW4\"",
    "mtime": "2026-01-08T05:39:10.310Z",
    "size": 256156,
    "path": "../public/games/playstation-4/ys-viii-lacrimosa-of-dana/index.html"
  },
  "/games/playstation-4/ys-viii-lacrimosa-of-dana/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"26b-onVVPZbwfjYTOBXKjyniFQjqLUs\"",
    "mtime": "2026-01-08T05:39:11.866Z",
    "size": 619,
    "path": "../public/games/playstation-4/ys-viii-lacrimosa-of-dana/_payload.json"
  },
  "/games/playstation-5/a-plague-tale-innocence/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e91f-7iPb+UlpLuU8GHZaD1JBrp88XqI\"",
    "mtime": "2026-01-08T05:39:04.978Z",
    "size": 256287,
    "path": "../public/games/playstation-5/a-plague-tale-innocence/index.html"
  },
  "/games/playstation-5/a-plague-tale-innocence/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"287-/9s6e6HjQ7keE5eGnWzOw7CPZYM\"",
    "mtime": "2026-01-08T05:39:10.571Z",
    "size": 647,
    "path": "../public/games/playstation-5/a-plague-tale-innocence/_payload.json"
  },
  "/games/playstation-5/crisis-core-final-fantasy-vii-reunion/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8e8-PhIk5lV4RuIVpO0tTqTKCsBGcOw\"",
    "mtime": "2026-01-08T05:39:05.541Z",
    "size": 256232,
    "path": "../public/games/playstation-5/crisis-core-final-fantasy-vii-reunion/index.html"
  },
  "/games/playstation-5/crisis-core-final-fantasy-vii-reunion/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"265-PApm6DyFuYoCgTio5mAkkrJHEQs\"",
    "mtime": "2026-01-08T05:39:10.725Z",
    "size": 613,
    "path": "../public/games/playstation-5/crisis-core-final-fantasy-vii-reunion/_payload.json"
  },
  "/games/playstation-5/dark-picture-anthologies-house-of-ashes/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e987-LLlt0PmBH0u0T1myu3jjgWxk9PE\"",
    "mtime": "2026-01-08T05:39:05.593Z",
    "size": 256391,
    "path": "../public/games/playstation-5/dark-picture-anthologies-house-of-ashes/index.html"
  },
  "/games/playstation-5/dark-picture-anthologies-house-of-ashes/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"29b-PKqMzHq74n8PLpdbZ41Y2HgGbAQ\"",
    "mtime": "2026-01-08T05:39:10.740Z",
    "size": 667,
    "path": "../public/games/playstation-5/dark-picture-anthologies-house-of-ashes/_payload.json"
  },
  "/games/playstation-5/dead-space/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3eaad-R8iJvklsTPdM9ubsoe0Z/X0kQv8\"",
    "mtime": "2026-01-08T05:39:04.075Z",
    "size": 256685,
    "path": "../public/games/playstation-5/dead-space/index.html"
  },
  "/games/playstation-5/dead-space/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"3ce-8TGF2cPmSxsaAlqD6F96oioJN30\"",
    "mtime": "2026-01-08T05:39:10.374Z",
    "size": 974,
    "path": "../public/games/playstation-5/dead-space/_payload.json"
  },
  "/games/playstation-5/death-stranding-directors-cut/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e950-9B3MIM5r9U8j4oF/94vfN26dg4I\"",
    "mtime": "2026-01-08T05:39:05.793Z",
    "size": 256336,
    "path": "../public/games/playstation-5/death-stranding-directors-cut/index.html"
  },
  "/games/playstation-5/death-stranding-directors-cut/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"292-E62Rc/bgHc7+RLIa11P9z0gMK8c\"",
    "mtime": "2026-01-08T05:39:10.783Z",
    "size": 658,
    "path": "../public/games/playstation-5/death-stranding-directors-cut/_payload.json"
  },
  "/games/playstation-5/deathloop/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8d0-gAQL7IAtAcJ2OgEi5g/kxiFfVBg\"",
    "mtime": "2026-01-08T05:39:05.793Z",
    "size": 256208,
    "path": "../public/games/playstation-5/deathloop/index.html"
  },
  "/games/playstation-5/deathloop/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"27c-GTBnsSCEJo+k0bkOke0etJQQvOA\"",
    "mtime": "2026-01-08T05:39:10.782Z",
    "size": 636,
    "path": "../public/games/playstation-5/deathloop/_payload.json"
  },
  "/games/playstation-5/deaths-door/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8ec-0+e699k2s0drpwaiP52B0XUznqc\"",
    "mtime": "2026-01-08T05:39:05.793Z",
    "size": 256236,
    "path": "../public/games/playstation-5/deaths-door/index.html"
  },
  "/games/playstation-5/deaths-door/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"27f-EETQHUP5y7jb6cZZIClSPAbO66g\"",
    "mtime": "2026-01-08T05:39:10.775Z",
    "size": 639,
    "path": "../public/games/playstation-5/deaths-door/_payload.json"
  },
  "/games/playstation-5/demons-souls-ps5/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8fe-LKStAyiGEQsHcD7u0aGvQ/ewyFc\"",
    "mtime": "2026-01-08T05:39:05.793Z",
    "size": 256254,
    "path": "../public/games/playstation-5/demons-souls-ps5/index.html"
  },
  "/games/playstation-5/demons-souls-ps5/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"280-co24ZEIqs+V8AsUa1qoZkcIfxSU\"",
    "mtime": "2026-01-08T05:39:10.782Z",
    "size": 640,
    "path": "../public/games/playstation-5/demons-souls-ps5/_payload.json"
  },
  "/games/playstation-5/eiyuden-chronicle-hundred-heroes/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e95b-1V+c4EZ8+4u4Wlxzut2rblg563I\"",
    "mtime": "2026-01-08T05:39:06.356Z",
    "size": 256347,
    "path": "../public/games/playstation-5/eiyuden-chronicle-hundred-heroes/index.html"
  },
  "/games/playstation-5/eiyuden-chronicle-hundred-heroes/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"278-gQAzemDFsJ+CM1aG9MlVTPn1kSQ\"",
    "mtime": "2026-01-08T05:39:10.874Z",
    "size": 632,
    "path": "../public/games/playstation-5/eiyuden-chronicle-hundred-heroes/_payload.json"
  },
  "/games/playstation-5/elden-ring/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8d5-8p56xHLbDOchScESbrbxK/GJYAo\"",
    "mtime": "2026-01-08T05:39:06.386Z",
    "size": 256213,
    "path": "../public/games/playstation-5/elden-ring/index.html"
  },
  "/games/playstation-5/elden-ring/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"27c-7FxIbTzWaJCJZHQpwsQvNBLvOes\"",
    "mtime": "2026-01-08T05:39:10.893Z",
    "size": 636,
    "path": "../public/games/playstation-5/elden-ring/_payload.json"
  },
  "/games/playstation-5/final-fantasy-vii-remake-intergrade/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e96d-6W7gCwecqgzKVAI2QRiy4Kq7JfU\"",
    "mtime": "2026-01-08T05:39:06.630Z",
    "size": 256365,
    "path": "../public/games/playstation-5/final-fantasy-vii-remake-intergrade/index.html"
  },
  "/games/playstation-5/final-fantasy-vii-remake-intergrade/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"296-t8CEH/TjxqMZq+C9LjVWEL6NjMU\"",
    "mtime": "2026-01-08T05:39:10.946Z",
    "size": 662,
    "path": "../public/games/playstation-5/final-fantasy-vii-remake-intergrade/_payload.json"
  },
  "/games/playstation-5/ghost-of-tsushima-directors-cut/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e95c-VYpKI+tB5Y8/CZb5cJ+iMpskLmU\"",
    "mtime": "2026-01-08T05:39:06.792Z",
    "size": 256348,
    "path": "../public/games/playstation-5/ghost-of-tsushima-directors-cut/index.html"
  },
  "/games/playstation-5/ghost-of-tsushima-directors-cut/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"294-Bu5LFcgplVy+HPEWigkTG+G0ZSA\"",
    "mtime": "2026-01-08T05:39:11.009Z",
    "size": 660,
    "path": "../public/games/playstation-5/ghost-of-tsushima-directors-cut/_payload.json"
  },
  "/games/playstation-5/inscryption/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8db-oMR/zpvAIWoSYotfVXd2KYweMr4\"",
    "mtime": "2026-01-08T05:39:07.236Z",
    "size": 256219,
    "path": "../public/games/playstation-5/inscryption/index.html"
  },
  "/games/playstation-5/inscryption/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"27d-z6xOjp7LPy+RrzomI6G8mDpdLTo\"",
    "mtime": "2026-01-08T05:39:11.100Z",
    "size": 637,
    "path": "../public/games/playstation-5/inscryption/_payload.json"
  },
  "/games/playstation-5/nioh-collection/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e901-QKT9k2Zd9mE3D5peHq0GKsgU/3I\"",
    "mtime": "2026-01-08T05:39:08.107Z",
    "size": 256257,
    "path": "../public/games/playstation-5/nioh-collection/index.html"
  },
  "/games/playstation-5/nioh-collection/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"28f-jIxThfVQdNdrVmhBpF0Q2ihjk80\"",
    "mtime": "2026-01-08T05:39:11.351Z",
    "size": 655,
    "path": "../public/games/playstation-5/nioh-collection/_payload.json"
  },
  "/games/playstation-5/returnal/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8ef-EKcqF7Wf4UC7Z01WYS9j+UnEfXE\"",
    "mtime": "2026-01-08T05:39:09.039Z",
    "size": 256239,
    "path": "../public/games/playstation-5/returnal/index.html"
  },
  "/games/playstation-5/returnal/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"27f-9+Qb9VnyXUXHRm/jTy79Zv0x2tY\"",
    "mtime": "2026-01-08T05:39:11.536Z",
    "size": 639,
    "path": "../public/games/playstation-5/returnal/_payload.json"
  },
  "/games/playstation-5/the-binding-of-isaac-repentance/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8c6-pNv7YJ9MONgPiCWR7pcYRpB+BYo\"",
    "mtime": "2026-01-08T05:39:09.977Z",
    "size": 256198,
    "path": "../public/games/playstation-5/the-binding-of-isaac-repentance/index.html"
  },
  "/games/playstation-5/the-binding-of-isaac-repentance/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"27b-L3oxakaOweNUE5cbP9vJpRrSq+M\"",
    "mtime": "2026-01-08T05:39:11.799Z",
    "size": 635,
    "path": "../public/games/playstation-5/the-binding-of-isaac-repentance/_payload.json"
  },
  "/games/playstation-5/the-quarry/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3ea93-qopN7LWTpG4Z5NW9wk6zgPBQ5VI\"",
    "mtime": "2026-01-08T05:39:03.935Z",
    "size": 256659,
    "path": "../public/games/playstation-5/the-quarry/index.html"
  },
  "/games/playstation-5/the-quarry/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"3b2-xz+xH10SfdDYeJvjwcn8FXXFK5w\"",
    "mtime": "2026-01-08T05:39:10.373Z",
    "size": 946,
    "path": "../public/games/playstation-5/the-quarry/_payload.json"
  },
  "/games/playstation-5/tony-hawks-pro-skater-1-2-ps5/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e94e-wK+TKUGMCgC3k38011SFfGW7xVE\"",
    "mtime": "2026-01-08T05:39:10.028Z",
    "size": 256334,
    "path": "../public/games/playstation-5/tony-hawks-pro-skater-1-2-ps5/index.html"
  },
  "/games/playstation-5/tony-hawks-pro-skater-1-2-ps5/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"28e-5Ek/lphqjfGUGjfsIXXgW073KxM\"",
    "mtime": "2026-01-08T05:39:11.820Z",
    "size": 654,
    "path": "../public/games/playstation-5/tony-hawks-pro-skater-1-2-ps5/_payload.json"
  },
  "/games/playstation-portable/3rd-birthday-the/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e89e-UIsMFKILZtTmzgduIVkUMtyTkwk\"",
    "mtime": "2026-01-08T05:39:05.075Z",
    "size": 256158,
    "path": "../public/games/playstation-portable/3rd-birthday-the/index.html"
  },
  "/games/playstation-portable/3rd-birthday-the/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"274-z+O6a/COKNHuuaXXRTbl6TRhiqg\"",
    "mtime": "2026-01-08T05:39:10.600Z",
    "size": 628,
    "path": "../public/games/playstation-portable/3rd-birthday-the/_payload.json"
  },
  "/games/playstation-portable/disgaea-2-dark-hero-days/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8cd-RhBQzF3zzfqDWyMYGF4sWyNak/8\"",
    "mtime": "2026-01-08T05:39:05.923Z",
    "size": 256205,
    "path": "../public/games/playstation-portable/disgaea-2-dark-hero-days/index.html"
  },
  "/games/playstation-portable/disgaea-2-dark-hero-days/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"27c-IxKe68wFKhmoAH1uLk+cXQ7mLEo\"",
    "mtime": "2026-01-08T05:39:10.800Z",
    "size": 636,
    "path": "../public/games/playstation-portable/disgaea-2-dark-hero-days/_payload.json"
  },
  "/games/playstation-portable/dissidia-012-duodecim-final-fantasy/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e909-IyfJFQ4LK6QQ2THd7+rsTu5Vjlw\"",
    "mtime": "2026-01-08T05:39:05.996Z",
    "size": 256265,
    "path": "../public/games/playstation-portable/dissidia-012-duodecim-final-fantasy/index.html"
  },
  "/games/playstation-portable/dissidia-012-duodecim-final-fantasy/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"284-6HS9CWEZy8dY2Qt91jjKPcMLFQc\"",
    "mtime": "2026-01-08T05:39:10.816Z",
    "size": 644,
    "path": "../public/games/playstation-portable/dissidia-012-duodecim-final-fantasy/_payload.json"
  },
  "/games/playstation-portable/dissidia-final-fantasy/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8bb-aS+nTa5+0OYWBUQbOHwgYsL/h3E\"",
    "mtime": "2026-01-08T05:39:05.995Z",
    "size": 256187,
    "path": "../public/games/playstation-portable/dissidia-final-fantasy/index.html"
  },
  "/games/playstation-portable/dissidia-final-fantasy/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"277-W5b3nViuCkVQiSunlfTFgxYy5FA\"",
    "mtime": "2026-01-08T05:39:10.816Z",
    "size": 631,
    "path": "../public/games/playstation-portable/dissidia-final-fantasy/_payload.json"
  },
  "/games/playstation-portable/final-fantasy-ii/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e89d-Uw9P5CZiVhhkwBpVL4czmE41IwU\"",
    "mtime": "2026-01-08T05:39:06.552Z",
    "size": 256157,
    "path": "../public/games/playstation-portable/final-fantasy-ii/index.html"
  },
  "/games/playstation-portable/final-fantasy-ii/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"274-0O42Q5VMk+QZl3V7MFoxQi80t9g\"",
    "mtime": "2026-01-08T05:39:10.913Z",
    "size": 628,
    "path": "../public/games/playstation-portable/final-fantasy-ii/_payload.json"
  },
  "/games/playstation-portable/final-fantasy-iv-the-complete-collection/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e9cd-d/urszkixCiRuyW4xyf1xN1RFP8\"",
    "mtime": "2026-01-08T05:39:06.590Z",
    "size": 256461,
    "path": "../public/games/playstation-portable/final-fantasy-iv-the-complete-collection/index.html"
  },
  "/games/playstation-portable/final-fantasy-iv-the-complete-collection/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"2b3-f4W2SYauHonpzxaaX6n/I2kcsug\"",
    "mtime": "2026-01-08T05:39:10.930Z",
    "size": 691,
    "path": "../public/games/playstation-portable/final-fantasy-iv-the-complete-collection/_payload.json"
  },
  "/games/playstation-portable/final-fantasy-psp/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e88f-oOsDnif49qa2tB52QXs2b3KqTi0\"",
    "mtime": "2026-01-08T05:39:06.418Z",
    "size": 256143,
    "path": "../public/games/playstation-portable/final-fantasy-psp/index.html"
  },
  "/games/playstation-portable/final-fantasy-psp/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"26d-a10aB0tzhevXOKeD4GEzMypwKEw\"",
    "mtime": "2026-01-08T05:39:10.893Z",
    "size": 621,
    "path": "../public/games/playstation-portable/final-fantasy-psp/_payload.json"
  },
  "/games/playstation-portable/final-fantasy-tactics-the-war-of-the-lions/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e939-XkNEINCJEugEsH4MeW5YLMGT3n4\"",
    "mtime": "2026-01-08T05:39:06.610Z",
    "size": 256313,
    "path": "../public/games/playstation-portable/final-fantasy-tactics-the-war-of-the-lions/index.html"
  },
  "/games/playstation-portable/final-fantasy-tactics-the-war-of-the-lions/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"28e-D1TCUx3mxEMj8rIUYeTdJJOjgcc\"",
    "mtime": "2026-01-08T05:39:10.946Z",
    "size": 654,
    "path": "../public/games/playstation-portable/final-fantasy-tactics-the-war-of-the-lions/_payload.json"
  },
  "/games/playstation-portable/final-fantasy-vii-crisis-core/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e97c-N/AZPlflqk+dUDRL9MmKSMigS9A\"",
    "mtime": "2026-01-08T05:39:06.630Z",
    "size": 256380,
    "path": "../public/games/playstation-portable/final-fantasy-vii-crisis-core/index.html"
  },
  "/games/playstation-portable/final-fantasy-vii-crisis-core/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"29a-reopV98BB0BnRidxnuEX+XqQdRM\"",
    "mtime": "2026-01-08T05:39:10.969Z",
    "size": 666,
    "path": "../public/games/playstation-portable/final-fantasy-vii-crisis-core/_payload.json"
  },
  "/games/playstation-portable/jeanne-darc/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e887-TkPml8qecCRNbYqRcJFCf6+ZKeE\"",
    "mtime": "2026-01-08T05:39:07.237Z",
    "size": 256135,
    "path": "../public/games/playstation-portable/jeanne-darc/index.html"
  },
  "/games/playstation-portable/jeanne-darc/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"26c-aXKWEhhq68KGj8tWsP9EAWx2mVs\"",
    "mtime": "2026-01-08T05:39:11.116Z",
    "size": 620,
    "path": "../public/games/playstation-portable/jeanne-darc/_payload.json"
  },
  "/games/playstation-portable/metal-gear-acid/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e895-9Wpc4BQ8+IGM+p+I4KklGSnMYlw\"",
    "mtime": "2026-01-08T05:39:07.910Z",
    "size": 256149,
    "path": "../public/games/playstation-portable/metal-gear-acid/index.html"
  },
  "/games/playstation-portable/metal-gear-acid/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"272-2MmgCXzcUeYsUp/b4OMRisG7HdU\"",
    "mtime": "2026-01-08T05:39:11.257Z",
    "size": 626,
    "path": "../public/games/playstation-portable/metal-gear-acid/_payload.json"
  },
  "/games/playstation-portable/metal-gear-solid-portable-ops/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8eb-6HWDO/BdAq/Qxc/Qr6dO9qHVdEs\"",
    "mtime": "2026-01-08T05:39:07.910Z",
    "size": 256235,
    "path": "../public/games/playstation-portable/metal-gear-solid-portable-ops/index.html"
  },
  "/games/playstation-portable/metal-gear-solid-portable-ops/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"281-6VJ74YHDfHRMJpVlVNkmOrpoE+4\"",
    "mtime": "2026-01-08T05:39:11.297Z",
    "size": 641,
    "path": "../public/games/playstation-portable/metal-gear-solid-portable-ops/_payload.json"
  },
  "/games/playstation-portable/metal-gear-solid-peace-walker/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8e5-j2hqZlbGxKZnGc8hhoKWLuyjSDY\"",
    "mtime": "2026-01-08T05:39:07.910Z",
    "size": 256229,
    "path": "../public/games/playstation-portable/metal-gear-solid-peace-walker/index.html"
  },
  "/games/playstation-portable/metal-gear-solid-peace-walker/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"27e-QqGDbBRkAelDbI1X7A2UE0g4odo\"",
    "mtime": "2026-01-08T05:39:11.276Z",
    "size": 638,
    "path": "../public/games/playstation-portable/metal-gear-solid-peace-walker/_payload.json"
  },
  "/games/playstation-portable/valkyrie-profile-lenneth/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8cd-1/rXDYuT+u09nPtZJHg4L0RJXb4\"",
    "mtime": "2026-01-08T05:39:10.209Z",
    "size": 256205,
    "path": "../public/games/playstation-portable/valkyrie-profile-lenneth/index.html"
  },
  "/games/playstation-portable/valkyrie-profile-lenneth/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"27c-HRV0DwGv18cnwh+Sxe54sRS1Jlo\"",
    "mtime": "2026-01-08T05:39:11.836Z",
    "size": 636,
    "path": "../public/games/playstation-portable/valkyrie-profile-lenneth/_payload.json"
  },
  "/games/playstation-portable/ys-i-and-ii-chronicles/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8c7-iJDtGegqteslcLv/0OGIGPsr+28\"",
    "mtime": "2026-01-08T05:39:10.310Z",
    "size": 256199,
    "path": "../public/games/playstation-portable/ys-i-and-ii-chronicles/index.html"
  },
  "/games/playstation-portable/ys-i-and-ii-chronicles/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"278-dRGhjH21TTkhjpgHnIwpBjdeO6g\"",
    "mtime": "2026-01-08T05:39:11.866Z",
    "size": 632,
    "path": "../public/games/playstation-portable/ys-i-and-ii-chronicles/_payload.json"
  },
  "/games/playstation-portable/ys-seven/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e867-V3Xs58R6gMQtJA9AmVsOIbbktwU\"",
    "mtime": "2026-01-08T05:39:10.320Z",
    "size": 256103,
    "path": "../public/games/playstation-portable/ys-seven/index.html"
  },
  "/games/playstation-portable/ys-seven/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"269-NSeWOvmctVJDKMayd3prXBKDxys\"",
    "mtime": "2026-01-08T05:39:11.869Z",
    "size": 617,
    "path": "../public/games/playstation-portable/ys-seven/_payload.json"
  },
  "/games/playstation-portable/ys-the-oath-in-felghana/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8c1-0KmYwiU0nCx1LT5s115kG4uNn/0\"",
    "mtime": "2026-01-08T05:39:10.325Z",
    "size": 256193,
    "path": "../public/games/playstation-portable/ys-the-oath-in-felghana/index.html"
  },
  "/games/playstation-portable/ys-the-oath-in-felghana/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"278-vFDyvjqQCfrTwILvG5dz1/bnH3s\"",
    "mtime": "2026-01-08T05:39:11.869Z",
    "size": 632,
    "path": "../public/games/playstation-portable/ys-the-oath-in-felghana/_payload.json"
  },
  "/games/playstation-vita/army-corps-of-hell/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e885-VsNsteVJn/xJ3Ymli6qqnzwuxE0\"",
    "mtime": "2026-01-08T05:39:05.124Z",
    "size": 256133,
    "path": "../public/games/playstation-vita/army-corps-of-hell/index.html"
  },
  "/games/playstation-vita/army-corps-of-hell/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"26a-ApDYnfqKi7zy1RrlVauEDKgdwTs\"",
    "mtime": "2026-01-08T05:39:10.624Z",
    "size": 618,
    "path": "../public/games/playstation-vita/army-corps-of-hell/_payload.json"
  },
  "/games/playstation-vita/god-of-war-collection/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e897-qU+l3mZ1hKU0Ct8izr/34dhZR8Y\"",
    "mtime": "2026-01-08T05:39:06.928Z",
    "size": 256151,
    "path": "../public/games/playstation-vita/god-of-war-collection/index.html"
  },
  "/games/playstation-vita/god-of-war-collection/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"26d-I5OslBLY+o+4VJkVAI3PAQrI8z4\"",
    "mtime": "2026-01-08T05:39:11.027Z",
    "size": 621,
    "path": "../public/games/playstation-vita/god-of-war-collection/_payload.json"
  },
  "/games/playstation-vita/metal-gear-solid-hd-collection/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8cd-3gMzxEODeEuB7YPp5XLGarZawKQ\"",
    "mtime": "2026-01-08T05:39:07.910Z",
    "size": 256205,
    "path": "../public/games/playstation-vita/metal-gear-solid-hd-collection/index.html"
  },
  "/games/playstation-vita/metal-gear-solid-hd-collection/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"276-YMgdw2DGXKVzLta1/ztjaX9nMpU\"",
    "mtime": "2026-01-08T05:39:11.276Z",
    "size": 630,
    "path": "../public/games/playstation-vita/metal-gear-solid-hd-collection/_payload.json"
  },
  "/games/playstation-vita/soul-sacrifice/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e903-/oBn5zMFesXcTzbfFhktTf41SZQ\"",
    "mtime": "2026-01-08T05:39:09.259Z",
    "size": 256259,
    "path": "../public/games/playstation-vita/soul-sacrifice/index.html"
  },
  "/games/playstation-vita/soul-sacrifice/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"287-6/gMUNGid1kkLADVmVET29Fwfnc\"",
    "mtime": "2026-01-08T05:39:11.651Z",
    "size": 647,
    "path": "../public/games/playstation-vita/soul-sacrifice/_payload.json"
  },
  "/games/playstation-vita/ys-origin-vita/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e85e-6LlZKGj1P/Tf10lBP24O/fA88R4\"",
    "mtime": "2026-01-08T05:39:10.309Z",
    "size": 256094,
    "path": "../public/games/playstation-vita/ys-origin-vita/index.html"
  },
  "/games/playstation-vita/ys-origin-vita/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"261-XQSQnxOUvlaQRCX+e53PHmYlSXc\"",
    "mtime": "2026-01-08T05:39:11.866Z",
    "size": 609,
    "path": "../public/games/playstation-vita/ys-origin-vita/_payload.json"
  },
  "/games/playstation-vita/ys-memories-of-celceta/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8a7-XDV7YsScBL7GV2WADy49yXZDhXo\"",
    "mtime": "2026-01-08T05:39:10.310Z",
    "size": 256167,
    "path": "../public/games/playstation-vita/ys-memories-of-celceta/index.html"
  },
  "/games/playstation-vita/ys-memories-of-celceta/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"273-EgpaimE/Q9phEty8CQe/0rBNefE\"",
    "mtime": "2026-01-08T05:39:11.869Z",
    "size": 627,
    "path": "../public/games/playstation-vita/ys-memories-of-celceta/_payload.json"
  },
  "/games/sega-genesis/contra-hard-corps/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e86b-CIhyf15tOx/LDvq6kghpYX1BHMY\"",
    "mtime": "2026-01-08T05:39:04.806Z",
    "size": 256107,
    "path": "../public/games/sega-genesis/contra-hard-corps/index.html"
  },
  "/games/sega-genesis/contra-hard-corps/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"265-fN9HBawhnj9mdb9A/7A4t7ElOs8\"",
    "mtime": "2026-01-08T05:39:10.476Z",
    "size": 613,
    "path": "../public/games/sega-genesis/contra-hard-corps/_payload.json"
  },
  "/games/sega-genesis/diamond-thieves/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e85d-yQDiYEZ/dlfuGfUF/YTLJlBrD6Q\"",
    "mtime": "2026-01-08T05:39:04.835Z",
    "size": 256093,
    "path": "../public/games/sega-genesis/diamond-thieves/index.html"
  },
  "/games/sega-genesis/diamond-thieves/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"24c-U2sBwWcXyf6TDp0E3TN+JjKl1eg\"",
    "mtime": "2026-01-08T05:39:10.506Z",
    "size": 588,
    "path": "../public/games/sega-genesis/diamond-thieves/_payload.json"
  },
  "/games/sega-genesis/gunstar-heroes/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e851-jmoxsENhv3lVrzSFvYaG4Y4bCdQ\"",
    "mtime": "2026-01-08T05:39:04.836Z",
    "size": 256081,
    "path": "../public/games/sega-genesis/gunstar-heroes/index.html"
  },
  "/games/sega-genesis/gunstar-heroes/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25e-U6I23LdNR3J8f1RV0ZuQXwOe6Ak\"",
    "mtime": "2026-01-08T05:39:10.505Z",
    "size": 606,
    "path": "../public/games/sega-genesis/gunstar-heroes/_payload.json"
  },
  "/games/sega-genesis/handy-harvy/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e845-tI+ZNoVH/VmecJasF6F5zGvNUA8\"",
    "mtime": "2026-01-08T05:39:04.845Z",
    "size": 256069,
    "path": "../public/games/sega-genesis/handy-harvy/index.html"
  },
  "/games/sega-genesis/handy-harvy/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25e-P2+DgHXN4ZudhdP48V+Y0Oy++bo\"",
    "mtime": "2026-01-08T05:39:10.506Z",
    "size": 606,
    "path": "../public/games/sega-genesis/handy-harvy/_payload.json"
  },
  "/games/sega-genesis/revenge-of-shinobi-the/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e88c-CghKik5c6F4gBIYN/IUuePC3Igo\"",
    "mtime": "2026-01-08T05:39:04.835Z",
    "size": 256140,
    "path": "../public/games/sega-genesis/revenge-of-shinobi-the/index.html"
  },
  "/games/sega-genesis/revenge-of-shinobi-the/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"26b-r3qRHCqCwxCB5I3smvwawLXSi4A\"",
    "mtime": "2026-01-08T05:39:10.505Z",
    "size": 619,
    "path": "../public/games/sega-genesis/revenge-of-shinobi-the/_payload.json"
  },
  "/games/sega-genesis/rocket-knight-adventures/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e88d-ZQ/ygbUzl4ZTn2FGn9nuV8xWaQk\"",
    "mtime": "2026-01-08T05:39:04.835Z",
    "size": 256141,
    "path": "../public/games/sega-genesis/rocket-knight-adventures/index.html"
  },
  "/games/sega-genesis/rocket-knight-adventures/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"268-lQe7f2Sta4azQ7qa4ke26bXQtqc\"",
    "mtime": "2026-01-08T05:39:10.505Z",
    "size": 616,
    "path": "../public/games/sega-genesis/rocket-knight-adventures/_payload.json"
  },
  "/games/sega-genesis/shinobi-iii-return-of-the-ninja-master/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8e9-jyCqwbPV7MS0qv35s67uxasLGJc\"",
    "mtime": "2026-01-08T05:39:04.859Z",
    "size": 256233,
    "path": "../public/games/sega-genesis/shinobi-iii-return-of-the-ninja-master/index.html"
  },
  "/games/sega-genesis/shinobi-iii-return-of-the-ninja-master/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"27a-Ha2UJhXJuyFqiAXkhdUMrDrifSs\"",
    "mtime": "2026-01-08T05:39:10.524Z",
    "size": 634,
    "path": "../public/games/sega-genesis/shinobi-iii-return-of-the-ninja-master/_payload.json"
  },
  "/games/super-nintendo-entertainment-system/aladdin/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e977-7njC0v07qey8rmwFseaZGIdziEk\"",
    "mtime": "2026-01-08T05:39:05.021Z",
    "size": 256375,
    "path": "../public/games/super-nintendo-entertainment-system/aladdin/index.html"
  },
  "/games/super-nintendo-entertainment-system/aladdin/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"2be-rF+yzr9GMUYu9OuxF8/KEwvrva8\"",
    "mtime": "2026-01-08T05:39:10.598Z",
    "size": 702,
    "path": "../public/games/super-nintendo-entertainment-system/aladdin/_payload.json"
  },
  "/games/super-nintendo-entertainment-system/axelay/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8c8-AFPG92W3U7e3mkxFYsYLfAlvwgw\"",
    "mtime": "2026-01-08T05:39:05.051Z",
    "size": 256200,
    "path": "../public/games/super-nintendo-entertainment-system/axelay/index.html"
  },
  "/games/super-nintendo-entertainment-system/axelay/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"28c-vH9rxQQqXHh5jnaDnpI3RNZ1rGA\"",
    "mtime": "2026-01-08T05:39:10.600Z",
    "size": 652,
    "path": "../public/games/super-nintendo-entertainment-system/axelay/_payload.json"
  },
  "/games/super-nintendo-entertainment-system/batman-forever/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8f2-dKJ67V5ZAaE3fB7MiM9bJbZ26Po\"",
    "mtime": "2026-01-08T05:39:05.092Z",
    "size": 256242,
    "path": "../public/games/super-nintendo-entertainment-system/batman-forever/index.html"
  },
  "/games/super-nintendo-entertainment-system/batman-forever/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"291-TB70nDz2CDMQ1vizcI08e6LJjE0\"",
    "mtime": "2026-01-08T05:39:10.624Z",
    "size": 657,
    "path": "../public/games/super-nintendo-entertainment-system/batman-forever/_payload.json"
  },
  "/games/super-nintendo-entertainment-system/batman-returns/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e9df-c0sFzhRXbwlsCl1n3ne6YLttNJE\"",
    "mtime": "2026-01-08T05:39:05.076Z",
    "size": 256479,
    "path": "../public/games/super-nintendo-entertainment-system/batman-returns/index.html"
  },
  "/games/super-nintendo-entertainment-system/batman-returns/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"2eb-JiaBJ2VHfA0fvKUpXPJF//o7RzY\"",
    "mtime": "2026-01-08T05:39:10.624Z",
    "size": 747,
    "path": "../public/games/super-nintendo-entertainment-system/batman-returns/_payload.json"
  },
  "/games/super-nintendo-entertainment-system/chrono-trigger/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"40533-5SO4ULXRetY3eTU4vdNDootYJSM\"",
    "mtime": "2026-01-08T05:39:05.593Z",
    "size": 263475,
    "path": "../public/games/super-nintendo-entertainment-system/chrono-trigger/index.html"
  },
  "/games/super-nintendo-entertainment-system/chrono-trigger/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"87e-ny694v19a86H+54naZPgkqGWneE\"",
    "mtime": "2026-01-08T05:39:10.740Z",
    "size": 2174,
    "path": "../public/games/super-nintendo-entertainment-system/chrono-trigger/_payload.json"
  },
  "/games/super-nintendo-entertainment-system/contra-iii-the-alien-wars/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"40611-Ku/dp55EkvpaI15n5AeqUK8Thsk\"",
    "mtime": "2026-01-08T05:39:05.657Z",
    "size": 263697,
    "path": "../public/games/super-nintendo-entertainment-system/contra-iii-the-alien-wars/index.html"
  },
  "/games/super-nintendo-entertainment-system/contra-iii-the-alien-wars/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"8a9-r8AckLYbKBbFJ4v+N+zYuwDEmZo\"",
    "mtime": "2026-01-08T05:39:10.740Z",
    "size": 2217,
    "path": "../public/games/super-nintendo-entertainment-system/contra-iii-the-alien-wars/_payload.json"
  },
  "/games/super-nintendo-entertainment-system/claymates/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8da-XkBkHt6gi5MHW2nf/Fvds8GRVwM\"",
    "mtime": "2026-01-08T05:39:05.519Z",
    "size": 256218,
    "path": "../public/games/super-nintendo-entertainment-system/claymates/index.html"
  },
  "/games/super-nintendo-entertainment-system/claymates/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"28f-gU+3WVtN9klhnCtpuz7FzYqB55M\"",
    "mtime": "2026-01-08T05:39:10.709Z",
    "size": 655,
    "path": "../public/games/super-nintendo-entertainment-system/claymates/_payload.json"
  },
  "/games/super-nintendo-entertainment-system/donkey-kong-country/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e910-OpLxqtTH7GOcznxS4TXNXGGiIXU\"",
    "mtime": "2026-01-08T05:39:06.032Z",
    "size": 256272,
    "path": "../public/games/super-nintendo-entertainment-system/donkey-kong-country/index.html"
  },
  "/games/super-nintendo-entertainment-system/donkey-kong-country/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"296-8sarkjym8pdRFcrNa06Wvx7cTVE\"",
    "mtime": "2026-01-08T05:39:10.816Z",
    "size": 662,
    "path": "../public/games/super-nintendo-entertainment-system/donkey-kong-country/_payload.json"
  },
  "/games/super-nintendo-entertainment-system/cool-world/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8e0-v9V2VXUTi0fCnfU98xCwgvAq7go\"",
    "mtime": "2026-01-08T05:39:05.541Z",
    "size": 256224,
    "path": "../public/games/super-nintendo-entertainment-system/cool-world/index.html"
  },
  "/games/super-nintendo-entertainment-system/cool-world/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"28f-apjdfzbJgRVe4sY+MckwSbS0NK4\"",
    "mtime": "2026-01-08T05:39:10.725Z",
    "size": 655,
    "path": "../public/games/super-nintendo-entertainment-system/cool-world/_payload.json"
  },
  "/games/super-nintendo-entertainment-system/donkey-kong-country-2-diddys-kong-quest/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e99a-iRK6HUI/mXcp2CnkFwNW99k5kFc\"",
    "mtime": "2026-01-08T05:39:06.042Z",
    "size": 256410,
    "path": "../public/games/super-nintendo-entertainment-system/donkey-kong-country-2-diddys-kong-quest/index.html"
  },
  "/games/super-nintendo-entertainment-system/donkey-kong-country-2-diddys-kong-quest/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"2ac-d6C4rWHpmUu9TUaPzCzkbyxCzyw\"",
    "mtime": "2026-01-08T05:39:10.816Z",
    "size": 684,
    "path": "../public/games/super-nintendo-entertainment-system/donkey-kong-country-2-diddys-kong-quest/_payload.json"
  },
  "/games/super-nintendo-entertainment-system/donkey-kong-country-3-dixie-kongs-double-trouble/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3ea64-oHHI8mFEzUjA293wog48xGUCai4\"",
    "mtime": "2026-01-08T05:39:06.042Z",
    "size": 256612,
    "path": "../public/games/super-nintendo-entertainment-system/donkey-kong-country-3-dixie-kongs-double-trouble/index.html"
  },
  "/games/super-nintendo-entertainment-system/donkey-kong-country-3-dixie-kongs-double-trouble/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"2cc-IbWoaEqCfqwJvED10xuaWrBcdcQ\"",
    "mtime": "2026-01-08T05:39:10.816Z",
    "size": 716,
    "path": "../public/games/super-nintendo-entertainment-system/donkey-kong-country-3-dixie-kongs-double-trouble/_payload.json"
  },
  "/games/super-nintendo-entertainment-system/earthworm-jim/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8ec-qwhCWcjU0VUq56gGWQ6kjtMTg90\"",
    "mtime": "2026-01-08T05:39:06.265Z",
    "size": 256236,
    "path": "../public/games/super-nintendo-entertainment-system/earthworm-jim/index.html"
  },
  "/games/super-nintendo-entertainment-system/earthworm-jim/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"296-69SPRNmalN/akLeP6v4mjZYz/8A\"",
    "mtime": "2026-01-08T05:39:10.851Z",
    "size": 662,
    "path": "../public/games/super-nintendo-entertainment-system/earthworm-jim/_payload.json"
  },
  "/games/super-nintendo-entertainment-system/earthworm-jim-2/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8f8-WhfcP5MZPq1K8XhY1LFJrmkxIQU\"",
    "mtime": "2026-01-08T05:39:06.291Z",
    "size": 256248,
    "path": "../public/games/super-nintendo-entertainment-system/earthworm-jim-2/index.html"
  },
  "/games/super-nintendo-entertainment-system/earthworm-jim-2/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"292-buTmeQqY6sO4iTjiwgXu0bu/EYM\"",
    "mtime": "2026-01-08T05:39:10.874Z",
    "size": 658,
    "path": "../public/games/super-nintendo-entertainment-system/earthworm-jim-2/_payload.json"
  },
  "/games/super-nintendo-entertainment-system/evo-search-for-eden/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"41101-r67TKhj1hwAdWmLwtuK5GP7y8j0\"",
    "mtime": "2026-01-08T05:39:06.385Z",
    "size": 266497,
    "path": "../public/games/super-nintendo-entertainment-system/evo-search-for-eden/index.html"
  },
  "/games/super-nintendo-entertainment-system/evo-search-for-eden/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"af9-rplXXKXMM8a14qchPTGNX5jd/oc\"",
    "mtime": "2026-01-08T05:39:10.874Z",
    "size": 2809,
    "path": "../public/games/super-nintendo-entertainment-system/evo-search-for-eden/_payload.json"
  },
  "/games/super-nintendo-entertainment-system/final-fantasy-iii/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"40545-I3ZSFC8yVSVw05Y5gVcSyCMbd1M\"",
    "mtime": "2026-01-08T05:39:06.630Z",
    "size": 263493,
    "path": "../public/games/super-nintendo-entertainment-system/final-fantasy-iii/index.html"
  },
  "/games/super-nintendo-entertainment-system/final-fantasy-iii/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"881-SfTyRfkZxlLSTmVSk0qfXn/WnpE\"",
    "mtime": "2026-01-08T05:39:10.946Z",
    "size": 2177,
    "path": "../public/games/super-nintendo-entertainment-system/final-fantasy-iii/_payload.json"
  },
  "/games/super-nintendo-entertainment-system/final-fantasy-ii-snes/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e915-oL/Ax/1H5gvqRv4cLEbdXDmqKK8\"",
    "mtime": "2026-01-08T05:39:06.552Z",
    "size": 256277,
    "path": "../public/games/super-nintendo-entertainment-system/final-fantasy-ii-snes/index.html"
  },
  "/games/super-nintendo-entertainment-system/final-fantasy-ii-snes/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"297-w85dDZzv8NWvLQNgr5/lI8eSAKU\"",
    "mtime": "2026-01-08T05:39:10.913Z",
    "size": 663,
    "path": "../public/games/super-nintendo-entertainment-system/final-fantasy-ii-snes/_payload.json"
  },
  "/games/super-nintendo-entertainment-system/final-fantasy-mystic-quest/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e940-v2kEULbrG569VIvpCIqzq8/V0iE\"",
    "mtime": "2026-01-08T05:39:06.590Z",
    "size": 256320,
    "path": "../public/games/super-nintendo-entertainment-system/final-fantasy-mystic-quest/index.html"
  },
  "/games/super-nintendo-entertainment-system/final-fantasy-mystic-quest/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"2a0-lgVtRwunpJ/0JguDnXuD7bNlzNU\"",
    "mtime": "2026-01-08T05:39:10.946Z",
    "size": 672,
    "path": "../public/games/super-nintendo-entertainment-system/final-fantasy-mystic-quest/_payload.json"
  },
  "/games/super-nintendo-entertainment-system/joe-and-mac/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3eb11-NfIMkPY+14j4mHuwek3t1KzJFIs\"",
    "mtime": "2026-01-08T05:39:03.935Z",
    "size": 256785,
    "path": "../public/games/super-nintendo-entertainment-system/joe-and-mac/index.html"
  },
  "/games/super-nintendo-entertainment-system/joe-and-mac/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"376-aIKr9t5g5HsHz1xcQkzk79ROpyk\"",
    "mtime": "2026-01-08T05:39:10.373Z",
    "size": 886,
    "path": "../public/games/super-nintendo-entertainment-system/joe-and-mac/_payload.json"
  },
  "/games/super-nintendo-entertainment-system/jungle-book-the/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8fb-DoMehaBraGnD3finHG+Y8Kf15T0\"",
    "mtime": "2026-01-08T05:39:07.237Z",
    "size": 256251,
    "path": "../public/games/super-nintendo-entertainment-system/jungle-book-the/index.html"
  },
  "/games/super-nintendo-entertainment-system/jungle-book-the/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"293-rWclZKcutVG2xPR9XM9XqkyqF0Q\"",
    "mtime": "2026-01-08T05:39:11.116Z",
    "size": 659,
    "path": "../public/games/super-nintendo-entertainment-system/jungle-book-the/_payload.json"
  },
  "/games/super-nintendo-entertainment-system/jurassic-park/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8f2-Iaw2P179EH6WR9mCvDCnzJDRkn8\"",
    "mtime": "2026-01-08T05:39:07.237Z",
    "size": 256242,
    "path": "../public/games/super-nintendo-entertainment-system/jurassic-park/index.html"
  },
  "/games/super-nintendo-entertainment-system/jurassic-park/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"293-8a0D4PsQpIQxm/IkkUcqLGq+qf4\"",
    "mtime": "2026-01-08T05:39:11.135Z",
    "size": 659,
    "path": "../public/games/super-nintendo-entertainment-system/jurassic-park/_payload.json"
  },
  "/games/super-nintendo-entertainment-system/kirby-super-star/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8fe-teA76pyPzCsRGqZKc9MvV76a7L0\"",
    "mtime": "2026-01-08T05:39:07.463Z",
    "size": 256254,
    "path": "../public/games/super-nintendo-entertainment-system/kirby-super-star/index.html"
  },
  "/games/super-nintendo-entertainment-system/kirby-super-star/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"293-NzkhBwzjvgqnMBkdcahDyk+czgw\"",
    "mtime": "2026-01-08T05:39:11.154Z",
    "size": 659,
    "path": "../public/games/super-nintendo-entertainment-system/kirby-super-star/_payload.json"
  },
  "/games/super-nintendo-entertainment-system/legend-of-zelda-a-link-to-the-past/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3ea29-nsvhzjzZhq6ImlKr8UaR5aEogrY\"",
    "mtime": "2026-01-08T05:39:07.482Z",
    "size": 256553,
    "path": "../public/games/super-nintendo-entertainment-system/legend-of-zelda-a-link-to-the-past/index.html"
  },
  "/games/super-nintendo-entertainment-system/legend-of-zelda-a-link-to-the-past/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"2dd-UrTi0n5+7SXwjNoJHFmt2wg8edE\"",
    "mtime": "2026-01-08T05:39:11.179Z",
    "size": 733,
    "path": "../public/games/super-nintendo-entertainment-system/legend-of-zelda-a-link-to-the-past/_payload.json"
  },
  "/games/super-nintendo-entertainment-system/lion-king/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8e3-ODMpJ/F3OE1W5AUBhcRXO+Y7MMA\"",
    "mtime": "2026-01-08T05:39:07.629Z",
    "size": 256227,
    "path": "../public/games/super-nintendo-entertainment-system/lion-king/index.html"
  },
  "/games/super-nintendo-entertainment-system/lion-king/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"291-BQ4F33rYns2WOhkHZ4kH7ihd+go\"",
    "mtime": "2026-01-08T05:39:11.219Z",
    "size": 657,
    "path": "../public/games/super-nintendo-entertainment-system/lion-king/_payload.json"
  },
  "/games/super-nintendo-entertainment-system/mortal-kombat/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8ec-YxzjBjXAxVSMEDLro3vwPMS/6gI\"",
    "mtime": "2026-01-08T05:39:08.098Z",
    "size": 256236,
    "path": "../public/games/super-nintendo-entertainment-system/mortal-kombat/index.html"
  },
  "/games/super-nintendo-entertainment-system/mortal-kombat/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"28f-tVr1089ebIOXKAySWEv+2wDoRKs\"",
    "mtime": "2026-01-08T05:39:11.314Z",
    "size": 655,
    "path": "../public/games/super-nintendo-entertainment-system/mortal-kombat/_payload.json"
  },
  "/games/super-nintendo-entertainment-system/mortal-kombat-3/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8f8-J9k0YmHp6nzM3a+ElecRzDXH58o\"",
    "mtime": "2026-01-08T05:39:08.068Z",
    "size": 256248,
    "path": "../public/games/super-nintendo-entertainment-system/mortal-kombat-3/index.html"
  },
  "/games/super-nintendo-entertainment-system/mortal-kombat-3/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"292-uusXYmg0lECOdSHrXFam5cee6zQ\"",
    "mtime": "2026-01-08T05:39:11.314Z",
    "size": 658,
    "path": "../public/games/super-nintendo-entertainment-system/mortal-kombat-3/_payload.json"
  },
  "/games/super-nintendo-entertainment-system/nba-hang-time/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8f2-PMLvWQaWPnlFm7yLylMkoDduGu8\"",
    "mtime": "2026-01-08T05:39:08.107Z",
    "size": 256242,
    "path": "../public/games/super-nintendo-entertainment-system/nba-hang-time/index.html"
  },
  "/games/super-nintendo-entertainment-system/nba-hang-time/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"299-W6yINbyBWNDknECmCWLztnC7sOQ\"",
    "mtime": "2026-01-08T05:39:11.330Z",
    "size": 665,
    "path": "../public/games/super-nintendo-entertainment-system/nba-hang-time/_payload.json"
  },
  "/games/super-nintendo-entertainment-system/mortal-kombat-ii/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8fe-07mwpdrusFubuvwT6IttXmbZRTg\"",
    "mtime": "2026-01-08T05:39:08.068Z",
    "size": 256254,
    "path": "../public/games/super-nintendo-entertainment-system/mortal-kombat-ii/index.html"
  },
  "/games/super-nintendo-entertainment-system/mortal-kombat-ii/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"292-6BPReVT9LMkzawCCNUjT28p2wlE\"",
    "mtime": "2026-01-08T05:39:11.314Z",
    "size": 658,
    "path": "../public/games/super-nintendo-entertainment-system/mortal-kombat-ii/_payload.json"
  },
  "/games/super-nintendo-entertainment-system/parodius-da/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8e3-9ixFY9om+Wb49vhp+ncud/IxDv8\"",
    "mtime": "2026-01-08T05:39:08.345Z",
    "size": 256227,
    "path": "../public/games/super-nintendo-entertainment-system/parodius-da/index.html"
  },
  "/games/super-nintendo-entertainment-system/parodius-da/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"28f-zrbUPsgJ73QIFCKJHzv+Fv3g/ho\"",
    "mtime": "2026-01-08T05:39:11.374Z",
    "size": 655,
    "path": "../public/games/super-nintendo-entertainment-system/parodius-da/_payload.json"
  },
  "/games/super-nintendo-entertainment-system/simpsons-barts-nightmare/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e955-0Z6JOmHWdAlYD4Yd3/nc2WgWyqw\"",
    "mtime": "2026-01-08T05:39:09.258Z",
    "size": 256341,
    "path": "../public/games/super-nintendo-entertainment-system/simpsons-barts-nightmare/index.html"
  },
  "/games/super-nintendo-entertainment-system/simpsons-barts-nightmare/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"2a4-6W85RlyPav9VrRzMYNQ31zCuvaQ\"",
    "mtime": "2026-01-08T05:39:11.650Z",
    "size": 676,
    "path": "../public/games/super-nintendo-entertainment-system/simpsons-barts-nightmare/_payload.json"
  },
  "/games/super-nintendo-entertainment-system/space-megaforce/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8fe-btWimIuZM4TcneUV3Qb2eqzmp88\"",
    "mtime": "2026-01-08T05:39:09.760Z",
    "size": 256254,
    "path": "../public/games/super-nintendo-entertainment-system/space-megaforce/index.html"
  },
  "/games/super-nintendo-entertainment-system/space-megaforce/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"29b-AKYmALpPGaRAx70xZZWNuar44+A\"",
    "mtime": "2026-01-08T05:39:11.725Z",
    "size": 667,
    "path": "../public/games/super-nintendo-entertainment-system/space-megaforce/_payload.json"
  },
  "/games/super-nintendo-entertainment-system/street-fighter-ii-turbo/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e928-pkvrc9JGGhnFTgAUaM3hlwU+ycU\"",
    "mtime": "2026-01-08T05:39:09.548Z",
    "size": 256296,
    "path": "../public/games/super-nintendo-entertainment-system/street-fighter-ii-turbo/index.html"
  },
  "/games/super-nintendo-entertainment-system/street-fighter-ii-turbo/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"29a-ktetqEAKk8Amb2zOasJ5fP6SXQU\"",
    "mtime": "2026-01-08T05:39:11.707Z",
    "size": 666,
    "path": "../public/games/super-nintendo-entertainment-system/street-fighter-ii-turbo/_payload.json"
  },
  "/games/super-nintendo-entertainment-system/star-fox/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8ce-iESevK8TAloijPBXEZJWoBhXMwQ\"",
    "mtime": "2026-01-08T05:39:09.478Z",
    "size": 256206,
    "path": "../public/games/super-nintendo-entertainment-system/star-fox/index.html"
  },
  "/games/super-nintendo-entertainment-system/star-fox/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"28a-nwRkJ+KgcQxICpcTEMJGGftmBdk\"",
    "mtime": "2026-01-08T05:39:11.707Z",
    "size": 650,
    "path": "../public/games/super-nintendo-entertainment-system/star-fox/_payload.json"
  },
  "/games/super-nintendo-entertainment-system/spankys-quest/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e902-gpyNYjNQgaLBtHVH0v2+QtrMtPY\"",
    "mtime": "2026-01-08T05:39:09.477Z",
    "size": 256258,
    "path": "../public/games/super-nintendo-entertainment-system/spankys-quest/index.html"
  },
  "/games/super-nintendo-entertainment-system/spankys-quest/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"294-/CGeGTDrS+D2pjRUYlQ6edI+6tg\"",
    "mtime": "2026-01-08T05:39:11.689Z",
    "size": 660,
    "path": "../public/games/super-nintendo-entertainment-system/spankys-quest/_payload.json"
  },
  "/games/super-nintendo-entertainment-system/super-castlevania-iv/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e916-rNig4TKBb9LSCl1tqUZ55DiJYAY\"",
    "mtime": "2026-01-08T05:39:09.549Z",
    "size": 256278,
    "path": "../public/games/super-nintendo-entertainment-system/super-castlevania-iv/index.html"
  },
  "/games/super-nintendo-entertainment-system/super-castlevania-iv/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"297-utA1fiC/qJni9oUWF5ENq+mQeLA\"",
    "mtime": "2026-01-08T05:39:11.707Z",
    "size": 663,
    "path": "../public/games/super-nintendo-entertainment-system/super-castlevania-iv/_payload.json"
  },
  "/games/super-nintendo-entertainment-system/super-mario-all-stars/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e9b0-uX4Kk5M2vhQumw/f1KGrOoiA4zA\"",
    "mtime": "2026-01-08T05:39:09.761Z",
    "size": 256432,
    "path": "../public/games/super-nintendo-entertainment-system/super-mario-all-stars/index.html"
  },
  "/games/super-nintendo-entertainment-system/super-mario-all-stars/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"2b1-aMYeFmRNN/hbirXEu2Yfdz8NZaU\"",
    "mtime": "2026-01-08T05:39:11.725Z",
    "size": 689,
    "path": "../public/games/super-nintendo-entertainment-system/super-mario-all-stars/_payload.json"
  },
  "/games/super-nintendo-entertainment-system/super-mario-kart/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8fe-N7WrPZffF0hyBm/1U8KUmOEu3NM\"",
    "mtime": "2026-01-08T05:39:09.761Z",
    "size": 256254,
    "path": "../public/games/super-nintendo-entertainment-system/super-mario-kart/index.html"
  },
  "/games/super-nintendo-entertainment-system/super-mario-kart/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"293-1mfrDtpmY5rKlpIy8ztrrNYOYdg\"",
    "mtime": "2026-01-08T05:39:11.742Z",
    "size": 659,
    "path": "../public/games/super-nintendo-entertainment-system/super-mario-kart/_payload.json"
  },
  "/games/super-nintendo-entertainment-system/super-mario-rpg/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8f8-OkkdberBulVifSsT8DeY7N/j+tY\"",
    "mtime": "2026-01-08T05:39:09.761Z",
    "size": 256248,
    "path": "../public/games/super-nintendo-entertainment-system/super-mario-rpg/index.html"
  },
  "/games/super-nintendo-entertainment-system/super-mario-rpg/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"292-zfcZCTW6jbBKYymv997AzJ+REcQ\"",
    "mtime": "2026-01-08T05:39:11.758Z",
    "size": 658,
    "path": "../public/games/super-nintendo-entertainment-system/super-mario-rpg/_payload.json"
  },
  "/games/super-nintendo-entertainment-system/super-mario-world/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3efa2-gpG1NsHTydWOF3IQ/unHU1KL5p0\"",
    "mtime": "2026-01-08T05:39:09.761Z",
    "size": 257954,
    "path": "../public/games/super-nintendo-entertainment-system/super-mario-world/index.html"
  },
  "/games/super-nintendo-entertainment-system/super-mario-world/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"3d9-dSxktrcOrxENPAYPNJAXOOLdXLg\"",
    "mtime": "2026-01-08T05:39:11.742Z",
    "size": 985,
    "path": "../public/games/super-nintendo-entertainment-system/super-mario-world/_payload.json"
  },
  "/games/super-nintendo-entertainment-system/super-ninja-boy/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8fe-2O5YcAMZ+lFVM8ugsQqRIUbrWww\"",
    "mtime": "2026-01-08T05:39:09.761Z",
    "size": 256254,
    "path": "../public/games/super-nintendo-entertainment-system/super-ninja-boy/index.html"
  },
  "/games/super-nintendo-entertainment-system/super-ninja-boy/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"27e-YkmsWStZEvSAHtN9FdpGNpI8OkM\"",
    "mtime": "2026-01-08T05:39:11.758Z",
    "size": 638,
    "path": "../public/games/super-nintendo-entertainment-system/super-ninja-boy/_payload.json"
  },
  "/games/super-nintendo-entertainment-system/super-mario-world-2-yoshis-island/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e976-+2IWoeENuE2rCwHzt7sg2IA6Uiw\"",
    "mtime": "2026-01-08T05:39:09.761Z",
    "size": 256374,
    "path": "../public/games/super-nintendo-entertainment-system/super-mario-world-2-yoshis-island/index.html"
  },
  "/games/super-nintendo-entertainment-system/super-mario-world-2-yoshis-island/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"2a6-wuQQgfv6hWeZ/g70hnuhxfCid24\"",
    "mtime": "2026-01-08T05:39:11.758Z",
    "size": 678,
    "path": "../public/games/super-nintendo-entertainment-system/super-mario-world-2-yoshis-island/_payload.json"
  },
  "/games/super-nintendo-entertainment-system/super-r-type/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8e6-D9aN5zy6F96NtaZnTr1T3uN3C1o\"",
    "mtime": "2026-01-08T05:39:09.761Z",
    "size": 256230,
    "path": "../public/games/super-nintendo-entertainment-system/super-r-type/index.html"
  },
  "/games/super-nintendo-entertainment-system/super-r-type/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"28f-INCz8YNJ9EyDKNcaXtcUeq6Jo/8\"",
    "mtime": "2026-01-08T05:39:11.758Z",
    "size": 655,
    "path": "../public/games/super-nintendo-entertainment-system/super-r-type/_payload.json"
  },
  "/games/super-nintendo-entertainment-system/teenage-mutant-ninja-turtles-iv-turtles-in-time/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3ea65-tmv9RJgGmHeuBMG8avXi0iYMEcU\"",
    "mtime": "2026-01-08T05:39:09.977Z",
    "size": 256613,
    "path": "../public/games/super-nintendo-entertainment-system/teenage-mutant-ninja-turtles-iv-turtles-in-time/index.html"
  },
  "/games/super-nintendo-entertainment-system/teenage-mutant-ninja-turtles-iv-turtles-in-time/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"2e3-gMrWkMZJOCOI3OKNv2fn1+O0Jyc\"",
    "mtime": "2026-01-08T05:39:11.799Z",
    "size": 739,
    "path": "../public/games/super-nintendo-entertainment-system/teenage-mutant-ninja-turtles-iv-turtles-in-time/_payload.json"
  },
  "/games/super-nintendo-entertainment-system/ultimate-mortal-kombat-3/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e92e-zRuNj08y5FqL60U8+lrfsbWkY+A\"",
    "mtime": "2026-01-08T05:39:10.209Z",
    "size": 256302,
    "path": "../public/games/super-nintendo-entertainment-system/ultimate-mortal-kombat-3/index.html"
  },
  "/games/super-nintendo-entertainment-system/ultimate-mortal-kombat-3/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"29b-UGMdq/TxoVOhUfaVQVge17GwXkU\"",
    "mtime": "2026-01-08T05:39:11.852Z",
    "size": 667,
    "path": "../public/games/super-nintendo-entertainment-system/ultimate-mortal-kombat-3/_payload.json"
  },
  "/games/super-nintendo-entertainment-system/un-squadron/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e9d9-YqZV705TTuU411+j31bWeKYe+JA\"",
    "mtime": "2026-01-08T05:39:10.209Z",
    "size": 256473,
    "path": "../public/games/super-nintendo-entertainment-system/un-squadron/index.html"
  },
  "/games/super-nintendo-entertainment-system/un-squadron/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"2ed-ZsuH9crcE05xmjh+LyJ5Da/5UOU\"",
    "mtime": "2026-01-08T05:39:11.836Z",
    "size": 749,
    "path": "../public/games/super-nintendo-entertainment-system/un-squadron/_payload.json"
  },
  "/games/super-nintendo-entertainment-system/ys-iii-wanderers-from-ys/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e936-OwttOUvrFZprKzBpoU1HmDJXn+k\"",
    "mtime": "2026-01-08T05:39:10.221Z",
    "size": 256310,
    "path": "../public/games/super-nintendo-entertainment-system/ys-iii-wanderers-from-ys/index.html"
  },
  "/games/super-nintendo-entertainment-system/ys-iii-wanderers-from-ys/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"29f-UPjffL7JOccT2SBI8TkWe/Pj+3w\"",
    "mtime": "2026-01-08T05:39:11.866Z",
    "size": 671,
    "path": "../public/games/super-nintendo-entertainment-system/ys-iii-wanderers-from-ys/_payload.json"
  },
  "/games/switch/binding-of-isaac-afterbirth-the/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e895-kPSFA2YiBJyBx/e1vmy/c024a9c\"",
    "mtime": "2026-01-08T05:39:05.354Z",
    "size": 256149,
    "path": "../public/games/switch/binding-of-isaac-afterbirth-the/index.html"
  },
  "/games/switch/binding-of-isaac-afterbirth-the/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"269-4PzcEgR/g2pVLRDbIiIt/bJuAJ4\"",
    "mtime": "2026-01-08T05:39:10.675Z",
    "size": 617,
    "path": "../public/games/switch/binding-of-isaac-afterbirth-the/_payload.json"
  },
  "/games/switch/caladrius-blaze/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e82d-A0av1nawMyNIdGSIDyZYZVP3R94\"",
    "mtime": "2026-01-08T05:39:05.326Z",
    "size": 256045,
    "path": "../public/games/switch/caladrius-blaze/index.html"
  },
  "/games/switch/caladrius-blaze/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"256-3BN/N9+5cOhij43p+TBv6gSzHBk\"",
    "mtime": "2026-01-08T05:39:10.675Z",
    "size": 598,
    "path": "../public/games/switch/caladrius-blaze/_payload.json"
  },
  "/games/switch/carrion/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e803-sttLBzEpKFCPYHS+tQOJ0WUKkrM\"",
    "mtime": "2026-01-08T05:39:05.456Z",
    "size": 256003,
    "path": "../public/games/switch/carrion/index.html"
  },
  "/games/switch/carrion/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"251-rrXDTra8i4+3V8aORvg8GsExQsk\"",
    "mtime": "2026-01-08T05:39:10.709Z",
    "size": 593,
    "path": "../public/games/switch/carrion/_payload.json"
  },
  "/games/switch/collection-of-mana/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e845-ia5v9rxTazQIP/17kW06tpBtObk\"",
    "mtime": "2026-01-08T05:39:05.540Z",
    "size": 256069,
    "path": "../public/games/switch/collection-of-mana/index.html"
  },
  "/games/switch/collection-of-mana/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25d-ivCes4p4bOJ7KE/T7AKAqRpUUEk\"",
    "mtime": "2026-01-08T05:39:10.725Z",
    "size": 605,
    "path": "../public/games/switch/collection-of-mana/_payload.json"
  },
  "/games/switch/dark-souls-remastered/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8e0-dD0V/8wNThnYXLx1KppniYvbubQ\"",
    "mtime": "2026-01-08T05:39:05.658Z",
    "size": 256224,
    "path": "../public/games/switch/dark-souls-remastered/index.html"
  },
  "/games/switch/dark-souls-remastered/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"271-QQRr+zQ6Faivdj8k7uY8vuPU7q8\"",
    "mtime": "2026-01-08T05:39:10.763Z",
    "size": 625,
    "path": "../public/games/switch/dark-souls-remastered/_payload.json"
  },
  "/games/switch/dead-cells/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e80f-uLkVy3UsIzboTj48l1z+AIqAXMg\"",
    "mtime": "2026-01-08T05:39:05.725Z",
    "size": 256015,
    "path": "../public/games/switch/dead-cells/index.html"
  },
  "/games/switch/dead-cells/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"252-bN5qTYA9qCL63rPwNlIrMizCQWo\"",
    "mtime": "2026-01-08T05:39:10.763Z",
    "size": 594,
    "path": "../public/games/switch/dead-cells/_payload.json"
  },
  "/games/switch/disgaea-1-complete/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e845-qdwdmNim83fRIBVo+zkrThbFVZs\"",
    "mtime": "2026-01-08T05:39:05.869Z",
    "size": 256069,
    "path": "../public/games/switch/disgaea-1-complete/index.html"
  },
  "/games/switch/disgaea-1-complete/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25d-P4Yp22aSJ1wLXHPZDlBdr32600k\"",
    "mtime": "2026-01-08T05:39:10.800Z",
    "size": 605,
    "path": "../public/games/switch/disgaea-1-complete/_payload.json"
  },
  "/games/switch/dragon-quest-xi/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e833-nB8/FYaEWvkMu1rfxSHsBtfhBA0\"",
    "mtime": "2026-01-08T05:39:06.116Z",
    "size": 256051,
    "path": "../public/games/switch/dragon-quest-xi/index.html"
  },
  "/games/switch/dragon-quest-xi/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25a-gjF0+I2KzM0kyVUJIoHqmRPxWlc\"",
    "mtime": "2026-01-08T05:39:10.850Z",
    "size": 602,
    "path": "../public/games/switch/dragon-quest-xi/_payload.json"
  },
  "/games/switch/elder-scrolls-v-skyrim-the/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e925-69LxesvVTKNtGulvjg2GthTWul8\"",
    "mtime": "2026-01-08T05:39:06.386Z",
    "size": 256293,
    "path": "../public/games/switch/elder-scrolls-v-skyrim-the/index.html"
  },
  "/games/switch/elder-scrolls-v-skyrim-the/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"29a-LwO5GhQ8mGPt8Q4jvI4EAYkCa94\"",
    "mtime": "2026-01-08T05:39:10.893Z",
    "size": 666,
    "path": "../public/games/switch/elder-scrolls-v-skyrim-the/_payload.json"
  },
  "/games/switch/end-is-nigh-the/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e830-n8g6GLUcKwDkHFp14aJQPSReGK0\"",
    "mtime": "2026-01-08T05:39:06.386Z",
    "size": 256048,
    "path": "../public/games/switch/end-is-nigh-the/index.html"
  },
  "/games/switch/end-is-nigh-the/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"258-srpXNtpUGdkdxbM0kzAEQYGi5i0\"",
    "mtime": "2026-01-08T05:39:10.874Z",
    "size": 600,
    "path": "../public/games/switch/end-is-nigh-the/_payload.json"
  },
  "/games/switch/final-fantasy-xii-the-zodiac-age-switch/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8b0-WzWy0w5aTJhtb2F6iOz62D63Fv0\"",
    "mtime": "2026-01-08T05:39:06.731Z",
    "size": 256176,
    "path": "../public/games/switch/final-fantasy-xii-the-zodiac-age-switch/index.html"
  },
  "/games/switch/final-fantasy-xii-the-zodiac-age-switch/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"26c-wrfxRzdrgiT+drO+E29GM2kjiOE\"",
    "mtime": "2026-01-08T05:39:10.969Z",
    "size": 620,
    "path": "../public/games/switch/final-fantasy-xii-the-zodiac-age-switch/_payload.json"
  },
  "/games/switch/hollow-knight/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e827-3IGEpmVPGboeYdCl5nvRxz47MNk\"",
    "mtime": "2026-01-08T05:39:07.153Z",
    "size": 256039,
    "path": "../public/games/switch/hollow-knight/index.html"
  },
  "/games/switch/hollow-knight/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"257-at+GVSF3jMp0DJ3mokANOcjPRvU\"",
    "mtime": "2026-01-08T05:39:11.077Z",
    "size": 599,
    "path": "../public/games/switch/hollow-knight/_payload.json"
  },
  "/games/switch/hades/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e7f1-YKCAGhaXW4suOPS4ZUKYAInngiM\"",
    "mtime": "2026-01-08T05:39:07.024Z",
    "size": 255985,
    "path": "../public/games/switch/hades/index.html"
  },
  "/games/switch/hades/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"24d-XFEXJF/3WUCvtu+guYwtVdU8bVM\"",
    "mtime": "2026-01-08T05:39:11.049Z",
    "size": 589,
    "path": "../public/games/switch/hades/_payload.json"
  },
  "/games/switch/hyrule-warriors-age-of-calamity/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e88f-vseyq8lGwuukt8k/4N5ajfZcXQM\"",
    "mtime": "2026-01-08T05:39:07.184Z",
    "size": 256143,
    "path": "../public/games/switch/hyrule-warriors-age-of-calamity/index.html"
  },
  "/games/switch/hyrule-warriors-age-of-calamity/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"268-a+GjbA/yS2vnPbC9R6YCfJRNWC4\"",
    "mtime": "2026-01-08T05:39:11.099Z",
    "size": 616,
    "path": "../public/games/switch/hyrule-warriors-age-of-calamity/_payload.json"
  },
  "/games/switch/katamari-reroll/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e833-nPUIHivJEdPFbz6Gmz0/t8zi5GI\"",
    "mtime": "2026-01-08T05:39:07.430Z",
    "size": 256051,
    "path": "../public/games/switch/katamari-reroll/index.html"
  },
  "/games/switch/katamari-reroll/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25a-IAskm53ym1GQz/DZl4EQTnKAZjs\"",
    "mtime": "2026-01-08T05:39:11.136Z",
    "size": 602,
    "path": "../public/games/switch/katamari-reroll/_payload.json"
  },
  "/games/switch/legend-of-zelda-breath-of-the-wild/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8a1-+fFCMkXV++9iwxUtOxvDNrVL0ks\"",
    "mtime": "2026-01-08T05:39:07.464Z",
    "size": 256161,
    "path": "../public/games/switch/legend-of-zelda-breath-of-the-wild/index.html"
  },
  "/games/switch/legend-of-zelda-breath-of-the-wild/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"26b-cIjJQnXCdzpVgYtHkBGzq0nNnlY\"",
    "mtime": "2026-01-08T05:39:11.179Z",
    "size": 619,
    "path": "../public/games/switch/legend-of-zelda-breath-of-the-wild/_payload.json"
  },
  "/games/switch/mario-kart-8-deluxe/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e845-bMTCnxAZAbEeog1o9QGYzXiQJl0\"",
    "mtime": "2026-01-08T05:39:07.668Z",
    "size": 256069,
    "path": "../public/games/switch/mario-kart-8-deluxe/index.html"
  },
  "/games/switch/mario-kart-8-deluxe/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25b-uyXycSr4PIQrFt+i48Jc4pOwFsg\"",
    "mtime": "2026-01-08T05:39:11.238Z",
    "size": 603,
    "path": "../public/games/switch/mario-kart-8-deluxe/_payload.json"
  },
  "/games/switch/minit/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e7f9-VkiaDjQm6OU67tv4r8WLmdMnMj0\"",
    "mtime": "2026-01-08T05:39:08.068Z",
    "size": 255993,
    "path": "../public/games/switch/minit/index.html"
  },
  "/games/switch/minit/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"251-GrjEtjD0R84ORZR7wn2gWJv8zuo\"",
    "mtime": "2026-01-08T05:39:11.314Z",
    "size": 593,
    "path": "../public/games/switch/minit/_payload.json"
  },
  "/games/switch/my-hero-ones-justice/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e863-hGLQrIzN2fubMtesxaW7nfGOg2Q\"",
    "mtime": "2026-01-08T05:39:08.107Z",
    "size": 256099,
    "path": "../public/games/switch/my-hero-ones-justice/index.html"
  },
  "/games/switch/my-hero-ones-justice/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"261-U+KaNx1NIbwWKnHGW4ZQqa8iplQ\"",
    "mtime": "2026-01-08T05:39:11.314Z",
    "size": 609,
    "path": "../public/games/switch/my-hero-ones-justice/_payload.json"
  },
  "/games/switch/new-pokemon-snap/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e83b-l2OD2yavQDiaosnsuXzQjjkcU4M\"",
    "mtime": "2026-01-08T05:39:08.107Z",
    "size": 256059,
    "path": "../public/games/switch/new-pokemon-snap/index.html"
  },
  "/games/switch/new-pokemon-snap/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25c-dr7Cd8S2VK8yiRj25YALXyOGtgM\"",
    "mtime": "2026-01-08T05:39:11.315Z",
    "size": 604,
    "path": "../public/games/switch/new-pokemon-snap/_payload.json"
  },
  "/games/switch/pokemon-shield/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e827-KK0okrmVtuc/NhOdvAnzXMXiLmM\"",
    "mtime": "2026-01-08T05:39:08.555Z",
    "size": 256039,
    "path": "../public/games/switch/pokemon-shield/index.html"
  },
  "/games/switch/pokemon-shield/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"256-5ZszYH1W42sUH4+htzpV+LEt/so\"",
    "mtime": "2026-01-08T05:39:11.435Z",
    "size": 598,
    "path": "../public/games/switch/pokemon-shield/_payload.json"
  },
  "/games/switch/okami-switch/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e80e-2G/nweqPd3QDRPLW2507LAUvxGA\"",
    "mtime": "2026-01-08T05:39:08.107Z",
    "size": 256014,
    "path": "../public/games/switch/okami-switch/index.html"
  },
  "/games/switch/okami-switch/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"251-CHQ2YgUq+oGpGE2N4IMPLRVg0gA\"",
    "mtime": "2026-01-08T05:39:11.351Z",
    "size": 593,
    "path": "../public/games/switch/okami-switch/_payload.json"
  },
  "/games/switch/pokemon-sword/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e821-ikN1SAU+CwLIaiOSA3yfa5NK/hQ\"",
    "mtime": "2026-01-08T05:39:08.597Z",
    "size": 256033,
    "path": "../public/games/switch/pokemon-sword/index.html"
  },
  "/games/switch/pokemon-sword/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"255-xsccHUk598SuKt3jiHZKeG3/fdQ\"",
    "mtime": "2026-01-08T05:39:11.467Z",
    "size": 597,
    "path": "../public/games/switch/pokemon-sword/_payload.json"
  },
  "/games/switch/resident-evil-revelations-collection/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8ab-+8PgGvyPMip35rYgzy26qqAyzzw\"",
    "mtime": "2026-01-08T05:39:08.600Z",
    "size": 256171,
    "path": "../public/games/switch/resident-evil-revelations-collection/index.html"
  },
  "/games/switch/resident-evil-revelations-collection/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"26c-grL2rngrovmRo4Me5Ura99fCkQ4\"",
    "mtime": "2026-01-08T05:39:11.512Z",
    "size": 620,
    "path": "../public/games/switch/resident-evil-revelations-collection/_payload.json"
  },
  "/games/switch/ring-fit-adventure/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e847-gAUAnHxowCYKqB8F6QIybt1PIEI\"",
    "mtime": "2026-01-08T05:39:09.039Z",
    "size": 256071,
    "path": "../public/games/switch/ring-fit-adventure/index.html"
  },
  "/games/switch/ring-fit-adventure/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25e-d9kSaTZfdWeNKkZdYSxbiT5I0cs\"",
    "mtime": "2026-01-08T05:39:11.569Z",
    "size": 606,
    "path": "../public/games/switch/ring-fit-adventure/_payload.json"
  },
  "/games/switch/shikhondo/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e809-88kub/Hxp1VaHzURMqHk3Fizysk\"",
    "mtime": "2026-01-08T05:39:09.039Z",
    "size": 256009,
    "path": "../public/games/switch/shikhondo/index.html"
  },
  "/games/switch/shikhondo/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"251-4Wk03sn8Vpcc+qF7I2aJm67g41o\"",
    "mtime": "2026-01-08T05:39:11.597Z",
    "size": 593,
    "path": "../public/games/switch/shikhondo/_payload.json"
  },
  "/games/switch/shin-megami-tensei-v/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e851-QOZf7V9OTiWMQo7sb3gWs5H0bNA\"",
    "mtime": "2026-01-08T05:39:09.045Z",
    "size": 256081,
    "path": "../public/games/switch/shin-megami-tensei-v/index.html"
  },
  "/games/switch/shin-megami-tensei-v/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25f-Eehip+9T+kgAEwXiv2ddxJx2brY\"",
    "mtime": "2026-01-08T05:39:11.597Z",
    "size": 607,
    "path": "../public/games/switch/shin-megami-tensei-v/_payload.json"
  },
  "/games/switch/south-park-the-fractured-but-whole/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8a7-OCKqZzah5bqEF8x9fqG9Dxx7iok\"",
    "mtime": "2026-01-08T05:39:09.323Z",
    "size": 256167,
    "path": "../public/games/switch/south-park-the-fractured-but-whole/index.html"
  },
  "/games/switch/south-park-the-fractured-but-whole/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"26e-HHQdLjvDdDu+VeZI7Q1uev/f3EY\"",
    "mtime": "2026-01-08T05:39:11.669Z",
    "size": 622,
    "path": "../public/games/switch/south-park-the-fractured-but-whole/_payload.json"
  },
  "/games/switch/super-mario-3d-all-stars/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e86b-67fOQJC/ttygAfkRN+thWoleS64\"",
    "mtime": "2026-01-08T05:39:09.760Z",
    "size": 256107,
    "path": "../public/games/switch/super-mario-3d-all-stars/index.html"
  },
  "/games/switch/super-mario-3d-all-stars/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"264-Fh1xHj1NbBf2Rde1LMAhs585fFo\"",
    "mtime": "2026-01-08T05:39:11.725Z",
    "size": 612,
    "path": "../public/games/switch/super-mario-3d-all-stars/_payload.json"
  },
  "/games/switch/super-mario-3d-world-bowsers-fury/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8af-ATdMBRMWFeWaYGQRFaxJ+rZ+ouM\"",
    "mtime": "2026-01-08T05:39:09.760Z",
    "size": 256175,
    "path": "../public/games/switch/super-mario-3d-world-bowsers-fury/index.html"
  },
  "/games/switch/super-mario-3d-world-bowsers-fury/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"26c-RhgKkjLeaMONKuhCRl7eRh9Myps\"",
    "mtime": "2026-01-08T05:39:11.725Z",
    "size": 620,
    "path": "../public/games/switch/super-mario-3d-world-bowsers-fury/_payload.json"
  },
  "/games/switch/super-mario-odyssey/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e845-6LJWfXM2inmkYv64RglkzIIBhi0\"",
    "mtime": "2026-01-08T05:39:09.761Z",
    "size": 256069,
    "path": "../public/games/switch/super-mario-odyssey/index.html"
  },
  "/games/switch/super-mario-odyssey/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25b-puiyCbiYSG78IWvYzZpfvyz/9yo\"",
    "mtime": "2026-01-08T05:39:11.742Z",
    "size": 603,
    "path": "../public/games/switch/super-mario-odyssey/_payload.json"
  },
  "/games/switch/super-meat-boy/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e827-lkCIYKADYchWcQWXn2tkDqsvqUY\"",
    "mtime": "2026-01-08T05:39:09.761Z",
    "size": 256039,
    "path": "../public/games/switch/super-meat-boy/index.html"
  },
  "/games/switch/super-meat-boy/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"256-ceuIXMxDBdg9Q1mSBTmNtMHp8a4\"",
    "mtime": "2026-01-08T05:39:11.742Z",
    "size": 598,
    "path": "../public/games/switch/super-meat-boy/_payload.json"
  },
  "/games/switch/super-smash-bros-ultimate/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e86c-e4QPmYbidVPDKJOZ+KEE3Mn1o+Q\"",
    "mtime": "2026-01-08T05:39:09.761Z",
    "size": 256108,
    "path": "../public/games/switch/super-smash-bros-ultimate/index.html"
  },
  "/games/switch/super-smash-bros-ultimate/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"262-o/a1g7MCg1EIS1SbADTko6QRZEo\"",
    "mtime": "2026-01-08T05:39:11.758Z",
    "size": 610,
    "path": "../public/games/switch/super-smash-bros-ultimate/_payload.json"
  },
  "/games/switch/tony-hawks-pro-skater-1-2/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e87f-W6YJZMxJphLWDb4JCfQX+6tjV4w\"",
    "mtime": "2026-01-08T05:39:10.028Z",
    "size": 256127,
    "path": "../public/games/switch/tony-hawks-pro-skater-1-2/index.html"
  },
  "/games/switch/tony-hawks-pro-skater-1-2/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"26b-LCPIE20qM22efw/vJdL2rLpX2F0\"",
    "mtime": "2026-01-08T05:39:11.820Z",
    "size": 619,
    "path": "../public/games/switch/tony-hawks-pro-skater-1-2/_payload.json"
  },
  "/games/switch/ys-ix-monstrum-nox/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e849-e9v+6mL3FO+Z3xY1pkF+HkwRIMU\"",
    "mtime": "2026-01-08T05:39:10.298Z",
    "size": 256073,
    "path": "../public/games/switch/ys-ix-monstrum-nox/index.html"
  },
  "/games/switch/ys-ix-monstrum-nox/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"25f-jfW1lrt6VDhl01KlOhx0rZDn6No\"",
    "mtime": "2026-01-08T05:39:11.866Z",
    "size": 607,
    "path": "../public/games/switch/ys-ix-monstrum-nox/_payload.json"
  },
  "/games/wii/donkey-kong-country-returns/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e866-ORr1d4dUgKsMZkA+uOcpE0OnrtQ\"",
    "mtime": "2026-01-08T05:39:06.042Z",
    "size": 256102,
    "path": "../public/games/wii/donkey-kong-country-returns/index.html"
  },
  "/games/wii/donkey-kong-country-returns/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"266-Xjtzshd2KM+AyRE/NshPAAFFVkQ\"",
    "mtime": "2026-01-08T05:39:10.833Z",
    "size": 614,
    "path": "../public/games/wii/donkey-kong-country-returns/_payload.json"
  },
  "/games/wii/house-of-the-dead-2-and-3-return-the/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e89f-n7zVMgF9NVNR1XfNfUH9bcpSAac\"",
    "mtime": "2026-01-08T05:39:07.153Z",
    "size": 256159,
    "path": "../public/games/wii/house-of-the-dead-2-and-3-return-the/index.html"
  },
  "/games/wii/house-of-the-dead-2-and-3-return-the/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"265-KAHVaMmMIyPdPirgqSfMmIX6N1c\"",
    "mtime": "2026-01-08T05:39:11.077Z",
    "size": 613,
    "path": "../public/games/wii/house-of-the-dead-2-and-3-return-the/_payload.json"
  },
  "/games/wii/legend-of-zelda-skyward-sword-the/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e88f-yeeXF1vg/MRGEi8LQ2pd3n4fr5Y\"",
    "mtime": "2026-01-08T05:39:07.629Z",
    "size": 256143,
    "path": "../public/games/wii/legend-of-zelda-skyward-sword-the/index.html"
  },
  "/games/wii/legend-of-zelda-skyward-sword-the/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"267-yB1nFfDK+jaxis68cjIglVo+u6M\"",
    "mtime": "2026-01-08T05:39:11.202Z",
    "size": 615,
    "path": "../public/games/wii/legend-of-zelda-skyward-sword-the/_payload.json"
  },
  "/games/wii/resident-evil-4-wii/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e82a-bf6hdApNi7FtwF8dnS96DbfmQ8c\"",
    "mtime": "2026-01-08T05:39:08.615Z",
    "size": 256042,
    "path": "../public/games/wii/resident-evil-4-wii/index.html"
  },
  "/games/wii/resident-evil-4-wii/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"254-AqKZB/V7G90Yp9iJWS3kiCDtj6Y\"",
    "mtime": "2026-01-08T05:39:11.512Z",
    "size": 596,
    "path": "../public/games/wii/resident-evil-4-wii/_payload.json"
  },
  "/games/wii/resident-evil-the-darkside-chronicles/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8a4-BWWRd1DDV4znp8x77KgNivztNoI\"",
    "mtime": "2026-01-08T05:39:08.637Z",
    "size": 256164,
    "path": "../public/games/wii/resident-evil-the-darkside-chronicles/index.html"
  },
  "/games/wii/resident-evil-the-darkside-chronicles/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"26b-/ErFCFLm99qEUO376rHPxPk9CAo\"",
    "mtime": "2026-01-08T05:39:11.536Z",
    "size": 619,
    "path": "../public/games/wii/resident-evil-the-darkside-chronicles/_payload.json"
  },
  "/games/wii/resident-evil-the-umbrella-chronicles/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8a4-naqWaO1ZI48QuApoYyJQz5QdC9s\"",
    "mtime": "2026-01-08T05:39:09.039Z",
    "size": 256164,
    "path": "../public/games/wii/resident-evil-the-umbrella-chronicles/index.html"
  },
  "/games/wii/resident-evil-the-umbrella-chronicles/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"26b-MUL1okVR4AQgjSqWeMIcx2WgQ0k\"",
    "mtime": "2026-01-08T05:39:11.536Z",
    "size": 619,
    "path": "../public/games/wii/resident-evil-the-umbrella-chronicles/_payload.json"
  },
  "/games/wii/super-mario-galaxy/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3eb37-qi6lsHXCESg5nCONqFBW5kXwvMc\"",
    "mtime": "2026-01-08T05:39:03.935Z",
    "size": 256823,
    "path": "../public/games/wii/super-mario-galaxy/index.html"
  },
  "/games/wii/super-mario-galaxy/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"459-LO5B8q9uVRn5dDdlve8CoR4JlNk\"",
    "mtime": "2026-01-08T05:39:10.373Z",
    "size": 1113,
    "path": "../public/games/wii/super-mario-galaxy/_payload.json"
  },
  "/games/wii/sin-and-punishment-star-successor/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e88c-LTp984zWcX06VuEuDUrKtAbfN+g\"",
    "mtime": "2026-01-08T05:39:09.258Z",
    "size": 256140,
    "path": "../public/games/wii/sin-and-punishment-star-successor/index.html"
  },
  "/games/wii/sin-and-punishment-star-successor/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"267-Hl0iHNI3BO5j00zdIou6dZXFYXo\"",
    "mtime": "2026-01-08T05:39:11.651Z",
    "size": 615,
    "path": "../public/games/wii/sin-and-punishment-star-successor/_payload.json"
  },
  "/games/wii/super-mario-galaxy-2/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e83c-TYk8JmyIkRQCGV+MuSLxiD0TtdE\"",
    "mtime": "2026-01-08T05:39:09.761Z",
    "size": 256060,
    "path": "../public/games/wii/super-mario-galaxy-2/index.html"
  },
  "/games/wii/super-mario-galaxy-2/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"259-W3W1bZ1pwDrqOfc4z4nFE3IR114\"",
    "mtime": "2026-01-08T05:39:11.742Z",
    "size": 601,
    "path": "../public/games/wii/super-mario-galaxy-2/_payload.json"
  },
  "/games/wii-u/hyrule-warriors/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e82c-l1kfe7Q9OHhqPwdZd2k7x9qh9zY\"",
    "mtime": "2026-01-08T05:39:04.803Z",
    "size": 256044,
    "path": "../public/games/wii-u/hyrule-warriors/index.html"
  },
  "/games/wii-u/hyrule-warriors/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"259-tNzNnGE1j+/L6Wid9I15U7VmOUg\"",
    "mtime": "2026-01-08T05:39:10.476Z",
    "size": 601,
    "path": "../public/games/wii-u/hyrule-warriors/_payload.json"
  },
  "/games/wii-u/legend-of-zelda-twilight-princess-hd-the/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8c7-ykWTHlVGiiH4uWpY1Rk7Gu5vBAI\"",
    "mtime": "2026-01-08T05:39:04.635Z",
    "size": 256199,
    "path": "../public/games/wii-u/legend-of-zelda-twilight-princess-hd-the/index.html"
  },
  "/games/wii-u/legend-of-zelda-twilight-princess-hd-the/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"274-4y3tooZxEaryARc6eETmzRuv3tc\"",
    "mtime": "2026-01-08T05:39:10.476Z",
    "size": 628,
    "path": "../public/games/wii-u/legend-of-zelda-twilight-princess-hd-the/_payload.json"
  },
  "/games/wii-u/the-legend-of-zelda-the-windwaker-hd/index.html": {
    "type": "text/html;charset=utf-8",
    "etag": "\"3e8af-DJgNlG4KXq/Q8b8xaGZPRHdqGNc\"",
    "mtime": "2026-01-08T05:39:04.729Z",
    "size": 256175,
    "path": "../public/games/wii-u/the-legend-of-zelda-the-windwaker-hd/index.html"
  },
  "/games/wii-u/the-legend-of-zelda-the-windwaker-hd/_payload.json": {
    "type": "application/json;charset=utf-8",
    "etag": "\"26f-LucNnz1/MgzsemtBkcEIIORz4ls\"",
    "mtime": "2026-01-08T05:39:10.476Z",
    "size": 623,
    "path": "../public/games/wii-u/the-legend-of-zelda-the-windwaker-hd/_payload.json"
  },
  "/_nuxt/builds/meta/3be60665-aef4-4503-b459-8215434bcc8f.json": {
    "type": "application/json",
    "etag": "\"6c87-BuyrXKxXfepl6eGPuGOYpqV1Psw\"",
    "mtime": "2026-01-08T05:39:11.888Z",
    "size": 27783,
    "path": "../public/_nuxt/builds/meta/3be60665-aef4-4503-b459-8215434bcc8f.json"
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

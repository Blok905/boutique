var J1 = Object.defineProperty;
var Q1 = (e, n, r) => n in e ? J1(e, n, { enumerable: !0, configurable: !0, writable: !0, value: r }) : e[n] = r;
var Wt = (e, n, r) => Q1(e, typeof n != "symbol" ? n + "" : n, r);
function eh(e, n) {
  return function() {
    return e.apply(n, arguments);
  };
}
const { toString: j1 } = Object.prototype, { getPrototypeOf: ua } = Object, Ds = /* @__PURE__ */ ((e) => (n) => {
  const r = j1.call(n);
  return e[r] || (e[r] = r.slice(8, -1).toLowerCase());
})(/* @__PURE__ */ Object.create(null)), Ze = (e) => (e = e.toLowerCase(), (n) => Ds(n) === e), Fs = (e) => (n) => typeof n === e, { isArray: Dr } = Array, di = Fs("undefined");
function tb(e) {
  return e !== null && !di(e) && e.constructor !== null && !di(e.constructor) && Be(e.constructor.isBuffer) && e.constructor.isBuffer(e);
}
const nh = Ze("ArrayBuffer");
function eb(e) {
  let n;
  return typeof ArrayBuffer < "u" && ArrayBuffer.isView ? n = ArrayBuffer.isView(e) : n = e && e.buffer && nh(e.buffer), n;
}
const nb = Fs("string"), Be = Fs("function"), rh = Fs("number"), Ps = (e) => e !== null && typeof e == "object", rb = (e) => e === !0 || e === !1, ys = (e) => {
  if (Ds(e) !== "object")
    return !1;
  const n = ua(e);
  return (n === null || n === Object.prototype || Object.getPrototypeOf(n) === null) && !(Symbol.toStringTag in e) && !(Symbol.iterator in e);
}, ib = Ze("Date"), sb = Ze("File"), ob = Ze("Blob"), ub = Ze("FileList"), ab = (e) => Ps(e) && Be(e.pipe), cb = (e) => {
  let n;
  return e && (typeof FormData == "function" && e instanceof FormData || Be(e.append) && ((n = Ds(e)) === "formdata" || // detect form-data instance
  n === "object" && Be(e.toString) && e.toString() === "[object FormData]"));
}, fb = Ze("URLSearchParams"), [lb, hb, db, pb] = ["ReadableStream", "Request", "Response", "Headers"].map(Ze), gb = (e) => e.trim ? e.trim() : e.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, "");
function wi(e, n, { allOwnKeys: r = !1 } = {}) {
  if (e === null || typeof e > "u")
    return;
  let s, u;
  if (typeof e != "object" && (e = [e]), Dr(e))
    for (s = 0, u = e.length; s < u; s++)
      n.call(null, e[s], s, e);
  else {
    const a = r ? Object.getOwnPropertyNames(e) : Object.keys(e), c = a.length;
    let l;
    for (s = 0; s < c; s++)
      l = a[s], n.call(null, e[l], l, e);
  }
}
function ih(e, n) {
  n = n.toLowerCase();
  const r = Object.keys(e);
  let s = r.length, u;
  for (; s-- > 0; )
    if (u = r[s], n === u.toLowerCase())
      return u;
  return null;
}
const er = typeof globalThis < "u" ? globalThis : typeof self < "u" ? self : typeof window < "u" ? window : global, sh = (e) => !di(e) && e !== er;
function Fu() {
  const { caseless: e } = sh(this) && this || {}, n = {}, r = (s, u) => {
    const a = e && ih(n, u) || u;
    ys(n[a]) && ys(s) ? n[a] = Fu(n[a], s) : ys(s) ? n[a] = Fu({}, s) : Dr(s) ? n[a] = s.slice() : n[a] = s;
  };
  for (let s = 0, u = arguments.length; s < u; s++)
    arguments[s] && wi(arguments[s], r);
  return n;
}
const wb = (e, n, r, { allOwnKeys: s } = {}) => (wi(n, (u, a) => {
  r && Be(u) ? e[a] = eh(u, r) : e[a] = u;
}, { allOwnKeys: s }), e), yb = (e) => (e.charCodeAt(0) === 65279 && (e = e.slice(1)), e), mb = (e, n, r, s) => {
  e.prototype = Object.create(n.prototype, s), e.prototype.constructor = e, Object.defineProperty(e, "super", {
    value: n.prototype
  }), r && Object.assign(e.prototype, r);
}, bb = (e, n, r, s) => {
  let u, a, c;
  const l = {};
  if (n = n || {}, e == null) return n;
  do {
    for (u = Object.getOwnPropertyNames(e), a = u.length; a-- > 0; )
      c = u[a], (!s || s(c, e, n)) && !l[c] && (n[c] = e[c], l[c] = !0);
    e = r !== !1 && ua(e);
  } while (e && (!r || r(e, n)) && e !== Object.prototype);
  return n;
}, Eb = (e, n, r) => {
  e = String(e), (r === void 0 || r > e.length) && (r = e.length), r -= n.length;
  const s = e.indexOf(n, r);
  return s !== -1 && s === r;
}, xb = (e) => {
  if (!e) return null;
  if (Dr(e)) return e;
  let n = e.length;
  if (!rh(n)) return null;
  const r = new Array(n);
  for (; n-- > 0; )
    r[n] = e[n];
  return r;
}, Sb = /* @__PURE__ */ ((e) => (n) => e && n instanceof e)(typeof Uint8Array < "u" && ua(Uint8Array)), _b = (e, n) => {
  const s = (e && e[Symbol.iterator]).call(e);
  let u;
  for (; (u = s.next()) && !u.done; ) {
    const a = u.value;
    n.call(e, a[0], a[1]);
  }
}, Ab = (e, n) => {
  let r;
  const s = [];
  for (; (r = e.exec(n)) !== null; )
    s.push(r);
  return s;
}, vb = Ze("HTMLFormElement"), Tb = (e) => e.toLowerCase().replace(
  /[-_\s]([a-z\d])(\w*)/g,
  function(r, s, u) {
    return s.toUpperCase() + u;
  }
), fl = (({ hasOwnProperty: e }) => (n, r) => e.call(n, r))(Object.prototype), Ib = Ze("RegExp"), oh = (e, n) => {
  const r = Object.getOwnPropertyDescriptors(e), s = {};
  wi(r, (u, a) => {
    let c;
    (c = n(u, a, e)) !== !1 && (s[a] = c || u);
  }), Object.defineProperties(e, s);
}, Bb = (e) => {
  oh(e, (n, r) => {
    if (Be(e) && ["arguments", "caller", "callee"].indexOf(r) !== -1)
      return !1;
    const s = e[r];
    if (Be(s)) {
      if (n.enumerable = !1, "writable" in n) {
        n.writable = !1;
        return;
      }
      n.set || (n.set = () => {
        throw Error("Can not rewrite read-only method '" + r + "'");
      });
    }
  });
}, Rb = (e, n) => {
  const r = {}, s = (u) => {
    u.forEach((a) => {
      r[a] = !0;
    });
  };
  return Dr(e) ? s(e) : s(String(e).split(n)), r;
}, Ub = () => {
}, Lb = (e, n) => e != null && Number.isFinite(e = +e) ? e : n, _u = "abcdefghijklmnopqrstuvwxyz", ll = "0123456789", uh = {
  DIGIT: ll,
  ALPHA: _u,
  ALPHA_DIGIT: _u + _u.toUpperCase() + ll
}, Cb = (e = 16, n = uh.ALPHA_DIGIT) => {
  let r = "";
  const { length: s } = n;
  for (; e--; )
    r += n[Math.random() * s | 0];
  return r;
};
function Nb(e) {
  return !!(e && Be(e.append) && e[Symbol.toStringTag] === "FormData" && e[Symbol.iterator]);
}
const kb = (e) => {
  const n = new Array(10), r = (s, u) => {
    if (Ps(s)) {
      if (n.indexOf(s) >= 0)
        return;
      if (!("toJSON" in s)) {
        n[u] = s;
        const a = Dr(s) ? [] : {};
        return wi(s, (c, l) => {
          const d = r(c, u + 1);
          !di(d) && (a[l] = d);
        }), n[u] = void 0, a;
      }
    }
    return s;
  };
  return r(e, 0);
}, Ob = Ze("AsyncFunction"), $b = (e) => e && (Ps(e) || Be(e)) && Be(e.then) && Be(e.catch), ah = ((e, n) => e ? setImmediate : n ? ((r, s) => (er.addEventListener("message", ({ source: u, data: a }) => {
  u === er && a === r && s.length && s.shift()();
}, !1), (u) => {
  s.push(u), er.postMessage(r, "*");
}))(`axios@${Math.random()}`, []) : (r) => setTimeout(r))(
  typeof setImmediate == "function",
  Be(er.postMessage)
), Db = typeof queueMicrotask < "u" ? queueMicrotask.bind(er) : typeof process < "u" && process.nextTick || ah, U = {
  isArray: Dr,
  isArrayBuffer: nh,
  isBuffer: tb,
  isFormData: cb,
  isArrayBufferView: eb,
  isString: nb,
  isNumber: rh,
  isBoolean: rb,
  isObject: Ps,
  isPlainObject: ys,
  isReadableStream: lb,
  isRequest: hb,
  isResponse: db,
  isHeaders: pb,
  isUndefined: di,
  isDate: ib,
  isFile: sb,
  isBlob: ob,
  isRegExp: Ib,
  isFunction: Be,
  isStream: ab,
  isURLSearchParams: fb,
  isTypedArray: Sb,
  isFileList: ub,
  forEach: wi,
  merge: Fu,
  extend: wb,
  trim: gb,
  stripBOM: yb,
  inherits: mb,
  toFlatObject: bb,
  kindOf: Ds,
  kindOfTest: Ze,
  endsWith: Eb,
  toArray: xb,
  forEachEntry: _b,
  matchAll: Ab,
  isHTMLForm: vb,
  hasOwnProperty: fl,
  hasOwnProp: fl,
  // an alias to avoid ESLint no-prototype-builtins detection
  reduceDescriptors: oh,
  freezeMethods: Bb,
  toObjectSet: Rb,
  toCamelCase: Tb,
  noop: Ub,
  toFiniteNumber: Lb,
  findKey: ih,
  global: er,
  isContextDefined: sh,
  ALPHABET: uh,
  generateString: Cb,
  isSpecCompliantForm: Nb,
  toJSONObject: kb,
  isAsyncFn: Ob,
  isThenable: $b,
  setImmediate: ah,
  asap: Db
};
function et(e, n, r, s, u) {
  Error.call(this), Error.captureStackTrace ? Error.captureStackTrace(this, this.constructor) : this.stack = new Error().stack, this.message = e, this.name = "AxiosError", n && (this.code = n), r && (this.config = r), s && (this.request = s), u && (this.response = u, this.status = u.status ? u.status : null);
}
U.inherits(et, Error, {
  toJSON: function() {
    return {
      // Standard
      message: this.message,
      name: this.name,
      // Microsoft
      description: this.description,
      number: this.number,
      // Mozilla
      fileName: this.fileName,
      lineNumber: this.lineNumber,
      columnNumber: this.columnNumber,
      stack: this.stack,
      // Axios
      config: U.toJSONObject(this.config),
      code: this.code,
      status: this.status
    };
  }
});
const ch = et.prototype, fh = {};
[
  "ERR_BAD_OPTION_VALUE",
  "ERR_BAD_OPTION",
  "ECONNABORTED",
  "ETIMEDOUT",
  "ERR_NETWORK",
  "ERR_FR_TOO_MANY_REDIRECTS",
  "ERR_DEPRECATED",
  "ERR_BAD_RESPONSE",
  "ERR_BAD_REQUEST",
  "ERR_CANCELED",
  "ERR_NOT_SUPPORT",
  "ERR_INVALID_URL"
  // eslint-disable-next-line func-names
].forEach((e) => {
  fh[e] = { value: e };
});
Object.defineProperties(et, fh);
Object.defineProperty(ch, "isAxiosError", { value: !0 });
et.from = (e, n, r, s, u, a) => {
  const c = Object.create(ch);
  return U.toFlatObject(e, c, function(d) {
    return d !== Error.prototype;
  }, (l) => l !== "isAxiosError"), et.call(c, e.message, n, r, s, u), c.cause = e, c.name = e.name, a && Object.assign(c, a), c;
};
const Fb = null;
function Pu(e) {
  return U.isPlainObject(e) || U.isArray(e);
}
function lh(e) {
  return U.endsWith(e, "[]") ? e.slice(0, -2) : e;
}
function hl(e, n, r) {
  return e ? e.concat(n).map(function(u, a) {
    return u = lh(u), !r && a ? "[" + u + "]" : u;
  }).join(r ? "." : "") : n;
}
function Pb(e) {
  return U.isArray(e) && !e.some(Pu);
}
const Wb = U.toFlatObject(U, {}, null, function(n) {
  return /^is[A-Z]/.test(n);
});
function Ws(e, n, r) {
  if (!U.isObject(e))
    throw new TypeError("target must be an object");
  n = n || new FormData(), r = U.toFlatObject(r, {
    metaTokens: !0,
    dots: !1,
    indexes: !1
  }, !1, function(A, x) {
    return !U.isUndefined(x[A]);
  });
  const s = r.metaTokens, u = r.visitor || y, a = r.dots, c = r.indexes, d = (r.Blob || typeof Blob < "u" && Blob) && U.isSpecCompliantForm(n);
  if (!U.isFunction(u))
    throw new TypeError("visitor must be a function");
  function g(T) {
    if (T === null) return "";
    if (U.isDate(T))
      return T.toISOString();
    if (!d && U.isBlob(T))
      throw new et("Blob is not supported. Use a Buffer instead.");
    return U.isArrayBuffer(T) || U.isTypedArray(T) ? d && typeof Blob == "function" ? new Blob([T]) : Buffer.from(T) : T;
  }
  function y(T, A, x) {
    let B = T;
    if (T && !x && typeof T == "object") {
      if (U.endsWith(A, "{}"))
        A = s ? A : A.slice(0, -2), T = JSON.stringify(T);
      else if (U.isArray(T) && Pb(T) || (U.isFileList(T) || U.endsWith(A, "[]")) && (B = U.toArray(T)))
        return A = lh(A), B.forEach(function(O, F) {
          !(U.isUndefined(O) || O === null) && n.append(
            // eslint-disable-next-line no-nested-ternary
            c === !0 ? hl([A], F, a) : c === null ? A : A + "[]",
            g(O)
          );
        }), !1;
    }
    return Pu(T) ? !0 : (n.append(hl(x, A, a), g(T)), !1);
  }
  const m = [], E = Object.assign(Wb, {
    defaultVisitor: y,
    convertValue: g,
    isVisitable: Pu
  });
  function _(T, A) {
    if (!U.isUndefined(T)) {
      if (m.indexOf(T) !== -1)
        throw Error("Circular reference detected in " + A.join("."));
      m.push(T), U.forEach(T, function(B, k) {
        (!(U.isUndefined(B) || B === null) && u.call(
          n,
          B,
          U.isString(k) ? k.trim() : k,
          A,
          E
        )) === !0 && _(B, A ? A.concat(k) : [k]);
      }), m.pop();
    }
  }
  if (!U.isObject(e))
    throw new TypeError("data must be an object");
  return _(e), n;
}
function dl(e) {
  const n = {
    "!": "%21",
    "'": "%27",
    "(": "%28",
    ")": "%29",
    "~": "%7E",
    "%20": "+",
    "%00": "\0"
  };
  return encodeURIComponent(e).replace(/[!'()~]|%20|%00/g, function(s) {
    return n[s];
  });
}
function aa(e, n) {
  this._pairs = [], e && Ws(e, this, n);
}
const hh = aa.prototype;
hh.append = function(n, r) {
  this._pairs.push([n, r]);
};
hh.toString = function(n) {
  const r = n ? function(s) {
    return n.call(this, s, dl);
  } : dl;
  return this._pairs.map(function(u) {
    return r(u[0]) + "=" + r(u[1]);
  }, "").join("&");
};
function Mb(e) {
  return encodeURIComponent(e).replace(/%3A/gi, ":").replace(/%24/g, "$").replace(/%2C/gi, ",").replace(/%20/g, "+").replace(/%5B/gi, "[").replace(/%5D/gi, "]");
}
function dh(e, n, r) {
  if (!n)
    return e;
  const s = r && r.encode || Mb, u = r && r.serialize;
  let a;
  if (u ? a = u(n, r) : a = U.isURLSearchParams(n) ? n.toString() : new aa(n, r).toString(s), a) {
    const c = e.indexOf("#");
    c !== -1 && (e = e.slice(0, c)), e += (e.indexOf("?") === -1 ? "?" : "&") + a;
  }
  return e;
}
class pl {
  constructor() {
    this.handlers = [];
  }
  /**
   * Add a new interceptor to the stack
   *
   * @param {Function} fulfilled The function to handle `then` for a `Promise`
   * @param {Function} rejected The function to handle `reject` for a `Promise`
   *
   * @return {Number} An ID used to remove interceptor later
   */
  use(n, r, s) {
    return this.handlers.push({
      fulfilled: n,
      rejected: r,
      synchronous: s ? s.synchronous : !1,
      runWhen: s ? s.runWhen : null
    }), this.handlers.length - 1;
  }
  /**
   * Remove an interceptor from the stack
   *
   * @param {Number} id The ID that was returned by `use`
   *
   * @returns {Boolean} `true` if the interceptor was removed, `false` otherwise
   */
  eject(n) {
    this.handlers[n] && (this.handlers[n] = null);
  }
  /**
   * Clear all interceptors from the stack
   *
   * @returns {void}
   */
  clear() {
    this.handlers && (this.handlers = []);
  }
  /**
   * Iterate over all the registered interceptors
   *
   * This method is particularly useful for skipping over any
   * interceptors that may have become `null` calling `eject`.
   *
   * @param {Function} fn The function to call for each interceptor
   *
   * @returns {void}
   */
  forEach(n) {
    U.forEach(this.handlers, function(s) {
      s !== null && n(s);
    });
  }
}
const ph = {
  silentJSONParsing: !0,
  forcedJSONParsing: !0,
  clarifyTimeoutError: !1
}, Hb = typeof URLSearchParams < "u" ? URLSearchParams : aa, qb = typeof FormData < "u" ? FormData : null, Kb = typeof Blob < "u" ? Blob : null, zb = {
  isBrowser: !0,
  classes: {
    URLSearchParams: Hb,
    FormData: qb,
    Blob: Kb
  },
  protocols: ["http", "https", "file", "blob", "url", "data"]
}, ca = typeof window < "u" && typeof document < "u", Wu = typeof navigator == "object" && navigator || void 0, Vb = ca && (!Wu || ["ReactNative", "NativeScript", "NS"].indexOf(Wu.product) < 0), Gb = typeof WorkerGlobalScope < "u" && // eslint-disable-next-line no-undef
self instanceof WorkerGlobalScope && typeof self.importScripts == "function", Yb = ca && window.location.href || "http://localhost", Zb = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  hasBrowserEnv: ca,
  hasStandardBrowserEnv: Vb,
  hasStandardBrowserWebWorkerEnv: Gb,
  navigator: Wu,
  origin: Yb
}, Symbol.toStringTag, { value: "Module" })), ge = {
  ...Zb,
  ...zb
};
function Xb(e, n) {
  return Ws(e, new ge.classes.URLSearchParams(), Object.assign({
    visitor: function(r, s, u, a) {
      return ge.isNode && U.isBuffer(r) ? (this.append(s, r.toString("base64")), !1) : a.defaultVisitor.apply(this, arguments);
    }
  }, n));
}
function Jb(e) {
  return U.matchAll(/\w+|\[(\w*)]/g, e).map((n) => n[0] === "[]" ? "" : n[1] || n[0]);
}
function Qb(e) {
  const n = {}, r = Object.keys(e);
  let s;
  const u = r.length;
  let a;
  for (s = 0; s < u; s++)
    a = r[s], n[a] = e[a];
  return n;
}
function gh(e) {
  function n(r, s, u, a) {
    let c = r[a++];
    if (c === "__proto__") return !0;
    const l = Number.isFinite(+c), d = a >= r.length;
    return c = !c && U.isArray(u) ? u.length : c, d ? (U.hasOwnProp(u, c) ? u[c] = [u[c], s] : u[c] = s, !l) : ((!u[c] || !U.isObject(u[c])) && (u[c] = []), n(r, s, u[c], a) && U.isArray(u[c]) && (u[c] = Qb(u[c])), !l);
  }
  if (U.isFormData(e) && U.isFunction(e.entries)) {
    const r = {};
    return U.forEachEntry(e, (s, u) => {
      n(Jb(s), u, r, 0);
    }), r;
  }
  return null;
}
function jb(e, n, r) {
  if (U.isString(e))
    try {
      return (n || JSON.parse)(e), U.trim(e);
    } catch (s) {
      if (s.name !== "SyntaxError")
        throw s;
    }
  return (0, JSON.stringify)(e);
}
const yi = {
  transitional: ph,
  adapter: ["xhr", "http", "fetch"],
  transformRequest: [function(n, r) {
    const s = r.getContentType() || "", u = s.indexOf("application/json") > -1, a = U.isObject(n);
    if (a && U.isHTMLForm(n) && (n = new FormData(n)), U.isFormData(n))
      return u ? JSON.stringify(gh(n)) : n;
    if (U.isArrayBuffer(n) || U.isBuffer(n) || U.isStream(n) || U.isFile(n) || U.isBlob(n) || U.isReadableStream(n))
      return n;
    if (U.isArrayBufferView(n))
      return n.buffer;
    if (U.isURLSearchParams(n))
      return r.setContentType("application/x-www-form-urlencoded;charset=utf-8", !1), n.toString();
    let l;
    if (a) {
      if (s.indexOf("application/x-www-form-urlencoded") > -1)
        return Xb(n, this.formSerializer).toString();
      if ((l = U.isFileList(n)) || s.indexOf("multipart/form-data") > -1) {
        const d = this.env && this.env.FormData;
        return Ws(
          l ? { "files[]": n } : n,
          d && new d(),
          this.formSerializer
        );
      }
    }
    return a || u ? (r.setContentType("application/json", !1), jb(n)) : n;
  }],
  transformResponse: [function(n) {
    const r = this.transitional || yi.transitional, s = r && r.forcedJSONParsing, u = this.responseType === "json";
    if (U.isResponse(n) || U.isReadableStream(n))
      return n;
    if (n && U.isString(n) && (s && !this.responseType || u)) {
      const c = !(r && r.silentJSONParsing) && u;
      try {
        return JSON.parse(n);
      } catch (l) {
        if (c)
          throw l.name === "SyntaxError" ? et.from(l, et.ERR_BAD_RESPONSE, this, null, this.response) : l;
      }
    }
    return n;
  }],
  /**
   * A timeout in milliseconds to abort a request. If set to 0 (default) a
   * timeout is not created.
   */
  timeout: 0,
  xsrfCookieName: "XSRF-TOKEN",
  xsrfHeaderName: "X-XSRF-TOKEN",
  maxContentLength: -1,
  maxBodyLength: -1,
  env: {
    FormData: ge.classes.FormData,
    Blob: ge.classes.Blob
  },
  validateStatus: function(n) {
    return n >= 200 && n < 300;
  },
  headers: {
    common: {
      Accept: "application/json, text/plain, */*",
      "Content-Type": void 0
    }
  }
};
U.forEach(["delete", "get", "head", "post", "put", "patch"], (e) => {
  yi.headers[e] = {};
});
const tE = U.toObjectSet([
  "age",
  "authorization",
  "content-length",
  "content-type",
  "etag",
  "expires",
  "from",
  "host",
  "if-modified-since",
  "if-unmodified-since",
  "last-modified",
  "location",
  "max-forwards",
  "proxy-authorization",
  "referer",
  "retry-after",
  "user-agent"
]), eE = (e) => {
  const n = {};
  let r, s, u;
  return e && e.split(`
`).forEach(function(c) {
    u = c.indexOf(":"), r = c.substring(0, u).trim().toLowerCase(), s = c.substring(u + 1).trim(), !(!r || n[r] && tE[r]) && (r === "set-cookie" ? n[r] ? n[r].push(s) : n[r] = [s] : n[r] = n[r] ? n[r] + ", " + s : s);
  }), n;
}, gl = Symbol("internals");
function oi(e) {
  return e && String(e).trim().toLowerCase();
}
function ms(e) {
  return e === !1 || e == null ? e : U.isArray(e) ? e.map(ms) : String(e);
}
function nE(e) {
  const n = /* @__PURE__ */ Object.create(null), r = /([^\s,;=]+)\s*(?:=\s*([^,;]+))?/g;
  let s;
  for (; s = r.exec(e); )
    n[s[1]] = s[2];
  return n;
}
const rE = (e) => /^[-_a-zA-Z0-9^`|~,!#$%&'*+.]+$/.test(e.trim());
function Au(e, n, r, s, u) {
  if (U.isFunction(s))
    return s.call(this, n, r);
  if (u && (n = r), !!U.isString(n)) {
    if (U.isString(s))
      return n.indexOf(s) !== -1;
    if (U.isRegExp(s))
      return s.test(n);
  }
}
function iE(e) {
  return e.trim().toLowerCase().replace(/([a-z\d])(\w*)/g, (n, r, s) => r.toUpperCase() + s);
}
function sE(e, n) {
  const r = U.toCamelCase(" " + n);
  ["get", "set", "has"].forEach((s) => {
    Object.defineProperty(e, s + r, {
      value: function(u, a, c) {
        return this[s].call(this, n, u, a, c);
      },
      configurable: !0
    });
  });
}
class we {
  constructor(n) {
    n && this.set(n);
  }
  set(n, r, s) {
    const u = this;
    function a(l, d, g) {
      const y = oi(d);
      if (!y)
        throw new Error("header name must be a non-empty string");
      const m = U.findKey(u, y);
      (!m || u[m] === void 0 || g === !0 || g === void 0 && u[m] !== !1) && (u[m || d] = ms(l));
    }
    const c = (l, d) => U.forEach(l, (g, y) => a(g, y, d));
    if (U.isPlainObject(n) || n instanceof this.constructor)
      c(n, r);
    else if (U.isString(n) && (n = n.trim()) && !rE(n))
      c(eE(n), r);
    else if (U.isHeaders(n))
      for (const [l, d] of n.entries())
        a(d, l, s);
    else
      n != null && a(r, n, s);
    return this;
  }
  get(n, r) {
    if (n = oi(n), n) {
      const s = U.findKey(this, n);
      if (s) {
        const u = this[s];
        if (!r)
          return u;
        if (r === !0)
          return nE(u);
        if (U.isFunction(r))
          return r.call(this, u, s);
        if (U.isRegExp(r))
          return r.exec(u);
        throw new TypeError("parser must be boolean|regexp|function");
      }
    }
  }
  has(n, r) {
    if (n = oi(n), n) {
      const s = U.findKey(this, n);
      return !!(s && this[s] !== void 0 && (!r || Au(this, this[s], s, r)));
    }
    return !1;
  }
  delete(n, r) {
    const s = this;
    let u = !1;
    function a(c) {
      if (c = oi(c), c) {
        const l = U.findKey(s, c);
        l && (!r || Au(s, s[l], l, r)) && (delete s[l], u = !0);
      }
    }
    return U.isArray(n) ? n.forEach(a) : a(n), u;
  }
  clear(n) {
    const r = Object.keys(this);
    let s = r.length, u = !1;
    for (; s--; ) {
      const a = r[s];
      (!n || Au(this, this[a], a, n, !0)) && (delete this[a], u = !0);
    }
    return u;
  }
  normalize(n) {
    const r = this, s = {};
    return U.forEach(this, (u, a) => {
      const c = U.findKey(s, a);
      if (c) {
        r[c] = ms(u), delete r[a];
        return;
      }
      const l = n ? iE(a) : String(a).trim();
      l !== a && delete r[a], r[l] = ms(u), s[l] = !0;
    }), this;
  }
  concat(...n) {
    return this.constructor.concat(this, ...n);
  }
  toJSON(n) {
    const r = /* @__PURE__ */ Object.create(null);
    return U.forEach(this, (s, u) => {
      s != null && s !== !1 && (r[u] = n && U.isArray(s) ? s.join(", ") : s);
    }), r;
  }
  [Symbol.iterator]() {
    return Object.entries(this.toJSON())[Symbol.iterator]();
  }
  toString() {
    return Object.entries(this.toJSON()).map(([n, r]) => n + ": " + r).join(`
`);
  }
  get [Symbol.toStringTag]() {
    return "AxiosHeaders";
  }
  static from(n) {
    return n instanceof this ? n : new this(n);
  }
  static concat(n, ...r) {
    const s = new this(n);
    return r.forEach((u) => s.set(u)), s;
  }
  static accessor(n) {
    const s = (this[gl] = this[gl] = {
      accessors: {}
    }).accessors, u = this.prototype;
    function a(c) {
      const l = oi(c);
      s[l] || (sE(u, c), s[l] = !0);
    }
    return U.isArray(n) ? n.forEach(a) : a(n), this;
  }
}
we.accessor(["Content-Type", "Content-Length", "Accept", "Accept-Encoding", "User-Agent", "Authorization"]);
U.reduceDescriptors(we.prototype, ({ value: e }, n) => {
  let r = n[0].toUpperCase() + n.slice(1);
  return {
    get: () => e,
    set(s) {
      this[r] = s;
    }
  };
});
U.freezeMethods(we);
function vu(e, n) {
  const r = this || yi, s = n || r, u = we.from(s.headers);
  let a = s.data;
  return U.forEach(e, function(l) {
    a = l.call(r, a, u.normalize(), n ? n.status : void 0);
  }), u.normalize(), a;
}
function wh(e) {
  return !!(e && e.__CANCEL__);
}
function Fr(e, n, r) {
  et.call(this, e ?? "canceled", et.ERR_CANCELED, n, r), this.name = "CanceledError";
}
U.inherits(Fr, et, {
  __CANCEL__: !0
});
function yh(e, n, r) {
  const s = r.config.validateStatus;
  !r.status || !s || s(r.status) ? e(r) : n(new et(
    "Request failed with status code " + r.status,
    [et.ERR_BAD_REQUEST, et.ERR_BAD_RESPONSE][Math.floor(r.status / 100) - 4],
    r.config,
    r.request,
    r
  ));
}
function oE(e) {
  const n = /^([-+\w]{1,25})(:?\/\/|:)/.exec(e);
  return n && n[1] || "";
}
function uE(e, n) {
  e = e || 10;
  const r = new Array(e), s = new Array(e);
  let u = 0, a = 0, c;
  return n = n !== void 0 ? n : 1e3, function(d) {
    const g = Date.now(), y = s[a];
    c || (c = g), r[u] = d, s[u] = g;
    let m = a, E = 0;
    for (; m !== u; )
      E += r[m++], m = m % e;
    if (u = (u + 1) % e, u === a && (a = (a + 1) % e), g - c < n)
      return;
    const _ = y && g - y;
    return _ ? Math.round(E * 1e3 / _) : void 0;
  };
}
function aE(e, n) {
  let r = 0, s = 1e3 / n, u, a;
  const c = (g, y = Date.now()) => {
    r = y, u = null, a && (clearTimeout(a), a = null), e.apply(null, g);
  };
  return [(...g) => {
    const y = Date.now(), m = y - r;
    m >= s ? c(g, y) : (u = g, a || (a = setTimeout(() => {
      a = null, c(u);
    }, s - m)));
  }, () => u && c(u)];
}
const Ss = (e, n, r = 3) => {
  let s = 0;
  const u = uE(50, 250);
  return aE((a) => {
    const c = a.loaded, l = a.lengthComputable ? a.total : void 0, d = c - s, g = u(d), y = c <= l;
    s = c;
    const m = {
      loaded: c,
      total: l,
      progress: l ? c / l : void 0,
      bytes: d,
      rate: g || void 0,
      estimated: g && l && y ? (l - c) / g : void 0,
      event: a,
      lengthComputable: l != null,
      [n ? "download" : "upload"]: !0
    };
    e(m);
  }, r);
}, wl = (e, n) => {
  const r = e != null;
  return [(s) => n[0]({
    lengthComputable: r,
    total: e,
    loaded: s
  }), n[1]];
}, yl = (e) => (...n) => U.asap(() => e(...n)), cE = ge.hasStandardBrowserEnv ? (
  // Standard browser envs have full support of the APIs needed to test
  // whether the request URL is of the same origin as current location.
  function() {
    const n = ge.navigator && /(msie|trident)/i.test(ge.navigator.userAgent), r = document.createElement("a");
    let s;
    function u(a) {
      let c = a;
      return n && (r.setAttribute("href", c), c = r.href), r.setAttribute("href", c), {
        href: r.href,
        protocol: r.protocol ? r.protocol.replace(/:$/, "") : "",
        host: r.host,
        search: r.search ? r.search.replace(/^\?/, "") : "",
        hash: r.hash ? r.hash.replace(/^#/, "") : "",
        hostname: r.hostname,
        port: r.port,
        pathname: r.pathname.charAt(0) === "/" ? r.pathname : "/" + r.pathname
      };
    }
    return s = u(window.location.href), function(c) {
      const l = U.isString(c) ? u(c) : c;
      return l.protocol === s.protocol && l.host === s.host;
    };
  }()
) : (
  // Non standard browser envs (web workers, react-native) lack needed support.
  /* @__PURE__ */ function() {
    return function() {
      return !0;
    };
  }()
), fE = ge.hasStandardBrowserEnv ? (
  // Standard browser envs support document.cookie
  {
    write(e, n, r, s, u, a) {
      const c = [e + "=" + encodeURIComponent(n)];
      U.isNumber(r) && c.push("expires=" + new Date(r).toGMTString()), U.isString(s) && c.push("path=" + s), U.isString(u) && c.push("domain=" + u), a === !0 && c.push("secure"), document.cookie = c.join("; ");
    },
    read(e) {
      const n = document.cookie.match(new RegExp("(^|;\\s*)(" + e + ")=([^;]*)"));
      return n ? decodeURIComponent(n[3]) : null;
    },
    remove(e) {
      this.write(e, "", Date.now() - 864e5);
    }
  }
) : (
  // Non-standard browser env (web workers, react-native) lack needed support.
  {
    write() {
    },
    read() {
      return null;
    },
    remove() {
    }
  }
);
function lE(e) {
  return /^([a-z][a-z\d+\-.]*:)?\/\//i.test(e);
}
function hE(e, n) {
  return n ? e.replace(/\/?\/$/, "") + "/" + n.replace(/^\/+/, "") : e;
}
function mh(e, n) {
  return e && !lE(n) ? hE(e, n) : n;
}
const ml = (e) => e instanceof we ? { ...e } : e;
function sr(e, n) {
  n = n || {};
  const r = {};
  function s(g, y, m) {
    return U.isPlainObject(g) && U.isPlainObject(y) ? U.merge.call({ caseless: m }, g, y) : U.isPlainObject(y) ? U.merge({}, y) : U.isArray(y) ? y.slice() : y;
  }
  function u(g, y, m) {
    if (U.isUndefined(y)) {
      if (!U.isUndefined(g))
        return s(void 0, g, m);
    } else return s(g, y, m);
  }
  function a(g, y) {
    if (!U.isUndefined(y))
      return s(void 0, y);
  }
  function c(g, y) {
    if (U.isUndefined(y)) {
      if (!U.isUndefined(g))
        return s(void 0, g);
    } else return s(void 0, y);
  }
  function l(g, y, m) {
    if (m in n)
      return s(g, y);
    if (m in e)
      return s(void 0, g);
  }
  const d = {
    url: a,
    method: a,
    data: a,
    baseURL: c,
    transformRequest: c,
    transformResponse: c,
    paramsSerializer: c,
    timeout: c,
    timeoutMessage: c,
    withCredentials: c,
    withXSRFToken: c,
    adapter: c,
    responseType: c,
    xsrfCookieName: c,
    xsrfHeaderName: c,
    onUploadProgress: c,
    onDownloadProgress: c,
    decompress: c,
    maxContentLength: c,
    maxBodyLength: c,
    beforeRedirect: c,
    transport: c,
    httpAgent: c,
    httpsAgent: c,
    cancelToken: c,
    socketPath: c,
    responseEncoding: c,
    validateStatus: l,
    headers: (g, y) => u(ml(g), ml(y), !0)
  };
  return U.forEach(Object.keys(Object.assign({}, e, n)), function(y) {
    const m = d[y] || u, E = m(e[y], n[y], y);
    U.isUndefined(E) && m !== l || (r[y] = E);
  }), r;
}
const bh = (e) => {
  const n = sr({}, e);
  let { data: r, withXSRFToken: s, xsrfHeaderName: u, xsrfCookieName: a, headers: c, auth: l } = n;
  n.headers = c = we.from(c), n.url = dh(mh(n.baseURL, n.url), e.params, e.paramsSerializer), l && c.set(
    "Authorization",
    "Basic " + btoa((l.username || "") + ":" + (l.password ? unescape(encodeURIComponent(l.password)) : ""))
  );
  let d;
  if (U.isFormData(r)) {
    if (ge.hasStandardBrowserEnv || ge.hasStandardBrowserWebWorkerEnv)
      c.setContentType(void 0);
    else if ((d = c.getContentType()) !== !1) {
      const [g, ...y] = d ? d.split(";").map((m) => m.trim()).filter(Boolean) : [];
      c.setContentType([g || "multipart/form-data", ...y].join("; "));
    }
  }
  if (ge.hasStandardBrowserEnv && (s && U.isFunction(s) && (s = s(n)), s || s !== !1 && cE(n.url))) {
    const g = u && a && fE.read(a);
    g && c.set(u, g);
  }
  return n;
}, dE = typeof XMLHttpRequest < "u", pE = dE && function(e) {
  return new Promise(function(r, s) {
    const u = bh(e);
    let a = u.data;
    const c = we.from(u.headers).normalize();
    let { responseType: l, onUploadProgress: d, onDownloadProgress: g } = u, y, m, E, _, T;
    function A() {
      _ && _(), T && T(), u.cancelToken && u.cancelToken.unsubscribe(y), u.signal && u.signal.removeEventListener("abort", y);
    }
    let x = new XMLHttpRequest();
    x.open(u.method.toUpperCase(), u.url, !0), x.timeout = u.timeout;
    function B() {
      if (!x)
        return;
      const O = we.from(
        "getAllResponseHeaders" in x && x.getAllResponseHeaders()
      ), D = {
        data: !l || l === "text" || l === "json" ? x.responseText : x.response,
        status: x.status,
        statusText: x.statusText,
        headers: O,
        config: e,
        request: x
      };
      yh(function(M) {
        r(M), A();
      }, function(M) {
        s(M), A();
      }, D), x = null;
    }
    "onloadend" in x ? x.onloadend = B : x.onreadystatechange = function() {
      !x || x.readyState !== 4 || x.status === 0 && !(x.responseURL && x.responseURL.indexOf("file:") === 0) || setTimeout(B);
    }, x.onabort = function() {
      x && (s(new et("Request aborted", et.ECONNABORTED, e, x)), x = null);
    }, x.onerror = function() {
      s(new et("Network Error", et.ERR_NETWORK, e, x)), x = null;
    }, x.ontimeout = function() {
      let F = u.timeout ? "timeout of " + u.timeout + "ms exceeded" : "timeout exceeded";
      const D = u.transitional || ph;
      u.timeoutErrorMessage && (F = u.timeoutErrorMessage), s(new et(
        F,
        D.clarifyTimeoutError ? et.ETIMEDOUT : et.ECONNABORTED,
        e,
        x
      )), x = null;
    }, a === void 0 && c.setContentType(null), "setRequestHeader" in x && U.forEach(c.toJSON(), function(F, D) {
      x.setRequestHeader(D, F);
    }), U.isUndefined(u.withCredentials) || (x.withCredentials = !!u.withCredentials), l && l !== "json" && (x.responseType = u.responseType), g && ([E, T] = Ss(g, !0), x.addEventListener("progress", E)), d && x.upload && ([m, _] = Ss(d), x.upload.addEventListener("progress", m), x.upload.addEventListener("loadend", _)), (u.cancelToken || u.signal) && (y = (O) => {
      x && (s(!O || O.type ? new Fr(null, e, x) : O), x.abort(), x = null);
    }, u.cancelToken && u.cancelToken.subscribe(y), u.signal && (u.signal.aborted ? y() : u.signal.addEventListener("abort", y)));
    const k = oE(u.url);
    if (k && ge.protocols.indexOf(k) === -1) {
      s(new et("Unsupported protocol " + k + ":", et.ERR_BAD_REQUEST, e));
      return;
    }
    x.send(a || null);
  });
}, gE = (e, n) => {
  const { length: r } = e = e ? e.filter(Boolean) : [];
  if (n || r) {
    let s = new AbortController(), u;
    const a = function(g) {
      if (!u) {
        u = !0, l();
        const y = g instanceof Error ? g : this.reason;
        s.abort(y instanceof et ? y : new Fr(y instanceof Error ? y.message : y));
      }
    };
    let c = n && setTimeout(() => {
      c = null, a(new et(`timeout ${n} of ms exceeded`, et.ETIMEDOUT));
    }, n);
    const l = () => {
      e && (c && clearTimeout(c), c = null, e.forEach((g) => {
        g.unsubscribe ? g.unsubscribe(a) : g.removeEventListener("abort", a);
      }), e = null);
    };
    e.forEach((g) => g.addEventListener("abort", a));
    const { signal: d } = s;
    return d.unsubscribe = () => U.asap(l), d;
  }
}, wE = function* (e, n) {
  let r = e.byteLength;
  if (r < n) {
    yield e;
    return;
  }
  let s = 0, u;
  for (; s < r; )
    u = s + n, yield e.slice(s, u), s = u;
}, yE = async function* (e, n) {
  for await (const r of mE(e))
    yield* wE(r, n);
}, mE = async function* (e) {
  if (e[Symbol.asyncIterator]) {
    yield* e;
    return;
  }
  const n = e.getReader();
  try {
    for (; ; ) {
      const { done: r, value: s } = await n.read();
      if (r)
        break;
      yield s;
    }
  } finally {
    await n.cancel();
  }
}, bl = (e, n, r, s) => {
  const u = yE(e, n);
  let a = 0, c, l = (d) => {
    c || (c = !0, s && s(d));
  };
  return new ReadableStream({
    async pull(d) {
      try {
        const { done: g, value: y } = await u.next();
        if (g) {
          l(), d.close();
          return;
        }
        let m = y.byteLength;
        if (r) {
          let E = a += m;
          r(E);
        }
        d.enqueue(new Uint8Array(y));
      } catch (g) {
        throw l(g), g;
      }
    },
    cancel(d) {
      return l(d), u.return();
    }
  }, {
    highWaterMark: 2
  });
}, Ms = typeof fetch == "function" && typeof Request == "function" && typeof Response == "function", Eh = Ms && typeof ReadableStream == "function", bE = Ms && (typeof TextEncoder == "function" ? /* @__PURE__ */ ((e) => (n) => e.encode(n))(new TextEncoder()) : async (e) => new Uint8Array(await new Response(e).arrayBuffer())), xh = (e, ...n) => {
  try {
    return !!e(...n);
  } catch {
    return !1;
  }
}, EE = Eh && xh(() => {
  let e = !1;
  const n = new Request(ge.origin, {
    body: new ReadableStream(),
    method: "POST",
    get duplex() {
      return e = !0, "half";
    }
  }).headers.has("Content-Type");
  return e && !n;
}), El = 64 * 1024, Mu = Eh && xh(() => U.isReadableStream(new Response("").body)), _s = {
  stream: Mu && ((e) => e.body)
};
Ms && ((e) => {
  ["text", "arrayBuffer", "blob", "formData", "stream"].forEach((n) => {
    !_s[n] && (_s[n] = U.isFunction(e[n]) ? (r) => r[n]() : (r, s) => {
      throw new et(`Response type '${n}' is not supported`, et.ERR_NOT_SUPPORT, s);
    });
  });
})(new Response());
const xE = async (e) => {
  if (e == null)
    return 0;
  if (U.isBlob(e))
    return e.size;
  if (U.isSpecCompliantForm(e))
    return (await new Request(ge.origin, {
      method: "POST",
      body: e
    }).arrayBuffer()).byteLength;
  if (U.isArrayBufferView(e) || U.isArrayBuffer(e))
    return e.byteLength;
  if (U.isURLSearchParams(e) && (e = e + ""), U.isString(e))
    return (await bE(e)).byteLength;
}, SE = async (e, n) => {
  const r = U.toFiniteNumber(e.getContentLength());
  return r ?? xE(n);
}, _E = Ms && (async (e) => {
  let {
    url: n,
    method: r,
    data: s,
    signal: u,
    cancelToken: a,
    timeout: c,
    onDownloadProgress: l,
    onUploadProgress: d,
    responseType: g,
    headers: y,
    withCredentials: m = "same-origin",
    fetchOptions: E
  } = bh(e);
  g = g ? (g + "").toLowerCase() : "text";
  let _ = gE([u, a && a.toAbortSignal()], c), T;
  const A = _ && _.unsubscribe && (() => {
    _.unsubscribe();
  });
  let x;
  try {
    if (d && EE && r !== "get" && r !== "head" && (x = await SE(y, s)) !== 0) {
      let D = new Request(n, {
        method: "POST",
        body: s,
        duplex: "half"
      }), W;
      if (U.isFormData(s) && (W = D.headers.get("content-type")) && y.setContentType(W), D.body) {
        const [M, G] = wl(
          x,
          Ss(yl(d))
        );
        s = bl(D.body, El, M, G);
      }
    }
    U.isString(m) || (m = m ? "include" : "omit");
    const B = "credentials" in Request.prototype;
    T = new Request(n, {
      ...E,
      signal: _,
      method: r.toUpperCase(),
      headers: y.normalize().toJSON(),
      body: s,
      duplex: "half",
      credentials: B ? m : void 0
    });
    let k = await fetch(T);
    const O = Mu && (g === "stream" || g === "response");
    if (Mu && (l || O && A)) {
      const D = {};
      ["status", "statusText", "headers"].forEach((J) => {
        D[J] = k[J];
      });
      const W = U.toFiniteNumber(k.headers.get("content-length")), [M, G] = l && wl(
        W,
        Ss(yl(l), !0)
      ) || [];
      k = new Response(
        bl(k.body, El, M, () => {
          G && G(), A && A();
        }),
        D
      );
    }
    g = g || "text";
    let F = await _s[U.findKey(_s, g) || "text"](k, e);
    return !O && A && A(), await new Promise((D, W) => {
      yh(D, W, {
        data: F,
        headers: we.from(k.headers),
        status: k.status,
        statusText: k.statusText,
        config: e,
        request: T
      });
    });
  } catch (B) {
    throw A && A(), B && B.name === "TypeError" && /fetch/i.test(B.message) ? Object.assign(
      new et("Network Error", et.ERR_NETWORK, e, T),
      {
        cause: B.cause || B
      }
    ) : et.from(B, B && B.code, e, T);
  }
}), Hu = {
  http: Fb,
  xhr: pE,
  fetch: _E
};
U.forEach(Hu, (e, n) => {
  if (e) {
    try {
      Object.defineProperty(e, "name", { value: n });
    } catch {
    }
    Object.defineProperty(e, "adapterName", { value: n });
  }
});
const xl = (e) => `- ${e}`, AE = (e) => U.isFunction(e) || e === null || e === !1, Sh = {
  getAdapter: (e) => {
    e = U.isArray(e) ? e : [e];
    const { length: n } = e;
    let r, s;
    const u = {};
    for (let a = 0; a < n; a++) {
      r = e[a];
      let c;
      if (s = r, !AE(r) && (s = Hu[(c = String(r)).toLowerCase()], s === void 0))
        throw new et(`Unknown adapter '${c}'`);
      if (s)
        break;
      u[c || "#" + a] = s;
    }
    if (!s) {
      const a = Object.entries(u).map(
        ([l, d]) => `adapter ${l} ` + (d === !1 ? "is not supported by the environment" : "is not available in the build")
      );
      let c = n ? a.length > 1 ? `since :
` + a.map(xl).join(`
`) : " " + xl(a[0]) : "as no adapter specified";
      throw new et(
        "There is no suitable adapter to dispatch the request " + c,
        "ERR_NOT_SUPPORT"
      );
    }
    return s;
  },
  adapters: Hu
};
function Tu(e) {
  if (e.cancelToken && e.cancelToken.throwIfRequested(), e.signal && e.signal.aborted)
    throw new Fr(null, e);
}
function Sl(e) {
  return Tu(e), e.headers = we.from(e.headers), e.data = vu.call(
    e,
    e.transformRequest
  ), ["post", "put", "patch"].indexOf(e.method) !== -1 && e.headers.setContentType("application/x-www-form-urlencoded", !1), Sh.getAdapter(e.adapter || yi.adapter)(e).then(function(s) {
    return Tu(e), s.data = vu.call(
      e,
      e.transformResponse,
      s
    ), s.headers = we.from(s.headers), s;
  }, function(s) {
    return wh(s) || (Tu(e), s && s.response && (s.response.data = vu.call(
      e,
      e.transformResponse,
      s.response
    ), s.response.headers = we.from(s.response.headers))), Promise.reject(s);
  });
}
const _h = "1.7.7", fa = {};
["object", "boolean", "number", "function", "string", "symbol"].forEach((e, n) => {
  fa[e] = function(s) {
    return typeof s === e || "a" + (n < 1 ? "n " : " ") + e;
  };
});
const _l = {};
fa.transitional = function(n, r, s) {
  function u(a, c) {
    return "[Axios v" + _h + "] Transitional option '" + a + "'" + c + (s ? ". " + s : "");
  }
  return (a, c, l) => {
    if (n === !1)
      throw new et(
        u(c, " has been removed" + (r ? " in " + r : "")),
        et.ERR_DEPRECATED
      );
    return r && !_l[c] && (_l[c] = !0, console.warn(
      u(
        c,
        " has been deprecated since v" + r + " and will be removed in the near future"
      )
    )), n ? n(a, c, l) : !0;
  };
};
function vE(e, n, r) {
  if (typeof e != "object")
    throw new et("options must be an object", et.ERR_BAD_OPTION_VALUE);
  const s = Object.keys(e);
  let u = s.length;
  for (; u-- > 0; ) {
    const a = s[u], c = n[a];
    if (c) {
      const l = e[a], d = l === void 0 || c(l, a, e);
      if (d !== !0)
        throw new et("option " + a + " must be " + d, et.ERR_BAD_OPTION_VALUE);
      continue;
    }
    if (r !== !0)
      throw new et("Unknown option " + a, et.ERR_BAD_OPTION);
  }
}
const qu = {
  assertOptions: vE,
  validators: fa
}, Cn = qu.validators;
class ir {
  constructor(n) {
    this.defaults = n, this.interceptors = {
      request: new pl(),
      response: new pl()
    };
  }
  /**
   * Dispatch a request
   *
   * @param {String|Object} configOrUrl The config specific for this request (merged with this.defaults)
   * @param {?Object} config
   *
   * @returns {Promise} The Promise to be fulfilled
   */
  async request(n, r) {
    try {
      return await this._request(n, r);
    } catch (s) {
      if (s instanceof Error) {
        let u;
        Error.captureStackTrace ? Error.captureStackTrace(u = {}) : u = new Error();
        const a = u.stack ? u.stack.replace(/^.+\n/, "") : "";
        try {
          s.stack ? a && !String(s.stack).endsWith(a.replace(/^.+\n.+\n/, "")) && (s.stack += `
` + a) : s.stack = a;
        } catch {
        }
      }
      throw s;
    }
  }
  _request(n, r) {
    typeof n == "string" ? (r = r || {}, r.url = n) : r = n || {}, r = sr(this.defaults, r);
    const { transitional: s, paramsSerializer: u, headers: a } = r;
    s !== void 0 && qu.assertOptions(s, {
      silentJSONParsing: Cn.transitional(Cn.boolean),
      forcedJSONParsing: Cn.transitional(Cn.boolean),
      clarifyTimeoutError: Cn.transitional(Cn.boolean)
    }, !1), u != null && (U.isFunction(u) ? r.paramsSerializer = {
      serialize: u
    } : qu.assertOptions(u, {
      encode: Cn.function,
      serialize: Cn.function
    }, !0)), r.method = (r.method || this.defaults.method || "get").toLowerCase();
    let c = a && U.merge(
      a.common,
      a[r.method]
    );
    a && U.forEach(
      ["delete", "get", "head", "post", "put", "patch", "common"],
      (T) => {
        delete a[T];
      }
    ), r.headers = we.concat(c, a);
    const l = [];
    let d = !0;
    this.interceptors.request.forEach(function(A) {
      typeof A.runWhen == "function" && A.runWhen(r) === !1 || (d = d && A.synchronous, l.unshift(A.fulfilled, A.rejected));
    });
    const g = [];
    this.interceptors.response.forEach(function(A) {
      g.push(A.fulfilled, A.rejected);
    });
    let y, m = 0, E;
    if (!d) {
      const T = [Sl.bind(this), void 0];
      for (T.unshift.apply(T, l), T.push.apply(T, g), E = T.length, y = Promise.resolve(r); m < E; )
        y = y.then(T[m++], T[m++]);
      return y;
    }
    E = l.length;
    let _ = r;
    for (m = 0; m < E; ) {
      const T = l[m++], A = l[m++];
      try {
        _ = T(_);
      } catch (x) {
        A.call(this, x);
        break;
      }
    }
    try {
      y = Sl.call(this, _);
    } catch (T) {
      return Promise.reject(T);
    }
    for (m = 0, E = g.length; m < E; )
      y = y.then(g[m++], g[m++]);
    return y;
  }
  getUri(n) {
    n = sr(this.defaults, n);
    const r = mh(n.baseURL, n.url);
    return dh(r, n.params, n.paramsSerializer);
  }
}
U.forEach(["delete", "get", "head", "options"], function(n) {
  ir.prototype[n] = function(r, s) {
    return this.request(sr(s || {}, {
      method: n,
      url: r,
      data: (s || {}).data
    }));
  };
});
U.forEach(["post", "put", "patch"], function(n) {
  function r(s) {
    return function(a, c, l) {
      return this.request(sr(l || {}, {
        method: n,
        headers: s ? {
          "Content-Type": "multipart/form-data"
        } : {},
        url: a,
        data: c
      }));
    };
  }
  ir.prototype[n] = r(), ir.prototype[n + "Form"] = r(!0);
});
class la {
  constructor(n) {
    if (typeof n != "function")
      throw new TypeError("executor must be a function.");
    let r;
    this.promise = new Promise(function(a) {
      r = a;
    });
    const s = this;
    this.promise.then((u) => {
      if (!s._listeners) return;
      let a = s._listeners.length;
      for (; a-- > 0; )
        s._listeners[a](u);
      s._listeners = null;
    }), this.promise.then = (u) => {
      let a;
      const c = new Promise((l) => {
        s.subscribe(l), a = l;
      }).then(u);
      return c.cancel = function() {
        s.unsubscribe(a);
      }, c;
    }, n(function(a, c, l) {
      s.reason || (s.reason = new Fr(a, c, l), r(s.reason));
    });
  }
  /**
   * Throws a `CanceledError` if cancellation has been requested.
   */
  throwIfRequested() {
    if (this.reason)
      throw this.reason;
  }
  /**
   * Subscribe to the cancel signal
   */
  subscribe(n) {
    if (this.reason) {
      n(this.reason);
      return;
    }
    this._listeners ? this._listeners.push(n) : this._listeners = [n];
  }
  /**
   * Unsubscribe from the cancel signal
   */
  unsubscribe(n) {
    if (!this._listeners)
      return;
    const r = this._listeners.indexOf(n);
    r !== -1 && this._listeners.splice(r, 1);
  }
  toAbortSignal() {
    const n = new AbortController(), r = (s) => {
      n.abort(s);
    };
    return this.subscribe(r), n.signal.unsubscribe = () => this.unsubscribe(r), n.signal;
  }
  /**
   * Returns an object that contains a new `CancelToken` and a function that, when called,
   * cancels the `CancelToken`.
   */
  static source() {
    let n;
    return {
      token: new la(function(u) {
        n = u;
      }),
      cancel: n
    };
  }
}
function TE(e) {
  return function(r) {
    return e.apply(null, r);
  };
}
function IE(e) {
  return U.isObject(e) && e.isAxiosError === !0;
}
const Ku = {
  Continue: 100,
  SwitchingProtocols: 101,
  Processing: 102,
  EarlyHints: 103,
  Ok: 200,
  Created: 201,
  Accepted: 202,
  NonAuthoritativeInformation: 203,
  NoContent: 204,
  ResetContent: 205,
  PartialContent: 206,
  MultiStatus: 207,
  AlreadyReported: 208,
  ImUsed: 226,
  MultipleChoices: 300,
  MovedPermanently: 301,
  Found: 302,
  SeeOther: 303,
  NotModified: 304,
  UseProxy: 305,
  Unused: 306,
  TemporaryRedirect: 307,
  PermanentRedirect: 308,
  BadRequest: 400,
  Unauthorized: 401,
  PaymentRequired: 402,
  Forbidden: 403,
  NotFound: 404,
  MethodNotAllowed: 405,
  NotAcceptable: 406,
  ProxyAuthenticationRequired: 407,
  RequestTimeout: 408,
  Conflict: 409,
  Gone: 410,
  LengthRequired: 411,
  PreconditionFailed: 412,
  PayloadTooLarge: 413,
  UriTooLong: 414,
  UnsupportedMediaType: 415,
  RangeNotSatisfiable: 416,
  ExpectationFailed: 417,
  ImATeapot: 418,
  MisdirectedRequest: 421,
  UnprocessableEntity: 422,
  Locked: 423,
  FailedDependency: 424,
  TooEarly: 425,
  UpgradeRequired: 426,
  PreconditionRequired: 428,
  TooManyRequests: 429,
  RequestHeaderFieldsTooLarge: 431,
  UnavailableForLegalReasons: 451,
  InternalServerError: 500,
  NotImplemented: 501,
  BadGateway: 502,
  ServiceUnavailable: 503,
  GatewayTimeout: 504,
  HttpVersionNotSupported: 505,
  VariantAlsoNegotiates: 506,
  InsufficientStorage: 507,
  LoopDetected: 508,
  NotExtended: 510,
  NetworkAuthenticationRequired: 511
};
Object.entries(Ku).forEach(([e, n]) => {
  Ku[n] = e;
});
function Ah(e) {
  const n = new ir(e), r = eh(ir.prototype.request, n);
  return U.extend(r, ir.prototype, n, { allOwnKeys: !0 }), U.extend(r, n, null, { allOwnKeys: !0 }), r.create = function(u) {
    return Ah(sr(e, u));
  }, r;
}
const Ct = Ah(yi);
Ct.Axios = ir;
Ct.CanceledError = Fr;
Ct.CancelToken = la;
Ct.isCancel = wh;
Ct.VERSION = _h;
Ct.toFormData = Ws;
Ct.AxiosError = et;
Ct.Cancel = Ct.CanceledError;
Ct.all = function(n) {
  return Promise.all(n);
};
Ct.spread = TE;
Ct.isAxiosError = IE;
Ct.mergeConfig = sr;
Ct.AxiosHeaders = we;
Ct.formToJSON = (e) => gh(U.isHTMLForm(e) ? new FormData(e) : e);
Ct.getAdapter = Sh.getAdapter;
Ct.HttpStatusCode = Ku;
Ct.default = Ct;
class BE {
  constructor(n) {
    Wt(this, "cache", null);
    Wt(this, "lastFetchTime", 0);
    Wt(this, "cacheDuration", 1e4);
    this.url = n;
  }
  async getRecommendedFee(n) {
    return (await this.getRecommendedFees())[n];
  }
  async getRecommendedFees() {
    const n = Date.now();
    if (this.cache && n - this.lastFetchTime < this.cacheDuration)
      return this.cache;
    const r = await Ct.get(
      `${this.url}/v1/fees/recommended`
    );
    return this.cache = r.data, this.lastFetchTime = n, this.cache;
  }
}
/*! scure-base - MIT License (c) 2022 Paul Miller (paulmillr.com) */
function As(e) {
  return e instanceof Uint8Array || e != null && typeof e == "object" && e.constructor.name === "Uint8Array";
}
// @__NO_SIDE_EFFECTS__
function mi(...e) {
  const n = (a) => a, r = (a, c) => (l) => a(c(l)), s = e.map((a) => a.encode).reduceRight(r, n), u = e.map((a) => a.decode).reduce(r, n);
  return { encode: s, decode: u };
}
// @__NO_SIDE_EFFECTS__
function Hs(e) {
  return {
    encode: (n) => {
      if (!Array.isArray(n) || n.length && typeof n[0] != "number")
        throw new Error("alphabet.encode input should be an array of numbers");
      return n.map((r) => {
        if (r < 0 || r >= e.length)
          throw new Error(`Digit index outside alphabet: ${r} (alphabet: ${e.length})`);
        return e[r];
      });
    },
    decode: (n) => {
      if (!Array.isArray(n) || n.length && typeof n[0] != "string")
        throw new Error("alphabet.decode input should be array of strings");
      return n.map((r) => {
        if (typeof r != "string")
          throw new Error(`alphabet.decode: not string element=${r}`);
        const s = e.indexOf(r);
        if (s === -1)
          throw new Error(`Unknown letter: "${r}". Allowed: ${e}`);
        return s;
      });
    }
  };
}
// @__NO_SIDE_EFFECTS__
function qs(e = "") {
  if (typeof e != "string")
    throw new Error("join separator should be string");
  return {
    encode: (n) => {
      if (!Array.isArray(n) || n.length && typeof n[0] != "string")
        throw new Error("join.encode input should be array of strings");
      for (let r of n)
        if (typeof r != "string")
          throw new Error(`join.encode: non-string input=${r}`);
      return n.join(e);
    },
    decode: (n) => {
      if (typeof n != "string")
        throw new Error("join.decode input should be string");
      return n.split(e);
    }
  };
}
// @__NO_SIDE_EFFECTS__
function RE(e, n = "=") {
  if (typeof n != "string")
    throw new Error("padding chr should be string");
  return {
    encode(r) {
      if (!Array.isArray(r) || r.length && typeof r[0] != "string")
        throw new Error("padding.encode input should be array of strings");
      for (let s of r)
        if (typeof s != "string")
          throw new Error(`padding.encode: non-string input=${s}`);
      for (; r.length * e % 8; )
        r.push(n);
      return r;
    },
    decode(r) {
      if (!Array.isArray(r) || r.length && typeof r[0] != "string")
        throw new Error("padding.encode input should be array of strings");
      for (let u of r)
        if (typeof u != "string")
          throw new Error(`padding.decode: non-string input=${u}`);
      let s = r.length;
      if (s * e % 8)
        throw new Error("Invalid padding: string should have whole number of bytes");
      for (; s > 0 && r[s - 1] === n; s--)
        if (!((s - 1) * e % 8))
          throw new Error("Invalid padding: string has too much padding");
      return r.slice(0, s);
    }
  };
}
// @__NO_SIDE_EFFECTS__
function UE(e) {
  if (typeof e != "function")
    throw new Error("normalize fn should be function");
  return { encode: (n) => n, decode: (n) => e(n) };
}
// @__NO_SIDE_EFFECTS__
function Al(e, n, r) {
  if (n < 2)
    throw new Error(`convertRadix: wrong from=${n}, base cannot be less than 2`);
  if (r < 2)
    throw new Error(`convertRadix: wrong to=${r}, base cannot be less than 2`);
  if (!Array.isArray(e))
    throw new Error("convertRadix: data should be array");
  if (!e.length)
    return [];
  let s = 0;
  const u = [], a = Array.from(e);
  for (a.forEach((c) => {
    if (c < 0 || c >= n)
      throw new Error(`Wrong integer: ${c}`);
  }); ; ) {
    let c = 0, l = !0;
    for (let d = s; d < a.length; d++) {
      const g = a[d], y = n * c + g;
      if (!Number.isSafeInteger(y) || n * c / n !== c || y - g !== n * c)
        throw new Error("convertRadix: carry overflow");
      c = y % r;
      const m = Math.floor(y / r);
      if (a[d] = m, !Number.isSafeInteger(m) || m * r + c !== y)
        throw new Error("convertRadix: carry overflow");
      if (l)
        m ? l = !1 : s = d;
      else continue;
    }
    if (u.push(c), l)
      break;
  }
  for (let c = 0; c < e.length - 1 && e[c] === 0; c++)
    u.push(0);
  return u.reverse();
}
const vh = /* @__NO_SIDE_EFFECTS__ */ (e, n) => n ? /* @__PURE__ */ vh(n, e % n) : e, vs = /* @__NO_SIDE_EFFECTS__ */ (e, n) => e + (n - /* @__PURE__ */ vh(e, n));
// @__NO_SIDE_EFFECTS__
function zu(e, n, r, s) {
  if (!Array.isArray(e))
    throw new Error("convertRadix2: data should be array");
  if (n <= 0 || n > 32)
    throw new Error(`convertRadix2: wrong from=${n}`);
  if (r <= 0 || r > 32)
    throw new Error(`convertRadix2: wrong to=${r}`);
  if (/* @__PURE__ */ vs(n, r) > 32)
    throw new Error(`convertRadix2: carry overflow from=${n} to=${r} carryBits=${/* @__PURE__ */ vs(n, r)}`);
  let u = 0, a = 0;
  const c = 2 ** r - 1, l = [];
  for (const d of e) {
    if (d >= 2 ** n)
      throw new Error(`convertRadix2: invalid data word=${d} from=${n}`);
    if (u = u << n | d, a + n > 32)
      throw new Error(`convertRadix2: carry overflow pos=${a} from=${n}`);
    for (a += n; a >= r; a -= r)
      l.push((u >> a - r & c) >>> 0);
    u &= 2 ** a - 1;
  }
  if (u = u << r - a & c, !s && a >= n)
    throw new Error("Excess padding");
  if (!s && u)
    throw new Error(`Non-zero padding: ${u}`);
  return s && a > 0 && l.push(u >>> 0), l;
}
// @__NO_SIDE_EFFECTS__
function LE(e) {
  return {
    encode: (n) => {
      if (!As(n))
        throw new Error("radix.encode input should be Uint8Array");
      return /* @__PURE__ */ Al(Array.from(n), 2 ** 8, e);
    },
    decode: (n) => {
      if (!Array.isArray(n) || n.length && typeof n[0] != "number")
        throw new Error("radix.decode input should be array of numbers");
      return Uint8Array.from(/* @__PURE__ */ Al(n, e, 2 ** 8));
    }
  };
}
// @__NO_SIDE_EFFECTS__
function ha(e, n = !1) {
  if (e <= 0 || e > 32)
    throw new Error("radix2: bits should be in (0..32]");
  if (/* @__PURE__ */ vs(8, e) > 32 || /* @__PURE__ */ vs(e, 8) > 32)
    throw new Error("radix2: carry overflow");
  return {
    encode: (r) => {
      if (!As(r))
        throw new Error("radix2.encode input should be Uint8Array");
      return /* @__PURE__ */ zu(Array.from(r), 8, e, !n);
    },
    decode: (r) => {
      if (!Array.isArray(r) || r.length && typeof r[0] != "number")
        throw new Error("radix2.decode input should be array of numbers");
      return Uint8Array.from(/* @__PURE__ */ zu(r, e, 8, n));
    }
  };
}
// @__NO_SIDE_EFFECTS__
function vl(e) {
  if (typeof e != "function")
    throw new Error("unsafeWrapper fn should be function");
  return function(...n) {
    try {
      return e.apply(null, n);
    } catch {
    }
  };
}
// @__NO_SIDE_EFFECTS__
function CE(e, n) {
  if (typeof n != "function")
    throw new Error("checksum fn should be function");
  return {
    encode(r) {
      if (!As(r))
        throw new Error("checksum.encode: input should be Uint8Array");
      const s = n(r).slice(0, e), u = new Uint8Array(r.length + e);
      return u.set(r), u.set(s, r.length), u;
    },
    decode(r) {
      if (!As(r))
        throw new Error("checksum.decode: input should be Uint8Array");
      const s = r.slice(0, -e), u = n(s).slice(0, e), a = r.slice(-e);
      for (let c = 0; c < e; c++)
        if (u[c] !== a[c])
          throw new Error("Invalid checksum");
      return s;
    }
  };
}
const wn = /* @__PURE__ */ mi(/* @__PURE__ */ ha(6), /* @__PURE__ */ Hs("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"), /* @__PURE__ */ RE(6), /* @__PURE__ */ qs("")), NE = (e) => /* @__PURE__ */ mi(/* @__PURE__ */ LE(58), /* @__PURE__ */ Hs(e), /* @__PURE__ */ qs("")), kE = /* @__PURE__ */ NE("123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"), OE = (e) => /* @__PURE__ */ mi(/* @__PURE__ */ CE(4, (n) => e(e(n))), kE), Vu = /* @__PURE__ */ mi(/* @__PURE__ */ Hs("qpzry9x8gf2tvdw0s3jn54khce6mua7l"), /* @__PURE__ */ qs("")), Tl = [996825010, 642813549, 513874426, 1027748829, 705979059];
// @__NO_SIDE_EFFECTS__
function ui(e) {
  const n = e >> 25;
  let r = (e & 33554431) << 5;
  for (let s = 0; s < Tl.length; s++)
    (n >> s & 1) === 1 && (r ^= Tl[s]);
  return r;
}
// @__NO_SIDE_EFFECTS__
function Il(e, n, r = 1) {
  const s = e.length;
  let u = 1;
  for (let a = 0; a < s; a++) {
    const c = e.charCodeAt(a);
    if (c < 33 || c > 126)
      throw new Error(`Invalid prefix (${e})`);
    u = /* @__PURE__ */ ui(u) ^ c >> 5;
  }
  u = /* @__PURE__ */ ui(u);
  for (let a = 0; a < s; a++)
    u = /* @__PURE__ */ ui(u) ^ e.charCodeAt(a) & 31;
  for (let a of n)
    u = /* @__PURE__ */ ui(u) ^ a;
  for (let a = 0; a < 6; a++)
    u = /* @__PURE__ */ ui(u);
  return u ^= r, Vu.encode(/* @__PURE__ */ zu([u % 2 ** 30], 30, 5, !1));
}
// @__NO_SIDE_EFFECTS__
function Th(e) {
  const n = e === "bech32" ? 1 : 734539939, r = /* @__PURE__ */ ha(5), s = r.decode, u = r.encode, a = /* @__PURE__ */ vl(s);
  function c(m, E, _ = 90) {
    if (typeof m != "string")
      throw new Error(`bech32.encode prefix should be string, not ${typeof m}`);
    if (E instanceof Uint8Array && (E = Array.from(E)), !Array.isArray(E) || E.length && typeof E[0] != "number")
      throw new Error(`bech32.encode words should be array of numbers, not ${typeof E}`);
    if (m.length === 0)
      throw new TypeError(`Invalid prefix length ${m.length}`);
    const T = m.length + 7 + E.length;
    if (_ !== !1 && T > _)
      throw new TypeError(`Length ${T} exceeds limit ${_}`);
    const A = m.toLowerCase(), x = /* @__PURE__ */ Il(A, E, n);
    return `${A}1${Vu.encode(E)}${x}`;
  }
  function l(m, E = 90) {
    if (typeof m != "string")
      throw new Error(`bech32.decode input should be string, not ${typeof m}`);
    if (m.length < 8 || E !== !1 && m.length > E)
      throw new TypeError(`Wrong string length: ${m.length} (${m}). Expected (8..${E})`);
    const _ = m.toLowerCase();
    if (m !== _ && m !== m.toUpperCase())
      throw new Error("String must be lowercase or uppercase");
    const T = _.lastIndexOf("1");
    if (T === 0 || T === -1)
      throw new Error('Letter "1" must be present between prefix and data only');
    const A = _.slice(0, T), x = _.slice(T + 1);
    if (x.length < 6)
      throw new Error("Data must be at least 6 characters long");
    const B = Vu.decode(x).slice(0, -6), k = /* @__PURE__ */ Il(A, B, n);
    if (!x.endsWith(k))
      throw new Error(`Invalid checksum in ${m}: expected "${k}"`);
    return { prefix: A, words: B };
  }
  const d = /* @__PURE__ */ vl(l);
  function g(m) {
    const { prefix: E, words: _ } = l(m, !1);
    return { prefix: E, words: _, bytes: s(_) };
  }
  function y(m, E) {
    return c(m, u(E));
  }
  return {
    encode: c,
    decode: l,
    encodeFromBytes: y,
    decodeToBytes: g,
    decodeUnsafe: d,
    fromWords: s,
    fromWordsUnsafe: a,
    toWords: u
  };
}
const Gu = /* @__PURE__ */ Th("bech32"), Ih = /* @__PURE__ */ Th("bech32m"), $E = {
  encode: (e) => new TextDecoder().decode(e),
  decode: (e) => new TextEncoder().encode(e)
}, dt = /* @__PURE__ */ mi(/* @__PURE__ */ ha(4), /* @__PURE__ */ Hs("0123456789abcdef"), /* @__PURE__ */ qs(""), /* @__PURE__ */ UE((e) => {
  if (typeof e != "string" || e.length % 2)
    throw new TypeError(`hex.decode: expected string, got ${typeof e} with length ${e.length}`);
  return e.toLowerCase();
})), gt = /* @__PURE__ */ new Uint8Array(), Bh = /* @__PURE__ */ new Uint8Array([0]);
function Cr(e, n) {
  if (e.length !== n.length)
    return !1;
  for (let r = 0; r < e.length; r++)
    if (e[r] !== n[r])
      return !1;
  return !0;
}
function Me(e) {
  return e instanceof Uint8Array || e != null && typeof e == "object" && e.constructor.name === "Uint8Array";
}
function DE(...e) {
  let n = 0;
  for (let s = 0; s < e.length; s++) {
    const u = e[s];
    if (!Me(u))
      throw new Error("Uint8Array expected");
    n += u.length;
  }
  const r = new Uint8Array(n);
  for (let s = 0, u = 0; s < e.length; s++) {
    const a = e[s];
    r.set(a, u), u += a.length;
  }
  return r;
}
const da = (e) => new DataView(e.buffer, e.byteOffset, e.byteLength);
function Pr(e) {
  return Object.prototype.toString.call(e) === "[object Object]";
}
function nn(e) {
  return Number.isSafeInteger(e);
}
const FE = {
  equalBytes: Cr,
  isBytes: Me,
  isCoder: He,
  checkBounds: Uh,
  concatBytes: DE,
  createView: da,
  isPlainObject: Pr
}, Rh = (e) => {
  if (e !== null && typeof e != "string" && !He(e) && !Me(e) && !nn(e))
    throw new Error(`lengthCoder: expected null | number | Uint8Array | CoderType, got ${e} (${typeof e})`);
  return {
    encodeStream(n, r) {
      if (e === null)
        return;
      if (He(e))
        return e.encodeStream(n, r);
      let s;
      if (typeof e == "number" ? s = e : typeof e == "string" && (s = En.resolve(n.stack, e)), typeof s == "bigint" && (s = Number(s)), s === void 0 || s !== r)
        throw n.err(`Wrong length: ${s} len=${e} exp=${r} (${typeof r})`);
    },
    decodeStream(n) {
      let r;
      if (He(e) ? r = Number(e.decodeStream(n)) : typeof e == "number" ? r = e : typeof e == "string" && (r = En.resolve(n.stack, e)), typeof r == "bigint" && (r = Number(r)), typeof r != "number")
        throw n.err(`Wrong length: ${r}`);
      return r;
    }
  };
}, Mt = {
  BITS: 32,
  FULL_MASK: -1 >>> 0,
  // 1<<32 will overflow
  len: (e) => Math.ceil(e / 32),
  create: (e) => new Uint32Array(Mt.len(e)),
  clean: (e) => e.fill(0),
  debug: (e) => Array.from(e).map((n) => (n >>> 0).toString(2).padStart(32, "0")),
  checkLen: (e, n) => {
    if (Mt.len(n) !== e.length)
      throw new Error(`wrong length=${e.length}. Expected: ${Mt.len(n)}`);
  },
  chunkLen: (e, n, r) => {
    if (n < 0)
      throw new Error(`wrong pos=${n}`);
    if (n + r > e)
      throw new Error(`wrong range=${n}/${r} of ${e}`);
  },
  set: (e, n, r, s = !0) => !s && e[n] & r ? !1 : (e[n] |= r, !0),
  pos: (e, n) => ({
    chunk: Math.floor((e + n) / 32),
    mask: 1 << 32 - (e + n) % 32 - 1
  }),
  indices: (e, n, r = !1) => {
    Mt.checkLen(e, n);
    const { FULL_MASK: s, BITS: u } = Mt, a = u - n % u, c = a ? s >>> a << a : s, l = [];
    for (let d = 0; d < e.length; d++) {
      let g = e[d];
      if (r && (g = ~g), d === e.length - 1 && (g &= c), g !== 0)
        for (let y = 0; y < u; y++) {
          const m = 1 << u - y - 1;
          g & m && l.push(d * u + y);
        }
    }
    return l;
  },
  range: (e) => {
    const n = [];
    let r;
    for (const s of e)
      r === void 0 || s !== r.pos + r.length ? n.push(r = { pos: s, length: 1 }) : r.length += 1;
    return n;
  },
  rangeDebug: (e, n, r = !1) => `[${Mt.range(Mt.indices(e, n, r)).map((s) => `(${s.pos}/${s.length})`).join(", ")}]`,
  setRange: (e, n, r, s, u = !0) => {
    Mt.chunkLen(n, r, s);
    const { FULL_MASK: a, BITS: c } = Mt, l = r % c ? Math.floor(r / c) : void 0, d = r + s, g = d % c ? Math.floor(d / c) : void 0;
    if (l !== void 0 && l === g)
      return Mt.set(e, l, a >>> c - s << c - s - r, u);
    if (l !== void 0 && !Mt.set(e, l, a >>> r % c, u))
      return !1;
    const y = l !== void 0 ? l + 1 : r / c, m = g !== void 0 ? g : d / c;
    for (let E = y; E < m; E++)
      if (!Mt.set(e, E, a, u))
        return !1;
    return !(g !== void 0 && l !== g && !Mt.set(e, g, a << c - d % c, u));
  }
}, En = {
  /**
   * Internal method for handling stack of paths (debug, errors, dynamic fields via path)
   * This is looks ugly (callback), but allows us to force stack cleaning by construction (.pop always after function).
   * Also, this makes impossible:
   * - pushing field when stack is empty
   * - pushing field inside of field (real bug)
   * NOTE: we don't want to do '.pop' on error!
   */
  pushObj: (e, n, r) => {
    const s = { obj: n };
    e.push(s), r((u, a) => {
      s.field = u, a(), s.field = void 0;
    }), e.pop();
  },
  path: (e) => {
    const n = [];
    for (const r of e)
      r.field !== void 0 && n.push(r.field);
    return n.join("/");
  },
  err(e, n, r) {
    const s = new Error(`${e}(${En.path(n)}): ${typeof r == "string" ? r : r.message}`);
    return r instanceof Error && r.stack && (s.stack = r.stack), s;
  },
  resolve: (e, n) => {
    const r = n.split("/"), s = e.map((c) => c.obj);
    let u = 0;
    for (; u < r.length && r[u] === ".."; u++)
      s.pop();
    let a = s.pop();
    for (; u < r.length; u++) {
      if (!a || a[r[u]] === void 0)
        return;
      a = a[r[u]];
    }
    return a;
  }
};
class pa {
  constructor(n, r = {}, s = [], u = void 0, a = 0) {
    this.data = n, this.opts = r, this.stack = s, this.parent = u, this.parentOffset = a, this.pos = 0, this.bitBuf = 0, this.bitPos = 0, this.view = da(n);
  }
  /**
   * Internal method for pointers.
   */
  _enablePointers() {
    if (this.parent)
      return this.parent._enablePointers();
    this.bs || (this.bs = Mt.create(this.data.length), Mt.setRange(this.bs, this.data.length, 0, this.pos, this.opts.allowMultipleReads));
  }
  markBytesBS(n, r) {
    return this.parent ? this.parent.markBytesBS(this.parentOffset + n, r) : !r || !this.bs ? !0 : Mt.setRange(this.bs, this.data.length, n, r, !1);
  }
  markBytes(n) {
    const r = this.pos;
    this.pos += n;
    const s = this.markBytesBS(r, n);
    if (!this.opts.allowMultipleReads && !s)
      throw this.err(`multiple read pos=${this.pos} len=${n}`);
    return s;
  }
  pushObj(n, r) {
    return En.pushObj(this.stack, n, r);
  }
  readView(n, r) {
    if (!Number.isFinite(n))
      throw this.err(`readView: wrong length=${n}`);
    if (this.pos + n > this.data.length)
      throw this.err("readView: Unexpected end of buffer");
    const s = r(this.view, this.pos);
    return this.markBytes(n), s;
  }
  // read bytes by absolute offset
  absBytes(n) {
    if (n > this.data.length)
      throw new Error("Unexpected end of buffer");
    return this.data.subarray(n);
  }
  finish() {
    if (!this.opts.allowUnreadBytes) {
      if (this.bitPos)
        throw this.err(`${this.bitPos} bits left after unpack: ${dt.encode(this.data.slice(this.pos))}`);
      if (this.bs && !this.parent) {
        const n = Mt.indices(this.bs, this.data.length, !0);
        if (n.length) {
          const r = Mt.range(n).map(({ pos: s, length: u }) => `(${s}/${u})[${dt.encode(this.data.subarray(s, s + u))}]`).join(", ");
          throw this.err(`unread byte ranges: ${r} (total=${this.data.length})`);
        } else
          return;
      }
      if (!this.isEnd())
        throw this.err(`${this.leftBytes} bytes ${this.bitPos} bits left after unpack: ${dt.encode(this.data.slice(this.pos))}`);
    }
  }
  // User methods
  err(n) {
    return En.err("Reader", this.stack, n);
  }
  offsetReader(n) {
    if (n > this.data.length)
      throw this.err("offsetReader: Unexpected end of buffer");
    return new pa(this.absBytes(n), this.opts, this.stack, this, n);
  }
  bytes(n, r = !1) {
    if (this.bitPos)
      throw this.err("readBytes: bitPos not empty");
    if (!Number.isFinite(n))
      throw this.err(`readBytes: wrong length=${n}`);
    if (this.pos + n > this.data.length)
      throw this.err("readBytes: Unexpected end of buffer");
    const s = this.data.subarray(this.pos, this.pos + n);
    return r || this.markBytes(n), s;
  }
  byte(n = !1) {
    if (this.bitPos)
      throw this.err("readByte: bitPos not empty");
    if (this.pos + 1 > this.data.length)
      throw this.err("readBytes: Unexpected end of buffer");
    const r = this.data[this.pos];
    return n || this.markBytes(1), r;
  }
  get leftBytes() {
    return this.data.length - this.pos;
  }
  get totalBytes() {
    return this.data.length;
  }
  isEnd() {
    return this.pos >= this.data.length && !this.bitPos;
  }
  // bits are read in BE mode (left to right): (0b1000_0000).readBits(1) == 1
  bits(n) {
    if (n > 32)
      throw this.err("BitReader: cannot read more than 32 bits in single call");
    let r = 0;
    for (; n; ) {
      this.bitPos || (this.bitBuf = this.byte(), this.bitPos = 8);
      const s = Math.min(n, this.bitPos);
      this.bitPos -= s, r = r << s | this.bitBuf >> this.bitPos & 2 ** s - 1, this.bitBuf &= 2 ** this.bitPos - 1, n -= s;
    }
    return r >>> 0;
  }
  find(n, r = this.pos) {
    if (!Me(n))
      throw this.err(`find: needle is not bytes! ${n}`);
    if (this.bitPos)
      throw this.err("findByte: bitPos not empty");
    if (!n.length)
      throw this.err("find: needle is empty");
    for (let s = r; (s = this.data.indexOf(n[0], s)) !== -1; s++) {
      if (s === -1 || this.data.length - s < n.length)
        return;
      if (Cr(n, this.data.subarray(s, s + n.length)))
        return s;
    }
  }
}
class PE {
  constructor(n = []) {
    this.stack = n, this.pos = 0, this.buffers = [], this.ptrs = [], this.bitBuf = 0, this.bitPos = 0, this.viewBuf = new Uint8Array(8), this.finished = !1, this.view = da(this.viewBuf);
  }
  pushObj(n, r) {
    return En.pushObj(this.stack, n, r);
  }
  writeView(n, r) {
    if (this.finished)
      throw this.err("buffer: finished");
    if (!nn(n) || n > 8)
      throw new Error(`wrong writeView length=${n}`);
    r(this.view), this.bytes(this.viewBuf.slice(0, n)), this.viewBuf.fill(0);
  }
  // User methods
  err(n) {
    if (this.finished)
      throw this.err("buffer: finished");
    return En.err("Reader", this.stack, n);
  }
  bytes(n) {
    if (this.finished)
      throw this.err("buffer: finished");
    if (this.bitPos)
      throw this.err("writeBytes: ends with non-empty bit buffer");
    this.buffers.push(n), this.pos += n.length;
  }
  byte(n) {
    if (this.finished)
      throw this.err("buffer: finished");
    if (this.bitPos)
      throw this.err("writeByte: ends with non-empty bit buffer");
    this.buffers.push(new Uint8Array([n])), this.pos++;
  }
  finish(n = !0) {
    if (this.finished)
      throw this.err("buffer: finished");
    if (this.bitPos)
      throw this.err("buffer: ends with non-empty bit buffer");
    const r = this.buffers.concat(this.ptrs.map((a) => a.buffer)), s = r.map((a) => a.length).reduce((a, c) => a + c, 0), u = new Uint8Array(s);
    for (let a = 0, c = 0; a < r.length; a++) {
      const l = r[a];
      u.set(l, c), c += l.length;
    }
    for (let a = this.pos, c = 0; c < this.ptrs.length; c++) {
      const l = this.ptrs[c];
      u.set(l.ptr.encode(a), l.pos), a += l.buffer.length;
    }
    if (n) {
      this.buffers = [];
      for (const a of this.ptrs)
        a.buffer.fill(0);
      this.ptrs = [], this.finished = !0, this.bitBuf = 0;
    }
    return u;
  }
  bits(n, r) {
    if (r > 32)
      throw this.err("writeBits: cannot write more than 32 bits in single call");
    if (n >= 2 ** r)
      throw this.err(`writeBits: value (${n}) >= 2**bits (${r})`);
    for (; r; ) {
      const s = Math.min(r, 8 - this.bitPos);
      this.bitBuf = this.bitBuf << s | n >> r - s, this.bitPos += s, r -= s, n &= 2 ** r - 1, this.bitPos === 8 && (this.bitPos = 0, this.buffers.push(new Uint8Array([this.bitBuf])), this.pos++);
    }
  }
}
const Yu = (e) => Uint8Array.from(e).reverse();
function Uh(e, n, r) {
  if (r) {
    const s = 2n ** (n - 1n);
    if (e < -s || e >= s)
      throw new Error(`value out of signed bounds. Expected ${-s} <= ${e} < ${s}`);
  } else if (0n > e || e >= 2n ** n)
    throw new Error(`value out of unsigned bounds. Expected 0 <= ${e} < ${2n ** n}`);
}
function Lh(e) {
  return {
    // NOTE: we cannot export validate here, since it is likely mistake.
    encodeStream: e.encodeStream,
    decodeStream: e.decodeStream,
    size: e.size,
    encode: (n) => {
      const r = new PE();
      return e.encodeStream(r, n), r.finish();
    },
    decode: (n, r = {}) => {
      const s = new pa(n, r), u = e.decodeStream(s);
      return s.finish(), u;
    }
  };
}
function Re(e, n) {
  if (!He(e))
    throw new Error(`validate: invalid inner value ${e}`);
  if (typeof n != "function")
    throw new Error("validate: fn should be function");
  return Lh({
    size: e.size,
    encodeStream: (r, s) => {
      let u;
      try {
        u = n(s);
      } catch (a) {
        throw r.err(a);
      }
      e.encodeStream(r, u);
    },
    decodeStream: (r) => {
      const s = e.decodeStream(r);
      try {
        return n(s);
      } catch (u) {
        throw r.err(u);
      }
    }
  });
}
const me = (e) => {
  const n = Lh(e);
  return e.validate ? Re(n, e.validate) : n;
}, Ks = (e) => Pr(e) && typeof e.decode == "function" && typeof e.encode == "function";
function He(e) {
  return Pr(e) && Ks(e) && typeof e.encodeStream == "function" && typeof e.decodeStream == "function" && (e.size === void 0 || nn(e.size));
}
function WE() {
  return {
    encode: (e) => {
      if (!Array.isArray(e))
        throw new Error("array expected");
      const n = {};
      for (const r of e) {
        if (!Array.isArray(r) || r.length !== 2)
          throw new Error("array of two elements expected");
        const s = r[0], u = r[1];
        if (n[s] !== void 0)
          throw new Error(`key(${s}) appears twice in struct`);
        n[s] = u;
      }
      return n;
    },
    decode: (e) => {
      if (!Pr(e))
        throw new Error(`expected plain object, got ${e}`);
      return Object.entries(e);
    }
  };
}
const ME = {
  encode: (e) => {
    if (typeof e != "bigint")
      throw new Error(`expected bigint, got ${typeof e}`);
    if (e > BigInt(Number.MAX_SAFE_INTEGER))
      throw new Error(`element bigger than MAX_SAFE_INTEGER=${e}`);
    return Number(e);
  },
  decode: (e) => {
    if (!nn(e))
      throw new Error("element is not a safe integer");
    return BigInt(e);
  }
};
function HE(e) {
  if (!Pr(e))
    throw new Error("plain object expected");
  return {
    encode: (n) => {
      if (!nn(n) || !(n in e))
        throw new Error(`wrong value ${n}`);
      return e[n];
    },
    decode: (n) => {
      if (typeof n != "string")
        throw new Error(`wrong value ${typeof n}`);
      return e[n];
    }
  };
}
function qE(e, n = !1) {
  if (!nn(e))
    throw new Error(`decimal/precision: wrong value ${e}`);
  if (typeof n != "boolean")
    throw new Error(`decimal/round: expected boolean, got ${typeof n}`);
  const r = 10n ** BigInt(e);
  return {
    encode: (s) => {
      if (typeof s != "bigint")
        throw new Error(`expected bigint, got ${typeof s}`);
      let u = (s < 0n ? -s : s).toString(10), a = u.length - e;
      a < 0 && (u = u.padStart(u.length - a, "0"), a = 0);
      let c = u.length - 1;
      for (; c >= a && u[c] === "0"; c--)
        ;
      let l = u.slice(0, a), d = u.slice(a, c + 1);
      return l || (l = "0"), s < 0n && (l = "-" + l), d ? `${l}.${d}` : l;
    },
    decode: (s) => {
      if (typeof s != "string")
        throw new Error(`expected string, got ${typeof s}`);
      if (s === "-0")
        throw new Error("negative zero is not allowed");
      let u = !1;
      if (s.startsWith("-") && (u = !0, s = s.slice(1)), !/^(0|[1-9]\d*)(\.\d+)?$/.test(s))
        throw new Error(`wrong string value=${s}`);
      let a = s.indexOf(".");
      a = a === -1 ? s.length : a;
      const c = s.slice(0, a), l = s.slice(a + 1).replace(/0+$/, ""), d = BigInt(c) * r;
      if (!n && l.length > e)
        throw new Error(`fractional part cannot be represented with this precision (num=${s}, prec=${e})`);
      const g = Math.min(l.length, e), y = BigInt(l.slice(0, g)) * 10n ** BigInt(e - g), m = d + y;
      return u ? -m : m;
    }
  };
}
function KE(e) {
  if (!Array.isArray(e))
    throw new Error(`expected array, got ${typeof e}`);
  for (const n of e)
    if (!Ks(n))
      throw new Error(`wrong base coder ${n}`);
  return {
    encode: (n) => {
      for (const r of e) {
        const s = r.encode(n);
        if (s !== void 0)
          return s;
      }
      throw new Error(`match/encode: cannot find match in ${n}`);
    },
    decode: (n) => {
      for (const r of e) {
        const s = r.decode(n);
        if (s !== void 0)
          return s;
      }
      throw new Error(`match/decode: cannot find match in ${n}`);
    }
  };
}
const Ch = (e) => {
  if (!Ks(e))
    throw new Error("BaseCoder expected");
  return { encode: e.decode, decode: e.encode };
}, zs = { dict: WE, numberBigint: ME, tsEnum: HE, decimal: qE, match: KE, reverse: Ch }, ga = (e, n = !1, r = !1, s = !0) => {
  if (!nn(e))
    throw new Error(`bigint/size: wrong value ${e}`);
  if (typeof n != "boolean")
    throw new Error(`bigint/le: expected boolean, got ${typeof n}`);
  if (typeof r != "boolean")
    throw new Error(`bigint/signed: expected boolean, got ${typeof r}`);
  if (typeof s != "boolean")
    throw new Error(`bigint/sized: expected boolean, got ${typeof s}`);
  const u = BigInt(e), a = 2n ** (8n * u - 1n);
  return me({
    size: s ? e : void 0,
    encodeStream: (c, l) => {
      r && l < 0 && (l = l | a);
      const d = [];
      for (let y = 0; y < e; y++)
        d.push(Number(l & 255n)), l >>= 8n;
      let g = new Uint8Array(d).reverse();
      if (!s) {
        let y = 0;
        for (y = 0; y < g.length && g[y] === 0; y++)
          ;
        g = g.subarray(y);
      }
      c.bytes(n ? g.reverse() : g);
    },
    decodeStream: (c) => {
      const l = c.bytes(s ? e : Math.min(e, c.leftBytes)), d = n ? l : Yu(l);
      let g = 0n;
      for (let y = 0; y < d.length; y++)
        g |= BigInt(d[y]) << 8n * BigInt(y);
      return r && g & a && (g = (g ^ a) - a), g;
    },
    validate: (c) => {
      if (typeof c != "bigint")
        throw new Error(`bigint: invalid value: ${c}`);
      return Uh(c, 8n * u, !!r), c;
    }
  });
}, zE = /* @__PURE__ */ ga(32, !1), bs = /* @__PURE__ */ ga(8, !0), VE = /* @__PURE__ */ ga(8, !0, !0), GE = (e, n) => me({
  size: e,
  encodeStream: (r, s) => r.writeView(e, (u) => n.write(u, s)),
  decodeStream: (r) => r.readView(e, n.read),
  validate: (r) => {
    if (typeof r != "number")
      throw new Error(`viewCoder: expected number, got ${typeof r}`);
    return n.validate && n.validate(r), r;
  }
}), bi = (e, n, r) => {
  const s = e * 8, u = 2 ** (s - 1), a = (d) => {
    if (!nn(d))
      throw new Error(`sintView: value is not safe integer: ${d}`);
    if (d < -u || d >= u)
      throw new Error(`sintView: value out of bounds. Expected ${-u} <= ${d} < ${u}`);
  }, c = 2 ** s, l = (d) => {
    if (!nn(d))
      throw new Error(`uintView: value is not safe integer: ${d}`);
    if (0 > d || d >= c)
      throw new Error(`uintView: value out of bounds. Expected 0 <= ${d} < ${c}`);
  };
  return GE(e, {
    write: r.write,
    read: r.read,
    validate: n ? a : l
  });
}, wt = /* @__PURE__ */ bi(4, !1, {
  read: (e, n) => e.getUint32(n, !0),
  write: (e, n) => e.setUint32(0, n, !0)
}), YE = /* @__PURE__ */ bi(4, !1, {
  read: (e, n) => e.getUint32(n, !1),
  write: (e, n) => e.setUint32(0, n, !1)
}), Ir = /* @__PURE__ */ bi(4, !0, {
  read: (e, n) => e.getInt32(n, !0),
  write: (e, n) => e.setInt32(0, n, !0)
}), Bl = /* @__PURE__ */ bi(2, !1, {
  read: (e, n) => e.getUint16(n, !0),
  write: (e, n) => e.setUint16(0, n, !0)
}), $n = /* @__PURE__ */ bi(1, !1, {
  read: (e, n) => e.getUint8(n),
  write: (e, n) => e.setUint8(0, n)
}), It = (e, n = !1) => {
  if (typeof n != "boolean")
    throw new Error(`bytes/le: expected boolean, got ${typeof n}`);
  const r = Rh(e), s = Me(e);
  return me({
    size: typeof e == "number" ? e : void 0,
    encodeStream: (u, a) => {
      s || r.encodeStream(u, a.length), u.bytes(n ? Yu(a) : a), s && u.bytes(e);
    },
    decodeStream: (u) => {
      let a;
      if (s) {
        const c = u.find(e);
        if (!c)
          throw u.err("bytes: cannot find terminator");
        a = u.bytes(c - u.pos), u.bytes(e.length);
      } else
        a = u.bytes(e === null ? u.leftBytes : r.decodeStream(u));
      return n ? Yu(a) : a;
    },
    validate: (u) => {
      if (!Me(u))
        throw new Error(`bytes: invalid value ${u}`);
      return u;
    }
  });
};
function ZE(e, n) {
  if (!He(n))
    throw new Error(`prefix: invalid inner value ${n}`);
  return or(It(e), Ch(n));
}
const wa = (e, n = !1) => Re(or(It(e, n), $E), (r) => {
  if (typeof r != "string")
    throw new Error(`expected string, got ${typeof r}`);
  return r;
}), XE = (e, n = { isLE: !1, with0x: !1 }) => {
  let r = or(It(e, n.isLE), dt);
  if (typeof n.with0x != "boolean")
    throw new Error(`hex/with0x: expected boolean, got ${typeof n.with0x}`);
  return n.with0x && (r = or(r, {
    encode: (s) => `0x${s}`,
    decode: (s) => {
      if (!s.startsWith("0x"))
        throw new Error("hex(with0x=true).encode input should start with 0x");
      return s.slice(2);
    }
  })), r;
};
function or(e, n) {
  if (!He(e))
    throw new Error(`apply: invalid inner value ${e}`);
  if (!Ks(n))
    throw new Error(`apply: invalid base value ${e}`);
  return me({
    size: e.size,
    encodeStream: (r, s) => {
      let u;
      try {
        u = n.decode(s);
      } catch (a) {
        throw r.err("" + a);
      }
      return e.encodeStream(r, u);
    },
    decodeStream: (r) => {
      const s = e.decodeStream(r);
      try {
        return n.encode(s);
      } catch (u) {
        throw r.err("" + u);
      }
    }
  });
}
const JE = (e, n = !1) => {
  if (!Me(e))
    throw new Error(`flag/flagValue: expected Uint8Array, got ${typeof e}`);
  if (typeof n != "boolean")
    throw new Error(`flag/xor: expected boolean, got ${typeof n}`);
  return me({
    size: e.length,
    encodeStream: (r, s) => {
      !!s !== n && r.bytes(e);
    },
    decodeStream: (r) => {
      let s = r.leftBytes >= e.length;
      return s && (s = Cr(r.bytes(e.length, !0), e), s && r.bytes(e.length)), s !== n;
    },
    validate: (r) => {
      if (r !== void 0 && typeof r != "boolean")
        throw new Error(`flag: expected boolean value or undefined, got ${typeof r}`);
      return r;
    }
  });
};
function QE(e, n, r) {
  if (!He(n))
    throw new Error(`flagged: invalid inner value ${n}`);
  return me({
    encodeStream: (s, u) => {
      En.resolve(s.stack, e) && n.encodeStream(s, u);
    },
    decodeStream: (s) => {
      let u = !1;
      if (u = !!En.resolve(s.stack, e), u)
        return n.decodeStream(s);
    }
  });
}
function ya(e, n, r = !0) {
  if (!He(e))
    throw new Error(`magic: invalid inner value ${e}`);
  if (typeof r != "boolean")
    throw new Error(`magic: expected boolean, got ${typeof r}`);
  return me({
    size: e.size,
    encodeStream: (s, u) => e.encodeStream(s, n),
    decodeStream: (s) => {
      const u = e.decodeStream(s);
      if (r && typeof u != "object" && u !== n || Me(n) && !Cr(n, u))
        throw s.err(`magic: invalid value: ${u} !== ${n}`);
    },
    validate: (s) => {
      if (s !== void 0)
        throw new Error(`magic: wrong value=${typeof s}`);
      return s;
    }
  });
}
function Nh(e) {
  let n = 0;
  for (const r of e) {
    if (r.size === void 0)
      return;
    if (!nn(r.size))
      throw new Error(`sizeof: wrong element size=${n}`);
    n += r.size;
  }
  return n;
}
function ne(e) {
  if (!Pr(e))
    throw new Error(`struct: expected plain object, got ${e}`);
  for (const n in e)
    if (!He(e[n]))
      throw new Error(`struct: field ${n} is not CoderType`);
  return me({
    size: Nh(Object.values(e)),
    encodeStream: (n, r) => {
      n.pushObj(r, (s) => {
        for (const u in e)
          s(u, () => e[u].encodeStream(n, r[u]));
      });
    },
    decodeStream: (n) => {
      const r = {};
      return n.pushObj(r, (s) => {
        for (const u in e)
          s(u, () => r[u] = e[u].decodeStream(n));
      }), r;
    },
    validate: (n) => {
      if (typeof n != "object" || n === null)
        throw new Error(`struct: invalid value ${n}`);
      return n;
    }
  });
}
function jE(e) {
  if (!Array.isArray(e))
    throw new Error(`Packed.Tuple: got ${typeof e} instead of array`);
  for (let n = 0; n < e.length; n++)
    if (!He(e[n]))
      throw new Error(`tuple: field ${n} is not CoderType`);
  return me({
    size: Nh(e),
    encodeStream: (n, r) => {
      if (!Array.isArray(r))
        throw n.err(`tuple: invalid value ${r}`);
      n.pushObj(r, (s) => {
        for (let u = 0; u < e.length; u++)
          s(`${u}`, () => e[u].encodeStream(n, r[u]));
      });
    },
    decodeStream: (n) => {
      const r = [];
      return n.pushObj(r, (s) => {
        for (let u = 0; u < e.length; u++)
          s(`${u}`, () => r.push(e[u].decodeStream(n)));
      }), r;
    },
    validate: (n) => {
      if (!Array.isArray(n))
        throw new Error(`tuple: invalid value ${n}`);
      if (n.length !== e.length)
        throw new Error(`tuple: wrong length=${n.length}, expected ${e.length}`);
      return n;
    }
  });
}
function ye(e, n) {
  if (!He(n))
    throw new Error(`array: invalid inner value ${n}`);
  const r = Rh(typeof e == "string" ? `../${e}` : e);
  return me({
    size: typeof e == "number" && n.size ? e * n.size : void 0,
    encodeStream: (s, u) => {
      const a = s;
      a.pushObj(u, (c) => {
        Me(e) || r.encodeStream(s, u.length);
        for (let l = 0; l < u.length; l++)
          c(`${l}`, () => {
            const d = u[l], g = s.pos;
            if (n.encodeStream(s, d), Me(e)) {
              if (e.length > a.pos - g)
                return;
              const y = a.finish(!1).subarray(g, a.pos);
              if (Cr(y.subarray(0, e.length), e))
                throw a.err(`array: inner element encoding same as separator. elm=${d} data=${y}`);
            }
          });
      }), Me(e) && s.bytes(e);
    },
    decodeStream: (s) => {
      const u = [];
      return s.pushObj(u, (a) => {
        if (e === null)
          for (let c = 0; !s.isEnd() && (a(`${c}`, () => u.push(n.decodeStream(s))), !(n.size && s.leftBytes < n.size)); c++)
            ;
        else if (Me(e))
          for (let c = 0; ; c++) {
            if (Cr(s.bytes(e.length, !0), e)) {
              s.bytes(e.length);
              break;
            }
            a(`${c}`, () => u.push(n.decodeStream(s)));
          }
        else {
          let c;
          a("arrayLen", () => c = r.decodeStream(s));
          for (let l = 0; l < c; l++)
            a(`${l}`, () => u.push(n.decodeStream(s)));
        }
      }), u;
    },
    validate: (s) => {
      if (!Array.isArray(s))
        throw new Error(`array: invalid value ${s}`);
      return s;
    }
  });
}
function Rl(e) {
  if (!Number.isSafeInteger(e) || e < 0)
    throw new Error(`positive integer expected, not ${e}`);
}
function tx(e) {
  return e instanceof Uint8Array || e != null && typeof e == "object" && e.constructor.name === "Uint8Array";
}
function Vs(e, ...n) {
  if (!tx(e))
    throw new Error("Uint8Array expected");
  if (n.length > 0 && !n.includes(e.length))
    throw new Error(`Uint8Array expected of length ${n}, not of length=${e.length}`);
}
function ex(e) {
  if (typeof e != "function" || typeof e.create != "function")
    throw new Error("Hash should be wrapped by utils.wrapConstructor");
  Rl(e.outputLen), Rl(e.blockLen);
}
function Ts(e, n = !0) {
  if (e.destroyed)
    throw new Error("Hash instance has been destroyed");
  if (n && e.finished)
    throw new Error("Hash#digest() has already been called");
}
function nx(e, n) {
  Vs(e);
  const r = n.outputLen;
  if (e.length < r)
    throw new Error(`digestInto() expects output buffer of length at least ${r}`);
}
const vr = typeof globalThis == "object" && "crypto" in globalThis ? globalThis.crypto : void 0;
/*! noble-hashes - MIT License (c) 2022 Paul Miller (paulmillr.com) */
const Iu = (e) => new DataView(e.buffer, e.byteOffset, e.byteLength), en = (e, n) => e << 32 - n | e >>> n, ds = (e, n) => e << n | e >>> 32 - n >>> 0;
new Uint8Array(new Uint32Array([287454020]).buffer)[0];
function rx(e) {
  if (typeof e != "string")
    throw new Error(`utf8ToBytes expected string, got ${typeof e}`);
  return new Uint8Array(new TextEncoder().encode(e));
}
function ma(e) {
  return typeof e == "string" && (e = rx(e)), Vs(e), e;
}
function ix(...e) {
  let n = 0;
  for (let s = 0; s < e.length; s++) {
    const u = e[s];
    Vs(u), n += u.length;
  }
  const r = new Uint8Array(n);
  for (let s = 0, u = 0; s < e.length; s++) {
    const a = e[s];
    r.set(a, u), u += a.length;
  }
  return r;
}
class kh {
  // Safe version that clones internal state
  clone() {
    return this._cloneInto();
  }
}
function Oh(e) {
  const n = (s) => e().update(ma(s)).digest(), r = e();
  return n.outputLen = r.outputLen, n.blockLen = r.blockLen, n.create = () => e(), n;
}
function $h(e = 32) {
  if (vr && typeof vr.getRandomValues == "function")
    return vr.getRandomValues(new Uint8Array(e));
  if (vr && typeof vr.randomBytes == "function")
    return vr.randomBytes(e);
  throw new Error("crypto.getRandomValues must be defined");
}
function sx(e, n, r, s) {
  if (typeof e.setBigUint64 == "function")
    return e.setBigUint64(n, r, s);
  const u = BigInt(32), a = BigInt(4294967295), c = Number(r >> u & a), l = Number(r & a), d = s ? 4 : 0, g = s ? 0 : 4;
  e.setUint32(n + d, c, s), e.setUint32(n + g, l, s);
}
const ox = (e, n, r) => e & n ^ ~e & r, ux = (e, n, r) => e & n ^ e & r ^ n & r;
class Dh extends kh {
  constructor(n, r, s, u) {
    super(), this.blockLen = n, this.outputLen = r, this.padOffset = s, this.isLE = u, this.finished = !1, this.length = 0, this.pos = 0, this.destroyed = !1, this.buffer = new Uint8Array(n), this.view = Iu(this.buffer);
  }
  update(n) {
    Ts(this);
    const { view: r, buffer: s, blockLen: u } = this;
    n = ma(n);
    const a = n.length;
    for (let c = 0; c < a; ) {
      const l = Math.min(u - this.pos, a - c);
      if (l === u) {
        const d = Iu(n);
        for (; u <= a - c; c += u)
          this.process(d, c);
        continue;
      }
      s.set(n.subarray(c, c + l), this.pos), this.pos += l, c += l, this.pos === u && (this.process(r, 0), this.pos = 0);
    }
    return this.length += n.length, this.roundClean(), this;
  }
  digestInto(n) {
    Ts(this), nx(n, this), this.finished = !0;
    const { buffer: r, view: s, blockLen: u, isLE: a } = this;
    let { pos: c } = this;
    r[c++] = 128, this.buffer.subarray(c).fill(0), this.padOffset > u - c && (this.process(s, 0), c = 0);
    for (let m = c; m < u; m++)
      r[m] = 0;
    sx(s, u - 8, BigInt(this.length * 8), a), this.process(s, 0);
    const l = Iu(n), d = this.outputLen;
    if (d % 4)
      throw new Error("_sha2: outputLen should be aligned to 32bit");
    const g = d / 4, y = this.get();
    if (g > y.length)
      throw new Error("_sha2: outputLen bigger than state");
    for (let m = 0; m < g; m++)
      l.setUint32(4 * m, y[m], a);
  }
  digest() {
    const { buffer: n, outputLen: r } = this;
    this.digestInto(n);
    const s = n.slice(0, r);
    return this.destroy(), s;
  }
  _cloneInto(n) {
    n || (n = new this.constructor()), n.set(...this.get());
    const { blockLen: r, buffer: s, length: u, finished: a, destroyed: c, pos: l } = this;
    return n.length = u, n.pos = l, n.finished = a, n.destroyed = c, u % r && n.buffer.set(s), n;
  }
}
const ax = /* @__PURE__ */ new Uint8Array([7, 4, 13, 1, 10, 6, 15, 3, 12, 0, 9, 5, 2, 14, 11, 8]), Fh = /* @__PURE__ */ new Uint8Array(new Array(16).fill(0).map((e, n) => n)), cx = /* @__PURE__ */ Fh.map((e) => (9 * e + 5) % 16);
let ba = [Fh], Ea = [cx];
for (let e = 0; e < 4; e++)
  for (let n of [ba, Ea])
    n.push(n[e].map((r) => ax[r]));
const Ph = /* @__PURE__ */ [
  [11, 14, 15, 12, 5, 8, 7, 9, 11, 13, 14, 15, 6, 7, 9, 8],
  [12, 13, 11, 15, 6, 9, 9, 7, 12, 15, 11, 13, 7, 8, 7, 7],
  [13, 15, 14, 11, 7, 7, 6, 8, 13, 14, 13, 12, 5, 5, 6, 9],
  [14, 11, 12, 14, 8, 6, 5, 5, 15, 12, 15, 14, 9, 9, 8, 6],
  [15, 12, 13, 13, 9, 5, 8, 6, 14, 11, 12, 11, 8, 6, 5, 5]
].map((e) => new Uint8Array(e)), fx = /* @__PURE__ */ ba.map((e, n) => e.map((r) => Ph[n][r])), lx = /* @__PURE__ */ Ea.map((e, n) => e.map((r) => Ph[n][r])), hx = /* @__PURE__ */ new Uint32Array([
  0,
  1518500249,
  1859775393,
  2400959708,
  2840853838
]), dx = /* @__PURE__ */ new Uint32Array([
  1352829926,
  1548603684,
  1836072691,
  2053994217,
  0
]);
function Ul(e, n, r, s) {
  return e === 0 ? n ^ r ^ s : e === 1 ? n & r | ~n & s : e === 2 ? (n | ~r) ^ s : e === 3 ? n & s | r & ~s : n ^ (r | ~s);
}
const ps = /* @__PURE__ */ new Uint32Array(16);
class px extends Dh {
  constructor() {
    super(64, 20, 8, !0), this.h0 = 1732584193, this.h1 = -271733879, this.h2 = -1732584194, this.h3 = 271733878, this.h4 = -1009589776;
  }
  get() {
    const { h0: n, h1: r, h2: s, h3: u, h4: a } = this;
    return [n, r, s, u, a];
  }
  set(n, r, s, u, a) {
    this.h0 = n | 0, this.h1 = r | 0, this.h2 = s | 0, this.h3 = u | 0, this.h4 = a | 0;
  }
  process(n, r) {
    for (let _ = 0; _ < 16; _++, r += 4)
      ps[_] = n.getUint32(r, !0);
    let s = this.h0 | 0, u = s, a = this.h1 | 0, c = a, l = this.h2 | 0, d = l, g = this.h3 | 0, y = g, m = this.h4 | 0, E = m;
    for (let _ = 0; _ < 5; _++) {
      const T = 4 - _, A = hx[_], x = dx[_], B = ba[_], k = Ea[_], O = fx[_], F = lx[_];
      for (let D = 0; D < 16; D++) {
        const W = ds(s + Ul(_, a, l, g) + ps[B[D]] + A, O[D]) + m | 0;
        s = m, m = g, g = ds(l, 10) | 0, l = a, a = W;
      }
      for (let D = 0; D < 16; D++) {
        const W = ds(u + Ul(T, c, d, y) + ps[k[D]] + x, F[D]) + E | 0;
        u = E, E = y, y = ds(d, 10) | 0, d = c, c = W;
      }
    }
    this.set(this.h1 + l + y | 0, this.h2 + g + E | 0, this.h3 + m + u | 0, this.h4 + s + c | 0, this.h0 + a + d | 0);
  }
  roundClean() {
    ps.fill(0);
  }
  destroy() {
    this.destroyed = !0, this.buffer.fill(0), this.set(0, 0, 0, 0, 0);
  }
}
const gx = /* @__PURE__ */ Oh(() => new px()), wx = /* @__PURE__ */ new Uint32Array([
  1116352408,
  1899447441,
  3049323471,
  3921009573,
  961987163,
  1508970993,
  2453635748,
  2870763221,
  3624381080,
  310598401,
  607225278,
  1426881987,
  1925078388,
  2162078206,
  2614888103,
  3248222580,
  3835390401,
  4022224774,
  264347078,
  604807628,
  770255983,
  1249150122,
  1555081692,
  1996064986,
  2554220882,
  2821834349,
  2952996808,
  3210313671,
  3336571891,
  3584528711,
  113926993,
  338241895,
  666307205,
  773529912,
  1294757372,
  1396182291,
  1695183700,
  1986661051,
  2177026350,
  2456956037,
  2730485921,
  2820302411,
  3259730800,
  3345764771,
  3516065817,
  3600352804,
  4094571909,
  275423344,
  430227734,
  506948616,
  659060556,
  883997877,
  958139571,
  1322822218,
  1537002063,
  1747873779,
  1955562222,
  2024104815,
  2227730452,
  2361852424,
  2428436474,
  2756734187,
  3204031479,
  3329325298
]), Nn = /* @__PURE__ */ new Uint32Array([
  1779033703,
  3144134277,
  1013904242,
  2773480762,
  1359893119,
  2600822924,
  528734635,
  1541459225
]), kn = /* @__PURE__ */ new Uint32Array(64);
class yx extends Dh {
  constructor() {
    super(64, 32, 8, !1), this.A = Nn[0] | 0, this.B = Nn[1] | 0, this.C = Nn[2] | 0, this.D = Nn[3] | 0, this.E = Nn[4] | 0, this.F = Nn[5] | 0, this.G = Nn[6] | 0, this.H = Nn[7] | 0;
  }
  get() {
    const { A: n, B: r, C: s, D: u, E: a, F: c, G: l, H: d } = this;
    return [n, r, s, u, a, c, l, d];
  }
  // prettier-ignore
  set(n, r, s, u, a, c, l, d) {
    this.A = n | 0, this.B = r | 0, this.C = s | 0, this.D = u | 0, this.E = a | 0, this.F = c | 0, this.G = l | 0, this.H = d | 0;
  }
  process(n, r) {
    for (let m = 0; m < 16; m++, r += 4)
      kn[m] = n.getUint32(r, !1);
    for (let m = 16; m < 64; m++) {
      const E = kn[m - 15], _ = kn[m - 2], T = en(E, 7) ^ en(E, 18) ^ E >>> 3, A = en(_, 17) ^ en(_, 19) ^ _ >>> 10;
      kn[m] = A + kn[m - 7] + T + kn[m - 16] | 0;
    }
    let { A: s, B: u, C: a, D: c, E: l, F: d, G: g, H: y } = this;
    for (let m = 0; m < 64; m++) {
      const E = en(l, 6) ^ en(l, 11) ^ en(l, 25), _ = y + E + ox(l, d, g) + wx[m] + kn[m] | 0, A = (en(s, 2) ^ en(s, 13) ^ en(s, 22)) + ux(s, u, a) | 0;
      y = g, g = d, d = l, l = c + _ | 0, c = a, a = u, u = s, s = _ + A | 0;
    }
    s = s + this.A | 0, u = u + this.B | 0, a = a + this.C | 0, c = c + this.D | 0, l = l + this.E | 0, d = d + this.F | 0, g = g + this.G | 0, y = y + this.H | 0, this.set(s, u, a, c, l, d, g, y);
  }
  roundClean() {
    kn.fill(0);
  }
  destroy() {
    this.set(0, 0, 0, 0, 0, 0, 0, 0), this.buffer.fill(0);
  }
}
const ue = /* @__PURE__ */ Oh(() => new yx());
class Wh extends kh {
  constructor(n, r) {
    super(), this.finished = !1, this.destroyed = !1, ex(n);
    const s = ma(r);
    if (this.iHash = n.create(), typeof this.iHash.update != "function")
      throw new Error("Expected instance of class which extends utils.Hash");
    this.blockLen = this.iHash.blockLen, this.outputLen = this.iHash.outputLen;
    const u = this.blockLen, a = new Uint8Array(u);
    a.set(s.length > u ? n.create().update(s).digest() : s);
    for (let c = 0; c < a.length; c++)
      a[c] ^= 54;
    this.iHash.update(a), this.oHash = n.create();
    for (let c = 0; c < a.length; c++)
      a[c] ^= 106;
    this.oHash.update(a), a.fill(0);
  }
  update(n) {
    return Ts(this), this.iHash.update(n), this;
  }
  digestInto(n) {
    Ts(this), Vs(n, this.outputLen), this.finished = !0, this.iHash.digestInto(n), this.oHash.update(n), this.oHash.digestInto(n), this.destroy();
  }
  digest() {
    const n = new Uint8Array(this.oHash.outputLen);
    return this.digestInto(n), n;
  }
  _cloneInto(n) {
    n || (n = Object.create(Object.getPrototypeOf(this), {}));
    const { oHash: r, iHash: s, finished: u, destroyed: a, blockLen: c, outputLen: l } = this;
    return n = n, n.finished = u, n.destroyed = a, n.blockLen = c, n.outputLen = l, n.oHash = r._cloneInto(n.oHash), n.iHash = s._cloneInto(n.iHash), n;
  }
  destroy() {
    this.destroyed = !0, this.oHash.destroy(), this.iHash.destroy();
  }
}
const Mh = (e, n, r) => new Wh(e, n).update(r).digest();
Mh.create = (e, n) => new Wh(e, n);
/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
const xa = /* @__PURE__ */ BigInt(0), Gs = /* @__PURE__ */ BigInt(1), mx = /* @__PURE__ */ BigInt(2);
function ur(e) {
  return e instanceof Uint8Array || e != null && typeof e == "object" && e.constructor.name === "Uint8Array";
}
function Ei(e) {
  if (!ur(e))
    throw new Error("Uint8Array expected");
}
function Nr(e, n) {
  if (typeof n != "boolean")
    throw new Error(`${e} must be valid boolean, got "${n}".`);
}
const bx = /* @__PURE__ */ Array.from({ length: 256 }, (e, n) => n.toString(16).padStart(2, "0"));
function kr(e) {
  Ei(e);
  let n = "";
  for (let r = 0; r < e.length; r++)
    n += bx[e[r]];
  return n;
}
function Br(e) {
  const n = e.toString(16);
  return n.length & 1 ? `0${n}` : n;
}
function Sa(e) {
  if (typeof e != "string")
    throw new Error("hex string expected, got " + typeof e);
  return BigInt(e === "" ? "0" : `0x${e}`);
}
const gn = { _0: 48, _9: 57, _A: 65, _F: 70, _a: 97, _f: 102 };
function Ll(e) {
  if (e >= gn._0 && e <= gn._9)
    return e - gn._0;
  if (e >= gn._A && e <= gn._F)
    return e - (gn._A - 10);
  if (e >= gn._a && e <= gn._f)
    return e - (gn._a - 10);
}
function Or(e) {
  if (typeof e != "string")
    throw new Error("hex string expected, got " + typeof e);
  const n = e.length, r = n / 2;
  if (n % 2)
    throw new Error("padded hex string expected, got unpadded hex of length " + n);
  const s = new Uint8Array(r);
  for (let u = 0, a = 0; u < r; u++, a += 2) {
    const c = Ll(e.charCodeAt(a)), l = Ll(e.charCodeAt(a + 1));
    if (c === void 0 || l === void 0) {
      const d = e[a] + e[a + 1];
      throw new Error('hex string expected, got non-hex character "' + d + '" at index ' + a);
    }
    s[u] = c * 16 + l;
  }
  return s;
}
function bn(e) {
  return Sa(kr(e));
}
function _a(e) {
  return Ei(e), Sa(kr(Uint8Array.from(e).reverse()));
}
function Fn(e, n) {
  return Or(e.toString(16).padStart(n * 2, "0"));
}
function Aa(e, n) {
  return Fn(e, n).reverse();
}
function Ex(e) {
  return Or(Br(e));
}
function Qt(e, n, r) {
  let s;
  if (typeof n == "string")
    try {
      s = Or(n);
    } catch (a) {
      throw new Error(`${e} must be valid hex string, got "${n}". Cause: ${a}`);
    }
  else if (ur(n))
    s = Uint8Array.from(n);
  else
    throw new Error(`${e} must be hex string or Uint8Array`);
  const u = s.length;
  if (typeof r == "number" && u !== r)
    throw new Error(`${e} expected ${r} bytes, got ${u}`);
  return s;
}
function ar(...e) {
  let n = 0;
  for (let s = 0; s < e.length; s++) {
    const u = e[s];
    Ei(u), n += u.length;
  }
  const r = new Uint8Array(n);
  for (let s = 0, u = 0; s < e.length; s++) {
    const a = e[s];
    r.set(a, u), u += a.length;
  }
  return r;
}
function xx(e, n) {
  if (e.length !== n.length)
    return !1;
  let r = 0;
  for (let s = 0; s < e.length; s++)
    r |= e[s] ^ n[s];
  return r === 0;
}
function Sx(e) {
  if (typeof e != "string")
    throw new Error(`utf8ToBytes expected string, got ${typeof e}`);
  return new Uint8Array(new TextEncoder().encode(e));
}
const Bu = (e) => typeof e == "bigint" && xa <= e;
function $r(e, n, r) {
  return Bu(e) && Bu(n) && Bu(r) && n <= e && e < r;
}
function Dn(e, n, r, s) {
  if (!$r(n, r, s))
    throw new Error(`expected valid ${e}: ${r} <= n < ${s}, got ${typeof n} ${n}`);
}
function Hh(e) {
  let n;
  for (n = 0; e > xa; e >>= Gs, n += 1)
    ;
  return n;
}
function _x(e, n) {
  return e >> BigInt(n) & Gs;
}
function Ax(e, n, r) {
  return e | (r ? Gs : xa) << BigInt(n);
}
const va = (e) => (mx << BigInt(e - 1)) - Gs, Ru = (e) => new Uint8Array(e), Cl = (e) => Uint8Array.from(e);
function qh(e, n, r) {
  if (typeof e != "number" || e < 2)
    throw new Error("hashLen must be a number");
  if (typeof n != "number" || n < 2)
    throw new Error("qByteLen must be a number");
  if (typeof r != "function")
    throw new Error("hmacFn must be a function");
  let s = Ru(e), u = Ru(e), a = 0;
  const c = () => {
    s.fill(1), u.fill(0), a = 0;
  }, l = (...m) => r(u, s, ...m), d = (m = Ru()) => {
    u = l(Cl([0]), m), s = l(), m.length !== 0 && (u = l(Cl([1]), m), s = l());
  }, g = () => {
    if (a++ >= 1e3)
      throw new Error("drbg: tried 1000 values");
    let m = 0;
    const E = [];
    for (; m < n; ) {
      s = l();
      const _ = s.slice();
      E.push(_), m += s.length;
    }
    return ar(...E);
  };
  return (m, E) => {
    c(), d(m);
    let _;
    for (; !(_ = E(g())); )
      d();
    return c(), _;
  };
}
const vx = {
  bigint: (e) => typeof e == "bigint",
  function: (e) => typeof e == "function",
  boolean: (e) => typeof e == "boolean",
  string: (e) => typeof e == "string",
  stringOrUint8Array: (e) => typeof e == "string" || ur(e),
  isSafeInteger: (e) => Number.isSafeInteger(e),
  array: (e) => Array.isArray(e),
  field: (e, n) => n.Fp.isValid(e),
  hash: (e) => typeof e == "function" && Number.isSafeInteger(e.outputLen)
};
function xi(e, n, r = {}) {
  const s = (u, a, c) => {
    const l = vx[a];
    if (typeof l != "function")
      throw new Error(`Invalid validator "${a}", expected function`);
    const d = e[u];
    if (!(c && d === void 0) && !l(d, e))
      throw new Error(`Invalid param ${String(u)}=${d} (${typeof d}), expected ${a}`);
  };
  for (const [u, a] of Object.entries(n))
    s(u, a, !1);
  for (const [u, a] of Object.entries(r))
    s(u, a, !0);
  return e;
}
const Tx = () => {
  throw new Error("not implemented");
};
function Zu(e) {
  const n = /* @__PURE__ */ new WeakMap();
  return (r, ...s) => {
    const u = n.get(r);
    if (u !== void 0)
      return u;
    const a = e(r, ...s);
    return n.set(r, a), a;
  };
}
const Ix = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  aInRange: Dn,
  abool: Nr,
  abytes: Ei,
  bitGet: _x,
  bitLen: Hh,
  bitMask: va,
  bitSet: Ax,
  bytesToHex: kr,
  bytesToNumberBE: bn,
  bytesToNumberLE: _a,
  concatBytes: ar,
  createHmacDrbg: qh,
  ensureBytes: Qt,
  equalBytes: xx,
  hexToBytes: Or,
  hexToNumber: Sa,
  inRange: $r,
  isBytes: ur,
  memoized: Zu,
  notImplemented: Tx,
  numberToBytesBE: Fn,
  numberToBytesLE: Aa,
  numberToHexUnpadded: Br,
  numberToVarBytesBE: Ex,
  utf8ToBytes: Sx,
  validateObject: xi
}, Symbol.toStringTag, { value: "Module" }));
/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
const qt = BigInt(0), Ut = BigInt(1), jn = BigInt(2), Bx = BigInt(3), Xu = BigInt(4), Nl = BigInt(5), kl = BigInt(8);
BigInt(9);
BigInt(16);
function Gt(e, n) {
  const r = e % n;
  return r >= qt ? r : n + r;
}
function Rx(e, n, r) {
  if (r <= qt || n < qt)
    throw new Error("Expected power/modulo > 0");
  if (r === Ut)
    return qt;
  let s = Ut;
  for (; n > qt; )
    n & Ut && (s = s * e % r), e = e * e % r, n >>= Ut;
  return s;
}
function We(e, n, r) {
  let s = e;
  for (; n-- > qt; )
    s *= s, s %= r;
  return s;
}
function Ju(e, n) {
  if (e === qt || n <= qt)
    throw new Error(`invert: expected positive integers, got n=${e} mod=${n}`);
  let r = Gt(e, n), s = n, u = qt, a = Ut;
  for (; r !== qt; ) {
    const l = s / r, d = s % r, g = u - a * l;
    s = r, r = d, u = a, a = g;
  }
  if (s !== Ut)
    throw new Error("invert: does not exist");
  return Gt(u, n);
}
function Ux(e) {
  const n = (e - Ut) / jn;
  let r, s, u;
  for (r = e - Ut, s = 0; r % jn === qt; r /= jn, s++)
    ;
  for (u = jn; u < e && Rx(u, n, e) !== e - Ut; u++)
    ;
  if (s === 1) {
    const c = (e + Ut) / Xu;
    return function(d, g) {
      const y = d.pow(g, c);
      if (!d.eql(d.sqr(y), g))
        throw new Error("Cannot find square root");
      return y;
    };
  }
  const a = (r + Ut) / jn;
  return function(l, d) {
    if (l.pow(d, n) === l.neg(l.ONE))
      throw new Error("Cannot find square root");
    let g = s, y = l.pow(l.mul(l.ONE, u), r), m = l.pow(d, a), E = l.pow(d, r);
    for (; !l.eql(E, l.ONE); ) {
      if (l.eql(E, l.ZERO))
        return l.ZERO;
      let _ = 1;
      for (let A = l.sqr(E); _ < g && !l.eql(A, l.ONE); _++)
        A = l.sqr(A);
      const T = l.pow(y, Ut << BigInt(g - _ - 1));
      y = l.sqr(T), m = l.mul(m, T), E = l.mul(E, y), g = _;
    }
    return m;
  };
}
function Lx(e) {
  if (e % Xu === Bx) {
    const n = (e + Ut) / Xu;
    return function(s, u) {
      const a = s.pow(u, n);
      if (!s.eql(s.sqr(a), u))
        throw new Error("Cannot find square root");
      return a;
    };
  }
  if (e % kl === Nl) {
    const n = (e - Nl) / kl;
    return function(s, u) {
      const a = s.mul(u, jn), c = s.pow(a, n), l = s.mul(u, c), d = s.mul(s.mul(l, jn), c), g = s.mul(l, s.sub(d, s.ONE));
      if (!s.eql(s.sqr(g), u))
        throw new Error("Cannot find square root");
      return g;
    };
  }
  return Ux(e);
}
const Cx = [
  "create",
  "isValid",
  "is0",
  "neg",
  "inv",
  "sqrt",
  "sqr",
  "eql",
  "add",
  "sub",
  "mul",
  "pow",
  "div",
  "addN",
  "subN",
  "mulN",
  "sqrN"
];
function Nx(e) {
  const n = {
    ORDER: "bigint",
    MASK: "bigint",
    BYTES: "isSafeInteger",
    BITS: "isSafeInteger"
  }, r = Cx.reduce((s, u) => (s[u] = "function", s), n);
  return xi(e, r);
}
function kx(e, n, r) {
  if (r < qt)
    throw new Error("Expected power > 0");
  if (r === qt)
    return e.ONE;
  if (r === Ut)
    return n;
  let s = e.ONE, u = n;
  for (; r > qt; )
    r & Ut && (s = e.mul(s, u)), u = e.sqr(u), r >>= Ut;
  return s;
}
function Ox(e, n) {
  const r = new Array(n.length), s = n.reduce((a, c, l) => e.is0(c) ? a : (r[l] = a, e.mul(a, c)), e.ONE), u = e.inv(s);
  return n.reduceRight((a, c, l) => e.is0(c) ? a : (r[l] = e.mul(a, r[l]), e.mul(a, c)), u), r;
}
function Kh(e, n) {
  const r = n !== void 0 ? n : e.toString(2).length, s = Math.ceil(r / 8);
  return { nBitLength: r, nByteLength: s };
}
function zh(e, n, r = !1, s = {}) {
  if (e <= qt)
    throw new Error(`Expected Field ORDER > 0, got ${e}`);
  const { nBitLength: u, nByteLength: a } = Kh(e, n);
  if (a > 2048)
    throw new Error("Field lengths over 2048 bytes are not supported");
  const c = Lx(e), l = Object.freeze({
    ORDER: e,
    BITS: u,
    BYTES: a,
    MASK: va(u),
    ZERO: qt,
    ONE: Ut,
    create: (d) => Gt(d, e),
    isValid: (d) => {
      if (typeof d != "bigint")
        throw new Error(`Invalid field element: expected bigint, got ${typeof d}`);
      return qt <= d && d < e;
    },
    is0: (d) => d === qt,
    isOdd: (d) => (d & Ut) === Ut,
    neg: (d) => Gt(-d, e),
    eql: (d, g) => d === g,
    sqr: (d) => Gt(d * d, e),
    add: (d, g) => Gt(d + g, e),
    sub: (d, g) => Gt(d - g, e),
    mul: (d, g) => Gt(d * g, e),
    pow: (d, g) => kx(l, d, g),
    div: (d, g) => Gt(d * Ju(g, e), e),
    // Same as above, but doesn't normalize
    sqrN: (d) => d * d,
    addN: (d, g) => d + g,
    subN: (d, g) => d - g,
    mulN: (d, g) => d * g,
    inv: (d) => Ju(d, e),
    sqrt: s.sqrt || ((d) => c(l, d)),
    invertBatch: (d) => Ox(l, d),
    // TODO: do we really need constant cmov?
    // We don't have const-time bigints anyway, so probably will be not very useful
    cmov: (d, g, y) => y ? g : d,
    toBytes: (d) => r ? Aa(d, a) : Fn(d, a),
    fromBytes: (d) => {
      if (d.length !== a)
        throw new Error(`Fp.fromBytes: expected ${a}, got ${d.length}`);
      return r ? _a(d) : bn(d);
    }
  });
  return Object.freeze(l);
}
function Vh(e) {
  if (typeof e != "bigint")
    throw new Error("field order must be bigint");
  const n = e.toString(2).length;
  return Math.ceil(n / 8);
}
function Gh(e) {
  const n = Vh(e);
  return n + Math.ceil(n / 2);
}
function $x(e, n, r = !1) {
  const s = e.length, u = Vh(n), a = Gh(n);
  if (s < 16 || s < a || s > 1024)
    throw new Error(`expected ${a}-1024 bytes of input, got ${s}`);
  const c = r ? bn(e) : _a(e), l = Gt(c, n - Ut) + Ut;
  return r ? Aa(l, u) : Fn(l, u);
}
/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
const Dx = BigInt(0), Uu = BigInt(1), Lu = /* @__PURE__ */ new WeakMap(), Ol = /* @__PURE__ */ new WeakMap();
function Fx(e, n) {
  const r = (a, c) => {
    const l = c.negate();
    return a ? l : c;
  }, s = (a) => {
    if (!Number.isSafeInteger(a) || a <= 0 || a > n)
      throw new Error(`Wrong window size=${a}, should be [1..${n}]`);
  }, u = (a) => {
    s(a);
    const c = Math.ceil(n / a) + 1, l = 2 ** (a - 1);
    return { windows: c, windowSize: l };
  };
  return {
    constTimeNegate: r,
    // non-const time multiplication ladder
    unsafeLadder(a, c) {
      let l = e.ZERO, d = a;
      for (; c > Dx; )
        c & Uu && (l = l.add(d)), d = d.double(), c >>= Uu;
      return l;
    },
    /**
     * Creates a wNAF precomputation window. Used for caching.
     * Default window size is set by `utils.precompute()` and is equal to 8.
     * Number of precomputed points depends on the curve size:
     * 2^(𝑊−1) * (Math.ceil(𝑛 / 𝑊) + 1), where:
     * - 𝑊 is the window size
     * - 𝑛 is the bitlength of the curve order.
     * For a 256-bit curve and window size 8, the number of precomputed points is 128 * 33 = 4224.
     * @returns precomputed point tables flattened to a single array
     */
    precomputeWindow(a, c) {
      const { windows: l, windowSize: d } = u(c), g = [];
      let y = a, m = y;
      for (let E = 0; E < l; E++) {
        m = y, g.push(m);
        for (let _ = 1; _ < d; _++)
          m = m.add(y), g.push(m);
        y = m.double();
      }
      return g;
    },
    /**
     * Implements ec multiplication using precomputed tables and w-ary non-adjacent form.
     * @param W window size
     * @param precomputes precomputed tables
     * @param n scalar (we don't check here, but should be less than curve order)
     * @returns real and fake (for const-time) points
     */
    wNAF(a, c, l) {
      const { windows: d, windowSize: g } = u(a);
      let y = e.ZERO, m = e.BASE;
      const E = BigInt(2 ** a - 1), _ = 2 ** a, T = BigInt(a);
      for (let A = 0; A < d; A++) {
        const x = A * g;
        let B = Number(l & E);
        l >>= T, B > g && (B -= _, l += Uu);
        const k = x, O = x + Math.abs(B) - 1, F = A % 2 !== 0, D = B < 0;
        B === 0 ? m = m.add(r(F, c[k])) : y = y.add(r(D, c[O]));
      }
      return { p: y, f: m };
    },
    wNAFCached(a, c, l) {
      const d = Ol.get(a) || 1;
      let g = Lu.get(a);
      return g || (g = this.precomputeWindow(a, d), d !== 1 && Lu.set(a, l(g))), this.wNAF(d, g, c);
    },
    // We calculate precomputes for elliptic curve point multiplication
    // using windowed method. This specifies window size and
    // stores precomputed values. Usually only base point would be precomputed.
    setWindowSize(a, c) {
      s(c), Ol.set(a, c), Lu.delete(a);
    }
  };
}
function Px(e, n, r, s) {
  if (!Array.isArray(r) || !Array.isArray(s) || s.length !== r.length)
    throw new Error("arrays of points and scalars must have equal length");
  s.forEach((y, m) => {
    if (!n.isValid(y))
      throw new Error(`wrong scalar at index ${m}`);
  }), r.forEach((y, m) => {
    if (!(y instanceof e))
      throw new Error(`wrong point at index ${m}`);
  });
  const u = Hh(BigInt(r.length)), a = u > 12 ? u - 3 : u > 4 ? u - 2 : u ? 2 : 1, c = (1 << a) - 1, l = new Array(c + 1).fill(e.ZERO), d = Math.floor((n.BITS - 1) / a) * a;
  let g = e.ZERO;
  for (let y = d; y >= 0; y -= a) {
    l.fill(e.ZERO);
    for (let E = 0; E < s.length; E++) {
      const _ = s[E], T = Number(_ >> BigInt(y) & BigInt(c));
      l[T] = l[T].add(r[E]);
    }
    let m = e.ZERO;
    for (let E = l.length - 1, _ = e.ZERO; E > 0; E--)
      _ = _.add(l[E]), m = m.add(_);
    if (g = g.add(m), y !== 0)
      for (let E = 0; E < a; E++)
        g = g.double();
  }
  return g;
}
function Yh(e) {
  return Nx(e.Fp), xi(e, {
    n: "bigint",
    h: "bigint",
    Gx: "field",
    Gy: "field"
  }, {
    nBitLength: "isSafeInteger",
    nByteLength: "isSafeInteger"
  }), Object.freeze({
    ...Kh(e.n, e.nBitLength),
    ...e,
    p: e.Fp.ORDER
  });
}
/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
function $l(e) {
  e.lowS !== void 0 && Nr("lowS", e.lowS), e.prehash !== void 0 && Nr("prehash", e.prehash);
}
function Wx(e) {
  const n = Yh(e);
  xi(n, {
    a: "field",
    b: "field"
  }, {
    allowedPrivateKeyLengths: "array",
    wrapPrivateKey: "boolean",
    isTorsionFree: "function",
    clearCofactor: "function",
    allowInfinityPoint: "boolean",
    fromBytes: "function",
    toBytes: "function"
  });
  const { endo: r, Fp: s, a: u } = n;
  if (r) {
    if (!s.eql(u, s.ZERO))
      throw new Error("Endomorphism can only be defined for Koblitz curves that have a=0");
    if (typeof r != "object" || typeof r.beta != "bigint" || typeof r.splitScalar != "function")
      throw new Error("Expected endomorphism with beta: bigint and splitScalar: function");
  }
  return Object.freeze({ ...n });
}
const { bytesToNumberBE: Mx, hexToBytes: Hx } = Ix, yn = {
  // asn.1 DER encoding utils
  Err: class extends Error {
    constructor(n = "") {
      super(n);
    }
  },
  // Basic building block is TLV (Tag-Length-Value)
  _tlv: {
    encode: (e, n) => {
      const { Err: r } = yn;
      if (e < 0 || e > 256)
        throw new r("tlv.encode: wrong tag");
      if (n.length & 1)
        throw new r("tlv.encode: unpadded data");
      const s = n.length / 2, u = Br(s);
      if (u.length / 2 & 128)
        throw new r("tlv.encode: long form length too big");
      const a = s > 127 ? Br(u.length / 2 | 128) : "";
      return `${Br(e)}${a}${u}${n}`;
    },
    // v - value, l - left bytes (unparsed)
    decode(e, n) {
      const { Err: r } = yn;
      let s = 0;
      if (e < 0 || e > 256)
        throw new r("tlv.encode: wrong tag");
      if (n.length < 2 || n[s++] !== e)
        throw new r("tlv.decode: wrong tlv");
      const u = n[s++], a = !!(u & 128);
      let c = 0;
      if (!a)
        c = u;
      else {
        const d = u & 127;
        if (!d)
          throw new r("tlv.decode(long): indefinite length not supported");
        if (d > 4)
          throw new r("tlv.decode(long): byte length is too big");
        const g = n.subarray(s, s + d);
        if (g.length !== d)
          throw new r("tlv.decode: length bytes not complete");
        if (g[0] === 0)
          throw new r("tlv.decode(long): zero leftmost byte");
        for (const y of g)
          c = c << 8 | y;
        if (s += d, c < 128)
          throw new r("tlv.decode(long): not minimal encoding");
      }
      const l = n.subarray(s, s + c);
      if (l.length !== c)
        throw new r("tlv.decode: wrong value length");
      return { v: l, l: n.subarray(s + c) };
    }
  },
  // https://crypto.stackexchange.com/a/57734 Leftmost bit of first byte is 'negative' flag,
  // since we always use positive integers here. It must always be empty:
  // - add zero byte if exists
  // - if next byte doesn't have a flag, leading zero is not allowed (minimal encoding)
  _int: {
    encode(e) {
      const { Err: n } = yn;
      if (e < mn)
        throw new n("integer: negative integers are not allowed");
      let r = Br(e);
      if (Number.parseInt(r[0], 16) & 8 && (r = "00" + r), r.length & 1)
        throw new n("unexpected assertion");
      return r;
    },
    decode(e) {
      const { Err: n } = yn;
      if (e[0] & 128)
        throw new n("Invalid signature integer: negative");
      if (e[0] === 0 && !(e[1] & 128))
        throw new n("Invalid signature integer: unnecessary leading zero");
      return Mx(e);
    }
  },
  toSig(e) {
    const { Err: n, _int: r, _tlv: s } = yn, u = typeof e == "string" ? Hx(e) : e;
    Ei(u);
    const { v: a, l: c } = s.decode(48, u);
    if (c.length)
      throw new n("Invalid signature: left bytes after parsing");
    const { v: l, l: d } = s.decode(2, a), { v: g, l: y } = s.decode(2, d);
    if (y.length)
      throw new n("Invalid signature: left bytes after parsing");
    return { r: r.decode(l), s: r.decode(g) };
  },
  hexFromSig(e) {
    const { _tlv: n, _int: r } = yn, s = `${n.encode(2, r.encode(e.r))}${n.encode(2, r.encode(e.s))}`;
    return n.encode(48, s);
  }
}, mn = BigInt(0), Ht = BigInt(1);
BigInt(2);
const Dl = BigInt(3);
BigInt(4);
function qx(e) {
  const n = Wx(e), { Fp: r } = n, s = zh(n.n, n.nBitLength), u = n.toBytes || ((A, x, B) => {
    const k = x.toAffine();
    return ar(Uint8Array.from([4]), r.toBytes(k.x), r.toBytes(k.y));
  }), a = n.fromBytes || ((A) => {
    const x = A.subarray(1), B = r.fromBytes(x.subarray(0, r.BYTES)), k = r.fromBytes(x.subarray(r.BYTES, 2 * r.BYTES));
    return { x: B, y: k };
  });
  function c(A) {
    const { a: x, b: B } = n, k = r.sqr(A), O = r.mul(k, A);
    return r.add(r.add(O, r.mul(A, x)), B);
  }
  if (!r.eql(r.sqr(n.Gy), c(n.Gx)))
    throw new Error("bad generator point: equation left != right");
  function l(A) {
    return $r(A, Ht, n.n);
  }
  function d(A) {
    const { allowedPrivateKeyLengths: x, nByteLength: B, wrapPrivateKey: k, n: O } = n;
    if (x && typeof A != "bigint") {
      if (ur(A) && (A = kr(A)), typeof A != "string" || !x.includes(A.length))
        throw new Error("Invalid key");
      A = A.padStart(B * 2, "0");
    }
    let F;
    try {
      F = typeof A == "bigint" ? A : bn(Qt("private key", A, B));
    } catch {
      throw new Error(`private key must be ${B} bytes, hex or bigint, not ${typeof A}`);
    }
    return k && (F = Gt(F, O)), Dn("private key", F, Ht, O), F;
  }
  function g(A) {
    if (!(A instanceof E))
      throw new Error("ProjectivePoint expected");
  }
  const y = Zu((A, x) => {
    const { px: B, py: k, pz: O } = A;
    if (r.eql(O, r.ONE))
      return { x: B, y: k };
    const F = A.is0();
    x == null && (x = F ? r.ONE : r.inv(O));
    const D = r.mul(B, x), W = r.mul(k, x), M = r.mul(O, x);
    if (F)
      return { x: r.ZERO, y: r.ZERO };
    if (!r.eql(M, r.ONE))
      throw new Error("invZ was invalid");
    return { x: D, y: W };
  }), m = Zu((A) => {
    if (A.is0()) {
      if (n.allowInfinityPoint && !r.is0(A.py))
        return;
      throw new Error("bad point: ZERO");
    }
    const { x, y: B } = A.toAffine();
    if (!r.isValid(x) || !r.isValid(B))
      throw new Error("bad point: x or y not FE");
    const k = r.sqr(B), O = c(x);
    if (!r.eql(k, O))
      throw new Error("bad point: equation left != right");
    if (!A.isTorsionFree())
      throw new Error("bad point: not in prime-order subgroup");
    return !0;
  });
  class E {
    constructor(x, B, k) {
      if (this.px = x, this.py = B, this.pz = k, x == null || !r.isValid(x))
        throw new Error("x required");
      if (B == null || !r.isValid(B))
        throw new Error("y required");
      if (k == null || !r.isValid(k))
        throw new Error("z required");
      Object.freeze(this);
    }
    // Does not validate if the point is on-curve.
    // Use fromHex instead, or call assertValidity() later.
    static fromAffine(x) {
      const { x: B, y: k } = x || {};
      if (!x || !r.isValid(B) || !r.isValid(k))
        throw new Error("invalid affine point");
      if (x instanceof E)
        throw new Error("projective point not allowed");
      const O = (F) => r.eql(F, r.ZERO);
      return O(B) && O(k) ? E.ZERO : new E(B, k, r.ONE);
    }
    get x() {
      return this.toAffine().x;
    }
    get y() {
      return this.toAffine().y;
    }
    /**
     * Takes a bunch of Projective Points but executes only one
     * inversion on all of them. Inversion is very slow operation,
     * so this improves performance massively.
     * Optimization: converts a list of projective points to a list of identical points with Z=1.
     */
    static normalizeZ(x) {
      const B = r.invertBatch(x.map((k) => k.pz));
      return x.map((k, O) => k.toAffine(B[O])).map(E.fromAffine);
    }
    /**
     * Converts hash string or Uint8Array to Point.
     * @param hex short/long ECDSA hex
     */
    static fromHex(x) {
      const B = E.fromAffine(a(Qt("pointHex", x)));
      return B.assertValidity(), B;
    }
    // Multiplies generator point by privateKey.
    static fromPrivateKey(x) {
      return E.BASE.multiply(d(x));
    }
    // Multiscalar Multiplication
    static msm(x, B) {
      return Px(E, s, x, B);
    }
    // "Private method", don't use it directly
    _setWindowSize(x) {
      T.setWindowSize(this, x);
    }
    // A point on curve is valid if it conforms to equation.
    assertValidity() {
      m(this);
    }
    hasEvenY() {
      const { y: x } = this.toAffine();
      if (r.isOdd)
        return !r.isOdd(x);
      throw new Error("Field doesn't support isOdd");
    }
    /**
     * Compare one point to another.
     */
    equals(x) {
      g(x);
      const { px: B, py: k, pz: O } = this, { px: F, py: D, pz: W } = x, M = r.eql(r.mul(B, W), r.mul(F, O)), G = r.eql(r.mul(k, W), r.mul(D, O));
      return M && G;
    }
    /**
     * Flips point to one corresponding to (x, -y) in Affine coordinates.
     */
    negate() {
      return new E(this.px, r.neg(this.py), this.pz);
    }
    // Renes-Costello-Batina exception-free doubling formula.
    // There is 30% faster Jacobian formula, but it is not complete.
    // https://eprint.iacr.org/2015/1060, algorithm 3
    // Cost: 8M + 3S + 3*a + 2*b3 + 15add.
    double() {
      const { a: x, b: B } = n, k = r.mul(B, Dl), { px: O, py: F, pz: D } = this;
      let W = r.ZERO, M = r.ZERO, G = r.ZERO, J = r.mul(O, O), ae = r.mul(F, F), yt = r.mul(D, D), ft = r.mul(O, F);
      return ft = r.add(ft, ft), G = r.mul(O, D), G = r.add(G, G), W = r.mul(x, G), M = r.mul(k, yt), M = r.add(W, M), W = r.sub(ae, M), M = r.add(ae, M), M = r.mul(W, M), W = r.mul(ft, W), G = r.mul(k, G), yt = r.mul(x, yt), ft = r.sub(J, yt), ft = r.mul(x, ft), ft = r.add(ft, G), G = r.add(J, J), J = r.add(G, J), J = r.add(J, yt), J = r.mul(J, ft), M = r.add(M, J), yt = r.mul(F, D), yt = r.add(yt, yt), J = r.mul(yt, ft), W = r.sub(W, J), G = r.mul(yt, ae), G = r.add(G, G), G = r.add(G, G), new E(W, M, G);
    }
    // Renes-Costello-Batina exception-free addition formula.
    // There is 30% faster Jacobian formula, but it is not complete.
    // https://eprint.iacr.org/2015/1060, algorithm 1
    // Cost: 12M + 0S + 3*a + 3*b3 + 23add.
    add(x) {
      g(x);
      const { px: B, py: k, pz: O } = this, { px: F, py: D, pz: W } = x;
      let M = r.ZERO, G = r.ZERO, J = r.ZERO;
      const ae = n.a, yt = r.mul(n.b, Dl);
      let ft = r.mul(B, F), re = r.mul(k, D), H = r.mul(O, W), z = r.add(B, k), V = r.add(F, D);
      z = r.mul(z, V), V = r.add(ft, re), z = r.sub(z, V), V = r.add(B, O);
      let Q = r.add(F, W);
      return V = r.mul(V, Q), Q = r.add(ft, H), V = r.sub(V, Q), Q = r.add(k, O), M = r.add(D, W), Q = r.mul(Q, M), M = r.add(re, H), Q = r.sub(Q, M), J = r.mul(ae, V), M = r.mul(yt, H), J = r.add(M, J), M = r.sub(re, J), J = r.add(re, J), G = r.mul(M, J), re = r.add(ft, ft), re = r.add(re, ft), H = r.mul(ae, H), V = r.mul(yt, V), re = r.add(re, H), H = r.sub(ft, H), H = r.mul(ae, H), V = r.add(V, H), ft = r.mul(re, V), G = r.add(G, ft), ft = r.mul(Q, V), M = r.mul(z, M), M = r.sub(M, ft), ft = r.mul(z, re), J = r.mul(Q, J), J = r.add(J, ft), new E(M, G, J);
    }
    subtract(x) {
      return this.add(x.negate());
    }
    is0() {
      return this.equals(E.ZERO);
    }
    wNAF(x) {
      return T.wNAFCached(this, x, E.normalizeZ);
    }
    /**
     * Non-constant-time multiplication. Uses double-and-add algorithm.
     * It's faster, but should only be used when you don't care about
     * an exposed private key e.g. sig verification, which works over *public* keys.
     */
    multiplyUnsafe(x) {
      Dn("scalar", x, mn, n.n);
      const B = E.ZERO;
      if (x === mn)
        return B;
      if (x === Ht)
        return this;
      const { endo: k } = n;
      if (!k)
        return T.unsafeLadder(this, x);
      let { k1neg: O, k1: F, k2neg: D, k2: W } = k.splitScalar(x), M = B, G = B, J = this;
      for (; F > mn || W > mn; )
        F & Ht && (M = M.add(J)), W & Ht && (G = G.add(J)), J = J.double(), F >>= Ht, W >>= Ht;
      return O && (M = M.negate()), D && (G = G.negate()), G = new E(r.mul(G.px, k.beta), G.py, G.pz), M.add(G);
    }
    /**
     * Constant time multiplication.
     * Uses wNAF method. Windowed method may be 10% faster,
     * but takes 2x longer to generate and consumes 2x memory.
     * Uses precomputes when available.
     * Uses endomorphism for Koblitz curves.
     * @param scalar by which the point would be multiplied
     * @returns New point
     */
    multiply(x) {
      const { endo: B, n: k } = n;
      Dn("scalar", x, Ht, k);
      let O, F;
      if (B) {
        const { k1neg: D, k1: W, k2neg: M, k2: G } = B.splitScalar(x);
        let { p: J, f: ae } = this.wNAF(W), { p: yt, f: ft } = this.wNAF(G);
        J = T.constTimeNegate(D, J), yt = T.constTimeNegate(M, yt), yt = new E(r.mul(yt.px, B.beta), yt.py, yt.pz), O = J.add(yt), F = ae.add(ft);
      } else {
        const { p: D, f: W } = this.wNAF(x);
        O = D, F = W;
      }
      return E.normalizeZ([O, F])[0];
    }
    /**
     * Efficiently calculate `aP + bQ`. Unsafe, can expose private key, if used incorrectly.
     * Not using Strauss-Shamir trick: precomputation tables are faster.
     * The trick could be useful if both P and Q are not G (not in our case).
     * @returns non-zero affine point
     */
    multiplyAndAddUnsafe(x, B, k) {
      const O = E.BASE, F = (W, M) => M === mn || M === Ht || !W.equals(O) ? W.multiplyUnsafe(M) : W.multiply(M), D = F(this, B).add(F(x, k));
      return D.is0() ? void 0 : D;
    }
    // Converts Projective point to affine (x, y) coordinates.
    // Can accept precomputed Z^-1 - for example, from invertBatch.
    // (x, y, z) ∋ (x=x/z, y=y/z)
    toAffine(x) {
      return y(this, x);
    }
    isTorsionFree() {
      const { h: x, isTorsionFree: B } = n;
      if (x === Ht)
        return !0;
      if (B)
        return B(E, this);
      throw new Error("isTorsionFree() has not been declared for the elliptic curve");
    }
    clearCofactor() {
      const { h: x, clearCofactor: B } = n;
      return x === Ht ? this : B ? B(E, this) : this.multiplyUnsafe(n.h);
    }
    toRawBytes(x = !0) {
      return Nr("isCompressed", x), this.assertValidity(), u(E, this, x);
    }
    toHex(x = !0) {
      return Nr("isCompressed", x), kr(this.toRawBytes(x));
    }
  }
  E.BASE = new E(n.Gx, n.Gy, r.ONE), E.ZERO = new E(r.ZERO, r.ONE, r.ZERO);
  const _ = n.nBitLength, T = Fx(E, n.endo ? Math.ceil(_ / 2) : _);
  return {
    CURVE: n,
    ProjectivePoint: E,
    normPrivateKeyToScalar: d,
    weierstrassEquation: c,
    isWithinCurveOrder: l
  };
}
function Kx(e) {
  const n = Yh(e);
  return xi(n, {
    hash: "hash",
    hmac: "function",
    randomBytes: "function"
  }, {
    bits2int: "function",
    bits2int_modN: "function",
    lowS: "boolean"
  }), Object.freeze({ lowS: !0, ...n });
}
function zx(e) {
  const n = Kx(e), { Fp: r, n: s } = n, u = r.BYTES + 1, a = 2 * r.BYTES + 1;
  function c(H) {
    return Gt(H, s);
  }
  function l(H) {
    return Ju(H, s);
  }
  const { ProjectivePoint: d, normPrivateKeyToScalar: g, weierstrassEquation: y, isWithinCurveOrder: m } = qx({
    ...n,
    toBytes(H, z, V) {
      const Q = z.toAffine(), ot = r.toBytes(Q.x), Nt = ar;
      return Nr("isCompressed", V), V ? Nt(Uint8Array.from([z.hasEvenY() ? 2 : 3]), ot) : Nt(Uint8Array.from([4]), ot, r.toBytes(Q.y));
    },
    fromBytes(H) {
      const z = H.length, V = H[0], Q = H.subarray(1);
      if (z === u && (V === 2 || V === 3)) {
        const ot = bn(Q);
        if (!$r(ot, Ht, r.ORDER))
          throw new Error("Point is not on curve");
        const Nt = y(ot);
        let kt;
        try {
          kt = r.sqrt(Nt);
        } catch (be) {
          const Je = be instanceof Error ? ": " + be.message : "";
          throw new Error("Point is not on curve" + Je);
        }
        const Et = (kt & Ht) === Ht;
        return (V & 1) === 1 !== Et && (kt = r.neg(kt)), { x: ot, y: kt };
      } else if (z === a && V === 4) {
        const ot = r.fromBytes(Q.subarray(0, r.BYTES)), Nt = r.fromBytes(Q.subarray(r.BYTES, 2 * r.BYTES));
        return { x: ot, y: Nt };
      } else
        throw new Error(`Point of length ${z} was invalid. Expected ${u} compressed bytes or ${a} uncompressed bytes`);
    }
  }), E = (H) => kr(Fn(H, n.nByteLength));
  function _(H) {
    const z = s >> Ht;
    return H > z;
  }
  function T(H) {
    return _(H) ? c(-H) : H;
  }
  const A = (H, z, V) => bn(H.slice(z, V));
  class x {
    constructor(z, V, Q) {
      this.r = z, this.s = V, this.recovery = Q, this.assertValidity();
    }
    // pair (bytes of r, bytes of s)
    static fromCompact(z) {
      const V = n.nByteLength;
      return z = Qt("compactSignature", z, V * 2), new x(A(z, 0, V), A(z, V, 2 * V));
    }
    // DER encoded ECDSA signature
    // https://bitcoin.stackexchange.com/questions/57644/what-are-the-parts-of-a-bitcoin-transaction-input-script
    static fromDER(z) {
      const { r: V, s: Q } = yn.toSig(Qt("DER", z));
      return new x(V, Q);
    }
    assertValidity() {
      Dn("r", this.r, Ht, s), Dn("s", this.s, Ht, s);
    }
    addRecoveryBit(z) {
      return new x(this.r, this.s, z);
    }
    recoverPublicKey(z) {
      const { r: V, s: Q, recovery: ot } = this, Nt = W(Qt("msgHash", z));
      if (ot == null || ![0, 1, 2, 3].includes(ot))
        throw new Error("recovery id invalid");
      const kt = ot === 2 || ot === 3 ? V + n.n : V;
      if (kt >= r.ORDER)
        throw new Error("recovery id 2 or 3 invalid");
      const Et = ot & 1 ? "03" : "02", Xe = d.fromHex(Et + E(kt)), be = l(kt), Je = c(-Nt * be), Ue = c(Q * be), Ee = d.BASE.multiplyAndAddUnsafe(Xe, Je, Ue);
      if (!Ee)
        throw new Error("point at infinify");
      return Ee.assertValidity(), Ee;
    }
    // Signatures should be low-s, to prevent malleability.
    hasHighS() {
      return _(this.s);
    }
    normalizeS() {
      return this.hasHighS() ? new x(this.r, c(-this.s), this.recovery) : this;
    }
    // DER-encoded
    toDERRawBytes() {
      return Or(this.toDERHex());
    }
    toDERHex() {
      return yn.hexFromSig({ r: this.r, s: this.s });
    }
    // padded bytes of r, then padded bytes of s
    toCompactRawBytes() {
      return Or(this.toCompactHex());
    }
    toCompactHex() {
      return E(this.r) + E(this.s);
    }
  }
  const B = {
    isValidPrivateKey(H) {
      try {
        return g(H), !0;
      } catch {
        return !1;
      }
    },
    normPrivateKeyToScalar: g,
    /**
     * Produces cryptographically secure private key from random of size
     * (groupLen + ceil(groupLen / 2)) with modulo bias being negligible.
     */
    randomPrivateKey: () => {
      const H = Gh(n.n);
      return $x(n.randomBytes(H), n.n);
    },
    /**
     * Creates precompute table for an arbitrary EC point. Makes point "cached".
     * Allows to massively speed-up `point.multiply(scalar)`.
     * @returns cached point
     * @example
     * const fast = utils.precompute(8, ProjectivePoint.fromHex(someonesPubKey));
     * fast.multiply(privKey); // much faster ECDH now
     */
    precompute(H = 8, z = d.BASE) {
      return z._setWindowSize(H), z.multiply(BigInt(3)), z;
    }
  };
  function k(H, z = !0) {
    return d.fromPrivateKey(H).toRawBytes(z);
  }
  function O(H) {
    const z = ur(H), V = typeof H == "string", Q = (z || V) && H.length;
    return z ? Q === u || Q === a : V ? Q === 2 * u || Q === 2 * a : H instanceof d;
  }
  function F(H, z, V = !0) {
    if (O(H))
      throw new Error("first arg must be private key");
    if (!O(z))
      throw new Error("second arg must be public key");
    return d.fromHex(z).multiply(g(H)).toRawBytes(V);
  }
  const D = n.bits2int || function(H) {
    const z = bn(H), V = H.length * 8 - n.nBitLength;
    return V > 0 ? z >> BigInt(V) : z;
  }, W = n.bits2int_modN || function(H) {
    return c(D(H));
  }, M = va(n.nBitLength);
  function G(H) {
    return Dn(`num < 2^${n.nBitLength}`, H, mn, M), Fn(H, n.nByteLength);
  }
  function J(H, z, V = ae) {
    if (["recovered", "canonical"].some((xe) => xe in V))
      throw new Error("sign() legacy options not supported");
    const { hash: Q, randomBytes: ot } = n;
    let { lowS: Nt, prehash: kt, extraEntropy: Et } = V;
    Nt == null && (Nt = !0), H = Qt("msgHash", H), $l(V), kt && (H = Qt("prehashed msgHash", Q(H)));
    const Xe = W(H), be = g(z), Je = [G(be), G(Xe)];
    if (Et != null && Et !== !1) {
      const xe = Et === !0 ? ot(r.BYTES) : Et;
      Je.push(Qt("extraEntropy", xe));
    }
    const Ue = ar(...Je), Ee = Xe;
    function Wr(xe) {
      const Le = D(xe);
      if (!m(Le))
        return;
      const _i = l(Le), qe = d.BASE.multiply(Le).toAffine(), Zt = c(qe.x);
      if (Zt === mn)
        return;
      const rn = c(_i * c(Ee + Zt * be));
      if (rn === mn)
        return;
      let ce = (qe.x === Zt ? 0 : 2) | Number(qe.y & Ht), Sn = rn;
      return Nt && _(rn) && (Sn = T(rn), ce ^= 1), new x(Zt, Sn, ce);
    }
    return { seed: Ue, k2sig: Wr };
  }
  const ae = { lowS: n.lowS, prehash: !1 }, yt = { lowS: n.lowS, prehash: !1 };
  function ft(H, z, V = ae) {
    const { seed: Q, k2sig: ot } = J(H, z, V), Nt = n;
    return qh(Nt.hash.outputLen, Nt.nByteLength, Nt.hmac)(Q, ot);
  }
  d.BASE._setWindowSize(8);
  function re(H, z, V, Q = yt) {
    var qe;
    const ot = H;
    if (z = Qt("msgHash", z), V = Qt("publicKey", V), "strict" in Q)
      throw new Error("options.strict was renamed to lowS");
    $l(Q);
    const { lowS: Nt, prehash: kt } = Q;
    let Et, Xe;
    try {
      if (typeof ot == "string" || ur(ot))
        try {
          Et = x.fromDER(ot);
        } catch (Zt) {
          if (!(Zt instanceof yn.Err))
            throw Zt;
          Et = x.fromCompact(ot);
        }
      else if (typeof ot == "object" && typeof ot.r == "bigint" && typeof ot.s == "bigint") {
        const { r: Zt, s: rn } = ot;
        Et = new x(Zt, rn);
      } else
        throw new Error("PARSE");
      Xe = d.fromHex(V);
    } catch (Zt) {
      if (Zt.message === "PARSE")
        throw new Error("signature must be Signature instance, Uint8Array or hex string");
      return !1;
    }
    if (Nt && Et.hasHighS())
      return !1;
    kt && (z = n.hash(z));
    const { r: be, s: Je } = Et, Ue = W(z), Ee = l(Je), Wr = c(Ue * Ee), xe = c(be * Ee), Le = (qe = d.BASE.multiplyAndAddUnsafe(Xe, Wr, xe)) == null ? void 0 : qe.toAffine();
    return Le ? c(Le.x) === be : !1;
  }
  return {
    CURVE: n,
    getPublicKey: k,
    getSharedSecret: F,
    sign: ft,
    verify: re,
    ProjectivePoint: d,
    Signature: x,
    utils: B
  };
}
/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
function Vx(e) {
  return {
    hash: e,
    hmac: (n, ...r) => Mh(e, n, ix(...r)),
    randomBytes: $h
  };
}
function Gx(e, n) {
  const r = (s) => zx({ ...e, ...Vx(s) });
  return Object.freeze({ ...r(n), create: r });
}
/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
const Si = BigInt("0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2f"), Is = BigInt("0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141"), pi = BigInt(1), Bs = BigInt(2), Fl = (e, n) => (e + n / Bs) / n;
function Zh(e) {
  const n = Si, r = BigInt(3), s = BigInt(6), u = BigInt(11), a = BigInt(22), c = BigInt(23), l = BigInt(44), d = BigInt(88), g = e * e * e % n, y = g * g * e % n, m = We(y, r, n) * y % n, E = We(m, r, n) * y % n, _ = We(E, Bs, n) * g % n, T = We(_, u, n) * _ % n, A = We(T, a, n) * T % n, x = We(A, l, n) * A % n, B = We(x, d, n) * x % n, k = We(B, l, n) * A % n, O = We(k, r, n) * y % n, F = We(O, c, n) * T % n, D = We(F, s, n) * g % n, W = We(D, Bs, n);
  if (!Qu.eql(Qu.sqr(W), e))
    throw new Error("Cannot find square root");
  return W;
}
const Qu = zh(Si, void 0, void 0, { sqrt: Zh }), Pn = Gx({
  a: BigInt(0),
  // equation params: a, b
  b: BigInt(7),
  // Seem to be rigid: bitcointalk.org/index.php?topic=289795.msg3183975#msg3183975
  Fp: Qu,
  // Field's prime: 2n**256n - 2n**32n - 2n**9n - 2n**8n - 2n**7n - 2n**6n - 2n**4n - 1n
  n: Is,
  // Curve order, total count of valid points in the field
  // Base point (x, y) aka generator point
  Gx: BigInt("55066263022277343669578718895168534326250603453777594175500187360389116729240"),
  Gy: BigInt("32670510020758816978083085130507043184471273380659243275938904335757337482424"),
  h: BigInt(1),
  // Cofactor
  lowS: !0,
  // Allow only low-S signatures by default in sign() and verify()
  /**
   * secp256k1 belongs to Koblitz curves: it has efficiently computable endomorphism.
   * Endomorphism uses 2x less RAM, speeds up precomputation by 2x and ECDH / key recovery by 20%.
   * For precomputed wNAF it trades off 1/2 init time & 1/3 ram for 20% perf hit.
   * Explanation: https://gist.github.com/paulmillr/eb670806793e84df628a7c434a873066
   */
  endo: {
    beta: BigInt("0x7ae96a2b657c07106e64479eac3434e99cf0497512f58995c1396c28719501ee"),
    splitScalar: (e) => {
      const n = Is, r = BigInt("0x3086d221a7d46bcde86c90e49284eb15"), s = -pi * BigInt("0xe4437ed6010e88286f547fa90abfe4c3"), u = BigInt("0x114ca50f7a8e2f3f657c1108d9d44cfd8"), a = r, c = BigInt("0x100000000000000000000000000000000"), l = Fl(a * e, n), d = Fl(-s * e, n);
      let g = Gt(e - l * r - d * u, n), y = Gt(-l * s - d * a, n);
      const m = g > c, E = y > c;
      if (m && (g = n - g), E && (y = n - y), g > c || y > c)
        throw new Error("splitScalar: Endomorphism failed, k=" + e);
      return { k1neg: m, k1: g, k2neg: E, k2: y };
    }
  }
}, ue), Xh = BigInt(0), Pl = {};
function Rs(e, ...n) {
  let r = Pl[e];
  if (r === void 0) {
    const s = ue(Uint8Array.from(e, (u) => u.charCodeAt(0)));
    r = ar(s, s), Pl[e] = r;
  }
  return ue(ar(r, ...n));
}
const Ta = (e) => e.toRawBytes(!0).slice(1), ju = (e) => Fn(e, 32), Cu = (e) => Gt(e, Si), gi = (e) => Gt(e, Is), Ia = Pn.ProjectivePoint, Yx = (e, n, r) => Ia.BASE.multiplyAndAddUnsafe(e, n, r);
function ta(e) {
  let n = Pn.utils.normPrivateKeyToScalar(e), r = Ia.fromPrivateKey(n);
  return { scalar: r.hasEvenY() ? n : gi(-n), bytes: Ta(r) };
}
function Jh(e) {
  Dn("x", e, pi, Si);
  const n = Cu(e * e), r = Cu(n * e + BigInt(7));
  let s = Zh(r);
  s % Bs !== Xh && (s = Cu(-s));
  const u = new Ia(e, s, pi);
  return u.assertValidity(), u;
}
const Ur = bn;
function Qh(...e) {
  return gi(Ur(Rs("BIP0340/challenge", ...e)));
}
function Zx(e) {
  return ta(e).bytes;
}
function Xx(e, n, r = $h(32)) {
  const s = Qt("message", e), { bytes: u, scalar: a } = ta(n), c = Qt("auxRand", r, 32), l = ju(a ^ Ur(Rs("BIP0340/aux", c))), d = Rs("BIP0340/nonce", l, u, s), g = gi(Ur(d));
  if (g === Xh)
    throw new Error("sign failed: k is zero");
  const { bytes: y, scalar: m } = ta(g), E = Qh(y, u, s), _ = new Uint8Array(64);
  if (_.set(y, 0), _.set(ju(gi(m + E * a)), 32), !jh(_, s, u))
    throw new Error("sign: Invalid signature produced");
  return _;
}
function jh(e, n, r) {
  const s = Qt("signature", e, 64), u = Qt("message", n), a = Qt("publicKey", r, 32);
  try {
    const c = Jh(Ur(a)), l = Ur(s.subarray(0, 32));
    if (!$r(l, pi, Si))
      return !1;
    const d = Ur(s.subarray(32, 64));
    if (!$r(d, pi, Is))
      return !1;
    const g = Qh(ju(l), Ta(c), u), y = Yx(c, d, gi(-g));
    return !(!y || !y.hasEvenY() || y.toAffine().x !== l);
  } catch {
    return !1;
  }
}
const Wn = {
  getPublicKey: Zx,
  sign: Xx,
  verify: jh,
  utils: {
    randomPrivateKey: Pn.utils.randomPrivateKey,
    lift_x: Jh,
    pointToBytes: Ta,
    numberToBytesBE: Fn,
    bytesToNumberBE: bn,
    taggedHash: Rs,
    mod: Gt
  }
}, Ys = Pn.ProjectivePoint, Us = Pn.CURVE.n, { isBytes: _t, concatBytes: tr, equalBytes: Vt } = FE, Zs = (e) => gx(ue(e)), On = (...e) => ue(ue(tr(...e))), td = Wn.getPublicKey, Jx = Pn.getPublicKey, Wl = (e) => e.r < Us / 2n;
function Qx(e, n, r = !1) {
  let s = Pn.sign(e, n);
  if (r && !Wl(s)) {
    const u = new Uint8Array(32);
    let a = 0;
    for (; !Wl(s); )
      if (u.set(wt.encode(a++)), s = Pn.sign(e, n, { extraEntropy: u }), a > 4294967295)
        throw new Error("lowR counter overflow: report the error");
  }
  return s.toDERRawBytes();
}
const Ml = Wn.sign, ed = Wn.utils.taggedHash;
var Yt;
(function(e) {
  e[e.ecdsa = 0] = "ecdsa", e[e.schnorr = 1] = "schnorr";
})(Yt || (Yt = {}));
function cr(e, n) {
  const r = e.length;
  if (n === Yt.ecdsa) {
    if (r === 32)
      throw new Error("Expected non-Schnorr key");
    return Ys.fromHex(e), e;
  } else if (n === Yt.schnorr) {
    if (r !== 32)
      throw new Error("Expected 32-byte Schnorr key");
    return Wn.utils.lift_x(Wn.utils.bytesToNumberBE(e)), e;
  } else
    throw new Error("Unknown key type");
}
function nd(e, n) {
  const r = Wn.utils, s = r.taggedHash("TapTweak", e, n), u = r.bytesToNumberBE(s);
  if (u >= Us)
    throw new Error("tweak higher than curve order");
  return u;
}
function jx(e, n = new Uint8Array()) {
  const r = Wn.utils, s = r.bytesToNumberBE(e), u = Ys.fromPrivateKey(s), a = u.hasEvenY() ? s : r.mod(-s, Us), c = r.pointToBytes(u), l = nd(c, n);
  return r.numberToBytesBE(r.mod(a + l, Us), 32);
}
function rd(e, n) {
  const r = Wn.utils, s = nd(e, n), a = r.lift_x(r.bytesToNumberBE(e)).add(Ys.fromPrivateKey(s)), c = a.hasEvenY() ? 0 : 1;
  return [r.pointToBytes(a), c];
}
const id = ue(Ys.BASE.toRawBytes(!1)), xn = {
  bech32: "bc",
  pubKeyHash: 0,
  scriptHash: 5,
  wif: 128
};
function Ls(e, n) {
  if (!_t(e) || !_t(n))
    throw new Error(`cmp: wrong type a=${typeof e} b=${typeof n}`);
  const r = Math.min(e.length, n.length);
  for (let s = 0; s < r; s++)
    if (e[s] != n[s])
      return Math.sign(e[s] - n[s]);
  return Math.sign(e.length - n.length);
}
var Dt;
(function(e) {
  e[e.OP_0 = 0] = "OP_0", e[e.PUSHDATA1 = 76] = "PUSHDATA1", e[e.PUSHDATA2 = 77] = "PUSHDATA2", e[e.PUSHDATA4 = 78] = "PUSHDATA4", e[e["1NEGATE"] = 79] = "1NEGATE", e[e.RESERVED = 80] = "RESERVED", e[e.OP_1 = 81] = "OP_1", e[e.OP_2 = 82] = "OP_2", e[e.OP_3 = 83] = "OP_3", e[e.OP_4 = 84] = "OP_4", e[e.OP_5 = 85] = "OP_5", e[e.OP_6 = 86] = "OP_6", e[e.OP_7 = 87] = "OP_7", e[e.OP_8 = 88] = "OP_8", e[e.OP_9 = 89] = "OP_9", e[e.OP_10 = 90] = "OP_10", e[e.OP_11 = 91] = "OP_11", e[e.OP_12 = 92] = "OP_12", e[e.OP_13 = 93] = "OP_13", e[e.OP_14 = 94] = "OP_14", e[e.OP_15 = 95] = "OP_15", e[e.OP_16 = 96] = "OP_16", e[e.NOP = 97] = "NOP", e[e.VER = 98] = "VER", e[e.IF = 99] = "IF", e[e.NOTIF = 100] = "NOTIF", e[e.VERIF = 101] = "VERIF", e[e.VERNOTIF = 102] = "VERNOTIF", e[e.ELSE = 103] = "ELSE", e[e.ENDIF = 104] = "ENDIF", e[e.VERIFY = 105] = "VERIFY", e[e.RETURN = 106] = "RETURN", e[e.TOALTSTACK = 107] = "TOALTSTACK", e[e.FROMALTSTACK = 108] = "FROMALTSTACK", e[e["2DROP"] = 109] = "2DROP", e[e["2DUP"] = 110] = "2DUP", e[e["3DUP"] = 111] = "3DUP", e[e["2OVER"] = 112] = "2OVER", e[e["2ROT"] = 113] = "2ROT", e[e["2SWAP"] = 114] = "2SWAP", e[e.IFDUP = 115] = "IFDUP", e[e.DEPTH = 116] = "DEPTH", e[e.DROP = 117] = "DROP", e[e.DUP = 118] = "DUP", e[e.NIP = 119] = "NIP", e[e.OVER = 120] = "OVER", e[e.PICK = 121] = "PICK", e[e.ROLL = 122] = "ROLL", e[e.ROT = 123] = "ROT", e[e.SWAP = 124] = "SWAP", e[e.TUCK = 125] = "TUCK", e[e.CAT = 126] = "CAT", e[e.SUBSTR = 127] = "SUBSTR", e[e.LEFT = 128] = "LEFT", e[e.RIGHT = 129] = "RIGHT", e[e.SIZE = 130] = "SIZE", e[e.INVERT = 131] = "INVERT", e[e.AND = 132] = "AND", e[e.OR = 133] = "OR", e[e.XOR = 134] = "XOR", e[e.EQUAL = 135] = "EQUAL", e[e.EQUALVERIFY = 136] = "EQUALVERIFY", e[e.RESERVED1 = 137] = "RESERVED1", e[e.RESERVED2 = 138] = "RESERVED2", e[e["1ADD"] = 139] = "1ADD", e[e["1SUB"] = 140] = "1SUB", e[e["2MUL"] = 141] = "2MUL", e[e["2DIV"] = 142] = "2DIV", e[e.NEGATE = 143] = "NEGATE", e[e.ABS = 144] = "ABS", e[e.NOT = 145] = "NOT", e[e["0NOTEQUAL"] = 146] = "0NOTEQUAL", e[e.ADD = 147] = "ADD", e[e.SUB = 148] = "SUB", e[e.MUL = 149] = "MUL", e[e.DIV = 150] = "DIV", e[e.MOD = 151] = "MOD", e[e.LSHIFT = 152] = "LSHIFT", e[e.RSHIFT = 153] = "RSHIFT", e[e.BOOLAND = 154] = "BOOLAND", e[e.BOOLOR = 155] = "BOOLOR", e[e.NUMEQUAL = 156] = "NUMEQUAL", e[e.NUMEQUALVERIFY = 157] = "NUMEQUALVERIFY", e[e.NUMNOTEQUAL = 158] = "NUMNOTEQUAL", e[e.LESSTHAN = 159] = "LESSTHAN", e[e.GREATERTHAN = 160] = "GREATERTHAN", e[e.LESSTHANOREQUAL = 161] = "LESSTHANOREQUAL", e[e.GREATERTHANOREQUAL = 162] = "GREATERTHANOREQUAL", e[e.MIN = 163] = "MIN", e[e.MAX = 164] = "MAX", e[e.WITHIN = 165] = "WITHIN", e[e.RIPEMD160 = 166] = "RIPEMD160", e[e.SHA1 = 167] = "SHA1", e[e.SHA256 = 168] = "SHA256", e[e.HASH160 = 169] = "HASH160", e[e.HASH256 = 170] = "HASH256", e[e.CODESEPARATOR = 171] = "CODESEPARATOR", e[e.CHECKSIG = 172] = "CHECKSIG", e[e.CHECKSIGVERIFY = 173] = "CHECKSIGVERIFY", e[e.CHECKMULTISIG = 174] = "CHECKMULTISIG", e[e.CHECKMULTISIGVERIFY = 175] = "CHECKMULTISIGVERIFY", e[e.NOP1 = 176] = "NOP1", e[e.CHECKLOCKTIMEVERIFY = 177] = "CHECKLOCKTIMEVERIFY", e[e.CHECKSEQUENCEVERIFY = 178] = "CHECKSEQUENCEVERIFY", e[e.NOP4 = 179] = "NOP4", e[e.NOP5 = 180] = "NOP5", e[e.NOP6 = 181] = "NOP6", e[e.NOP7 = 182] = "NOP7", e[e.NOP8 = 183] = "NOP8", e[e.NOP9 = 184] = "NOP9", e[e.NOP10 = 185] = "NOP10", e[e.CHECKSIGADD = 186] = "CHECKSIGADD", e[e.INVALID = 255] = "INVALID";
})(Dt || (Dt = {}));
function sd(e = 6, n = !1) {
  return me({
    encodeStream: (r, s) => {
      if (s === 0n)
        return;
      const u = s < 0, a = BigInt(s), c = [];
      for (let l = u ? -a : a; l; l >>= 8n)
        c.push(Number(l & 0xffn));
      c[c.length - 1] >= 128 ? c.push(u ? 128 : 0) : u && (c[c.length - 1] |= 128), r.bytes(new Uint8Array(c));
    },
    decodeStream: (r) => {
      const s = r.leftBytes;
      if (s > e)
        throw new Error(`ScriptNum: number (${s}) bigger than limit=${e}`);
      if (s === 0)
        return 0n;
      if (n) {
        const c = r.bytes(s, !0);
        if (!(c[c.length - 1] & 127) && (s <= 1 || !(c[c.length - 2] & 128)))
          throw new Error("Non-minimally encoded ScriptNum");
      }
      let u = 0, a = 0n;
      for (let c = 0; c < s; ++c)
        u = r.byte(), a |= BigInt(u) << 8n * BigInt(c);
      return u >= 128 && (a &= 2n ** BigInt(s * 8) - 1n >> 1n, a = -a), a;
    }
  });
}
function tS(e, n = 4, r = !0) {
  if (typeof e == "number")
    return e;
  if (_t(e))
    try {
      const s = sd(n, r).decode(e);
      return s > Number.MAX_SAFE_INTEGER ? void 0 : Number(s);
    } catch {
      return;
    }
}
const bt = me({
  encodeStream: (e, n) => {
    for (let r of n) {
      if (typeof r == "string") {
        if (Dt[r] === void 0)
          throw new Error(`Unknown opcode=${r}`);
        e.byte(Dt[r]);
        continue;
      } else if (typeof r == "number") {
        if (r === 0) {
          e.byte(0);
          continue;
        } else if (1 <= r && r <= 16) {
          e.byte(Dt.OP_1 - 1 + r);
          continue;
        }
      }
      if (typeof r == "number" && (r = sd().encode(BigInt(r))), !_t(r))
        throw new Error(`Wrong Script OP=${r} (${typeof r})`);
      const s = r.length;
      s < Dt.PUSHDATA1 ? e.byte(s) : s <= 255 ? (e.byte(Dt.PUSHDATA1), e.byte(s)) : s <= 65535 ? (e.byte(Dt.PUSHDATA2), e.bytes(Bl.encode(s))) : (e.byte(Dt.PUSHDATA4), e.bytes(wt.encode(s))), e.bytes(r);
    }
  },
  decodeStream: (e) => {
    const n = [];
    for (; !e.isEnd(); ) {
      const r = e.byte();
      if (Dt.OP_0 < r && r <= Dt.PUSHDATA4) {
        let s;
        if (r < Dt.PUSHDATA1)
          s = r;
        else if (r === Dt.PUSHDATA1)
          s = $n.decodeStream(e);
        else if (r === Dt.PUSHDATA2)
          s = Bl.decodeStream(e);
        else if (r === Dt.PUSHDATA4)
          s = wt.decodeStream(e);
        else
          throw new Error("Should be not possible");
        n.push(e.bytes(s));
      } else if (r === 0)
        n.push(0);
      else if (Dt.OP_1 <= r && r <= Dt.OP_16)
        n.push(r - (Dt.OP_1 - 1));
      else {
        const s = Dt[r];
        if (s === void 0)
          throw new Error(`Unknown opcode=${r.toString(16)}`);
        n.push(s);
      }
    }
    return n;
  }
}), Hl = {
  253: [253, 2, 253n, 65535n],
  254: [254, 4, 65536n, 4294967295n],
  255: [255, 8, 4294967296n, 18446744073709551615n]
}, Xs = me({
  encodeStream: (e, n) => {
    if (typeof n == "number" && (n = BigInt(n)), 0n <= n && n <= 252n)
      return e.byte(Number(n));
    for (const [r, s, u, a] of Object.values(Hl))
      if (!(u > n || n > a)) {
        e.byte(r);
        for (let c = 0; c < s; c++)
          e.byte(Number(n >> 8n * BigInt(c) & 0xffn));
        return;
      }
    throw e.err(`VarInt too big: ${n}`);
  },
  decodeStream: (e) => {
    const n = e.byte();
    if (n <= 252)
      return BigInt(n);
    const [r, s, u] = Hl[n];
    let a = 0n;
    for (let c = 0; c < s; c++)
      a |= BigInt(e.byte()) << 8n * BigInt(c);
    if (a < u)
      throw e.err(`Wrong CompactSize(${8 * s})`);
    return a;
  }
}), ee = or(Xs, zs.numberBigint), pe = It(Xs), Js = ye(ee, pe), Cs = (e) => ye(Xs, e), od = ne({
  txid: It(32, !0),
  // hash(prev_tx),
  index: wt,
  // output number of previous tx
  finalScriptSig: pe,
  // btc merges input and output script, executes it. If ok = tx passes
  sequence: wt
  // ?
}), nr = ne({ amount: bs, script: pe }), eS = ne({
  version: Ir,
  segwitFlag: JE(new Uint8Array([0, 1])),
  inputs: Cs(od),
  outputs: Cs(nr),
  witnesses: QE("segwitFlag", ye("inputs/length", Js)),
  // < 500000000	Block number at which this transaction is unlocked
  // >= 500000000	UNIX timestamp at which this transaction is unlocked
  // Handled as part of PSBTv2
  lockTime: wt
});
function nS(e) {
  if (e.segwitFlag && e.witnesses && !e.witnesses.length)
    throw new Error("Segwit flag with empty witnesses array");
  return e;
}
const Lr = Re(eS, nS), fi = ne({
  version: Ir,
  inputs: Cs(od),
  outputs: Cs(nr),
  lockTime: wt
});
function li(e) {
  if (e.nonWitnessUtxo) {
    if (e.index === void 0)
      throw new Error("Unknown input index");
    return e.nonWitnessUtxo.outputs[e.index];
  } else {
    if (e.witnessUtxo)
      return e.witnessUtxo;
    throw new Error("Cannot find previous output info");
  }
}
function ea(e, n, r, s = !1) {
  let { nonWitnessUtxo: u, txid: a } = e;
  typeof u == "string" && (u = dt.decode(u)), _t(u) && (u = Lr.decode(u)), !("nonWitnessUtxo" in e) && u === void 0 && (u = n == null ? void 0 : n.nonWitnessUtxo), typeof a == "string" && (a = dt.decode(a)), a === void 0 && (a = n == null ? void 0 : n.txid);
  let c = { ...n, ...e, nonWitnessUtxo: u, txid: a };
  !("nonWitnessUtxo" in e) && c.nonWitnessUtxo === void 0 && delete c.nonWitnessUtxo, c.sequence === void 0 && (c.sequence = ad), c.tapMerkleRoot === null && delete c.tapMerkleRoot, c = sa(js, c, n, r), Ua.encode(c);
  let l;
  return c.nonWitnessUtxo && c.index !== void 0 ? l = c.nonWitnessUtxo.outputs[c.index] : c.witnessUtxo && (l = c.witnessUtxo), l && !s && to(l && l.script, c.redeemScript, c.witnessScript), c;
}
function Es(e, n = !1) {
  let r = "legacy", s = St.ALL;
  const u = li(e), a = Lt.decode(u.script);
  let c = a.type, l = a;
  const d = [a];
  if (a.type === "tr")
    return s = St.DEFAULT, {
      txType: "taproot",
      type: "tr",
      last: a,
      lastScript: u.script,
      defaultSighash: s,
      sighash: e.sighashType || s
    };
  {
    if ((a.type === "wpkh" || a.type === "wsh") && (r = "segwit"), a.type === "sh") {
      if (!e.redeemScript)
        throw new Error("inputType: sh without redeemScript");
      let E = Lt.decode(e.redeemScript);
      (E.type === "wpkh" || E.type === "wsh") && (r = "segwit"), d.push(E), l = E, c += `-${E.type}`;
    }
    if (l.type === "wsh") {
      if (!e.witnessScript)
        throw new Error("inputType: wsh without witnessScript");
      let E = Lt.decode(e.witnessScript);
      E.type === "wsh" && (r = "segwit"), d.push(E), l = E, c += `-${E.type}`;
    }
    const g = d[d.length - 1];
    if (g.type === "sh" || g.type === "wsh")
      throw new Error("inputType: sh/wsh cannot be terminal type");
    const y = Lt.encode(g), m = {
      type: c,
      txType: r,
      last: g,
      lastScript: y,
      defaultSighash: s,
      sighash: e.sighashType || s
    };
    if (r === "legacy" && !n && !e.nonWitnessUtxo)
      throw new Error("Transaction/sign: legacy input without nonWitnessUtxo, can result in attack that forces paying higher fees. Pass allowLegacyWitnessUtxo=true, if you sure");
    return m;
  }
}
const na = (e) => Math.ceil(e / 4), gs = (e) => Rr.encode(e);
function rS(e, n, r) {
  if (!e || !e.length)
    throw new Error("no leafs");
  const s = () => new Uint8Array(n), u = e.sort((a, c) => gs(a[0]).length - gs(c[0]).length);
  for (const [a, c] of u) {
    const l = c.slice(0, -1), d = c[c.length - 1], g = Lt.decode(l);
    let y = [];
    if (g.type === "tr_ms") {
      const m = g.m, E = g.pubkeys.length - m;
      for (let _ = 0; _ < m; _++)
        y.push(s());
      for (let _ = 0; _ < E; _++)
        y.push(gt);
    } else if (g.type === "tr_ns")
      for (const m of g.pubkeys)
        y.push(s());
    else {
      if (!r)
        throw new Error("Finalize: Unknown tapLeafScript");
      const m = xs(l, d);
      for (const E of r) {
        if (!E.finalizeTaproot)
          continue;
        const _ = bt.decode(l), T = E.encode(_);
        if (T === void 0)
          continue;
        const A = _.filter((B) => {
          if (!_t(B))
            return !1;
          try {
            return cr(B, Yt.schnorr), !0;
          } catch {
            return !1;
          }
        }), x = E.finalizeTaproot(l, T, A.map((B) => [{ pubKey: B, leafHash: m }, s()]));
        if (x)
          return x.concat(gs(a));
      }
    }
    return y.reverse().concat([l, gs(a)]);
  }
  throw new Error("there was no witness");
}
function iS(e, n, r) {
  let s = gt, u;
  if (e.txType === "taproot") {
    const l = e.sighash !== St.DEFAULT ? 65 : 64;
    if (n.tapInternalKey && !Vt(n.tapInternalKey, id))
      u = [new Uint8Array(l)];
    else if (n.tapLeafScript)
      u = rS(n.tapLeafScript, l, r.customScripts);
    else
      throw new Error("estimateInput/taproot: unknown input");
  } else {
    const l = () => new Uint8Array(72), d = () => new Uint8Array(33);
    let g = gt, y = [];
    const m = e.last.type;
    if (m === "ms") {
      const E = e.last.m, _ = [0];
      for (let T = 0; T < E; T++)
        _.push(l());
      g = bt.encode(_);
    } else if (m === "pk")
      g = bt.encode([l()]);
    else if (m === "pkh")
      g = bt.encode([l(), d()]);
    else if (m === "wpkh")
      g = gt, y = [l(), d()];
    else if (m === "unknown" && !r.allowUnknownInputs)
      throw new Error("Unknown inputs are not allowed");
    e.type.includes("wsh-") && (g.length && e.lastScript.length && (y = bt.decode(g).map((E) => {
      if (E === 0)
        return gt;
      if (_t(E))
        return E;
      throw new Error(`Wrong witness op=${E}`);
    })), y = y.concat(e.lastScript)), e.txType === "segwit" && (u = y), e.type.startsWith("sh-wsh-") ? s = bt.encode([bt.encode([0, new Uint8Array(ue.outputLen)])]) : e.type.startsWith("sh-") ? s = bt.encode([...bt.decode(g), e.lastScript]) : e.type.startsWith("wsh-") || e.txType !== "segwit" && (s = g);
  }
  let a = 160 + 4 * pe.encode(s).length, c = !1;
  return u && (a += Js.encode(u).length, c = !0), { weight: a, hasWitnesses: c };
}
const ql = (e, n) => {
  const r = e - n;
  return r < 0n ? -1 : r > 0n ? 1 : 0;
};
function Nu(e, n = {}, r = xn) {
  let s;
  if ("script" in e && e.script instanceof Uint8Array && (s = e.script), "address" in e) {
    if (typeof e.address != "string")
      throw new Error(`Estimator: wrong output address=${e.address}`);
    s = Lt.encode(Mn(r).decode(e.address));
  }
  if (!s)
    throw new Error("Estimator: wrong output script");
  if (typeof e.amount != "bigint")
    throw new Error(`Estimator: wrong output amount=${e.amount}, should be of type bigint but got ${typeof e.amount}.`);
  if (s && !n.allowUnknownOutputs && Lt.decode(s).type === "unknown")
    throw new Error("Estimator: unknown output script type, there is a chance that input is unspendable. Pass allowUnknownOutputs=true, if you sure");
  return n.disableScriptCheck || to(s), s;
}
class ud {
  constructor(n, r, s) {
    if (this.outputs = r, this.opts = s, this.requiredIndices = [], typeof s.feePerByte != "bigint")
      throw new Error(`Estimator: wrong feePerByte=${s.feePerByte}, should be of type bigint but got ${typeof s.feePerByte}.`);
    const c = s.dust === void 0 ? BigInt(148 + 34) : s.dust;
    if (typeof c != "bigint")
      throw new Error(`Estimator: wrong dust=${s.dust}, should be of type bigint but got ${typeof s.dust}.`);
    const l = s.dustRelayFeeRate === void 0 ? 3n : s.dustRelayFeeRate;
    if (typeof l != "bigint")
      throw new Error(`Estimator: wrong dustRelayFeeRate=${s.dustRelayFeeRate}, should be of type bigint but got ${typeof s.dustRelayFeeRate}.`);
    if (this.dust = c * l, s.requiredInputs !== void 0 && !Array.isArray(s.requiredInputs))
      throw new Error(`Estimator: wrong required inputs=${s.requiredInputs}`);
    const d = s.network || xn;
    let g = 0n, y = 32;
    for (const T of r) {
      const A = Nu(T, s, s.network);
      y += 32 + 4 * pe.encode(A).length, g += T.amount;
    }
    if (typeof s.changeAddress != "string")
      throw new Error(`Estimator: wrong change address=${s.changeAddress}`);
    let m = y + 32 + 4 * pe.encode(Lt.encode(Mn(d).decode(s.changeAddress))).length;
    y += 4 * ee.encode(r.length).length, m += 4 * ee.encode(r.length + 1).length, this.baseWeight = y, this.changeWeight = m, this.amount = g;
    const E = Array.from(n);
    if (s.requiredInputs)
      for (let T = 0; T < s.requiredInputs.length; T++)
        this.requiredIndices.push(E.push(s.requiredInputs[T]) - 1);
    const _ = /* @__PURE__ */ new Set();
    this.normalizedInputs = E.map((T) => {
      const A = ea(T, void 0, void 0, s.disableScriptCheck);
      Tr(A);
      const x = `${dt.encode(A.txid)}:${A.index}`;
      if (!s.allowSameUtxo && _.has(x))
        throw new Error(`Estimator: same input passed multiple times: ${x}`);
      _.add(x);
      const B = Es(A, s.allowLegacyWitnessUtxo), k = li(A), O = iS(B, A, this.opts), F = k.amount - s.feePerByte * BigInt(na(O.weight));
      return { inputType: B, normalized: A, amount: k.amount, value: F, estimate: O };
    });
  }
  checkInputIdx(n) {
    if (!Number.isSafeInteger(n) || 0 > n || n >= this.normalizedInputs.length)
      throw new Error(`Wrong input index=${n}`);
    return n;
  }
  sortIndices(n) {
    return n.slice().sort((r, s) => {
      const u = this.normalizedInputs[this.checkInputIdx(r)], a = this.normalizedInputs[this.checkInputIdx(s)], c = Ls(u.normalized.txid, a.normalized.txid);
      return c !== 0 ? c : u.normalized.index - a.normalized.index;
    });
  }
  sortOutputs(n) {
    const r = n.map((u) => Nu(u, this.opts, this.opts.network));
    return n.map((u, a) => a).sort((u, a) => {
      const c = n[u].amount, l = n[a].amount, d = ql(c, l);
      return d !== 0 ? d : Ls(r[u], r[a]);
    });
  }
  getSatoshi(n) {
    return this.opts.feePerByte * BigInt(na(n));
  }
  // Sort by value instead of amount
  get biggest() {
    return this.normalizedInputs.map((n, r) => r).sort((n, r) => ql(this.normalizedInputs[r].value, this.normalizedInputs[n].value));
  }
  get smallest() {
    return this.biggest.reverse();
  }
  // These assume that UTXO array has historical order.
  // Otherwise, we have no way to know which tx is oldest
  // Explorers usually give UTXO in this order.
  get oldest() {
    return this.normalizedInputs.map((n, r) => r);
  }
  get newest() {
    return this.oldest.reverse();
  }
  // exact - like blackjack from coinselect.
  // exact(biggest) will select one big utxo which is closer to targetValue+dust, if possible.
  // If not, it will accumulate largest utxo until value is close to targetValue+dust.
  accumulate(n, r = !1, s = !0, u = !1) {
    let a = this.opts.alwaysChange ? this.changeWeight : this.baseWeight, c = !1, l = 0, d = 0n;
    const g = this.amount, y = [];
    let m;
    for (const E of this.requiredIndices) {
      this.checkInputIdx(E);
      const { estimate: _, amount: T } = this.normalizedInputs[E];
      let A = a + _.weight;
      !c && _.hasWitnesses && (A += 2);
      const x = A + 4 * ee.encode(l).length;
      if (m = this.getSatoshi(x), a = A, _.hasWitnesses && (c = !0), l++, d += T, y.push(E), !u && g + m <= d)
        return { indices: y, fee: m, weight: x, total: d };
    }
    for (const E of n) {
      this.checkInputIdx(E);
      const { estimate: _, amount: T, value: A } = this.normalizedInputs[E];
      let x = a + _.weight;
      !c && _.hasWitnesses && (x += 2);
      const B = x + 4 * ee.encode(l).length;
      if (m = this.getSatoshi(B), !(r && T + d > g + m + this.dust) && !(s && A <= 0n) && (a = x, _.hasWitnesses && (c = !0), l++, d += T, y.push(E), !u && g + m <= d))
        return { indices: y, fee: m, weight: B, total: d };
    }
    if (u) {
      const E = a + 4 * ee.encode(l).length;
      return { indices: y, fee: m, weight: E, total: d };
    }
  }
  // Works like coinselect default method
  default() {
    const { biggest: n } = this, r = this.accumulate(n, !0, !1);
    return r || this.accumulate(n);
  }
  select(n) {
    if (n === "all")
      return this.accumulate(this.normalizedInputs.map((s, u) => u), !1, !0, !0);
    if (n === "default")
      return this.default();
    const r = {
      Oldest: () => this.oldest,
      Newest: () => this.newest,
      Smallest: () => this.smallest,
      Biggest: () => this.biggest
    };
    if (n.startsWith("exact")) {
      const [s, u] = n.slice(5).split("/");
      if (!r[s])
        throw new Error(`Estimator.select: wrong strategy=${n}`);
      n = u;
      const a = this.accumulate(r[s](), !0, !0);
      if (a)
        return a;
    }
    if (n.startsWith("accum")) {
      const s = n.slice(5);
      if (!r[s])
        throw new Error(`Estimator.select: wrong strategy=${n}`);
      return this.accumulate(r[s]());
    }
    throw new Error(`Estimator.select: wrong strategy=${n}`);
  }
  result(n) {
    const r = this.select(n);
    if (!r)
      return;
    const { indices: s, weight: u, total: a } = r;
    let c = this.opts.alwaysChange;
    const l = this.opts.alwaysChange ? u : u + (this.changeWeight - this.baseWeight), d = this.getSatoshi(l);
    let g = r.fee;
    const y = a - this.amount - d;
    y > this.dust && (c = !0);
    let m = s, E = Array.from(this.outputs);
    if (c) {
      if (g = d, y < 0n)
        throw new Error(`Estimator.result: negative change=${y}`);
      E.push({ address: this.opts.changeAddress, amount: y });
    }
    this.opts.bip69 && (m = this.sortIndices(m), E = this.sortOutputs(E).map((A) => E[A]));
    const _ = {
      inputs: m.map((A) => this.normalizedInputs[A].normalized),
      outputs: E,
      fee: g,
      weight: this.opts.alwaysChange ? r.weight : l,
      change: !!c
    };
    let T;
    if (this.opts.createTx) {
      const { inputs: A, outputs: x } = _;
      T = new te(this.opts);
      for (const B of A)
        T.addInput(B);
      for (const B of x)
        T.addOutput({ ...B, script: Nu(B, this.opts, this.opts.network) });
    }
    return { ..._, tx: T };
  }
}
function Kl(e, n, r, s) {
  const u = { createTx: !0, bip69: !0, ...s };
  return new ud(e, n, u).result(r);
}
const ws = new Uint8Array(32), sS = {
  amount: 0xffffffffffffffffn,
  script: gt
}, oS = 8, uS = 2, Jn = 0, ad = 4294967295;
zs.decimal(oS);
const hi = (e, n) => e === void 0 ? n : e;
function Ns(e) {
  if (Array.isArray(e))
    return e.map((n) => Ns(n));
  if (e instanceof Uint8Array)
    return Uint8Array.from(e);
  if (["number", "bigint", "boolean", "string", "undefined"].includes(typeof e))
    return e;
  if (e === null)
    return e;
  if (typeof e == "object")
    return Object.fromEntries(Object.entries(e).map(([n, r]) => [n, Ns(r)]));
  throw new Error(`cloneDeep: unknown type=${e} (${typeof e})`);
}
var St;
(function(e) {
  e[e.DEFAULT = 0] = "DEFAULT", e[e.ALL = 1] = "ALL", e[e.NONE = 2] = "NONE", e[e.SINGLE = 3] = "SINGLE", e[e.ANYONECANPAY = 128] = "ANYONECANPAY";
})(St || (St = {}));
var jt;
(function(e) {
  e[e.DEFAULT = 0] = "DEFAULT", e[e.ALL = 1] = "ALL", e[e.NONE = 2] = "NONE", e[e.SINGLE = 3] = "SINGLE", e[e.DEFAULT_ANYONECANPAY = 128] = "DEFAULT_ANYONECANPAY", e[e.ALL_ANYONECANPAY = 129] = "ALL_ANYONECANPAY", e[e.NONE_ANYONECANPAY = 130] = "NONE_ANYONECANPAY", e[e.SINGLE_ANYONECANPAY = 131] = "SINGLE_ANYONECANPAY";
})(jt || (jt = {}));
function aS(e, n, r, s = gt) {
  return Vt(r, n) && (e = jx(e, s), n = td(e)), { privKey: e, pubKey: n };
}
function Qn(e) {
  if (e.script === void 0 || e.amount === void 0)
    throw new Error("Transaction/output: script and amount required");
  return { script: e.script, amount: e.amount };
}
function Tr(e) {
  if (e.txid === void 0 || e.index === void 0)
    throw new Error("Transaction/input: txid and index required");
  return {
    txid: e.txid,
    index: e.index,
    sequence: hi(e.sequence, ad),
    finalScriptSig: hi(e.finalScriptSig, gt)
  };
}
function ku(e) {
  for (const n in e) {
    const r = n;
    gS.includes(r) || delete e[r];
  }
}
const Ou = ne({ txid: It(32, !0), index: wt });
function cS(e) {
  if (typeof e != "number" || typeof jt[e] != "string")
    throw new Error(`Invalid SigHash=${e}`);
  return e;
}
function zl(e) {
  const n = e & 31;
  return {
    isAny: !!(e & St.ANYONECANPAY),
    isNone: n === St.NONE,
    isSingle: n === St.SINGLE
  };
}
function fS(e) {
  if (e !== void 0 && {}.toString.call(e) !== "[object Object]")
    throw new Error(`Wrong object type for transaction options: ${e}`);
  const n = {
    ...e,
    // Defaults
    version: hi(e.version, uS),
    lockTime: hi(e.lockTime, 0),
    PSBTVersion: hi(e.PSBTVersion, 0)
  };
  if (typeof n.allowUnknowInput < "u" && (e.allowUnknownInputs = n.allowUnknowInput), typeof n.allowUnknowOutput < "u" && (e.allowUnknownOutputs = n.allowUnknowOutput), ![-1, 0, 1, 2].includes(n.version))
    throw new Error(`Unknown version: ${n.version}`);
  if (typeof n.lockTime != "number")
    throw new Error("Transaction lock time should be number");
  if (wt.encode(n.lockTime), n.PSBTVersion !== 0 && n.PSBTVersion !== 2)
    throw new Error(`Unknown PSBT version ${n.PSBTVersion}`);
  for (const r of [
    "allowUnknownOutputs",
    "allowUnknownInputs",
    "disableScriptCheck",
    "bip174jsCompat",
    "allowLegacyWitnessUtxo",
    "lowR"
  ]) {
    const s = n[r];
    if (s !== void 0 && typeof s != "boolean")
      throw new Error(`Transation options wrong type: ${r}=${s} (${typeof s})`);
  }
  if (n.customScripts !== void 0) {
    const r = n.customScripts;
    if (!Array.isArray(r))
      throw new Error(`wrong custom scripts type (expected array): customScripts=${r} (${typeof r})`);
    for (const s of r) {
      if (typeof s.encode != "function" || typeof s.decode != "function")
        throw new Error(`wrong script=${s} (${typeof s})`);
      if (s.finalizeTaproot !== void 0 && typeof s.finalizeTaproot != "function")
        throw new Error(`wrong script=${s} (${typeof s})`);
    }
  }
  return Object.freeze(n);
}
class te {
  constructor(n = {}) {
    this.global = {}, this.inputs = [], this.outputs = [];
    const r = this.opts = fS(n);
    r.lockTime !== Jn && (this.global.fallbackLocktime = r.lockTime), this.global.txVersion = r.version;
  }
  // Import
  static fromRaw(n, r = {}) {
    const s = Lr.decode(n), u = new te({ ...r, version: s.version, lockTime: s.lockTime });
    for (const a of s.outputs)
      u.addOutput(a);
    if (u.outputs = s.outputs, u.inputs = s.inputs, s.witnesses)
      for (let a = 0; a < s.witnesses.length; a++)
        u.inputs[a].finalScriptWitness = s.witnesses[a];
    return u;
  }
  // PSBT
  static fromPSBT(n, r = {}) {
    let s;
    try {
      s = Xl.decode(n);
    } catch (m) {
      try {
        s = Jl.decode(n);
      } catch {
        throw m;
      }
    }
    const u = s.global.version || 0;
    if (u !== 0 && u !== 2)
      throw new Error(`Wrong PSBT version=${u}`);
    const a = s.global.unsignedTx, c = u === 0 ? a == null ? void 0 : a.version : s.global.txVersion, l = u === 0 ? a == null ? void 0 : a.lockTime : s.global.fallbackLocktime, d = new te({ ...r, version: c, lockTime: l, PSBTVersion: u }), g = u === 0 ? a == null ? void 0 : a.inputs.length : s.global.inputCount;
    d.inputs = s.inputs.slice(0, g).map((m, E) => {
      var _;
      return {
        finalScriptSig: gt,
        ...(_ = s.global.unsignedTx) == null ? void 0 : _.inputs[E],
        ...m
      };
    });
    const y = u === 0 ? a == null ? void 0 : a.outputs.length : s.global.outputCount;
    return d.outputs = s.outputs.slice(0, y).map((m, E) => {
      var _;
      return {
        ...m,
        ...(_ = s.global.unsignedTx) == null ? void 0 : _.outputs[E]
      };
    }), d.global = { ...s.global, txVersion: c }, l !== Jn && (d.global.fallbackLocktime = l), d;
  }
  toPSBT(n = this.opts.PSBTVersion) {
    if (n !== 0 && n !== 2)
      throw new Error(`Wrong PSBT version=${n}`);
    const r = this.inputs.map((a) => Zl(n, js, a));
    for (const a of r)
      a.partialSig && !a.partialSig.length && delete a.partialSig, a.finalScriptSig && !a.finalScriptSig.length && delete a.finalScriptSig, a.finalScriptWitness && !a.finalScriptWitness.length && delete a.finalScriptWitness;
    const s = this.outputs.map((a) => Zl(n, Os, a)), u = { ...this.global };
    return n === 0 ? (u.unsignedTx = fi.decode(fi.encode({
      version: this.version,
      lockTime: this.lockTime,
      inputs: this.inputs.map(Tr).map((a) => ({
        ...a,
        finalScriptSig: gt
      })),
      outputs: this.outputs.map(Qn)
    })), delete u.fallbackLocktime, delete u.txVersion) : (u.version = n, u.txVersion = this.version, u.inputCount = this.inputs.length, u.outputCount = this.outputs.length, u.fallbackLocktime && u.fallbackLocktime === Jn && delete u.fallbackLocktime), this.opts.bip174jsCompat && (r.length || r.push({}), s.length || s.push({})), (n === 0 ? Xl : Jl).encode({
      global: u,
      inputs: r,
      outputs: s
    });
  }
  // BIP370 lockTime (https://github.com/bitcoin/bips/blob/master/bip-0370.mediawiki#determining-lock-time)
  get lockTime() {
    let n = Jn, r = 0, s = Jn, u = 0;
    for (const a of this.inputs)
      a.requiredHeightLocktime && (n = Math.max(n, a.requiredHeightLocktime), r++), a.requiredTimeLocktime && (s = Math.max(s, a.requiredTimeLocktime), u++);
    return r && r >= u ? n : s !== Jn ? s : this.global.fallbackLocktime || Jn;
  }
  get version() {
    if (this.global.txVersion === void 0)
      throw new Error("No global.txVersion");
    return this.global.txVersion;
  }
  inputStatus(n) {
    this.checkInputIdx(n);
    const r = this.inputs[n];
    return r.finalScriptSig && r.finalScriptSig.length || r.finalScriptWitness && r.finalScriptWitness.length ? "finalized" : r.tapKeySig || r.tapScriptSig && r.tapScriptSig.length || r.partialSig && r.partialSig.length ? "signed" : "unsigned";
  }
  // Cannot replace unpackSighash, tests rely on very generic implemenetation with signing inputs outside of range
  // We will lose some vectors -> smaller test coverage of preimages (very important!)
  inputSighash(n) {
    this.checkInputIdx(n);
    const r = Es(this.inputs[n], this.opts.allowLegacyWitnessUtxo).sighash, s = r === St.DEFAULT ? St.ALL : r & 3;
    return { sigInputs: r & St.ANYONECANPAY, sigOutputs: s };
  }
  // Very nice for debug purposes, but slow. If there is too much inputs/outputs to add, will be quadratic.
  // Some cache will be nice, but there chance to have bugs with cache invalidation
  signStatus() {
    let n = !0, r = !0, s = [], u = [];
    for (let a = 0; a < this.inputs.length; a++) {
      if (this.inputStatus(a) === "unsigned")
        continue;
      const { sigInputs: l, sigOutputs: d } = this.inputSighash(a);
      if (l === St.ANYONECANPAY ? s.push(a) : n = !1, d === St.ALL)
        r = !1;
      else if (d === St.SINGLE)
        u.push(a);
      else if (d !== St.NONE) throw new Error(`Wrong signature hash output type: ${d}`);
    }
    return { addInput: n, addOutput: r, inputs: s, outputs: u };
  }
  get isFinal() {
    for (let n = 0; n < this.inputs.length; n++)
      if (this.inputStatus(n) !== "finalized")
        return !1;
    return !0;
  }
  // Info utils
  get hasWitnesses() {
    let n = !1;
    for (const r of this.inputs)
      r.finalScriptWitness && r.finalScriptWitness.length && (n = !0);
    return n;
  }
  // https://en.bitcoin.it/wiki/Weight_units
  get weight() {
    if (!this.isFinal)
      throw new Error("Transaction is not finalized");
    let n = 32;
    const r = this.outputs.map(Qn);
    n += 4 * ee.encode(this.outputs.length).length;
    for (const s of r)
      n += 32 + 4 * pe.encode(s.script).length;
    this.hasWitnesses && (n += 2), n += 4 * ee.encode(this.inputs.length).length;
    for (const s of this.inputs)
      n += 160 + 4 * pe.encode(s.finalScriptSig || gt).length, this.hasWitnesses && s.finalScriptWitness && (n += Js.encode(s.finalScriptWitness).length);
    return n;
  }
  get vsize() {
    return na(this.weight);
  }
  toBytes(n = !1, r = !1) {
    return Lr.encode({
      version: this.version,
      lockTime: this.lockTime,
      inputs: this.inputs.map(Tr).map((s) => ({
        ...s,
        finalScriptSig: n && s.finalScriptSig || gt
      })),
      outputs: this.outputs.map(Qn),
      witnesses: this.inputs.map((s) => s.finalScriptWitness || []),
      segwitFlag: r && this.hasWitnesses
    });
  }
  get unsignedTx() {
    return this.toBytes(!1, !1);
  }
  get hex() {
    return dt.encode(this.toBytes(!0, this.hasWitnesses));
  }
  get hash() {
    if (!this.isFinal)
      throw new Error("Transaction is not finalized");
    return dt.encode(On(this.toBytes(!0)));
  }
  get id() {
    if (!this.isFinal)
      throw new Error("Transaction is not finalized");
    return dt.encode(On(this.toBytes(!0)).reverse());
  }
  // Input stuff
  checkInputIdx(n) {
    if (!Number.isSafeInteger(n) || 0 > n || n >= this.inputs.length)
      throw new Error(`Wrong input index=${n}`);
  }
  getInput(n) {
    return this.checkInputIdx(n), Ns(this.inputs[n]);
  }
  get inputsLength() {
    return this.inputs.length;
  }
  // Modification
  addInput(n, r = !1) {
    if (!r && !this.signStatus().addInput)
      throw new Error("Tx has signed inputs, cannot add new one");
    return this.inputs.push(ea(n, void 0, void 0, this.opts.disableScriptCheck)), this.inputs.length - 1;
  }
  updateInput(n, r, s = !1) {
    this.checkInputIdx(n);
    let u;
    if (!s) {
      const a = this.signStatus();
      (!a.addInput || a.inputs.includes(n)) && (u = wS);
    }
    this.inputs[n] = ea(r, this.inputs[n], u, this.opts.disableScriptCheck);
  }
  // Output stuff
  checkOutputIdx(n) {
    if (!Number.isSafeInteger(n) || 0 > n || n >= this.outputs.length)
      throw new Error(`Wrong output index=${n}`);
  }
  getOutput(n) {
    return this.checkOutputIdx(n), Ns(this.outputs[n]);
  }
  getOutputAddress(n, r = xn) {
    const s = this.getOutput(n);
    if (s.script)
      return Mn(r).encode(Lt.decode(s.script));
  }
  get outputsLength() {
    return this.outputs.length;
  }
  normalizeOutput(n, r, s) {
    let { amount: u, script: a } = n;
    if (u === void 0 && (u = r == null ? void 0 : r.amount), typeof u != "bigint")
      throw new Error(`Wrong amount type, should be of type bigint in sats, but got ${u} of type ${typeof u}`);
    typeof a == "string" && (a = dt.decode(a)), a === void 0 && (a = r == null ? void 0 : r.script);
    let c = { ...r, ...n, amount: u, script: a };
    if (c.amount === void 0 && delete c.amount, c = sa(Os, c, r, s), La.encode(c), c.script && !this.opts.allowUnknownOutputs && Lt.decode(c.script).type === "unknown")
      throw new Error("Transaction/output: unknown output script type, there is a chance that input is unspendable. Pass allowUnknownOutputs=true, if you sure");
    return this.opts.disableScriptCheck || to(c.script, c.redeemScript, c.witnessScript), c;
  }
  addOutput(n, r = !1) {
    if (!r && !this.signStatus().addOutput)
      throw new Error("Tx has signed outputs, cannot add new one");
    return this.outputs.push(this.normalizeOutput(n)), this.outputs.length - 1;
  }
  updateOutput(n, r, s = !1) {
    this.checkOutputIdx(n);
    let u;
    if (!s) {
      const a = this.signStatus();
      (!a.addOutput || a.outputs.includes(n)) && (u = yS);
    }
    this.outputs[n] = this.normalizeOutput(r, this.outputs[n], u);
  }
  addOutputAddress(n, r, s = xn) {
    return this.addOutput({ script: Lt.encode(Mn(s).decode(n)), amount: r });
  }
  // Utils
  get fee() {
    let n = 0n;
    for (const s of this.inputs) {
      const u = li(s);
      if (!u)
        throw new Error("Empty input amount");
      n += u.amount;
    }
    const r = this.outputs.map(Qn);
    for (const s of r)
      n -= s.amount;
    return n;
  }
  // Signing
  // Based on https://github.com/bitcoin/bitcoin/blob/5871b5b5ab57a0caf9b7514eb162c491c83281d5/test/functional/test_framework/script.py#L624
  // There is optimization opportunity to re-use hashes for multiple inputs for witness v0/v1,
  // but we are trying to be less complicated for audit purpose for now.
  preimageLegacy(n, r, s) {
    const { isAny: u, isNone: a, isSingle: c } = zl(s);
    if (n < 0 || !Number.isSafeInteger(n))
      throw new Error(`Invalid input idx=${n}`);
    if (c && n >= this.outputs.length || n >= this.inputs.length)
      return zE.encode(1n);
    r = bt.encode(bt.decode(r).filter((y) => y !== "CODESEPARATOR"));
    let l = this.inputs.map(Tr).map((y, m) => ({
      ...y,
      finalScriptSig: m === n ? r : gt
    }));
    u ? l = [l[n]] : (a || c) && (l = l.map((y, m) => ({
      ...y,
      sequence: m === n ? y.sequence : 0
    })));
    let d = this.outputs.map(Qn);
    a ? d = [] : c && (d = d.slice(0, n).fill(sS).concat([d[n]]));
    const g = Lr.encode({
      lockTime: this.lockTime,
      version: this.version,
      segwitFlag: !1,
      inputs: l,
      outputs: d
    });
    return On(g, Ir.encode(s));
  }
  preimageWitnessV0(n, r, s, u) {
    const { isAny: a, isNone: c, isSingle: l } = zl(s);
    let d = ws, g = ws, y = ws;
    const m = this.inputs.map(Tr), E = this.outputs.map(Qn);
    a || (d = On(...m.map(Ou.encode))), !a && !l && !c && (g = On(...m.map((T) => wt.encode(T.sequence)))), !l && !c ? y = On(...E.map(nr.encode)) : l && n < E.length && (y = On(nr.encode(E[n])));
    const _ = m[n];
    return On(Ir.encode(this.version), d, g, It(32, !0).encode(_.txid), wt.encode(_.index), pe.encode(r), bs.encode(u), wt.encode(_.sequence), y, wt.encode(this.lockTime), wt.encode(s));
  }
  preimageWitnessV1(n, r, s, u, a = -1, c, l = 192, d) {
    if (!Array.isArray(u) || this.inputs.length !== u.length)
      throw new Error(`Invalid amounts array=${u}`);
    if (!Array.isArray(r) || this.inputs.length !== r.length)
      throw new Error(`Invalid prevOutScript array=${r}`);
    const g = [
      $n.encode(0),
      $n.encode(s),
      // U8 sigHash
      Ir.encode(this.version),
      wt.encode(this.lockTime)
    ], y = s === St.DEFAULT ? St.ALL : s & 3, m = s & St.ANYONECANPAY, E = this.inputs.map(Tr), _ = this.outputs.map(Qn);
    m !== St.ANYONECANPAY && g.push(...[
      E.map(Ou.encode),
      u.map(bs.encode),
      r.map(pe.encode),
      E.map((A) => wt.encode(A.sequence))
    ].map((A) => ue(tr(...A)))), y === St.ALL && g.push(ue(tr(..._.map(nr.encode))));
    const T = (d ? 1 : 0) | (c ? 2 : 0);
    if (g.push(new Uint8Array([T])), m === St.ANYONECANPAY) {
      const A = E[n];
      g.push(Ou.encode(A), bs.encode(u[n]), pe.encode(r[n]), wt.encode(A.sequence));
    } else
      g.push(wt.encode(n));
    return T & 1 && g.push(ue(pe.encode(d || gt))), y === St.SINGLE && g.push(n < _.length ? ue(nr.encode(_[n])) : ws), c && g.push(xs(c, l), $n.encode(0), Ir.encode(a)), ed("TapSighash", ...g);
  }
  // Signer can be privateKey OR instance of bip32 HD stuff
  signIdx(n, r, s, u) {
    this.checkInputIdx(r);
    const a = this.inputs[r], c = Es(a, this.opts.allowLegacyWitnessUtxo);
    if (!_t(n)) {
      if (!a.bip32Derivation || !a.bip32Derivation.length)
        throw new Error("bip32Derivation: empty");
      const y = a.bip32Derivation.filter((E) => E[1].fingerprint == n.fingerprint).map(([E, { path: _ }]) => {
        let T = n;
        for (const A of _)
          T = T.deriveChild(A);
        if (!Vt(T.publicKey, E))
          throw new Error("bip32Derivation: wrong pubKey");
        if (!T.privateKey)
          throw new Error("bip32Derivation: no privateKey");
        return T;
      });
      if (!y.length)
        throw new Error(`bip32Derivation: no items with fingerprint=${n.fingerprint}`);
      let m = !1;
      for (const E of y)
        this.signIdx(E.privateKey, r) && (m = !0);
      return m;
    }
    s ? s.forEach(cS) : s = [c.defaultSighash];
    const l = c.sighash;
    if (!s.includes(l))
      throw new Error(`Input with not allowed sigHash=${l}. Allowed: ${s.join(", ")}`);
    const { sigOutputs: d } = this.inputSighash(r);
    if (d === St.SINGLE && r >= this.outputs.length)
      throw new Error(`Input with sighash SINGLE, but there is no output with corresponding index=${r}`);
    const g = li(a);
    if (c.txType === "taproot") {
      const y = this.inputs.map(li), m = y.map((x) => x.script), E = y.map((x) => x.amount);
      let _ = !1, T = td(n), A = a.tapMerkleRoot || gt;
      if (a.tapInternalKey) {
        const { pubKey: x, privKey: B } = aS(n, T, a.tapInternalKey, A), [k, O] = rd(a.tapInternalKey, A);
        if (Vt(k, x)) {
          const F = this.preimageWitnessV1(r, m, l, E), D = tr(Ml(F, B, u), l !== St.DEFAULT ? new Uint8Array([l]) : gt);
          this.updateInput(r, { tapKeySig: D }, !0), _ = !0;
        }
      }
      if (a.tapLeafScript) {
        a.tapScriptSig = a.tapScriptSig || [];
        for (const [x, B] of a.tapLeafScript) {
          const k = B.subarray(0, -1), O = bt.decode(k), F = B[B.length - 1], D = xs(k, F);
          if (O.findIndex((J) => _t(J) && Vt(J, T)) === -1)
            continue;
          const M = this.preimageWitnessV1(r, m, l, E, void 0, k, F), G = tr(Ml(M, n, u), l !== St.DEFAULT ? new Uint8Array([l]) : gt);
          this.updateInput(r, { tapScriptSig: [[{ pubKey: T, leafHash: D }, G]] }, !0), _ = !0;
        }
      }
      if (!_)
        throw new Error("No taproot scripts signed");
      return !0;
    } else {
      const y = Jx(n);
      let m = !1;
      const E = Zs(y);
      for (const A of bt.decode(c.lastScript))
        _t(A) && (Vt(A, y) || Vt(A, E)) && (m = !0);
      if (!m)
        throw new Error(`Input script doesn't have pubKey: ${c.lastScript}`);
      let _;
      if (c.txType === "legacy")
        _ = this.preimageLegacy(r, c.lastScript, l);
      else if (c.txType === "segwit") {
        let A = c.lastScript;
        c.last.type === "wpkh" && (A = Lt.encode({ type: "pkh", hash: c.last.hash })), _ = this.preimageWitnessV0(r, A, l, g.amount);
      } else
        throw new Error(`Transaction/sign: unknown tx type: ${c.txType}`);
      const T = Qx(_, n, this.opts.lowR);
      this.updateInput(r, {
        partialSig: [[y, tr(T, new Uint8Array([l]))]]
      }, !0);
    }
    return !0;
  }
  // This is bad API. Will work if user creates and signs tx, but if
  // there is some complex workflow with exchanging PSBT and signing them,
  // then it is better to validate which output user signs. How could a better API look like?
  // Example: user adds input, sends to another party, then signs received input (mixer etc),
  // another user can add different input for same key and user will sign it.
  // Even worse: another user can add bip32 derivation, and spend money from different address.
  // Better api: signIdx
  sign(n, r, s) {
    let u = 0;
    for (let a = 0; a < this.inputs.length; a++)
      try {
        this.signIdx(n, a, r, s) && u++;
      } catch {
      }
    if (!u)
      throw new Error("No inputs signed");
    return u;
  }
  finalizeIdx(n) {
    if (this.checkInputIdx(n), this.fee < 0n)
      throw new Error("Outputs spends more than inputs amount");
    const r = this.inputs[n], s = Es(r, this.opts.allowLegacyWitnessUtxo);
    if (s.txType === "taproot") {
      if (r.tapKeySig)
        r.finalScriptWitness = [r.tapKeySig];
      else if (r.tapLeafScript && r.tapScriptSig) {
        const d = r.tapLeafScript.sort((g, y) => Rr.encode(g[0]).length - Rr.encode(y[0]).length);
        for (const [g, y] of d) {
          const m = y.slice(0, -1), E = y[y.length - 1], _ = Lt.decode(m), T = xs(m, E), A = r.tapScriptSig.filter((B) => Vt(B[0].leafHash, T));
          let x = [];
          if (_.type === "tr_ms") {
            const B = _.m, k = _.pubkeys;
            let O = 0;
            for (const F of k) {
              const D = A.findIndex((W) => Vt(W[0].pubKey, F));
              if (O === B || D === -1) {
                x.push(gt);
                continue;
              }
              x.push(A[D][1]), O++;
            }
            if (O !== B)
              continue;
          } else if (_.type === "tr_ns") {
            for (const B of _.pubkeys) {
              const k = A.findIndex((O) => Vt(O[0].pubKey, B));
              k !== -1 && x.push(A[k][1]);
            }
            if (x.length !== _.pubkeys.length)
              continue;
          } else if (_.type === "unknown" && this.opts.allowUnknownInputs) {
            const B = bt.decode(m);
            if (x = A.map(([{ pubKey: k }, O]) => {
              const F = B.findIndex((D) => _t(D) && Vt(D, k));
              if (F === -1)
                throw new Error("finalize/taproot: cannot find position of pubkey in script");
              return { signature: O, pos: F };
            }).sort((k, O) => k.pos - O.pos).map((k) => k.signature), !x.length)
              continue;
          } else {
            const B = this.opts.customScripts;
            if (B)
              for (const k of B) {
                if (!k.finalizeTaproot)
                  continue;
                const O = bt.decode(m), F = k.encode(O);
                if (F === void 0)
                  continue;
                const D = k.finalizeTaproot(m, F, A);
                if (D) {
                  r.finalScriptWitness = D.concat(Rr.encode(g)), r.finalScriptSig = gt, ku(r);
                  return;
                }
              }
            throw new Error("Finalize: Unknown tapLeafScript");
          }
          r.finalScriptWitness = x.reverse().concat([m, Rr.encode(g)]);
          break;
        }
        if (!r.finalScriptWitness)
          throw new Error("finalize/taproot: empty witness");
      } else
        throw new Error("finalize/taproot: unknown input");
      r.finalScriptSig = gt, ku(r);
      return;
    }
    if (!r.partialSig || !r.partialSig.length)
      throw new Error("Not enough partial sign");
    let u = gt, a = [];
    if (s.last.type === "ms") {
      const d = s.last.m, g = s.last.pubkeys;
      let y = [];
      for (const m of g) {
        const E = r.partialSig.find((_) => Vt(m, _[0]));
        E && y.push(E[1]);
      }
      if (y = y.slice(0, d), y.length !== d)
        throw new Error(`Multisig: wrong signatures count, m=${d} n=${g.length} signatures=${y.length}`);
      u = bt.encode([0, ...y]);
    } else if (s.last.type === "pk")
      u = bt.encode([r.partialSig[0][1]]);
    else if (s.last.type === "pkh")
      u = bt.encode([r.partialSig[0][1], r.partialSig[0][0]]);
    else if (s.last.type === "wpkh")
      u = gt, a = [r.partialSig[0][1], r.partialSig[0][0]];
    else if (s.last.type === "unknown" && !this.opts.allowUnknownInputs)
      throw new Error("Unknown inputs not allowed");
    let c, l;
    if (s.type.includes("wsh-") && (u.length && s.lastScript.length && (a = bt.decode(u).map((d) => {
      if (d === 0)
        return gt;
      if (_t(d))
        return d;
      throw new Error(`Wrong witness op=${d}`);
    })), a = a.concat(s.lastScript)), s.txType === "segwit" && (l = a), s.type.startsWith("sh-wsh-") ? c = bt.encode([bt.encode([0, ue(s.lastScript)])]) : s.type.startsWith("sh-") ? c = bt.encode([...bt.decode(u), s.lastScript]) : s.type.startsWith("wsh-") || s.txType !== "segwit" && (c = u), !c && !l)
      throw new Error("Unknown error finalizing input");
    c && (r.finalScriptSig = c), l && (r.finalScriptWitness = l), ku(r);
  }
  finalize() {
    for (let n = 0; n < this.inputs.length; n++)
      this.finalizeIdx(n);
  }
  extract() {
    if (!this.isFinal)
      throw new Error("Transaction has unfinalized inputs");
    if (!this.outputs.length)
      throw new Error("Transaction has no outputs");
    if (this.fee < 0n)
      throw new Error("Outputs spends more than inputs amount");
    return this.toBytes(!0, !0);
  }
  combine(n) {
    for (const u of ["PSBTVersion", "version", "lockTime"])
      if (this.opts[u] !== n.opts[u])
        throw new Error(`Transaction/combine: different ${u} this=${this.opts[u]} other=${n.opts[u]}`);
    for (const u of ["inputs", "outputs"])
      if (this[u].length !== n[u].length)
        throw new Error(`Transaction/combine: different ${u} length this=${this[u].length} other=${n[u].length}`);
    const r = this.global.unsignedTx ? fi.encode(this.global.unsignedTx) : gt, s = n.global.unsignedTx ? fi.encode(n.global.unsignedTx) : gt;
    if (!Vt(r, s))
      throw new Error("Transaction/combine: different unsigned tx");
    this.global = sa(Ba, this.global, n.global);
    for (let u = 0; u < this.inputs.length; u++)
      this.updateInput(u, n.inputs[u], !0);
    for (let u = 0; u < this.outputs.length; u++)
      this.updateOutput(u, n.outputs[u], !0);
    return this;
  }
  clone() {
    return te.fromPSBT(this.toPSBT(this.opts.PSBTVersion), this.opts);
  }
}
const ra = Re(It(null), (e) => cr(e, Yt.ecdsa)), ks = Re(It(32), (e) => cr(e, Yt.schnorr)), Vl = Re(It(null), (e) => {
  if (e.length !== 64 && e.length !== 65)
    throw new Error("Schnorr signature should be 64 or 65 bytes long");
  return e;
}), Qs = ne({
  fingerprint: YE,
  path: ye(null, wt)
}), cd = ne({
  hashes: ye(ee, It(32)),
  der: Qs
}), lS = It(78), hS = ne({ pubKey: ks, leafHash: It(32) }), dS = ne({
  version: $n,
  // With parity :(
  internalKey: It(32),
  merklePath: ye(null, It(32))
}), Rr = Re(dS, (e) => {
  if (e.merklePath.length > 128)
    throw new Error("TaprootControlBlock: merklePath should be of length 0..128 (inclusive)");
  return e;
}), pS = ye(null, ne({
  depth: $n,
  version: $n,
  script: pe
})), Ft = It(null), Gl = It(20), ai = It(32), Ba = {
  unsignedTx: [0, !1, fi, [0], [0], !1],
  xpub: [1, lS, Qs, [], [0, 2], !1],
  txVersion: [2, !1, wt, [2], [2], !1],
  fallbackLocktime: [3, !1, wt, [], [2], !1],
  inputCount: [4, !1, ee, [2], [2], !1],
  outputCount: [5, !1, ee, [2], [2], !1],
  txModifiable: [6, !1, $n, [], [2], !1],
  // TODO: bitfield
  version: [251, !1, wt, [], [0, 2], !1],
  proprietary: [252, Ft, Ft, [], [0, 2], !1]
}, js = {
  nonWitnessUtxo: [0, !1, Lr, [], [0, 2], !1],
  witnessUtxo: [1, !1, nr, [], [0, 2], !1],
  partialSig: [2, ra, Ft, [], [0, 2], !1],
  sighashType: [3, !1, wt, [], [0, 2], !1],
  redeemScript: [4, !1, Ft, [], [0, 2], !1],
  witnessScript: [5, !1, Ft, [], [0, 2], !1],
  bip32Derivation: [6, ra, Qs, [], [0, 2], !1],
  finalScriptSig: [7, !1, Ft, [], [0, 2], !1],
  finalScriptWitness: [8, !1, Js, [], [0, 2], !1],
  porCommitment: [9, !1, Ft, [], [0, 2], !1],
  ripemd160: [10, Gl, Ft, [], [0, 2], !1],
  sha256: [11, ai, Ft, [], [0, 2], !1],
  hash160: [12, Gl, Ft, [], [0, 2], !1],
  hash256: [13, ai, Ft, [], [0, 2], !1],
  txid: [14, !1, ai, [2], [2], !0],
  index: [15, !1, wt, [2], [2], !0],
  sequence: [16, !1, wt, [], [2], !0],
  requiredTimeLocktime: [17, !1, wt, [], [2], !1],
  requiredHeightLocktime: [18, !1, wt, [], [2], !1],
  tapKeySig: [19, !1, Vl, [], [0, 2], !1],
  tapScriptSig: [20, hS, Vl, [], [0, 2], !1],
  tapLeafScript: [21, Rr, Ft, [], [0, 2], !1],
  tapBip32Derivation: [22, ai, cd, [], [0, 2], !1],
  tapInternalKey: [23, !1, ks, [], [0, 2], !1],
  tapMerkleRoot: [24, !1, ai, [], [0, 2], !1],
  proprietary: [252, Ft, Ft, [], [0, 2], !1]
}, gS = [
  "txid",
  "sequence",
  "index",
  "witnessUtxo",
  "nonWitnessUtxo",
  "finalScriptSig",
  "finalScriptWitness",
  "unknown"
], wS = [
  "partialSig",
  "finalScriptSig",
  "finalScriptWitness",
  "tapKeySig",
  "tapScriptSig"
], Os = {
  redeemScript: [0, !1, Ft, [], [0, 2], !1],
  witnessScript: [1, !1, Ft, [], [0, 2], !1],
  bip32Derivation: [2, ra, Qs, [], [0, 2], !1],
  amount: [3, !1, VE, [2], [2], !0],
  script: [4, !1, Ft, [2], [2], !0],
  tapInternalKey: [5, !1, ks, [], [0, 2], !1],
  tapTree: [6, !1, pS, [], [0, 2], !1],
  tapBip32Derivation: [7, ks, cd, [], [0, 2], !1],
  proprietary: [252, Ft, Ft, [], [0, 2], !1]
}, yS = [], Yl = ye(Bh, ne({
  //  <key> := <keylen> <keytype> <keydata> WHERE keylen = len(keytype)+len(keydata)
  key: ZE(ee, ne({ type: ee, key: It(null) })),
  //  <value> := <valuelen> <valuedata>
  value: It(ee)
}));
function ia(e) {
  const [n, r, s, u, a, c] = e;
  return { type: n, kc: r, vc: s, reqInc: u, allowInc: a, silentIgnore: c };
}
ne({ type: ee, key: It(null) });
function Ra(e) {
  const n = {};
  for (const r in e) {
    const [s, u, a] = e[r];
    n[s] = [r, u, a];
  }
  return me({
    encodeStream: (r, s) => {
      let u = [];
      for (const a in e) {
        const c = s[a];
        if (c === void 0)
          continue;
        const [l, d, g] = e[a];
        if (!d)
          u.push({ key: { type: l, key: gt }, value: g.encode(c) });
        else {
          const y = c.map(([m, E]) => [
            d.encode(m),
            g.encode(E)
          ]);
          y.sort((m, E) => Ls(m[0], E[0]));
          for (const [m, E] of y)
            u.push({ key: { key: m, type: l }, value: E });
        }
      }
      if (s.unknown) {
        s.unknown.sort((a, c) => Ls(a[0].key, c[0].key));
        for (const [a, c] of s.unknown)
          u.push({ key: a, value: c });
      }
      Yl.encodeStream(r, u);
    },
    decodeStream: (r) => {
      const s = Yl.decodeStream(r), u = {}, a = {};
      for (const c of s) {
        let l = "unknown", d = c.key.key, g = c.value;
        if (n[c.key.type]) {
          const [y, m, E] = n[c.key.type];
          if (l = y, !m && d.length)
            throw new Error(`PSBT: Non-empty key for ${l} (key=${dt.encode(d)} value=${dt.encode(g)}`);
          if (d = m ? m.decode(d) : void 0, g = E.decode(g), !m) {
            if (u[l])
              throw new Error(`PSBT: Same keys: ${l} (key=${d} value=${g})`);
            u[l] = g, a[l] = !0;
            continue;
          }
        } else
          d = { type: c.key.type, key: c.key.key };
        if (a[l])
          throw new Error(`PSBT: Key type with empty key and no key=${l} val=${g}`);
        u[l] || (u[l] = []), u[l].push([d, g]);
      }
      return u;
    }
  });
}
const Ua = Re(Ra(js), (e) => {
  if (e.finalScriptWitness && !e.finalScriptWitness.length)
    throw new Error("validateInput: empty finalScriptWitness");
  if (e.partialSig && !e.partialSig.length)
    throw new Error("Empty partialSig");
  if (e.partialSig)
    for (const [n] of e.partialSig)
      cr(n, Yt.ecdsa);
  if (e.bip32Derivation)
    for (const [n] of e.bip32Derivation)
      cr(n, Yt.ecdsa);
  if (e.requiredTimeLocktime !== void 0 && e.requiredTimeLocktime < 5e8)
    throw new Error(`validateInput: wrong timeLocktime=${e.requiredTimeLocktime}`);
  if (e.requiredHeightLocktime !== void 0 && (e.requiredHeightLocktime <= 0 || e.requiredHeightLocktime >= 5e8))
    throw new Error(`validateInput: wrong heighLocktime=${e.requiredHeightLocktime}`);
  if (e.nonWitnessUtxo && e.index !== void 0) {
    const n = e.nonWitnessUtxo.outputs.length - 1;
    if (e.index > n)
      throw new Error(`validateInput: index(${e.index}) not in nonWitnessUtxo`);
    const r = e.nonWitnessUtxo.outputs[e.index];
    if (e.witnessUtxo && (!Vt(e.witnessUtxo.script, r.script) || e.witnessUtxo.amount !== r.amount))
      throw new Error("validateInput: witnessUtxo different from nonWitnessUtxo");
  }
  if (e.tapLeafScript)
    for (const [n, r] of e.tapLeafScript) {
      if ((n.version & 254) !== r[r.length - 1])
        throw new Error("validateInput: tapLeafScript version mimatch");
      if (r[r.length - 1] & 1)
        throw new Error("validateInput: tapLeafScript version has parity bit!");
    }
  if (e.nonWitnessUtxo && e.index !== void 0 && e.txid) {
    if (e.nonWitnessUtxo.outputs.length - 1 < e.index)
      throw new Error("nonWitnessUtxo: incorect output index");
    const r = te.fromRaw(Lr.encode(e.nonWitnessUtxo), {
      allowUnknownOutputs: !0,
      disableScriptCheck: !0,
      allowUnknownInputs: !0
    }), s = dt.encode(e.txid);
    if (r.isFinal && r.id !== s)
      throw new Error(`nonWitnessUtxo: wrong txid, exp=${s} got=${r.id}`);
  }
  return e;
}), La = Re(Ra(Os), (e) => {
  if (e.bip32Derivation)
    for (const [n] of e.bip32Derivation)
      cr(n, Yt.ecdsa);
  return e;
}), fd = Re(Ra(Ba), (e) => {
  if ((e.version || 0) === 0) {
    if (!e.unsignedTx)
      throw new Error("PSBTv0: missing unsignedTx");
    for (const r of e.unsignedTx.inputs)
      if (r.finalScriptSig && r.finalScriptSig.length)
        throw new Error("PSBTv0: input scriptSig found in unsignedTx");
  }
  return e;
}), mS = ne({
  magic: ya(wa(new Uint8Array([255])), "psbt"),
  global: fd,
  inputs: ye("global/unsignedTx/inputs/length", Ua),
  outputs: ye(null, La)
}), bS = ne({
  magic: ya(wa(new Uint8Array([255])), "psbt"),
  global: fd,
  inputs: ye("global/inputCount", Ua),
  outputs: ye("global/outputCount", La)
});
ne({
  magic: ya(wa(new Uint8Array([255])), "psbt"),
  items: ye(null, or(ye(Bh, jE([XE(ee), It(Xs)])), zs.dict()))
});
function $u(e, n, r) {
  for (const s in r) {
    if (s === "unknown" || !n[s])
      continue;
    const { allowInc: u } = ia(n[s]);
    if (!u.includes(e))
      throw new Error(`PSBTv${e}: field ${s} is not allowed`);
  }
  for (const s in n) {
    const { reqInc: u } = ia(n[s]);
    if (u.includes(e) && r[s] === void 0)
      throw new Error(`PSBTv${e}: missing required field ${s}`);
  }
}
function Zl(e, n, r) {
  const s = {};
  for (const u in r) {
    const a = u;
    if (a !== "unknown") {
      if (!n[a])
        continue;
      const { allowInc: c, silentIgnore: l } = ia(n[a]);
      if (!c.includes(e)) {
        if (l)
          continue;
        throw new Error(`Failed to serialize in PSBTv${e}: ${a} but versions allows inclusion=${c}`);
      }
    }
    s[a] = r[a];
  }
  return s;
}
function ld(e) {
  const n = e && e.global && e.global.version || 0;
  $u(n, Ba, e.global);
  for (const c of e.inputs)
    $u(n, js, c);
  for (const c of e.outputs)
    $u(n, Os, c);
  const r = n ? e.global.inputCount : e.global.unsignedTx.inputs.length;
  if (e.inputs.length < r)
    throw new Error("Not enough inputs");
  const s = e.inputs.slice(r);
  if (s.length > 1 || s.length && Object.keys(s[0]).length)
    throw new Error(`Unexpected inputs left in tx=${s}`);
  const u = n ? e.global.outputCount : e.global.unsignedTx.outputs.length;
  if (e.outputs.length < u)
    throw new Error("Not outputs inputs");
  const a = e.outputs.slice(u);
  if (a.length > 1 || a.length && Object.keys(a[0]).length)
    throw new Error(`Unexpected outputs left in tx=${a}`);
  return e;
}
function sa(e, n, r, s) {
  const u = { ...r, ...n };
  for (const a in e) {
    const c = a, [l, d, g] = e[c], y = s && !s.includes(a);
    if (n[a] === void 0 && a in n) {
      if (y)
        throw new Error(`Cannot remove signed field=${a}`);
      delete u[a];
    } else if (d) {
      const m = r && r[a] ? r[a] : [];
      let E = n[c];
      if (E) {
        if (!Array.isArray(E))
          throw new Error(`keyMap(${a}): KV pairs should be [k, v][]`);
        E = E.map((A) => {
          if (A.length !== 2)
            throw new Error(`keyMap(${a}): KV pairs should be [k, v][]`);
          return [
            typeof A[0] == "string" ? d.decode(dt.decode(A[0])) : A[0],
            typeof A[1] == "string" ? g.decode(dt.decode(A[1])) : A[1]
          ];
        });
        const _ = {}, T = (A, x, B) => {
          if (_[A] === void 0) {
            _[A] = [x, B];
            return;
          }
          const k = dt.encode(g.encode(_[A][1])), O = dt.encode(g.encode(B));
          if (k !== O)
            throw new Error(`keyMap(${c}): same key=${A} oldVal=${k} newVal=${O}`);
        };
        for (const [A, x] of m) {
          const B = dt.encode(d.encode(A));
          T(B, A, x);
        }
        for (const [A, x] of E) {
          const B = dt.encode(d.encode(A));
          if (x === void 0) {
            if (y)
              throw new Error(`Cannot remove signed field=${c}/${A}`);
            delete _[B];
          } else
            T(B, A, x);
        }
        u[c] = Object.values(_);
      }
    } else if (typeof u[a] == "string")
      u[a] = g.decode(dt.decode(u[a]));
    else if (y && a in n && r && r[a] !== void 0 && !Vt(g.encode(n[a]), g.encode(r[a])))
      throw new Error(`Cannot change signed field=${a}`);
  }
  for (const a in u)
    e[a] || delete u[a];
  return u;
}
const Xl = Re(mS, ld), Jl = Re(bS, ld);
function rr(e, n) {
  try {
    return cr(e, n), !0;
  } catch {
    return !1;
  }
}
const ES = {
  encode(e) {
    if (!(e.length !== 2 || !_t(e[0]) || !rr(e[0], Yt.ecdsa) || e[1] !== "CHECKSIG"))
      return { type: "pk", pubkey: e[0] };
  },
  decode: (e) => e.type === "pk" ? [e.pubkey, "CHECKSIG"] : void 0
}, xS = {
  encode(e) {
    if (!(e.length !== 5 || e[0] !== "DUP" || e[1] !== "HASH160" || !_t(e[2])) && !(e[3] !== "EQUALVERIFY" || e[4] !== "CHECKSIG"))
      return { type: "pkh", hash: e[2] };
  },
  decode: (e) => e.type === "pkh" ? ["DUP", "HASH160", e.hash, "EQUALVERIFY", "CHECKSIG"] : void 0
}, SS = {
  encode(e) {
    if (!(e.length !== 3 || e[0] !== "HASH160" || !_t(e[1]) || e[2] !== "EQUAL"))
      return { type: "sh", hash: e[1] };
  },
  decode: (e) => e.type === "sh" ? ["HASH160", e.hash, "EQUAL"] : void 0
}, _S = {
  encode(e) {
    if (!(e.length !== 2 || e[0] !== 0 || !_t(e[1])) && e[1].length === 32)
      return { type: "wsh", hash: e[1] };
  },
  decode: (e) => e.type === "wsh" ? [0, e.hash] : void 0
}, AS = {
  encode(e) {
    if (!(e.length !== 2 || e[0] !== 0 || !_t(e[1])) && e[1].length === 20)
      return { type: "wpkh", hash: e[1] };
  },
  decode: (e) => e.type === "wpkh" ? [0, e.hash] : void 0
}, vS = {
  encode(e) {
    const n = e.length - 1;
    if (e[n] !== "CHECKMULTISIG")
      return;
    const r = e[0], s = e[n - 1];
    if (typeof r != "number" || typeof s != "number")
      return;
    const u = e.slice(1, -2);
    if (s === u.length) {
      for (const a of u)
        if (!_t(a))
          return;
      return { type: "ms", m: r, pubkeys: u };
    }
  },
  // checkmultisig(n, ..pubkeys, m)
  decode: (e) => e.type === "ms" ? [e.m, ...e.pubkeys, e.pubkeys.length, "CHECKMULTISIG"] : void 0
}, TS = {
  encode(e) {
    if (!(e.length !== 2 || e[0] !== 1 || !_t(e[1])))
      return { type: "tr", pubkey: e[1] };
  },
  decode: (e) => e.type === "tr" ? [1, e.pubkey] : void 0
}, IS = {
  encode(e) {
    const n = e.length - 1;
    if (e[n] !== "CHECKSIG")
      return;
    const r = [];
    for (let s = 0; s < n; s++) {
      const u = e[s];
      if (s & 1) {
        if (u !== "CHECKSIGVERIFY" || s === n - 1)
          return;
        continue;
      }
      if (!_t(u))
        return;
      r.push(u);
    }
    return { type: "tr_ns", pubkeys: r };
  },
  decode: (e) => {
    if (e.type !== "tr_ns")
      return;
    const n = [];
    for (let r = 0; r < e.pubkeys.length - 1; r++)
      n.push(e.pubkeys[r], "CHECKSIGVERIFY");
    return n.push(e.pubkeys[e.pubkeys.length - 1], "CHECKSIG"), n;
  }
}, BS = {
  encode(e) {
    const n = e.length - 1;
    if (e[n] !== "NUMEQUAL" || e[1] !== "CHECKSIG")
      return;
    const r = [], s = tS(e[n - 1]);
    if (typeof s == "number") {
      for (let u = 0; u < n - 1; u++) {
        const a = e[u];
        if (u & 1) {
          if (a !== (u === 1 ? "CHECKSIG" : "CHECKSIGADD"))
            throw new Error("OutScript.encode/tr_ms: wrong element");
          continue;
        }
        if (!_t(a))
          throw new Error("OutScript.encode/tr_ms: wrong key element");
        r.push(a);
      }
      return { type: "tr_ms", pubkeys: r, m: s };
    }
  },
  decode: (e) => {
    if (e.type !== "tr_ms")
      return;
    const n = [e.pubkeys[0], "CHECKSIG"];
    for (let r = 1; r < e.pubkeys.length; r++)
      n.push(e.pubkeys[r], "CHECKSIGADD");
    return n.push(e.m, "NUMEQUAL"), n;
  }
}, RS = {
  encode(e) {
    return { type: "unknown", script: bt.encode(e) };
  },
  decode: (e) => e.type === "unknown" ? bt.decode(e.script) : void 0
}, US = [
  ES,
  xS,
  SS,
  _S,
  AS,
  vS,
  TS,
  IS,
  BS,
  RS
], LS = or(bt, zs.match(US)), Lt = Re(LS, (e) => {
  if (e.type === "pk" && !rr(e.pubkey, Yt.ecdsa))
    throw new Error("OutScript/pk: wrong key");
  if ((e.type === "pkh" || e.type === "sh" || e.type === "wpkh") && (!_t(e.hash) || e.hash.length !== 20))
    throw new Error(`OutScript/${e.type}: wrong hash`);
  if (e.type === "wsh" && (!_t(e.hash) || e.hash.length !== 32))
    throw new Error("OutScript/wsh: wrong hash");
  if (e.type === "tr" && (!_t(e.pubkey) || !rr(e.pubkey, Yt.schnorr)))
    throw new Error("OutScript/tr: wrong taproot public key");
  if ((e.type === "ms" || e.type === "tr_ns" || e.type === "tr_ms") && !Array.isArray(e.pubkeys))
    throw new Error("OutScript/multisig: wrong pubkeys array");
  if (e.type === "ms") {
    const n = e.pubkeys.length;
    for (const r of e.pubkeys)
      if (!rr(r, Yt.ecdsa))
        throw new Error("OutScript/multisig: wrong pubkey");
    if (e.m <= 0 || n > 16 || e.m > n)
      throw new Error("OutScript/multisig: invalid params");
  }
  if (e.type === "tr_ns" || e.type === "tr_ms") {
    for (const n of e.pubkeys)
      if (!rr(n, Yt.schnorr))
        throw new Error(`OutScript/${e.type}: wrong pubkey`);
  }
  if (e.type === "tr_ms") {
    const n = e.pubkeys.length;
    if (e.m <= 0 || n > 999 || e.m > n)
      throw new Error("OutScript/tr_ms: invalid params");
  }
  return e;
});
function Ql(e, n) {
  if (!Vt(e.hash, ue(n)))
    throw new Error("checkScript: wsh wrong witnessScript hash");
  const r = Lt.decode(n);
  if (r.type === "tr" || r.type === "tr_ns" || r.type === "tr_ms")
    throw new Error(`checkScript: P2${r.type} cannot be wrapped in P2SH`);
  if (r.type === "wpkh" || r.type === "sh")
    throw new Error(`checkScript: P2${r.type} cannot be wrapped in P2WSH`);
}
function to(e, n, r) {
  if (e) {
    const s = Lt.decode(e);
    if (s.type === "tr_ns" || s.type === "tr_ms" || s.type === "ms" || s.type == "pk")
      throw new Error(`checkScript: non-wrapped ${s.type}`);
    if (s.type === "sh" && n) {
      if (!Vt(s.hash, Zs(n)))
        throw new Error("checkScript: sh wrong redeemScript hash");
      const u = Lt.decode(n);
      if (u.type === "tr" || u.type === "tr_ns" || u.type === "tr_ms")
        throw new Error(`checkScript: P2${u.type} cannot be wrapped in P2SH`);
      if (u.type === "sh")
        throw new Error("checkScript: P2SH cannot be wrapped in P2SH");
    }
    s.type === "wsh" && r && Ql(s, r);
  }
  if (n) {
    const s = Lt.decode(n);
    s.type === "wsh" && r && Ql(s, r);
  }
}
const CS = (e, n = xn) => {
  const r = e.script;
  if (!_t(r))
    throw new Error(`Wrong script: ${typeof e.script}, expected Uint8Array`);
  const s = Zs(r), u = Lt.encode({ type: "sh", hash: s });
  to(u, r, e.witnessScript);
  const a = {
    type: "sh",
    redeemScript: r,
    script: Lt.encode({ type: "sh", hash: s }),
    address: Mn(n).encode({ type: "sh", hash: s })
  };
  return e.witnessScript && (a.witnessScript = e.witnessScript), a;
}, jl = (e, n = xn) => {
  if (!rr(e, Yt.ecdsa))
    throw new Error("P2WPKH: invalid publicKey");
  if (e.length === 65)
    throw new Error("P2WPKH: uncompressed public key");
  const r = Zs(e);
  return {
    type: "wpkh",
    script: Lt.encode({ type: "wpkh", hash: r }),
    address: Mn(n).encode({ type: "wpkh", hash: r })
  };
}, NS = 192, xs = (e, n = NS) => ed("TapLeaf", new Uint8Array([n]), pe.encode(e));
function kS(e, n, r = xn, s = !1, u) {
  if (!e && !n)
    throw new Error("p2tr: should have pubKey or scriptTree (or both)");
  const a = typeof e == "string" ? dt.decode(e) : e || id;
  if (!rr(a, Yt.schnorr))
    throw new Error("p2tr: non-schnorr pubkey");
  const [c, l] = rd(a, gt);
  return {
    type: "tr",
    script: Lt.encode({ type: "tr", pubkey: c }),
    address: Mn(r).encode({ type: "tr", pubkey: c }),
    // For tests
    tweakedPubkey: c,
    // PSBT stuff
    tapInternalKey: a
  };
}
const hd = OE(ue);
function dd(e, n) {
  if (n.length < 2 || n.length > 40)
    throw new Error("Witness: invalid length");
  if (e > 16)
    throw new Error("Witness: invalid version");
  if (e === 0 && !(n.length === 20 || n.length === 32))
    throw new Error("Witness: invalid length for version");
}
function Du(e, n, r = xn) {
  dd(e, n);
  const s = e === 0 ? Gu : Ih;
  return s.encode(r.bech32, [e].concat(s.toWords(n)));
}
function th(e, n) {
  return hd.encode(tr(Uint8Array.from(n), e));
}
function Mn(e = xn) {
  return {
    encode(n) {
      const { type: r } = n;
      if (r === "wpkh")
        return Du(0, n.hash, e);
      if (r === "wsh")
        return Du(0, n.hash, e);
      if (r === "tr")
        return Du(1, n.pubkey, e);
      if (r === "pkh")
        return th(n.hash, [e.pubKeyHash]);
      if (r === "sh")
        return th(n.hash, [e.scriptHash]);
      throw new Error(`Unknown address type=${r}`);
    },
    decode(n) {
      if (n.length < 14 || n.length > 74)
        throw new Error("Invalid address length");
      if (e.bech32 && n.toLowerCase().startsWith(`${e.bech32}1`)) {
        let s;
        try {
          if (s = Gu.decode(n), s.words[0] !== 0)
            throw new Error(`bech32: wrong version=${s.words[0]}`);
        } catch {
          if (s = Ih.decode(n), s.words[0] === 0)
            throw new Error(`bech32m: wrong version=${s.words[0]}`);
        }
        if (s.prefix !== e.bech32)
          throw new Error(`wrong bech32 prefix=${s.prefix}`);
        const [u, ...a] = s.words, c = Gu.fromWords(a);
        if (dd(u, c), u === 0 && c.length === 32)
          return { type: "wsh", hash: c };
        if (u === 0 && c.length === 20)
          return { type: "wpkh", hash: c };
        if (u === 1 && c.length === 32)
          return { type: "tr", pubkey: c };
        throw new Error("Unknown witness program");
      }
      const r = hd.decode(n);
      if (r.length !== 21)
        throw new Error("Invalid base58 address");
      if (r[0] === e.pubKeyHash)
        return { type: "pkh", hash: r.slice(1) };
      if (r[0] === e.scriptHash)
        return {
          type: "sh",
          hash: r.slice(1)
        };
      throw new Error(`Invalid address prefix=${r[0]}`);
    }
  };
}
class OS {
  constructor(n, r, s) {
    this.outputs = n, this.feePerByte = r, this.changeAddress = s;
  }
  compute(n) {
    const r = new ud(n, this.outputs, {
      createTx: !0,
      feePerByte: BigInt(this.feePerByte),
      changeAddress: this.changeAddress,
      bip69: !1
    }), s = r.accumulate(r.oldest, !1, !1, !1);
    if (!s) return null;
    const { indices: u, weight: a, total: c } = s;
    let l = r.opts.alwaysChange;
    const d = r.opts.alwaysChange ? a : a + (r.changeWeight - r.baseWeight), g = r.getSatoshi(d), y = c - r.amount - g;
    y > r.dust && (l = !0);
    let m = u, E = Array.from(r.outputs);
    if (l) {
      if (y < BigInt(0))
        throw new Error(`Estimator.result: negative change=${y}`);
      E.push({ address: r.opts.changeAddress, amount: y });
    }
    return r.opts.bip69 && (m = r.sortIndices(m), E = r.sortOutputs(E).map((_) => E[_])), { inputs: m.map((_) => r.normalizedInputs[_].normalized), outputs: E };
  }
}
var ci = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {}, $s = { exports: {} };
/**
 * @license
 * Lodash <https://lodash.com/>
 * Copyright OpenJS Foundation and other contributors <https://openjsf.org/>
 * Released under MIT license <https://lodash.com/license>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 */
$s.exports;
(function(e, n) {
  (function() {
    var r, s = "4.17.21", u = 200, a = "Unsupported core-js use. Try https://npms.io/search?q=ponyfill.", c = "Expected a function", l = "Invalid `variable` option passed into `_.template`", d = "__lodash_hash_undefined__", g = 500, y = "__lodash_placeholder__", m = 1, E = 2, _ = 4, T = 1, A = 2, x = 1, B = 2, k = 4, O = 8, F = 16, D = 32, W = 64, M = 128, G = 256, J = 512, ae = 30, yt = "...", ft = 800, re = 16, H = 1, z = 2, V = 3, Q = 1 / 0, ot = 9007199254740991, Nt = 17976931348623157e292, kt = NaN, Et = 4294967295, Xe = Et - 1, be = Et >>> 1, Je = [
      ["ary", M],
      ["bind", x],
      ["bindKey", B],
      ["curry", O],
      ["curryRight", F],
      ["flip", J],
      ["partial", D],
      ["partialRight", W],
      ["rearg", G]
    ], Ue = "[object Arguments]", Ee = "[object Array]", Wr = "[object AsyncFunction]", xe = "[object Boolean]", Le = "[object Date]", _i = "[object DOMException]", qe = "[object Error]", Zt = "[object Function]", rn = "[object GeneratorFunction]", ce = "[object Map]", Sn = "[object Number]", pd = "[object Null]", sn = "[object Object]", Na = "[object Promise]", gd = "[object Proxy]", Mr = "[object RegExp]", Ke = "[object Set]", Hr = "[object String]", Ai = "[object Symbol]", wd = "[object Undefined]", qr = "[object WeakMap]", yd = "[object WeakSet]", Kr = "[object ArrayBuffer]", fr = "[object DataView]", eo = "[object Float32Array]", no = "[object Float64Array]", ro = "[object Int8Array]", io = "[object Int16Array]", so = "[object Int32Array]", oo = "[object Uint8Array]", uo = "[object Uint8ClampedArray]", ao = "[object Uint16Array]", co = "[object Uint32Array]", md = /\b__p \+= '';/g, bd = /\b(__p \+=) '' \+/g, Ed = /(__e\(.*?\)|\b__t\)) \+\n'';/g, ka = /&(?:amp|lt|gt|quot|#39);/g, Oa = /[&<>"']/g, xd = RegExp(ka.source), Sd = RegExp(Oa.source), _d = /<%-([\s\S]+?)%>/g, Ad = /<%([\s\S]+?)%>/g, $a = /<%=([\s\S]+?)%>/g, vd = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/, Td = /^\w*$/, Id = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g, fo = /[\\^$.*+?()[\]{}|]/g, Bd = RegExp(fo.source), lo = /^\s+/, Rd = /\s/, Ud = /\{(?:\n\/\* \[wrapped with .+\] \*\/)?\n?/, Ld = /\{\n\/\* \[wrapped with (.+)\] \*/, Cd = /,? & /, Nd = /[^\x00-\x2f\x3a-\x40\x5b-\x60\x7b-\x7f]+/g, kd = /[()=,{}\[\]\/\s]/, Od = /\\(\\)?/g, $d = /\$\{([^\\}]*(?:\\.[^\\}]*)*)\}/g, Da = /\w*$/, Dd = /^[-+]0x[0-9a-f]+$/i, Fd = /^0b[01]+$/i, Pd = /^\[object .+?Constructor\]$/, Wd = /^0o[0-7]+$/i, Md = /^(?:0|[1-9]\d*)$/, Hd = /[\xc0-\xd6\xd8-\xf6\xf8-\xff\u0100-\u017f]/g, vi = /($^)/, qd = /['\n\r\u2028\u2029\\]/g, Ti = "\\ud800-\\udfff", Kd = "\\u0300-\\u036f", zd = "\\ufe20-\\ufe2f", Vd = "\\u20d0-\\u20ff", Fa = Kd + zd + Vd, Pa = "\\u2700-\\u27bf", Wa = "a-z\\xdf-\\xf6\\xf8-\\xff", Gd = "\\xac\\xb1\\xd7\\xf7", Yd = "\\x00-\\x2f\\x3a-\\x40\\x5b-\\x60\\x7b-\\xbf", Zd = "\\u2000-\\u206f", Xd = " \\t\\x0b\\f\\xa0\\ufeff\\n\\r\\u2028\\u2029\\u1680\\u180e\\u2000\\u2001\\u2002\\u2003\\u2004\\u2005\\u2006\\u2007\\u2008\\u2009\\u200a\\u202f\\u205f\\u3000", Ma = "A-Z\\xc0-\\xd6\\xd8-\\xde", Ha = "\\ufe0e\\ufe0f", qa = Gd + Yd + Zd + Xd, ho = "['’]", Jd = "[" + Ti + "]", Ka = "[" + qa + "]", Ii = "[" + Fa + "]", za = "\\d+", Qd = "[" + Pa + "]", Va = "[" + Wa + "]", Ga = "[^" + Ti + qa + za + Pa + Wa + Ma + "]", po = "\\ud83c[\\udffb-\\udfff]", jd = "(?:" + Ii + "|" + po + ")", Ya = "[^" + Ti + "]", go = "(?:\\ud83c[\\udde6-\\uddff]){2}", wo = "[\\ud800-\\udbff][\\udc00-\\udfff]", lr = "[" + Ma + "]", Za = "\\u200d", Xa = "(?:" + Va + "|" + Ga + ")", tp = "(?:" + lr + "|" + Ga + ")", Ja = "(?:" + ho + "(?:d|ll|m|re|s|t|ve))?", Qa = "(?:" + ho + "(?:D|LL|M|RE|S|T|VE))?", ja = jd + "?", tc = "[" + Ha + "]?", ep = "(?:" + Za + "(?:" + [Ya, go, wo].join("|") + ")" + tc + ja + ")*", np = "\\d*(?:1st|2nd|3rd|(?![123])\\dth)(?=\\b|[A-Z_])", rp = "\\d*(?:1ST|2ND|3RD|(?![123])\\dTH)(?=\\b|[a-z_])", ec = tc + ja + ep, ip = "(?:" + [Qd, go, wo].join("|") + ")" + ec, sp = "(?:" + [Ya + Ii + "?", Ii, go, wo, Jd].join("|") + ")", op = RegExp(ho, "g"), up = RegExp(Ii, "g"), yo = RegExp(po + "(?=" + po + ")|" + sp + ec, "g"), ap = RegExp([
      lr + "?" + Va + "+" + Ja + "(?=" + [Ka, lr, "$"].join("|") + ")",
      tp + "+" + Qa + "(?=" + [Ka, lr + Xa, "$"].join("|") + ")",
      lr + "?" + Xa + "+" + Ja,
      lr + "+" + Qa,
      rp,
      np,
      za,
      ip
    ].join("|"), "g"), cp = RegExp("[" + Za + Ti + Fa + Ha + "]"), fp = /[a-z][A-Z]|[A-Z]{2}[a-z]|[0-9][a-zA-Z]|[a-zA-Z][0-9]|[^a-zA-Z0-9 ]/, lp = [
      "Array",
      "Buffer",
      "DataView",
      "Date",
      "Error",
      "Float32Array",
      "Float64Array",
      "Function",
      "Int8Array",
      "Int16Array",
      "Int32Array",
      "Map",
      "Math",
      "Object",
      "Promise",
      "RegExp",
      "Set",
      "String",
      "Symbol",
      "TypeError",
      "Uint8Array",
      "Uint8ClampedArray",
      "Uint16Array",
      "Uint32Array",
      "WeakMap",
      "_",
      "clearTimeout",
      "isFinite",
      "parseInt",
      "setTimeout"
    ], hp = -1, xt = {};
    xt[eo] = xt[no] = xt[ro] = xt[io] = xt[so] = xt[oo] = xt[uo] = xt[ao] = xt[co] = !0, xt[Ue] = xt[Ee] = xt[Kr] = xt[xe] = xt[fr] = xt[Le] = xt[qe] = xt[Zt] = xt[ce] = xt[Sn] = xt[sn] = xt[Mr] = xt[Ke] = xt[Hr] = xt[qr] = !1;
    var mt = {};
    mt[Ue] = mt[Ee] = mt[Kr] = mt[fr] = mt[xe] = mt[Le] = mt[eo] = mt[no] = mt[ro] = mt[io] = mt[so] = mt[ce] = mt[Sn] = mt[sn] = mt[Mr] = mt[Ke] = mt[Hr] = mt[Ai] = mt[oo] = mt[uo] = mt[ao] = mt[co] = !0, mt[qe] = mt[Zt] = mt[qr] = !1;
    var dp = {
      // Latin-1 Supplement block.
      À: "A",
      Á: "A",
      Â: "A",
      Ã: "A",
      Ä: "A",
      Å: "A",
      à: "a",
      á: "a",
      â: "a",
      ã: "a",
      ä: "a",
      å: "a",
      Ç: "C",
      ç: "c",
      Ð: "D",
      ð: "d",
      È: "E",
      É: "E",
      Ê: "E",
      Ë: "E",
      è: "e",
      é: "e",
      ê: "e",
      ë: "e",
      Ì: "I",
      Í: "I",
      Î: "I",
      Ï: "I",
      ì: "i",
      í: "i",
      î: "i",
      ï: "i",
      Ñ: "N",
      ñ: "n",
      Ò: "O",
      Ó: "O",
      Ô: "O",
      Õ: "O",
      Ö: "O",
      Ø: "O",
      ò: "o",
      ó: "o",
      ô: "o",
      õ: "o",
      ö: "o",
      ø: "o",
      Ù: "U",
      Ú: "U",
      Û: "U",
      Ü: "U",
      ù: "u",
      ú: "u",
      û: "u",
      ü: "u",
      Ý: "Y",
      ý: "y",
      ÿ: "y",
      Æ: "Ae",
      æ: "ae",
      Þ: "Th",
      þ: "th",
      ß: "ss",
      // Latin Extended-A block.
      Ā: "A",
      Ă: "A",
      Ą: "A",
      ā: "a",
      ă: "a",
      ą: "a",
      Ć: "C",
      Ĉ: "C",
      Ċ: "C",
      Č: "C",
      ć: "c",
      ĉ: "c",
      ċ: "c",
      č: "c",
      Ď: "D",
      Đ: "D",
      ď: "d",
      đ: "d",
      Ē: "E",
      Ĕ: "E",
      Ė: "E",
      Ę: "E",
      Ě: "E",
      ē: "e",
      ĕ: "e",
      ė: "e",
      ę: "e",
      ě: "e",
      Ĝ: "G",
      Ğ: "G",
      Ġ: "G",
      Ģ: "G",
      ĝ: "g",
      ğ: "g",
      ġ: "g",
      ģ: "g",
      Ĥ: "H",
      Ħ: "H",
      ĥ: "h",
      ħ: "h",
      Ĩ: "I",
      Ī: "I",
      Ĭ: "I",
      Į: "I",
      İ: "I",
      ĩ: "i",
      ī: "i",
      ĭ: "i",
      į: "i",
      ı: "i",
      Ĵ: "J",
      ĵ: "j",
      Ķ: "K",
      ķ: "k",
      ĸ: "k",
      Ĺ: "L",
      Ļ: "L",
      Ľ: "L",
      Ŀ: "L",
      Ł: "L",
      ĺ: "l",
      ļ: "l",
      ľ: "l",
      ŀ: "l",
      ł: "l",
      Ń: "N",
      Ņ: "N",
      Ň: "N",
      Ŋ: "N",
      ń: "n",
      ņ: "n",
      ň: "n",
      ŋ: "n",
      Ō: "O",
      Ŏ: "O",
      Ő: "O",
      ō: "o",
      ŏ: "o",
      ő: "o",
      Ŕ: "R",
      Ŗ: "R",
      Ř: "R",
      ŕ: "r",
      ŗ: "r",
      ř: "r",
      Ś: "S",
      Ŝ: "S",
      Ş: "S",
      Š: "S",
      ś: "s",
      ŝ: "s",
      ş: "s",
      š: "s",
      Ţ: "T",
      Ť: "T",
      Ŧ: "T",
      ţ: "t",
      ť: "t",
      ŧ: "t",
      Ũ: "U",
      Ū: "U",
      Ŭ: "U",
      Ů: "U",
      Ű: "U",
      Ų: "U",
      ũ: "u",
      ū: "u",
      ŭ: "u",
      ů: "u",
      ű: "u",
      ų: "u",
      Ŵ: "W",
      ŵ: "w",
      Ŷ: "Y",
      ŷ: "y",
      Ÿ: "Y",
      Ź: "Z",
      Ż: "Z",
      Ž: "Z",
      ź: "z",
      ż: "z",
      ž: "z",
      Ĳ: "IJ",
      ĳ: "ij",
      Œ: "Oe",
      œ: "oe",
      ŉ: "'n",
      ſ: "s"
    }, pp = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }, gp = {
      "&amp;": "&",
      "&lt;": "<",
      "&gt;": ">",
      "&quot;": '"',
      "&#39;": "'"
    }, wp = {
      "\\": "\\",
      "'": "'",
      "\n": "n",
      "\r": "r",
      "\u2028": "u2028",
      "\u2029": "u2029"
    }, yp = parseFloat, mp = parseInt, nc = typeof ci == "object" && ci && ci.Object === Object && ci, bp = typeof self == "object" && self && self.Object === Object && self, Kt = nc || bp || Function("return this")(), mo = n && !n.nodeType && n, Hn = mo && !0 && e && !e.nodeType && e, rc = Hn && Hn.exports === mo, bo = rc && nc.process, Ce = function() {
      try {
        var v = Hn && Hn.require && Hn.require("util").types;
        return v || bo && bo.binding && bo.binding("util");
      } catch {
      }
    }(), ic = Ce && Ce.isArrayBuffer, sc = Ce && Ce.isDate, oc = Ce && Ce.isMap, uc = Ce && Ce.isRegExp, ac = Ce && Ce.isSet, cc = Ce && Ce.isTypedArray;
    function Se(v, L, R) {
      switch (R.length) {
        case 0:
          return v.call(L);
        case 1:
          return v.call(L, R[0]);
        case 2:
          return v.call(L, R[0], R[1]);
        case 3:
          return v.call(L, R[0], R[1], R[2]);
      }
      return v.apply(L, R);
    }
    function Ep(v, L, R, q) {
      for (var j = -1, ct = v == null ? 0 : v.length; ++j < ct; ) {
        var Ot = v[j];
        L(q, Ot, R(Ot), v);
      }
      return q;
    }
    function Ne(v, L) {
      for (var R = -1, q = v == null ? 0 : v.length; ++R < q && L(v[R], R, v) !== !1; )
        ;
      return v;
    }
    function xp(v, L) {
      for (var R = v == null ? 0 : v.length; R-- && L(v[R], R, v) !== !1; )
        ;
      return v;
    }
    function fc(v, L) {
      for (var R = -1, q = v == null ? 0 : v.length; ++R < q; )
        if (!L(v[R], R, v))
          return !1;
      return !0;
    }
    function _n(v, L) {
      for (var R = -1, q = v == null ? 0 : v.length, j = 0, ct = []; ++R < q; ) {
        var Ot = v[R];
        L(Ot, R, v) && (ct[j++] = Ot);
      }
      return ct;
    }
    function Bi(v, L) {
      var R = v == null ? 0 : v.length;
      return !!R && hr(v, L, 0) > -1;
    }
    function Eo(v, L, R) {
      for (var q = -1, j = v == null ? 0 : v.length; ++q < j; )
        if (R(L, v[q]))
          return !0;
      return !1;
    }
    function At(v, L) {
      for (var R = -1, q = v == null ? 0 : v.length, j = Array(q); ++R < q; )
        j[R] = L(v[R], R, v);
      return j;
    }
    function An(v, L) {
      for (var R = -1, q = L.length, j = v.length; ++R < q; )
        v[j + R] = L[R];
      return v;
    }
    function xo(v, L, R, q) {
      var j = -1, ct = v == null ? 0 : v.length;
      for (q && ct && (R = v[++j]); ++j < ct; )
        R = L(R, v[j], j, v);
      return R;
    }
    function Sp(v, L, R, q) {
      var j = v == null ? 0 : v.length;
      for (q && j && (R = v[--j]); j--; )
        R = L(R, v[j], j, v);
      return R;
    }
    function So(v, L) {
      for (var R = -1, q = v == null ? 0 : v.length; ++R < q; )
        if (L(v[R], R, v))
          return !0;
      return !1;
    }
    var _p = _o("length");
    function Ap(v) {
      return v.split("");
    }
    function vp(v) {
      return v.match(Nd) || [];
    }
    function lc(v, L, R) {
      var q;
      return R(v, function(j, ct, Ot) {
        if (L(j, ct, Ot))
          return q = ct, !1;
      }), q;
    }
    function Ri(v, L, R, q) {
      for (var j = v.length, ct = R + (q ? 1 : -1); q ? ct-- : ++ct < j; )
        if (L(v[ct], ct, v))
          return ct;
      return -1;
    }
    function hr(v, L, R) {
      return L === L ? Dp(v, L, R) : Ri(v, hc, R);
    }
    function Tp(v, L, R, q) {
      for (var j = R - 1, ct = v.length; ++j < ct; )
        if (q(v[j], L))
          return j;
      return -1;
    }
    function hc(v) {
      return v !== v;
    }
    function dc(v, L) {
      var R = v == null ? 0 : v.length;
      return R ? vo(v, L) / R : kt;
    }
    function _o(v) {
      return function(L) {
        return L == null ? r : L[v];
      };
    }
    function Ao(v) {
      return function(L) {
        return v == null ? r : v[L];
      };
    }
    function pc(v, L, R, q, j) {
      return j(v, function(ct, Ot, pt) {
        R = q ? (q = !1, ct) : L(R, ct, Ot, pt);
      }), R;
    }
    function Ip(v, L) {
      var R = v.length;
      for (v.sort(L); R--; )
        v[R] = v[R].value;
      return v;
    }
    function vo(v, L) {
      for (var R, q = -1, j = v.length; ++q < j; ) {
        var ct = L(v[q]);
        ct !== r && (R = R === r ? ct : R + ct);
      }
      return R;
    }
    function To(v, L) {
      for (var R = -1, q = Array(v); ++R < v; )
        q[R] = L(R);
      return q;
    }
    function Bp(v, L) {
      return At(L, function(R) {
        return [R, v[R]];
      });
    }
    function gc(v) {
      return v && v.slice(0, bc(v) + 1).replace(lo, "");
    }
    function _e(v) {
      return function(L) {
        return v(L);
      };
    }
    function Io(v, L) {
      return At(L, function(R) {
        return v[R];
      });
    }
    function zr(v, L) {
      return v.has(L);
    }
    function wc(v, L) {
      for (var R = -1, q = v.length; ++R < q && hr(L, v[R], 0) > -1; )
        ;
      return R;
    }
    function yc(v, L) {
      for (var R = v.length; R-- && hr(L, v[R], 0) > -1; )
        ;
      return R;
    }
    function Rp(v, L) {
      for (var R = v.length, q = 0; R--; )
        v[R] === L && ++q;
      return q;
    }
    var Up = Ao(dp), Lp = Ao(pp);
    function Cp(v) {
      return "\\" + wp[v];
    }
    function Np(v, L) {
      return v == null ? r : v[L];
    }
    function dr(v) {
      return cp.test(v);
    }
    function kp(v) {
      return fp.test(v);
    }
    function Op(v) {
      for (var L, R = []; !(L = v.next()).done; )
        R.push(L.value);
      return R;
    }
    function Bo(v) {
      var L = -1, R = Array(v.size);
      return v.forEach(function(q, j) {
        R[++L] = [j, q];
      }), R;
    }
    function mc(v, L) {
      return function(R) {
        return v(L(R));
      };
    }
    function vn(v, L) {
      for (var R = -1, q = v.length, j = 0, ct = []; ++R < q; ) {
        var Ot = v[R];
        (Ot === L || Ot === y) && (v[R] = y, ct[j++] = R);
      }
      return ct;
    }
    function Ui(v) {
      var L = -1, R = Array(v.size);
      return v.forEach(function(q) {
        R[++L] = q;
      }), R;
    }
    function $p(v) {
      var L = -1, R = Array(v.size);
      return v.forEach(function(q) {
        R[++L] = [q, q];
      }), R;
    }
    function Dp(v, L, R) {
      for (var q = R - 1, j = v.length; ++q < j; )
        if (v[q] === L)
          return q;
      return -1;
    }
    function Fp(v, L, R) {
      for (var q = R + 1; q--; )
        if (v[q] === L)
          return q;
      return q;
    }
    function pr(v) {
      return dr(v) ? Wp(v) : _p(v);
    }
    function ze(v) {
      return dr(v) ? Mp(v) : Ap(v);
    }
    function bc(v) {
      for (var L = v.length; L-- && Rd.test(v.charAt(L)); )
        ;
      return L;
    }
    var Pp = Ao(gp);
    function Wp(v) {
      for (var L = yo.lastIndex = 0; yo.test(v); )
        ++L;
      return L;
    }
    function Mp(v) {
      return v.match(yo) || [];
    }
    function Hp(v) {
      return v.match(ap) || [];
    }
    var qp = function v(L) {
      L = L == null ? Kt : gr.defaults(Kt.Object(), L, gr.pick(Kt, lp));
      var R = L.Array, q = L.Date, j = L.Error, ct = L.Function, Ot = L.Math, pt = L.Object, Ro = L.RegExp, Kp = L.String, ke = L.TypeError, Li = R.prototype, zp = ct.prototype, wr = pt.prototype, Ci = L["__core-js_shared__"], Ni = zp.toString, ht = wr.hasOwnProperty, Vp = 0, Ec = function() {
        var t = /[^.]+$/.exec(Ci && Ci.keys && Ci.keys.IE_PROTO || "");
        return t ? "Symbol(src)_1." + t : "";
      }(), ki = wr.toString, Gp = Ni.call(pt), Yp = Kt._, Zp = Ro(
        "^" + Ni.call(ht).replace(fo, "\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, "$1.*?") + "$"
      ), Oi = rc ? L.Buffer : r, Tn = L.Symbol, $i = L.Uint8Array, xc = Oi ? Oi.allocUnsafe : r, Di = mc(pt.getPrototypeOf, pt), Sc = pt.create, _c = wr.propertyIsEnumerable, Fi = Li.splice, Ac = Tn ? Tn.isConcatSpreadable : r, Vr = Tn ? Tn.iterator : r, qn = Tn ? Tn.toStringTag : r, Pi = function() {
        try {
          var t = Yn(pt, "defineProperty");
          return t({}, "", {}), t;
        } catch {
        }
      }(), Xp = L.clearTimeout !== Kt.clearTimeout && L.clearTimeout, Jp = q && q.now !== Kt.Date.now && q.now, Qp = L.setTimeout !== Kt.setTimeout && L.setTimeout, Wi = Ot.ceil, Mi = Ot.floor, Uo = pt.getOwnPropertySymbols, jp = Oi ? Oi.isBuffer : r, vc = L.isFinite, tg = Li.join, eg = mc(pt.keys, pt), $t = Ot.max, Xt = Ot.min, ng = q.now, rg = L.parseInt, Tc = Ot.random, ig = Li.reverse, Lo = Yn(L, "DataView"), Gr = Yn(L, "Map"), Co = Yn(L, "Promise"), yr = Yn(L, "Set"), Yr = Yn(L, "WeakMap"), Zr = Yn(pt, "create"), Hi = Yr && new Yr(), mr = {}, sg = Zn(Lo), og = Zn(Gr), ug = Zn(Co), ag = Zn(yr), cg = Zn(Yr), qi = Tn ? Tn.prototype : r, Xr = qi ? qi.valueOf : r, Ic = qi ? qi.toString : r;
      function p(t) {
        if (Tt(t) && !tt(t) && !(t instanceof ut)) {
          if (t instanceof Oe)
            return t;
          if (ht.call(t, "__wrapped__"))
            return Rf(t);
        }
        return new Oe(t);
      }
      var br = /* @__PURE__ */ function() {
        function t() {
        }
        return function(i) {
          if (!vt(i))
            return {};
          if (Sc)
            return Sc(i);
          t.prototype = i;
          var o = new t();
          return t.prototype = r, o;
        };
      }();
      function Ki() {
      }
      function Oe(t, i) {
        this.__wrapped__ = t, this.__actions__ = [], this.__chain__ = !!i, this.__index__ = 0, this.__values__ = r;
      }
      p.templateSettings = {
        /**
         * Used to detect `data` property values to be HTML-escaped.
         *
         * @memberOf _.templateSettings
         * @type {RegExp}
         */
        escape: _d,
        /**
         * Used to detect code to be evaluated.
         *
         * @memberOf _.templateSettings
         * @type {RegExp}
         */
        evaluate: Ad,
        /**
         * Used to detect `data` property values to inject.
         *
         * @memberOf _.templateSettings
         * @type {RegExp}
         */
        interpolate: $a,
        /**
         * Used to reference the data object in the template text.
         *
         * @memberOf _.templateSettings
         * @type {string}
         */
        variable: "",
        /**
         * Used to import variables into the compiled template.
         *
         * @memberOf _.templateSettings
         * @type {Object}
         */
        imports: {
          /**
           * A reference to the `lodash` function.
           *
           * @memberOf _.templateSettings.imports
           * @type {Function}
           */
          _: p
        }
      }, p.prototype = Ki.prototype, p.prototype.constructor = p, Oe.prototype = br(Ki.prototype), Oe.prototype.constructor = Oe;
      function ut(t) {
        this.__wrapped__ = t, this.__actions__ = [], this.__dir__ = 1, this.__filtered__ = !1, this.__iteratees__ = [], this.__takeCount__ = Et, this.__views__ = [];
      }
      function fg() {
        var t = new ut(this.__wrapped__);
        return t.__actions__ = fe(this.__actions__), t.__dir__ = this.__dir__, t.__filtered__ = this.__filtered__, t.__iteratees__ = fe(this.__iteratees__), t.__takeCount__ = this.__takeCount__, t.__views__ = fe(this.__views__), t;
      }
      function lg() {
        if (this.__filtered__) {
          var t = new ut(this);
          t.__dir__ = -1, t.__filtered__ = !0;
        } else
          t = this.clone(), t.__dir__ *= -1;
        return t;
      }
      function hg() {
        var t = this.__wrapped__.value(), i = this.__dir__, o = tt(t), f = i < 0, h = o ? t.length : 0, w = Aw(0, h, this.__views__), b = w.start, S = w.end, I = S - b, C = f ? S : b - 1, N = this.__iteratees__, $ = N.length, P = 0, K = Xt(I, this.__takeCount__);
        if (!o || !f && h == I && K == I)
          return Jc(t, this.__actions__);
        var Z = [];
        t:
          for (; I-- && P < K; ) {
            C += i;
            for (var rt = -1, X = t[C]; ++rt < $; ) {
              var st = N[rt], at = st.iteratee, Te = st.type, oe = at(X);
              if (Te == z)
                X = oe;
              else if (!oe) {
                if (Te == H)
                  continue t;
                break t;
              }
            }
            Z[P++] = X;
          }
        return Z;
      }
      ut.prototype = br(Ki.prototype), ut.prototype.constructor = ut;
      function Kn(t) {
        var i = -1, o = t == null ? 0 : t.length;
        for (this.clear(); ++i < o; ) {
          var f = t[i];
          this.set(f[0], f[1]);
        }
      }
      function dg() {
        this.__data__ = Zr ? Zr(null) : {}, this.size = 0;
      }
      function pg(t) {
        var i = this.has(t) && delete this.__data__[t];
        return this.size -= i ? 1 : 0, i;
      }
      function gg(t) {
        var i = this.__data__;
        if (Zr) {
          var o = i[t];
          return o === d ? r : o;
        }
        return ht.call(i, t) ? i[t] : r;
      }
      function wg(t) {
        var i = this.__data__;
        return Zr ? i[t] !== r : ht.call(i, t);
      }
      function yg(t, i) {
        var o = this.__data__;
        return this.size += this.has(t) ? 0 : 1, o[t] = Zr && i === r ? d : i, this;
      }
      Kn.prototype.clear = dg, Kn.prototype.delete = pg, Kn.prototype.get = gg, Kn.prototype.has = wg, Kn.prototype.set = yg;
      function on(t) {
        var i = -1, o = t == null ? 0 : t.length;
        for (this.clear(); ++i < o; ) {
          var f = t[i];
          this.set(f[0], f[1]);
        }
      }
      function mg() {
        this.__data__ = [], this.size = 0;
      }
      function bg(t) {
        var i = this.__data__, o = zi(i, t);
        if (o < 0)
          return !1;
        var f = i.length - 1;
        return o == f ? i.pop() : Fi.call(i, o, 1), --this.size, !0;
      }
      function Eg(t) {
        var i = this.__data__, o = zi(i, t);
        return o < 0 ? r : i[o][1];
      }
      function xg(t) {
        return zi(this.__data__, t) > -1;
      }
      function Sg(t, i) {
        var o = this.__data__, f = zi(o, t);
        return f < 0 ? (++this.size, o.push([t, i])) : o[f][1] = i, this;
      }
      on.prototype.clear = mg, on.prototype.delete = bg, on.prototype.get = Eg, on.prototype.has = xg, on.prototype.set = Sg;
      function un(t) {
        var i = -1, o = t == null ? 0 : t.length;
        for (this.clear(); ++i < o; ) {
          var f = t[i];
          this.set(f[0], f[1]);
        }
      }
      function _g() {
        this.size = 0, this.__data__ = {
          hash: new Kn(),
          map: new (Gr || on)(),
          string: new Kn()
        };
      }
      function Ag(t) {
        var i = rs(this, t).delete(t);
        return this.size -= i ? 1 : 0, i;
      }
      function vg(t) {
        return rs(this, t).get(t);
      }
      function Tg(t) {
        return rs(this, t).has(t);
      }
      function Ig(t, i) {
        var o = rs(this, t), f = o.size;
        return o.set(t, i), this.size += o.size == f ? 0 : 1, this;
      }
      un.prototype.clear = _g, un.prototype.delete = Ag, un.prototype.get = vg, un.prototype.has = Tg, un.prototype.set = Ig;
      function zn(t) {
        var i = -1, o = t == null ? 0 : t.length;
        for (this.__data__ = new un(); ++i < o; )
          this.add(t[i]);
      }
      function Bg(t) {
        return this.__data__.set(t, d), this;
      }
      function Rg(t) {
        return this.__data__.has(t);
      }
      zn.prototype.add = zn.prototype.push = Bg, zn.prototype.has = Rg;
      function Ve(t) {
        var i = this.__data__ = new on(t);
        this.size = i.size;
      }
      function Ug() {
        this.__data__ = new on(), this.size = 0;
      }
      function Lg(t) {
        var i = this.__data__, o = i.delete(t);
        return this.size = i.size, o;
      }
      function Cg(t) {
        return this.__data__.get(t);
      }
      function Ng(t) {
        return this.__data__.has(t);
      }
      function kg(t, i) {
        var o = this.__data__;
        if (o instanceof on) {
          var f = o.__data__;
          if (!Gr || f.length < u - 1)
            return f.push([t, i]), this.size = ++o.size, this;
          o = this.__data__ = new un(f);
        }
        return o.set(t, i), this.size = o.size, this;
      }
      Ve.prototype.clear = Ug, Ve.prototype.delete = Lg, Ve.prototype.get = Cg, Ve.prototype.has = Ng, Ve.prototype.set = kg;
      function Bc(t, i) {
        var o = tt(t), f = !o && Xn(t), h = !o && !f && Ln(t), w = !o && !f && !h && _r(t), b = o || f || h || w, S = b ? To(t.length, Kp) : [], I = S.length;
        for (var C in t)
          (i || ht.call(t, C)) && !(b && // Safari 9 has enumerable `arguments.length` in strict mode.
          (C == "length" || // Node.js 0.10 has enumerable non-index properties on buffers.
          h && (C == "offset" || C == "parent") || // PhantomJS 2 has enumerable non-index properties on typed arrays.
          w && (C == "buffer" || C == "byteLength" || C == "byteOffset") || // Skip index properties.
          ln(C, I))) && S.push(C);
        return S;
      }
      function Rc(t) {
        var i = t.length;
        return i ? t[qo(0, i - 1)] : r;
      }
      function Og(t, i) {
        return is(fe(t), Vn(i, 0, t.length));
      }
      function $g(t) {
        return is(fe(t));
      }
      function No(t, i, o) {
        (o !== r && !Ge(t[i], o) || o === r && !(i in t)) && an(t, i, o);
      }
      function Jr(t, i, o) {
        var f = t[i];
        (!(ht.call(t, i) && Ge(f, o)) || o === r && !(i in t)) && an(t, i, o);
      }
      function zi(t, i) {
        for (var o = t.length; o--; )
          if (Ge(t[o][0], i))
            return o;
        return -1;
      }
      function Dg(t, i, o, f) {
        return In(t, function(h, w, b) {
          i(f, h, o(h), b);
        }), f;
      }
      function Uc(t, i) {
        return t && je(i, Pt(i), t);
      }
      function Fg(t, i) {
        return t && je(i, he(i), t);
      }
      function an(t, i, o) {
        i == "__proto__" && Pi ? Pi(t, i, {
          configurable: !0,
          enumerable: !0,
          value: o,
          writable: !0
        }) : t[i] = o;
      }
      function ko(t, i) {
        for (var o = -1, f = i.length, h = R(f), w = t == null; ++o < f; )
          h[o] = w ? r : pu(t, i[o]);
        return h;
      }
      function Vn(t, i, o) {
        return t === t && (o !== r && (t = t <= o ? t : o), i !== r && (t = t >= i ? t : i)), t;
      }
      function $e(t, i, o, f, h, w) {
        var b, S = i & m, I = i & E, C = i & _;
        if (o && (b = h ? o(t, f, h, w) : o(t)), b !== r)
          return b;
        if (!vt(t))
          return t;
        var N = tt(t);
        if (N) {
          if (b = Tw(t), !S)
            return fe(t, b);
        } else {
          var $ = Jt(t), P = $ == Zt || $ == rn;
          if (Ln(t))
            return tf(t, S);
          if ($ == sn || $ == Ue || P && !h) {
            if (b = I || P ? {} : Ef(t), !S)
              return I ? gw(t, Fg(b, t)) : pw(t, Uc(b, t));
          } else {
            if (!mt[$])
              return h ? t : {};
            b = Iw(t, $, S);
          }
        }
        w || (w = new Ve());
        var K = w.get(t);
        if (K)
          return K;
        w.set(t, b), Zf(t) ? t.forEach(function(X) {
          b.add($e(X, i, o, X, t, w));
        }) : Gf(t) && t.forEach(function(X, st) {
          b.set(st, $e(X, i, o, st, t, w));
        });
        var Z = C ? I ? tu : jo : I ? he : Pt, rt = N ? r : Z(t);
        return Ne(rt || t, function(X, st) {
          rt && (st = X, X = t[st]), Jr(b, st, $e(X, i, o, st, t, w));
        }), b;
      }
      function Pg(t) {
        var i = Pt(t);
        return function(o) {
          return Lc(o, t, i);
        };
      }
      function Lc(t, i, o) {
        var f = o.length;
        if (t == null)
          return !f;
        for (t = pt(t); f--; ) {
          var h = o[f], w = i[h], b = t[h];
          if (b === r && !(h in t) || !w(b))
            return !1;
        }
        return !0;
      }
      function Cc(t, i, o) {
        if (typeof t != "function")
          throw new ke(c);
        return ii(function() {
          t.apply(r, o);
        }, i);
      }
      function Qr(t, i, o, f) {
        var h = -1, w = Bi, b = !0, S = t.length, I = [], C = i.length;
        if (!S)
          return I;
        o && (i = At(i, _e(o))), f ? (w = Eo, b = !1) : i.length >= u && (w = zr, b = !1, i = new zn(i));
        t:
          for (; ++h < S; ) {
            var N = t[h], $ = o == null ? N : o(N);
            if (N = f || N !== 0 ? N : 0, b && $ === $) {
              for (var P = C; P--; )
                if (i[P] === $)
                  continue t;
              I.push(N);
            } else w(i, $, f) || I.push(N);
          }
        return I;
      }
      var In = of(Qe), Nc = of($o, !0);
      function Wg(t, i) {
        var o = !0;
        return In(t, function(f, h, w) {
          return o = !!i(f, h, w), o;
        }), o;
      }
      function Vi(t, i, o) {
        for (var f = -1, h = t.length; ++f < h; ) {
          var w = t[f], b = i(w);
          if (b != null && (S === r ? b === b && !ve(b) : o(b, S)))
            var S = b, I = w;
        }
        return I;
      }
      function Mg(t, i, o, f) {
        var h = t.length;
        for (o = nt(o), o < 0 && (o = -o > h ? 0 : h + o), f = f === r || f > h ? h : nt(f), f < 0 && (f += h), f = o > f ? 0 : Jf(f); o < f; )
          t[o++] = i;
        return t;
      }
      function kc(t, i) {
        var o = [];
        return In(t, function(f, h, w) {
          i(f, h, w) && o.push(f);
        }), o;
      }
      function zt(t, i, o, f, h) {
        var w = -1, b = t.length;
        for (o || (o = Rw), h || (h = []); ++w < b; ) {
          var S = t[w];
          i > 0 && o(S) ? i > 1 ? zt(S, i - 1, o, f, h) : An(h, S) : f || (h[h.length] = S);
        }
        return h;
      }
      var Oo = uf(), Oc = uf(!0);
      function Qe(t, i) {
        return t && Oo(t, i, Pt);
      }
      function $o(t, i) {
        return t && Oc(t, i, Pt);
      }
      function Gi(t, i) {
        return _n(i, function(o) {
          return hn(t[o]);
        });
      }
      function Gn(t, i) {
        i = Rn(i, t);
        for (var o = 0, f = i.length; t != null && o < f; )
          t = t[tn(i[o++])];
        return o && o == f ? t : r;
      }
      function $c(t, i, o) {
        var f = i(t);
        return tt(t) ? f : An(f, o(t));
      }
      function ie(t) {
        return t == null ? t === r ? wd : pd : qn && qn in pt(t) ? _w(t) : $w(t);
      }
      function Do(t, i) {
        return t > i;
      }
      function Hg(t, i) {
        return t != null && ht.call(t, i);
      }
      function qg(t, i) {
        return t != null && i in pt(t);
      }
      function Kg(t, i, o) {
        return t >= Xt(i, o) && t < $t(i, o);
      }
      function Fo(t, i, o) {
        for (var f = o ? Eo : Bi, h = t[0].length, w = t.length, b = w, S = R(w), I = 1 / 0, C = []; b--; ) {
          var N = t[b];
          b && i && (N = At(N, _e(i))), I = Xt(N.length, I), S[b] = !o && (i || h >= 120 && N.length >= 120) ? new zn(b && N) : r;
        }
        N = t[0];
        var $ = -1, P = S[0];
        t:
          for (; ++$ < h && C.length < I; ) {
            var K = N[$], Z = i ? i(K) : K;
            if (K = o || K !== 0 ? K : 0, !(P ? zr(P, Z) : f(C, Z, o))) {
              for (b = w; --b; ) {
                var rt = S[b];
                if (!(rt ? zr(rt, Z) : f(t[b], Z, o)))
                  continue t;
              }
              P && P.push(Z), C.push(K);
            }
          }
        return C;
      }
      function zg(t, i, o, f) {
        return Qe(t, function(h, w, b) {
          i(f, o(h), w, b);
        }), f;
      }
      function jr(t, i, o) {
        i = Rn(i, t), t = Af(t, i);
        var f = t == null ? t : t[tn(Fe(i))];
        return f == null ? r : Se(f, t, o);
      }
      function Dc(t) {
        return Tt(t) && ie(t) == Ue;
      }
      function Vg(t) {
        return Tt(t) && ie(t) == Kr;
      }
      function Gg(t) {
        return Tt(t) && ie(t) == Le;
      }
      function ti(t, i, o, f, h) {
        return t === i ? !0 : t == null || i == null || !Tt(t) && !Tt(i) ? t !== t && i !== i : Yg(t, i, o, f, ti, h);
      }
      function Yg(t, i, o, f, h, w) {
        var b = tt(t), S = tt(i), I = b ? Ee : Jt(t), C = S ? Ee : Jt(i);
        I = I == Ue ? sn : I, C = C == Ue ? sn : C;
        var N = I == sn, $ = C == sn, P = I == C;
        if (P && Ln(t)) {
          if (!Ln(i))
            return !1;
          b = !0, N = !1;
        }
        if (P && !N)
          return w || (w = new Ve()), b || _r(t) ? yf(t, i, o, f, h, w) : xw(t, i, I, o, f, h, w);
        if (!(o & T)) {
          var K = N && ht.call(t, "__wrapped__"), Z = $ && ht.call(i, "__wrapped__");
          if (K || Z) {
            var rt = K ? t.value() : t, X = Z ? i.value() : i;
            return w || (w = new Ve()), h(rt, X, o, f, w);
          }
        }
        return P ? (w || (w = new Ve()), Sw(t, i, o, f, h, w)) : !1;
      }
      function Zg(t) {
        return Tt(t) && Jt(t) == ce;
      }
      function Po(t, i, o, f) {
        var h = o.length, w = h, b = !f;
        if (t == null)
          return !w;
        for (t = pt(t); h--; ) {
          var S = o[h];
          if (b && S[2] ? S[1] !== t[S[0]] : !(S[0] in t))
            return !1;
        }
        for (; ++h < w; ) {
          S = o[h];
          var I = S[0], C = t[I], N = S[1];
          if (b && S[2]) {
            if (C === r && !(I in t))
              return !1;
          } else {
            var $ = new Ve();
            if (f)
              var P = f(C, N, I, t, i, $);
            if (!(P === r ? ti(N, C, T | A, f, $) : P))
              return !1;
          }
        }
        return !0;
      }
      function Fc(t) {
        if (!vt(t) || Lw(t))
          return !1;
        var i = hn(t) ? Zp : Pd;
        return i.test(Zn(t));
      }
      function Xg(t) {
        return Tt(t) && ie(t) == Mr;
      }
      function Jg(t) {
        return Tt(t) && Jt(t) == Ke;
      }
      function Qg(t) {
        return Tt(t) && fs(t.length) && !!xt[ie(t)];
      }
      function Pc(t) {
        return typeof t == "function" ? t : t == null ? de : typeof t == "object" ? tt(t) ? Hc(t[0], t[1]) : Mc(t) : al(t);
      }
      function Wo(t) {
        if (!ri(t))
          return eg(t);
        var i = [];
        for (var o in pt(t))
          ht.call(t, o) && o != "constructor" && i.push(o);
        return i;
      }
      function jg(t) {
        if (!vt(t))
          return Ow(t);
        var i = ri(t), o = [];
        for (var f in t)
          f == "constructor" && (i || !ht.call(t, f)) || o.push(f);
        return o;
      }
      function Mo(t, i) {
        return t < i;
      }
      function Wc(t, i) {
        var o = -1, f = le(t) ? R(t.length) : [];
        return In(t, function(h, w, b) {
          f[++o] = i(h, w, b);
        }), f;
      }
      function Mc(t) {
        var i = nu(t);
        return i.length == 1 && i[0][2] ? Sf(i[0][0], i[0][1]) : function(o) {
          return o === t || Po(o, t, i);
        };
      }
      function Hc(t, i) {
        return iu(t) && xf(i) ? Sf(tn(t), i) : function(o) {
          var f = pu(o, t);
          return f === r && f === i ? gu(o, t) : ti(i, f, T | A);
        };
      }
      function Yi(t, i, o, f, h) {
        t !== i && Oo(i, function(w, b) {
          if (h || (h = new Ve()), vt(w))
            tw(t, i, b, o, Yi, f, h);
          else {
            var S = f ? f(ou(t, b), w, b + "", t, i, h) : r;
            S === r && (S = w), No(t, b, S);
          }
        }, he);
      }
      function tw(t, i, o, f, h, w, b) {
        var S = ou(t, o), I = ou(i, o), C = b.get(I);
        if (C) {
          No(t, o, C);
          return;
        }
        var N = w ? w(S, I, o + "", t, i, b) : r, $ = N === r;
        if ($) {
          var P = tt(I), K = !P && Ln(I), Z = !P && !K && _r(I);
          N = I, P || K || Z ? tt(S) ? N = S : Bt(S) ? N = fe(S) : K ? ($ = !1, N = tf(I, !0)) : Z ? ($ = !1, N = ef(I, !0)) : N = [] : si(I) || Xn(I) ? (N = S, Xn(S) ? N = Qf(S) : (!vt(S) || hn(S)) && (N = Ef(I))) : $ = !1;
        }
        $ && (b.set(I, N), h(N, I, f, w, b), b.delete(I)), No(t, o, N);
      }
      function qc(t, i) {
        var o = t.length;
        if (o)
          return i += i < 0 ? o : 0, ln(i, o) ? t[i] : r;
      }
      function Kc(t, i, o) {
        i.length ? i = At(i, function(w) {
          return tt(w) ? function(b) {
            return Gn(b, w.length === 1 ? w[0] : w);
          } : w;
        }) : i = [de];
        var f = -1;
        i = At(i, _e(Y()));
        var h = Wc(t, function(w, b, S) {
          var I = At(i, function(C) {
            return C(w);
          });
          return { criteria: I, index: ++f, value: w };
        });
        return Ip(h, function(w, b) {
          return dw(w, b, o);
        });
      }
      function ew(t, i) {
        return zc(t, i, function(o, f) {
          return gu(t, f);
        });
      }
      function zc(t, i, o) {
        for (var f = -1, h = i.length, w = {}; ++f < h; ) {
          var b = i[f], S = Gn(t, b);
          o(S, b) && ei(w, Rn(b, t), S);
        }
        return w;
      }
      function nw(t) {
        return function(i) {
          return Gn(i, t);
        };
      }
      function Ho(t, i, o, f) {
        var h = f ? Tp : hr, w = -1, b = i.length, S = t;
        for (t === i && (i = fe(i)), o && (S = At(t, _e(o))); ++w < b; )
          for (var I = 0, C = i[w], N = o ? o(C) : C; (I = h(S, N, I, f)) > -1; )
            S !== t && Fi.call(S, I, 1), Fi.call(t, I, 1);
        return t;
      }
      function Vc(t, i) {
        for (var o = t ? i.length : 0, f = o - 1; o--; ) {
          var h = i[o];
          if (o == f || h !== w) {
            var w = h;
            ln(h) ? Fi.call(t, h, 1) : Vo(t, h);
          }
        }
        return t;
      }
      function qo(t, i) {
        return t + Mi(Tc() * (i - t + 1));
      }
      function rw(t, i, o, f) {
        for (var h = -1, w = $t(Wi((i - t) / (o || 1)), 0), b = R(w); w--; )
          b[f ? w : ++h] = t, t += o;
        return b;
      }
      function Ko(t, i) {
        var o = "";
        if (!t || i < 1 || i > ot)
          return o;
        do
          i % 2 && (o += t), i = Mi(i / 2), i && (t += t);
        while (i);
        return o;
      }
      function it(t, i) {
        return uu(_f(t, i, de), t + "");
      }
      function iw(t) {
        return Rc(Ar(t));
      }
      function sw(t, i) {
        var o = Ar(t);
        return is(o, Vn(i, 0, o.length));
      }
      function ei(t, i, o, f) {
        if (!vt(t))
          return t;
        i = Rn(i, t);
        for (var h = -1, w = i.length, b = w - 1, S = t; S != null && ++h < w; ) {
          var I = tn(i[h]), C = o;
          if (I === "__proto__" || I === "constructor" || I === "prototype")
            return t;
          if (h != b) {
            var N = S[I];
            C = f ? f(N, I, S) : r, C === r && (C = vt(N) ? N : ln(i[h + 1]) ? [] : {});
          }
          Jr(S, I, C), S = S[I];
        }
        return t;
      }
      var Gc = Hi ? function(t, i) {
        return Hi.set(t, i), t;
      } : de, ow = Pi ? function(t, i) {
        return Pi(t, "toString", {
          configurable: !0,
          enumerable: !1,
          value: yu(i),
          writable: !0
        });
      } : de;
      function uw(t) {
        return is(Ar(t));
      }
      function De(t, i, o) {
        var f = -1, h = t.length;
        i < 0 && (i = -i > h ? 0 : h + i), o = o > h ? h : o, o < 0 && (o += h), h = i > o ? 0 : o - i >>> 0, i >>>= 0;
        for (var w = R(h); ++f < h; )
          w[f] = t[f + i];
        return w;
      }
      function aw(t, i) {
        var o;
        return In(t, function(f, h, w) {
          return o = i(f, h, w), !o;
        }), !!o;
      }
      function Zi(t, i, o) {
        var f = 0, h = t == null ? f : t.length;
        if (typeof i == "number" && i === i && h <= be) {
          for (; f < h; ) {
            var w = f + h >>> 1, b = t[w];
            b !== null && !ve(b) && (o ? b <= i : b < i) ? f = w + 1 : h = w;
          }
          return h;
        }
        return zo(t, i, de, o);
      }
      function zo(t, i, o, f) {
        var h = 0, w = t == null ? 0 : t.length;
        if (w === 0)
          return 0;
        i = o(i);
        for (var b = i !== i, S = i === null, I = ve(i), C = i === r; h < w; ) {
          var N = Mi((h + w) / 2), $ = o(t[N]), P = $ !== r, K = $ === null, Z = $ === $, rt = ve($);
          if (b)
            var X = f || Z;
          else C ? X = Z && (f || P) : S ? X = Z && P && (f || !K) : I ? X = Z && P && !K && (f || !rt) : K || rt ? X = !1 : X = f ? $ <= i : $ < i;
          X ? h = N + 1 : w = N;
        }
        return Xt(w, Xe);
      }
      function Yc(t, i) {
        for (var o = -1, f = t.length, h = 0, w = []; ++o < f; ) {
          var b = t[o], S = i ? i(b) : b;
          if (!o || !Ge(S, I)) {
            var I = S;
            w[h++] = b === 0 ? 0 : b;
          }
        }
        return w;
      }
      function Zc(t) {
        return typeof t == "number" ? t : ve(t) ? kt : +t;
      }
      function Ae(t) {
        if (typeof t == "string")
          return t;
        if (tt(t))
          return At(t, Ae) + "";
        if (ve(t))
          return Ic ? Ic.call(t) : "";
        var i = t + "";
        return i == "0" && 1 / t == -Q ? "-0" : i;
      }
      function Bn(t, i, o) {
        var f = -1, h = Bi, w = t.length, b = !0, S = [], I = S;
        if (o)
          b = !1, h = Eo;
        else if (w >= u) {
          var C = i ? null : bw(t);
          if (C)
            return Ui(C);
          b = !1, h = zr, I = new zn();
        } else
          I = i ? [] : S;
        t:
          for (; ++f < w; ) {
            var N = t[f], $ = i ? i(N) : N;
            if (N = o || N !== 0 ? N : 0, b && $ === $) {
              for (var P = I.length; P--; )
                if (I[P] === $)
                  continue t;
              i && I.push($), S.push(N);
            } else h(I, $, o) || (I !== S && I.push($), S.push(N));
          }
        return S;
      }
      function Vo(t, i) {
        return i = Rn(i, t), t = Af(t, i), t == null || delete t[tn(Fe(i))];
      }
      function Xc(t, i, o, f) {
        return ei(t, i, o(Gn(t, i)), f);
      }
      function Xi(t, i, o, f) {
        for (var h = t.length, w = f ? h : -1; (f ? w-- : ++w < h) && i(t[w], w, t); )
          ;
        return o ? De(t, f ? 0 : w, f ? w + 1 : h) : De(t, f ? w + 1 : 0, f ? h : w);
      }
      function Jc(t, i) {
        var o = t;
        return o instanceof ut && (o = o.value()), xo(i, function(f, h) {
          return h.func.apply(h.thisArg, An([f], h.args));
        }, o);
      }
      function Go(t, i, o) {
        var f = t.length;
        if (f < 2)
          return f ? Bn(t[0]) : [];
        for (var h = -1, w = R(f); ++h < f; )
          for (var b = t[h], S = -1; ++S < f; )
            S != h && (w[h] = Qr(w[h] || b, t[S], i, o));
        return Bn(zt(w, 1), i, o);
      }
      function Qc(t, i, o) {
        for (var f = -1, h = t.length, w = i.length, b = {}; ++f < h; ) {
          var S = f < w ? i[f] : r;
          o(b, t[f], S);
        }
        return b;
      }
      function Yo(t) {
        return Bt(t) ? t : [];
      }
      function Zo(t) {
        return typeof t == "function" ? t : de;
      }
      function Rn(t, i) {
        return tt(t) ? t : iu(t, i) ? [t] : Bf(lt(t));
      }
      var cw = it;
      function Un(t, i, o) {
        var f = t.length;
        return o = o === r ? f : o, !i && o >= f ? t : De(t, i, o);
      }
      var jc = Xp || function(t) {
        return Kt.clearTimeout(t);
      };
      function tf(t, i) {
        if (i)
          return t.slice();
        var o = t.length, f = xc ? xc(o) : new t.constructor(o);
        return t.copy(f), f;
      }
      function Xo(t) {
        var i = new t.constructor(t.byteLength);
        return new $i(i).set(new $i(t)), i;
      }
      function fw(t, i) {
        var o = i ? Xo(t.buffer) : t.buffer;
        return new t.constructor(o, t.byteOffset, t.byteLength);
      }
      function lw(t) {
        var i = new t.constructor(t.source, Da.exec(t));
        return i.lastIndex = t.lastIndex, i;
      }
      function hw(t) {
        return Xr ? pt(Xr.call(t)) : {};
      }
      function ef(t, i) {
        var o = i ? Xo(t.buffer) : t.buffer;
        return new t.constructor(o, t.byteOffset, t.length);
      }
      function nf(t, i) {
        if (t !== i) {
          var o = t !== r, f = t === null, h = t === t, w = ve(t), b = i !== r, S = i === null, I = i === i, C = ve(i);
          if (!S && !C && !w && t > i || w && b && I && !S && !C || f && b && I || !o && I || !h)
            return 1;
          if (!f && !w && !C && t < i || C && o && h && !f && !w || S && o && h || !b && h || !I)
            return -1;
        }
        return 0;
      }
      function dw(t, i, o) {
        for (var f = -1, h = t.criteria, w = i.criteria, b = h.length, S = o.length; ++f < b; ) {
          var I = nf(h[f], w[f]);
          if (I) {
            if (f >= S)
              return I;
            var C = o[f];
            return I * (C == "desc" ? -1 : 1);
          }
        }
        return t.index - i.index;
      }
      function rf(t, i, o, f) {
        for (var h = -1, w = t.length, b = o.length, S = -1, I = i.length, C = $t(w - b, 0), N = R(I + C), $ = !f; ++S < I; )
          N[S] = i[S];
        for (; ++h < b; )
          ($ || h < w) && (N[o[h]] = t[h]);
        for (; C--; )
          N[S++] = t[h++];
        return N;
      }
      function sf(t, i, o, f) {
        for (var h = -1, w = t.length, b = -1, S = o.length, I = -1, C = i.length, N = $t(w - S, 0), $ = R(N + C), P = !f; ++h < N; )
          $[h] = t[h];
        for (var K = h; ++I < C; )
          $[K + I] = i[I];
        for (; ++b < S; )
          (P || h < w) && ($[K + o[b]] = t[h++]);
        return $;
      }
      function fe(t, i) {
        var o = -1, f = t.length;
        for (i || (i = R(f)); ++o < f; )
          i[o] = t[o];
        return i;
      }
      function je(t, i, o, f) {
        var h = !o;
        o || (o = {});
        for (var w = -1, b = i.length; ++w < b; ) {
          var S = i[w], I = f ? f(o[S], t[S], S, o, t) : r;
          I === r && (I = t[S]), h ? an(o, S, I) : Jr(o, S, I);
        }
        return o;
      }
      function pw(t, i) {
        return je(t, ru(t), i);
      }
      function gw(t, i) {
        return je(t, mf(t), i);
      }
      function Ji(t, i) {
        return function(o, f) {
          var h = tt(o) ? Ep : Dg, w = i ? i() : {};
          return h(o, t, Y(f, 2), w);
        };
      }
      function Er(t) {
        return it(function(i, o) {
          var f = -1, h = o.length, w = h > 1 ? o[h - 1] : r, b = h > 2 ? o[2] : r;
          for (w = t.length > 3 && typeof w == "function" ? (h--, w) : r, b && se(o[0], o[1], b) && (w = h < 3 ? r : w, h = 1), i = pt(i); ++f < h; ) {
            var S = o[f];
            S && t(i, S, f, w);
          }
          return i;
        });
      }
      function of(t, i) {
        return function(o, f) {
          if (o == null)
            return o;
          if (!le(o))
            return t(o, f);
          for (var h = o.length, w = i ? h : -1, b = pt(o); (i ? w-- : ++w < h) && f(b[w], w, b) !== !1; )
            ;
          return o;
        };
      }
      function uf(t) {
        return function(i, o, f) {
          for (var h = -1, w = pt(i), b = f(i), S = b.length; S--; ) {
            var I = b[t ? S : ++h];
            if (o(w[I], I, w) === !1)
              break;
          }
          return i;
        };
      }
      function ww(t, i, o) {
        var f = i & x, h = ni(t);
        function w() {
          var b = this && this !== Kt && this instanceof w ? h : t;
          return b.apply(f ? o : this, arguments);
        }
        return w;
      }
      function af(t) {
        return function(i) {
          i = lt(i);
          var o = dr(i) ? ze(i) : r, f = o ? o[0] : i.charAt(0), h = o ? Un(o, 1).join("") : i.slice(1);
          return f[t]() + h;
        };
      }
      function xr(t) {
        return function(i) {
          return xo(ol(sl(i).replace(op, "")), t, "");
        };
      }
      function ni(t) {
        return function() {
          var i = arguments;
          switch (i.length) {
            case 0:
              return new t();
            case 1:
              return new t(i[0]);
            case 2:
              return new t(i[0], i[1]);
            case 3:
              return new t(i[0], i[1], i[2]);
            case 4:
              return new t(i[0], i[1], i[2], i[3]);
            case 5:
              return new t(i[0], i[1], i[2], i[3], i[4]);
            case 6:
              return new t(i[0], i[1], i[2], i[3], i[4], i[5]);
            case 7:
              return new t(i[0], i[1], i[2], i[3], i[4], i[5], i[6]);
          }
          var o = br(t.prototype), f = t.apply(o, i);
          return vt(f) ? f : o;
        };
      }
      function yw(t, i, o) {
        var f = ni(t);
        function h() {
          for (var w = arguments.length, b = R(w), S = w, I = Sr(h); S--; )
            b[S] = arguments[S];
          var C = w < 3 && b[0] !== I && b[w - 1] !== I ? [] : vn(b, I);
          if (w -= C.length, w < o)
            return df(
              t,
              i,
              Qi,
              h.placeholder,
              r,
              b,
              C,
              r,
              r,
              o - w
            );
          var N = this && this !== Kt && this instanceof h ? f : t;
          return Se(N, this, b);
        }
        return h;
      }
      function cf(t) {
        return function(i, o, f) {
          var h = pt(i);
          if (!le(i)) {
            var w = Y(o, 3);
            i = Pt(i), o = function(S) {
              return w(h[S], S, h);
            };
          }
          var b = t(i, o, f);
          return b > -1 ? h[w ? i[b] : b] : r;
        };
      }
      function ff(t) {
        return fn(function(i) {
          var o = i.length, f = o, h = Oe.prototype.thru;
          for (t && i.reverse(); f--; ) {
            var w = i[f];
            if (typeof w != "function")
              throw new ke(c);
            if (h && !b && ns(w) == "wrapper")
              var b = new Oe([], !0);
          }
          for (f = b ? f : o; ++f < o; ) {
            w = i[f];
            var S = ns(w), I = S == "wrapper" ? eu(w) : r;
            I && su(I[0]) && I[1] == (M | O | D | G) && !I[4].length && I[9] == 1 ? b = b[ns(I[0])].apply(b, I[3]) : b = w.length == 1 && su(w) ? b[S]() : b.thru(w);
          }
          return function() {
            var C = arguments, N = C[0];
            if (b && C.length == 1 && tt(N))
              return b.plant(N).value();
            for (var $ = 0, P = o ? i[$].apply(this, C) : N; ++$ < o; )
              P = i[$].call(this, P);
            return P;
          };
        });
      }
      function Qi(t, i, o, f, h, w, b, S, I, C) {
        var N = i & M, $ = i & x, P = i & B, K = i & (O | F), Z = i & J, rt = P ? r : ni(t);
        function X() {
          for (var st = arguments.length, at = R(st), Te = st; Te--; )
            at[Te] = arguments[Te];
          if (K)
            var oe = Sr(X), Ie = Rp(at, oe);
          if (f && (at = rf(at, f, h, K)), w && (at = sf(at, w, b, K)), st -= Ie, K && st < C) {
            var Rt = vn(at, oe);
            return df(
              t,
              i,
              Qi,
              X.placeholder,
              o,
              at,
              Rt,
              S,
              I,
              C - st
            );
          }
          var Ye = $ ? o : this, pn = P ? Ye[t] : t;
          return st = at.length, S ? at = Dw(at, S) : Z && st > 1 && at.reverse(), N && I < st && (at.length = I), this && this !== Kt && this instanceof X && (pn = rt || ni(pn)), pn.apply(Ye, at);
        }
        return X;
      }
      function lf(t, i) {
        return function(o, f) {
          return zg(o, t, i(f), {});
        };
      }
      function ji(t, i) {
        return function(o, f) {
          var h;
          if (o === r && f === r)
            return i;
          if (o !== r && (h = o), f !== r) {
            if (h === r)
              return f;
            typeof o == "string" || typeof f == "string" ? (o = Ae(o), f = Ae(f)) : (o = Zc(o), f = Zc(f)), h = t(o, f);
          }
          return h;
        };
      }
      function Jo(t) {
        return fn(function(i) {
          return i = At(i, _e(Y())), it(function(o) {
            var f = this;
            return t(i, function(h) {
              return Se(h, f, o);
            });
          });
        });
      }
      function ts(t, i) {
        i = i === r ? " " : Ae(i);
        var o = i.length;
        if (o < 2)
          return o ? Ko(i, t) : i;
        var f = Ko(i, Wi(t / pr(i)));
        return dr(i) ? Un(ze(f), 0, t).join("") : f.slice(0, t);
      }
      function mw(t, i, o, f) {
        var h = i & x, w = ni(t);
        function b() {
          for (var S = -1, I = arguments.length, C = -1, N = f.length, $ = R(N + I), P = this && this !== Kt && this instanceof b ? w : t; ++C < N; )
            $[C] = f[C];
          for (; I--; )
            $[C++] = arguments[++S];
          return Se(P, h ? o : this, $);
        }
        return b;
      }
      function hf(t) {
        return function(i, o, f) {
          return f && typeof f != "number" && se(i, o, f) && (o = f = r), i = dn(i), o === r ? (o = i, i = 0) : o = dn(o), f = f === r ? i < o ? 1 : -1 : dn(f), rw(i, o, f, t);
        };
      }
      function es(t) {
        return function(i, o) {
          return typeof i == "string" && typeof o == "string" || (i = Pe(i), o = Pe(o)), t(i, o);
        };
      }
      function df(t, i, o, f, h, w, b, S, I, C) {
        var N = i & O, $ = N ? b : r, P = N ? r : b, K = N ? w : r, Z = N ? r : w;
        i |= N ? D : W, i &= ~(N ? W : D), i & k || (i &= ~(x | B));
        var rt = [
          t,
          i,
          h,
          K,
          $,
          Z,
          P,
          S,
          I,
          C
        ], X = o.apply(r, rt);
        return su(t) && vf(X, rt), X.placeholder = f, Tf(X, t, i);
      }
      function Qo(t) {
        var i = Ot[t];
        return function(o, f) {
          if (o = Pe(o), f = f == null ? 0 : Xt(nt(f), 292), f && vc(o)) {
            var h = (lt(o) + "e").split("e"), w = i(h[0] + "e" + (+h[1] + f));
            return h = (lt(w) + "e").split("e"), +(h[0] + "e" + (+h[1] - f));
          }
          return i(o);
        };
      }
      var bw = yr && 1 / Ui(new yr([, -0]))[1] == Q ? function(t) {
        return new yr(t);
      } : Eu;
      function pf(t) {
        return function(i) {
          var o = Jt(i);
          return o == ce ? Bo(i) : o == Ke ? $p(i) : Bp(i, t(i));
        };
      }
      function cn(t, i, o, f, h, w, b, S) {
        var I = i & B;
        if (!I && typeof t != "function")
          throw new ke(c);
        var C = f ? f.length : 0;
        if (C || (i &= ~(D | W), f = h = r), b = b === r ? b : $t(nt(b), 0), S = S === r ? S : nt(S), C -= h ? h.length : 0, i & W) {
          var N = f, $ = h;
          f = h = r;
        }
        var P = I ? r : eu(t), K = [
          t,
          i,
          o,
          f,
          h,
          N,
          $,
          w,
          b,
          S
        ];
        if (P && kw(K, P), t = K[0], i = K[1], o = K[2], f = K[3], h = K[4], S = K[9] = K[9] === r ? I ? 0 : t.length : $t(K[9] - C, 0), !S && i & (O | F) && (i &= ~(O | F)), !i || i == x)
          var Z = ww(t, i, o);
        else i == O || i == F ? Z = yw(t, i, S) : (i == D || i == (x | D)) && !h.length ? Z = mw(t, i, o, f) : Z = Qi.apply(r, K);
        var rt = P ? Gc : vf;
        return Tf(rt(Z, K), t, i);
      }
      function gf(t, i, o, f) {
        return t === r || Ge(t, wr[o]) && !ht.call(f, o) ? i : t;
      }
      function wf(t, i, o, f, h, w) {
        return vt(t) && vt(i) && (w.set(i, t), Yi(t, i, r, wf, w), w.delete(i)), t;
      }
      function Ew(t) {
        return si(t) ? r : t;
      }
      function yf(t, i, o, f, h, w) {
        var b = o & T, S = t.length, I = i.length;
        if (S != I && !(b && I > S))
          return !1;
        var C = w.get(t), N = w.get(i);
        if (C && N)
          return C == i && N == t;
        var $ = -1, P = !0, K = o & A ? new zn() : r;
        for (w.set(t, i), w.set(i, t); ++$ < S; ) {
          var Z = t[$], rt = i[$];
          if (f)
            var X = b ? f(rt, Z, $, i, t, w) : f(Z, rt, $, t, i, w);
          if (X !== r) {
            if (X)
              continue;
            P = !1;
            break;
          }
          if (K) {
            if (!So(i, function(st, at) {
              if (!zr(K, at) && (Z === st || h(Z, st, o, f, w)))
                return K.push(at);
            })) {
              P = !1;
              break;
            }
          } else if (!(Z === rt || h(Z, rt, o, f, w))) {
            P = !1;
            break;
          }
        }
        return w.delete(t), w.delete(i), P;
      }
      function xw(t, i, o, f, h, w, b) {
        switch (o) {
          case fr:
            if (t.byteLength != i.byteLength || t.byteOffset != i.byteOffset)
              return !1;
            t = t.buffer, i = i.buffer;
          case Kr:
            return !(t.byteLength != i.byteLength || !w(new $i(t), new $i(i)));
          case xe:
          case Le:
          case Sn:
            return Ge(+t, +i);
          case qe:
            return t.name == i.name && t.message == i.message;
          case Mr:
          case Hr:
            return t == i + "";
          case ce:
            var S = Bo;
          case Ke:
            var I = f & T;
            if (S || (S = Ui), t.size != i.size && !I)
              return !1;
            var C = b.get(t);
            if (C)
              return C == i;
            f |= A, b.set(t, i);
            var N = yf(S(t), S(i), f, h, w, b);
            return b.delete(t), N;
          case Ai:
            if (Xr)
              return Xr.call(t) == Xr.call(i);
        }
        return !1;
      }
      function Sw(t, i, o, f, h, w) {
        var b = o & T, S = jo(t), I = S.length, C = jo(i), N = C.length;
        if (I != N && !b)
          return !1;
        for (var $ = I; $--; ) {
          var P = S[$];
          if (!(b ? P in i : ht.call(i, P)))
            return !1;
        }
        var K = w.get(t), Z = w.get(i);
        if (K && Z)
          return K == i && Z == t;
        var rt = !0;
        w.set(t, i), w.set(i, t);
        for (var X = b; ++$ < I; ) {
          P = S[$];
          var st = t[P], at = i[P];
          if (f)
            var Te = b ? f(at, st, P, i, t, w) : f(st, at, P, t, i, w);
          if (!(Te === r ? st === at || h(st, at, o, f, w) : Te)) {
            rt = !1;
            break;
          }
          X || (X = P == "constructor");
        }
        if (rt && !X) {
          var oe = t.constructor, Ie = i.constructor;
          oe != Ie && "constructor" in t && "constructor" in i && !(typeof oe == "function" && oe instanceof oe && typeof Ie == "function" && Ie instanceof Ie) && (rt = !1);
        }
        return w.delete(t), w.delete(i), rt;
      }
      function fn(t) {
        return uu(_f(t, r, Cf), t + "");
      }
      function jo(t) {
        return $c(t, Pt, ru);
      }
      function tu(t) {
        return $c(t, he, mf);
      }
      var eu = Hi ? function(t) {
        return Hi.get(t);
      } : Eu;
      function ns(t) {
        for (var i = t.name + "", o = mr[i], f = ht.call(mr, i) ? o.length : 0; f--; ) {
          var h = o[f], w = h.func;
          if (w == null || w == t)
            return h.name;
        }
        return i;
      }
      function Sr(t) {
        var i = ht.call(p, "placeholder") ? p : t;
        return i.placeholder;
      }
      function Y() {
        var t = p.iteratee || mu;
        return t = t === mu ? Pc : t, arguments.length ? t(arguments[0], arguments[1]) : t;
      }
      function rs(t, i) {
        var o = t.__data__;
        return Uw(i) ? o[typeof i == "string" ? "string" : "hash"] : o.map;
      }
      function nu(t) {
        for (var i = Pt(t), o = i.length; o--; ) {
          var f = i[o], h = t[f];
          i[o] = [f, h, xf(h)];
        }
        return i;
      }
      function Yn(t, i) {
        var o = Np(t, i);
        return Fc(o) ? o : r;
      }
      function _w(t) {
        var i = ht.call(t, qn), o = t[qn];
        try {
          t[qn] = r;
          var f = !0;
        } catch {
        }
        var h = ki.call(t);
        return f && (i ? t[qn] = o : delete t[qn]), h;
      }
      var ru = Uo ? function(t) {
        return t == null ? [] : (t = pt(t), _n(Uo(t), function(i) {
          return _c.call(t, i);
        }));
      } : xu, mf = Uo ? function(t) {
        for (var i = []; t; )
          An(i, ru(t)), t = Di(t);
        return i;
      } : xu, Jt = ie;
      (Lo && Jt(new Lo(new ArrayBuffer(1))) != fr || Gr && Jt(new Gr()) != ce || Co && Jt(Co.resolve()) != Na || yr && Jt(new yr()) != Ke || Yr && Jt(new Yr()) != qr) && (Jt = function(t) {
        var i = ie(t), o = i == sn ? t.constructor : r, f = o ? Zn(o) : "";
        if (f)
          switch (f) {
            case sg:
              return fr;
            case og:
              return ce;
            case ug:
              return Na;
            case ag:
              return Ke;
            case cg:
              return qr;
          }
        return i;
      });
      function Aw(t, i, o) {
        for (var f = -1, h = o.length; ++f < h; ) {
          var w = o[f], b = w.size;
          switch (w.type) {
            case "drop":
              t += b;
              break;
            case "dropRight":
              i -= b;
              break;
            case "take":
              i = Xt(i, t + b);
              break;
            case "takeRight":
              t = $t(t, i - b);
              break;
          }
        }
        return { start: t, end: i };
      }
      function vw(t) {
        var i = t.match(Ld);
        return i ? i[1].split(Cd) : [];
      }
      function bf(t, i, o) {
        i = Rn(i, t);
        for (var f = -1, h = i.length, w = !1; ++f < h; ) {
          var b = tn(i[f]);
          if (!(w = t != null && o(t, b)))
            break;
          t = t[b];
        }
        return w || ++f != h ? w : (h = t == null ? 0 : t.length, !!h && fs(h) && ln(b, h) && (tt(t) || Xn(t)));
      }
      function Tw(t) {
        var i = t.length, o = new t.constructor(i);
        return i && typeof t[0] == "string" && ht.call(t, "index") && (o.index = t.index, o.input = t.input), o;
      }
      function Ef(t) {
        return typeof t.constructor == "function" && !ri(t) ? br(Di(t)) : {};
      }
      function Iw(t, i, o) {
        var f = t.constructor;
        switch (i) {
          case Kr:
            return Xo(t);
          case xe:
          case Le:
            return new f(+t);
          case fr:
            return fw(t, o);
          case eo:
          case no:
          case ro:
          case io:
          case so:
          case oo:
          case uo:
          case ao:
          case co:
            return ef(t, o);
          case ce:
            return new f();
          case Sn:
          case Hr:
            return new f(t);
          case Mr:
            return lw(t);
          case Ke:
            return new f();
          case Ai:
            return hw(t);
        }
      }
      function Bw(t, i) {
        var o = i.length;
        if (!o)
          return t;
        var f = o - 1;
        return i[f] = (o > 1 ? "& " : "") + i[f], i = i.join(o > 2 ? ", " : " "), t.replace(Ud, `{
/* [wrapped with ` + i + `] */
`);
      }
      function Rw(t) {
        return tt(t) || Xn(t) || !!(Ac && t && t[Ac]);
      }
      function ln(t, i) {
        var o = typeof t;
        return i = i ?? ot, !!i && (o == "number" || o != "symbol" && Md.test(t)) && t > -1 && t % 1 == 0 && t < i;
      }
      function se(t, i, o) {
        if (!vt(o))
          return !1;
        var f = typeof i;
        return (f == "number" ? le(o) && ln(i, o.length) : f == "string" && i in o) ? Ge(o[i], t) : !1;
      }
      function iu(t, i) {
        if (tt(t))
          return !1;
        var o = typeof t;
        return o == "number" || o == "symbol" || o == "boolean" || t == null || ve(t) ? !0 : Td.test(t) || !vd.test(t) || i != null && t in pt(i);
      }
      function Uw(t) {
        var i = typeof t;
        return i == "string" || i == "number" || i == "symbol" || i == "boolean" ? t !== "__proto__" : t === null;
      }
      function su(t) {
        var i = ns(t), o = p[i];
        if (typeof o != "function" || !(i in ut.prototype))
          return !1;
        if (t === o)
          return !0;
        var f = eu(o);
        return !!f && t === f[0];
      }
      function Lw(t) {
        return !!Ec && Ec in t;
      }
      var Cw = Ci ? hn : Su;
      function ri(t) {
        var i = t && t.constructor, o = typeof i == "function" && i.prototype || wr;
        return t === o;
      }
      function xf(t) {
        return t === t && !vt(t);
      }
      function Sf(t, i) {
        return function(o) {
          return o == null ? !1 : o[t] === i && (i !== r || t in pt(o));
        };
      }
      function Nw(t) {
        var i = as(t, function(f) {
          return o.size === g && o.clear(), f;
        }), o = i.cache;
        return i;
      }
      function kw(t, i) {
        var o = t[1], f = i[1], h = o | f, w = h < (x | B | M), b = f == M && o == O || f == M && o == G && t[7].length <= i[8] || f == (M | G) && i[7].length <= i[8] && o == O;
        if (!(w || b))
          return t;
        f & x && (t[2] = i[2], h |= o & x ? 0 : k);
        var S = i[3];
        if (S) {
          var I = t[3];
          t[3] = I ? rf(I, S, i[4]) : S, t[4] = I ? vn(t[3], y) : i[4];
        }
        return S = i[5], S && (I = t[5], t[5] = I ? sf(I, S, i[6]) : S, t[6] = I ? vn(t[5], y) : i[6]), S = i[7], S && (t[7] = S), f & M && (t[8] = t[8] == null ? i[8] : Xt(t[8], i[8])), t[9] == null && (t[9] = i[9]), t[0] = i[0], t[1] = h, t;
      }
      function Ow(t) {
        var i = [];
        if (t != null)
          for (var o in pt(t))
            i.push(o);
        return i;
      }
      function $w(t) {
        return ki.call(t);
      }
      function _f(t, i, o) {
        return i = $t(i === r ? t.length - 1 : i, 0), function() {
          for (var f = arguments, h = -1, w = $t(f.length - i, 0), b = R(w); ++h < w; )
            b[h] = f[i + h];
          h = -1;
          for (var S = R(i + 1); ++h < i; )
            S[h] = f[h];
          return S[i] = o(b), Se(t, this, S);
        };
      }
      function Af(t, i) {
        return i.length < 2 ? t : Gn(t, De(i, 0, -1));
      }
      function Dw(t, i) {
        for (var o = t.length, f = Xt(i.length, o), h = fe(t); f--; ) {
          var w = i[f];
          t[f] = ln(w, o) ? h[w] : r;
        }
        return t;
      }
      function ou(t, i) {
        if (!(i === "constructor" && typeof t[i] == "function") && i != "__proto__")
          return t[i];
      }
      var vf = If(Gc), ii = Qp || function(t, i) {
        return Kt.setTimeout(t, i);
      }, uu = If(ow);
      function Tf(t, i, o) {
        var f = i + "";
        return uu(t, Bw(f, Fw(vw(f), o)));
      }
      function If(t) {
        var i = 0, o = 0;
        return function() {
          var f = ng(), h = re - (f - o);
          if (o = f, h > 0) {
            if (++i >= ft)
              return arguments[0];
          } else
            i = 0;
          return t.apply(r, arguments);
        };
      }
      function is(t, i) {
        var o = -1, f = t.length, h = f - 1;
        for (i = i === r ? f : i; ++o < i; ) {
          var w = qo(o, h), b = t[w];
          t[w] = t[o], t[o] = b;
        }
        return t.length = i, t;
      }
      var Bf = Nw(function(t) {
        var i = [];
        return t.charCodeAt(0) === 46 && i.push(""), t.replace(Id, function(o, f, h, w) {
          i.push(h ? w.replace(Od, "$1") : f || o);
        }), i;
      });
      function tn(t) {
        if (typeof t == "string" || ve(t))
          return t;
        var i = t + "";
        return i == "0" && 1 / t == -Q ? "-0" : i;
      }
      function Zn(t) {
        if (t != null) {
          try {
            return Ni.call(t);
          } catch {
          }
          try {
            return t + "";
          } catch {
          }
        }
        return "";
      }
      function Fw(t, i) {
        return Ne(Je, function(o) {
          var f = "_." + o[0];
          i & o[1] && !Bi(t, f) && t.push(f);
        }), t.sort();
      }
      function Rf(t) {
        if (t instanceof ut)
          return t.clone();
        var i = new Oe(t.__wrapped__, t.__chain__);
        return i.__actions__ = fe(t.__actions__), i.__index__ = t.__index__, i.__values__ = t.__values__, i;
      }
      function Pw(t, i, o) {
        (o ? se(t, i, o) : i === r) ? i = 1 : i = $t(nt(i), 0);
        var f = t == null ? 0 : t.length;
        if (!f || i < 1)
          return [];
        for (var h = 0, w = 0, b = R(Wi(f / i)); h < f; )
          b[w++] = De(t, h, h += i);
        return b;
      }
      function Ww(t) {
        for (var i = -1, o = t == null ? 0 : t.length, f = 0, h = []; ++i < o; ) {
          var w = t[i];
          w && (h[f++] = w);
        }
        return h;
      }
      function Mw() {
        var t = arguments.length;
        if (!t)
          return [];
        for (var i = R(t - 1), o = arguments[0], f = t; f--; )
          i[f - 1] = arguments[f];
        return An(tt(o) ? fe(o) : [o], zt(i, 1));
      }
      var Hw = it(function(t, i) {
        return Bt(t) ? Qr(t, zt(i, 1, Bt, !0)) : [];
      }), qw = it(function(t, i) {
        var o = Fe(i);
        return Bt(o) && (o = r), Bt(t) ? Qr(t, zt(i, 1, Bt, !0), Y(o, 2)) : [];
      }), Kw = it(function(t, i) {
        var o = Fe(i);
        return Bt(o) && (o = r), Bt(t) ? Qr(t, zt(i, 1, Bt, !0), r, o) : [];
      });
      function zw(t, i, o) {
        var f = t == null ? 0 : t.length;
        return f ? (i = o || i === r ? 1 : nt(i), De(t, i < 0 ? 0 : i, f)) : [];
      }
      function Vw(t, i, o) {
        var f = t == null ? 0 : t.length;
        return f ? (i = o || i === r ? 1 : nt(i), i = f - i, De(t, 0, i < 0 ? 0 : i)) : [];
      }
      function Gw(t, i) {
        return t && t.length ? Xi(t, Y(i, 3), !0, !0) : [];
      }
      function Yw(t, i) {
        return t && t.length ? Xi(t, Y(i, 3), !0) : [];
      }
      function Zw(t, i, o, f) {
        var h = t == null ? 0 : t.length;
        return h ? (o && typeof o != "number" && se(t, i, o) && (o = 0, f = h), Mg(t, i, o, f)) : [];
      }
      function Uf(t, i, o) {
        var f = t == null ? 0 : t.length;
        if (!f)
          return -1;
        var h = o == null ? 0 : nt(o);
        return h < 0 && (h = $t(f + h, 0)), Ri(t, Y(i, 3), h);
      }
      function Lf(t, i, o) {
        var f = t == null ? 0 : t.length;
        if (!f)
          return -1;
        var h = f - 1;
        return o !== r && (h = nt(o), h = o < 0 ? $t(f + h, 0) : Xt(h, f - 1)), Ri(t, Y(i, 3), h, !0);
      }
      function Cf(t) {
        var i = t == null ? 0 : t.length;
        return i ? zt(t, 1) : [];
      }
      function Xw(t) {
        var i = t == null ? 0 : t.length;
        return i ? zt(t, Q) : [];
      }
      function Jw(t, i) {
        var o = t == null ? 0 : t.length;
        return o ? (i = i === r ? 1 : nt(i), zt(t, i)) : [];
      }
      function Qw(t) {
        for (var i = -1, o = t == null ? 0 : t.length, f = {}; ++i < o; ) {
          var h = t[i];
          f[h[0]] = h[1];
        }
        return f;
      }
      function Nf(t) {
        return t && t.length ? t[0] : r;
      }
      function jw(t, i, o) {
        var f = t == null ? 0 : t.length;
        if (!f)
          return -1;
        var h = o == null ? 0 : nt(o);
        return h < 0 && (h = $t(f + h, 0)), hr(t, i, h);
      }
      function t0(t) {
        var i = t == null ? 0 : t.length;
        return i ? De(t, 0, -1) : [];
      }
      var e0 = it(function(t) {
        var i = At(t, Yo);
        return i.length && i[0] === t[0] ? Fo(i) : [];
      }), n0 = it(function(t) {
        var i = Fe(t), o = At(t, Yo);
        return i === Fe(o) ? i = r : o.pop(), o.length && o[0] === t[0] ? Fo(o, Y(i, 2)) : [];
      }), r0 = it(function(t) {
        var i = Fe(t), o = At(t, Yo);
        return i = typeof i == "function" ? i : r, i && o.pop(), o.length && o[0] === t[0] ? Fo(o, r, i) : [];
      });
      function i0(t, i) {
        return t == null ? "" : tg.call(t, i);
      }
      function Fe(t) {
        var i = t == null ? 0 : t.length;
        return i ? t[i - 1] : r;
      }
      function s0(t, i, o) {
        var f = t == null ? 0 : t.length;
        if (!f)
          return -1;
        var h = f;
        return o !== r && (h = nt(o), h = h < 0 ? $t(f + h, 0) : Xt(h, f - 1)), i === i ? Fp(t, i, h) : Ri(t, hc, h, !0);
      }
      function o0(t, i) {
        return t && t.length ? qc(t, nt(i)) : r;
      }
      var u0 = it(kf);
      function kf(t, i) {
        return t && t.length && i && i.length ? Ho(t, i) : t;
      }
      function a0(t, i, o) {
        return t && t.length && i && i.length ? Ho(t, i, Y(o, 2)) : t;
      }
      function c0(t, i, o) {
        return t && t.length && i && i.length ? Ho(t, i, r, o) : t;
      }
      var f0 = fn(function(t, i) {
        var o = t == null ? 0 : t.length, f = ko(t, i);
        return Vc(t, At(i, function(h) {
          return ln(h, o) ? +h : h;
        }).sort(nf)), f;
      });
      function l0(t, i) {
        var o = [];
        if (!(t && t.length))
          return o;
        var f = -1, h = [], w = t.length;
        for (i = Y(i, 3); ++f < w; ) {
          var b = t[f];
          i(b, f, t) && (o.push(b), h.push(f));
        }
        return Vc(t, h), o;
      }
      function au(t) {
        return t == null ? t : ig.call(t);
      }
      function h0(t, i, o) {
        var f = t == null ? 0 : t.length;
        return f ? (o && typeof o != "number" && se(t, i, o) ? (i = 0, o = f) : (i = i == null ? 0 : nt(i), o = o === r ? f : nt(o)), De(t, i, o)) : [];
      }
      function d0(t, i) {
        return Zi(t, i);
      }
      function p0(t, i, o) {
        return zo(t, i, Y(o, 2));
      }
      function g0(t, i) {
        var o = t == null ? 0 : t.length;
        if (o) {
          var f = Zi(t, i);
          if (f < o && Ge(t[f], i))
            return f;
        }
        return -1;
      }
      function w0(t, i) {
        return Zi(t, i, !0);
      }
      function y0(t, i, o) {
        return zo(t, i, Y(o, 2), !0);
      }
      function m0(t, i) {
        var o = t == null ? 0 : t.length;
        if (o) {
          var f = Zi(t, i, !0) - 1;
          if (Ge(t[f], i))
            return f;
        }
        return -1;
      }
      function b0(t) {
        return t && t.length ? Yc(t) : [];
      }
      function E0(t, i) {
        return t && t.length ? Yc(t, Y(i, 2)) : [];
      }
      function x0(t) {
        var i = t == null ? 0 : t.length;
        return i ? De(t, 1, i) : [];
      }
      function S0(t, i, o) {
        return t && t.length ? (i = o || i === r ? 1 : nt(i), De(t, 0, i < 0 ? 0 : i)) : [];
      }
      function _0(t, i, o) {
        var f = t == null ? 0 : t.length;
        return f ? (i = o || i === r ? 1 : nt(i), i = f - i, De(t, i < 0 ? 0 : i, f)) : [];
      }
      function A0(t, i) {
        return t && t.length ? Xi(t, Y(i, 3), !1, !0) : [];
      }
      function v0(t, i) {
        return t && t.length ? Xi(t, Y(i, 3)) : [];
      }
      var T0 = it(function(t) {
        return Bn(zt(t, 1, Bt, !0));
      }), I0 = it(function(t) {
        var i = Fe(t);
        return Bt(i) && (i = r), Bn(zt(t, 1, Bt, !0), Y(i, 2));
      }), B0 = it(function(t) {
        var i = Fe(t);
        return i = typeof i == "function" ? i : r, Bn(zt(t, 1, Bt, !0), r, i);
      });
      function R0(t) {
        return t && t.length ? Bn(t) : [];
      }
      function U0(t, i) {
        return t && t.length ? Bn(t, Y(i, 2)) : [];
      }
      function L0(t, i) {
        return i = typeof i == "function" ? i : r, t && t.length ? Bn(t, r, i) : [];
      }
      function cu(t) {
        if (!(t && t.length))
          return [];
        var i = 0;
        return t = _n(t, function(o) {
          if (Bt(o))
            return i = $t(o.length, i), !0;
        }), To(i, function(o) {
          return At(t, _o(o));
        });
      }
      function Of(t, i) {
        if (!(t && t.length))
          return [];
        var o = cu(t);
        return i == null ? o : At(o, function(f) {
          return Se(i, r, f);
        });
      }
      var C0 = it(function(t, i) {
        return Bt(t) ? Qr(t, i) : [];
      }), N0 = it(function(t) {
        return Go(_n(t, Bt));
      }), k0 = it(function(t) {
        var i = Fe(t);
        return Bt(i) && (i = r), Go(_n(t, Bt), Y(i, 2));
      }), O0 = it(function(t) {
        var i = Fe(t);
        return i = typeof i == "function" ? i : r, Go(_n(t, Bt), r, i);
      }), $0 = it(cu);
      function D0(t, i) {
        return Qc(t || [], i || [], Jr);
      }
      function F0(t, i) {
        return Qc(t || [], i || [], ei);
      }
      var P0 = it(function(t) {
        var i = t.length, o = i > 1 ? t[i - 1] : r;
        return o = typeof o == "function" ? (t.pop(), o) : r, Of(t, o);
      });
      function $f(t) {
        var i = p(t);
        return i.__chain__ = !0, i;
      }
      function W0(t, i) {
        return i(t), t;
      }
      function ss(t, i) {
        return i(t);
      }
      var M0 = fn(function(t) {
        var i = t.length, o = i ? t[0] : 0, f = this.__wrapped__, h = function(w) {
          return ko(w, t);
        };
        return i > 1 || this.__actions__.length || !(f instanceof ut) || !ln(o) ? this.thru(h) : (f = f.slice(o, +o + (i ? 1 : 0)), f.__actions__.push({
          func: ss,
          args: [h],
          thisArg: r
        }), new Oe(f, this.__chain__).thru(function(w) {
          return i && !w.length && w.push(r), w;
        }));
      });
      function H0() {
        return $f(this);
      }
      function q0() {
        return new Oe(this.value(), this.__chain__);
      }
      function K0() {
        this.__values__ === r && (this.__values__ = Xf(this.value()));
        var t = this.__index__ >= this.__values__.length, i = t ? r : this.__values__[this.__index__++];
        return { done: t, value: i };
      }
      function z0() {
        return this;
      }
      function V0(t) {
        for (var i, o = this; o instanceof Ki; ) {
          var f = Rf(o);
          f.__index__ = 0, f.__values__ = r, i ? h.__wrapped__ = f : i = f;
          var h = f;
          o = o.__wrapped__;
        }
        return h.__wrapped__ = t, i;
      }
      function G0() {
        var t = this.__wrapped__;
        if (t instanceof ut) {
          var i = t;
          return this.__actions__.length && (i = new ut(this)), i = i.reverse(), i.__actions__.push({
            func: ss,
            args: [au],
            thisArg: r
          }), new Oe(i, this.__chain__);
        }
        return this.thru(au);
      }
      function Y0() {
        return Jc(this.__wrapped__, this.__actions__);
      }
      var Z0 = Ji(function(t, i, o) {
        ht.call(t, o) ? ++t[o] : an(t, o, 1);
      });
      function X0(t, i, o) {
        var f = tt(t) ? fc : Wg;
        return o && se(t, i, o) && (i = r), f(t, Y(i, 3));
      }
      function J0(t, i) {
        var o = tt(t) ? _n : kc;
        return o(t, Y(i, 3));
      }
      var Q0 = cf(Uf), j0 = cf(Lf);
      function ty(t, i) {
        return zt(os(t, i), 1);
      }
      function ey(t, i) {
        return zt(os(t, i), Q);
      }
      function ny(t, i, o) {
        return o = o === r ? 1 : nt(o), zt(os(t, i), o);
      }
      function Df(t, i) {
        var o = tt(t) ? Ne : In;
        return o(t, Y(i, 3));
      }
      function Ff(t, i) {
        var o = tt(t) ? xp : Nc;
        return o(t, Y(i, 3));
      }
      var ry = Ji(function(t, i, o) {
        ht.call(t, o) ? t[o].push(i) : an(t, o, [i]);
      });
      function iy(t, i, o, f) {
        t = le(t) ? t : Ar(t), o = o && !f ? nt(o) : 0;
        var h = t.length;
        return o < 0 && (o = $t(h + o, 0)), ls(t) ? o <= h && t.indexOf(i, o) > -1 : !!h && hr(t, i, o) > -1;
      }
      var sy = it(function(t, i, o) {
        var f = -1, h = typeof i == "function", w = le(t) ? R(t.length) : [];
        return In(t, function(b) {
          w[++f] = h ? Se(i, b, o) : jr(b, i, o);
        }), w;
      }), oy = Ji(function(t, i, o) {
        an(t, o, i);
      });
      function os(t, i) {
        var o = tt(t) ? At : Wc;
        return o(t, Y(i, 3));
      }
      function uy(t, i, o, f) {
        return t == null ? [] : (tt(i) || (i = i == null ? [] : [i]), o = f ? r : o, tt(o) || (o = o == null ? [] : [o]), Kc(t, i, o));
      }
      var ay = Ji(function(t, i, o) {
        t[o ? 0 : 1].push(i);
      }, function() {
        return [[], []];
      });
      function cy(t, i, o) {
        var f = tt(t) ? xo : pc, h = arguments.length < 3;
        return f(t, Y(i, 4), o, h, In);
      }
      function fy(t, i, o) {
        var f = tt(t) ? Sp : pc, h = arguments.length < 3;
        return f(t, Y(i, 4), o, h, Nc);
      }
      function ly(t, i) {
        var o = tt(t) ? _n : kc;
        return o(t, cs(Y(i, 3)));
      }
      function hy(t) {
        var i = tt(t) ? Rc : iw;
        return i(t);
      }
      function dy(t, i, o) {
        (o ? se(t, i, o) : i === r) ? i = 1 : i = nt(i);
        var f = tt(t) ? Og : sw;
        return f(t, i);
      }
      function py(t) {
        var i = tt(t) ? $g : uw;
        return i(t);
      }
      function gy(t) {
        if (t == null)
          return 0;
        if (le(t))
          return ls(t) ? pr(t) : t.length;
        var i = Jt(t);
        return i == ce || i == Ke ? t.size : Wo(t).length;
      }
      function wy(t, i, o) {
        var f = tt(t) ? So : aw;
        return o && se(t, i, o) && (i = r), f(t, Y(i, 3));
      }
      var yy = it(function(t, i) {
        if (t == null)
          return [];
        var o = i.length;
        return o > 1 && se(t, i[0], i[1]) ? i = [] : o > 2 && se(i[0], i[1], i[2]) && (i = [i[0]]), Kc(t, zt(i, 1), []);
      }), us = Jp || function() {
        return Kt.Date.now();
      };
      function my(t, i) {
        if (typeof i != "function")
          throw new ke(c);
        return t = nt(t), function() {
          if (--t < 1)
            return i.apply(this, arguments);
        };
      }
      function Pf(t, i, o) {
        return i = o ? r : i, i = t && i == null ? t.length : i, cn(t, M, r, r, r, r, i);
      }
      function Wf(t, i) {
        var o;
        if (typeof i != "function")
          throw new ke(c);
        return t = nt(t), function() {
          return --t > 0 && (o = i.apply(this, arguments)), t <= 1 && (i = r), o;
        };
      }
      var fu = it(function(t, i, o) {
        var f = x;
        if (o.length) {
          var h = vn(o, Sr(fu));
          f |= D;
        }
        return cn(t, f, i, o, h);
      }), Mf = it(function(t, i, o) {
        var f = x | B;
        if (o.length) {
          var h = vn(o, Sr(Mf));
          f |= D;
        }
        return cn(i, f, t, o, h);
      });
      function Hf(t, i, o) {
        i = o ? r : i;
        var f = cn(t, O, r, r, r, r, r, i);
        return f.placeholder = Hf.placeholder, f;
      }
      function qf(t, i, o) {
        i = o ? r : i;
        var f = cn(t, F, r, r, r, r, r, i);
        return f.placeholder = qf.placeholder, f;
      }
      function Kf(t, i, o) {
        var f, h, w, b, S, I, C = 0, N = !1, $ = !1, P = !0;
        if (typeof t != "function")
          throw new ke(c);
        i = Pe(i) || 0, vt(o) && (N = !!o.leading, $ = "maxWait" in o, w = $ ? $t(Pe(o.maxWait) || 0, i) : w, P = "trailing" in o ? !!o.trailing : P);
        function K(Rt) {
          var Ye = f, pn = h;
          return f = h = r, C = Rt, b = t.apply(pn, Ye), b;
        }
        function Z(Rt) {
          return C = Rt, S = ii(st, i), N ? K(Rt) : b;
        }
        function rt(Rt) {
          var Ye = Rt - I, pn = Rt - C, cl = i - Ye;
          return $ ? Xt(cl, w - pn) : cl;
        }
        function X(Rt) {
          var Ye = Rt - I, pn = Rt - C;
          return I === r || Ye >= i || Ye < 0 || $ && pn >= w;
        }
        function st() {
          var Rt = us();
          if (X(Rt))
            return at(Rt);
          S = ii(st, rt(Rt));
        }
        function at(Rt) {
          return S = r, P && f ? K(Rt) : (f = h = r, b);
        }
        function Te() {
          S !== r && jc(S), C = 0, f = I = h = S = r;
        }
        function oe() {
          return S === r ? b : at(us());
        }
        function Ie() {
          var Rt = us(), Ye = X(Rt);
          if (f = arguments, h = this, I = Rt, Ye) {
            if (S === r)
              return Z(I);
            if ($)
              return jc(S), S = ii(st, i), K(I);
          }
          return S === r && (S = ii(st, i)), b;
        }
        return Ie.cancel = Te, Ie.flush = oe, Ie;
      }
      var by = it(function(t, i) {
        return Cc(t, 1, i);
      }), Ey = it(function(t, i, o) {
        return Cc(t, Pe(i) || 0, o);
      });
      function xy(t) {
        return cn(t, J);
      }
      function as(t, i) {
        if (typeof t != "function" || i != null && typeof i != "function")
          throw new ke(c);
        var o = function() {
          var f = arguments, h = i ? i.apply(this, f) : f[0], w = o.cache;
          if (w.has(h))
            return w.get(h);
          var b = t.apply(this, f);
          return o.cache = w.set(h, b) || w, b;
        };
        return o.cache = new (as.Cache || un)(), o;
      }
      as.Cache = un;
      function cs(t) {
        if (typeof t != "function")
          throw new ke(c);
        return function() {
          var i = arguments;
          switch (i.length) {
            case 0:
              return !t.call(this);
            case 1:
              return !t.call(this, i[0]);
            case 2:
              return !t.call(this, i[0], i[1]);
            case 3:
              return !t.call(this, i[0], i[1], i[2]);
          }
          return !t.apply(this, i);
        };
      }
      function Sy(t) {
        return Wf(2, t);
      }
      var _y = cw(function(t, i) {
        i = i.length == 1 && tt(i[0]) ? At(i[0], _e(Y())) : At(zt(i, 1), _e(Y()));
        var o = i.length;
        return it(function(f) {
          for (var h = -1, w = Xt(f.length, o); ++h < w; )
            f[h] = i[h].call(this, f[h]);
          return Se(t, this, f);
        });
      }), lu = it(function(t, i) {
        var o = vn(i, Sr(lu));
        return cn(t, D, r, i, o);
      }), zf = it(function(t, i) {
        var o = vn(i, Sr(zf));
        return cn(t, W, r, i, o);
      }), Ay = fn(function(t, i) {
        return cn(t, G, r, r, r, i);
      });
      function vy(t, i) {
        if (typeof t != "function")
          throw new ke(c);
        return i = i === r ? i : nt(i), it(t, i);
      }
      function Ty(t, i) {
        if (typeof t != "function")
          throw new ke(c);
        return i = i == null ? 0 : $t(nt(i), 0), it(function(o) {
          var f = o[i], h = Un(o, 0, i);
          return f && An(h, f), Se(t, this, h);
        });
      }
      function Iy(t, i, o) {
        var f = !0, h = !0;
        if (typeof t != "function")
          throw new ke(c);
        return vt(o) && (f = "leading" in o ? !!o.leading : f, h = "trailing" in o ? !!o.trailing : h), Kf(t, i, {
          leading: f,
          maxWait: i,
          trailing: h
        });
      }
      function By(t) {
        return Pf(t, 1);
      }
      function Ry(t, i) {
        return lu(Zo(i), t);
      }
      function Uy() {
        if (!arguments.length)
          return [];
        var t = arguments[0];
        return tt(t) ? t : [t];
      }
      function Ly(t) {
        return $e(t, _);
      }
      function Cy(t, i) {
        return i = typeof i == "function" ? i : r, $e(t, _, i);
      }
      function Ny(t) {
        return $e(t, m | _);
      }
      function ky(t, i) {
        return i = typeof i == "function" ? i : r, $e(t, m | _, i);
      }
      function Oy(t, i) {
        return i == null || Lc(t, i, Pt(i));
      }
      function Ge(t, i) {
        return t === i || t !== t && i !== i;
      }
      var $y = es(Do), Dy = es(function(t, i) {
        return t >= i;
      }), Xn = Dc(/* @__PURE__ */ function() {
        return arguments;
      }()) ? Dc : function(t) {
        return Tt(t) && ht.call(t, "callee") && !_c.call(t, "callee");
      }, tt = R.isArray, Fy = ic ? _e(ic) : Vg;
      function le(t) {
        return t != null && fs(t.length) && !hn(t);
      }
      function Bt(t) {
        return Tt(t) && le(t);
      }
      function Py(t) {
        return t === !0 || t === !1 || Tt(t) && ie(t) == xe;
      }
      var Ln = jp || Su, Wy = sc ? _e(sc) : Gg;
      function My(t) {
        return Tt(t) && t.nodeType === 1 && !si(t);
      }
      function Hy(t) {
        if (t == null)
          return !0;
        if (le(t) && (tt(t) || typeof t == "string" || typeof t.splice == "function" || Ln(t) || _r(t) || Xn(t)))
          return !t.length;
        var i = Jt(t);
        if (i == ce || i == Ke)
          return !t.size;
        if (ri(t))
          return !Wo(t).length;
        for (var o in t)
          if (ht.call(t, o))
            return !1;
        return !0;
      }
      function qy(t, i) {
        return ti(t, i);
      }
      function Ky(t, i, o) {
        o = typeof o == "function" ? o : r;
        var f = o ? o(t, i) : r;
        return f === r ? ti(t, i, r, o) : !!f;
      }
      function hu(t) {
        if (!Tt(t))
          return !1;
        var i = ie(t);
        return i == qe || i == _i || typeof t.message == "string" && typeof t.name == "string" && !si(t);
      }
      function zy(t) {
        return typeof t == "number" && vc(t);
      }
      function hn(t) {
        if (!vt(t))
          return !1;
        var i = ie(t);
        return i == Zt || i == rn || i == Wr || i == gd;
      }
      function Vf(t) {
        return typeof t == "number" && t == nt(t);
      }
      function fs(t) {
        return typeof t == "number" && t > -1 && t % 1 == 0 && t <= ot;
      }
      function vt(t) {
        var i = typeof t;
        return t != null && (i == "object" || i == "function");
      }
      function Tt(t) {
        return t != null && typeof t == "object";
      }
      var Gf = oc ? _e(oc) : Zg;
      function Vy(t, i) {
        return t === i || Po(t, i, nu(i));
      }
      function Gy(t, i, o) {
        return o = typeof o == "function" ? o : r, Po(t, i, nu(i), o);
      }
      function Yy(t) {
        return Yf(t) && t != +t;
      }
      function Zy(t) {
        if (Cw(t))
          throw new j(a);
        return Fc(t);
      }
      function Xy(t) {
        return t === null;
      }
      function Jy(t) {
        return t == null;
      }
      function Yf(t) {
        return typeof t == "number" || Tt(t) && ie(t) == Sn;
      }
      function si(t) {
        if (!Tt(t) || ie(t) != sn)
          return !1;
        var i = Di(t);
        if (i === null)
          return !0;
        var o = ht.call(i, "constructor") && i.constructor;
        return typeof o == "function" && o instanceof o && Ni.call(o) == Gp;
      }
      var du = uc ? _e(uc) : Xg;
      function Qy(t) {
        return Vf(t) && t >= -ot && t <= ot;
      }
      var Zf = ac ? _e(ac) : Jg;
      function ls(t) {
        return typeof t == "string" || !tt(t) && Tt(t) && ie(t) == Hr;
      }
      function ve(t) {
        return typeof t == "symbol" || Tt(t) && ie(t) == Ai;
      }
      var _r = cc ? _e(cc) : Qg;
      function jy(t) {
        return t === r;
      }
      function tm(t) {
        return Tt(t) && Jt(t) == qr;
      }
      function em(t) {
        return Tt(t) && ie(t) == yd;
      }
      var nm = es(Mo), rm = es(function(t, i) {
        return t <= i;
      });
      function Xf(t) {
        if (!t)
          return [];
        if (le(t))
          return ls(t) ? ze(t) : fe(t);
        if (Vr && t[Vr])
          return Op(t[Vr]());
        var i = Jt(t), o = i == ce ? Bo : i == Ke ? Ui : Ar;
        return o(t);
      }
      function dn(t) {
        if (!t)
          return t === 0 ? t : 0;
        if (t = Pe(t), t === Q || t === -Q) {
          var i = t < 0 ? -1 : 1;
          return i * Nt;
        }
        return t === t ? t : 0;
      }
      function nt(t) {
        var i = dn(t), o = i % 1;
        return i === i ? o ? i - o : i : 0;
      }
      function Jf(t) {
        return t ? Vn(nt(t), 0, Et) : 0;
      }
      function Pe(t) {
        if (typeof t == "number")
          return t;
        if (ve(t))
          return kt;
        if (vt(t)) {
          var i = typeof t.valueOf == "function" ? t.valueOf() : t;
          t = vt(i) ? i + "" : i;
        }
        if (typeof t != "string")
          return t === 0 ? t : +t;
        t = gc(t);
        var o = Fd.test(t);
        return o || Wd.test(t) ? mp(t.slice(2), o ? 2 : 8) : Dd.test(t) ? kt : +t;
      }
      function Qf(t) {
        return je(t, he(t));
      }
      function im(t) {
        return t ? Vn(nt(t), -ot, ot) : t === 0 ? t : 0;
      }
      function lt(t) {
        return t == null ? "" : Ae(t);
      }
      var sm = Er(function(t, i) {
        if (ri(i) || le(i)) {
          je(i, Pt(i), t);
          return;
        }
        for (var o in i)
          ht.call(i, o) && Jr(t, o, i[o]);
      }), jf = Er(function(t, i) {
        je(i, he(i), t);
      }), hs = Er(function(t, i, o, f) {
        je(i, he(i), t, f);
      }), om = Er(function(t, i, o, f) {
        je(i, Pt(i), t, f);
      }), um = fn(ko);
      function am(t, i) {
        var o = br(t);
        return i == null ? o : Uc(o, i);
      }
      var cm = it(function(t, i) {
        t = pt(t);
        var o = -1, f = i.length, h = f > 2 ? i[2] : r;
        for (h && se(i[0], i[1], h) && (f = 1); ++o < f; )
          for (var w = i[o], b = he(w), S = -1, I = b.length; ++S < I; ) {
            var C = b[S], N = t[C];
            (N === r || Ge(N, wr[C]) && !ht.call(t, C)) && (t[C] = w[C]);
          }
        return t;
      }), fm = it(function(t) {
        return t.push(r, wf), Se(tl, r, t);
      });
      function lm(t, i) {
        return lc(t, Y(i, 3), Qe);
      }
      function hm(t, i) {
        return lc(t, Y(i, 3), $o);
      }
      function dm(t, i) {
        return t == null ? t : Oo(t, Y(i, 3), he);
      }
      function pm(t, i) {
        return t == null ? t : Oc(t, Y(i, 3), he);
      }
      function gm(t, i) {
        return t && Qe(t, Y(i, 3));
      }
      function wm(t, i) {
        return t && $o(t, Y(i, 3));
      }
      function ym(t) {
        return t == null ? [] : Gi(t, Pt(t));
      }
      function mm(t) {
        return t == null ? [] : Gi(t, he(t));
      }
      function pu(t, i, o) {
        var f = t == null ? r : Gn(t, i);
        return f === r ? o : f;
      }
      function bm(t, i) {
        return t != null && bf(t, i, Hg);
      }
      function gu(t, i) {
        return t != null && bf(t, i, qg);
      }
      var Em = lf(function(t, i, o) {
        i != null && typeof i.toString != "function" && (i = ki.call(i)), t[i] = o;
      }, yu(de)), xm = lf(function(t, i, o) {
        i != null && typeof i.toString != "function" && (i = ki.call(i)), ht.call(t, i) ? t[i].push(o) : t[i] = [o];
      }, Y), Sm = it(jr);
      function Pt(t) {
        return le(t) ? Bc(t) : Wo(t);
      }
      function he(t) {
        return le(t) ? Bc(t, !0) : jg(t);
      }
      function _m(t, i) {
        var o = {};
        return i = Y(i, 3), Qe(t, function(f, h, w) {
          an(o, i(f, h, w), f);
        }), o;
      }
      function Am(t, i) {
        var o = {};
        return i = Y(i, 3), Qe(t, function(f, h, w) {
          an(o, h, i(f, h, w));
        }), o;
      }
      var vm = Er(function(t, i, o) {
        Yi(t, i, o);
      }), tl = Er(function(t, i, o, f) {
        Yi(t, i, o, f);
      }), Tm = fn(function(t, i) {
        var o = {};
        if (t == null)
          return o;
        var f = !1;
        i = At(i, function(w) {
          return w = Rn(w, t), f || (f = w.length > 1), w;
        }), je(t, tu(t), o), f && (o = $e(o, m | E | _, Ew));
        for (var h = i.length; h--; )
          Vo(o, i[h]);
        return o;
      });
      function Im(t, i) {
        return el(t, cs(Y(i)));
      }
      var Bm = fn(function(t, i) {
        return t == null ? {} : ew(t, i);
      });
      function el(t, i) {
        if (t == null)
          return {};
        var o = At(tu(t), function(f) {
          return [f];
        });
        return i = Y(i), zc(t, o, function(f, h) {
          return i(f, h[0]);
        });
      }
      function Rm(t, i, o) {
        i = Rn(i, t);
        var f = -1, h = i.length;
        for (h || (h = 1, t = r); ++f < h; ) {
          var w = t == null ? r : t[tn(i[f])];
          w === r && (f = h, w = o), t = hn(w) ? w.call(t) : w;
        }
        return t;
      }
      function Um(t, i, o) {
        return t == null ? t : ei(t, i, o);
      }
      function Lm(t, i, o, f) {
        return f = typeof f == "function" ? f : r, t == null ? t : ei(t, i, o, f);
      }
      var nl = pf(Pt), rl = pf(he);
      function Cm(t, i, o) {
        var f = tt(t), h = f || Ln(t) || _r(t);
        if (i = Y(i, 4), o == null) {
          var w = t && t.constructor;
          h ? o = f ? new w() : [] : vt(t) ? o = hn(w) ? br(Di(t)) : {} : o = {};
        }
        return (h ? Ne : Qe)(t, function(b, S, I) {
          return i(o, b, S, I);
        }), o;
      }
      function Nm(t, i) {
        return t == null ? !0 : Vo(t, i);
      }
      function km(t, i, o) {
        return t == null ? t : Xc(t, i, Zo(o));
      }
      function Om(t, i, o, f) {
        return f = typeof f == "function" ? f : r, t == null ? t : Xc(t, i, Zo(o), f);
      }
      function Ar(t) {
        return t == null ? [] : Io(t, Pt(t));
      }
      function $m(t) {
        return t == null ? [] : Io(t, he(t));
      }
      function Dm(t, i, o) {
        return o === r && (o = i, i = r), o !== r && (o = Pe(o), o = o === o ? o : 0), i !== r && (i = Pe(i), i = i === i ? i : 0), Vn(Pe(t), i, o);
      }
      function Fm(t, i, o) {
        return i = dn(i), o === r ? (o = i, i = 0) : o = dn(o), t = Pe(t), Kg(t, i, o);
      }
      function Pm(t, i, o) {
        if (o && typeof o != "boolean" && se(t, i, o) && (i = o = r), o === r && (typeof i == "boolean" ? (o = i, i = r) : typeof t == "boolean" && (o = t, t = r)), t === r && i === r ? (t = 0, i = 1) : (t = dn(t), i === r ? (i = t, t = 0) : i = dn(i)), t > i) {
          var f = t;
          t = i, i = f;
        }
        if (o || t % 1 || i % 1) {
          var h = Tc();
          return Xt(t + h * (i - t + yp("1e-" + ((h + "").length - 1))), i);
        }
        return qo(t, i);
      }
      var Wm = xr(function(t, i, o) {
        return i = i.toLowerCase(), t + (o ? il(i) : i);
      });
      function il(t) {
        return wu(lt(t).toLowerCase());
      }
      function sl(t) {
        return t = lt(t), t && t.replace(Hd, Up).replace(up, "");
      }
      function Mm(t, i, o) {
        t = lt(t), i = Ae(i);
        var f = t.length;
        o = o === r ? f : Vn(nt(o), 0, f);
        var h = o;
        return o -= i.length, o >= 0 && t.slice(o, h) == i;
      }
      function Hm(t) {
        return t = lt(t), t && Sd.test(t) ? t.replace(Oa, Lp) : t;
      }
      function qm(t) {
        return t = lt(t), t && Bd.test(t) ? t.replace(fo, "\\$&") : t;
      }
      var Km = xr(function(t, i, o) {
        return t + (o ? "-" : "") + i.toLowerCase();
      }), zm = xr(function(t, i, o) {
        return t + (o ? " " : "") + i.toLowerCase();
      }), Vm = af("toLowerCase");
      function Gm(t, i, o) {
        t = lt(t), i = nt(i);
        var f = i ? pr(t) : 0;
        if (!i || f >= i)
          return t;
        var h = (i - f) / 2;
        return ts(Mi(h), o) + t + ts(Wi(h), o);
      }
      function Ym(t, i, o) {
        t = lt(t), i = nt(i);
        var f = i ? pr(t) : 0;
        return i && f < i ? t + ts(i - f, o) : t;
      }
      function Zm(t, i, o) {
        t = lt(t), i = nt(i);
        var f = i ? pr(t) : 0;
        return i && f < i ? ts(i - f, o) + t : t;
      }
      function Xm(t, i, o) {
        return o || i == null ? i = 0 : i && (i = +i), rg(lt(t).replace(lo, ""), i || 0);
      }
      function Jm(t, i, o) {
        return (o ? se(t, i, o) : i === r) ? i = 1 : i = nt(i), Ko(lt(t), i);
      }
      function Qm() {
        var t = arguments, i = lt(t[0]);
        return t.length < 3 ? i : i.replace(t[1], t[2]);
      }
      var jm = xr(function(t, i, o) {
        return t + (o ? "_" : "") + i.toLowerCase();
      });
      function t1(t, i, o) {
        return o && typeof o != "number" && se(t, i, o) && (i = o = r), o = o === r ? Et : o >>> 0, o ? (t = lt(t), t && (typeof i == "string" || i != null && !du(i)) && (i = Ae(i), !i && dr(t)) ? Un(ze(t), 0, o) : t.split(i, o)) : [];
      }
      var e1 = xr(function(t, i, o) {
        return t + (o ? " " : "") + wu(i);
      });
      function n1(t, i, o) {
        return t = lt(t), o = o == null ? 0 : Vn(nt(o), 0, t.length), i = Ae(i), t.slice(o, o + i.length) == i;
      }
      function r1(t, i, o) {
        var f = p.templateSettings;
        o && se(t, i, o) && (i = r), t = lt(t), i = hs({}, i, f, gf);
        var h = hs({}, i.imports, f.imports, gf), w = Pt(h), b = Io(h, w), S, I, C = 0, N = i.interpolate || vi, $ = "__p += '", P = Ro(
          (i.escape || vi).source + "|" + N.source + "|" + (N === $a ? $d : vi).source + "|" + (i.evaluate || vi).source + "|$",
          "g"
        ), K = "//# sourceURL=" + (ht.call(i, "sourceURL") ? (i.sourceURL + "").replace(/\s/g, " ") : "lodash.templateSources[" + ++hp + "]") + `
`;
        t.replace(P, function(X, st, at, Te, oe, Ie) {
          return at || (at = Te), $ += t.slice(C, Ie).replace(qd, Cp), st && (S = !0, $ += `' +
__e(` + st + `) +
'`), oe && (I = !0, $ += `';
` + oe + `;
__p += '`), at && ($ += `' +
((__t = (` + at + `)) == null ? '' : __t) +
'`), C = Ie + X.length, X;
        }), $ += `';
`;
        var Z = ht.call(i, "variable") && i.variable;
        if (!Z)
          $ = `with (obj) {
` + $ + `
}
`;
        else if (kd.test(Z))
          throw new j(l);
        $ = (I ? $.replace(md, "") : $).replace(bd, "$1").replace(Ed, "$1;"), $ = "function(" + (Z || "obj") + `) {
` + (Z ? "" : `obj || (obj = {});
`) + "var __t, __p = ''" + (S ? ", __e = _.escape" : "") + (I ? `, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
` : `;
`) + $ + `return __p
}`;
        var rt = ul(function() {
          return ct(w, K + "return " + $).apply(r, b);
        });
        if (rt.source = $, hu(rt))
          throw rt;
        return rt;
      }
      function i1(t) {
        return lt(t).toLowerCase();
      }
      function s1(t) {
        return lt(t).toUpperCase();
      }
      function o1(t, i, o) {
        if (t = lt(t), t && (o || i === r))
          return gc(t);
        if (!t || !(i = Ae(i)))
          return t;
        var f = ze(t), h = ze(i), w = wc(f, h), b = yc(f, h) + 1;
        return Un(f, w, b).join("");
      }
      function u1(t, i, o) {
        if (t = lt(t), t && (o || i === r))
          return t.slice(0, bc(t) + 1);
        if (!t || !(i = Ae(i)))
          return t;
        var f = ze(t), h = yc(f, ze(i)) + 1;
        return Un(f, 0, h).join("");
      }
      function a1(t, i, o) {
        if (t = lt(t), t && (o || i === r))
          return t.replace(lo, "");
        if (!t || !(i = Ae(i)))
          return t;
        var f = ze(t), h = wc(f, ze(i));
        return Un(f, h).join("");
      }
      function c1(t, i) {
        var o = ae, f = yt;
        if (vt(i)) {
          var h = "separator" in i ? i.separator : h;
          o = "length" in i ? nt(i.length) : o, f = "omission" in i ? Ae(i.omission) : f;
        }
        t = lt(t);
        var w = t.length;
        if (dr(t)) {
          var b = ze(t);
          w = b.length;
        }
        if (o >= w)
          return t;
        var S = o - pr(f);
        if (S < 1)
          return f;
        var I = b ? Un(b, 0, S).join("") : t.slice(0, S);
        if (h === r)
          return I + f;
        if (b && (S += I.length - S), du(h)) {
          if (t.slice(S).search(h)) {
            var C, N = I;
            for (h.global || (h = Ro(h.source, lt(Da.exec(h)) + "g")), h.lastIndex = 0; C = h.exec(N); )
              var $ = C.index;
            I = I.slice(0, $ === r ? S : $);
          }
        } else if (t.indexOf(Ae(h), S) != S) {
          var P = I.lastIndexOf(h);
          P > -1 && (I = I.slice(0, P));
        }
        return I + f;
      }
      function f1(t) {
        return t = lt(t), t && xd.test(t) ? t.replace(ka, Pp) : t;
      }
      var l1 = xr(function(t, i, o) {
        return t + (o ? " " : "") + i.toUpperCase();
      }), wu = af("toUpperCase");
      function ol(t, i, o) {
        return t = lt(t), i = o ? r : i, i === r ? kp(t) ? Hp(t) : vp(t) : t.match(i) || [];
      }
      var ul = it(function(t, i) {
        try {
          return Se(t, r, i);
        } catch (o) {
          return hu(o) ? o : new j(o);
        }
      }), h1 = fn(function(t, i) {
        return Ne(i, function(o) {
          o = tn(o), an(t, o, fu(t[o], t));
        }), t;
      });
      function d1(t) {
        var i = t == null ? 0 : t.length, o = Y();
        return t = i ? At(t, function(f) {
          if (typeof f[1] != "function")
            throw new ke(c);
          return [o(f[0]), f[1]];
        }) : [], it(function(f) {
          for (var h = -1; ++h < i; ) {
            var w = t[h];
            if (Se(w[0], this, f))
              return Se(w[1], this, f);
          }
        });
      }
      function p1(t) {
        return Pg($e(t, m));
      }
      function yu(t) {
        return function() {
          return t;
        };
      }
      function g1(t, i) {
        return t == null || t !== t ? i : t;
      }
      var w1 = ff(), y1 = ff(!0);
      function de(t) {
        return t;
      }
      function mu(t) {
        return Pc(typeof t == "function" ? t : $e(t, m));
      }
      function m1(t) {
        return Mc($e(t, m));
      }
      function b1(t, i) {
        return Hc(t, $e(i, m));
      }
      var E1 = it(function(t, i) {
        return function(o) {
          return jr(o, t, i);
        };
      }), x1 = it(function(t, i) {
        return function(o) {
          return jr(t, o, i);
        };
      });
      function bu(t, i, o) {
        var f = Pt(i), h = Gi(i, f);
        o == null && !(vt(i) && (h.length || !f.length)) && (o = i, i = t, t = this, h = Gi(i, Pt(i)));
        var w = !(vt(o) && "chain" in o) || !!o.chain, b = hn(t);
        return Ne(h, function(S) {
          var I = i[S];
          t[S] = I, b && (t.prototype[S] = function() {
            var C = this.__chain__;
            if (w || C) {
              var N = t(this.__wrapped__), $ = N.__actions__ = fe(this.__actions__);
              return $.push({ func: I, args: arguments, thisArg: t }), N.__chain__ = C, N;
            }
            return I.apply(t, An([this.value()], arguments));
          });
        }), t;
      }
      function S1() {
        return Kt._ === this && (Kt._ = Yp), this;
      }
      function Eu() {
      }
      function _1(t) {
        return t = nt(t), it(function(i) {
          return qc(i, t);
        });
      }
      var A1 = Jo(At), v1 = Jo(fc), T1 = Jo(So);
      function al(t) {
        return iu(t) ? _o(tn(t)) : nw(t);
      }
      function I1(t) {
        return function(i) {
          return t == null ? r : Gn(t, i);
        };
      }
      var B1 = hf(), R1 = hf(!0);
      function xu() {
        return [];
      }
      function Su() {
        return !1;
      }
      function U1() {
        return {};
      }
      function L1() {
        return "";
      }
      function C1() {
        return !0;
      }
      function N1(t, i) {
        if (t = nt(t), t < 1 || t > ot)
          return [];
        var o = Et, f = Xt(t, Et);
        i = Y(i), t -= Et;
        for (var h = To(f, i); ++o < t; )
          i(o);
        return h;
      }
      function k1(t) {
        return tt(t) ? At(t, tn) : ve(t) ? [t] : fe(Bf(lt(t)));
      }
      function O1(t) {
        var i = ++Vp;
        return lt(t) + i;
      }
      var $1 = ji(function(t, i) {
        return t + i;
      }, 0), D1 = Qo("ceil"), F1 = ji(function(t, i) {
        return t / i;
      }, 1), P1 = Qo("floor");
      function W1(t) {
        return t && t.length ? Vi(t, de, Do) : r;
      }
      function M1(t, i) {
        return t && t.length ? Vi(t, Y(i, 2), Do) : r;
      }
      function H1(t) {
        return dc(t, de);
      }
      function q1(t, i) {
        return dc(t, Y(i, 2));
      }
      function K1(t) {
        return t && t.length ? Vi(t, de, Mo) : r;
      }
      function z1(t, i) {
        return t && t.length ? Vi(t, Y(i, 2), Mo) : r;
      }
      var V1 = ji(function(t, i) {
        return t * i;
      }, 1), G1 = Qo("round"), Y1 = ji(function(t, i) {
        return t - i;
      }, 0);
      function Z1(t) {
        return t && t.length ? vo(t, de) : 0;
      }
      function X1(t, i) {
        return t && t.length ? vo(t, Y(i, 2)) : 0;
      }
      return p.after = my, p.ary = Pf, p.assign = sm, p.assignIn = jf, p.assignInWith = hs, p.assignWith = om, p.at = um, p.before = Wf, p.bind = fu, p.bindAll = h1, p.bindKey = Mf, p.castArray = Uy, p.chain = $f, p.chunk = Pw, p.compact = Ww, p.concat = Mw, p.cond = d1, p.conforms = p1, p.constant = yu, p.countBy = Z0, p.create = am, p.curry = Hf, p.curryRight = qf, p.debounce = Kf, p.defaults = cm, p.defaultsDeep = fm, p.defer = by, p.delay = Ey, p.difference = Hw, p.differenceBy = qw, p.differenceWith = Kw, p.drop = zw, p.dropRight = Vw, p.dropRightWhile = Gw, p.dropWhile = Yw, p.fill = Zw, p.filter = J0, p.flatMap = ty, p.flatMapDeep = ey, p.flatMapDepth = ny, p.flatten = Cf, p.flattenDeep = Xw, p.flattenDepth = Jw, p.flip = xy, p.flow = w1, p.flowRight = y1, p.fromPairs = Qw, p.functions = ym, p.functionsIn = mm, p.groupBy = ry, p.initial = t0, p.intersection = e0, p.intersectionBy = n0, p.intersectionWith = r0, p.invert = Em, p.invertBy = xm, p.invokeMap = sy, p.iteratee = mu, p.keyBy = oy, p.keys = Pt, p.keysIn = he, p.map = os, p.mapKeys = _m, p.mapValues = Am, p.matches = m1, p.matchesProperty = b1, p.memoize = as, p.merge = vm, p.mergeWith = tl, p.method = E1, p.methodOf = x1, p.mixin = bu, p.negate = cs, p.nthArg = _1, p.omit = Tm, p.omitBy = Im, p.once = Sy, p.orderBy = uy, p.over = A1, p.overArgs = _y, p.overEvery = v1, p.overSome = T1, p.partial = lu, p.partialRight = zf, p.partition = ay, p.pick = Bm, p.pickBy = el, p.property = al, p.propertyOf = I1, p.pull = u0, p.pullAll = kf, p.pullAllBy = a0, p.pullAllWith = c0, p.pullAt = f0, p.range = B1, p.rangeRight = R1, p.rearg = Ay, p.reject = ly, p.remove = l0, p.rest = vy, p.reverse = au, p.sampleSize = dy, p.set = Um, p.setWith = Lm, p.shuffle = py, p.slice = h0, p.sortBy = yy, p.sortedUniq = b0, p.sortedUniqBy = E0, p.split = t1, p.spread = Ty, p.tail = x0, p.take = S0, p.takeRight = _0, p.takeRightWhile = A0, p.takeWhile = v0, p.tap = W0, p.throttle = Iy, p.thru = ss, p.toArray = Xf, p.toPairs = nl, p.toPairsIn = rl, p.toPath = k1, p.toPlainObject = Qf, p.transform = Cm, p.unary = By, p.union = T0, p.unionBy = I0, p.unionWith = B0, p.uniq = R0, p.uniqBy = U0, p.uniqWith = L0, p.unset = Nm, p.unzip = cu, p.unzipWith = Of, p.update = km, p.updateWith = Om, p.values = Ar, p.valuesIn = $m, p.without = C0, p.words = ol, p.wrap = Ry, p.xor = N0, p.xorBy = k0, p.xorWith = O0, p.zip = $0, p.zipObject = D0, p.zipObjectDeep = F0, p.zipWith = P0, p.entries = nl, p.entriesIn = rl, p.extend = jf, p.extendWith = hs, bu(p, p), p.add = $1, p.attempt = ul, p.camelCase = Wm, p.capitalize = il, p.ceil = D1, p.clamp = Dm, p.clone = Ly, p.cloneDeep = Ny, p.cloneDeepWith = ky, p.cloneWith = Cy, p.conformsTo = Oy, p.deburr = sl, p.defaultTo = g1, p.divide = F1, p.endsWith = Mm, p.eq = Ge, p.escape = Hm, p.escapeRegExp = qm, p.every = X0, p.find = Q0, p.findIndex = Uf, p.findKey = lm, p.findLast = j0, p.findLastIndex = Lf, p.findLastKey = hm, p.floor = P1, p.forEach = Df, p.forEachRight = Ff, p.forIn = dm, p.forInRight = pm, p.forOwn = gm, p.forOwnRight = wm, p.get = pu, p.gt = $y, p.gte = Dy, p.has = bm, p.hasIn = gu, p.head = Nf, p.identity = de, p.includes = iy, p.indexOf = jw, p.inRange = Fm, p.invoke = Sm, p.isArguments = Xn, p.isArray = tt, p.isArrayBuffer = Fy, p.isArrayLike = le, p.isArrayLikeObject = Bt, p.isBoolean = Py, p.isBuffer = Ln, p.isDate = Wy, p.isElement = My, p.isEmpty = Hy, p.isEqual = qy, p.isEqualWith = Ky, p.isError = hu, p.isFinite = zy, p.isFunction = hn, p.isInteger = Vf, p.isLength = fs, p.isMap = Gf, p.isMatch = Vy, p.isMatchWith = Gy, p.isNaN = Yy, p.isNative = Zy, p.isNil = Jy, p.isNull = Xy, p.isNumber = Yf, p.isObject = vt, p.isObjectLike = Tt, p.isPlainObject = si, p.isRegExp = du, p.isSafeInteger = Qy, p.isSet = Zf, p.isString = ls, p.isSymbol = ve, p.isTypedArray = _r, p.isUndefined = jy, p.isWeakMap = tm, p.isWeakSet = em, p.join = i0, p.kebabCase = Km, p.last = Fe, p.lastIndexOf = s0, p.lowerCase = zm, p.lowerFirst = Vm, p.lt = nm, p.lte = rm, p.max = W1, p.maxBy = M1, p.mean = H1, p.meanBy = q1, p.min = K1, p.minBy = z1, p.stubArray = xu, p.stubFalse = Su, p.stubObject = U1, p.stubString = L1, p.stubTrue = C1, p.multiply = V1, p.nth = o0, p.noConflict = S1, p.noop = Eu, p.now = us, p.pad = Gm, p.padEnd = Ym, p.padStart = Zm, p.parseInt = Xm, p.random = Pm, p.reduce = cy, p.reduceRight = fy, p.repeat = Jm, p.replace = Qm, p.result = Rm, p.round = G1, p.runInContext = v, p.sample = hy, p.size = gy, p.snakeCase = jm, p.some = wy, p.sortedIndex = d0, p.sortedIndexBy = p0, p.sortedIndexOf = g0, p.sortedLastIndex = w0, p.sortedLastIndexBy = y0, p.sortedLastIndexOf = m0, p.startCase = e1, p.startsWith = n1, p.subtract = Y1, p.sum = Z1, p.sumBy = X1, p.template = r1, p.times = N1, p.toFinite = dn, p.toInteger = nt, p.toLength = Jf, p.toLower = i1, p.toNumber = Pe, p.toSafeInteger = im, p.toString = lt, p.toUpper = s1, p.trim = o1, p.trimEnd = u1, p.trimStart = a1, p.truncate = c1, p.unescape = f1, p.uniqueId = O1, p.upperCase = l1, p.upperFirst = wu, p.each = Df, p.eachRight = Ff, p.first = Nf, bu(p, function() {
        var t = {};
        return Qe(p, function(i, o) {
          ht.call(p.prototype, o) || (t[o] = i);
        }), t;
      }(), { chain: !1 }), p.VERSION = s, Ne(["bind", "bindKey", "curry", "curryRight", "partial", "partialRight"], function(t) {
        p[t].placeholder = p;
      }), Ne(["drop", "take"], function(t, i) {
        ut.prototype[t] = function(o) {
          o = o === r ? 1 : $t(nt(o), 0);
          var f = this.__filtered__ && !i ? new ut(this) : this.clone();
          return f.__filtered__ ? f.__takeCount__ = Xt(o, f.__takeCount__) : f.__views__.push({
            size: Xt(o, Et),
            type: t + (f.__dir__ < 0 ? "Right" : "")
          }), f;
        }, ut.prototype[t + "Right"] = function(o) {
          return this.reverse()[t](o).reverse();
        };
      }), Ne(["filter", "map", "takeWhile"], function(t, i) {
        var o = i + 1, f = o == H || o == V;
        ut.prototype[t] = function(h) {
          var w = this.clone();
          return w.__iteratees__.push({
            iteratee: Y(h, 3),
            type: o
          }), w.__filtered__ = w.__filtered__ || f, w;
        };
      }), Ne(["head", "last"], function(t, i) {
        var o = "take" + (i ? "Right" : "");
        ut.prototype[t] = function() {
          return this[o](1).value()[0];
        };
      }), Ne(["initial", "tail"], function(t, i) {
        var o = "drop" + (i ? "" : "Right");
        ut.prototype[t] = function() {
          return this.__filtered__ ? new ut(this) : this[o](1);
        };
      }), ut.prototype.compact = function() {
        return this.filter(de);
      }, ut.prototype.find = function(t) {
        return this.filter(t).head();
      }, ut.prototype.findLast = function(t) {
        return this.reverse().find(t);
      }, ut.prototype.invokeMap = it(function(t, i) {
        return typeof t == "function" ? new ut(this) : this.map(function(o) {
          return jr(o, t, i);
        });
      }), ut.prototype.reject = function(t) {
        return this.filter(cs(Y(t)));
      }, ut.prototype.slice = function(t, i) {
        t = nt(t);
        var o = this;
        return o.__filtered__ && (t > 0 || i < 0) ? new ut(o) : (t < 0 ? o = o.takeRight(-t) : t && (o = o.drop(t)), i !== r && (i = nt(i), o = i < 0 ? o.dropRight(-i) : o.take(i - t)), o);
      }, ut.prototype.takeRightWhile = function(t) {
        return this.reverse().takeWhile(t).reverse();
      }, ut.prototype.toArray = function() {
        return this.take(Et);
      }, Qe(ut.prototype, function(t, i) {
        var o = /^(?:filter|find|map|reject)|While$/.test(i), f = /^(?:head|last)$/.test(i), h = p[f ? "take" + (i == "last" ? "Right" : "") : i], w = f || /^find/.test(i);
        h && (p.prototype[i] = function() {
          var b = this.__wrapped__, S = f ? [1] : arguments, I = b instanceof ut, C = S[0], N = I || tt(b), $ = function(st) {
            var at = h.apply(p, An([st], S));
            return f && P ? at[0] : at;
          };
          N && o && typeof C == "function" && C.length != 1 && (I = N = !1);
          var P = this.__chain__, K = !!this.__actions__.length, Z = w && !P, rt = I && !K;
          if (!w && N) {
            b = rt ? b : new ut(this);
            var X = t.apply(b, S);
            return X.__actions__.push({ func: ss, args: [$], thisArg: r }), new Oe(X, P);
          }
          return Z && rt ? t.apply(this, S) : (X = this.thru($), Z ? f ? X.value()[0] : X.value() : X);
        });
      }), Ne(["pop", "push", "shift", "sort", "splice", "unshift"], function(t) {
        var i = Li[t], o = /^(?:push|sort|unshift)$/.test(t) ? "tap" : "thru", f = /^(?:pop|shift)$/.test(t);
        p.prototype[t] = function() {
          var h = arguments;
          if (f && !this.__chain__) {
            var w = this.value();
            return i.apply(tt(w) ? w : [], h);
          }
          return this[o](function(b) {
            return i.apply(tt(b) ? b : [], h);
          });
        };
      }), Qe(ut.prototype, function(t, i) {
        var o = p[i];
        if (o) {
          var f = o.name + "";
          ht.call(mr, f) || (mr[f] = []), mr[f].push({ name: i, func: o });
        }
      }), mr[Qi(r, B).name] = [{
        name: "wrapper",
        func: r
      }], ut.prototype.clone = fg, ut.prototype.reverse = lg, ut.prototype.value = hg, p.prototype.at = M0, p.prototype.chain = H0, p.prototype.commit = q0, p.prototype.next = K0, p.prototype.plant = V0, p.prototype.reverse = G0, p.prototype.toJSON = p.prototype.valueOf = p.prototype.value = Y0, p.prototype.first = p.prototype.head, Vr && (p.prototype[Vr] = z0), p;
    }, gr = qp();
    Hn ? ((Hn.exports = gr)._ = gr, mo._ = gr) : Kt._ = gr;
  }).call(ci);
})($s, $s.exports);
var oa = $s.exports;
class $S {
  constructor(n, r, s) {
    Wt(this, "inputs", []);
    Wt(this, "outputs", []);
    this.bitcoinRpc = n, this.mempoolService = r, this.utxoManager = s;
  }
  async addInput(n, r, s) {
    const u = await this.buildInputData(n, r, s), { address: a } = r;
    this.inputs.push({ address: a, data: u });
  }
  addOutput(n, r) {
    this.outputs.push({ address: n, amount: r });
  }
  async addPayment(n, r, s, u, a) {
    const { address: c } = r;
    let l = u ?? await this.mempoolService.getRecommendedFee(s);
    const d = new OS(this.outputs, l, c);
    let g = null;
    const y = this.inputs.map(
      (E) => E.data
    ), m = oa.orderBy(n, ["amount"], ["desc"]);
    for (const E of m) {
      if (this.utxoManager.inDummyRange(E) || await this.utxoManager.utxoHaveAssets(E, a))
        continue;
      const _ = await this.buildInputData(
        E,
        r,
        jt.ALL
      );
      if (y.push(_), g = d.compute(y), g)
        break;
    }
    if (!g)
      throw new Error("Not enough BTC to fund the transaction");
    for (let E = this.inputs.length; E < g.inputs.length; E++) {
      const _ = g.inputs[E];
      this.inputs.push({ address: c, data: _ });
    }
    this.outputs = g.outputs;
  }
  async addPaymentNoEstimator(n, r, s, u, a) {
    let c = BigInt(0);
    const l = BigInt(
      parseInt(Number(u + u / 100 * a).toFixed(0))
    ), d = this.outputs.reduce(
      (T, A) => T + A.amount,
      BigInt(0)
    ), g = [], y = oa.orderBy(n, ["amount"], ["desc"]), m = y.reduce(
      (T, A) => T + A.amount,
      BigInt(0)
    ), E = d + l + BigInt(580);
    if (m <= E)
      return `Total balance insufficient: you have ${Number(c) / 1e8} BTC but need ${Number(E) / 1e8} BTC`;
    for (const T of y) {
      if (c >= E)
        break;
      if (this.utxoManager.inDummyRange(T) || await this.utxoManager.utxoHaveAssets(T))
        continue;
      const A = await this.buildInputData(
        T,
        r,
        jt.ALL
      );
      g.push(A), c += T.amount;
    }
    if (c <= d + l)
      return `Available balance insufficient: you have ${Number(c) / 1e8} BTC but need ${Number(E) / 1e8} BTC`;
    for (const T of g)
      this.inputs.push({ address: r.address, data: T });
    const _ = c - (d + l);
    if (Number(_) > 580 && this.addOutput(r.address, _), Number(_) <= 0)
      return `Negative change: ${Number(_) / 1e8} BTC, added ${Number(c) / 1e8} BTC as payment utxos`;
  }
  async consolidate(n, r) {
    const { address: s } = n, u = await this.utxoManager.getUtxos(n.address), a = await this.mempoolService.getRecommendedFee(r), c = [];
    for (const d of u) {
      const g = await this.buildInputData(d, n, jt.ALL);
      c.push(g);
    }
    const l = Kl(c, [], "all", {
      feePerByte: BigInt(a),
      changeAddress: s
    });
    if (!l)
      throw new Error("Not enough BTC to fund the transaction");
    for (const d of l.inputs)
      this.inputs.push({ address: s, data: d });
    this.outputs = l.outputs;
  }
  async estimateFees(n, r, s) {
    let u = await this.mempoolService.getRecommendedFee(s);
    const a = [];
    for (const l of n) {
      const d = await this.buildInputData(l, r, jt.ALL);
      a.push(d);
    }
    const c = Kl(a, [], "all", {
      feePerByte: BigInt(u),
      changeAddress: r.address
    });
    if (!c)
      throw new Error("Unable to estimate the tx fees");
    return c.fee;
  }
  toPSBT(n) {
    const r = new te(), s = [];
    for (let a = 0; a < this.inputs.length; a++) {
      const c = this.inputs[a];
      r.addInput(c.data), n.includes(c.address) && s.push({
        index: a,
        address: c.address,
        sighashType: c.data.sighashType || jt.ALL
      });
    }
    for (let a = 0; a < this.outputs.length; a++) {
      const c = this.outputs[a];
      r.addOutputAddress(c.address, c.amount);
    }
    const u = r.toPSBT();
    return {
      base64: wn.encode(u),
      toSignInputs: s
    };
  }
  async buildInputData(n, r, s) {
    const { address: u, publicKey: a } = r, c = Mn().decode(u);
    if (c.type === "pkh")
      return await this.buildLegacyInputData(n, s);
    if (c.type === "sh")
      return this.buildNestedSegWitInputData(n, a, s);
    if (c.type === "wpkh")
      return this.buildNativeSegWitInputData(n, a, s);
    if (c.type === "tr")
      return this.buildTaprootInputData(n, a, s);
    throw new Error(`Address type not recognized: ${u}`);
  }
  //P2PKH
  async buildLegacyInputData(n, r) {
    const s = await this.fetchTransaction(n.txid);
    return {
      txid: n.txid,
      index: n.index,
      sighashType: r,
      nonWitnessUtxo: s.hex
    };
  }
  //P2SH-P2WPKH
  buildNestedSegWitInputData(n, r, s) {
    const u = jl(dt.decode(r)), a = CS(u);
    return {
      txid: n.txid,
      index: n.index,
      sighashType: s,
      witnessUtxo: {
        script: a.script,
        amount: BigInt(n.amount)
      },
      redeemScript: a.redeemScript
    };
  }
  //P2WPKH
  buildNativeSegWitInputData(n, r, s) {
    const u = jl(dt.decode(r));
    return {
      txid: n.txid,
      index: n.index,
      sighashType: s,
      witnessUtxo: {
        script: u.script,
        amount: BigInt(n.amount)
      }
    };
  }
  //P2TR
  buildTaprootInputData(n, r, s) {
    const u = this.extractXCoordinate(r), a = kS(u);
    return {
      txid: n.txid,
      index: n.index,
      sighashType: s,
      witnessUtxo: {
        script: a.script,
        amount: BigInt(n.amount)
      },
      tapInternalKey: a.tapInternalKey
    };
  }
  extractXCoordinate(n) {
    const r = dt.decode(n);
    return r.length === 32 ? r : r.subarray(1, 33);
  }
  async fetchTransaction(n) {
    const r = await this.bitcoinRpc.getRawTransaction(n);
    return te.fromRaw(dt.decode(r));
  }
}
class DS {
  constructor(n, r) {
    Wt(this, "dummyUtxoValue", BigInt(600));
    Wt(this, "dummyUtxoMinValue", BigInt(580));
    Wt(this, "dummyUtxoMaxValue", BigInt(1e3));
    this.blockBookRpc = n, this.ordinalsRpc = r;
  }
  async selectDummyUtxos(n, r, s) {
    const u = [], a = oa.orderBy(n, ["confirmations"], ["desc"]);
    for (const c of a)
      if (this.inDummyRange(c) && !await this.utxoHaveAssets(c, s) && (u.push(c), u.length === r))
        return u;
    return u;
  }
  async getUtxos(n) {
    return (await this.blockBookRpc.getUtxos(n)).map((s) => this.mapUtxo(s));
  }
  async fetchPaymentUtxos(n) {
    const r = await this.getUtxos(n), s = [];
    for (const u of r)
      u != null && u.confirmations && ((u == null ? void 0 : u.amount) <= BigInt(15e3) || await this.utxoHaveAssets(u) || s.push(u));
    return s;
  }
  inDummyRange(n) {
    return n.amount >= this.dummyUtxoMinValue && n.amount <= this.dummyUtxoMaxValue;
  }
  async utxoHaveAssets(n, r) {
    return !r && n.confirmations === 0 ? !0 : await this.outputHaveAssets(`${n.txid}:${n.index}`);
  }
  async outputHaveAssets(n) {
    const { inscriptions: r, runes: s } = await this.ordinalsRpc.getOutput(n);
    return r.length > 0 || s.length > 0;
  }
  mapUtxo(n) {
    return {
      txid: n.txid,
      index: n.vout,
      amount: BigInt(n.value),
      confirmations: n.confirmations
    };
  }
}
class Ca {
  constructor(n) {
    Wt(this, "currentUrlIndex", 0);
    this.urls = n;
  }
  getUrl() {
    const n = this.urls[this.currentUrlIndex];
    return this.currentUrlIndex === this.urls.length - 1 ? this.currentUrlIndex = 0 : this.currentUrlIndex++, n;
  }
  async call(n, r) {
    const s = this.getUrl(), u = await Ct.post(s, {
      method: n,
      params: r
    }), { data: a } = u;
    if (!this.isSuccessResponse(a))
      throw new Error(JSON.stringify(a));
    return a.result;
  }
  isSuccessResponse(n) {
    return n.error ? !1 : !n.result.error;
  }
}
class FS extends Ca {
  async getRawTransaction(n) {
    return this.call("getrawtransaction", [n, 0]);
  }
  async getRawTransactionVerbose(n) {
    return this.call("getrawtransaction", [
      n,
      1
    ]);
  }
  async testMempoolAccept(n) {
    return this.call("testmempoolaccept", [
      [n]
    ]);
  }
  async sendRawTransaction(n) {
    return this.call("sendrawtransaction", [n]);
  }
}
class PS extends Ca {
  async getOutput(n) {
    return this.call("ord_getOutput", [n]);
  }
  async getInscription(n) {
    return this.call("ord_getInscription", [n]);
  }
}
class WS extends Ca {
  async getUtxos(n) {
    return this.call("bb_getutxos", [n]);
  }
}
class qS {
  constructor(n) {
    Wt(this, "bitcoinRpc");
    Wt(this, "blockBookRpc");
    Wt(this, "ordinalsRpc");
    Wt(this, "mempoolService");
    Wt(this, "utxoManager");
    Wt(this, "fees");
    this.bitcoinRpc = new FS(n.rpcUrls), this.blockBookRpc = new WS(n.rpcUrls), this.ordinalsRpc = new PS(n.rpcUrls), this.mempoolService = new BE(n.mempoolUrl), this.utxoManager = new DS(
      this.blockBookRpc,
      this.ordinalsRpc
    ), this.fees = n.fees;
  }
  async consolidate(n, r) {
    const s = this.createTransaction();
    return await s.consolidate(n, r), s.toPSBT([n.address]);
  }
  async checkDummyUtxos(n, r) {
    const s = await this.utxoManager.getUtxos(n);
    return (await this.utxoManager.selectDummyUtxos(
      s,
      r
    )).length >= r;
  }
  async buildGenerateDummyUTXOs(n, r, s) {
    const u = n.address, a = await this.utxoManager.getUtxos(u), c = await this.utxoManager.selectDummyUtxos(a, r), l = r - c.length;
    if (l <= 0)
      throw new Error("You already have enough dummy UTXOs");
    const d = this.createTransaction();
    for (let g = 0; g < l; g++)
      d.addOutput(u, this.utxoManager.dummyUtxoValue);
    return await d.addPayment(a, n, s), d.toPSBT([u]);
  }
  async buildListing(n) {
    const {
      inscriptionId: r,
      sellerOrdinalsSigner: s,
      sellerPaymentsAddress: u,
      price: a
    } = n, c = this.createTransaction(), { utxo: l, inscriptionValue: d } = await this.getListingTransactionData(
      r
    );
    await c.addInput(
      l,
      s,
      jt.SINGLE_ANYONECANPAY
    );
    const { makerFee: g } = this.calculateFees(a), y = a + d - g;
    return c.addOutput(u, BigInt(y)), c.toPSBT([s.address]);
  }
  async buildBuyPsbt(n, r, s, u, a) {
    const c = r.address, l = this.createTransaction(), d = await this.utxoManager.getUtxos(c), g = await this.utxoManager.selectDummyUtxos(
      d,
      n.length + 1,
      a
    );
    if (g.length < n.length + 1)
      throw new Error("You don't have enough dummy UTXOs");
    for (const T of g)
      await l.addInput(T, r, jt.ALL);
    const y = g.reduce(
      (T, A) => T + A.amount,
      BigInt(0)
    );
    l.addOutput(r.address, y);
    const m = [];
    for (const T of n) {
      const {
        inscriptionId: A,
        sellerOrdinalsSigner: x,
        sellerPaymentsAddress: B,
        price: k
      } = T, { utxo: O, inscriptionValue: F } = await this.getListingTransactionData(
        A
      );
      await l.addInput(
        O,
        x,
        jt.SINGLE_ANYONECANPAY
      );
      const D = T.makerFeeOverwrite ?? !1;
      let { makerFee: W } = this.calculateFees(k, D);
      const M = k + F - W;
      l.addOutput(s, BigInt(F)), m.push({
        address: B,
        amount: BigInt(M)
      });
    }
    for (const T of m)
      l.addOutput(T.address, T.amount);
    const E = n.reduce(
      (T, A) => T + A.price,
      0
    ), { marketplaceFee: _ } = this.calculateFees(E);
    l.addOutput(this.fees.receiveAddress, BigInt(_));
    for (let T = 0; T < g.length; T++)
      l.addOutput(
        c,
        this.utxoManager.dummyUtxoValue
      );
    return await l.addPayment(d, r, u, null, a), l.toPSBT([c]);
  }
  async buildStealthBuyPsbt(n, r, s, u) {
    const a = r.address, c = this.createTransaction(), l = await this.utxoManager.getUtxos(a), d = await this.utxoManager.selectDummyUtxos(
      l,
      n.length + 1
    );
    if (d.length < n.length + 1)
      throw new Error("You don't have enough dummy UTXOs");
    for (const _ of d)
      await c.addInput(_, r);
    const g = d.reduce(
      (_, T) => _ + T.amount,
      BigInt(0)
    );
    c.addOutput(r.address, g);
    const y = [];
    for (const _ of n) {
      const {
        inscriptionId: T,
        sellerOrdinalsSigner: A,
        sellerPaymentsAddress: x,
        price: B
      } = _, { utxo: k, inscriptionValue: O } = await this.getListingTransactionData(
        T
      );
      await c.addInput(
        k,
        A,
        jt.SINGLE_ANYONECANPAY
      );
      const { makerFee: F } = this.calculateFees(B), D = B + O - F;
      c.addOutput(s, BigInt(O)), y.push({
        address: x,
        amount: BigInt(D)
      });
    }
    for (const _ of y)
      c.addOutput(_.address, _.amount);
    const m = n.reduce(
      (_, T) => _ + T.price,
      0
    ), { marketplaceFee: E } = this.calculateFees(m);
    c.addOutput(this.fees.receiveAddress, BigInt(E));
    for (let _ = 0; _ < d.length; _++)
      c.addOutput(
        a,
        this.utxoManager.dummyUtxoValue
      );
    return await c.addPayment(l, r, "fastestFee", u), c.toPSBT([a]);
  }
  async buildBidPsbt(n, r, s, u) {
    const {
      inscriptionId: a,
      sellerOrdinalsSigner: c,
      sellerPaymentsAddress: l,
      price: d
    } = n, g = this.createTransaction(), { utxo: y, inscriptionValue: m } = await this.getListingTransactionData(
      a
    );
    await g.addInput(y, c, jt.ALL);
    const { takerFee: E, marketplaceFee: _ } = this.calculateFees(d), T = d + m - E;
    g.addOutput(s, BigInt(m)), g.addOutput(l, BigInt(T)), g.addOutput(this.fees.receiveAddress, BigInt(_));
    const A = r.address, x = await this.utxoManager.getUtxos(A);
    return await g.addPayment(x, r, u), g.toPSBT([A]);
  }
  async buildSnipePsbt(n, r, s) {
    const u = {
      address: n.paymentAddress,
      publicKey: n.publicKey
    }, a = this.createTransaction(), c = await this.utxoManager.getUtxos(n.paymentAddress), l = await this.utxoManager.selectDummyUtxos(c, 2);
    for (const W of l)
      await a.addInput(W, u, jt.ALL);
    const d = l.reduce(
      (W, M) => W + M.amount,
      BigInt(0)
    );
    a.addOutput(u.address, d);
    const g = r.vin[r.weakVinIndex], y = r.vout[r.weakVinIndex], m = await this.bitcoinRpc.getRawTransaction(g.txid), _ = te.fromRaw(dt.decode(m)).getOutput(g.vout), T = _.amount ? _.amount : BigInt(0), A = _.script ? _.script : new Uint8Array();
    await a.addInput(
      {
        txid: g.txid,
        index: g.vout,
        amount: T,
        confirmations: 1
      },
      // Using a random signer for this input, will be replaced by the seller's input in the next steps of the code
      {
        address: "16t6QqNeSWJYBDS6ShsFYyhi1LnJSBJiEh",
        publicKey: "03d93cd5894d491c558ae9aa133f1bc5e9e6078b4216bcba24ba7a221fecc9d360"
      },
      jt.SINGLE_ANYONECANPAY
    ), a.addOutput(n.address, T), a.addOutput(
      y.scriptPubKey.address,
      BigInt(Number(y.value * 1e8).toFixed(0))
    );
    const { takerFee: x, marketplaceFee: B } = this.calculateFees(Number(Number(y.value * 1e8).toFixed(0)));
    let k = B;
    k < 580 && (k = 580), a.addOutput(this.fees.receiveAddress, BigInt(k)), a.addOutput(n.paymentAddress, BigInt(600)), a.addOutput(n.paymentAddress, BigInt(600));
    const O = await a.addPaymentNoEstimator(
      c,
      u,
      Number(r.price) + x,
      Number(r.fees),
      s
    );
    if (O)
      return { error: O };
    const F = te.fromPSBT(
      wn.decode(a.toPSBT([n.paymentAddress]).base64)
    );
    F.updateInput(2, {
      txid: g.txid,
      sequence: g.sequence,
      index: g.vout,
      witnessUtxo: {
        script: A,
        amount: T
      },
      finalScriptSig: new Uint8Array(),
      finalScriptWitness: [Buffer.from(dt.decode(g.txinwitness[0]))]
    });
    const D = a.toPSBT([n.paymentAddress]).toSignInputs.map((W) => ({
      index: W.index,
      sighashType: W.sighashType,
      sighashTypes: [W.sighashType],
      disableTweakSigner: !1,
      address: W.address,
      publicKey: u.publicKey,
      autoFinalized: !0
    }));
    return {
      base64: wn.encode(F.toPSBT()),
      toSignInputs: D
    };
  }
  async fetchPaymentUtxos(n) {
    return await this.utxoManager.fetchPaymentUtxos(n);
  }
  async buildSplitPsbt(n, r, s, u) {
    const a = this.createTransaction();
    for (const l of r) {
      const d = BigInt(l.amount) / BigInt(s);
      await a.addInput(l, n, jt.ALL);
      for (let g = 0; g < s; g++)
        a.addOutput(n.address, d);
    }
    let c = await this.utxoManager.getUtxos(n.address);
    for (const l of r)
      c = c.filter((d) => `${l.txid}:${l.index}` != `${d.txid}:${d.index}`);
    return await a.addPayment(
      c,
      n,
      u
    ), a.toPSBT([n.address]);
  }
  async submitSplitPSBT(n, r, s) {
    const u = te.fromPSBT(wn.decode(n));
    for (const c of r)
      u.finalizeIdx(c.index);
    return (s ? this.bitcoinRpc.sendRawTransaction.bind(this.bitcoinRpc) : this.bitcoinRpc.testMempoolAccept.bind(this.bitcoinRpc))(u.hex);
  }
  async submitSnipePSBT(n, r, s) {
    const u = te.fromPSBT(wn.decode(n));
    for (const c of r)
      u.finalizeIdx(c.index);
    return (s ? this.bitcoinRpc.sendRawTransaction.bind(this.bitcoinRpc) : this.bitcoinRpc.testMempoolAccept.bind(this.bitcoinRpc))(u.hex);
  }
  async completeSale(n, r, s) {
    const u = te.fromPSBT(wn.decode(r));
    for (let c = 0; c < n.length; c++) {
      const l = n[c], d = te.fromPSBT(wn.decode(l)), g = n.length + c + 1;
      u.updateInput(g, d.getInput(0));
    }
    return u.finalize(), (s ? this.bitcoinRpc.sendRawTransaction.bind(this.bitcoinRpc) : this.bitcoinRpc.testMempoolAccept.bind(this.bitcoinRpc))(u.hex);
  }
  createTransaction() {
    return new $S(
      this.bitcoinRpc,
      this.mempoolService,
      this.utxoManager
    );
  }
  async completeStealthSale(n, r) {
    const s = te.fromPSBT(wn.decode(r));
    for (let u = 0; u < n.length; u++) {
      const a = n[u], c = te.fromPSBT(wn.decode(a)), l = n.length + u + 1;
      s.updateInput(l, c.getInput(0));
    }
    return s.finalize(), s.hex;
  }
  async getListingTransactionData(n) {
    const r = await this.ordinalsRpc.getInscription(n), [s, u, a] = r.satpoint.split(":");
    return {
      utxo: {
        txid: s,
        index: parseInt(u),
        amount: BigInt(r.value),
        confirmations: 1
      },
      offset: a,
      inscriptionValue: r.value
    };
  }
  calculateFees(n, r) {
    const s = r ? 0 : this.fees.makerPercentage, u = Math.floor(n * s / 100), a = Math.floor(n * this.fees.takerPercentage / 100), c = Math.max(u + a, this.fees.minAmount);
    return {
      makerFee: u,
      takerFee: a,
      marketplaceFee: c
    };
  }
}
class KS {
  constructor(n, r, s) {
    Wt(this, "addresses", ["bc1qp8j9sx6609h7llqufurxjgrwsqwt020tqzn0gs"]);
    Wt(this, "transactionAssetsCache", {});
    this.bitcoinRpc = n, this.ordinalsRpc = r, this.blockBookRpc = s;
  }
  async fetchPendingTransfers() {
    const n = [];
    for (const r of this.addresses) {
      const s = await this.fetchAddressPendingTransfers(
        r
      );
      n.push(...s);
    }
    return n;
  }
  async fetchAddressPendingTransfers(n) {
    const s = (await this.blockBookRpc.getUtxos(n)).filter((a) => a.confirmations === 0), u = [];
    for (const a of s) {
      const c = await this.fetchTransactionAssets(a.txid);
      for (let l = 0; l < c.inscriptions.length; l++) {
        const d = c.inscriptions[l];
        u.push({
          txid: a.txid,
          inscriptionId: d
        });
      }
      for (let l = 0; l < c.runes.length; l++) {
        const d = c.runes[l];
        u.push({
          txid: a.txid,
          rune: d
        });
      }
    }
    return u;
  }
  async fetchTransactionAssets(n) {
    if (this.transactionAssetsCache[n])
      return this.transactionAssetsCache[n];
    const s = (await this.bitcoinRpc.getRawTransactionVerbose(n)).vin.map((d) => `${d.txid}:${d.vout}`), u = [];
    for (const d of s) {
      const g = await this.ordinalsRpc.getOutput(d);
      u.push(g);
    }
    const a = u.map((d) => d.inscriptions).flat(), c = u.map((d) => d.runes).flat(), l = {
      inscriptions: a,
      runes: c
    };
    return this.transactionAssetsCache[n] = l, l;
  }
}
export {
  wn as Base64Codec,
  KS as MagicEdenInspector,
  BE as MempoolService,
  qS as OrdinalsMarketplace,
  te as PsbtTransaction
};

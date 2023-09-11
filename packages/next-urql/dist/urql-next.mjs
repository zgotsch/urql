import { Provider as e, createRequest as r, useQuery as t } from "urql";

export * from "urql";

import n from "react";

import { ServerInsertedHTMLContext as a } from "next/navigation";

var o = n.createContext(void 0);

var DataHydrationContextProvider = ({children: e}) => {
  var r = n.useRef();
  if ("undefined" == typeof window) {
    if (!r.current) {
      r.current = function buildContext() {
        var e = {
          isInjecting: !1,
          operationValuesByKey: {},
          RehydrateScript() {
            e.isInjecting = !1;
            if (!Object.keys(e.operationValuesByKey).length) {
              return n.createElement(n.Fragment);
            }
            var r = function transportDataToJS(e) {
              return `(window[Symbol.for("urql_transport")] ??= []).push("${Buffer.from(JSON.stringify(e)).toString("base64")}")`;
            }({
              rehydrate: {
                ...e.operationValuesByKey
              }
            });
            e.operationValuesByKey = {};
            return n.createElement("script", {
              key: i++,
              dangerouslySetInnerHTML: {
                __html: r
              }
            });
          }
        };
        return e;
      }();
    }
  }
  return n.createElement(o.Provider, {
    value: r.current
  }, e);
};

var i = 0;

var s = n.createContext(void 0);

function UrqlProvider({children: r, ssr: t, client: a}) {
  return n.createElement(e, {
    value: a
  }, n.createElement(s.Provider, {
    value: t
  }, n.createElement(DataHydrationContextProvider, {}, r)));
}

var u = Symbol.for("urql_transport");

function useUrqlValue(e) {
  var r = n.useContext(s);
  var t = function useDataHydrationContext() {
    var e = n.useContext(o);
    var r = n.useContext(a);
    if ("undefined" != typeof window) {
      return;
    }
    if (r && e && !e.isInjecting) {
      e.isInjecting = !0;
      r((() => n.createElement(e.RehydrateScript, {})));
    }
    return e;
  }();
  if (!r) {
    throw new Error('Missing "UrqlProvider" component as a parent or did not pass in an "ssrExchange" to the Provider.');
  }
  if ("undefined" == typeof window) {
    var i = r.extractData();
    if (t && i[e]) {
      var d = i[e];
      var l = {
        ...d,
        extensions: d.extensions ? JSON.parse(d.extensions) : d.extensions,
        data: d.data ? JSON.parse(d.data) : d.data,
        error: d.error
      };
      t.operationValuesByKey[e] = l;
    }
  } else {
    var f;
    if (window[u]) {
      f = window[u].map((e => JSON.parse(window.atob(e))));
    } else {
      f = [];
    }
    var y = f.find((r => r && r.rehydrate && r.rehydrate[e]));
    if (y) {
      var c = y.rehydrate && y.rehydrate[e];
      if (c) {
        delete y.rehydrate[e];
        r.restoreData({
          [e]: {
            extensions: JSON.stringify(c.extensions),
            data: JSON.stringify(c.data),
            error: c.error
          }
        });
        delete y.rehydrate[e];
      }
    }
  }
}

function useQuery(e) {
  var n = r(e.query, e.variables || {});
  useUrqlValue(n.key);
  var [a, o] = t(e);
  useUrqlValue(n.key);
  return [ a, o ];
}

export { UrqlProvider, useQuery };
//# sourceMappingURL=urql-next.mjs.map

"use client"
Object.defineProperty(exports, '__esModule', { value: true });

var urql = require('urql');
var React = require('react');
var navigation = require('next/navigation');

var DataHydrationContext = React["default"].createContext(undefined);
function transportDataToJS(data) {
  var key = 'urql_transport';
  return `(window[Symbol.for("${key}")] ??= []).push("${Buffer.from(JSON.stringify(data)).toString('base64')}")`;
}
var DataHydrationContextProvider = ({
  children
}) => {
  var dataHydrationContext = React["default"].useRef();
  if (typeof window == 'undefined') {
    if (!dataHydrationContext.current) dataHydrationContext.current = buildContext();
  }
  return React["default"].createElement(DataHydrationContext.Provider, {
    value: dataHydrationContext.current
  }, children);
};
function useDataHydrationContext() {
  var dataHydrationContext = React["default"].useContext(DataHydrationContext);
  var insertHtml = React["default"].useContext(navigation.ServerInsertedHTMLContext);
  if (typeof window !== 'undefined') return;
  if (insertHtml && dataHydrationContext && !dataHydrationContext.isInjecting) {
    dataHydrationContext.isInjecting = true;
    insertHtml(() => React["default"].createElement(dataHydrationContext.RehydrateScript, {}));
  }
  return dataHydrationContext;
}
var key = 0;
function buildContext() {
  var dataHydrationContext = {
    isInjecting: false,
    operationValuesByKey: {},
    RehydrateScript() {
      dataHydrationContext.isInjecting = false;
      if (!Object.keys(dataHydrationContext.operationValuesByKey).length) return React["default"].createElement(React["default"].Fragment);
      var __html = transportDataToJS({
        rehydrate: {
          ...dataHydrationContext.operationValuesByKey
        }
      });
      dataHydrationContext.operationValuesByKey = {};
      return React["default"].createElement('script', {
        key: key++,
        dangerouslySetInnerHTML: {
          __html
        }
      });
    }
  };
  return dataHydrationContext;
}

var SSRContext = React["default"].createContext(undefined);

/** Provider for `@urql/next` during non-rsc interactions.
 *
 * @remarks
 * `Provider` accepts a {@link Client} and provides it to all GraphQL hooks, it
 * also accepts an {@link SSRExchange} to distribute data when re-hydrating
 * on the client.
 *
 * @example
 * ```tsx
 * import {
 *  UrqlProvider,
 *  ssrExchange,
 *  cacheExchange,
 *  fetchExchange,
 *  createClient,
 * } from '@urql/next';
 *
 * const ssr = ssrExchange();
 * const client = createClient({
 *   url: 'https://trygql.formidable.dev/graphql/basic-pokedex',
 *   exchanges: [cacheExchange, ssr, fetchExchange],
 *   suspense: true,
 * });
 *
 * export default function Layout({ children }: React.PropsWithChildren) {
 *   return (
 *     <UrqlProvider client={client} ssr={ssr}>
 *      {children}
 *     </UrqlProvider>
 *   );
 * }
 *
 * ```
 */
function UrqlProvider({
  children,
  ssr,
  client
}) {
  return React["default"].createElement(urql.Provider, {
    value: client
  }, React["default"].createElement(SSRContext.Provider, {
    value: ssr
  }, React["default"].createElement(DataHydrationContextProvider, {}, children)));
}

var symbolString = 'urql_transport';
var urqlTransportSymbol = Symbol.for(symbolString);
function useUrqlValue(operationKey) {
  var ssrExchange = React["default"].useContext(SSRContext);
  var rehydrationContext = useDataHydrationContext();
  if (!ssrExchange) {
    throw new Error('Missing "UrqlProvider" component as a parent or did not pass in an "ssrExchange" to the Provider.');
  }
  if (typeof window == 'undefined') {
    var data = ssrExchange.extractData();
    if (rehydrationContext && data[operationKey]) {
      var res = data[operationKey];
      var parsed = {
        ...res,
        extensions: res.extensions ? JSON.parse(res.extensions) : res.extensions,
        data: res.data ? JSON.parse(res.data) : res.data,
        error: res.error
      };
      rehydrationContext.operationValuesByKey[operationKey] = parsed;
    }
  } else {
    var stores;
    if (window[urqlTransportSymbol]) {
      stores = window[urqlTransportSymbol].map(s => JSON.parse(window.atob(s)));
    } else {
      stores = [];
    }
    var store = stores.find(x => x && x.rehydrate && x.rehydrate[operationKey]);
    if (store) {
      var result = store.rehydrate && store.rehydrate[operationKey];
      if (result) {
        delete store.rehydrate[operationKey];
        ssrExchange.restoreData({
          [operationKey]: {
            extensions: JSON.stringify(result.extensions),
            data: JSON.stringify(result.data),
            error: result.error
          }
        });
        delete store.rehydrate[operationKey];
      }
    }
  }
}

/** Input arguments for the {@link useQuery} hook.
 *
 * @param query - The GraphQL query that `useQuery` executes.
 * @param variables - The variables for the GraphQL query that `useQuery` executes.
 */

/** State of the current query, your {@link useQuery} hook is executing.
 *
 * @remarks
 * `UseQueryState` is returned (in a tuple) by {@link useQuery} and
 * gives you the updating {@link OperationResult} of GraphQL queries.
 *
 * Even when the query and variables passed to {@link useQuery} change,
 * this state preserves the prior state and sets the `fetching` flag to
 * `true`.
 * This allows you to display the previous state, while implementing
 * a separate loading indicator separately.
 */

/** Triggers {@link useQuery} to execute a new GraphQL query operation.
 *
 * @param opts - optionally, context options that will be merged with the hook's
 * {@link UseQueryArgs.context} options and the `Client`’s options.
 *
 * @remarks
 * When called, {@link useQuery} will re-execute the GraphQL query operation
 * it currently holds, even if {@link UseQueryArgs.pause} is set to `true`.
 *
 * This is useful for executing a paused query or re-executing a query
 * and get a new network result, by passing a new request policy.
 *
 * ```ts
 * const [result, reexecuteQuery] = useQuery({ query });
 *
 * const refresh = () => {
 *   // Re-execute the query with a network-only policy, skipping the cache
 *   reexecuteQuery({ requestPolicy: 'network-only' });
 * };
 * ```
 */

/** Result tuple returned by the {@link useQuery} hook.
 *
 * @remarks
 * Similarly to a `useState` hook’s return value,
 * the first element is the {@link useQuery}’s result and state,
 * a {@link UseQueryState} object,
 * and the second is used to imperatively re-execute the query
 * via a {@link UseQueryExecute} function.
 */

/** Hook to run a GraphQL query and get updated GraphQL results.
 *
 * @param args - a {@link UseQueryArgs} object, to pass a `query`, `variables`, and options.
 * @returns a {@link UseQueryResponse} tuple of a {@link UseQueryState} result, and re-execute function.
 *
 * @remarks
 * `useQuery` allows GraphQL queries to be defined and executed.
 * Given {@link UseQueryArgs.query}, it executes the GraphQL query with the
 * context’s {@link Client}.
 *
 * The returned result updates when the `Client` has new results
 * for the query, and changes when your input `args` change.
 *
 * Additionally, if the `suspense` option is enabled on the `Client`,
 * the `useQuery` hook will suspend instead of indicating that it’s
 * waiting for a result via {@link UseQueryState.fetching}.
 *
 * @see {@link https://urql.dev/goto/urql/docs/basics/react-preact/#queries} for `useQuery` docs.
 *
 * @example
 * ```ts
 * import { gql, useQuery } from 'urql';
 *
 * const TodosQuery = gql`
 *   query { todos { id, title } }
 * `;
 *
 * const Todos = () => {
 *   const [result, reexecuteQuery] = useQuery({
 *     query: TodosQuery,
 *     variables: {},
 *   });
 *   // ...
 * };
 * ```
 */
function useQuery(args) {
  var request = urql.createRequest(args.query, args.variables || {});
  useUrqlValue(request.key);
  var [result, execute] = urql.useQuery(args);
  useUrqlValue(request.key);
  return [result, execute];
}

exports.UrqlProvider = UrqlProvider;
exports.useQuery = useQuery;
Object.keys(urql).forEach(function (k) {
if (k !== 'default' && !exports.hasOwnProperty(k)) Object.defineProperty(exports, k, {
enumerable: true,
get: function () { return urql[k]; }
});
});
//# sourceMappingURL=urql-next.js.map

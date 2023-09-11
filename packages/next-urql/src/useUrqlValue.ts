'use client';

import React from 'react';
import { useDataHydrationContext } from './DataHydrationContext';
import { SSRContext } from './Provider';

export const symbolString = 'urql_transport';
export const urqlTransportSymbol = Symbol.for(symbolString);

export type UrqlResult = { data?: any; error?: any; extensions?: any };

export function useUrqlValue(operationKey: number): void {
  const ssrExchange = React.useContext(SSRContext);
  const rehydrationContext = useDataHydrationContext();

  if (!ssrExchange) {
    throw new Error(
      'Missing "UrqlProvider" component as a parent or did not pass in an "ssrExchange" to the Provider.'
    );
  }

  if (typeof window == 'undefined') {
    const data = ssrExchange.extractData();
    if (rehydrationContext && data[operationKey]) {
      const res = data[operationKey];
      const parsed = {
        ...res,
        extensions: res.extensions
          ? JSON.parse(res.extensions)
          : res.extensions,
        data: res.data ? JSON.parse(res.data) : res.data,
        error: res.error,
      };
      rehydrationContext.operationValuesByKey[operationKey] = parsed;
    }
  } else {
    let stores: Array<{ rehydrate: Record<number, UrqlResult> }>;
    if (window[urqlTransportSymbol as any]) {
      stores = (
        window[urqlTransportSymbol as any] as unknown as Array<string>
      ).map(s => JSON.parse(decodeBase64(s)));
    } else {
      stores = [];
    }

    const store = stores.find(
      x => x && x.rehydrate && x.rehydrate[operationKey]
    );
    if (store) {
      const result = store.rehydrate && store.rehydrate[operationKey];
      if (result) {
        delete store.rehydrate[operationKey];
        ssrExchange.restoreData({
          [operationKey]: {
            extensions: JSON.stringify(result.extensions),
            data: JSON.stringify(result.data),
            error: result.error,
          },
        });
        delete store.rehydrate[operationKey];
      }
    }
  }
}

function decodeBase64(base64) {
  const text = atob(base64);
  const bytes = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i++) {
    bytes[i] = text.charCodeAt(i);
  }
  const decoder = new TextDecoder(); // default is utf-8
  return decoder.decode(bytes);
}

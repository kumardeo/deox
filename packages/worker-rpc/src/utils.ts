import { WORKER_NAMESPACE } from './constants';

/**
 * Helper function to generate javascript string
 *
 * @param entry Entry url string of worker
 *
 * @returns Javascript content for worker
 */
export const getBlobContent = (entry: string, type?: 'module' | 'classic') => {
  const scriptUrl = encodeURI(entry);
  return `Object.defineProperties((typeof globalThis!== "undefined"?globalThis:self).location,{__entry__:{value:"${scriptUrl}"},toString:{value:function toString(){return this.__entry__;}}});\n${
    type === 'module' ? `import "${scriptUrl}";` : 'importScripts(self.location.toString());'
  }`;
};

/** Checks whether a message event is a response which was received from worker thread */
export const eventIsResponse = (event: MessageEvent<unknown>) => {
  const response = event.data;
  if (typeof response === 'object' && response && Object.hasOwnProperty.call(response, WORKER_NAMESPACE)) {
    return true;
  }
  return false;
};

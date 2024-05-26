/**
 * Permits `string` but gives hints
 */
export type StringWithSuggestions<S extends string> = (string & Record<never, never>) | S;

export type MayBePromise<T> = T extends Promise<infer C> ? C | Promise<C> : T | Promise<T>;

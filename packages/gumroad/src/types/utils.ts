// permits `string` but gives hints
export type StringWithSuggestions<S extends string> =
	| (string & Record<never, never>)
	| S;

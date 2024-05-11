import { CONTAINER } from "./constants";

/** utils types */
export type ConstructorType<T = any> = T extends abstract new (
	...args: any[]
) => any
	? never
	: abstract new (...args: any[]) => T;

/** common properties of all serializers */
export interface DecomposableConstructor<C, V extends any[] = any[]> {
	/** converts an instance to a value array */
	from(instance: C): V;
}

/** a serializer for a value that does not contain nested values */
export interface ValueConstructor<C, V extends any[] = any[]>
	extends DecomposableConstructor<C, V> {
	/** creates a class from a value array */
	create(val: V): C;
}

export interface BucketConstructor<C, V extends any[] = any[]>
	extends DecomposableConstructor<C, V> {
	/** stubs a class instance that can be re-hydrated */
	stub: () => C;
	/** re-hydrates a class instance with its nested values */
	hydrate: (stub: C, val: V) => void;
}

/** a serializer for values or buckets */
export type SerializableConstructor<C, V extends any[] = any[]> =
	| ValueConstructor<C, V>
	| BucketConstructor<C, V>;

export interface ConstructorMap<C = any, V extends any[] = any[]>
	extends Map<ConstructorType<C>, SerializableConstructor<C, V>> {
	set<T extends C, P extends V>(
		key: ConstructorType<T>,
		value: SerializableConstructor<T, P>
	): this;
}

/** creates a new global constructor map as found in GLOBAL_CONSTRUCTOR_MAP */
export const globalConstructorMap = () => {
	const map: ConstructorMap = new Map();

	map.set(Error, {
		from: (err) => {
			const res: [string, string, string | undefined, unknown] = [
				err.name,
				err.message,
				undefined,
				undefined
			];
			if (err.stack !== undefined) {
				res[2] = err.stack;
			}
			if (err.cause !== undefined) {
				res[3] = err.cause;
			}
			return res;
		},
		stub: () => new Error(),
		hydrate: (err, [name, message, stack, cause]) => {
			err.name = name;
			err.message = message;

			if (stack === undefined) {
				delete err.stack;
			} else {
				err.stack = stack;
			}

			if (cause !== undefined) {
				err.cause = cause;
			}
		}
	});

	map.set(Uint8Array, {
		from: (arr) => [btoa(CONTAINER.dec8.decode(arr))],
		create: ([data]) => CONTAINER.enc.encode(atob(data))
	});

	map.set(Map, {
		from: (m) => [...m.entries()],
		stub: () => new Map(),
		hydrate: (m, entries) => entries.forEach(([k, v]) => m.set(k, v))
	});

	map.set(Set, {
		from: (s) => [...s.values()],
		stub: () => new Set(),
		hydrate: (s, values) => values.forEach((v) => s.add(v))
	});

	map.set(Date, {
		from: (d) => [d.toJSON()],
		create: ([json]) => new Date(json)
	});

	map.set(RegExp, {
		from: ({ source, flags }) => (flags ? [source, flags] : [source]),
		create: ([source, flags]) => new RegExp(source, flags)
	});

	map.set(URL, {
		from: (url) => [url.href],
		create: ([href]) => new URL(href)
	});

	return map;
};

/** get constructor from map by label */
export const getFromLabel = (map: ConstructorMap, label: string) => {
	if (typeof label === "string") {
		let i = 0;
		// eslint-disable-next-line no-restricted-syntax
		for (const [key, value] of map) {
			const keyLabel = `${i}:${key.name}`;
			if (keyLabel === label) {
				return [key, value, keyLabel, i] as const;
			}
			i += 1;
		}
	}

	return null;
};

/** get constructor from map by constructor function */
export const getFromConstructor = (
	map: ConstructorMap,
	constructor: ConstructorType
) => {
	let i = 0;
	// eslint-disable-next-line no-restricted-syntax
	for (const [key, value] of map) {
		if (key === constructor) {
			return [key, value, `${i}:${key.name}`, i] as const;
		}
		i += 1;
	}

	return null;
};

/** gets the nearest super class from constructor map by subclass */
export const nearestConstructor = (map: ConstructorMap, subclass: unknown) => {
	let result:
		| (typeof map extends Map<infer C, infer V>
				? [C, V, string, number]
				: never)
		| undefined;
	let nearestDistance = Infinity;
	let i = 0;

	// eslint-disable-next-line no-restricted-syntax
	for (const [key, value] of map) {
		let currentDistance = 0;

		// Calculate the distance from subclass to the current constructor
		let currentConstructor = subclass;

		while (currentConstructor !== key && currentConstructor !== null) {
			currentConstructor = Object.getPrototypeOf(currentConstructor);
			currentDistance += 1;
		}

		if (currentConstructor === key && currentDistance < nearestDistance) {
			result = [key, value, `${i}:${key.name}`, i];
			nearestDistance = currentDistance;
		}

		i += 1;
	}

	return result || null;
};

/**
 * Globally available constructor map that holds sensible default serializers
 * for the following values:
 * - Error
 * - Uint8Array
 * - Map
 * - Set
 * - Date
 * - RegExp
 * - URL
 *
 * You can modify this if you want, but remember that it is global state.
 *
 * This map will be used as the default value for all calls to `parse`,
 * `stringify`, `listify`, and `delistify` if you do not specify your own
 * constructor map explictily.
 */
export const GLOBAL_CONSTRUCTOR_MAP: ConstructorMap = globalConstructorMap();

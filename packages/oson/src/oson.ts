/* eslint-disable consistent-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */

import {
	ARRAY_HOLE_INDEX,
	BIG_INT_LABEL,
	NAN_INDEX,
	NEG_INF_INDEX,
	POS_INF_INDEX,
	UNDEFINED_INDEX,
	PLAIN_OBJECT_LABEL
} from "./constants";
import {
	type ConstructorMap,
	GLOBAL_CONSTRUCTOR_MAP,
	nearestConstructor,
	getFromLabel
} from "./constructors";

/** union type of all internal magic numbers */
export type OsonMagic =
	| typeof UNDEFINED_INDEX
	| typeof ARRAY_HOLE_INDEX
	| typeof NAN_INDEX
	| typeof POS_INF_INDEX
	| typeof NEG_INF_INDEX;

/** primitive value inside encoded Oson data */
export type OsonPrimitive = string | number | boolean | null;

/** bigint encoded as Oson data */
export type OsonBigInt = [typeof BIG_INT_LABEL, string];

/** array encoded as Oson data */
export type OsonArray = number[];

/** object encoded as Oson data */
export type OsonObject = [label: string, ...values: number[]];

/** complex value inside encoded Oson data */
export type OsonList = OsonBigInt | OsonArray | OsonObject;

/** value inside encoded Oson data */
export type OsonValue = OsonPrimitive | OsonList;

/** encoded Oson data */
export type Oson = OsonMagic | OsonValue[];

const isOsonObject = (array: OsonList): array is OsonObject =>
	typeof array[0] === "string";

const isOsonBigInt = (array: OsonList): array is OsonBigInt =>
	array[0] === BIG_INT_LABEL;

const toMagicNumber = (value: unknown): OsonMagic | null => {
	if (value === undefined) {
		return UNDEFINED_INDEX;
	}
	if (typeof value === "number") {
		if (Number.isNaN(value)) {
			return NAN_INDEX;
		}
		if (!Number.isFinite(value)) {
			return value < 0 ? NEG_INF_INDEX : POS_INF_INDEX;
		}
	}
	return null;
};

const fromObject = (
	value: object,
	constructors: ConstructorMap
): [string, unknown[]] => {
	// check if we have this instance registered
	const constr = value.constructor;
	if (typeof constr === "function") {
		const result = nearestConstructor(constructors, constr);
		if (result !== null) {
			const [_constructor, serializer, label] = result;
			return [label, serializer.from(value)];
		}
	}
	// no instance found, fall back to normal object
	const entries = Object.entries(value);
	const cnt = entries.length;
	const val: unknown[] = Array(cnt + cnt);
	for (let i = 0; i < cnt; i += 1) {
		const entry = entries[i];
		const ii = i + i;
		val[ii] = entry[0];
		val[ii + 1] = entry[1];
	}
	return [PLAIN_OBJECT_LABEL, val];
};

const fromMagicNumber = (value: number): undefined | number | null => {
	switch (value) {
		case UNDEFINED_INDEX:
			return undefined;
		case NAN_INDEX:
			return NaN;
		case NEG_INF_INDEX:
			return -Infinity;
		case POS_INF_INDEX:
			return Infinity;
		default:
			return null;
	}
};

const SPARSE_PROTO: number[] = [];
const sparse = (len: number) => {
	if (SPARSE_PROTO.length < len) {
		const old = SPARSE_PROTO.length;
		SPARSE_PROTO.length = len;
		SPARSE_PROTO.fill(ARRAY_HOLE_INDEX, old, len);
	}
	return SPARSE_PROTO.slice(0, len);
};

const stubObject = (label: string, constructors: ConstructorMap) => {
	// stub a plain object
	if (label === PLAIN_OBJECT_LABEL) {
		return {};
	}
	// stub an instance
	const result = getFromLabel(constructors, label);
	if (result === null) {
		throw new Error(`Unknown stub type: ${label}`);
	}
	const [_constructor, serializer] = result;
	if ("stub" in serializer) {
		return serializer.stub();
	}
	return undefined;
};

const hydrateObject = (
	label: string,
	stub: object,
	val: any[],
	constructors: ConstructorMap
) => {
	if (label === PLAIN_OBJECT_LABEL) {
		const object = stub as Record<string, any>;
		for (let i = 0; i < val.length; i += 2) {
			Object.defineProperty(object, val[i], {
				value: val[i + 1],
				configurable: true,
				enumerable: true,
				writable: true
			});
		}
		return object;
	}
	const result = getFromLabel(constructors, label);
	if (result === null) {
		throw new Error(`Unknown object type: ${label}`);
	}
	const [_constructor, serializer] = result;
	if (!("hydrate" in serializer)) {
		throw new Error(`Do not know how to hydrate stub type: ${label}`);
	}
	serializer.hydrate(stub, val);
};

const createObject = (
	label: string,
	val: any[],
	constructors: ConstructorMap
) => {
	const result = getFromLabel(constructors, label);
	if (result === null) {
		throw new Error(`Unknown object type: ${label}`);
	}
	const [_constructor, serializer] = result;
	if (!("create" in serializer)) {
		throw new Error(`Do not know how to create object type: ${label}`);
	}
	return serializer.create(val);
};

/**
 * Converts a value to Oson data. Oson data only contains numbers, strings,
 * arrays, and null values, and can therefore be JSON-encoded. This will
 * preserve circular and repeated references as well as undefined, sparse
 * arrays, bigint, and all classes instances defined by the constructor map.
 *
 * @param value The value to convert to Oson data
 * @param constructors The constructor map to use for class instances
 * @returns The Oson data containing the encoded value
 */
export const listify = (
	value1: unknown,
	constructors: ConstructorMap = GLOBAL_CONSTRUCTOR_MAP
): Oson => {
	const num1 = toMagicNumber(value1);
	if (num1 !== null) {
		return num1;
	}

	const list: OsonValue[] = [];
	const index = new Map<unknown, number>();

	const add = (value: unknown): number => {
		const num2 = toMagicNumber(value);
		if (num2 !== null) {
			return num2;
		}
		let position = index.get(value);
		if (position !== undefined) {
			return position;
		}
		position = list.length;
		switch (typeof value) {
			case "number":
			case "string":
			case "boolean":
				list[position] = value;
				index.set(value, position);
				break;
			case "bigint": {
				list[position] = [BIG_INT_LABEL, value.toString(16)];
				index.set(value, position);
				break;
			}
			case "object":
				if (value === null) {
					list[position] = value;
					index.set(value, position);
				} else if (Array.isArray(value)) {
					const arr: OsonArray = sparse(value.length);
					list[position] = arr;
					index.set(value, position);
					for (let i = 0; i < value.length; i += 1) {
						arr[i] = add(value[i]);
					}
				} else {
					const [label, vals] = fromObject(value, constructors);
					const len = vals.length;
					const arr = Array(len + 1) as OsonObject;
					arr[0] = label;
					list[position] = arr;
					index.set(value, position);
					for (let i = 0; i < len; i += 1) {
						arr[i + 1] = add(vals[i]);
					}
				}
				break;
			default:
		}

		return position;
	};

	add(value1);

	return list;
};

/**
 * Converts a Oson data back to a value. This will restore circular and repeated
 * references as well as undefined, sparse arrays, bigint, and all classes
 * instances defined by the constructor map.
 *
 * @param oson The Oson data to convert
 * @param constructors The constructor map to use for class instances
 * @returns The decoded value
 */
export function delistify(
	oson: Oson,
	constructors: ConstructorMap = GLOBAL_CONSTRUCTOR_MAP
): any {
	if (!Array.isArray(oson)) {
		const val1 = fromMagicNumber(oson);
		if (val1 !== null) {
			return val1;
		}
		throw new Error(`Invalid Oson: ${oson}`);
	}
	if (oson.length === 0) {
		throw new Error("Empty Oson data!");
	}
	const list = oson;
	const index = Array(oson.length);

	function recover(position: number) {
		const val2 = fromMagicNumber(position);
		if (val2 !== null) {
			return val2;
		}

		if (!(position in index)) {
			const value = list[position];
			switch (typeof value) {
				case "object":
					if (value !== null) {
						if (isOsonBigInt(value)) {
							const val = value[1];
							const num = val.startsWith("-")
								? -BigInt(`0x${val.substring(1)}`)
								: BigInt(`0x${val}`);
							index[position] = num;
						} else if (isOsonObject(value)) {
							const [label, ...vals] = value;
							const stub = stubObject(label, constructors);
							if (stub === undefined) {
								const v = vals.map(recover);
								const o = createObject(label, v, constructors);
								index[position] = o;
							} else {
								index[position] = stub;
								const v = vals.map(recover);
								hydrateObject(label, stub, v, constructors);
							}
						} else {
							const len = value.length;
							const array = Array(len);
							index[position] = array;
							for (let i = 0; i < len; i += 1) {
								const val = value[i];
								if (val !== ARRAY_HOLE_INDEX) {
									array[i] = recover(val);
								}
							}
						}
						break;
					}
				// fallthrough for null
				case "string":
				case "boolean":
				case "number":
					index[position] = value;
					break;
				default:
			}
		}

		return index[position];
	}

	recover(0);

	return index[0];
}

/**
 * Converts a value to string. This will preserve circular and repeated
 * references as well as undefined, sparse arrays, bigint, and all classes
 * instances defined by the constructor map.
 *
 * @param value The value to convert to string
 * @param constructors The constructor map to use for class instances
 * @returns The string containing the encoded value
 */
export function stringify(
	value: unknown = undefined,
	constructors: ConstructorMap = GLOBAL_CONSTRUCTOR_MAP
): string {
	return JSON.stringify(listify(value, constructors));
}

/**
 * Converts a string created using `stringify` back to a value. This will
 * restore circular and repeated references as well as undefined, sparse arrays,
 * bigint, and all classes instances defined by the constructor map.
 *
 * @param text The string containing the encoded value
 * @param constructors The constructor map to use for class instances
 * @returns The parsed value
 */
export function parse(
	text: string,
	constructors: ConstructorMap = GLOBAL_CONSTRUCTOR_MAP
): any {
	return delistify(JSON.parse(text), constructors);
}

/* eslint-disable no-sparse-arrays */
/* eslint-disable no-bitwise */
/* eslint-disable no-void */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { describe, it, assert } from "vitest";

import { parse, stringify, GLOBAL_CONSTRUCTOR_MAP } from "@deox/oson";

class CustomClass {
	constructor(
		public prop1: string,
		public prop2: { a: boolean; b: string[] }
	) {
		this.prop1 = prop1;
		this.prop2 = prop2;
	}
}

GLOBAL_CONSTRUCTOR_MAP.set(CustomClass, {
	from: (a) => [a.prop1, a.prop2] as const,
	create: ([prop1, prop2]) => new CustomClass(prop1, prop2)
});

function test<T>(value: T) {
	const stringified = stringify(value);
	const parsed = parse(stringified);
	assert.deepEqual(parsed, value);
}

describe("oson", () => {
	it("can work with numbers", () => {
		test(3);
		test(0);
		test(-1.3);
		test(NaN);
		test(Infinity);
		test(-Infinity);
	});
	it("can work with strings", () => {
		test("a");
		test("abc");
		test("");
	});
	it("can work with booleans", () => {
		test(true);
		test(false);
	});
	it("can work with nullish values", () => {
		test(undefined);
		test(void 0);
		test(null);
	});
	it("can work with bigints", () => {
		test(0n);
		test(-100n);
		test(523547235723763498657304658394876094765029746509275n);
		test(-(2n << 1024n));
	});
	it("can work with arrays", () => {
		test(["a", "b", "c"]);
		test([1, 2, 3]);
		test([]);
		test([-1]);
		test([0, ""]);
		test(JSON.parse('[{"__proto__":[]}, {}]'));
	});
	it("can work with sparse arrays", () => {
		test([]);
		test([, 1]);
		test([1, , 3]);
		test([1, , 3, , 4]);
	});
	it("can work with objects", () => {
		test({ a: 0 });
		test({ a: "b" });
		test({ a: 0, b: 1 });
		test({});
		test(JSON.parse('{"__proto__":0}'));
	});
	it("can work with nested objects", () => {
		test({ a: { b: 0 } });
		test({ a: ["", 0] });
		test({ a: 0, b: 1, c: [{ x: "a", y: ["b"] }] });
		test({ v: { w: {} } });
	});
	it("can work with built-in types", () => {
		const e = new Error("damn");
		const r = parse(stringify(e));
		assert.equal(e.name, r.name);
		assert.equal(e.message, r.message);
		assert.equal(e.stack, r.stack);
		assert.equal(e.cause, r.cause);
		test(new Uint8Array([3, 2, 1]));
		test(
			new Map([
				["a", "b"],
				["c", "d"],
				["e", "f"]
			])
		);
		test(new Set([..."hello oson"]));
		test([new Date(), new Date(Date.now() - 1000000)]);
		test([/asdf/, /jjj.+/gim]);
		test([new URL("file:///home/user/"), new URL("https://example.com/route")]);
	});
	it("can work with objects with circular references", () => {
		const obj: any = { a: { b: { c: 0 } } };
		obj.a.b.c = obj;
		test(obj);
		const left: any = { value: 0 };
		const right: any = { value: left };
		left.value = right;
		test([left, right]);
	});
	it("can work with objects with repeated references", () => {
		const inner = { a: { b: 42 } };
		const outer = { x: inner, y: inner };
		test(outer);
		const copy: typeof outer = parse(stringify(outer));
		copy.x.a.b += 1;
		assert.equal(copy.x, copy.y);
	});
	it("can work with custom classes", () => {
		const instance = new CustomClass("This is a custom class", {
			a: true,
			b: ["string at 0"]
		});
		test(instance);
		const copy: CustomClass = parse(stringify(instance));
		assert.instanceOf(copy, CustomClass);
		assert.equal(instance.prop1, copy.prop1);
		assert.deepEqual(instance.prop2, copy.prop2);
	});
	it("can work with super classes", () => {
		const e = new TypeError("parent");
		const r = parse(stringify(e));
		assert.instanceOf(r, Error);
		assert.equal(e.name, r.name);
		assert.equal(e.message, r.message);
		assert.equal(e.stack, r.stack);
		assert.equal(e.cause, r.cause);
	});
});

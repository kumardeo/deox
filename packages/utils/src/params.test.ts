import { describe, expect, test } from 'vitest';
import { deserialize, serialize } from './params';

describe('serialize', () => {
	test('serializes primitive values to URLSearchParams', () => {
		const params = serialize(
			{ a: 'hello', b: 123, c: true, d: null },
			new URLSearchParams(),
		);

		expect([...params.entries()]).toEqual([
			['a', 'hello'],
			['b', '123'],
			['c', 'true'],
			['d', ''],
		]);
	});

	test('ignores undefined values and serializes nested arrays and objects', () => {
		const value = {
			title: 'test',
			missing: undefined,
			tags: ['alpha', 'beta', null],
			metadata: {
				count: 2,
				active: false,
			},
		};

		const params = serialize(value, new URLSearchParams());

		expect([...params.entries()]).toEqual([
			['title', 'test'],
			['tags[]', 'alpha'],
			['tags[]', 'beta'],
			['tags[]', ''],
			['metadata[count]', '2'],
			['metadata[active]', 'false'],
		]);
	});

	test('serializes Date values as ISO strings', () => {
		const date = new Date('2025-12-01T10:15:30.000Z');
		const params = serialize({ createdAt: date }, new URLSearchParams());

		expect(params.get('createdAt')).toBe('2025-12-01T10:15:30.000Z');
	});

	test('serializes Blob values only to FormData', () => {
		const blob = new Blob(['hello'], { type: 'text/plain' });
		const formData = serialize({ file: blob }, new FormData());

		expect([...formData.entries()]).toHaveLength(1);
		expect((formData.get('file') as Blob).size).toBe(5);
		expect((formData.get('file') as Blob).type).toBe('text/plain');
		expect(() => serialize({ file: blob }, new URLSearchParams())).toThrow(
			TypeError,
		);
	});

	test('serializes arrays of objects into bracketed paths', () => {
		const params = serialize(
			{
				people: [
					{ name: 'alice', age: 30 },
					{ name: 'bob', age: 40 },
				],
			},
			new URLSearchParams(),
		);

		expect([...params.entries()]).toEqual([
			['people[][name]', 'alice'],
			['people[][age]', '30'],
			['people[][name]', 'bob'],
			['people[][age]', '40'],
		]);
	});

	test('serializes deeply nested arrays and objects with mixed values', () => {
		const params = serialize(
			{
				config: [
					{ name: 'alpha', values: [1, 2] },
					{ name: 'beta', values: [3] },
				],
				meta: {
					tags: ['x', 'y'],
					active: null,
				},
			},
			new URLSearchParams(),
		);

		expect([...params.entries()]).toEqual([
			['config[][name]', 'alpha'],
			['config[][values][]', '1'],
			['config[][values][]', '2'],
			['config[][name]', 'beta'],
			['config[][values][]', '3'],
			['meta[tags][]', 'x'],
			['meta[tags][]', 'y'],
			['meta[active]', ''],
		]);
	});

	test('serializes arrays of Blob values to FormData', () => {
		const blob1 = new Blob(['a'], { type: 'text/plain' });
		const blob2 = new Blob(['b'], { type: 'text/plain' });
		const formData = serialize({ attachments: [blob1, blob2] }, new FormData());

		const values = formData.getAll('attachments[]');

		expect(values).toHaveLength(2);
		expect(values[0]).toBeInstanceOf(Blob);
		expect(values[1]).toBeInstanceOf(Blob);
		expect((values[0] as Blob).size).toBe(1);
		expect((values[1] as Blob).size).toBe(1);
	});

	test('throws for non-plain object input with exact error text', () => {
		expect(() => serialize(new Date() as any, new URLSearchParams())).toThrow(
			new TypeError("Argument 'input' must be a plain object"),
		);
	});

	test('throws for invalid and reserved keys with exact error text', () => {
		const reserved = Object.defineProperty(Object.create(null), '__proto__', {
			value: 'x',
			enumerable: true,
		});

		expect(() => serialize({ '[a]': 'x' }, new URLSearchParams())).toThrow(
			new SyntaxError(
				"Invalid key segment '[a]': characters [ and ] are not allowed",
			),
		);
		expect(() => serialize({ 'a[b': 'x' }, new URLSearchParams())).toThrow(
			new SyntaxError(
				"Invalid key segment 'a[b': characters [ and ] are not allowed",
			),
		);
		expect(() => serialize(reserved as any, new URLSearchParams())).toThrow(
			new SyntaxError(
				"Disallowed key segment '__proto__': reserved prototype property",
			),
		);
		expect(() =>
			serialize({ a: { '[b]c]': 'x' } }, new URLSearchParams()),
		).toThrow(
			new SyntaxError(
				"Invalid key segment '[b]c]': characters [ and ] are not allowed",
			),
		);
		expect(() =>
			serialize(
				{
					a: Object.defineProperty({}, '__proto__', {
						value: 'x',
						enumerable: true,
					}),
				} as any,
				new URLSearchParams(),
			),
		).toThrow(
			new SyntaxError(
				"Disallowed key segment '__proto__': reserved prototype property",
			),
		);
	});

	test('throws for blob values when serializing to URLSearchParams with exact error text', () => {
		const blob = new Blob(['hello'], { type: 'text/plain' });

		expect(() => serialize({ file: blob }, new URLSearchParams())).toThrow(
			new TypeError("Key 'file': Blob values require FormData"),
		);
	});

	test('throws for unsupported nested value types with path context', () => {
		expect(() =>
			serialize({ a: { b: Symbol('x') as any } }, new URLSearchParams()),
		).toThrow(new TypeError("Key 'a[b]': unsupported value type"));
	});

	test('round-trips URLSearchParams serialization and deserialization', () => {
		const original = {
			user: 'alice',
			settings: {
				mode: 'dark',
				nested: [{ flag: true }, { flag: false }],
			},
			values: [10, 20, null],
			joinedAt: new Date('2026-01-01T00:00:00.000Z'),
		};

		const result = deserialize(serialize(original, new URLSearchParams()));

		expect(result).toEqual({
			user: 'alice',
			settings: {
				mode: 'dark',
				nested: [{ flag: true }, { flag: false }],
			},
			values: [10, 20, null],
			joinedAt: new Date('2026-01-01T00:00:00.000Z'),
		});
	});

	test('empty objects cannot round-trip through URLSearchParams', () => {
		const result = deserialize(
			serialize({ config: {} }, new URLSearchParams()),
		);

		expect(result).toEqual({});
		expect(result.config).toBeUndefined();
	});

	test('empty objects inside arrays cannot round-trip through URLSearchParams', () => {
		const result = deserialize(
			serialize({ items: [{}] }, new URLSearchParams()),
		);

		expect(result).toEqual({});
		expect(result.items).toBeUndefined();
	});
});

describe('deserialize', () => {
	test('deserializes primitive values from URLSearchParams', () => {
		const query = new URLSearchParams([
			['name', 'john'],
			['age', '28'],
			['active', 'true'],
			['verified', 'false'],
			['empty', ''],
			['joinedAt', '2025-02-14T12:00:00.000Z'],
		]);

		const result = deserialize(query);

		expect(result).toEqual({
			name: 'john',
			age: 28,
			active: true,
			verified: false,
			empty: null,
			joinedAt: new Date('2025-02-14T12:00:00.000Z'),
		});
	});

	test('deserializes repeated keys into arrays', () => {
		const query = new URLSearchParams([
			['colors', 'red'],
			['colors', 'green'],
			['colors', 'blue'],
		]);

		expect(deserialize(query)).toEqual({ colors: ['red', 'green', 'blue'] });
	});

	test('deserializes complex nested arrays and object arrays with booleans', () => {
		const query = new URLSearchParams([
			['users[][id]', '1'],
			['users[][name]', 'alice'],
			['users[][active]', 'true'],
			['users[][id]', '2'],
			['users[][name]', 'bob'],
			['users[][active]', 'false'],
			['settings[levels][]', '10'],
			['settings[levels][]', '20'],
		]);

		expect(deserialize(query)).toEqual({
			users: [
				{ id: 1, name: 'alice', active: true },
				{ id: 2, name: 'bob', active: false },
			],
			settings: { levels: [10, 20] },
		});
	});

	test('deserializes nested arrays and object arrays correctly', () => {
		const query = new URLSearchParams([
			['items[][id]', '1'],
			['items[][name]', 'first'],
			['items[][id]', '2'],
			['items[][name]', 'second'],
			['data[values][]', '10'],
			['data[values][]', '20'],
		]);

		expect(deserialize(query)).toEqual({
			items: [
				{ id: 1, name: 'first' },
				{ id: 2, name: 'second' },
			],
			data: { values: [10, 20] },
		});
	});

	test('deserializes FormData values and preserves Blobs', () => {
		const blob = new Blob(['abc'], { type: 'text/plain' });
		const formData = new FormData();

		formData.append('file', blob);
		formData.append('count', '5');

		const result = deserialize(formData);

		expect(result.count).toBe(5);
		expect(result.file).toBeInstanceOf(Blob);
		expect((result.file as Blob).size).toBe(3);
		expect((result.file as Blob).type).toBe('text/plain');
	});

	test('throws for invalid key syntax with exact error text', () => {
		expect(() => deserialize(new URLSearchParams([['[a]', 'x']]))).toThrow(
			new SyntaxError(
				"Invalid key '[a]': expected format is 'key', 'key[]', or 'key[segment]'",
			),
		);
		expect(() => deserialize(new URLSearchParams([['a][b', 'x']]))).toThrow(
			new SyntaxError(
				"Invalid key 'a][b': expected format is 'key', 'key[]', or 'key[segment]'",
			),
		);
		expect(() =>
			deserialize(new URLSearchParams([['data[__proto__]', 'x']])),
		).toThrow(
			new SyntaxError(
				"Disallowed key segment '__proto__': reserved prototype property",
			),
		);
		expect(() =>
			deserialize(new URLSearchParams([['a[b]', 'x']])),
		).not.toThrow();
	});

	test('throws on conflicting path types with exact error text', () => {
		expect(() =>
			deserialize(
				new URLSearchParams([
					['data[]', '1'],
					['data[key]', 'x'],
				]),
			),
		).toThrow(
			new TypeError(
				"Type conflict at segment 'data': expected object but found array",
			),
		);

		expect(() =>
			deserialize(
				new URLSearchParams([
					['list[key]', 'x'],
					['list[]', '1'],
				]),
			),
		).toThrow(
			new TypeError(
				"Type conflict at segment 'list': expected array but found object",
			),
		);
	});
});

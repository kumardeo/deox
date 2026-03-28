/* utilities types */
export type IfEquals<X, Y, A = X, B = never> = (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2 ? A : B;

export type PickWritable<T> = {
  [K in keyof T as IfEquals<{ [Q in K]: T[K] }, { -readonly [Q in K]: T[K] }, K, never>]: T[K];
};

export type PickOfType<O, T> = {
  [K in keyof O as O[K] extends T ? K : never]: O[K];
};

export type WritableKeys<T> = keyof PickWritable<T>;

export type KeysOfType<O, T> = keyof PickOfType<O, T>;

export type OmitOfType<O, T> = Omit<O, KeysOfType<O, T>>;

export type OmitFunction<T> = OmitOfType<T, (...args: any[]) => unknown>;

export type PickString<T> = PickOfType<T, string>;

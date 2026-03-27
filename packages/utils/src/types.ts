/* utilities types */
export type IfEquals<X, Y, A = X, B = never> = (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2 ? A : B;

export type WritableKeys<T> = {
  [P in keyof T]-?: IfEquals<{ [Q in P]: T[P] }, { -readonly [Q in P]: T[P] }, P>;
}[keyof T];

export type KeysOfType<O, T> = {
  [K in keyof O]: O[K] extends T ? K : never;
}[keyof O];

export type PickOfType<O, T> = Pick<O, KeysOfType<O, T>>;

export type OmitOfType<O, T> = Omit<O, KeysOfType<O, T>>;

export type OmitFunction<T> = OmitOfType<T, (...args: any[]) => unknown>;

export type PickString<T> = PickOfType<T, string>;

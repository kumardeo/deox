/* utils types */
export type Return<T extends (...args: any) => any> = ReturnType<T>;

export type Params<T extends (...args: any) => any> = Parameters<T>;

export type Await<T> = Awaited<T>;

export type Async<T> = Promise<Await<T>>;

export type AwaitFunc<T extends (...args: any[]) => any> = Await<Return<T>>;

export type MayBePromise<T> =
	T extends Promise<infer C> ? C | Promise<C> : T | Promise<T>;

export type Inc<T, U> = T extends U ? T : never;

export type Exc<T, U> = T extends U ? never : T;

export type PickProps<T, K> = { [P in Inc<keyof T, K>]: T[P] };

export type OmitProps<T, K> = { [P in Exc<keyof T, K>]: T[P] };

export type MethodsMap<
	T,
	I extends string | number | symbol = string | number,
	E extends string | number | symbol = never
> = OmitProps<
	PickProps<
		{
			[K in keyof T as T[K] extends (...args: any[]) => any
				? K
				: never]: T[K] extends (...args: any[]) => any
				? [Params<T[K]>, Return<T[K]>]
				: never;
		},
		I
	>,
	E
>;

/* worker types */
export type RegisterInput = (ctx?: any) => MayBePromise<NonNullable<object>>;

export type RegisterOutput<F extends RegisterInput> = (
	context: Params<F>[0]
) => {
	call<N extends keyof MethodsMap<AwaitFunc<F>>>(
		name: N,
		...args: MethodsMap<AwaitFunc<F>>[N][0]
	): Promise<Await<MethodsMap<AwaitFunc<F>>[N][1]>>;
};

export type InferFunction<R extends RegisterInput> =
	R extends RegisterOutput<infer F> ? F : never;

export type InferContext<R extends RegisterInput> = Params<InferFunction<R>>[0];

export type InferMethodsMap<R extends RegisterInput> = Omit<
	MethodsMap<AwaitFunc<InferFunction<R>>>,
	symbol
>;

export type InferProxyType<R extends RegisterInput> = {
	readonly [K in keyof InferMethodsMap<R>]: (
		...args: InferMethodsMap<R>[K][0]
	) => Promise<Await<InferMethodsMap<R>[K][1]>>;
};

export type InferWorkerOptions<R extends RegisterOutput<RegisterInput>> =
	InferContext<R> extends undefined | void
		?
				| (WorkerOptions & {
						context?: InferContext<R>;
						generate?: () => string;
				  })
				| undefined
		: WorkerOptions & {
				context: InferContext<R>;
				generate?: () => string;
			};

/* message types */
export type MessageWorkerInput =
	| {
			type: "context";
			context: unknown;
	  }
	| {
			type: "request";
			handler: string | number;
			arguments: unknown[];
	  };

export type MessageWorker = {
	id: string;
} & MessageWorkerInput;

export type MessageMainInput =
	| ({
			type: "context";
	  } & (
			| {
					status: "success";
			  }
			| {
					status: "error";
					error: Error;
			  }
	  ))
	| ({
			type: "response";
			handler: string | number;
	  } & (
			| {
					status: "success";
					body: any;
			  }
			| {
					status: "error";
					error: Error;
			  }
			| {
					status: "not-found";
			  }
	  ));

export type MessageMain = {
	id: string;
	timestamp: number;
} & MessageMainInput;

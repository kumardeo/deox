export interface WithOptions<T> {
	readonly result: T;
	readonly options: StructuredSerializeOptions | Transferable[];
}

export type MethodsMap<T> = {
	[K in Extract<keyof T, string | number> as T[K] extends (
		...args: any[]
	) => any
		? K
		: never]: T[K] extends (...args: any[]) => any
		? (
				...args: Parameters<T[K]>
			) => Promise<
				Awaited<
					Awaited<ReturnType<T[K]>> extends WithOptions<infer R>
						? R
						: ReturnType<T[K]>
				>
			>
		: never;
};

export type CallerType<M> = <N extends keyof MethodsMap<M>>(
	name: N,
	...args: Parameters<MethodsMap<M>[N]>
) => ReturnType<MethodsMap<M>[N]>;

export type RegisterInput<M extends NonNullable<object>, C> = (
	ctx: C,
) => M | Promise<M>;

export type RegisterOutput<M extends NonNullable<object>, C> = (ctx: C) => {
	call: CallerType<M>;
};

export type IsOptionalContext<C> = [C] extends [undefined]
	? true
	: [C] extends [never]
		? false
		: [unknown] extends [C]
			? true
			: false;

export type IWorkerOptions<C> = (WorkerOptions & {
	generate?: (message: MessageWorkerInput) => string;
}) &
	(IsOptionalContext<C> extends true ? { context?: C } : { context: C });

export type RequestOptions =
	| (StructuredSerializeOptions & {
			signal?: AbortSignal;
	  })
	| Transferable[];

export type InferMethods<R extends RegisterOutput<any, any>> =
	R extends RegisterOutput<infer M, any> ? M : never;

export type InferContext<R extends RegisterOutput<any, any>> =
	R extends RegisterOutput<any, infer C> ? C : never;

export type InferProxyType<R extends RegisterOutput<any, any>> = Readonly<
	MethodsMap<InferMethods<R>>
>;

export type InferWorkerOptions<R extends RegisterOutput<any, any>> =
	IWorkerOptions<InferContext<R>>;

/* message types */
export type MessageWorkerInput =
	| {
			type: 'context';
			context: unknown;
	  }
	| {
			type: 'request';
			handler: string | number;
			arguments: unknown[];
	  };

export type MessageWorker = {
	id: string;
} & MessageWorkerInput;

export type MessageMainInput =
	| ({
			type: 'context';
	  } & (
			| {
					status: 'success';
			  }
			| {
					status: 'error';
					error: Error;
			  }
	  ))
	| ({
			type: 'response';
			handler: string | number;
	  } & (
			| {
					status: 'success';
					body: unknown;
			  }
			| {
					status: 'error';
					error: Error;
			  }
			| {
					status: 'not-found';
			  }
	  ));

export type MessageMain = {
	id: string;
	timestamp: number;
} & MessageMainInput;

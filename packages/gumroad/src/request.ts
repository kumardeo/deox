import clc from "console-log-colors";
import { GumroadRequestError } from "./errors";

export interface RequestURLOptions {
	clearParams?: boolean;
	params?: Record<
		string,
		| string
		| number
		| boolean
		| undefined
		| (string | number | boolean | undefined)[]
	>;
}

export class RequestURL extends URL {
	constructor(
		url: string | URL,
		base?: string | URL | undefined,
		options: RequestURLOptions = {}
	) {
		super(url, base);
		const { searchParams } = this;
		if (options.clearParams) {
			searchParams.forEach((value, key, params) => {
				params.delete(key);
			});
		}
		const append = (
			key: string,
			value: string | number | boolean | undefined
		) => {
			if (["string", "boolean", "number"].includes(typeof value)) {
				searchParams.append(key, String(value));
			}
		};
		if (typeof options.params === "object" && options.params) {
			const queries = options.params;
			Object.keys(queries).forEach((key) => {
				const value = queries[key];
				if (Array.isArray(value)) {
					value.forEach((e) => append(key, e));
				} else {
					append(key, value);
				}
			});
		}
	}
}

export interface RequestOptions {
	params?: RequestURLOptions["params"];
	method?: string;
	body?: unknown;
	debug?: boolean;
	baseUrl?: string | RequestURL;
}

export const request = async <
	T extends NonNullable<unknown> = NonNullable<unknown>
>(
	path: string | RequestURL,
	accessToken?: string | null,
	{
		method = "GET",
		params = {},
		body,
		debug = false,
		baseUrl = "https://api.gumroad.com/v2/"
	}: RequestOptions = {}
): Promise<{ data: T & { success: true }; response: Response }> => {
	const endpoint = new RequestURL(path, baseUrl, {
		params: {
			...params,
			...(accessToken ? { access_token: accessToken } : undefined)
		}
	});

	const config: RequestInit = {
		method,
		body: body ? JSON.stringify(body) : undefined,
		headers: {
			Accept: "application/json",
			"Content-Type": "application/json"
		}
	};

	const started = debug ? Date.now() : null;

	const response = await fetch(endpoint, config).catch((error) => {
		throw new GumroadRequestError("Fetch to Gumroad API failed", {
			cause: error
		});
	});

	if (started !== null) {
		let coloredStatus = `${clc.bold(response.status)} ${response.statusText}`;
		if (response.status >= 200 && response.status <= 299) {
			coloredStatus = clc.green(coloredStatus);
		} else if (response.status >= 300 && response.status <= 399) {
			coloredStatus = clc.yellow(coloredStatus);
		} else if (response.status >= 400) {
			coloredStatus = clc.red(coloredStatus);
		}
		// eslint-disable-next-line no-console
		console.log(
			`${clc.green("[gumroad:info]")} ${clc.bold(method)} ${endpoint.pathname} ${coloredStatus} ${clc.dim(`(${Date.now() - started}ms)`)}`
		);
	}

	if (response.headers.get("Content-Type")?.includes("application/json")) {
		const data: unknown = await response.json();
		if (typeof data === "object" && data) {
			if ("success" in data) {
				if (data.success === true && response.status === 200) {
					return { data: data as T & { success: true }, response };
				}

				if (
					data.success === false &&
					"message" in data &&
					typeof data.message === "string"
				) {
					throw new GumroadRequestError(data.message, { response });
				}
			}

			if ("error" in data && typeof data.error === "string") {
				throw new GumroadRequestError(data.error, { response });
			}
		}

		throw new GumroadRequestError(
			`Invalid Gumroad Response body: ${JSON.stringify(data)}`,
			{ response }
		);
	}

	if (response.status === 401) {
		throw new GumroadRequestError(
			`Gumroad responded with '${response.statusText}' status text, please make sure you have passed a valid Access Token!`,
			{ response }
		);
	}

	if (response.status === 402) {
		throw new GumroadRequestError(
			`Gumroad responded with '${response.statusText}' status text, looks like the parameters were valid but request failed.`,
			{ response }
		);
	}

	if ([500, 502, 503, 504].includes(response.status)) {
		throw new GumroadRequestError(
			`Gumroad responded with '${response.statusText}' status text, looks like something else went wrong on endpoint.`,
			{ response }
		);
	}

	throw new GumroadRequestError(
		`Response content type is not 'application/json'`,
		{ response }
	);
};

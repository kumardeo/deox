# pjax-navigate

Framework-agnostic client-side navigation for multi-page apps (MPA), powered by the [View Transitions API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API).

Intercepts same-origin link clicks and form submissions, fetches the next page, and swaps the document in place — giving a server-rendered site SPA-like navigation without a client-side framework. Browsers without View Transitions support get an animated or instant fallback.

> [!NOTE]
> Inspired by and adapted from [Astro](https://astro.build/)'s [`<ClientRouter />`](https://docs.astro.build/en/guides/view-transitions/) (view transitions router), decoupled from Astro so it can be used with any server-rendered HTML.

## Features

- Soft navigation for links (`<a>`, `<area>`, SVG `<a>`) and forms (`GET` and `POST`)
- Native view transitions, with an `animate` / `swap` / `none` fallback for other browsers
- Back / forward support with scroll restoration
- Persistent elements across navigations (state, focus, media playback and `<canvas>` contexts are kept)
- Re-executes new scripts after a swap, with opt-in re-running of already executed ones
- Link prefetching with `tap`, `hover`, `viewport` and `load` strategies
- Lifecycle events to customize loading and swapping
- Announces the new page title to screen readers

## Installation

```shell
npm install pjax-navigate
```

## Usage

Opt a page in by adding the `pjax:enabled` meta tag. Navigation only happens between pages that **both** have it; anything else falls back to a regular full page load.

```html
<head>
  <meta name="pjax:enabled" />
</head>
```

Initialize the navigator once on the client:

```ts
import { initializeNavigator } from "pjax-navigate";

initializeNavigator();
```

Navigate programmatically:

```ts
import { navigate } from "pjax-navigate";

await navigate("/about");
await navigate("/search?q=pjax", { history: "replace" });
```

### Options

```ts
initializeNavigator({
  // Treat the environment as server-side (no-op). Defaults to `typeof window === "undefined"`.
  ssr: false,
  // Enables dev-only behaviour: debug logs, Vite / Vue / Svelte dev style handling.
  dev: false,
  // Enables link prefetching (see "Prefetching").
  prefetch: false,
  // In dev mode, collect client-only styles of the next page before swapping.
  styles: true,
  // Custom fetch used for navigations and prefetching.
  fetch: (url, { prefetch, ...init }) => fetch(url, init),
});
```

### `navigate(href, options?)`

| Option          | Type                              | Description                                                  |
| --------------- | --------------------------------- | ------------------------------------------------------------ |
| `history`       | `"auto"` \| `"push"` \| `"replace"` | How to update the history. Defaults to pushing a new entry. |
| `state`         | `any`                             | Extra state stored in the history entry.                     |
| `info`          | `any`                             | Arbitrary data passed to the navigation events.              |
| `formData`      | `FormData`                        | Sends a `POST` request with this body.                       |
| `sourceElement` | `Element`                         | The element that triggered the navigation.                   |

## Attributes

| Attribute                   | On                | Description                                                                                       |
| --------------------------- | ----------------- | ------------------------------------------------------------------------------------------------- |
| `data-pjax-persist="<id>"`  | any element       | Keeps the element (and its state) across navigations when the next page has a matching id.       |
| `data-pjax-reload`          | `<a>`, `<form>`   | Skips soft navigation and lets the browser do a full page load.                                   |
| `data-pjax-history="replace"` | `<a>`           | Replaces the current history entry instead of pushing a new one.                                  |
| `data-pjax-rerun`           | `<script>`        | Re-executes the script on every navigation, even if it already ran.                               |
| `data-pjax-prefetch="<strategy>"` | `<a>`       | Prefetches the link using `tap`, `hover`, `viewport` or `load`. An empty value uses `hover`; `"false"` opts out. |

The navigator also sets these on `<html>` during a navigation, which you can use in your CSS:

| Attribute              | Values                 | Description                                         |
| ---------------------- | ---------------------- | --------------------------------------------------- |
| `data-pjax-transition` | `forward` \| `back`    | Direction of the current navigation.                |
| `data-pjax-fallback`   | `old` \| `new`         | Phase of the fallback animation (non-supporting browsers). |

## Fallback

In browsers without the View Transitions API, the behaviour is controlled per page with the `pjax:fallback` meta tag:

```html
<meta name="pjax:fallback" content="animate" />
```

- `animate` (default) — runs animations triggered by `[data-pjax-fallback="old"]` and `[data-pjax-fallback="new"]` on `<html>`, waiting for them to finish before and after the swap.
- `swap` — swaps the page without animations.
- `none` — disables soft navigation; the browser does full page loads.

```css
html[data-pjax-fallback="old"] main {
  animation: fade-out 150ms ease-out both;
}
html[data-pjax-fallback="new"] main {
  animation: fade-in 150ms ease-in both;
}
```

## Events

All events are dispatched on `document` and are fully typed through `DocumentEventMap`.

| Event                     | Event type                         | When                                                         |
| ------------------------- | ---------------------------------- | ------------------------------------------------------------ |
| `pjax:before-preparation` | `TransitionBeforePreparationEvent` | Before the next page is fetched. Cancelable.                 |
| `pjax:after-preparation`  | `Event`                            | After the next page is fetched and parsed.                   |
| `pjax:before-swap`        | `TransitionBeforeSwapEvent`        | Before the document is swapped, inside the view transition.  |
| `pjax:after-swap`         | `Event`                            | Right after the swap, before new scripts run.                |
| `pjax:page-load`          | `Event`                            | After scripts ran, and on the initial page load.             |

Override the loader, e.g. to show a progress bar or change the destination:

```ts
document.addEventListener("pjax:before-preparation", (event) => {
  const originalLoader = event.loader;
  event.loader = async () => {
    showSpinner();
    await originalLoader();
    hideSpinner();
  };
});
```

Customize the swap, e.g. to keep the current theme:

```ts
document.addEventListener("pjax:before-swap", (event) => {
  event.newDocument.documentElement.dataset.theme =
    document.documentElement.dataset.theme;
});
```

Run setup code on every page:

```ts
document.addEventListener("pjax:page-load", () => {
  setupMenu();
});
```

Calling `event.preventDefault()` on `pjax:before-preparation` falls back to a full page load.

## Prefetching

With `prefetch: true`, links marked with `data-pjax-prefetch` are prefetched on the chosen strategy:

```html
<a href="/blog" data-pjax-prefetch>Blog</a> <!-- hover -->
<a href="/docs" data-pjax-prefetch="viewport">Docs</a>
<a href="/pricing" data-pjax-prefetch="load">Pricing</a>
```

Prefetching is skipped when offline, on data saver or 2G connections (except for `tap`), for cross-origin URLs and for the current page.

## Credits

This package is based on the view transitions router from [Astro](https://github.com/withastro/astro) — licensed under MIT, Copyright (c) 2021–present Astro. See [LICENSE.md](./LICENSE.md).

## License

[MIT](./LICENSE.md)

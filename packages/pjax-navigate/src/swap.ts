import { getConfig } from './config';
import {
	DIRECTION_ATTR,
	EXECUTED_ATTR,
	FALLBACK_ATTR,
	PERSIST_ATTR,
	RERUN_ATTR,
	VITE_DEV_ID_ATTR,
} from './constants';
import type { SavedFocus } from './types';

const NON_OVERRIDABLE_ATTRS = [DIRECTION_ATTR, FALLBACK_ATTR];

const executedSources = new Set<string>();
const executedContents = new Set<string>();
const executedIds = new Set<string>();
export function detectScriptExecuted(script: HTMLScriptElement): boolean {
	if (script.src) {
		const source = new URL(script.src, location.href).href;
		if (executedSources.has(source)) {
			return true;
		}
		executedSources.add(source);
		return false;
	}

	if (script.id) {
		const id = script.id;
		if (executedIds.has(id)) {
			return true;
		}
		executedIds.add(id);
		return false;
	}

	const content = script.textContent;
	if (executedContents.has(content)) {
		return true;
	}
	executedContents.add(content);
	return false;
}

const JS_MIME_TYPE_ESSENCES = [
	'text/javascript',
	'application/javascript',
	'text/ecmascript',
	'application/ecmascript',
];

export function isExecutableScript(script: HTMLScriptElement): boolean {
	const type = script.getAttribute('type')?.trim().toLowerCase();

	if (!type) {
		return true; // classic script, default
	}

	if (type === 'module') {
		return true; // module script
	}

	// strip any "; charset=..." style params before matching the essence
	const essence = type.split(';', 1)[0].trim();

	return JS_MIME_TYPE_ESSENCES.includes(essence);
}

/*
 * Mark new scripts that should not execute
 */
function deselectScripts(doc: Document): void {
	for (const script of Array.from(doc.getElementsByTagName('script'))) {
		if (
			isExecutableScript(script) &&
			// Check if the script should be rerun regardless of it being the same
			!script.hasAttribute(RERUN_ATTR) &&
			// Check if the script has already been executed
			detectScriptExecuted(script)
		) {
			// the old script is in the new document and doesn't have the rerun attribute
			// we mark it as executed to prevent re-execution
			script.setAttribute(EXECUTED_ATTR, '');
		}
	}
}

// Vite's CSS HMR runtime keeps references to the style nodes it injects, so preserve
// those nodes across ClientRouter head swaps. https://github.com/withastro/astro/pull/17612
let $viteStyleState: {
	styles: Map<string, HTMLStyleElement>;
	observe: () => void;
} | null = null;
function getViteStyleState() {
	const { isDev } = getConfig();

	if (!isDev) {
		return null;
	}

	if (!$viteStyleState) {
		const styles = new Map<string, HTMLStyleElement>();
		let observer: MutationObserver | undefined;

		const observe = (): void => {
			if (observer) {
				return;
			}
			observer = new MutationObserver((records) => {
				for (const record of records) {
					for (const node of record.addedNodes) {
						if (!(node instanceof HTMLStyleElement)) {
							continue;
						}
						const viteDevId = node.getAttribute(VITE_DEV_ID_ATTR);
						if (!viteDevId) {
							continue;
						}
						const knownStyle = styles.get(viteDevId);
						if (node === knownStyle) {
							continue;
						}

						// ClientRouter appends the fetched style before Vite injects the node
						// registered for HMR. Replace it and track Vite's node instead.
						knownStyle?.remove();
						styles.set(viteDevId, node);
					}
				}
			});
			observer.observe(document.head, { childList: true });
		};

		$viteStyleState = { styles, observe };
	}

	return $viteStyleState;
}

/*
 * swap attributes of the html element
 * delete all attributes from the current document
 * insert all attributes from doc
 * reinsert all original attributes that are referenced in NON_OVERRIDABLE_ATTRS'
 */
function swapRootAttributes(newDoc: Document): void {
	const currentRoot = document.documentElement;
	const nonOverridableAttributes = Array.from(currentRoot.attributes).filter(
		({ name }) => {
			currentRoot.removeAttribute(name);
			return NON_OVERRIDABLE_ATTRS.includes(name);
		},
	);
	for (const { name, value } of [
		...newDoc.documentElement.attributes,
		...nonOverridableAttributes,
	]) {
		currentRoot.setAttribute(name, value);
	}
}

/*
 * make the old head look like the new one
 */
function swapHeadElements(newDoc: Document): void {
	const { isDev } = getConfig();

	for (const child of Array.from(document.head.childNodes)) {
		if (!(child instanceof Element)) {
			child.remove();
			continue;
		}

		const newChild = persistedHeadElement(child as HTMLElement, newDoc);

		// If the element exists in the document already, remove it
		// from the new document and leave the current node alone.
		// Elements with an empty persist attribute are always kept.
		if (newChild) {
			newChild.remove();
		} else if (child.getAttribute(PERSIST_ATTR) !== '') {
			if (isDev && child instanceof HTMLStyleElement) {
				const viteDevId = child.getAttribute(VITE_DEV_ID_ATTR);
				if (viteDevId) {
					getViteStyleState()?.styles.set(viteDevId, child);
				}
			}
			// If the element does not exist in the new document, remove the element from the current head.
			child.remove();
		}
	}

	// Everything left in the new head is new, append it all.
	for (const child of Array.from(newDoc.head.childNodes)) {
		if (child.nodeType === Node.COMMENT_NODE) {
			document.head.appendChild(child);
			continue;
		}

		if (!(child instanceof Element)) {
			continue;
		}

		if (isDev) {
			const viteDevId =
				child instanceof HTMLStyleElement
					? child.getAttribute(VITE_DEV_ID_ATTR)
					: null;
			const knownStyle = viteDevId
				? getViteStyleState()?.styles.get(viteDevId)
				: undefined;

			if (knownStyle) {
				// Generated styles such as UnoCSS can keep the same Vite ID while their CSS changes
				// between routes, so copy the incoming CSS into the style element Vite uses for HMR.
				// https://github.com/withastro/astro/pull/16242
				// Vue scoped styles are excluded because their content may be transformed in the browser.
				if (!vueScopedStyleId(knownStyle)) {
					knownStyle.textContent = child.textContent;
				}
				document.head.append(knownStyle);
			} else {
				if (viteDevId) {
					getViteStyleState()?.styles.set(viteDevId, child as HTMLStyleElement);
					getViteStyleState()?.observe();
				}
				document.head.append(child);
			}
		} else {
			document.head.appendChild(child);
		}
	}
}

function swapBodyElement(newDoc: Document): void {
	const newBody = newDoc.body;
	const oldBody = document.body;
	const docEl = document.documentElement;

	// Lift persist elements to <html> before the body swap so they stay in the DOM
	// throughout replaceWith(). This prevents Safari from losing WebGL context on
	// <canvas> elements due to brief DOM detachment. Uses moveBefore() where available
	// (Chrome 133+) for zero-detachment atomic moves.
	const persistPairs: { old: Element; newTarget: Element }[] = [];

	// Media that are live right now. The only way for one of these nodes to end up in
	// the new body is the persist transfer below (a matched `transition:persist`
	// element moves with its whole subtree — so this also covers media inside an inner
	// persist container that has no counterpart on the new page, and the attribute
	// placed on the media element itself). Such nodes were never inert and must keep
	// their identity and playback state; see reifyMediaElements().
	const liveMedia = new Set<Element>(oldBody.querySelectorAll('video, audio'));

	// moveBefore() is not yet in TypeScript's DOM lib, feature-detect and wrap.
	const moveBefore:
		| ((parent: Node, node: Node, child: Node | null) => void)
		| null =
		typeof docEl.moveBefore === 'function'
			? (parent, node, child) => (parent as Element).moveBefore(node, child)
			: null;

	for (const el of oldBody.querySelectorAll(`[${PERSIST_ATTR}]`)) {
		const persistId = el.getAttribute(PERSIST_ATTR);
		if (!persistId) {
			continue;
		}
		const newEl = newBody.querySelector(`[${PERSIST_ATTR}="${persistId}"]`);
		if (!newEl) {
			continue; // no matching target — leave in old body to be discarded
		}
		persistPairs.push({ old: el, newTarget: newEl });
		if (moveBefore) {
			moveBefore(docEl, el, null);
		} else {
			docEl.appendChild(el);
		}
	}

	// this will reset scroll Position
	oldBody.replaceWith(newBody);

	// Move persist elements into the new body at the position of their targets
	for (const { old: el, newTarget } of persistPairs) {
		if (moveBefore) {
			moveBefore(newTarget.parentNode as Node, el, newTarget);
			newTarget.remove();
		} else {
			newTarget.replaceWith(el);
		}
	}

	// This will upgrade any Declarative Shadow DOM in the new body.
	attachShadowRoots(newBody);

	// Re-create media elements so the browser initialises their media stack.
	// DOMParser produces elements in an inert document where <video>/<audio>
	// never get a media controller; moving them into the live DOM does not
	// retroactively initialise one, leaving controls disabled. Replacing each
	// element with a fresh copy created via document.createElement() forces
	// the browser to set up playback.
	// Media carried over from the previous page were never inert: they are the live
	// nodes of the old body, and re-creating them would destroy their playback state.
	reifyMediaElements(newBody, liveMedia);
}

/**
 * Attach Shadow DOM roots for templates with the declarative `shadowrootmode` attribute.
 * @see https://github.com/withastro/astro/issues/14340
 * @see https://web.dev/articles/declarative-shadow-dom#polyfill
 * @param root DOM subtree to attach shadow roots within.
 */
function attachShadowRoots(root: Element | ShadowRoot): void {
	for (const template of root.querySelectorAll<HTMLTemplateElement>(
		'template[shadowrootmode]',
	)) {
		const mode = template.getAttribute('shadowrootmode');
		const parent = template.parentNode;
		if (
			(mode === 'closed' || mode === 'open') &&
			parent instanceof HTMLElement
		) {
			// Skip if shadow root already exists (e.g., from transition-persisted elements)
			if (parent.shadowRoot) {
				template.remove();
				continue;
			}
			const shadowRoot = parent.attachShadow({ mode });
			shadowRoot.appendChild(template.content);
			template.remove();
			attachShadowRoots(shadowRoot);
		}
	}
}

/**
 * Replace media elements with fresh copies created in the live document.
 * Elements parsed by DOMParser originate from an inert document where the browser
 * never initialises the media stack, leaving controls disabled after a view-transition
 * swap. Creating a fresh element via `document.createElement()` and copying attributes
 * and children forces proper initialisation.
 * Elements in `liveMedia` are skipped: they were already live in the old document and
 * reached the new body through `transition:persist` — replacing them would reset
 * `currentTime`/`paused` and drop listeners and framework refs.
 */
function reifyMediaElements(root: Element, liveMedia: ReadonlySet<Element>) {
	for (const media of root.querySelectorAll<
		HTMLVideoElement | HTMLAudioElement
	>('video, audio')) {
		if (liveMedia.has(media)) {
			continue;
		}

		const fresh = document.createElement(media.localName);
		for (const attr of media.attributes) {
			fresh.setAttribute(attr.name, attr.value);
		}
		fresh.innerHTML = media.innerHTML;
		// Chrome only syncs the muted IDL property from the content attribute when the
		// HTML parser creates the element; setAttribute('muted', ...) on a script-created
		// element leaves video.muted === false. https://github.com/withastro/astro/issues/18152
		if (fresh.hasAttribute('muted')) {
			(fresh as HTMLMediaElement).muted = true;
		}
		media.replaceWith(fresh);
	}
}

function saveFocus(): () => void {
	const activeElement = document.activeElement as HTMLElement;
	// The element that currently has the focus is part of a DOM tree
	// that will survive the transition to the new document.
	// Save the element and the cursor position
	// Empty persist attributes are ignored in the body
	if (activeElement?.closest(`[${PERSIST_ATTR}]:not([${PERSIST_ATTR}=""])`)) {
		if (
			activeElement instanceof HTMLInputElement ||
			activeElement instanceof HTMLTextAreaElement
		) {
			const start = activeElement.selectionStart;
			const end = activeElement.selectionEnd;
			return () => restoreFocus({ activeElement, start, end });
		}
		return () => restoreFocus({ activeElement });
	}
	return () => restoreFocus({ activeElement: null });
}

function restoreFocus({ activeElement, start, end }: SavedFocus): void {
	if (activeElement) {
		activeElement.focus();
		if (
			activeElement instanceof HTMLInputElement ||
			activeElement instanceof HTMLTextAreaElement
		) {
			if (typeof start === 'number') {
				activeElement.selectionStart = start;
			}
			if (typeof end === 'number') {
				activeElement.selectionEnd = end;
			}
		}
	}
}

function vueScopedStyleId(style: HTMLStyleElement): string | null {
	const viteDevId = style.getAttribute(VITE_DEV_ID_ATTR);

	if (viteDevId) {
		const url = new URL(viteDevId, location.href);
		if (
			url.searchParams.get('vue') !== null &&
			url.searchParams.get('type') === 'style' &&
			url.searchParams.has('scoped')
		) {
			return viteDevId;
		}
	}

	return null;
}

// Check for a head element that should persist and returns it,
// either because it has the data attribute or because replacing it would cause avoidable FOUC.
function persistedHeadElement(
	el: HTMLElement,
	newDoc: Document,
): Element | null {
	const { isDev } = getConfig();

	const persistId = el.getAttribute(PERSIST_ATTR);

	if (persistId) {
		const newEl = newDoc.head.querySelector(`[${PERSIST_ATTR}="${persistId}"]`);
		if (newEl) {
			return newEl;
		}
	}

	if (el.matches('link[rel=stylesheet]')) {
		const href = el.getAttribute('href');
		return href
			? newDoc.head.querySelector(`link[rel=stylesheet][href="${href}"]`)
			: null;
	}

	// In dev mode, Vite injects <style data-vite-dev-id="..."> elements whose
	// textContent may later be transformed (especially Vue's `:deep()` → `[data-v-xxx]`).
	// Match these by their stable dev ID so the already-transformed style is preserved
	// across ClientRouter soft navigations instead of being replaced by the raw version.
	// There are other ids that can't be preserved and need a refresh, like Uno's /__uno.css,
	// which keeps the same id, but with different contents.
	// To avoid enumerating all exceptions, we only apply the auto-persist logic to elements
	// that look like Vue's dev styles.
	if (isDev && el instanceof HTMLStyleElement) {
		const viteDevId = vueScopedStyleId(el);
		if (viteDevId) {
			return newDoc.head.querySelector(
				`style[${VITE_DEV_ID_ATTR}="${viteDevId}"]`,
			);
		}
	}

	// Preserve inline <style> elements with identical content across navigations.
	// This prevents unnecessary removal and re-insertion of styles (e.g. @font-face
	// declarations from <Font>), which would cause the browser to re-evaluate them
	// and trigger a flash of unstyled text (FOUT).
	if (el.tagName === 'STYLE' && el.textContent) {
		const styles = newDoc.head.querySelectorAll('style');
		for (const s of styles) {
			if (s.textContent === el.textContent) {
				return s;
			}
		}
	}

	// Preserve font preload links across navigations to avoid re-fetching cached fonts.
	if (el.matches('link[rel=preload][as=font]')) {
		const href = el.getAttribute('href');
		return href
			? newDoc.head.querySelector(`link[rel=preload][as=font][href="${href}"]`)
			: null;
	}

	return null;
}

export const swapFunctions = {
	deselectScripts,
	swapRootAttributes,
	swapHeadElements,
	swapBodyElement,
	saveFocus,
};

export function swap(doc: Document): void {
	deselectScripts(doc);
	swapRootAttributes(doc);
	swapHeadElements(doc);
	const restoreFocusFunction = saveFocus();
	swapBodyElement(doc);
	restoreFocusFunction();
}

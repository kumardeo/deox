import { BloggerFeed } from './blogger-feed';

const GLOBAL_NAME = 'BloggerFeed';

const getGlobalObject = () => (typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : self);

(getGlobalObject() as unknown as { [GLOBAL_NAME]: typeof BloggerFeed })[GLOBAL_NAME] = BloggerFeed;

import { BloggerFeed } from './blogger-feed';

const getGlobalObject = () => (typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : self);

const GLOBAL_NAME = 'BloggerFeed';

(getGlobalObject() as unknown as { [GLOBAL_NAME]: typeof BloggerFeed })[GLOBAL_NAME] = BloggerFeed;

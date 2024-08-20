import { Gumroad } from './gumroad';

const getGlobalObject = () => (typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : self);

const GLOBAL_NAME = 'Gumroad';

(getGlobalObject() as unknown as { [GLOBAL_NAME]: typeof Gumroad })[GLOBAL_NAME] = Gumroad;

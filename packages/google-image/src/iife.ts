import { GoogleImage } from '.';

const GLOBAL_NAME = 'GoogleImage';

const getGlobalObject = () => (typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : self);

(getGlobalObject() as unknown as { [GLOBAL_NAME]: typeof GoogleImage })[GLOBAL_NAME] = GoogleImage;

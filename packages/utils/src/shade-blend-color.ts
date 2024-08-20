import shadeBlendColor from 'shade-blend-color';

// The declaration file is not correct
export const pSBC = (shadeBlendColor as unknown as { default: typeof shadeBlendColor }).default;

// magic numbers for values
/** internal magic number representing undefined */
export const UNDEFINED_INDEX = -1;

/** internal magic number representing an array hole */
export const ARRAY_HOLE_INDEX = -2;

/** internal magic number representing NaN */
export const NAN_INDEX = -3;

/** internal magic number representing Infinity */
export const POS_INF_INDEX = -4;

/** internal magic number representing -Infinity */
export const NEG_INF_INDEX = -5;

// magic numbers for oson list type labels
/** internal magic number labelling a bigint */
export const BIG_INT_LABEL = -6;

/** label for plain JS object types */
export const PLAIN_OBJECT_LABEL = '';

/** container to get on demand props */
export const CONTAINER: {
  /** text encoder */
  enc: TextEncoder;
  _enc?: TextEncoder;

  /** text decoder */
  dec8: TextDecoder;
  _dec8?: TextDecoder;
} = {
  get enc() {
    this._enc ??= new TextEncoder();
    return this._enc;
  },

  get dec8() {
    this._dec8 ??= new TextDecoder('utf-8');
    return this._dec8;
  },
};

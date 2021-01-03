import { extractIndexNGramsFromDoc } from "./ngramsIndex";
import { base64 } from "./../util/base64.jsx";

import { TNode, TNodeAttrs } from "./../smugler/types.jsx";
import { TDoc } from "./../doc/types.jsx";

const uuid = require("uuid");

export function extractDocAttrs(doc: TDoc): TNodeAttrs {
  const ngrams = [...extractIndexNGramsFromDoc(doc)];

  return {
    ngrams: ngrams,
    // Just a pinch of salt to make sure that every time attributes are different
    salt: uuid.v1(),
  };
}
import { extractIndexNGramsFromDoc } from "./ngramsIndex";

const uuid = require("uuid");

/**
 * Node attrs:
 *  - ngrams
 */

function toBase64(s) {
  return btoa(s);
}

function fromBase64(a) {
  return atob(a);
}

export function packAttrs(attrs) {
  if (!attrs) {
    return null;
  }
  console.log("Doc attrs", attrs);
  // return base64js.fromByteArray(JSON.stringify(attrs));
  return toBase64(JSON.stringify(attrs));
}

export function unpackAttrs(attrsStr) {
  try {
    return JSON.parse(fromBase64(attrsStr));
  } catch (err) {
    console.error("Attribute unpack error: ", err);
  }
  return {};
}

export function packDocAttrs(doc) {
  const ngrams = [...extractIndexNGramsFromDoc(doc)];

  // Just a pinch of salt
  const [value0, key0, key1, key2, value1] = uuid.v4().split("-");

  return packAttrs({
    ngrams: ngrams,
    [key0]: value0.slice(1, 5),
    [key1]: value1.slice(0, 2),
    [key2]: value1.slice(3, 8),
  });
}

export const kAttrsHeaderKey = "x-node-attrs";

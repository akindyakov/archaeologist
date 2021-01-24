import { TDoc, TChunk } from "./types";

import { makeChunk } from "./chunk_util.jsx";
import { parseRawSource } from "./mdRawParser.jsx";

export function exctractDocTitle(doc: TDoc | string): string {
  if ("chunks" in doc) {
    if (doc.chunks.length > 0) {
      return _makeTitleFromRaw(doc.chunks[0].source);
    }
    let i = 0;
    for (i in doc.chunks) {
      const trimed = doc.chunks[0].source.time();
      if (trimed.length > 0) {
        return _makeTitleFromRaw(trimed);
      }
    }
    // For an empty doc
    return "(empty)";
  } else {
    return _makeTitleFromRaw(doc);
  }
}

function _makeTitleFromRaw(source: string): string {
  const title = source
    .slice(0, 48)
    .replace("\n", " ")
    // Replace markdown links with title of the link
    .replace(/\[([^\]]+)\][^\)]+\)/g, "$1")
    .replace(/^[# ]+/, "");
  return title + "\u2026";
}

export function markAsACopy(doc: TDoc | string, nid: string): TDoc {
  if (typeof doc === "string") {
    doc = parseRawSource(doc);
  }
  let title = exctractDocTitle(doc);
  let clonedBadge: TChunk = makeChunk(
    '_[copy of "' + title + '"](' + nid + ")_"
  );
  doc.chunks.unshift(clonedBadge);
  return doc;
}

export function extractDocAsMarkdown(doc: TDoc): string {
  if (typeof doc === "string") {
    return doc;
  }
  return doc.chunks
    .reduce((acc, current) => {
      return acc + "\n\n" + current.source;
    }, "")
    .trim();
}

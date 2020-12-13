const storage = require("local-storage");

const kNidList = "--nids";

export function storeAll(nidToNgramsIndex) {
  var nids = [];
  nidToNgramsIndex.forEach((item) => {
    const nid = item.nid;
    nids.push(nid);
    storage.set(nid, item);
  });
  storage.set(kNidList, nids);
}

export function storeOne(nid, ngrams) {
  var nids = storage.get(kNidList) || [];
  if (!nids.includes(nid)) {
    nids.push(nid);
  }
  storage.set(kNidList, nids);
  storage.set(nid, {
    nid: nid,
    ngrams: Array.from(ngrams),
    upd: Math.floor(Date.now() / 1000),
  });
}

export function loadAll() {
  const nids = storage.get(kNidList);
  var nidToNgramsIndex = [];
  if (nids) {
    nids.forEach((nid) => {
      const item = storage.get(nid);
      nidToNgramsIndex.push(item);
    });
  }
  return nidToNgramsIndex;
}
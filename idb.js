'use strict';
const IDB = (() => {
  const DB_NAME = 'glade';
  const DB_VER  = 1;
  const STORE   = 'entries';

  function open() {
    return new Promise((res, rej) => {
      const req = indexedDB.open(DB_NAME, DB_VER);
      req.onupgradeneeded = e => e.target.result.createObjectStore(STORE, { keyPath: 'date' });
      req.onsuccess = e => res(e.target.result);
      req.onerror   = e => rej(e.target.error);
    });
  }

  function tx(mode, fn) {
    return open().then(db => new Promise((res, rej) => {
      const t = db.transaction(STORE, mode);
      t.oncomplete = () => db.close();
      t.onerror    = e => { db.close(); rej(e.target.error); };
      fn(t.objectStore(STORE), res, rej);
    }));
  }

  function getAllEntries() {
    return tx('readonly', (st, res, rej) => {
      const req = st.getAll();
      req.onsuccess = () => res(req.result);
      req.onerror   = e => rej(e.target.error);
    });
  }

  function putEntry(entry) {
    return tx('readwrite', (st, res) => {
      st.put(entry).onsuccess = () => res();
    });
  }

  function putEntries(entries) {
    return tx('readwrite', (st, res) => {
      entries.forEach(e => st.put(e));
      res();
    });
  }

  return { getAllEntries, putEntry, putEntries };
})();

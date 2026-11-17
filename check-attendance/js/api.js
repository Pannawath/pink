const config = (typeof AttendanceConfig !== 'undefined')
  ? AttendanceConfig
  : (typeof require !== 'undefined' ? require('./config.js') : {});

const AttendanceAPI = {
  dedupeRegs(rawEntries) {
    if (!Array.isArray(rawEntries)) return [];
    const seenMap = new Set();
    const uniqueEntries = [];
    const sortedEntries = rawEntries.slice().sort((alpha, beta) => (Number(alpha.timestamp) || 0) - (Number(beta.timestamp) || 0));

    for (let index = 0; index < sortedEntries.length; index++) {
      const record = sortedEntries[index];
      const identityHash = [
        record.fullName || '',
        record.classRoom || '',
        record.numberLabel || '',
        record.department || '',
        record.position || '',
        record.centralPosition || '',
        record.sportType || '',
        record.roleCategory || ''
      ].join('|');

      if (!seenMap.has(identityHash)) {
        seenMap.add(identityHash);
        uniqueEntries.push(record);
      }
    }
    return uniqueEntries;
  },

  getCachedData() {
    try {
      if (typeof sessionStorage === 'undefined') return null;
      const rawPayload = sessionStorage.getItem(config.CACHE_KEY);
      const timestampString = sessionStorage.getItem(config.CACHE_TIME_KEY);
      if (!rawPayload) return null;

      const parsedRecords = JSON.parse(rawPayload);
      const cachedEpoch = Number(timestampString) || 0;
      return {
        records: this.dedupeRegs(parsedRecords),
        cachedAt: cachedEpoch,
        isStale: Date.now() - cachedEpoch > config.CACHE_TTL_MS
      };
    } catch (parseError) {
      console.warn('[AttendanceAPI] Failed to parse cached payload:', parseError);
      return null;
    }
  },

  setCachedData(records) {
    try {
      if (typeof sessionStorage === 'undefined') return;
      sessionStorage.setItem(config.CACHE_KEY, JSON.stringify(records));
      sessionStorage.setItem(config.CACHE_TIME_KEY, String(Date.now()));
    } catch (quotaError) {
      console.warn('[AttendanceAPI] sessionStorage quota exceeded:', quotaError);
    }
  },

  clearCache() {
    try {
      if (typeof sessionStorage === 'undefined') return;
      sessionStorage.removeItem(config.CACHE_KEY);
      sessionStorage.removeItem(config.CACHE_TIME_KEY);
    } catch (clearError) {
      console.warn('[AttendanceAPI] Cache clear exception:', clearError);
    }
  },

  async fetchFromNetwork() {
    try {
      const networkResponse = await fetch(config.API_URL, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      if (!networkResponse.ok) throw new Error(`HTTP Error: ${networkResponse.status}`);

      const rawJson = await networkResponse.json();
      const normalizedRecords = Array.isArray(rawJson) ? rawJson.map(record => ({
        ...record,
        autoAssigned: record.autoAssigned === true || record.autoAssigned === 'TRUE' || record.autoAssigned === 'true',
        timestamp: Number(record.timestamp) || 0
      })) : [];

      const dedupedRecords = this.dedupeRegs(normalizedRecords);
      this.setCachedData(dedupedRecords);
      return dedupedRecords;
    } catch (fetchError) {
      console.warn('[AttendanceAPI] Network request failed, using cached records:', fetchError);
      const cachedBundle = this.getCachedData();
      return cachedBundle ? cachedBundle.records : [];
    }
  },

  async loadWithSWR(onBackgroundUpdate) {
    const cachedBundle = this.getCachedData();
    if (cachedBundle && cachedBundle.records) {
      if (cachedBundle.isStale) {
        this.fetchFromNetwork().then(freshRecords => {
          if (typeof onBackgroundUpdate === 'function') {
            onBackgroundUpdate(freshRecords);
          }
        });
      }
      return { records: cachedBundle.records, fromCache: true };
    }

    const liveRecords = await this.fetchFromNetwork();
    return { records: liveRecords, fromCache: false };
  },

  async appendRecord(registrationRecord) {
    try {
      await fetch(config.API_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(registrationRecord)
      });
    } catch (postError) {
      console.error('[AttendanceAPI] Submission failed:', postError);
      return false;
    }

    this.clearCache();
    return true;
  }
};

if (typeof window !== 'undefined') {
  window.AttendanceAPI = AttendanceAPI;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AttendanceAPI;
}

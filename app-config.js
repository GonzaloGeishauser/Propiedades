(function(root, factory){
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.AppConfig = api;
})(typeof self !== 'undefined' ? self : this, function(){
  const STORAGE_KEY = 'misPropiedades.apiUrl';

  function normalizeUrl(value){
    return String(value || '').trim().replace(/\/+$/, '');
  }

  function validateExecUrl(value){
    try{
      const url = new URL(normalizeUrl(value));
      return url.protocol === 'https:' &&
        url.hostname === 'script.google.com' &&
        /^\/macros\/s\/[^/]+\/exec$/.test(url.pathname);
    }catch(_){
      return false;
    }
  }

  function loadApiUrl(storage){
    const value = storage.getItem(STORAGE_KEY);
    return validateExecUrl(value) ? normalizeUrl(value) : '';
  }

  function saveApiUrl(storage, value){
    const normalized = normalizeUrl(value);
    if(!validateExecUrl(normalized)) throw new Error('INVALID_EXEC_URL');
    storage.setItem(STORAGE_KEY, normalized);
    return normalized;
  }

  function clearApiUrl(storage){
    storage.removeItem(STORAGE_KEY);
  }

  return {STORAGE_KEY, normalizeUrl, validateExecUrl, loadApiUrl, saveApiUrl, clearApiUrl};
});

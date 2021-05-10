(async () => {
    const src = chrome.extension.getURL('/src/backend/js/injector.js');
    await import(src);
})();
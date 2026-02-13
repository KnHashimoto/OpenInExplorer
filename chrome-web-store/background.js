const NATIVE_HOST_NAME = 'com.googlechat.openinexplorer';

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'open-in-explorer',
    title: 'エクスプローラーで開く',
    contexts: ['selection']
  });
});

chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId !== 'open-in-explorer') return;

  const selectedText = (info.selectionText || '').trim();
  if (!selectedText) return;

  const path = selectedText.replace(/^["']|["']$/g, '').trim();
  if (!path) return;

  const port = chrome.runtime.connectNative(NATIVE_HOST_NAME);

  port.onMessage.addListener((response) => {
    if (response && response.success === false) {
      console.error('Open in Explorer failed:', response.error);
    }
    port.disconnect();
  });

  port.onDisconnect.addListener(() => {
    if (chrome.runtime.lastError) {
      console.error('Native host error:', chrome.runtime.lastError.message);
    }
  });

  port.postMessage({ path });
});

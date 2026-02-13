const NATIVE_HOST_NAME = 'com.googlechat.openinexplorer';

// 選択テキストをパスとして整形
function normalizePath(text) {
  return (text || '').replace(/^["']|["']$/g, '').trim();
}

// パスをネイティブホストに送ってエクスプローラーで開く
function openPathInExplorer(path, tab) {
  const trimmed = normalizePath(path);
  if (!trimmed) {
    console.warn('パスが空です');
    return;
  }

  const message = { path: trimmed };
  const port = chrome.runtime.connectNative(NATIVE_HOST_NAME);

  port.onMessage.addListener((response) => {
    try {
      if (response && response.success === false) {
        const errorMessage = response.error || 'エクスプローラーで開けませんでした';
        if (tab?.id) {
          chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: (msg) => { alert(msg); },
            args: [errorMessage]
          }).catch(() => {});
        }
      }
    } finally {
      port.disconnect();
    }
  });

  port.onDisconnect.addListener(() => {
    if (chrome.runtime.lastError) { /* 拡張機能エラー一覧に表示しない */ }
  });

  port.postMessage(message);
}

// コンテキストメニューを登録
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'open-in-explorer',
    title: 'エクスプローラーで開く (Ctrl+Shift+E)',
    contexts: ['selection']
  });
});

// 右クリックメニューがクリックされたとき
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== 'open-in-explorer') return;
  const selectedText = (info.selectionText || '').trim();
  if (!selectedText) return;
  openPathInExplorer(selectedText, tab);
});

// ショートカットキー（Ctrl+Shift+E）が押されたとき
chrome.commands.onCommand.addListener((command) => {
  if (command !== 'open-in-explorer') return;

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    if (!tab?.id) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon.png',
        title: 'エクスプローラーで開く',
        message: '現在のタブを取得できませんでした。'
      });
      return;
    }

    // chrome:// などスクリプト注入できないページでは通知して終了
    if (tab.url?.startsWith('chrome://') || tab.url?.startsWith('edge://') || tab.url?.startsWith('about:')) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon.png',
        title: 'エクスプローラーで開く',
        message: 'このページではショートカットが使えません。Google Chat などのウェブページでお試しください。'
      });
      return;
    }

    function useSelection(selectedText) {
      const trimmed = (selectedText || '').trim();
      if (!trimmed) {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icon.png',
          title: 'エクスプローラーで開く',
          message: 'パスを選択してから Ctrl+Shift+E を押してください。'
        });
        return;
      }
      openPathInExplorer(trimmed, tab);
    }

    // 1) まずコンテンツスクリプトに問い合わせ（selectionchange で保持した選択を取得）
    chrome.tabs.sendMessage(tab.id, 'getSelection', (response) => {
      if (!chrome.runtime.lastError && typeof response === 'string' && response.trim()) {
        useSelection(response);
        return;
      }
      // 2) 取れなければ executeScript で全フレームから取得
      chrome.scripting.executeScript({
        target: { tabId: tab.id, allFrames: true },
        world: 'MAIN',
        func: () => {
          try {
            const s = window.getSelection();
            if (s && s.toString()) return s.toString();
          } catch (e) {}
          return '';
        }
      }).then((results) => {
        const firstNonEmpty = (results || []).find(r => r?.result && String(r.result).trim());
        useSelection(firstNonEmpty?.result ?? '');
      }).catch(() => {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icon.png',
          title: 'エクスプローラーで開く',
          message: 'このページではショートカットが使えません。Google Chat などのウェブページでお試しください。'
        });
      });
    });
  });
});

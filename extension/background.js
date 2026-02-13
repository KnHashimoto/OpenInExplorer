const NATIVE_HOST_NAME = 'com.googlechat.openinexplorer';

// コンテキストメニューを登録
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'open-in-explorer',
    title: 'エクスプローラーで開く',
    contexts: ['selection']
  });
});

// 右クリックメニューがクリックされたとき
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== 'open-in-explorer') return;

  const selectedText = (info.selectionText || '').trim();
  if (!selectedText) {
    console.warn('選択テキストがありません');
    return;
  }

  // パスとして使えるように整形（前後の空白・引用符を除去）
  const path = selectedText.replace(/^["']|["']$/g, '').trim();

  if (!path) {
    console.warn('パスが空です');
    return;
  }

  // ネイティブメッセージングでホストにパスを送信
  const message = { path };
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
          }).catch(() => { /* 注入できないページでは何もしない（エラーに表示しない） */ });
        }
      }
    } finally {
      port.disconnect();
    }
  });

  port.onDisconnect.addListener(() => {
    if (chrome.runtime.lastError) {
      /* 拡張機能エラー一覧に表示しないため console には出さない */
    }
  });

  port.postMessage(message);
});

// 最後にあった選択テキストを保持（ショートカット押下時に選択が消えても使えるようにする）
let lastSelection = '';

function captureSelection() {
  try {
    const s = window.getSelection();
    if (s) {
      const t = s.toString();
      if (t) lastSelection = t;
    }
  } catch (e) {}
}

document.addEventListener('selectionchange', captureSelection);

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg === 'getSelection') {
    captureSelection();
    sendResponse(lastSelection || '');
  }
  return true;
});

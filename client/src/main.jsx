import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// 開発時に残っている Service Worker が原因でブラウザ拡張や古い SW
// からのメッセージでコンソールにエラーが出ることがあるため、
// Vite の開発モード（IPアクセス含む）では既存の Service Worker を解除する。
if (typeof window !== 'undefined' && 'serviceWorker' in navigator && import.meta.env.DEV) {
  try {
    navigator.serviceWorker.getRegistrations()
      .then(registrations => {
        registrations.forEach(reg => reg.unregister().catch(() => {}));
      })
      .catch(() => {});
  } catch (e) {
    // ignore
  }
}

function fitToViewport() {
  const root = document.getElementById('root');
  if (!root) {
    console.error("Element with id 'root' not found.");
    return;
  }

  function getViewport() {
    const vv = window.visualViewport;
    let w = vv ? vv.width : window.innerWidth;
    let h = vv ? vv.height : window.innerHeight;
    if (!w || !h) {
      w = window.innerWidth;
      h = window.innerHeight;
    }
    return { w, h };
  }

  const BASE_WIDTH = 1376;
  const BASE_HEIGHT = 942;
  function getBaseSize() {
    return { baseW: BASE_WIDTH, baseH: BASE_HEIGHT };
  }

  function fit() {
    const vp = getViewport();
    const base = getBaseSize();
    const s = Math.min(vp.w / base.baseW, vp.h / base.baseH);
    // インラインで基準サイズ(px)を固定して、他のCSSルールに上書きされるのを防ぐ
    try {
      // 強制的に優先度を上げて設定して、外部CSSに上書きされるのを防ぐ
      root.style.setProperty('width', base.baseW + 'px', 'important');
      root.style.setProperty('height', base.baseH + 'px', 'important');
      root.style.setProperty('max-width', 'none', 'important');
      root.style.setProperty('max-height', 'none', 'important');
      root.style.setProperty('transform-origin', 'center center', 'important');
      root.style.setProperty('will-change', 'transform', 'important');
    } catch (e) {}
    // 親要素の transform やレイアウト干渉を避けるため、
    // 一時的に position:fixed でビューポート基準にする（診断用）
    try {
      root.style.position = 'fixed';
      root.style.left = '50%';
      root.style.top = '50%';
      root.style.margin = '0';
      root.style.boxSizing = 'border-box';
      root.style.zIndex = '1000';
      root.style.overflow = 'hidden';
    } catch (e) {}
    root.style.setProperty('--scale', String(s));
    // CSS が上書きされるケースや計算順の問題を避けるため、
    // インラインで transform を直接設定して確実に反映させる。
    try {
      root.style.transform = `translate(-50%, -50%) scale(${s})`;
    } catch (e) {}
    // デバッグ: vp / base / scale / rendered を一つのログで出力
    try {
      const rect = root.getBoundingClientRect();
      // eslint-disable-next-line no-console
      console.log('[fit]', { vp, base, scale: s, rendered: { width: rect.width, height: rect.height } });
      try {
        const csRoot = getComputedStyle(root);
        // eslint-disable-next-line no-console
        console.log('[fit-debug] computed:', { width: csRoot.width, height: csRoot.height, transform: csRoot.transform, inlineWidth: root.style.width, inlineHeight: root.style.height, client: { cw: root.clientWidth, ch: root.clientHeight, offsetH: root.offsetHeight } });
        const parent = root.parentElement;
        if (parent) {
          const csParent = getComputedStyle(parent);
          // eslint-disable-next-line no-console
          console.log('[fit-debug] parent computed:', { width: csParent.width, height: csParent.height, transform: csParent.transform, client: { cw: parent.clientWidth, ch: parent.clientHeight } });
        }
        // 追加診断: 祖先チェーンを辿って各要素の transform/rect を出力する
        try {
          const chain = [];
          let el = root;
          while (el) {
            const cs = getComputedStyle(el);
            const rect = el.getBoundingClientRect();
            chain.push({
              tag: el.tagName,
              id: el.id || null,
              class: el.className || null,
              rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
              client: { cw: el.clientWidth, ch: el.clientHeight, offsetW: el.offsetWidth, offsetH: el.offsetHeight },
              computed: { width: cs.width, height: cs.height, transform: cs.transform }
            });
            el = el.parentElement;
          }
          // eslint-disable-next-line no-console
          console.log('[fit-debug] ancestor chain:', { devicePixelRatio: window.devicePixelRatio, chain });
        } catch (e) {}
      } catch (e) {}
    } catch (e) {}
  }

  fit();
  window.addEventListener('resize', fit, { passive: true });
  window.addEventListener('orientationchange', fit, { passive: true });

  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', fit, { passive: true });
    window.visualViewport.addEventListener('scroll', fit, { passive: true });
  }
}

const rootContainer = createRoot(document.getElementById('root'));
rootContainer.render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// myMain が DOM に挿入された後で初回のフィット処理を行う
// （以前は先に実行され #root に transform が残ってしまっていた）
fitToViewport();

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
  // 拡縮対象はまず #myMain を探し、無ければ #root をフォールバック
  const main = document.getElementById('myMain') || document.getElementById('root');
  if (!main) {
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

  // spa.html と同じ基準サイズを固定で使う（安定して同一挙動にする）
  const BASE_WIDTH = 1280;
  const BASE_HEIGHT = 640;
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
      main.style.setProperty('width', base.baseW + 'px', 'important');
      main.style.setProperty('height', base.baseH + 'px', 'important');
      main.style.setProperty('max-width', 'none', 'important');
      main.style.setProperty('max-height', 'none', 'important');
      main.style.setProperty('transform-origin', 'center center', 'important');
      main.style.setProperty('will-change', 'transform', 'important');
    } catch (e) {}
    // 親要素の transform やレイアウト干渉を避けるため、
    // 一時的に position:fixed でビューポート基準にする（診断用）
    try {
      main.style.position = 'fixed';
      main.style.left = '50%';
      main.style.top = '50%';
      main.style.margin = '0';
      main.style.boxSizing = 'border-box';
      main.style.zIndex = '1000';
      main.style.overflow = 'hidden';
    } catch (e) {}
    main.style.setProperty('--scale', String(s));
    // CSS が上書きされるケースや計算順の問題を避けるため、
    // インラインで transform を直接設定して確実に反映させる。
    try {
      main.style.transform = `translate(-50%, -50%) scale(${s})`;
    } catch (e) {}
    // デバッグ: vp / base / scale / rendered を一つのログで出力
    try {
      const rect = main.getBoundingClientRect();
      // eslint-disable-next-line no-console
      console.log('[fit]', { vp, base, scale: s, rendered: { width: rect.width, height: rect.height } });
      try {
        const csMain = getComputedStyle(main);
        // eslint-disable-next-line no-console
        console.log('[fit-debug] computed:', { width: csMain.width, height: csMain.height, transform: csMain.transform, inlineWidth: main.style.width, inlineHeight: main.style.height, client: { cw: main.clientWidth, ch: main.clientHeight, offsetH: main.offsetHeight } });
        const parent = main.parentElement;
        if (parent) {
          const csParent = getComputedStyle(parent);
          // eslint-disable-next-line no-console
          console.log('[fit-debug] parent computed:', { width: csParent.width, height: csParent.height, transform: csParent.transform, client: { cw: parent.clientWidth, ch: parent.clientHeight } });
        }
        // 追加診断: 祖先チェーンを辿って各要素の transform/rect を出力する
        try {
          const chain = [];
          let el = main;
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
    <div id="myMain">
      <App />
    </div>
  </StrictMode>,
)

// myMain が DOM に挿入された後で初回のフィット処理を行う
// （以前は先に実行され #root に transform が残ってしまっていた）
fitToViewport();

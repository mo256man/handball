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

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import './styles/style.css'
import './styles/newComponents.css'

try {
  fetch('/__client_log?event=main_jsx_evaluating')
} catch (_) {}

try {
  const rootEl = document.getElementById('root')
  if (!rootEl) {
    throw new Error('Element #root not found in document')
  }

  const root = ReactDOM.createRoot(rootEl)
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  )

  try {
    fetch('/__client_log?event=main_jsx_mounted_successfully')
  } catch (_) {}
} catch (err) {
  try {
    fetch('/__client_log?event=main_jsx_mount_exception&msg=' + encodeURIComponent(err.message))
  } catch (_) {}
  console.error('[Root Mount Error]', err)
}

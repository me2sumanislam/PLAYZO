 // src/main.jsx

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { checkAppVersion, listenForSWUpdate } from './utils/versionCheck'

// ✅ App render হওয়ার আগেই version check
checkAppVersion()

// ✅ Service Worker update এলে auto logout
listenForSWUpdate()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
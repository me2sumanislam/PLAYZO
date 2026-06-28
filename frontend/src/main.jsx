 // src/main.jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { checkAppVersion, listenForSWUpdate } from './utils/versionCheck'

checkAppVersion()
listenForSWUpdate()

createRoot(document.getElementById('root')).render(
  // ✅ StrictMode সরানো হয়েছে — production এ double render বন্ধ
  <BrowserRouter>
    <App />
  </BrowserRouter>
)
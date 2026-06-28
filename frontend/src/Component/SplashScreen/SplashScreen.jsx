 // src/Component/SplashScreen/SplashScreen.jsx

import { useEffect, useState } from 'react'

// Global keyframe — একবারই inject করো
if (!document.getElementById('splash-style')) {
  const style = document.createElement('style')
  style.id = 'splash-style'
  style.textContent = `
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(12px); }
      to   { opacity: 1; transform: translateY(0); }
    }
  `
  document.head.appendChild(style)
}

const SplashScreen = ({ onFinish }) => {
  const [phase, setPhase] = useState('show') // 'show' | 'fadeout' | 'done'

  useEffect(() => {
    // ২ সেকেন্ড দেখাও
    const t1 = setTimeout(() => setPhase('fadeout'), 2000)
    // fade out শেষে remove
    const t2 = setTimeout(() => {
      setPhase('done')
      onFinish?.()
    }, 2500)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [onFinish])

  if (phase === 'done') return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#0f172a',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        gap: '20px',
        // ✅ Blink fix — GPU layer force করো
        willChange: 'opacity',
        opacity: phase === 'fadeout' ? 0 : 1,
        transition: 'opacity 0.5s ease',
      }}
    >
      {/* App Icon */}
      <div
        style={{
          width: '100px',
          height: '100px',
          borderRadius: '24px',
          overflow: 'hidden',
          boxShadow: '0 0 48px rgba(255, 138, 0, 0.35)',
          animation: 'fadeIn 0.4s ease both',
        }}
      >
        <img
          src="/image/icon/icon-192x192.png"
          alt="uthiYO"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>

      {/* App Name */}
      <div
        style={{
          textAlign: 'center',
          animation: 'fadeIn 0.4s ease 0.1s both',
        }}
      >
        <h1
          style={{
            color: '#ffffff',
            fontSize: '30px',
            fontWeight: '700',
            margin: 0,
            letterSpacing: '1px',
          }}
        >
          uthiYO
        </h1>
        <p
          style={{
            color: '#ff8a00',
            fontSize: '13px',
            margin: '6px 0 0',
            letterSpacing: '0.5px',
          }}
        >
          বাংলাদেশের সেরা টুর্নামেন্ট অ্যাপ
        </p>
      </div>

      {/* Spinner */}
      <div
        style={{
          width: '28px',
          height: '28px',
          border: '2.5px solid #1e293b',
          borderTop: '2.5px solid #ff8a00',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
          marginTop: '8px',
        }}
      />

      {/* Version */}
      <p
        style={{
          position: 'absolute',
          bottom: '32px',
          color: '#475569',
          fontSize: '12px',
          margin: 0,
          animation: 'fadeIn 0.4s ease 0.2s both',
        }}
      >
        v1.0.1
      </p>
    </div>
  )
}

export default SplashScreen
 // src/components/SplashScreen.jsx
import { useEffect, useState } from 'react'

const SplashScreen = ({ onFinish }) => {
  const [visible, setVisible] = useState(true)
  const [fadeOut, setFadeOut] = useState(false)

  useEffect(() => {
    // ২ সেকেন্ড পর fade out শুরু
    const fadeTimer = setTimeout(() => {
      setFadeOut(true)
    }, 2000)

    // fade out শেষে unmount
    const removeTimer = setTimeout(() => {
      setVisible(false)
      onFinish?.()
    }, 2600)

    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(removeTimer)
    }
  }, [onFinish])

  if (!visible) return null

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
        zIndex: 9999,
        gap: '24px',
        opacity: fadeOut ? 0 : 1,
        transition: 'opacity 0.6s ease',
      }}
    >
      {/* App Icon */}
      <div
        style={{
          width: '96px',
          height: '96px',
          borderRadius: '24px',
          overflow: 'hidden',
          boxShadow: '0 0 40px rgba(255, 138, 0, 0.3)',
        }}
      >
        <img
          src="/image/icon/icon-192x192.png"
          alt="uthiYO"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>

      {/* App Name */}
      <div style={{ textAlign: 'center' }}>
        <h1
          style={{
            color: '#ffffff',
            fontSize: '28px',
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

      {/* Loading Spinner */}
      <div style={{ marginTop: '8px' }}>
        <Spinner />
      </div>

      {/* Version */}
      <p
        style={{
          position: 'absolute',
          bottom: '32px',
          color: '#475569',
          fontSize: '12px',
          margin: 0,
        }}
      >
        v1.0.1
      </p>
    </div>
  )
}

// Spinner Component
const Spinner = () => {
  return (
    <div
      style={{
        width: '28px',
        height: '28px',
        border: '2.5px solid #1e293b',
        borderTop: '2.5px solid #ff8a00',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }}
    />
  )
}

// Global keyframe inject
const style = document.createElement('style')
style.textContent = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`
document.head.appendChild(style)

export default SplashScreen
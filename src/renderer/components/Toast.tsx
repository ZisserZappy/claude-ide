import { useEffect, useState } from 'react'

interface Props {
  message: string
  onDismiss: () => void
}

export default function Toast({ message, onDismiss }: Props) {
  const [opacity, setOpacity] = useState(0)

  useEffect(() => {
    // Fade in
    requestAnimationFrame(() => setOpacity(1))

    // Auto-dismiss after 10 seconds
    const timer = setTimeout(() => {
      setOpacity(0)
      setTimeout(onDismiss, 300)
    }, 10000)

    return () => clearTimeout(timer)
  }, [onDismiss])

  const handleDismiss = () => {
    setOpacity(0)
    setTimeout(onDismiss, 300)
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 40,
        right: 20,
        maxWidth: 400,
        background: '#FFFFFF',
        border: '1px solid #E5E5E5',
        borderLeft: '4px solid #2563EB',
        borderRadius: 12,
        padding: '16px 20px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        zIndex: 2000,
        opacity,
        transition: 'opacity 0.3s ease',
        display: 'flex',
        gap: 14,
        alignItems: 'flex-start',
      }}
    >
      <span style={{ color: '#2563EB', fontSize: 18, lineHeight: '22px', flexShrink: 0 }}>💡</span>
      <span style={{
        color: '#1A1A1A',
        fontSize: 14,
        lineHeight: '22px',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro', 'Segoe UI', system-ui, sans-serif",
      }}>
        {message}
      </span>
      <span
        onClick={handleDismiss}
        style={{
          color: '#999999',
          cursor: 'pointer',
          fontSize: 16,
          lineHeight: '22px',
          flexShrink: 0,
          marginLeft: 4,
        }}
      >
        ×
      </span>
    </div>
  )
}

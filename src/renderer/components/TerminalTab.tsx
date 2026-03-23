import { useEffect, useRef, useState } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'
import Minimap from './Minimap'

interface Props {
  ptyId: string
  visible: boolean
  exited?: boolean
  tabId: string
  projectPath?: string
}

export default function TerminalTab({ ptyId, visible, exited, tabId, projectPath }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const termRef = useRef<HTMLDivElement>(null)
  const terminalRef = useRef<Terminal | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)
  const [terminal, setTerminal] = useState<Terminal | null>(null)
  const [minimapVisible, setMinimapVisible] = useState(true)

  useEffect(() => {
    if (!termRef.current) return

    const term = new Terminal({
      theme: {
        background: '#FFFFFF',
        foreground: '#1A1A1A',
        cursor: '#2563EB',
        cursorAccent: '#FFFFFF',
        selectionBackground: 'rgba(37, 99, 235, 0.2)',
        black: '#1A1A1A',
        red: '#EF4444',
        green: '#10B981',
        yellow: '#D97706',
        blue: '#2563EB',
        magenta: '#8B5CF6',
        cyan: '#06B6D4',
        white: '#F5F5F5',
        brightBlack: '#666666',
        brightRed: '#F87171',
        brightGreen: '#34D399',
        brightYellow: '#FBBF24',
        brightBlue: '#60A5FA',
        brightMagenta: '#A78BFA',
        brightCyan: '#22D3EE',
        brightWhite: '#FFFFFF',
      },
      fontFamily: "'SF Mono', Menlo, Consolas, monospace",
      fontSize: 13,
      cursorBlink: true,
      scrollback: 10000,
    })

    const fitAddon = new FitAddon()
    term.loadAddon(fitAddon)
    term.open(termRef.current)
    fitAddon.fit()

    terminalRef.current = term
    fitAddonRef.current = fitAddon
    setTerminal(term)

    // Track user input to capture queries
    let inputBuffer = ''
    term.onData((data) => {
      window.api.writePty(ptyId, data)

      // Capture user input: when Enter is pressed, save the accumulated line
      if (data === '\r' || data === '\n') {
        const line = inputBuffer.trim()
        inputBuffer = ''
        // Save meaningful queries (>3 chars, not just slash commands or control)
        if (line.length > 3 && projectPath && !line.startsWith('/') && !/^[\x00-\x1f]+$/.test(line)) {
          window.api.saveSessionQuery(projectPath, line)
        }
      } else if (data === '\x7f') {
        // Backspace
        inputBuffer = inputBuffer.slice(0, -1)
      } else if (data.length === 1 && data >= ' ') {
        // Normal printable character
        inputBuffer += data
      } else if (data.length > 1 && !data.includes('\x1b')) {
        // Pasted text
        inputBuffer += data
      }
    })

    const unsubData = window.api.onPtyData((id, data) => {
      if (id === ptyId) {
        term.write(data)
      }
    })

    term.onResize(({ cols, rows }) => {
      window.api.resizePty(ptyId, cols, rows)
    })

    window.api.resizePty(ptyId, term.cols, term.rows)

    const resizeObserver = new ResizeObserver(() => {
      fitAddon.fit()
    })
    resizeObserver.observe(termRef.current)

    return () => {
      resizeObserver.disconnect()
      unsubData()
      term.dispose()
    }
  }, [ptyId])

  useEffect(() => {
    if (visible && fitAddonRef.current) {
      setTimeout(() => fitAddonRef.current?.fit(), 0)
    }
  }, [visible])

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        display: visible ? 'flex' : 'none',
        background: '#FFFFFF',
        position: 'relative',
      }}
    >
      <div
        ref={termRef}
        style={{ flex: 1, height: '100%', overflow: 'hidden' }}
      />
      {/* Minimap toggle button */}
      <div
        onClick={() => setMinimapVisible(v => !v)}
        style={{
          position: 'absolute',
          top: 6,
          right: minimapVisible ? 86 : 6,
          zIndex: 5,
          background: '#FFFFFF',
          border: '1px solid #E5E5E5',
          borderRadius: 4,
          padding: '2px 6px',
          cursor: 'pointer',
          fontSize: 10,
          color: minimapVisible ? '#2563EB' : '#999999',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          transition: 'right 0.2s ease, color 0.15s ease',
        }}
        title={minimapVisible ? 'Hide minimap' : 'Show minimap'}
      >
        minimap
      </div>
      <Minimap terminal={terminal} visible={minimapVisible} />
      {/* Session ended overlay */}
      {exited && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(250, 250, 250, 0.85)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
        }}>
          <div style={{ color: '#666666', fontSize: 15, marginBottom: 12 }}>
            Session ended
          </div>
          <div
            onClick={async () => {
              if (!projectPath) return
              const newPtyId = await window.api.createPty(projectPath)
              // Dispatch restart via custom event since we don't have dispatch here
              window.dispatchEvent(new CustomEvent('pty-restart', {
                detail: { tabId, ptyId: newPtyId }
              }))
            }}
            style={{
              background: '#2563EB',
              color: '#FFFFFF',
              padding: '8px 20px',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 500,
              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)',
            }}
          >
            Restart Session
          </div>
        </div>
      )}
    </div>
  )
}

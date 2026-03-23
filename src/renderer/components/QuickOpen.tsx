import { useEffect, useState, useRef, useCallback } from 'react'
import { useAppState } from '../store'
import type { Tab } from '../../shared/types'

interface Props {
  visible: boolean
  onClose: () => void
}

export default function QuickOpen({ visible, onClose }: Props) {
  const { state, dispatch } = useAppState()
  const [query, setQuery] = useState('')
  const [files, setFiles] = useState<string[]>([])
  const [filtered, setFiltered] = useState<string[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (visible && state.projectPath) {
      window.api.listAllFiles(state.projectPath).then(setFiles)
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [visible, state.projectPath])

  useEffect(() => {
    if (!query) {
      setFiltered(files.slice(0, 50))
      setSelectedIndex(0)
      return
    }
    const lower = query.toLowerCase()
    const parts = lower.split('')
    const scored = files
      .map(file => {
        const fileLower = file.toLowerCase()
        // Simple fuzzy: check if all chars appear in order
        let fi = 0
        for (const ch of parts) {
          fi = fileLower.indexOf(ch, fi)
          if (fi === -1) return null
          fi++
        }
        // Score: prefer filename matches over path matches
        const name = file.split('/').pop()?.toLowerCase() || ''
        const nameMatch = name.includes(lower) ? 0 : 1
        const exactMatch = name === lower ? -1 : 0
        return { file, score: exactMatch + nameMatch }
      })
      .filter(Boolean) as { file: string; score: number }[]
    scored.sort((a, b) => a.score - b.score)
    setFiltered(scored.slice(0, 50).map(s => s.file))
    setSelectedIndex(0)
  }, [query, files])

  const openFile = useCallback((filePath: string) => {
    if (!state.projectPath) return
    const fullPath = `${state.projectPath}/${filePath}`
    const fileName = filePath.split('/').pop() || filePath

    const existing = state.tabs.find(t => t.filePath === fullPath)
    if (existing) {
      dispatch({ type: 'SET_ACTIVE_TAB', tabId: existing.id })
    } else {
      const tab: Tab = {
        id: `editor-${Date.now()}`,
        type: 'editor',
        label: fileName,
        closeable: true,
        filePath: fullPath
      }
      dispatch({ type: 'ADD_TAB', tab })
    }
    onClose()
  }, [state.projectPath, state.tabs, dispatch, onClose])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(i => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      openFile(filtered[selectedIndex])
    }
  }

  if (!visible) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.3)',
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'center',
        paddingTop: 80,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: 540,
          maxHeight: 420,
          background: '#FFFFFF',
          borderRadius: 12,
          border: '1px solid #E5E5E5',
          overflow: 'hidden',
          boxShadow: '0 12px 48px rgba(0,0,0,0.15)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search files by name..."
          style={{
            width: '100%',
            padding: '14px 18px',
            background: '#F5F5F5',
            border: 'none',
            borderBottom: '1px solid #E5E5E5',
            color: '#1A1A1A',
            fontSize: 15,
            outline: 'none',
            fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro', 'Segoe UI', system-ui, sans-serif",
            boxSizing: 'border-box',
          }}
        />
        <div style={{ maxHeight: 360, overflowY: 'auto' }}>
          {filtered.map((file, i) => (
            <div
              key={file}
              onClick={() => openFile(file)}
              style={{
                padding: '10px 18px',
                cursor: 'pointer',
                background: i === selectedIndex ? '#EEF2FF' : 'transparent',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                margin: '2px 6px',
                borderRadius: 6,
              }}
              onMouseEnter={() => setSelectedIndex(i)}
            >
              <span style={{ color: '#1A1A1A', fontSize: 14 }}>
                {file.split('/').pop()}
              </span>
              <span style={{ color: '#999999', fontSize: 12 }}>
                {file.includes('/') ? file.substring(0, file.lastIndexOf('/')) : ''}
              </span>
            </div>
          ))}
          {filtered.length === 0 && query && (
            <div style={{ padding: '14px 18px', color: '#999999', fontSize: 14 }}>
              No files found
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

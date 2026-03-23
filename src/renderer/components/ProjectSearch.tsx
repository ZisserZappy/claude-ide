import { useState, useRef, useCallback } from 'react'
import { useAppState } from '../store'
import type { Tab } from '../../shared/types'

interface SearchResult {
  file: string
  line: number
  text: string
}

interface Props {
  visible: boolean
  onClose: () => void
}

export default function ProjectSearch({ visible, onClose }: Props) {
  const { state, dispatch } = useAppState()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  const doSearch = useCallback((q: string) => {
    if (!state.projectPath || q.length < 2) {
      setResults([])
      return
    }
    setSearching(true)
    window.api.searchContent(state.projectPath, q).then(r => {
      setResults(r)
      setSearching(false)
    })
  }, [state.projectPath])

  const handleChange = (value: string) => {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => doSearch(value), 300)
  }

  const openResult = (result: SearchResult) => {
    if (!state.projectPath) return
    const fullPath = `${state.projectPath}/${result.file}`
    const fileName = result.file.split('/').pop() || result.file

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
  }

  // Group results by file
  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    if (!acc[r.file]) acc[r.file] = []
    acc[r.file].push(r)
    return acc
  }, {})

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
          width: 640,
          maxHeight: 520,
          background: '#FFFFFF',
          borderRadius: 12,
          border: '1px solid #E5E5E5',
          overflow: 'hidden',
          boxShadow: '0 12px 48px rgba(0,0,0,0.15)',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={e => e.stopPropagation()}
      >
        <input
          ref={inputRef}
          autoFocus
          value={query}
          onChange={e => handleChange(e.target.value)}
          onKeyDown={e => e.key === 'Escape' && onClose()}
          placeholder="Search in files..."
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
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {searching && (
            <div style={{ padding: '14px 18px', color: '#666666', fontSize: 14 }}>Searching...</div>
          )}
          {!searching && query.length >= 2 && results.length === 0 && (
            <div style={{ padding: '14px 18px', color: '#999999', fontSize: 14 }}>No results found</div>
          )}
          {Object.entries(grouped).map(([file, matches]) => (
            <div key={file}>
              <div style={{
                padding: '8px 18px',
                color: '#2563EB',
                fontSize: 12,
                fontWeight: 500,
                background: '#F5F5F5',
                position: 'sticky',
                top: 0,
              }}>
                {file} <span style={{ color: '#999999' }}>({matches.length})</span>
              </div>
              {matches.map((match, i) => (
                <div
                  key={`${file}:${match.line}:${i}`}
                  onClick={() => openResult(match)}
                  style={{
                    padding: '5px 18px 5px 32px',
                    cursor: 'pointer',
                    display: 'flex',
                    gap: 12,
                    alignItems: 'baseline',
                    fontSize: 12,
                    borderRadius: 4,
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#EEF2FF')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <span style={{ color: '#999999', flexShrink: 0, minWidth: 30, textAlign: 'right' }}>
                    {match.line}
                  </span>
                  <span style={{
                    color: '#1A1A1A',
                    fontFamily: "'SF Mono', Menlo, Consolas, monospace",
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {highlightMatch(match.text, query)}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
        {results.length > 0 && (
          <div style={{
            padding: '8px 18px',
            borderTop: '1px solid #E5E5E5',
            color: '#666666',
            fontSize: 12,
          }}>
            {results.length} results in {Object.keys(grouped).length} files
          </div>
        )}
      </div>
    </div>
  )
}

function highlightMatch(text: string, query: string): React.ReactNode {
  const lower = text.toLowerCase()
  const qLower = query.toLowerCase()
  const idx = lower.indexOf(qLower)
  if (idx === -1) return text
  return (
    <>
      {text.substring(0, idx)}
      <span style={{ background: '#FEF3C7', color: '#92400E', borderRadius: 2, padding: '0 2px' }}>{text.substring(idx, idx + query.length)}</span>
      {text.substring(idx + query.length)}
    </>
  )
}

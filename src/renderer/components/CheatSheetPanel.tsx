import { useState, useMemo } from 'react'
import { cheatSheet, categoryLabels } from '../../shared/commands'

interface Props {
  open: boolean
  onClose: () => void
}

export default function CheatSheetPanel({ open, onClose }: Props) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!search.trim()) return cheatSheet
    const q = search.toLowerCase()
    return cheatSheet.filter(
      e => e.command.toLowerCase().includes(q) || e.description.toLowerCase().includes(q)
    )
  }, [search])

  const newEntries = useMemo(() => {
    return filtered
      .filter(e => e.added)
      .sort((a, b) => (b.added || '').localeCompare(a.added || ''))
  }, [filtered])

  return (
    <div style={{
      width: open ? 300 : 0,
      minWidth: open ? 300 : 0,
      background: '#FFFFFF',
      borderLeft: open ? '1px solid #E5E5E5' : 'none',
      overflow: 'hidden',
      transition: 'width 0.2s ease, min-width 0.2s ease',
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid #E5E5E5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <span style={{
          color: '#666666',
          fontSize: 11,
          textTransform: 'uppercase',
          letterSpacing: 1,
          fontWeight: 600,
        }}>
          Cheat Sheet
        </span>
        <span
          onClick={onClose}
          style={{ color: '#999999', cursor: 'pointer', fontSize: 16 }}
        >
          x
        </span>
      </div>

      {/* Search */}
      <div style={{ padding: '8px 12px', flexShrink: 0 }}>
        <input
          type="text"
          placeholder="Search commands..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #E5E5E5',
            borderRadius: 8,
            fontSize: 13,
            outline: 'none',
            background: '#FAFAFA',
            color: '#1A1A1A',
            fontFamily: 'inherit',
          }}
        />
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px 16px' }}>
        {/* What's New */}
        {newEntries.length > 0 && !search && (
          <div style={{
            marginBottom: 16,
            background: '#F0FDF4',
            borderRadius: 10,
            padding: 12,
            border: '1px solid #BBF7D0',
          }}>
            <div style={{
              color: '#10B981',
              fontSize: 11,
              fontWeight: 600,
              marginBottom: 8,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}>
              What's New
            </div>
            {newEntries.slice(0, 5).map((entry, i) => (
              <div key={i} style={{
                display: 'flex',
                flexDirection: 'column',
                padding: '5px 0',
                borderBottom: i < Math.min(newEntries.length, 5) - 1 ? '1px solid #D1FAE5' : 'none',
                gap: 2,
              }}>
                <code style={{
                  color: '#1A1A1A',
                  background: '#FFFFFF',
                  padding: '2px 8px',
                  borderRadius: 5,
                  fontSize: 11,
                  fontFamily: "'SF Mono', Menlo, Consolas, monospace",
                  border: '1px solid #E5E5E5',
                  alignSelf: 'flex-start',
                }}>
                  {entry.command}
                </code>
                <span style={{ color: '#666666', fontSize: 11, lineHeight: '16px' }}>
                  {entry.description}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Categories */}
        {(['keyboard', 'start', 'slash', 'session', 'config'] as const).map(category => {
          const entries = filtered.filter(e => e.category === category)
          if (entries.length === 0) return null
          const { label, color } = categoryLabels[category]
          return (
            <div key={category} style={{ marginBottom: 14 }}>
              <div style={{
                color,
                fontSize: 11,
                fontWeight: 600,
                marginBottom: 6,
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}>
                <span style={{ fontSize: 7 }}>●</span> {label}
              </div>
              {entries.map((entry, i) => (
                <div key={i} style={{
                  padding: '5px 0',
                  borderBottom: i < entries.length - 1 ? '1px solid #F0F0F0' : 'none',
                }}>
                  <code style={{
                    color: '#1A1A1A',
                    background: '#F5F5F5',
                    padding: '2px 8px',
                    borderRadius: 5,
                    fontSize: 11,
                    fontFamily: "'SF Mono', Menlo, Consolas, monospace",
                    border: '1px solid #E5E5E5',
                    display: 'inline-block',
                    marginBottom: 2,
                  }}>
                    {entry.command}
                  </code>
                  <div style={{ color: '#666666', fontSize: 11, lineHeight: '16px' }}>
                    {entry.description}
                  </div>
                </div>
              ))}
            </div>
          )
        })}

        {filtered.length === 0 && (
          <div style={{ color: '#999999', fontSize: 13, padding: '20px 0', textAlign: 'center' }}>
            No commands match "{search}"
          </div>
        )}
      </div>

      {/* Footer hint */}
      <div style={{
        padding: '8px 12px',
        borderTop: '1px solid #E5E5E5',
        color: '#999999',
        fontSize: 11,
        textAlign: 'center',
        flexShrink: 0,
      }}>
        Cmd+/ to toggle
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { useAppState } from '../store'
import type { RecentSession, Tab } from '../../shared/types'
import { cheatSheet, categoryLabels } from '../../shared/commands'

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hours ago`
  return `${Math.floor(hours / 24)} days ago`
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{
      background: '#FFFFFF',
      borderRadius: 12,
      padding: 20,
      border: '1px solid #E5E5E5',
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
    }}>
      <div style={{ color: '#666666', fontSize: 11, marginBottom: 6, textTransform: 'uppercase', fontWeight: 600, letterSpacing: 0.5 }}>{label}</div>
      <div style={{ color, fontSize: 22, fontWeight: 'bold' }}>{value}</div>
    </div>
  )
}

function estimateTimeSaved(sessions: number, features: number): string {
  const sessionMinutes = sessions * 15
  const featureMinutes = features * 5
  const total = sessionMinutes + featureMinutes
  if (total < 60) return `${total} min`
  const hours = Math.floor(total / 60)
  const mins = total % 60
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
}

function SectionExplainer({ title, description }: { title: string; description: string }) {
  return (
    <div style={{
      color: '#666666',
      fontSize: 12,
      padding: '10px 0 6px',
      display: 'flex',
      alignItems: 'center',
      gap: 8,
    }}>
      <span style={{ color: '#2563EB' }}>↓</span>
      <span><strong style={{ color: '#1A1A1A' }}>{title}</strong> — {description}</span>
    </div>
  )
}

export default function Dashboard({ visible }: { visible: boolean }) {
  const { state, dispatch } = useAppState()
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([])

  useEffect(() => {
    if (visible) {
      window.api.getRecentSessions().then(setRecentSessions)
    }
  }, [visible])

  const activeSessions = state.tabs.filter(t => t.type === 'terminal').length
  const hasStarted = activeSessions > 0 || recentSessions.length > 0

  const handleSessionClick = async (session: RecentSession) => {
    const id = `terminal-${Date.now()}`
    const ptyId = await window.api.createPty(session.projectPath)
    const tab: Tab = {
      id,
      type: 'terminal',
      label: session.projectPath.split('/').pop() || 'Terminal',
      closeable: true,
      ptyId,
      projectPath: session.projectPath
    }
    dispatch({ type: 'ADD_TAB', tab })
  }

  if (!visible) return null

  // ============================================================
  // First-time experience — just the 3 steps, nothing else
  // ============================================================
  if (!hasStarted) {
    return (
      <div style={{ flex: 1, padding: 24, background: '#FAFAFA', overflowY: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ maxWidth: 600 }}>
          <div style={{
            background: 'linear-gradient(135deg, #EEF2FF 0%, #FFFFFF 100%)',
            borderRadius: 16,
            padding: '36px 40px',
            border: '1px solid #E5E5E5',
            boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
          }}>
            <div style={{ color: '#1A1A1A', fontSize: 24, fontWeight: 600, marginBottom: 8 }}>
              Welcome! Let's make using Claude Code easy.
            </div>
            <div style={{ color: '#666666', fontSize: 15, lineHeight: '24px', marginBottom: 32 }}>
              Just 3 steps to get started. If you have feedback, Slack <strong style={{ color: '#2563EB' }}>Izzy Rogner-Hall</strong>.
            </div>

            {[
              {
                step: '1',
                text: 'Click the + button in the top bar',
                detail: 'This opens a terminal tab. Claude Code starts automatically — no commands to memorize.',
                highlight: true,
              },
              {
                step: '2',
                text: 'Type what you want in plain English',
                detail: 'Just describe what you need: "Fix the login bug", "Add a search bar", "Explain this code". Claude does the rest.',
              },
              {
                step: '3',
                text: 'Click any file in the sidebar to view it',
                detail: 'The file opens in an editor. You can edit it, search it (Cmd+F), or ask Claude to change it (select code → Cmd+K).',
              },
            ].map(({ step, text, detail, highlight }) => (
              <div key={step} style={{
                display: 'flex',
                gap: 16,
                alignItems: 'flex-start',
                marginBottom: 20,
                padding: highlight ? '16px' : '0',
                background: highlight ? 'rgba(37, 99, 235, 0.06)' : 'transparent',
                borderRadius: highlight ? 12 : 0,
                border: highlight ? '1px solid rgba(37, 99, 235, 0.15)' : 'none',
              }}>
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: '#2563EB',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 16,
                  fontWeight: 600,
                  flexShrink: 0,
                  boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)',
                }}>
                  {step}
                </div>
                <div>
                  <div style={{ color: '#1A1A1A', fontSize: 15, fontWeight: 600, marginBottom: 4 }}>
                    {text}
                  </div>
                  <div style={{ color: '#666666', fontSize: 13, lineHeight: '20px' }}>{detail}</div>
                </div>
              </div>
            ))}

            <div style={{
              marginTop: 8,
              padding: '14px 18px',
              background: '#F5F5F5',
              borderRadius: 10,
              color: '#666666',
              fontSize: 13,
              textAlign: 'center',
              lineHeight: '20px',
            }}>
              Start with Step 1 — click the <strong style={{ color: '#2563EB' }}>+</strong> button above. Everything else will make sense once you try it.
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ============================================================
  // Returning user — full dashboard with section explanations
  // ============================================================
  return (
    <div style={{ flex: 1, padding: 24, background: '#FAFAFA', overflowY: 'auto' }}>
      {/* Quick Start (compact for returning users) */}
      <div style={{
        background: 'linear-gradient(135deg, #EEF2FF 0%, #FFFFFF 100%)',
        borderRadius: 12,
        padding: '18px 24px',
        border: '1px solid #E5E5E5',
        marginBottom: 24,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}>
        <div style={{ color: '#1A1A1A', fontSize: 17, fontWeight: 600, marginBottom: 6 }}>
          Welcome back! Let's keep cruising.
        </div>
        <div style={{ color: '#666666', fontSize: 13, lineHeight: '20px' }}>
          Click <strong style={{ color: '#2563EB' }}>+</strong> to open a new terminal, or click a file in the sidebar to edit. Feedback? Slack <strong style={{ color: '#2563EB' }}>Izzy Rogner-Hall</strong>.
        </div>
      </div>

      {/* Stats */}
      <SectionExplainer title="Your Stats" description="Track your usage and how much time Claude is saving you." />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16, marginBottom: 24, marginTop: 8 }}>
        <StatCard label="Today's Cost" value={state.claudeStatus.cost || '—'} color="#2563EB" />
        <StatCard label="Active Sessions" value={String(activeSessions)} color="#10B981" />
        <StatCard label="Model" value={state.claudeStatus.model || '—'} color="#F59E0B" />
        <StatCard
          label="Time Saved Today"
          value={estimateTimeSaved(activeSessions, state.behavior.featuresUsed.size)}
          color="#8B5CF6"
        />
      </div>

      {/* Tips for You */}
      <SectionExplainer title="Tips for You" description="Personalized suggestions based on how you're using the app. These appear automatically as you work." />
      <div style={{
        background: '#FFFFFF',
        borderRadius: 12,
        padding: 20,
        border: '1px solid #E5E5E5',
        marginBottom: 20,
        marginTop: 8,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}>
        {state.behavior.triggeredTips.length === 0 ? (
          <div style={{ color: '#999999', fontSize: 13, padding: '4px 0' }}>
            Keep going — tips will appear here as you work. They'll help you discover features you might not know about.
          </div>
        ) : (
          state.behavior.triggeredTips.map((tip, i) => (
            <div
              key={tip.id}
              style={{
                padding: '10px 0',
                borderBottom: i < state.behavior.triggeredTips.length - 1 ? '1px solid #F0F0F0' : 'none',
                display: 'flex',
                gap: 10,
                alignItems: 'baseline',
              }}
            >
              <span style={{ color: '#2563EB', fontSize: 14, flexShrink: 0 }}>💡</span>
              <span style={{ color: '#1A1A1A', fontSize: 13 }}>{tip.message}</span>
            </div>
          ))
        )}
      </div>

      {/* Recent Sessions */}
      <SectionExplainer title="Recent Sessions" description="Projects you've worked on recently. Click one to jump back in." />
      <div style={{
        background: '#FFFFFF',
        borderRadius: 12,
        padding: 20,
        border: '1px solid #E5E5E5',
        marginTop: 8,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}>
        {recentSessions.length === 0 && (
          <div style={{ color: '#999999', padding: '8px 0' }}>No recent sessions yet — open a terminal to get started!</div>
        )}
        {recentSessions.map((session, i) => (
          <div
            key={session.projectPath}
            onClick={() => handleSessionClick(session)}
            style={{
              padding: '10px 0',
              borderBottom: i < recentSessions.length - 1 ? '1px solid #F0F0F0' : 'none',
              cursor: 'pointer',
              borderRadius: 6,
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#F5F5F5')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#2563EB', fontWeight: 500 }}>{session.projectPath.split('/').pop()}</span>
              <span style={{ color: '#999999', fontSize: 12 }}>{formatTimeAgo(session.lastOpened)}</span>
            </div>
            {session.queries && session.queries.length > 0 && (
              <div style={{ marginTop: 4 }}>
                {session.queries.slice(0, 3).map((q, qi) => (
                  <div key={qi} style={{
                    color: '#888888',
                    fontSize: 12,
                    lineHeight: '18px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    paddingLeft: 2,
                  }}>
                    "{q}"
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Claude Code Cheat Sheet */}
      <SectionExplainer title="Claude Code Cheat Sheet" description="Everything you can do — keyboard shortcuts, terminal commands, and slash commands. Bookmark this section!" />
      <div style={{
        background: '#FFFFFF',
        borderRadius: 12,
        padding: 20,
        border: '1px solid #E5E5E5',
        marginTop: 8,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}>
        {/* What's New section */}
        {(() => {
          const newEntries = cheatSheet
            .filter(e => e.added)
            .sort((a, b) => (b.added || '').localeCompare(a.added || ''))
          if (newEntries.length === 0) return null
          return (
            <div style={{
              marginBottom: 24,
              background: '#F0FDF4',
              borderRadius: 10,
              padding: 16,
              border: '1px solid #BBF7D0',
            }}>
              <div style={{
                color: '#10B981',
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}>
                <span style={{ fontSize: 13 }}>★</span> What's New
              </div>
              <div style={{ color: '#6B7280', fontSize: 12, marginBottom: 12 }}>
                As new features and commands are added, they'll show up here so you can try them.
              </div>
              {newEntries.map((entry, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    padding: '6px 0',
                    borderBottom: i < newEntries.length - 1 ? '1px solid #D1FAE5' : 'none',
                    gap: 12,
                    alignItems: 'baseline',
                  }}
                >
                  <span style={{ color: '#9CA3AF', fontSize: 10, flexShrink: 0, minWidth: 62 }}>
                    {entry.added}
                  </span>
                  <code style={{
                    color: '#1A1A1A',
                    background: '#FFFFFF',
                    padding: '3px 10px',
                    borderRadius: 6,
                    fontSize: 12,
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    fontFamily: "'SF Mono', Menlo, Consolas, monospace",
                    border: '1px solid #E5E5E5',
                  }}>
                    {entry.command}
                  </code>
                  <span style={{ color: '#666666', fontSize: 12 }}>
                    {entry.description}
                  </span>
                </div>
              ))}
            </div>
          )
        })()}

        {(['keyboard', 'start', 'slash', 'session', 'config'] as const).map(category => {
          const { label, color } = categoryLabels[category]
          const entries = cheatSheet.filter(e => e.category === category)
          return (
            <div key={category} style={{ marginBottom: 20 }}>
              <div style={{ color, fontSize: 13, fontWeight: 600, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 8 }}>●</span> {label}
              </div>
              {entries.map((entry, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    padding: '7px 0',
                    borderBottom: i < entries.length - 1 ? '1px solid #F0F0F0' : 'none',
                    gap: 16,
                    alignItems: 'baseline',
                  }}
                >
                  <code style={{
                    color: '#1A1A1A',
                    background: '#F5F5F5',
                    padding: '4px 10px',
                    borderRadius: 6,
                    fontSize: 12,
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    fontFamily: "'SF Mono', Menlo, Consolas, monospace",
                    border: '1px solid #E5E5E5',
                  }}>
                    {entry.command}
                  </code>
                  <span style={{ color: '#666666', fontSize: 13 }}>
                    {entry.description}
                  </span>
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}

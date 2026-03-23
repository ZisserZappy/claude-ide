import { useAppState } from '../store'

export default function StatusBar() {
  const { state, dispatch } = useAppState()

  return (
    <div style={{
      background: 'linear-gradient(to right, #2563EB, #3B82F6)',
      padding: '6px 16px',
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: 12,
      color: '#fff',
      flexShrink: 0
    }}>
      <div style={{ display: 'flex', gap: 16 }}>
        <span>Today: {state.claudeStatus.cost || '—'}</span>
        <span>Tokens: {state.claudeStatus.tokens || '—'}</span>
      </div>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <span>{state.claudeStatus.model || '—'}</span>
        <span>Context: {state.claudeStatus.context || '—'}</span>
        <span>{state.gitBranch || '—'}</span>
        <span
          onClick={() => dispatch({ type: 'TOGGLE_CHEAT_SHEET' })}
          style={{
            cursor: 'pointer',
            padding: '1px 8px',
            borderRadius: 4,
            background: state.cheatSheetOpen ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)',
            fontSize: 11,
            transition: 'background 0.15s ease',
          }}
          title="Toggle Cheat Sheet (Cmd+/)"
        >
          Cheat Sheet
        </span>
      </div>
    </div>
  )
}

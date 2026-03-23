import { useAppState } from '../store'
import type { Tab, TabType } from '../../shared/types'
import { useCallback } from 'react'

const tabColors: Record<TabType, string> = {
  dashboard: '#10B981',
  terminal: '#2563EB',
  editor: '#F59E0B'
}

export default function TabBar() {
  const { state, dispatch } = useAppState()

  const handleAdd = async () => {
    let projectPath = state.projectPath
    if (!projectPath) {
      const dir = await window.api.selectDirectory()
      if (!dir) return
      projectPath = dir
      dispatch({ type: 'SET_PROJECT_PATH', path: dir })
      await window.api.watchProject(dir)
      await window.api.addRecentSession(dir)
      const branch = await window.api.getGitBranch(dir)
      dispatch({ type: 'SET_GIT_BRANCH', branch })
    }
    try {
      const id = `terminal-${Date.now()}`
      const ptyId = await window.api.createPty(projectPath)
      const tab: Tab = {
        id,
        type: 'terminal',
        label: `Terminal ${state.tabs.filter(t => t.type === 'terminal').length + 1}`,
        closeable: true,
        ptyId,
        projectPath
      }
      dispatch({ type: 'ADD_TAB', tab })
    } catch (err) {
      console.error('[TabBar] Error creating terminal:', err)
    }
  }

  const handleSplit = useCallback((e: React.MouseEvent, tab: Tab) => {
    e.stopPropagation()
    if (tab.type === 'editor' && tab.filePath) {
      if (state.splitTabId === tab.id) {
        dispatch({ type: 'SET_SPLIT_TAB', tabId: null })
        return
      }
      if (state.splitTabId) {
        dispatch({ type: 'SET_SPLIT_TAB', tabId: tab.id })
        return
      }
      dispatch({ type: 'SET_SPLIT_TAB', tabId: tab.id })
    }
  }, [state.splitTabId, dispatch])

  const handleClose = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation()
    const tab = state.tabs.find(t => t.id === tabId)
    if (tab?.ptyId) {
      window.api.destroyPty(tab.ptyId)
    }
    dispatch({ type: 'CLOSE_TAB', tabId })
  }

  return (
    <div style={{
      background: '#FFFFFF',
      display: 'flex',
      alignItems: 'stretch',
      borderBottom: '1px solid #E5E5E5',
      height: 40,
      WebkitAppRegion: 'drag' as any,
      paddingLeft: 80,
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
    }}>
      {state.tabs.map(tab => (
        <div
          key={tab.id}
          onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', tabId: tab.id })}
          style={{
            padding: '10px 16px',
            background: tab.id === state.activeTabId ? '#FAFAFA' : '#FFFFFF',
            color: tab.id === state.activeTabId ? '#1A1A1A' : '#666666',
            borderRight: '1px solid #E5E5E5',
            borderBottom: tab.id === state.activeTabId ? '2px solid #2563EB' : '2px solid transparent',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 13,
            fontWeight: tab.id === state.activeTabId ? 500 : 400,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            WebkitAppRegion: 'no-drag' as any,
          }}
        >
          <span style={{ color: tabColors[tab.type], fontSize: 10 }}>●</span>
          {tab.label}
          {tab.isDirty && <span style={{ color: '#F59E0B' }}>●</span>}
          {tab.type === 'editor' && (
            <span
              onClick={(e) => handleSplit(e, tab)}
              title={state.splitTabId === tab.id ? 'Close split' : 'Open in split'}
              style={{
                color: state.splitTabId === tab.id ? '#2563EB' : '#999999',
                cursor: 'pointer',
                marginLeft: 4,
                fontSize: 11,
              }}
            >
              ⫿
            </span>
          )}
          {tab.closeable && (
            <span
              onClick={(e) => handleClose(e, tab.id)}
              style={{ color: '#999999', cursor: 'pointer', marginLeft: 4 }}
            >
              ×
            </span>
          )}
        </div>
      ))}
      <div
        onClick={handleAdd}
        style={{
          padding: '10px 16px',
          color: '#2563EB',
          fontSize: 16,
          fontWeight: 500,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          WebkitAppRegion: 'no-drag' as any,
        }}
      >
        +
      </div>
    </div>
  )
}

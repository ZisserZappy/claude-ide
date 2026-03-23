import { useState, useEffect } from 'react'
import { useAppState } from '../store'
import { useFileTree } from '../hooks/useFileTree'
import type { FileNode, GitFileStatus, Tab, RecentSession } from '../../shared/types'

const gitBadgeColors: Record<string, string> = {
  modified: '#F59E0B',
  untracked: '#10B981',
  deleted: '#EF4444',
  added: '#10B981',
  renamed: '#2563EB'
}

const gitBadgeLetters: Record<string, string> = {
  modified: 'M',
  untracked: 'U',
  deleted: 'D',
  added: 'A',
  renamed: 'R'
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  return `${(bytes / 1024).toFixed(1)} KB`
}

function FileTreeNode({ node, depth, gitStatuses, onFileClick }: {
  node: FileNode
  depth: number
  gitStatuses: Record<string, GitFileStatus>
  onFileClick: (path: string, name: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [children, setChildren] = useState<FileNode[]>([])

  const handleClick = async () => {
    if (node.isDirectory) {
      if (!expanded) {
        const nodes = await window.api.readDir(node.path)
        setChildren(nodes)
      }
      setExpanded(!expanded)
    } else {
      onFileClick(node.path, node.name)
    }
  }

  const relativePath = node.path.split('/').slice(-Math.max(depth + 1, 1)).join('/')
  const status = gitStatuses[relativePath] || null

  return (
    <>
      <div
        onClick={handleClick}
        style={{
          padding: '4px 8px',
          paddingLeft: 16 + depth * 16,
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: node.isDirectory ? '#1A1A1A' : '#2563EB',
          fontSize: 13,
        }}
        onMouseEnter={e => (e.currentTarget.style.background = '#F5F5F5')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        <span>
          {node.isDirectory && (expanded ? '▾ ' : '▸ ')}
          {node.name}
        </span>
        <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {status && (
            <span style={{ color: gitBadgeColors[status], fontSize: 11, fontWeight: 600 }}>
              {gitBadgeLetters[status]}
            </span>
          )}
          {!node.isDirectory && node.size != null && (
            <span style={{ color: '#999999', fontSize: 11 }}>{formatSize(node.size)}</span>
          )}
        </span>
      </div>
      {expanded && children.map(child => (
        <FileTreeNode
          key={child.path}
          node={child}
          depth={depth + 1}
          gitStatuses={gitStatuses}
          onFileClick={onFileClick}
        />
      ))}
    </>
  )
}

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export default function FileExplorer() {
  const { state, dispatch } = useAppState()
  const { tree, gitStatuses } = useFileTree(state.projectPath)
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([])
  const [sessionsExpanded, setSessionsExpanded] = useState(true)

  useEffect(() => {
    window.api.getRecentSessions().then(setRecentSessions)
  }, [state.tabs])

  const handleFileClick = (filePath: string, fileName: string) => {
    const existing = state.tabs.find(t => t.filePath === filePath)
    if (existing) {
      dispatch({ type: 'SET_ACTIVE_TAB', tabId: existing.id })
      return
    }

    const tab: Tab = {
      id: `editor-${Date.now()}`,
      type: 'editor',
      label: fileName,
      closeable: true,
      filePath
    }
    dispatch({ type: 'ADD_TAB', tab })
  }

  const handleSessionClick = async (session: RecentSession) => {
    const id = `terminal-${Date.now()}`
    const ptyId = await window.api.createPty(session.projectPath)
    const tab: Tab = {
      id,
      type: 'terminal',
      label: session.projectPath.split('/').pop() || 'Terminal',
      closeable: true,
      ptyId,
      projectPath: session.projectPath,
    }
    dispatch({ type: 'ADD_TAB', tab })
  }

  const handleOpenFolder = async () => {
    const dir = await window.api.selectDirectory()
    if (dir) {
      dispatch({ type: 'SET_PROJECT_PATH', path: dir })
      await window.api.watchProject(dir)
      await window.api.addRecentSession(dir)
      const branch = await window.api.getGitBranch(dir)
      dispatch({ type: 'SET_GIT_BRANCH', branch })
    }
  }

  return (
    <div style={{
      width: 240,
      background: '#FFFFFF',
      borderRight: '1px solid #E5E5E5',
      overflowY: 'auto',
      flexShrink: 0,
      display: state.sidebarOpen ? 'flex' : 'none',
      flexDirection: 'column',
    }}>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{
          padding: '12px 16px',
          color: '#666666',
          fontSize: 11,
          textTransform: 'uppercase',
          letterSpacing: 1,
          fontWeight: 600,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          Explorer
          <span
            onClick={handleOpenFolder}
            style={{ color: '#2563EB', cursor: 'pointer', fontSize: 13, fontWeight: 500, textTransform: 'none', letterSpacing: 0 }}
            title="Open folder"
          >
            Open...
          </span>
        </div>
        {!state.projectPath ? (
          <div style={{ padding: '20px 16px', textAlign: 'center' }}>
            <div style={{ color: '#999999', fontSize: 13, marginBottom: 12 }}>
              No folder open
            </div>
            <div
              onClick={handleOpenFolder}
              style={{
                background: '#2563EB',
                color: '#FFFFFF',
                padding: '8px 16px',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 500,
                display: 'inline-block',
              }}
            >
              Open Folder
            </div>
          </div>
        ) : (
          tree.map(node => (
            <FileTreeNode
              key={node.path}
              node={node}
              depth={0}
              gitStatuses={gitStatuses}
              onFileClick={handleFileClick}
            />
          ))
        )}
      </div>

      {/* Recent Sessions */}
      <div style={{ borderTop: '1px solid #E5E5E5', flexShrink: 0 }}>
        <div
          onClick={() => setSessionsExpanded(!sessionsExpanded)}
          style={{
            padding: '10px 16px',
            color: '#666666',
            fontSize: 11,
            textTransform: 'uppercase',
            letterSpacing: 1,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span style={{ fontSize: 10 }}>{sessionsExpanded ? '▾' : '▸'}</span>
          Recent Sessions
        </div>
        {sessionsExpanded && (
          <div style={{ maxHeight: 200, overflowY: 'auto' }}>
            {recentSessions.length === 0 ? (
              <div style={{ padding: '4px 16px 10px', color: '#999999', fontSize: 12 }}>
                No sessions yet
              </div>
            ) : (
              recentSessions.slice(0, 8).map(session => (
                <div
                  key={session.projectPath}
                  onClick={() => handleSessionClick(session)}
                  style={{
                    padding: '6px 16px',
                    cursor: 'pointer',
                    fontSize: 12,
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#F5F5F5')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#2563EB', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {session.projectPath.split('/').pop()}
                    </span>
                    <span style={{ color: '#BBBBBB', fontSize: 10, flexShrink: 0, marginLeft: 8 }}>
                      {formatTimeAgo(session.lastOpened)}
                    </span>
                  </div>
                  {session.queries && session.queries.length > 0 && (
                    <div style={{
                      color: '#999999',
                      fontSize: 11,
                      marginTop: 2,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      "{session.queries[0]}"
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}

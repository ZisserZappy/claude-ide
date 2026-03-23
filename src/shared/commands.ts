export interface CheatSheetEntry {
  command: string
  description: string
  category: 'start' | 'session' | 'slash' | 'config' | 'keyboard'
  added?: string
}

export const cheatSheet: CheatSheetEntry[] = [
  // Keyboard shortcuts (IDE features)
  { command: 'Cmd + P', description: 'Quick-open any file by name — fuzzy search across your whole project', category: 'keyboard', added: '2026-03-19' },
  { command: 'Cmd + Shift + F', description: 'Search across all files in your project — results grouped by file', category: 'keyboard', added: '2026-03-19' },
  { command: 'Cmd + F', description: 'Find text in the current file (when an editor tab is open)', category: 'keyboard', added: '2026-03-19' },
  { command: 'Cmd + H', description: 'Find and replace in the current file', category: 'keyboard', added: '2026-03-19' },
  { command: 'Cmd + K', description: 'Select code, then Cmd+K to have Claude edit it inline — describe what you want changed', category: 'keyboard', added: '2026-03-19' },
  { command: 'Cmd + S', description: 'Save the current file', category: 'keyboard' },
  { command: '\u2AFF (split icon)', description: 'Click on any editor tab to view two files side-by-side', category: 'keyboard', added: '2026-03-19' },
  { command: 'Cmd + /', description: 'Toggle the cheat sheet panel — quick reference while you work', category: 'keyboard', added: '2026-03-23' },

  // Starting Claude
  { command: 'claude', description: 'Start a new interactive session in the current directory', category: 'start' },
  { command: 'claude -p "fix the login bug"', description: 'One-shot prompt — get an answer without entering interactive mode', category: 'start' },
  { command: 'claude --resume', description: 'Pick up where you left off — resume your most recent conversation', category: 'start' },
  { command: 'claude --model sonnet', description: 'Start with a specific model (opus, sonnet, haiku) — sonnet is faster & cheaper', category: 'start' },

  // In-session slash commands
  { command: '/help', description: 'Show all available commands and what they do', category: 'slash' },
  { command: '/compact', description: 'Shrink your conversation to free up context — essential for long sessions', category: 'slash' },
  { command: '/clear', description: 'Wipe the conversation and start fresh without restarting', category: 'slash' },
  { command: '/cost', description: 'See how much this session has cost so far', category: 'slash' },
  { command: '/model sonnet', description: 'Switch models mid-conversation without restarting', category: 'slash' },
  { command: '/vim', description: 'Toggle vim keybindings for the input', category: 'slash' },
  { command: '/permissions', description: 'See and change what Claude is allowed to do (file edits, bash, etc.)', category: 'slash' },

  // Managing sessions
  { command: 'claude --continue', description: 'Continue the last conversation (same as --resume but non-interactive)', category: 'session' },
  { command: 'claude -p "summarize" --resume', description: 'Resume a past session and immediately send a follow-up prompt', category: 'session' },
  { command: 'claude --output-format json', description: 'Get structured JSON output — great for piping into other tools', category: 'session' },

  // Config & setup
  { command: 'claude config', description: 'Open the settings menu — set API keys, default model, permissions', category: 'config' },
  { command: 'claude update', description: 'Update Claude Code to the latest version', category: 'config' },
  { command: 'claude mcp', description: 'Manage MCP servers — connect Claude to external tools and data sources', category: 'config' },
]

export const categoryLabels: Record<string, { label: string; color: string }> = {
  keyboard: { label: 'Keyboard Shortcuts & IDE Features', color: '#F59E0B' },
  start: { label: 'Getting Started', color: '#2563EB' },
  slash: { label: 'Slash Commands (use inside a session)', color: '#10B981' },
  session: { label: 'Session Management', color: '#8B5CF6' },
  config: { label: 'Config & Updates', color: '#EC4899' },
}

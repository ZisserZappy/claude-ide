export interface TipContext {
  sessionCount: number
  sessionDuration: number // seconds since first terminal opened
  featuresUsed: Set<string>
  editorTabCount: number
  isFirstLaunch: boolean
}

export interface Tip {
  id: string
  message: string
  condition: (ctx: TipContext) => boolean
}

export const tips: Tip[] = [
  {
    id: 'welcome',
    message: "Hey there! Click the + button to open a terminal. Claude starts automatically — just tell it what you'd like to build.",
    condition: (ctx) => ctx.isFirstLaunch && ctx.sessionCount === 0,
  },
  {
    id: 'compact-reminder',
    message: "Your conversation's getting pretty long! Try typing /compact to give Claude more room to think clearly.",
    condition: (ctx) => ctx.sessionDuration > 600 && !ctx.featuresUsed.has('compact'),
  },
  {
    id: 'cost-check',
    message: "You've got several sessions running — nice! Try /cost in each one to keep tabs on your spending.",
    condition: (ctx) => ctx.sessionCount >= 3,
  },
  {
    id: 'discover-quickopen',
    message: "Here's a time-saver: press Cmd+P to quickly jump to any file. No more hunting through folders!",
    condition: (ctx) => ctx.sessionCount >= 2 && !ctx.featuresUsed.has('quickOpen'),
  },
  {
    id: 'discover-project-search',
    message: "Need to find something across your codebase? Cmd+Shift+F searches every file in your project at once.",
    condition: (ctx) => ctx.editorTabCount >= 2 && !ctx.featuresUsed.has('projectSearch'),
  },
  {
    id: 'discover-find-replace',
    message: "Quick one — Cmd+F lets you search inside any open file, and Cmd+H does find-and-replace.",
    condition: (ctx) => ctx.editorTabCount >= 1 && !ctx.featuresUsed.has('findReplace'),
  },
  {
    id: 'discover-split',
    message: "Want to compare two files side by side? Click the \u2AFF icon on any editor tab to split the view.",
    condition: (ctx) => ctx.editorTabCount >= 2 && !ctx.featuresUsed.has('split'),
  },
  {
    id: 'long-session-model',
    message: "Session going well? You can switch to a faster model with /model sonnet, or check your spend with /cost.",
    condition: (ctx) => ctx.sessionDuration > 1200 && !ctx.featuresUsed.has('modelSwitch'),
  },
  {
    id: 'resume-tip',
    message: "Fun fact: you can pick up right where you left off! Type claude --resume to continue your last conversation.",
    condition: (ctx) => ctx.sessionCount >= 2 && !ctx.featuresUsed.has('resume'),
  },
  {
    id: 'one-shot-tip',
    message: "Need a quick answer? Try claude -p \"your question\" — it responds right away without starting a full session.",
    condition: (ctx) => ctx.sessionCount >= 3 && ctx.sessionDuration > 300,
  },
  {
    id: 'permissions-tip',
    message: "Tired of clicking 'allow' every time? Type /permissions to let Claude handle certain actions automatically.",
    condition: (ctx) => ctx.sessionDuration > 900,
  },
  {
    id: 'save-reminder',
    message: "Remember to save your work with Cmd+S! Claude picks up your saved changes in real time.",
    condition: (ctx) => ctx.featuresUsed.has('fileEdit') && !ctx.featuresUsed.has('fileSave'),
  },
  {
    id: 'discover-inline-edit',
    message: "Try this: select some code and press Cmd+K. You can describe what you want changed and Claude edits it right there.",
    condition: (ctx) => ctx.featuresUsed.has('fileEdit') && !ctx.featuresUsed.has('inlineEdit'),
  },
]

export function evaluateTips(ctx: TipContext, firedIds: Set<string>): Tip | null {
  for (const tip of tips) {
    if (firedIds.has(tip.id)) continue
    if (tip.condition(ctx)) return tip
  }
  return null
}

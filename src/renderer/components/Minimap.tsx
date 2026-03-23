import { useEffect, useRef, useCallback } from 'react'
import type { Terminal } from '@xterm/xterm'

interface Props {
  terminal: Terminal | null
  visible: boolean
}

const MINIMAP_WIDTH = 80
const LINE_HEIGHT = 2
const CHAR_WIDTH = 1.2
const VIEWPORT_COLOR = 'rgba(37, 99, 235, 0.12)'
const VIEWPORT_BORDER_COLOR = 'rgba(37, 99, 235, 0.3)'

export default function Minimap({ terminal, visible }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const rafId = useRef<number>(0)
  const lastRenderTime = useRef(0)

  const render = useCallback(() => {
    if (!terminal || !canvasRef.current || !containerRef.current) return

    const now = Date.now()
    if (now - lastRenderTime.current < 80) return // throttle to ~12fps
    lastRenderTime.current = now

    const canvas = canvasRef.current
    const container = containerRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const buffer = terminal.buffer.active
    const totalLines = buffer.length
    const viewportSize = terminal.rows
    const viewportStart = buffer.viewportY

    // Size canvas to container
    const dpr = window.devicePixelRatio || 1
    const containerHeight = container.clientHeight
    canvas.width = MINIMAP_WIDTH * dpr
    canvas.height = containerHeight * dpr
    canvas.style.width = `${MINIMAP_WIDTH}px`
    canvas.style.height = `${containerHeight}px`
    ctx.scale(dpr, dpr)

    // Clear
    ctx.fillStyle = '#FAFAFA'
    ctx.fillRect(0, 0, MINIMAP_WIDTH, containerHeight)

    // Calculate scale: map total lines to canvas height
    const scale = totalLines > 0 ? Math.min(LINE_HEIGHT, containerHeight / totalLines) : LINE_HEIGHT

    // Color map for syntax-like coloring
    const colors: Record<string, string> = {
      text: '#AAAAAA',
      keyword: '#93A3C0',
      bright: '#8899AA',
    }

    // Draw lines
    for (let i = 0; i < totalLines; i++) {
      const y = i * scale
      if (y > containerHeight) break

      const line = buffer.getLine(i)
      if (!line) continue
      const text = line.translateToString(true)
      if (!text.trim()) continue

      // Draw a simplified representation
      let x = 2
      const indent = text.length - text.trimStart().length
      x += indent * CHAR_WIDTH

      // Draw text as tiny colored blocks
      const trimmed = text.trim()
      const blockWidth = Math.min(trimmed.length * CHAR_WIDTH, MINIMAP_WIDTH - x - 2)

      if (blockWidth > 0) {
        // Use slightly different colors based on content heuristics
        if (trimmed.startsWith('#') || trimmed.startsWith('//') || trimmed.startsWith('*')) {
          ctx.fillStyle = '#C8D0DA'
        } else if (trimmed.startsWith('$') || trimmed.startsWith('>')) {
          ctx.fillStyle = '#7BA3D4'
        } else {
          ctx.fillStyle = colors.text
        }
        ctx.fillRect(x, y, blockWidth, Math.max(scale - 0.5, 1))
      }
    }

    // Draw viewport indicator
    const vpY = viewportStart * scale
    const vpHeight = viewportSize * scale
    ctx.fillStyle = VIEWPORT_COLOR
    ctx.fillRect(0, vpY, MINIMAP_WIDTH, vpHeight)
    ctx.strokeStyle = VIEWPORT_BORDER_COLOR
    ctx.lineWidth = 1
    ctx.strokeRect(0.5, vpY + 0.5, MINIMAP_WIDTH - 1, vpHeight - 1)
  }, [terminal])

  // Set up render listeners
  useEffect(() => {
    if (!terminal || !visible) return

    const scheduleRender = () => {
      cancelAnimationFrame(rafId.current)
      rafId.current = requestAnimationFrame(render)
    }

    // Initial render
    scheduleRender()

    const disposables = [
      terminal.onRender(scheduleRender),
      terminal.onScroll(scheduleRender),
    ]

    // Also re-render on resize
    const resizeObserver = new ResizeObserver(scheduleRender)
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }

    return () => {
      disposables.forEach(d => d.dispose())
      resizeObserver.disconnect()
      cancelAnimationFrame(rafId.current)
    }
  }, [terminal, visible, render])

  const scrollToPosition = useCallback((clientY: number) => {
    if (!terminal || !containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const relativeY = clientY - rect.top
    const fraction = relativeY / rect.height

    const buffer = terminal.buffer.active
    const totalLines = buffer.length
    const targetLine = Math.floor(fraction * totalLines)
    const halfViewport = Math.floor(terminal.rows / 2)
    const scrollTo = Math.max(0, targetLine - halfViewport)

    terminal.scrollToLine(scrollTo)
  }, [terminal])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true
    scrollToPosition(e.clientY)
  }, [scrollToPosition])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging.current) {
      scrollToPosition(e.clientY)
    }
  }, [scrollToPosition])

  const handleMouseUp = useCallback(() => {
    isDragging.current = false
  }, [])

  useEffect(() => {
    const handleGlobalMouseUp = () => { isDragging.current = false }
    window.addEventListener('mouseup', handleGlobalMouseUp)
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp)
  }, [])

  if (!visible) return null

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      style={{
        width: MINIMAP_WIDTH,
        height: '100%',
        flexShrink: 0,
        background: '#FAFAFA',
        borderLeft: '1px solid #EEEEEE',
        cursor: 'pointer',
        position: 'relative',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          width: MINIMAP_WIDTH,
          height: '100%',
        }}
      />
    </div>
  )
}

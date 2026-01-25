import { useEffect, useRef } from 'react'

export function InteractiveBackground() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return
      const { clientX, clientY } = e
      const x = (clientX / window.innerWidth) * 100
      const y = (clientY / window.innerHeight) * 100
      containerRef.current.style.setProperty('--mouse-x', `${x}%`)
      containerRef.current.style.setProperty('--mouse-y', `${y}%`)
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none overflow-hidden z-0"
    >
      {/* Dynamic Glow Orb - follows cursor */}
      <div
        className="absolute w-[500px] h-[500px] rounded-full blur-[100px] opacity-20 transition-all duration-300 ease-out"
        style={{
          background: 'var(--neon-glow-primary)',
          left: 'var(--mouse-x, 50%)',
          top: 'var(--mouse-y, 50%)',
          transform: 'translate(-50%, -50%)',
        }}
      />

      {/* Static Ambient Glows */}
      <div
        className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full blur-[120px] opacity-10"
        style={{ background: 'var(--neon-glow-secondary)' }}
      />
      <div
        className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full blur-[120px] opacity-10"
        style={{ background: 'var(--neon-glow-primary)' }}
      />

      {/* Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)]" />

      {/* System Scan Line */}
      <div className="absolute inset-0 z-10 pointer-events-none animate-sys-scan opacity-20">
        <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_20px_2px_rgba(34,211,238,0.5)]" />
      </div>
    </div>
  )
}

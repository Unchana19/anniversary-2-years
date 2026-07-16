import { useEffect, useRef, useState } from 'react'
import { CONFIG } from './config'
import { Game, type UIState } from './engine'
import { Photo } from './Photo'

const INITIAL: UIState = { screen: 'title', skip: false, cutIndex: 0 }

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameRef = useRef<Game | null>(null)
  const [ui, setUi] = useState<UIState>(INITIAL)

  useEffect(() => {
    if (!canvasRef.current) return
    const game = new Game(canvasRef.current, setUi)
    gameRef.current = game
    if (import.meta.env.DEV) (window as unknown as { __game: Game }).__game = game
    return () => game.destroy()
  }, [])

  const g = () => gameRef.current
  const chapter = CONFIG.chapters[ui.cutIndex]

  // Touch pad: press/release feed the engine directly.
  const pad = (k: 'left' | 'right' | 'jump') => ({
    onPointerDown: (e: React.PointerEvent) => { e.preventDefault(); g()?.setKey(k, true) },
    onPointerUp: (e: React.PointerEvent) => { e.preventDefault(); g()?.setKey(k, false) },
    onPointerLeave: () => g()?.setKey(k, false),
    onPointerCancel: () => g()?.setKey(k, false),
  })

  return (
    <div id="wrap">
      <canvas id="c" ref={canvasRef} />

      {ui.screen === null && (
        <div id="touch" className="on">
          <div className="pad" id="bL" {...pad('left')}>◀</div>
          <div className="pad" id="bR" {...pad('right')}>▶</div>
          <div className="pad" id="bJ" {...pad('jump')}>A</div>
        </div>
      )}

      {ui.screen === null && ui.skip && (
        <div id="skip" className="on" onClick={() => g()?.doSkip()}>SKIP ▸</div>
      )}

      {ui.screen === 'title' && (
        <div className="screen on">
          <div className="panel px">
            <h1>
              2 YEARS<br />
              <span style={{ color: '#7ee0ff' }}>{CONFIG.herName}&rsquo;S QUEST</span>
            </h1>
            <p className="cap">A tiny adventure through us — hero: {CONFIG.playerName}</p>
            <div className="btn" onClick={() => g()?.pressStart()}>▶ Press Start</div>
            <div className="hint">← → move &nbsp;•&nbsp; Space / ↑ jump</div>
          </div>
        </div>
      )}

      {ui.screen === 'cut' && (
        <div className="screen on">
          <div className="panel px">
            <h2>{chapter.title}</h2>
            <Photo src={chapter.photo} />
            <p className="cap">{chapter.caption}</p>
            <div className="btn" onClick={() => g()?.continueCut()}>Continue ▸</div>
          </div>
        </div>
      )}

      {ui.screen === 'boss' && (
        <div className="screen on">
          <div className="panel px">
            <h1 style={{ color: '#ff5db1' }}>⚠ FINAL BOSS</h1>
            <h2 style={{ fontSize: 20, color: '#ffe14d' }}>{CONFIG.boss.name}</h2>
            <Photo src={CONFIG.boss.photo} />
            <p className="cap px" style={{ fontSize: 18, color: '#7ee0ff' }}>{CONFIG.boss.taunt}</p>
            <p className="cap">{CONFIG.boss.how}</p>
            <div className="btn" onClick={() => g()?.bossGo()}>Boop them! ▸</div>
          </div>
        </div>
      )}

      {ui.screen === 'end' && (
        <div className="screen on">
          <div className="panel px">
            <h1>{CONFIG.finaleTitle}</h1>
            <Photo src={CONFIG.finalePhoto} />
            <p className="cap">{CONFIG.finaleMessage}</p>
            <p className="cap px" style={{ color: '#ffe14d' }}>♥&nbsp;&nbsp;{CONFIG.anniversary}&nbsp;&nbsp;♥</p>
            <div className="btn" onClick={() => g()?.playAgain()}>↺ Play Again</div>
          </div>
        </div>
      )}
    </div>
  )
}

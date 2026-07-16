import { useEffect, useRef, useState } from 'react'
import { CONFIG } from './config'
import { Game, type UIState } from './engine'
import { Photo } from './Photo'

const INITIAL: UIState = { screen: 'title', skip: false, cutIndex: 0, perfect: false, allStars: false }

const BG_ELEMENTS = (
  <div className="screen-bg">
    <div className="heart-particle hp-1">♥</div>
    <div className="heart-particle hp-2">♥</div>
    <div className="heart-particle hp-3">♥</div>
    <div className="heart-particle hp-4">♥</div>
    <div className="heart-particle hp-5">♥</div>
    <div className="heart-particle hp-6">♥</div>
    <div className="bg-star bs-1">★</div>
    <div className="bg-star bs-2">✦</div>
    <div className="bg-star bs-3">★</div>
    <div className="bg-star bs-4">✦</div>
    <div className="bg-star bs-5">★</div>
  </div>
)


export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameRef = useRef<Game | null>(null)
  const [ui, setUi] = useState<UIState>(INITIAL)
  const [showGuide, setShowGuide] = useState(false)

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
      <div id="game-container">
        <canvas id="c" ref={canvasRef} />

        {ui.screen === null && (
          <>
            <button
              className="hud-help-row"
              onClick={() => {
                const game = g();
                if (game) {
                  game.setPaused(true);
                  game.beep(700, 0.05);
                }
                setShowGuide(true);
              }}
              aria-label="คู่มือการควบคุม"
            >
              <span className="hud-help-btn">?</span>
              <span className="hud-help-text">การควบคุม</span>
            </button>
            <div id="touch" className="on">
              <div className="pad" id="bL" {...pad('left')}>
                <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
                  <path d="M14 7l-5 5 5 5V7z" />
                </svg>
              </div>
              <div className="pad" id="bR" {...pad('right')}>
                <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
                  <path d="M10 17l5-5-5-5v10z" />
                </svg>
              </div>
              <div className="pad" id="bJ" {...pad('jump')}>A</div>
            </div>
          </>
        )}

        {ui.screen === null && ui.skip && (
          <button id="skip" className="on" onClick={() => g()?.doSkip()}>ข้าม</button>
        )}

        {ui.screen === 'title' && (
          <div className="screen on">
            {BG_ELEMENTS}
            <div className="panel px">
              <div className="corner-heart top-left">♥</div>
              <div className="corner-heart top-right">♥</div>
              <div className="corner-heart bottom-left">♥</div>
              <div className="corner-heart bottom-right">♥</div>
              <h1>
                ครบรอบ 2 ปี<br />
                <span style={{ color: '#7ee0ff' }}>ภารกิจของ {CONFIG.herName}</span>
              </h1>
              <p className="cap">การผจญภัยเล็ก ๆ ของสองเรา — ฮีโร่: {CONFIG.playerName}</p>
              
              <div className="char-select">
                <div className="char-card active">
                  <div className="char-tag">ผู้เล่น 1</div>
                  <div className="char-sprite-wrap">
                    <svg viewBox="0 0 16 20" className="char-sprite">
                      {/* Oat Hair base */}
                      <rect x="2" y="1" width="12" height="4" fill="#ffe14d" />
                      <rect x="4" y="0" width="8" height="1" fill="#ffe14d" />
                      {/* Oat Hair highlight & shadow */}
                      <rect x="5" y="1" width="4" height="1" fill="#fff3a8" />
                      <rect x="2" y="5" width="12" height="1" fill="#ffa200" />
                      {/* Side bangs */}
                      <rect x="1" y="3" width="1" height="3" fill="#ffe14d" />
                      <rect x="1" y="6" width="1" height="1" fill="#ffa200" />
                      <rect x="14" y="3" width="1" height="3" fill="#ffe14d" />
                      <rect x="14" y="6" width="1" height="1" fill="#ffa200" />
                      
                      {/* Oat Face & shadow */}
                      <rect x="2" y="5" width="12" height="7" fill="#ffd0a8" />
                      <rect x="2" y="5" width="1" height="7" fill="#e59677" />
                      {/* Oat Eye (looking right) & blush */}
                      <rect x="9" y="7" width="3" height="3" fill="#0a0620" />
                      <rect x="11" y="7" width="1" height="1" fill="#ffffff" />
                      <rect x="11" y="9" width="2" height="1" fill="#ff8ab8" />
                      
                      {/* Oat Shirt & shadow */}
                      <rect x="2" y="12" width="12" height="5" fill="#ff3d81" />
                      <rect x="1" y="12" width="1" height="3" fill="#ff3d81" />
                      <rect x="14" y="12" width="1" height="3" fill="#ff3d81" />
                      <rect x="2" y="15" width="3" height="2" fill="#b3005a" />
                      {/* Heart logo */}
                      <rect x="9" y="13" width="1" height="1" fill="#ffffff" />
                      <rect x="11" y="13" width="1" height="1" fill="#ffffff" />
                      <rect x="9" y="14" width="3" height="1" fill="#ffffff" />
                      <rect x="10" y="15" width="1" height="1" fill="#ffffff" />
                      
                      {/* Oat Legs & shoes */}
                      <rect x="2" y="17" width="4" height="2" fill="#2b3a67" />
                      <rect x="2" y="19" width="4" height="1" fill="#ffffff" />
                      <rect x="10" y="17" width="4" height="2" fill="#2b3a67" />
                      <rect x="10" y="19" width="4" height="1" fill="#ffffff" />
                    </svg>
                  </div>
                  <div className="char-info">
                    <div className="char-name">{CONFIG.playerName.toUpperCase()}</div>
                    <div className="char-status">พร้อมลุย!</div>
                  </div>
                </div>
                
                <div className="char-card target">
                  <div className="char-tag" style={{ color: '#ff8ab8' }}>ที่รัก</div>
                  <div className="char-sprite-wrap">
                    <svg viewBox="0 0 16 20" className="char-sprite">
                      {/* Milk Hair base */}
                      <rect x="2" y="1" width="12" height="4" fill="#b87a55" />
                      <rect x="4" y="0" width="8" height="1" fill="#b87a55" />
                      {/* Red Hair Bow */}
                      <rect x="2" y="0" width="3" height="2" fill="#ff3d81" />
                      <rect x="3" y="1" width="1" height="1" fill="#ff8ab8" />
                      {/* Milk Hair shadow */}
                      <rect x="2" y="5" width="12" height="1" fill="#8c583a" />
                      {/* Side bangs */}
                      <rect x="1" y="3" width="1" height="3" fill="#b87a55" />
                      <rect x="1" y="6" width="1" height="1" fill="#8c583a" />
                      <rect x="14" y="3" width="1" height="3" fill="#b87a55" />
                      <rect x="14" y="6" width="1" height="1" fill="#8c583a" />
                      
                      {/* Milk Face & shadow */}
                      <rect x="2" y="5" width="12" height="7" fill="#ffd0a8" />
                      <rect x="13" y="5" width="1" height="7" fill="#e59677" />
                      {/* Milk Eye (looking left) & blush */}
                      <rect x="4" y="7" width="3" height="3" fill="#0a0620" />
                      <rect x="4" y="7" width="1" height="1" fill="#ffffff" />
                      <rect x="3" y="9" width="2" height="1" fill="#ff8ab8" />
                      
                      {/* Milk Shirt & shadow */}
                      <rect x="2" y="12" width="12" height="5" fill="#7ee0ff" />
                      <rect x="1" y="12" width="1" height="3" fill="#7ee0ff" />
                      <rect x="14" y="12" width="1" height="3" fill="#7ee0ff" />
                      <rect x="11" y="15" width="3" height="2" fill="#4ba5cc" />
                      {/* Heart logo */}
                      <rect x="4" y="13" width="1" height="1" fill="#ffffff" />
                      <rect x="6" y="13" width="1" height="1" fill="#ffffff" />
                      <rect x="4" y="14" width="3" height="1" fill="#ffffff" />
                      <rect x="5" y="15" width="1" height="1" fill="#ffffff" />
                      
                      {/* Milk Legs & shoes */}
                      <rect x="2" y="17" width="4" height="2" fill="#2b3a67" />
                      <rect x="2" y="19" width="4" height="1" fill="#ffffff" />
                      <rect x="10" y="17" width="4" height="2" fill="#2b3a67" />
                      <rect x="10" y="19" width="4" height="1" fill="#ffffff" />
                    </svg>
                  </div>
                  <div className="char-info">
                    <div className="char-name">{CONFIG.herName.toUpperCase()}</div>
                    <div className="char-status">คนสำคัญ</div>
                  </div>
                </div>
              </div>

              <div className="title-buttons">
                <button className="btn" onClick={() => g()?.pressStart()}>เริ่มเกม</button>
                <button className="btn secondary" onClick={() => {
                  const game = g();
                  if (game) {
                    game.initAudio();
                    game.beep(700, 0.05);
                  }
                  setShowGuide(true);
                }}>การควบคุม</button>
              </div>
              <div className="hint">← → เคลื่อนที่ &nbsp;•&nbsp; Space / ↑ กระโดด (กด 2 ครั้งเพื่อกระโดดสองชั้น!)</div>
            </div>
          </div>
        )}

        {showGuide && (
          <div className="screen on">
            {BG_ELEMENTS}
            <div className="panel px guide-panel">
              <div className="corner-heart top-left">♥</div>
              <div className="corner-heart top-right">♥</div>
              <div className="corner-heart bottom-left">♥</div>
              <div className="corner-heart bottom-right">♥</div>
              <h2>♥ คู่มือการควบคุม ♥</h2>
              
              <div className="guide-content">
                <div className="guide-section">
                  <h3>คีย์บอร์ด (PC)</h3>
                  <table className="guide-table">
                    <tbody>
                      <tr>
                        <td>
                          <span className="key-cap">A</span>
                          <span className="key-cap">◀</span>
                        </td>
                        <td>เดินซ้าย</td>
                      </tr>
                      <tr>
                        <td>
                          <span className="key-cap">D</span>
                          <span className="key-cap">▶</span>
                        </td>
                        <td>เดินขวา</td>
                      </tr>
                      <tr>
                        <td>
                          <span className="key-cap" style={{ minWidth: '46px' }}>Space</span>
                          <span className="key-cap">W</span>
                          <span className="key-cap">▲</span>
                        </td>
                        <td>กระโดด (2 ชั้น)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="guide-section">
                  <h3>สัมผัส (มือถือ)</h3>
                  <table className="guide-table">
                    <tbody>
                      <tr>
                        <td>
                          <span className="key-cap inline-svg">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                              <path d="M14 7l-5 5 5 5V7z" />
                            </svg>
                          </span>
                        </td>
                        <td>เดินซ้าย</td>
                      </tr>
                      <tr>
                        <td>
                          <span className="key-cap inline-svg">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                              <path d="M10 17l5-5-5-5v10z" />
                            </svg>
                          </span>
                        </td>
                        <td>เดินขวา</td>
                      </tr>
                      <tr>
                        <td>
                          <span className="key-cap circle">A</span>
                        </td>
                        <td>กระโดด (2 ชั้น)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="dialog-box guide-tips">
                <p className="cap">★ คำแนะนำ: เก็บดาวทุกดวงเพื่อเคลียร์แบบสมบูรณ์แบบ! แตะจมูกน้องหมา 3 ครั้งเพื่อเอาชนะ!</p>
              </div>

              <button className="btn secondary" onClick={() => {
                const game = g();
                if (game) {
                  game.beep(600, 0.05);
                  game.setPaused(false);
                }
                setShowGuide(false);
              }}>ย้อนกลับ</button>
            </div>
          </div>
        )}

        {ui.screen === 'cut' && (
          <div className="screen on">
            {BG_ELEMENTS}
            <div className="panel px">
              <div className="corner-heart top-left">♥</div>
              <div className="corner-heart top-right">♥</div>
              <div className="corner-heart bottom-left">♥</div>
              <div className="corner-heart bottom-right">♥</div>
              <h2>♥ {chapter.title} ♥</h2>
              <Photo src={chapter.photo} />
              <div className="dialog-box">
                <p className="cap">{chapter.caption}</p>
                <div className="dialog-arrow">▼</div>
              </div>
              {ui.perfect && (
                <div className="perfect-badge">
                  <svg className="badge-star" viewBox="0 0 24 24" width="16" height="16" fill="url(#starGradApp)" style={{ filter: 'drop-shadow(0 0 4px rgba(255, 225, 77, 0.8))' }}>
                    <defs>
                      <linearGradient id="starGradApp" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#fff3a8" />
                        <stop offset="40%" stopColor="#ffe14d" />
                        <stop offset="100%" stopColor="#ffa200" />
                      </linearGradient>
                    </defs>
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                  </svg>
                  <span className="badge-text">เคลียร์สมบูรณ์แบบ!</span>
                  <svg className="badge-star" viewBox="0 0 24 24" width="16" height="16" fill="url(#starGradApp)" style={{ filter: 'drop-shadow(0 0 4px rgba(255, 225, 77, 0.8))' }}>
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                  </svg>
                </div>
              )}
              <button className="btn" onClick={() => g()?.continueCut()}>ไปต่อ</button>
            </div>
          </div>
        )}

        {ui.screen === 'boss' && (
          <div className="screen on">
            {BG_ELEMENTS}
            <div className="panel px">
              <div className="corner-heart top-left">♥</div>
              <div className="corner-heart top-right">♥</div>
              <div className="corner-heart bottom-left">♥</div>
              <div className="corner-heart bottom-right">♥</div>
              <h1 style={{ color: '#ff5db1' }}>⚠ บอสใหญ่ด่านสุดท้าย</h1>
              <h2 style={{ fontSize: 12, color: '#ffe14d' }}>♥ {CONFIG.boss.name} ♥</h2>
              <Photo src={CONFIG.boss.photo} />
              <p className="cap px" style={{ fontSize: 18, color: '#7ee0ff', marginBottom: '8px' }}>{CONFIG.boss.taunt}</p>
              <div className="dialog-box">
                <p className="cap">{CONFIG.boss.how}</p>
                <div className="dialog-arrow">▼</div>
              </div>
              <button className="btn" onClick={() => g()?.bossGo()}>จิ้มจมูกเลย!</button>
            </div>
          </div>
        )}

        {ui.screen === 'end' && (
          <div className="screen on">
            {BG_ELEMENTS}
            <div className="panel px">
              <div className="corner-heart top-left">♥</div>
              <div className="corner-heart top-right">♥</div>
              <div className="corner-heart bottom-left">♥</div>
              <div className="corner-heart bottom-right">♥</div>
              <h1>{CONFIG.finaleTitle}</h1>
              <Photo src={CONFIG.finalePhoto} />
              <div className="dialog-box">
                <p className="cap">{CONFIG.finaleMessage}</p>
                {ui.allStars && (
                  <p className="cap px" style={{ color: '#7ee0ff', fontSize: '16px', marginTop: '8px' }}>
                    ★ คุณเก็บดาวได้ครบทุกดวงเลย — เหมือนกับที่คุณตามหาฉันจนเจอ ★
                  </p>
                )}
                <div className="dialog-arrow">♥</div>
              </div>
              <p className="cap px" style={{ color: '#ffe14d', fontSize: '20px', marginTop: '12px' }}>♥&nbsp;&nbsp;{CONFIG.anniversary}&nbsp;&nbsp;♥</p>
              <button className="btn" onClick={() => g()?.playAgain()}>เล่นอีกครั้ง</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

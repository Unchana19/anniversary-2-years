/* ============================================================
   ENGINE  —  8-bit platformer. Framework-agnostic.
   Owns the canvas, game loop, physics, audio and boss.
   React drives it through public methods and reads UI state
   through the onUI callback.
   ============================================================ */
import { CONFIG } from './config'

const W = 480, H = 270, GRAV = 0.45, MOVE = 2.7, MAXFALL = 8.5, JUMP = -10.4
const GH = 26, GY = H - GH

type Solid = { x: number; y: number; w: number; h: number }
type Haz = { x: number; y: number; w: number; h: number; hz: number }
type Star = { x: number; y: number; got: boolean }
// oscillating platform: rides sin(t) along one axis; px/py hold last frame so dx/dy carries the player
type Mover = { x0: number; y0: number; x: number; y: number; w: number; h: number; amp: number; sp: number; ax: 'x' | 'y'; ph: number; px: number; py: number; dx: number; dy: number }
type Npc = { x: number; y: number; type: 'milk' | 'cat' | 'bird' | 'bunny'; face: number; msg: string }
type Level = {
  w: number
  start: { x: number; y: number }
  solids: Solid[]
  haz: Haz[]
  stars: Star[]
  goalX: number
  bossX?: number
  movers?: Mover[]
  npcs?: Npc[]
}

const grd = (x: number, w: number): Solid => ({ x, y: GY, w, h: GH })
const plat = (x: number, y: number, w: number): Solid => ({ x, y, w, h: 10 })
const spk = (x: number, w: number): Haz => ({ x, y: GY - 18, w, h: 18, hz: 1 })
const star = (x: number, y: number): Star => ({ x, y, got: false })
const mvr = (x: number, y: number, w: number, amp: number, sp: number, ax: 'x' | 'y', ph = 0): Mover =>
  ({ x0: x, y0: y, x, y, w, h: 10, amp, sp, ax, ph, px: x, py: y, dx: 0, dy: 0 })

const LEVELS: Level[] = [
  { w: 1500, start: { x: 40, y: GY - 40 },
    solids: [grd(0, 560), grd(600, 900), plat(300, GY - 58, 70), plat(420, GY - 90, 70)],
    haz: [spk(750, 26), spk(1100, 26)], stars: [star(320, GY - 84), star(690, GY - 40)], goalX: 1420,
    npcs: [
      { x: 325, y: GY - 58 - 16, type: 'cat', face: 1, msg: "เหมียว! ยินดีต้อนรับสู่ภารกิจของ Oat! 🐾" },
      { x: 1390, y: GY - 20, type: 'milk', face: -1, msg: "Oat! คุณหาฉันเจอแล้ว! ♥" }
    ] },
  { w: 1700, start: { x: 40, y: GY - 40 },
    solids: [grd(0, 540), grd(588, 1192), plat(260, GY - 56, 80), plat(388, GY - 92, 80), plat(516, GY - 128, 80)],
    haz: [spk(200, 26), spk(760, 26), spk(1100, 26)], stars: [star(556, GY - 150), star(900, GY - 40)], goalX: 1620,
    npcs: [
      { x: 800, y: GY - 16, type: 'bunny', face: 1, msg: "ฮึบ! ระวังหนามสีแดงด้วยนะ! 🐰" },
      { x: 1590, y: GY - 20, type: 'milk', face: -1, msg: "เย้ การผจญภัยครั้งแรกของเรา! 🏍️" }
    ] },
  { w: 1900, start: { x: 40, y: GY - 40 },
    solids: [grd(0, 300), plat(348, GY - 60, 90), plat(486, GY - 90, 90), plat(624, GY - 64, 90),
             grd(762, 360), plat(1170, GY - 70, 90), plat(1308, GY - 50, 90), grd(1446, 454)],
    haz: [
      spk(800, 26), spk(950, 26), spk(1550, 26), spk(1700, 26),
      { x: 650, y: GY - 64 - 18, w: 26, h: 18, hz: 1 }
    ],
    stars: [star(531, GY - 116), star(1215, GY - 100)], goalX: 1820,
    movers: [mvr(870, GY - 74, 70, 100, 0.02, 'x')],
    npcs: [
      { x: 520, y: GY - 90 - 12, type: 'bird', face: -1, msg: "จิ๊บๆ! เก็บดาวดวงนั้นเลย! ✦" },
      { x: 1790, y: GY - 20, type: 'milk', face: -1, msg: "คืนที่เงียบสงบคือคืนโปรดของฉันเลย ✨" }
    ] },
  { w: 2100, start: { x: 40, y: GY - 40 },
    solids: [grd(0, 480), grd(528, 332), plat(908, GY - 64, 90), plat(1046, GY - 100, 90),
             plat(1184, GY - 60, 90), grd(1322, 378), plat(1748, GY - 64, 90), grd(1886, 214)],
    haz: [
      spk(180, 26), spk(300, 26), spk(700, 26), spk(1500, 26), spk(1940, 26),
      { x: 940, y: GY - 64 - 18, w: 26, h: 18, hz: 1 }
    ],
    stars: [star(1091, GY - 124), star(1793, GY - 96)], goalX: 2020,
    movers: [mvr(630, GY - 68, 70, 70, 0.024, 'x', 1)],
    npcs: [
      { x: 150, y: GY - 16, type: 'cat', face: 1, msg: "สุขสันต์วันครบรอบ 2 ปีนะ! 🐱" },
      { x: 1080, y: GY - 100 - 16, type: 'bunny', face: -1, msg: "กระโดดข้ามช่องว่างพวกนั้นเลย! 🐰" },
      { x: 1990, y: GY - 20, type: 'milk', face: -1, msg: "ใกล้จะถึงแล้วนะ Oat! 🎄" }
    ] },
  // L5: short run -> BOSS (the two dogs) -> flag
  { w: 1500, start: { x: 40, y: GY - 40 },
    solids: [grd(0, 1500), plat(360, GY - 58, 70), plat(480, GY - 92, 70)],
    haz: [
      spk(250, 26), spk(440, 26), spk(850, 26), spk(1080, 26)
    ],
    stars: [star(390, GY - 84), star(515, GY - 116)], goalX: 1440,
    bossX: 1140,
    npcs: [
      { x: 390, y: GY - 58 - 12, type: 'bird', face: 1, msg: "จิ๊บๆ! จิ้มจมูกพวกเขาเบาๆ นะ! 🐾" },
      { x: 1410, y: GY - 20, type: 'milk', face: -1, msg: "สุขสันต์วันครบรอบ 2 ปีนะที่รัก! 🐶♥" }
    ] },
]

enum Mode { TITLE, PLAY }

export type Screen = 'title' | 'cut' | 'boss' | 'end' | null
export interface UIState {
  screen: Screen
  skip: boolean
  cutIndex: number
  perfect: boolean
  allStars: boolean
}

type Boss = { x: number; y: number; w: number; h: number; hp: number; cd: number; hop: number }
type Player = {
  x: number; y: number; vx: number; vy: number; w: number; h: number
  onGround: boolean; face: number; coyote: number; buf: number; dead: number; dj: number; sq: number
}
type Heart = { x: number; y: number; vx: number; vy: number; life: number }
type Confetti = { x: number; y: number; s: number; vy: number }
type Fx = { x: number; y: number; vx: number; vy: number; life: number; max: number; kind: 'dust' | 'spark' | 'text'; c: string; g: number; txt?: string }

const NOTE: Record<string, number> = {
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392, A4: 440, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880, B5: 987.77, C6: 1046.5,
}

export class Game {
  private ctx: CanvasRenderingContext2D
  private ui: UIState = { screen: 'title', skip: false, cutIndex: 0, perfect: false, allStars: false }
  private onUI: (s: UIState) => void

  private mode: Mode = Mode.TITLE
  private lvl = 0
  private lives = 3
  private deaths = 0
  private stars = 0
  private cam = 0
  private shake = 0
  private t = 0

  private p: Player = { x: 0, y: 0, vx: 0, vy: 0, w: 16, h: 20, onGround: false, face: 1, coyote: 0, buf: 0, dead: 0, dj: 0, sq: 0 }
  private keys = { left: false, right: false, jump: false }
  public paused = false

  private boss: Boss | null = null
  private bossIntroShown = false
  private hearts: Heart[] = []
  private confetti: Confetti[] = []
  private fx: Fx[] = []
  private totalStars = 0
  private combo = 0
  private comboT = 0
  private shootStar: { x: number; y: number; vx: number; vy: number; len: number; life: number } | null = null

  private imgs: Record<string, HTMLImageElement & { ok?: boolean }> = {}
  private AC: AudioContext | null = null
  private songTimer: ReturnType<typeof setTimeout> | null = null

  private raf = 0
  private onKeyDown: (e: KeyboardEvent) => void
  private onKeyUp: (e: KeyboardEvent) => void

  constructor(canvas: HTMLCanvasElement, onUI: (s: UIState) => void) {
    canvas.width = W
    canvas.height = H
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('2d context unavailable')
    this.ctx = ctx
    this.ctx.imageSmoothingEnabled = false
    this.onUI = onUI

    CONFIG.chapters.forEach((c) => this.loadImg(c.photo))
    this.loadImg(CONFIG.boss.photo)
    this.loadImg(CONFIG.finalePhoto)

    this.onKeyDown = (e) => {
      if (this.paused) return
      const k = e.key.toLowerCase()
      if (['arrowleft', 'a'].includes(k)) this.keys.left = true
      if (['arrowright', 'd'].includes(k)) this.keys.right = true
      if (['arrowup', 'w', ' ', 'spacebar'].includes(k)) { this.keys.jump = true; this.p.buf = 8; e.preventDefault() }
    }
    this.onKeyUp = (e) => {
      if (this.paused) return
      const k = e.key.toLowerCase()
      if (['arrowleft', 'a'].includes(k)) this.keys.left = false
      if (['arrowright', 'd'].includes(k)) this.keys.right = false
      if (['arrowup', 'w', ' ', 'spacebar'].includes(k)) this.keys.jump = false
    }
    addEventListener('keydown', this.onKeyDown)
    addEventListener('keyup', this.onKeyUp)

    this.emit()
    const frame = () => { this.update(); this.render(); this.raf = requestAnimationFrame(frame) }
    frame()
  }

  destroy() {
    cancelAnimationFrame(this.raf)
    removeEventListener('keydown', this.onKeyDown)
    removeEventListener('keyup', this.onKeyUp)
    this.stopSong()
  }

  // ---- public API (React) ----
  setKey(k: 'left' | 'right' | 'jump', v: boolean) {
    this.keys[k] = v
    if (k === 'jump' && v) this.p.buf = 8
  }

  initAudio() {
    if (!this.AC) {
      try { this.AC = new (window.AudioContext || (window as any).webkitAudioContext)() } catch { /* no audio */ }
    }
  }

  setPaused(v: boolean) {
    this.paused = v
    if (v) {
      this.keys.left = false
      this.keys.right = false
      this.keys.jump = false
    }
  }

  pressStart() {
    if (!this.AC) {
      try { this.AC = new (window.AudioContext || (window as any).webkitAudioContext)() } catch { /* no audio */ }
    }
    // fresh game: forget every collected star so the run (and the 100% bonus) starts clean
    for (const lv of LEVELS) for (const s of lv.stars) s.got = false
    this.totalStars = 0
    this.fx = []
    this.startLevel(0)
  }

  continueCut() {
    if (this.lvl + 1 < LEVELS.length) this.startLevel(this.lvl + 1)
    else this.finale()
  }

  bossGo() {
    this.set({ screen: null })
    this.mode = Mode.PLAY
  }

  doSkip() {
    if (this.mode === Mode.PLAY) {
      if (this.boss) this.boss = null
      this.finishLevel()
    }
  }

  playAgain() {
    this.stopSong()
    this.mode = Mode.TITLE
    this.set({ screen: 'title' })
  }

  // ---- UI state ----
  private set(patch: Partial<UIState>) {
    this.ui = { ...this.ui, ...patch }
    this.onUI(this.ui)
  }
  private emit() { this.onUI(this.ui) }

  // ---- images ----
  private loadImg(src: string) {
    if (this.imgs[src]) return this.imgs[src]
    const i: HTMLImageElement & { ok?: boolean } = new Image()
    i.ok = false
    i.onload = () => { i.ok = true }
    i.onerror = () => { i.ok = false }
    i.src = src
    this.imgs[src] = i
    return i
  }

  // ---- audio ----
  beep(f: number, d: number, type: OscillatorType = 'square', v = 0.06) {
    if (!this.AC) return
    const o = this.AC.createOscillator(), g = this.AC.createGain()
    o.type = type; o.frequency.value = f; g.gain.value = v
    o.connect(g); g.connect(this.AC.destination)
    o.start(); o.stop(this.AC.currentTime + d)
    g.gain.exponentialRampToValueAtTime(0.0001, this.AC.currentTime + d)
  }

  private sfxJump() { this.beep(520, 0.12) }
  private sfxStar() { this.beep(880, 0.08); this.beep(1180, 0.10) }
  private sfxHurt() { this.beep(150, 0.25, 'sawtooth', 0.08) }
  private sfxBoop() { this.beep(700, 0.06); this.beep(1000, 0.08, 'triangle') }
  private sfxWin() { this.beep(660, 0.1); setTimeout(() => this.beep(880, 0.14), 110) }

  private playSong() {
    if (!this.AC) return
    this.stopSong()
    let mel = CONFIG.songMelody
    if (!mel || !mel.length) {
      mel = [['C5', 1], ['E5', 1], ['G5', 1], ['C6', 2], ['G5', 1], ['A5', 1], ['G5', 2],
             ['E5', 1], ['F5', 1], ['E5', 1], ['D5', 1], ['C5', 2]]
    }
    let i = 0
    const bpm = 132, beat = 60 / bpm * 1000
    const step = () => {
      if (!this.AC) return
      const [n, b] = mel[i % mel.length]
      this.beep(NOTE[n] || NOTE.C5, b * beat / 1000 * 0.9, 'square', 0.05)
      this.beep((NOTE[n] || NOTE.C5) / 2, b * beat / 1000 * 0.9, 'triangle', 0.03)
      i++
      this.songTimer = setTimeout(step, b * beat)
    }
    step()
  }
  private stopSong() {
    if (this.songTimer) { clearTimeout(this.songTimer); this.songTimer = null }
  }

  // ---- flow ----
  private startLevel(i: number) {
    this.lvl = i; this.lives = 3; this.stars = 0; this.deaths = 0; this.hearts = []
    this.mode = Mode.PLAY
    this.bossIntroShown = false
    const bx = LEVELS[i].bossX
    this.boss = bx != null ? { x: bx, y: GY - 26, w: 40, h: 26, hp: 3, cd: 0, hop: 0 } : null
    this.combo = 0; this.comboT = 0
    // seat each mover at its current phase so the first frame's dx/dy is 0 (no launch)
    for (const m of LEVELS[i].movers || []) {
      const off = Math.sin(this.t * m.sp + m.ph) * m.amp
      m.x = m.ax === 'x' ? m.x0 + off : m.x0
      m.y = m.ax === 'y' ? m.y0 + off : m.y0
      m.px = m.x; m.py = m.y; m.dx = 0; m.dy = 0
    }
    this.set({ screen: null, skip: false })
    this.respawn()
  }

  private respawn() {
    const st = LEVELS[this.lvl].start
    this.p.x = st.x; this.p.y = st.y; this.p.vx = 0; this.p.vy = 0
    this.p.dead = 0; this.p.onGround = false; this.p.dj = 1; this.p.sq = 0; this.cam = 0
  }

  private die() {
    if (this.p.dead) return
    this.p.dead = 1; this.shake = 10; this.sfxHurt(); this.lives--; this.deaths++
    if (this.deaths >= 5) this.set({ skip: true })
    setTimeout(() => { if (this.lives <= 0) this.lives = 3; this.respawn() }, 500)
  }

  private finishLevel() {
    this.sfxWin(); this.mode = Mode.TITLE
    const perfect = LEVELS[this.lvl].stars.every((s) => s.got)
    this.set({ screen: 'cut', skip: false, cutIndex: this.lvl, perfect })
  }

  private showBossIntro() {
    this.bossIntroShown = true; this.mode = Mode.TITLE
    this.set({ screen: 'boss' })
  }

  private finale() {
    const total = LEVELS.reduce((a, l) => a + l.stars.length, 0)
    this.set({ screen: 'end', allStars: this.totalStars >= total })
    this.confetti = []
    for (let i = 0; i < 60; i++) {
      this.confetti.push({ x: Math.random() * W, y: -Math.random() * H, s: 1 + Math.random() * 2, vy: 0.6 + Math.random() * 1.2 })
    }
    this.playSong()
  }

  // ---- physics ----
  private rectHit(a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
  }
  private spawnHearts(x: number, y: number, n: number) {
    for (let i = 0; i < n; i++) this.hearts.push({ x, y, vx: (Math.random() * 2 - 1) * 2, vy: -1 - Math.random() * 2, life: 40 })
  }
  // small puff of dust — feet on takeoff/landing
  private dust(x: number, y: number, n: number) {
    for (let i = 0; i < n; i++) this.fx.push({
      x, y, vx: (Math.random() * 2 - 1) * 1.4, vy: -Math.random() * 1.2, life: 18, max: 18, kind: 'dust', c: '#cfd6ff', g: 0.06,
    })
  }
  // outward spark burst — star pickup, air jump, boss boop
  private sparks(x: number, y: number, n: number, c: string) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, sp = 1 + Math.random() * 2.4
      this.fx.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 24, max: 24, kind: 'spark', c, g: 0.03 })
    }
  }
  // floating text that rises and fades — "+1", "COMBO x3"
  private popText(x: number, y: number, txt: string, c: string) {
    this.fx.push({ x, y, vx: 0, vy: -0.7, life: 46, max: 46, kind: 'text', c, g: 0, txt })
  }

  private update() {
    if (this.paused) return
    const p = this.p
    this.t++
    if (this.shake > 0) this.shake--
    for (const h of this.hearts) { h.x += h.vx; h.y += h.vy; h.vy += 0.12; h.life-- }
    this.hearts = this.hearts.filter((h) => h.life > 0)
    for (const f of this.fx) { f.x += f.vx; f.y += f.vy; f.vy += f.g; f.life-- }
    this.fx = this.fx.filter((f) => f.life > 0)
    if (this.comboT > 0) this.comboT--; else this.combo = 0
    if (p.sq > 0) p.sq--

    // Shooting star trigger & update
    if (!this.shootStar && Math.random() < 0.003) {
      this.shootStar = {
        x: Math.random() * (W + 100),
        y: Math.random() * 50,
        vx: -3 - Math.random() * 3,
        vy: 1.5 + Math.random() * 1.5,
        len: 12 + Math.random() * 15,
        life: 30 + Math.random() * 15
      }
    }
    if (this.shootStar) {
      this.shootStar.x += this.shootStar.vx
      this.shootStar.y += this.shootStar.vy
      this.shootStar.life--
      if (this.shootStar.life <= 0) this.shootStar = null
    }

    if (this.mode !== Mode.PLAY || p.dead) return
    const lv = LEVELS[this.lvl]
    const boss = this.boss

    // boss intro trigger
    if (boss && boss.hp > 0 && !this.bossIntroShown && p.x + p.w > boss.x - 120) { this.showBossIntro(); return }

    // moving platforms: advance them, then carry any rider by the platform's delta
    const movers = lv.movers || []
    for (const m of movers) {
      m.px = m.x; m.py = m.y
      const off = Math.sin(this.t * m.sp + m.ph) * m.amp
      if (m.ax === 'x') m.x = m.x0 + off; else m.y = m.y0 + off
      m.dx = m.x - m.px; m.dy = m.y - m.py
    }
    for (const m of movers) {
      // riding = grounded last frame with feet on the platform top (tested at its old position)
      if (p.onGround && p.y + p.h <= m.py + 4 && p.y + p.h >= m.py - 4 && p.x + p.w > m.px && p.x < m.px + m.w) {
        p.x += m.dx; p.y += m.dy
      }
    }

    // horizontal
    if (this.keys.left) { p.vx = -MOVE; p.face = -1 } else if (this.keys.right) { p.vx = MOVE; p.face = 1 } else p.vx *= 0.6
    p.x += p.vx
    const solids = lv.solids.slice()
    if (boss && boss.hp > 0) solids.push(boss)
    for (const m of movers) solids.push(m)
    for (const s of solids) {
      if (this.rectHit(p, s)) {
        if (p.vx > 0) p.x = s.x - p.w; else if (p.vx < 0) p.x = s.x + s.w
        p.vx = 0
      }
    }
    if (p.x < 0) p.x = 0

    // vertical
    p.coyote = p.onGround ? 6 : p.coyote - 1
    if (p.onGround) p.dj = 1 // refill the single air-jump when grounded
    if (p.buf > 0) p.buf--
    if (p.buf > 0 && p.coyote > 0) { // ground / coyote jump
      p.vy = JUMP; p.onGround = false; p.coyote = 0; p.buf = 0; this.sfxJump()
      this.dust(p.x + p.w / 2, p.y + p.h, 5)
    } else if (p.buf > 0 && p.dj > 0) { // mid-air double jump
      p.vy = JUMP * 0.9; p.dj = 0; p.buf = 0; this.sfxJump()
      this.sparks(p.x + p.w / 2, p.y + p.h / 2, 8, '#7ee0ff')
    }
    if (!this.keys.jump && p.vy < -2) p.vy = -2
    p.vy += GRAV; if (p.vy > MAXFALL) p.vy = MAXFALL
    const wasAir = !p.onGround, fallV = p.vy
    p.y += p.vy; p.onGround = false
    for (const s of movers.length ? [...lv.solids, ...movers] : lv.solids) {
      if (this.rectHit(p, s)) {
        if (p.vy > 0) { p.y = s.y - p.h; p.onGround = true } else if (p.vy < 0) p.y = s.y + s.h
        p.vy = 0
      }
    }
    if (p.onGround && wasAir && fallV > 3) { this.dust(p.x + p.w / 2, p.y + p.h, 6); p.sq = 6 }

    // boss boop (fall onto top)
    if (boss && boss.hp > 0) {
      if (boss.cd > 0) boss.cd--
      if (boss.hop > 0) boss.hop--
      if (this.rectHit(p, boss)) {
        if (p.vy > 0 && (p.y + p.h) < boss.y + 14) {
          boss.hp--; boss.cd = 20; boss.hop = 12; p.vy = JUMP * 0.75; p.dj = 1; this.shake = 6; this.sfxBoop()
          this.combo++; this.comboT = 90
          this.spawnHearts(boss.x + boss.w / 2, boss.y, 8)
          this.sparks(boss.x + boss.w / 2, boss.y + 6, 12, '#ff5db1')
          if (this.combo >= 2) this.popText(boss.x + boss.w / 2, boss.y - 20, 'COMBO x' + this.combo, '#ffe14d')
          if (boss.hp <= 0) { this.spawnHearts(boss.x + boss.w / 2, boss.y, 20); this.popText(boss.x + boss.w / 2, boss.y - 24, '♥ ชนะ ♥', '#ff5db1') }
        } else if (boss.cd === 0) {
          p.x = p.vx > 0 ? boss.x - p.w : boss.x + boss.w; p.vx = 0
        }
      }
    }

    // hazards + pit
    for (const hz of lv.haz) { if (this.rectHit(p, hz)) { this.die(); return } }
    if (p.y > H + 40) { this.die(); return }

    // stars
    for (const s of lv.stars) {
      if (!s.got && Math.abs(p.x + p.w / 2 - s.x) < 16 && Math.abs(p.y + p.h / 2 - s.y) < 16) {
        s.got = true; this.stars++; this.totalStars++; this.sfxStar()
        this.sparks(s.x, s.y, 10, '#ffe14d'); this.popText(s.x, s.y - 6, '+1', '#ffe14d')
      }
    }

    // goal (blocked while boss alive)
    if ((!boss || boss.hp <= 0) && p.x + p.w >= lv.goalX) { this.finishLevel(); return }

    this.cam = Math.max(0, Math.min(p.x + p.w / 2 - W / 2, lv.w - W))
  }

  // ---- render ----
  private px(x: number, y: number, w: number, h: number, c: string) {
    this.ctx.fillStyle = c; this.ctx.fillRect(Math.round(x), Math.round(y), w, h)
  }
  private drawPlayer(sx: number, sy: number) {
    const p = this.p
    
    // Squash & Stretch visual offsets
    let hOffset = 0
    let wOffset = 0
    
    if (p.sq > 0) {
      // Squash on landing
      hOffset = 1
      wOffset = 1
    } else if (!p.onGround && p.vy < -1) {
      // Stretch on jump ascent
      hOffset = -1
      wOffset = -1
    }
    
    // Apply offsets to Y (squash/stretch)
    const yHair = sy + hOffset
    const yFace = sy + 5 + hOffset
    const yEye = sy + 7 + hOffset
    const yBlush = sy + 9 + hOffset
    const yShirt = sy + 12 + hOffset
    
    // 1. HAIR (Yellow #ffe14d, highlight #fff3a8, shadow #ffa200)
    // Draw hair base
    this.px(sx + 2 - wOffset, yHair, 12 + wOffset * 2, 5, '#ffe14d')
    // Hair spikes/texture details
    this.px(sx + 4, yHair - 1, 8, 1, '#ffe14d') // top hair lock
    this.px(sx + 5, yHair, 4, 1, '#fff3a8') // hair shine highlight
    this.px(sx + 2 - wOffset, yHair + 4, 12 + wOffset * 2, 1, '#ffa200') // hair bottom shadow
    // Side bangs framing the face
    this.px(sx + 1, yHair + 3, 1, 3, '#ffe14d')
    this.px(sx + 1, yHair + 6, 1, 1, '#ffa200')
    this.px(sx + 14, yHair + 3, 1, 3, '#ffe14d')
    this.px(sx + 14, yHair + 6, 1, 1, '#ffa200')
    
    // 2. FACE (Peach #ffd0a8, shadow #e59677)
    this.px(sx + 2 - wOffset, yFace, 12 + wOffset * 2, 7, '#ffd0a8')
    // Face shadow based on direction
    if (p.face > 0) {
      this.px(sx + 2 - wOffset, yFace, 1, 7, '#e59677') // left/back face shadow
    } else {
      this.px(sx + 13 + wOffset, yFace, 1, 7, '#e59677') // right/back face shadow
    }
    
    // 3. EYE (Dark #0a0620, pupil highlight #ffffff)
    // Blinking logic: blink when idle/time interval
    const blink = (this.t % 180 > 172)
    if (p.face > 0) {
      if (blink) {
        this.px(sx + 9, yEye + 1, 3, 1, '#0a0620') // closed eye line
      } else {
        this.px(sx + 9, yEye, 3, 3, '#0a0620') // eye base
        this.px(sx + 11, yEye, 1, 1, '#ffffff') // eye reflection shine
      }
      // Blush
      this.px(sx + 11, yBlush, 2, 1, '#ff8ab8')
    } else {
      if (blink) {
        this.px(sx + 4, yEye + 1, 3, 1, '#0a0620') // closed eye line
      } else {
        this.px(sx + 4, yEye, 3, 3, '#0a0620') // eye base
        this.px(sx + 4, yEye, 1, 1, '#ffffff') // eye reflection shine
      }
      // Blush
      this.px(sx + 3, yBlush, 2, 1, '#ff8ab8')
    }
    
    // 4. SHIRT (Pink #ff3d81, shadow #b3005a)
    this.px(sx + 2 - wOffset, yShirt, 12 + wOffset * 2, 5, '#ff3d81')
    this.px(sx + 1 - wOffset, yShirt, 1, 3, '#ff3d81') // shoulders
    this.px(sx + 14 + wOffset, yShirt, 1, 3, '#ff3d81')
    // Shirt shadow
    if (p.face > 0) {
      this.px(sx + 2 - wOffset, yShirt + 3, 3, 2, '#b3005a')
    } else {
      this.px(sx + 11 + wOffset, yShirt + 3, 3, 2, '#b3005a')
    }
    
    // Cute White Heart logo on chest
    if (p.face > 0) {
      this.px(sx + 9, yShirt + 1, 1, 1, '#ffffff')
      this.px(sx + 11, yShirt + 1, 1, 1, '#ffffff')
      this.px(sx + 9, yShirt + 2, 3, 1, '#ffffff')
      this.px(sx + 10, yShirt + 3, 1, 1, '#ffffff')
    } else {
      this.px(sx + 4, yShirt + 1, 1, 1, '#ffffff')
      this.px(sx + 6, yShirt + 1, 1, 1, '#ffffff')
      this.px(sx + 4, yShirt + 2, 3, 1, '#ffffff')
      this.px(sx + 5, yShirt + 3, 1, 1, '#ffffff')
    }
    
    // 5. ANIMATED LEGS / FEET (Indigo pants #2b3a67, white sneakers #ffffff)
    const walkCycle = p.onGround && Math.abs(p.vx) > 0.1 ? Math.floor(this.t / 6) % 2 : 0
    const legY = sy + 17
    
    if (!p.onGround) {
      // jump leg style: tucked/flying
      this.px(sx + 3, legY, 3, 2, '#2b3a67')
      this.px(sx + 3, legY + 2, 3, 1, '#ffffff') // white shoe
      this.px(sx + 10, legY, 3, 2, '#2b3a67')
      this.px(sx + 10, legY + 2, 3, 1, '#ffffff') // white shoe
    } else if (walkCycle === 1) {
      this.px(sx + 2, legY - 1, 4, 2, '#2b3a67')
      this.px(sx + 2, legY + 1, 4, 1, '#ffffff') // white shoe
      this.px(sx + 10, legY, 4, 2, '#2b3a67')
      this.px(sx + 10, legY + 2, 4, 1, '#ffffff') // white shoe
    } else {
      this.px(sx + 2, legY, 4, 2, '#2b3a67')
      this.px(sx + 2, legY + 2, 4, 1, '#ffffff') // white shoe
      this.px(sx + 10, legY - 1, 4, 2, '#2b3a67')
      this.px(sx + 10, legY + 1, 4, 1, '#ffffff') // white shoe
    }
  }

  private drawMilk(sx: number, sy: number, face: number) {
    const bob = Math.sin(this.t / 12) * 0.4
    const syBob = sy + bob
    
    // Hair (#b87a55 brown, shadow #8c583a)
    this.px(sx + 2, syBob + 1, 12, 4, '#b87a55')
    this.px(sx + 4, syBob, 8, 1, '#b87a55')
    
    // Hair Bow (#ff3d81 pink/red, #ff8ab8 highlight)
    this.px(sx + 2, syBob, 3, 2, '#ff3d81')
    this.px(sx + 3, syBob + 1, 1, 1, '#ff8ab8')
    
    // Hair shadow
    this.px(sx + 2, syBob + 5, 12, 1, '#8c583a')
    
    // Side bangs
    this.px(sx + 1, syBob + 3, 1, 3, '#b87a55')
    this.px(sx + 1, syBob + 6, 1, 1, '#8c583a')
    this.px(sx + 14, syBob + 3, 1, 3, '#b87a55')
    this.px(sx + 14, syBob + 6, 1, 1, '#8c583a')
    
    // Face (#ffd0a8, shadow #e59677)
    this.px(sx + 2, syBob + 5, 12, 7, '#ffd0a8')
    if (face > 0) {
      this.px(sx + 2, syBob + 5, 1, 7, '#e59677')
    } else {
      this.px(sx + 13, syBob + 5, 1, 7, '#e59677')
    }
    
    // Eye (#0a0620, pupil #ffffff) and blush (#ff8ab8)
    const blink = (this.t % 180 > 172)
    if (face > 0) {
      if (blink) {
        this.px(sx + 9, syBob + 8, 3, 1, '#0a0620')
      } else {
        this.px(sx + 9, syBob + 7, 3, 3, '#0a0620')
        this.px(sx + 11, syBob + 7, 1, 1, '#ffffff')
      }
      this.px(sx + 11, syBob + 9, 2, 1, '#ff8ab8')
    } else {
      if (blink) {
        this.px(sx + 4, syBob + 8, 3, 1, '#0a0620')
      } else {
        this.px(sx + 4, syBob + 7, 3, 3, '#0a0620')
        this.px(sx + 4, syBob + 7, 1, 1, '#ffffff')
      }
      this.px(sx + 3, syBob + 9, 2, 1, '#ff8ab8')
    }
    
    // Shirt (#7ee0ff cyan, shadow #4ba5cc)
    this.px(sx + 2, syBob + 12, 12, 5, '#7ee0ff')
    this.px(sx + 1, syBob + 12, 1, 3, '#7ee0ff')
    this.px(sx + 14, syBob + 12, 1, 3, '#7ee0ff')
    if (face > 0) {
      this.px(sx + 2, syBob + 15, 3, 2, '#4ba5cc')
    } else {
      this.px(sx + 11, syBob + 15, 3, 2, '#4ba5cc')
    }
    
    // Heart logo
    if (face > 0) {
      this.px(sx + 9, syBob + 13, 1, 1, '#ffffff')
      this.px(sx + 11, syBob + 13, 1, 1, '#ffffff')
      this.px(sx + 9, syBob + 14, 3, 1, '#ffffff')
      this.px(sx + 10, syBob + 15, 1, 1, '#ffffff')
    } else {
      this.px(sx + 4, syBob + 13, 1, 1, '#ffffff')
      this.px(sx + 6, syBob + 13, 1, 1, '#ffffff')
      this.px(sx + 4, syBob + 14, 3, 1, '#ffffff')
      this.px(sx + 5, syBob + 15, 1, 1, '#ffffff')
    }
    
    // Legs (#2b3a67 pants, #ffffff shoes)
    this.px(sx + 2, syBob + 17, 4, 2, '#2b3a67')
    this.px(sx + 2, syBob + 19, 4, 1, '#ffffff')
    this.px(sx + 10, syBob + 17, 4, 2, '#2b3a67')
    this.px(sx + 10, syBob + 19, 4, 1, '#ffffff')
  }

  private drawCat(sx: number, sy: number) {
    const bob = Math.sin(this.t / 15) * 0.5
    const syBob = sy + bob
    // Orange cat (#ff9233, outline/dark details #d05b00)
    this.px(sx + 2, syBob + 2, 2, 2, '#ff9233')
    this.px(sx + 8, syBob + 2, 2, 2, '#ff9233')
    this.px(sx + 2, syBob + 4, 8, 5, '#ff9233')
    this.px(sx + 3, syBob + 5, 1, 2, '#0a0620')
    this.px(sx + 8, syBob + 5, 1, 2, '#0a0620')
    this.px(sx + 5, syBob + 7, 2, 1, '#ffccd5')
    this.px(sx + 1, syBob + 9, 10, 6, '#ff9233')
    const twitch = (Math.floor(this.t / 20) % 2 === 0) ? 0 : 1
    this.px(sx + 10, syBob + 6 + twitch, 2, 4, '#d05b00')
    this.px(sx + 9, syBob + 5 + twitch, 2, 2, '#ff9233')
    this.px(sx + 2, syBob + 15, 2, 1, '#d05b00')
    this.px(sx + 8, syBob + 15, 2, 1, '#d05b00')
  }

  private drawBunny(sx: number, sy: number) {
    const hop = Math.max(0, Math.sin(this.t / 10) * 3)
    const syHop = sy - hop
    // White bunny (#ffffff, shadows #e2e8f0, pink ears #ffccd5)
    this.px(sx + 3, syHop, 2, 4, '#ffffff')
    this.px(sx + 4, syHop + 1, 1, 3, '#ffccd5')
    this.px(sx + 7, syHop, 2, 4, '#ffffff')
    this.px(sx + 8, syHop + 1, 1, 3, '#ffccd5')
    this.px(sx + 2, syHop + 4, 8, 5, '#ffffff')
    this.px(sx + 3, syHop + 5, 1, 1, '#ff3d81')
    this.px(sx + 7, syHop + 5, 1, 1, '#ff3d81')
    this.px(sx + 1, syHop + 9, 10, 6, '#ffffff')
    this.px(sx, syHop + 11, 2, 2, '#ffffff')
    this.px(sx + 2, syHop + 15, 2, 1, '#e2e8f0')
    this.px(sx + 8, syHop + 15, 2, 1, '#e2e8f0')
  }

  private drawBird(sx: number, sy: number) {
    const bob = Math.sin(this.t / 8) * 0.4
    const syBob = sy + bob
    // Blue bird (#7ee0ff, belly #ffffff, beak #ffe14d)
    this.px(sx + 3, syBob + 3, 5, 4, '#7ee0ff')
    this.px(sx + 6, syBob + 4, 1, 1, '#0a0620')
    const chirp = (Math.floor(this.t / 12) % 3 === 0)
    if (chirp) {
      this.px(sx + 8, syBob + 4, 2, 1, '#ffe14d')
      this.px(sx + 8, syBob + 5, 2, 1, '#ffe14d')
    } else {
      this.px(sx + 8, syBob + 4.5, 2, 1, '#ffe14d')
    }
    this.px(sx + 1, syBob + 7, 7, 5, '#7ee0ff')
    this.px(sx + 2, syBob + 8, 4, 4, '#ffffff')
    this.px(sx + 2, syBob + 8, 3, 2, '#3a82f6')
    this.px(sx, syBob + 9, 2, 2, '#3a82f6')
    this.px(sx + 4, syBob + 12, 1, 2, '#ffe14d')
    this.px(sx + 6, syBob + 12, 1, 2, '#ffe14d')
  }

  private drawPixelCloud(cx: number, cy: number, w: number, h: number, opacity: number) {
    const ctx = this.ctx
    ctx.fillStyle = `rgba(157, 144, 255, ${opacity * 0.45})`
    ctx.fillRect(Math.round(cx), Math.round(cy), w, h)
    ctx.fillRect(Math.round(cx + w * 0.15), Math.round(cy - h * 0.4), Math.round(w * 0.7), Math.round(h * 0.4))
    ctx.fillRect(Math.round(cx + w * 0.3), Math.round(cy - h * 0.8), Math.round(w * 0.4), Math.round(h * 0.4))
    
    ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`
    ctx.fillRect(Math.round(cx + w * 0.15), Math.round(cy - h * 0.4), Math.round(w * 0.7), 2)
    ctx.fillRect(Math.round(cx + w * 0.3), Math.round(cy - h * 0.8), Math.round(w * 0.4), 2)
    ctx.fillRect(Math.round(cx), Math.round(cy), Math.round(w * 0.15), 2)
    ctx.fillRect(Math.round(cx + w * 0.85), Math.round(cy), Math.round(w * 0.15), 2)
  }

  private drawTinyHeart(cx: number, cy: number, c: string) {
    // shadow (offset by 1px down-right)
    this.px(cx - 1, cy + 1, 2, 1, '#0a0620')
    this.px(cx + 2, cy + 1, 2, 1, '#0a0620')
    this.px(cx - 1, cy + 2, 5, 1, '#0a0620')
    this.px(cx - 1, cy + 3, 5, 1, '#0a0620')
    this.px(cx, cy + 4, 3, 1, '#0a0620')
    this.px(cx + 1, cy + 5, 1, 1, '#0a0620')

    // fill
    this.px(cx - 2, cy, 2, 1, c)
    this.px(cx + 1, cy, 2, 1, c)
    this.px(cx - 2, cy + 1, 5, 1, c)
    this.px(cx - 2, cy + 2, 5, 1, c)
    this.px(cx - 1, cy + 3, 3, 1, c)
    this.px(cx, cy + 4, 1, 1, c)
  }

  private drawDog(sx: number, sy: number, type: 'jaidee' | 'panda') {
    const isPanda = type === 'panda'
    const bodyColor = isPanda ? '#ffffff' : '#ffd59a' // Golden yellow for Jaidee
    const earColor = isPanda ? '#332a26' : '#e6ab5e' // Brownish/black ears for Panda, darker golden for Jaidee
    
    // Draw Ears
    this.px(sx, sy + 2, 5, 6, earColor)
    this.px(sx + 13, sy + 2, 5, 6, earColor)
    
    // Draw Body
    this.px(sx + 2, sy + 6, 14, 12, bodyColor)
    
    if (isPanda) {
      // Panda eye patches (black circles around eyes)
      this.px(sx + 3, sy + 9, 4, 4, '#332a26')
      this.px(sx + 10, sy + 9, 4, 4, '#332a26')
      
      // Panda spots on body
      this.px(sx + 12, sy + 6, 4, 4, '#332a26')
    }
    
    // Draw Eyes
    this.px(sx + 4, sy + 10, 2, 2, '#000')
    this.px(sx + 11, sy + 10, 2, 2, '#000')
    
    // Snout
    this.px(sx + 7, sy + 13, 4, 2, isPanda ? '#332a26' : '#d2964c')
    this.px(sx + 8, sy + 13, 2, 1, '#000') // nose tip
    
    // Tongue (panting)
    const pant = (Math.floor(this.t / 15) % 2 === 0)
    if (pant) {
      this.px(sx + 8, sy + 15, 2, 2, '#ff8fb0')
    }
  }

  private drawVectorStar(cx: number, cy: number, spikes = 5, outerRadius = 8, innerRadius = 3.5) {
    const ctx = this.ctx
    let rot = Math.PI / 2 * 3
    let x = cx
    let y = cy
    const step = Math.PI / spikes

    ctx.beginPath()
    ctx.moveTo(cx, cy - outerRadius)
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius
      y = cy + Math.sin(rot) * outerRadius
      ctx.lineTo(x, y)
      rot += step

      x = cx + Math.cos(rot) * innerRadius
      y = cy + Math.sin(rot) * innerRadius
      ctx.lineTo(x, y)
      rot += step
    }
    ctx.lineTo(cx, cy - outerRadius)
    ctx.closePath()
  }

  private drawStar(sx: number, sy: number) {
    const ctx = this.ctx
    const bounce = Math.sin(this.t / 8) * 1.5
    const y = sy + bounce
    
    // Draw glowing radial gradient halo (smooth & round)
    const glow = ctx.createRadialGradient(sx, y, 2, sx, y, 14)
    glow.addColorStop(0, 'rgba(255, 225, 77, 0.4)')
    glow.addColorStop(0.3, 'rgba(255, 225, 77, 0.15)')
    glow.addColorStop(1, 'rgba(255, 225, 77, 0)')
    ctx.fillStyle = glow
    ctx.beginPath()
    ctx.arc(sx, y, 14, 0, Math.PI * 2)
    ctx.fill()
    
    // Draw star gold shadow/outline
    ctx.fillStyle = '#ccaa00'
    this.drawVectorStar(sx, y, 5, 8.5, 3.8)
    ctx.fill()

    // Draw star body (gold/yellow gradient)
    const starGrad = ctx.createLinearGradient(sx, y - 8, sx, y + 8)
    starGrad.addColorStop(0, '#fff3a8')
    starGrad.addColorStop(0.4, '#ffe14d')
    starGrad.addColorStop(1, '#ffa200')
    ctx.fillStyle = starGrad
    this.drawVectorStar(sx, y, 5, 7.5, 3.2)
    ctx.fill()

    // Add white core highlight
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(sx - 1.5, y - 1.5, 1.2, 0, Math.PI * 2)
    ctx.fill()
  }

  private speech(cx: number, y: number, txt: string) {
    const ctx = this.ctx
    ctx.font = '9px sans-serif'; ctx.textAlign = 'center'
    const w = Math.ceil(ctx.measureText(txt).width) + 8
    ctx.fillStyle = '#fff'; ctx.fillRect(Math.round(cx - w / 2), y - 12, w, 13)
    ctx.fillRect(Math.round(cx) - 2, y + 1, 4, 2) // tail
    ctx.fillStyle = '#c22'; ctx.fillText(txt, Math.round(cx), y - 3)
    ctx.textAlign = 'left'
  }

  private drawFx() {
    const ctx = this.ctx
    for (const f of this.fx) {
      const k = f.life / f.max
      if (f.kind === 'text') {
        ctx.globalAlpha = Math.min(1, k * 2)
        ctx.font = '8px "Press Start 2P", "Chakra Petch", "Sarabun", "Thonburi", sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = f.c
        // shadow text effect for pop text
        ctx.fillStyle = '#0a0620'
        ctx.fillText(f.txt!, Math.round(f.x) + 1, Math.round(f.y) + 1)
        ctx.fillStyle = f.c
        ctx.fillText(f.txt!, Math.round(f.x), Math.round(f.y))
        ctx.textAlign = 'left'
      } else {
        ctx.globalAlpha = f.kind === 'dust' ? k * 0.7 : k
        ctx.fillStyle = f.c; ctx.fillRect(Math.round(f.x), Math.round(f.y), 2, 2)
      }
      ctx.globalAlpha = 1
    }
  }

  private drawFlag(sx: number) {
    const ctx = this.ctx
    const poleX = sx
    const poleHeight = 46
    const poleTop = GY - poleHeight
    
    // Draw flagpole (steel post with golden ball at top)
    this.px(poleX, poleTop, 3, poleHeight, '#cfd6ff') // pole
    this.px(poleX - 1, poleTop - 3, 5, 3, '#ffe14d') // golden ball
    
    // Waving flag calculation
    ctx.fillStyle = '#ff3d81'
    ctx.beginPath()
    ctx.moveTo(poleX + 3, poleTop + 2)
    
    const flagW = 20
    const flagH = 14
    for (let ox = 0; ox <= flagW; ox += 2) {
      // Wave offset based on time and x-coordinate
      const wave = Math.sin((this.t / 6) + (ox * 0.25)) * 2
      ctx.lineTo(poleX + 3 + ox, poleTop + 2 + wave)
    }
    for (let ox = flagW; ox >= 0; ox -= 2) {
      const wave = Math.sin((this.t / 6) + (ox * 0.25)) * 2
      ctx.lineTo(poleX + 3 + ox, poleTop + 2 + flagH + wave)
    }
    ctx.closePath()
    ctx.fill()
    
    // Draw a small white heart on the flag!
    const heartX = poleX + 7
    const heartY = poleTop + 6 + Math.sin((this.t / 6) + 3.5) * 1.8
    this.px(heartX, heartY, 2, 1, '#ffffff')
    this.px(heartX + 3, heartY, 2, 1, '#ffffff')
    this.px(heartX, heartY + 1, 5, 2, '#ffffff')
    this.px(heartX + 1, heartY + 3, 3, 1, '#ffffff')
    this.px(heartX + 2, heartY + 4, 1, 1, '#ffffff')
  }

  private heart(x: number, y: number) {
    const ctx = this.ctx
    ctx.fillRect(x, y + 1, 3, 3); ctx.fillRect(x + 5, y + 1, 3, 3); ctx.fillRect(x + 1, y + 2, 6, 3)
    ctx.fillRect(x + 2, y + 5, 4, 2); ctx.fillRect(x + 3, y + 7, 2, 1)
  }

  private heartAt(x: number, y: number, s: number) {
    const ctx = this.ctx
    ctx.fillRect(x, y, s, s); ctx.fillRect(x + s * 2, y, s, s); ctx.fillRect(x, y + s, s * 3, s); ctx.fillRect(x + s, y + s * 2, s, s)
  }

  private shadowText(txt: string, x: number, y: number, color: string, align: CanvasTextAlign = 'left', font = '8px "Press Start 2P", "Chakra Petch", "Sarabun", "Thonburi", sans-serif') {
    const ctx = this.ctx
    ctx.font = font
    ctx.textAlign = align
    ctx.fillStyle = '#0a0620'
    ctx.fillText(txt, x + 1, y + 1)
    ctx.fillStyle = color
    ctx.fillText(txt, x, y)
    ctx.textAlign = 'left'
  }

  private render() {
    const ctx = this.ctx, p = this.p, boss = this.boss
    
    // Draw sky gradient
    const g = ctx.createLinearGradient(0, 0, 0, H)
    g.addColorStop(0, '#20184c')
    g.addColorStop(1, '#0c0721')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, W, H)
    
    // Draw twinkling stars with color variation
    for (let i = 0; i < 40; i++) {
      const bx = ((i * 127 - this.cam * 0.05) % (W + 20) + W + 20) % (W + 20) - 10
      const by = (i * 53) % (H - 80)
      const twinkle = (this.t + i * 17) % 60
      if (twinkle > 45) continue // blink out
      const size = (i % 5 === 0 && twinkle > 15) ? 2 : 1
      const color = ['#ffe14d', '#ffffff', '#7ee0ff', '#ff8ab8'][i % 4]
      ctx.fillStyle = color
      if (size === 2) {
        // draw a tiny cross star
        ctx.fillRect(bx, by, 2, 2)
        ctx.fillRect(bx - 1, by, 4, 1)
        ctx.fillRect(bx, by - 1, 1, 4)
      } else {
        ctx.fillRect(bx, by, 1, 1)
      }
    }

    // Draw shooting star
    if (this.shootStar) {
      const s = this.shootStar
      ctx.strokeStyle = `rgba(126, 224, 255, ${s.life / 45})`
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(s.x, s.y)
      ctx.lineTo(s.x - s.vx * 1.5, s.y - s.vy * 1.5)
      ctx.stroke()
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(Math.round(s.x) - 1, Math.round(s.y) - 1, 2, 2)
    }

    // Draw drifting pixel clouds (parallax background scrolling)
    // Cloud 1 (far layer: slow, small, low opacity)
    const cx1 = ((this.t * 0.03 - this.cam * 0.04) % (W + 60) + W + 60) % (W + 60) - 60
    this.drawPixelCloud(cx1, 35, 45, 6, 0.25)

    // Cloud 2 (mid layer: medium speed, medium size)
    const cx2 = ((this.t * 0.06 - this.cam * 0.08) % (W + 90) + W + 90) % (W + 90) - 90
    this.drawPixelCloud(cx2, 60, 60, 8, 0.4)

    // Cloud 3 (near layer: fast, large)
    const cx3 = ((this.t * 0.1 - this.cam * 0.12) % (W + 120) + W + 120) % (W + 120) - 120
    this.drawPixelCloud(cx3, 25, 80, 10, 0.55)
    
    // Draw romantic heart moon
    const moonX = 380 - this.cam * 0.02
    const moonY = 25
    const heartGrid = [
      [0,1,1,0,0,0,1,1,0],
      [1,1,1,1,0,1,1,1,1],
      [1,1,1,1,1,1,1,1,1],
      [1,1,1,1,1,1,1,1,1],
      [0,1,1,1,1,1,1,1,0],
      [0,0,1,1,1,1,1,0,0],
      [0,0,0,1,1,1,0,0,0],
      [0,0,0,0,1,0,0,0,0],
    ]
    // draw heart moon glow
    ctx.fillStyle = 'rgba(255, 61, 129, 0.06)'
    ctx.fillRect(moonX - 6, moonY - 6, 9 * 2 + 12, 8 * 2 + 12)
    ctx.fillStyle = 'rgba(255, 61, 129, 0.15)'
    ctx.fillRect(moonX - 2, moonY - 2, 9 * 2 + 4, 8 * 2 + 4)
    // draw moon pixels
    ctx.fillStyle = '#ff5db1'
    for (let r = 0; r < heartGrid.length; r++) {
      for (let c = 0; c < heartGrid[r].length; c++) {
        if (heartGrid[r][c]) {
          ctx.fillRect(moonX + c * 2, moonY + r * 2, 2, 2)
        }
      }
    }
    
    // Draw distant parallax mountains (16-bit console blocky mountains)
    const step = 8
    for (let x = 0; x < W; x += step) {
      const lx = x + this.cam * 0.12
      const h1 = Math.sin(lx * 0.005) * 22 + Math.sin(lx * 0.015) * 8 + 42
      this.px(x, H - GH - h1, step, h1, '#110b29')
    }

    // Draw closer hills
    for (let x = 0; x < W; x += step) {
      const lx = x + this.cam * 0.25
      const h2 = Math.cos(lx * 0.008) * 14 + Math.sin(lx * 0.02) * 6 + 24
      this.px(x, H - GH - h2, step, h2, '#19113b')
    }

    const sh = this.shake > 0 ? (Math.random() * 2 - 1) * this.shake * 0.4 : 0
    ctx.save(); ctx.translate(-Math.round(this.cam) + sh, sh * 0.5)

    if (this.mode === Mode.PLAY) {
      const lv = LEVELS[this.lvl]
      for (const s of lv.solids) {
        if (s.h === GH) {
          // Ground with grass details
          this.px(s.x, s.y, s.w, 4, '#4caf50') // grass top
          this.px(s.x, s.y + 4, s.w, 2, '#2e7d32') // grass shadow line
          this.px(s.x, s.y + 6, s.w, s.h - 6, '#5a3a1a') // dirt
          
          // Add grass tufts, flowers, and pebbles randomly
          // To ensure they are deterministic, we base them on x coordinate
          for (let x = Math.floor(s.x); x < s.x + s.w; x += 8) {
            const seed = Math.sin(x) * 10000
            const rand = seed - Math.floor(seed)
            if (rand < 0.25) {
              // Grass tuft rising into grass top
              this.px(x + 2, s.y - 2, 2, 2, '#4caf50')
            } else if (rand < 0.32) {
              // Pink/red flower
              this.px(x + 3, s.y - 3, 2, 3, '#ff3d81')
              this.px(x + 2, s.y - 2, 4, 1, '#ffe14d')
            } else if (rand < 0.38) {
              // Yellow flower
              this.px(x + 3, s.y - 2, 2, 2, '#ffe14d')
            }
            
            // Pebbles in dirt
            if (rand > 0.85) {
              this.px(x + 4, s.y + 10, 3, 2, '#734a22')
            } else if (rand > 0.75) {
              this.px(x + 2, s.y + 16, 2, 2, '#422810')
            }
          }
        } else {
          // Floating platforms: Stone brick style
          this.px(s.x, s.y, s.w, s.h, '#4c3b8a') // brick base
          this.px(s.x, s.y, s.w, 2, '#9d90ff') // top shine
          this.px(s.x, s.y + s.h - 2, s.w, 2, '#20164c') // bottom shadow
          
          // Draw vertical joint lines for brick look
          for (let bx = Math.floor(s.x); bx < s.x + s.w; bx += 16) {
            this.px(bx, s.y + 2, 2, s.h - 4, '#20164c')
            this.px(bx + 2, s.y + 2, 1, 1, '#9d90ff')
          }
        }
      }
      for (const m of lv.movers || []) {
        // Moving platform: glowing futuristic brick style
        this.px(m.x, m.y, m.w, m.h, '#822faf') // base purple-magenta
        this.px(m.x, m.y, m.w, 2, '#e6ccff') // top highlight
        this.px(m.x, m.y + m.h - 2, m.w, 2, '#3f0c60') // bottom shadow
        
        // Horizontal warning stripes or glowing panels
        for (let bx = Math.floor(m.x); bx < m.x + m.w; bx += 12) {
          this.px(bx, m.y + 2, 2, m.h - 4, '#3f0c60')
          this.px(bx + 2, m.y + 3, 4, 3, '#ffe14d') // glowing yellow core
        }
      }
      for (const hz of lv.haz) {
        // Calculate a clean whole number of spikes to cover hz.w
        const targetWidth = 13
        const numSpikes = Math.max(1, Math.round(hz.w / targetWidth))
        const eachW = hz.w / numSpikes
        
        for (let i = 0; i < numSpikes; i++) {
          const x = hz.x + i * eachW
          const currentW = eachW
          const mid = x + currentW / 2
          
          // Occasionally spawn a rising heat ember particle from the spike
          if (this.t % 6 === 0 && Math.random() < 0.12) {
            this.fx.push({
              x: x + Math.random() * currentW,
              y: hz.y + hz.h - 2,
              vx: (Math.random() - 0.5) * 0.4,
              vy: -0.3 - Math.random() * 0.5,
              life: 30,
              max: 30,
              kind: 'dust',
              c: Math.random() < 0.6 ? '#ff3d81' : '#ffe14d',
              g: -0.01 // rise up
            })
          }
          
          // Draw metallic spike outline (vibrant red border)
          ctx.fillStyle = '#ff0000'
          ctx.beginPath()
          ctx.moveTo(x - 1, hz.y + hz.h)
          ctx.lineTo(mid, hz.y - 1)
          ctx.lineTo(x + currentW + 1, hz.y + hz.h)
          ctx.fill()
          
          // Draw spike base body (glowing red gradient)
          const redSpikeGrad = ctx.createLinearGradient(x, hz.y, x, hz.y + hz.h)
          redSpikeGrad.addColorStop(0, '#ff3d3d') // bright warning red
          redSpikeGrad.addColorStop(1, '#800c0c') // dark crimson base
          ctx.fillStyle = redSpikeGrad
          ctx.beginPath()
          ctx.moveTo(x, hz.y + hz.h)
          ctx.lineTo(mid, hz.y)
          ctx.lineTo(x + currentW, hz.y + hz.h)
          ctx.fill()
          
          // Draw polished hot highlight on the right side (bright warning orange-pink)
          ctx.fillStyle = '#ff9999'
          ctx.beginPath()
          ctx.moveTo(mid, hz.y)
          ctx.lineTo(x + currentW, hz.y + hz.h)
          ctx.lineTo(mid + currentW * 0.25, hz.y + hz.h)
          ctx.fill()

          // Draw glowing red-hot tip
          const tipGlow = ctx.createRadialGradient(mid, hz.y + 1, 0, mid, hz.y + 1, 6)
          tipGlow.addColorStop(0, 'rgba(255, 30, 30, 0.85)') // intense red glow
          tipGlow.addColorStop(1, 'rgba(255, 30, 30, 0)')
          ctx.fillStyle = tipGlow
          ctx.beginPath()
          ctx.arc(mid, hz.y + 1, 6, 0, Math.PI * 2)
          ctx.fill()

          // Bright neon red/white tip highlight
          ctx.fillStyle = '#ff6666'
          ctx.beginPath()
          ctx.moveTo(mid - 1.5, hz.y + 2)
          ctx.lineTo(mid, hz.y)
          ctx.lineTo(mid + 1.5, hz.y + 2)
          ctx.fill()
          
          // Tiny white tip point (extreme hot spot)
          this.px(Math.round(mid - 0.5), hz.y, 1, 1, '#ffffff')
          
          // Warning/laser line at the base (neon red)
          this.px(x, hz.y + hz.h - 2, currentW, 2, '#ff1a1a')
          this.px(x + 1, hz.y + hz.h - 1.5, currentW - 2, 0.7, '#ffffff') // white core
        }
      }
      for (const s of lv.stars) if (!s.got) this.drawStar(s.x, s.y)
      this.drawFlag(lv.goalX)
      
      // Draw NPCs (Milk, cat, bunny, bird)
      for (const npc of lv.npcs || []) {
        if (npc.type === 'milk') {
          this.drawMilk(npc.x, npc.y, npc.face)
        } else if (npc.type === 'cat') {
          this.drawCat(npc.x, npc.y)
        } else if (npc.type === 'bunny') {
          this.drawBunny(npc.x, npc.y)
        } else if (npc.type === 'bird') {
          this.drawBird(npc.x, npc.y)
        }
        
        // Show dialogue or hovering indicator if player is nearby
        const dist = Math.abs((p.x + p.w / 2) - (npc.x + 8))
        if (Math.abs((p.y + p.h / 2) - (npc.y + 10)) < 40) {
          if (dist < 60) {
            const bubbleY = npc.y - (npc.type === 'milk' ? 6 : 4)
            this.speech(npc.x + 8, bubbleY, npc.msg)
          } else if (dist < 110) {
            const bob = Math.sin(this.t / 8) * 1.5
            const heartY = npc.y - (npc.type === 'milk' ? 10 : 8) + bob
            const heartColor = npc.type === 'milk' ? '#ff5db1' : (npc.type === 'cat' ? '#ff9233' : (npc.type === 'bird' ? '#7ee0ff' : '#ffffff'))
            this.drawTinyHeart(npc.x + 8, heartY, heartColor)
          }
        }
      }

      if (boss && boss.hp > 0) {
        const bob = Math.sin(this.t / 8) * 1
        const hop = boss.hop > 0 ? -Math.sin((1 - boss.hop / 12) * Math.PI) * 6 : 0
        this.drawDog(boss.x, boss.y + bob + hop, 'jaidee')
        this.drawDog(boss.x + 20, boss.y - bob + hop, 'panda')
        for (let i = 0; i < 3; i++) { 
          ctx.fillStyle = i < boss.hp ? '#ff3d81' : '#442'
          this.heart(boss.x + 8 + i * 10, boss.y - 14 + hop) 
        }
        if (this.t % 200 < 90) this.speech(boss.x + boss.w / 2, boss.y - 24 + hop, CONFIG.boss.taunt)
      }
      for (const h of this.hearts) { ctx.fillStyle = '#ff5db1'; this.heart(h.x, h.y) }
      this.drawFx()
      if (!(p.dead && (this.t >> 2) & 1)) this.drawPlayer(p.x, p.y)
    }
    ctx.restore()

    if (this.mode === Mode.PLAY) {
      // Draw player hearts HUD with shadow and pulse effect
      for (let i = 0; i < 3; i++) { 
        const active = i < this.lives
        ctx.fillStyle = active ? '#ff3d81' : '#221a3b'
        
        // Pulse last active heart
        const isLastHeart = (i === this.lives - 1)
        const pulse = (active && isLastHeart) ? Math.round(Math.sin(this.t / 6) * 0.6) : 0
        
        const hx = 10 + i * 16
        const hy = 10 - pulse
        
        // Draw drop shadow
        ctx.fillStyle = '#0a0620'
        this.heart(hx + 1, hy + 1)
        
        ctx.fillStyle = active ? '#ff3d81' : '#302652'
        this.heart(hx, hy)
        
        // highlight dot
        if (active) this.px(hx + 1, hy + 1, 1, 1, '#ffffff')
      }
      
      // Draw a small HUD vector star
      const hx = 16
      const hy = 32
      
      // HUD star gold shadow/outline
      ctx.fillStyle = '#ccaa00'
      this.drawVectorStar(hx, hy, 5, 5.5, 2.3)
      ctx.fill()
      
      const HUDGrad = ctx.createLinearGradient(hx, hy - 5, hx, hy + 5)
      HUDGrad.addColorStop(0, '#fff3a8')
      HUDGrad.addColorStop(1, '#ffa200')
      ctx.fillStyle = HUDGrad
      this.drawVectorStar(hx, hy, 5, 4.5, 1.8)
      ctx.fill()
      
      this.shadowText(this.stars.toString(), 26, 36, '#ffe14d')
      this.shadowText('ด่าน ' + (this.lvl + 1) + '/5', W - 8, 18, '#ffe14d', 'right')
    }
    if (this.ui.screen === 'end') {
      for (const c of this.confetti) {
        c.y += c.vy; if (c.y > H) c.y = -4
        ctx.fillStyle = ['#ff3d81', '#ffe14d', '#7ee0ff'][(c.x | 0) % 3]; this.heartAt(c.x, c.y, c.s)
      }
    }
  }
}

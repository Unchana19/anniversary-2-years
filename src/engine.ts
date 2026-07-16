/* ============================================================
   ENGINE  —  8-bit platformer. Framework-agnostic.
   Owns the canvas, game loop, physics, audio and boss.
   React drives it through public methods and reads UI state
   through the onUI callback.
   ============================================================ */
import { CONFIG } from './config'

const W = 480, H = 270, GRAV = 0.45, MOVE = 1.9, MAXFALL = 8.5, JUMP = -7.4
const GH = 26, GY = H - GH

type Solid = { x: number; y: number; w: number; h: number }
type Haz = { x: number; y: number; w: number; h: number; hz: number }
type Star = { x: number; y: number; got: boolean }
type Level = {
  w: number
  start: { x: number; y: number }
  solids: Solid[]
  haz: Haz[]
  stars: Star[]
  goalX: number
  bossX?: number
}

const grd = (x: number, w: number): Solid => ({ x, y: GY, w, h: GH })
const plat = (x: number, y: number, w: number): Solid => ({ x, y, w, h: 10 })
const spk = (x: number, w: number): Haz => ({ x, y: GY - 8, w, h: 8, hz: 1 })
const star = (x: number, y: number): Star => ({ x, y, got: false })

const LEVELS: Level[] = [
  { w: 1500, start: { x: 40, y: GY - 40 },
    solids: [grd(0, 560), grd(640, 860), plat(300, GY - 58, 70), plat(470, GY - 96, 70)],
    haz: [], stars: [star(320, GY - 84), star(690, GY - 40)], goalX: 1420 },
  { w: 1700, start: { x: 40, y: GY - 40 },
    solids: [grd(0, 520), grd(600, 1180), plat(260, GY - 56, 80), plat(420, GY - 100, 80), plat(560, GY - 146, 80)],
    haz: [spk(760, 26)], stars: [star(450, GY - 128), star(900, GY - 40)], goalX: 1620 },
  { w: 1900, start: { x: 40, y: GY - 40 },
    solids: [grd(0, 300), plat(360, GY - 60, 90), plat(560, GY - 96, 90), plat(770, GY - 70, 90),
             grd(980, 300), plat(1360, GY - 70, 90), grd(1560, 360)],
    haz: [spk(1080, 26)], stars: [star(590, GY - 124), star(1390, GY - 98)], goalX: 1820 },
  { w: 2100, start: { x: 40, y: GY - 40 },
    solids: [grd(0, 480), grd(560, 300), plat(1000, GY - 64, 90), plat(1200, GY - 110, 90),
             grd(1360, 340), plat(1780, GY - 64, 90), grd(1740, 340)],
    haz: [spk(300, 26), spk(900, 26), spk(1600, 26)],
    stars: [star(1230, GY - 138), star(1810, GY - 92)], goalX: 2020 },
  // L5: short run -> BOSS (the two dogs) -> flag
  { w: 1500, start: { x: 40, y: GY - 40 },
    solids: [grd(0, 1500), plat(360, GY - 58, 70), plat(560, GY - 100, 70)],
    haz: [], stars: [star(390, GY - 84), star(590, GY - 126)], goalX: 1440,
    bossX: 1140 },
]

enum Mode { TITLE, PLAY }

export type Screen = 'title' | 'cut' | 'boss' | 'end' | null
export interface UIState {
  screen: Screen
  skip: boolean
  cutIndex: number
}

type Boss = { x: number; y: number; w: number; h: number; hp: number; cd: number }
type Player = {
  x: number; y: number; vx: number; vy: number; w: number; h: number
  onGround: boolean; face: number; coyote: number; buf: number; dead: number
}
type Heart = { x: number; y: number; vx: number; vy: number; life: number }
type Confetti = { x: number; y: number; s: number; vy: number }

const NOTE: Record<string, number> = {
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392, A4: 440, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880, B5: 987.77, C6: 1046.5,
}

export class Game {
  private ctx: CanvasRenderingContext2D
  private ui: UIState = { screen: 'title', skip: false, cutIndex: 0 }
  private onUI: (s: UIState) => void

  private mode: Mode = Mode.TITLE
  private lvl = 0
  private lives = 3
  private deaths = 0
  private stars = 0
  private cam = 0
  private shake = 0
  private t = 0

  private p: Player = { x: 0, y: 0, vx: 0, vy: 0, w: 12, h: 15, onGround: false, face: 1, coyote: 0, buf: 0, dead: 0 }
  private keys = { left: false, right: false, jump: false }

  private boss: Boss | null = null
  private bossIntroShown = false
  private hearts: Heart[] = []
  private confetti: Confetti[] = []

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
      const k = e.key.toLowerCase()
      if (['arrowleft', 'a'].includes(k)) this.keys.left = true
      if (['arrowright', 'd'].includes(k)) this.keys.right = true
      if (['arrowup', 'w', ' ', 'spacebar'].includes(k)) { this.keys.jump = true; this.p.buf = 8; e.preventDefault() }
    }
    this.onKeyUp = (e) => {
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

  pressStart() {
    if (!this.AC) {
      try { this.AC = new (window.AudioContext || (window as any).webkitAudioContext)() } catch { /* no audio */ }
    }
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
  private beep(f: number, d: number, type: OscillatorType = 'square', v = 0.06) {
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
    this.boss = bx != null ? { x: bx, y: GY - 26, w: 40, h: 26, hp: 3, cd: 0 } : null
    this.set({ screen: null, skip: false })
    this.respawn()
  }

  private respawn() {
    const st = LEVELS[this.lvl].start
    this.p.x = st.x; this.p.y = st.y; this.p.vx = 0; this.p.vy = 0
    this.p.dead = 0; this.p.onGround = false; this.cam = 0
  }

  private die() {
    if (this.p.dead) return
    this.p.dead = 1; this.shake = 10; this.sfxHurt(); this.lives--; this.deaths++
    if (this.deaths >= 5) this.set({ skip: true })
    setTimeout(() => { if (this.lives <= 0) this.lives = 3; this.respawn() }, 500)
  }

  private finishLevel() {
    this.sfxWin(); this.mode = Mode.TITLE
    this.set({ screen: 'cut', skip: false, cutIndex: this.lvl })
  }

  private showBossIntro() {
    this.bossIntroShown = true; this.mode = Mode.TITLE
    this.set({ screen: 'boss' })
  }

  private finale() {
    this.set({ screen: 'end' })
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

  private update() {
    const p = this.p
    this.t++
    if (this.shake > 0) this.shake--
    for (const h of this.hearts) { h.x += h.vx; h.y += h.vy; h.vy += 0.12; h.life-- }
    this.hearts = this.hearts.filter((h) => h.life > 0)
    if (this.mode !== Mode.PLAY || p.dead) return
    const lv = LEVELS[this.lvl]
    const boss = this.boss

    // boss intro trigger
    if (boss && boss.hp > 0 && !this.bossIntroShown && p.x + p.w > boss.x - 120) { this.showBossIntro(); return }

    // horizontal
    if (this.keys.left) { p.vx = -MOVE; p.face = -1 } else if (this.keys.right) { p.vx = MOVE; p.face = 1 } else p.vx *= 0.6
    p.x += p.vx
    const solids = lv.solids.slice()
    if (boss && boss.hp > 0) solids.push(boss)
    for (const s of solids) {
      if (this.rectHit(p, s)) {
        if (p.vx > 0) p.x = s.x - p.w; else if (p.vx < 0) p.x = s.x + s.w
        p.vx = 0
      }
    }
    if (p.x < 0) p.x = 0

    // vertical
    p.coyote = p.onGround ? 6 : p.coyote - 1
    if (p.buf > 0) p.buf--
    if (p.buf > 0 && p.coyote > 0) { p.vy = JUMP; p.onGround = false; p.coyote = 0; p.buf = 0; this.sfxJump() }
    if (!this.keys.jump && p.vy < -2) p.vy = -2
    p.vy += GRAV; if (p.vy > MAXFALL) p.vy = MAXFALL
    p.y += p.vy; p.onGround = false
    for (const s of lv.solids) {
      if (this.rectHit(p, s)) {
        if (p.vy > 0) { p.y = s.y - p.h; p.onGround = true } else if (p.vy < 0) p.y = s.y + s.h
        p.vy = 0
      }
    }

    // boss boop (fall onto top)
    if (boss && boss.hp > 0) {
      if (boss.cd > 0) boss.cd--
      if (this.rectHit(p, boss)) {
        if (p.vy > 0 && (p.y + p.h) < boss.y + 14) {
          boss.hp--; boss.cd = 20; p.vy = JUMP * 0.75; this.shake = 6; this.sfxBoop()
          this.spawnHearts(boss.x + boss.w / 2, boss.y, 8)
          if (boss.hp <= 0) this.spawnHearts(boss.x + boss.w / 2, boss.y, 20)
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
      if (!s.got && Math.abs(p.x + p.w / 2 - s.x) < 12 && Math.abs(p.y + p.h / 2 - s.y) < 12) {
        s.got = true; this.stars++; this.sfxStar()
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
    this.px(sx + 2, sy, 8, 4, '#ffe14d'); this.px(sx + 1, sy + 4, 10, 5, '#ffd0a8')
    this.px(sx + (p.face > 0 ? 7 : 2), sy + 5, 2, 2, '#000'); this.px(sx + 1, sy + 9, 10, 4, '#ff3d81')
    this.px(sx + 1, sy + 13, 4, 2, '#2b3a67'); this.px(sx + 7, sy + 13, 4, 2, '#2b3a67')
  }
  private drawDog(sx: number, sy: number, body: string) {
    this.px(sx + 2, sy + 6, 14, 12, body); this.px(sx, sy + 2, 5, 6, body); this.px(sx + 13, sy + 2, 5, 6, body)
    this.px(sx + 4, sy + 10, 2, 2, '#000'); this.px(sx + 11, sy + 10, 2, 2, '#000'); this.px(sx + 7, sy + 13, 3, 2, '#111')
    this.px(sx + 7, sy + 16, 3, 2, '#ff8fb0')
  }
  private drawStar(sx: number, sy: number) {
    const ctx = this.ctx
    ctx.save(); ctx.translate(sx, sy); const s = 3 + Math.sin(this.t / 6) * 0.6
    ctx.fillStyle = '#ffe14d'; ctx.fillRect(-s, -1, s * 2, 2); ctx.fillRect(-1, -s, 2, s * 2); ctx.restore()
  }
  private drawFlag(sx: number) {
    const ctx = this.ctx
    this.px(sx, GY - 46, 3, 46, '#cfd6ff'); ctx.fillStyle = '#ff3d81'
    ctx.beginPath(); ctx.moveTo(sx + 3, GY - 46); ctx.lineTo(sx + 22, GY - 40); ctx.lineTo(sx + 3, GY - 32); ctx.fill()
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

  private render() {
    const ctx = this.ctx, p = this.p, boss = this.boss
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#241b52'); g.addColorStop(1, '#0b0b1e')
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H)
    ctx.fillStyle = '#4a4a80'
    for (let i = 0; i < 40; i++) {
      const bx = ((i * 127 - this.cam * 0.3) % (W + 20) + W + 20) % (W + 20) - 10
      const by = (i * 53) % (H - 60); ctx.fillRect(bx, by, 1, 1)
    }

    const sh = this.shake > 0 ? (Math.random() * 2 - 1) * this.shake * 0.4 : 0
    ctx.save(); ctx.translate(-Math.round(this.cam) + sh, sh * 0.5)

    if (this.mode === Mode.PLAY) {
      const lv = LEVELS[this.lvl]
      for (const s of lv.solids) {
        if (s.h === GH) {
          this.px(s.x, s.y, s.w, 4, '#4caf50'); this.px(s.x, s.y + 4, s.w, s.h - 4, '#5a3a1a')
          for (let x = s.x; x < s.x + s.w; x += 16) this.px(x + 6, s.y + 8, 2, 2, '#734a22')
        } else {
          this.px(s.x, s.y, s.w, s.h, '#6a5acd'); this.px(s.x, s.y, s.w, 2, '#9d90ff')
        }
      }
      for (const hz of lv.haz) {
        ctx.fillStyle = '#e33'
        for (let x = hz.x; x < hz.x + hz.w; x += 8) {
          ctx.beginPath(); ctx.moveTo(x, hz.y + hz.h); ctx.lineTo(x + 4, hz.y); ctx.lineTo(x + 8, hz.y + hz.h); ctx.fill()
        }
      }
      for (const s of lv.stars) if (!s.got) this.drawStar(s.x, s.y)
      this.drawFlag(lv.goalX)
      if (boss && boss.hp > 0) {
        const bob = Math.sin(this.t / 8) * 1
        this.drawDog(boss.x, boss.y + bob, '#f2efe6'); this.drawDog(boss.x + 20, boss.y - bob, '#ffffff')
        for (let i = 0; i < 3; i++) { ctx.fillStyle = i < boss.hp ? '#ff3d81' : '#553'; this.heart(boss.x + 8 + i * 10, boss.y - 14) }
      }
      for (const h of this.hearts) { ctx.fillStyle = '#ff5db1'; this.heart(h.x, h.y) }
      if (!(p.dead && (this.t >> 2) & 1)) this.drawPlayer(p.x, p.y)
    }
    ctx.restore()

    if (this.mode === Mode.PLAY) {
      for (let i = 0; i < 3; i++) { ctx.fillStyle = i < this.lives ? '#ff3d81' : '#442'; this.heart(10 + i * 14, 10) }
      ctx.fillStyle = '#ffe14d'; ctx.font = '8px "Courier New"'; ctx.textAlign = 'left'; ctx.fillText('★ ' + this.stars, 10, 34)
      ctx.textAlign = 'right'; ctx.fillText('LV ' + (this.lvl + 1) + '/5', W - 8, 16); ctx.textAlign = 'left'
    }
    if (this.ui.screen === 'end') {
      for (const c of this.confetti) {
        c.y += c.vy; if (c.y > H) c.y = -4
        ctx.fillStyle = ['#ff3d81', '#ffe14d', '#7ee0ff'][(c.x | 0) % 3]; this.heartAt(c.x, c.y, c.s)
      }
    }
  }
}

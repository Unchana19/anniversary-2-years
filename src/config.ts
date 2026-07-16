/* ============================================================
   CONFIG  —  ✎ edit here. This is the only file you need to touch.
   Photos live in /public/photos (1.jpeg .. 7.jpeg).
   ============================================================ */

export interface Chapter {
  title: string
  caption: string
  photo: string
}

export interface Boss {
  name: string
  taunt: string
  how: string
  photo: string
}

export interface GameConfig {
  herName: string
  playerName: string
  anniversary: string
  chapters: Chapter[]
  boss: Boss
  finaleTitle: string
  finaleMessage: string
  finalePhoto: string
  /** 8-bit finale tune. Leave [] for the built-in happy jingle,
   *  or give [noteName, beats] pairs e.g. [["E5",1],["D5",1]]. */
  songMelody: [string, number][]
}

export const CONFIG: GameConfig = {
  herName: 'Milk',
  playerName: 'Oat',
  anniversary: '17 กรกฎาคม',

  chapters: [
    { title: 'บทที่ 1 — จุดเริ่มต้นของเรา', caption: 'จุดเริ่มต้นเล็ก ๆ ของเรา... แค่ได้อยู่ใกล้ ๆ คุณ ก็เริ่มมีความหมายกับฉันมากที่สุดแล้ว ♥', photo: 'photos/3.jpeg' },
    { title: 'บทที่ 2 — การผจญภัยครั้งแรก', caption: 'ออกเดินทางผจญภัยไปด้วยกัน หัวเราะและยิ้มด้วยกันตลอดเส้นทาง 🏍️', photo: 'photos/1.jpeg' },
    { title: 'บทที่ 3 — ค่ำคืนอันเงียบสงบที่มีแค่เรา', caption: 'ในค่ำคืนที่แสนเงียบสงบที่มีเพียงแค่เราสองคน ราวกับว่าโลกทั้งใบมีแค่พวกเราเท่านั้น ✨', photo: 'photos/2.jpeg' },
    { title: 'บทที่ 4 — ช่วงเวลาที่แสนหวาน', caption: 'ทุกการเฉลิมฉลองเล็ก ๆ ของเรา ช่างหอมหวานและมีความสุขที่สุด 🎄', photo: 'photos/6.jpeg' },
    { title: 'บทที่ 5 — ครอบครัวตัวน้อยของเรา', caption: 'และแล้วพวกเราก็กลายเป็นสาม... แล้วก็เพิ่มเป็นสี่ตัวป่วน 🐶', photo: 'photos/4.jpeg' },
  ],

  boss: {
    name: 'ใจดี & แพนด้า', // Jaidee & Panda
    taunt: 'โฮ่งๆ !!', // woof woof
    how: 'แตะจมูกพวกเขา 3 ครั้งเพื่อขอผ่านทาง! 🐾',
    photo: 'photos/5.jpeg',
  },

  finaleTitle: 'สุขสันต์วันครบรอบ 2 ปีนะ Milk 💖',
  finaleMessage: "สุขสันต์วันครบรอบ 2 ปีนะ อยู่เคียงข้างกันแบบนี้ เป็นครอบครัวตัวน้อยที่แสนอบอุ่น และพร้อมลุยทุกการผจญภัยไปด้วยกันในวันข้างหน้านะครับ รักคุณที่สุดเลยนะ — Oat",
  finalePhoto: 'photos/7.jpeg',

  songMelody: [],
}

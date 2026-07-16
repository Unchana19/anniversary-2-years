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
  anniversary: 'July 17',

  chapters: [
    { title: 'Chapter 1 — Where We Started', caption: 'The very beginning — when just being near you started to mean everything.', photo: 'photos/3.jpeg' },
    { title: 'Chapter 2 — Our First Adventures', caption: 'Chasing adventures together, laughing the whole way. 🏍️', photo: 'photos/1.jpeg' },
    { title: 'Chapter 3 — Late Nights, Just Us', caption: 'The quiet nights out that felt like the whole world was only ours. ✨', photo: 'photos/2.jpeg' },
    { title: 'Chapter 4 — The Sweetest Moments', caption: 'All our little celebrations — literally the sweetest. 🎄', photo: 'photos/6.jpeg' },
    { title: 'Chapter 5 — We Became a Family', caption: 'And then it was three of us... then four. 🐶', photo: 'photos/4.jpeg' },
  ],

  boss: {
    name: 'ใจดี & แพนด้า', // Jaidee & Panda
    taunt: 'โฮ่งๆ !!', // woof woof
    how: 'Give them 3 boops to win their approval! 🐾',
    photo: 'photos/5.jpeg',
  },

  finaleTitle: 'Happy 2 Years, Milk 💖',
  finaleMessage: "Happy 2 year anniversary. Here's to us, our little family, and every adventure still ahead. I love you. — Oat",
  finalePhoto: 'photos/7.jpeg',

  songMelody: [],
}

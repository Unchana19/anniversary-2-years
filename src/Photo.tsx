import { useState } from 'react'

/** Pixel-framed photo that simply vanishes if the image fails to load,
 *  mirroring the standalone build's "missing photo -> hide" behaviour. */
export function Photo({ src, alt = '' }: { src: string; alt?: string }) {
  const [broken, setBroken] = useState(false)
  if (broken) return null
  return <img className="photo" src={src} alt={alt} onError={() => setBroken(true)} />
}

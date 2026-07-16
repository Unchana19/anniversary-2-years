import { useState, useEffect } from 'react'
import { CONFIG } from './config'

/** Pixel-framed photo that simply vanishes if the image fails to load,
 *  mirroring the standalone build's "missing photo -> hide" behaviour. */
export function Photo({ src, alt = '' }: { src: string; alt?: string }) {
  const [broken, setBroken] = useState(false)
  const [isZoomed, setIsZoomed] = useState(false)

  useEffect(() => {
    if (!isZoomed) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsZoomed(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isZoomed])

  if (broken) return null

  return (
    <>
      <div
        className="photo-frame interactive"
        onClick={() => setIsZoomed(true)}
        role="button"
        tabIndex={0}
        aria-label="ขยายรูปภาพ"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setIsZoomed(true)
          }
        }}
      >
        <img className="photo" src={src} alt={alt} onError={() => setBroken(true)} />
        <div className="photo-label">♥ {CONFIG.herName.toLowerCase()} & {CONFIG.playerName.toLowerCase()} ♥</div>
        <div className="zoom-hint">🔍 คลิกเพื่อขยาย</div>
      </div>

      {isZoomed && (
        <div
          className="photo-lightbox-overlay"
          onClick={() => setIsZoomed(false)}
          role="dialog"
          aria-modal="true"
        >
          <div className="photo-lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="photo-lightbox-close"
              onClick={() => setIsZoomed(false)}
              aria-label="ปิดรูปขยาย"
            >
              ×
            </button>
            <div className="photo-frame-zoomed">
              <img className="photo-zoomed" src={src} alt={alt} />
              <div className="photo-label-zoomed">
                ♥ {CONFIG.herName.toLowerCase()} & {CONFIG.playerName.toLowerCase()} ♥
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}



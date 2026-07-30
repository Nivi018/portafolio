"use client"

import { useState, useRef, useCallback } from "react"
import Image from "next/image"
import { ZoomIn, X } from "lucide-react"
import { cn } from "@/lib/utils"

type Props = {
  images: { id: string; url: string; alt: string | null }[]
  name: string
}

export function ProductGallery({ images, name }: Props) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [zoomStyle, setZoomStyle] = useState<{ transform: string }>({ transform: "" })
  const imageRef = useRef<HTMLDivElement>(null)

  const active = images[activeIndex] ?? images[0]

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current) return
    const rect = imageRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setZoomStyle({ transform: `scale(2) translate(${-x + 50}%, ${-y + 50}%)` })
  }, [])

  const handleMouseLeave = useCallback(() => {
    setZoomStyle({ transform: "" })
  }, [])

  if (!active) {
    return (
      <div className="aspect-square w-full rounded-2xl border bg-muted flex items-center justify-center text-muted-foreground">
        No image
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Main image with zoom on hover */}
      <div
        ref={imageRef}
        className="relative aspect-square w-full overflow-hidden rounded-2xl border bg-muted cursor-zoom-in group"
        onClick={() => setLightboxOpen(true)}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <Image
          src={active.url}
          alt={active.alt ?? name}
          fill
          priority
          sizes="(min-width: 1024px) 50vw, 100vw"
          className={cn("object-cover transition-transform duration-200", "group-hover:scale-150")}
          style={zoomStyle}
        />
        <div className="absolute top-3 right-3 rounded-full bg-background/80 backdrop-blur p-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <ZoomIn className="h-4 w-4" />
        </div>
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {images.map((img, idx) => (
            <button
              key={img.id}
              onClick={() => setActiveIndex(idx)}
              aria-label={`View image ${idx + 1}`}
              className={cn(
                "relative aspect-square overflow-hidden rounded-lg border-2 transition-colors",
                activeIndex === idx
                  ? "border-primary"
                  : "border-transparent hover:border-muted-foreground/30",
              )}
            >
              <Image
                src={img.url}
                alt={img.alt ?? `${name} ${idx + 1}`}
                fill
                sizes="100px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            className="absolute top-4 right-4 text-white rounded-full bg-white/10 backdrop-blur p-2 hover:bg-white/20"
            onClick={(e) => {
              e.stopPropagation()
              setLightboxOpen(false)
            }}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="relative max-w-5xl max-h-[90vh] w-full h-full">
            <Image
              src={active.url}
              alt={active.alt ?? name}
              fill
              sizes="(min-width: 1024px) 90vw, 100vw"
              className="object-contain"
            />
          </div>
        </div>
      )}
    </div>
  )
}

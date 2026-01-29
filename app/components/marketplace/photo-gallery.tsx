import { useState } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Dialog, DialogContent } from '~/components/ui/dialog'

interface PhotoGalleryProps {
  photos: Array<string>
  alt: string
}

export function PhotoGallery({ photos, alt }: PhotoGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  const openModal = (index: number) => {
    setSelectedIndex(index)
  }

  const closeModal = () => {
    setSelectedIndex(null)
  }

  const goToPrevious = () => {
    if (selectedIndex !== null) {
      setSelectedIndex(
        selectedIndex > 0 ? selectedIndex - 1 : photos.length - 1,
      )
    }
  }

  const goToNext = () => {
    if (selectedIndex !== null) {
      setSelectedIndex(
        selectedIndex < photos.length - 1 ? selectedIndex + 1 : 0,
      )
    }
  }

  return (
    <>
      {/* Thumbnail Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {photos.map((photo, index) => (
          <button
            key={index}
            onClick={() => openModal(index)}
            className="aspect-square overflow-hidden rounded-lg border hover:opacity-80 transition-opacity"
          >
            <img
              src={photo}
              alt={`${alt} ${index + 1}`}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>

      {/* Full-size Modal */}
      <Dialog open={selectedIndex !== null} onOpenChange={closeModal}>
        <DialogContent className="max-w-4xl p-0 bg-black/90">
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-10 text-white hover:bg-white/20"
              onClick={closeModal}
              aria-label="Close photo gallery"
            >
              <X className="h-4 w-4" />
            </Button>

            {selectedIndex !== null && (
              <>
                <img
                  src={photos[selectedIndex]}
                  alt={`${alt} ${selectedIndex + 1}`}
                  className="w-full max-h-[80vh] object-contain"
                />

                {photos.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                      onClick={goToPrevious}
                      aria-label="Previous photo"
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                      onClick={goToNext}
                      aria-label="Next photo"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </Button>

                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm">
                      {selectedIndex + 1} / {photos.length}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

import { useState } from "react";
import { ChevronLeft, ChevronRight, X, Grid2x2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface ImageGalleryProps {
  images: string[];
  title: string;
}

const ImageGallery = ({ images, title }: ImageGalleryProps) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const prev = () => setCurrentIndex((i) => (i === 0 ? images.length - 1 : i - 1));
  const next = () => setCurrentIndex((i) => (i === images.length - 1 ? 0 : i + 1));

  return (
    <>
      {/* Grid preview */}
      <div className="relative grid grid-cols-1 gap-2 overflow-hidden rounded-2xl md:grid-cols-4 md:grid-rows-2 md:h-[420px]">
        <div
          className="col-span-1 cursor-pointer overflow-hidden md:col-span-2 md:row-span-2"
          onClick={() => { setCurrentIndex(0); setLightboxOpen(true); }}
        >
          <img src={images[0]} alt={title} className="h-full w-full object-cover transition-opacity hover:opacity-90" />
        </div>
        {images.slice(1, 5).map((img, i) => (
          <div
            key={i}
            className="hidden cursor-pointer overflow-hidden md:block"
            onClick={() => { setCurrentIndex(i + 1); setLightboxOpen(true); }}
          >
            <img src={img} alt={`${title} ${i + 2}`} className="h-full w-full object-cover transition-opacity hover:opacity-90" />
          </div>
        ))}
        <Button
          variant="outline"
          size="sm"
          className="absolute bottom-4 right-4 gap-2 rounded-lg bg-card/90 text-xs shadow-md backdrop-blur-sm"
          onClick={() => setLightboxOpen(true)}
        >
          <Grid2x2 className="h-3.5 w-3.5" />
          Show all photos
        </Button>
      </div>

      {/* Lightbox */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-5xl border-none bg-foreground/95 p-0 text-primary-foreground">
          <div className="relative flex h-[80vh] items-center justify-center">
            <Button variant="ghost" size="icon" className="absolute left-4 text-primary-foreground hover:bg-primary-foreground/10" onClick={prev}>
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <img
              src={images[currentIndex]}
              alt={`${title} ${currentIndex + 1}`}
              className="max-h-full max-w-full rounded-lg object-contain"
            />
            <Button variant="ghost" size="icon" className="absolute right-4 text-primary-foreground hover:bg-primary-foreground/10" onClick={next}>
              <ChevronRight className="h-6 w-6" />
            </Button>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-primary-foreground/70">
              {currentIndex + 1} / {images.length}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ImageGallery;

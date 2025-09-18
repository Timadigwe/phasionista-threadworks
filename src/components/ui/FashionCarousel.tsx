import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CarouselItem {
  id: string;
  title: string;
  subtitle?: string;
  image: string;
  link?: string;
}

interface FashionCarouselProps {
  items: CarouselItem[];
  autoPlay?: boolean;
  autoPlayInterval?: number;
  showControls?: boolean;
  showIndicators?: boolean;
  className?: string;
  itemClassName?: string;
}

export const FashionCarousel = ({
  items,
  autoPlay = true,
  autoPlayInterval = 5000,
  showControls = true,
  showIndicators = true,
  className = "",
  itemClassName = "",
}: FashionCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!autoPlay || items.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === items.length - 1 ? 0 : prevIndex + 1
      );
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [autoPlay, autoPlayInterval, items.length]);

  const goToPrevious = () => {
    setCurrentIndex(currentIndex === 0 ? items.length - 1 : currentIndex - 1);
  };

  const goToNext = () => {
    setCurrentIndex(currentIndex === items.length - 1 ? 0 : currentIndex + 1);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  if (items.length === 0) return null;

  return (
    <div className={`relative overflow-hidden rounded-xl ${className}`}>
      {/* Carousel Items */}
      <div className="relative aspect-[16/9] md:aspect-[21/9]">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -300 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            <div
              className={`relative w-full h-full bg-cover bg-center bg-no-repeat ${itemClassName}`}
              style={{ backgroundImage: `url(${items[currentIndex].image})` }}
            >
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/25 to-transparent" />
              
              {/* Content */}
              <div className="absolute inset-0 flex items-center">
                <div className="container-custom">
                  <div className="max-w-2xl">
                    <motion.h2
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2, duration: 0.6 }}
                      className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-4"
                    >
                      {items[currentIndex].title}
                    </motion.h2>
                    
                    {items[currentIndex].subtitle && (
                      <motion.p
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.6 }}
                        className="text-xl md:text-2xl text-white/90 mb-8"
                      >
                        {items[currentIndex].subtitle}
                      </motion.p>
                    )}
                    
                    {items[currentIndex].link && (
                      <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6, duration: 0.6 }}
                      >
                        <Button size="lg" className="btn-hero">
                          Explore Collection
                        </Button>
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Controls */}
      {showControls && items.length > 1 && (
        <>
          <Button
            variant="secondary"
            size="sm"
            className="absolute left-4 top-1/2 transform -translate-y-1/2 h-10 w-10 p-0 rounded-full shadow-medium opacity-80 hover:opacity-100"
            onClick={goToPrevious}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          
          <Button
            variant="secondary"
            size="sm"
            className="absolute right-4 top-1/2 transform -translate-y-1/2 h-10 w-10 p-0 rounded-full shadow-medium opacity-80 hover:opacity-100"
            onClick={goToNext}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </>
      )}

      {/* Indicators */}
      {showIndicators && items.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {items.map((_, index) => (
            <button
              key={index}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? 'bg-white shadow-medium'
                  : 'bg-white/50 hover:bg-white/70'
              }`}
              onClick={() => goToSlide(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
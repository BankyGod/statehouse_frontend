import { Children, useEffect, useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type CardCarouselProps = {
  label: string;
  children: ReactNode;
  empty?: ReactNode;
};

export function CardCarousel({ label, children, empty }: CardCarouselProps) {
  const slides = Children.toArray(children).filter(Boolean);
  const count = slides.length;
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (index >= count && count > 0) setIndex(count - 1);
  }, [count, index]);

  if (count === 0) {
    return empty ? <>{empty}</> : null;
  }

  if (count === 1) {
    return <div className="wallet-slot">{slides[0]}</div>;
  }

  const go = (dir: -1 | 1) => {
    setIndex((i) => (i + dir + count) % count);
  };

  return (
    <div className="wallet-slot card-carousel">
      <div className="card-carousel-bar">
        <span className="card-carousel-label">{label}</span>
        <span className="card-carousel-count">
          {index + 1} / {count}
        </span>
        <div className="card-carousel-nav">
          <button type="button" className="btn ghost sm" onClick={() => go(-1)} aria-label="Previous">
            <ChevronLeft size={16} aria-hidden />
          </button>
          <button type="button" className="btn ghost sm" onClick={() => go(1)} aria-label="Next">
            <ChevronRight size={16} aria-hidden />
          </button>
        </div>
      </div>
      <div className="card-carousel-stage">{slides[index]}</div>
      <div className="card-carousel-dots" role="tablist" aria-label={label}>
        {slides.map((_, i) => (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={i === index}
            className={`card-carousel-dot ${i === index ? 'active' : ''}`}
            onClick={() => setIndex(i)}
            aria-label={`${label} ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

import { useEffect, useRef } from 'react';

const WORDS = ['APEXBRIDGE', 'COLLEGE'];

const prefersReduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function ScrollWordmark() {
  const ref = useRef(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || prefersReduced()) return undefined;

    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = node.getBoundingClientRect();
      const progress = (window.innerHeight - rect.top) / (window.innerHeight + rect.height);
      node.style.setProperty('--wm-progress', Math.min(1, Math.max(0, progress)).toFixed(4));
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return (
    <section ref={ref} className="wordmark-band" aria-label="Apexbridge College">
      <div className="wordmark-inner" aria-hidden="true">
        {WORDS.map((word, wordIndex) => (
          <span key={word} className={`wordmark-word${wordIndex ? ' wordmark-word--accent' : ''}`}>
            {[...word].map((letter, letterIndex) => (
              <span className="wordmark-letter" key={letterIndex}>{letter}</span>
            ))}
          </span>
        ))}
      </div>
    </section>
  );
}

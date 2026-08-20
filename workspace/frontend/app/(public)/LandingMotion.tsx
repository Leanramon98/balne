'use client';

import { useEffect } from 'react';

export function LandingMotion() {
  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reduceMotion.matches) return;

    const root = document.documentElement;
    root.classList.add('landing-motion-ready');

    const sections = document.querySelectorAll<HTMLElement>('.landing-observe');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('landing-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.14, rootMargin: '0px 0px -8%' },
    );

    sections.forEach((section) => observer.observe(section));

    let frame = 0;
    const updateParallax = () => {
      frame = 0;
      document.querySelectorAll<HTMLElement>('.landing-parallax').forEach((element) => {
        const bounds = element.getBoundingClientRect();
        const progress = (window.innerHeight * 0.5 - (bounds.top + bounds.height * 0.5)) / window.innerHeight;
        element.style.setProperty('--landing-parallax-y', `${Math.max(-28, Math.min(28, progress * 36)).toFixed(2)}px`);
      });
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(updateParallax);
    };

    updateParallax();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    return () => {
      root.classList.remove('landing-motion-ready');
      observer.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}

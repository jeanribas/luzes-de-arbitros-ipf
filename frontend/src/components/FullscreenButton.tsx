'use client';

import { useCallback, useEffect, useState } from 'react';

function isFullscreenActive() {
  if (typeof document === 'undefined') return false;
  return Boolean(document.fullscreenElement);
}

export function FullscreenButton() {
  const [isActive, setIsActive] = useState(isFullscreenActive());

  const toggle = useCallback(async () => {
    if (typeof document === 'undefined') return;
    if (isFullscreenActive()) {
      await document.exitFullscreen();
    } else {
      await document.documentElement.requestFullscreen();
    }
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const handler = () => setIsActive(isFullscreenActive());
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  return (
    <button
      onClick={toggle}
      className="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white backdrop-blur transition hover:bg-white/20"
    >
      {isActive ? 'Exit Fullscreen' : 'Enter Fullscreen'}
    </button>
  );
}

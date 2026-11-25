'use client';

import { useEffect, useState } from 'react';

export type ThemePref = 'light' | 'dark' | 'system';
const KEY = 'jobora_theme';

export function readThemePref(): ThemePref {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'light' || v === 'dark' || v === 'system' ? v : 'system';
  } catch {
    return 'system';
  }
}

function resolve(pref: ThemePref): 'light' | 'dark' {
  if (pref !== 'system') return pref;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyTheme(pref: ThemePref) {
  document.documentElement.dataset.theme = resolve(pref);
}

/**
 * Applies the user's theme while the workspace is mounted and restores the
 * light marketing look when they leave it. Follows the OS when set to System.
 */
export function useWorkspaceTheme() {
  const [pref, setPref] = useState<ThemePref>('system');

  useEffect(() => {
    const initial = readThemePref();
    setPref(initial);
    applyTheme(initial);
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      if (readThemePref() === 'system') applyTheme('system');
    };
    mq.addEventListener('change', onChange);
    return () => {
      mq.removeEventListener('change', onChange);
      delete document.documentElement.dataset.theme;
    };
  }, []);

  const choose = (next: ThemePref) => {
    setPref(next);
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* storage unavailable: the choice still applies for this visit */
    }
    applyTheme(next);
  };

  return { pref, choose };
}

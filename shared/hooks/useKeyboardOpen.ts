import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Keyboard } from '@capacitor/keyboard';

const KEYBOARD_THRESHOLD = 80;

/**
 * Reports whether the on-screen keyboard is currently open.
 *
 * On native platforms we rely on the Capacitor Keyboard plugin's
 * `keyboardWillShow` / `keyboardWillHide` events — these are the authoritative
 * native signal, fire at the *start* of the show/hide animation (so UI reacts
 * immediately), and are correct regardless of the `resize` mode configured in
 * capacitor.config.ts.
 *
 * On the web we fall back to a `visualViewport` heuristic, since the plugin is
 * a no-op there.
 */
export function useKeyboardOpen(): boolean {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // ── Native: use the Keyboard plugin's lifecycle events ──────────────────
    if (Capacitor.isNativePlatform()) {
      const handles: Array<{ remove: () => void }> = [];
      let cancelled = false;

      // If the effect is cleaned up before a listener finishes registering,
      // remove it immediately to avoid a leak.
      const track = (handle: { remove: () => void }) => {
        if (cancelled) handle.remove();
        else handles.push(handle);
      };

      Keyboard.addListener('keyboardWillShow', () => setIsOpen(true)).then(track);
      Keyboard.addListener('keyboardWillHide', () => setIsOpen(false)).then(track);

      return () => {
        cancelled = true;
        handles.forEach((h) => h.remove());
      };
    }

    // ── Web fallback: measure the visual viewport ───────────────────────────
    const viewport = window.visualViewport;
    if (!viewport) return;

    const update = () => {
      const keyboardHeight = Math.max(
        0,
        window.innerHeight - viewport.height - viewport.offsetTop,
      );
      setIsOpen(keyboardHeight > KEYBOARD_THRESHOLD);
    };

    update();
    viewport.addEventListener('resize', update);
    viewport.addEventListener('scroll', update);

    return () => {
      viewport.removeEventListener('resize', update);
      viewport.removeEventListener('scroll', update);
    };
  }, []);

  return isOpen;
}

export function dismissKeyboard() {
  // Native: ask the OS to dismiss the keyboard outright.
  if (Capacitor.isNativePlatform()) {
    Keyboard.hide().catch(() => {
      /* no-op — plugin can reject if the keyboard is already hidden */
    });
  }

  // Also blur the active element so the web/native input loses focus.
  const active = document.activeElement;
  if (active instanceof HTMLElement) {
    active.blur();
  }
}

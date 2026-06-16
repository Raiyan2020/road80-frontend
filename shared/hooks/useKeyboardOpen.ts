import { useEffect, useState } from 'react';

const KEYBOARD_THRESHOLD = 80;

export function useKeyboardOpen(): boolean {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
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
  const active = document.activeElement;
  if (active instanceof HTMLElement) {
    active.blur();
  }
}

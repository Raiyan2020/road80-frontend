import React from 'react';
import { createPortal } from 'react-dom';

/**
 * Renders children into document.body.
 *
 * The app shell's <main> is `position: absolute` with `z-index: 10`, which
 * creates a stacking context — so a modal rendered inside a route can never
 * paint above the BottomNavigation (`z-40`, a sibling of <main>), no matter how
 * high its own z-index is. <main> is also `overflow: hidden`. Portalling to
 * body escapes both.
 */
export const ModalPortal: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (typeof document === 'undefined') return null;
  return createPortal(children, document.body);
};

export default ModalPortal;

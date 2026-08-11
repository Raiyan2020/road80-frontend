import { common } from './common';
import { validation } from './validation';
import { nav } from './nav';
import { auth } from './auth';
import { home } from './home';
import { explore } from './explore';
import { companies } from './companies';
import { postAd } from './postAd';
import { profile } from './profile';
import { listing } from './listing';
import { notifications } from './notifications';
import { quickStart } from './quickStart';
import { pages } from './pages';
import { payment } from './payment';
import { hotels } from './hotels';
import { categories } from './categories';

import type { ar } from '../ar';

/** Typed against the Arabic dictionary so a missing English key is a build error. */
export const en: typeof ar = {
  common,
  validation,
  nav,
  auth,
  home,
  explore,
  companies,
  postAd,
  profile,
  listing,
  notifications,
  quickStart,
  pages,
  payment,
  hotels,
  categories,
};

import type { QueryClient } from '@tanstack/react-query';
import { homeDataQueryOptions } from '../hooks/useHomeData';
import { homeListingsQueryOptions } from '../hooks/useHomeListings';
import { categoriesQueryOptions } from '../hooks/useCategories';
import { countriesQueryOptions } from '@/shared/hooks/useCountries';

/**
 * Banner artwork is the heaviest thing on the home screen and the last to
 * arrive: the URLs only exist once /home has answered. Warming a handful during
 * the splash is worth it; warming all of them competes with the API calls for
 * connections on a slow mobile link.
 */
const MAX_PRELOADED_BANNERS = 4;

function preloadImages(urls: Array<string | null | undefined>): void {
  urls
    .filter((url): url is string => Boolean(url))
    .slice(0, MAX_PRELOADED_BANNERS)
    .forEach((url) => {
      // Decoded into the browser's image cache; the <img> that renders later
      // hits it instead of the network. No DOM node, nothing to clean up.
      const img = new Image();
      img.src = url;
    });
}

/**
 * Warm every query the home screen mounts with, while the splash is still up.
 *
 * The route tree is not mounted during the splash, so without this the first
 * request only leaves the device *after* the splash unmounts — the user watches
 * a 3s animation, then a full set of spinners. Prefetching into the same cache
 * entries the hooks read means home paints with data already in hand.
 *
 * Failures are deliberately swallowed: this is an optimisation, and every one
 * of these queries refetches normally when the component mounts. A prefetch
 * that rejected here would be an unhandled rejection for no benefit.
 */
export async function prefetchHomeScreen(
  queryClient: QueryClient,
  lang: string
): Promise<void> {
  const homeData = queryClient
    .fetchQuery(homeDataQueryOptions(lang))
    .then((data) => {
      preloadImages([
        ...(data?.header ?? []).map((h) => h.image),
        ...(data?.footer ?? []).map((f) => f.image),
      ]);
    })
    .catch(() => {});

  await Promise.all([
    homeData,
    queryClient.prefetchQuery(homeListingsQueryOptions(lang)),
    queryClient.prefetchQuery(categoriesQueryOptions(lang)),
    queryClient.prefetchQuery(countriesQueryOptions(lang)),
  ]);
}

export const home = {
  // Country switcher (top of the home screen)
  country: {
    label: 'Country',
    fallbackName: 'Kuwait',
  },

  // Theme toggle button
  toggleTheme: 'Toggle theme',

  // Interactive search card
  search: {
    label: 'What are you looking for?',
    placeholder: "Tap to tell us what you're looking for",
  },

  // Quick actions row (fallback labels when the API returns nothing)
  quickActions: {
    rent: 'For rent',
    sale: 'For sale',
    hotels: 'Hotels',

    // Card copy. `generic` covers contract types we have no artwork for —
    // {name} is the category value as the API localized it.
    subtitle: {
      rent: 'Find the right property to rent, with plenty of options',
      sale: 'Browse thousands of properties for sale and find your next investment',
      hotels: 'Book the best hotels at the best prices worldwide',
      generic: 'Browse everything listed under {name}',
    },
    cta: {
      rent: 'Explore rentals',
      sale: 'Explore listings',
      hotels: 'Explore hotels',
      generic: 'Explore {name}',
    },
  },

  // Suggested listings section
  listings: {
    title: 'Latest ads that match what you need',
    empty: 'No suggestions match your selection yet — start exploring',
    startExploring: 'Start exploring',
  },

  // Promotional banners
  banner: {
    headerAlt: 'Promotional banner',
    footerAlt: 'Footer promotional banner',
  },
};

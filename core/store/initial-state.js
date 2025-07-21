export const initialState = {
    color: 'red', // flat key
    user: {
      id: null,
      surname: null
    },
    settings: {
      theme: 'light',
      language: 'en'
    },
    regionsData: null,
    selectedRegion: null,
    selectedCity: null,
    appReady: false
  };
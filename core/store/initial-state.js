export const initialState = {
    color: "red", // flat key
    user: {
        id: null,
        surname: null,
    },
    settings: {
        theme: "light",
        language: "en",
        pollingEnabled: false,
    },
    regionsData: null,
    selectedRegion: null,
    selectedCity: null,
    segments: null,
    appReady: false,
};

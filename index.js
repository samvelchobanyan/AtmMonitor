console.log('index.js')
import { api } from './core/api-client.js';
import { store } from './core/store/store.js';

async function initializeApp() {
  try {
    // Fetch whatever initial data you need, for example, user info or settings
    const response = await api.get('/dashboard/cities-with-districts');
    store.setState({
      regionsData: response,
      appReady: true
    })

    // Populate the store with the response
    // store.setState({
    //   user: {
    //     id: userSettings.data.id,
    //     surname: userSettings.data.name
    //   },
    //   settings: {
    //     theme: userSettings.data.theme,
    //     language: userSettings.data.language
    //   }
    // });

    console.log('✅ Initial app data loaded into the store.');

  } catch (error) {
    console.error('❌ Failed to load initial application data:', error);
    // You could dispatch to the store that an error occurred,
    // and show a global error message to the user.
  }
}

// Run the initialization function when the script loads
initializeApp();
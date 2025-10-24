console.log("index.js");
import { api } from "./core/api-client.js";
import { store } from "./core/store/store.js";
import { startRouter } from "./core/router.js";

async function initializeApp() {
    try {
        // Fetch initial data 
        const responseLocations = await api.get("/dashboard/cities-with-districts");
        const responseSegments = await api.get("/atm/segments");

        store.setState({
            regionsData: responseLocations,
            segments: responseSegments.data,
            appReady: true,
        });

        console.log("✅ Initial app data loaded into store.");

        startRouter();
    } catch (error) {
        console.error("❌ Failed to load initial application data:", error);
        // You could dispatch to the store that an error occurred,
        // and show a global error message to the user.
    }
}

// Run the initialization function when the script loads
initializeApp();

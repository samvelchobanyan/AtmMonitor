import { api } from './api-client.js';
import { store } from './store/store.js';

class PollingService {
  constructor() {
    this.pollers = new Map(); // pollerId -> { endpoint, callbacks, intervalId, intervalMs, isFetching }
    this.isTabVisible = true;

    try {
      this.pollingEnabled = store.getState().settings.pollingEnabled;
    } catch (error) {
      console.error("PollingService: Error getting polling enables from store:", error);
      this.pollingEnabled = true;
    }

    this.setupVisibilityListener();
  }

  register(pollerId, endpoint, intervalMs = 2000) {
    if (this.pollers.has(pollerId)) {
      console.warn(`[PollingService] Poller "${pollerId}" already exists`);
      return;
    }

    this.pollers.set(pollerId, {
      endpoint,
      intervalMs,
      callbacks: new Set(),
      intervalId: null,
      isFetching: false
    });

    console.log(`[PollingService] Registered poller "${pollerId}" (${intervalMs}ms)`);
  }

  subscribe(pollerId, callback) {
    const poller = this.pollers.get(pollerId);
    if (!poller) {
      console.warn(`[PollingService] Cannot subscribe to unknown poller "${pollerId}"`);
      return () => {};
    }

    poller.callbacks.add(callback);
    console.log(`[PollingService] Subscribed to "${pollerId}" (${poller.callbacks.size} subscribers)`);

    // Start polling if first subscriber
    if (poller.callbacks.size === 1) {
      this.startPoller(pollerId);
    }

    // Return unsubscribe function
    return () => {
      poller.callbacks.delete(callback);
      console.log(`[PollingService] Unsubscribed from "${pollerId}" (${poller.callbacks.size} subscribers)`);
      
      // Stop polling if no more subscribers
      if (poller.callbacks.size === 0) {
        this.stopPoller(pollerId);
      }
    };
  }

  async startPoller(pollerId) {
    if (!this.pollingEnabled) return;

    const poller = this.pollers.get(pollerId);
    if (!poller || poller.intervalId) return;

    console.log(`[PollingService] Starting poller "${pollerId}"`);

    const poll = async () => {
      if (!this.isTabVisible || poller.isFetching || !this.pollingEnabled) return;
      
      poller.isFetching = true;
      try {
        const data = await api.get(poller.endpoint);
        // Call all subscribers with the data
        poller.callbacks.forEach(callback => {
          try {
            callback(data, null);
          } catch (error) {
            console.error(`[PollingService] Error in callback for "${pollerId}":`, error);
          }
        });
      } catch (error) {
        console.error(`[PollingService] Polling error for "${pollerId}":`, error);
        // Call all subscribers with the error
        poller.callbacks.forEach(callback => {
          try {
            callback(null, error);
          } catch (callbackError) {
            console.error(`[PollingService] Error in error callback for "${pollerId}":`, callbackError);
          }
        });
      } finally {
        poller.isFetching = false;
      }
    };

    // Initial call
    await poll();
    
    // Set up interval
    poller.intervalId = setInterval(poll, poller.intervalMs);
  }

  stopPoller(pollerId) {
    const poller = this.pollers.get(pollerId);
    if (poller && poller.intervalId) {
      console.log(`[PollingService] Stopping poller "${pollerId}"`);
      clearInterval(poller.intervalId);
      poller.intervalId = null;
    }
  }

  setupVisibilityListener() {
    document.addEventListener('visibilitychange', () => {
      this.isTabVisible = !document.hidden;
      // console.log(`[PollingService] Tab visibility changed: ${this.isTabVisible ? 'visible' : 'hidden'}`);
      
      // Resume/pause all active pollers
      this.pollers.forEach((poller, pollerId) => {
        if (poller.callbacks.size > 0) {
          if (this.isTabVisible && this.pollingEnabled) {
            this.startPoller(pollerId);
          } else {
            this.stopPoller(pollerId);
          }
        }
      });
    });
  }

  // Debug helper
  getStatus() {
    const status = {};
    this.pollers.forEach((poller, pollerId) => {
      status[pollerId] = {
        subscribers: poller.callbacks.size,
        isActive: !!poller.intervalId,
        isFetching: poller.isFetching,
        intervalMs: poller.intervalMs
      };
    });
    return status;
  }
}

export const pollingService = new PollingService();

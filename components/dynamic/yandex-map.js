import { DynamicElement } from "../../core/dynamic-element.js";

class YandexMap extends DynamicElement {
  constructor() {
    super();
    
    this.state = {
      error: null
    };
    
    // Store map and markers directly on the instance, not in state
    this.map = null;
    this.markers = [];
  }

  static get observedAttributes() {
    return ["atms", "center-lat", "center-lng", "zoom"];
  }

  onConnected() {
    // Yandex Maps is loaded globally, no need to load script here
    
    // Add resize listener for responsive behavior
    this.handleResize = this.handleResize.bind(this);
    window.addEventListener('resize', this.handleResize);
  }

  onDisconnected() {
    if (this.map) {
      this.map.destroy();
      this.map = null;
    }
    
    // Remove resize listener
    if (this.handleResize) {
      window.removeEventListener('resize', this.handleResize);
    }
  }

  handleResize() {
    // Trigger map resize to adapt to new container dimensions
    if (this.map) {
      this.map.container.fitToViewport();
    }
  }

  onAfterRender() {
    // DOM is ready, create the map if Yandex Maps is available
    if (window.ymaps && !this.map) {
      this.createSimpleMap();
    } else if (!window.ymaps) {
      this.setState({ error: "Yandex Maps not loaded" });
    }
  }

  onAttributeChange(name, oldValue, newValue) {
    if (name === "atms" && oldValue !== newValue) {
      try {
        const atms = JSON.parse(newValue || "[]");
        if (this.map && atms.length > 0) {
          this.addAtmMarkers(atms);
        }
      } catch (e) {
        console.error("Failed to parse ATM data:", e);
      }
    }
  }

  addAtmMarkers(atms) {
    if (!this.map) return;

    // Clear existing markers if any
    if (this.markers.length > 0) {
      this.markers.forEach(marker => {
        this.map.geoObjects.remove(marker);
      });
    }

    this.markers = [];

    atms.forEach(atm => {
      if (atm.latitude && atm.longitude) {
        try {
          // Create marker
          const marker = new window.ymaps.Placemark(
            [atm.latitude, atm.longitude],
            {
              balloonContentHeader: `ATM #${atm.name}`,
              balloonContentBody: `
                <div class="balloon__body">
                  <div class="balloon__item"><div>ATM ID:</div> <div>${atm.id}</div></div>
                  <div class="balloon__item"><div>City:</div> <div>${atm.city}</div></div>
                  <div class="balloon__item"><div>District:</div> <div>${atm.district}</div></div>
                  <div class="balloon__item"><div>Address:</div> <div>${atm.address}</div></div>
                  <div class="balloon__item"><div>Status:</div> <div>${atm.connection_status_id === 1 ? 'Working' : 'Not Working'}</div></div>
                </div>
              `,
              hintContent: `ATM #${atm.name}`
            },
            {
              preset: 'islands#blueDotIcon',
              iconColor: atm.connection_status_id === 1 ? '#28a745' : '#dc3545'
            }
          );

          // Change marker icon to a custom image
          marker.options.set('iconLayout', 'default#image');
          marker.options.set('iconImageHref', 'assets/img/pin.svg');
          marker.options.set('iconImageSize', [32, 32]); 

          // Store ATM data with the marker for navigation
          marker.atmData = atm;

          // Add marker to map
          this.map.geoObjects.add(marker);
          this.markers.push(marker);
        } catch (error) {
          console.error(`Error creating marker for ATM ${atm.name}:`, error);
        }
      }
    });

    // Fit map to show all markers
    if (this.markers.length > 0) {
      try {
        this.map.setBounds(this.map.geoObjects.getBounds(), {
          checkZoomRange: true
        });
      } catch (error) {
        console.error('Error updating map bounds:', error);
      }
    }
  }

  navigateToMarker(atmId, latitude, longitude) {
    if (!this.map) return;

    try {
      // Find the marker by ATM ID
      const marker = this.markers.find(m => m.atmData && m.atmData.id === atmId);
      
      if (marker) {
        // Navigate to the marker location
        this.map.setCenter([latitude, longitude], 15);
        
        // Highlight the marker temporarily
        this.highlightMarker(marker);
        
        // Calculate position above the marker for balloon
        // Offset by a small amount to ensure marker visibility
        const balloonLat = latitude + 0.001; // Small offset north
        
        // Open the balloon above the marker to show ATM details
        this.map.balloon.open([balloonLat, longitude], {
             balloonContentHeader: `ATM #${atm.name}`,
              balloonContentBody: `
                <div class="balloon__body">
                  <div class="balloon__item"><div>ATM ID:</div> <div>${atm.id}</div></div>
                  <div class="balloon__item"><div>City:</div> <div>${atm.city}</div></div>
                  <div class="balloon__item"><div>District:</div> <div>${atm.district}</div></div>
                  <div class="balloon__item"><div>Address:</div> <div>${atm.address}</div></div>
                  <div class="balloon__item"><div>Status:</div> <div>${atm.connection_status_id === 1 ? 'Working' : 'Not Working'}</div></div>
                </div>
          `,
          // Ensure balloon opens above the marker
          autoPan: true,
          autoPanDuration: 300,
          autoPanMargin: 50
        });
      }
    } catch (error) {
      console.error('Error navigating to marker:', error);
    }
  }

  highlightMarker(marker) {
    // Store original icon
    const originalPreset = marker.options.get('preset');
    const originalColor = marker.options.get('iconColor');
    
    // Change to highlighted state
    marker.options.set('preset', 'islands#redDotIcon');
    marker.options.set('iconColor', '#ff6b6b');
    
    // Restore original state after 3 seconds
    setTimeout(() => {
      marker.options.set('preset', originalPreset);
      marker.options.set('iconColor', originalColor);
    }, 3000);
  }

  createSimpleMap() {
    const centerLat = parseFloat(this.getAttribute("center-lat")) || 40.1872;
    const centerLng = parseFloat(this.getAttribute("center-lng")) || 44.5152;
    const zoom = parseInt(this.getAttribute("zoom")) || 10;

    const mapContainer = this.$("#simple-map");
    
    if (!mapContainer) {
      this.setState({ error: "Map container not found" });
      return;
    }

    try {
      // Create simple map instance
      this.map = new window.ymaps.Map(mapContainer, {
        center: [centerLat, centerLng],
        zoom: zoom,
        controls: ['zoomControl']
      });
      
      // Check if we already have ATM data to display
      const atmsAttr = this.getAttribute("atms");
      if (atmsAttr) {
        try {
          const atms = JSON.parse(atmsAttr);
          if (atms.length > 0) {
            this.addAtmMarkers(atms);
          }
        } catch (e) {
          console.error("Failed to parse existing ATM data:", e);
        }
      }
      
    } catch (error) {
      console.error('Error creating map:', error);
      this.setState({ 
        error: "Error creating map: " + error.message 
      });
    }
  }

  template() {
    const { error } = this.state;

    if (error) {
      return `
        <div style="padding: 20px; text-align: center; color: red;">
          <div>⚠️ Error: ${error}</div>
        </div>
      `;
    }

    return `
      <div style="width: 100%; height: 100%;">
        <div id="simple-map" style="width: 100%; height: 100%; position: relative;"></div>
      </div>
    `;
  }
}

customElements.define("yandex-map", YandexMap);

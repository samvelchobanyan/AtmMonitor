import { DynamicElement } from "../../core/dynamic-element.js";

class YandexAddress extends DynamicElement {
  constructor() {
    super();

    this.state = {
      error: null
    };

    this.map = null;
    this.pin = null;
    this.handleResize = null;
    
  }

  static get observedAttributes() {
    return ["center-lat", "center-lng", "zoom", "pin-lat", "pin-lng"];
  }

  onConnected() {
    this.handleResize = this.handleResize?.bind(this) || (() => {
      if (this.map) {
        this.map.container.fitToViewport();
      }
    });
    window.addEventListener("resize", this.handleResize);
  }

  onDisconnected() {
    if (this.map) {
      this.map.destroy();
      this.map = null;
    }
    if (this.handleResize) {
      window.removeEventListener("resize", this.handleResize);
    }
  }

  onAfterRender() {
    if (window.ymaps && !this.map) {
      try {
        window.ymaps.ready(() => {
          if (this.isDestroyed || this.map) return;
          this.createMapWithSearch();
        });
      } catch (e) {
        // Fallback if ready is not available for some reason
        this.createMapWithSearch();
      }
    } else if (!window.ymaps) {
      this.setState({ error: "Yandex Maps not loaded" });
    }
  }

  onAttributeChange(name, oldValue, newValue) {
    if (!this.map || oldValue === newValue) return;

    if (name === "center-lat" || name === "center-lng") {
      const lat = parseFloat(this.getAttribute("center-lat")) || 40.1872;
      const lng = parseFloat(this.getAttribute("center-lng")) || 44.5152;
      this.map.setCenter([lat, lng]);
    }

    if (name === "pin-lat" || name === "pin-lng") {
      const plat = parseFloat(this.getAttribute("pin-lat"));
      const plng = parseFloat(this.getAttribute("pin-lng"));
      if (!Number.isNaN(plat) && !Number.isNaN(plng)) {
        this.placeOrMovePin([plat, plng]);
      }
    }

    if (name === "zoom") {
      const zoom = parseInt(this.getAttribute("zoom")) || 14;
      this.map.setZoom(zoom);
    }
  }

  createMapWithSearch() {
    const centerLat = parseFloat(this.getAttribute("center-lat")) || 40.1872;
    const centerLng = parseFloat(this.getAttribute("center-lng")) || 44.5152;
    const zoom = parseInt(this.getAttribute("zoom")) || 14;

    const mapContainer = this.$("#address-map");
    if (!mapContainer) {
      this.setState({ error: "Map container not found" });
      return;
    }

    try {
      if (typeof window.ymaps?.Map !== "function") {
        this.setState({ error: "Yandex Maps API not ready" });
        return;
      }
      this.map = new window.ymaps.Map(mapContainer, {
        center: [centerLat, centerLng],
        zoom: zoom,
        controls: ["zoomControl", "searchControl"],
      });

      // Use native Yandex SearchControl with button; manage pin placement ourselves
      const searchControl = this.map.controls.get("searchControl");
      if (searchControl) {
        // Prevent default placemark to avoid duplicates; use larger UI
        searchControl.options.set("noPlacemark", true);
        searchControl.options.set("size", "large");

        // When user selects a result from the list
        searchControl.events.add("resultselect", (e) => {
          const index = e.get("index");
          searchControl.getResult(index).then((res) => {
            const coords = res.geometry.getCoordinates();
            this.placeOrMovePin(coords, true);
            this.dispatchCoordinate(coords);
            this.map.setCenter(coords, 16);
          });
        });

        // When user submits a query via the search button or Enter
        searchControl.events.add("submit", () => {
          const query = searchControl.getRequestString();
          if (!query) return;
          window.ymaps.geocode(query).then((geocode) => {
            const obj = geocode.geoObjects.get(0);
            if (obj) {
              const coords = obj.geometry.getCoordinates();
              this.placeOrMovePin(coords, true);
              this.dispatchCoordinate(coords);
              this.map.setCenter(coords, 16);
            }
          });
        });
      }

      // Manual placement by clicking the map
      this.map.events.add("click", (e) => {
        const coords = e.get("coords");
        this.placeOrMovePin(coords, true);
        this.dispatchCoordinate(coords);
      });

      // Initialize pin from attributes if provided, otherwise show at center
      const plat = parseFloat(this.getAttribute("pin-lat"));
      const plng = parseFloat(this.getAttribute("pin-lng"));
      if (!Number.isNaN(plat) && !Number.isNaN(plng)) {
        this.placeOrMovePin([plat, plng], false);
      } else {
        this.placeOrMovePin([centerLat, centerLng], false);
      }
    } catch (error) {
      console.error("Error creating map:", error);
      this.setState({ error: "Error creating map: " + error.message });
    }
  }

  placeOrMovePin(coords, focus = false) {
    if (!this.map) return;

    if (!this.pin) {
      this.pin = new window.ymaps.Placemark(
        coords,
        {},
        {
          draggable: true,
          // Use a highly visible built-in preset
          preset: "islands#redIcon"
        }
      );

      this.pin.events.add("dragend", () => {
        const c = this.pin.geometry.getCoordinates();
        this.dispatchCoordinate(c);
      });

      this.map.geoObjects.add(this.pin);
    } else {
      this.pin.geometry.setCoordinates(coords);
    }

    if (focus) {
      this.map.setCenter(coords);
    }
  }

  dispatchCoordinate(coords) {
    const [lat, lng] = coords;
    this.dispatch("newCoordinate", { lat, lng });
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
        <div id="address-map" style="width: 100%; height: 100%; min-height: 300px;"></div>
      </div>
    `;
  }
}

customElements.define("yandex-address", YandexAddress);



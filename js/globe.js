class GlobeManager {
  constructor() {
    this.viewer = null;
    this.userLat = 0;
    this.userLon = 0;
    this.currentMode = CONFIG.MODES.ATLAS;
  }

  async init() {
    Cesium.Ion.defaultAccessToken = CONFIG.CESIUM_TOKEN;

    this.viewer = new Cesium.Viewer('cesiumContainer', {
      terrainProvider: await Cesium.CesiumTerrainProvider.fromIonAssetId(1),
      baseLayerPicker: false,
      geocoder: false,
      homeButton: false,
      sceneModePicker: false,
      navigationHelpButton: false,
      animation: false,
      timeline: false,
      fullscreenButton: false,
      infoBox: false,
      selectionIndicator: false,
      shadows: false,
      shouldAnimate: true,
      skyBox: new Cesium.SkyBox({
        sources: {
          positiveX: 'https://cesium.com/downloads/cesiumjs/releases/1.111/Build/Cesium/Assets/Textures/SkyBox/tycho2t3_80_px.jpg',
          negativeX: 'https://cesium.com/downloads/cesiumjs/releases/1.111/Build/Cesium/Assets/Textures/SkyBox/tycho2t3_80_mx.jpg',
          positiveY: 'https://cesium.com/downloads/cesiumjs/releases/1.111/Build/Cesium/Assets/Textures/SkyBox/tycho2t3_80_py.jpg',
          negativeY: 'https://cesium.com/downloads/cesiumjs/releases/1.111/Build/Cesium/Assets/Textures/SkyBox/tycho2t3_80_my.jpg',
          positiveZ: 'https://cesium.com/downloads/cesiumjs/releases/1.111/Build/Cesium/Assets/Textures/SkyBox/tycho2t3_80_pz.jpg',
          negativeZ: 'https://cesium.com/downloads/cesiumjs/releases/1.111/Build/Cesium/Assets/Textures/SkyBox/tycho2t3_80_mz.jpg'
        }
      })
    });

    this.viewer.scene.globe.enableLighting = true;
    this.viewer.scene.globe.atmosphereLightIntensity = 10.0;
    this.viewer.scene.globe.atmosphereMieCoefficient = 0.003;
    this.viewer.scene.globe.atmosphereRayleighCoefficient = 5.5e-6;
    this.viewer.scene.backgroundColor = Cesium.Color.BLACK;
    this.viewer.scene.skyAtmosphere.show = true;

    // Dark globe tint
    this.viewer.imageryLayers.get(0).brightness = 0.6;
    this.viewer.imageryLayers.get(0).contrast = 1.2;
    this.viewer.imageryLayers.get(0).saturation = 0.5;

    this.viewer.scene.globe.depthTestAgainstTerrain = false;

    // Start with global overview
    this.viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(0, 20, 25000000),
      orientation: { heading: 0, pitch: -Cesium.Math.PI_OVER_TWO, roll: 0 }
    });

    await this._geolocateAndFly();
    this._setupClickHandler();
  }

  async _geolocateAndFly() {
    return new Promise((resolve) => {
      if (!navigator.geolocation) { resolve(); return; }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          this.userLat = pos.coords.latitude;
          this.userLon = pos.coords.longitude;
          this.flyTo(this.userLon, this.userLat, 8000000, 3.0);
          resolve();
        },
        () => {
          // Default to Mumbai
          this.userLat = 19.0760;
          this.userLon = 72.8777;
          this.flyTo(72.8777, 19.0760, 8000000, 3.0);
          resolve();
        },
        { timeout: 5000 }
      );
    });
  }

  flyTo(lon, lat, height = 5000000, duration = 2.0) {
    this.viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(lon, lat, height),
      orientation: { heading: 0, pitch: -Cesium.Math.PI_OVER_TWO, roll: 0 },
      duration
    });
  }

  flyAlongRoute(startLon, startLat, endLon, endLat) {
    const midLon = (startLon + endLon) / 2;
    const midLat = (startLat + endLat) / 2;
    const dist = Cesium.Cartesian3.distance(
      Cesium.Cartesian3.fromDegrees(startLon, startLat),
      Cesium.Cartesian3.fromDegrees(endLon, endLat)
    );
    this.flyTo(midLon, midLat, Math.max(dist * 1.5, 3000000), 3.5);
  }

  _setupClickHandler() {
    const handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
    handler.setInputAction((click) => {
      const cartesian = this.viewer.camera.pickEllipsoid(click.position, this.viewer.scene.globe.ellipsoid);
      if (!cartesian) return;
      const carto = Cesium.Cartographic.fromCartesian(cartesian);
      const lon = Cesium.Math.toDegrees(carto.longitude);
      const lat = Cesium.Math.toDegrees(carto.latitude);
      window.dispatchEvent(new CustomEvent('globeClick', { detail: { lon, lat } }));
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  }

  setMode(mode) {
    this.currentMode = mode;
    switch (mode) {
      case CONFIG.MODES.STORM:
        this.viewer.imageryLayers.get(0).brightness = 0.3;
        this.viewer.imageryLayers.get(0).saturation = 0.1;
        break;
      case CONFIG.MODES.TRANSIT:
        this.viewer.imageryLayers.get(0).brightness = 0.5;
        this.viewer.imageryLayers.get(0).saturation = 0.3;
        break;
      default:
        this.viewer.imageryLayers.get(0).brightness = 0.6;
        this.viewer.imageryLayers.get(0).saturation = 0.5;
    }
  }

  get scene() { return this.viewer.scene; }
  get camera() { return this.viewer.camera; }
  get entities() { return this.viewer.entities; }
}

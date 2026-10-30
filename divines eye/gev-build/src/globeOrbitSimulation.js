import * as Cesium from 'cesium';
import { holdContinuousRender, releaseContinuousRender } from './renderGovernor.js';

/**
 * Tilted diagonal rotation axis (in normalized ECEF frame).
 * Combining X, Y, and Z components produces a continuous diagonal rotation
 * displaying both Northern/Southern hemispheres, oceans, and landmasses.
 */
export const DIAGONAL_ROTATION_AXIS = Cesium.Cartesian3.normalize(
  new Cesium.Cartesian3(0.55, 0.28, 0.78),
  new Cesium.Cartesian3()
);

/**
 * GlobeOrbitSimulation — smooth, free diagonal orbital rotation of the 3D globe.
 *
 * Requirements:
 * - Free diagonal rotation around the globe's center.
 * - Mouse drag cannot interrupt or stop the movement.
 * - Only clicking the simulation toggle button stops it.
 * - Keeps Cesium render loop active so all live data layers and labels continue working.
 */
export class GlobeOrbitSimulation {
  constructor(viewer, options = {}) {
    this.viewer = viewer;
    this.active = false;
    this.speed = Cesium.Math.toRadians(options.speedDegPerSec || 3.8);
    this._removeListener = null;
    this._savedInputState = null;
    this._onStateChange = options.onStateChange || null;
  }

  start() {
    if (this.active || !this.viewer) return;
    this.active = true;

    // 1. Lock mouse camera translation/rotation so mouse drags cannot interrupt or cancel rotation
    const controller = this.viewer.scene?.screenSpaceCameraController;
    if (controller) {
      this._savedInputState = {
        enableRotate: controller.enableRotate,
        enableTranslate: controller.enableTranslate,
        enableTilt: controller.enableTilt,
        enableLook: controller.enableLook,
      };
      controller.enableRotate = false;
      controller.enableTranslate = false;
      controller.enableTilt = false;
      controller.enableLook = false;
      // controller.enableZoom stays untouched so user can zoom in/out if desired
    }

    // 2. Ensure camera has clear orbital vantage if too close to ground
    const camera = this.viewer.camera;
    if (camera) {
      const carto = camera.positionCartographic;
      if (carto && carto.height < 3000000) {
        const currentPos = camera.positionWC || camera.position;
        const dir = Cesium.Cartesian3.normalize(currentPos, new Cesium.Cartesian3());
        const targetPos = Cesium.Cartesian3.multiplyByScalar(dir, 16000000, new Cesium.Cartesian3());
        camera.position = targetPos;
        camera.direction = Cesium.Cartesian3.negate(dir, new Cesium.Cartesian3());
        camera.up = Cesium.Cartesian3.UNIT_Z;
        camera.right = Cesium.Cartesian3.cross(camera.direction, camera.up, new Cesium.Cartesian3());
      }
    }

    // 3. Register continuous render hold so live layers and labels keep animating
    holdContinuousRender('globe-orbit-simulation');

    // 4. Per-frame diagonal rotation
    let lastTime = performance.now();
    if (this.viewer.scene?.preRender) {
      this._removeListener = this.viewer.scene.preRender.addEventListener(() => {
        if (!this.active) return;
        const now = performance.now();
        const dt = Math.min(0.1, Math.max(0.001, (now - lastTime) / 1000));
        lastTime = now;

        if (this.viewer.camera?.rotate) {
          this.viewer.camera.rotate(DIAGONAL_ROTATION_AXIS, this.speed * dt);
        }
      });
    }

    if (typeof this._onStateChange === 'function') {
      this._onStateChange(true);
    }
  }

  stop() {
    if (!this.active) return;
    this.active = false;

    // 1. Release continuous render hold
    releaseContinuousRender('globe-orbit-simulation');

    // 2. Remove preRender listener
    if (this._removeListener) {
      this._removeListener();
      this._removeListener = null;
    }

    // 3. Restore normal camera inputs
    const controller = this.viewer?.scene?.screenSpaceCameraController;
    if (controller && this._savedInputState) {
      controller.enableRotate = this._savedInputState.enableRotate;
      controller.enableTranslate = this._savedInputState.enableTranslate;
      controller.enableTilt = this._savedInputState.enableTilt;
      controller.enableLook = this._savedInputState.enableLook;
      this._savedInputState = null;
    }

    if (typeof this._onStateChange === 'function') {
      this._onStateChange(false);
    }
  }

  toggle() {
    if (this.active) {
      this.stop();
    } else {
      this.start();
    }
    return this.active;
  }
}

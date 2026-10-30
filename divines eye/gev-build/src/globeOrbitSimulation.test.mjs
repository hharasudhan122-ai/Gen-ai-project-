import test from 'node:test';
import assert from 'node:assert/strict';
import * as Cesium from 'cesium';
import { GlobeOrbitSimulation, DIAGONAL_ROTATION_AXIS } from './globeOrbitSimulation.js';

test('DIAGONAL_ROTATION_AXIS is normalized with non-zero XYZ components', () => {
  const mag = Cesium.Cartesian3.magnitude(DIAGONAL_ROTATION_AXIS);
  assert.ok(Math.abs(mag - 1.0) < 1e-6);
  assert.ok(DIAGONAL_ROTATION_AXIS.x > 0);
  assert.ok(DIAGONAL_ROTATION_AXIS.y > 0);
  assert.ok(DIAGONAL_ROTATION_AXIS.z > 0);
});

test('GlobeOrbitSimulation starts, locks mouse rotation, and rotates camera on tick', () => {
  let rotatedAxis = null;
  let rotatedAngle = null;

  const mockViewer = {
    camera: {
      position: new Cesium.Cartesian3(12000000, 0, 0),
      positionWC: new Cesium.Cartesian3(12000000, 0, 0),
      positionCartographic: { height: 10000000 },
      direction: new Cesium.Cartesian3(-1, 0, 0),
      up: new Cesium.Cartesian3(0, 0, 1),
      right: new Cesium.Cartesian3(0, 1, 0),
      rotate: (axis, angle) => {
        rotatedAxis = axis;
        rotatedAngle = angle;
      },
    },
    scene: {
      screenSpaceCameraController: {
        enableRotate: true,
        enableTranslate: true,
        enableTilt: true,
        enableLook: true,
      },
      preRender: {
        listeners: new Set(),
        addEventListener(callback) {
          this.listeners.add(callback);
          return () => this.listeners.delete(callback);
        },
      },
    },
  };

  let stateChanges = [];
  const sim = new GlobeOrbitSimulation(mockViewer, {
    onStateChange: (active) => stateChanges.push(active),
  });

  assert.equal(sim.active, false);
  sim.start();

  assert.equal(sim.active, true);
  assert.deepEqual(stateChanges, [true]);

  // Mouse rotation/translation should be locked
  assert.equal(mockViewer.scene.screenSpaceCameraController.enableRotate, false);
  assert.equal(mockViewer.scene.screenSpaceCameraController.enableTranslate, false);

  // Trigger preRender tick
  for (const listener of mockViewer.scene.preRender.listeners) {
    listener();
  }

  assert.ok(rotatedAxis !== null);
  assert.equal(rotatedAxis, DIAGONAL_ROTATION_AXIS);
  assert.ok(rotatedAngle > 0);

  // Stop simulation
  sim.stop();
  assert.equal(sim.active, false);
  assert.deepEqual(stateChanges, [true, false]);

  // Mouse controls restored
  assert.equal(mockViewer.scene.screenSpaceCameraController.enableRotate, true);
  assert.equal(mockViewer.scene.screenSpaceCameraController.enableTranslate, true);
});

test('GlobeOrbitSimulation toggle() switches between active and inactive', () => {
  const mockViewer = {
    camera: {
      position: new Cesium.Cartesian3(12000000, 0, 0),
      positionWC: new Cesium.Cartesian3(12000000, 0, 0),
      positionCartographic: { height: 10000000 },
      rotate: () => {},
    },
    scene: {
      screenSpaceCameraController: {
        enableRotate: true,
        enableTranslate: true,
        enableTilt: true,
        enableLook: true,
      },
      preRender: {
        addEventListener: () => () => {},
      },
    },
  };

  const sim = new GlobeOrbitSimulation(mockViewer);
  assert.equal(sim.active, false);

  assert.equal(sim.toggle(), true);
  assert.equal(sim.active, true);

  assert.equal(sim.toggle(), false);
  assert.equal(sim.active, false);
});

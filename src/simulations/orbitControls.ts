import * as THREE from 'three';

export interface OrbitControlsOptions {
  enableDamping?: boolean;
  dampingFactor?: number;
  minDistance?: number;
  maxDistance?: number;
  minPolarAngle?: number;
  maxPolarAngle?: number;
}

export interface OrbitControlSnapshot {
  position: [number, number, number];
  target: [number, number, number];
  up: [number, number, number];
  fov: number;
  zoom: number;
  radius: number;
  theta: number;
  phi: number;
}

export class SimpleOrbitControls {
  camera: THREE.PerspectiveCamera;
  domElement: HTMLElement;
  target: THREE.Vector3;

  // Spherical coordinates
  radius: number;
  theta: number; // azimuth
  phi: number; // elevation

  targetRadius: number;
  targetTheta: number;
  targetPhi: number;

  // Initial state snapshot for reliable idempotent reset
  initialPosition: THREE.Vector3;
  initialTarget: THREE.Vector3;
  initialUp: THREE.Vector3;
  initialFov: number;
  initialZoom: number;
  initialRadius: number;
  initialTheta: number;
  initialPhi: number;

  minDistance: number;
  maxDistance: number;
  minPolarAngle: number;
  maxPolarAngle: number;
  dampingFactor: number;

  enabled: boolean = true;
  isPointerDown: boolean = false;
  pointerStart: { x: number; y: number } = { x: 0, y: 0 };
  pointerType: 'rotate' | 'pan' = 'rotate';

  // Touch tracking for pinch zoom
  touchStartDist: number = 0;

  private onPointerDownBound: (e: PointerEvent) => void;
  private onPointerMoveBound: (e: PointerEvent) => void;
  private onPointerUpBound: (e: PointerEvent) => void;
  private onWheelBound: (e: WheelEvent) => void;
  private onTouchStartBound: (e: TouchEvent) => void;
  private onTouchMoveBound: (e: TouchEvent) => void;
  private onTouchEndBound: (e: TouchEvent) => void;

  constructor(camera: THREE.PerspectiveCamera, domElement: HTMLElement, options: OrbitControlsOptions = {}) {
    this.camera = camera;
    this.domElement = domElement;
    this.target = new THREE.Vector3(0, 0, 0);

    this.minDistance = options.minDistance ?? 1.5;
    this.maxDistance = options.maxDistance ?? 100;
    this.minPolarAngle = options.minPolarAngle ?? 0.05;
    this.maxPolarAngle = options.maxPolarAngle ?? Math.PI - 0.05;
    this.dampingFactor = options.dampingFactor ?? 0.15;

    const offset = new THREE.Vector3().subVectors(this.camera.position, this.target);
    this.radius = Math.max(offset.length(), 0.1);
    this.theta = Math.atan2(offset.x, offset.z);
    this.phi = Math.acos(Math.max(-1, Math.min(1, offset.y / this.radius)));

    this.targetRadius = this.radius;
    this.targetTheta = this.theta;
    this.targetPhi = this.phi;

    this.initialPosition = this.camera.position.clone();
    this.initialTarget = this.target.clone();
    this.initialUp = this.camera.up.clone();
    this.initialFov = this.camera.fov;
    this.initialZoom = this.camera.zoom;
    this.initialRadius = this.radius;
    this.initialTheta = this.theta;
    this.initialPhi = this.phi;

    this.onPointerDownBound = this.onPointerDown.bind(this);
    this.onPointerMoveBound = this.onPointerMove.bind(this);
    this.onPointerUpBound = this.onPointerUp.bind(this);
    this.onWheelBound = this.onWheel.bind(this);
    this.onTouchStartBound = this.onTouchStart.bind(this);
    this.onTouchMoveBound = this.onTouchMove.bind(this);
    this.onTouchEndBound = this.onTouchEnd.bind(this);

    if (this.domElement && typeof this.domElement.addEventListener === 'function') {
      this.domElement.addEventListener('pointerdown', this.onPointerDownBound);
      this.domElement.addEventListener('wheel', this.onWheelBound, { passive: false });
      this.domElement.addEventListener('touchstart', this.onTouchStartBound, { passive: true });
      this.domElement.addEventListener('touchmove', this.onTouchMoveBound, { passive: false });
      this.domElement.addEventListener('touchend', this.onTouchEndBound, { passive: true });
    }
    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      window.addEventListener('pointermove', this.onPointerMoveBound);
      window.addEventListener('pointerup', this.onPointerUpBound);
    }
  }

  /**
   * Synchronizes spherical coordinates (radius, theta, phi) from a given or current camera position and target.
   */
  syncFromCamera(cameraPos?: THREE.Vector3, targetPos?: THREE.Vector3) {
    if (cameraPos) {
      this.camera.position.copy(cameraPos);
    }
    if (targetPos) {
      this.target.copy(targetPos);
    }
    const offset = new THREE.Vector3().subVectors(this.camera.position, this.target);
    const r = Math.max(offset.length(), 0.1);
    const t = Math.atan2(offset.x, offset.z);
    const p = Math.max(
      this.minPolarAngle,
      Math.min(this.maxPolarAngle, Math.acos(Math.max(-1, Math.min(1, offset.y / r))))
    );

    this.radius = r;
    this.theta = t;
    this.phi = p;
    this.targetRadius = r;
    this.targetTheta = t;
    this.targetPhi = p;
  }

  /**
   * Captures the current camera position, target, up vector, FOV, zoom, and spherical coordinates
   * as the authoritative initial state snapshot for this model.
   */
  saveInitialState(cameraPos?: THREE.Vector3, targetPos?: THREE.Vector3) {
    this.syncFromCamera(cameraPos, targetPos);
    this.initialPosition.copy(this.camera.position);
    this.initialTarget.copy(this.target);
    this.initialUp.copy(this.camera.up);
    this.initialFov = this.camera.fov;
    this.initialZoom = this.camera.zoom;
    this.initialRadius = this.radius;
    this.initialTheta = this.theta;
    this.initialPhi = this.phi;
    this.camera.lookAt(this.target);
  }

  /**
   * Returns a plain serializable snapshot of the current camera and orbit control state.
   */
  getStateSnapshot(): OrbitControlSnapshot {
    return {
      position: [this.camera.position.x, this.camera.position.y, this.camera.position.z],
      target: [this.target.x, this.target.y, this.target.z],
      up: [this.camera.up.x, this.camera.up.y, this.camera.up.z],
      fov: this.camera.fov,
      zoom: this.camera.zoom,
      radius: this.radius,
      theta: this.theta,
      phi: this.phi,
    };
  }

  private onPointerDown(e: PointerEvent) {
    if (!this.enabled) return;
    if (e.button === 2 || e.shiftKey) {
      this.pointerType = 'pan';
    } else {
      this.pointerType = 'rotate';
    }
    this.isPointerDown = true;
    this.pointerStart = { x: e.clientX, y: e.clientY };
  }

  private onPointerMove(e: PointerEvent) {
    if (!this.enabled || !this.isPointerDown) return;

    const dx = e.clientX - this.pointerStart.x;
    const dy = e.clientY - this.pointerStart.y;
    this.pointerStart = { x: e.clientX, y: e.clientY };

    if (this.pointerType === 'rotate') {
      const speed = 0.005;
      this.targetTheta -= dx * speed;
      this.targetPhi = Math.max(this.minPolarAngle, Math.min(this.maxPolarAngle, this.targetPhi - dy * speed));
    } else if (this.pointerType === 'pan') {
      const panSpeed = this.radius * 0.001;
      const forward = new THREE.Vector3().subVectors(this.target, this.camera.position).normalize();
      const right = new THREE.Vector3().crossVectors(forward, this.camera.up).normalize();
      const up = new THREE.Vector3().crossVectors(right, forward).normalize();

      this.target.addScaledVector(right, -dx * panSpeed);
      this.target.addScaledVector(up, dy * panSpeed);
    }
  }

  private onPointerUp() {
    this.isPointerDown = false;
  }

  private onWheel(e: WheelEvent) {
    if (!this.enabled) return;
    e.preventDefault();
    const factor = e.deltaY < 0 ? 0.9 : 1.1;
    this.targetRadius = Math.max(this.minDistance, Math.min(this.maxDistance, this.targetRadius * factor));
  }

  private onTouchStart(e: TouchEvent) {
    if (!this.enabled) return;
    if (e.touches.length === 1) {
      this.isPointerDown = true;
      this.pointerType = 'rotate';
      this.pointerStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2) {
      this.isPointerDown = false;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      this.touchStartDist = Math.hypot(dx, dy);
    }
  }

  private onTouchMove(e: TouchEvent) {
    if (!this.enabled) return;
    if (e.touches.length === 1 && this.isPointerDown) {
      const dx = e.touches[0].clientX - this.pointerStart.x;
      const dy = e.touches[0].clientY - this.pointerStart.y;
      this.pointerStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      const speed = 0.005;
      this.targetTheta -= dx * speed;
      this.targetPhi = Math.max(this.minPolarAngle, Math.min(this.maxPolarAngle, this.targetPhi - dy * speed));
    } else if (e.touches.length === 2) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      if (this.touchStartDist > 0) {
        const factor = this.touchStartDist / Math.max(dist, 1);
        this.targetRadius = Math.max(this.minDistance, Math.min(this.maxDistance, this.targetRadius * factor));
      }
      this.touchStartDist = dist;
    }
  }

  private onTouchEnd(e: TouchEvent) {
    if (e.touches.length === 0) {
      this.isPointerDown = false;
    }
  }

  /**
   * Programmatically rotates the camera orbit target angles by deltaTheta and deltaPhi (radians).
   */
  rotateBy(deltaTheta: number, deltaPhi: number) {
    this.targetTheta += deltaTheta;
    this.targetPhi = Math.max(
      this.minPolarAngle,
      Math.min(this.maxPolarAngle, this.targetPhi + deltaPhi)
    );
  }

  /**
   * Programmatically zooms the orbit radius by a multiplicative factor.
   */
  zoomBy(factor: number) {
    this.targetRadius = Math.max(
      this.minDistance,
      Math.min(this.maxDistance, this.targetRadius * factor)
    );
  }

  /**
   * Programmatically pans the orbit target by screen-space deltas (dx, dy).
   */
  panBy(dx: number, dy: number) {
    const panSpeed = this.radius * 0.001;
    const forward = new THREE.Vector3().subVectors(this.target, this.camera.position).normalize();
    const right = new THREE.Vector3().crossVectors(forward, this.camera.up).normalize();
    const up = new THREE.Vector3().crossVectors(right, forward).normalize();

    this.target.addScaledVector(right, -dx * panSpeed);
    this.target.addScaledVector(up, dy * panSpeed);
  }

  /**
   * Synchronously restores camera position, target, up vector, FOV, zoom, projection matrix,
   * and spherical orbit coordinates to their initial snapshot (or explicit overrides).
   */
  reset(radius?: number, theta?: number, phi?: number, target?: THREE.Vector3) {
    this.isPointerDown = false;
    if (target) {
      this.target.copy(target);
    } else {
      this.target.copy(this.initialTarget);
    }

    const r = radius !== undefined ? radius : this.initialRadius;
    const t = theta !== undefined ? theta : this.initialTheta;
    const p = phi !== undefined ? phi : this.initialPhi;

    this.radius = r;
    this.theta = t;
    this.phi = p;
    this.targetRadius = r;
    this.targetTheta = t;
    this.targetPhi = p;

    this.camera.up.copy(this.initialUp);
    this.camera.fov = this.initialFov;
    this.camera.zoom = this.initialZoom;
    this.camera.updateProjectionMatrix();

    if (radius === undefined && theta === undefined && phi === undefined && !target) {
      this.camera.position.copy(this.initialPosition);
      this.camera.lookAt(this.target);
    } else {
      this.update();
    }
  }

  update() {
    this.radius += (this.targetRadius - this.radius) * this.dampingFactor;
    this.theta += (this.targetTheta - this.theta) * this.dampingFactor;
    this.phi += (this.targetPhi - this.phi) * this.dampingFactor;

    const x = this.target.x + this.radius * Math.sin(this.phi) * Math.sin(this.theta);
    const y = this.target.y + this.radius * Math.cos(this.phi);
    const z = this.target.z + this.radius * Math.sin(this.phi) * Math.cos(this.theta);

    this.camera.position.set(x, y, z);
    this.camera.lookAt(this.target);
  }

  dispose() {
    if (this.domElement && typeof this.domElement.removeEventListener === 'function') {
      this.domElement.removeEventListener('pointerdown', this.onPointerDownBound);
      this.domElement.removeEventListener('wheel', this.onWheelBound);
      this.domElement.removeEventListener('touchstart', this.onTouchStartBound);
      this.domElement.removeEventListener('touchmove', this.onTouchMoveBound);
      this.domElement.removeEventListener('touchend', this.onTouchEndBound);
    }
    if (typeof window !== 'undefined' && typeof window.removeEventListener === 'function') {
      window.removeEventListener('pointermove', this.onPointerMoveBound);
      window.removeEventListener('pointerup', this.onPointerUpBound);
    }
  }
}

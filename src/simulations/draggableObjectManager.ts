import * as THREE from 'three';
import { SimpleOrbitControls } from './orbitControls';

export interface DraggableItem {
  id: string;
  mesh: THREE.Object3D;
  originalPosition: THREE.Vector3;
  currentPosition: THREE.Vector3;
  userData?: any;
}

export interface DragManagerOptions {
  dragPlaneNormal?: THREE.Vector3; // e.g. (0, 1, 0) for horizontal plane
  dragPlaneConstant?: number;
  highlightEmissive?: number;
  onHover?: (item: DraggableItem | null) => void;
  onDragStart?: (item: DraggableItem) => void;
  onDragMove?: (item: DraggableItem, intersectionPoint: THREE.Vector3) => void;
  onDragEnd?: (item: DraggableItem, finalPoint: THREE.Vector3) => void;
}

export class DraggableObjectManager {
  camera: THREE.Camera;
  domElement: HTMLElement;
  orbitControls: SimpleOrbitControls | null;
  items: Map<string, DraggableItem> = new Map();
  raycaster: THREE.Raycaster = new THREE.Raycaster();
  mouse: THREE.Vector2 = new THREE.Vector2();
  
  dragPlane: THREE.Plane;
  planeIntersectPoint: THREE.Vector3 = new THREE.Vector3();
  dragOffset: THREE.Vector3 = new THREE.Vector3();

  activeItem: DraggableItem | null = null;
  hoveredItem: DraggableItem | null = null;
  isDragging: boolean = false;

  options: DragManagerOptions;

  private onPointerDownBound: (e: PointerEvent) => void;
  private onPointerMoveBound: (e: PointerEvent) => void;
  private onPointerUpBound: (e: PointerEvent) => void;

  constructor(
    camera: THREE.Camera,
    domElement: HTMLElement,
    orbitControls: SimpleOrbitControls | null,
    options: DragManagerOptions = {}
  ) {
    this.camera = camera;
    this.domElement = domElement;
    this.orbitControls = orbitControls;
    this.options = options;

    const normal = options.dragPlaneNormal ?? new THREE.Vector3(0, 1, 0);
    const constant = options.dragPlaneConstant ?? 0;
    this.dragPlane = new THREE.Plane(normal, constant);

    this.onPointerDownBound = this.onPointerDown.bind(this);
    this.onPointerMoveBound = this.onPointerMove.bind(this);
    this.onPointerUpBound = this.onPointerUp.bind(this);

    this.domElement.addEventListener('pointerdown', this.onPointerDownBound);
    window.addEventListener('pointermove', this.onPointerMoveBound);
    window.addEventListener('pointerup', this.onPointerUpBound);
  }

  registerItem(id: string, mesh: THREE.Object3D, userData?: any): DraggableItem {
    const item: DraggableItem = {
      id,
      mesh,
      originalPosition: mesh.position.clone(),
      currentPosition: mesh.position.clone(),
      userData,
    };
    this.items.set(id, item);
    return item;
  }

  unregisterItem(id: string) {
    this.items.delete(id);
  }

  clear() {
    this.items.clear();
    this.activeItem = null;
    this.hoveredItem = null;
    this.isDragging = false;
  }

  private updatePointerCoords(e: PointerEvent) {
    const rect = this.domElement.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  }

  private getIntersectedItem(): DraggableItem | null {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const meshList: THREE.Object3D[] = [];
    this.items.forEach((item) => meshList.push(item.mesh));

    const intersects = this.raycaster.intersectObjects(meshList, true);
    if (intersects.length > 0) {
      let topObj: THREE.Object3D | null = intersects[0].object;
      while (topObj) {
        for (const item of this.items.values()) {
          if (item.mesh === topObj) return item;
        }
        topObj = topObj.parent;
      }
    }
    return null;
  }

  private onPointerDown(e: PointerEvent) {
    if (e.button !== 0) return; // Left mouse click / touch only
    this.updatePointerCoords(e);

    const hit = this.getIntersectedItem();
    if (hit) {
      this.activeItem = hit;
      this.isDragging = true;

      // Suspend camera orbit while dragging object
      if (this.orbitControls) {
        this.orbitControls.enabled = false;
        this.orbitControls.isPointerDown = false;
      }

      // Update dragPlane to pass through the world position of the mesh
      const worldPos = hit.mesh.getWorldPosition(new THREE.Vector3());
      const planeNormal = this.options.dragPlaneNormal ?? new THREE.Vector3(0, 1, 0);
      this.dragPlane.setFromNormalAndCoplanarPoint(planeNormal, worldPos);

      // Calculate intersection on drag plane to find offset in world space
      this.raycaster.setFromCamera(this.mouse, this.camera);
      if (this.raycaster.ray.intersectPlane(this.dragPlane, this.planeIntersectPoint)) {
        this.dragOffset.subVectors(worldPos, this.planeIntersectPoint);
      }

      this.options.onDragStart?.(hit);
    }
  }

  private onPointerMove(e: PointerEvent) {
    this.updatePointerCoords(e);

    if (this.isDragging && this.activeItem) {
      this.raycaster.setFromCamera(this.mouse, this.camera);
      if (this.raycaster.ray.intersectPlane(this.dragPlane, this.planeIntersectPoint)) {
        const targetWorldPos = new THREE.Vector3().addVectors(this.planeIntersectPoint, this.dragOffset);
        if (this.activeItem.mesh.parent) {
          const localTarget = targetWorldPos.clone();
          this.activeItem.mesh.parent.worldToLocal(localTarget);
          this.activeItem.mesh.position.copy(localTarget);
          this.activeItem.currentPosition.copy(localTarget);
          this.options.onDragMove?.(this.activeItem, targetWorldPos);
        } else {
          this.activeItem.mesh.position.copy(targetWorldPos);
          this.activeItem.currentPosition.copy(targetWorldPos);
          this.options.onDragMove?.(this.activeItem, targetWorldPos);
        }
      }
      return;
    }

    // Hover state management when not dragging
    const hovered = this.getIntersectedItem();
    if (hovered !== this.hoveredItem) {
      this.hoveredItem = hovered;
      this.domElement.style.cursor = hovered ? 'grab' : 'default';
      this.options.onHover?.(hovered);
    }
  }

  private onPointerUp(e: PointerEvent) {
    if (this.isDragging && this.activeItem) {
      this.raycaster.setFromCamera(this.mouse, this.camera);
      this.raycaster.ray.intersectPlane(this.dragPlane, this.planeIntersectPoint);
      
      const item = this.activeItem;
      const finalPos = item.mesh.position.clone();
      
      this.activeItem = null;
      this.isDragging = false;
      this.domElement.style.cursor = 'default';

      // Re-enable camera orbit controls
      if (this.orbitControls) {
        this.orbitControls.enabled = true;
      }

      this.options.onDragEnd?.(item, finalPos);
    }
  }

  dispose() {
    this.domElement.removeEventListener('pointerdown', this.onPointerDownBound);
    window.removeEventListener('pointermove', this.onPointerMoveBound);
    window.removeEventListener('pointerup', this.onPointerUpBound);
    this.clear();
  }
}

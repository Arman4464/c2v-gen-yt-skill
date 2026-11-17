import * as THREE from 'three';

export class TemplateWorld {
  scene = new THREE.Scene();
  ground: THREE.Mesh;
  backWall: THREE.Mesh;
  columnL: THREE.Mesh;
  columnR: THREE.Mesh;

  constructor() {
    this.scene.background = new THREE.Color('#78a0c8'); // sky blue
    this.scene.fog = new THREE.Fog('#78a0c8', 12, 45);

    // 1. Lighting
    const hemi = new THREE.HemisphereLight('#ffffff', '#8a7860', 0.85);
    this.scene.add(hemi);

    const sun = new THREE.DirectionalLight('#fff5e0', 1.8);
    sun.position.set(4, 8, 5);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 1024;
    sun.shadow.mapSize.height = 1024;
    this.scene.add(sun);

    // 2. Ground plane
    const groundGeo = new THREE.PlaneGeometry(30, 30);
    const groundMat = new THREE.MeshLambertMaterial({ color: '#557a55' });
    this.ground = new THREE.Mesh(groundGeo, groundMat);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.receiveShadow = true;
    this.scene.add(this.ground);

    // 3. Stylized cartoon back wall / arch
    const wallGeo = new THREE.BoxGeometry(8, 5, 0.4);
    const wallMat = new THREE.MeshLambertMaterial({ color: '#c4b59a' });
    this.backWall = new THREE.Mesh(wallGeo, wallMat);
    this.backWall.position.set(0, 2.5, -3.5);
    this.backWall.castShadow = true;
    this.backWall.receiveShadow = true;
    this.scene.add(this.backWall);

    // 4. Stylized side columns
    const colGeo = new THREE.CylinderGeometry(0.35, 0.4, 4.5, 16);
    const colMat = new THREE.MeshLambertMaterial({ color: '#dfd2ba' });

    this.columnL = new THREE.Mesh(colGeo, colMat);
    this.columnL.position.set(-1.8, 2.25, -2.5);
    this.columnL.castShadow = true;
    this.scene.add(this.columnL);

    this.columnR = new THREE.Mesh(colGeo, colMat);
    this.columnR.position.set(1.8, 2.25, -2.5);
    this.columnR.castShadow = true;
    this.scene.add(this.columnR);
  }

  update(_frame: number) {
    // Dynamic scene elements / sun animation if needed
  }

  dispose() {
    this.ground.geometry.dispose();
    (this.ground.material as THREE.Material).dispose();
    this.backWall.geometry.dispose();
    (this.backWall.material as THREE.Material).dispose();
    this.columnL.geometry.dispose();
    (this.columnL.material as THREE.Material).dispose();
    this.columnR.geometry.dispose();
    (this.columnR.material as THREE.Material).dispose();
  }
}

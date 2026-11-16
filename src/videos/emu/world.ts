import * as THREE from "three";
import { Pool, Actor, stage } from "./cast";
import { camAt, SHOTS } from "./story";
import { LIGHTS } from "../../engine/lights";
import { TONE } from "../../engine/shade";
import { cloudHD } from "../../engine/paint";

export class World {
  root = new THREE.Group();
  private pool = new Pool();
  private actors: Actor[] = [];
  private sun: THREE.DirectionalLight;
  private hemi: THREE.HemisphereLight;
  private wheatGroup = new THREE.Group();
  private fenceGroup = new THREE.Group();
  private tentGroup = new THREE.Group();
  private pondMesh: THREE.Mesh;

  constructor() {
    // 1. Australian Outback Red-Ochre Ground
    const groundGeo = new THREE.CylinderGeometry(90, 90, 1.2, 32);
    const groundMat = new THREE.MeshLambertMaterial({ color: "#a84828" });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.y = -0.6;
    ground.receiveShadow = true;
    this.root.add(ground);

    // 2. Rolling outback hills in background (half-buried spheres)
    const hillMat1 = new THREE.MeshLambertMaterial({ color: "#7a5038" });
    const hillMat2 = new THREE.MeshLambertMaterial({ color: "#546840" });
    const hills = [
      { x: -16, z: -35, r: 18, mat: hillMat1 },
      { x: 14, z: -38, r: 22, mat: hillMat2 },
      { x: 0, z: -45, r: 26, mat: hillMat1 },
    ];
    hills.forEach((h) => {
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(h.r, 16, 12), h.mat);
      mesh.position.set(h.x, -h.r * 0.72, h.z);
      this.root.add(mesh);
    });

    // 3. Clouds in the sky (painted cloud billboards)
    const cMat1 = new THREE.MeshBasicMaterial({ map: cloudHD(1), transparent: true, depthWrite: false });
    const cMat2 = new THREE.MeshBasicMaterial({ map: cloudHD(2), transparent: true, depthWrite: false });
    const cloud1 = new THREE.Mesh(new THREE.PlaneGeometry(16, 8), cMat1);
    cloud1.position.set(-6, 11, -30);
    const cloud2 = new THREE.Mesh(new THREE.PlaneGeometry(18, 9), cMat2);
    cloud2.position.set(8, 13, -32);
    this.root.add(cloud1, cloud2);

    // 4. Watering hole (Shot 4 pond)
    const pondGeo = new THREE.CylinderGeometry(3.5, 3.5, 0.08, 24);
    const pondMat = new THREE.MeshLambertMaterial({ color: "#2288a2" });
    this.pondMesh = new THREE.Mesh(pondGeo, pondMat);
    this.pondMesh.position.set(0, 0.02, -3.2);
    this.root.add(this.pondMesh);

    // 5. Golden Wheat Fields (planks with staggered heights)
    const wheatMat1 = new THREE.MeshLambertMaterial({ color: "#d6a74b" });
    const wheatMat2 = new THREE.MeshLambertMaterial({ color: "#c49237" });
    for (let r = 0; r < 16; r++) {
      const z = -1.8 - r * 1.3;
      const rowGeo = new THREE.BoxGeometry(28, 0.75 + (r % 3) * 0.1, 0.28);
      const row = new THREE.Mesh(rowGeo, r % 2 === 0 ? wheatMat1 : wheatMat2);
      row.position.set((r % 2) * 0.4, 0.38, z);
      row.receiveShadow = true;
      this.wheatGroup.add(row);
    }
    this.root.add(this.wheatGroup);

    // 6. Wooden post-and-wire fence (NO post at x=0 so it never intersects character faces!)
    const postMat = new THREE.MeshLambertMaterial({ color: "#543820" });
    const wireMat = new THREE.MeshBasicMaterial({ color: "#1e1814" });
    for (let i = -7; i <= 7; i++) {
      if (i === 0) continue; // Skip x=0 to avoid covering hero characters!
      const postGeo = new THREE.CylinderGeometry(0.07, 0.07, 1.5, 8);
      const post = new THREE.Mesh(postGeo, postMat);
      post.position.set(i * 1.8, 0.75, -1.1);
      this.fenceGroup.add(post);
    }
    const wireGeo1 = new THREE.BoxGeometry(32, 0.02, 0.02);
    const wire1 = new THREE.Mesh(wireGeo1, wireMat);
    wire1.position.set(0, 0.55, -1.1);
    const wire2 = new THREE.Mesh(wireGeo1, wireMat);
    wire2.position.set(0, 1.05, -1.1);
    this.fenceGroup.add(wire1, wire2);
    this.root.add(this.fenceGroup);

    // 7. Army Tent & White Surrender Flag (Shot 10)
    const tentMat = new THREE.MeshLambertMaterial({ color: "#595445" });
    const tent = new THREE.Mesh(new THREE.ConeGeometry(2.4, 2.8, 4), tentMat);
    tent.position.set(-2.8, 1.4, -2.5);
    tent.rotation.y = Math.PI / 4;
    this.tentGroup.add(tent);

    const poleMat = new THREE.MeshLambertMaterial({ color: "#7a6245" });
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 3.2, 8), poleMat);
    pole.position.set(-1.4, 1.6, -2.0);
    const flagMat = new THREE.MeshLambertMaterial({ color: "#ffffff" });
    const flag = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.55, 0.02), flagMat);
    flag.position.set(-0.95, 2.7, -2.0);
    this.tentGroup.add(pole, flag);
    this.root.add(this.tentGroup);

    // 8. Australian Gum Trees (Eucalyptus)
    const trunkMat = new THREE.MeshLambertMaterial({ color: "#ded6c8" });
    const leafMat = new THREE.MeshLambertMaterial({ color: "#4f6942" });
    const treePositions = [[-8, -12], [8, -14], [-12, -20], [11, -22]];
    treePositions.forEach(([tx, tz]) => {
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.38, 5.5, 8), trunkMat);
      trunk.position.set(tx, 2.75, tz);
      const puff1 = new THREE.Mesh(new THREE.SphereGeometry(2.0, 8, 8), leafMat);
      puff1.position.set(tx, 5.8, tz);
      const puff2 = new THREE.Mesh(new THREE.SphereGeometry(1.5, 8, 8), leafMat);
      puff2.position.set(tx + 1.1, 5.2, tz);
      this.root.add(trunk, puff1, puff2);
    });

    // 9. Lighting
    this.sun = new THREE.DirectionalLight("#fff4e0", 2.8);
    this.sun.position.set(10, 18, 14);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.width = 2048;
    this.sun.shadow.mapSize.height = 2048;
    this.sun.shadow.bias = -0.0003;
    this.root.add(this.sun);

    this.hemi = new THREE.HemisphereLight("#dcecff", "#a84828", 0.65);
    this.root.add(this.hemi);

    // Actor mesh pool
    for (let i = 0; i < 28; i++) {
      this.actors.push(new Actor(this.root));
    }
  }

  update(id: number, f: number, cam: THREE.PerspectiveCamera, _scene: THREE.Scene) {
    const s = SHOTS[id - 1];
    const c = camAt(id, f);

    // 1. Camera alignment
    cam.position.set(...c.pos);
    cam.lookAt(...c.look);
    cam.fov = c.fov;
    cam.updateProjectionMatrix();

    // 2. Adjust lighting & tone
    const lightPreset = s.light === "golden" || s.light === "sunset" ? LIGHTS.golden : LIGHTS.day;
    this.sun.color.set(lightPreset.sunCol);
    this.sun.intensity = lightPreset.sunI;
    TONE.uLitCol.value.set(...lightPreset.lit);
    TONE.uShadeCol.value.set(...lightPreset.shade);

    // Visibility toggles per shot
    this.pondMesh.visible = id === 4;
    this.wheatGroup.visible = id === 2 || id === 1;
    this.tentGroup.visible = id === 10 || id === 3 || id === 9;

    // 3. Stage actors
    const places = stage(id, f);
    while (this.actors.length < places.length) {
      this.actors.push(new Actor(this.root));
    }

    // Hide unused actors
    for (let i = places.length; i < this.actors.length; i++) {
      this.actors[i].mesh.visible = false;
    }

    // Pose active actors
    for (let i = 0; i < places.length; i++) {
      const p = places[i];
      const a = this.actors[i];
      a.r = this.pool.req(p.key, 600, 1000, 1, p.draw);
      a.mesh.visible = true;
      a.mesh.position.set(p.x, p.y, p.z);
      const sc = p.scale ?? 1.0;
      a.mesh.scale.set(sc, sc, sc);

      if (p.diagram) {
        a.mesh.quaternion.copy(cam.quaternion);
      } else {
        const dx = cam.position.x - p.x;
        const dz = cam.position.z - p.z;
        const yaw = Math.atan2(dx, dz) + (p.yaw ?? 0);
        a.mesh.rotation.set(0, yaw, 0);
      }
    }

    // Flush pool and bind textures
    this.pool.flush();
    for (let i = 0; i < places.length; i++) {
      this.actors[i].bind();
    }
  }
}

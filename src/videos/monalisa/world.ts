import * as THREE from "three";
import { Pool, Actor, stage } from "./cast";
import { camAt, SHOTS } from "./story";
import { LIGHTS } from "../../engine/lights";
import { TONE } from "../../engine/shade";
import { cobbleHD, cloudHD } from "../../engine/paint";

export class World {
  root = new THREE.Group();
  private pool = new Pool();
  private actors: Actor[] = [];
  private sun: THREE.DirectionalLight;
  private hemi: THREE.HemisphereLight;

  // Environment sets
  private streetGroup = new THREE.Group();
  private closetGroup = new THREE.Group();
  private galleryGroup = new THREE.Group();
  private stairGroup = new THREE.Group();
  private bedroomGroup = new THREE.Group();

  constructor() {
    // 1. Cobblestone Ground (Shared)
    const groundGeo = new THREE.CylinderGeometry(80, 80, 1.2, 32);
    const groundMat = new THREE.MeshLambertMaterial({ map: cobbleHD(), color: "#9c9489" });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.y = -0.6;
    ground.receiveShadow = true;
    this.root.add(ground);

    // ==========================================
    // Set 1: Parisian Street & Louvre Facade (Shot 1)
    // ==========================================
    const stoneMat = new THREE.MeshLambertMaterial({ color: "#c8bda8" }); // Parisian limestone
    const slateMat = new THREE.MeshLambertMaterial({ color: "#363a45" }); // zinc mansard roof
    const ironMat = new THREE.MeshLambertMaterial({ color: "#24272e" });

    // Louvre exterior wing facade
    const palace = new THREE.Mesh(new THREE.BoxGeometry(10, 16, 12), stoneMat);
    palace.position.set(-8.5, 8.0, -10);
    palace.castShadow = true;

    // Mansard roof
    const roof = new THREE.Mesh(new THREE.BoxGeometry(10.2, 3.5, 12.2), slateMat);
    roof.position.set(-8.5, 17.5, -10);

    // Classical palace pilasters
    for (const z of [-6, -10, -14]) {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 15, 12), stoneMat);
      col.position.set(-3.2, 7.5, z);
      this.streetGroup.add(col);
    }

    // Parisian cast-iron street gas lamp
    const lampPost = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 3.2, 8), ironMat);
    lampPost.position.set(2.2, 1.6, 0.8);
    const lantern = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.12, 0.45, 6), new THREE.MeshBasicMaterial({ color: "#ffea9f" }));
    lantern.position.set(2.2, 3.3, 0.8);
    this.streetGroup.add(palace, roof, lampPost, lantern);
    this.root.add(this.streetGroup);

    // ==========================================
    // Set 2: Dark Broom Closet Interior (Shot 2)
    // ==========================================
    const oakMat = new THREE.MeshLambertMaterial({ color: "#322216" });
    const closetWall = new THREE.Mesh(new THREE.BoxGeometry(6, 5, 0.4), oakMat);
    closetWall.position.set(0, 2.5, -1.2);

    // Wooden storage shelf with broom & mop
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.15, 0.8), oakMat);
    shelf.position.set(0, 3.0, -1.0);
    const broomHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.6, 6), new THREE.MeshLambertMaterial({ color: "#9c764a" }));
    broomHandle.position.set(-0.8, 2.0, -0.9);
    broomHandle.rotation.z = 0.12;

    const bucket = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.22, 0.5, 8), new THREE.MeshLambertMaterial({ color: "#727782" }));
    bucket.position.set(0.9, 0.25, -0.9);
    this.closetGroup.add(closetWall, shelf, broomHandle, bucket);
    this.root.add(this.closetGroup);

    // ==========================================
    // Set 3: Louvre Salon Carré Grand Gallery (Shots 3, 7)
    // ==========================================
    const damaskMat = new THREE.MeshLambertMaterial({ color: "#741d25" }); // rich crimson red velvet
    const marbleMat = new THREE.MeshLambertMaterial({ color: "#e8e4dc" }); // polished white marble
    const goldMat = new THREE.MeshLambertMaterial({ color: "#c9a43a" });

    // Grand crimson gallery back wall
    const galleryWall = new THREE.Mesh(new THREE.BoxGeometry(14, 8, 0.6), damaskMat);
    galleryWall.position.set(0, 4.0, -2.0);

    // Gold picture wainscoting & picture rail
    const picRail = new THREE.Mesh(new THREE.BoxGeometry(14, 0.2, 0.2), goldMat);
    picRail.position.set(0, 6.2, -1.68);
    const wainscot = new THREE.Mesh(new THREE.BoxGeometry(14, 1.2, 0.3), oakMat);
    wainscot.position.set(0, 0.6, -1.7);

    // Classical marble pillars on left and right
    const pillarL = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.5, 7.5, 16), marbleMat);
    pillarL.position.set(-2.8, 3.75, -1.2);
    const pillarR = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.5, 7.5, 16), marbleMat);
    pillarR.position.set(2.8, 3.75, -1.2);

    // Checkerboard polished floor overlay
    const checkerMat = new THREE.MeshLambertMaterial({ color: "#d8cfbe" });
    const floorPlate = new THREE.Mesh(new THREE.PlaneGeometry(12, 10), checkerMat);
    floorPlate.rotation.x = -Math.PI / 2;
    floorPlate.position.set(0, 0.02, 0);

    this.galleryGroup.add(galleryWall, picRail, wainscot, pillarL, pillarR, floorPlate);
    this.root.add(this.galleryGroup);

    // ==========================================
    // Set 4: Service Stairwell & Door (Shots 4, 5)
    // ==========================================
    const stoneWallMat = new THREE.MeshLambertMaterial({ color: "#54504a" });
    const doorMat = new THREE.MeshLambertMaterial({ color: "#422818" });

    const stairWall = new THREE.Mesh(new THREE.BoxGeometry(8, 6, 0.5), stoneWallMat);
    stairWall.position.set(0, 3.0, -1.6);

    // Wooden exit door
    const door = new THREE.Mesh(new THREE.BoxGeometry(2.2, 4.2, 0.15), doorMat);
    door.position.set(0, 2.1, -1.35);

    // Brass keyhole escutcheon plate
    const escutcheon = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.35, 0.05), goldMat);
    escutcheon.position.set(0.85, 2.0, -1.25);

    // Cast iron handrail
    const railPost = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.8, 6), ironMat);
    railPost.position.set(-1.6, 0.9, -0.6);
    this.stairGroup.add(stairWall, door, escutcheon, railPost);
    this.root.add(this.stairGroup);

    // ==========================================
    // Set 5: Parisian Boarding House Bedroom (Shot 8)
    // ==========================================
    const pineMat = new THREE.MeshLambertMaterial({ color: "#825d3b" });
    const bedMat = new THREE.MeshLambertMaterial({ color: "#3a4c66" });

    // Wooden floor & bed frame
    const bedFrame = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.2, 2.0), ironMat);
    bedFrame.position.set(-1.2, 0.6, -1.2);
    const mattress = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.6, 1.8), bedMat);
    mattress.position.set(-1.2, 0.9, -1.2);

    // Wooden steamer trunk with brass latches (under bed)
    const trunk = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.8, 1.0), pineMat);
    trunk.position.set(-1.2, 0.4, -0.4);
    // Gold frame corner peeking out
    const goldCorner = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.08, 0.4), goldMat);
    goldCorner.position.set(-0.8, 0.82, -0.3);

    this.bedroomGroup.add(bedFrame, mattress, trunk, goldCorner);
    this.root.add(this.bedroomGroup);

    // 6. Sky Clouds
    const cMat = new THREE.MeshBasicMaterial({ map: cloudHD(3), transparent: true, depthWrite: false });
    const cloud = new THREE.Mesh(new THREE.PlaneGeometry(24, 12), cMat);
    cloud.position.set(0, 16, -35);
    this.root.add(cloud);

    // 7. Lighting
    this.sun = new THREE.DirectionalLight("#fff2dc", 3.0);
    this.sun.position.set(12, 22, 15);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.width = 2048;
    this.sun.shadow.mapSize.height = 2048;
    this.sun.shadow.bias = -0.0003;
    this.root.add(this.sun);

    this.hemi = new THREE.HemisphereLight("#d8e8ff", "#48382c", 0.65);
    this.root.add(this.hemi);

    // Actor pool
    for (let i = 0; i < 20; i++) {
      this.actors.push(new Actor(this.root));
    }
  }

  update(id: number, f: number, cam: THREE.PerspectiveCamera, _scene: THREE.Scene) {
    const s = SHOTS[id - 1];
    const c = camAt(id, f);

    // 1. Camera
    cam.position.set(...c.pos);
    cam.lookAt(...c.look);
    cam.fov = c.fov;
    cam.updateProjectionMatrix();

    // 2. Lighting Preset
    const lightPreset = s.light === "golden" ? LIGHTS.golden : LIGHTS.day;
    this.sun.color.set(lightPreset.sunCol);
    this.sun.intensity = lightPreset.sunI;
    TONE.uLitCol.value.set(...lightPreset.lit);
    TONE.uShadeCol.value.set(...lightPreset.shade);

    // 3. Set visibilities per shot
    this.streetGroup.visible = id === 1;
    this.closetGroup.visible = id === 2;
    this.galleryGroup.visible = id === 3 || id === 6 || id === 7 || id === 8;
    this.stairGroup.visible = id === 4 || id === 5;
    this.bedroomGroup.visible = id === 8;

    // 4. Stage actors
    const places = stage(id, f);
    while (this.actors.length < places.length) {
      this.actors.push(new Actor(this.root));
    }

    for (let i = places.length; i < this.actors.length; i++) {
      this.actors[i].mesh.visible = false;
    }

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

    this.pool.flush();
    for (let i = 0; i < places.length; i++) {
      this.actors[i].bind();
    }
  }
}

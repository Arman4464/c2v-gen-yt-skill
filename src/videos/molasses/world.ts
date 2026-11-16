import * as THREE from "three";
import { Pool, Actor, stage } from "./cast";
import { camAt, SHOTS } from "./story";
import { LIGHTS } from "../../engine/lights";
import { TONE } from "../../engine/shade";
import { cobbleHD, brick, cloudHD } from "../../engine/paint";

export class World {
  root = new THREE.Group();
  private pool = new Pool();
  private actors: Actor[] = [];
  private sun: THREE.DirectionalLight;
  private hemi: THREE.HemisphereLight;

  // Visual groups
  private tankGroup = new THREE.Group();
  private cityGroup = new THREE.Group();
  private waveGroup = new THREE.Group();
  private officeGroup = new THREE.Group();
  private aftermathGroup = new THREE.Group();
  private leakGroup = new THREE.Group();


  constructor() {
    // 1. Cobblestone City Ground
    const groundGeo = new THREE.CylinderGeometry(80, 80, 1.2, 32);
    const groundMat = new THREE.MeshLambertMaterial({ map: cobbleHD(), color: "#92897e" });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.y = -0.6;
    ground.receiveShadow = true;
    this.root.add(ground);

    // 2. The 50-Foot Industrial Molasses Tank (Purity Distilling Co.)
    // Diameter ≈ 27m (r=8.5 in scale), Height ≈ 15m (14 in scale)
    const tankGeo = new THREE.CylinderGeometry(8.5, 8.5, 14, 32);
    const tankMat = new THREE.MeshLambertMaterial({ color: "#543725" }); // painted reddish-brown steel
    const tank = new THREE.Mesh(tankGeo, tankMat);
    tank.position.set(6.5, 7.0, -18);
    tank.castShadow = true;
    tank.receiveShadow = true;
    this.tankGroup.add(tank);

    // Steel rivet reinforcement rings
    const ringMat = new THREE.MeshLambertMaterial({ color: "#322016" });
    for (let r = 1; r <= 5; r++) {
      const ringGeo = new THREE.TorusGeometry(8.6, 0.16, 8, 32);
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.set(6.5, r * 2.4, -18);
      ring.rotation.x = Math.PI / 2;
      this.tankGroup.add(ring);
    }

    // Industrial side ladder
    const ladderMat = new THREE.MeshLambertMaterial({ color: "#221c1a" });
    const ladderRail1 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 14, 8), ladderMat);
    ladderRail1.position.set(-1.8, 7.0, -18 + 8.55);
    const ladderRail2 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 14, 8), ladderMat);
    ladderRail2.position.set(-1.2, 7.0, -18 + 8.55);
    this.tankGroup.add(ladderRail1, ladderRail2);

    for (let h = 1; h <= 13; h++) {
      const rung = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.6, 6), ladderMat);
      rung.rotation.z = Math.PI / 2;
      rung.position.set(-1.5, h, -18 + 8.55);
      this.tankGroup.add(rung);
    }

    // Tank Roof Vent & Pipe
    const domeGeo = new THREE.SphereGeometry(8.5, 32, 16, 0, Math.PI * 2, 0, Math.PI / 3);
    const dome = new THREE.Mesh(domeGeo, tankMat);
    dome.position.set(6.5, 14.0, -18);
    const ventPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 2.5, 12), ladderMat);
    ventPipe.position.set(6.5, 17.0, -18);
    this.tankGroup.add(dome, ventPipe);
    this.root.add(this.tankGroup);

    // 3. Boston North End Brick Cityscape
    const brickMat = new THREE.MeshLambertMaterial({ map: brick(), color: "#a6493a" });
    const trimMat = new THREE.MeshLambertMaterial({ color: "#2d2524" });

    // Tenement 1 (Foreground Left)
    const bldg1 = new THREE.Mesh(new THREE.BoxGeometry(9, 14, 11), brickMat);
    bldg1.position.set(-6.5, 7.0, -14);
    bldg1.castShadow = true;
    const bldg1Cornice = new THREE.Mesh(new THREE.BoxGeometry(9.4, 0.8, 11.4), trimMat);
    bldg1Cornice.position.set(-6.5, 14.4, -14);
    this.cityGroup.add(bldg1, bldg1Cornice);

    // Tenement 2 (Deep Left)
    const bldg2 = new THREE.Mesh(new THREE.BoxGeometry(12, 18, 12), brickMat);
    bldg2.position.set(-18, 9.0, -26);
    bldg2.castShadow = true;
    this.cityGroup.add(bldg2);

    // Atlantic Ave Elevated Railway Trestle
    const steelMat = new THREE.MeshLambertMaterial({ color: "#2e323b" });
    for (const zPos of [-7, -13, -19]) {
      const colL = new THREE.Mesh(new THREE.BoxGeometry(0.4, 6.2, 0.4), steelMat);
      colL.position.set(-3.5, 3.1, zPos);
      const colR = new THREE.Mesh(new THREE.BoxGeometry(0.4, 6.2, 0.4), steelMat);
      colR.position.set(2.5, 3.1, zPos);
      const crossBeam = new THREE.Mesh(new THREE.BoxGeometry(6.6, 0.5, 0.5), steelMat);
      crossBeam.position.set(-0.5, 6.1, zPos);
      this.cityGroup.add(colL, colR, crossBeam);
    }
    // Track girders
    const girderL = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.6, 16), steelMat);
    girderL.position.set(-2.0, 6.4, -13);
    const girderR = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.6, 16), steelMat);
    girderR.position.set(1.0, 6.4, -13);
    this.cityGroup.add(girderL, girderR);

    // Cast iron street lamp
    const lampPost = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 3.2, 8), steelMat);
    lampPost.position.set(-2.2, 1.6, 1.0);
    const lantern = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.12, 0.45, 6), new THREE.MeshBasicMaterial({ color: "#ffecaa" }));
    lantern.position.set(-2.2, 3.3, 1.0);
    this.cityGroup.add(lampPost, lantern);

    this.root.add(this.cityGroup);

    // 4. The Giant Syrup Tidal Wave (curling viscous tsunami)
    const waveMat = new THREE.MeshLambertMaterial({ color: "#1c0b04" }); // dark glossy molasses
    const waveLipMat = new THREE.MeshLambertMaterial({ color: "#361608" }); // amber curling lip

    // Main surging wave body
    const waveBody = new THREE.Mesh(new THREE.BoxGeometry(6.4, 3.8, 1.5), waveMat);
    waveBody.position.set(0, 2.2, -0.6);
    this.waveGroup.add(waveBody);

    // Wave crest curling forward over the street
    const crestGeo = new THREE.CylinderGeometry(1.4, 2.0, 6.2, 20, 1, false, 0, Math.PI);
    const waveCrest = new THREE.Mesh(crestGeo, waveLipMat);
    waveCrest.position.set(0, 2.3, 0.1);
    waveCrest.rotation.z = Math.PI / 2;
    waveCrest.rotation.x = -Math.PI * 0.35; // curls forward towards camera
    this.waveGroup.add(waveCrest);

    // Viscous syrup droplets dripping from crest
    for (const [dx, dy, dz] of [
      [-1.8, 1.8, 0.25],
      [-1.1, 1.9, 0.35],
      [-0.4, 1.75, 0.3],
      [0.2, 1.85, 0.4],
      [0.9, 1.7, 0.35],
      [1.6, 1.85, 0.28],
    ]) {
      const drop = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.55, 8), waveLipMat);
      drop.rotation.x = Math.PI; // point down
      drop.position.set(dx, dy, dz);
      this.waveGroup.add(drop);
    }
    this.root.add(this.waveGroup);

    // 5. Shot 3 Leaking Rivet Detail Wall
    const leakWallMat = new THREE.MeshLambertMaterial({ color: "#543725" });
    const leakWall = new THREE.Mesh(new THREE.BoxGeometry(10, 6, 0.8), leakWallMat);
    leakWall.position.set(0, 2.5, -1.5);
    // Dark brown leaking molasses streaks
    const dripMat = new THREE.MeshLambertMaterial({ color: "#220c04" });
    for (const dx of [-1.5, -0.8, -0.32, 0.32, 1.2, 2.0]) {
      const drip = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.4, 0.05), dripMat);
      drip.position.set(dx, 2.1, -1.08);
      // Rivet dot at top of drip
      const rivet = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.1, 8), new THREE.MeshLambertMaterial({ color: "#2b1a14" }));
      rivet.rotation.x = Math.PI / 2;
      rivet.position.set(dx, 3.2, -1.05);
      this.leakGroup.add(drip, rivet);
    }
    this.leakGroup.add(leakWall);
    this.root.add(this.leakGroup);

    // 6. Shot 4 Executive Office Interior
    const woodMat = new THREE.MeshLambertMaterial({ color: "#4a2c1b" });
    const officeWall = new THREE.Mesh(new THREE.BoxGeometry(8, 6, 0.4), woodMat);
    officeWall.position.set(0, 2.5, -1.5);

    // Framed "PROFITS" Chart
    const frameMat = new THREE.MeshLambertMaterial({ color: "#18120d" });
    const chartFrame = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.8, 0.08), frameMat);
    chartFrame.position.set(0, 3.2, -1.28);
    const chartPaper = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.6), new THREE.MeshBasicMaterial({ color: "#f8f5ea" }));
    chartPaper.position.set(0, 3.2, -1.23);
    this.officeGroup.add(officeWall, chartFrame, chartPaper);

    // Executive Desk
    const desk = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.9, 1.2), woodMat);
    desk.position.set(0, 0.45, -0.4);
    this.officeGroup.add(desk);
    this.root.add(this.officeGroup);

    // 7. Shot 8 Aftermath Destruction
    const floodedStreetMat = new THREE.MeshLambertMaterial({ color: "#220e04" }); // glossy brown pool
    const floodedStreet = new THREE.Mesh(new THREE.PlaneGeometry(16, 16), floodedStreetMat);
    floodedStreet.rotation.x = -Math.PI / 2;
    floodedStreet.position.set(0, 0.05, 0);

    const tiltedHouse = new THREE.Mesh(new THREE.BoxGeometry(4, 5, 4), brickMat);
    tiltedHouse.position.set(-2.5, 1.8, -3.0);
    tiltedHouse.rotation.z = 0.22; // tilted off foundation
    tiltedHouse.rotation.y = -0.15;

    const collapsedBeam = new THREE.Mesh(new THREE.BoxGeometry(5.0, 0.4, 0.4), steelMat);
    collapsedBeam.position.set(1.5, 0.4, -2.0);
    collapsedBeam.rotation.z = -0.3;
    collapsedBeam.rotation.y = 0.4;

    this.aftermathGroup.add(floodedStreet, tiltedHouse, collapsedBeam);
    this.root.add(this.aftermathGroup);

    // 8. Sky Clouds
    const cMat = new THREE.MeshBasicMaterial({ map: cloudHD(3), transparent: true, depthWrite: false });
    const cloud1 = new THREE.Mesh(new THREE.PlaneGeometry(24, 12), cMat);
    cloud1.position.set(0, 16, -35);
    const cloud2 = new THREE.Mesh(new THREE.PlaneGeometry(20, 10), cMat);
    cloud2.position.set(-15, 18, -40);
    this.root.add(cloud1, cloud2);

    // 9. Lighting
    this.sun = new THREE.DirectionalLight("#fff2dc", 3.0);
    this.sun.position.set(14, 24, 16);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.width = 2048;
    this.sun.shadow.mapSize.height = 2048;
    this.sun.shadow.bias = -0.0003;
    this.root.add(this.sun);

    this.hemi = new THREE.HemisphereLight("#d8e8ff", "#523626", 0.65);
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

    // 2. Lighting & Tone
    const lightPreset = s.light === "golden" ? LIGHTS.golden : LIGHTS.day;
    this.sun.color.set(lightPreset.sunCol);
    this.sun.intensity = lightPreset.sunI;
    TONE.uLitCol.value.set(...lightPreset.lit);
    TONE.uShadeCol.value.set(...lightPreset.shade);

    // Scene element visibilities by shot
    this.waveGroup.visible = id === 1 || id === 7;
    this.leakGroup.visible = id === 3;
    this.officeGroup.visible = id === 4;
    this.aftermathGroup.visible = id === 8;
    this.tankGroup.visible = id !== 4 && id !== 8;
    this.cityGroup.visible = id !== 4;

    // Wave animation for Shot 1 and 7
    if (this.waveGroup.visible) {
      const u = (f - s.a) / Math.max(1, s.b - s.a);
      if (id === 1) {
        // Wave surging forward right behind the fleeing runner!
        this.waveGroup.position.set(0, 0.05 * Math.sin(f * 0.15), -0.8 + u * 0.7);
        this.waveGroup.scale.set(1.0, 1.0, 1.0);
      } else {
        // Explosion surge
        this.waveGroup.position.set(0, -0.2, -2.5 + u * 3.2);
        this.waveGroup.scale.set(1.4, 1.2, 1.0);
      }
    }

    // 3. Stage actors
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

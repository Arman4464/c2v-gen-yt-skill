import React, { useEffect, useMemo } from "react";
import * as THREE from "three";
import { AbsoluteFill, Audio, continueRender, delayRender, staticFile, useCurrentFrame } from "remotion";
import { Captions } from "./Captions";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { EffectComposer } from "@react-three/postprocessing";
import { BlendFunction, BloomEffect, ToneMappingEffect, ToneMappingMode } from "postprocessing";
import { World } from "./world";
import { InkPass } from "../../engine/ink";
import { LensBlur, GrainEffect } from "../../engine/lensblur";
import { GradeEffect, GRADES, GRADE_STRENGTH, gradeFor } from "../../engine/grade";
import { TOTAL, SHOTS, shotAt, dofAt, focusAt } from "./story";

export const EMU_FRAMES = TOTAL;

const makeBloom = () => {
  const b = new BloomEffect({
    blendFunction: BlendFunction.ADD,
    intensity: 0.45,
    luminanceThreshold: 1.0,
    luminanceSmoothing: 0.2,
    mipmapBlur: true,
    levels: 6,
    radius: 0.6,
  });
  const mip = b.mipmapBlurPass;
  const setSize = mip.setSize.bind(mip);
  mip.setSize = (w: number, h: number) => setSize(Math.round((1920 * w) / Math.max(h, 1)), 1920);
  return b;
};

const fwd = new THREE.Vector3();

const Warmup: React.FC = () => {
  const gl = useThree((s) => s.gl);
  const advance = useThree((s) => s.advance);
  useEffect(() => {
    const handle = delayRender("emu-war post-processing warm-up");
    let done = false;
    let raf = 0;
    let renders = 0;
    let ticks = 0;
    const finish = () => {
      if (done) return;
      done = true;
      cancelAnimationFrame(raf);
      continueRender(handle);
    };
    const tick = () => {
      const before = gl.info.render.frame;
      advance(performance.now());
      ticks += 1;
      if (gl.info.render.frame > before) renders += 1;
      if (renders >= 2 || ticks >= 120) return finish();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return finish;
  }, [advance, gl]);
  return null;
};

const Inner: React.FC<{ id: number }> = ({ id }) => {
  const f = useCurrentFrame();
  const { camera, scene } = useThree();
  const world = useMemo(() => new World(), []);
  const target = useMemo(() => new THREE.Vector3(), []);

  const fx = useMemo(() => ({
    ink: new InkPass(scene, camera as THREE.PerspectiveCamera),
    lens: new LensBlur({ maxCoC: 22, nearScale: 1.2 }),
    bloom: makeBloom(),
    tone: new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL }),
    grade: new GradeEffect(GRADES.day, GRADE_STRENGTH.day),
    grain: new GrainEffect({ amount: 0.025, cellPx: 1.5 }),
  }), [camera, scene]);

  useEffect(() => () => fx.ink.dispose(), [fx]);

  const post = useMemo(() => (
    <EffectComposer multisampling={0}>
      <primitive object={fx.ink} dispose={null} />
      <primitive object={fx.lens.pre} dispose={null} />
      <primitive object={fx.lens.main} dispose={null} />
      <primitive object={fx.bloom} dispose={null} />
      <primitive object={fx.tone} dispose={null} />
      <primitive object={fx.grade} dispose={null} />
      <primitive object={fx.grain} dispose={null} />
    </EffectComposer>
  ), [fx]);

  const cam = camera as THREE.PerspectiveCamera;
  world.update(id, f, cam, scene);

  const d = dofAt(f);
  target.set(...focusAt(id, f)).sub(cam.position);
  fx.lens.focus = Math.max(0.3, target.dot(cam.getWorldDirection(fwd)));
  fx.lens.cInf = d.cInf;

  const currentShot = SHOTS[id - 1] ?? SHOTS[0];
  const lightKey = currentShot.light === "golden" || currentShot.light === "sunset" ? "golden" : "day";
  gradeFor(fx.grade, lightKey);
  fx.grain.seed = f;

  return (
    <>
      <Warmup />
      <primitive object={world.root} dispose={null} />
      {post}
    </>
  );
};

export const EmuWarShort: React.FC = () => {
  const f = useCurrentFrame();
  const currentShot = shotAt(f);

  return (
    <AbsoluteFill style={{ background: "#8db5e6" }}>
      <Audio src={staticFile("emu_voiceover.wav")} />
      <AbsoluteFill>
        <ThreeCanvas
          width={1080}
          height={1920}
          shadows
          gl={{
            antialias: false,
            stencil: false,
            powerPreference: "high-performance",
            toneMappingExposure: 1.0,
          }}
          camera={{ fov: 40, near: 0.2, far: 500 }}
        >
          <Inner id={currentShot.id} />
        </ThreeCanvas>
      </AbsoluteFill>
      <Captions />
    </AbsoluteFill>
  );
};

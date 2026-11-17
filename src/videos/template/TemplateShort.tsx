import React, { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { ThreeCanvas } from '@remotion/three';
import { useThree } from '@react-three/fiber';
import { EffectComposer } from '@react-three/postprocessing';
import { TemplateWorld } from './world';
import { TemplateActor } from './cast';
import { getCameraAt, SUBTITLES, SFX_EVENTS, TOTAL_FRAMES } from './story';
import { LookMatchPipeline, Warmup } from '../../engine/pipeline';
import { clampActorToFrustum } from '../../engine/camera';
import { FloorPoolManager } from '../../engine/floorpool';
import { Soundscape } from '../../engine/audio';
import { KineticCaptions } from '../../engine/KineticCaptions';

export const TEMPLATE_FRAMES = TOTAL_FRAMES;

const SceneContainer: React.FC = () => {
  const frame = useCurrentFrame();
  const { camera } = useThree();

  const world = useMemo(() => new TemplateWorld(), []);
  const actor = useMemo(() => new TemplateActor(world.scene, 2), [world]);
  const pools = useMemo(() => new FloorPoolManager(world.scene), [world]);

  const fx = useMemo(
    () => new LookMatchPipeline(world.scene, camera as THREE.PerspectiveCamera),
    [camera, world]
  );

  useEffect(() => () => {
    fx.dispose();
    pools.dispose();
    actor.dispose();
    world.dispose();
  }, [fx, pools, actor, world]);

  // Update scene & camera per frame
  const camInfo = getCameraAt(frame);
  camera.position.set(...camInfo.pos);
  (camera as THREE.PerspectiveCamera).fov = camInfo.fov;
  (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
  camera.lookAt(...camInfo.look);

  // Update pipeline dynamic parameters (12 FPS line boil seed, focal depth, grain)
  fx.update(frame, camInfo.focalDist, 'day');

  // Enforce 9:16 vertical safe frustum bounds on actor
  const safeActorPos = clampActorToFrustum([0.0, 0.0, 0.0], camInfo.pos, camInfo.fov);
  world.update(frame);
  actor.update(frame, safeActorPos, 165); // shock trigger at frame 165

  // Automatic Warm Floor Pool & Contact Shadow tracking actor
  pools.syncWithActors([{
    x: safeActorPos[0],
    y: safeActorPos[1],
    z: safeActorPos[2],
    scale: 1.0,
    visible: true,
  }], 0.0);

  return (
    <>
      <Warmup />
      <primitive object={world.scene} />
      <EffectComposer multisampling={0}>
        <primitive object={fx.ink} dispose={null} />
        <primitive object={fx.lens.pre} dispose={null} />
        <primitive object={fx.lens.main} dispose={null} />
        <primitive object={fx.bloom} dispose={null} />
        <primitive object={fx.tone} dispose={null} />
        <primitive object={fx.grade} dispose={null} />
        <primitive object={fx.grain} dispose={null} />
      </EffectComposer>
    </>
  );
};

export const TemplateShort: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#000000' }}>
      {/* 1. 3D Cel-Shaded World with Procedural Actors & Line Boil */}
      <ThreeCanvas
        width={1080}
        height={1920}
        camera={{ position: [0, 1.35, 3.2], fov: 38 }}
      >
        <SceneContainer />
      </ThreeCanvas>

      {/* 2. Layered Cartoon Soundscape (Subtle Pizzicato Bed + Foley SFX) */}
      <Soundscape
        musicBedSrc="audio/pizzicato_bed.wav"
        musicVolume={0.14}
        duckedVolume={0.08}
        sfx={SFX_EVENTS}
      />

      {/* 3. Kinetic Bouncing Subtitles (Electric Gold Active Word Spring) */}
      <KineticCaptions
        subtitles={SUBTITLES}
        bottom={380}
        highlightColor="#FFE600"
      />
    </AbsoluteFill>
  );
};

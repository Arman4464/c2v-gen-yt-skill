// Sandbox entry for rapid local preview and look-pass tuning.
// To use: copy this to src/index.ts or specify as entry: npx remotion preview src/videos/template/TemplateShort.tsx
import React from "react";
import { Composition, registerRoot } from "remotion";
import { TemplateShort, TEMPLATE_FRAMES } from "../../../src/videos/template/TemplateShort";

const SandboxRoot: React.FC = () => (
  <Composition
    id="CartoonShortsTemplate"
    component={TemplateShort}
    durationInFrames={TEMPLATE_FRAMES}
    fps={30}
    width={1080}
    height={1920}
  />
);

registerRoot(SandboxRoot);

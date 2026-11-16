import { Config } from '@remotion/cli/config';

// Stills/segment stills are JPEG at q85: fast enough to iterate on the 3D shots. If a hero frame
// shows banding in the sky/fog gradient, render that frame with `--image-format=png` instead.
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(85);
Config.setOverwriteOutput(true);
// ANGLE -> the platform's real GPU (D3D11 on Windows, Metal on macOS, GL on Linux). Without this,
// Remotion's headless Chrome falls back to SwiftShader and every frame is rendered on the CPU:
// measured on a GT 710, ANGLE reports "ANGLE (NVIDIA ... Direct3D11 vs_5_0 ps_5_0, D3D11)" and
// renders roughly twice as fast as the software fallback. A blank 3D canvas is a different bug -
// see the Warmup note in src/bridge/Bridge.tsx.
Config.setChromiumOpenGlRenderer('angle');
// 2 tabs, not more: every tab holds two 1080x1920 WebGL contexts (post chains) and the GPU compositor
// runs out of contexts before the CPU runs out of cores. Raise only with a measured render-time win.
Config.setConcurrency(2);
Config.setTimeoutInMilliseconds(120000);

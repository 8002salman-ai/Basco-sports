import {Config} from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
// WebGL map plates: one frame at a time through ANGLE, as the MapLibre
// technique requires, so tile rasterisation cannot race between workers.
Config.setConcurrency(1);
Config.setChromiumOpenGlRenderer('angle');
Config.setCodec('h264');

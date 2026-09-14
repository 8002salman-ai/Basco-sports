import {Composition} from 'remotion';
import {BascoGlobePromo} from './BascoGlobePromo';
import {DURATION_IN_FRAMES, FPS} from './brand';

export const RemotionRoot: React.FC = () => (
  <Composition
    id="BascoGlobePromo"
    component={BascoGlobePromo}
    durationInFrames={DURATION_IN_FRAMES}
    fps={FPS}
    width={1920}
    height={1080}
  />
);

import {AbsoluteFill, Easing, interpolate} from 'remotion';
import {BRAND, PLATES} from '../brand';
import {GLOBE_BASEMAP} from '../map/basemap';
import {useFrozenMap} from '../map/useFrozenMap';

/**
 * Beat one: the globe, pulled slowly in with a CSS transform.
 *
 * The camera never moves, so the plate is one stable render; because the
 * container's centre is the camera centre, the transform pivot is known without
 * consulting the map and stays identical on every frame.
 */
export const GlobePlate: React.FC<{progress: number}> = ({progress}) => {
  const {containerRef} = useFrozenMap({
    style: GLOBE_BASEMAP,
    center: PLATES.globe.center,
    zoom: PLATES.globe.zoom,
    globe: true,
  });

  const {width, height} = PLATES.globe;
  const scale = interpolate(progress, [0, 1], [PLATES.globe.scaleFrom, 1], {
    easing: Easing.inOut(Easing.quad),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{backgroundColor: BRAND.obsidianDeep, overflow: 'hidden'}}>
      <div
        ref={containerRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width,
          height,
          transform: `translate(${960 - (width / 2) * scale}px, ${540 - (height / 2) * scale}px) scale(${scale})`,
          transformOrigin: '0 0',
        }}
      />
    </AbsoluteFill>
  );
};

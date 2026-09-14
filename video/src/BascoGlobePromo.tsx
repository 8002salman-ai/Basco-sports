import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {BEATS, BRAND, COPY} from './brand';
import {BRAND_MARK_PATHS, SHIPPING_ZONES} from './zones';
import {GlobePlate} from './plates/GlobePlate';
import {ZonesPlate} from './plates/ZonesPlate';

const fadeOver = (frame: number, [from, to]: readonly [number, number]) =>
  interpolate(frame, [from, to], [0, 1], {
    easing: Easing.inOut(Easing.quad),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

const easeInOut = Easing.inOut(Easing.quad);

/** The storefront's lime football mark, drawn for dark backgrounds. */
const Mark: React.FC<{size: number}> = ({size}) => (
  <svg viewBox="0 0 40 40" style={{width: size, height: size, flexShrink: 0}} aria-hidden="true">
    <circle cx="20" cy="20" r="15" fill={BRAND.lime} />
    <path d={BRAND_MARK_PATHS.ball} fill={BRAND.obsidian} />
    <path
      d={BRAND_MARK_PATHS.seams}
      stroke={BRAND.obsidian}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const Wordmark: React.FC<{colour: string; size: number}> = ({colour, size}) => (
  <span style={{fontFamily: BRAND.display, fontWeight: 700, fontSize: size, letterSpacing: '0.14em', color: colour}}>
    {COPY.mark}
  </span>
);

/**
 * Basco Sports promo: globe → shipping footprint → brand lockup.
 *
 * Two fixed MapLibre plates with a deliberate cross-dissolve between them. Each
 * plate's camera is static for its whole life; every camera-looking move is a
 * CSS transform of the plate, and every geographic animation is GeoJSON/frame
 * driven. See src/plates/*.tsx.
 */
export const BascoGlobePromo: React.FC = () => {
  const frame = useCurrentFrame();

  const brandIn = fadeOver(frame, BEATS.brandIn);
  const globeProgress = fadeOver(frame, BEATS.globeHold);
  const midDissolve = fadeOver(frame, BEATS.globeToZones);
  const zonesProgress = fadeOver(frame, BEATS.zonesPush);
  const pinProgress = fadeOver(frame, BEATS.pinDrop);
  const mapOut = fadeOver(frame, BEATS.plateOut);
  const lockup = fadeOver(frame, BEATS.lockupIn);

  // The globe beat fades up under the first caption; the rest is the push.
  const globeOpacity = (1 - midDissolve) * brandIn;
  const zonesOpacity = midDissolve * (1 - mapOut);
  const vignette = Math.max(globeOpacity, zonesOpacity);

  const [headlineFrom, headlineTo] = BEATS.globeHold;
  const headlineOut = interpolate(frame, [headlineTo - 18, headlineTo + 6], [1, 0], {
    easing: easeInOut,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const claimIn = interpolate(frame, [BEATS.pinDrop[0] + 30, BEATS.pinDrop[0] + 70], [0, 1], {
    easing: easeInOut,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{backgroundColor: BRAND.obsidianDeep, fontFamily: BRAND.body}}>
      <AbsoluteFill style={{opacity: globeOpacity}}>
        <GlobePlate progress={globeProgress} />
      </AbsoluteFill>

      <AbsoluteFill style={{opacity: zonesOpacity}}>
        <ZonesPlate progress={zonesProgress} pinProgress={pinProgress} />
      </AbsoluteFill>

      {/* Cinematic edge falloff over the map beats only. */}
      <AbsoluteFill
        style={{
          opacity: vignette * 0.7,
          background: `radial-gradient(120% 90% at 50% 45%, rgba(11,18,32,0) 45%, rgba(7,12,22,0.55) 100%)`,
          pointerEvents: 'none',
        }}
      />

      {/*
       * Persistent brand chip. It carries a dark pill because it crosses from
       * the dark globe onto the light basemap, and the wordmark has to stay
       * readable on both.
       */}
      <div
        style={{
          position: 'absolute',
          top: 64,
          left: 96,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '14px 28px 14px 18px',
          borderRadius: 999,
          background: 'rgba(7,12,22,0.88)',
          border: '1px solid rgba(212,255,50,0.25)',
          opacity: brandIn * (1 - mapOut),
        }}
      >
        <Mark size={46} />
        <Wordmark colour={BRAND.stone} size={26} />
      </div>

      {/* Globe caption. */}
      <div
        style={{
          position: 'absolute',
          left: 96,
          bottom: 128,
          maxWidth: 900,
          opacity: brandIn * headlineOut,
        }}
      >
        <span
          style={{
            display: 'inline-block',
            padding: '10px 20px',
            borderRadius: 999,
            background: BRAND.lime,
            color: BRAND.obsidian,
            fontFamily: BRAND.display,
            fontWeight: 700,
            fontSize: 24,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          {COPY.badge}
        </span>
        <h1
          style={{
            margin: '26px 0 0',
            fontFamily: BRAND.display,
            fontWeight: 700,
            fontSize: 76,
            lineHeight: 1.02,
            letterSpacing: '-0.02em',
            color: BRAND.stone,
          }}
        >
          {COPY.headline}
        </h1>
      </div>

      {/*
       * Zone legend. Carrier and delivery estimate live here rather than on the
       * pins: London and Frankfurt are close enough that two lines of map text
       * per pin overlap, and the composition sets crisper type.
       */}
      <div
        style={{
          position: 'absolute',
          left: 96,
          bottom: 40,
          padding: '22px 30px 20px',
          borderRadius: 24,
          background: 'rgba(7,12,22,0.88)',
          border: '1px solid rgba(212,255,50,0.18)',
          opacity: zonesOpacity * claimIn,
        }}
      >
        <div style={{fontFamily: BRAND.display, fontWeight: 700, fontSize: 20, letterSpacing: '0.16em', color: BRAND.lime}}>
          SHIPPING ZONES
        </div>
        <div style={{marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10}}>
          {SHIPPING_ZONES.map((zone) => (
            <div key={zone.name} style={{display: 'flex', alignItems: 'baseline', gap: 26}}>
              <span style={{width: 250, color: BRAND.stone, fontSize: 26, fontWeight: 600}}>{zone.name}</span>
              <span style={{flex: 1, color: 'rgba(237,233,227,0.72)', fontSize: 23}}>{zone.carrier}</span>
              <span style={{color: BRAND.lime, fontSize: 23}}>{zone.eta}</span>
            </div>
          ))}
        </div>
        <div
          style={{
            marginTop: 16,
            paddingTop: 14,
            borderTop: '1px solid rgba(237,233,227,0.2)',
            color: BRAND.stone,
            fontFamily: BRAND.display,
            fontWeight: 700,
            fontSize: 27,
          }}
        >
          {COPY.shipping} · {COPY.returns}
        </div>
      </div>

      {/*
       * The dark plate the map dissolves into. It is a separate layer from the
       * lockup type on purpose: the map is gone before the wordmark arrives, so
       * no frame ever shows the legend card and the wordmark at once.
       */}
      <AbsoluteFill
        style={{
          opacity: mapOut,
          background: `radial-gradient(90% 70% at 50% 40%, ${BRAND.obsidian} 0%, ${BRAND.obsidianDeep} 100%)`,
        }}
      />

      <AbsoluteFill style={{opacity: lockup, alignItems: 'center', justifyContent: 'center'}}>
        <Mark size={116} />
        <div style={{marginTop: 34}}>
          <Wordmark colour={BRAND.stone} size={62} />
        </div>
        <div style={{marginTop: 22, color: BRAND.lime, fontSize: 30, letterSpacing: '0.02em'}}>
          {COPY.shipping} · {COPY.returns}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

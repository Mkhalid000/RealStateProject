import React from 'react';
import {Text} from 'react-native';
import Svg, {Circle, Line, Path, Rect} from 'react-native-svg';
import {useColors} from '../../theme';

/**
 * Lightweight stroke-icon set (Feather/Lucide style, 24×24 viewBox) rendered
 * with react-native-svg — crisp and consistent across devices. Unknown names
 * fall back to rendering the raw string, so a glyph like "$" still shows.
 */
const PATHS = {
  mail: (
    <>
      <Rect x="2" y="4" width="20" height="16" rx="2" />
      <Path d="M22 7l-10 7L2 7" />
    </>
  ),
  sliders: (
    <>
      <Line x1="4" y1="21" x2="4" y2="14" />
      <Line x1="4" y1="10" x2="4" y2="3" />
      <Line x1="12" y1="21" x2="12" y2="12" />
      <Line x1="12" y1="8" x2="12" y2="3" />
      <Line x1="20" y1="21" x2="20" y2="16" />
      <Line x1="20" y1="12" x2="20" y2="3" />
      <Line x1="1" y1="14" x2="7" y2="14" />
      <Line x1="9" y1="8" x2="15" y2="8" />
      <Line x1="17" y1="16" x2="23" y2="16" />
    </>
  ),
  'map-pin': (
    <>
      <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <Circle cx="12" cy="10" r="3" />
    </>
  ),
  bed: (
    <>
      <Path d="M2 4v16" />
      <Path d="M2 8h18a2 2 0 0 1 2 2v10" />
      <Path d="M2 17h20" />
      <Path d="M6 8v-2a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </>
  ),
  bath: (
    <>
      <Path d="M4 12V5a2 2 0 0 1 2-2h1a2 2 0 0 1 2 2" />
      <Line x1="2" y1="12" x2="22" y2="12" />
      <Path d="M4 12v3a4 4 0 0 0 4 4h8a4 4 0 0 0 4-4v-3" />
      <Line x1="6" y1="21" x2="6" y2="19" />
      <Line x1="18" y1="21" x2="18" y2="19" />
    </>
  ),
  ruler: (
    <>
      <Path d="M3 9l12-6 6 12-12 6z" />
      <Path d="M7 8l1.5 3" />
      <Path d="M11 6l1.5 3" />
      <Path d="M15 4l1.5 3" />
    </>
  ),
  heart: (
    <Path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  ),
  'chevron-right': <Path d="M9 18l6-6-6-6" />,
  'chevron-down': <Path d="M6 9l6 6 6-6" />,
  'chevron-up': <Path d="M18 15l-6-6-6 6" />,
  star: (
    <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  ),
  tag: (
    <>
      <Path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <Line x1="7" y1="7" x2="7.01" y2="7" />
    </>
  ),
  home: (
    <>
      <Path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
      <Path d="M9 21v-7h6v7" />
    </>
  ),
  bell: (
    <>
      <Path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <Path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </>
  ),
  pause: (
    <>
      <Rect x="6" y="4" width="4" height="16" />
      <Rect x="14" y="4" width="4" height="16" />
    </>
  ),
  'volume-2': (
    <>
      <Path d="M11 5L6 9H2v6h4l5 4V5z" />
      <Path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
      <Path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    </>
  ),
  'volume-x': (
    <>
      <Path d="M11 5L6 9H2v6h4l5 4V5z" />
      <Line x1="23" y1="9" x2="17" y2="15" />
      <Line x1="17" y1="9" x2="23" y2="15" />
    </>
  ),
  'user-plus': (
    <>
      <Path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <Circle cx="9" cy="7" r="4" />
      <Line x1="19" y1="8" x2="19" y2="14" />
      <Line x1="16" y1="11" x2="22" y2="11" />
    </>
  ),
  lock: (
    <>
      <Rect x="3" y="11" width="18" height="11" rx="2" />
      <Path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </>
  ),
  user: (
    <>
      <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <Circle cx="12" cy="7" r="4" />
    </>
  ),
  compass: (
    <>
      <Circle cx="12" cy="12" r="10" />
      <Path d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z" />
    </>
  ),
  play: (
    <>
      <Circle cx="12" cy="12" r="10" />
      <Path d="M10 8l6 4-6 4V8z" />
    </>
  ),
  film: (
    <>
      <Rect x="2" y="3" width="20" height="18" rx="2" />
      <Line x1="7" y1="3" x2="7" y2="21" />
      <Line x1="17" y1="3" x2="17" y2="21" />
      <Line x1="2" y1="9" x2="22" y2="9" />
      <Line x1="2" y1="15" x2="22" y2="15" />
    </>
  ),
  plus: (
    <>
      <Line x1="12" y1="5" x2="12" y2="19" />
      <Line x1="5" y1="12" x2="19" y2="12" />
    </>
  ),
  sparkles: (
    <>
      <Path d="M12 3l1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9L12 3z" />
      <Path d="M19 14l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8.8-2z" />
    </>
  ),
  calendar: (
    <>
      <Rect x="3" y="4" width="18" height="18" rx="2" />
      <Line x1="16" y1="2" x2="16" y2="6" />
      <Line x1="8" y1="2" x2="8" y2="6" />
      <Line x1="3" y1="10" x2="21" y2="10" />
    </>
  ),
  sofa: (
    <>
      <Path d="M3 11V8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v3" />
      <Path d="M2 13a2 2 0 0 1 2-2 2 2 0 0 1 2 2v3h12v-3a2 2 0 0 1 4 0v5a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1z" />
      <Line x1="6" y1="19" x2="6" y2="21" />
      <Line x1="18" y1="19" x2="18" y2="21" />
    </>
  ),
  layers: (
    <>
      <Path d="M12 2l9 5-9 5-9-5 9-5z" />
      <Path d="M3 12l9 5 9-5" />
      <Path d="M3 17l9 5 9-5" />
    </>
  ),
  'message-circle': (
    <Path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  ),
  'share-2': (
    <>
      <Circle cx="18" cy="5" r="3" />
      <Circle cx="6" cy="12" r="3" />
      <Circle cx="18" cy="19" r="3" />
      <Line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <Line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </>
  ),
  phone: (
    <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
  ),
  building: (
    <>
      <Path d="M3 21h18" />
      <Path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16" />
      <Line x1="9" y1="7" x2="9.01" y2="7" />
      <Line x1="9" y1="11" x2="9.01" y2="11" />
      <Line x1="9" y1="15" x2="9.01" y2="15" />
      <Line x1="14" y1="7" x2="14.01" y2="7" />
      <Line x1="14" y1="11" x2="14.01" y2="11" />
      <Line x1="14" y1="15" x2="14.01" y2="15" />
    </>
  ),
  search: (
    <>
      <Circle cx="11" cy="11" r="8" />
      <Line x1="21" y1="21" x2="16.65" y2="16.65" />
    </>
  ),
  briefcase: (
    <>
      <Rect x="2" y="7" width="20" height="14" rx="2" />
      <Path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </>
  ),
  eye: (
    <>
      <Path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
      <Circle cx="12" cy="12" r="3" />
    </>
  ),
  'eye-off': (
    <>
      <Path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <Line x1="1" y1="1" x2="23" y2="23" />
    </>
  ),
  check: <Path d="M20 6L9 17l-5-5" />,
  sun: (
    <>
      <Circle cx="12" cy="12" r="4" />
      <Line x1="12" y1="2" x2="12" y2="4" />
      <Line x1="12" y1="20" x2="12" y2="22" />
      <Line x1="4.93" y1="4.93" x2="6.34" y2="6.34" />
      <Line x1="17.66" y1="17.66" x2="19.07" y2="19.07" />
      <Line x1="2" y1="12" x2="4" y2="12" />
      <Line x1="20" y1="12" x2="22" y2="12" />
      <Line x1="4.93" y1="19.07" x2="6.34" y2="17.66" />
      <Line x1="17.66" y1="6.34" x2="19.07" y2="4.93" />
    </>
  ),
  moon: <Path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />,
  x: (
    <>
      <Line x1="18" y1="6" x2="6" y2="18" />
      <Line x1="6" y1="6" x2="18" y2="18" />
    </>
  ),
  'chevron-left': <Path d="M15 18l-6-6 6-6" />,
  'arrow-right': (
    <>
      <Line x1="5" y1="12" x2="19" y2="12" />
      <Path d="M12 5l7 7-7 7" />
    </>
  ),
};

export function Icon({name, size = 22, color, strokeWidth = 1.8, style}) {
  const c = useColors();
  const resolved = color ?? c.text;
  const content = PATHS[name];
  if (!content) {
    return <Text style={[{color: resolved, fontSize: size * 0.9}, style]}>{name}</Text>;
  }
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={resolved}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}>
      {content}
    </Svg>
  );
}

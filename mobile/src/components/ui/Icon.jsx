import React from 'react';
import {Text} from 'react-native';
import Svg, {Circle, Line, Path, Rect} from 'react-native-svg';
import {colors} from '../../theme';

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

export function Icon({name, size = 22, color = colors.text, strokeWidth = 1.8, style}) {
  const content = PATHS[name];
  if (!content) {
    return <Text style={[{color, fontSize: size * 0.9}, style]}>{name}</Text>;
  }
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}>
      {content}
    </Svg>
  );
}

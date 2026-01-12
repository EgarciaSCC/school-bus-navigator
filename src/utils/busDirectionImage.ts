import bus0 from '@/assets/bus-0.png';
import bus45 from '@/assets/bus-45.png';
import bus315 from '@/assets/bus-315.png';

// Bus images for directions using only 3 available images
// bus-0.png = Looking forward (back of bus visible) - used for North
// bus-45.png = Right turn view - used for East directions
// bus-315.png = Left turn view - used for West directions

/**
 * Get the appropriate bus image based on heading angle
 * Using only 3 images: bus-0, bus-45, bus-315
 * @param heading - Heading in degrees (0-360, where 0 is North)
 * @returns The appropriate bus image import
 */
export function getBusImageForHeading(heading: number | null): string {
  if (heading === null) {
    return bus0; // Default: forward view
  }

  // Normalize heading to 0-360
  const normalizedHeading = ((heading % 360) + 360) % 360;

  // Divide into 3 zones:
  // 315-45° (North zone) -> bus-0 (forward)
  // 45-180° (East/South zone) -> bus-45 (right view)
  // 180-315° (West zone) -> bus-315 (left view)
  
  if (normalizedHeading >= 315 || normalizedHeading < 45) {
    return bus0; // North - forward view
  } else if (normalizedHeading >= 45 && normalizedHeading < 180) {
    return bus45; // East/Southeast - right view
  } else {
    return bus315; // West/Southwest - left view
  }
}

/**
 * Get the rotation offset for the bus image
 * Calculates fine rotation adjustment within each zone
 * @param heading - Heading in degrees
 * @returns Fine rotation adjustment in degrees
 */
export function getBusRotationOffset(heading: number | null): number {
  if (heading === null) return 0;

  // Normalize heading
  const normalizedHeading = ((heading % 360) + 360) % 360;

  // Calculate offset based on zone center
  // North zone center: 0°
  // East zone center: 112.5° (midpoint of 45-180)
  // West zone center: 247.5° (midpoint of 180-315)
  
  if (normalizedHeading >= 315 || normalizedHeading < 45) {
    // North zone - center at 0°
    const offset = normalizedHeading >= 315 ? normalizedHeading - 360 : normalizedHeading;
    return offset;
  } else if (normalizedHeading >= 45 && normalizedHeading < 180) {
    // East zone - offset from 45°
    return normalizedHeading - 45;
  } else {
    // West zone - offset from 315° (inverted since image faces left)
    return -(315 - normalizedHeading);
  }
}

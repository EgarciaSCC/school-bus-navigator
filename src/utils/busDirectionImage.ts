import bus0 from '@/assets/bus-0.png';
import bus45 from '@/assets/bus-45.png';
import bus135 from '@/assets/bus-135.png';
import bus180 from '@/assets/bus-180.png';
import bus225 from '@/assets/bus-225.png';
import bus315 from '@/assets/bus-315.png';

// Bus images for 8 directions (every 45 degrees)
// 0° = North (back of bus visible)
// 45° = Northeast (back-right corner)
// 90° = East (right side - using 45° image as closest match)
// 135° = Southeast (front-right corner)
// 180° = South (front of bus visible)
// 225° = Southwest (front-left corner)
// 270° = West (left side - using 315° image as closest match)
// 315° = Northwest (back-left corner)
const busImages: { [key: number]: string } = {
  0: bus0,      // North - back view
  45: bus45,    // Northeast - back-right
  90: bus45,    // East - use 45° (closest right-side view available)
  135: bus135,  // Southeast - front-right
  180: bus180,  // South - front view
  225: bus225,  // Southwest - front-left
  270: bus315,  // West - use 315° (closest left-side view available)
  315: bus315,  // Northwest - back-left
};

/**
 * Get the appropriate bus image based on heading angle
 * @param heading - Heading in degrees (0-360, where 0 is North)
 * @returns The appropriate bus image import
 */
export function getBusImageForHeading(heading: number | null): string {
  if (heading === null) {
    return bus180; // Default: front view
  }

  // Normalize heading to 0-360
  let normalizedHeading = ((heading % 360) + 360) % 360;

  // Round to nearest 45 degrees
  const nearest45 = Math.round(normalizedHeading / 45) * 45;
  
  // Handle 360 -> 0
  const imageKey = nearest45 === 360 ? 0 : nearest45;

  return busImages[imageKey] || bus180;
}

/**
 * Get the rotation offset for the bus image
 * Since we have discrete images, we only need small rotation adjustments
 * between the 45-degree increments
 * @param heading - Heading in degrees
 * @returns Fine rotation adjustment in degrees (-22.5 to 22.5)
 */
export function getBusRotationOffset(heading: number | null): number {
  if (heading === null) return 0;

  // Normalize heading
  let normalizedHeading = ((heading % 360) + 360) % 360;

  // Get the nearest 45-degree base
  const nearest45 = Math.round(normalizedHeading / 45) * 45;
  
  // Calculate offset from nearest 45
  const offset = normalizedHeading - nearest45;

  return offset;
}

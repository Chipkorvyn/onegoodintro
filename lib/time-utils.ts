/**
 * Time-related utility functions
 */

/**
 * Format seconds into MM:SS format
 * @param seconds - The number of seconds to format
 * @returns Formatted time string in MM:SS format
 */
export const formatTime = (seconds: number): string => {
  return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;
};
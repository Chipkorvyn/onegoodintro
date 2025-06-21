/**
 * Recording-related utility functions
 */

export type RecordingType = 'request' | 'experience';

/**
 * Get the time limit for different recording types
 * @param recordingType - The type of recording
 * @returns Time limit in seconds
 */
export const getRecordingTimeLimit = (recordingType: RecordingType): number => {
  return recordingType === 'request' ? 20 : 30; // 20s for requests, 30s for experience
};
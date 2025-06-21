/**
 * Profile-related utility functions
 */

export interface ProfileData {
  name: string;
  current: string;
  background: string;
  personal: string;
  role_title: string;
  industry: string;
  experience_years: string;
  focus_area: string;
  learning_focus: string;
  project_description: string;
  project_url: string;
  project_attachment_url?: string;
  project_attachment_type?: 'youtube' | 'website';
  project_attachment_metadata?: any;
}

export interface ProfileCompletion {
  completedFields: number;
  totalFields: number;
  isComplete: boolean;
}

/**
 * Calculate profile completion status
 * @param profileData - The profile data to check
 * @returns Object with completion statistics
 */
export const calculateProfileCompletion = (profileData: ProfileData): ProfileCompletion => {
  const requiredFields = [
    profileData.current,      // Headline under name
    profileData.role_title,   // Job title
    profileData.industry,     // Industry
    profileData.focus_area,   // Focus area
    profileData.experience_years // Experience
  ];
  
  const completedFields = requiredFields.filter(field => field && field.trim() !== '').length;
  const isComplete = completedFields === requiredFields.length;
  
  return { completedFields, totalFields: requiredFields.length, isComplete };
};
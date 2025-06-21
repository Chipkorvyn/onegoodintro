// Shared types for OneGoodIntro components

export type ActiveFieldType = 'challenge' | 'reason' | 'helpType' | 'name' | 'about' | 'linkedin' | 'role_title' | 'industry' | 'experience_years' | 'focus_area' | 'learning_focus' | 'project_description' | 'project_url' | null;

export type ModalIconType = 'handshake' | 'check' | 'heart';

export interface NetworkConnection {
  id: number;
  name: string;
  title: string;
  company: string;
  avatar: string;
  connectionContext: string;
  currentStatus: {
    type: 'looking_for' | 'recently_helped' | 'mutual_benefit';
    text: string;
  }
}

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

export interface VoiceRecordingState {
  isRecording: boolean;
  recordingStartTime: number | null;
  recordingDuration: number;
  audioBlob: Blob | null;
  recordingStage: 'idle' | 'recording' | 'paused' | 'completed';
  timerInterval: NodeJS.Timeout | null;
  transcription: string;
  isTranscribing: boolean;
  showSuccess: boolean;
  hasGeneratedCard: boolean;
  generatedCardData: any | null;
  mediaRecorder: MediaRecorder | null;
  processingStage: 'transcribing' | 'generating' | 'completed' | 'idle';
}

export interface ResumeProcessingState {
  isProcessing: boolean;
  extractionStep: 'idle' | 'extracting' | 'completed' | 'error';
  processingStep: 'idle' | 'processing' | 'completed' | 'error';
  extractedText: string;
  conversationHistory: any[];
  currentResponse: string;
  showSuccessMessage: boolean;
  currentHelpStatement: string;
  currentProof: string;
  fileName: string;
  uploadProgress: number;
  dragActive: boolean;
}

export interface HelpFormData {
  challenge: string;
  reason: string;
  helpType: string;
  attachment?: {
    url: string;
    type: 'youtube' | 'website';
    metadata?: any;
  };
}

export interface MatchState {
  showModal: boolean;
  modalIcon: ModalIconType;
  modalTitle: string;
  modalMessage: string;
  modalConnectionName: string;
  modalHelpType: string;
  modalConnectionReason: string;
  currentMatch: any | null;
}

export interface MessagingState {
  showMessagesModal: boolean;
  selectedConnection: NetworkConnection | null;
  messages: any[];
  messageText: string;
  loadingMessages: boolean;
}

// Component prop interfaces
export interface VoiceRecordingModalProps {
  isOpen: boolean;
  onClose: () => void;
  profileData: ProfileData;
  recordingType: 'profile' | 'request';
  onSuccess: (cardData: any) => void;
}

export interface ResumeUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  profileData: ProfileData;
  onSuccess: (helpStatement: string, proof: string) => void;
}

export interface ProfileEditorProps {
  profileData: ProfileData;
  onProfileChange: (data: ProfileData) => void;
  activeField: ActiveFieldType;
  onFieldChange: (field: ActiveFieldType) => void;
  isCompleted: boolean;
}

export interface MessagingSystemProps {
  connections: NetworkConnection[];
  onConnectionSelect: (connection: NetworkConnection) => void;
  onClose: () => void;
}

export interface HelpRequestFormProps {
  onSubmit: (formData: HelpFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

// API response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

// Database types (from lib/supabase)
export interface User {
  id: string;
  email: string;
  name: string;
  background?: string;
  current_focus?: string;
  linkedin_profile?: string;
  created_at: string;
  updated_at: string;
}

export interface UserProblem {
  id: string;
  user_id: string;
  problem_description: string;
  created_at: string;
}

export interface HelpRequest {
  id: string;
  user_id: string;
  title: string;
  help_type: string;
  proof: string;
  status: 'pending' | 'active' | 'completed';
  created_at: string;
  updated_at: string;
}
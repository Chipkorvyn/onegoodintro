/**
 * ProfileView component for displaying and editing user profile
 */

import React from 'react';
import { 
  User, Users, Plus, Target, Heart, Edit, Trash2, Mic, 
  Camera, X, Link2, Globe
} from 'lucide-react';
import EditableProfileField from '@/components/EditableProfileField';
import { MediaPreview } from '@/components/MediaPreview';
import { isValidUrl, normalizeUrl } from '@/lib/url-processor';

type ActiveFieldType = 'challenge' | 'reason' | 'helpType' | 'name' | 'about' | 'linkedin' | 'role_title' | 'industry' | 'experience_years' | 'focus_area' | 'learning_focus' | 'project_description' | 'project_url' | 'help_title' | 'help_proof' | null;

interface ProfileData {
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
}

interface UserProblem {
  id: string;
  title: string;
  helped_count: number;
}

interface ProjectAttachment {
  url: string;
  type: 'youtube' | 'website';
  metadata?: {
    title?: string;
    description?: string;
    image?: string;
  };
}

interface ProfileViewProps {
  profileData: ProfileData;
  userProblems: UserProblem[];
  photoUrl: string;
  editingField: ActiveFieldType;
  fieldValues: Record<string, string>;
  savingField: ActiveFieldType;
  linkedinUrl: string;
  editingLinkedin: boolean;
  projectUrlInputActive: boolean;
  projectUrlInputValue: string;
  projectUrlProcessing: boolean;
  projectAttachment: ProjectAttachment | null;
  uploadingPhoto: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  aboutRef: React.RefObject<HTMLTextAreaElement | null>;
  resumeStatus: 'empty' | 'processing' | 'complete';
  resumeValue: string;
  onProfileFieldClick: (fieldName: ActiveFieldType) => void;
  onProfileFieldChange: (fieldName: ActiveFieldType, value: string) => void;
  onProfileFieldSave: (fieldName: ActiveFieldType) => void;
  onPhotoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onLinkedinClick: () => void;
  onLinkedinSave: () => void;
  onVoiceStart: (type: 'profile' | 'request') => void;
  onResumeUpload: () => void;
  setEditingField: (field: ActiveFieldType) => void;
  setEditingLinkedin: (editing: boolean) => void;
  setLinkedinUrl: (url: string) => void;
  setProjectUrlInputActive: (active: boolean) => void;
  setProjectUrlInputValue: (value: string) => void;
  handleProjectUrlAdd: () => void;
  handleProjectUrlRemove: () => void;
  getProfileCompletion: () => { completedFields: number; totalFields: number; isComplete: boolean };
}

const ProfileView = ({
  profileData,
  userProblems,
  photoUrl,
  editingField,
  fieldValues,
  savingField,
  linkedinUrl,
  editingLinkedin,
  projectUrlInputActive,
  projectUrlInputValue,
  projectUrlProcessing,
  projectAttachment,
  uploadingPhoto,
  fileInputRef,
  aboutRef,
  resumeStatus,
  resumeValue,
  onProfileFieldClick,
  onProfileFieldChange,
  onProfileFieldSave,
  onPhotoUpload,
  onLinkedinClick,
  onLinkedinSave,
  onVoiceStart,
  onResumeUpload,
  setEditingField,
  setEditingLinkedin,
  setLinkedinUrl,
  setProjectUrlInputActive,
  setProjectUrlInputValue,
  handleProjectUrlAdd,
  handleProjectUrlRemove,
  getProfileCompletion
}: ProfileViewProps) => {
  return (
    <div className="min-h-screen bg-gray-900 pb-20 px-5">
      {/* Header and Stats Container */}
      <div className="max-w-2xl mx-auto bg-gray-900">
        {/* Profile Header - Dark Theme */}
        <div className="p-8 pb-2">
          {/* Avatar - Left aligned */}
          <div className="flex items-start gap-6 mb-3">
            <div className="relative">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-red-400 to-orange-400 flex items-center justify-center text-xl font-semibold text-white">
                {photoUrl ? (
                  <img 
                    src={photoUrl} 
                    alt={profileData.name || 'Profile'} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  profileData.name ? profileData.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'CA'
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={onPhotoUpload}
                className="hidden"
                id="photo-upload"
              />
              <label 
                htmlFor="photo-upload"
                className="absolute -bottom-1 -right-1 w-8 h-8 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-full flex items-center justify-center hover:from-red-600 hover:to-orange-600 transition-all cursor-pointer shadow-lg border-2 border-gray-900"
              >
                {uploadingPhoto ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Camera className="w-4 h-4" />
                )}
              </label>
            </div>
            
            {/* Name & Edit - Right of avatar */}
            <div className="flex-1 pt-2">
              <div className="flex items-center gap-3 mb-2">
                {editingField === 'name' ? (
                  <input
                    type="text"
                    value={fieldValues.name || ''}
                    onChange={(e) => onProfileFieldChange('name', e.target.value)}
                    onBlur={() => onProfileFieldSave('name')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.currentTarget.blur();
                      }
                    }}
                    className="text-2xl font-bold text-white bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Your name"
                  />
                ) : (
                  <h1 
                    onClick={() => onProfileFieldClick('name')}
                    className="text-2xl font-bold text-white cursor-pointer hover:bg-gray-700 px-2 py-1 rounded transition-colors"
                  >
                    {profileData.name || 'Add your name...'}
                  </h1>
                )}
                {savingField === 'name' && <div className="w-4 h-4 border border-gray-400 border-t-transparent rounded-full animate-spin" />}
              </div>

              {/* Profile Completion Indicator */}
              <div className="mb-3">
                {(() => {
                  const { completedFields, totalFields, isComplete } = getProfileCompletion()
                  return (
                    <span className={`text-sm ${isComplete ? 'text-green-400' : 'text-yellow-400'}`}>
                      Profile: {isComplete ? 'Complete ✓' : `${completedFields}/${totalFields} fields`}
                    </span>
                  )
                })()}
              </div>
              
              {/* Role/Title under name */}
              <div className="space-y-3">
                {editingField === 'about' ? (
                  <div className="space-y-2">
                    <textarea
                      ref={aboutRef}
                      value={fieldValues.about || ''}
                      onChange={(e) => onProfileFieldChange('about', e.target.value)}
                      onBlur={() => onProfileFieldSave('about')}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.metaKey) {
                          e.preventDefault();
                          onProfileFieldSave('about');
                        }
                      }}
                      className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none text-base"
                      rows={3}
                      placeholder="AI founder in Zurich with BCG/PwC background. Led €90M+ deals, interim CEO experience."
                    />
                    <p className="text-xs text-gray-500">Press Cmd+Enter to save</p>
                  </div>
                ) : (
                  <div className="flex items-start justify-between">
                    <p 
                      onClick={() => onProfileFieldClick('about')}
                      className="text-sm text-gray-300 leading-relaxed cursor-pointer hover:bg-gray-700 px-2 py-1 rounded transition-colors flex-1"
                    >
                      {profileData.current || 'Add a brief professional summary...'}
                    </p>
                    {savingField === 'about' && <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin ml-2" />}
                  </div>
                )}

                {/* LinkedIn and Resume Section - Combined */}
                <div className="space-y-2">
                  {/* LinkedIn Section */}
                  {linkedinUrl ? (
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={onLinkedinClick}
                        className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors px-2 py-1 rounded-lg"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19a.66.66 0 000 .14V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z"/>
                        </svg>
                        <span className="text-sm font-medium">LinkedIn</span>
                      </button>
                      <button 
                        onClick={() => setEditingLinkedin(true)}
                        className="text-gray-400 hover:text-white hover:bg-gray-700 p-1 rounded"
                      >
                        <Edit className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setEditingLinkedin(true)}
                      className="flex items-center gap-2 text-blue-400 hover:text-blue-300 hover:bg-gray-700 transition-all px-2 py-1 rounded-lg"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19a.66.66 0 000 .14V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z"/>
                      </svg>
                      <span className="text-sm">Add LinkedIn</span>
                    </button>
                  )}

                  {/* LinkedIn Editing Form */}
                  {editingLinkedin && (
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="text"
                        value={linkedinUrl}
                        onChange={(e) => setLinkedinUrl(e.target.value)}
                        placeholder="linkedin.com/in/yourname"
                        className="flex-1 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm focus:ring-1 focus:ring-teal-500 focus:border-transparent text-white"
                      />
                      <button 
                        onClick={onLinkedinSave}
                        className="bg-teal-500 text-white px-2 py-1 rounded text-xs font-medium hover:bg-teal-600"
                      >
                        Save
                      </button>
                      <button 
                        onClick={() => {setEditingLinkedin(false); setLinkedinUrl('');}}
                        className="text-gray-400 hover:text-white"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}

                  {/* Resume Section */}
                  <div className="mt-2">
                    {resumeStatus === 'complete' ? (
                      <div className="flex items-center gap-2">
                        <button className="flex items-center gap-2 text-green-400 hover:text-green-300 transition-colors px-2 py-1 rounded-lg">
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"/>
                            <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
                          </svg>
                          <span className="text-sm font-medium">Resume Uploaded ✓</span>
                        </button>
                        <button 
                          onClick={onResumeUpload}
                          className="text-gray-400 hover:text-white hover:bg-gray-700 p-1 rounded"
                        >
                          <Edit className="h-3 w-3" />
                        </button>
                      </div>
                    ) : resumeStatus === 'processing' ? (
                      <div className="flex items-center gap-2 text-blue-400">
                        <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-sm">Processing resume...</span>
                      </div>
                    ) : (
                      <button 
                        onClick={onResumeUpload}
                        className="flex items-center gap-2 text-gray-400 hover:text-white hover:bg-gray-700 transition-all px-2 py-1 rounded-lg"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"/>
                          <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
                        </svg>
                        <span className="text-sm">Upload Resume</span>
                      </button>
                    )}
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section - Dark Surface Box */}
        <div className="flex justify-center gap-8 p-4 bg-gray-800 rounded-2xl shadow-sm border border-gray-700 mb-6">
          <div className="text-center">
            <span className="text-2xl font-bold text-white block">{userProblems.reduce((acc, p) => acc + p.helped_count, 0)}</span>
            <div className="text-xs text-gray-400 uppercase tracking-wide font-medium">People Helped</div>
          </div>
          <div className="text-center">
            <span className="text-2xl font-bold text-white block">{userProblems.length}</span>
            <div className="text-xs text-gray-400 uppercase tracking-wide font-medium">Help Areas</div>
          </div>
        </div>
      </div>

      {/* Cards Container - With Padding */}
      <div className="px-5 space-y-8">
        {/* Professional Background Card */}
        <div className="bg-gray-800 w-full rounded-lg shadow-sm border border-gray-700 mb-6">
          <div className="p-4 relative">
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-xs text-gray-400 uppercase tracking-wide">Professional background</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <EditableProfileField
                fieldName={'role_title' as const}
                value={profileData.role_title}
                placeholder="Add your job title..."
                icon={Users}
                isEditing={editingField === 'role_title'}
                fieldValues={fieldValues}
                onFieldClick={onProfileFieldClick}
                onFieldChange={onProfileFieldChange}
                onFieldSave={onProfileFieldSave}
              />
              
              <EditableProfileField
                fieldName={'industry' as const}
                value={profileData.industry}
                placeholder="Add your industry..."
                icon={Target}
                isEditing={editingField === 'industry'}
                fieldValues={fieldValues}
                onFieldClick={onProfileFieldClick}
                onFieldChange={onProfileFieldChange}
                onFieldSave={onProfileFieldSave}
              />
              
              <EditableProfileField
                fieldName={'experience_years' as const}
                value={profileData.experience_years}
                placeholder="Add your experience..."
                icon={User}
                isEditing={editingField === 'experience_years'}
                fieldValues={fieldValues}
                onFieldClick={onProfileFieldClick}
                onFieldChange={onProfileFieldChange}
                onFieldSave={onProfileFieldSave}
              />
              
              <EditableProfileField
                fieldName={'focus_area' as const}
                value={profileData.focus_area}
                placeholder="Add your focus area..."
                icon={Heart}
                isEditing={editingField === 'focus_area'}
                fieldValues={fieldValues}
                onFieldClick={onProfileFieldClick}
                onFieldChange={onProfileFieldChange}
                onFieldSave={onProfileFieldSave}
              />
            </div>
          </div>
        </div>

        {/* Learning Section - Expanded */}
        <div className="bg-gray-800 w-full rounded-xl shadow-lg hover:shadow-xl transition-all border border-gray-700 p-8 mb-6">
          <div className="relative">
            <div className="mb-6">
              <h3 className="text-base text-gray-400 font-medium">What I'm learning now</h3>
            </div>
            {editingField === 'learning_focus' ? (
              <div className="space-y-3">
                <textarea
                  value={fieldValues.learning_focus || ''}
                  onChange={(e) => onProfileFieldChange('learning_focus', e.target.value)}
                  onBlur={() => onProfileFieldSave('learning_focus')}
                  maxLength={200}
                  rows={4}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-white resize-none text-xl font-medium"
                  placeholder="What are you learning? (e.g., ChatGPT for better emails and social posts. Figma basics for mockups. Trying to understand analytics better...)"
                />
                <div className="flex gap-2">
                  <button 
                    onClick={() => onProfileFieldSave('learning_focus')} 
                    className="bg-teal-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-600"
                  >
                    Save
                  </button>
                  <button 
                    onClick={() => setEditingField(null)} 
                    className="bg-gray-600 text-gray-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-500"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p 
                onClick={() => onProfileFieldClick('learning_focus')}
                className="text-white leading-relaxed text-2xl font-medium cursor-pointer hover:bg-gray-700 px-2 py-1 rounded transition-colors"
              >
                {profileData.learning_focus || 'ChatGPT for better emails and social posts. Figma basics for mockups. Trying to understand analytics better so I can actually see what\'s working.'}
              </p>
            )}
          </div>
        </div>

        {/* Projects Section - Compact */}
        <div className="bg-gray-800 w-full rounded-lg shadow-sm border-2 border-orange-400 mb-6">
          <div className="p-4 relative">
            <div className="mb-3">
              <h3 className="text-xs text-orange-400 uppercase tracking-wide">What I'm working on</h3>
            </div>
            {editingField === 'project_description' ? (
              <div className="space-y-3">
                <textarea
                  value={fieldValues.project_description || ''}
                  onChange={(e) => onProfileFieldChange('project_description', e.target.value)}
                  rows={3}
                  className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm focus:ring-1 focus:ring-orange-500 focus:border-transparent text-white resize-none"
                  placeholder="What project are you working on?"
                />
                <div className="flex gap-2">
                  <button 
                    onClick={() => onProfileFieldSave('project_description')}
                    className="bg-orange-500 text-white px-3 py-1 rounded text-xs font-medium hover:bg-orange-600"
                  >
                    Save
                  </button>
                  <button 
                    onClick={() => setEditingField(null)}
                    className="bg-gray-600 text-gray-300 px-3 py-1 rounded text-xs font-medium hover:bg-gray-500"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p 
                  onClick={() => onProfileFieldClick('project_description')}
                  className="text-white leading-relaxed text-sm mb-3 cursor-pointer hover:bg-gray-700 px-1 py-1 rounded transition-colors"
                >
                  {profileData.project_description || 'Building a simple website to showcase my marketing work. Learning Webflow and loving how easy it makes everything!'}
                </p>
                
                {/* Project URL attachment section */}
                <div className="mt-4">
                  {projectUrlInputActive ? (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <div className="flex-1 relative">
                          <input
                            type="url"
                            value={projectUrlInputValue}
                            onChange={(e) => setProjectUrlInputValue(e.target.value)}
                            placeholder="Paste URL here..."
                            className="w-full px-3 py-1.5 pr-8 bg-gray-700 border border-gray-600 rounded text-sm text-white placeholder-gray-400 focus:ring-1 focus:ring-orange-500 focus:border-transparent"
                            disabled={projectUrlProcessing}
                          />
                          {projectUrlProcessing && (
                            <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                              <div className="w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                          )}
                        </div>
                        <button 
                          onClick={handleProjectUrlAdd}
                          disabled={!projectUrlInputValue.trim() || projectUrlProcessing}
                          className="bg-orange-500 text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Add
                        </button>
                        <button 
                          onClick={() => {
                            setProjectUrlInputActive(false);
                            setProjectUrlInputValue('');
                          }}
                          className="text-gray-400 hover:text-white p-1.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {projectAttachment ? (
                        <div className="mt-3">
                          <div className="bg-gray-700 rounded-lg p-3 border border-gray-600">
                            <div className="flex items-start gap-3">
                              <div className="flex-1">
                                <MediaPreview 
                                  url={projectAttachment.url}
                                  type={projectAttachment.type}
                                  metadata={projectAttachment.metadata}
                                />
                              </div>
                              <button 
                                onClick={handleProjectUrlRemove}
                                className="text-gray-400 hover:text-red-400 p-1 rounded shrink-0"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <button 
                          onClick={() => setProjectUrlInputActive(true)}
                          className="flex items-center gap-2 text-orange-400 hover:text-orange-300 text-xs"
                        >
                          <Link2 className="h-3 w-3" />
                          <span>Add link</span>
                        </button>
                      )}
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Resume Processing Section */}
        <div className="bg-gray-800 w-full rounded-lg shadow-sm border border-gray-700 mb-6">
          <div className="p-4 relative">
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-xs text-gray-400 uppercase tracking-wide">Resume Processing</h3>
            </div>
            
            {resumeStatus === 'processing' ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <h3 className="text-lg font-semibold text-white mb-2">Processing your resume...</h3>
                  <p className="text-gray-400 text-sm">AI is extracting your skills and creating help cards</p>
                </div>
              </div>
            ) : resumeStatus === 'complete' ? (
              <div className="flex items-center justify-center py-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-base font-semibold text-white mb-2">Resume processed successfully!</h3>
                  <p className="text-gray-400 text-sm">Your help areas have been extracted and added below</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-base font-semibold text-white mb-2">Upload your resume</h3>
                  <p className="text-gray-400 text-sm mb-4">AI will extract your skills and create help areas automatically</p>
                  <button 
                    onClick={onResumeUpload}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-600 transition-colors"
                  >
                    Process Resume
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Voice Recording Section */}
        <div className="bg-gray-800 w-full rounded-lg shadow-sm border border-gray-700 mb-6">
          <div className="p-4 relative">
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-xs text-gray-400 uppercase tracking-wide">Add Help Areas by Voice</h3>
            </div>
            
            <div className="flex items-center justify-center py-6">
              <div className="text-center">
                <button 
                  onClick={() => onVoiceStart('profile')}
                  className="w-16 h-16 bg-teal-500 hover:bg-teal-600 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors group"
                >
                  <Mic className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
                </button>
                <h3 className="text-base font-semibold text-white mb-2">Record what you can help with</h3>
                <p className="text-gray-400 text-sm">Speak naturally about your expertise and we'll create help areas</p>
              </div>
            </div>
          </div>
        </div>

        {/* What I can help with section */}
        <div className="bg-gray-800 w-full rounded-lg shadow-sm border border-gray-700 mb-6">
          <div className="p-4 relative">
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-xs text-gray-400 uppercase tracking-wide">What I can help with</h3>
            </div>
            
            <div className="space-y-4">
              {userProblems?.map((problem, index) => (
                <div key={problem.id} className="group bg-gray-800 rounded-lg border-2 border-teal-500 shadow-sm">
                  {/* Green border card with teal-500 */}
                  <div className="p-4">
                    {/* "I can help" - left aligned, grey */}
                    <h3 className="text-gray-400 text-sm font-semibold mb-4 text-left">I can help</h3>
                    
                    {/* Content 1: What I can help with - White, left aligned, larger font */}
                    <div className="mb-4">
                      {editingField === 'help_title' ? (
                        <div className="space-y-2">
                          <textarea
                            value={fieldValues.help_title || problem?.title || ''}
                            onChange={(e) => onProfileFieldChange('help_title', e.target.value)}
                            onBlur={() => onProfileFieldSave('help_title')}
                            className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none text-lg font-medium"
                            rows={2}
                            placeholder="What can you help with?"
                          />
                          <div className="flex gap-2">
                            <button 
                              onClick={() => onProfileFieldSave('help_title')} 
                              className="bg-teal-500 text-white px-3 py-1 rounded text-sm font-medium hover:bg-teal-600"
                            >
                              Save
                            </button>
                            <button 
                              onClick={() => setEditingField(null)} 
                              className="bg-gray-600 text-gray-300 px-3 py-1 rounded text-sm font-medium hover:bg-gray-500"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <h4 
                          onClick={() => onProfileFieldClick('help_title')}
                          className="text-white text-lg font-medium text-left cursor-pointer hover:bg-gray-700 px-2 py-1 rounded transition-colors"
                        >
                          {problem?.title || 'What can you help with?'}
                        </h4>
                      )}
                    </div>

                    {/* Content 2: Why I can help - Grey, left aligned, smaller font */}
                    <div className="mb-4">
                      {editingField === 'help_proof' ? (
                        <div className="space-y-2">
                          <textarea
                            value={fieldValues.help_proof || problem?.proof || ''}
                            onChange={(e) => onProfileFieldChange('help_proof', e.target.value)}
                            onBlur={() => onProfileFieldSave('help_proof')}
                            className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none text-sm"
                            rows={3}
                            placeholder="Why can you help with this?"
                          />
                          <div className="flex gap-2">
                            <button 
                              onClick={() => onProfileFieldSave('help_proof')} 
                              className="bg-teal-500 text-white px-3 py-1 rounded text-sm font-medium hover:bg-teal-600"
                            >
                              Save
                            </button>
                            <button 
                              onClick={() => setEditingField(null)} 
                              className="bg-gray-600 text-gray-300 px-3 py-1 rounded text-sm font-medium hover:bg-gray-500"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p 
                          onClick={() => onProfileFieldClick('help_proof')}
                          className="text-gray-400 text-sm text-left cursor-pointer hover:bg-gray-700 px-2 py-1 rounded transition-colors leading-relaxed"
                        >
                          {problem?.proof || 'Why can you help with this?'}
                        </p>
                      )}
                    </div>

                    {/* Media/Website section */}
                    <div className="mb-4">
                      {problem?.attachment_url ? (
                        <div className="bg-gray-700 rounded-lg p-3 border border-gray-600">
                          <div className="flex items-start gap-3">
                            <div className="flex-1">
                              <MediaPreview 
                                url={problem.attachment_url}
                                type={problem.attachment_type || 'website'}
                                metadata={problem.attachment_metadata}
                              />
                            </div>
                            <div className="flex gap-1">
                              <button className="text-gray-400 hover:text-white p-1 rounded">
                                <Edit className="h-3 w-3" />
                              </button>
                              <button className="text-gray-400 hover:text-red-400 p-1 rounded">
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <button className="flex items-center gap-2 text-gray-400 hover:text-teal-400 text-sm">
                          <Plus className="h-3 w-3" />
                          <span>Add website or media</span>
                        </button>
                      )}
                    </div>

                    {/* Edit/Delete buttons */}
                    <div className="flex items-center justify-end pt-3 border-t border-gray-700">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="text-gray-400 hover:text-white p-1 rounded">
                          <Edit className="h-3 w-3" />
                        </button>
                        <button className="text-gray-400 hover:text-red-400 p-1 rounded">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {userProblems && userProblems.length > 0 && (
                <button 
                  onClick={() => onVoiceStart('profile')}
                  className="w-full py-4 border border-dashed border-gray-600 rounded-lg text-gray-400 hover:border-gray-500 hover:text-gray-300 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  <span className="text-sm">Add more help areas</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileView;
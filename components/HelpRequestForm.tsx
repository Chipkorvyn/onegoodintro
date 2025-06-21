/**
 * HelpRequestForm component for managing help requests
 */

import React from 'react';
import { Mic, Edit, Trash2, Plus, X } from 'lucide-react';
import { HelpRequest, timeAgo } from '@/lib/supabase';

interface HelpForm {
  challenge: string;
  reason: string;
  helpType: string;
  website?: string;
  media?: string;
  attachment?: {
    url: string;
    type: 'youtube' | 'website';
    metadata?: Record<string, unknown>;
  };
}

interface HelpRequestFormProps {
  userRequests: HelpRequest[];
  matchingFrequency: 'daily' | 'weekly' | 'off';
  helpForm: HelpForm;
  showNewRequestModal: boolean;
  editingRequest: string | null;
  editingRequestData: {
    challenge: string;
    reason: string;
    help_type: string;
    timeline: 'standard' | 'urgent' | 'flexible';
    website?: string;
    media?: string;
  };
  onMatchingFrequencyChange: (frequency: 'daily' | 'weekly' | 'off') => void;
  onHelpFormChange: (form: HelpForm) => void;
  onShowNewRequestModal: (show: boolean) => void;
  onVoiceStart: (type: 'profile' | 'request') => void;
  onManualRequestSubmit: () => Promise<void>;
  onDeleteRequest: (id: string) => Promise<void>;
  onEditRequest: (id: string) => void;
  onSaveRequestEdit: (id: string) => Promise<void>;
  onEditingRequestChange: (data: { challenge: string; reason: string; help_type: string; timeline: 'standard' | 'urgent' | 'flexible'; website?: string; media?: string; }) => void;
  onCancelEdit: () => void;
  loadingRequests?: boolean;
}

const HelpRequestForm = ({
  userRequests,
  matchingFrequency,
  helpForm,
  showNewRequestModal,
  editingRequest,
  editingRequestData,
  onMatchingFrequencyChange,
  onHelpFormChange,
  onShowNewRequestModal,
  onVoiceStart,
  onManualRequestSubmit,
  onDeleteRequest,
  onEditRequest,
  onSaveRequestEdit,
  onEditingRequestChange,
  onCancelEdit,
  loadingRequests = false
}: HelpRequestFormProps) => {
  return (
    <div className="min-h-screen bg-gray-900 pb-20 px-5">
      {/* Header */}
      <div className="max-w-2xl mx-auto px-5 py-10 bg-gray-900">
        <h1 className="text-2xl font-bold text-white mb-1 text-left">What help do you need?</h1>
        <p className="mb-3 text-left">
          <span className="text-teal-400">✓ Peer advice & insights</span> • 
          <span className="text-teal-400">✓ Professional introductions</span> • 
          <span className="text-red-400">✗ Sales & recruiting</span>
        </p>
      </div>

      {/* Experience section - match profile page exactly */}
      <div className="px-5 space-y-4">
        <div className="flex items-center justify-between mb-6 mt-2">
          <div className="flex">
            {(['daily', 'weekly', 'off'] as const).map((option, index) => (
              <button
                key={option}
                onClick={() => onMatchingFrequencyChange(option)}
                className={`
                  px-3 py-1.5 text-sm font-medium transition-colors
                  ${index === 0 ? 'rounded-l-md' : ''}
                  ${index === 2 ? 'rounded-r-md' : ''}
                  ${matchingFrequency === option 
                    ? 'bg-teal-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }
                  border border-gray-600
                  ${index > 0 ? 'border-l-0' : ''}
                `}
              >
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <button 
                onClick={() => onVoiceStart('request')}
                className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <Mic className="w-4 h-4" />
                Voice
              </button>
            </div>
          </div>
        </div>

        {/* User Requests List */}
        <div className="bg-gray-800 rounded-2xl shadow-sm border border-gray-700">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Your Requests</h3>
              <button
                onClick={() => onShowNewRequestModal(true)}
                className="flex items-center gap-2 text-teal-400 hover:text-teal-300 text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Add Request
              </button>
            </div>

            {loadingRequests ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-teal-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-400">Loading your requests...</p>
              </div>
            ) : userRequests.length > 0 ? (
              <div className="space-y-4">
                {userRequests.map((request) => {
                  const isEditing = editingRequest === request.id;
                  
                  return (
                  <div key={request.id} className="rounded-lg p-4 border bg-gray-700 border-gray-600">
                    {isEditing ? (
                      // Edit Mode - Single field only
                      <div className="space-y-2">
                        <textarea
                          value={editingRequestData.challenge}
                          onChange={(e) => onEditingRequestChange({
                            ...editingRequestData,
                            challenge: e.target.value
                          })}
                          onBlur={() => onSaveRequestEdit(request.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && e.metaKey) {
                              e.preventDefault();
                              onSaveRequestEdit(request.id);
                            }
                          }}
                          className="w-full bg-gray-800 text-white rounded-lg p-3 text-sm border border-gray-600 focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                          rows={3}
                          placeholder="Describe what help you need..."
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => onSaveRequestEdit(request.id)}
                            className="bg-teal-500 text-white px-3 py-1 rounded text-sm font-medium hover:bg-teal-600"
                          >
                            Save
                          </button>
                          <button
                            onClick={onCancelEdit}
                            className="bg-gray-600 text-gray-300 px-3 py-1 rounded text-sm font-medium hover:bg-gray-500"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      // View Mode
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-white text-sm mb-2">{request.title || request.challenge}</h4>
                          {(() => {
                            const proofText = request.proof || request.reason || '';
                            // Filter out placeholder text
                            if (proofText === 'Created via voice recording' || proofText.toLowerCase().includes('created via voice')) {
                              return null;
                            }
                            return proofText ? (
                              <p className="text-gray-300 text-xs mb-2">{proofText}</p>
                            ) : null;
                          })()}
                          {(request.website || request.media) && (
                            <div className="flex items-center gap-2 mb-2">
                              {request.website && (
                                <a 
                                  href={request.website} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-teal-400 hover:text-teal-300 text-xs underline"
                                >
                                  Website
                                </a>
                              )}
                              {request.website && request.media && <span className="text-gray-500">•</span>}
                              {request.media && (
                                <a 
                                  href={request.media} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-400 hover:text-blue-300 text-xs underline"
                                >
                                  Media
                                </a>
                              )}
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500 text-xs">
                              Created {timeAgo(request.created_at)}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => onEditRequest(request.id)}
                            className="text-gray-400 hover:text-white p-1 rounded"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeleteRequest(request.id)}
                            className="text-gray-400 hover:text-red-400 p-1 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plus className="w-8 h-8 text-gray-500" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">No requests yet</h3>
                <p className="text-gray-400 mb-4">Start by adding your first help request</p>
                <button
                  onClick={() => onShowNewRequestModal(true)}
                  className="bg-teal-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-teal-600 transition-colors"
                >
                  Create First Request
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Sheet Modal for New Request */}
      {showNewRequestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50">
          <div className="bg-gray-800 rounded-t-2xl w-full max-w-2xl mx-auto transform transition-transform duration-300 ease-out">
            <div className="p-6 space-y-4">
              {/* Modal Header */}
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Add Help Request</h2>
                <button 
                  onClick={() => onShowNewRequestModal(false)}
                  className="text-gray-400 hover:text-white p-2"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Request details */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Your Request
                </label>
                <textarea
                  value={helpForm.challenge}
                  onChange={(e) => onHelpFormChange({ 
                    ...helpForm, 
                    challenge: e.target.value
                  })}
                  placeholder="I need help with finding a technical co-founder because I don't have a development background. I'd like to talk to someone who has built a SaaS product from scratch."
                  className="w-full bg-gray-800 text-white rounded-lg p-3 text-sm border border-gray-700 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  rows={4}
                />
              </div>

              {/* Additional fields */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Website (optional)
                  </label>
                  <input
                    type="url"
                    value={helpForm.website || ''}
                    onChange={(e) => onHelpFormChange({ 
                      ...helpForm, 
                      website: e.target.value
                    })}
                    placeholder="https://..."
                    className="w-full bg-gray-800 text-white rounded-lg p-2 text-sm border border-gray-700 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Media (optional)
                  </label>
                  <input
                    type="text"
                    value={helpForm.media || ''}
                    onChange={(e) => onHelpFormChange({ 
                      ...helpForm, 
                      media: e.target.value
                    })}
                    placeholder="Image, video, or media URL"
                    className="w-full bg-gray-800 text-white rounded-lg p-2 text-sm border border-gray-700 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-3">
                <button
                  onClick={onManualRequestSubmit}
                  disabled={!helpForm.challenge.trim()}
                  className="flex-1 bg-teal-500 text-white py-3 rounded-lg font-semibold hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Add Request
                </button>
                <button
                  onClick={() => onShowNewRequestModal(false)}
                  className="px-6 bg-gray-700 text-white py-3 rounded-lg font-semibold hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HelpRequestForm;
'use client';
import React, { useState, useRef } from 'react';
import { X } from 'lucide-react';
import { ResumeUploadModalProps } from './types';

export const ResumeUploadModal: React.FC<ResumeUploadModalProps> = ({
  isOpen,
  onClose,
  profileData,
  onSuccess
}) => {
  // Resume processing state
  const [resumeState, setResumeState] = useState<'initial' | 'processing' | 'complete' | 'error'>('initial');
  const [resumeError, setResumeError] = useState('');
  const [resumeProgress, setResumeProgress] = useState(0);
  const [resumeFilename, setResumeFilename] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleResumeButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleResumeUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setResumeFilename(file.name);
    setResumeState('processing');
    setResumeError('');
    setResumeProgress(0);

    try {
      // Step 1: Extract text from resume
      const formData = new FormData();
      formData.append('file', file);

      setResumeProgress(20);

      const extractResponse = await fetch('/api/extract-resume', {
        method: 'POST',
        body: formData
      });

      if (!extractResponse.ok) {
        const errorData = await extractResponse.json();
        throw new Error(errorData.error || 'Failed to extract text from resume');
      }

      const { text: extractedText } = await extractResponse.json();
      setResumeProgress(50);

      // Step 2: Process the extracted text to generate help statements
      const processResponse = await fetch('/api/process-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeText: extractedText,
          conversationHistory: []
        })
      });

      if (!processResponse.ok) {
        const errorData = await processResponse.json();
        throw new Error(errorData.error || 'Failed to process resume');
      }

      const result = await processResponse.json();
      setResumeProgress(100);

      // Parse the help statement and proof from the result
      let helpStatement = '';
      let proof = '';

      if (result.helpStatement && result.proof) {
        helpStatement = result.helpStatement;
        proof = result.proof;
      } else if (result.content) {
        // Try to extract from content if structured response not available
        const content = result.content;
        const helpMatch = content.match(/\*\*You can help with:\*\*\s*(.*?)(?=\*\*Because:|$)/s);
        const proofMatch = content.match(/\*\*Because:\*\*\s*(.*?)(?=\*\*|$)/s);
        
        if (helpMatch && proofMatch) {
          helpStatement = helpMatch[1].trim();
          proof = proofMatch[1].trim();
        }
      }

      if (!helpStatement || !proof) {
        throw new Error('Could not extract help information from resume');
      }

      setTimeout(() => {
        setResumeState('complete');
        onSuccess(helpStatement, proof);
      }, 500);

    } catch (error) {
      console.error('Resume processing error:', error);
      setResumeError(error instanceof Error ? error.message : 'An unknown error occurred');
      setResumeState('error');
      setResumeProgress(0);
    }

    // Clear the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRetry = () => {
    setResumeState('initial');
    setResumeError('');
    setResumeProgress(0);
    setResumeFilename('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center border border-gray-700 relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        {resumeState === 'initial' && (
          <>
            <div className="w-12 h-12 bg-teal-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Upload Resume</h3>
            <p className="text-gray-400 mb-6 text-sm leading-relaxed">
              We'll find areas where you can help others based on your experience
            </p>
            {resumeError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-sm text-red-400">{resumeError}</p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleResumeUpload}
              className="hidden"
            />
            <button 
              onClick={handleResumeButtonClick}
              className="w-full bg-teal-500 text-white py-3 rounded-lg font-semibold hover:bg-teal-600 transition-colors mb-4"
            >
              Choose File
            </button>
            <p className="text-xs text-gray-500">Supports PDF, DOC, DOCX (Max 5MB)</p>
          </>
        )}

        {resumeState === 'processing' && (
          <>
            <div className="w-12 h-12 bg-teal-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Processing resume...</h3>
            <p className="text-gray-400 mb-4">{resumeFilename || 'Resume.pdf'}</p>
            <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
              <div 
                className="bg-teal-500 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${resumeProgress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-400">
              {resumeProgress < 50 ? 'Extracting text...' : 'Analyzing experience...'}
            </p>
          </>
        )}

        {resumeState === 'complete' && (
          <>
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Resume Processed!</h3>
            <p className="text-gray-400 mb-4">
              Found areas where you can help others based on your experience.
            </p>
            <button 
              onClick={onClose}
              className="w-full bg-teal-500 text-white py-3 rounded-lg font-semibold hover:bg-teal-600 transition-colors"
            >
              Continue
            </button>
          </>
        )}

        {resumeState === 'error' && (
          <>
            <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Upload Failed</h3>
            <p className="text-gray-400 mb-4 text-sm">{resumeError || 'Failed to process resume'}</p>
            <div className="space-y-3">
              <button 
                onClick={handleRetry}
                className="w-full bg-teal-500 text-white py-3 rounded-lg font-semibold hover:bg-teal-600 transition-colors"
              >
                Try Again
              </button>
              <button 
                onClick={onClose}
                className="w-full bg-gray-700 text-white py-3 rounded-lg font-semibold hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
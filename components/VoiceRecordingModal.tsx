'use client';
import React, { useState, useRef, useEffect } from 'react';
import { X, Mic } from 'lucide-react';
import { VoiceRecordingModalProps, VoiceRecordingState } from './types';

export const VoiceRecordingModal: React.FC<VoiceRecordingModalProps> = ({
  isOpen,
  onClose,
  profileData,
  recordingType,
  onSuccess
}) => {
  // Voice recording state
  const [voiceState, setVoiceState] = useState<'initial' | 'recording' | 'processing'>('initial');
  const [recordingTime, setRecordingTime] = useState<number>(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [isRecordingLimitReached, setIsRecordingLimitReached] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Recording time limits
  const getRecordingTimeLimit = () => recordingType === 'profile' ? 60 : 90;

  // Timer effect
  useEffect(() => {
    if (voiceState === 'recording') {
      intervalRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          const limit = getRecordingTimeLimit();
          
          if (newTime >= limit) {
            setIsRecordingLimitReached(true);
            // Auto-stop recording when limit reached
            setTimeout(() => {
              if (mediaRecorder && mediaRecorder.state === 'recording') {
                handleVoiceStop();
              }
            }, 1000);
          }
          
          return newTime;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [voiceState, recordingType, mediaRecorder]);

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Voice recording handlers
  const handleVoiceRecord = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const audioChunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        await processVoiceRecording(audioBlob);
        
        // Clean up stream
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setVoiceState('recording');
      setRecordingTime(0);
      setIsRecordingLimitReached(false);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Microphone access required for voice recording.');
    }
  };

  const handleVoiceStop = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      setVoiceState('processing');
    }
  };

  const processVoiceRecording = async (audioBlob: Blob) => {
    try {
      // Transcribe audio
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      const transcriptionResponse = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData
      });

      if (!transcriptionResponse.ok) {
        throw new Error('Transcription failed');
      }

      const { transcript } = await transcriptionResponse.json();

      if (recordingType === 'profile') {
        // Generate help card from transcript
        const cardResponse = await fetch('/api/generate-card', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ transcript })
        });

        if (!cardResponse.ok) {
          throw new Error('Card generation failed');
        }

        const response = await cardResponse.json();
        console.log('Card API response:', response);
        
        // Extract the actual card data from the response
        const cardData = response.data || response;
        
        // Call success callback with card data
        onSuccess(cardData);
        
        // Close modal
        onClose();
      } else {
        // Generate help request from transcript
        const requestResponse = await fetch('/api/generate-request', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            transcript,
            profileData: {
              name: profileData.name,
              background: profileData.background,
              current: profileData.current
            }
          })
        });

        if (!requestResponse.ok) {
          throw new Error('Request generation failed');
        }

        const response = await requestResponse.json();
        console.log('Request API response:', response);
        
        // Extract the actual request data from the response
        const requestData = response.data || response;
        
        // Call success callback with request data
        onSuccess(requestData);
        
        // Close modal
        onClose();
      }
    } catch (error) {
      console.error('Error processing voice recording:', error);
      alert('Error processing recording. Please try again.');
      setVoiceState('initial');
    }
  };

  // Set recording type when modal opens
  useEffect(() => {
    if (isOpen) {
      setVoiceState('initial');
      setRecordingTime(0);
      setIsRecordingLimitReached(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-2xl shadow-2xl max-w-sm w-full max-h-[85vh] overflow-y-auto border border-gray-700">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white z-10"
        >
          <X className="h-5 w-5" />
        </button>

        {voiceState === 'initial' && (
          <>
            {/* Header */}
            <div className="p-5 text-center relative">
              <div className="w-10 h-1 bg-gray-600 rounded-full mx-auto mb-4"></div>
              <div className="text-lg font-bold text-white">
                {recordingType === 'profile' 
                  ? 'Follow this template for a better profile'
                  : 'Follow this template for better matching'}
              </div>
              <div className="text-sm text-teal-400 mt-2">
                Keep it under {getRecordingTimeLimit()} seconds
              </div>
            </div>
            
            <div className="p-5">
              {/* Template Paragraph */}
              <div className="bg-gray-700 rounded-2xl shadow-sm p-6 mb-6 text-base leading-relaxed border border-gray-600">
                <div className="text-white">
                  {recordingType === 'profile' ? (
                    <>
                      <div className="mb-2">
                        I can help with{' '}
                        <span className="inline-block min-w-[120px] px-3 py-1 rounded bg-gray-600 text-gray-300 border border-gray-500">
                          managing remote teams
                        </span>
                      </div>
                      <div>
                        because{' '}
                        <span className="inline-block min-w-[120px] px-3 py-1 rounded bg-gray-600 text-gray-300 border border-gray-500">
                          I led 15 people across 4 countries for 3 years
                        </span>.
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="mb-2">
                        I need help with{' '}
                        <span className="inline-block min-w-[120px] px-3 py-1 rounded bg-gray-600 text-gray-300 border border-gray-500">
                          finding a developer
                        </span>
                      </div>
                      <div className="mb-2">
                        because{' '}
                        <span className="inline-block min-w-[120px] px-3 py-1 rounded bg-gray-600 text-gray-300 border border-gray-500">
                          I am not technical myself
                        </span>
                      </div>
                      <div>
                        I'd like to talk to someone who{' '}
                        <span className="inline-block min-w-[120px] px-3 py-1 rounded bg-gray-600 text-gray-300 border border-gray-500">
                          has built an ecommerce website
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>


              {/* Record Button */}
              <div className="text-center mb-4">
                <button 
                  onClick={handleVoiceRecord}
                  className="w-20 h-20 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 rounded-full flex items-center justify-center text-white font-semibold mx-auto transition-all shadow-lg"
                >
                  <div className="text-center">
                    <Mic className="w-8 h-8 mb-1" strokeWidth={2.5} />
                    <div className="text-xs">Hold</div>
                  </div>
                </button>
              </div>
              
              <p className="text-center text-sm text-gray-400">
                Hold to record your {recordingType === 'profile' ? 'experience' : 'request'}
                {' '}(max {getRecordingTimeLimit()} seconds)
              </p>
            </div>
          </>
        )}

        {voiceState === 'recording' && (
          <div className="p-8 text-center">
            <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
              <div className="w-6 h-6 bg-white rounded-full"></div>
            </div>
            <h3 className="text-xl font-bold text-white mb-4">Recording...</h3>
            <div className="text-3xl font-mono text-gray-300 mb-2">⏱️ {formatTime(recordingTime)}</div>
            <div className="text-sm text-gray-400 mb-4">
              {getRecordingTimeLimit() - recordingTime}s remaining
            </div>
            <button 
              onClick={handleVoiceStop}
              className="bg-gray-700 text-white px-8 py-3 rounded-lg hover:bg-gray-600 transition-colors font-semibold border border-gray-600"
            >
              Stop Recording
            </button>
            {isRecordingLimitReached && (
              <div className="text-red-400 text-sm mt-2">
                Time limit reached - processing recording...
              </div>
            )}
          </div>
        )}

        {voiceState === 'processing' && (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-4">
              Creating your {recordingType === 'profile' ? 'experience card' : 'help request'}...
            </h3>
            <div className="flex justify-center">
              <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
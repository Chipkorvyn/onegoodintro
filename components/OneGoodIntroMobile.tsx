'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { User, CheckCircle, Users, Plus, Zap, Target, Heart, Network, Handshake, MessageCircle, Check, MapPin, Building2, X, Edit, Trash2, Mic, Brain, ArrowRight, TrendingUp, Phone, Link2, Globe, Send } from 'lucide-react';
import { useSession, signIn, signOut } from 'next-auth/react'
import { supabase, type User as DbUser, type UserProblem, type HelpRequest, timeAgo } from '@/lib/supabase'
import { MediaPreview } from '@/components/MediaPreview'
import { processMediaUrl, isValidUrl, normalizeUrl } from '@/lib/url-processor'

// Define proper types
type ActiveFieldType = 'challenge' | 'reason' | 'helpType' | 'name' | 'about' | 'linkedin' | 'role_title' | 'industry' | 'experience_years' | 'focus_area' | 'learning_focus' | 'project_description' | 'project_url' | null;
type ModalIconType = 'handshake' | 'check' | 'heart';

// Add NetworkConnection interface
interface NetworkConnection {
  id: number;
  name: string;
  company: string;
  avatar: string;
  connectionContext: string;
  currentStatus: {
    type: 'looking_for' | 'recently_helped';
    text: string;
  }
}

// Add ProfileData type definition
type ProfileData = {
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
};

const OneGoodIntroMobile = () => {
  
  // Session and user data
  const { data: session, status } = useSession()
  const [profileData, setProfileData] = useState<ProfileData>({
    name: '',
    current: '',
    background: '',
    personal: '',
    role_title: '',
    industry: '',
    experience_years: '',
    focus_area: '',
    learning_focus: '',
    project_description: '',
    project_url: ''
  })
  const [userProblems, setUserProblems] = useState<UserProblem[]>([])
  const [userRequests, setUserRequests] = useState<HelpRequest[]>([])
  const [loadingRequests, setLoadingRequests] = useState(false)

  // Request editing state
  const [editingRequest, setEditingRequest] = useState<string | null>(null);
  const [editingRequestData, setEditingRequestData] = useState<{
    challenge: string;
    reason: string;
    help_type: string;
    timeline: 'standard' | 'urgent' | 'flexible';
  }>({ challenge: '', reason: '', help_type: '', timeline: 'standard' });

  // Voice recording state
  const [voiceState, setVoiceState] = useState<'initial' | 'recording' | 'processing'>('initial');
  const [recordingTime, setRecordingTime] = useState<number>(0);
  const [isRecordingLimitReached, setIsRecordingLimitReached] = useState<boolean>(false);
  const [showVoiceValidation, setShowVoiceValidation] = useState<boolean>(false);
  const [showRequestValidation, setShowRequestValidation] = useState<boolean>(false);
  const [currentVoiceCard, setCurrentVoiceCard] = useState<{
    title: string;
    proof: string;
  } | null>(null);
  const [currentRequestData, setCurrentRequestData] = useState<{
    formattedRequest: string;
  } | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [voiceTranscript, setVoiceTranscript] = useState<string>('');
  const [recordingType, setRecordingType] = useState<'profile' | 'request'>('profile');

  // Resume state
  const [resumeState, setResumeState] = useState<'initial' | 'processing' | 'complete' | 'error'>('initial');
  const [resumeProgress, setResumeProgress] = useState<number>(0);
  const [showResumeValidation, setShowResumeValidation] = useState<boolean>(false);
  const [currentResumeCard, setCurrentResumeCard] = useState<{
    title: string;
    proof: string;
  } | null>(null);
  const [cardsAccepted, setCardsAccepted] = useState<number>(0);
  const [totalAttempts, setTotalAttempts] = useState<number>(0);
  const [resumeConversationHistory, setResumeConversationHistory] = useState<any[]>([]);
  const [resumeText, setResumeText] = useState<string>('');
  const [resumeFilename, setResumeFilename] = useState<string>('');
  const [resumeError, setResumeError] = useState<string>('');
  const [generatingCard, setGeneratingCard] = useState<boolean>(false);

  // LinkedIn state
  const [linkedinUrl, setLinkedinUrl] = useState<string>('');
  const [editingLinkedin, setEditingLinkedin] = useState<boolean>(false);

  // URL attachment state (for help cards)
  const [urlInputProblemId, setUrlInputProblemId] = useState<string | null>(null);
  const [urlInputValue, setUrlInputValue] = useState<string>('');
  const [urlProcessing, setUrlProcessing] = useState<boolean>(false);
  const [urlError, setUrlError] = useState<string>('');

  // Project URL state (for "What I'm working on")
  const [projectUrlInputActive, setProjectUrlInputActive] = useState<boolean>(false);
  const [projectUrlInputValue, setProjectUrlInputValue] = useState<string>('');
  const [projectUrlProcessing, setProjectUrlProcessing] = useState<boolean>(false);
  const [projectUrlError, setProjectUrlError] = useState<string>('');

  // Help requests data
  const helpRequests = [
    {
      id: 1,
      person: "Sarah Chen",
      title: "Product Manager",
      company: "B2B SaaS Startup",
      avatar: "SC",
      text: "Should I relocate to Edinburgh for this new role?",
      timeAgo: "2 hours ago",
      context: "Got offered a senior PM role at a healthtech company there. Good step up but means leaving my network in London.",
      lookingFor: "Chat with someone who relocated for career growth",
      matchedSkill: "Career Strategy"
    },
    {
      id: 2,
      person: "Marcus Rodriguez",
      title: "Engineering Manager", 
      company: "Growing Startup",
      avatar: "MR",
      text: "How do I restructure after losing 3 engineers?",
      timeAgo: "4 hours ago",
      context: "Had to let go some team members due to budget cuts. Need to reorganize workload across remaining 8 people.",
      lookingFor: "Advice from managers who have been through similar situations",
      matchedSkill: "Management Skills"
    },
    {
      id: 3,
      person: "Jennifer Liu",
      title: "Senior Strategy Analyst",
      company: "Mid-size Tech Co",
      avatar: "JL", 
      text: "First time leading an acquisition integration",
      timeAgo: "1 day ago",
      context: "My company just acquired a smaller competitor (about 30 people). I have been put in charge of integration.",
      lookingFor: "Tips from someone who has done M&A integration before",
      matchedSkill: "Business Strategy"
    }
  ];

  // Load user data when session exists
  useEffect(() => {
    if (session?.user?.email) {
      loadUserData(session.user.email)
    }
  }, [session])

  // Process project URL when it exists but lacks metadata
  useEffect(() => {
    const processProjectUrl = async () => {
      if (profileData.project_url && !profileData.project_attachment_metadata) {
        try {
          const processResponse = await fetch('/api/process-url', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url: profileData.project_url })
          });

          if (processResponse.ok) {
            const processedUrl = await processResponse.json();
            setProfileData(prev => ({
              ...prev,
              project_attachment_type: processedUrl.type,
              project_attachment_metadata: processedUrl.metadata
            }));
          }
        } catch (error) {
          console.error('Error processing project URL:', error);
        }
      }
    };

    processProjectUrl();
  }, [profileData.project_url]);

  // Load user requests when session exists
  useEffect(() => {
    if (session?.user?.email) {
      loadUserRequests()
    }
  }, [session])

  // Recording timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (voiceState === 'recording') {
      timer = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          const currentLimit = getRecordingTimeLimit(); // Use dynamic limit
          
          // Auto-stop recording when limit reached
          if (newTime >= currentLimit) {
            setIsRecordingLimitReached(true);
            if (mediaRecorder && mediaRecorder.state === 'recording') {
              mediaRecorder.stop();
            }
            return currentLimit;
          }
          
          return newTime;
        });
      }, 1000);
    } else {
      setRecordingTime(0);
      setIsRecordingLimitReached(false);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [voiceState, recordingType, mediaRecorder]); // Add recordingType as dependency

  // Format timer display
  const formatTime = (seconds: number): string => {
    return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  const loadUserData = async (userEmail: string) => {
    // Load or create user profile
    let { data: user } = await supabase
      .from('users')
      .select(`
        *,
        role_title,
        industry, 
        experience_years,
        focus_area,
        learning_focus,
        project_description,
        project_url
      `)
      .eq('email', userEmail)
      .single()

    if (!user && session?.user?.email) {
      // Create new user
      const userId = session.user.email!
      const { data: newUser } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: session.user.email!,
          name: session.user.name || '',
          image: session.user.image || ''
        })
        .select()
        .single()
      
      user = newUser

      // Add default problems for new user
      const defaultProblems = [
        {
          user_id: userId,
          title: 'Navigating your first interim executive role',
          proof: 'I\'ve been interim CEO during company turnaround with 2000+ employees',
          verified: true,
          helped_count: 3
        },
        {
          user_id: userId,
          title: 'Building teams across cultures and time zones',
          proof: 'I\'ve scaled teams from 5 to 50+ people across US/Europe/Switzerland',
          verified: true,
          helped_count: 2
        },
        {
          user_id: userId,
          title: 'Taking on P&L responsibility for the first time',
          proof: 'I\'ve mentored executives taking on €20M+ P&L responsibility',
          verified: true,
          helped_count: 1
        },
        {
          user_id: userId,
          title: 'Making M&A integration actually work',
          proof: 'I\'ve led deals with €90M+ savings across multiple integrations',
          verified: true,
          helped_count: 2
        }
      ]

      await supabase
        .from('user_problems')
        .insert(defaultProblems)
    }

    if (user) {
      setProfileData({
        name: user.name || '',
        current: user.current_focus,
        background: user.background,
        personal: user.personal_info,
        role_title: user.role_title || '',
        industry: user.industry || '',
        experience_years: user.experience_years || '',
        focus_area: user.focus_area || '',
        learning_focus: user.learning_focus || '',
        project_description: user.project_description || '',
        project_url: user.project_url || ''
      })
      setLinkedinUrl(user.linkedin_url || '')
    }

    // Load user problems
    const { data: problems } = await supabase
      .from('user_problems')
      .select('*')
      .eq('user_id', userEmail)
      .order('created_at', { ascending: true })

    if (problems) {
      setUserProblems(problems)
    }
  }

  const loadUserRequests = async () => {
    if (!session?.user?.email) return
    
    setLoadingRequests(true)
    try {
      const response = await fetch('/api/requests')
      if (response.ok) {
        const requests = await response.json()
        setUserRequests(requests)
        console.log('Loaded user requests:', requests)
      } else {
        console.error('Failed to load requests')
      }
    } catch (error) {
      console.error('Error loading requests:', error)
    } finally {
      setLoadingRequests(false)
    }
  }

  const handleGoogleSignIn = () => {
    signIn('google')
  }

  // Voice recording handlers
  const handleVoiceStart = (type: 'profile' | 'request') => {
    setRecordingType(type);
    setCurrentView('voice');
    setVoiceState('initial');
  };

  const handleVoiceRecord = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        await processVoiceRecording(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      setMediaRecorder(recorder);
      setAudioChunks(chunks);
      recorder.start();
      setVoiceState('recording');
      setIsRecordingLimitReached(false);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Unable to access microphone. Please check permissions.');
      setVoiceState('initial');
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
      // Send audio to Deepgram for transcription
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
      setVoiceTranscript(transcript);

      if (recordingType === 'profile') {
        // Generate experience card using existing endpoint
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

        const cardData = await cardResponse.json();

        setCurrentVoiceCard({
          title: cardData.title,
          proof: cardData.proof
        });
        
        setVoiceState('initial');
        setCurrentView('full-profile');
        setShowVoiceValidation(true);
      } else {
        // Generate help request using Claude
        const requestResponse = await fetch('/api/generate-request', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ transcript })
        });

        if (!requestResponse.ok) {
          throw new Error('Request generation failed');
        }

        const requestData = await requestResponse.json();
        console.log('🔍 Generated request:', requestData.formattedRequest);

        // Store for validation (like profile flow)
        setCurrentRequestData({
          formattedRequest: requestData.formattedRequest
        });

        setVoiceState('initial');
        setCurrentView('new-get-help');
        setShowRequestValidation(true); // Show validation modal
      }
    } catch (error) {
      console.error('Error processing voice recording:', error);
      alert('Error processing recording. Please try again.');
      setVoiceState('initial');
    }
  };

  const handleVoiceApproval = async (approved: boolean) => {
    // Check if user is logged in
    if (!session?.user?.email) {
      alert('Please sign in to save your experience');
      return;
    }

    if (approved && currentVoiceCard) {
      try {
        // Save to database (removed ai_generated field since you dropped the column)
        const { data, error } = await supabase
          .from('user_problems')
          .insert({
            user_id: session.user.email,
            title: currentVoiceCard.title,
            proof: currentVoiceCard.proof,
            verified: false,
            helped_count: 0
          })
          .select()
          .single();

        if (error) {
          console.error('Error saving experience:', error);
          alert('Failed to save experience. Please try again.');
          return;
        }

        if (data) {
          setUserProblems(prev => [data, ...prev]);
          console.log('✅ Experience saved successfully:', data);
        }
      } catch (error) {
        console.error('Error saving experience:', error);
        alert('Failed to save experience. Please try again.');
        return;
      }
    }
    
    // Reset validation state
    setShowVoiceValidation(false);
    setCurrentVoiceCard(null);
    setVoiceTranscript('');

    // If not approved, go back to recording
    if (!approved) {
      setVoiceState('initial');
      setCurrentView('voice');
    }
  };

  // Resume handlers
  const handleResumeStart = () => {
    setCurrentView('resume');
    setResumeState('initial');
  };

  const handleResumeUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset error state
    setResumeError('');
    
    // Validate file type
    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ];
    
    if (!validTypes.includes(file.type)) {
      setResumeError('Please upload a PDF, DOC, or DOCX file');
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setResumeError('File is too large. Maximum size is 10MB');
      return;
    }

    setResumeState('processing');
    setResumeProgress(0);
    setResumeFilename(file.name);

    try {
      // Create FormData and send to extraction API
      const formData = new FormData();
      formData.append('file', file);

      // Update progress while uploading
      const progressTimer = setInterval(() => {
        setResumeProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressTimer);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const extractResponse = await fetch('/api/extract-resume', {
        method: 'POST',
        body: formData
      });

      clearInterval(progressTimer);

      if (!extractResponse.ok) {
        const error = await extractResponse.json();
        console.error('Extract API Error:', error);
        throw new Error(error.error || 'Failed to extract text from resume');
      }

      const response = await extractResponse.json();
      const { text, success } = response;
      
      if (!success || !text) {
        throw new Error('Failed to extract text from resume');
      }
      
      setResumeText(text);
      setResumeProgress(100);
      
      // Immediately start card generation without delay
      setResumeState('complete');
      setCardsAccepted(0);
      setTotalAttempts(0);
      setResumeConversationHistory([]);
      // Stay in resume view during card validation
      generateNextResumeCard(text);

    } catch (error) {
      console.error('Resume upload error:', error);
      setResumeError(error instanceof Error ? error.message : 'Failed to process resume');
      setResumeState('error');
      setResumeProgress(0);
    }
  };

  const handleResumeButtonClick = () => {
    fileInputRef.current?.click();
  };


  const generateNextResumeCard = async (passedResumeText?: string) => {
    if (cardsAccepted >= 5 || totalAttempts >= 8) {
      setShowResumeValidation(false);
      return;
    }

    // Use the passed text or the stored resume text
    const textToProcess = passedResumeText || resumeText;
    
    if (!textToProcess) {
      console.error('No resume text available');
      setResumeError('No resume text available for processing');
      return;
    }

    setGeneratingCard(true);
    setResumeError('');

    try {
      // Call the actual API
      const response = await fetch('/api/process-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeText: textToProcess,
          conversationHistory: resumeConversationHistory
        })
      });

      if (!response.ok) {
        let error;
        try {
          error = await response.json();
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
          error = { error: `HTTP ${response.status}: ${response.statusText}` };
        }
        console.error('Resume processing error:', error);
        setResumeError(error.error || `Failed to generate card (${response.status})`);
        setGeneratingCard(false);
        return;
      }

      const { title, proof } = await response.json();
      
      console.log('Generated card:', { title, proof });
      
      setCurrentResumeCard({
        title,
        proof
      });
      setShowResumeValidation(true);
      setGeneratingCard(false);
      
      console.log('Card state updated, showResumeValidation set to true');
      
    } catch (error) {
      console.error('Error generating card:', error);
      setResumeError('Failed to generate card. Please try again.');
      setGeneratingCard(false);
    }
  };

  const handleResumeApproval = async (approved: boolean) => {
    console.log('Resume approval called:', { approved, totalAttempts, cardsAccepted });
    
    // Check if user is logged in (same as voice workflow)
    if (!session?.user?.email) {
      alert('Please sign in to save your experience');
      return;
    }
    
    // Update total attempts counter
    const newTotalAttempts = totalAttempts + 1;
    setTotalAttempts(newTotalAttempts);
    
    // Add to conversation history with your format
    if (currentResumeCard) {
      setResumeConversationHistory(prev => [...prev, {
        statement: currentResumeCard.title,
        reason: currentResumeCard.proof,
        response: approved ? 'yes' : 'no'
      }]);
    }

    if (approved && currentResumeCard) {
      const newCardsAccepted = cardsAccepted + 1;
      setCardsAccepted(newCardsAccepted);
      
      console.log('Saving card to database:', currentResumeCard);
      
      // Save to database (removed ai_generated field since it was dropped from table)
      const { data, error } = await supabase
        .from('user_problems')
        .insert({
          user_id: session.user.email,
          title: currentResumeCard.title,
          proof: currentResumeCard.proof,
          verified: false,
          helped_count: 0
        })
        .select()
        .single();

      if (!error && data) {
        console.log('Card saved successfully:', data);
        setUserProblems(prev => [...prev, data]);
      } else if (error) {
        console.error('Failed to save card:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        setResumeError('Failed to save card to database. Please try again.');
      }
      
      if (newCardsAccepted >= 5) {
        setShowResumeValidation(false);
        // Only change view when user is completely done with resume flow
        setCurrentView('full-profile');
        return;
      }
    }

    if (newTotalAttempts >= 8) {
      setShowResumeValidation(false);
      // Change view when user hits attempt limit
      setCurrentView('full-profile');
      return;
    }

    // Keep modal open and generate next card (modal will update when new card is ready)
    generateNextResumeCard();
  };

  // LinkedIn handlers
  const handleLinkedinSave = async () => {
    if (session?.user?.email) {
      await supabase
        .from('users')
        .update({ linkedin_url: linkedinUrl })
        .eq('email', session.user.email);
    }
    setEditingLinkedin(false);
  };

  const handleLinkedinClick = () => {
    if (linkedinUrl) {
      window.open(linkedinUrl.startsWith('http') ? linkedinUrl : `https://${linkedinUrl}`, '_blank');
    }
  };

  // Match data for connection flow
  const matchedPerson = {
    name: "Sarah Johnson",
    title: "Senior Product Director",
    company: "InnovateCo",
    avatar: "SJ",
    verified: true,
    location: "London",
    professionalExchanges: 47,
    mutualConnections: 3,
    recentHelped: ["Michael", "Elena", "James", "Lisa", "David"],
    expertise: ["Product Leadership", "Career Development", "Team Scaling", "B2B SaaS"]
  };

  // Define proper types
  type ActiveFieldType = 'challenge' | 'reason' | 'helpType' | 'name' | 'about' | 'linkedin' | 'role_title' | 'industry' | 'experience_years' | 'focus_area' | 'learning_focus' | 'project_description' | 'project_url' | null;
  type ModalIconType = 'handshake' | 'check' | 'heart';

  // State management
  const [currentView, setCurrentView] = useState<'auth' | 'full-profile' | 'match-found' | 'match-connection' | 'public-board' | 'network' | 'new-get-help' | 'voice' | 'resume'>('auth');
  const [showModal, setShowModal] = useState<boolean>(false);
  const [modalContent, setModalContent] = useState<{
    icon: ModalIconType;
    title: string;
    message: string;
  } | null>(null);
  const [showGooglePopup, setShowGooglePopup] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showBottomSheet, setShowBottomSheet] = useState<boolean>(false);
  const [matchingFrequency, setMatchingFrequency] = useState<'daily' | 'weekly' | 'off'>('daily');
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [newProblem, setNewProblem] = useState<Partial<HelpRequest>>({});
  const [showTimelineChips, setShowTimelineChips] = useState(false);
  const [helpForm, setHelpForm] = useState({
    challenge: '',
    reason: '',
    helpType: ''
  });
  const [selectedTimeline, setSelectedTimeline] = useState<'urgent' | 'standard' | 'flexible'>('standard');
  const [activeField, setActiveField] = useState<ActiveFieldType>(null);

  // Enhanced profile editing state
  const [editingField, setEditingField] = useState<string | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [savingField, setSavingField] = useState<string | null>(null);
  const [linkedInStatus, setLinkedInStatus] = useState<'empty' | 'processing' | 'complete'>('empty');
  const [linkedInValue, setLinkedInValue] = useState<string>('');
  const [resumeStatus, setResumeStatus] = useState<'empty' | 'processing' | 'complete'>('empty');
  const [resumeValue, setResumeValue] = useState<string>('');
  const [showAISuggestions, setShowAISuggestions] = useState<boolean>(false);

  // Problem editing state
  const [editingProblem, setEditingProblem] = useState<string | null>(null);
  const [editingProblemData, setEditingProblemData] = useState<{
    title: string;
    proof: string;
  }>({ title: '', proof: '' });

  // Add dedicated ref for about field
  const aboutRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const inputRefs = {
    challenge: useRef<HTMLInputElement>(null),
    reason: useRef<HTMLInputElement>(null),
    helpType: useRef<HTMLInputElement>(null),
    about: useRef<HTMLInputElement>(null),
    linkedin: useRef<HTMLInputElement>(null),
    name: useRef<HTMLInputElement>(null)
  };

  // Chat state
  const [showChatPanel, setShowChatPanel] = useState(false);
  const [activeChat, setActiveChat] = useState<number | null>(null);
  const [chatMessages, setChatMessages] = useState<Record<number, Array<{id: number, text: string, sender: 'me' | 'them', timestamp: Date}>>>({});
  const [messageInput, setMessageInput] = useState('');
  const [unreadCounts, setUnreadCounts] = useState<Record<number, number>>({
    1: 2,
    3: 1,
    5: 0
  });

  // Initialize chat messages if not exists
  const initializeChat = useCallback((connectionId: number) => {
    if (!chatMessages[connectionId]) {
      // Sample initial messages
      const initialMessages: Record<number, Array<{id: number, text: string, sender: 'me' | 'them', timestamp: Date}>> = {
        1: [
          { id: 1, text: "Hey! Thanks for connecting. I'd love to hear more about your team scaling challenges.", sender: 'them', timestamp: new Date(Date.now() - 86400000) },
          { id: 2, text: "I saw you helped with M&A integration - that's exactly what I'm working on!", sender: 'them', timestamp: new Date(Date.now() - 3600000) }
        ],
        3: [
          { id: 1, text: "Thanks for offering to help with content strategy!", sender: 'them', timestamp: new Date(Date.now() - 172800000) }
        ]
      };
      
      if (initialMessages[connectionId]) {
        setChatMessages(prev => ({ ...prev, [connectionId]: initialMessages[connectionId] }));
      } else {
        setChatMessages(prev => ({ ...prev, [connectionId]: [] }));
      }
    }
  }, [chatMessages]);

  // Network connections data
  const networkConnectionsImproved: NetworkConnection[] = [
    {
      id: 1,
      name: 'Maria Rodriguez',
      company: 'TechStart',
      avatar: 'MR',
      connectionContext: 'You helped with crisis management',
      currentStatus: {
        type: 'looking_for',
        text: 'Looking for AI strategy advice'
      }
    },
    {
      id: 2,
      name: 'John Smith',
      company: 'Enterprise Corp',
      avatar: 'JS',
      connectionContext: 'Helped you with P&L strategy',
      currentStatus: {
        type: 'recently_helped',
        text: 'Recently helped someone with fundraising'
      }
    },
    {
      id: 3,
      name: 'Anna Kim',
      company: 'Growth Ventures',
      avatar: 'AK',
      connectionContext: 'You helped with M&A integration',
      currentStatus: {
        type: 'looking_for',
        text: 'Looking for content strategy insights'
      }
    },
    {
      id: 4,
      name: 'David Chen',
      company: 'Spotify',
      avatar: 'DC',
      connectionContext: 'Helped you with product strategy',
      currentStatus: {
        type: 'recently_helped',
        text: 'Recently helped someone with market research'
      }
    },
    {
      id: 5,
      name: 'Sophie Laurent',
      company: 'McKinsey',
      avatar: 'SL',
      connectionContext: 'You helped with team scaling',
      currentStatus: {
        type: 'looking_for',
        text: 'Looking for European expansion advice'
      }
    }
  ];

  // Initialize chat when opening
  useEffect(() => {
    if (activeChat && showChatPanel) {
      initializeChat(activeChat);
    }
  }, [activeChat, showChatPanel, initializeChat]);

  // Skip simulated auth flow, go straight to profile if signed in
  useEffect(() => {
    if (status === 'authenticated' && currentView === 'auth') {
      setCurrentView('full-profile')
    }
  }, [status, currentView])

  const validateHelpForm = () => {
    return helpForm.challenge.trim() && helpForm.reason.trim() && helpForm.helpType.trim() && selectedTimeline;
  };

  const submitHelpRequest = async () => {
    if (!validateHelpForm() || !session?.user?.email) {
      console.log('Validation failed or no session')
      return
    }
    
    console.log('Submitting request...', {
      title: helpForm.challenge,
      proof: helpForm.reason,
      help_type: helpForm.helpType,
      timeline: selectedTimeline
    })
    
    try {
      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: helpForm.challenge.trim(),
          proof: helpForm.reason.trim(),
          help_type: helpForm.helpType.trim(),
          timeline: selectedTimeline
        })
      })
  
      console.log('Response status:', response.status)
  
      if (response.ok) {
        const newRequest = await response.json()
        console.log('✅ Request created successfully:', newRequest)
        
        // Reset form
        setShowBottomSheet(false)
        setHelpForm({ challenge: '', reason: '', helpType: '' })
        setSelectedTimeline('standard')
        setActiveField(null)
        setShowTimelineChips(false)
        
        // Refresh user requests list
        await loadUserRequests()
        
        // Show success modal
        showSuccessModal('request')
      } else {
        const error = await response.json()
        console.error('❌ Failed to create request:', error)
      }
    } catch (error) {
      console.error('❌ Network error:', error)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    if (field === 'challenge' || field === 'reason' || field === 'helpType') {
      setHelpForm(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleInputBlur = () => {
    setTimeout(() => {
      setActiveField(null);
    }, 100);
  };

  const getDisplayText = (field: string, placeholder: string) => {
    if (field === 'challenge' || field === 'reason' || field === 'helpType') {
      return helpForm[field as keyof typeof helpForm] || placeholder;
    }
    return placeholder;
  };

  const getTimelineDisplay = () => {
    return selectedTimeline || 'select timeline';
  };

  const handleAddProblem = () => {
    if (!session?.user?.email) return;

    const newUserProblem: UserProblem = {
      id: crypto.randomUUID(),
      user_id: session.user.email,
      title: helpForm.challenge,
      proof: helpForm.reason,
      verified: false,
      helped_count: 0,
      ai_generated: false,
      created_at: new Date().toISOString()
    };

    setUserProblems(prev => [...prev, newUserProblem]);
    setHelpForm({ challenge: '', reason: '', helpType: '' });
    setSelectedTimeline('standard');
    setActiveField(null);
    setShowTimelineChips(false);
  };

  // Problem editing functions
  const handleEditProblem = (problem: UserProblem) => {
    setEditingProblem(problem.id);
    setEditingProblemData({
      title: problem.title,
      proof: problem.proof
    });
  };

  const handleDeleteProblem = async (problemId: string) => {
    if (!session?.user?.email) return;
    
    
    try {
      const { error } = await supabase
        .from('user_problems')
        .delete()
        .eq('id', problemId)
        .eq('user_id', session.user.email);

      if (!error) {
        // Update local state
        setUserProblems(prev => prev.filter(problem => problem.id !== problemId));
      } else {
        console.error('Error deleting problem:', error);
        alert('Failed to delete card. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting problem:', error);
      alert('Failed to delete card. Please try again.');
    }
  };

  const handleSaveProblem = async (problemId: string) => {
    if (!session?.user?.email) return;
    
    try {
      const { data, error } = await supabase
        .from('user_problems')
        .update({
          title: editingProblemData.title,
          proof: editingProblemData.proof
        })
        .eq('id', problemId)
        .eq('user_id', session.user.email)
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setUserProblems(prev => prev.map(p => 
        p.id === problemId 
          ? { ...p, title: editingProblemData.title, proof: editingProblemData.proof }
          : p
      ));
      
      // Reset editing state
      setEditingProblem(null);
      setEditingProblemData({ title: '', proof: '' });
    } catch (error) {
      console.error('Error saving problem:', error);
      alert('Failed to save changes. Please try again.');
    }
  };

  // URL attachment functions
  const handleAddLink = (problemId: string) => {
    const problem = userProblems.find(p => p.id === problemId);
    setUrlInputProblemId(problemId);
    setUrlInputValue(problem?.attachment_url || '');
    setUrlError('');
  };

  const handleCancelLink = () => {
    setUrlInputProblemId(null);
    setUrlInputValue('');
    setUrlError('');
  };

  const handleSaveLink = async (problemId: string) => {
    if (!session?.user?.email) return;
    
    setUrlProcessing(true);
    setUrlError('');

    try {
      // If URL is empty, remove the link
      if (!urlInputValue.trim()) {
        await handleRemoveLink(problemId);
        handleCancelLink();
        return;
      }

      // Normalize URL (add https:// if needed)
      const normalizedUrl = normalizeUrl(urlInputValue);

      // Validate normalized URL
      if (!isValidUrl(normalizedUrl)) {
        setUrlError('Please enter a valid URL');
        setUrlProcessing(false);
        return;
      }

      // Process the URL to get metadata via API
      const processResponse = await fetch('/api/process-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: normalizedUrl })
      });

      if (!processResponse.ok) {
        const errorData = await processResponse.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to process URL (${processResponse.status})`);
      }

      const processedUrl = await processResponse.json();
      
      // Update the database
      const { data, error } = await supabase
        .from('user_problems')
        .update({
          attachment_url: normalizedUrl,
          attachment_type: processedUrl.type,
          attachment_metadata: processedUrl.metadata
        })
        .eq('id', problemId)
        .eq('user_id', session.user.email)
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setUserProblems(prev => prev.map(problem => 
        problem.id === problemId 
          ? { 
              ...problem, 
              attachment_url: normalizedUrl,
              attachment_type: processedUrl.type,
              attachment_metadata: processedUrl.metadata
            }
          : problem
      ));

      // Reset URL input state
      handleCancelLink();
    } catch (error: any) {
      console.error('Error saving link:', error);
      if (error.message) {
        setUrlError(error.message);
      } else if (error.error) {
        setUrlError(error.error);
      } else {
        setUrlError('Failed to save link. Please try again.');
      }
    } finally {
      setUrlProcessing(false);
    }
  };

  const handleRemoveLink = async (problemId: string) => {
    if (!session?.user?.email) return;

    try {
      const { error } = await supabase
        .from('user_problems')
        .update({
          attachment_url: null,
          attachment_type: null,
          attachment_metadata: null
        })
        .eq('id', problemId)
        .eq('user_id', session.user.email);

      if (!error) {
        // Update local state
        setUserProblems(prev => prev.map(problem => 
          problem.id === problemId 
            ? { 
                ...problem, 
                attachment_url: null,
                attachment_type: null,
                attachment_metadata: null
              }
            : problem
        ));
      }
    } catch (error) {
      console.error('Error removing link:', error);
    }
  };

  // Project URL functions
  const handleProjectAddLink = () => {
    setProjectUrlInputActive(true);
    setProjectUrlInputValue(profileData.project_url || '');
    setProjectUrlError('');
  };

  const handleProjectCancelLink = () => {
    setProjectUrlInputActive(false);
    setProjectUrlInputValue('');
    setProjectUrlError('');
  };

  const handleProjectSaveLink = async () => {
    if (!session?.user?.email) return;
    
    setProjectUrlProcessing(true);
    setProjectUrlError('');

    try {
      // If URL is empty, remove the link
      if (!projectUrlInputValue.trim()) {
        await handleProjectRemoveLink();
        handleProjectCancelLink();
        return;
      }

      // Normalize URL (add https:// if needed)
      const normalizedUrl = normalizeUrl(projectUrlInputValue);

      // Validate normalized URL
      if (!isValidUrl(normalizedUrl)) {
        setProjectUrlError('Please enter a valid URL');
        setProjectUrlProcessing(false);
        return;
      }

      // Process the URL to get metadata via API
      const processResponse = await fetch('/api/process-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: normalizedUrl })
      });

      if (!processResponse.ok) {
        const errorData = await processResponse.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to process URL (${processResponse.status})`);
      }

      const processedUrl = await processResponse.json();
      
      // Update the database (using existing project_url field)
      const { data, error } = await supabase
        .from('users')
        .update({
          project_url: normalizedUrl
        })
        .eq('id', session.user.email)
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setProfileData(prev => ({
        ...prev,
        project_url: normalizedUrl,
        project_attachment_url: normalizedUrl,
        project_attachment_type: processedUrl.type,
        project_attachment_metadata: processedUrl.metadata
      }));

      // Reset URL input state
      handleProjectCancelLink();
    } catch (error: any) {
      console.error('Error saving project link:', error);
      if (error.message) {
        setProjectUrlError(error.message);
      } else if (error.error) {
        setProjectUrlError(error.error);
      } else {
        setProjectUrlError('Failed to save link. Please try again.');
      }
    } finally {
      setProjectUrlProcessing(false);
    }
  };

  const handleProjectRemoveLink = async () => {
    if (!session?.user?.email) return;

    try {
      const { error } = await supabase
        .from('users')
        .update({
          project_url: null
        })
        .eq('id', session.user.email);

      if (!error) {
        // Update local state
        setProfileData(prev => ({
          ...prev,
          project_url: '',
          project_attachment_url: undefined,
          project_attachment_type: undefined,
          project_attachment_metadata: undefined
        }));
      }
    } catch (error) {
      console.error('Error removing project link:', error);
    }
  };

  const showSuccessModal = (type: 'connection' | 'request' | 'help') => {
    const configs = {
      'connection': {
        icon: 'handshake' as ModalIconType,
        title: 'Connection made!',
        message: "We'll send you both an email with contact details. Schedule your call and help each other out."
      },
      'request': {
        icon: 'check' as ModalIconType,
        title: 'Request submitted!',
        message: "We'll look for matches this week and email you if we find someone who can help."
      },
      'help': {
        icon: 'heart' as ModalIconType,
        title: 'Interest sent!',
        message: "We'll let them know you can help. They'll check out what you can offer in return."
      }
    };
    
    setModalContent(configs[type]);
    setShowModal(true);
  };

  // Enhanced profile field handlers with database integration
  const handleProfileFieldClick = (fieldName: ActiveFieldType) => {
    setActiveField(fieldName);
    setEditingField(fieldName);
    // For about field, use current from profileData
    const value = fieldName === 'about' ? profileData.current : fieldName ? profileData[fieldName as keyof ProfileData] : '';
    setFieldValues(prev => ({ ...prev, [fieldName as string]: value }));
    setTimeout(() => {
      if (fieldName === 'about' && aboutRef.current) {
        aboutRef.current.focus();
      } else if (fieldName && inputRefs[fieldName as keyof typeof inputRefs]?.current) {
        inputRefs[fieldName as keyof typeof inputRefs].current?.focus();
      }
    }, 0);
  };

  const handleProfileFieldChange = (fieldName: ActiveFieldType, value: string) => {
    setFieldValues(prev => ({ ...prev, [fieldName as string]: value }));
  };

  const handleProfileFieldSave = async (fieldName: string) => {
    if (!session?.user?.email) return;
    
    const value = fieldValues[fieldName as keyof typeof fieldValues];
    setSavingField(fieldName);
    
    try {
      if (fieldName === 'name') {
        const { error } = await supabase
          .from('users')
          .update({ name: value })
          .eq('email', session.user.email);

        if (!error) {
          setProfileData(prev => ({ ...prev, name: value }));
        }
      } else if (fieldName === 'about') {
        const { error } = await supabase
          .from('users')
          .update({ current_focus: value })
          .eq('email', session.user.email);

        if (!error) {
          setProfileData(prev => ({ ...prev, current: value }));
        }
      } else if (fieldName === 'linkedin') {
        const { error } = await supabase
          .from('users')
          .update({ linkedin_url: value })
          .eq('email', session.user.email);

        if (!error) {
          setProfileData(prev => ({ ...prev, linkedin_url: value }));
        }
      } else if (fieldName === 'role_title') {
        const { error } = await supabase
          .from('users')
          .update({ role_title: value })
          .eq('email', session.user.email);

        if (!error) {
          setProfileData(prev => ({ ...prev, role_title: value }));
        }
      } else if (fieldName === 'industry') {
        const { error } = await supabase
          .from('users')
          .update({ industry: value })
          .eq('email', session.user.email);

        if (!error) {
          setProfileData(prev => ({ ...prev, industry: value }));
        }
      } else if (fieldName === 'experience_years') {
        const { error } = await supabase
          .from('users')
          .update({ experience_years: value })
          .eq('email', session.user.email);

        if (!error) {
          setProfileData(prev => ({ ...prev, experience_years: value }));
        }
      } else if (fieldName === 'focus_area') {
        const { error } = await supabase
          .from('users')
          .update({ focus_area: value })
          .eq('email', session.user.email);

        if (!error) {
          setProfileData(prev => ({ ...prev, focus_area: value }));
        }
      } else if (fieldName === 'learning_focus') {
        const { error } = await supabase
          .from('users')
          .update({ learning_focus: value })
          .eq('email', session.user.email);

        if (!error) {
          setProfileData(prev => ({ ...prev, learning_focus: value }));
        }
      }
    } catch (error) {
      console.error('Error saving field:', error);
    } finally {
      setSavingField(null);
      setEditingField(null);
    }
  };

  const handleProfileFieldBlur = (fieldName: string) => {
    handleProfileFieldSave(fieldName);
  };

  const handleLinkedInClick = () => {
    setEditingField('linkedin');
    setFieldValues({ ...fieldValues, linkedin: linkedInValue });
    setTimeout(() => {
      if (inputRefs.linkedin?.current) {
        inputRefs.linkedin.current?.focus();
      }
    }, 0);
  };

  const handleLinkedInSave = async () => {
    if (!session?.user?.email) return
    
    const value = fieldValues.linkedin?.trim()
    if (value) {
      setLinkedInStatus('processing')
      setEditingField(null)
      
      await supabase
        .from('users')
        .update({ 
          linkedin_url: value,
          linkedin_status: 'processing'
        })
        .eq('email', session.user.email!)
      
      setTimeout(async () => {
        if (session?.user?.email) {
          await supabase
            .from('users')
            .update({ linkedin_status: 'complete' })
            .eq('email', session.user.email!)
            
          setLinkedInStatus('complete')
          setLinkedInValue(value)
          setShowAISuggestions(true)
        }
      }, 2000)
    } else {
      setEditingField(null)
    }
  };

  const handleLinkedInChange = (value: string) => {
    setFieldValues({ ...fieldValues, linkedin: value });
  };

  const handleResumeUploadProfile = async () => {
    if (!session?.user?.email) return
    
    setResumeStatus('processing')
    
    await supabase
      .from('users')
      .update({ resume_status: 'processing' })
      .eq('email', session.user.email!)
    
    setTimeout(async () => {
      if (session?.user?.email) {
        await supabase
          .from('users')
          .update({ 
            resume_status: 'complete',
            resume_filename: 'Marketing_Resume.pdf'
          })
          .eq('email', session.user.email!)
          
        setResumeStatus('complete')
        setResumeValue('Marketing_Resume.pdf')
        setShowAISuggestions(true)
      }
    }, 1500)
  };

  const handleResumeChange = async () => {
    if (!session?.user?.email) return
    
    setResumeStatus('processing')
    
    setTimeout(async () => {
      if (session?.user?.email) {
        await supabase
          .from('users')
          .update({ 
            resume_status: 'complete',
            resume_filename: 'Updated_Resume.pdf'
          })
          .eq('email', session.user.email!)
          
        setResumeStatus('complete')
        setResumeValue('Updated_Resume.pdf')
      }
    }, 1500)
  };

  // Enhanced field rendering functions
  const renderField = (fieldName: string, label: string) => {
    const isEditing = editingField === fieldName;
    const isSaving = savingField === fieldName;
    const showSuccess = savingField === fieldName + '_success';
    const value = isEditing ? (fieldValues[fieldName] || '') : profileData[fieldName as keyof typeof profileData];

    return (
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <p className="text-sm text-gray-300 leading-relaxed">
            <span className="font-semibold">{label}:</span>{' '}
            {isEditing ? (
              <input
                ref={inputRefs[fieldName as keyof typeof inputRefs]}
                type="text"
                value={value}
                onChange={(e) => handleProfileFieldChange(fieldName as ActiveFieldType, e.target.value)}
                onBlur={() => handleProfileFieldBlur(fieldName)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    inputRefs[fieldName as keyof typeof inputRefs].current?.blur();
                  }
                }}
                className="inline-block w-full max-w-md px-2 py-1 text-white bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            ) : (
              <span
                onClick={() => handleProfileFieldClick(fieldName as ActiveFieldType)}
                className="cursor-pointer text-white hover:bg-gray-700 px-2 py-1 rounded transition-colors"
              >
                {value}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 ml-3 flex-shrink-0">
          {showSuccess && <Check className="h-4 w-4 text-teal-400 animate-pulse" />}
          {isSaving && <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />}
        </div>
      </div>
    );
  };

  // Add missing helper functions for the form
  const handleFieldClick = (fieldName: ActiveFieldType) => {
    setActiveField(fieldName);
    setShowTimelineChips(false);
    setTimeout(() => {
      if (fieldName && fieldName !== 'about' && inputRefs[fieldName as keyof typeof inputRefs]?.current) {
        inputRefs[fieldName as keyof typeof inputRefs].current?.focus();
      }
    }, 0);
  };

  const handleTimelineClick = () => {
    setShowTimelineChips(true);
  };

  const handleTimelineSelect = (timeline: 'urgent' | 'standard' | 'flexible') => {
    setSelectedTimeline(timeline);
    setShowTimelineChips(false);
  };

  // Show loading screen while checking auth
  if (status === 'loading') {
    return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Loading...</div>
  }

  // Voice recording popup
  const renderVoicePopup = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-2xl shadow-2xl max-w-sm w-full max-h-[85vh] overflow-y-auto border border-gray-700">
        <button 
          onClick={() => setCurrentView(recordingType === 'profile' ? 'full-profile' : 'new-get-help')}
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

  // Resume upload popup
  const renderResumePopup = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center border border-gray-700">
        <button 
          onClick={() => setCurrentView('full-profile')}
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
            <p className="text-xs text-gray-500">Supports PDF, DOC, DOCX (Max 10MB)</p>
          </>
        )}

        {resumeState === 'processing' && (
          <>
            <div className="w-12 h-12 bg-teal-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Processing resume...</h3>
            <p className="text-gray-400 mb-4">{resumeFilename || 'Resume.pdf'}</p>
            <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
              <div 
                className="bg-teal-500 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${resumeProgress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-400">Looking for 5 areas you can help</p>
          </>
        )}

        {resumeState === 'error' && (
          <>
            <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Upload Failed</h3>
            <p className="text-gray-400 mb-4">{resumeError || 'Failed to process resume'}</p>
            <button 
              onClick={() => {
                setResumeState('initial');
                setResumeError('');
                setResumeProgress(0);
              }}
              className="w-full bg-teal-500 text-white py-3 rounded-lg font-semibold hover:bg-teal-600 transition-colors"
            >
              Try Again
            </button>
          </>
        )}
      </div>
    </div>
  );

  // Status Badge Component
  const StatusBadge = ({ status, helpedCount }: { status: string, helpedCount: number }) => {
    const config = {
      verified: { bg: 'bg-teal-500', text: 'text-white', label: '✓ Verified' },
      'ai-generated': { bg: 'bg-gray-700', text: 'text-teal-400', label: '🎤 AI Generated' },
      default: { bg: 'bg-gray-700', text: 'text-gray-300', label: 'Added by you' }
    };
    
    const style = config[status as keyof typeof config] || config.default;
    
    return (
      <div className="flex items-center gap-2">
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${style.bg} ${style.text}`}>
          {style.label}
        </span>
        {helpedCount > 0 && (
          <span className="text-xs text-gray-400 font-medium">
            Helped {helpedCount}
          </span>
        )}
      </div>
    );
  };

  // Main render functions
  const renderAuth = () => (
    <div className="min-h-screen bg-gray-900 flex flex-col px-5">
      {/* Main Content */}
      <div className="flex-1 flex flex-col justify-center px-8 py-12">
        
        {/* Logo & Brand */}
        <div className="text-center mb-12">
          <div className="w-24 h-24 bg-gradient-to-br from-red-400 to-orange-400 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl ring-4 ring-red-400/20">
            <Zap className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-3 leading-tight">
            OneGoodIntro
          </h1>
          <p className="text-gray-300 text-lg leading-relaxed max-w-sm mx-auto">
            Professional introductions when you need them
          </p>
        </div>

        {/* Value Proposition */}
        <div className="bg-gray-800 rounded-2xl p-6 mb-8 border border-gray-700">
          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-teal-500 rounded-full flex items-center justify-center flex-shrink-0">
                <Users className="h-5 w-5 text-white" />
              </div>
              <p className="text-white font-semibold">Quality introductions</p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-teal-500 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
              <p className="text-white font-semibold">Real people</p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-teal-500 rounded-full flex items-center justify-center flex-shrink-0">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <p className="text-white font-semibold">Learn from experience</p>
            </div>
          </div>
        </div>

        {/* Sign In Section */}
        <div className="space-y-6">
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full bg-gray-800 border-2 border-gray-600 text-white py-4 px-6 rounded-xl font-semibold text-base hover:border-teal-400 hover:bg-gray-700 transition-all duration-200 flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Continue with Google</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
          
          <div className="text-center">
            <p className="text-xs text-gray-500 leading-relaxed max-w-sm mx-auto">
              By continuing, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-gray-900/80 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-2xl p-8 text-center border border-gray-700">
            <div className="w-16 h-16 bg-gradient-to-br from-red-400 to-orange-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Setting up your profile...</h3>
            <p className="text-gray-400">This will only take a moment</p>
          </div>
        </div>
      )}
    </div>
  );

  const renderFullProfile = () => (
    <div className="min-h-screen bg-gray-900 pb-20 px-5">
      {/* Header and Stats Container */}
      <div className="max-w-2xl mx-auto bg-gray-900">
        {/* Profile Header - Dark Theme */}
        <div className="p-8 pb-2">
          {/* Avatar - Left aligned */}
          <div className="flex items-start gap-6 mb-3">
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-red-400 to-orange-400 flex items-center justify-center text-xl font-semibold text-white flex-shrink-0">
              {profileData.name ? profileData.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'CA'}
              <button className="absolute -bottom-1 -right-1 w-7 h-7 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-full flex items-center justify-center hover:from-red-600 hover:to-orange-600 transition-all">
                <Edit className="w-3 h-3" />
              </button>
            </div>
            
            {/* Name & Edit - Right of avatar */}
            <div className="flex-1 pt-2">
              <div className="flex items-center gap-3 mb-2">
                {editingField === 'name' ? (
                  <input
                    ref={inputRefs.name}
                    type="text"
                    value={fieldValues.name || ''}
                    onChange={(e) => handleProfileFieldChange('name', e.target.value)}
                    onBlur={() => handleProfileFieldSave('name')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        inputRefs.name.current?.blur();
                      }
                    }}
                    className="text-2xl font-bold text-white bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Your name"
                  />
                ) : (
                  <h1 
                    onClick={() => handleProfileFieldClick('name')}
                    className="text-2xl font-bold text-white cursor-pointer hover:bg-gray-700 px-2 py-1 rounded transition-colors"
                  >
                    {profileData.name || 'Chip Alexandru'}
                  </h1>
                )}
                {savingField === 'name' && <div className="w-4 h-4 border border-gray-400 border-t-transparent rounded-full animate-spin" />}
              </div>
              
              {/* Role/Title under name */}
              <div className="space-y-3">
                {editingField === 'about' ? (
                  <div className="space-y-2">
                    <textarea
                      ref={aboutRef}
                      value={fieldValues.about || ''}
                      onChange={(e) => handleProfileFieldChange('about', e.target.value)}
                      onBlur={() => handleProfileFieldSave('about')}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.metaKey) {
                          e.preventDefault();
                          handleProfileFieldSave('about');
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
                      onClick={() => handleProfileFieldClick('about')}
                      className="text-sm text-gray-300 leading-relaxed cursor-pointer hover:bg-gray-700 px-2 py-1 rounded transition-colors flex-1"
                    >
                      {profileData.current || 'I am just a guy 2 fjfjnf frjorndf rn'}
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
                        onClick={handleLinkedinClick}
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
                        onClick={handleLinkedinSave}
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
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-700 rounded flex items-center justify-center">
                  <Users className="h-2 w-2 text-gray-300" />
                </div>
                {editingField === 'role_title' ? (
                  <input
                    type="text"
                    value={fieldValues.role_title || ''}
                    onChange={(e) => handleProfileFieldChange('role_title', e.target.value)}
                    onBlur={() => handleProfileFieldSave('role_title')}
                    onKeyDown={(e) => e.key === 'Enter' && handleProfileFieldSave('role_title')}
                    className="flex-1 text-white text-sm bg-gray-600 border border-gray-500 rounded px-2 py-1 focus:ring-1 focus:ring-teal-500"
                    placeholder="Your role"
                  />
                ) : (
                  <span 
                    onClick={() => handleProfileFieldClick('role_title')}
                    className="text-white text-sm cursor-pointer hover:bg-gray-700 px-2 py-1 rounded transition-colors flex-1"
                  >
                    {profileData.role_title || 'Marketing Manager'}
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-700 rounded flex items-center justify-center">
                  <Target className="h-2 w-2 text-gray-300" />
                </div>
                {editingField === 'industry' ? (
                  <input
                    type="text"
                    value={fieldValues.industry || ''}
                    onChange={(e) => handleProfileFieldChange('industry', e.target.value)}
                    onBlur={() => handleProfileFieldSave('industry')}
                    onKeyDown={(e) => e.key === 'Enter' && handleProfileFieldSave('industry')}
                    className="flex-1 text-white text-sm bg-gray-600 border border-gray-500 rounded px-2 py-1 focus:ring-1 focus:ring-teal-500"
                    placeholder="Your industry"
                  />
                ) : (
                  <span 
                    onClick={() => handleProfileFieldClick('industry')}
                    className="text-white text-sm cursor-pointer hover:bg-gray-700 px-2 py-1 rounded transition-colors flex-1"
                  >
                    {profileData.industry || 'Consumer brands'}
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-700 rounded flex items-center justify-center">
                  <User className="h-2 w-2 text-gray-300" />
                </div>
                {editingField === 'experience_years' ? (
                  <input
                    type="text"
                    value={fieldValues.experience_years || ''}
                    onChange={(e) => handleProfileFieldChange('experience_years', e.target.value)}
                    onBlur={() => handleProfileFieldSave('experience_years')}
                    onKeyDown={(e) => e.key === 'Enter' && handleProfileFieldSave('experience_years')}
                    className="flex-1 text-white text-sm bg-gray-600 border border-gray-500 rounded px-2 py-1 focus:ring-1 focus:ring-teal-500"
                    placeholder="Years of experience"
                  />
                ) : (
                  <span 
                    onClick={() => handleProfileFieldClick('experience_years')}
                    className="text-white text-sm cursor-pointer hover:bg-gray-700 px-2 py-1 rounded transition-colors flex-1"
                  >
                    {profileData.experience_years || '6+ years experience'}
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-700 rounded flex items-center justify-center">
                  <Heart className="h-2 w-2 text-gray-300" />
                </div>
                {editingField === 'focus_area' ? (
                  <input
                    type="text"
                    value={fieldValues.focus_area || ''}
                    onChange={(e) => handleProfileFieldChange('focus_area', e.target.value)}
                    onBlur={() => handleProfileFieldSave('focus_area')}
                    onKeyDown={(e) => e.key === 'Enter' && handleProfileFieldSave('focus_area')}
                    className="flex-1 text-white text-sm bg-gray-600 border border-gray-500 rounded px-2 py-1 focus:ring-1 focus:ring-teal-500"
                    placeholder="Your focus area"
                  />
                ) : (
                  <span 
                    onClick={() => handleProfileFieldClick('focus_area')}
                    className="text-white text-sm cursor-pointer hover:bg-gray-700 px-2 py-1 rounded transition-colors flex-1"
                  >
                    {profileData.focus_area || 'Brand strategy'}
                  </span>
                )}
              </div>
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
                  onChange={(e) => handleProfileFieldChange('learning_focus', e.target.value)}
                  onBlur={() => handleProfileFieldSave('learning_focus')}
                  maxLength={200}
                  rows={4}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-white resize-none text-xl font-medium"
                  placeholder="What are you learning? (e.g., ChatGPT for better emails and social posts. Figma basics for mockups. Trying to understand analytics better...)"
                />
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleProfileFieldSave('learning_focus')} 
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
                onClick={() => handleProfileFieldClick('learning_focus')}
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
                  onChange={(e) => handleProfileFieldChange('project_description', e.target.value)}
                  rows={3}
                  className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm focus:ring-1 focus:ring-orange-500 focus:border-transparent text-white resize-none"
                  placeholder="What project are you working on?"
                />
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleProfileFieldSave('project_description')}
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
                  onClick={() => handleProfileFieldClick('project_description')}
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
                          {projectUrlInputValue && (
                            <button
                              onClick={() => setProjectUrlInputValue('')}
                              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                              type="button"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        <button
                          onClick={handleProjectSaveLink}
                          disabled={projectUrlProcessing}
                          className="bg-orange-500 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {projectUrlProcessing ? 'Processing...' : 'Save'}
                        </button>
                        <button
                          onClick={handleProjectCancelLink}
                          disabled={projectUrlProcessing}
                          className="text-gray-400 hover:text-white px-2 py-1.5 rounded text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                      {projectUrlError && (
                        <p className="text-red-400 text-xs">{projectUrlError}</p>
                      )}
                    </div>
                  ) : profileData.project_url ? (
                    <MediaPreview 
                      url={profileData.project_url}
                      type={profileData.project_attachment_type || 'website'}
                      metadata={profileData.project_attachment_metadata || undefined}
                      onClick={handleProjectAddLink}
                      allowPlayback={true}
                    />
                  ) : (
                    <button
                      onClick={handleProjectAddLink}
                      className="flex items-center gap-2 text-orange-400 hover:text-orange-300 transition-colors cursor-pointer"
                    >
                      <Link2 className="w-3 h-3" />
                      <span className="font-medium text-xs">Add project URL</span>
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Voice CTA */}
        <div className="flex items-center mb-6 mt-2 justify-end">
          <div className="flex flex-col items-end mr-4">
            <p className="text-lg font-bold text-white">Add how you can help</p>
            <p className="text-base text-teal-400">Record and have AI review it</p>
          </div>
          <button 
            onClick={() => handleVoiceStart('profile')}
            className="text-3xl hover:scale-110 transition-transform flex-shrink-0"
          >
            <div className="bg-gradient-to-r from-red-500 to-orange-500 p-2 rounded-xl">
              <Phone className="w-8 h-8 text-white" strokeWidth={2.5} />
            </div>
          </button>
        </div>

        {/* Add Resume Section */}
        <div className="flex items-center mb-6 mt-2 justify-end">
          {resumeState === 'complete' ? (
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-2 text-gray-300">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-sm text-teal-400">Resume</span>
              </span>
              <button 
                onClick={handleResumeStart}
                className="text-gray-400 hover:text-white hover:bg-gray-700 p-1 rounded"
              >
                <Edit className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <button 
              onClick={handleResumeStart}
              className="flex items-center gap-2 text-teal-400 hover:text-teal-300 hover:bg-gray-700 transition-all px-2 py-1 rounded-lg"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-sm">Add Resume</span>
            </button>
          )}
        </div>

        {/* Help Cards */}
        <div className="space-y-4">
          {userProblems.map((problem) => (
            <div
              key={problem.id}
              className="bg-gray-800 w-full rounded-2xl shadow-sm hover:shadow-md transition-all border-2 border-teal-400"
            >
              <div className="p-5 relative">
                {/* Status Badge and Actions */}
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-sm text-gray-400">
                    {problem.helped_count > 0 ? `${problem.helped_count} people found this helpful` : 'I can help with'}
                  </h3>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => handleEditProblem(problem)}
                      className="text-teal-400 hover:bg-gray-700 p-1.5 rounded transition-colors"
                      title="Edit card"
                    >
                      <Edit className="h-3 w-3" />
                    </button>
                    <button 
                      onClick={() => handleDeleteProblem(problem.id)}
                      className="text-teal-400 hover:bg-gray-700 p-1.5 rounded transition-colors"
                      title="Delete card"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                {/* Problem Content - Editable */}
                {editingProblem === problem.id ? (
                  <div className="space-y-3">
                    <div>
                      <input
                        type="text"
                        value={editingProblemData.title}
                        onChange={(e) => setEditingProblemData(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm font-medium focus:ring-1 focus:ring-teal-500 focus:border-transparent text-white"
                        placeholder="Experience title..."
                      />
                    </div>
                    <div>
                      <textarea
                        value={editingProblemData.proof}
                        onChange={(e) => setEditingProblemData(prev => ({ ...prev, proof: e.target.value }))}
                        className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-xs resize-none focus:ring-1 focus:ring-teal-500 focus:border-transparent text-white"
                        rows={2}
                        placeholder="Why you can help..."
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSaveProblem(problem.id)}
                        className="bg-teal-500 text-white px-3 py-1 rounded text-xs font-medium hover:bg-teal-600"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingProblem(null)}
                        className="bg-gray-600 text-gray-300 px-3 py-1 rounded text-xs font-medium hover:bg-gray-500"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p 
                      onClick={() => handleEditProblem(problem)}
                      className="text-white leading-relaxed text-xl font-medium mb-3 cursor-pointer hover:bg-gray-700 px-2 py-1 rounded transition-colors"
                    >
                      {problem.title}
                    </p>
                    <p 
                      onClick={() => handleEditProblem(problem)}
                      className="text-gray-400 text-sm text-right cursor-pointer hover:bg-gray-700 px-2 py-1 rounded transition-colors"
                    >
                      {problem.proof}
                    </p>

                    {/* Media attachment section */}
                    <div className="mt-4">
                      {urlInputProblemId === problem.id ? (
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <div className="flex-1 relative">
                              <input
                                type="url"
                                value={urlInputValue}
                                onChange={(e) => setUrlInputValue(e.target.value)}
                                placeholder="Paste URL here..."
                                className="w-full px-3 py-1.5 pr-8 bg-gray-700 border border-gray-600 rounded text-sm text-white placeholder-gray-400 focus:ring-1 focus:ring-teal-500 focus:border-transparent"
                                disabled={urlProcessing}
                              />
                              {urlInputValue && (
                                <button
                                  onClick={() => setUrlInputValue('')}
                                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                                  type="button"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                            <button
                              onClick={() => handleSaveLink(problem.id)}
                              disabled={urlProcessing}
                              className="bg-teal-500 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {urlProcessing ? 'Processing...' : 'Save'}
                            </button>
                            <button
                              onClick={handleCancelLink}
                              disabled={urlProcessing}
                              className="text-gray-400 hover:text-white px-2 py-1.5 rounded text-sm"
                            >
                              Cancel
                            </button>
                          </div>
                          {urlError && (
                            <p className="text-red-400 text-xs">{urlError}</p>
                          )}
                        </div>
                      ) : problem.attachment_url ? (
                        <MediaPreview 
                          url={problem.attachment_url}
                          type={problem.attachment_type || 'website'}
                          metadata={problem.attachment_metadata || undefined}
                          onClick={() => handleAddLink(problem.id)}
                        />
                      ) : (
                        <button
                          onClick={() => handleAddLink(problem.id)}
                          className="text-teal-400 text-sm hover:text-teal-300 transition-colors flex items-center gap-1"
                        >
                          <Link2 className="w-3 h-3" />
                          Add link
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}

          {/* Add New Help Card */}
          <div className="bg-gray-800 w-full rounded-2xl shadow-sm hover:shadow-md transition-all border border-gray-700">
            <div className="p-6 relative">
              <button 
                onClick={() => handleVoiceStart('profile')}
                className="w-full py-6 border border-dashed border-gray-600 rounded-lg text-gray-400 hover:border-gray-500 hover:text-gray-300 transition-colors flex items-center justify-center gap-2"
              >
                <Phone className="h-4 w-4" />
                <span className="text-base">Add another way you can help</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Keep existing render functions for other views (renderNewGetHelp, etc.) but update their backgrounds
  const renderNewGetHelp = () => (
    <div className="min-h-screen bg-gray-900 pb-20 px-5">
      {/* Removed fixed top bar to move content up */}
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
                onClick={() => setMatchingFrequency(option)}
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
              <p className="text-lg font-bold text-white">Add your request</p>
              <p className="text-base text-teal-400">Record and have AI review it</p>
            </div>
            <button 
              onClick={() => handleVoiceStart('request')}
              className="text-3xl hover:scale-110 transition-transform flex-shrink-0"
            >
              <div className="bg-teal-500 p-2 rounded-xl">
                <Phone className="w-8 h-8 text-white" strokeWidth={2.5} />
              </div>
            </button>
          </div>
        </div>
        
        <div className="space-y-6">
          {loadingRequests ? (
            <div className="text-center py-8">
              <div className="w-6 h-6 border-2 border-gray-600 border-t-teal-400 rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-gray-500">Loading your requests...</p>
            </div>
          ) : userRequests.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No requests yet</p>
              <button 
                onClick={() => setShowBottomSheet(true)}
                className="text-teal-400 font-medium"
              >
                Create your first request
              </button>
            </div>
          ) : (
            <>
              {userRequests.map(request => (
                <div 
                  key={request.id}
                  className="bg-gray-800 rounded-2xl shadow-sm cursor-pointer transition-all duration-300 overflow-hidden hover:shadow-md border border-gray-700"
                >
                  <div className="p-5 relative">
                    {/* Status Badge and Actions */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="text-xs text-gray-400 flex items-center gap-2">
                        <span>{timeAgo(request.created_at)}</span>
                        <div className="w-1 h-1 bg-current rounded-full"></div>
                        <span className={`${
                          request.status === 'matched' ? 'text-teal-400' :
                          request.status === 'pending' ? 'text-yellow-400' :
                          'text-gray-400'
                        }`}>
                          {request.status_text}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditRequest(request.id);
                          }}
                          className="text-teal-400 hover:bg-gray-700 p-1.5 rounded transition-colors"
                          title="Edit request"
                        >
                          <Edit className="h-3 w-3" />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteRequest(request.id);
                          }}
                          className="text-teal-400 hover:bg-gray-700 p-1.5 rounded transition-colors"
                          title="Delete request"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    {/* Request Content - Show edit form if editing */}
                    {editingRequest === request.id ? (
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs text-gray-400 uppercase tracking-wide">Request:</label>
                          <textarea
                            value={editingRequestData.challenge}
                            onChange={(e) => setEditingRequestData(prev => ({ ...prev, challenge: e.target.value }))}
                            className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm focus:ring-1 focus:ring-teal-500 focus:border-transparent text-white mt-1"
                            rows={3}
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSaveRequestEdit(request.id)}
                            className="bg-teal-500 text-white px-3 py-1 rounded text-xs font-medium hover:bg-teal-600"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setEditingRequest(null);
                              setEditingRequestData({ challenge: '', reason: '', help_type: '', timeline: 'standard' });
                            }}
                            className="bg-gray-600 text-gray-300 px-3 py-1 rounded text-xs font-medium hover:bg-gray-500"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm font-semibold text-white mb-3 leading-tight">
                        "{request.challenge || request.title}"
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              <div 
                className="bg-gray-800 rounded-2xl shadow-sm p-10 text-center cursor-pointer transition-all duration-300 hover:shadow-md hover:transform hover:-translate-y-0.5 border border-gray-700"
                onClick={() => setShowBottomSheet(true)}
              >
                <div className="text-3xl mb-3 text-gray-400">+</div>
                <div className="text-sm font-semibold mb-1 text-white">New request</div>
                <div className="text-xs text-gray-400">What help do you need?</div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bottom Sheet - Dark Theme */}
      {showBottomSheet && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
          <div className="bg-gray-900 w-full rounded-t-3xl p-5 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-white">New Request</h2>
              <button 
                onClick={() => setShowBottomSheet(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Template reminder */}
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <p className="text-sm text-gray-400 mb-2">Follow this template:</p>
                <p className="text-sm text-gray-300 italic">
                  "I need help with [specific challenge] because [brief reason]. I'd like to talk to someone who [type of person/experience]."
                </p>
              </div>

              {/* Single text area for formatted request */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Your Request
                </label>
                <textarea
                  value={helpForm.challenge}
                  onChange={(e) => setHelpForm(prev => ({ 
                    ...prev, 
                    challenge: e.target.value,
                    reason: '', // Clear other fields since we're using one field
                    helpType: ''
                  }))}
                  placeholder="I need help with finding a technical co-founder because I don't have a development background. I'd like to talk to someone who has built a SaaS product from scratch."
                  className="w-full bg-gray-800 text-white rounded-lg p-3 text-sm border border-gray-700 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  rows={4}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Keep it concise and follow the template format
                </p>
              </div>
              
              <button
                onClick={() => handleManualRequestSubmit()}
                disabled={!helpForm.challenge.trim()}
                className={`w-full py-3 rounded-lg text-sm font-semibold ${
                  helpForm.challenge.trim()
                    ? 'bg-teal-500 text-white hover:bg-teal-600'
                    : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                }`}
              >
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderPublicBoard = () => (
    <div className="min-h-screen bg-gray-900 pb-20 px-5">
      {/* Removed fixed top bar to move content up */}
      <div className="max-w-2xl mx-auto px-5 py-10 bg-gray-900">
        <h1 className="text-2xl font-bold text-white mb-1 text-left">People you might be able to help</h1>
      </div>
      
      <div className="px-5 space-y-4">

        <div className="space-y-6">
          {helpRequests.map(request => (
            <div 
              key={request.id} 
              className="bg-gray-800 rounded-2xl shadow-sm p-5 hover:shadow-md transition-all border border-gray-700"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center text-sm font-semibold text-gray-300">
                  {request.avatar}
                </div>
                <div>
                  <p className="text-base font-semibold text-white">{request.person}</p>
                  <p className="text-sm text-gray-400">{request.title} at {request.company}</p>
                </div>
              </div>

              <h3 className="text-lg font-medium text-white mb-3 leading-snug">
                "{request.text}"
              </h3>

              <p className="text-sm text-gray-300 mb-4 leading-relaxed">
                {request.context}
              </p>

              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    showSuccessModal('help');  
                  }}
                  className="bg-teal-500 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-teal-600 transition-colors"
                >
                  I can help
                </button>
                <button className="text-gray-400 text-sm font-medium hover:text-gray-300 hover:bg-gray-700 transition-all py-3 px-4 rounded-lg">
                  Skip
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 p-4 bg-gray-800 rounded-2xl shadow-sm text-center border border-gray-700">
          <h3 className="text-base font-semibold text-white mb-1">That's this week's selection</h3>
          <p className="text-gray-400 text-sm mb-3">
            New requests appear throughout the week, filtered to areas where you have relevant experience.
          </p>
          <button className="text-teal-400 text-sm font-semibold hover:text-teal-300 transition-colors">
            See more requests
          </button>
        </div>
      </div>
    </div>
  );

  const renderMatchConnection = () => (
    <div className="min-h-screen bg-gray-900 pb-20">
      <div className="bg-gray-800 px-4 py-4 sticky top-0 z-10 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <button 
            className="text-gray-400 hover:text-white hover:bg-gray-700 transition-all px-3 py-2 rounded-lg"
            onClick={() => setCurrentView('match-found')}
          >
            ← Back
          </button>
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-teal-500 rounded flex items-center justify-center">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-white">OneGoodIntro</h1>
              <p className="text-xs text-gray-400">Introduction Request</p>
            </div>
          </div>
          <div className="w-12"></div>
        </div>
      </div>

      <div className="px-4 py-8">
        <div className="bg-gray-800 rounded-2xl shadow-sm p-8 text-center border border-gray-700">
          <div className="w-20 h-20 bg-teal-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-teal-400" />
          </div>

          <h2 className="text-2xl font-bold text-white mb-6">Confirmed Your Interest!</h2>

          <div className="mb-6">
            <p className="text-gray-300 text-base leading-relaxed">
              Sarah also received this match. When you both confirm, we'll send introduction emails.
            </p>
          </div>

          <div className="mb-8">
            <p className="text-sm text-gray-400">
              Most matches connect within 2–3 days.
            </p>
          </div>

          <button 
            onClick={() => setCurrentView('match-found')}
            className="w-full bg-teal-500 text-white py-4 rounded-2xl font-semibold hover:bg-teal-600 transition-colors"
          >
            OK, Got It
          </button>
        </div>
      </div>
    </div>
  );

  const renderMatchFound = () => (
    <div className="min-h-screen bg-gray-900 pb-20 px-5">
      {/* Removed fixed top bar to move content up */}
      <div className="max-w-2xl mx-auto px-5 py-10 bg-gray-900">
        <h1 className="text-2xl font-bold text-white mb-1 text-left">Your current match</h1>
      </div>

      {/* Profile Section - Match profile page exactly */}
      <div className="px-5 space-y-4">
        {/* Profile Header - Dark surface box matching profile page */}
        <div className="bg-gray-800 rounded-2xl shadow-sm p-6 border border-gray-700">
          {/* Avatar and Name Section */}
          <div className="flex items-start gap-6 mb-4">
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xl font-semibold text-white flex-shrink-0">
              {matchedPerson.avatar}
            </div>
            
            <div className="flex-1 pt-2">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-white">{matchedPerson.name}</h1>
              </div>
              
              <div className="space-y-3">
                <p className="text-sm text-gray-300 leading-relaxed">
                  {matchedPerson.title} at {matchedPerson.company} • {matchedPerson.location}
                </p>
                
                {/* LinkedIn Section */}
                <div className="flex items-center gap-2">
                  <button className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors px-2 py-1 rounded-lg">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19a.66.66 0 000 .14V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z"/>
                    </svg>
                    <span className="text-sm font-medium">LinkedIn</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Match Box */}
        <div className="bg-gray-800 rounded-2xl shadow-sm p-5 border border-gray-700">
          <div className="mb-4">
            <h3 className="font-semibold text-white text-sm flex items-center">
              <div className="w-2 h-2 bg-teal-400 rounded-full mr-2"></div>
              Strong Match
            </h3>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-teal-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckCircle className="h-4 w-4 text-teal-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">
                  Sarah might help with: <span className="text-teal-400">"Navigate promotion to senior PM level"</span>
                </p>
                <p className="text-gray-400 text-xs mt-1">Based on: her experience with similar career transitions</p>
              </div>
            </div>

            <div className="border-t border-gray-700"></div>

            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <User className="h-4 w-4 text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">
                  You might be able to help with: <span className="text-blue-400">"Get insights on scaling product teams effectively"</span>
                </p>
                <p className="text-gray-400 text-xs mt-1">Based on: your consulting and strategy expertise</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <button 
            onClick={() => setCurrentView('match-connection')}
            className="w-full bg-teal-500 text-white py-4 rounded-2xl font-semibold hover:bg-teal-600 transition-colors"
          >
            Arrange Introduction
          </button>
          <button className="w-full bg-gray-700 text-gray-300 py-4 rounded-2xl font-semibold hover:bg-gray-600 transition-colors border border-gray-600">
            Try again next week
          </button>
        </div>
      </div>
    </div>
  );

  const renderNetwork = () => {
    interface NetworkConnection {
      id: number;
      name: string;
      company: string;
      avatar: string;
      connectionContext: string;
      currentStatus: {
        type: 'looking_for' | 'recently_helped';
        text: string;
      }
    }


    const filteredConnections = networkConnectionsImproved.filter((conn: NetworkConnection) => {
      if (searchTerm === '') return true;
      
      const search = searchTerm.toLowerCase();
      return conn.name.toLowerCase().includes(search) ||
             conn.company.toLowerCase().includes(search) ||
             conn.connectionContext.toLowerCase().includes(search) ||
             conn.currentStatus.text.toLowerCase().includes(search);
    });

    return (
      <div className="min-h-screen bg-gray-900 pb-20 px-5">
        {/* Removed fixed top bar to move content up */}
        <div className="max-w-2xl mx-auto px-5 py-10 bg-gray-900">
          <h1 className="text-2xl font-bold text-white mb-1 text-left">Your network</h1>
          <p className="text-sm text-gray-500">{networkConnectionsImproved.length} connections</p>
        </div>
        
        <div className="px-5 space-y-4">

          <div className="relative mb-8">
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search your network..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-gray-800 rounded-2xl border border-gray-700 focus:bg-gray-700 focus:ring-2 focus:ring-teal-500 focus:outline-none text-base transition-all text-white"
            />
          </div>

          <div className="space-y-6">
            {filteredConnections.map((connection: NetworkConnection) => (
              <div key={connection.id} className="bg-gray-800 rounded-2xl shadow-sm p-4 hover:shadow-md transition-all border border-gray-700">
                <div className="flex items-start space-x-4">
                  <div className="w-14 h-14 bg-gray-700 rounded-full flex items-center justify-center text-gray-300 font-bold text-lg flex-shrink-0">
                    {connection.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white text-lg">{connection.name}</h3>
                    <p className="text-gray-400 mb-2">{connection.company}</p>
                    
                    <div className="mb-3">
                      <p className="text-sm text-gray-500 mb-1">How you connected:</p>
                      <p className="text-sm text-gray-300">{connection.connectionContext}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Current activity:</p>
                      <p className={`text-sm font-medium ${
                        connection.currentStatus.type === 'looking_for' ? 'text-teal-400' : 'text-blue-400'
                      }`}>
                        {connection.currentStatus.text}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setActiveChat(connection.id);
                      setShowChatPanel(true);
                    }}
                    className="p-4 hover:bg-gray-700 rounded-xl transition-all flex-shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center relative"
                  >
                    <MessageCircle className="h-5 w-5 text-gray-400" />
                    {unreadCounts[connection.id] > 0 && (
                      <div className="absolute top-2 right-2 w-5 h-5 bg-teal-500 rounded-full flex items-center justify-center">
                        <span className="text-xs text-white font-bold">{unreadCounts[connection.id]}</span>
                      </div>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredConnections.length === 0 && searchTerm && (
            <div className="text-center py-12">
              <p className="text-gray-500">No connections found matching "{searchTerm}"</p>
            </div>
          )}

          {networkConnectionsImproved.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="h-8 w-8 text-gray-500" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">No connections yet</h3>
              <p className="text-gray-400">Your successful introductions will appear here</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderModal = () => {
    if (!showModal || !modalContent) return null;

    const getIcon = () => {
      switch (modalContent.icon) {
        case 'handshake':
          return <Handshake className="h-12 w-12 text-teal-400 mx-auto" />;
        case 'check':
          return <CheckCircle className="h-12 w-12 text-teal-400 mx-auto" />;
        case 'heart':
          return <Heart className="h-12 w-12 text-purple-400 mx-auto" />;
        default:
          return <CheckCircle className="h-12 w-12 text-teal-400 mx-auto" />;
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-gray-800 rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center border border-gray-700">
          <div className="mb-4">
            {getIcon()}
          </div>
          <h3 className="text-xl font-bold text-white mb-3">{modalContent.title}</h3>
          <p className="text-gray-400 mb-6 text-sm leading-relaxed">
            {modalContent.message}
          </p>
          <button 
            onClick={() => setShowModal(false)}
            className="w-full bg-teal-500 text-white px-6 py-3 rounded-lg hover:bg-teal-600 font-semibold"
          >
            Got it
          </button>
        </div>
      </div>
    );
  };

  const renderBottomNav = () => (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 px-2 py-2 z-40">
      <div className="flex justify-around">
        <button 
          onClick={() => setCurrentView('full-profile')}
          className={`flex flex-col items-center space-y-1 px-4 py-3 rounded-lg min-h-[44px] ${
            currentView === 'full-profile' 
              ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white' 
              : 'text-gray-400 hover:bg-red-900/30 hover:text-red-400 transition-all'
          }`}
        >
          <User className="h-5 w-5" />
          <span className="text-xs font-medium">Profile</span>
        </button>
        <button 
          onClick={() => setCurrentView('new-get-help')}
          className={`flex flex-col items-center space-y-1 px-4 py-3 rounded-xl min-h-[44px] ${
            currentView === 'new-get-help' 
              ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white' 
              : 'text-gray-400 hover:bg-red-900/30 hover:text-red-400 transition-all'
          }`}
        >
          <Target className="h-5 w-5" />
          <span className="text-xs font-medium">Requests</span>
        </button>
        <button 
          onClick={() => setCurrentView('match-found')}
          className={`flex flex-col items-center space-y-1 px-4 py-3 rounded-xl min-h-[44px] ${
            currentView === 'match-found' 
              ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white' 
              : 'text-gray-400 hover:bg-red-900/30 hover:text-red-400 transition-all'
          }`}
        >
          <Users className="h-5 w-5" />
          <span className="text-xs font-medium">Matches</span>
        </button>
        <button 
          onClick={() => setCurrentView('public-board')}
          className={`flex flex-col items-center space-y-1 px-4 py-3 rounded-xl min-h-[44px] ${
            currentView === 'public-board' 
              ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white' 
              : 'text-gray-400 hover:bg-red-900/30 hover:text-red-400 transition-all'
          }`}
        >
          <Heart className="h-5 w-5" />
          <span className="text-xs font-medium">Help Others</span>
        </button>
        <button 
          onClick={() => setCurrentView('network')}
          className={`flex flex-col items-center space-y-1 px-4 py-3 rounded-xl min-h-[44px] ${
            currentView === 'network' 
              ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white' 
              : 'text-gray-400 hover:bg-red-900/30 hover:text-red-400 transition-all'
          }`}
        >
          <Network className="h-5 w-5" />
          <span className="text-xs font-medium">Connections</span>
        </button>
      </div>
    </div>
  );

  const handleDeleteRequest = async (requestId: string) => {
    if (!session?.user?.email) return;
    
    
    try {
      const response = await fetch('/api/requests', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: requestId })
      });

      if (response.ok) {
        console.log('✅ Request deleted successfully');
        
        // Update local state only after successful database deletion
        setUserRequests(prev => prev.filter(req => req.id !== requestId));
      } else {
        const error = await response.json();
        console.error('❌ Failed to delete request:', error);
        alert('Failed to delete request. Please try again.');
      }
    } catch (error) {
      console.error('❌ Network error deleting request:', error);
      alert('Failed to delete request. Please try again.');
    }
  };

  const handleEditRequest = (requestId: string) => {
    const request = userRequests.find(req => req.id === requestId);
    if (request) {
      setEditingRequestData({
        challenge: request.challenge || request.title || '', // Handle both field names
        reason: request.reason || request.proof || '',
        help_type: request.help_type || '',
        timeline: request.timeline || 'standard'
      });
      setEditingRequest(requestId);
    }
  };

  const handleSaveRequestEdit = async (requestId: string) => {
    if (!session?.user?.email) return;
    
    try {
      const response = await fetch('/api/requests', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: requestId,
          title: editingRequestData.challenge,
          proof: editingRequestData.reason,
          help_type: editingRequestData.help_type,
          timeline: editingRequestData.timeline
        })
      });

      if (response.ok) {
        // Update local state
        setUserRequests(prev => prev.map(req => 
          req.id === requestId 
            ? {
                ...req,
                challenge: editingRequestData.challenge,
                reason: editingRequestData.reason,
                help_type: editingRequestData.help_type,
                timeline: editingRequestData.timeline,
                updated_at: new Date().toISOString()
              } as HelpRequest
            : req
        ));
        
        setEditingRequest(null);
        setEditingRequestData({ challenge: '', reason: '', help_type: '', timeline: 'standard' });
      } else {
        alert('Failed to update request. Please try again.');
      }
    } catch (error) {
      console.error('Error updating request:', error);
      alert('Failed to update request. Please try again.');
    }
  };

  const renderRequestsPage = () => {
    return (
      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">My Requests</h2>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Add Request
            </button>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search requests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Matching:</span>
              <select
                value={matchingFrequency}
                onChange={(e) => setMatchingFrequency(e.target.value as 'daily' | 'weekly' | 'off')}
                className="px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="off">Off</option>
              </select>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {userRequests.map((request) => (
            <div
              key={request.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{request.challenge}</h3>
                  <p className="text-sm text-gray-600 mt-1">{request.reason}</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEditRequest(request.id)}
                    className="p-2 text-gray-600 hover:text-blue-600"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDeleteRequest(request.id)}
                    className="p-2 text-gray-600 hover:text-red-600"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Help Type: <span className="text-gray-900">{request.help_type}</span></p>
                  <p className="text-gray-600">Timeline: <span className="text-gray-900">{request.timeline}</span></p>
                  <p className="text-gray-600">Status: <span className="text-gray-900">{request.status}</span></p>
                </div>
                <div>
                  <p className="text-gray-600">Views: <span className="text-gray-900">{request.views}</span></p>
                  <p className="text-gray-600">Matches: <span className="text-gray-900">{request.match_count}</span></p>
                  <p className="text-gray-600">Created: <span className="text-gray-900">{timeAgo(request.created_at)}</span></p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Status: {request.status_text}</span>
                  <span className="text-sm text-gray-600">Last Updated: {timeAgo(request.updated_at)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const handleRequestApproval = async (approved: boolean) => {
    if (approved && currentRequestData && session?.user?.email) {
      try {
        // Save to database after approval
        const requestPayload = {
          title: currentRequestData.formattedRequest,
          proof: 'Created via voice recording',
          help_type: 'Voice request',
          timeline: 'standard'
        };

        const saveResponse = await fetch('/api/requests', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestPayload)
        });

        if (saveResponse.ok) {
          const newRequest = await saveResponse.json();
          console.log('✅ Voice request saved successfully:', newRequest);
          
          // Refresh the requests list
          await loadUserRequests();
          
          // Reset validation state
          setShowRequestValidation(false);
          setCurrentRequestData(null);
          setVoiceTranscript('');
          
          // Go directly to requests page - no success popup
          setCurrentView('new-get-help');
          
          return; // Exit early on success
        } else {
          const error = await saveResponse.json();
          console.error('❌ Failed to save voice request:', error);
          alert('Failed to save request. Please try again.');
        }
      } catch (error) {
        console.error('❌ Network error saving voice request:', error);
        alert('Failed to save request. Please try again.');
      }
    }
    
    // Reset validation state (for reject or error cases)
    setShowRequestValidation(false);
    setCurrentRequestData(null);
    setVoiceTranscript('');
  };

  const renderRequestValidation = () => {
    if (!showRequestValidation || !currentRequestData) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-gray-800 rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-gray-700">
          <h3 className="text-xl font-bold text-white mb-4 text-center">Review Your Request</h3>
          
          <div className="bg-gray-700 rounded-lg p-4 mb-6 border border-gray-600">
            <p className="text-sm text-white leading-relaxed">
              {currentRequestData.formattedRequest}
            </p>
          </div>

          <div className="space-y-3">
            <button 
              onClick={() => handleRequestApproval(true)}
              className="w-full bg-teal-500 text-white py-3 rounded-lg font-semibold hover:bg-teal-600"
            >
              Submit This Request
            </button>
            <button 
              onClick={() => handleRequestApproval(false)}
              className="w-full bg-gray-600 text-gray-300 py-3 rounded-lg font-semibold hover:bg-gray-500"
            >
              Try Different Recording
            </button>
          </div>
          
          <p className="text-center text-xs text-gray-500 mt-4">
            Review the AI-generated request before submitting
          </p>
        </div>
      </div>
    );
  };

  const handleManualRequestSubmit = async () => {
    if (!helpForm.challenge.trim() || !session?.user?.email) {
      return;
    }
    
    try {
      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: helpForm.challenge.trim(),
          proof: 'Manual request entry',
          help_type: 'Manual request',
          timeline: 'standard'
        })
      });

      if (response.ok) {
        const newRequest = await response.json();
        console.log('✅ Manual request saved successfully:', newRequest);
        
        // Refresh requests list
        await loadUserRequests();
        
        // Reset and close form
        setShowBottomSheet(false);
        setHelpForm({ challenge: '', reason: '', helpType: '' });
        
        // No popup - just go to requests page with new card visible
        setCurrentView('new-get-help');
      } else {
        const error = await response.json();
        console.error('❌ Failed to save manual request:', error);
        alert('Failed to save request. Please try again.');
      }
    } catch (error) {
      console.error('❌ Network error:', error);
      alert('Network error. Please try again.');
    }
  };

  // Add dynamic limit function
  const getRecordingTimeLimit = () => {
    return recordingType === 'request' ? 20 : 30; // 20s for requests, 30s for experience
  };

  const sendMessage = () => {
    if (messageInput.trim() && activeChat) {
      const newMessage = {
        id: Date.now(),
        text: messageInput,
        sender: 'me' as const,
        timestamp: new Date()
      };
      
      setChatMessages(prev => ({
        ...prev,
        [activeChat]: [...(prev[activeChat] || []), newMessage]
      }));
      
      setMessageInput('');
      
      // Clear unread count for this chat
      setUnreadCounts(prev => ({ ...prev, [activeChat]: 0 }));
    }
  };

  const renderChatPanel = () => {
    if (!showChatPanel) return null;
    
    const activeChatConnection = networkConnectionsImproved.find(conn => conn.id === activeChat);
    const messages = chatMessages[activeChat!] || [];
    
    return (
      <div className="fixed inset-0 z-50 bg-gray-900 flex flex-col">
          {/* Chat header */}
          <div className="bg-gray-800 px-4 py-4 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <button 
                onClick={() => setShowChatPanel(false)}
                className="text-gray-400 hover:text-white p-2"
              >
                <X className="h-5 w-5" />
              </button>
              
              {activeChatConnection && (
                <div className="flex items-center space-x-3 flex-1 ml-3">
                  <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center text-sm font-semibold text-gray-300">
                    {activeChatConnection.avatar}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{activeChatConnection.name}</h3>
                    <p className="text-xs text-gray-400">{activeChatConnection.company}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Active conversations list */}
          <div className="border-b border-gray-700 p-2 flex space-x-2 overflow-x-auto">
            {networkConnectionsImproved.filter(conn => chatMessages[conn.id] || unreadCounts[conn.id] > 0).map(conn => (
              <button
                key={conn.id}
                onClick={() => {
                  setActiveChat(conn.id);
                  setUnreadCounts(prev => ({ ...prev, [conn.id]: 0 }));
                }}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  activeChat === conn.id ? 'bg-gray-700' : 'hover:bg-gray-800'
                }`}
              >
                <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-xs font-semibold text-gray-300">
                  {conn.avatar}
                </div>
                <span className="text-sm text-white">{conn.name.split(' ')[0]}</span>
                {unreadCounts[conn.id] > 0 && (
                  <div className="w-5 h-5 bg-teal-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-bold">{unreadCounts[conn.id]}</span>
                  </div>
                )}
              </button>
            ))}
          </div>
          
          {/* Messages area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map(message => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'me' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                  message.sender === 'me' 
                    ? 'bg-teal-500 text-white' 
                    : 'bg-gray-800 text-white border border-gray-700'
                }`}>
                  <p className="text-sm">{message.text}</p>
                  <p className={`text-xs mt-1 ${
                    message.sender === 'me' ? 'text-teal-200' : 'text-gray-500'
                  }`}>
                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          {/* Message input */}
          <div className="bg-gray-800 p-4 border-t border-gray-700">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message..."
                className="flex-1 bg-gray-700 text-white px-4 py-2 rounded-full focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <button 
                onClick={sendMessage}
                className="bg-teal-500 text-white p-2 rounded-full hover:bg-teal-600 transition-colors"
              >
                <Send className="h-5 w-5" />
              </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="font-sans">
      {currentView === 'auth' && renderAuth()}
      {currentView === 'full-profile' && renderFullProfile()}
      {currentView === 'voice' && renderVoicePopup()}
      {currentView === 'resume' && renderResumePopup()}
      {currentView === 'new-get-help' && renderNewGetHelp()}
      {currentView === 'match-connection' && renderMatchConnection()}
      {currentView === 'match-found' && renderMatchFound()}
      {currentView === 'public-board' && renderPublicBoard()}
      {currentView === 'network' && renderNetwork()}
      {renderModal()}
      {currentView !== 'auth' && renderBottomNav()}
      {renderRequestValidation()}
      
      {/* Chat Panel */}
      {renderChatPanel()}
      
      {/* Floating Messages Indicator */}
      {currentView === 'network' && Object.values(unreadCounts).reduce((a, b) => a + b, 0) > 0 && !showChatPanel && (
        <button
          onClick={() => {
            const firstUnreadChat = Object.entries(unreadCounts).find(([_, count]) => count > 0);
            if (firstUnreadChat) {
              setActiveChat(parseInt(firstUnreadChat[0]));
              setShowChatPanel(true);
            }
          }}
          className="fixed bottom-24 right-4 bg-teal-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center space-x-2 hover:bg-teal-600 transition-colors z-30"
        >
          <MessageCircle className="h-5 w-5" />
          <span className="font-medium">Messages ({Object.values(unreadCounts).reduce((a, b) => a + b, 0)})</span>
        </button>
      )}

      {showVoiceValidation && currentVoiceCard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4 text-center">Review Your Experience</h3>
            
            <div className="bg-gray-700 rounded-lg p-4 mb-6 border border-gray-600">
              <h4 className="font-semibold text-white mb-2">{currentVoiceCard.title}</h4>
              <p className="text-sm text-gray-300">{currentVoiceCard.proof}</p>
            </div>

            <div className="space-y-3">
              <button 
                onClick={() => handleVoiceApproval(true)}
                className="w-full bg-teal-500 text-white py-3 rounded-lg font-semibold hover:bg-teal-600"
              >
                Add to Profile
              </button>
              <button 
                onClick={() => handleVoiceApproval(false)}
                className="w-full bg-gray-600 text-gray-300 py-3 rounded-lg font-semibold hover:bg-gray-500"
              >
                Try Different Recording
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resume Validation UI */}
      {(showResumeValidation || generatingCard) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-gray-700">
            {generatingCard ? (
              // Loading state
              <div className="text-center">
                <div className="w-12 h-12 bg-teal-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Finding next experience...</h3>
                <p className="text-sm text-gray-400">
                  Card {cardsAccepted + 1} of 5 • {totalAttempts + 1} attempts made
                </p>
              </div>
            ) : currentResumeCard ? (
              // Card display state
              <>
                <div className="text-center mb-4">
                  <h3 className="text-xl font-bold text-white mb-2">AI found this experience</h3>
                  <p className="text-sm text-gray-400">
                    Card {cardsAccepted + 1} of 5 • {totalAttempts + 1} attempts made
                  </p>
                </div>
                
                <div className="bg-gray-700 rounded-lg p-4 mb-6 border border-gray-600">
                  <h4 className="font-semibold text-white mb-2">{currentResumeCard.title}</h4>
                  <p className="text-sm text-gray-300">{currentResumeCard.proof}</p>
                </div>

                <div className="space-y-3">
                  <button 
                    onClick={() => handleResumeApproval(true)}
                    className="w-full bg-teal-500 text-white py-3 rounded-lg font-semibold hover:bg-teal-600"
                  >
                    ✓ Add to Profile
                  </button>
                  <button 
                    onClick={() => handleResumeApproval(false)}
                    className="w-full bg-gray-600 text-gray-300 py-3 rounded-lg font-semibold hover:bg-gray-500"
                  >
                    ✗ Try Again
                  </button>
                  <button 
                    onClick={() => {
                      setShowResumeValidation(false);
                      setCurrentView('full-profile');
                    }}
                    className="w-full bg-gray-700 text-gray-400 py-2 rounded-lg font-medium hover:bg-gray-600 text-sm"
                  >
                    Done for now
                  </button>
                </div>

                {cardsAccepted >= 4 && (
                  <p className="text-center text-xs text-gray-500 mt-4">
                    Almost done! 1 more card to go.
                  </p>
                )}
              </>
            ) : (
              // Fallback state
              <div className="text-center">
                <h3 className="text-xl font-bold text-white mb-2">Loading...</h3>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OneGoodIntroMobile;
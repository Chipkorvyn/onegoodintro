'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { User, CheckCircle, Users, Plus, Zap, Target, Heart, Network, Handshake, MessageCircle, Check, MapPin, Building2, X, Edit, Trash2, Mic, Brain, ArrowRight, TrendingUp, Phone, Link2, Globe, Send, Camera } from 'lucide-react';
import { useSession, signIn, signOut } from 'next-auth/react'
import { supabase, type User as DbUser, type UserProblem, type HelpRequest, timeAgo } from '@/lib/supabase'
import { MediaPreview } from '@/components/MediaPreview'
import StatusBadge from '@/components/StatusBadge'
import Modal, { type ModalContent, type ModalIconType } from '@/components/Modal'
import AuthScreen from '@/components/AuthScreen'
import BottomNavigation from '@/components/BottomNavigation'
import { ResumeUploadModal } from '@/components/ResumeUploadModal'
import { VoiceRecordingModal } from '@/components/VoiceRecordingModal'
import EditableProfileField from '@/components/EditableProfileField'
import ChatPanel from '@/components/ChatPanel'
import HelpRequestForm from '@/components/HelpRequestForm'
import ProfileView from '@/components/ProfileView'
import { processMediaUrl, isValidUrl, normalizeUrl } from '@/lib/url-processor'
import { formatTime } from '@/lib/time-utils'
import { calculateProfileCompletion, type ProfileData as UtilProfileData } from '@/lib/profile-utils'
import { getRecordingTimeLimit, type RecordingType } from '@/lib/recording-utils'

// Define proper types
type ActiveFieldType = 'challenge' | 'reason' | 'helpType' | 'name' | 'about' | 'linkedin' | 'role_title' | 'industry' | 'experience_years' | 'focus_area' | 'learning_focus' | 'project_description' | 'project_url' | 'help_title' | 'help_proof' | null;
// ModalIconType is now imported from Modal component

// Add NetworkConnection interface
interface NetworkConnection {
  id: string;
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

// Add Match interface
interface Match {
  id: string;
  status: 'pending' | 'accepted' | 'completed' | 'declined';
  other_user?: {
    name?: string;
    current_focus?: string;
    background?: string;
  };
  rationale?: string;
  is_mutual?: boolean;
  is_seeker?: boolean;
  you_give?: string;
  you_get?: string;
  they_give?: string;
  they_get?: string;
  request?: {
    title?: string;
  };
  mutual_score?: number;
}

// Add MatchedPerson interface
interface MatchedPerson {
  name?: string;
  title?: string;
  company?: string;
  avatar?: string;
  expertise?: string[];
  location?: string;
}

// Use ProfileData type from utils
type ProfileData = UtilProfileData;

const OneGoodIntroMobile = () => {
  
  // Session and user data
  const { data: session, status } = useSession()
  
  // Temporary mock session for testing - REMOVE IN PRODUCTION
  const mockSession = {
    user: {
      email: 'test@example.com',
      name: 'Test User'
    }
  }
  
  // Use mock session if auth is failing
  const effectiveSession = session || mockSession
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
  // Mock data for testing
  const mockUserRequests: HelpRequest[] = [
    {
      id: '1',
      user_id: 'test@example.com',
      title: 'Need help with React',
      proof: 'I have 2 years experience',
      help_type: 'Technical advice',
      timeline: 'standard',
      status: 'pending',
      status_text: 'Looking for match',
      views: 5,
      match_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      challenge: 'Need help with React hooks',
      reason: 'I have basic experience but need advanced guidance',
      matching_frequency: 'weekly',
      website: 'https://example.com',
      media: 'https://example.com/video'
    },
    {
      id: '2',
      user_id: 'test@example.com',
      title: 'Career transition advice',
      proof: 'Transitioning from marketing to tech',
      help_type: 'Career advice',
      timeline: 'urgent',
      status: 'pending',
      status_text: 'Looking for match',
      views: 3,
      match_count: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      challenge: 'How to transition from marketing to product management',
      reason: 'I have 5 years in marketing but want to move to tech',
      matching_frequency: 'daily'
    }
  ];

  const [userRequests, setUserRequests] = useState<HelpRequest[]>(mockUserRequests)
  const [loadingRequests, setLoadingRequests] = useState(false)
  const [networkConnections, setNetworkConnections] = useState<NetworkConnection[]>([])
  const [loadingNetwork, setLoadingNetwork] = useState(false)

  // Load confirmed matches for network (where both users accepted)
  useEffect(() => {
    const loadNetworkConnections = async () => {
      if (session?.user?.email) {
        setLoadingNetwork(true)
        try {
          const response = await fetch('/api/matches')
          if (response.ok) {
            const data = await response.json()
            console.log('🔍 Debug: Raw API response:', data)
            
            // Handle different response structures
            const matches = Array.isArray(data) ? data : (data.data?.matches || data.matches || data.data || [])
            console.log('🔍 Debug: Processed matches array:', matches)
            
            if (!Array.isArray(matches)) {
              console.error('❌ Matches is not an array:', typeof matches, matches)
              setNetworkConnections([])
              return
            }
            
            console.log('🔍 Debug: Match statuses:', matches.map((m: Match) => ({ id: m.id, status: m.status })))
            
            // Convert accepted/completed matches to network connections for testing
            const connections = matches
              .filter((match: Match) => match.status === 'accepted' || match.status === 'completed')
              .map((match: Match, index: number) => ({
                id: match.id, // Use the actual match ID from confirmed_matches table
                name: match.other_user?.name || 'Unknown',
                title: match.other_user?.current_focus || 'Professional',
                company: match.other_user?.background || '',
                avatar: match.other_user?.name?.split(' ').map((n: string) => n[0]).join('') || '??',
                connectionContext: match.rationale || 'Mutual benefit match',
                currentStatus: {
                  type: match.is_mutual ? 'mutual_benefit' as const : (match.is_seeker ? 'recently_helped' as const : 'looking_for' as const),
                  text: match.is_mutual 
                    ? `You give: ${match.you_give} | You get: ${match.you_get}`
                    : match.is_seeker 
                      ? `They help you with: ${match.request?.title}`
                      : `You help them with: ${match.request?.title}`
                }
              }))
            
            setNetworkConnections(connections)
          }
        } catch (error) {
          console.error('Error loading network connections:', error)
        } finally {
          setLoadingNetwork(false)
        }
      }
    }

    loadNetworkConnections()
  }, [session])

  // Profile completion calculation (now using utility function)
  const getProfileCompletion = () => calculateProfileCompletion(profileData)

  // Request editing state
  const [editingRequest, setEditingRequest] = useState<string | null>(null);
  const [editingRequestData, setEditingRequestData] = useState<{
    challenge: string;
    reason: string;
    help_type: string;
    timeline: 'standard' | 'urgent' | 'flexible';
    website?: string;
    media?: string;
  }>({ challenge: '', reason: '', help_type: '', timeline: 'standard' });

  // Voice recording state
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
  const [showResumeValidation, setShowResumeValidation] = useState<boolean>(false);
  const [currentResumeCard, setCurrentResumeCard] = useState<{
    title: string;
    proof: string;
  } | null>(null);
  const [cardsAccepted, setCardsAccepted] = useState<number>(0);
  const [totalAttempts, setTotalAttempts] = useState<number>(0);
  const [resumeConversationHistory, setResumeConversationHistory] = useState<any[]>([]);
  const [resumeText, setResumeText] = useState<string>('');
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
    if (effectiveSession?.user?.email) {
      loadUserRequests()
      loadNetworkData()
    }
  }, [effectiveSession])


  // formatTime is now imported from utils

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
      
      // Handle photo URL - if it's a path, generate signed URL
      if (user.image) {
        if (user.image.startsWith('http')) {
          // It's already a full URL (e.g., from Google)
          setPhotoUrl(user.image);
        } else {
          // It's a storage path, generate signed URL
          const { data: signedUrlData } = await supabase.storage
            .from('profile-photos')
            .createSignedUrl(user.image, 3600); // 1 hour expiry
          
          if (signedUrlData) {
            setPhotoUrl(signedUrlData.signedUrl);
            setPhotoPath(user.image);
          }
        }
      }
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
    if (!effectiveSession?.user?.email) return
    
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

  const loadNetworkData = async () => {
    if (!effectiveSession?.user?.email) return
    
    setLoadingNetwork(true)
    try {
      const response = await fetch('/api/network')
      if (response.ok) {
        const connections = await response.json()
        setNetworkConnections(connections)
        console.log('Loaded network connections:', connections)
      } else {
        console.error('Failed to load network connections')
      }
    } catch (error) {
      console.error('Error loading network connections:', error)
    } finally {
      setLoadingNetwork(false)
    }
  }

  const handleGoogleSignIn = () => {
    signIn('google')
  }

  // Voice recording handlers
  const handleVoiceStart = (type: 'profile' | 'request') => {
    setRecordingType(type);
    setCurrentView('voice');
  };


  // Resume handlers
  const handleResumeStart = () => {
    setCurrentView('resume');
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

  // Match data for connection flow - load from actual matches API
  const [matchedPerson, setMatchedPerson] = useState<MatchedPerson | null>(null);
  const [currentMatch, setCurrentMatch] = useState<Match | null>(null); // Store full match object with ID
  const [matchAccepting, setMatchAccepting] = useState(false); // Track API call state
  
  // Load real matches from API
  useEffect(() => {
    const loadMatches = async () => {
      if (session?.user?.email) {
        try {
          const response = await fetch('/api/matches');
          console.log('🔍 Debug: Matches API response status:', response.status);
          if (response.ok) {
            const data = await response.json();
            console.log('🔍 Debug: Raw matches response:', data);
            
            // Handle different response structures
            const matches = Array.isArray(data) ? data : (data.data?.matches || data.matches || data.data || []);
            console.log('🔍 Debug: Processed matches:', matches);
            
            if (!Array.isArray(matches)) {
              console.error('❌ Matches is not an array in loadMatches:', typeof matches, matches);
              return;
            }
            
            if (matches.length > 0) {
              // Use the first match as the "current match"
              const firstMatch = matches[0];
              console.log('🔍 Debug: First match:', firstMatch);
              setCurrentMatch(firstMatch); // Store full match object
              setMatchedPerson({
                name: firstMatch.other_user?.name,
                title: firstMatch.other_user?.current_focus,
                company: firstMatch.other_user?.background,
                avatar: firstMatch.other_user?.name?.split(' ').map((n: string) => n[0]).join('') || '??',
                expertise: [firstMatch.rationale || 'Professional guidance']
              });
            } else {
              console.log('🔍 Debug: No matches returned');
            }
          } else {
            const errorText = await response.text();
            console.error('🔍 Debug: Matches API error:', response.status, errorText);
          }
        } catch (error) {
          console.error('Error loading matches:', error);
        }
      }
    };

    loadMatches();
  }, [session]);

  // Define proper types
  type ActiveFieldType = 'challenge' | 'reason' | 'helpType' | 'name' | 'about' | 'linkedin' | 'role_title' | 'industry' | 'experience_years' | 'focus_area' | 'learning_focus' | 'project_description' | 'project_url' | 'help_title' | 'help_proof' | null;
  // ModalIconType is now imported from Modal component

  // State management
  const [currentView, setCurrentView] = useState<'auth' | 'full-profile' | 'match-found' | 'match-connection' | 'public-board' | 'network' | 'new-get-help' | 'voice' | 'resume' | 'messages'>('new-get-help'); // Start with help view for testing
  const [showModal, setShowModal] = useState<boolean>(false);
  const [modalContent, setModalContent] = useState<ModalContent | null>(null);
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
    helpType: '',
    website: '',
    media: ''
  });
  const [selectedTimeline, setSelectedTimeline] = useState<'urgent' | 'standard' | 'flexible'>('standard');
  const [activeField, setActiveField] = useState<ActiveFieldType>(null);

  // Enhanced profile editing state
  const [editingField, setEditingField] = useState<ActiveFieldType>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [savingField, setSavingField] = useState<ActiveFieldType>(null);
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

  // Messaging state
  const [selectedConnection, setSelectedConnection] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageText, setMessageText] = useState<string>('');
  const [sendingMessage, setSendingMessage] = useState<boolean>(false);
  const [loadingMessages, setLoadingMessages] = useState<boolean>(false);

  // Add dedicated ref for about field
  const aboutRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle match acceptance
  const handleArrangeIntroduction = async () => {
    if (!currentMatch?.id) {
      console.error('No current match to accept');
      return;
    }

    console.log('🔍 Debug: Attempting to accept match:', {
      matchId: currentMatch.id,
      fullMatch: currentMatch
    });

    setMatchAccepting(true);
    try {
      console.log('📡 Making API call to:', `/api/matches/${currentMatch.id}/accept`);
      const response = await fetch(`/api/matches/${currentMatch.id}/accept`, {
        method: 'POST'
      });

      console.log('📊 API Response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (response.ok) {
        console.log('✅ Match accepted successfully');
        // Update the current match status to accepted
        setCurrentMatch(prev => prev ? { ...prev, status: 'accepted' } : null);
        // Skip the connection popup and stay on match-found view with updated button
        // setCurrentView('match-connection'); // Commented out - no more popup
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to accept match:', errorText);
        console.error('🔍 Debug: Response status:', response.status);
      }
    } catch (error) {
      console.error('💥 Network error accepting match:', error);
    } finally {
      console.log('🏁 Setting matchAccepting to false');
      setMatchAccepting(false);
    }
  };

  // Messaging functions
  const loadMessages = async (connectionId: string) => {
    if (!connectionId) return;
    
    console.log('🔍 Loading messages for connection:', connectionId);
    setLoadingMessages(true);
    try {
      const response = await fetch(`/api/messages/${connectionId}`);
      console.log('📊 Messages API response:', response.status, response.statusText);
      
      if (response.ok) {
        const messagesData = await response.json();
        console.log('✅ Messages loaded:', messagesData);
        setMessages(messagesData);
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to load messages:', response.status, errorText);
      }
    } catch (error) {
      console.error('💥 Error loading messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const sendNewMessage = async () => {
    if (!selectedConnection?.id || !messageText.trim() || sendingMessage) return;

    setSendingMessage(true);
    try {
      const response = await fetch(`/api/messages/${selectedConnection.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message_text: messageText.trim()
        })
      });

      if (response.ok) {
        const newMessage = await response.json();
        setMessages(prev => [...prev, newMessage]);
        setMessageText('');
      } else {
        console.error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSendingMessage(false);
    }
  };

  const openMessages = (connection: any) => {
    setSelectedConnection(connection);
    setCurrentView('messages');
    loadMessages(connection.id);
  };

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
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<Record<string, Array<{id: number, text: string, sender: 'me' | 'them', timestamp: Date}>>>({});
  const [messageInput, setMessageInput] = useState('');
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({
    1: 2,
    3: 1,
    5: 0
  });
  const [chatView, setChatView] = useState<'list' | 'chat'>('list');

  // Photo upload state
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [photoPath, setPhotoPath] = useState<string>(''); // Store the path for signed URLs

  // Initialize chat messages if not exists
  const initializeChat = useCallback((connectionId: string) => {
    if (!chatMessages[connectionId]) {
      // Sample initial messages
      const initialMessages: Record<string, Array<{id: number, text: string, sender: 'me' | 'them', timestamp: Date}>> = {
        "1": [
          { id: 1, text: "Hey! Thanks for connecting. I'd love to hear more about your team scaling challenges.", sender: 'them', timestamp: new Date(Date.now() - 86400000) },
          { id: 2, text: "I saw you helped with M&A integration - that's exactly what I'm working on!", sender: 'them', timestamp: new Date(Date.now() - 3600000) }
        ],
        "3": [
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


  // Initialize chat when opening
  useEffect(() => {
    if (activeChat && showChatPanel) {
      initializeChat(activeChat);
    }
  }, [activeChat, showChatPanel, initializeChat]);

  // Skip simulated auth flow, go straight to profile if signed in
  useEffect(() => {
    // Temporarily disabled for testing help cards
    // if (status === 'authenticated' && currentView === 'auth') {
    //   setCurrentView('full-profile')
    // }
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

  // Photo upload handler
  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !session?.user?.email) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a valid image file (JPEG, PNG, or GIF)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Please upload an image smaller than 5MB');
      return;
    }

    setUploadingPhoto(true);

    try {
      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('email', session.user.email);

      // Upload to API endpoint
      const response = await fetch('/api/upload-photo', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to upload photo');
      }

      const { url: photoPath } = await response.json();

      // Update database with the path
      const { error } = await supabase
        .from('users')
        .update({ image: photoPath })
        .eq('email', session.user.email);

      if (error) throw error;

      // Generate signed URL for immediate display
      const { data: signedUrlData, error: urlError } = await supabase.storage
        .from('profile-photos')
        .createSignedUrl(photoPath, 3600); // 1 hour expiry

      if (!urlError && signedUrlData) {
        setPhotoUrl(signedUrlData.signedUrl);
        setPhotoPath(photoPath);
      }
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Failed to upload photo. Please try again.');
    } finally {
      setUploadingPhoto(false);
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

  const handleProfileFieldSave = async (fieldName: ActiveFieldType) => {
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
      } else if (fieldName === 'project_description') {
        const { error } = await supabase
          .from('users')
          .update({ project_description: value })
          .eq('email', session.user.email);

        if (!error) {
          setProfileData(prev => ({ ...prev, project_description: value }));
        }
      }
    } catch (error) {
      console.error('Error saving field:', error);
    } finally {
      setSavingField(null);
      setEditingField(null);
    }
  };

  const handleProfileFieldBlur = (fieldName: ActiveFieldType) => {
    if (fieldName) {
      handleProfileFieldSave(fieldName);
    }
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
                onBlur={() => handleProfileFieldBlur(fieldName as ActiveFieldType)}
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


  // Resume upload popup
  // Resume retry handler

  // renderResumePopup is now replaced by ResumePopup component

  // StatusBadge is now imported from separate component

  // renderAuth is now replaced by AuthScreen component

  const renderPublicBoard = () => (
    <div className="min-h-screen bg-gray-900 pb-20 px-5">
      {/* Removed fixed top bar to move content up */}
      <div className="max-w-2xl mx-auto px-5 py-10 bg-gray-900">
        <h1 className="text-2xl font-bold text-white mb-1 text-left">Help Others</h1>
      </div>
      
      <div className="px-5 flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart className="h-10 w-10 text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Coming Soon</h2>
          <p className="text-gray-400 text-base leading-relaxed mb-6">
            We're building a space where you can discover people who need your expertise and experience. 
            This feature will be available soon!
          </p>
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <p className="text-blue-300 text-sm">
              💡 In the meantime, focus on building your profile and getting matched with people who can help you.
            </p>
          </div>
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
              {matchedPerson?.name || "Your match"} also received this match. When you both confirm, we'll send introduction emails.
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

      {!matchedPerson ? (
        <div className="px-5 text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">🤝</div>
          <h2 className="text-xl font-semibold text-gray-300 mb-2">No matches yet</h2>
          <p className="text-gray-500">We're working on finding the perfect match for you. Check back soon!</p>
        </div>
      ) : (
        <>
          {/* Profile Section - Match profile page exactly */}
      <div className="px-5 space-y-4">
        {/* Profile Header - Dark surface box matching profile page */}
        <div className="bg-gray-800 rounded-2xl shadow-sm p-6 border border-gray-700">
          {/* Avatar and Name Section */}
          <div className="flex items-start gap-6 mb-4">
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xl font-semibold text-white flex-shrink-0">
              {matchedPerson?.avatar || '??'}
            </div>
            
            <div className="flex-1 pt-2">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-white">{matchedPerson?.name || 'Your Match'}</h1>
              </div>
              
              <div className="space-y-3">
                <p className="text-sm text-gray-300 leading-relaxed">
                  {matchedPerson?.title || 'Professional'} {matchedPerson?.company ? `at ${matchedPerson.company}` : ''} {matchedPerson?.location ? `• ${matchedPerson.location}` : ''}
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
              {currentMatch?.mutual_score ? `${currentMatch.mutual_score}/10 Match` : 'Strong Match'}
            </h3>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-teal-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckCircle className="h-4 w-4 text-teal-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">
                  {matchedPerson?.name || "Your match"} can help you with: <span className="text-teal-400">"{currentMatch?.you_get || "Professional guidance"}"</span>
                </p>
                <p className="text-gray-400 text-xs mt-1">They bring: {currentMatch?.they_give || "Professional expertise"}</p>
              </div>
            </div>

            <div className="border-t border-gray-700"></div>

            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <User className="h-4 w-4 text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">
                  You can help them with: <span className="text-blue-400">"{currentMatch?.they_get || "Professional guidance"}"</span>
                </p>
                <p className="text-gray-400 text-xs mt-1">You bring: {currentMatch?.you_give || "Your expertise"}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          {currentMatch?.status === 'accepted' ? (
            <div className="w-full bg-green-600 text-white py-4 rounded-2xl font-semibold text-center">
              ✓ Introduction Arranged
            </div>
          ) : (
            <>
              <button 
                onClick={handleArrangeIntroduction}
                disabled={matchAccepting}
                className="w-full bg-teal-500 text-white py-4 rounded-2xl font-semibold hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {matchAccepting ? 'Arranging...' : 'Arrange Introduction'}
              </button>
              <button className="w-full bg-gray-700 text-gray-300 py-4 rounded-2xl font-semibold hover:bg-gray-600 transition-colors border border-gray-600">
                Decline
              </button>
            </>
          )}
        </div>
      </div>
        </>
      )}
    </div>
  );

  const renderNetwork = () => {
    const filteredConnections = networkConnections.filter((conn: NetworkConnection) => {
      if (searchTerm === '') return true;
      
      const search = searchTerm.toLowerCase();
      return conn.name.toLowerCase().includes(search) ||
             conn.company.toLowerCase().includes(search) ||
             conn.connectionContext.toLowerCase().includes(search) ||
             conn.currentStatus.text.toLowerCase().includes(search);
    });

    if (loadingNetwork) {
      return (
        <div className="min-h-screen bg-gray-900 pb-20 px-5 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Loading your network...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gray-900 pb-20 px-5">
        {/* Removed fixed top bar to move content up */}
        <div className="max-w-2xl mx-auto px-5 py-10 bg-gray-900">
          <h1 className="text-2xl font-bold text-white mb-1 text-left">Your network</h1>
          <p className="text-sm text-gray-500">{networkConnections.length} connections</p>
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

          <div className="space-y-4">
            {filteredConnections.map((connection: NetworkConnection) => {
              return (
                <button
                  key={connection.id}
                  onClick={() => openMessages(connection)}
                  className="w-full bg-gray-800 rounded-2xl shadow-sm p-4 hover:shadow-md hover:bg-gray-750 transition-all border border-gray-700 text-left"
                >
                  <div className="flex items-start space-x-4">
                    {/* Avatar */}
                    <div className="w-14 h-14 bg-gray-700 rounded-full flex items-center justify-center text-gray-300 font-bold text-lg flex-shrink-0">
                      {connection.avatar}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Name and Title */}
                      <div className="mb-2">
                        <h3 className="font-bold text-white text-lg mb-1">{connection.name}</h3>
                        <p className="text-gray-400 text-sm">{connection.title} at {connection.company}</p>
                      </div>
                      
                      {/* Current Activity */}
                      {connection.currentStatus && (
                        <div className="mb-3">
                          <p className={`text-sm font-medium ${
                            connection.currentStatus.type === 'looking_for' ? 'text-teal-400' : 'text-blue-400'
                          }`}>
                            {connection.currentStatus.text}
                          </p>
                        </div>
                      )}
                      
                      {/* Message Section */}
                      <div className="border-t border-gray-700 pt-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-500">Send a message</p>
                          <MessageCircle className="h-4 w-4 text-gray-500" />
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {filteredConnections.length === 0 && searchTerm && (
            <div className="text-center py-12">
              <p className="text-gray-500">No connections found matching "{searchTerm}"</p>
            </div>
          )}

          {networkConnections.length === 0 && !loadingNetwork && (
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

  const renderMessages = () => {
    console.log('🔍 Rendering messages view, selectedConnection:', selectedConnection);
    console.log('🔍 Current view:', currentView);
    if (!selectedConnection) {
      console.log('❌ No selectedConnection, not rendering messages');
      return null;
    }

    return (
      <div className="min-h-screen bg-gray-900 pb-20">
        {/* Header */}
        <div className="bg-gray-800 border-b border-gray-700 px-5 py-4 flex items-center">
          <button 
            onClick={() => setCurrentView('network')}
            className="mr-3 p-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowRight className="h-5 w-5 rotate-180" />
          </button>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-teal-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-semibold">
                {selectedConnection.avatar}
              </span>
            </div>
            <div>
              <h3 className="text-white font-semibold">{selectedConnection.name}</h3>
              <p className="text-gray-400 text-sm">{selectedConnection.title}</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 p-5 space-y-4 min-h-[calc(100vh-200px)]">
          {loadingMessages ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-400">Loading messages...</p>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No messages yet</p>
              <p className="text-gray-500 text-sm mt-2">Start the conversation!</p>
            </div>
          ) : (
            messages.map((message) => {
              const isOwnMessage = message.sender_id === session?.user?.email;
              const timestamp = new Date(message.created_at).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              });

              return (
                <div 
                  key={message.id} 
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                    isOwnMessage 
                      ? 'bg-teal-500 text-white' 
                      : 'bg-gray-700 text-white'
                  }`}>
                    <p className="text-sm">{message.message_text}</p>
                    <p className={`text-xs mt-1 ${
                      isOwnMessage ? 'text-teal-100' : 'text-gray-400'
                    }`}>
                      {timestamp}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Message Input */}
        <div className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 p-4 z-50">
          <div className="flex items-center space-x-3">
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendNewMessage()}
              placeholder="Type a message..."
              className="flex-1 bg-gray-700 border border-gray-600 rounded-full px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-teal-500"
              disabled={sendingMessage}
              maxLength={1000}
            />
            <button
              onClick={sendNewMessage}
              disabled={!messageText.trim() || sendingMessage}
              className="bg-teal-500 text-white p-2 rounded-full hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  // renderModal is now replaced by Modal component

  // renderBottomNav is now replaced by BottomNavigation component

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
        timeline: request.timeline || 'standard',
        website: request.website || '',
        media: request.media || ''
      });
      setEditingRequest(requestId);
    }
  };

  const handleSaveRequestEdit = async (requestId: string) => {
    if (!effectiveSession?.user?.email) return;
    
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
          timeline: editingRequestData.timeline,
          website: editingRequestData.website,
          media: editingRequestData.media
        })
      });
      
      if (response.ok) {
        const responseData = await response.json();
        
        // Update local state
        setUserRequests(prev => prev.map(req => 
          req.id === requestId 
            ? {
                ...req,
                challenge: editingRequestData.challenge,
                reason: editingRequestData.reason,
                help_type: editingRequestData.help_type,
                timeline: editingRequestData.timeline,
                // Only update website/media if they were successfully saved
                ...(responseData.website !== undefined && { website: editingRequestData.website }),
                ...(responseData.media !== undefined && { media: editingRequestData.media }),
                updated_at: new Date().toISOString()
              } as HelpRequest
            : req
        ));
        
        setEditingRequest(null);
        setEditingRequestData({ challenge: '', reason: '', help_type: '', timeline: 'standard', website: '', media: '' });
      } else {
        alert('Failed to update request. Please try again.');
      }
    } catch (error) {
      console.error('Error updating request:', error);
      alert('Failed to update request. Please try again.');
    }
  };

  const handleEditingRequestChange = (data: { challenge: string; reason: string; help_type: string; timeline: 'standard' | 'urgent' | 'flexible'; website?: string; media?: string; }) => {
    setEditingRequestData(data);
  };

  const handleCancelEdit = () => {
    setEditingRequest(null);
    setEditingRequestData({ challenge: '', reason: '', help_type: '', timeline: 'standard', website: '', media: '' });
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
          proof: cardData.proof || cardData.reason || '',
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

  const renderVoiceValidation = () => {
    if (!showVoiceValidation || !currentVoiceCard) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-gray-800 rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-gray-700">
          <h3 className="text-xl font-bold text-white mb-4 text-center">Review Your Help Card</h3>
          
          <div className="bg-gray-700 rounded-lg p-4 mb-6 border border-gray-600">
            <h4 className="text-sm font-semibold text-teal-400 mb-2">What you can help with:</h4>
            <p className="text-sm text-white font-medium mb-3">
              {currentVoiceCard?.title || 'Loading...'}
            </p>
            <h4 className="text-sm font-semibold text-teal-400 mb-2">Why you can help:</h4>
            <p className="text-sm text-gray-300 leading-relaxed">
              {currentVoiceCard?.proof || 'Loading...'}
            </p>
          </div>

          <div className="space-y-3">
            <button 
              onClick={() => handleVoiceApproval(true)}
              className="w-full bg-teal-500 text-white py-3 rounded-lg font-semibold hover:bg-teal-600"
            >
              Add This Help Area
            </button>
            <button 
              onClick={() => handleVoiceApproval(false)}
              className="w-full bg-gray-600 text-gray-300 py-3 rounded-lg font-semibold hover:bg-gray-500"
            >
              Try Different Recording
            </button>
          </div>
          
          <p className="text-center text-xs text-gray-500 mt-4">
            Review the AI-generated help card before adding to your profile
          </p>
        </div>
      </div>
    );
  };

  const handleVoiceApproval = async (approved: boolean) => {
    if (approved && currentVoiceCard && session?.user?.email) {
      try {
        console.log('Attempting to save card:', {
          user_id: session.user.email,
          title: currentVoiceCard.title,
          proof: currentVoiceCard.proof
        });
        
        // Save the card data to database (removed ai_generated field since it was dropped from table)
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
          console.error('Failed to save voice-generated card:', error);
          console.error('Error details:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          });
          // Show user-friendly error
          alert('Failed to save help card. Please try again.');
        } else if (data) {
          // Update local state to show new card immediately
          setUserProblems(prev => [...prev, data]);
          console.log('Voice-generated card saved successfully:', data);
        }
      } catch (saveError) {
        console.error('Error saving voice card:', saveError);
      }
    }
    
    // Close validation modal and return to profile
    setShowVoiceValidation(false);
    setCurrentVoiceCard(null);
    setCurrentView('full-profile');
    
    if (!approved) {
      // If user wants to try again, go back to voice recording
      setTimeout(() => {
        setCurrentView('voice');
      }, 100);
    }
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
          timeline: 'standard',
          website: helpForm.website?.trim() || null,
          media: helpForm.media?.trim() || null
        })
      });

      if (response.ok) {
        const newRequest = await response.json();
        console.log('✅ Manual request saved successfully:', newRequest);
        
        // Refresh requests list
        await loadUserRequests();
        
        // Reset and close form
        setShowBottomSheet(false);
        setHelpForm({ challenge: '', reason: '', helpType: '', website: '', media: '' });
        
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

  // getRecordingTimeLimit is now imported from utils

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

  // Get last message for each conversation
  const getLastMessage = (connectionId: string) => {
    const messages = chatMessages[connectionId] || [];
    if (messages.length === 0) return null;
    return messages[messages.length - 1];
  };

  // Get conversations with messages or unread counts
  const getActiveConversations = () => {
    return networkConnections.filter(conn => 
      chatMessages[conn.id]?.length > 0 || unreadCounts[conn.id] > 0
    );
  };

  const handleSendMessage = () => {
    if (!messageText.trim() || !activeChat || sendingMessage) return;
    
    setSendingMessage(true);
    
    const newMessage = {
      id: Date.now(),
      text: messageText.trim(),
      sender: 'me' as const,
      timestamp: new Date()
    };
    
    setChatMessages(prev => ({
      ...prev,
      [activeChat]: [...(prev[activeChat] || []), newMessage]
    }));
    
    setMessageText('');
    setSendingMessage(false);
  };



  return (
    <div className="font-sans">
      
      {currentView === 'auth' && <AuthScreen isLoading={isLoading} onGoogleSignIn={handleGoogleSignIn} />}
      {currentView === 'full-profile' && (
        <ProfileView
          profileData={profileData}
          userProblems={userProblems}
          photoUrl={photoUrl}
          editingField={editingField}
          fieldValues={fieldValues}
          savingField={savingField}
          linkedinUrl={linkedinUrl}
          editingLinkedin={editingLinkedin}
          projectUrlInputActive={projectUrlInputActive}
          projectUrlInputValue={projectUrlInputValue}
          projectUrlProcessing={projectUrlProcessing}
          projectAttachment={profileData.project_url ? {
            url: profileData.project_url,
            type: (profileData as any).project_attachment_type || 'website',
            metadata: (profileData as any).project_attachment_metadata
          } : null}
          uploadingPhoto={uploadingPhoto}
          fileInputRef={fileInputRef}
          aboutRef={aboutRef}
          resumeStatus={resumeStatus}
          resumeValue={resumeValue}
          onProfileFieldClick={handleProfileFieldClick}
          onProfileFieldChange={handleProfileFieldChange}
          onProfileFieldSave={handleProfileFieldSave}
          onPhotoUpload={handlePhotoUpload}
          onLinkedinClick={handleLinkedinClick}
          onLinkedinSave={handleLinkedinSave}
          onVoiceStart={handleVoiceStart}
          onResumeUpload={handleResumeUploadProfile}
          setEditingField={setEditingField}
          setEditingLinkedin={setEditingLinkedin}
          setLinkedinUrl={setLinkedinUrl}
          setProjectUrlInputActive={setProjectUrlInputActive}
          setProjectUrlInputValue={setProjectUrlInputValue}
          handleProjectUrlAdd={handleProjectAddLink}
          handleProjectUrlRemove={handleProjectRemoveLink}
          getProfileCompletion={getProfileCompletion}
        />
      )}
      <VoiceRecordingModal
        isOpen={currentView === 'voice'}
        onClose={() => setCurrentView(recordingType === 'profile' ? 'full-profile' : 'new-get-help')}
        profileData={profileData}
        recordingType={recordingType}
        onSuccess={(cardData) => {
          // Handle successful voice recording
          console.log('Voice recording processed successfully:', cardData);
          console.log('Recording type:', recordingType);
          
          if (recordingType === 'profile') {
            // Store card data for user confirmation
            console.log('Setting currentVoiceCard to:', cardData);
            setCurrentVoiceCard(cardData);
            setShowVoiceValidation(true);
            // Close the voice modal
            setCurrentView('full-profile');
          } else {
            // Handle help request data  
            setCurrentRequestData(cardData);
            setShowRequestValidation(true);
            setCurrentView('new-get-help');
          }
        }}
      />
      <ResumeUploadModal
        isOpen={currentView === 'resume'}
        onClose={() => setCurrentView('full-profile')}
        profileData={profileData}
        onSuccess={(helpStatement, proof) => {
          // Handle successful resume processing
          console.log('Resume processed successfully:', { helpStatement, proof });
          setCurrentView('full-profile');
        }}
      />
      {currentView === 'new-get-help' && (
        <>
          {console.log('🔍 Rendering HelpRequestForm, currentView:', currentView)}
          <HelpRequestForm
          userRequests={userRequests}
          matchingFrequency={matchingFrequency}
          helpForm={helpForm}
          showNewRequestModal={showBottomSheet}
          editingRequest={editingRequest}
          editingRequestData={editingRequestData}
          onMatchingFrequencyChange={setMatchingFrequency}
          onHelpFormChange={setHelpForm}
          onShowNewRequestModal={setShowBottomSheet}
          onVoiceStart={handleVoiceStart}
          onManualRequestSubmit={handleManualRequestSubmit}
          onDeleteRequest={handleDeleteRequest}
          onEditRequest={handleEditRequest}
          onSaveRequestEdit={handleSaveRequestEdit}
          onEditingRequestChange={handleEditingRequestChange}
          onCancelEdit={handleCancelEdit}
          loadingRequests={loadingRequests}
        />
        </>
      )}
      {currentView === 'match-connection' && renderMatchConnection()}
      {currentView === 'match-found' && renderMatchFound()}
      {currentView === 'public-board' && renderPublicBoard()}
      {currentView === 'network' && renderNetwork()}
      {currentView === 'messages' && renderMessages()}
      <Modal isOpen={showModal} content={modalContent} onClose={() => setShowModal(false)} />
      {currentView !== 'auth' && currentView !== 'messages' && <BottomNavigation currentView={currentView} onViewChange={setCurrentView} />}
      {renderRequestValidation()}
      {renderVoiceValidation()}
      
      {/* Chat Panel */}
      <ChatPanel
        showChatPanel={showChatPanel}
        chatView={chatView}
        activeChat={activeChat}
        conversations={networkConnections}
        chatMessages={chatMessages}
        unreadCounts={unreadCounts}
        messageText={messageText}
        sendingMessage={sendingMessage}
        onClose={() => setShowChatPanel(false)}
        onConversationSelect={(connectionId) => {
          setActiveChat(connectionId);
          setChatView('chat');
          setUnreadCounts(prev => ({ ...prev, [connectionId]: 0 }));
        }}
        onBackToList={() => setChatView('list')}
        onMessageChange={setMessageText}
        onSendMessage={handleSendMessage}
        getLastMessage={getLastMessage}
        getActiveConversations={getActiveConversations}
      />
      


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
'use client';
import React, { useState, useRef, useEffect } from 'react';
import { User, CheckCircle, Users, Plus, Zap, Target, Heart, Network, Handshake, MessageCircle, Check, MapPin, Building2, X, Edit, Trash2, Mic, Brain } from 'lucide-react';
import { useSession, signIn, signOut } from 'next-auth/react'
import { supabase, type User as DbUser, type UserProblem, type HelpRequest, timeAgo } from '@/lib/supabase'

const OneGoodIntroMobile = () => {
  
  // Session and user data
  const { data: session, status } = useSession()
  const [profileData, setProfileData] = useState({
    name: '',
    current: '',
    background: '',
    personal: ''
  })
  const [userProblems, setUserProblems] = useState<UserProblem[]>([])
  const [userRequests, setUserRequests] = useState<HelpRequest[]>([])
  const [loadingRequests, setLoadingRequests] = useState(false)

  // Voice recording state
  const [voiceState, setVoiceState] = useState<'initial' | 'recording' | 'processing'>('initial');
  const [recordingTime, setRecordingTime] = useState<number>(0);
  const [showVoiceValidation, setShowVoiceValidation] = useState<boolean>(false);
  const [currentVoiceCard, setCurrentVoiceCard] = useState<{
    title: string;
    proof: string;
  } | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [voiceTranscript, setVoiceTranscript] = useState<string>('');

  // Resume state
  const [resumeState, setResumeState] = useState<'initial' | 'processing' | 'complete'>('initial');
  const [resumeProgress, setResumeProgress] = useState<number>(0);
  const [showResumeValidation, setShowResumeValidation] = useState<boolean>(false);
  const [currentResumeCard, setCurrentResumeCard] = useState<{
    title: string;
    proof: string;
  } | null>(null);
  const [cardsAccepted, setCardsAccepted] = useState<number>(0);
  const [totalAttempts, setTotalAttempts] = useState<number>(0);
  // Add this to your state declarations
  const [resumeConversationHistory, setResumeConversationHistory] = useState<any[]>([]);

  // LinkedIn state
  const [linkedinUrl, setLinkedinUrl] = useState<string>('');
  const [editingLinkedin, setEditingLinkedin] = useState<boolean>(false);

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
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      setRecordingTime(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [voiceState]);

  // Format timer display
  const formatTime = (seconds: number): string => {
    return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  const loadUserData = async (userEmail: string) => {
    // Load or create user profile
    let { data: user } = await supabase
      .from('users')
      .select('*')
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
        personal: user.personal_info
      })
      setLinkedinUrl(user.linkedin_url || '')
    }

    // Load user problems
    const { data: problems } = await supabase
      .from('user_problems')
      .select('*')
      .eq('user_id', userEmail)

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
  const handleVoiceStart = () => {
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
  
      // Generate help card using Claude API
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
    } catch (error) {
      console.error('Error processing voice recording:', error);
      alert('Error processing recording. Please try again.');
      setVoiceState('initial');
    }
  };

  const handleVoiceApproval = async (approved: boolean) => {
    if (approved && currentVoiceCard) {
      // Save to database
      const { data, error } = await supabase
        .from('user_problems')
        .insert({
          user_id: session?.user?.email || '',
          title: currentVoiceCard.title,
          proof: currentVoiceCard.proof,
          verified: false,
          helped_count: 0,
          ai_generated: true
        })
        .select()
        .single();

      if (!error && data) {
        setUserProblems(prev => [data, ...prev]);
      }
    }
    
    setShowVoiceValidation(false);
    setCurrentVoiceCard(null);
    setVoiceTranscript('');
  };

  // Resume handlers
  const handleResumeStart = () => {
    setCurrentView('resume');
    setResumeState('initial');
  };

  const handleResumeUpload = () => {
    setResumeState('processing');
    setResumeProgress(0);
    
    // Simulate file processing
    const timer = setInterval(() => {
      setResumeProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          setResumeState('complete');
          setCardsAccepted(0);
          setTotalAttempts(0);
          setCurrentView('full-profile');
          generateNextResumeCard();
          return 100;
        }
        return prev + 20;
      });
    }, 400);
  };

  const generateNextResumeCard = async (resumeText?: string) => {
    if (cardsAccepted >= 5 || totalAttempts >= 8) {
      setShowResumeValidation(false);
      return;
    }

    try {
      const textToProcess = resumeText || "Marketing Manager with 5 years experience at TechCorp. Led team of 8 people, increased conversion rates by 45%, managed $2M budget. Previously at StartupCo, grew user base from 10K to 100K users. MBA from Business School.";
      
      const response = await fetch('/api/process-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          resumeText: textToProcess,
          conversationHistory: resumeConversationHistory // Use your conversation tracking
        })
      });

      if (!response.ok) {
        throw new Error('Resume processing failed');
      }

      const cardData = await response.json();

      setCurrentResumeCard({
        title: cardData.title,
        proof: cardData.proof
      });
      setShowResumeValidation(true);
    } catch (error) {
      console.error('Error generating resume card:', error);
      // Your fallback logic
      const sampleCards = [
        {
          title: 'Digital marketing strategy for B2B SaaS',
          proof: 'You led growth at TechCorp increasing leads 300% in 1 year'
        },
        {
          title: 'Team leadership in fast-growing startups',
          proof: 'You built engineering team from 3 to 15 people at StartupCo'
        },
        {
          title: 'Product launch coordination',
          proof: 'You managed 3 major product launches generating $2M+ revenue'
        },
        {
          title: 'Customer acquisition in competitive markets',
          proof: 'You developed acquisition strategy that reduced CAC by 40%'
        }
      ];

      const card = sampleCards[totalAttempts % sampleCards.length];
      setCurrentResumeCard({
        title: card.title,
        proof: card.proof
      });
      setShowResumeValidation(true);
    }
  };

  const handleResumeApproval = async (approved: boolean) => {
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
      
      // Save to database
      const { data, error } = await supabase
        .from('user_problems')
        .insert({
          user_id: session?.user?.email || '',
          title: currentResumeCard.title,
          proof: currentResumeCard.proof,
          verified: false,
          helped_count: 0,
          ai_generated: true
        })
        .select()
        .single();

      if (!error && data) {
        setUserProblems(prev => [...prev, data]);
      }
      
      if (newCardsAccepted >= 5) {
        setShowResumeValidation(false);
        return;
      }
    }

    if (newTotalAttempts >= 8) {
      setShowResumeValidation(false);
      return;
    }

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
  type ActiveFieldType = 'challenge' | 'reason' | 'helpType' | 'about' | 'linkedin' | null;
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
  const [selectedTimeline, setSelectedTimeline] = useState<string>('');
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [newProblem, setNewProblem] = useState<{
    title: string;
    proof: string;
  }>({ title: '', proof: '' });
  const [showTimelineChips, setShowTimelineChips] = useState<boolean>(false);
  const [helpForm, setHelpForm] = useState<{
    challenge: string;
    reason: string;
    helpType: string;
  }>({
    challenge: '',
    reason: '',
    helpType: ''
  });

  // Enhanced profile editing state
  const [editingField, setEditingField] = useState<string | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [savingField, setSavingField] = useState<string | null>(null);
  const [linkedInStatus, setLinkedInStatus] = useState<'empty' | 'processing' | 'complete'>('empty');
  const [linkedInValue, setLinkedInValue] = useState<string>('');
  const [resumeStatus, setResumeStatus] = useState<'empty' | 'processing' | 'complete'>('empty');
  const [resumeValue, setResumeValue] = useState<string>('');
  const [showAISuggestions, setShowAISuggestions] = useState<boolean>(false);
  const [activeField, setActiveField] = useState<ActiveFieldType>(null);

  // Problem editing state
  const [editingProblem, setEditingProblem] = useState<string | null>(null);
  const [editingProblemData, setEditingProblemData] = useState<{
    title: string;
    proof: string;
  }>({ title: '', proof: '' });

  // Add dedicated ref for about field
  const aboutRef = useRef<HTMLTextAreaElement>(null);

  const inputRefs = {
    challenge: useRef<HTMLInputElement>(null),
    reason: useRef<HTMLInputElement>(null),
    helpType: useRef<HTMLInputElement>(null),
    about: useRef<HTMLInputElement>(null),
    linkedin: useRef<HTMLInputElement>(null)
  };

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
      challenge: helpForm.challenge,
      reason: helpForm.reason,
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
          challenge: helpForm.challenge.trim(),
          reason: helpForm.reason.trim(),
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
        setSelectedTimeline('')
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
    if (newProblem.title.trim() && newProblem.proof.trim()) {
      setNewProblem({ title: '', proof: '' });
      setShowAddForm(false);
    }
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
    
    // Show confirmation dialog
    if (!confirm('Are you sure you want to delete this card? This action cannot be undone.')) {
      return;
    }
    
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
      const { error } = await supabase
        .from('user_problems')
        .update({
          title: editingProblemData.title,
          proof: editingProblemData.proof
        })
        .eq('id', problemId)
        .eq('user_id', session.user.email);

      if (!error) {
        // Update local state
        setUserProblems(prev => 
          prev.map(problem => 
            problem.id === problemId 
              ? { ...problem, title: editingProblemData.title, proof: editingProblemData.proof }
              : problem
          )
        );
        setEditingProblem(null);
        setEditingProblemData({ title: '', proof: '' });
      } else {
        console.error('Error updating problem:', error);
        alert('Failed to update card. Please try again.');
      }
    } catch (error) {
      console.error('Error updating problem:', error);
      alert('Failed to update card. Please try again.');
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
    setEditingField(fieldName);
    if (fieldName === 'about') {
      const combinedText = `${profileData.current} ${profileData.background} ${profileData.personal}`.trim();
      setFieldValues({ ...fieldValues, about: combinedText });
    } else if (fieldName && fieldName !== 'challenge' && fieldName !== 'reason' && fieldName !== 'helpType' && fieldName !== 'linkedin' && fieldName !== 'about') {
      setFieldValues({ ...fieldValues, [fieldName]: profileData[fieldName as keyof typeof profileData] });
    }
    setTimeout(() => {
      if (fieldName === 'about' && aboutRef.current) {
        aboutRef.current.focus();
      } else if (fieldName && fieldName !== 'about' && inputRefs[fieldName as keyof typeof inputRefs]?.current) {
        inputRefs[fieldName as keyof typeof inputRefs].current?.focus();
      }
    }, 0);
  };

  const handleProfileFieldChange = (fieldName: string, value: string) => {
    setFieldValues({ ...fieldValues, [fieldName]: value });
  };

  const handleProfileFieldSave = async (fieldName: string) => {
    if (!session?.user?.email) return;
    
    setSavingField(fieldName);
    
    const value = fieldValues[fieldName];
    
    try {
      if (fieldName === 'about') {
        // Save the combined text to all three fields for now
        // You could also create a single 'about' field in the database
        const { error } = await supabase
          .from('users')
          .update({ 
            current_focus: value,
            background: '',
            personal_info: ''
          })
          .eq('email', session.user.email!);

        if (!error) {
          setProfileData(prev => ({ 
            ...prev, 
            current: value,
            background: '',
            personal: ''
          }));
        }
      } else {
        const dbField = fieldName === 'current' ? 'current_focus' : 
                        fieldName === 'background' ? 'background' :
                        fieldName === 'personal' ? 'personal_info' : fieldName;

        const { error } = await supabase
          .from('users')
          .update({ [dbField]: value })
          .eq('email', session.user.email!);

        if (!error) {
          setProfileData(prev => ({ ...prev, [fieldName]: value }));
        }
      }
      
      setEditingField(null);
      setSavingField(null);
      setTimeout(() => setSavingField(fieldName + '_success'), 50);
      setTimeout(() => setSavingField(null), 1500);
    } catch (error) {
      console.error('Error saving field:', error);
      setSavingField(null);
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
          <p className="text-sm text-gray-700 leading-relaxed">
            <span className="font-semibold">{label}:</span>{' '}
            {isEditing ? (
              <input
                ref={inputRefs[fieldName as keyof typeof inputRefs]}
                type="text"
                value={value}
                onChange={(e) => handleProfileFieldChange(fieldName, e.target.value)}
                onBlur={() => handleProfileFieldBlur(fieldName)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    inputRefs[fieldName as keyof typeof inputRefs].current?.blur();
                  }
                }}
                className="inline-block w-full max-w-md px-2 py-1 text-gray-900 bg-blue-50 border border-blue-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            ) : (
              <span
                onClick={() => handleProfileFieldClick(fieldName as ActiveFieldType)}
                className="cursor-pointer text-gray-900 hover:bg-gray-50 px-2 py-1 rounded transition-colors"
              >
                {value}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 ml-3 flex-shrink-0">
          {showSuccess && <Check className="h-4 w-4 text-green-600 animate-pulse" />}
          {isSaving && <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />}
          <button 
            onClick={() => handleProfileFieldClick(fieldName as ActiveFieldType)}
            className="text-blue-600 text-sm font-medium hover:text-blue-700 hover:bg-blue-50 transition-all px-3 py-2 rounded-lg"
          >
            [Edit]
          </button>
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
    setActiveField(null);
  };

  const handleTimelineSelect = (timeline: string) => {
    setSelectedTimeline(timeline);
    setShowTimelineChips(false);
  };

  // Show loading screen while checking auth
  if (status === 'loading') {
    return <div className="min-h-screen bg-white flex items-center justify-center">Loading...</div>
  }

  // Voice recording popup
  const renderVoicePopup = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8 text-center">
        <button 
          onClick={() => setCurrentView('full-profile')}
          className="absolute top-4 right-4 text-gray-600 hover:text-gray-900"
        >
          <X className="h-5 w-5" />
        </button>

        {voiceState === 'initial' && (
          <>
            <p className="text-gray-700 mb-6 text-base leading-relaxed">
              Share a skill and why you have it
            </p>

            <div className="bg-gray-50 p-4 rounded-lg mb-8 text-left">
              <p className="text-sm text-gray-600 mb-2">Example:</p>
              <p className="text-sm text-gray-800">
                "Managing remote teams because I led 15 people across 4 countries for 3 years"
              </p>
            </div>

            <button 
              onMouseDown={handleVoiceRecord}
              onTouchStart={handleVoiceRecord}
              className="w-20 h-20 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white font-semibold mx-auto transition-colors"
            >
              🔴 Hold
            </button>
          </>
        )}

        {voiceState === 'recording' && (
          <>
            <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
              <div className="w-6 h-6 bg-white rounded-full"></div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Recording...</h3>
            <div className="text-3xl font-mono text-gray-600 mb-6">⏱️ {formatTime(recordingTime)}</div>
            <button 
              onClick={handleVoiceStop}
              className="bg-gray-900 text-white px-8 py-3 rounded-lg hover:bg-black transition-colors font-semibold"
            >
              Stop Recording
            </button>
          </>
        )}

        {voiceState === 'processing' && (
          <>
            <Brain className="h-16 w-16 text-purple-600 mx-auto mb-6" />
            <h3 className="text-xl font-bold text-gray-900 mb-4">Creating your help card...</h3>
            <div className="flex justify-center">
              <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          </>
        )}
      </div>
    </div>
  );

  // Resume upload popup
  const renderResumePopup = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center">
        <button 
          onClick={() => setCurrentView('full-profile')}
          className="absolute top-4 right-4 text-gray-600 hover:text-gray-900"
        >
          <X className="h-5 w-5" />
        </button>

        {resumeState === 'initial' && (
          <>
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Upload Resume</h3>
            <p className="text-gray-600 mb-6 text-sm leading-relaxed">
              We'll find areas where you can help others based on your experience
            </p>
            <button 
              onClick={handleResumeUpload}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors mb-4"
            >
              Choose File
            </button>
            <p className="text-xs text-gray-500">Supports PDF, DOC, DOCX</p>
          </>
        )}

        {resumeState === 'processing' && (
          <>
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Processing resume...</h3>
            <p className="text-gray-600 mb-4">Marketing_Resume.pdf</p>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${resumeProgress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600">Looking for 5 areas you can help</p>
          </>
        )}
      </div>
    </div>
  );

  // Main render functions
  const renderAuth = () => (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto bg-white">
        <div className="flex flex-col min-h-screen">
          <div className="flex-1 flex flex-col justify-center px-8 py-12">
            <div className="text-center mb-12">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-8">
                <Zap className="h-12 w-12 text-blue-600" />
              </div>
              <h1 className="text-4xl font-light text-gray-900 mb-3 leading-tight">
                OneGoodIntro
              </h1>
              <p className="text-gray-600 text-base leading-relaxed max-w-sm mx-auto">
                One good professional introduction every week
              </p>
            </div>

            <div className="space-y-6">
              <button
                onClick={handleGoogleSignIn}
                className="w-full bg-white border-2 border-gray-300 text-gray-700 py-4 px-6 rounded-lg font-semibold text-base hover:border-gray-400 hover:shadow-sm transition-all duration-200 flex items-center justify-center space-x-3"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Continue with Google</span>
              </button>
              
              <div className="text-center">
                <p className="text-xs text-gray-500 leading-relaxed max-w-sm mx-auto">
                  By continuing, you agree to our Terms of Service and Privacy Policy
                </p>
              </div>
            </div>
          </div>

          <div className="px-8 pb-8 border-t border-gray-100">
            <div className="flex justify-center gap-10 py-6 text-center">
              <div>
                <span className="text-lg font-semibold text-gray-900 block">2.5K+</span>
                <div className="text-sm text-gray-600 mt-1">professionals</div>
              </div>
              <div>
                <span className="text-lg font-semibold text-gray-900 block">15K+</span>
                <div className="text-sm text-gray-600 mt-1">connections</div>
              </div>
              <div>
                <span className="text-lg font-semibold text-gray-900 block">98%</span>
                <div className="text-sm text-gray-600 mt-1">success rate</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderFullProfile = () => (
    <div className="min-h-screen bg-white pb-20">
      <div className="max-w-2xl mx-auto bg-white">
        
        {/* Compact Header - Instagram Style */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            {/* Small Avatar */}
            <div className="relative w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-lg font-semibold text-gray-500 flex-shrink-0">
              CA
              <button className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-medium hover:bg-blue-700 transition-colors">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            </div>
            
            {/* Profile Info - Left Aligned */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-lg font-bold text-gray-900">{profileData.name || 'Chip Alexandru'}</h1>
                <button className="text-blue-600 hover:text-blue-700 transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              </div>
              
              {/* About Text - Compact */}
              {editingField === 'about' ? (
                <div className="space-y-2">
                  <textarea
                    ref={aboutRef}
                    value={fieldValues.about || ''}
                    onChange={(e) => handleProfileFieldChange('about', e.target.value)}
                    onBlur={() => handleProfileFieldBlur('about')}
                    className="w-full px-2 py-1 text-sm text-gray-900 bg-blue-50 border border-blue-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                    rows={3}
                    placeholder="AI founder in Zurich with BCG/PwC background..."
                  />
                  <p className="text-xs text-gray-500">Press Enter to save</p>
                </div>
              ) : (
                <p className="text-sm text-gray-700 leading-relaxed mb-2">
                  <span
                    onClick={() => handleProfileFieldClick('about')}
                    className="cursor-pointer hover:bg-gray-50 px-1 py-0.5 rounded transition-colors"
                  >
                    {profileData.current && profileData.background && profileData.personal
                      ? `${profileData.current} ${profileData.background} ${profileData.personal}`
                      : 'AI founder in Zurich with BCG/PwC background. Led €90M+ deals, interim CEO experience.'}
                  </span>
                  <button 
                    onClick={() => handleProfileFieldClick('about')}
                    className="text-blue-600 text-xs font-medium hover:text-blue-700 ml-1"
                  >
                    [Edit]
                  </button>
                  {savingField === 'about_success' && <Check className="inline h-3 w-3 text-green-600 animate-pulse ml-1" />}
                  {savingField === 'about' && <div className="inline-block w-2 h-2 border border-gray-400 border-t-transparent rounded-full animate-spin ml-1" />}
                </p>
              )}
              
              {/* Status Line - LinkedIn + Resume */}
              <div className="flex items-center gap-3 text-xs text-gray-600">
                {/* LinkedIn Status */}
                {!linkedinUrl && !editingLinkedin ? (
                  <button 
                    onClick={() => setEditingLinkedin(true)}
                    className="text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    + LinkedIn
                  </button>
                ) : editingLinkedin ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={linkedinUrl}
                      onChange={(e) => setLinkedinUrl(e.target.value)}
                      placeholder="linkedin.com/in/yourname"
                      className="text-xs px-2 py-1 border border-gray-300 rounded w-32 focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button 
                      onClick={handleLinkedinSave}
                      className="text-green-600 text-xs"
                    >
                      ✓
                    </button>
                    <button 
                      onClick={() => {setEditingLinkedin(false); setLinkedinUrl('');}}
                      className="text-gray-600 text-xs"
                    >
                      ✗
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={handleLinkedinClick}
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19a.66.66 0 000 .14V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z"/>
                    </svg>
                    LinkedIn
                  </button>
                )}
                
                {/* Resume Status */}
                {resumeState === 'complete' ? (
                  <span className="flex items-center gap-1 text-green-600">
                    📄 Resume ✓
                  </span>
                ) : (
                  <button 
                    onClick={handleResumeStart}
                    className="text-gray-600 hover:text-gray-700 transition-colors"
                  >
                    📄 Add Resume
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* LinkedIn Profile Section - RESTORED EDITING */}
        <div className="max-w-lg mx-auto mb-6 px-8">
          {!linkedinUrl && !editingLinkedin ? (
            <div className="flex items-center justify-center">
              <button 
                onClick={() => setEditingLinkedin(true)}
                className="text-blue-600 text-sm font-medium hover:text-blue-700 hover:bg-blue-50 transition-all px-3 py-2 rounded-lg"
              >
                + Add LinkedIn Profile
              </button>
            </div>
          ) : editingLinkedin ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder="linkedin.com/in/yourname"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              <button 
                onClick={handleLinkedinSave}
                className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                Save
              </button>
              <button 
                onClick={() => {setEditingLinkedin(false); setLinkedinUrl('');}}
                className="text-gray-600 hover:text-gray-900"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <button 
                onClick={handleLinkedinClick}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-all px-3 py-2 rounded-lg"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19a.66.66 0 000 .14V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z"/>
                </svg>
                LinkedIn Profile
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </button>
              <button 
                onClick={() => setEditingLinkedin(true)}
                className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 p-1 rounded"
              >
                <Edit className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>

        {/* Resume Upload Section - UPDATED BUTTON */}
        <div className="max-w-lg mx-auto mb-6 px-8">
          <div className="flex items-center justify-center">
            <button 
              onClick={handleResumeStart}
              className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              {resumeState === 'complete' ? 'Update Resume for better matching' : 'Add Resume for better matching'}
              {resumeState === 'complete' && <span className="ml-1 text-xs">✓</span>}
            </button>
          </div>
        </div>

        {/* Simple Action Stats */}
        <div className="px-8 py-6 text-center border-t border-gray-100">
          <p className="text-gray-600 mb-2">Ready to help others with your experience</p>
          <div className="text-sm text-gray-500">
            <span className="font-semibold text-gray-900">{userProblems.reduce((acc, p) => acc + p.helped_count, 0)}</span> people helped • 
            <span className="font-semibold text-gray-900 ml-1">{userProblems.length}</span> experience areas
          </div>
        </div>

        {/* Voice Section with Border */}
        <div className="px-8 py-6 border border-gray-200 rounded-lg mx-8 mb-6">
          <div className="flex items-center justify-between max-w-lg mx-auto">
            <div className="flex-1">
              <p className="text-gray-900 font-medium">
                Share your experience, connect with others
              </p>
            </div>
            <button 
              onClick={handleVoiceStart}
              className="text-2xl hover:scale-110 transition-transform ml-4"
            >
              📞
            </button>
          </div>
        </div>

        {/* Voice Y/N Validation */}
        {showVoiceValidation && currentVoiceCard && (
          <div className="mx-4 mt-4 p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm text-blue-600 font-medium">🎤 Voice Card Created</div>
              <button 
                onClick={() => handleVoiceApproval(false)}
                className="text-gray-600 hover:text-gray-900"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="bg-white rounded-lg p-3 mb-3">
              <h4 className="font-semibold text-gray-900 mb-1 text-sm">
                {currentVoiceCard.title}
              </h4>
              <p className="text-xs text-gray-600">
                {currentVoiceCard.proof}
              </p>
            </div>

            <p className="text-center text-xs text-gray-600 mb-3">
              Is this experience accurate?<br />
              Can you help individuals with this?
            </p>

            <div className="flex gap-2">
              <button 
                onClick={() => handleVoiceApproval(true)}
                className="flex-1 bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors text-sm"
              >
                YES
              </button>
              <button 
                onClick={() => handleVoiceApproval(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-400 transition-colors text-sm"
              >
                NO
              </button>
            </div>
          </div>
        )}

        {/* Resume Y/N Validation */}
        {showResumeValidation && currentResumeCard && (
          <div className="mx-4 mt-4 p-4 bg-purple-50 rounded-xl border-2 border-purple-200">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm text-purple-600 font-medium">✨ AI Recommendations</div>
              <div className="text-sm text-gray-500">{cardsAccepted}/5 ⭐</div>
              <button 
                onClick={() => setShowResumeValidation(false)}
                className="text-gray-600 hover:text-gray-900"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="text-center mb-3">
              <div className="text-lg mb-1">🤔</div>
              <h4 className="font-bold text-gray-900 text-sm">Can you help with this?</h4>
            </div>

            <div className="bg-white rounded-lg p-3 mb-3">
              <h4 className="font-semibold text-gray-900 mb-1 text-sm">
                {currentResumeCard.title}
              </h4>
              <p className="text-xs text-gray-600">
                {currentResumeCard.proof}
              </p>
            </div>

            <p className="text-center text-xs text-gray-600 mb-3">
              Is this experience accurate?<br />
              Can you help individuals with this?
            </p>

            <div className="flex gap-2">
              <button 
                onClick={() => handleResumeApproval(true)}
                className="flex-1 bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors text-sm"
              >
                YES, I can help
              </button>
              <button 
                onClick={() => handleResumeApproval(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-400 transition-colors text-sm"
              >
                NO, not really
              </button>
            </div>
          </div>
        )}

        {/* Experience Areas - Clean List */}
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Experience</h2>
          </div>

          {/* Experience Cards */}
          <div className="space-y-8">
            {userProblems.map((problem) => (
              <div
                key={problem.id}
                className="p-6 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all"
              >
                {/* Status Badge and Actions */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`inline-flex items-center text-xs font-medium px-2 py-1 rounded-full ${
                      problem.verified 
                        ? 'bg-green-100 text-green-700' 
                        : problem.ai_generated
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {problem.verified ? '✓ Verified' : 
                       problem.ai_generated ? '🎤 AI Generated' : 
                       'Added by you'}
                    </div>
                    {problem.helped_count > 0 && (
                      <div className="text-xs text-gray-500">
                        Helped {problem.helped_count}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => handleEditProblem(problem)}
                      className="text-blue-600 hover:bg-blue-50 p-1.5 rounded transition-colors"
                      title="Edit card"
                    >
                      <Edit className="h-3 w-3" />
                    </button>
                    <button 
                      onClick={() => handleDeleteProblem(problem.id)}
                      className="text-red-600 hover:bg-red-50 p-1.5 rounded transition-colors"
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
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm font-medium focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Experience title..."
                      />
                    </div>
                    <div>
                      <textarea
                        value={editingProblemData.proof}
                        onChange={(e) => setEditingProblemData(prev => ({ ...prev, proof: e.target.value }))}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs resize-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                        rows={2}
                        placeholder="Why you can help..."
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSaveProblem(problem.id)}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-blue-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingProblem(null)}
                        className="bg-gray-200 text-gray-700 px-3 py-1 rounded text-xs font-medium hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h3 className="text-sm font-semibold text-gray-900 mb-1 leading-tight">
                      {problem.title}
                    </h3>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {problem.proof}
                    </p>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Bottom Add Button - Subtle */}
          <div className="text-center mt-6">
            <button 
              onClick={handleVoiceStart}
              className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-gray-600 transition-colors"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Keep existing render functions for other views (renderNewGetHelp, etc.)
  const renderNewGetHelp = () => (
    <div className="min-h-screen bg-white pb-20">
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md px-5 py-4 flex items-center justify-between border-b border-gray-100">
        <button 
          onClick={() => setCurrentView('full-profile')}
          className="text-gray-900 text-lg hover:text-gray-700 hover:bg-gray-100 transition-all px-3 py-2 rounded-lg"
        >
          ←
        </button>
        <div className="text-lg font-semibold text-gray-900">Your Requests</div>
        <button 
          onClick={() => setShowBottomSheet(true)}
          className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-semibold"
        >
          New
        </button>
      </div>

      <div className="pt-20">
        <div className="px-5 py-10 text-center bg-white">
          <h1 className="text-2xl font-bold text-gray-900 mb-3">What help do you need?</h1>
          <p className="text-gray-600 mb-4">Weekly matching • Keep 2-3 requests active for best matches</p>
          <p className="mb-8"><span className="text-green-600">✓ Peer advice & insights</span> • <span className="text-green-600">✓ Professional introductions</span> • <span className="text-red-600">✗ Sales & recruiting</span></p>
          
          <div className="flex justify-center gap-8 p-5 bg-white rounded-2xl shadow-sm">
            <div className="text-center">
              <span className="text-2xl font-bold text-gray-900 block">{userRequests.filter(r => r.status === 'active').length}</span>
              <div className="text-xs text-gray-600 uppercase tracking-wide">Active Requests</div>
            </div>
            <div className="text-center">
              <span className="text-2xl font-bold text-gray-900 block">5</span>
              <div className="text-xs text-gray-600 uppercase tracking-wide">People Helped</div>
            </div>
            <div className="text-center">
              <span className="text-2xl font-bold text-gray-900 block">12</span>
              <div className="text-xs text-gray-600 uppercase tracking-wide">Introductions Made</div>
            </div>
          </div>
        </div>
        
        <div className="px-5 space-y-8">
          <div className="flex items-center justify-between mb-5">
            <div className="text-lg font-semibold text-gray-900">Your Requests</div>
            <div className="flex bg-gray-50 rounded-full p-1">
              <button className="bg-gray-900 text-white px-4 py-2 rounded-full text-xs font-semibold">All</button>
              <button className="text-gray-600 px-4 py-2 rounded-full text-xs font-semibold">Active</button>
            </div>
          </div>
          
          <div className="space-y-6">
            {loadingRequests ? (
              <div className="text-center py-8">
                <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-gray-500">Loading your requests...</p>
              </div>
            ) : userRequests.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">No requests yet</p>
                <button 
                  onClick={() => setShowBottomSheet(true)}
                  className="text-blue-600 font-medium"
                >
                  Create your first request
                </button>
              </div>
            ) : (
              userRequests.map(request => (
                <div 
                  key={request.id}
                  className={`bg-white rounded-2xl shadow-sm cursor-pointer transition-all duration-300 overflow-hidden hover:shadow-md ${
                    expandedCard === request.id ? 'transform -translate-y-1 shadow-lg' : ''
                  }`}
                  onClick={() => setExpandedCard(expandedCard === request.id ? null : request.id)}
                >
                  <div className="p-5 relative">
                    <div className={`absolute top-4 right-4 text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wide ${
                      request.status === 'active' ? 'bg-green-500 text-white' :
                      request.status === 'paused' ? 'bg-gray-200 text-gray-600' :
                      'bg-gray-900 text-white'
                    }`}>
                      {request.status}
                    </div>
                    <div className="text-sm font-semibold text-gray-900 mb-3 mr-20 leading-tight">
                      "{request.challenge}"
                    </div>
                    <div className="text-xs text-gray-600 flex items-center gap-2">
                      <span>{timeAgo(request.created_at)}</span>
                      <div className="w-1 h-1 bg-current rounded-full"></div>
                      <span>{request.status_text}</span>
                    </div>
                  </div>
                  {expandedCard === request.id && (
                    <div className="px-5 pb-5 transition-all duration-300">
                      <div className="mb-3">
                        <div className="text-xs font-bold uppercase tracking-wide text-gray-600 mb-1">Context</div>
                        <div className="text-sm text-gray-900 leading-relaxed">{request.reason}</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wide text-gray-600 mb-1">Looking for</div>
                        <div className="text-sm text-gray-900 leading-relaxed">{request.help_type}</div>
                      </div>
                      <div className="mt-3">
                        <div className="text-xs font-bold uppercase tracking-wide text-gray-600 mb-1">Timeline</div>
                        <div className="text-sm text-gray-900">{request.timeline}</div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
            
            <div 
              className="bg-white rounded-2xl shadow-sm p-10 text-center cursor-pointer transition-all duration-300 hover:shadow-md hover:transform hover:-translate-y-0.5"
              onClick={() => setShowBottomSheet(true)}
            >
              <div className="text-3xl mb-3 text-gray-600">+</div>
              <div className="text-sm font-semibold mb-1 text-gray-900">New request</div>
              <div className="text-xs text-gray-600">What help do you need?</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Sheet */}
      {showBottomSheet && (
        <>
          <div 
            className="fixed inset-0 bg-black bg-opacity-40 z-50"
            onClick={() => setShowBottomSheet(false)}
          ></div>
          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-50 max-h-[85vh] overflow-y-auto shadow-2xl">
            {/* Header */}
            <div className="p-5 text-center relative">
              <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4"></div>
              <div className="text-lg font-bold text-gray-900">What help do you need?</div>
              <button 
                className="absolute top-4 right-4 text-gray-600 text-2xl hover:bg-gray-100 transition-all w-10 h-10 rounded-full flex items-center justify-center"
                onClick={() => setShowBottomSheet(false)}
              >
                ×
              </button>
            </div>
            
            <div className="p-5">
              {/* Example Section */}
              <div className="p-4 bg-blue-50 rounded-2xl shadow-sm mb-6">
                <div className="text-sm font-semibold text-blue-900 mb-2">💡 Here's how others ask:</div>
                <div className="text-sm text-blue-800 italic leading-relaxed">
                  "I need help with choosing between two job offers because both have pros and cons. 
                  I'd like to be introduced to someone who can share career decision frameworks within 1 week."
                </div>
              </div>

              {/* Flowing Paragraph */}
              <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 text-base leading-relaxed">
                <div className="text-gray-900">
                  I need help with{' '}
                  <span 
                    className={`inline-block min-w-[120px] px-3 py-1 rounded cursor-pointer transition-all ${
                      helpForm.challenge 
                        ? 'bg-blue-100 text-blue-900 border border-blue-200' 
                        : 'bg-gray-200 text-gray-600 border border-gray-300 hover:bg-gray-300'
                    }`}
                    onClick={() => handleFieldClick('challenge')}
                  >
                    {getDisplayText('challenge', 'your challenge')}
                  </span>{' '}
                  because{' '}
                  <span 
                    className={`inline-block min-w-[120px] px-3 py-1 rounded cursor-pointer transition-all ${
                      helpForm.reason 
                        ? 'bg-blue-100 text-blue-900 border border-blue-200' 
                        : 'bg-gray-200 text-gray-600 border border-gray-300 hover:bg-gray-300'
                    }`}
                    onClick={() => handleFieldClick('reason')}
                  >
                    {getDisplayText('reason', 'why it matters')}
                  </span>.
                </div>
                
                <div className="text-gray-900 mt-3">
                  I'd like to be introduced to someone who can{' '}
                  <span 
                    className={`inline-block min-w-[120px] px-3 py-1 rounded cursor-pointer transition-all ${
                      helpForm.helpType 
                        ? 'bg-blue-100 text-blue-900 border border-blue-200' 
                        : 'bg-gray-200 text-gray-600 border border-gray-300 hover:bg-gray-300'
                    }`}
                    onClick={() => handleFieldClick('helpType')}
                  >
                    {getDisplayText('helpType', 'help me with')}
                  </span>{' '}
                  within{' '}
                  <span 
                    className={`inline-block min-w-[80px] px-3 py-1 rounded cursor-pointer transition-all ${
                      selectedTimeline 
                        ? 'bg-blue-100 text-blue-900 border border-blue-200' 
                        : 'bg-gray-200 text-gray-600 border border-gray-300 hover:bg-gray-300'
                    }`}
                    onClick={handleTimelineClick}
                  >
                    {getTimelineDisplay()}
                  </span>.
                </div>
              </div>

              {/* Inline Input Field */}
              {activeField && (
                <div className="mb-4">
                  <div className="text-sm font-medium text-gray-700 mb-2">
                    {activeField === 'challenge' && 'What do you need help with?'}
                    {activeField === 'reason' && 'Why does this matter to you?'}
                    {activeField === 'helpType' && 'What kind of help would be most valuable?'}
                  </div>
                  <div className="relative">
                    <input
                      ref={inputRefs[activeField]}
                      type="text"
                      value={activeField && (activeField === 'challenge' || activeField === 'reason' || activeField === 'helpType') ? helpForm[activeField] : ''}
                      onChange={(e) => handleInputChange(activeField || '', e.target.value)}
                      onBlur={handleInputBlur}
                      className="w-full border border-gray-300 rounded-lg p-3 text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={
                        activeField === 'challenge' ? 'relocating to Edinburgh for this role' :
                        activeField === 'reason' ? 'it\'s a great opportunity but I\'m concerned about work-life balance' :
                        'share insights about working in Scotland'
                      }
                      maxLength={activeField === 'challenge' ? 80 : activeField === 'reason' ? 100 : 60}
                    />
                    <button 
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-600 hover:text-green-700"
                      onClick={() => setActiveField(null)}
                    >
                      ✓
                    </button>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {activeField && (activeField === 'challenge' || activeField === 'reason' || activeField === 'helpType') 
                      ? (helpForm[activeField]?.length || 0) 
                      : 0} / {activeField === 'challenge' ? 80 : activeField === 'reason' ? 100 : 60} characters
                  </div>
                </div>
              )}

              {/* Timeline Chips */}
              {showTimelineChips && (
                <div className="mb-4">
                  <div className="text-sm font-medium text-gray-700 mb-2">When do you need this?</div>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: '1 week', label: '1 week', desc: 'ASAP' },
                      { value: '2 weeks', label: '2 weeks', desc: 'Soon' },
                      { value: 'flexible', label: 'Flexible', desc: 'This month' }
                    ].map((timeline) => (
                      <div
                        key={timeline.value}
                        className="border rounded-lg p-3 text-center cursor-pointer transition-all border-gray-300 hover:border-gray-900 hover:bg-gray-50"
                        onClick={() => handleTimelineSelect(timeline.value)}
                      >
                        <div className="text-sm font-semibold mb-1">{timeline.label}</div>
                        <div className="text-xs text-gray-600">{timeline.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-5">
              <button
                className={`w-full py-4 rounded-lg text-base font-semibold transition-all ${
                  validateHelpForm()
                    ? 'bg-gray-900 text-white hover:bg-black'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
                disabled={!validateHelpForm()}
                onClick={submitHelpRequest}
              >
                Add Request
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );

  const renderPublicBoard = () => (
    <div className="min-h-screen bg-white pb-20">
      <div className="px-5 py-4">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => setCurrentView('full-profile')}
            className="text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-all px-3 py-2 rounded-lg"
          >
            ← Back
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Help Others</h1>
          <div className="w-5"></div>
        </div>
      </div>

      <div className="p-5">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">People you can help</h2>
          <p className="text-gray-600">Requests matched to your experience</p>
        </div>

        <div className="space-y-6">
          {helpRequests.map(request => (
            <div 
              key={request.id} 
              className="bg-white rounded-2xl shadow-sm p-5 hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-sm font-semibold text-gray-600">
                  {request.avatar}
                </div>
                <div>
                  <p className="text-base font-semibold text-gray-900">{request.person}</p>
                  <p className="text-sm text-gray-600">{request.title} at {request.company}</p>
                </div>
              </div>

              <h3 className="text-lg font-medium text-gray-900 mb-3 leading-snug">
                "{request.text}"
              </h3>

              <p className="text-sm text-gray-700 mb-4 leading-relaxed">
                {request.context}
              </p>

              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    showSuccessModal('help');  
                  }}
                  className="bg-gray-900 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-black transition-colors"
                >
                  I can help
                </button>
                <button className="text-gray-500 text-sm font-medium hover:text-gray-700 hover:bg-gray-100 transition-all py-3 px-4 rounded-lg">
                  Skip
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 p-4 bg-white rounded-2xl shadow-sm text-center">
          <h3 className="text-base font-semibold text-gray-900 mb-1">That's this week's selection</h3>
          <p className="text-gray-600 text-sm mb-3">
            New requests appear throughout the week, filtered to areas where you have relevant experience.
          </p>
          <button className="text-blue-600 text-sm font-semibold hover:text-blue-700 transition-colors">
            See more requests
          </button>
        </div>
      </div>
    </div>
  );

  const renderMatchConnection = () => (
    <div className="min-h-screen bg-white pb-20">
      <div className="bg-white px-4 py-4 sticky top-0 z-10 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <button 
            className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all px-3 py-2 rounded-lg"
            onClick={() => setCurrentView('match-found')}
          >
            ← Back
          </button>
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900">OneGoodIntro</h1>
              <p className="text-xs text-gray-600">Introduction Request</p>
            </div>
          </div>
          <div className="w-12"></div>
        </div>
      </div>

      <div className="px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-6">Confirmed Your Interest!</h2>

          <div className="mb-6">
            <p className="text-gray-700 text-base leading-relaxed">
              Sarah also received this match. When you both confirm, we'll send introduction emails.
            </p>
          </div>

          <div className="mb-8">
            <p className="text-sm text-gray-600">
              Most matches connect within 2–3 days.
            </p>
          </div>

          <button 
            onClick={() => setCurrentView('match-found')}
            className="w-full bg-gray-900 text-white py-4 rounded-2xl font-semibold hover:bg-gray-800 transition-colors"
          >
            OK, Got It
          </button>
        </div>
      </div>
    </div>
  );

  const renderMatchFound = () => (
    <div className="min-h-screen bg-white pb-20">
      <div className="bg-white px-4 py-4 sticky top-0 z-10 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button 
              className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all px-3 py-2 rounded-lg"
              onClick={() => setCurrentView('new-get-help')}
            >
              ← Back
            </button>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900">OneGoodIntro</h1>
              <p className="text-xs text-gray-600">Weekly Match</p>
            </div>
          </div>
          <div className="w-12"></div>
        </div>
      </div>

      <div className="px-4 py-6">
        <div className="space-y-8">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl shadow-sm p-5 text-center">
            <div className="flex items-center justify-center space-x-2 mb-3">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-gray-700">This Week's Match</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900">You've been matched with Sarah</h2>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center space-x-4 mb-6">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                  {matchedPerson.avatar}
                </div>
                {matchedPerson.verified && (
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h2 className="text-lg font-bold text-gray-900">{matchedPerson.name}</h2>
                  <svg className="w-4 h-4 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19a.66.66 0 000 .14V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z"/>
                  </svg>
                </div>
                <p className="text-gray-600 font-medium">{matchedPerson.title}</p>
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Building2 className="h-3 w-3" />
                    <span>{matchedPerson.company}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-3 w-3" />
                    <span>{matchedPerson.location}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex flex-wrap gap-2">
                {matchedPerson.expertise.map((skill: string) => (
                  <span key={skill} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-medium">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-5">
            <div className="mb-4">
              <h3 className="font-semibold text-gray-900 text-sm flex items-center">
                <div className="w-2 h-2 bg-blue-600 rounded-full mr-2"></div>
                Strong Match
              </h3>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    Sarah might help with: <span className="text-green-700">"Navigate promotion to senior PM level"</span>
                  </p>
                  <p className="text-gray-600 text-xs mt-1">From your active requests • Based on her experience with similar career transitions</p>
                </div>
              </div>

              <div className="border-t border-gray-100"></div>

              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <User className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    You might help with: <span className="text-blue-700">"Get insights on scaling product teams effectively"</span>
                  </p>
                  <p className="text-gray-600 text-xs mt-1">Her current need • Your consulting and strategy expertise is highly relevant</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <button 
              onClick={() => setCurrentView('match-connection')}
              className="w-full bg-gray-900 text-white py-4 rounded-2xl font-semibold hover:bg-gray-800 transition-colors"
            >
              Arrange Introduction
            </button>
            <button className="w-full bg-gray-100 text-gray-700 py-4 rounded-2xl font-semibold hover:bg-gray-200 transition-colors">
              Try again next week
            </button>
          </div>
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

    const filteredConnections = networkConnectionsImproved.filter((conn: NetworkConnection) => {
      if (searchTerm === '') return true;
      
      const search = searchTerm.toLowerCase();
      return conn.name.toLowerCase().includes(search) ||
             conn.company.toLowerCase().includes(search) ||
             conn.connectionContext.toLowerCase().includes(search) ||
             conn.currentStatus.text.toLowerCase().includes(search);
    });

    return (
      <div className="min-h-screen bg-white pb-20">
        <div className="px-5 py-4">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => setCurrentView('full-profile')}
              className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all px-3 py-2 rounded-lg"
            >
              ← Back
            </button>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                <Zap className="h-4 w-4 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-gray-900">OneGoodIntro</h1>
                <p className="text-xs text-gray-600">Your Network</p>
              </div>
            </div>
            <div className="w-5"></div>
          </div>
        </div>

        <div className="p-5">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Network</h2>
            <p className="text-gray-600 mb-1">People you've connected with through OneGoodIntro</p>
            <p className="text-sm text-gray-500">{networkConnectionsImproved.length} connections</p>
          </div>

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
              className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl border-0 focus:bg-white focus:ring-2 focus:ring-gray-900 focus:outline-none text-base transition-all"
            />
          </div>

          <div className="space-y-6">
            {filteredConnections.map((connection: NetworkConnection) => (
              <div key={connection.id} className="bg-white rounded-2xl shadow-sm p-4 hover:shadow-md transition-all">
                <div className="flex items-start space-x-4">
                  <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 font-bold text-lg flex-shrink-0">
                    {connection.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-lg">{connection.name}</h3>
                    <p className="text-gray-600 mb-2">{connection.company}</p>
                    
                    <div className="mb-3">
                      <p className="text-sm text-gray-500 mb-1">How you connected:</p>
                      <p className="text-sm text-gray-700">{connection.connectionContext}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Current activity:</p>
                      <p className={`text-sm font-medium ${
                        connection.currentStatus.type === 'looking_for' ? 'text-blue-600' : 'text-green-600'
                      }`}>
                        {connection.currentStatus.text}
                      </p>
                    </div>
                  </div>
                  <button className="p-4 hover:bg-gray-100 rounded-xl transition-all flex-shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center">
                    <MessageCircle className="h-5 w-5 text-gray-600" />
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
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No connections yet</h3>
              <p className="text-gray-600">Your successful introductions will appear here</p>
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
          return <Handshake className="h-12 w-12 text-green-600 mx-auto" />;
        case 'check':
          return <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />;
        case 'heart':
          return <Heart className="h-12 w-12 text-purple-600 mx-auto" />;
        default:
          return <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />;
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center">
          <div className="mb-4">
            {getIcon()}
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-3">{modalContent.title}</h3>
          <p className="text-gray-600 mb-6 text-sm leading-relaxed">
            {modalContent.message}
          </p>
          <button 
            onClick={() => setShowModal(false)}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold"
          >
            Got it
          </button>
        </div>
      </div>
    );
  };

  const renderBottomNav = () => (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-2 z-40">
      <div className="flex justify-around">
        <button 
          onClick={() => setCurrentView('full-profile')}
          className={`flex flex-col items-center space-y-1 px-4 py-3 rounded-lg min-h-[44px] ${
            currentView === 'full-profile' ? 'bg-purple-100 text-purple-700' : 'text-gray-600'
          }`}
        >
          <User className="h-5 w-5" />
          <span className="text-xs font-medium">Profile</span>
        </button>
        <button 
          onClick={() => setCurrentView('new-get-help')}
          className={`flex flex-col items-center space-y-1 px-4 py-3 rounded-lg min-h-[44px] ${
            currentView === 'new-get-help' ? 'bg-blue-100 text-blue-700' : 'text-gray-600'
          }`}
        >
          <Target className="h-5 w-5" />
          <span className="text-xs font-medium">Requests</span>
        </button>
        <button 
          onClick={() => setCurrentView('match-found')}
          className={`flex flex-col items-center space-y-1 px-4 py-3 rounded-lg min-h-[44px] ${
            currentView === 'match-found' ? 'bg-green-100 text-green-700' : 'text-gray-600'
          }`}
        >
          <Users className="h-5 w-5" />
          <span className="text-xs font-medium">Matches</span>
        </button>
        <button 
          onClick={() => setCurrentView('public-board')}
          className={`flex flex-col items-center space-y-1 px-4 py-3 rounded-lg min-h-[44px] ${
            currentView === 'public-board' ? 'bg-orange-100 text-orange-700' : 'text-gray-600'
          }`}
        >
          <Heart className="h-5 w-5" />
          <span className="text-xs font-medium">Help Others</span>
        </button>
        <button 
          onClick={() => setCurrentView('network')}
          className={`flex flex-col items-center space-y-1 px-4 py-3 rounded-lg min-h-[44px] ${
            currentView === 'network' ? 'bg-green-100 text-green-700' : 'text-gray-600'
          }`}
        >
          <Network className="h-5 w-5" />
          <span className="text-xs font-medium">Connections</span>
        </button>
      </div>
    </div>
  );

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
    </div>
  );
};

export default OneGoodIntroMobile;
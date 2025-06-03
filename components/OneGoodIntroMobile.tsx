'use client';
import React, { useState, useRef, useEffect } from 'react';
import { User, CheckCircle, Users, Plus, Zap, Target, Heart, Network, Handshake, MessageCircle, Check, MapPin, Building2, X, Edit, Trash2, Mic, Brain, ArrowRight, TrendingUp, Phone } from 'lucide-react';
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

    // Mock sample cards - no API call
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
  type ActiveFieldType = 'challenge' | 'reason' | 'helpType' | 'name' | 'about' | 'linkedin' | null;
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
  const [editingRequest, setEditingRequest] = useState<string | null>(null);
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

  const inputRefs = {
    challenge: useRef<HTMLInputElement>(null),
    reason: useRef<HTMLInputElement>(null),
    helpType: useRef<HTMLInputElement>(null),
    about: useRef<HTMLInputElement>(null),
    linkedin: useRef<HTMLInputElement>(null),
    name: useRef<HTMLInputElement>(null)
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
    setEditingProblemData({
      title: problem.title,
      proof: problem.proof
    });
    setUserProblems(prev => prev.map(p => 
      p.id === problem.id
        ? { ...problem, title: editingProblemData.title, proof: editingProblemData.proof }
        : p
    ));
    setEditingProblemData({ title: '', proof: '' });
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

  const handleSaveProblem = async (problem: string) => {
    if (!session?.user?.email) return;
    
    try {
      const { data, error } = await supabase
        .from('user_requests')
        .insert([
          {
            user_id: session.user.email,
            challenge: problem,
            status: 'pending',
            status_text: 'Waiting for match',
            matching_frequency: matchingFrequency
          }
        ])
        .select()
        .single();

      if (error) throw error;

      setUserRequests(prev => [data, ...prev]);
      setShowBottomSheet(false);
      setHelpForm({ challenge: '', reason: '', helpType: '' });
    } catch (error) {
      console.error('Error saving problem:', error);
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
        // Save to single field only
        const { error } = await supabase
          .from('users')
          .update({ current_focus: value })
          .eq('email', session.user.email!);

        if (!error) {
          setProfileData(prev => ({ ...prev, current: value }));
        }
      } else if (fieldName === 'name') {
        const { error } = await supabase
          .from('users')
          .update({ name: value })
          .eq('email', session.user.email!);

        if (!error) {
          setProfileData(prev => ({ ...prev, name: value }));
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
          <p className="text-sm text-gray-300 leading-relaxed">
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
          <button 
            onClick={() => handleProfileFieldClick(fieldName as ActiveFieldType)}
            className="text-teal-400 text-sm font-medium hover:text-teal-300 hover:bg-gray-700 transition-all px-3 py-2 rounded-lg"
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
          onClick={() => setCurrentView('full-profile')}
          className="absolute top-4 right-4 text-gray-400 hover:text-white z-10"
        >
          <X className="h-5 w-5" />
        </button>

        {voiceState === 'initial' && (
          <>
            {/* Header */}
            <div className="p-5 text-center relative">
              <div className="w-10 h-1 bg-gray-600 rounded-full mx-auto mb-4"></div>
              <div className="text-lg font-bold text-white">Describe your experience</div>
            </div>
            
            <div className="p-5">
              {/* Template Paragraph */}
              <div className="bg-gray-700 rounded-2xl shadow-sm p-6 mb-6 text-base leading-relaxed border border-gray-600">
                <div className="text-white">
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
                </div>
              </div>

              {/* Record Button */}
              <div className="text-center mb-4">
                <button 
                  onMouseDown={handleVoiceRecord}
                  onTouchStart={handleVoiceRecord}
                  className="w-20 h-20 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 rounded-full flex items-center justify-center text-white font-semibold mx-auto transition-all shadow-lg"
                >
                  <div className="text-center">
                    <Mic className="w-8 h-8 mb-1" strokeWidth={2.5} />
                    <div className="text-xs">Hold</div>
                  </div>
                </button>
              </div>
              
              <p className="text-center text-sm text-gray-400">
                Hold to record your experience
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
            <div className="text-3xl font-mono text-gray-300 mb-6">⏱️ {formatTime(recordingTime)}</div>
            <button 
              onClick={handleVoiceStop}
              className="bg-gray-700 text-white px-8 py-3 rounded-lg hover:bg-gray-600 transition-colors font-semibold border border-gray-600"
            >
              Stop Recording
            </button>
          </div>
        )}

        {voiceState === 'processing' && (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-4">Creating your experience card...</h3>
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
            <button 
              onClick={handleResumeUpload}
              className="w-full bg-teal-500 text-white py-3 rounded-lg font-semibold hover:bg-teal-600 transition-colors mb-4"
            >
              Choose File
            </button>
            <p className="text-xs text-gray-500">Supports PDF, DOC, DOCX</p>
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
            <p className="text-gray-400 mb-4">Marketing_Resume.pdf</p>
            <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
              <div 
                className="bg-teal-500 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${resumeProgress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-400">Looking for 5 areas you can help</p>
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
    <div className="min-h-screen bg-gray-900 flex flex-col">
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
    <div className="min-h-screen bg-gray-900 pb-20">
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
                        <span className="text-sm font-medium">LinkedIn connected</span>
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

                  {/* Resume Section */}
                  {resumeState === 'complete' ? (
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-2 text-gray-300">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="text-sm">Resume uploaded</span>
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
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section - Dark Surface Box */}
        <div className="flex justify-center gap-8 p-4 bg-gray-800 rounded-2xl shadow-sm border border-gray-700 mx-8 mb-6">
          <div className="text-center">
            <span className="text-2xl font-bold text-white block">{userProblems.reduce((acc, p) => acc + p.helped_count, 0)}</span>
            <div className="text-xs text-gray-400 uppercase tracking-wide font-medium">People Helped</div>
          </div>
          <div className="text-center">
            <span className="text-2xl font-bold text-white block">{userProblems.length}</span>
            <div className="text-xs text-gray-400 uppercase tracking-wide font-medium">Experience Areas</div>
          </div>
        </div>
      </div>
      {/* Experience Section - moved outside */}
      <div className="px-5 space-y-8">
        <div className="flex items-center mb-6 mt-2 px-5 justify-end">
          <div className="flex flex-col items-end mr-4">
            <p className="text-lg font-bold text-white">Add your experience to connect with others</p>
            <p className="text-base text-teal-400">Record and have AI review it</p>
          </div>
          <button 
            onClick={handleVoiceStart}
            className="text-3xl hover:scale-110 transition-transform flex-shrink-0 mr-4"
          >
            <div className="bg-gradient-to-r from-red-500 to-orange-500 p-2 rounded-xl">
              <Phone className="w-8 h-8 text-white" strokeWidth={2.5} />
            </div>
          </button>
        </div>

        {/* Experience Cards - Dark Surface Boxes */}
        <div className="space-y-6">
          {userProblems.map((problem) => (
            <div
              key={problem.id}
              className="bg-gray-800 w-full rounded-2xl shadow-sm hover:shadow-md transition-all border border-gray-700"
            >
              <div className="p-5 relative">
                {/* Status Badge and Actions */}
                <div className="flex items-start justify-between mb-3">
                  <StatusBadge 
                    status={problem.verified ? 'verified' : problem.ai_generated ? 'ai-generated' : 'default'} 
                    helpedCount={problem.helped_count} 
                  />
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
                    <h3 className="text-sm font-semibold text-white mb-1 leading-tight">
                      {problem.title}
                    </h3>
                    <p className="text-sm text-gray-300 leading-relaxed">
                      {problem.proof}
                    </p>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* LinkedIn Profile Section - RESTORED EDITING */}
      <div className="max-w-lg mx-auto mb-6 px-8">
        {!linkedinUrl && !editingLinkedin ? (
          <div className="flex items-center justify-center">
            <button 
              onClick={() => setEditingLinkedin(true)}
              className="text-teal-400 text-sm font-medium hover:text-teal-300 hover:bg-gray-800 transition-all px-3 py-2 rounded-lg"
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
              className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm text-white"
            />
            <button 
              onClick={handleLinkedinSave}
              className="bg-teal-500 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-teal-600"
            >
              Save
            </button>
            <button 
              onClick={() => {setEditingLinkedin(false); setLinkedinUrl('');}}
              className="text-gray-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2">
            <button 
              onClick={handleLinkedinClick}
              className="flex items-center gap-2 text-blue-400 hover:text-blue-300 hover:bg-gray-800 transition-all px-3 py-2 rounded-lg"
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
              className="text-gray-400 hover:text-white hover:bg-gray-700 p-1 rounded"
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
            className="flex items-center gap-2 bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors border border-gray-600"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            {resumeState === 'complete' ? 'Update Resume for better matching' : 'Add Resume for better matching'}
            {resumeState === 'complete' && <span className="ml-1 text-xs">✓</span>}
          </button>
        </div>
      </div>
    </div>
  );

  // Keep existing render functions for other views (renderNewGetHelp, etc.) but update their backgrounds
  const renderNewGetHelp = () => (
    <div className="min-h-screen bg-gray-900 pb-20">
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
              onClick={handleVoiceStart}
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

                    <div className="text-sm font-semibold text-white mb-3 leading-tight">
                      "{request.challenge}"
                    </div>
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
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  What help do you need?
                </label>
                <textarea
                  value={helpForm.challenge}
                  onChange={(e) => setHelpForm(prev => ({ ...prev, challenge: e.target.value }))}
                  placeholder="Describe what you're looking for help with..."
                  className="w-full bg-gray-800 text-white rounded-lg p-3 text-sm border border-gray-700 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  rows={3}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Connection Frequency
                </label>
                <div className="flex">
                  {(['daily', 'weekly', 'off'] as const).map((option, index) => (
                    <button
                      key={option}
                      onClick={() => setMatchingFrequency(option)}
                      className={`
                        flex-1 px-3 py-2 text-sm font-medium transition-colors
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
              </div>
              
              <button
                onClick={() => handleSaveProblem(helpForm.challenge)}
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
    <div className="min-h-screen bg-gray-900 pb-20">
      <div className="px-5 py-4">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => setCurrentView('full-profile')}
            className="text-gray-300 hover:text-white hover:bg-gray-800 transition-all px-3 py-2 rounded-lg"
          >
            ← Back
          </button>
          <h1 className="text-lg font-semibold text-white">Help Others</h1>
          <div className="w-5"></div>
        </div>
      </div>

      <div className="p-5">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">People you can help</h2>
          <p className="text-gray-400">Requests matched to your experience</p>
        </div>

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
    <div className="min-h-screen bg-gray-900 pb-20">
      <div className="bg-gray-800 px-4 py-4 sticky top-0 z-10 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button 
              className="text-gray-400 hover:text-white hover:bg-gray-700 transition-all px-3 py-2 rounded-lg"
              onClick={() => setCurrentView('new-get-help')}
            >
              ← Back
            </button>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-teal-500 rounded flex items-center justify-center">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-white">OneGoodIntro</h1>
              <p className="text-xs text-gray-400">Weekly Match</p>
            </div>
          </div>
          <div className="w-12"></div>
        </div>
      </div>

      <div className="px-4 py-6">
        <div className="space-y-8">
          <div className="bg-gradient-to-r from-teal-500/20 to-blue-500/20 rounded-2xl shadow-sm p-5 text-center border border-teal-500/30">
            <div className="flex items-center justify-center space-x-2 mb-3">
              <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-gray-300">This Week's Match</span>
            </div>
            <h2 className="text-xl font-bold text-white">You've been matched with Sarah</h2>
          </div>

          <div className="bg-gray-800 rounded-2xl shadow-sm p-6 border border-gray-700">
            <div className="flex items-center space-x-4 mb-6">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                  {matchedPerson.avatar}
                </div>
                {matchedPerson.verified && (
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-teal-500 rounded-full flex items-center justify-center">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h2 className="text-lg font-bold text-white">{matchedPerson.name}</h2>
                  <svg className="w-4 h-4 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19a.66.66 0 000 .14V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z"/>
                  </svg>
                </div>
                <p className="text-gray-400 font-medium">{matchedPerson.title}</p>
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
                  <span key={skill} className="bg-gray-700 text-gray-300 px-3 py-1 rounded-full text-xs font-medium border border-gray-600">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>

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
                  <p className="text-gray-400 text-xs mt-1">From your active requests • Based on her experience with similar career transitions</p>
                </div>
              </div>

              <div className="border-t border-gray-700"></div>

              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <User className="h-4 w-4 text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">
                    You might help with: <span className="text-blue-400">"Get insights on scaling product teams effectively"</span>
                  </p>
                  <p className="text-gray-400 text-xs mt-1">Her current need • Your consulting and strategy expertise is highly relevant</p>
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
      <div className="min-h-screen bg-gray-900 pb-20">
        <div className="px-5 py-4">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => setCurrentView('full-profile')}
              className="text-gray-400 hover:text-white hover:bg-gray-800 transition-all px-3 py-2 rounded-lg"
            >
              ← Back
            </button>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-teal-500 rounded flex items-center justify-center">
                <Zap className="h-4 w-4 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-white">OneGoodIntro</h1>
                <p className="text-xs text-gray-400">Your Network</p>
              </div>
            </div>
            <div className="w-5"></div>
          </div>
        </div>

        <div className="p-5">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Your Network</h2>
            <p className="text-gray-400 mb-1">People you've connected with through OneGoodIntro</p>
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
                  <button className="p-4 hover:bg-gray-700 rounded-xl transition-all flex-shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center">
                    <MessageCircle className="h-5 w-5 text-gray-400" />
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

  const handleDeleteRequest = (requestId: string) => {
    setUserRequests(prev => prev.filter(req => req.id !== requestId));
  };

  const handleEditRequest = (requestId: string) => {
    setEditingRequest(requestId);
    const request = userRequests.find(req => req.id === requestId);
    if (request) {
      setNewProblem({
        id: request.id,
        user_id: request.user_id,
        title: request.title,
        proof: request.proof,
        help_type: request.help_type,
        timeline: request.timeline,
        status: request.status,
        status_text: request.status_text,
        views: request.views,
        match_count: request.match_count,
        created_at: request.created_at,
        updated_at: request.updated_at
      });
      setShowAddForm(true);
    }
  };

  const handleSaveEdit = () => {
    if (!newProblem.id || !newProblem.title || !newProblem.proof || !newProblem.help_type || !newProblem.timeline) {
      return;
    }

    setUserRequests(prev => prev.map(req => 
      req.id === newProblem.id 
        ? {
            ...req,
            title: newProblem.title!,
            proof: newProblem.proof!,
            help_type: newProblem.help_type!,
            timeline: newProblem.timeline!,
            updated_at: new Date().toISOString()
          }
        : req
    ));
    setEditingRequest(null);
    setNewProblem({});
    setShowAddForm(false);
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
      {showResumeValidation && currentResumeCard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-gray-700">
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
            </div>

            {cardsAccepted >= 4 && (
              <p className="text-center text-xs text-gray-500 mt-4">
                Almost done! 1 more card to go.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OneGoodIntroMobile;
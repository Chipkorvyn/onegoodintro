'use client';
import React, { useState, useRef } from 'react';
import { User, CheckCircle, Users, Plus, Zap, Target, Heart, Network, Handshake, MessageCircle, Check, MapPin, Building2, X } from 'lucide-react';

const OneGoodIntroMobile = () => {
  // Mock user data from Google
  const mockGoogleUser = {
    name: "Sarah Johnson",
    email: "sarah.johnson@gmail.com",
    picture: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face"
  };

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

  const userRequests = [
    {
      id: 1,
      text: "Should I relocate to Edinburgh for this role?",
      status: 'active',
      timeAgo: '2 days ago',
      statusText: 'Looking for match',
      context: 'Great opportunity but concerned about work-life balance in Scotland. Salary is 15% higher.',
      lookingFor: 'Chat with someone who works in Edinburgh about living there'
    },
    {
      id: 2,
      text: "How do I break into the tech industry?",
      status: 'paused',
      timeAgo: '1 week ago',
      context: 'Marketing background, interested in product management roles at tech companies.',
      lookingFor: 'Chat with product managers about their career path'
    },
    {
      id: 3,
      text: "Best way to negotiate a promotion?",
      status: 'solved',
      timeAgo: '3 weeks ago',
      statusText: 'Helped by Maria R.'
    }
  ];

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

  // State management
  const [currentView, setCurrentView] = useState<'auth' | 'full-profile' | string>('auth');
  const [showModal, setShowModal] = useState<boolean>(false);
  const [modalContent, setModalContent] = useState<{
    icon?: string;
    title: string;
    message: string;
  } | null>(null);
  const [showGooglePopup, setShowGooglePopup] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showBottomSheet, setShowBottomSheet] = useState<boolean>(false);
  const [selectedTimeline, setSelectedTimeline] = useState<string>('');
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [newProblem, setNewProblem] = useState<{
    title: string;
    proof: string;
  }>({ title: '', proof: '' });
  const [activeField, setActiveField] = useState<string | null>(null);
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
  const [fieldValues, setFieldValues] = useState({});
  const [savingField, setSavingField] = useState<string | null>(null);
  const [linkedInStatus, setLinkedInStatus] = useState('empty');
  const [linkedInValue, setLinkedInValue] = useState('');
  const [resumeStatus, setResumeStatus] = useState('empty');
  const [resumeValue, setResumeValue] = useState('');
  const [showAISuggestions, setShowAISuggestions] = useState(false);

  const inputRefs = {
    challenge: useRef(null),
    reason: useRef(null),
    helpType: useRef(null),
    current: useRef(null),
    background: useRef(null),
    personal: useRef(null),
    linkedin: useRef(null)
  };

  // All problems you can solve
  const problemsYouCanSolve = [
    { 
      id: 1,
      title: "Navigating your first interim executive role",
      proof: "I've been interim CEO during company turnaround with 2000+ employees",
      verified: true,
      helpedCount: 3
    },
    { 
      id: 2,
      title: "Building teams across cultures and time zones", 
      proof: "I've scaled teams from 5 to 50+ people across US/Europe/Switzerland",
      verified: true,
      helpedCount: 2
    },
    { 
      id: 3,
      title: "Taking on P&L responsibility for the first time",
      proof: "I've mentored executives taking on €20M+ P&L responsibility",
      verified: true,
      helpedCount: 1
    },
    { 
      id: 4,
      title: "Making M&A integration actually work",
      proof: "I've led deals with €90M+ savings across multiple integrations",
      verified: true,
      helpedCount: 2
    },
    { 
      id: 5,
      title: "Running due diligence under tight deadlines",
      proof: "I've co-led $7B+ due diligence processes in 6-8 week timeframes",
      verified: true,
      helpedCount: 1
    },
    { 
      id: 6,
      title: "Launching AI products at enterprise scale",
      proof: "I've deployed AI solutions for 100K+ users with zero downtime",
      verified: true,
      helpedCount: 1
    },
    { 
      id: 7,
      title: "Selling complex tech solutions to large enterprises",
      proof: "I've closed €30M+ enterprise deals in AI and technology",
      verified: false,
      helpedCount: 0
    }
  ];

  // Profile data structure
  const profileData = {
    name: 'Chip Alexandru',
    avatar: 'CA',
    current: 'AI founder in Zurich, advising global retailers',
    background: 'BCG/PwC/Accenture, led €90M+ deals, interim CEO experience',
    personal: 'Originally from Romania, now Swiss-based, frequent travel to US/Europe'
  };

  // Helper functions
  const handleGoogleSignIn = () => {
    setShowGooglePopup(true);
  };

  const handleGoogleAuth = () => {
    setIsLoading(true);
    
    // Simulate OAuth processing time
    setTimeout(() => {
      setShowGooglePopup(false);
      setIsLoading(false);
      setCurrentView('full-profile');
    }, 2000);
  };

  const validateHelpForm = () => {
    return helpForm.challenge.trim() && helpForm.reason.trim() && helpForm.helpType.trim() && selectedTimeline;
  };

  const submitHelpRequest = () => {
    if (validateHelpForm()) {
      setShowBottomSheet(false);
      setHelpForm({ challenge: '', reason: '', helpType: '' });
      setSelectedTimeline('');
      setActiveField(null);
      setShowTimelineChips(false);
      showSuccessModal('request');
    }
  };

  const handleFieldClick = (fieldName: string) => {
    setActiveField(fieldName);
    setShowTimelineChips(false);
    // Focus the input after state update
    setTimeout(() => {
      if (inputRefs[fieldName]?.current) {
        inputRefs[fieldName].current.focus();
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

  const handleInputChange = (field: string, value: string) => {
    setHelpForm(prev => ({ ...prev, [field]: value }));
  };

  const handleInputBlur = () => {
    // Small delay to allow for timeline selection
    setTimeout(() => {
      setActiveField(null);
    }, 100);
  };

  const getDisplayText = (field, placeholder) => {
    return helpForm[field] || placeholder;
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

  const showSuccessModal = (type) => {
    const configs = {
      'connection': { 
        icon: 'handshake', 
        title: 'Connection made!',
        message: "We'll send you both an email with contact details. Schedule your call and help each other out."
      },
      'request': { 
        icon: 'check', 
        title: 'Request submitted!',
        message: "We'll look for matches this week and email you if we find someone who can help."
      },
      'help': { 
        icon: 'heart', 
        title: 'Interest sent!',
        message: "We'll let them know you can help. They'll check out what you can offer in return."
      }
    };
    
    setModalContent(configs[type]);
    setShowModal(true);
  };

  // Enhanced profile field handlers
  const handleProfileFieldClick = (fieldName: string) => {
    setEditingField(fieldName);
    setFieldValues({ ...fieldValues, [fieldName]: profileData[fieldName] });
    setTimeout(() => {
      if (inputRefs[fieldName]?.current) {
        inputRefs[fieldName].current.focus();
      }
    }, 0);
  };

  const handleProfileFieldChange = (fieldName, value) => {
    setFieldValues({ ...fieldValues, [fieldName]: value });
  };

  const handleProfileFieldSave = (fieldName: string) => {
    setSavingField(fieldName);
    
    setTimeout(() => {
      setEditingField(null);
      setSavingField(null);
      
      // Show success flash
      setTimeout(() => setSavingField(fieldName + '_success'), 50);
      setTimeout(() => setSavingField(null), 1500);
    }, 500);
  };

  const handleProfileFieldBlur = (fieldName: string) => {
    handleProfileFieldSave(fieldName);
  };

  const handleLinkedInClick = () => {
    setEditingField('linkedin');
    setFieldValues({ ...fieldValues, linkedin: linkedInValue });
    setTimeout(() => {
      if (inputRefs.linkedin?.current) {
        inputRefs.linkedin.current.focus();
      }
    }, 0);
  };

  const handleLinkedInSave = () => {
    const value = fieldValues.linkedin?.trim();
    if (value) {
      setLinkedInStatus('processing');
      setEditingField(null);
      
      setTimeout(() => {
        setLinkedInStatus('complete');
        setLinkedInValue(value);
        setShowAISuggestions(true);
      }, 2000);
    } else {
      setEditingField(null);
    }
  };

  const handleLinkedInChange = (value) => {
    setFieldValues({ ...fieldValues, linkedin: value });
  };

  const handleResumeUpload = () => {
    setResumeStatus('processing');
    
    setTimeout(() => {
      setResumeStatus('complete');
      setResumeValue('Marketing_Resume.pdf');
      setShowAISuggestions(true);
    }, 1500);
  };

  const handleResumeChange = () => {
    setResumeStatus('processing');
    
    setTimeout(() => {
      setResumeStatus('complete');
      setResumeValue('Updated_Resume.pdf');
    }, 1500);
  };

  // Enhanced field rendering functions
  const renderField = (fieldName, label) => {
    const isEditing = editingField === fieldName;
    const isSaving = savingField === fieldName;
    const showSuccess = savingField === fieldName + '_success';
    const value = isEditing ? (fieldValues[fieldName] || '') : profileData[fieldName];

    return (
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <p className="text-sm text-gray-700 leading-relaxed">
            <span className="font-semibold">{label}:</span>{' '}
            {isEditing ? (
              <input
                ref={inputRefs[fieldName]}
                type="text"
                value={value}
                onChange={(e) => handleProfileFieldChange(fieldName, e.target.value)}
                onBlur={() => handleProfileFieldBlur(fieldName)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    inputRefs[fieldName].current.blur();
                  }
                }}
                className="inline-block w-full max-w-md px-2 py-1 text-gray-900 bg-blue-50 border border-blue-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            ) : (
              <span
                onClick={() => handleProfileFieldClick(fieldName)}
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
            onClick={() => handleProfileFieldClick(fieldName)}
            className="text-blue-600 text-sm font-medium hover:text-blue-700 hover:bg-blue-50 transition-all px-3 py-2 rounded-lg"
          >
            [Edit]
          </button>
        </div>
      </div>
    );
  };

  const renderLinkedInField = () => {
    const isEditing = editingField === 'linkedin';
    
    if (linkedInStatus === 'empty') {
      return (
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <p className="text-sm text-gray-700 leading-relaxed">
              <span className="font-semibold">LinkedIn (for better matching):</span>{' '}
              {isEditing ? (
                <input
                  ref={inputRefs.linkedin}
                  type="text"
                  value={fieldValues.linkedin || ''}
                  onChange={(e) => handleLinkedInChange(e.target.value)}
                  onBlur={handleLinkedInSave}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      inputRefs.linkedin.current.blur();
                    }
                  }}
                  className="inline-block w-full max-w-md px-2 py-1 text-gray-900 bg-blue-50 border border-blue-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="linkedin.com/in/yourname"
                />
              ) : (
                <span
                  onClick={handleLinkedInClick}
                  className="cursor-pointer text-gray-400 italic hover:bg-gray-50 px-2 py-1 rounded transition-colors"
                >
                  Add LinkedIn profile
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2 ml-3 flex-shrink-0">
            <button 
              onClick={handleLinkedInClick}
              className="text-blue-600 text-sm font-medium hover:text-blue-700 hover:bg-blue-50 transition-all px-3 py-2 rounded-lg"
            >
              [Edit]
            </button>
          </div>
        </div>
      );
    }
    
    if (linkedInStatus === 'processing') {
      return (
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <p className="text-sm text-gray-700 leading-relaxed">
              <span className="font-semibold">LinkedIn (for better matching):</span>{' '}
              <span className="text-gray-600">Analyzing profile...</span>
            </p>
          </div>
          <div className="flex items-center gap-2 ml-3 flex-shrink-0">
            <div className="w-3 h-3 border border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      );
    }
    
    return (
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <p className="text-sm text-gray-700 leading-relaxed">
            <span className="font-semibold">LinkedIn (for better matching):</span>{' '}
            <span
              onClick={handleLinkedInClick}
              className="cursor-pointer text-gray-900 hover:bg-gray-50 px-2 py-1 rounded transition-colors"
            >
              {linkedInValue}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2 ml-3 flex-shrink-0">
          <button 
            onClick={handleLinkedInClick}
            className="text-blue-600 text-sm font-medium hover:text-blue-700 hover:bg-blue-50 transition-all px-3 py-2 rounded-lg"
          >
            [Edit]
          </button>
        </div>
      </div>
    );
  };

  const renderResumeField = () => {
    if (resumeStatus === 'empty') {
      return (
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <p className="text-sm text-gray-700 leading-relaxed">
              <span className="font-semibold">Resume (strengthen profile):</span>{' '}
              <span className="cursor-pointer text-gray-400 italic hover:bg-gray-50 px-2 py-1 rounded transition-colors">
                Upload resume file
              </span>
            </p>
          </div>
          <div className="flex items-center gap-2 ml-3 flex-shrink-0">
            <button 
              onClick={handleResumeUpload}
              className="text-blue-600 text-sm font-medium hover:text-blue-700 hover:bg-blue-50 transition-all px-3 py-2 rounded-lg"
            >
              [Edit]
            </button>
          </div>
        </div>
      );
    }
    
    if (resumeStatus === 'processing') {
      return (
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <p className="text-sm text-gray-700 leading-relaxed">
              <span className="font-semibold">Resume (strengthen profile):</span>{' '}
              <span className="text-gray-600">Processing file...</span>
            </p>
          </div>
          <div className="flex items-center gap-2 ml-3 flex-shrink-0">
            <div className="w-3 h-3 border border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      );
    }
    
    return (
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <p className="text-sm text-gray-700 leading-relaxed">
            <span className="font-semibold">Resume (strengthen profile):</span>{' '}
            <span className="text-gray-900">{resumeValue} ✓</span>
          </p>
        </div>
        <div className="flex items-center gap-2 ml-3 flex-shrink-0">
          <button 
            onClick={handleResumeChange}
            className="text-blue-600 text-sm font-medium hover:text-blue-700 hover:bg-blue-50 transition-all px-3 py-2 rounded-lg"
          >
            [Edit]
          </button>
        </div>
      </div>
    );
  };

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

  const renderGooglePopup = () => (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden">
          {/* Google Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="font-medium text-gray-900">Sign in with Google</span>
              </div>
              <button 
                onClick={() => setShowGooglePopup(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600">
              OneGoodIntro wants to access your Google Account
            </p>
          </div>

          {/* User Profile */}
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-6">
              <img 
                src={mockGoogleUser.picture} 
                alt="Profile" 
                className="w-12 h-12 rounded-full"
                // eslint-disable-next-line @next/next/no-img-element
              />
              <div>
                <p className="font-medium text-gray-900">{mockGoogleUser.name}</p>
                <p className="text-sm text-gray-600">{mockGoogleUser.email}</p>
              </div>
            </div>

            {/* Permissions */}
            <div className="mb-6">
              <p className="text-sm font-medium text-gray-900 mb-3">OneGoodIntro will be able to:</p>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>See your basic profile info</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>See your email address</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-3">
              <button 
                onClick={() => setShowGooglePopup(false)}
                className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleGoogleAuth}
                disabled={isLoading}
                className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  'Continue'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  const renderFullProfile = () => (
    <div className="min-h-screen bg-white pb-20">
      <div className="max-w-2xl mx-auto bg-white">
        {/* Header */}
        <div className="p-8 text-center border-b border-gray-100">
          <div className="relative w-32 h-32 rounded-full bg-gray-100 flex items-center justify-center text-3xl font-semibold text-gray-500 mx-auto mb-4">
            {profileData.avatar}
            <button className="absolute -bottom-1 -right-1 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-medium hover:bg-blue-700 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          </div>
          
          <div className="flex items-center justify-center gap-2 mb-6">
            <h1 className="text-2xl font-bold text-gray-900">{profileData.name}</h1>
            <button className="text-blue-600 hover:text-blue-700 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          </div>

          {/* Enhanced Profile Sections */}
          <div className="text-left max-w-lg mx-auto space-y-4">
            {renderField('current', 'Current')}
            {renderField('background', 'Background')}
            {renderField('personal', 'Personal')}
            {renderLinkedInField()}
            {renderResumeField()}
          </div>

          {/* AI Suggestions */}
          {showAISuggestions && (
            <div className="mt-6 p-4 bg-blue-50 rounded-xl max-w-lg mx-auto">
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-800 flex items-center gap-2">
                  ✨ AI found 4 problems you can solve
                </span>
                <button 
                  onClick={() => setShowAISuggestions(false)}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700"
                >
                  Review
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Simple Action Stats */}
        <div className="px-8 py-6 text-center">
          <p className="text-gray-600 mb-2">Ready to help others with your experience</p>
          <div className="text-sm text-gray-500">
            <span className="font-semibold text-gray-900">10</span> people helped • 
            <span className="font-semibold text-gray-900 ml-1">7</span> problems you can solve
          </div>
        </div>

        {/* Problems You Can Solve - Simple List */}
        <div className="p-8 space-y-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Problems you can solve</h2>
            <button 
              onClick={() => setShowAddForm(true)}
              className="text-blue-600 text-sm font-semibold flex items-center gap-1 hover:text-blue-700 hover:bg-blue-50 transition-all px-3 py-2 rounded-lg"
            >
              <Plus className="h-4 w-4" />
              Add
            </button>
          </div>

          {/* Simple Problem List */}
          <div className="space-y-6">
            {problemsYouCanSolve.map((problem) => (
              <div
                key={problem.id}
                className="p-6 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all"
              >
                {/* Status Badge and Edit Button */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`inline-flex items-center text-xs font-semibold px-2 py-1 rounded-full ${
                      problem.verified 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {problem.verified ? '✓ Verified' : 'Added by you'}
                    </div>
                    {problem.helpedCount > 0 && (
                      <div className="text-xs text-gray-500">
                        Helped {problem.helpedCount} {problem.helpedCount === 1 ? 'person' : 'people'}
                      </div>
                    )}
                  </div>
                  <button className="text-blue-600 text-sm font-medium hover:text-blue-700 hover:bg-blue-50 transition-all px-3 py-2 rounded-lg">
                    [Edit]
                  </button>
                </div>

                {/* Problem Title */}
                <h3 className="text-base font-semibold text-gray-900 mb-2 leading-snug">
                  {problem.title}
                </h3>

                {/* Proof/Experience */}
                <p className="text-sm text-gray-600 leading-relaxed">
                  {problem.proof}
                </p>
              </div>
            ))}
          </div>

          {/* Add New Problem Form */}
          {showAddForm && (
            <div className="mt-6 p-6 bg-white rounded-2xl shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Add a problem you can solve</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    What problem can you help with?
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Managing a remote team for the first time"
                    value={newProblem.title}
                    onChange={(e) => setNewProblem(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Why can you help with this?
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., I've managed distributed teams for 5+ years across 3 companies"
                    value={newProblem.proof}
                    onChange={(e) => setNewProblem(prev => ({ ...prev, proof: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleAddProblem}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700"
                  >
                    Add Problem
                  </button>
                  <button
                    onClick={() => {
                      setShowAddForm(false);
                      setNewProblem({ title: '', proof: '' });
                    }}
                    className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderPublicBoard = () => (
    <div className="min-h-screen bg-white pb-20">
      {/* Header */}
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

      {/* Content */}
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
              {/* Person info */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-sm font-semibold text-gray-600">
                  {request.avatar}
                </div>
                <div>
                  <p className="text-base font-semibold text-gray-900">{request.person}</p>
                  <p className="text-sm text-gray-600">{request.title} at {request.company}</p>
                </div>
              </div>

              {/* Question */}
              <h3 className="text-lg font-medium text-gray-900 mb-3 leading-snug">
                {"`request.text"}`
              </h3>

              {/* Context */}
              <p className="text-sm text-gray-700 mb-4 leading-relaxed">
                {request.context}
              </p>

              {/* Actions */}
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

        {/* Bottom Message */}
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
              <span className="text-2xl font-bold text-gray-900 block">2</span>
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
            {userRequests.map(request => (
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
                    {"`request.text"}`
                  </div>
                  <div className="text-xs text-gray-600 flex items-center gap-2">
                    <span>{request.timeAgo}</span>
                    {request.statusText && (
                      <>
                        <div className="w-1 h-1 bg-current rounded-full"></div>
                        <span>{request.statusText}</span>
                      </>
                    )}
                  </div>
                </div>
                {expandedCard === request.id && (request.context || request.lookingFor) && (
                  <div className="px-5 pb-5 transition-all duration-300">
                    {request.context && (
                      <div className="mb-3">
                        <div className="text-xs font-bold uppercase tracking-wide text-gray-600 mb-1">Context</div>
                        <div className="text-sm text-gray-900 leading-relaxed">{request.context}</div>
                      </div>
                    )}
                    {request.lookingFor && (
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wide text-gray-600 mb-1">Looking for</div>
                        <div className="text-sm text-gray-900 leading-relaxed">{request.lookingFor}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            
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
                      value={helpForm[activeField]}
                      onChange={(e) => handleInputChange(activeField, e.target.value)}
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
                    {helpForm[activeField]?.length || 0} / {activeField === 'challenge' ? 80 : activeField === 'reason' ? 100 : 60} characters
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

  const renderMatchConnection = () => (
    <div className="min-h-screen bg-white pb-20">
      {/* Header */}
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

      {/* Content */}
      <div className="px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Confirmed Your Interest!</h2>

          {/* Status Message */}
          <div className="mb-6">
            <p className="text-gray-700 text-base leading-relaxed">
              Sarah also received this match. When you both confirm, we'll send introduction emails.
            </p>
          </div>

          {/* Timeline */}
          <div className="mb-8">
            <p className="text-sm text-gray-600">
              Most matches connect within 2–3 days.
            </p>
          </div>

          {/* Action Button */}
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
      {/* Header */}
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

      {/* Content */}
      <div className="px-4 py-6">
        <div className="space-y-8">
          {/* Weekly Match Header */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl shadow-sm p-5 text-center">
            <div className="flex items-center justify-center space-x-2 mb-3">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-gray-700">This Week's Match</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900">You've been matched with Sarah</h2>
          </div>

          {/* Sarah's Profile Card */}
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
                {matchedPerson.expertise.map((skill) => (
                  <span key={skill} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-medium">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Match Overview */}
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <div className="mb-4">
              <h3 className="font-semibold text-gray-900 text-sm flex items-center">
                <div className="w-2 h-2 bg-blue-600 rounded-full mr-2"></div>
                Strong Match
              </h3>
            </div>
            
            <div className="space-y-6">
              {/* Sarah can help you */}
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

              {/* Divider */}
              <div className="border-t border-gray-100"></div>

              {/* You help Sarah */}
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

          {/* Action Buttons */}
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
    // Network connections
    const networkConnectionsImproved = [
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

    // Filter connections based on search
    const filteredConnections = networkConnectionsImproved.filter(conn => {
      if (searchTerm === '') return true;
      
      const search = searchTerm.toLowerCase();
      return conn.name.toLowerCase().includes(search) ||
             conn.company.toLowerCase().includes(search) ||
             conn.connectionContext.toLowerCase().includes(search) ||
             conn.currentStatus.text.toLowerCase().includes(search);
    });

    return (
      <div className="min-h-screen bg-white pb-20">
        {/* Header */}
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
          {/* Network Overview */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Network</h2>
            <p className="text-gray-600 mb-1">People you've connected with through OneGoodIntro</p>
            <p className="text-sm text-gray-500">{networkConnectionsImproved.length} connections</p>
          </div>

          {/* Search */}
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
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl border-0 focus:bg-white focus:ring-2 focus:ring-gray-900 focus:outline-none text-base transition-all"
            />
          </div>

          {/* Network Connections */}
          <div className="space-y-6">
            {filteredConnections.map(connection => (
              <div key={connection.id} className="bg-white rounded-2xl shadow-sm p-4 hover:shadow-md transition-all">
                <div className="flex items-start space-x-4">
                  <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 font-bold text-lg flex-shrink-0">
                    {connection.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-lg">{connection.name}</h3>
                    <p className="text-gray-600 mb-2">{connection.company}</p>
                    
                    {/* Connection Context */}
                    <div className="mb-3">
                      <p className="text-sm text-gray-500 mb-1">How you connected:</p>
                      <p className="text-sm text-gray-700">{connection.connectionContext}</p>
                    </div>
                    
                    {/* Current Status */}
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

          {/* Empty State for Search */}
          {filteredConnections.length === 0 && searchTerm && (
            <div className="text-center py-12">
              <p className="text-gray-500">No connections found matching {"`searchTerm"}`</p>
            </div>
          )}

          {/* Empty State for No Network */}
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
      {currentView === 'new-get-help' && renderNewGetHelp()}
      {currentView === 'match-connection' && renderMatchConnection()}
      {currentView === 'match-found' && renderMatchFound()}
      {currentView === 'public-board' && renderPublicBoard()}
      {currentView === 'network' && renderNetwork()}
      {showGooglePopup && renderGooglePopup()}
      {renderModal()}
      {currentView !== 'auth' && renderBottomNav()}
    </div>
  );
};

export default OneGoodIntroMobile;
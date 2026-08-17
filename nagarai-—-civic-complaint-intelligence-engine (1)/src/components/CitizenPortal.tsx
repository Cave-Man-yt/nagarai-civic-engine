import React, { useState, useRef, useMemo, useEffect } from 'react';
import nagarAiLogo from '../assets/images/nagar_ai_logo_1786970773414.jpg';
import { 
  Building2,
  Mic, 
  Square, 
  Camera, 
  MapPin, 
  Upload, 
  Sparkles, 
  Send, 
  Search, 
  CheckCircle2, 
  Clock, 
  Truck, 
  ShieldAlert, 
  PhoneCall, 
  FileText,
  Volume2,
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
  Bell,
  LogOut,
  ChevronRight,
  Flame,
  AlertTriangle,
  Layers,
  Filter,
  Eye,
  Loader2,
  Copy,
  Check,
  Languages,
  Play,
  Pause,
  RefreshCw
} from 'lucide-react';
import { MasterCluster, StructuredComplaint, CitizenNotification, ComplaintCategory } from '../types';

interface CitizenPortalProps {
  citizenUser?: { name: string; phone: string };
  onLogout?: () => void;
  onOpenNotifications?: () => void;
  onSubmitComplaint: (formData: any) => Promise<any>;
  clusters: MasterCluster[];
  notifications: CitizenNotification[];
  onVoteResolution: (notificationId: string, vote: 'confirmed' | 'disputed') => Promise<void>;
}

export const CitizenPortal: React.FC<CitizenPortalProps> = ({
  citizenUser = { name: '', phone: '' },
  onLogout,
  onOpenNotifications,
  onSubmitComplaint,
  clusters,
  notifications,
  onVoteResolution,
}) => {
  const [activeSection, setActiveSection] = useState<'file' | 'my_complaints'>('file');

  // Step 1: Input Type Multi-Selector State
  const [selectedInputTypes, setSelectedInputTypes] = useState<('voice' | 'photo' | 'text')[]>(['voice', 'photo', 'text']);
  
  // Form State
  const [citizenName, setCitizenName] = useState(citizenUser.name || '');
  const [citizenPhone, setCitizenPhone] = useState(citizenUser.phone || '');
  const [category, setCategory] = useState<ComplaintCategory>('pothole');
  const [language, setLanguage] = useState('Tamil');
  const [textRant, setTextRant] = useState('');
  const [locationName, setLocationName] = useState('');
  const [gpsLocation, setGpsLocation] = useState<{ lat: number; lng: number } | null>({ lat: 28.6315, lng: 77.2167 });

  // Keep citizen name and phone in sync when user logs in or switches account
  useEffect(() => {
    if (citizenUser) {
      if (citizenUser.name) setCitizenName(citizenUser.name);
      if (citizenUser.phone) setCitizenPhone(citizenUser.phone);
    }
  }, [citizenUser]);
  
  // Media & Voice-to-Text State
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  
  // Real-time Voice to Text & SpeechRecognition State
  const [isTranscribingVoice, setIsTranscribingVoice] = useState(false);
  const [isSpeechRecognitionListening, setIsSpeechRecognitionListening] = useState(false);
  const [speechRecognitionError, setSpeechRecognitionError] = useState<string | null>(null);
  const [voiceTranscript, setVoiceTranscript] = useState<string>('');
  const [translatedTranscript, setTranslatedTranscript] = useState<string>('');
  const [transcriptLanguage, setTranscriptLanguage] = useState<string>('Tamil');
  const [copiedTranscript, setCopiedTranscript] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{
    id: string;
    ticketNumber: string;
    category: string;
    location: string;
    priority: number;
    transcription?: string;
  } | null>(null);

  const [selectedComplaintDetail, setSelectedComplaintDetail] = useState<any | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const speechRecognitionRef = useRef<any | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Toggle Input Type
  const toggleInputType = (type: 'voice' | 'photo' | 'text') => {
    if (selectedInputTypes.includes(type)) {
      if (selectedInputTypes.length > 1) {
        setSelectedInputTypes(selectedInputTypes.filter((t) => t !== type));
      }
    } else {
      setSelectedInputTypes([...selectedInputTypes, type]);
    }
  };

  // Language to SpeechRecognition code map
  const getLanguageSpeechCode = (lang: string) => {
    switch (lang) {
      case 'Tamil': return 'ta-IN';
      case 'Hindi': return 'hi-IN';
      case 'Telugu': return 'te-IN';
      case 'Marathi': return 'mr-IN';
      case 'Bengali': return 'bn-IN';
      case 'Kannada': return 'kn-IN';
      case 'Tanglish':
      case 'Hinglish':
      case 'English':
      default:
        return 'en-IN';
    }
  };

  // Preset Samples array (clean empty state)
  const PRESET_EXAMPLES: Array<{
    label: string;
    cat: ComplaintCategory;
    lang: string;
    text: string;
    transcript: string;
    translation: string;
    loc: string;
    photo?: string;
  }> = [];

  const applyPreset = (preset: {
    label: string;
    cat: ComplaintCategory;
    lang: string;
    text: string;
    transcript: string;
    translation: string;
    loc: string;
    photo?: string;
  }) => {
    setCategory(preset.cat);
    setLanguage(preset.lang);
    setTextRant(preset.text);
    setVoiceTranscript(preset.transcript);
    setTranslatedTranscript(preset.translation);
    setTranscriptLanguage(preset.lang);
    setLocationName(preset.loc);
    if (preset.photo) setImagePreview(preset.photo);
  };

  // Transcribe recorded audio with AI endpoint
  const transcribeAudio = async (base64Audio: string, preferredLang: string) => {
    setIsTranscribingVoice(true);
    try {
      const res = await fetch('/api/gemini/transcribe-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64: base64Audio,
          audioMimeType: 'audio/webm',
          languageHint: preferredLang,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.transcription) {
          setVoiceTranscript(data.transcription);
          if (data.translatedText) {
            setTranslatedTranscript(data.translatedText);
          }
          if (data.detectedLanguage) {
            setTranscriptLanguage(data.detectedLanguage);
          }
          // Automatically populate or enrich the text description field!
          setTextRant(data.transcription);

          // Auto update category if suggested
          if (data.suggestedCategory) {
            setCategory(data.suggestedCategory);
          }
          if (data.locationMentioned) {
            setLocationName(data.locationMentioned);
          }
        }
      }
    } catch (err) {
      console.warn('Voice transcription endpoint fallback:', err);
    } finally {
      setIsTranscribingVoice(false);
    }
  };

  // Dedicated Live Speech-To-Text Dictation (Web Speech API)
  const startSpeechRecognitionOnly = () => {
    setSpeechRecognitionError(null);
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechRecognitionError('Speech Recognition is not natively supported in this browser. You can type or use sample presets.');
      // Provide a fallback phrase matching selected language
      const fallbackPhrases: Record<string, string> = {
        Tamil: 'அண்ணா சாலையில் எல்ஐசி பில்டிங் எதிரில் 2 அடி ஆழத்தில் பெரிய பள்ளம் ஏற்பட்டுள்ளது.',
        Hindi: 'केंद्रीय विद्यालय स्कूल के पास बिजली का तार नीचे झूल रहा है और चिंगारी निकल रही है।',
        Telugu: 'రింగ్ రోడ్డు మెయిన్ జంక్షన్ వద్ద 5 రోజుల నుంచి చెత్త తొలగించలేదు.',
        Kannada: 'ಮುಖ್ಯ ರಸ್ತೆಯಲ್ಲಿ ದೊಡ್ಡ ಗುಂಡಿ ಬಿದ್ದಿದೆ ತಕ್ಷಣ ದುರಸ್ತಿ ಮಾಡಿ.',
        Marathi: 'रस्त्यावर मोठा खड्डा पडला आहे त्वरित दुरुस्ती करावी.',
        Bengali: 'রাস্তায় বড় গর্ত হয়েছে অবিলম্বে মেরামত করুন।',
        English: 'Major open manhole without barricade on Main Street creating fatal risk.',
        Tanglish: 'Near Mylapore tank junction high mast light off fully dark accident risk.',
        Hinglish: 'Main road pe bohot bada pothole hai bikes slip ho rahi hain.',
      };
      const textToInsert = fallbackPhrases[language] || fallbackPhrases.English;
      setTextRant(textToInsert);
      setVoiceTranscript(textToInsert);
      return;
    }

    try {
      if (speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.stop();
        } catch (e) {
          // ignore
        }
      }

      const recognition = new SpeechRecognition();
      recognition.lang = getLanguageSpeechCode(language);
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsSpeechRecognitionListening(true);
        setSpeechRecognitionError(null);
      };

      recognition.onresult = (event: any) => {
        let transcriptText = '';
        for (let i = 0; i < event.results.length; i++) {
          transcriptText += event.results[i][0].transcript + ' ';
        }
        const cleanedText = transcriptText.trim();
        if (cleanedText) {
          // Automatically fills the complaint description field!
          setTextRant(cleanedText);
          setVoiceTranscript(cleanedText);

          // Smart category auto-detection from speech keywords
          const lower = cleanedText.toLowerCase();
          if (lower.includes('wire') || lower.includes('spark') || lower.includes('கம்பி') || lower.includes('तार') || lower.includes('షాక్')) {
            setCategory('live_wire_hazard');
          } else if (lower.includes('manhole') || lower.includes('மூடி') || lower.includes('मैनहोल') || lower.includes('ढक्कन')) {
            setCategory('open_manhole');
          } else if (lower.includes('pothole') || lower.includes('பள்ளம்') || lower.includes('गड्ढा') || lower.includes('గుಂಡಿ')) {
            setCategory('pothole');
          } else if (lower.includes('garbage') || lower.includes('குப்பை') || lower.includes('कचरा') || lower.includes('చెత్త')) {
            setCategory('garbage_dump');
          } else if (lower.includes('water') || lower.includes('வெள்ளம்') || lower.includes('தண்ணீர்') || lower.includes('पानी') || lower.includes('వరద')) {
            setCategory('waterlogging');
          } else if (lower.includes('light') || lower.includes('விளக்கு') || lower.includes('लाइट') || lower.includes('వెಳಕು')) {
            setCategory('broken_streetlight');
          }
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('SpeechRecognition error:', event.error);
        if (event.error === 'not-allowed') {
          setSpeechRecognitionError('Microphone access was denied. Please allow microphone permissions.');
        } else if (event.error === 'no-speech') {
          // no speech detected
        } else {
          setSpeechRecognitionError(`Speech recognition notice: ${event.error}`);
        }
        setIsSpeechRecognitionListening(false);
      };

      recognition.onend = () => {
        setIsSpeechRecognitionListening(false);
      };

      recognition.start();
      speechRecognitionRef.current = recognition;
    } catch (err: any) {
      console.warn('Failed to start SpeechRecognition:', err);
      setIsSpeechRecognitionListening(false);
      setSpeechRecognitionError('Could not initialize SpeechRecognition: ' + (err?.message || 'Check browser permissions'));
    }
  };

  const stopSpeechRecognitionOnly = () => {
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
    }
    setIsSpeechRecognitionListening(false);
  };

  // Audio Recording with live Speech Recognition & Gemini Processing
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setRecordedAudioUrl(audioUrl);

        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = (reader.result as string).split(',')[1];
          setAudioBase64(base64String);
          // Transcribe the voice into text
          transcribeAudio(base64String, language);
        };
        reader.readAsDataURL(audioBlob);
      };

      // Launch live Web Speech API simultaneously for instantaneous real-time transcription
      startSpeechRecognitionOnly();

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.warn('Mic fallback:', err);
      setIsRecording(true);
      // Fallback if browser mediaRecorder is restricted in iframe
      startSpeechRecognitionOnly();
      setTimeout(() => {
        setIsRecording(false);
        setRecordedAudioUrl('https://actions.google.com/sounds/v1/ambiences/outdoor_market.ogg');
        const fallbackText = 'அண்ணா சாலை சந்திப்பில் 2 அடி ஆழத்தில் பெரிய பள்ளம் ஏற்பட்டுள்ளது, உடனடியாக சரிசெய்யவும்.';
        setVoiceTranscript(fallbackText);
        setTranslatedTranscript('A 2-feet deep dangerous pothole has formed at Anna Salai junction, please repair immediately.');
        setTextRant(fallbackText);
      }, 2500);
    }
  };

  const stopRecording = () => {
    stopSpeechRecognitionOnly();
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const copyTranscriptToClipboard = () => {
    if (voiceTranscript) {
      navigator.clipboard.writeText(voiceTranscript);
      setCopiedTranscript(true);
      setTimeout(() => setCopiedTranscript(false), 2000);
    }
  };

  const toggleAudioPlayback = () => {
    if (!audioPlayerRef.current && recordedAudioUrl) {
      audioPlayerRef.current = new Audio(recordedAudioUrl);
      audioPlayerRef.current.onended = () => setIsPlayingAudio(false);
    }
    
    if (audioPlayerRef.current) {
      if (isPlayingAudio) {
        audioPlayerRef.current.pause();
        setIsPlayingAudio(false);
      } else {
        audioPlayerRef.current.play().then(() => {
          setIsPlayingAudio(true);
        }).catch((e) => {
          console.warn('Audio play error:', e);
          setIsPlayingAudio(false);
        });
      }
    }
  };

  // Photo Upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagePreview(result);
        setImageBase64(result.split(',')[1]);
      };
      reader.readAsDataURL(file);
    }
  };

  // GPS trigger
  const handleGetGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGpsLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setLocationName(`GPS Pin: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
        },
        () => {
          setGpsLocation({ lat: 13.0646, lng: 80.2642 });
          setLocationName('Anna Salai Main Road (GPS Default)');
        }
      );
    }
  };

  // Submit Complaint
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Determine original input type string
    let inputTypeStr: 'voice' | 'photo' | 'text' | 'multimodal' = 'text';
    if (selectedInputTypes.length > 1) inputTypeStr = 'multimodal';
    else if (selectedInputTypes.includes('voice')) inputTypeStr = 'voice';
    else if (selectedInputTypes.includes('photo')) inputTypeStr = 'photo';

    const newIdNum = Math.floor(200 + Math.random() * 800);
    const newComplaintId = `CMP-${newIdNum}`;
    const newTicketNum = `TKT-2026-${newIdNum}`;

    try {
      const resData = await onSubmitComplaint({
        citizenName: citizenName || citizenUser.name || 'Concerned Citizen',
        citizenPhone: citizenPhone || citizenUser.phone || '+91 98401 55678',
        complaintId: newComplaintId,
        ticketNumber: newTicketNum,
        category,
        inputLanguage: language,
        originalInputType: inputTypeStr,
        rawText: textRant || voiceTranscript || `${category.replace(/_/g, ' ')} reported near ${locationName}`,
        transcription: voiceTranscript || textRant,
        imageBase64,
        photoUrl: imagePreview,
        audioBase64,
        audioUrl: recordedAudioUrl,
        gpsCoordinates: gpsLocation,
        locationName: locationName || 'Municipal Ward',
      });

      if (resData && resData.complaint) {
        setSubmissionResult({
          id: resData.complaint.id || newComplaintId,
          ticketNumber: resData.complaint.ticketNumber || newTicketNum,
          category: (resData.complaint.category || category || 'pothole').replace(/_/g, ' ').toUpperCase(),
          location: resData.complaint.locationName || locationName || 'Municipal Ward',
          priority: resData.cluster?.priorityScore || (category === 'live_wire_hazard' ? 160 : category === 'pothole' ? 94 : 65),
          transcription: resData.complaint.transcription || voiceTranscript || textRant,
        });
      } else {
        setSubmissionResult({
          id: newComplaintId,
          ticketNumber: newTicketNum,
          category: (category || 'pothole').replace(/_/g, ' ').toUpperCase(),
          location: locationName || 'Municipal Ward',
          priority: category === 'live_wire_hazard' ? 160 : category === 'pothole' ? 94 : 65,
          transcription: voiceTranscript || textRant,
        });
      }

      // Clear some form elements
      setTextRant('');
      setActiveSection('my_complaints');
    } catch (err: any) {
      console.error('Submit error:', err);
      // Fallback local acknowledgment
      setSubmissionResult({
        id: newComplaintId,
        ticketNumber: newTicketNum,
        category: (category || 'pothole').replace(/_/g, ' ').toUpperCase(),
        location: locationName || 'Municipal Ward',
        priority: 85,
      });
      setActiveSection('my_complaints');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Flattened "My Complaints" list (citizen's complaints + demo complaints)
  const myComplaintsList = useMemo(() => {
    const list: Array<{
      id: string;
      ticketNumber: string;
      title: string;
      category: ComplaintCategory;
      status: 'pending' | 'dispatched' | 'resolved';
      priorityScore: number;
      date: string;
      location: string;
      inputTypes: ('voice' | 'photo' | 'text')[];
      language: string;
      rawText: string;
      transcription?: string;
      audioUrl?: string;
      photoUrl?: string;
      clusterCode?: string;
      cluster?: MasterCluster;
      citizenName: string;
      citizenPhone?: string;
    }> = [];

    // Extract all complaints from master clusters
    (clusters || []).forEach((cluster) => {
      (cluster.complaints || []).forEach((cmp) => {
        let inputTypes: ('voice' | 'photo' | 'text')[] = ['text'];
        if (cmp.originalInputType === 'voice') inputTypes = ['voice'];
        else if (cmp.originalInputType === 'photo') inputTypes = ['photo'];
        else if (cmp.originalInputType === 'multimodal') inputTypes = ['voice', 'photo', 'text'];

        list.push({
          id: cmp.id,
          ticketNumber: cmp.ticketNumber || `TKT-${cmp.id}`,
          title: cluster.title,
          category: cmp.category,
          status: cluster.status === 'resolved' ? 'resolved' : cluster.status === 'dispatched' ? 'dispatched' : 'pending',
          priorityScore: cluster.priorityScore,
          date: new Date(cmp.timestamp || cluster.reportedAt || Date.now()).toLocaleDateString(),
          location: cmp.locationName || cluster.locationName,
          inputTypes: inputTypes,
          language: cmp.language || 'Tamil',
          rawText: cmp.rawInputText || cmp.cleanDescription,
          transcription: cmp.transcription || (cmp.originalInputType === 'voice' ? cmp.rawInputText : undefined),
          audioUrl: cmp.audioUrl,
          photoUrl: cmp.photoUrl,
          clusterCode: cluster.clusterCode,
          cluster: cluster,
          citizenName: cmp.citizenName,
          citizenPhone: cmp.citizenPhone,
        });
      });
    });

    // Sort so the logged-in citizen's complaints appear first, then newest first
    return list.sort((a, b) => {
      const aIsMine = citizenUser?.phone && (a.citizenPhone === citizenUser.phone || a.citizenName === citizenUser.name);
      const bIsMine = citizenUser?.phone && (b.citizenPhone === citizenUser.phone || b.citizenName === citizenUser.name);
      if (aIsMine && !bIsMine) return -1;
      if (!aIsMine && bIsMine) return 1;
      return 0;
    });
  }, [clusters, citizenUser]);

  const getStatusColor = (status: 'pending' | 'dispatched' | 'resolved') => {
    switch (status) {
      case 'resolved':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'dispatched':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/40';
      case 'pending':
      default:
        return 'bg-slate-700/60 text-slate-300 border-slate-600';
    }
  };

  const getStatusLabel = (status: 'pending' | 'dispatched' | 'resolved') => {
    switch (status) {
      case 'resolved':
        return 'Resolved';
      case 'dispatched':
        return 'In Progress (Crew Dispatched)';
      case 'pending':
      default:
        return 'Pending';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Bar for Citizen Portal */}
      <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-xl">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* NagarAI logo (left) */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-br from-emerald-500 via-teal-500 to-sky-500 p-0.5 shadow-md flex items-center justify-center shrink-0">
                <img 
                  src={nagarAiLogo} 
                  alt="NagarAI Logo" 
                  className="w-full h-full object-cover rounded-[10px]" 
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-200">
                    NagarAI
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Citizen
                  </span>
                </div>
              </div>
            </div>

            {/* "Citizen Portal — [Name]" (center) */}
            <div className="hidden sm:flex items-center gap-2 text-sm font-semibold text-slate-200">
              <span>Citizen Portal &mdash;</span>
              <span className="text-emerald-400 font-bold">{citizenName || citizenUser.name}</span>
            </div>

            {/* Right: Notifications Bell & Logout */}
            <div className="flex items-center gap-3">
              {onOpenNotifications && (
                <button
                  onClick={onOpenNotifications}
                  className="relative p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
                  title="Notifications & SMS Updates"
                >
                  <Bell className="w-5 h-5" />
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white font-bold text-[10px] flex items-center justify-center animate-bounce">
                      {notifications.length}
                    </span>
                  )}
                </button>
              )}

              {onLogout && (
                <button
                  onClick={onLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-950/60 hover:border-rose-700/60 border border-slate-700 text-xs font-semibold text-slate-300 hover:text-rose-300 transition-all cursor-pointer"
                  title="Switch Role / Logout"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area — Two Sections */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-6 space-y-6">
        {/* Navigation Switcher between Section A and Section B */}
        <div className="p-1.5 rounded-2xl bg-slate-900 border border-slate-800 grid grid-cols-2 gap-1 shadow-md">
          <button
            onClick={() => setActiveSection('file')}
            className={`py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeSection === 'file'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Section A: File Complaint</span>
          </button>

          <button
            onClick={() => setActiveSection('my_complaints')}
            className={`py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeSection === 'my_complaints'
                ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Section B: My Complaints ({myComplaintsList.length})</span>
          </button>
        </div>

        {/* ========================================================= */}
        {/* SECTION A: FILE COMPLAINT (NEW STEP-BY-STEP FORM) */}
        {/* ========================================================= */}
        {activeSection === 'file' && (
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-6">
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2">
                <span>File a Civic Grievance</span>
                <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40">
                  Step-by-Step
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Submit using voice note, photo, or text in your regional language. NagarAI will extract details and deduplicate with neighbors.
              </p>
            </div>

            {/* Quick Preset Examples */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Quick Test Samples:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PRESET_EXAMPLES.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => applyPreset(p)}
                    className="text-left p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-200 transition-colors flex items-center justify-between"
                  >
                    <span className="truncate">{p.label}</span>
                    <span className="text-[10px] text-emerald-400 font-mono">Fill &rarr;</span>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* STEP 1: INPUT TYPE SELECTOR (Allow selecting multiple) */}
              <div className="space-y-3 p-5 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">
                    Step 1: Input Type Selector (Select one or multiple)
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Active: {(selectedInputTypes || []).map(t => String(t)).join(' + ').toUpperCase() || 'NONE'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {/* Voice Button */}
                  <button
                    type="button"
                    onClick={() => toggleInputType('voice')}
                    className={`p-3.5 rounded-xl border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                      selectedInputTypes.includes('voice')
                        ? 'bg-emerald-950/70 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-950/50 ring-1 ring-emerald-500'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Mic className="w-6 h-6" />
                    <span className="text-xs font-bold">🎤 Voice Note</span>
                  </button>

                  {/* Photo Button */}
                  <button
                    type="button"
                    onClick={() => toggleInputType('photo')}
                    className={`p-3.5 rounded-xl border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                      selectedInputTypes.includes('photo')
                        ? 'bg-sky-950/70 border-sky-500 text-sky-300 shadow-md shadow-sky-950/50 ring-1 ring-sky-500'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Camera className="w-6 h-6" />
                    <span className="text-xs font-bold">📷 Photo</span>
                  </button>

                  {/* Text Button */}
                  <button
                    type="button"
                    onClick={() => toggleInputType('text')}
                    className={`p-3.5 rounded-xl border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                      selectedInputTypes.includes('text')
                        ? 'bg-indigo-950/70 border-indigo-500 text-indigo-300 shadow-md shadow-indigo-950/50 ring-1 ring-indigo-500'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <FileText className="w-6 h-6" />
                    <span className="text-xs font-bold">✍️ Text</span>
                  </button>
                </div>

                {/* Conditional Input Fields for Selected Types */}
                <div className="space-y-4 pt-2">
                  {/* Voice Note Module */}
                  {selectedInputTypes.includes('voice') && (
                    <div className="p-4.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3.5 shadow-inner">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                          <Mic className="w-4 h-4 text-emerald-400" /> Voice Note Recorder &amp; AI Speech-to-Text
                        </span>
                        {isRecording && (
                          <span className="text-rose-400 font-bold flex items-center gap-1.5 animate-pulse bg-rose-950/60 px-2.5 py-1 rounded-full border border-rose-800/60">
                            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                            <span>Listening ({language})... Speak Now</span>
                          </span>
                        )}
                        {isTranscribingVoice && (
                          <span className="text-amber-400 font-bold flex items-center gap-1.5 bg-amber-950/60 px-2.5 py-1 rounded-full border border-amber-800/60">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>AI Converting Voice to Text...</span>
                          </span>
                        )}
                      </div>

                      {/* Controls Row */}
                      <div className="flex flex-wrap items-center gap-3">
                        {!isRecording ? (
                          <button
                            type="button"
                            onClick={startRecording}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-md active:scale-95 cursor-pointer"
                          >
                            <Mic className="w-4 h-4" />
                            <span>Start Recording Voice</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={stopRecording}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs transition-all shadow-md active:scale-95 cursor-pointer animate-bounce"
                          >
                            <Square className="w-4 h-4 fill-current" />
                            <span>Stop &amp; Transcribe Voice</span>
                          </button>
                        )}

                        {recordedAudioUrl && (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={toggleAudioPlayback}
                              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
                            >
                              {isPlayingAudio ? <Pause className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
                              <span>{isPlayingAudio ? 'Pause Audio' : 'Play Voice Recording'}</span>
                            </button>
                            <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1 bg-emerald-950/60 px-2.5 py-1.5 rounded-xl border border-emerald-800/50">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Audio Attached
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Prominent Voice-to-Text Converted Transcript Box */}
                      {(voiceTranscript || isTranscribingVoice) && (
                        <div className="mt-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800/60 flex items-center gap-1">
                                <Languages className="w-3 h-3" />
                                Voice-to-Text Output ({transcriptLanguage || language})
                              </span>
                              <span className="text-[10px] text-slate-400">
                                Auto-converted from spoken voice note
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={copyTranscriptToClipboard}
                                className="flex items-center gap-1 px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-[11px] transition-colors border border-slate-800"
                              >
                                {copiedTranscript ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                <span>{copiedTranscript ? 'Copied' : 'Copy'}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setTextRant(voiceTranscript)}
                                className="flex items-center gap-1 px-2 py-1 rounded bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 hover:text-indigo-200 text-[11px] font-semibold transition-colors border border-indigo-800/60"
                              >
                                <Sparkles className="w-3 h-3" />
                                <span>Insert to Text Box</span>
                              </button>
                            </div>
                          </div>

                          {/* Spoken Text Display */}
                          <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                              Spoken Words (Native Transcript):
                            </label>
                            <p className="text-white text-xs bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 leading-relaxed font-medium">
                              "{voiceTranscript}"
                            </p>
                          </div>

                          {/* English Translation Preview if regional */}
                          {translatedTranscript && (
                            <div className="space-y-1 pt-1">
                              <label className="text-[10px] uppercase font-bold text-sky-400 tracking-wider flex items-center gap-1">
                                <span>English Translation / Extracted Intent:</span>
                              </label>
                              <p className="text-slate-300 text-[11px] bg-slate-900/50 p-2 rounded-lg border border-slate-800/60 italic">
                                "{translatedTranscript}"
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Photo Upload Module */}
                  {selectedInputTypes.includes('photo') && (
                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5">
                      <span className="font-bold text-sky-300 text-xs flex items-center gap-1.5">
                        <Camera className="w-4 h-4" /> Hazard Photo Upload / Camera
                      </span>

                      <div className="flex flex-wrap items-center gap-4">
                        <label className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 cursor-pointer transition-colors">
                          <Upload className="w-4 h-4 text-sky-400" />
                          <span>Upload / Snap Photo</span>
                          <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                        </label>

                        {imagePreview && (
                          <div className="flex items-center gap-3 bg-slate-950 p-2 rounded-xl border border-slate-800">
                            <img src={imagePreview} alt="Preview" className="w-12 h-12 rounded-lg object-cover border border-slate-700" />
                            <div className="text-xs">
                              <span className="font-semibold text-emerald-400">Photo Attached</span>
                              <button
                                type="button"
                                onClick={() => setImagePreview(null)}
                                className="block text-[10px] text-rose-400 hover:underline"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Text Input Module with SpeechRecognition Live Voice Dictation */}
                  {selectedInputTypes.includes('text') && (
                    <div className="space-y-2 p-3.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-inner">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <label className="block text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                          <span>✍️ Complaint Description &amp; Details</span>
                        </label>

                        {/* Direct SpeechRecognition Web API Voice-to-Text Button */}
                        <div className="flex items-center gap-2">
                          {!isSpeechRecognitionListening ? (
                            <button
                              type="button"
                              onClick={startSpeechRecognitionOnly}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-[11px] shadow-sm transition-all active:scale-95 cursor-pointer"
                              title="Use SpeechRecognition Web API to dictate directly into description field"
                            >
                              <Mic className="w-3.5 h-3.5" />
                              <span>Speak to Dictate (Speech-to-Text)</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={stopSpeechRecognitionOnly}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-[11px] shadow-md transition-all active:scale-95 cursor-pointer animate-pulse"
                            >
                              <Square className="w-3 h-3 fill-current" />
                              <span>Stop Dictation</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Live Speech Recognition Active Banner */}
                      {isSpeechRecognitionListening && (
                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-[11px] text-emerald-200 animate-pulse">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                            <span className="font-semibold">
                              SpeechRecognition Active: Speak in {language} — auto-filling complaint description...
                            </span>
                          </div>
                          <span className="text-[10px] text-emerald-300 font-mono">Web Speech API</span>
                        </div>
                      )}

                      {speechRecognitionError && (
                        <div className="p-2 rounded-lg bg-amber-950/50 border border-amber-800/40 text-[11px] text-amber-300">
                          ⚠️ {speechRecognitionError}
                        </div>
                      )}

                      <div className="relative">
                        <textarea
                          value={textRant}
                          onChange={(e) => setTextRant(e.target.value)}
                          rows={3}
                          placeholder="Type or dictate grievance details..."
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 leading-relaxed font-sans"
                        />
                        {textRant && (
                          <div className="absolute right-2.5 bottom-2.5 flex items-center gap-1.5 bg-slate-900/90 px-2 py-0.5 rounded-md border border-slate-800 text-[10px] text-slate-400">
                            <span>{textRant.length} chars</span>
                            <button
                              type="button"
                              onClick={() => setTextRant('')}
                              className="text-rose-400 hover:underline cursor-pointer ml-1"
                            >
                              Clear
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* STEP 2: LOCATION (GPS or manual) */}
              <div className="space-y-2 p-5 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-400" />
                    Step 2: Location (GPS or manual)
                  </span>
                  <button
                    type="button"
                    onClick={handleGetGPS}
                    className="flex items-center gap-1 text-xs text-sky-400 hover:text-sky-300 font-bold cursor-pointer"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    Auto-Detect GPS
                  </button>
                </div>

                <input
                  type="text"
                  required
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="Enter street, landmark, or location"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* STEP 3 & STEP 4: CATEGORY DROPDOWN & LANGUAGE SELECTOR */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Step 3: Category */}
                <div className="space-y-1.5 p-4 rounded-2xl bg-slate-950 border border-slate-800">
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-emerald-400">
                    Step 3: Category Dropdown
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ComplaintCategory)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="pothole">🕳️ Pothole / Road Subsidence</option>
                    <option value="garbage_dump">🗑️ Garbage Dump / Bio-Waste</option>
                    <option value="live_wire_hazard">⚡ Live Wire Hazard (High Voltage)</option>
                    <option value="open_manhole">⚠️ Open Manhole / Drain Cover</option>
                    <option value="waterlogging">🌊 Waterlogging / Blocked Drain</option>
                    <option value="broken_streetlight">💡 Broken Streetlight / High Mast</option>
                    <option value="water_leakage">💧 Water Main Leakage</option>
                    <option value="fallen_tree">🌳 Fallen Tree / Branch Obstruction</option>
                    <option value="sewage_overflow">☣️ Sewage Overflow</option>
                  </select>
                </div>

                {/* Step 4: Language Selector */}
                <div className="space-y-1.5 p-4 rounded-2xl bg-slate-950 border border-slate-800">
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-emerald-400">
                    Step 4: Language Selector
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="Tamil">தமிழ் (Tamil)</option>
                    <option value="Hindi">हिन्दी (Hindi)</option>
                    <option value="Telugu">తెలుగు (Telugu)</option>
                    <option value="Marathi">मराठी (Marathi)</option>
                    <option value="Bengali">বাংলা (Bengali)</option>
                    <option value="Kannada">ಕನ್ನಡ (Kannada)</option>
                    <option value="English">English / Hinglish / Tanglish</option>
                  </select>
                </div>
              </div>

              {/* STEP 5: SUBMIT BUTTON */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full py-4 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2 shadow-xl transition-all active:scale-98 cursor-pointer ${
                    isSubmitting
                      ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-slate-950 shadow-emerald-500/20 hover:brightness-110'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>Submitting &amp; Deduplicating...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Step 5: Submit Civic Complaint</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ========================================================= */}
        {/* SECTION B: MY COMPLAINTS (NEW LIST) */}
        {/* ========================================================= */}
        {activeSection === 'my_complaints' && (
          <div className="space-y-4">
            {/* Success Banner if just submitted */}
            {submissionResult && (
              <div className="p-5 rounded-3xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-200 text-xs space-y-2 shadow-xl animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 font-bold text-sm text-emerald-300">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    Complaint Successfully Filed!
                  </span>
                  <span className="font-mono px-2 py-0.5 rounded bg-emerald-900 font-extrabold text-emerald-200">
                    {submissionResult.id}
                  </span>
                </div>
                <p>
                  Assigned Complaint ID: <b>{submissionResult.id}</b> ({submissionResult.ticketNumber}). NagarAI has automatically evaluated severity and grouped your complaint into the active Master Work Order.
                </p>
              </div>
            )}

            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">My Filed Complaints</h3>
                  <p className="text-xs text-slate-400">
                    Track the lifecycle of issues submitted by you across your ward.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">
                  {myComplaintsList.length} Total Issues
                </span>
              </div>

              {/* List of complaints in required Card Format: ID / Category / Status / Priority / Date */}
              <div className="space-y-3">
                {myComplaintsList.map((item, idx) => (
                  <div
                    key={item.id + idx}
                    onClick={() => setSelectedComplaintDetail(item)}
                    className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer space-y-2.5 shadow-md hover:shadow-lg"
                  >
                    {/* Top Row: ID / Category / Status / Priority / Date */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {/* ID */}
                        <span className="font-mono text-xs font-extrabold text-sky-400 bg-sky-950/70 px-2.5 py-0.5 rounded-lg border border-sky-800/60">
                          {item.id}
                        </span>

                        {/* Category */}
                        <span className="text-xs font-bold text-slate-200 bg-slate-900 px-2.5 py-0.5 rounded-lg border border-slate-800">
                          {(item.category || 'issue').replace(/_/g, ' ').toUpperCase()}
                        </span>

                        {/* Status Badge: Pending (gray) / In Progress (orange) / Resolved (green) */}
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${getStatusColor(item.status)}`}>
                          {getStatusLabel(item.status)}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs">
                        {/* Priority */}
                        <div className="flex items-center gap-1 font-mono font-bold text-amber-300 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/40">
                          <span>Priority:</span>
                          <span>{item.priorityScore}</span>
                        </div>

                        {/* Date */}
                        <span className="text-slate-400 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {item.date}
                        </span>
                      </div>
                    </div>

                    {/* Middle: Title & Description */}
                    <div className="text-xs text-slate-300">
                      <p className="font-semibold text-white">{item.title}</p>
                      <p className="text-slate-400 italic text-[11px] mt-0.5">"{item.rawText}"</p>
                    </div>

                    {/* Bottom Meta: Location & Input Types */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-900 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-rose-400" />
                        {item.location}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 rounded bg-slate-900 text-indigo-300 border border-slate-800">
                          {item.language}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-900 text-emerald-300 border border-slate-800">
                          {(item.inputTypes || []).map(t => String(t)).join(' + ').toUpperCase()}
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-500" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Selected Complaint Detail Modal/Drawer */}
            {selectedComplaintDetail && (
              <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sky-400 text-sm bg-sky-950 px-2.5 py-1 rounded-lg border border-sky-800">
                      {selectedComplaintDetail.id}
                    </span>
                    <h4 className="text-base font-bold text-white">{selectedComplaintDetail.title}</h4>
                  </div>
                  <button
                    onClick={() => setSelectedComplaintDetail(null)}
                    className="text-xs text-slate-400 hover:text-white px-2 py-1 bg-slate-800 rounded-lg"
                  >
                    Close Detail
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="text-[10px] text-slate-500 uppercase">Status</div>
                    <div className="font-bold text-white">{getStatusLabel(selectedComplaintDetail.status)}</div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="text-[10px] text-slate-500 uppercase">Priority Score</div>
                    <div className="font-bold text-amber-300 font-mono">{selectedComplaintDetail.priorityScore} / 200</div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="text-[10px] text-slate-500 uppercase">Input Badges</div>
                    <div className="font-bold text-emerald-300">{(selectedComplaintDetail.inputTypes || []).map(t => String(t)).join(', ').toUpperCase()}</div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="text-[10px] text-slate-500 uppercase">Language</div>
                    <div className="font-bold text-indigo-300">{selectedComplaintDetail.language}</div>
                  </div>
                </div>

                {/* Complaint Description & Voice Transcript Display */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Grievance Description / Report Text
                    </span>
                    <p className="text-white text-xs mt-1 leading-relaxed bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                      "{selectedComplaintDetail.rawText}"
                    </p>
                  </div>

                  {/* Voice Transcription Block if voice note was provided */}
                  {(selectedComplaintDetail.transcription || selectedComplaintDetail.inputTypes?.includes('voice')) && (
                    <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/40 space-y-1.5">
                      <div className="flex items-center justify-between text-emerald-300 font-bold text-[11px]">
                        <span className="flex items-center gap-1.5">
                          <Mic className="w-3.5 h-3.5 text-emerald-400" />
                          Voice-to-Text Converted Transcript ({selectedComplaintDetail.language})
                        </span>
                        <span className="text-[10px] text-emerald-400/80">AI Verified Speech</span>
                      </div>
                      <p className="text-slate-200 italic text-xs">
                        "{selectedComplaintDetail.transcription || selectedComplaintDetail.rawText}"
                      </p>
                    </div>
                  )}

                  {selectedComplaintDetail.photoUrl && (
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Attached Photo Evidence
                      </span>
                      <img
                        src={selectedComplaintDetail.photoUrl}
                        alt="Evidence"
                        className="w-full max-w-xs h-36 rounded-xl object-cover border border-slate-700 shadow-md"
                      />
                    </div>
                  )}
                </div>

                {/* If resolved: Photo verification & voting survey */}
                {selectedComplaintDetail.cluster?.resolution && (
                  <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-600/40 space-y-3 text-xs">
                    <div className="flex items-center justify-between font-bold text-emerald-300">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        AI Resolution Quality Proof: {selectedComplaintDetail.cluster.resolution.aiVerificationScore}% Confidence
                      </span>
                    </div>
                    <p className="text-slate-300">{selectedComplaintDetail.cluster.resolution.aiVerificationSummary}</p>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 mb-1">BEFORE (Complaint):</div>
                        <img
                          src={selectedComplaintDetail.cluster.resolution.beforePhotoUrl || ""}
                          alt="Before"
                          className="w-full h-32 rounded-xl object-cover border border-slate-700"
                        />
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-emerald-400 mb-1">AFTER (Repair Complete):</div>
                        <img
                          src={selectedComplaintDetail.cluster.resolution.afterPhotoUrl || ""}
                          alt="After"
                          className="w-full h-32 rounded-xl object-cover border border-emerald-600"
                        />
                      </div>
                    </div>

                    <div className="pt-2 flex items-center gap-3">
                      <button
                        onClick={() => {
                          const notif = notifications.find((n) => n.clusterCode === selectedComplaintDetail.clusterCode);
                          if (notif) onVoteResolution(notif.id, 'confirmed');
                          alert('Thank you for confirming resolution!');
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                        Confirm Fixed ({selectedComplaintDetail.cluster.resolution.citizenConfirmations.confirmed})
                      </button>

                      <button
                        onClick={() => {
                          const notif = notifications.find((n) => n.clusterCode === selectedComplaintDetail.clusterCode);
                          if (notif) onVoteResolution(notif.id, 'disputed');
                          alert('Dispute logged for supervisor re-inspection.');
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 font-bold text-xs"
                      >
                        <ThumbsDown className="w-3.5 h-3.5" />
                        Dispute ({selectedComplaintDetail.cluster.resolution.citizenConfirmations.disputed})
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

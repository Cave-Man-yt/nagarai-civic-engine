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
  VolumeX,
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
  RefreshCw,
  Sliders
} from 'lucide-react';
import { MasterCluster, StructuredComplaint, CitizenNotification, ComplaintCategory } from '../types';
import { SAMPLE_CIVIC_PHOTOS } from '../data/mockData';
import { speakWording, stopSpeaking, getLanguageSpeechCode } from '../utils/speechUtils';

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
  citizenUser = { name: 'Anand Kumar', phone: '+91 98401 55678' },
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
  const [citizenName, setCitizenName] = useState(citizenUser.name);
  const [citizenPhone, setCitizenPhone] = useState(citizenUser.phone);
  const [category, setCategory] = useState<ComplaintCategory>('pothole');
  const [language, setLanguage] = useState('Tamil');
  const [textRant, setTextRant] = useState('');
  const [locationName, setLocationName] = useState('Opposite LIC Building, Anna Salai');
  const [gpsLocation, setGpsLocation] = useState<{ lat: number; lng: number } | null>({ lat: 13.0646, lng: 80.2642 });
  
  // Media & Voice-to-Text State
  const [imagePreview, setImagePreview] = useState<string | null>(SAMPLE_CIVIC_PHOTOS.pothole_crater);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>('https://actions.google.com/sounds/v1/ambiences/outdoor_market.ogg');
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  
  // Real-time Voice to Text & SpeechRecognition State
  const [isTranscribingVoice, setIsTranscribingVoice] = useState(false);
  const [isSpeechRecognitionListening, setIsSpeechRecognitionListening] = useState(false);
  const [speechRecognitionError, setSpeechRecognitionError] = useState<string | null>(null);
  const [voiceTranscript, setVoiceTranscript] = useState<string>('அண்ணா சாலையில் எல்ஐசி பில்டிங் எதிரில் 2 அடி ஆழத்தில் பெரிய பள்ளம் ஏற்பட்டுள்ளது. உடனடியாக சரிசெய்யவும்.');
  const [translatedTranscript, setTranslatedTranscript] = useState<string>('A 2-feet deep dangerous pothole has formed opposite LIC Building on Anna Salai. Please repair immediately.');
  const [transcriptLanguage, setTranscriptLanguage] = useState<string>('Tamil');
  const [copiedTranscript, setCopiedTranscript] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [narrationTarget, setNarrationTarget] = useState<'native' | 'english'>('native');
  const [speechSpeed, setSpeechSpeed] = useState<number>(0.95);
  const [playingComplaintId, setPlayingComplaintId] = useState<string | null>(null);
  
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

  // Stop any active speech on unmount or tab switch
  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, []);

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

  // Quick Preset Samples
  const PRESET_EXAMPLES = [
    {
      label: 'Tamil: அண்ணா சாலை பெரிய பள்ளம் (Pothole)',
      cat: 'pothole' as ComplaintCategory,
      lang: 'Tamil',
      text: 'அண்ணா சாலையில் எல்ஐசி பில்டிங் எதிரில் 2 அடி ஆழத்தில் பெரிய பள்ளம் ஏற்பட்டுள்ளது. நேத்து ராத்திரி ஒரு பைக் வழுக்கி விழுந்தது.',
      transcript: 'அண்ணா சாலையில் எல்ஐசி பில்டிங் எதிரில் 2 அடி ஆழத்தில் பெரிய பள்ளம் ஏற்பட்டுள்ளது. நேத்து ராத்திரி ஒரு பைக் வழுக்கி விழுந்தது.',
      translation: 'Deep pothole (2 ft) formed opposite LIC Building on Anna Salai. A bike skidded last night.',
      loc: 'Opposite LIC Building, Anna Salai',
      photo: SAMPLE_CIVIC_PHOTOS.pothole_crater,
    },
    {
      label: 'Hindi: केंद्रीय विद्यालय बिजली का तार (Live Wire)',
      cat: 'live_wire_hazard' as ComplaintCategory,
      lang: 'Hindi',
      text: 'केंद्रीय विद्यालय स्कूल के गेट नंबर 2 के पास बिजली का तार नीचे झूल रहा है और चिंगारी निकल रही है। बच्चे आते-जाते हैं बहुत बड़ा खतरा है!',
      transcript: 'केंद्रीय विद्यालय स्कूल के गेट नंबर 2 के पास बिजली का तार नीचे झूल रहा है और चिंगारी निकल रही है। बच्चे आते-जाते हैं बहुत बड़ा खतरा है!',
      translation: 'Live electric cable hanging near Kendriya Vidyalaya Gate 2 with active sparks posing critical hazard for school children.',
      loc: 'Kendriya Vidyalaya School Gate 2, EVR Salai',
      photo: SAMPLE_CIVIC_PHOTOS.live_wire,
    },
    {
      label: 'Telugu: రింగ్ రోడ్డు చెత్త డంప్ (Garbage)',
      cat: 'garbage_dump' as ComplaintCategory,
      lang: 'Telugu',
      text: 'రింగ్ రోడ్డు మెయిన్ జంక్షన్ వద్ద 5 రోజుల నుంచి చెత్త తొలగించలేదు. రోడ్డుపైకి వ్యర్థాలు చేరి తీవ్ర దుర్గంధం వస్తోంది.',
      transcript: 'రింగ్ రోడ్డు మెయిన్ జంక్షన్ వద్ద 5 రోజుల నుంచి చెత్త తొలగించలేదు. రోడ్డుపైకి వ్యర్థాలు చేరి తీవ్ర దుర్గంధం వస్తోంది.',
      translation: 'Garbage dump not cleared for 5 days near Ring Road main junction, causing bad odor and road blockage.',
      loc: 'Ward 8 Ring Road Commercial Junction',
      photo: SAMPLE_CIVIC_PHOTOS.garbage_dump,
    },
    {
      label: 'Tanglish: Streetlight not working in junction',
      cat: 'broken_streetlight' as ComplaintCategory,
      lang: 'Tanglish',
      text: 'Near Mylapore tank junction last 4 days high mast light off fully dark accident risk bro.',
      transcript: 'Near Mylapore tank junction last 4 days high mast light off fully dark accident risk bro.',
      translation: 'Mylapore tank junction high mast street light not working for 4 days creating complete blackout and accident risk.',
      loc: 'Mylapore Tank Junction',
      photo: SAMPLE_CIVIC_PHOTOS.pothole_sideways,
    }
  ];

  const applyPreset = (preset: typeof PRESET_EXAMPLES[0]) => {
    stopSpeaking();
    setIsPlayingAudio(false);
    setCategory(preset.cat);
    setLanguage(preset.lang);
    setTextRant(preset.text);
    setVoiceTranscript(preset.transcript);
    setTranslatedTranscript(preset.translation);
    setTranscriptLanguage(preset.lang);
    setLocationName(preset.loc);
    setImagePreview(preset.photo);
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

  const toggleAudioPlayback = (textOverride?: string, langOverride?: string) => {
    if (isPlayingAudio) {
      stopSpeaking();
      if (audioPlayerRef.current) {
        try {
          audioPlayerRef.current.pause();
        } catch (e) {
          // ignore
        }
      }
      setIsPlayingAudio(false);
      return;
    }

    // Determine wording to speak
    const chosenWording = textOverride || (
      narrationTarget === 'english' && translatedTranscript
        ? translatedTranscript
        : (voiceTranscript || textRant || `${category.replace(/_/g, ' ')} reported near ${locationName}`)
    );

    const chosenLang = langOverride || (
      narrationTarget === 'english'
        ? 'English'
        : (transcriptLanguage || language)
    );

    if (!chosenWording || chosenWording.trim().length === 0) {
      return;
    }

    setIsPlayingAudio(true);
    const spoken = speakWording({
      text: chosenWording,
      language: chosenLang,
      rate: speechSpeed,
      onStart: () => setIsPlayingAudio(true),
      onEnd: () => setIsPlayingAudio(false),
      onError: (err) => {
        console.warn('Speech synthesis playback notice:', err);
        setIsPlayingAudio(false);
      },
    });

    if (!spoken) {
      setIsPlayingAudio(false);
    }
  };

  const playComplaintWording = (id: string, text: string, lang: string) => {
    if (playingComplaintId === id && isPlayingAudio) {
      stopSpeaking();
      setIsPlayingAudio(false);
      setPlayingComplaintId(null);
      return;
    }

    stopSpeaking();
    setPlayingComplaintId(id);
    setIsPlayingAudio(true);

    const spoken = speakWording({
      text,
      language: lang || 'Tamil',
      rate: speechSpeed,
      onStart: () => {
        setIsPlayingAudio(true);
        setPlayingComplaintId(id);
      },
      onEnd: () => {
        setIsPlayingAudio(false);
        setPlayingComplaintId(null);
      },
      onError: () => {
        setIsPlayingAudio(false);
        setPlayingComplaintId(null);
      },
    });

    if (!spoken) {
      setIsPlayingAudio(false);
      setPlayingComplaintId(null);
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
      await onSubmitComplaint({
        citizenName,
        citizenPhone,
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
        locationName,
      });

      setSubmissionResult({
        id: newComplaintId,
        ticketNumber: newTicketNum,
        category: (category || 'pothole').replace(/_/g, ' ').toUpperCase(),
        location: locationName,
        priority: category === 'live_wire_hazard' ? 160 : category === 'pothole' ? 94 : 65,
        transcription: voiceTranscript || textRant,
      });

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
        location: locationName,
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
    }> = [];

    // Extract all complaints from master clusters
    clusters.forEach((cluster) => {
      cluster.complaints.forEach((cmp) => {
        let inputTypes: ('voice' | 'photo' | 'text')[] = ['text'];
        if (cmp.originalInputType === 'voice') inputTypes = ['voice'];
        else if (cmp.originalInputType === 'photo') inputTypes = ['photo'];
        else if (cmp.originalInputType === 'multimodal') inputTypes = ['voice', 'photo', 'text'];

        list.push({
          id: cmp.id.startsWith('CMP-') ? cmp.id : `CMP-${cmp.id.replace(/\D/g, '') || '104'}`,
          ticketNumber: cmp.ticketNumber || `TKT-${cmp.id}`,
          title: cluster.title,
          category: cmp.category,
          status: cluster.status === 'resolved' ? 'resolved' : cluster.status === 'dispatched' ? 'dispatched' : 'pending',
          priorityScore: cluster.priorityScore,
          date: new Date(cmp.timestamp).toLocaleDateString(),
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
        });
      });
    });

    return list;
  }, [clusters]);

  const getStatusColor = (status: 'pending' | 'dispatched' | 'resolved') => {
    switch (status) {
      case 'resolved':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold';
      case 'dispatched':
        return 'bg-amber-50 text-amber-800 border-amber-200 font-semibold';
      case 'pending':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200 font-semibold';
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
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Bar for Citizen Portal */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 text-slate-900 shadow-2xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* NagarAI logo (left) */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-br from-emerald-500 via-teal-500 to-sky-500 p-0.5 shadow-xs flex items-center justify-center shrink-0">
                <img 
                  src={nagarAiLogo} 
                  alt="NagarAI Logo" 
                  className="w-full h-full object-cover rounded-[10px]" 
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold tracking-tight text-slate-900">
                    NagarAI
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Citizen
                  </span>
                </div>
              </div>
            </div>

            {/* "Citizen Portal — [Name]" (center) */}
            <div className="hidden sm:flex items-center gap-2 text-sm font-semibold text-slate-700">
              <span>Citizen Portal &mdash;</span>
              <span className="text-emerald-700 font-bold">{citizenName || citizenUser.name}</span>
            </div>

            {/* Right: Notifications Bell & Logout */}
            <div className="flex items-center gap-3">
              {onOpenNotifications && (
                <button
                  onClick={onOpenNotifications}
                  className="relative p-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 hover:text-slate-900 transition-all cursor-pointer"
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
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 hover:border-rose-200 border border-slate-200 text-xs font-semibold text-slate-700 hover:text-rose-700 transition-all cursor-pointer"
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
        <div className="p-1.5 rounded-2xl bg-white border border-slate-200 grid grid-cols-2 gap-1 shadow-2xs">
          <button
            onClick={() => setActiveSection('file')}
            className={`py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeSection === 'file'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Section A: File Complaint</span>
          </button>

          <button
            onClick={() => setActiveSection('my_complaints')}
            className={`py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeSection === 'my_complaints'
                ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
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
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 flex items-center gap-2">
                <span>File a Civic Grievance</span>
                <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                  Step-by-Step
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-600">
                Submit using voice note, photo, or text in your regional language. NagarAI will extract details and deduplicate with neighbors.
              </p>
            </div>

            {/* Quick Preset Examples */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Quick Test Samples:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PRESET_EXAMPLES.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => applyPreset(p)}
                    className="text-left p-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs text-slate-800 transition-colors flex items-center justify-between shadow-2xs cursor-pointer"
                  >
                    <span className="truncate">{p.label}</span>
                    <span className="text-[10px] text-emerald-700 font-mono font-bold">Fill &rarr;</span>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* STEP 1: INPUT TYPE SELECTOR (Allow selecting multiple) */}
              <div className="space-y-3 p-5 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-800">
                    Step 1: Input Type Selector (Select one or multiple)
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
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
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-xs ring-1 ring-emerald-500 font-bold'
                        : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <Mic className="w-6 h-6 text-emerald-600" />
                    <span className="text-xs font-bold">🎤 Voice Note</span>
                  </button>

                  {/* Photo Button */}
                  <button
                    type="button"
                    onClick={() => toggleInputType('photo')}
                    className={`p-3.5 rounded-xl border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                      selectedInputTypes.includes('photo')
                        ? 'bg-sky-50 border-sky-500 text-sky-900 shadow-xs ring-1 ring-sky-500 font-bold'
                        : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <Camera className="w-6 h-6 text-sky-600" />
                    <span className="text-xs font-bold">📷 Photo</span>
                  </button>

                  {/* Text Button */}
                  <button
                    type="button"
                    onClick={() => toggleInputType('text')}
                    className={`p-3.5 rounded-xl border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                      selectedInputTypes.includes('text')
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-900 shadow-xs ring-1 ring-indigo-500 font-bold'
                        : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <FileText className="w-6 h-6 text-indigo-600" />
                    <span className="text-xs font-bold">✍️ Text</span>
                  </button>
                </div>

                {/* Conditional Input Fields for Selected Types */}
                <div className="space-y-4 pt-2">
                  {/* Voice Note Module */}
                  {selectedInputTypes.includes('voice') && (
                    <div className="p-4.5 rounded-2xl bg-white border border-slate-200 space-y-3.5 shadow-2xs">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-emerald-800 flex items-center gap-1.5">
                          <Mic className="w-4 h-4 text-emerald-600" /> Voice Note Recorder &amp; AI Speech-to-Text
                        </span>
                        {isRecording && (
                          <span className="text-rose-700 font-bold flex items-center gap-1.5 animate-pulse bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                            <span>Listening ({language})... Speak Now</span>
                          </span>
                        )}
                        {isTranscribingVoice && (
                          <span className="text-amber-800 font-bold flex items-center gap-1.5 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
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
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-sm active:scale-95 cursor-pointer"
                          >
                            <Mic className="w-4 h-4" />
                            <span>Start Recording Voice</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={stopRecording}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-all shadow-sm active:scale-95 cursor-pointer animate-bounce"
                          >
                            <Square className="w-4 h-4 fill-current" />
                            <span>Stop &amp; Transcribe Voice</span>
                          </button>
                        )}

                        {/* Voice Note & Wordings Playback Controls */}
                        {(recordedAudioUrl || voiceTranscript || textRant) && (
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => toggleAudioPlayback()}
                              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-sm active:scale-95 cursor-pointer ${
                                isPlayingAudio
                                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 ring-2 ring-amber-400/50'
                                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white'
                              }`}
                              title="Play back spoken voice recording / Read out complaint wordings aloud"
                            >
                              {isPlayingAudio ? (
                                <>
                                  <span className="flex items-end gap-0.5 h-3.5 px-0.5">
                                    <span className="w-1 bg-slate-950 rounded-full animate-bounce [animation-delay:-0.3s] h-full" />
                                    <span className="w-1 bg-slate-950 rounded-full animate-bounce [animation-delay:-0.15s] h-2" />
                                    <span className="w-1 bg-slate-950 rounded-full animate-bounce h-3.5" />
                                  </span>
                                  <span>Pause / Stop Voice</span>
                                </>
                              ) : (
                                <>
                                  <Volume2 className="w-4 h-4 text-white" />
                                  <span>Play Voice Recording (Tell Wordings)</span>
                                </>
                              )}
                            </button>

                            {/* Narration Target Switch (Native vs English) */}
                            <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200 text-[11px]">
                              <button
                                type="button"
                                onClick={() => {
                                  if (isPlayingAudio) stopSpeaking();
                                  setNarrationTarget('native');
                                  if (isPlayingAudio) {
                                    setTimeout(() => toggleAudioPlayback(voiceTranscript || textRant, transcriptLanguage || language), 100);
                                  }
                                }}
                                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                                  narrationTarget === 'native'
                                    ? 'bg-white text-emerald-800 border border-slate-200 shadow-2xs font-bold'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                🗣️ Native ({transcriptLanguage || language})
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (isPlayingAudio) stopSpeaking();
                                  setNarrationTarget('english');
                                  if (isPlayingAudio) {
                                    setTimeout(() => toggleAudioPlayback(translatedTranscript || textRant, 'English'), 100);
                                  }
                                }}
                                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                                  narrationTarget === 'english'
                                    ? 'bg-white text-sky-800 border border-slate-200 shadow-2xs font-bold'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                🌐 English Wording
                              </button>
                            </div>

                            {/* Speed Selector */}
                            <div className="flex items-center bg-slate-100 rounded-xl px-2 py-1 border border-slate-200 text-[11px] gap-1">
                              <span className="text-slate-500 font-bold">Speed:</span>
                              {[
                                { label: '0.8x', val: 0.8 },
                                { label: '1.0x', val: 0.95 },
                                { label: '1.2x', val: 1.2 },
                              ].map((s) => (
                                <button
                                  key={s.label}
                                  type="button"
                                  onClick={() => setSpeechSpeed(s.val)}
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold cursor-pointer ${
                                    speechSpeed === s.val
                                      ? 'bg-emerald-600 text-white'
                                      : 'text-slate-600 hover:text-slate-900'
                                  }`}
                                >
                                  {s.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Prominent Voice-to-Text Converted Transcript Box */}
                      {(voiceTranscript || isTranscribingVoice) && (
                        <div className={`mt-3 p-3.5 rounded-xl border space-y-2 text-xs transition-all ${
                          isPlayingAudio 
                            ? 'bg-emerald-50 border-emerald-300 ring-1 ring-emerald-400 shadow-xs' 
                            : 'bg-slate-50 border-slate-200'
                        }`}>
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                                <Languages className="w-3 h-3 text-emerald-700" />
                                Voice-to-Text Output ({transcriptLanguage || language})
                              </span>
                              {isPlayingAudio ? (
                                <span className="text-[10px] text-emerald-800 font-bold flex items-center gap-1.5 animate-pulse">
                                  <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
                                  Reading Aloud: {narrationTarget === 'native' ? (transcriptLanguage || language) : 'English'} Wording
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-500">
                                  Auto-converted from spoken voice note
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => toggleAudioPlayback(voiceTranscript, transcriptLanguage || language)}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[11px] font-bold transition-colors border border-emerald-200 cursor-pointer"
                                title="Listen to spoken native wording"
                              >
                                <Volume2 className="w-3 h-3 text-emerald-700" />
                                <span>Speak Native</span>
                              </button>
                              <button
                                type="button"
                                onClick={copyTranscriptToClipboard}
                                className="flex items-center gap-1 px-2 py-1 rounded bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 text-[11px] transition-colors border border-slate-200 cursor-pointer"
                              >
                                {copiedTranscript ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                <span>{copiedTranscript ? 'Copied' : 'Copy'}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setTextRant(voiceTranscript)}
                                className="flex items-center gap-1 px-2 py-1 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-800 hover:text-indigo-900 text-[11px] font-semibold transition-colors border border-indigo-200 cursor-pointer"
                              >
                                <Sparkles className="w-3 h-3 text-indigo-600" />
                                <span>Insert to Text Box</span>
                              </button>
                            </div>
                          </div>

                          {/* Spoken Text Display */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <label className="text-[10px] uppercase font-bold text-slate-600 tracking-wider">
                                Spoken Words (Native Transcript):
                              </label>
                              {isPlayingAudio && narrationTarget === 'native' && (
                                <span className="text-[10px] font-mono text-emerald-700 flex items-center gap-1 animate-pulse font-bold">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                                  Speaking now
                                </span>
                              )}
                            </div>
                            <p className={`text-xs p-2.5 rounded-lg border leading-relaxed font-medium transition-all ${
                              isPlayingAudio && narrationTarget === 'native'
                                ? 'bg-white border-emerald-300 text-slate-900 shadow-2xs'
                                : 'bg-white border-slate-200 text-slate-900'
                            }`}>
                              "{voiceTranscript}"
                            </p>
                          </div>

                          {/* English Translation Preview if regional */}
                          {translatedTranscript && (
                            <div className="space-y-1 pt-1">
                              <div className="flex items-center justify-between">
                                <label className="text-[10px] uppercase font-bold text-sky-800 tracking-wider flex items-center gap-1">
                                  <span>English Translation / Extracted Intent:</span>
                                </label>
                                {isPlayingAudio && narrationTarget === 'english' && (
                                  <span className="text-[10px] font-mono text-sky-700 flex items-center gap-1 animate-pulse font-bold">
                                    <span className="w-1.5 h-1.5 rounded-full bg-sky-600" />
                                    Speaking now
                                  </span>
                                )}
                              </div>
                              <p className={`text-[11px] p-2 rounded-lg border italic transition-all ${
                                isPlayingAudio && narrationTarget === 'english'
                                  ? 'bg-white border-sky-300 text-slate-900 shadow-2xs'
                                  : 'bg-white border-slate-200 text-slate-700'
                              }`}>
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
                    <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2.5 shadow-2xs">
                      <span className="font-bold text-sky-800 text-xs flex items-center gap-1.5">
                        <Camera className="w-4 h-4 text-sky-600" /> Hazard Photo Upload / Camera
                      </span>

                      <div className="flex flex-wrap items-center gap-4">
                        <label className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs border border-slate-200 cursor-pointer transition-colors">
                          <Upload className="w-4 h-4 text-sky-600" />
                          <span>Upload / Snap Photo</span>
                          <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                        </label>

                        {imagePreview && (
                          <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-200">
                            <img src={imagePreview} alt="Preview" className="w-12 h-12 rounded-lg object-cover border border-slate-200" />
                            <div className="text-xs">
                              <span className="font-semibold text-emerald-700">Photo Attached</span>
                              <button
                                type="button"
                                onClick={() => setImagePreview(null)}
                                className="block text-[10px] text-rose-600 hover:underline cursor-pointer"
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
                    <div className="space-y-2 p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <label className="block text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                          <span>✍️ Complaint Description &amp; Details</span>
                        </label>

                        {/* Direct SpeechRecognition Web API Voice-to-Text Button */}
                        <div className="flex items-center gap-2">
                          {!isSpeechRecognitionListening ? (
                            <button
                              type="button"
                              onClick={startSpeechRecognitionOnly}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow-xs transition-all active:scale-95 cursor-pointer"
                              title="Use SpeechRecognition Web API to dictate directly into description field"
                            >
                              <Mic className="w-3.5 h-3.5" />
                              <span>Speak to Dictate (Speech-to-Text)</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={stopSpeechRecognitionOnly}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] shadow-xs transition-all active:scale-95 cursor-pointer animate-pulse"
                            >
                              <Square className="w-3 h-3 fill-current" />
                              <span>Stop Dictation</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Live Speech Recognition Active Banner */}
                      {isSpeechRecognitionListening && (
                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-[11px] text-emerald-900 animate-pulse">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-ping" />
                            <span className="font-semibold">
                              SpeechRecognition Active: Speak in {language} — auto-filling complaint description...
                            </span>
                          </div>
                          <span className="text-[10px] text-emerald-800 font-mono font-bold">Web Speech API</span>
                        </div>
                      )}

                      {speechRecognitionError && (
                        <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-800">
                          ⚠️ {speechRecognitionError}
                        </div>
                      )}

                      <div className="relative">
                        <textarea
                          value={textRant}
                          onChange={(e) => setTextRant(e.target.value)}
                          rows={3}
                          placeholder="Speak into microphone or type details here (e.g. 2-feet deep dangerous road crater opposite bus stop)..."
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 leading-relaxed font-sans"
                        />
                        {textRant && (
                          <div className="absolute right-2.5 bottom-2.5 flex items-center gap-1.5 bg-white/95 px-2 py-0.5 rounded-md border border-slate-200 text-[10px] text-slate-500 shadow-2xs">
                            <span>{textRant.length} chars</span>
                            <button
                              type="button"
                              onClick={() => setTextRant('')}
                              className="text-rose-600 hover:underline cursor-pointer ml-1"
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
              <div className="space-y-2 p-5 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-500" />
                    Step 2: Location (GPS or manual)
                  </span>
                  <button
                    type="button"
                    onClick={handleGetGPS}
                    className="flex items-center gap-1 text-xs text-sky-700 hover:text-sky-900 font-bold cursor-pointer"
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
                  placeholder="e.g. Opposite Kendriya Vidyalaya School Gate 2, EVR Salai"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              {/* STEP 3 & STEP 4: CATEGORY DROPDOWN & LANGUAGE SELECTOR */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Step 3: Category */}
                <div className="space-y-1.5 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-emerald-800">
                    Step 3: Category Dropdown
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ComplaintCategory)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
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
                <div className="space-y-1.5 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-emerald-800">
                    Step 4: Language Selector
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
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
                  className={`w-full py-4 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-98 cursor-pointer ${
                    isSubmitting
                      ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white hover:brightness-105'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
              <div className="p-5 rounded-3xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs space-y-2 shadow-sm animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 font-bold text-sm text-emerald-800">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    Complaint Successfully Filed!
                  </span>
                  <span className="font-mono px-2 py-0.5 rounded bg-emerald-100 font-extrabold text-emerald-800">
                    {submissionResult.id}
                  </span>
                </div>
                <p className="text-emerald-800">
                  Assigned Complaint ID: <b>{submissionResult.id}</b> ({submissionResult.ticketNumber}). NagarAI has automatically evaluated severity and grouped your complaint into the active Master Work Order.
                </p>
              </div>
            )}

            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">My Filed Complaints</h3>
                  <p className="text-xs text-slate-600">
                    Track the lifecycle of issues submitted by you across your ward.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                  {myComplaintsList.length} Total Issues
                </span>
              </div>

              {/* List of complaints in required Card Format: ID / Category / Status / Priority / Date */}
              <div className="space-y-3">
                {myComplaintsList.map((item, idx) => (
                  <div
                    key={item.id + idx}
                    onClick={() => setSelectedComplaintDetail(item)}
                    className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all cursor-pointer space-y-2.5 shadow-2xs"
                  >
                    {/* Top Row: ID / Category / Status / Priority / Date */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {/* ID */}
                        <span className="font-mono text-xs font-extrabold text-sky-800 bg-sky-50 px-2.5 py-0.5 rounded-lg border border-sky-200">
                          {item.id}
                        </span>

                        {/* Category */}
                        <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200">
                          {(item.category || 'issue').replace(/_/g, ' ').toUpperCase()}
                        </span>

                        {/* Status Badge: Pending (gray) / In Progress (orange) / Resolved (green) */}
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${getStatusColor(item.status)}`}>
                          {getStatusLabel(item.status)}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs">
                        {/* Priority */}
                        <div className="flex items-center gap-1 font-mono font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          <span>Priority:</span>
                          <span>{item.priorityScore}</span>
                        </div>

                        {/* Date */}
                        <span className="text-slate-500 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {item.date}
                        </span>
                      </div>
                    </div>

                    {/* Middle: Title & Description */}
                    <div className="text-xs text-slate-700">
                      <p className="font-semibold text-slate-900">{item.title}</p>
                      <p className="text-slate-600 italic text-[11px] mt-0.5">"{item.rawText}"</p>
                    </div>

                    {/* Bottom Meta: Location & Input Types & Audio Listen */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-rose-500" />
                        {item.location}
                      </span>

                      <div className="flex items-center gap-2">
                        {/* Instant Listen to Wordings Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            playComplaintWording(item.id, item.transcription || item.rawText, item.language);
                          }}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                            playingComplaintId === item.id && isPlayingAudio
                              ? 'bg-amber-500 text-slate-950 ring-1 ring-amber-300'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}
                          title="Listen to the exact spoken wordings of this complaint"
                        >
                          {playingComplaintId === item.id && isPlayingAudio ? (
                            <>
                              <span className="flex items-end gap-0.5 h-2.5">
                                <span className="w-0.5 bg-slate-950 rounded-full animate-bounce [animation-delay:-0.3s] h-full" />
                                <span className="w-0.5 bg-slate-950 rounded-full animate-bounce [animation-delay:-0.15s] h-2" />
                                <span className="w-0.5 bg-slate-950 rounded-full animate-bounce h-2.5" />
                              </span>
                              <span>Stop</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-3 h-3 text-emerald-700" />
                              <span>Listen</span>
                            </>
                          )}
                        </button>

                        <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-800 border border-indigo-200 font-semibold">
                          {item.language}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                          {(item.inputTypes || []).map(t => String(t)).join(' + ').toUpperCase()}
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Selected Complaint Detail Modal/Drawer */}
            {selectedComplaintDetail && (
              <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xl space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sky-800 text-sm bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-200">
                      {selectedComplaintDetail.id}
                    </span>
                    <h4 className="text-base font-bold text-slate-900">{selectedComplaintDetail.title}</h4>
                  </div>
                  <button
                    onClick={() => {
                      stopSpeaking();
                      setSelectedComplaintDetail(null);
                    }}
                    className="text-xs text-slate-600 hover:text-slate-900 px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer transition-colors"
                  >
                    Close Detail
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">Status</div>
                    <div className="font-bold text-slate-900">{getStatusLabel(selectedComplaintDetail.status)}</div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">Priority Score</div>
                    <div className="font-bold text-amber-800 font-mono">{selectedComplaintDetail.priorityScore} / 200</div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">Input Badges</div>
                    <div className="font-bold text-emerald-800">{(selectedComplaintDetail.inputTypes || []).map(t => String(t)).join(', ').toUpperCase()}</div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">Language</div>
                    <div className="font-bold text-indigo-800">{selectedComplaintDetail.language}</div>
                  </div>
                </div>

                {/* Voice Narration Audio Player Card */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-slate-50 to-teal-50 border border-emerald-200 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        playComplaintWording(
                          selectedComplaintDetail.id,
                          selectedComplaintDetail.transcription || selectedComplaintDetail.rawText,
                          selectedComplaintDetail.language
                        )
                      }
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer ${
                        playingComplaintId === selectedComplaintDetail.id && isPlayingAudio
                          ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-300'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      }`}
                    >
                      {playingComplaintId === selectedComplaintDetail.id && isPlayingAudio ? (
                        <>
                          <Pause className="w-4 h-4 text-slate-950" />
                          <span>Pause Voice Narration</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-4 h-4 text-white" />
                          <span>Play Voice Recording (Tell Wordings)</span>
                        </>
                      )}
                    </button>

                    <div>
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <span>Spoken Audio Narration</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-200">
                          {selectedComplaintDetail.language || 'Tamil'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600">
                        {playingComplaintId === selectedComplaintDetail.id && isPlayingAudio
                          ? 'Currently speaking out grievance wordings aloud...'
                          : 'Click to hear the citizen grievance read aloud'}
                      </p>
                    </div>
                  </div>

                  {playingComplaintId === selectedComplaintDetail.id && isPlayingAudio && (
                    <div className="flex items-end gap-1 h-5 px-3 py-1 bg-emerald-100 rounded-xl border border-emerald-300">
                      <span className="w-1 bg-emerald-600 rounded-full animate-bounce [animation-delay:-0.4s] h-full" />
                      <span className="w-1 bg-emerald-600 rounded-full animate-bounce [animation-delay:-0.2s] h-3" />
                      <span className="w-1 bg-emerald-600 rounded-full animate-bounce [animation-delay:-0.1s] h-4" />
                      <span className="w-1 bg-emerald-600 rounded-full animate-bounce h-2" />
                    </div>
                  )}
                </div>

                {/* Complaint Description & Voice Transcript Display */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                      Grievance Description / Report Text
                    </span>
                    <p className={`text-xs mt-1 leading-relaxed p-3 rounded-xl border transition-all ${
                      playingComplaintId === selectedComplaintDetail.id && isPlayingAudio
                        ? 'bg-emerald-50 border-emerald-300 text-slate-900 shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-900'
                    }`}>
                      "{selectedComplaintDetail.rawText}"
                    </p>
                  </div>

                  {/* Voice Transcription Block if voice note was provided */}
                  {(selectedComplaintDetail.transcription || selectedComplaintDetail.inputTypes?.includes('voice')) && (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1.5">
                      <div className="flex items-center justify-between text-emerald-800 font-bold text-[11px]">
                        <span className="flex items-center gap-1.5">
                          <Mic className="w-3.5 h-3.5 text-emerald-600" />
                          Voice-to-Text Converted Transcript ({selectedComplaintDetail.language})
                        </span>
                        <span className="text-[10px] text-emerald-700">AI Verified Speech</span>
                      </div>
                      <p className="text-slate-800 italic text-xs">
                        "{selectedComplaintDetail.transcription || selectedComplaintDetail.rawText}"
                      </p>
                    </div>
                  )}

                  {selectedComplaintDetail.photoUrl && (
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
                        Attached Photo Evidence
                      </span>
                      <img
                        src={selectedComplaintDetail.photoUrl}
                        alt="Evidence"
                        className="w-full max-w-xs h-36 rounded-xl object-cover border border-slate-200 shadow-sm"
                      />
                    </div>
                  )}
                </div>

                {/* If resolved: Photo verification & voting survey */}
                {selectedComplaintDetail.cluster?.resolution && (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-3 text-xs">
                    <div className="flex items-center justify-between font-bold text-emerald-800">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        AI Resolution Quality Proof: {selectedComplaintDetail.cluster.resolution.aiVerificationScore}% Confidence
                      </span>
                    </div>
                    <p className="text-slate-700">{selectedComplaintDetail.cluster.resolution.aiVerificationSummary}</p>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <div className="text-[10px] font-bold text-slate-600 mb-1">BEFORE (Complaint):</div>
                        <img
                          src={selectedComplaintDetail.cluster.resolution.beforePhotoUrl || SAMPLE_CIVIC_PHOTOS.pothole_crater}
                          alt="Before"
                          className="w-full h-32 rounded-xl object-cover border border-slate-200"
                        />
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-emerald-800 mb-1">AFTER (Repair Complete):</div>
                        <img
                          src={selectedComplaintDetail.cluster.resolution.afterPhotoUrl || SAMPLE_CIVIC_PHOTOS.resolved_road}
                          alt="After"
                          className="w-full h-32 rounded-xl object-cover border border-emerald-300"
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
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer shadow-xs"
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
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-bold text-xs cursor-pointer"
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

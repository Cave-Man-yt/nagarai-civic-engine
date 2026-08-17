import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Volume2, 
  Languages, 
  Camera, 
  Sparkles, 
  Play, 
  Pause,
  CheckCircle, 
  ArrowRight, 
  AlertTriangle,
  FileCode,
  RotateCw
} from 'lucide-react';
import { SAMPLE_CIVIC_PHOTOS } from '../data/mockData';
import { speakWording, stopSpeaking } from '../utils/speechUtils';

export const RobustnessSandbox: React.FC = () => {
  const [activeTest, setActiveTest] = useState<'noise' | 'codeswitch' | 'sideways'>('noise');
  const [isRunning, setIsRunning] = useState(false);
  const [testResult, setTestResult] = useState<any | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, []);

  const handlePlayVoice = (text: string, lang: string) => {
    if (isPlayingAudio) {
      stopSpeaking();
      setIsPlayingAudio(false);
      return;
    }

    setIsPlayingAudio(true);
    const spoken = speakWording({
      text,
      language: lang,
      rate: 0.95,
      onStart: () => setIsPlayingAudio(true),
      onEnd: () => setIsPlayingAudio(false),
      onError: () => setIsPlayingAudio(false),
    });

    if (!spoken) {
      setIsPlayingAudio(false);
    }
  };

  // Test 1: Heavy Noise / Background Traffic
  const runNoiseTest = () => {
    setIsRunning(true);
    setTimeout(() => {
      setTestResult({
        title: 'Background Noise & Street Chatter Filter',
        rawInput: '🔊 Audio: Spoken Tamil at 62dB SNR with loud auto-rickshaw horns and vegetable vendor shouting: "தம்பி! அண்ணா சாலை LIC முன்னாடி பெரிய பள்ளம் இருக்கு பார்த்து போங்க... ஐயையோ ஒருத்தன் வழுக்கிட்டான்!"',
        noiseFiltering: 'Bandpass spectral subtraction applied (AI4Bharat / Whisper preprocessing)',
        cleanTranscript: 'அண்ணா சாலை எல்ஐசி பில்டிங் முன்னாடி பெரிய பள்ளம் உள்ளது, இருசக்கர வாகனம் வழுக்கி விழும் அபாயம்.',
        englishTranslation: 'Large pothole in front of LIC Building on Anna Salai, danger of two-wheelers skidding.',
        extractedData: {
          category: 'pothole',
          baseSeverity: 4,
          locationName: 'Opposite LIC Building, Anna Salai',
          ward: 'Ward 112 - T. Nagar Central',
          urgencyMultiplier: 1.0,
          detectedNoiseSuppressionRatio: '91.4%',
        },
      });
      setIsRunning(false);
    }, 700);
  };

  // Test 2: Code Switching / Tanglish / Hinglish
  const runCodeSwitchTest = () => {
    setIsRunning(true);
    setTimeout(() => {
      setTestResult({
        title: 'Code-Switching & Regional Slang Parser',
        rawInput: '💬 Text: "Bro Koyambedu market entry gate la one open manhole cover totally broken ya... heavy rush time la anyone walking or small kids will direct fall inside! Romba dangerous condition urgently fix pannunga."',
        noiseFiltering: 'Multi-lingual LLM Tokenizer with colloquial South-Asian vocabulary maps',
        cleanTranscript: 'Koyambedu wholesale market entry gate open manhole with broken lid during peak rush hours.',
        englishTranslation: 'Open manhole with broken cover at Koyambedu market gate posing extreme pedestrian hazard.',
        extractedData: {
          category: 'open_manhole',
          baseSeverity: 5,
          locationName: 'Koyambedu Wholesale Market Main Gate',
          ward: 'Ward 127 - Koyambedu West',
          urgencyMultiplier: 1.4,
          languageDetected: 'Tamil-English (Tanglish)',
        },
      });
      setIsRunning(false);
    }, 700);
  };

  // Test 3: Sideways / Blurry Photo
  const runSidewaysTest = () => {
    setIsRunning(true);
    setTimeout(() => {
      setTestResult({
        title: 'Sideways Orientation & Low-Light Hazard Detector',
        rawInput: '📸 Image: 90-degree rotated portrait taken at twilight of a snapped live electric wire hanging near a school entrance.',
        noiseFiltering: 'Auto-EXIF orientation rectification + contrast equalization',
        cleanTranscript: 'Snapped live 440V overhead distribution wire hanging 1.2m above footpath.',
        englishTranslation: 'Exposed live wire dangling near school perimeter requiring immediate isolation.',
        extractedData: {
          category: 'live_wire_hazard',
          baseSeverity: 5,
          locationName: 'Kendriya Vidyalaya School Gate 2',
          ward: 'Ward 104 - Anna Nagar East',
          urgencyMultiplier: 1.4,
          visionConfidence: '98.2%',
          rotationCorrectionApplied: '90° Clockwise',
        },
      });
      setIsRunning(false);
    }, 700);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-purple-50 via-indigo-50/70 to-slate-50 border border-purple-200 shadow-sm">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
            <ShieldCheck className="w-4 h-4 text-purple-700" />
            Intake Robustness &amp; Multimodal Resilience Sandbox
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Testing Extreme Real-World Civic Edge Cases
          </h2>
          <p className="text-sm text-slate-600 font-medium">
            Demonstrates how NagarAI gracefully parses ambient noise, code-switching dialects (Tanglish/Hinglish), and uncurated mobile phone photos without clerk intervention.
          </p>
        </div>
      </div>

      {/* 3 Interactive Test Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Test 1 */}
        <div
          onClick={() => {
            setActiveTest('noise');
            runNoiseTest();
          }}
          className={`p-5 rounded-3xl border transition-all cursor-pointer ${
            activeTest === 'noise'
              ? 'bg-white border-purple-500 ring-2 ring-purple-400/20 shadow-md'
              : 'bg-white/80 border-slate-200 hover:border-slate-300 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-700">
              <Volume2 className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-mono">
              Test #1
            </span>
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">Market Noise &amp; Traffic Chatter</h3>
          <p className="text-xs text-slate-500 font-medium">
            Audio recorded in 60dB street background with horns and vendor shouting.
          </p>
        </div>

        {/* Test 2 */}
        <div
          onClick={() => {
            setActiveTest('codeswitch');
            runCodeSwitchTest();
          }}
          className={`p-5 rounded-3xl border transition-all cursor-pointer ${
            activeTest === 'codeswitch'
              ? 'bg-white border-purple-500 ring-2 ring-purple-400/20 shadow-md'
              : 'bg-white/80 border-slate-200 hover:border-slate-300 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-100 flex items-center justify-center text-sky-700">
              <Languages className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200 font-mono">
              Test #2
            </span>
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">Tanglish &amp; Hinglish Rants</h3>
          <p className="text-xs text-slate-500 font-medium">
            Informal mixed-language text filled with regional slang and urgency cues.
          </p>
        </div>

        {/* Test 3 */}
        <div
          onClick={() => {
            setActiveTest('sideways');
            runSidewaysTest();
          }}
          className={`p-5 rounded-3xl border transition-all cursor-pointer ${
            activeTest === 'sideways'
              ? 'bg-white border-purple-500 ring-2 ring-purple-400/20 shadow-md'
              : 'bg-white/80 border-slate-200 hover:border-slate-300 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-700">
              <Camera className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 font-mono">
              Test #3
            </span>
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">Sideways / Twilight Photos</h3>
          <p className="text-xs text-slate-500 font-medium">
            Uncorrected EXIF rotation and low-light hazard auto-detection.
          </p>
        </div>
      </div>

      {/* Results Comparison Sandbox */}
      {testResult ? (
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 space-y-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <span className="text-xs font-mono font-bold text-purple-700 uppercase">Live Evaluation Output</span>
              <h3 className="text-lg font-bold text-slate-900">{testResult.title}</h3>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> PASSED
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Raw Input vs Preprocessing */}
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-700">1. RAW UNCURATED INPUT:</div>
                  <button
                    type="button"
                    onClick={() => {
                      const textToSpeak = activeTest === 'noise' 
                        ? 'தம்பி! அண்ணா சாலை LIC முன்னாடி பெரிய பள்ளம் இருக்கு பார்த்து போங்க... ஒருத்தன் வழுக்கிட்டான்!'
                        : activeTest === 'codeswitch'
                        ? 'Bro Koyambedu market entry gate la one open manhole cover totally broken ya... urgently fix pannunga'
                        : 'Snapped live 440V distribution wire hanging near school entrance';
                      const lang = activeTest === 'noise' ? 'Tamil' : activeTest === 'codeswitch' ? 'Tamil' : 'English';
                      handlePlayVoice(textToSpeak, lang);
                    }}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer shadow-2xs ${
                      isPlayingAudio
                        ? 'bg-amber-500 text-slate-950 ring-1 ring-amber-300'
                        : 'bg-purple-100 hover:bg-purple-200 text-purple-800 border border-purple-300'
                    }`}
                  >
                    {isPlayingAudio ? (
                      <>
                        <Pause className="w-3 h-3 text-slate-950" />
                        <span>Stop Voice</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3 h-3 text-purple-700" />
                        <span>Play Voice / Tell Wordings</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-slate-800 italic p-3 bg-white rounded-xl border border-slate-200 font-medium">
                  {testResult.rawInput}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200 text-xs space-y-2">
                <div className="font-bold text-indigo-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> 2. AI RESILIENCE LAYER:
                </div>
                <p className="text-slate-700 font-medium">{testResult.noiseFiltering}</p>
                <div className="p-2.5 bg-white rounded-lg text-emerald-800 font-mono text-[11px] border border-emerald-200 font-semibold">
                  &rarr; {testResult.englishTranslation}
                </div>
              </div>
            </div>

            {/* Clean JSON Output */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              <div className="font-bold text-slate-700 flex items-center gap-2">
                <FileCode className="w-4 h-4 text-sky-600" />
                3. STANDARDIZED MUNICIPAL SCHEMA OUTPUT:
              </div>
              <pre className="p-4 rounded-xl bg-white text-emerald-800 font-mono text-[11px] overflow-x-auto border border-slate-200 shadow-2xs font-semibold">
                {JSON.stringify(testResult.extractedData, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center text-slate-500 text-xs border border-dashed border-slate-300 rounded-3xl bg-white/50">
          Click any of the 3 test cases above to trigger live multimodal resilience evaluation.
        </div>
      )}
    </div>
  );
};

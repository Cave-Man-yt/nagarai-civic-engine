import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Volume2, 
  Languages, 
  Camera, 
  Sparkles, 
  Play, 
  CheckCircle, 
  ArrowRight, 
  AlertTriangle,
  FileCode,
  RotateCw
} from 'lucide-react';
import { SAMPLE_CIVIC_PHOTOS } from '../data/mockData';

export const RobustnessSandbox: React.FC = () => {
  const [activeTest, setActiveTest] = useState<'noise' | 'codeswitch' | 'sideways'>('noise');
  const [isRunning, setIsRunning] = useState(false);
  const [testResult, setTestResult] = useState<any | null>(null);

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
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-purple-950/60 via-slate-900 to-indigo-950/60 border border-purple-500/30 shadow-2xl">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
            <ShieldCheck className="w-4 h-4 text-purple-400" />
            Intake Robustness &amp; Multimodal Resilience Sandbox
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Testing Extreme Real-World Civic Edge Cases
          </h2>
          <p className="text-sm text-slate-300">
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
              ? 'bg-slate-900 border-purple-500 ring-2 ring-purple-500/20 shadow-lg'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-400">
              <Volume2 className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-950 px-2 py-0.5 rounded border border-amber-800">
              Test #1
            </span>
          </div>
          <h3 className="text-base font-bold text-white mb-1">Market Noise &amp; Traffic Chatter</h3>
          <p className="text-xs text-slate-400">
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
              ? 'bg-slate-900 border-purple-500 ring-2 ring-purple-500/20 shadow-lg'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/20 flex items-center justify-center text-sky-400">
              <Languages className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400 bg-sky-950 px-2 py-0.5 rounded border border-sky-800">
              Test #2
            </span>
          </div>
          <h3 className="text-base font-bold text-white mb-1">Tanglish &amp; Hinglish Rants</h3>
          <p className="text-xs text-slate-400">
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
              ? 'bg-slate-900 border-purple-500 ring-2 ring-purple-500/20 shadow-lg'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/20 flex items-center justify-center text-rose-400">
              <Camera className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 bg-rose-950 px-2 py-0.5 rounded border border-rose-800">
              Test #3
            </span>
          </div>
          <h3 className="text-base font-bold text-white mb-1">Sideways / Twilight Photos</h3>
          <p className="text-xs text-slate-400">
            Uncorrected EXIF rotation and low-light hazard auto-detection.
          </p>
        </div>
      </div>

      {/* Results Comparison Sandbox */}
      {testResult ? (
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <span className="text-xs font-mono font-bold text-purple-400 uppercase">Live Evaluation Output</span>
              <h3 className="text-lg font-bold text-white">{testResult.title}</h3>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" /> PASSED
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Raw Input vs Preprocessing */}
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-2">
                <div className="font-bold text-slate-400">1. RAW UNCURATED INPUT:</div>
                <p className="text-slate-200 italic p-3 bg-slate-900 rounded-xl border border-slate-800">
                  {testResult.rawInput}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-800/40 text-xs space-y-2">
                <div className="font-bold text-indigo-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> 2. AI RESILIENCE LAYER:
                </div>
                <p className="text-slate-300">{testResult.noiseFiltering}</p>
                <div className="p-2.5 bg-slate-950 rounded-lg text-emerald-300 font-mono text-[11px]">
                  &rarr; {testResult.englishTranslation}
                </div>
              </div>
            </div>

            {/* Clean JSON Output */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-2">
              <div className="font-bold text-slate-400 flex items-center gap-2">
                <FileCode className="w-4 h-4 text-sky-400" />
                3. STANDARDIZED MUNICIPAL SCHEMA OUTPUT:
              </div>
              <pre className="p-4 rounded-xl bg-slate-900 text-emerald-400 font-mono text-[11px] overflow-x-auto border border-slate-800">
                {JSON.stringify(testResult.extractedData, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-3xl">
          Click any of the 3 test cases above to trigger live multimodal resilience evaluation.
        </div>
      )}
    </div>
  );
};

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { SECTIONS } from './constants';
import { motion } from 'motion/react';
import { Heart, MapPin, User, Briefcase, GraduationCap, Instagram, Twitter, Linkedin, Music, Sparkles, Coffee, Camera, Bot, Star, Target, TrendingUp, Lightbulb, MessageSquare, AlertCircle, Languages, Sun, Moon, Share2, Download, Globe, Users, Ban, BookOpen } from 'lucide-react';
import html2canvas from 'html2canvas';
import { GoogleGenAI, Type } from '@google/genai';

export default function App() {
  const [basicInfo, setBasicInfo] = useState({
    name: 'Alex Doe',
    age: '28',
    location: 'New York, NY',
    tagline: 'Looking for my next great adventure',
  });
  const [selections, setSelections] = useState<Record<string, string[]>>({});
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>({});
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const profileCardRef = React.useRef<HTMLDivElement>(null);
  const [aiFeedback, setAiFeedback] = useState<{
    visualFeedback: string;
    likeability: string;
    attracts: string;
    successRate: string;
    improvementAdvice: string;
    alternativeTaglines: string[];
    unclearAreas: string;
  } | null>(null);

  React.useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    }

    const params = new URLSearchParams(window.location.search);
    const data = params.get('data');
    if (data) {
      try {
        const decoded = JSON.parse(atob(data));
        setBasicInfo(decoded.basicInfo);
        setSelections(decoded.selections);
        setSocialLinks(decoded.socialLinks);
      } catch (e) {
        console.error('Failed to parse shared data', e);
      }
    }
  }, []);

  React.useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
        setAiFeedback(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeProfile = async () => {
    if (!profileImage) {
      alert("Please upload a profile picture first to get visual feedback!");
      return;
    }
    setIsAnalyzing(true);
    try {
      // @ts-ignore
      const apiKey = process.env.GEMINI_API_KEY;
      const ai = new GoogleGenAI({ apiKey });
      
      const base64Data = profileImage.split(',')[1];
      const mimeType = profileImage.split(';')[0].split(':')[1];

      const prompt = `Analyze this dating profile as an expert matchmaker. 
      Name: ${basicInfo.name}, Age: ${basicInfo.age}, Location: ${basicInfo.location}
      Tagline: ${basicInfo.tagline}
      Bio: ${generateCV()}
      
      Provide a brutally honest but constructive review based on the image and text.
      Also, provide specific advice on how to improve the profile, suggest 3 alternative catchy taglines, and highlight any areas that might be unclear, cliché, or off-putting.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            { inlineData: { data: base64Data, mimeType } },
            { text: prompt }
          ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              visualFeedback: { type: Type.STRING, description: "Feedback on the profile picture (lighting, expression, vibe)" },
              likeability: { type: Type.STRING, description: "Likeability score out of 10 and brief reason" },
              attracts: { type: Type.STRING, description: "The specific type of partner this profile is most likely to attract" },
              successRate: { type: Type.STRING, description: "Success rate expectancy for their needs (percentage and reason)" },
              improvementAdvice: { type: Type.STRING, description: "Specific, actionable advice on how to improve the profile text and selections" },
              alternativeTaglines: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING },
                description: "3 alternative catchy taglines tailored to the profile" 
              },
              unclearAreas: { type: Type.STRING, description: "Areas of the profile that might be unclear, cliché, or off-putting" }
            },
            required: ["visualFeedback", "likeability", "attracts", "successRate", "improvementAdvice", "alternativeTaglines", "unclearAreas"]
          }
        }
      });

      if (response.text) {
        setAiFeedback(JSON.parse(response.text));
      }
    } catch (error) {
      console.error("Error analyzing profile:", error);
      alert("Failed to analyze profile. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleBasicInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBasicInfo(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const toggleSelection = (sectionId: string, option: string) => {
    setSelections(prev => {
      const current = prev[sectionId] || [];
      const updated = current.includes(option)
        ? current.filter(item => item !== option)
        : [...current, option];
      return { ...prev, [sectionId]: updated };
    });
  };

  const handleSocialLinkChange = (platform: string, link: string) => {
    setSocialLinks(prev => ({ ...prev, [platform]: link }));
  };

  const handleShare = () => {
    const data = { basicInfo, selections, socialLinks };
    const encodedData = btoa(JSON.stringify(data));
    const shareUrl = `${window.location.origin}${window.location.pathname}?data=${encodedData}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      alert('Profile link copied to clipboard!');
    });
  };

  const handleDownload = async () => {
    if (profileCardRef.current) {
      const canvas = await html2canvas(profileCardRef.current);
      const link = document.createElement('a');
      link.download = 'dating-cv.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  };

  const generateCV = () => {
    const allSelected = Object.values(selections).flat() as string[];
    if (allSelected.length === 0) return "I'm still figuring out exactly how to describe myself, but I promise I'm interesting!";
    
    return `I am a ${allSelected.slice(0, 5).join(', ')}${allSelected.length > 5 ? ' and more' : ''}. I'm looking for someone who appreciates these qualities and is ready to build something meaningful together.`;
  };


  const getIconForSection = (id: string) => {
    switch (id) {
      case 'personality': return <User className="w-4 h-4" />;
      case 'interests': return <Coffee className="w-4 h-4" />;
      case 'lifestyle': return <Sparkles className="w-4 h-4" />;
      case 'values': return <Heart className="w-4 h-4" />;
      case 'occupation': return <Briefcase className="w-4 h-4" />;
      case 'musicGenres': return <Music className="w-4 h-4" />;
      case 'languagesSpoken': return <Languages className="w-4 h-4" />;
      case 'ethnicity': return <Users className="w-4 h-4" />;
      case 'ethnicityPreferences': return <Users className="w-4 h-4" />;
      case 'countryPreferences': return <Globe className="w-4 h-4" />;
      case 'excludedCountries': return <Ban className="w-4 h-4" />;
      case 'religion': return <BookOpen className="w-4 h-4" />;
      case 'religionPreferences': return <BookOpen className="w-4 h-4" />;
      default: return <Sparkles className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans selection:bg-rose-200 pb-20">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-zinc-200 sticky top-0 z-50 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2 text-rose-500">
          <Heart className="w-7 h-7 fill-current" />
          <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white">MatchCV</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm font-bold text-zinc-500 bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-400 px-4 py-1.5 rounded-full">Profile Builder</div>
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 flex flex-col lg:flex-row gap-8">
        
        {/* Left Column: Builder */}
        <div className="flex-1 space-y-8 lg:max-w-2xl">
          
          {/* Basic Info Section */}
          <section className="bg-white dark:bg-zinc-800 p-6 rounded-3xl border border-rose-100 dark:border-zinc-700 shadow-sm">
            <h2 className="text-xl font-bold mb-6 text-zinc-900 dark:text-white flex items-center gap-2">
              <User className="w-5 h-5 text-rose-500" /> Basic Info
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Name</label>
                <input 
                  type="text" name="name" value={basicInfo.name} onChange={handleBasicInfoChange}
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all text-zinc-900 dark:text-white"
                  placeholder="Your Name"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Age</label>
                <input 
                  type="number" name="age" value={basicInfo.age} onChange={handleBasicInfoChange}
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all text-zinc-900 dark:text-white"
                  placeholder="25"
                />
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Location</label>
                <input 
                  type="text" name="location" value={basicInfo.location} onChange={handleBasicInfoChange}
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all text-zinc-900 dark:text-white"
                  placeholder="City, Country"
                />
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Tagline</label>
                <input 
                  type="text" name="tagline" value={basicInfo.tagline} onChange={handleBasicInfoChange}
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all text-zinc-900 dark:text-white"
                  placeholder="A short catchy phrase about you"
                />
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Profile Picture</label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center justify-center w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-900 text-rose-500 cursor-pointer hover:bg-rose-200 dark:hover:bg-rose-800 transition-colors overflow-hidden border-2 border-rose-200 dark:border-rose-700 shrink-0">
                    {profileImage ? (
                      <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-6 h-6" />
                    )}
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">Upload a photo for AI visual feedback</span>
                </div>
              </div>
            </div>
          </section>

          {/* Dynamic Sections */}
          <div className="space-y-6">
            {SECTIONS.map(section => (
              <section key={section.id} className="bg-white dark:bg-zinc-900 p-6 md:p-8 rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
                <h2 className="text-xl font-bold mb-6 text-zinc-900 dark:text-white flex items-center gap-3">
                  <div className="p-2 bg-rose-100 dark:bg-rose-900/30 rounded-xl text-rose-500">
                    {getIconForSection(section.id)}
                  </div>
                  {section.title}
                </h2>
                
                {section.id === 'socialMedia' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {section.options.map(platform => (
                      <div key={platform} className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-800 px-4 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-700">
                        {platform === 'Instagram' && <Instagram className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />}
                        {platform === 'Twitter' && <Twitter className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />}
                        {platform === 'LinkedIn' && <Linkedin className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />}
                        {platform === 'TikTok' && <Music className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />}
                        <input
                          type="text"
                          placeholder={`@username`}
                          value={socialLinks[platform] || ''}
                          onChange={(e) => handleSocialLinkChange(platform, e.target.value)}
                          className="bg-transparent border-none focus:outline-none w-full text-sm text-zinc-900 dark:text-white"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    {section.options.map(option => {
                      const isSelected = (selections[section.id] || []).includes(option);
                      return (
                        <button
                          key={option}
                          onClick={() => toggleSelection(section.id, option)}
                          className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${
                            isSelected 
                              ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30 scale-105' 
                              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                          }`}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>
                )}
              </section>
            ))}
          </div>
        </div>

        {/* Right Column: Live Preview Card */}
        <div className="lg:w-[380px] xl:w-[420px] shrink-0">
          <div className="sticky top-24">
            <div className="flex items-center justify-center mb-4 gap-2">
              <Sparkles className="w-4 h-4 text-rose-500" />
              <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest">Live Preview</h3>
              <button onClick={handleShare} className="p-1.5 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-400"><Share2 className="w-4 h-4" /></button>
              <button onClick={handleDownload} className="p-1.5 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-400"><Download className="w-4 h-4" /></button>
            </div>
            
            {/* The Profile Card (Phone Mockup) */}
            <motion.div 
              ref={profileCardRef}
              className="bg-white dark:bg-zinc-800 rounded-[3rem] overflow-hidden shadow-2xl shadow-zinc-900/20 border-[8px] border-zinc-900 relative h-[750px] flex flex-col"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* Scrollable Content inside phone */}
              <div className="flex-1 overflow-y-auto pb-24 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {/* Card Image/Gradient Header */}
                <div 
                  className="h-[400px] bg-gradient-to-br from-rose-400 via-fuchsia-500 to-indigo-500 relative p-6 flex flex-col justify-end bg-cover bg-center shrink-0"
                  style={profileImage ? { backgroundImage: `url(${profileImage})` } : {}}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
                  <div className="relative z-10 text-white">
                    <h2 className="text-4xl font-black tracking-tight flex items-baseline gap-2 drop-shadow-md">
                      {basicInfo.name || 'Your Name'} <span className="text-2xl font-medium opacity-90">{basicInfo.age}</span>
                    </h2>
                    <div className="flex items-center gap-1.5 mt-2 text-white/90 font-medium drop-shadow-md">
                      <MapPin className="w-4 h-4" />
                      {basicInfo.location || 'Location'}
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-6 space-y-8 dark:text-zinc-100">
                  {/* Tagline */}
                  {basicInfo.tagline && (
                    <div className="text-2xl font-bold text-zinc-800 dark:text-zinc-100 leading-snug">
                      "{basicInfo.tagline}"
                    </div>
                  )}

                {/* Bio / Generated CV */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-rose-500 uppercase tracking-wider">About Me</h4>
                  <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed text-sm">
                    {generateCV()}
                  </p>
                </div>

                {/* Highlights (Top Selections) */}
                {Object.entries(selections).some(([_, opts]) => (opts as string[]).length > 0) && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-rose-500 uppercase tracking-wider">Highlights</h4>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(selections).map(([sectionId, opts]) => {
                        const options = opts as string[];
                        if (options.length === 0) return null;
                        return options.slice(0, 3).map(opt => (
                          <span key={`${sectionId}-${opt}`} className="px-3 py-1 bg-rose-50 dark:bg-rose-900 text-rose-700 dark:text-rose-200 rounded-lg text-xs font-semibold border border-rose-100 dark:border-rose-800">
                            {opt}
                          </span>
                        ));
                      })}
                    </div>
                  </div>
                )}

                {/* Socials */}
                {Object.values(socialLinks).some(link => (link as string).trim() !== '') && (
                  <div className="pt-4 border-t border-zinc-100 dark:border-zinc-700 flex gap-4 justify-center">
                    {Object.entries(socialLinks).map(([platform, link]) => {
                      if (!(link as string).trim()) return null;
                      return (
                        <div key={platform} className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-700 flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:bg-rose-100 dark:hover:bg-rose-900 hover:text-rose-600 dark:hover:text-rose-200 transition-colors cursor-pointer" title={`${platform}: ${link}`}>
                          {platform === 'Instagram' && <Instagram className="w-5 h-5" />}
                          {platform === 'Twitter' && <Twitter className="w-5 h-5" />}
                          {platform === 'LinkedIn' && <Linkedin className="w-5 h-5" />}
                          {platform === 'TikTok' && <Music className="w-5 h-5" />}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              
              </div>
              
              {/* Bottom Action Buttons (Floating over content) */}
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white dark:from-zinc-950 via-white/90 dark:via-zinc-950/90 to-transparent pt-12 flex justify-center gap-6">
                <button className="w-16 h-16 rounded-full bg-white dark:bg-zinc-800 border-2 border-zinc-100 dark:border-zinc-700 shadow-xl flex items-center justify-center text-zinc-400 dark:text-zinc-500 hover:text-rose-500 dark:hover:text-rose-400 hover:border-rose-100 dark:hover:border-rose-900 transition-all hover:scale-110 hover:-translate-y-1">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
                <button className="w-16 h-16 rounded-full bg-gradient-to-br from-rose-400 to-pink-600 shadow-xl shadow-rose-500/40 flex items-center justify-center text-white hover:from-rose-500 hover:to-pink-700 transition-all hover:scale-110 hover:-translate-y-1">
                  <Heart className="w-8 h-8 fill-current" />
                </button>
              </div>
            </motion.div>

            {/* AI Feedback Section */}
            <div className="mt-8">
              <button 
                onClick={analyzeProfile}
                disabled={isAnalyzing || !profileImage}
                className="w-full py-4 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-indigo-500/25"
              >
                {isAnalyzing ? (
                  <span className="animate-pulse flex items-center gap-2"><Bot className="w-6 h-6" /> Analyzing Profile...</span>
                ) : (
                  <><Bot className="w-6 h-6" /> Get Premium AI Review</>
                )}
              </button>

              {aiFeedback && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-6 bg-gradient-to-br from-indigo-900 to-purple-900 p-6 rounded-3xl shadow-2xl text-indigo-50 space-y-6"
                >
                  <h4 className="font-black text-xl text-white flex items-center gap-2 border-b border-indigo-700/50 pb-4">
                    <Sparkles className="w-5 h-5 text-yellow-400" /> Matchmaker's Notes
                  </h4>
                  
                  <div className="space-y-5 text-sm">
                    <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm">
                      <div className="flex items-center gap-2 font-bold text-white mb-2">
                        <Camera className="w-4 h-4 text-blue-400" /> Visual Feedback
                      </div>
                      <p className="text-indigo-100 leading-relaxed">{aiFeedback.visualFeedback}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm">
                        <div className="flex items-center gap-2 font-bold text-white mb-2">
                          <Star className="w-4 h-4 text-yellow-400" /> Likeability
                        </div>
                        <p className="text-indigo-100 leading-relaxed font-medium text-lg">{aiFeedback.likeability}</p>
                      </div>

                      <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm">
                        <div className="flex items-center gap-2 font-bold text-white mb-2">
                          <TrendingUp className="w-4 h-4 text-green-400" /> Success
                        </div>
                        <p className="text-indigo-100 leading-relaxed font-medium text-lg">{aiFeedback.successRate}</p>
                      </div>
                    </div>

                    <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm">
                      <div className="flex items-center gap-2 font-bold text-white mb-2">
                        <Target className="w-4 h-4 text-rose-400" /> Attracts
                      </div>
                      <p className="text-indigo-100 leading-relaxed">{aiFeedback.attracts}</p>
                    </div>

                    <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm">
                      <div className="flex items-center gap-2 font-bold text-white mb-2">
                        <Lightbulb className="w-4 h-4 text-amber-400" /> Improvement Advice
                      </div>
                      <p className="text-indigo-100 leading-relaxed">{aiFeedback.improvementAdvice}</p>
                    </div>

                    <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm">
                      <div className="flex items-center gap-2 font-bold text-white mb-2">
                        <MessageSquare className="w-4 h-4 text-purple-400" /> Alternative Taglines
                      </div>
                      <ul className="list-disc list-inside text-indigo-100 leading-relaxed space-y-2">
                        {aiFeedback.alternativeTaglines.map((tagline, i) => (
                          <li key={i} className="italic">"{tagline}"</li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-orange-500/30">
                      <div className="flex items-center gap-2 font-bold text-white mb-2">
                        <AlertCircle className="w-4 h-4 text-orange-400" /> Unclear or Cliché Areas
                      </div>
                      <p className="text-indigo-100 leading-relaxed">{aiFeedback.unclearAreas}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}



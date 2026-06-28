import React, { useEffect, useRef, useState } from 'react';
import { MEMBERS } from './data';
import OctahedronLogo from './components/OctahedronLogo';
import MemberCard from './components/MemberCard';
import ResearchPortal from './components/ResearchPortal';
import { 
  Sparkles, 
  BookOpen, 
  ArrowRight, 
  Terminal,
  BrainCircuit,
  GraduationCap,
  Moon,
  Sun
} from 'lucide-react';

type Theme = 'light' | 'dark';

const getInitialTheme = (): Theme => {
  const storedTheme = window.localStorage.getItem('theme');

  if (storedTheme === 'light' || storedTheme === 'dark') {
    return storedTheme;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export default function App() {
  const [selectedMemberId, setSelectedMemberId] = useState<string | undefined>(undefined);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  
  const membersSectionRef = useRef<HTMLDivElement>(null);
  const researchSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    window.localStorage.setItem('theme', theme);
  }, [theme]);

  // Smooth scroll helper
  const scrollTo = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSelectMemberForPapers = (memberId: string) => {
    setSelectedMemberId(memberId);
    // Smooth scroll to research portal
    setTimeout(() => {
      scrollTo(researchSectionRef);
    }, 100);
  };

  const handleClearMemberPaperFilter = () => {
    setSelectedMemberId('all');
  };

  // Filter members based on search box (by name or interests)
  const filteredMembers = MEMBERS.filter(member => {
    const query = memberSearchQuery.toLowerCase();
    return member.name.toLowerCase().includes(query) || 
           member.researchInterests.some(interest => interest.toLowerCase().includes(query));
  });

  return (
    <div className="min-h-screen bg-[#fafafc] text-[#1d1d1f] dark:bg-[#080a12] dark:text-gray-100 font-sans antialiased selection:bg-pink-500 selection:text-white transition-colors duration-300">
      {/* Sub navigation bar - Frosted Rose Glass */}
      <header id="sub-nav-frosted" className="sticky top-0 w-full min-h-[52px] bg-white/70 dark:bg-gray-950/70 backdrop-blur-md border-b border-pink-100/50 dark:border-pink-950/40 flex items-center justify-between gap-3 px-4 sm:px-6 md:px-12 py-2 z-40 transition-colors duration-300">
        <div className="flex items-center gap-2 shrink-0">
          {/* Faux tiny logo wireframe */}
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="text-pink-600 dark:text-pink-400 font-bold tracking-tight text-base sm:text-lg cursor-pointer"
          >
            Pianura Carlo
          </button>
        </div>
        <div className="flex items-center justify-end gap-2 sm:gap-4 md:gap-6 min-w-0">
          <button 
            onClick={() => scrollTo(membersSectionRef)} 
            className="hidden sm:inline-flex text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-pink-600 dark:hover:text-pink-400 transition-colors cursor-pointer whitespace-nowrap"
          >
            About Us
          </button>
          <button 
            onClick={() => {
              setSelectedMemberId('all');
              scrollTo(researchSectionRef);
            }} 
            className="bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold px-3 py-1.5 rounded-full transition-all transform active:scale-95 cursor-pointer shadow-sm shadow-pink-500/15 whitespace-nowrap"
          >
            Publications
          </button>
          <button
            type="button"
            onClick={() => setTheme((currentTheme) => currentTheme === 'dark' ? 'light' : 'dark')}
            className="w-8 h-8 rounded-full border border-pink-100 dark:border-pink-900/60 bg-white/80 dark:bg-gray-900 text-pink-600 dark:text-pink-300 hover:bg-pink-50 dark:hover:bg-pink-950/40 flex items-center justify-center transition-colors cursor-pointer shrink-0"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Hero Block Section - Apple-Style Light Canvas */}
      <section className="relative w-full overflow-hidden bg-gradient-to-b from-white via-white to-pink-50/10 dark:from-gray-950 dark:via-[#0b0d18] dark:to-pink-950/10 py-16 md:py-24 border-b border-pink-50/50 dark:border-pink-950/30 transition-colors duration-300">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-pink-50 dark:bg-pink-950/30 border border-pink-100 dark:border-pink-900/50 rounded-full px-4 py-1 animate-fade-in">
            <Sparkles className="w-3.5 h-3.5 text-pink-600" />
            <span className="text-xs font-bold tracking-wider text-pink-600 uppercase">Independent Informatics Research Circle</span>
          </div>

          {/* Headline Display */}
          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl font-semibold tracking-tight leading-tight text-gray-900 dark:text-white">
              Pianura Carlo
            </h1>
            <p className="text-xl md:text-2xl font-light text-pink-600/90 dark:text-pink-300 tracking-wide max-w-3xl lg:max-w-none mx-auto lg:whitespace-nowrap">
              Algorithmic boundaries. Quantum computing. Meta-heuristic optimization.
            </p>
          </div>

          {/* Lead body description */}
          <p className="text-base md:text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto font-light leading-relaxed">
            We are a team of informatics researchers and competitive programmers. Built for academic exploration, we combine structural computer science, algorithmic optimization, and software design.
          </p>

          {/* Action pills */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <button
              onClick={() => scrollTo(membersSectionRef)}
              className="bg-pink-600 hover:bg-pink-700 text-white rounded-full py-3 px-6 text-sm font-semibold transition-all transform active:scale-95 flex items-center gap-2 shadow-md shadow-pink-500/10 cursor-pointer"
            >
              Explore Members
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setSelectedMemberId('all');
                scrollTo(researchSectionRef);
              }}
              className="bg-white dark:bg-gray-900 hover:bg-pink-50 dark:hover:bg-pink-950/40 text-pink-600 dark:text-pink-300 border border-pink-200 dark:border-pink-900/60 rounded-full py-3 px-6 text-sm font-semibold transition-all transform active:scale-95 cursor-pointer"
            >
              View Publications
            </button>
          </div>

          {/* Spectacular 3D Interactive Rotating Logo Model */}
          <div className="flex flex-col items-center justify-center pt-8">
            <OctahedronLogo />
            <p className="text-[11px] text-pink-400 uppercase tracking-widest font-mono mt-3">
              Official Double-Pyramid Octahedron Motif
            </p>
          </div>
        </div>
      </section>

      {/* Grid Highlights Cards Block - Apple Configurator Style */}
      <section className="py-16 bg-white dark:bg-[#0b0d18] border-b border-pink-50/50 dark:border-pink-950/30 transition-colors duration-300">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Focus 1 */}
            <div className="bg-[#fafafc] dark:bg-gray-900 border border-pink-100/50 dark:border-pink-950/40 rounded-2xl p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-pink-50 dark:bg-pink-950/40 flex items-center justify-center text-pink-600 dark:text-pink-300">
                <BrainCircuit className="w-5 h-5" />
              </div>
              <h3 className="text-md font-semibold text-gray-900 dark:text-white">Theoretical Foundations</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 font-light leading-relaxed">
                Exploring NP-hard problems, complexity classes, quantum error correction protocols, and graph algorithms with rigorous mathematical analysis.
              </p>
            </div>

            {/* Focus 2 */}
            <div className="bg-[#fafafc] dark:bg-gray-900 border border-pink-100/50 dark:border-pink-950/40 rounded-2xl p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-pink-50 dark:bg-pink-950/40 flex items-center justify-center text-pink-600 dark:text-pink-300">
                <Terminal className="w-5 h-5" />
              </div>
              <h3 className="text-md font-semibold text-gray-900 dark:text-white">Competitive Programming</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 font-light leading-relaxed">
                Applying advanced dynamic programming, seg-trees, and graph-flows to elite competitions like the Italian Competitive Programming Contest (ITACPC).
              </p>
            </div>

            {/* Focus 3 */}
            <div className="bg-[#fafafc] dark:bg-gray-900 border border-pink-100/50 dark:border-pink-950/40 rounded-2xl p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-pink-50 dark:bg-pink-950/40 flex items-center justify-center text-pink-600 dark:text-pink-300">
                <GraduationCap className="w-5 h-5" />
              </div>
              <h3 className="text-md font-semibold text-gray-900 dark:text-white">Research Practice</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 font-light leading-relaxed">
                Collaborating across research areas to develop rigorous, production-grade solutions for modern computational challenges.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About Us (The 12 Members) Section - Alphabetical Order */}
      <section 
        id="about-us-section" 
        ref={membersSectionRef} 
        className="py-16 md:py-24 bg-[#fafafc] dark:bg-[#080a12] border-b border-pink-50/50 dark:border-pink-950/30 transition-colors duration-300"
      >
        <div className="max-w-6xl mx-auto px-6 space-y-12">
          
          {/* Section Header */}
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-4xl font-semibold text-gray-900 dark:text-white tracking-tight">
              Members
            </h2>
            <div className="max-w-2xl mx-auto pt-4">
              <input
                id="member-filter-input"
                type="text"
                placeholder="Filter members by name or research tag..."
                value={memberSearchQuery}
                onChange={(e) => setMemberSearchQuery(e.target.value)}
                className="w-full bg-white dark:bg-gray-900 border border-pink-100 dark:border-pink-950/40 rounded-2xl py-3.5 px-5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>
          </div>

          {/* Members Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMembers.length > 0 ? (
              filteredMembers.map((member) => (
                <MemberCard 
                  key={member.id} 
                  member={member} 
                  onSelectMember={handleSelectMemberForPapers} 
                />
              ))
            ) : (
              <div className="col-span-full text-center py-12 bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-pink-200 dark:border-pink-900/40">
                <p className="text-sm text-gray-500 dark:text-gray-400">No members match your filter criteria.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Publications Section */}
      <section 
        id="research-section" 
        ref={researchSectionRef} 
        className="py-16 md:py-24 bg-white dark:bg-[#0b0d18] transition-colors duration-300"
      >
        <div className="max-w-6xl mx-auto px-6 space-y-12">
          
          {/* Section Header */}
          <div className="space-y-4 max-w-3xl">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-pink-600 dark:text-pink-300 bg-pink-50 dark:bg-pink-950/30 px-2.5 py-1 rounded-full">
              <BookOpen className="w-3.5 h-3.5" /> Publications Index
            </div>
            <h2 className="text-3xl md:text-4xl font-semibold text-gray-900 dark:text-white tracking-tight">
              Publications
            </h2>
            <p className="text-sm md:text-md text-gray-600 dark:text-gray-300 font-light leading-relaxed">
              Academic work authored by the group, generated from stable publication identifiers and rendered from a static data file.
            </p>
          </div>

          {/* Publications List Component */}
          <ResearchPortal selectedMemberId={selectedMemberId} onClearMemberFilter={handleClearMemberPaperFilter} />

        </div>
      </section>

      {/* Editorial Quote / Statement Block - Pink Highlight */}
      <section className="bg-pink-600 text-white py-16 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-pink-500 via-pink-600 to-pink-700 opacity-90 -z-10" />
        <div className="max-w-3xl mx-auto px-6 space-y-4">
          <BrainCircuit className="w-8 h-8 mx-auto text-pink-200 animate-pulse" />
          <h2 className="text-2xl md:text-3xl font-light tracking-wide leading-relaxed">
            "We compile intellectual efforts to push standard computational barriers. Informatics is an infinite playground for research and performance."
          </h2>
          <p className="text-xs uppercase tracking-widest text-pink-200 font-mono">
            — PIANURA CARLO SYNDICATE
          </p>
        </div>
      </section>

      {/* Apple-Style Parchment/Rose Footer */}
      <footer id="footer" className="bg-[#f5f5f7] dark:bg-gray-950 border-t border-pink-100/30 dark:border-pink-950/40 text-gray-500 dark:text-gray-400 py-12 px-6 md:px-12 transition-colors duration-300">
        <div className="max-w-3xl mx-auto space-y-6 text-center">
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wider">Group Mission</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-light leading-relaxed max-w-xl mx-auto">
              Pianura Carlo is an independent computer science research synergy. We research modern algorithms, system constraints, formal verifications, and competitive optimizations.
            </p>
          </div>

          <div className="border-t border-gray-300/40 dark:border-gray-800 pt-6 text-[10px] text-gray-400 dark:text-gray-500 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              <p>© 2026 Pianura Carlo. All rights reserved. Code licensed under Apache-2.0.</p>
            </div>
            <div className="flex flex-wrap justify-center gap-4">
              <span className="hover:text-pink-600 transition-colors cursor-default">Privacy Policy</span>
              <span className="hover:text-pink-600 transition-colors cursor-default">Terms of Study</span>
              <span className="hover:text-pink-600 transition-colors cursor-default">Independent Research Group</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

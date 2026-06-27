import React, { useState, useRef } from 'react';
import { MEMBERS } from './data';
import OctahedronLogo from './components/OctahedronLogo';
import MemberCard from './components/MemberCard';
import ResearchPortal from './components/ResearchPortal';
import { 
  Users, 
  Award, 
  Sparkles, 
  BookOpen, 
  Binary, 
  ArrowRight, 
  ChevronRight, 
  HelpCircle, 
  Info,
  Terminal,
  BrainCircuit,
  GraduationCap
} from 'lucide-react';

export default function App() {
  const [selectedMemberId, setSelectedMemberId] = useState<string | undefined>(undefined);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  
  const membersSectionRef = useRef<HTMLDivElement>(null);
  const researchSectionRef = useRef<HTMLDivElement>(null);

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

  // Filter members based on search box (by name or interests)
  const filteredMembers = MEMBERS.filter(member => {
    const query = memberSearchQuery.toLowerCase();
    return member.name.toLowerCase().includes(query) || 
           member.researchInterests.some(interest => interest.toLowerCase().includes(query));
  });

  return (
    <div className="min-h-screen bg-[#fafafc] text-[#1d1d1f] font-sans antialiased selection:bg-pink-500 selection:text-white">
      {/* Sub navigation bar - Frosted Rose Glass */}
      <header id="sub-nav-frosted" className="sticky top-0 w-full h-[52px] bg-white/70 backdrop-blur-md border-b border-pink-100/50 flex items-center justify-between px-6 md:px-12 z-40">
        <div className="flex items-center gap-2">
          {/* Faux tiny logo wireframe */}
          <span className="text-pink-600 font-bold tracking-tight text-lg">Pianura Carlo</span>
        </div>
        <div className="flex items-center gap-6">
          <button 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} 
            className="text-xs font-semibold text-gray-500 hover:text-pink-600 transition-colors cursor-pointer"
          >
            Showcase
          </button>
          <button 
            onClick={() => scrollTo(membersSectionRef)} 
            className="text-xs font-semibold text-gray-500 hover:text-pink-600 transition-colors cursor-pointer"
          >
            About Us
          </button>
          <button 
            onClick={() => scrollTo(researchSectionRef)} 
            className="text-xs font-semibold text-gray-500 hover:text-pink-600 transition-colors cursor-pointer"
          >
            Research Finder
          </button>
          <button 
            onClick={() => {
              setSelectedMemberId('all');
              scrollTo(researchSectionRef);
            }} 
            className="bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold px-3 py-1.5 rounded-full transition-all transform active:scale-95 cursor-pointer shadow-sm shadow-pink-500/15"
          >
            Find Papers
          </button>
        </div>
      </header>

      {/* Hero Block Section - Apple-Style Light Canvas */}
      <section className="relative w-full overflow-hidden bg-gradient-to-b from-white via-white to-pink-50/10 py-16 md:py-24 border-b border-pink-50/50">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-pink-50 border border-pink-100 rounded-full px-4 py-1 animate-fade-in">
            <Sparkles className="w-3.5 h-3.5 text-pink-600" />
            <span className="text-xs font-bold tracking-wider text-pink-600 uppercase">Uniba Informatics Research Circle</span>
          </div>

          {/* Headline Display */}
          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl font-semibold tracking-tight leading-tight text-gray-900">
              Pianura Carlo
            </h1>
            <p className="text-xl md:text-2xl font-light text-pink-600/90 tracking-wide max-w-2xl mx-auto">
              Algorithmic boundaries. Quantum computing. Meta-heuristic optimization.
            </p>
          </div>

          {/* Lead body description */}
          <p className="text-base md:text-lg text-gray-600 max-w-3xl mx-auto font-light leading-relaxed">
            We are a team of informatics researchers and competitive programmers from the 
            <span className="font-medium text-gray-900"> University of Bari (Uniba)</span>. Built for academic exploration, we combine structural computer science, algorithmic optimization, and software design.
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
              className="bg-white hover:bg-pink-50 text-pink-600 border border-pink-200 rounded-full py-3 px-6 text-sm font-semibold transition-all transform active:scale-95 cursor-pointer"
            >
              Search Publications
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
      <section className="py-16 bg-white border-b border-pink-50/50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Focus 1 */}
            <div className="bg-[#fafafc] border border-pink-100/50 rounded-2xl p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center text-pink-600">
                <BrainCircuit className="w-5 h-5" />
              </div>
              <h3 className="text-md font-semibold text-gray-900">Theoretical Foundations</h3>
              <p className="text-sm text-gray-600 font-light leading-relaxed">
                Exploring NP-hard problems, complexity classes, quantum error correction protocols, and graph algorithms with rigorous mathematical analysis.
              </p>
            </div>

            {/* Focus 2 */}
            <div className="bg-[#fafafc] border border-pink-100/50 rounded-2xl p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center text-pink-600">
                <Terminal className="w-5 h-5" />
              </div>
              <h3 className="text-md font-semibold text-gray-900">Competitive Programming</h3>
              <p className="text-sm text-gray-600 font-light leading-relaxed">
                Applying advanced dynamic programming, seg-trees, and graph-flows to elite competitions like the Italian Competitive Programming Contest (ITACPC).
              </p>
            </div>

            {/* Focus 3 */}
            <div className="bg-[#fafafc] border border-pink-100/50 rounded-2xl p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center text-pink-600">
                <GraduationCap className="w-5 h-5" />
              </div>
              <h3 className="text-md font-semibold text-gray-900">Uniba Academic Merits</h3>
              <p className="text-sm text-gray-600 font-light leading-relaxed">
                Affiliated with the Università degli Studi di Bari, collaborating with research laboratories to develop production-grade solutions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About Us (The 12 Members) Section - Alphabetical Order */}
      <section 
        id="about-us-section" 
        ref={membersSectionRef} 
        className="py-16 md:py-24 bg-[#fafafc] border-b border-pink-50/50"
      >
        <div className="max-w-6xl mx-auto px-6 space-y-12">
          
          {/* Section Header */}
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-4xl font-semibold text-gray-900 tracking-tight">
              Group Directory
            </h2>
            <p className="text-sm text-pink-600 font-semibold uppercase tracking-wider">
              Active Researchers • Sorted Alphabetically
            </p>
            <div className="max-w-md mx-auto pt-4">
              <input
                id="member-filter-input"
                type="text"
                placeholder="Filter members by name or research tag..."
                value={memberSearchQuery}
                onChange={(e) => setMemberSearchQuery(e.target.value)}
                className="w-full bg-white border border-pink-100 rounded-xl py-2 px-4 text-xs focus:outline-none focus:ring-2 focus:ring-pink-500"
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
              <div className="col-span-full text-center py-12 bg-white rounded-2xl border border-dashed border-pink-200">
                <p className="text-sm text-gray-500">No members match your filter criteria.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Publications / Live Research Portal - Pink and White Theme */}
      <section 
        id="research-section" 
        ref={researchSectionRef} 
        className="py-16 md:py-24 bg-white"
      >
        <div className="max-w-6xl mx-auto px-6 space-y-12">
          
          {/* Section Header */}
          <div className="space-y-4 max-w-3xl">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-pink-600 bg-pink-50 px-2.5 py-1 rounded-full">
              <BookOpen className="w-3.5 h-3.5" /> Automated Crawler
            </div>
            <h2 className="text-3xl md:text-4xl font-semibold text-gray-900 tracking-tight">
              Publications Finder
            </h2>
            <p className="text-sm md:text-md text-gray-600 font-light leading-relaxed">
              Find academic work authored by our team. Our crawler dynamically crawls international, open-access scholarly databases (<span className="font-semibold text-pink-600">OpenAlex</span> and <span className="font-semibold text-pink-600">Semantic Scholar</span>) to find, validate, and reconstruct abstracts for peer-reviewed papers written by any member of Pianura Carlo.
            </p>
          </div>

          {/* Automated Research Portal Component */}
          <ResearchPortal selectedMemberId={selectedMemberId} />

        </div>
      </section>

      {/* Editorial Quote / Statement Block - Pink Highlight */}
      <section className="bg-pink-600 text-white py-16 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-pink-500 via-pink-600 to-pink-700 opacity-90 -z-10" />
        <div className="max-w-3xl mx-auto px-6 space-y-4">
          <BrainCircuit className="w-8 h-8 mx-auto text-pink-200 animate-pulse" />
          <h2 className="text-2xl md:text-3xl font-light tracking-wide leading-relaxed">
            "We compile intellectual efforts to push standard computational barriers. Informatics at Uniba is not just a study—it is an infinite playground for research and performance."
          </h2>
          <p className="text-xs uppercase tracking-widest text-pink-200 font-mono">
            — PIANURA CARLO SYNDICATE
          </p>
        </div>
      </section>

      {/* Apple-Style Parchment/Rose Footer */}
      <footer id="footer" className="bg-[#f5f5f7] border-t border-pink-100/30 text-gray-500 py-12 px-6 md:px-12">
        <div className="max-w-3xl mx-auto space-y-6 text-center">
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wider">Group Mission</h4>
            <p className="text-xs text-gray-500 font-light leading-relaxed max-w-xl mx-auto">
              Pianura Carlo is an independent computer science research synergy. We research modern algorithms, system constraints, formal verifications, and competitive optimizations.
            </p>
          </div>

          <div className="border-t border-gray-300/40 pt-6 text-[10px] text-gray-400 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              <p>© 2026 Pianura Carlo. All rights reserved. Code licensed under Apache-2.0.</p>
            </div>
            <div className="flex gap-4">
              <span className="hover:text-pink-600 transition-colors cursor-default">Privacy Policy</span>
              <span className="hover:text-pink-600 transition-colors cursor-default">Terms of Study</span>
              <span className="hover:text-pink-600 transition-colors cursor-default">Bari, Italy</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

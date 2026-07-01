import React, { useCallback, useEffect, useRef, useState } from 'react';
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
  Sun,
  Github,
  Mail,
  ExternalLink,
  X,
  UserRound
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
  const [profileMemberId, setProfileMemberId] = useState<string | undefined>(undefined);
  const [isProfileClosing, setIsProfileClosing] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  
  const membersSectionRef = useRef<HTMLDivElement>(null);
  const researchSectionRef = useRef<HTMLDivElement>(null);
  const profileCloseTimeoutRef = useRef<number | null>(null);

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

  const handleViewMemberProfile = (memberId: string) => {
    if (profileCloseTimeoutRef.current) {
      window.clearTimeout(profileCloseTimeoutRef.current);
      profileCloseTimeoutRef.current = null;
    }
    setIsProfileClosing(false);
    setProfileMemberId(memberId);
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

  const profileMember = profileMemberId
    ? MEMBERS.find((member) => member.id === profileMemberId)
    : undefined;

  const closeProfile = useCallback(() => {
    if (!profileMemberId || isProfileClosing) {
      return;
    }

    setIsProfileClosing(true);

    if (profileCloseTimeoutRef.current) {
      window.clearTimeout(profileCloseTimeoutRef.current);
    }

    const closeDelay = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 560;

    profileCloseTimeoutRef.current = window.setTimeout(() => {
      setProfileMemberId(undefined);
      setIsProfileClosing(false);
      profileCloseTimeoutRef.current = null;
    }, closeDelay);
  }, [isProfileClosing, profileMemberId]);

  useEffect(() => {
    if (!profileMember) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeProfile();
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [closeProfile, profileMember]);

  useEffect(() => () => {
    if (profileCloseTimeoutRef.current) {
      window.clearTimeout(profileCloseTimeoutRef.current);
    }
  }, []);

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
                  onViewProfile={handleViewMemberProfile}
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

      {profileMember && (
        <div
          className={`profile-modal-backdrop fixed inset-0 z-50 bg-white dark:bg-gray-950 ${
            isProfileClosing ? 'profile-modal-closing' : ''
          }`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="member-profile-title"
        >
          <div
            className="profile-modal-surface relative h-screen w-full overflow-y-auto bg-white p-6 dark:bg-gray-950 md:p-12 lg:p-16 xl:p-24"
          >
            <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
              <svg
                className="profile-octa-bloom absolute left-1/2 top-1/2 h-[min(82vw,760px)] w-[min(82vw,760px)] -translate-x-1/2 -translate-y-1/2 text-pink-500/20 dark:text-pink-300/18"
                viewBox="0 0 420 420"
                fill="none"
              >
                <path d="M210 42 350 210 210 378 70 210Z" stroke="currentColor" strokeWidth="1.5" />
                <path d="M210 42 210 378M70 210 350 210M210 42 70 210M210 42 350 210M210 378 70 210M210 378 350 210" stroke="currentColor" strokeWidth="1.5" />
                <path d="M210 92 304 210 210 328 116 210Z" stroke="currentColor" strokeWidth="1" opacity="0.55" />
              </svg>
              <div className="profile-facet profile-facet-a" />
              <div className="profile-facet profile-facet-b" />
              <div className="profile-facet profile-facet-c" />
            </div>

            <button
              type="button"
              onPointerDown={(event) => {
                if (event.pointerType !== 'mouse' || event.button === 0) {
                  closeProfile();
                }
              }}
              onClick={closeProfile}
              className="profile-close-button fixed right-4 top-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full border border-pink-100 bg-white text-gray-500 shadow-sm transition-colors hover:bg-pink-50 hover:text-pink-700 dark:border-pink-900/50 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-pink-950/30 dark:hover:text-pink-300"
              aria-label="Close profile"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="profile-modal-content relative grid min-h-full w-full content-center gap-10 pr-0 md:grid-cols-[minmax(0,1fr)_minmax(20rem,26rem)] md:items-center md:gap-16 md:pr-8 xl:gap-24">
              <div className="profile-copy max-w-5xl space-y-8">
                <div className="space-y-4">
                  <div className="profile-chip inline-flex items-center gap-1.5 rounded-full bg-pink-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-pink-600 dark:bg-pink-950/30 dark:text-pink-300">
                    <UserRound className="h-3.5 w-3.5" />
                    Complete Profile
                  </div>
                  <div>
                    <h3 id="member-profile-title" className="text-4xl font-semibold tracking-tight text-gray-900 dark:text-white md:text-6xl xl:text-7xl">
                      {profileMember.name}
                    </h3>
                    <p className="mt-3 text-base font-medium text-pink-600 dark:text-pink-400 md:text-lg">
                      {profileMember.role}
                    </p>
                  </div>
                </div>

                <p className="max-w-4xl text-lg font-light leading-relaxed text-gray-600 dark:text-gray-300 md:text-xl">
                  {profileMember.bio}
                </p>

                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                    Interests
                  </h4>
                  <div className="flex flex-wrap gap-3">
                    {profileMember.researchInterests.map((interest) => (
                      <span
                        key={interest}
                        className="rounded-xl border border-pink-100/60 bg-pink-50/70 px-4 py-2 text-sm text-pink-700 dark:border-pink-900/40 dark:bg-pink-950/30 dark:text-pink-300 md:text-base"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="profile-action-rail space-y-4">
                <button
                  type="button"
                  onClick={() => {
                    setProfileMemberId(undefined);
                    handleSelectMemberForPapers(profileMember.id);
                  }}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-pink-600 px-5 py-4 text-base font-semibold text-white shadow-sm shadow-pink-500/15 transition-colors hover:bg-pink-700"
                >
                  <BookOpen className="h-4 w-4" />
                  View Publications
                </button>

                {profileMember.email && (
                  <a
                    href={`mailto:${profileMember.email}`}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-pink-100 bg-white px-5 py-4 text-base font-semibold text-gray-600 transition-colors hover:bg-pink-50 hover:text-pink-700 dark:border-pink-900/50 dark:bg-gray-950 dark:text-gray-300 dark:hover:bg-pink-950/30 dark:hover:text-pink-300"
                  >
                    <Mail className="h-4 w-4" />
                    Email
                  </a>
                )}

                {profileMember.github && (
                  <a
                    href={`https://github.com/${profileMember.github}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-pink-100 bg-white px-5 py-4 text-base font-semibold text-gray-600 transition-colors hover:bg-pink-50 hover:text-pink-700 dark:border-pink-900/50 dark:bg-gray-950 dark:text-gray-300 dark:hover:bg-pink-950/30 dark:hover:text-pink-300"
                  >
                    <Github className="h-4 w-4" />
                    GitHub
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}

                {profileMember.googleScholarId && (
                  <a
                    href={`https://scholar.google.com/citations?user=${profileMember.googleScholarId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-pink-100 bg-white px-5 py-4 text-base font-semibold text-gray-600 transition-colors hover:bg-pink-50 hover:text-pink-700 dark:border-pink-900/50 dark:bg-gray-950 dark:text-gray-300 dark:hover:bg-pink-950/30 dark:hover:text-pink-300"
                  >
                    <GraduationCap className="h-4 w-4" />
                    Scholar
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}

                {profileMember.dblpPid && (
                  <a
                    href={`https://dblp.org/pid/${profileMember.dblpPid}.html`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-pink-100 bg-white px-5 py-4 text-base font-semibold text-gray-600 transition-colors hover:bg-pink-50 hover:text-pink-700 dark:border-pink-900/50 dark:bg-gray-950 dark:text-gray-300 dark:hover:bg-pink-950/30 dark:hover:text-pink-300"
                  >
                    <BookOpen className="h-4 w-4" />
                    DBLP
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

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
          </div>

          {/* Publications List Component */}
          <ResearchPortal selectedMemberId={selectedMemberId} onClearMemberFilter={handleClearMemberPaperFilter} />

        </div>
      </section>

      {/* Apple-Style Parchment/Rose Footer */}
      <footer id="footer" className="bg-[#f5f5f7] dark:bg-gray-950 border-t border-pink-100/30 dark:border-pink-950/40 text-gray-500 dark:text-gray-400 py-12 px-6 md:px-12 transition-colors duration-300">
        <div className="max-w-3xl mx-auto space-y-6 text-center">
              <p>© 2026 Pianura Carlo.</p>
        </div>
      </footer>
    </div>
  );
}

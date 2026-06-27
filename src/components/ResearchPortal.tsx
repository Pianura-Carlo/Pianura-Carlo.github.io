import React, { useState, useEffect } from 'react';
import { Paper, Member } from '../types';
import { CURATED_PAPERS, MEMBERS } from '../data';
import { Search, RotateCw, AlertCircle, FileText, ExternalLink, Calendar, BookOpen, Layers, Sparkles } from 'lucide-react';

interface ResearchPortalProps {
  selectedMemberId?: string;
}

export default function ResearchPortal({ selectedMemberId }: ResearchPortalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAuthor, setSelectedAuthor] = useState(selectedMemberId || 'all');
  const [papers, setPapers] = useState<Paper[]>(CURATED_PAPERS);
  const [livePapers, setLivePapers] = useState<Paper[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [apiLogs, setApiLogs] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'curated' | 'live'>('curated');
  const [error, setError] = useState<string | null>(null);

  // Reconstruct abstracts from OpenAlex inverted index
  const reconstructAbstract = (invertedIndex: Record<string, number[]>): string => {
    if (!invertedIndex) return '';
    try {
      const words: string[] = [];
      Object.entries(invertedIndex).forEach(([word, positions]) => {
        positions.forEach((pos) => {
          words[pos] = word;
        });
      });
      return words.filter(Boolean).join(' ');
    } catch {
      return 'Abstract reconstruction failed.';
    }
  };

  // Keep selected author dropdown in sync when props change
  useEffect(() => {
    if (selectedMemberId) {
      setSelectedAuthor(selectedMemberId);
      // Auto-crawl for that member!
      crawlMemberPapers(selectedMemberId);
    }
  }, [selectedMemberId]);

  const addLog = (msg: string) => {
    setApiLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`].slice(-6));
  };

  // Live crawler across OpenAlex and Semantic Scholar
  const crawlMemberPapers = async (authorId: string) => {
    setIsLoading(true);
    setError(null);
    setApiLogs([]);
    setLivePapers([]);

    const authorsToSearch: Member[] = authorId === 'all' 
      ? MEMBERS 
      : MEMBERS.filter(m => m.id === authorId);

    addLog(`Initiating academic crawler for ${authorsToSearch.length} member(s)...`);

    try {
      const allFetchedPapers: Paper[] = [];

      for (const member of authorsToSearch) {
        addLog(`Querying OpenAlex database for "${member.name}"...`);
        
        // OpenAlex API call (No key required, CORS friendly)
        const openAlexUrl = `https://api.openalex.org/works?filter=author.display_name.search:${encodeURIComponent(member.name)}&limit=8`;
        
        try {
          const res = await fetch(openAlexUrl);
          if (res.ok) {
            const data = await res.json();
            addLog(`OpenAlex returned ${data.results.length} raw matching works.`);
            
            const processed = data.results.map((work: any) => {
              const authors = work.authorships?.map((a: any) => a.author?.display_name).join(', ') || member.name;
              const hasActualMember = work.authorships?.some((a: any) => {
                const name = a.author?.display_name?.toLowerCase() || '';
                return name.includes(member.name.toLowerCase());
              });

              // Reconstruct abstract from inverted index
              let abstract = 'Abstract not available.';
              if (work.abstract_inverted_index) {
                abstract = reconstructAbstract(work.abstract_inverted_index);
                if (abstract.length > 250) {
                  abstract = abstract.slice(0, 250) + '...';
                }
              }

              return {
                id: `openalex-${work.id.split('/').pop()}`,
                title: work.title || 'Untitled Work',
                authors,
                year: work.publication_year || new Date().getFullYear(),
                journal: work.primary_location?.source?.display_name || work.host_venue?.name || 'Conference Proceedings',
                doi: work.doi || null,
                pdfUrl: work.open_access?.oa_url || work.primary_location?.landing_page_url || null,
                abstract,
                source: 'openalex' as const,
                isValid: hasActualMember // Filter out false positives
              };
            });

            // Filter out works where author is a false positive
            const validWorks = processed.filter((p: any) => p.isValid);
            allFetchedPapers.push(...validWorks);
            addLog(`Found ${validWorks.length} validated works for ${member.name} in OpenAlex.`);
          } else {
            addLog(`OpenAlex failed: ${res.statusText}`);
          }
        } catch (e: any) {
          addLog(`OpenAlex query error: ${e.message}`);
        }

        // Semantic Scholar API call (CORS friendly, limit 8)
        addLog(`Querying Semantic Scholar for "${member.name}"...`);
        const ssUrl = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(member.name)}&limit=8&fields=title,authors,year,venue,externalIds,abstract`;
        
        try {
          const res = await fetch(ssUrl);
          if (res.ok) {
            const data = await res.json();
            const results = data.data || [];
            addLog(`Semantic Scholar returned ${results.length} raw matches.`);
            
            const processed = results.map((work: any) => {
              const authors = work.authors?.map((a: any) => a.name).join(', ') || member.name;
              const hasActualMember = work.authors?.some((a: any) => {
                const name = a.name?.toLowerCase() || '';
                return name.includes(member.name.toLowerCase());
              });

              let abstract = work.abstract || 'Abstract not available.';
              if (abstract.length > 250) {
                abstract = abstract.slice(0, 250) + '...';
              }

              return {
                id: `ss-${work.paperId}`,
                title: work.title || 'Untitled Work',
                authors,
                year: work.year || new Date().getFullYear(),
                journal: work.venue || 'Academic Venue',
                doi: work.externalIds?.DOI ? `https://doi.org/${work.externalIds.DOI}` : null,
                pdfUrl: work.paperId ? `https://www.semanticscholar.org/paper/${work.paperId}` : null,
                abstract,
                source: 'semanticscholar' as const,
                isValid: hasActualMember
              };
            });

            const validWorks = processed.filter((p: any) => p.isValid);
            allFetchedPapers.push(...validWorks);
            addLog(`Found ${validWorks.length} validated works for ${member.name} in Semantic Scholar.`);
          } else {
            addLog(`Semantic Scholar query failed: ${res.statusText}`);
          }
        } catch (e: any) {
          addLog(`Semantic Scholar query error: ${e.message}`);
        }
      }

      // De-duplicate papers by lowercased title similarity or DOI
      const uniquePapersMap = new Map<string, Paper>();
      allFetchedPapers.forEach((p) => {
        const key = p.doi ? p.doi.toLowerCase() : p.title.toLowerCase().trim();
        if (!uniquePapersMap.has(key)) {
          uniquePapersMap.set(key, p);
        } else {
          // If already exists, prefer Semantic Scholar or OpenAlex with DOIs
          const existing = uniquePapersMap.get(key)!;
          if (!existing.doi && p.doi) {
            uniquePapersMap.set(key, p);
          }
        }
      });

      const uniquePapers = Array.from(uniquePapersMap.values());
      setLivePapers(uniquePapers);
      addLog(`Crawl complete. Total deduplicated validated works: ${uniquePapers.length}`);
      
      if (uniquePapers.length > 0) {
        setActiveTab('live');
      } else {
        addLog(`No dynamic indexed papers found for selected criteria. Showing curated records.`);
        setActiveTab('curated');
      }
    } catch (e: any) {
      setError(`Crawler failed to aggregate results: ${e.message}`);
      addLog(`Error: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter papers for curated tab
  const getFilteredCuratedPapers = () => {
    return CURATED_PAPERS.filter((paper) => {
      // search term filter
      const matchesSearch = paper.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            paper.authors.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            paper.abstract.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (selectedAuthor === 'all') return matchesSearch;
      
      // author filter - check if the author name exists inside paper.authors
      const member = MEMBERS.find(m => m.id === selectedAuthor);
      if (!member) return matchesSearch;
      
      const matchesAuthor = paper.authors.toLowerCase().includes(member.name.toLowerCase());
      return matchesSearch && matchesAuthor;
    });
  };

  // Filter papers for live tab
  const getFilteredLivePapers = () => {
    return livePapers.filter((paper) => {
      const matchesSearch = paper.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            paper.authors.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            paper.abstract.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (selectedAuthor === 'all') return matchesSearch;
      
      const member = MEMBERS.find(m => m.id === selectedAuthor);
      if (!member) return matchesSearch;
      
      const matchesAuthor = paper.authors.toLowerCase().includes(member.name.toLowerCase());
      return matchesSearch && matchesAuthor;
    });
  };

  const activePapers = activeTab === 'curated' ? getFilteredCuratedPapers() : getFilteredLivePapers();

  // Helper to highlight member names in the authors list
  const highlightGroupMembers = (authorsStr: string) => {
    const parts = authorsStr.split(/,\s*/);
    return parts.map((author, index) => {
      const isGroupMember = MEMBERS.some(m => author.toLowerCase().includes(m.name.toLowerCase()));
      return (
        <span key={index} className={isGroupMember ? 'font-semibold text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-950/40 px-1.5 py-0.5 rounded' : 'text-gray-600 dark:text-gray-400'}>
          {author}
          {index < parts.length - 1 ? ', ' : ''}
        </span>
      );
    });
  };

  return (
    <div id="research-portal" className="w-full">
      {/* Search Header Configurator Panel */}
      <div className="bg-white dark:bg-gray-900 border border-pink-100 dark:border-pink-950/50 rounded-2xl p-6 mb-8 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          {/* Search text input */}
          <div className="md:col-span-1">
            <label htmlFor="search-input-field" className="block text-xs font-semibold uppercase tracking-wider text-pink-600 dark:text-pink-400 mb-2">Search Query</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pink-400" />
              <input
                id="search-input-field"
                type="text"
                placeholder="Topic, title, keywords..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-pink-50/30 dark:bg-pink-950/10 border border-pink-100 dark:border-pink-950/30 rounded-xl py-2.5 pl-10 pr-4 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>
          </div>

          {/* Member Filter Dropdown */}
          <div>
            <label htmlFor="author-dropdown-filter" className="block text-xs font-semibold uppercase tracking-wider text-pink-600 dark:text-pink-400 mb-2">Author (Member)</label>
            <select
              id="author-dropdown-filter"
              value={selectedAuthor}
              onChange={(e) => setSelectedAuthor(e.target.value)}
              className="w-full bg-pink-50/30 dark:bg-pink-950/10 border border-pink-100 dark:border-pink-950/30 rounded-xl py-2.5 px-4 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              <option value="all">All Members (Pianura Carlo)</option>
              {MEMBERS.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>

          {/* Crawl CTA Button */}
          <div className="flex gap-2">
            <button
              id="crawl-trigger-button"
              onClick={() => crawlMemberPapers(selectedAuthor)}
              disabled={isLoading}
              className="flex-1 bg-pink-600 hover:bg-pink-700 disabled:bg-pink-400 text-white rounded-xl py-2.5 px-4 text-sm font-semibold flex items-center justify-center gap-2 shadow-sm shadow-pink-600/10 transition-all duration-200 transform active:scale-95 cursor-pointer"
            >
              <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Crawling Databases...' : 'Sync Live Papers'}
            </button>
          </div>
        </div>

        {/* Live Logs Panel when loading or loaded */}
        {(isLoading || apiLogs.length > 0) && (
          <div id="live-crawl-logs" className="mt-4 bg-gray-950 border border-pink-950/50 rounded-xl p-4 font-mono text-xs text-pink-400">
            <div className="flex items-center justify-between mb-2 border-b border-pink-950/50 pb-1.5">
              <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px]">
                <Layers className="w-3.5 h-3.5 text-pink-500" /> academic-crawler-logs.sh
              </span>
              <span className="text-[10px] bg-pink-950 text-pink-400 px-1.5 py-0.5 rounded animate-pulse">
                {isLoading ? 'running' : 'idle'}
              </span>
            </div>
            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {apiLogs.map((log, i) => (
                <div key={i} className="leading-relaxed opacity-90">{log}</div>
              ))}
              {isLoading && (
                <div className="flex items-center gap-1 text-pink-500 font-bold mt-1">
                  <span className="animate-bounce">.</span>
                  <span className="animate-bounce delay-100">.</span>
                  <span className="animate-bounce delay-200">.</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Tabs Selector: Curated vs Live Discovered */}
      <div className="flex items-center border-b border-pink-100 dark:border-pink-950/30 mb-6">
        <button
          id="tab-curated-trigger"
          onClick={() => setActiveTab('curated')}
          className={`pb-3 px-4 font-semibold text-sm border-b-2 flex items-center gap-2 cursor-pointer transition-all ${
            activeTab === 'curated'
              ? 'border-pink-600 text-pink-600 dark:text-pink-400'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Curated Publications ({getFilteredCuratedPapers().length})
        </button>
        <button
          id="tab-live-trigger"
          onClick={() => {
            if (livePapers.length === 0 && !isLoading) {
              crawlMemberPapers(selectedAuthor);
            } else {
              setActiveTab('live');
            }
          }}
          className={`pb-3 px-4 font-semibold text-sm border-b-2 flex items-center gap-2 cursor-pointer transition-all ${
            activeTab === 'live'
              ? 'border-pink-600 text-pink-600 dark:text-pink-400'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Live Academic Finder ({getFilteredLivePapers().length})
        </button>
      </div>

      {/* error state */}
      {error && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-950/50 rounded-xl p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-red-800 dark:text-red-300">Crawler Query Interrupted</h4>
            <p className="text-xs text-red-700 dark:text-red-400 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Papers List */}
      <div className="space-y-6">
        {activePapers.length > 0 ? (
          activePapers.map((paper) => (
            <div
              key={paper.id}
              className="bg-white dark:bg-gray-900 border border-pink-50 dark:border-pink-950/30 hover:border-pink-200 dark:hover:border-pink-800/50 rounded-2xl p-6 transition-all duration-300 hover:shadow-md group"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-2">
                  {/* Title */}
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white leading-snug group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">
                    {paper.title}
                  </h3>
                  
                  {/* Authors list highlighted */}
                  <div className="text-sm flex flex-wrap gap-y-1 items-center gap-1.5">
                    {highlightGroupMembers(paper.authors)}
                  </div>

                  {/* Metadata labels */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400 pt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-pink-400" />
                      {paper.year}
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5 text-pink-400" />
                      {paper.journal}
                    </span>
                    <span className="capitalize bg-pink-50 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400 px-2 py-0.5 rounded text-[10px] tracking-wider uppercase font-mono font-semibold">
                      Source: {paper.source === 'curated' ? 'Group Record' : paper.source}
                    </span>
                  </div>
                </div>

                {/* PDF/DOI Action links */}
                <div className="flex sm:flex-col gap-2 shrink-0">
                  {paper.doi && (
                    <a
                      href={paper.doi.startsWith('http') ? paper.doi : `https://doi.org/${paper.doi}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-pink-600 dark:text-pink-400 hover:text-pink-700 bg-pink-50 dark:bg-pink-950/30 border border-pink-100 dark:border-pink-900/50 px-3 py-1.5 rounded-xl flex items-center justify-center gap-1 font-semibold transition-all"
                    >
                      <ExternalLink className="w-3 h-3" />
                      DOI Link
                    </a>
                  )}
                  {paper.pdfUrl && (
                    <a
                      href={paper.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-white bg-pink-600 hover:bg-pink-700 px-3 py-1.5 rounded-xl flex items-center justify-center gap-1 font-semibold shadow-sm transition-all shadow-pink-600/10"
                    >
                      <FileText className="w-3 h-3" />
                      View Paper
                    </a>
                  )}
                </div>
              </div>

              {/* Abstract Drawer */}
              <div className="mt-4 pt-4 border-t border-pink-50 dark:border-pink-950/20">
                <h5 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-widest mb-1.5">Abstract / Overview</h5>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed font-light italic">
                  "{paper.abstract}"
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-16 bg-pink-50/10 dark:bg-pink-950/5 border border-dashed border-pink-200 dark:border-pink-900/30 rounded-2xl">
            <Search className="w-8 h-8 text-pink-300 mx-auto mb-3" />
            <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">No Publications Match Selected Filters</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
              {activeTab === 'live' 
                ? 'Try clicking "Sync Live Papers" to query international academic databases in real time for this member.'
                : 'Try clearing search tags or checking different authors in our record library.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

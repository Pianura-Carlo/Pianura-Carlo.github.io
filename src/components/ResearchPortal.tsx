import React, { useState } from 'react';
import { Paper } from '../types';
import { MEMBERS } from '../data';
import { RotateCw, AlertCircle, FileText, ExternalLink, Calendar, BookOpen, Sparkles, Search, X } from 'lucide-react';
import { isLikelySameAuthor } from '../paperCrawler';

interface ResearchPortalProps {
  papers: Paper[];
  isLoading: boolean;
  error: string | null;
}

export default function ResearchPortal({ papers, isLoading, error }: ResearchPortalProps) {
  const [publicationSearchQuery, setPublicationSearchQuery] = useState('');
  const normalizedSearchQuery = publicationSearchQuery.trim().toLowerCase();

  const visiblePapers = normalizedSearchQuery
    ? papers.filter((paper) => {
      const searchableText = `${paper.title} ${paper.authors}`.toLowerCase();
      return searchableText.includes(normalizedSearchQuery);
    })
    : papers;

  const sortedVisiblePapers = [...visiblePapers].sort((a, b) =>
    Number(b.featured === true) - Number(a.featured === true) ||
    b.year - a.year ||
    a.title.localeCompare(b.title)
  );

  const highlightGroupMembers = (authorsStr: string) => {
    const parts = authorsStr.split(/,\s*/);
    return parts.map((author, index) => {
      const isGroupMember = MEMBERS.some(m => isLikelySameAuthor(author, m.name));
      return (
        <span key={index} className="inline-flex items-baseline">
          <span className={isGroupMember ? 'font-semibold text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-950/40 px-1.5 py-0.5 rounded' : 'text-gray-600 dark:text-gray-400'}>
            {author}
          </span>
          {index < parts.length - 1 && (
            <span className={`${isGroupMember ? '-ml-0.5' : ''} text-gray-600 dark:text-gray-400`}>,</span>
          )}
        </span>
      );
    });
  };

  return (
    <div id="research-portal" className="w-full">
      <div className="flex flex-col gap-3 border-b border-pink-100 pb-4 mb-6 dark:border-pink-950/30 lg:flex-row lg:items-center lg:justify-between">
        <div className="text-sm font-semibold text-pink-600 dark:text-pink-400 flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          Publications ({visiblePapers.length}{normalizedSearchQuery ? ` of ${papers.length}` : ''})
        </div>
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center lg:w-auto">
          <div className="relative w-full sm:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-pink-400" />
            <input
              type="search"
              value={publicationSearchQuery}
              onChange={(event) => setPublicationSearchQuery(event.target.value)}
              placeholder="Search by title or author..."
              className="w-full rounded-lg border border-pink-100 bg-white py-2 pl-9 pr-9 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-500/30 dark:border-pink-950/40 dark:bg-gray-900 dark:text-white dark:focus:border-pink-800"
            />
            {publicationSearchQuery && (
              <button
                type="button"
                onClick={() => setPublicationSearchQuery('')}
                className="absolute right-2 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-pink-50 hover:text-pink-600 dark:hover:bg-pink-950/30 dark:hover:text-pink-300"
                aria-label="Clear publication search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          {isLoading && (
            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
              <RotateCw className="w-3.5 h-3.5 animate-spin text-pink-400" />
              Loading publications
            </div>
          )}
          {normalizedSearchQuery && visiblePapers.length > 0 && (
            <button
              type="button"
              onClick={() => setPublicationSearchQuery('')}
              className="inline-flex items-center justify-center gap-1.5 rounded-full border border-pink-100 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 transition-colors hover:border-pink-300 hover:bg-pink-50 hover:text-pink-700 dark:border-pink-900/50 dark:bg-gray-900 dark:text-gray-300 dark:hover:border-pink-800 dark:hover:bg-pink-950/30 dark:hover:text-pink-300"
            >
              <X className="w-3.5 h-3.5" />
              Clear Search
            </button>
          )}
        </div>
      </div>

      {/* error state */}
      {error && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-950/50 rounded-lg p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-red-800 dark:text-red-300">Publications Unavailable</h4>
            <p className="text-xs text-red-700 dark:text-red-400 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Papers List */}
      {visiblePapers.length > 0 && (
        <div className="space-y-6">
          {sortedVisiblePapers.map((paper) => (
            <div
              key={paper.id}
              className={`rounded-lg border p-6 transition-all duration-300 group ${
                paper.featured === true
                  ? 'bg-pink-50/70 dark:bg-pink-950/20 border-pink-200/80 dark:border-pink-900/60 hover:border-pink-300 dark:hover:border-pink-800 hover:shadow-md hover:shadow-pink-600/10'
                  : 'bg-white dark:bg-gray-900 border-pink-50 dark:border-pink-950/30 hover:border-pink-200 dark:hover:border-pink-800/50 hover:shadow-md'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-2">
                  {paper.featured === true && (
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-pink-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-white shadow-sm shadow-pink-700/10">
                      <Sparkles className="h-3 w-3" />
                      Featured
                    </div>
                  )}

                  {/* Title */}
                  <h3 className={`${paper.featured === true ? 'text-xl text-gray-950' : 'text-lg text-gray-900'} font-semibold dark:text-white leading-snug group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors`}>
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
                  </div>
                </div>

                {/* PDF/DOI Action links */}
                <div className="flex flex-wrap sm:flex-col gap-2 shrink-0">
                  {paper.doi && (
                    <a
                      href={paper.doi.startsWith('http') ? paper.doi : `https://doi.org/${paper.doi}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-pink-600 dark:text-pink-400 hover:text-pink-700 bg-pink-50 dark:bg-pink-950/30 border border-pink-100 dark:border-pink-900/50 px-3 py-1.5 rounded-lg flex items-center justify-center gap-1 font-semibold transition-all"
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
                      className="text-xs text-white bg-pink-600 hover:bg-pink-700 px-3 py-1.5 rounded-lg flex items-center justify-center gap-1 font-semibold shadow-sm transition-all shadow-pink-600/10"
                    >
                      <FileText className="w-3 h-3" />
                      View Paper
                    </a>
                  )}
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      {visiblePapers.length === 0 && (
        <div className="text-center py-16 bg-pink-50/10 dark:bg-pink-950/5 border border-dashed border-pink-200 dark:border-pink-900/30 rounded-lg">
          <BookOpen className="w-8 h-8 text-pink-300 mx-auto mb-3" />
          <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">No Publications Available</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
            {normalizedSearchQuery ? 'No publications match this title or author search.' : 'No publications are currently available.'}
          </p>
        </div>
      )}
    </div>
  );
}

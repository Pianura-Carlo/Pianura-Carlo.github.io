import React from 'react';
import { Member } from '../types';
import { ArrowUpRight, Crown, Github, GraduationCap, Mail } from 'lucide-react';

interface MemberCardProps {
  key?: string;
  member: Member;
  onViewProfile: (id: string) => void;
}

export default function MemberCard({ member, onViewProfile }: MemberCardProps) {
  const isFounder = member.role.toLowerCase().includes('founder');
  const displayRole = member.role
    .replace(/\bfounder\b,?\s*/i, '')
    .replace(/^,\s*/, '')
    .trim();
  const openProfile = () => onViewProfile(member.id);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openProfile();
    }
  };

  return (
    <div
      id={`member-card-${member.id}`}
      role="button"
      tabIndex={0}
      onClick={openProfile}
      onKeyDown={handleKeyDown}
      aria-label={`View complete profile for ${member.name}`}
      className={`relative overflow-hidden rounded-lg border p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-md group cursor-pointer focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 focus:ring-offset-[#fafafc] dark:focus:ring-offset-[#080a12] ${
        isFounder
          ? 'border-pink-300 bg-pink-50/30 shadow-md shadow-pink-500/10 hover:border-pink-400 dark:border-pink-800/80 dark:bg-pink-950/15 dark:shadow-pink-950/20 dark:hover:border-pink-700'
          : 'border-pink-50 bg-white shadow-sm hover:border-pink-300 dark:border-pink-950/20 dark:bg-gray-900 dark:hover:border-pink-800'
      }`}
    >
      {isFounder && (
        <div className="absolute inset-x-0 top-0 h-1 bg-pink-600 dark:bg-pink-500" aria-hidden="true" />
      )}

      <div
        className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg border border-pink-100/70 bg-white/80 text-pink-500 opacity-70 shadow-sm transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:border-pink-300 group-hover:bg-pink-50 group-hover:opacity-100 group-focus:translate-x-0.5 group-focus:-translate-y-0.5 group-focus:border-pink-300 group-focus:bg-pink-50 group-focus:opacity-100 dark:border-pink-900/40 dark:bg-gray-950/70 dark:text-pink-300 dark:group-hover:bg-pink-950/40 dark:group-focus:bg-pink-950/40"
        aria-hidden="true"
      >
        <ArrowUpRight className="h-4 w-4" />
      </div>

      <div className="space-y-4">
        {/* Profile Header */}
        <div className="flex items-start gap-3 pr-10">
          <div className="space-y-1">
            {isFounder && (
              <div className="inline-flex items-center gap-1 rounded-full border border-pink-200 bg-white/85 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-pink-600 shadow-sm shadow-pink-500/10 dark:border-pink-900/60 dark:bg-gray-950/70 dark:text-pink-300">
                <Crown className="h-3 w-3" />
                Founder
              </div>
            )}
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white leading-tight group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">
              {member.name}
            </h3>
            <p className="text-xs font-medium text-pink-600 dark:text-pink-400">
              {displayRole || member.role}
            </p>
          </div>
        </div>

        {/* Biography */}
        <p className="text-sm text-gray-600 dark:text-gray-300 font-light leading-relaxed">
          {member.bio}
        </p>

        {/* Research Interest Badges */}
        <div className="space-y-2">
          <h4 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
            Interests
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {member.researchInterests.map((interest, idx) => (
              <span
                key={idx}
                className="text-xs bg-pink-50/50 dark:bg-pink-950/30 text-pink-700 dark:text-pink-300 border border-pink-100/30 dark:border-pink-900/30 px-2 py-0.5 rounded-lg"
              >
                {interest}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Socials Footer */}
      <div className="mt-6 pt-4 border-t border-pink-50/50 dark:border-pink-950/10 flex flex-wrap items-center gap-2">
        {/* Contacts */}
        <div className="flex flex-wrap items-center gap-2">
          {member.email && (
            <a
              href={`mailto:${member.email}`}
              onClick={(event) => event.stopPropagation()}
              className="w-8 h-8 rounded-lg border border-pink-50 dark:border-pink-950/30 flex items-center justify-center text-gray-400 hover:text-pink-600 hover:bg-pink-50 dark:hover:bg-pink-950/30 transition-all"
              title={`Email ${member.name}`}
              aria-label={`Email ${member.name}`}
            >
              <Mail className="w-4 h-4" />
            </a>
          )}
          {member.github && (
            <a
              href={`https://github.com/${member.github}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(event) => event.stopPropagation()}
              className="w-8 h-8 rounded-lg border border-pink-50 dark:border-pink-950/30 flex items-center justify-center text-gray-400 hover:text-pink-600 hover:bg-pink-50 dark:hover:bg-pink-950/30 transition-all"
              title={`GitHub @${member.github}`}
              aria-label={`GitHub @${member.github}`}
            >
              <Github className="w-4 h-4" />
            </a>
          )}
          {member.googleScholarId && (
            <a
              href={`https://scholar.google.com/citations?user=${member.googleScholarId}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(event) => event.stopPropagation()}
              className="w-8 h-8 rounded-lg border border-pink-50 dark:border-pink-950/30 flex items-center justify-center text-gray-400 hover:text-pink-600 hover:bg-pink-50 dark:hover:bg-pink-950/30 transition-all"
              title={`${member.name} on Google Scholar`}
              aria-label={`${member.name} on Google Scholar`}
            >
              <GraduationCap className="w-4 h-4" />
            </a>
          )}
          {member.dblpPid && (
            <a
              href={`https://dblp.org/pid/${member.dblpPid}.html`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(event) => event.stopPropagation()}
              className="w-8 h-8 rounded-lg border border-pink-50 dark:border-pink-950/30 flex items-center justify-center text-gray-400 hover:text-pink-600 hover:bg-pink-50 dark:hover:bg-pink-950/30 transition-all"
              title={`${member.name} on DBLP`}
              aria-label={`${member.name} on DBLP`}
            >
              <span className="font-mono text-[8px] font-bold leading-none tracking-tight text-sky-700 dark:text-sky-300">
                DBLP
              </span>
            </a>
          )}
          {member.orcid && (
            <a
              href={`https://orcid.org/${member.orcid}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(event) => event.stopPropagation()}
              className="w-8 h-8 rounded-lg border border-pink-50 dark:border-pink-950/30 flex items-center justify-center text-gray-400 hover:text-pink-600 hover:bg-pink-50 dark:hover:bg-pink-950/30 transition-all"
              title={`${member.name} on ORCID`}
              aria-label={`${member.name} on ORCID`}
            >
              <span className="text-[13px] font-bold leading-none text-[#A6CE39]">
                iD
              </span>
            </a>
          )}
        </div>

      </div>
    </div>
  );
}

import React from 'react';
import { Member } from '../types';
import { Github, Mail, Search, Award } from 'lucide-react';

interface MemberCardProps {
  key?: string;
  member: Member;
  onSelectMember: (id: string) => void;
}

export default function MemberCard({ member, onSelectMember }: MemberCardProps) {
  return (
    <div
      id={`member-card-${member.id}`}
      className="bg-white dark:bg-gray-900 border border-pink-50 dark:border-pink-950/20 rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 hover:border-pink-300 dark:hover:border-pink-800 hover:-translate-y-1 shadow-sm hover:shadow-md group"
    >
      <div className="space-y-4">
        {/* Profile Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white leading-tight group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">
              {member.name}
            </h3>
            <p className="text-xs font-medium text-pink-600 dark:text-pink-400">
              {member.role}
            </p>
          </div>
          <div className="w-8 h-8 rounded-full bg-pink-50 dark:bg-pink-950/40 flex items-center justify-center text-pink-500 shrink-0">
            <Award className="w-4 h-4" />
          </div>
        </div>

        {/* Biography */}
        <p className="text-sm text-gray-600 dark:text-gray-300 font-light leading-relaxed">
          {member.bio}
        </p>

        {/* Research Interest Badges */}
        <div className="space-y-2">
          <h4 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
            Core Fields
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

      {/* Socials & Actions Footer */}
      <div className="mt-6 pt-4 border-t border-pink-50/50 dark:border-pink-950/10 flex items-center justify-between gap-2">
        {/* Contacts */}
        <div className="flex items-center gap-2">
          {member.email && (
            <a
              href={`mailto:${member.email}`}
              className="w-8 h-8 rounded-lg border border-pink-50 dark:border-pink-950/30 flex items-center justify-center text-gray-400 hover:text-pink-600 hover:bg-pink-50 dark:hover:bg-pink-950/30 transition-all"
              title={`Email ${member.name}`}
            >
              <Mail className="w-4 h-4" />
            </a>
          )}
          {member.github && (
            <a
              href={`https://github.com/${member.github}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-lg border border-pink-50 dark:border-pink-950/30 flex items-center justify-center text-gray-400 hover:text-pink-600 hover:bg-pink-50 dark:hover:bg-pink-950/30 transition-all"
              title={`GitHub @${member.github}`}
            >
              <Github className="w-4 h-4" />
            </a>
          )}
        </div>

        {/* Analyze Research Action */}
        <button
          onClick={() => onSelectMember(member.id)}
          className="text-xs font-semibold text-pink-600 dark:text-pink-400 hover:text-pink-700 hover:bg-pink-50 dark:hover:bg-pink-950/30 px-3 py-2 rounded-xl flex items-center gap-1 cursor-pointer transition-all border border-pink-100 dark:border-pink-900/30"
        >
          <Search className="w-3.5 h-3.5" />
          Find Papers
        </button>
      </div>
    </div>
  );
}

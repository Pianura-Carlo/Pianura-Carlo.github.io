export interface Member {
  id: string;
  name: string;
  role: string;
  bio: string;
  email?: string;
  github?: string;
  scholar?: string;
  researchInterests: string[];
  avatarUrl?: string;
}

export interface Paper {
  id: string;
  title: string;
  authors: string;
  year: number;
  journal: string;
  doi?: string;
  pdfUrl?: string;
  abstract: string;
  source: 'curated' | 'openalex' | 'semanticscholar';
}

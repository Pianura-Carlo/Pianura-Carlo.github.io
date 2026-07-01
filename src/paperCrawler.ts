import { Member, Paper } from './types';

export interface OpenAlexAuthor {
  id?: string;
  display_name?: string;
  raw_author_names?: string[];
}

export interface OpenAlexWork {
  id?: string;
  doi?: string | null;
  title?: string;
  display_name?: string;
  publication_year?: number;
  primary_location?: {
    landing_page_url?: string | null;
    pdf_url?: string | null;
    raw_source_name?: string | null;
    source?: {
      display_name?: string | null;
    } | null;
  } | null;
  best_oa_location?: {
    landing_page_url?: string | null;
    pdf_url?: string | null;
  } | null;
  open_access?: {
    oa_url?: string | null;
  } | null;
  authorships?: Array<{
    author?: {
      id?: string;
      display_name?: string;
    } | null;
    raw_author_name?: string;
  }>;
  abstract_inverted_index?: Record<string, number[]>;
}

export interface SemanticScholarPaper {
  paperId?: string;
  title?: string;
  authors?: Array<{ name?: string }>;
  year?: number;
  venue?: string;
  url?: string;
  externalIds?: {
    DOI?: string;
  };
  openAccessPdf?: {
    url?: string;
  } | null;
  abstract?: string | null;
}

export interface DblpPublication {
  id: string;
  title: string;
  authors: string;
  year: number;
  venue: string;
  url?: string;
}

export interface DblpSearchHit {
  info?: {
    authors?: {
      author?: Array<{ '@pid'?: string; text?: string }> | { '@pid'?: string; text?: string };
    };
    title?: string;
    venue?: string;
    year?: string;
    key?: string;
    ee?: string;
    url?: string;
  };
}

export interface DblpSearchResponse {
  result?: {
    hits?: {
      hit?: DblpSearchHit[] | DblpSearchHit;
    };
  };
}

const WORD_LIMIT = 250;

export const normalizeText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const nameTokens = (name: string) =>
  normalizeText(name)
    .split(' ')
    .filter((token) => token.length > 0);

const firstNameMatches = (candidateTokens: string[], firstName: string) =>
  candidateTokens.some((token) => token === firstName || token === firstName[0]);

export const isLikelySameAuthor = (candidateName: string, memberName: string) => {
  const candidateTokens = nameTokens(candidateName);
  const memberTokens = nameTokens(memberName);
  const firstName = memberTokens[0];
  const lastName = memberTokens[memberTokens.length - 1];

  if (!candidateTokens.length || !firstName || !lastName) {
    return false;
  }

  return candidateTokens.includes(lastName) && firstNameMatches(candidateTokens, firstName);
};

export const openAlexAuthorMatchesMember = (author: OpenAlexAuthor, member: Member) => {
  const names = [author.display_name, ...(author.raw_author_names || [])].filter(Boolean) as string[];
  return names.some((name) => isLikelySameAuthor(name, member.name));
};

export const workHasMemberAuthor = (work: OpenAlexWork, member: Member) =>
  (work.authorships || []).some((authorship) => {
    const names = [
      authorship.author?.display_name,
      authorship.raw_author_name,
    ].filter(Boolean) as string[];

    return names.some((name) => isLikelySameAuthor(name, member.name));
  });

export const reconstructAbstract = (invertedIndex?: Record<string, number[]>) => {
  if (!invertedIndex) return 'Abstract not available.';

  try {
    const words: string[] = [];
    Object.entries(invertedIndex).forEach(([word, positions]) => {
      positions.forEach((position) => {
        words[position] = word;
      });
    });

    const abstract = words.filter(Boolean).join(' ');
    return abstract || 'Abstract not available.';
  } catch {
    return 'Abstract reconstruction failed.';
  }
};

export const truncateAbstract = (abstract: string) =>
  abstract.length > WORD_LIMIT ? `${abstract.slice(0, WORD_LIMIT)}...` : abstract;

export const mapOpenAlexWork = (work: OpenAlexWork, member: Member): Paper => {
  const authors = work.authorships
    ?.map((authorship) => authorship.author?.display_name || authorship.raw_author_name)
    .filter(Boolean)
    .join(', ') || member.name;

  return {
    id: `openalex-${(work.id || crypto.randomUUID()).split('/').pop()}`,
    title: work.title || work.display_name || 'Untitled Work',
    authors,
    year: work.publication_year || new Date().getFullYear(),
    journal:
      work.primary_location?.source?.display_name ||
      work.primary_location?.raw_source_name ||
      'Academic Venue',
    doi: work.doi || undefined,
    pdfUrl:
      work.best_oa_location?.pdf_url ||
      work.primary_location?.pdf_url ||
      work.open_access?.oa_url ||
      work.best_oa_location?.landing_page_url ||
      work.primary_location?.landing_page_url ||
      undefined,
    abstract: truncateAbstract(reconstructAbstract(work.abstract_inverted_index)),
    source: 'openalex',
  };
};

export const mapSemanticScholarPaper = (paper: SemanticScholarPaper, member: Member): Paper => {
  const authors = paper.authors?.map((author) => author.name).filter(Boolean).join(', ') || member.name;

  return {
    id: `ss-${paper.paperId || crypto.randomUUID()}`,
    title: paper.title || 'Untitled Work',
    authors,
    year: paper.year || new Date().getFullYear(),
    journal: paper.venue || 'Academic Venue',
    doi: paper.externalIds?.DOI ? `https://doi.org/${paper.externalIds.DOI}` : undefined,
    pdfUrl: paper.openAccessPdf?.url || paper.url || (paper.paperId ? `https://www.semanticscholar.org/paper/${paper.paperId}` : undefined),
    abstract: truncateAbstract(paper.abstract || 'Abstract not available.'),
    source: 'semanticscholar',
  };
};

const arrayify = <T,>(value?: T[] | T) => {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
};

export const parseDblpSearchResponse = (response: DblpSearchResponse, member: Member) =>
  arrayify(response.result?.hits?.hit)
    .filter((hit) => arrayify(hit.info?.authors?.author).some((author) => author['@pid'] === member.dblpPid))
    .map((hit): DblpPublication => {
      const info = hit.info || {};
      const key = info.key || crypto.randomUUID();
      const authors = arrayify(info.authors?.author)
        .map((author) => author.text)
        .filter(Boolean)
        .join(', ');

      return {
        id: `dblp-${key}`,
        title: info.title || 'Untitled Work',
        authors,
        year: Number(info.year) || new Date().getFullYear(),
        venue: info.venue || 'DBLP',
        url: info.ee || info.url || `https://dblp.org/rec/${key}`,
      };
    });

export const mapDblpPublication = (publication: DblpPublication, member: Member): Paper => ({
  id: publication.id,
  title: publication.title,
  authors: publication.authors || member.name,
  year: publication.year,
  journal: publication.venue,
  pdfUrl: publication.url,
  abstract: 'Abstract not available from DBLP.',
  source: 'dblp',
});

const normalizeDoi = (doi: string) =>
  doi
    .toLowerCase()
    .replace(/^https?:\/\/(dx\.)?doi\.org\//, '')
    .trim();

export const paperIdentityKey = (paper: Paper) =>
  paper.doi ? `doi:${normalizeDoi(paper.doi)}` : `title:${normalizeText(paper.title)}`;

const authorCount = (authors: string) =>
  authors.split(/,\s*/).filter(Boolean).length;

const normalizeInvertedAuthorList = (authors: string) => {
  const parts = authors.split(',').map((part) => part.trim()).filter(Boolean);
  const singleTokenParts = parts.filter((part) => !part.includes(' ')).length;

  if (parts.length < 4 || parts.length % 2 !== 0 || singleTokenParts < parts.length / 2) {
    return authors;
  }

  const names: string[] = [];

  for (let index = 0; index < parts.length; index += 2) {
    names.push(`${parts[index + 1]} ${parts[index]}`);
  }

  return names.join(', ');
};

const preferAuthors = (existingAuthors: string, incomingAuthors: string) => {
  const normalizedExistingAuthors = normalizeInvertedAuthorList(existingAuthors);
  const normalizedIncomingAuthors = normalizeInvertedAuthorList(incomingAuthors);
  const existingCount = authorCount(normalizedExistingAuthors);
  const incomingCount = authorCount(normalizedIncomingAuthors);

  if (incomingCount > existingCount) {
    return normalizedIncomingAuthors;
  }

  if (incomingCount === existingCount && normalizedIncomingAuthors.length > normalizedExistingAuthors.length) {
    return normalizedIncomingAuthors;
  }

  return normalizedExistingAuthors;
};

export const dedupePapers = (papers: Paper[]) => {
  const uniquePapers: Paper[] = [];
  const doiIndex = new Map<string, number>();
  const titleIndex = new Map<string, number>();

  papers.forEach((paper) => {
    const doiKey = paper.doi ? `doi:${normalizeDoi(paper.doi)}` : undefined;
    const titleKey = `title:${normalizeText(paper.title)}`;
    const existingIndex = doiKey !== undefined
      ? doiIndex.get(doiKey) ?? titleIndex.get(titleKey)
      : titleIndex.get(titleKey);

    if (existingIndex === undefined) {
      const newIndex = uniquePapers.length;
      uniquePapers.push(paper);
      titleIndex.set(titleKey, newIndex);

      if (doiKey) {
        doiIndex.set(doiKey, newIndex);
      }
      return;
    }

    const existing = uniquePapers[existingIndex];
    const mergedPaper = {
      ...existing,
      authors: preferAuthors(existing.authors, paper.authors),
      doi: existing.doi || paper.doi,
      pdfUrl: existing.pdfUrl || paper.pdfUrl,
      abstract: existing.abstract || paper.abstract,
      journal: existing.journal || paper.journal,
      featured: existing.featured || paper.featured,
    };

    uniquePapers[existingIndex] = mergedPaper;

    if (!existing.doi && paper.doi) {
      doiIndex.set(`doi:${normalizeDoi(paper.doi)}`, existingIndex);
    }
  });

  return uniquePapers;
};

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { MEMBERS } from '../src/data';
import { dedupePapers, normalizeText } from '../src/paperCrawler';
import { Paper } from '../src/types';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');
const publicationsPath = resolve(rootDir, 'public/publications.json');
const googleScholarPath = resolve(rootDir, 'public/google-scholar-publications.json');
const orcidPath = resolve(rootDir, 'public/orcid-publications.json');
const requestTimeoutMs = 15000;
const execFileAsync = promisify(execFile);

interface PublicationSnapshot {
  generatedAt: string;
  publications: Paper[];
}

interface OrcidValue {
  value?: string;
}

interface OrcidExternalId {
  'external-id-type'?: string;
  'external-id-value'?: string;
  'external-id-normalized'?: OrcidValue | null;
  'external-id-url'?: OrcidValue | null;
}

interface OrcidContributor {
  'credit-name'?: OrcidValue | null;
  'contributor-attributes'?: {
    'contributor-role'?: string | null;
  } | null;
}

interface OrcidWorkSummary {
  'put-code'?: number;
  title?: {
    title?: OrcidValue | null;
  };
  'external-ids'?: {
    'external-id'?: OrcidExternalId[];
  };
  url?: OrcidValue | null;
  type?: string;
  'publication-date'?: {
    year?: OrcidValue | null;
  };
  'journal-title'?: OrcidValue | null;
  contributors?: {
    contributor?: OrcidContributor[] | OrcidContributor;
  } | null;
}

interface OrcidWorkGroup {
  'work-summary'?: OrcidWorkSummary[];
}

interface OrcidWorksResponse {
  group?: OrcidWorkGroup[];
}

interface CrossrefWork {
  DOI?: string;
  title?: string[];
  author?: Array<{
    given?: string;
    family?: string;
    name?: string;
  }>;
}

interface CrossrefResponse {
  message?: {
    items?: CrossrefWork[];
  };
}

interface CrossrefWorkResponse {
  message?: CrossrefWork;
}

interface PublicationEnrichment {
  doi?: string;
  authors?: string;
}

const decodeXml = (value: string) =>
  value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

const decodeHtml = (value: string) =>
  decodeXml(value)
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)));

const stripTags = (html: string) =>
  decodeHtml(html.replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const readTag = (xml: string, tag: string) => {
  const match = xml.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`));
  return match ? decodeXml(match[1].replace(/<[^>]+>/g, '').trim()) : '';
};

const readAttr = (xml: string, attr: string) => {
  const match = xml.match(new RegExp(`${attr}="([^"]+)"`));
  return match ? decodeXml(match[1]) : '';
};

const readHtmlAttr = (html: string, attr: string) => {
  const match = html.match(new RegExp(`${attr}="([^"]+)"`));
  return match ? decodeHtml(match[1]) : '';
};

const doiUrl = (doi: string) => {
  const normalizedDoi = doi
    .replace(/^https?:\/\/(dx\.)?doi\.org\//i, '')
    .trim();

  return normalizedDoi ? `https://doi.org/${normalizedDoi}` : undefined;
};

const doiFromUrl = (url?: string) => {
  if (!url) {
    return undefined;
  }

  const match = url.match(/^https?:\/\/(?:dx\.)?doi\.org\/(.+)$/i);
  return match ? doiUrl(match[1]) : undefined;
};

const parseDblpPersonXml = (xml: string, member: (typeof MEMBERS)[number]) => {
  const records = Array.from(xml.matchAll(/<r>([\s\S]*?)<\/r>/g)).map((match) => match[1]);

  return records.map((record): Paper => {
    const key = readAttr(record, 'key') || `${member.id}-${readTag(record, 'title')}`;
    const authors = Array.from(record.matchAll(/<author(?:\s[^>]*)?>([\s\S]*?)<\/author>/g))
      .map((match) => decodeXml(match[1].replace(/<[^>]+>/g, '').trim()))
      .filter(Boolean)
      .join(', ');
    const title = readTag(record, 'title') || 'Untitled Work';
    const year = Number(readTag(record, 'year')) || new Date().getFullYear();
    const journal = readTag(record, 'booktitle') || readTag(record, 'journal') || readTag(record, 'publisher') || 'Preprint';
    const pdfUrl = readTag(record, 'ee') || `https://dblp.org/rec/${key}`;
    const doi = doiFromUrl(pdfUrl);

    return {
      id: `dblp-${key}`,
      title,
      authors: authors || member.name,
      year,
      journal,
      doi,
      pdfUrl,
      abstract: '',
      source: 'dblp',
    };
  });
};

const fetchDblpPublications = async (member: (typeof MEMBERS)[number]) => {
  if (!member.dblpPid) {
    return [];
  }

  const { stdout } = await execFileAsync('curl', [
    '-fsSL',
    '--max-time',
    String(Math.ceil(requestTimeoutMs / 1000)),
    `https://dblp.org/pid/${member.dblpPid}.xml`,
  ], {
    maxBuffer: 10 * 1024 * 1024,
  });

  return parseDblpPersonXml(stdout, member);
};

const parseGoogleScholarProfileHtml = (html: string, member: (typeof MEMBERS)[number]) => {
  const rows = Array.from(html.matchAll(/<tr class="gsc_a_tr">([\s\S]*?)<\/tr>/g)).map((match) => match[1]);

  return rows.map((row): Paper => {
    const titleMatch = row.match(/<a[^>]*class="gsc_a_at"[^>]*>([\s\S]*?)<\/a>/);
    const title = titleMatch ? stripTags(titleMatch[1]) : 'Untitled Work';
    const articleHref = titleMatch ? readHtmlAttr(titleMatch[0], 'href') : '';
    const metadata = Array.from(row.matchAll(/<div class="gs_gray">([\s\S]*?)<\/div>/g))
      .map((match) => stripTags(match[1]));
    const authors = metadata[0] || member.name;
    const venue = metadata[1]?.replace(/,\s*\d{4}$/, '').trim() || 'Preprint';
    const yearMatch = row.match(/<span class="gsc_a_h gsc_a_hc gs_ibl">(\d{4})<\/span>/);
    const year = yearMatch ? Number(yearMatch[1]) : new Date().getFullYear();
    const citationId = articleHref.match(/citation_for_view=([^&"]+)/)?.[1];
    const idSuffix = citationId || `${member.id}-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`;
    const pdfUrl = articleHref
      ? `https://scholar.google.com${decodeHtml(articleHref).startsWith('/') ? decodeHtml(articleHref) : `/${decodeHtml(articleHref)}`}`
      : undefined;

    return {
      id: `googlescholar-${idSuffix}`,
      title,
      authors,
      year,
      journal: venue,
      pdfUrl,
      abstract: 'Abstract not available from Google Scholar.',
      source: 'googlescholar',
    };
  });
};

const fetchGoogleScholarPublications = async (member: (typeof MEMBERS)[number]) => {
  if (!member.googleScholarId) {
    return [];
  }

  const { stdout } = await execFileAsync('curl', [
    '-fsSL',
    '--max-time',
    String(Math.ceil(requestTimeoutMs / 1000)),
    '-A',
    'Mozilla/5.0',
    `https://scholar.google.com/citations?user=${member.googleScholarId}&hl=en&cstart=0&pagesize=100`,
  ], {
    maxBuffer: 10 * 1024 * 1024,
  });

  return parseGoogleScholarProfileHtml(stdout, member);
};

const formatCrossrefAuthors = (work?: CrossrefWork) => {
  const authors = work?.author
    ?.map((author) => author.name || [author.given, author.family].filter(Boolean).join(' '))
    .filter(Boolean);

  return authors?.length ? Array.from(new Set(authors)).join(', ') : undefined;
};

const crossrefEnrichmentForTitle = async (title: string): Promise<PublicationEnrichment | undefined> => {
  const response = await fetch(`https://api.crossref.org/works?query.title=${encodeURIComponent(title)}&rows=5&select=DOI,title,author`, {
    headers: {
      'User-Agent': 'Pianura-Carlo.github.io publication enrichment',
    },
    signal: AbortSignal.timeout(requestTimeoutMs),
  });

  if (!response.ok) {
    throw new Error(`Crossref returned ${response.status} ${response.statusText}`);
  }

  const data = await response.json() as CrossrefResponse;
  const titleKey = normalizeText(title);
  const match = data.message?.items?.find((item) =>
    item.DOI && item.title?.some((candidateTitle) => normalizeText(candidateTitle) === titleKey)
  );

  if (!match?.DOI) {
    return undefined;
  }

  return {
    doi: doiUrl(match.DOI),
    authors: formatCrossrefAuthors(match),
  };
};

const crossrefEnrichmentForDoi = async (doi: string): Promise<PublicationEnrichment | undefined> => {
  const normalizedDoi = doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, '').trim();
  const response = await fetch(`https://api.crossref.org/works/${encodeURIComponent(normalizedDoi)}`, {
    headers: {
      'User-Agent': 'Pianura-Carlo.github.io publication enrichment',
    },
    signal: AbortSignal.timeout(requestTimeoutMs),
  });

  if (!response.ok) {
    throw new Error(`Crossref returned ${response.status} ${response.statusText}`);
  }

  const data = await response.json() as CrossrefWorkResponse;

  return {
    doi: doiUrl(normalizedDoi),
    authors: formatCrossrefAuthors(data.message),
  };
};

const titleEnrichmentCache = new Map<string, PublicationEnrichment | undefined>();
const doiEnrichmentCache = new Map<string, PublicationEnrichment | undefined>();

const hasTruncatedAuthors = (authors: string) =>
  authors.includes('...');

const withEnrichment = (paper: Paper, enrichment?: PublicationEnrichment) => ({
  ...paper,
  doi: paper.doi || enrichment?.doi,
  authors: hasTruncatedAuthors(paper.authors) && enrichment?.authors ? enrichment.authors : paper.authors,
});

const enrichPublication = async (paper: Paper): Promise<Paper> => {
  const urlDoi = doiFromUrl(paper.pdfUrl);
  let enrichedPaper = urlDoi && !paper.doi
    ? {
      ...paper,
      doi: urlDoi,
    }
    : paper;

  if (enrichedPaper.doi && hasTruncatedAuthors(enrichedPaper.authors)) {
    const doiKey = enrichedPaper.doi.toLowerCase();

    try {
      const cachedEnrichment = doiEnrichmentCache.has(doiKey)
        ? doiEnrichmentCache.get(doiKey)
        : await crossrefEnrichmentForDoi(enrichedPaper.doi);
      doiEnrichmentCache.set(doiKey, cachedEnrichment);
      enrichedPaper = withEnrichment(enrichedPaper, cachedEnrichment);
    } catch (error: any) {
      doiEnrichmentCache.set(doiKey, undefined);
      console.warn(`Skipping Crossref author enrichment for ${paper.title}: ${error.message}`);
    }
  }

  if (enrichedPaper.doi && !hasTruncatedAuthors(enrichedPaper.authors)) {
    return enrichedPaper;
  }

  const titleKey = normalizeText(enrichedPaper.title);

  if (titleEnrichmentCache.has(titleKey)) {
    const cachedEnrichment = titleEnrichmentCache.get(titleKey);

    return withEnrichment(enrichedPaper, cachedEnrichment);
  }

  try {
    const enrichment = await crossrefEnrichmentForTitle(enrichedPaper.title);
    titleEnrichmentCache.set(titleKey, enrichment);
    return withEnrichment(enrichedPaper, enrichment);
  } catch (error: any) {
    titleEnrichmentCache.set(titleKey, undefined);
    console.warn(`Skipping Crossref enrichment for ${paper.title}: ${error.message}`);
    return enrichedPaper;
  }
};

const enrichPublications = async (papers: Paper[]) => {
  const enrichedPapers: Paper[] = [];

  for (const paper of papers) {
    enrichedPapers.push(await enrichPublication(paper));
  }

  return enrichedPapers;
};

const orcidValue = (value?: OrcidValue | string | null) => {
  if (!value) {
    return '';
  }

  return typeof value === 'string' ? value : value.value || '';
};

const orcidExternalIds = (work: OrcidWorkSummary) =>
  work['external-ids']?.['external-id'] || [];

const arrayify = <T,>(value?: T[] | T) => {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
};

const orcidDoi = (work: OrcidWorkSummary) => {
  const externalId = orcidExternalIds(work)
    .find((id) => id['external-id-type']?.toLowerCase() === 'doi');

  const doi = orcidValue(externalId?.['external-id-normalized'])
    || externalId?.['external-id-value']
    || '';

  if (!doi) {
    return undefined;
  }

  return doi.startsWith('http') ? doi : `https://doi.org/${doi}`;
};

const orcidWorkUrl = (work: OrcidWorkSummary) => {
  const doiUrl = orcidExternalIds(work)
    .find((id) => id['external-id-type']?.toLowerCase() === 'doi')?.['external-id-url'];

  return orcidValue(doiUrl) || orcidDoi(work) || orcidValue(work.url);
};

const preferOrcidWorkSummary = (summaries: OrcidWorkSummary[]) =>
  [...summaries].sort((a, b) => {
    const aScore = Number(Boolean(orcidDoi(a))) + Number(Boolean(orcidValue(a['journal-title']))) + Number(Boolean(orcidValue(a.url)));
    const bScore = Number(Boolean(orcidDoi(b))) + Number(Boolean(orcidValue(b['journal-title']))) + Number(Boolean(orcidValue(b.url)));
    return bScore - aScore;
  })[0];

const orcidAuthors = (work: OrcidWorkSummary, member: (typeof MEMBERS)[number]) => {
  const contributors = arrayify(work.contributors?.contributor);
  const authorContributors = contributors.filter((contributor) =>
    contributor['contributor-attributes']?.['contributor-role']?.toLowerCase() === 'author'
  );
  const contributorsToUse = authorContributors.length > 0 ? authorContributors : contributors;
  const names = contributorsToUse
    .map((contributor) => {
      const name = orcidValue(contributor['credit-name']);
      const [familyName, givenName, ...rest] = name.split(',').map((part) => part.trim());

      if (familyName && givenName && rest.length === 0) {
        return `${givenName} ${familyName}`;
      }

      return name;
    })
    .filter(Boolean);

  return Array.from(new Set(names)).join(', ') || member.name;
};

const mapOrcidWork = (work: OrcidWorkSummary, member: (typeof MEMBERS)[number]): Paper | undefined => {
  const title = orcidValue(work.title?.title);

  if (!title) {
    return undefined;
  }

  const doi = orcidDoi(work);
  const idSuffix = doi
    ? slugify(doi.replace(/^https?:\/\/(dx\.)?doi\.org\//, ''))
    : String(work['put-code'] || slugify(title));

  return {
    id: `orcid-${member.orcid}-${idSuffix}`,
    title,
    authors: orcidAuthors(work, member),
    year: Number(orcidValue(work['publication-date']?.year)) || new Date().getFullYear(),
    journal: orcidValue(work['journal-title']) || work.type || 'ORCID',
    doi,
    pdfUrl: orcidWorkUrl(work),
    abstract: 'Abstract not available from ORCID.',
    source: 'orcid',
  };
};

const fetchOrcidWorkDetail = async (member: (typeof MEMBERS)[number], work: OrcidWorkSummary) => {
  if (!member.orcid || !work['put-code']) {
    return work;
  }

  const response = await fetch(`https://pub.orcid.org/v3.0/${member.orcid}/work/${work['put-code']}`, {
    headers: {
      Accept: 'application/json',
    },
    signal: AbortSignal.timeout(requestTimeoutMs),
  });

  if (!response.ok) {
    throw new Error(`ORCID work ${work['put-code']} returned ${response.status} ${response.statusText}`);
  }

  return await response.json() as OrcidWorkSummary;
};

const fetchOrcidPublications = async (member: (typeof MEMBERS)[number]) => {
  if (!member.orcid) {
    return [];
  }

  const response = await fetch(`https://pub.orcid.org/v3.0/${member.orcid}/works`, {
    headers: {
      Accept: 'application/json',
    },
    signal: AbortSignal.timeout(requestTimeoutMs),
  });

  if (!response.ok) {
    throw new Error(`ORCID returned ${response.status} ${response.statusText}`);
  }

  const data = await response.json() as OrcidWorksResponse;

  const summaries = (data.group || [])
    .map((group) => preferOrcidWorkSummary(group['work-summary'] || []))
    .filter(Boolean);
  const works = await Promise.all(summaries.map(async (summary) => {
    try {
      return await fetchOrcidWorkDetail(member, summary);
    } catch (error: any) {
      console.warn(`Skipping ORCID contributors for ${member.name}: ${error.message}`);
      return summary;
    }
  }));

  return works
    .map((work) => mapOrcidWork(work, member))
    .filter(Boolean) as Paper[];
};

const readGoogleScholarSnapshot = async () => {
  if (!existsSync(googleScholarPath)) {
    return [];
  }

  const raw = await readFile(googleScholarPath, 'utf8');
  const parsed = JSON.parse(raw) as { publications?: Paper[] } | Paper[];
  return Array.isArray(parsed) ? parsed : parsed.publications || [];
};

const readOrcidSnapshot = async () => {
  if (!existsSync(orcidPath)) {
    return [];
  }

  const raw = await readFile(orcidPath, 'utf8');
  const parsed = JSON.parse(raw) as { publications?: Paper[] } | Paper[];
  return Array.isArray(parsed) ? parsed : parsed.publications || [];
};

const readPreviousSnapshot = async () => {
  if (!existsSync(publicationsPath)) {
    return [];
  }

  const raw = await readFile(publicationsPath, 'utf8');
  const parsed = JSON.parse(raw) as { publications?: Paper[] } | Paper[];
  return Array.isArray(parsed) ? parsed : parsed.publications || [];
};

const main = async () => {
  const dblpPublications: Paper[] = [];
  const googleScholarPublications: Paper[] = [];
  const orcidPublications: Paper[] = [];

  for (const member of MEMBERS) {
    try {
      dblpPublications.push(...await fetchDblpPublications(member));
    } catch (error: any) {
      console.warn(`Skipping ${member.name}: ${error.message}`);
    }

    try {
      googleScholarPublications.push(...await fetchGoogleScholarPublications(member));
    } catch (error: any) {
      console.warn(`Skipping Google Scholar for ${member.name}: ${error.message}`);
    }

    try {
      orcidPublications.push(...await fetchOrcidPublications(member));
    } catch (error: any) {
      console.warn(`Skipping ORCID for ${member.name}: ${error.message}`);
    }
  }

  const previousPublications = await readPreviousSnapshot();
  const previousGoogleScholarPublications = await readGoogleScholarSnapshot();
  const previousOrcidPublications = await readOrcidSnapshot();
  const enrichedGoogleScholarPublications = await enrichPublications([...previousGoogleScholarPublications, ...googleScholarPublications]);
  const enrichedOrcidPublications = await enrichPublications([...previousOrcidPublications, ...orcidPublications]);
  const enrichedDblpPublications = await enrichPublications(dblpPublications);
  const enrichedPreviousPublications = await enrichPublications(previousPublications);
  const googleScholarSnapshotPublications = dedupePapers(enrichedGoogleScholarPublications)
    .sort((a, b) => b.year - a.year || a.title.localeCompare(b.title));
  const orcidSnapshotPublications = dedupePapers(enrichedOrcidPublications)
    .sort((a, b) => b.year - a.year || a.title.localeCompare(b.title));
  const publications = dedupePapers([...enrichedPreviousPublications, ...enrichedDblpPublications, ...googleScholarSnapshotPublications, ...orcidSnapshotPublications])
    .sort((a, b) => b.year - a.year || a.title.localeCompare(b.title));

  const snapshot: PublicationSnapshot = {
    generatedAt: new Date().toISOString(),
    publications,
  };

  await mkdir(dirname(publicationsPath), { recursive: true });
  await writeFile(googleScholarPath, `${JSON.stringify({
    generatedAt: snapshot.generatedAt,
    publications: googleScholarSnapshotPublications,
  }, null, 2)}\n`);
  await writeFile(orcidPath, `${JSON.stringify({
    generatedAt: snapshot.generatedAt,
    publications: orcidSnapshotPublications,
  }, null, 2)}\n`);
  await writeFile(publicationsPath, `${JSON.stringify(snapshot, null, 2)}\n`);

  console.log(`Wrote ${googleScholarSnapshotPublications.length} Google Scholar publication(s) to ${googleScholarPath}`);
  console.log(`Wrote ${orcidSnapshotPublications.length} ORCID publication(s) to ${orcidPath}`);
  console.log(`Wrote ${publications.length} publication(s) to ${publicationsPath}`);
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

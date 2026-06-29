import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { MEMBERS } from '../src/data';
import { dedupePapers } from '../src/paperCrawler';
import { Paper } from '../src/types';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');
const publicationsPath = resolve(rootDir, 'public/publications.json');
const googleScholarPath = resolve(rootDir, 'public/google-scholar-publications.json');
const requestTimeoutMs = 15000;
const execFileAsync = promisify(execFile);

interface PublicationSnapshot {
  generatedAt: string;
  publications: Paper[];
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

    return {
      id: `dblp-${key}`,
      title,
      authors: authors || member.name,
      year,
      journal,
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

const readGoogleScholarSnapshot = async () => {
  if (!existsSync(googleScholarPath)) {
    return [];
  }

  const raw = await readFile(googleScholarPath, 'utf8');
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
  }

  const previousPublications = await readPreviousSnapshot();
  const previousGoogleScholarPublications = await readGoogleScholarSnapshot();
  const googleScholarSnapshotPublications = dedupePapers([...previousGoogleScholarPublications, ...googleScholarPublications])
    .sort((a, b) => b.year - a.year || a.title.localeCompare(b.title));
  const publications = dedupePapers([...previousPublications, ...dblpPublications, ...googleScholarSnapshotPublications])
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
  await writeFile(publicationsPath, `${JSON.stringify(snapshot, null, 2)}\n`);

  console.log(`Wrote ${googleScholarSnapshotPublications.length} Google Scholar publication(s) to ${googleScholarPath}`);
  console.log(`Wrote ${publications.length} publication(s) to ${publicationsPath}`);
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

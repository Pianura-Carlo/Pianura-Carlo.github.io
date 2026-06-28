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

const readTag = (xml: string, tag: string) => {
  const match = xml.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`));
  return match ? decodeXml(match[1].replace(/<[^>]+>/g, '').trim()) : '';
};

const readAttr = (xml: string, attr: string) => {
  const match = xml.match(new RegExp(`${attr}="([^"]+)"`));
  return match ? decodeXml(match[1]) : '';
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
    const journal = readTag(record, 'booktitle') || readTag(record, 'journal') || readTag(record, 'publisher') || 'DBLP';
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

const readGoogleScholarSnapshot = async () => {
  if (!existsSync(googleScholarPath)) {
    return [];
  }

  const raw = await readFile(googleScholarPath, 'utf8');
  const parsed = JSON.parse(raw) as { publications?: Paper[] } | Paper[];
  return Array.isArray(parsed) ? parsed : parsed.publications || [];
};

const main = async () => {
  const dblpPublications: Paper[] = [];

  for (const member of MEMBERS) {
    try {
      dblpPublications.push(...await fetchDblpPublications(member));
    } catch (error: any) {
      console.warn(`Skipping ${member.name}: ${error.message}`);
    }
  }

  const googleScholarPublications = await readGoogleScholarSnapshot();
  const publications = dedupePapers([...dblpPublications, ...googleScholarPublications])
    .sort((a, b) => b.year - a.year || a.title.localeCompare(b.title));

  const snapshot: PublicationSnapshot = {
    generatedAt: new Date().toISOString(),
    publications,
  };

  await mkdir(dirname(publicationsPath), { recursive: true });
  await writeFile(publicationsPath, `${JSON.stringify(snapshot, null, 2)}\n`);

  console.log(`Wrote ${publications.length} publication(s) to ${publicationsPath}`);
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

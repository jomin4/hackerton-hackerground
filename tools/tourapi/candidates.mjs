import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const draftPath = resolve(root, '.data-draft', 'tourapi-cheongdo.json');
const outputPath = resolve(root, '.data-draft', 'candidates.md');
const kinds = ['spot', 'restaurant', 'cafe'];

function asArray(value) {
  if (value === '' || value == null) return [];
  return Array.isArray(value) ? value : [value];
}

function asText(value) {
  return value == null ? '' : String(value);
}

function stripHtml(value) {
  return asText(value)
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function classify(item) {
  const contentTypeId = asText(item.list?.contenttypeid);
  const title = asText(item.list?.title);

  if (contentTypeId === '12' || contentTypeId === '14') return 'spot';
  if (contentTypeId === '28') {
    return /캠핑|야영|글램핑|카라반|펜션|CC/i.test(title) ? null : 'spot';
  }
  if (contentTypeId === '39') {
    return asText(item.list?.lclsSystm3) === 'FD050100' ? 'cafe' : 'restaurant';
  }
  return null;
}

function getZone(address) {
  return asText(address).match(/청도군\s*([가-힣]+(?:읍|면))/)?.[1] ?? '?';
}

function getTypeOneImageCount(item) {
  const representativeCount = item.list?.cpyrhtDivCd === 'Type1' ? 1 : 0;
  const additionalCount = asArray(item.images).filter(
    (image) => image?.cpyrhtDivCd === 'Type1',
  ).length;
  return representativeCount + additionalCount;
}

function getOperatingHours(item) {
  const intro = asArray(item.intro)[0] ?? {};
  const fields = Object.keys(intro)
    .filter((key) => /^(?:usetime|opentime)/i.test(key))
    .map((key) => stripHtml(intro[key]))
    .filter(Boolean);
  return Array.from(fields.join(' · ')).slice(0, 60).join('');
}

function escapeCell(value) {
  return asText(value).replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

const draft = JSON.parse(await readFile(draftPath, 'utf8'));
const candidates = draft.items
  .map((item) => ({ item, kind: classify(item) }))
  .filter(({ kind }) => kind !== null);
const grouped = Object.fromEntries(
  kinds.map((kind) => [
    kind,
    candidates
      .filter((candidate) => candidate.kind === kind)
      .sort((left, right) => {
        const zoneOrder = getZone(left.item.list?.addr1).localeCompare(
          getZone(right.item.list?.addr1),
          'ko',
        );
        return (
          zoneOrder ||
          asText(left.item.list?.title).localeCompare(asText(right.item.list?.title), 'ko')
        );
      }),
  ]),
);

const lines = [
  '# TourAPI 후보',
  '',
  '## 종류별 개수',
  '',
  '| kind | 개수 |',
  '|---|---:|',
  ...kinds.map((kind) => `| ${kind} | ${grouped[kind].length} |`),
];

for (const kind of kinds) {
  lines.push(
    '',
    `## ${kind}`,
    '',
    '| contentId | kind | 이름 | 읍면 | 위도 (mapy) | 경도 (mapx) | 1유형 사진 수 | 운영시간 원문 |',
    '|---:|---|---|---|---:|---:|---:|---|',
  );
  for (const { item } of grouped[kind]) {
    const list = item.list ?? {};
    lines.push(
      `| ${escapeCell(list.contentid)} | ${kind} | ${escapeCell(list.title)} | ${escapeCell(getZone(list.addr1))} | ${escapeCell(list.mapy)} | ${escapeCell(list.mapx)} | ${getTypeOneImageCount(item)} | ${escapeCell(getOperatingHours(item))} |`,
    );
  }
}

await writeFile(outputPath, `${lines.join('\n')}\n`, 'utf8');
console.log(
  `candidates: ${candidates.length} items (${kinds.map((kind) => `${kind} ${grouped[kind].length}`).join(', ')})`,
);

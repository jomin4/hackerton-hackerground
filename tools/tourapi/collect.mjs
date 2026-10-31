import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const dataDirectory = resolve(root, '.data-draft');
const apiBaseUrl = 'https://apis.data.go.kr/B551011/KorService2';
const concurrency = 3;
const maxAttempts = 3;

function readApiKey(envText) {
  const line = envText
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .find((entry) => /^\s*(?:export\s+)?TOUR_API_KEY\s*=/.test(entry));

  if (!line) return '';

  const value = line.replace(/^\s*(?:export\s+)?TOUR_API_KEY\s*=\s*/, '').trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value.replace(/\s+#.*$/, '').trim();
}

function parseLimit(args) {
  const index = args.indexOf('--limit');
  if (index === -1) return null;

  const rawLimit = args[index + 1];
  const limit = Number(rawLimit);
  if (!rawLimit || !Number.isSafeInteger(limit) || limit < 1) {
    throw new Error('--limit 뒤에는 1 이상의 정수를 입력해 주세요.');
  }
  return limit;
}

function normalizeItems(items) {
  if (items === '' || items == null) return [];
  return Array.isArray(items) ? items : [items];
}

function responseItems(body) {
  return normalizeItems(body?.items?.item);
}

const delay = (milliseconds) =>
  new Promise((resolveDelay) => setTimeout(resolveDelay, milliseconds));

async function requestJson(operation, parameters, calls) {
  let lastFailure = '응답을 확인할 수 없어요.';

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    calls.count += 1;
    const url = new URL(`${apiBaseUrl}/${operation}`);
    for (const [key, value] of Object.entries(parameters)) {
      url.searchParams.set(key, String(value));
    }

    try {
      const response = await fetch(url);
      if (!response.ok) {
        lastFailure = `HTTP ${response.status}`;
      } else {
        const payload = await response.json();
        const header = payload?.response?.header;
        if (header?.resultCode === '0000') {
          return payload.response.body;
        }
        lastFailure = `결과 코드 ${header?.resultCode ?? '확인 불가'}`;
      }
    } catch (error) {
      lastFailure = error instanceof Error ? '네트워크 또는 JSON 응답 오류' : '요청 오류';
    }

    if (attempt < maxAttempts) await delay(attempt * 1000);
  }

  throw new Error(`${operation} 호출에 실패했어요 (${lastFailure}).`);
}

async function fetchDetails(list, apiKey, calls) {
  const commonParameters = {
    serviceKey: apiKey,
    MobileOS: 'ETC',
    MobileApp: 'CheongdoCourse',
    _type: 'json',
    contentId: list.contentid,
  };
  const contentParameters = {
    ...commonParameters,
    contentTypeId: list.contenttypeid,
  };
  const common = await requestJson('detailCommon2', commonParameters, calls);
  const intro = await requestJson('detailIntro2', contentParameters, calls);
  const info = await requestJson('detailInfo2', contentParameters, calls);
  const images = await requestJson('detailImage2', { ...commonParameters, imageYN: 'Y' }, calls);

  return {
    list,
    common: responseItems(common),
    intro: responseItems(intro),
    info: responseItems(info),
    images: responseItems(images),
  };
}

async function main() {
  const limit = parseLimit(process.argv.slice(2));
  const envText = await readFile(resolve(root, '.env'), 'utf8').catch(() => '');
  const apiKey = readApiKey(envText);
  if (!apiKey) {
    throw new Error('저장소 루트의 .env 파일에 TOUR_API_KEY를 설정해 주세요.');
  }

  const calls = { count: 0 };
  const listBody = await requestJson(
    'areaBasedList2',
    {
      serviceKey: apiKey,
      MobileOS: 'ETC',
      MobileApp: 'CheongdoCourse',
      _type: 'json',
      lDongRegnCd: 47,
      lDongSignguCd: 820,
      numOfRows: 300,
      pageNo: 1,
      arrange: 'A',
    },
    calls,
  );
  const listItems = responseItems(listBody);
  const total = Number(listBody?.totalCount ?? listItems.length);
  const selectedItems = (limit === null ? listItems : listItems.slice(0, limit)).sort(
    (left, right) => Number(left.contentid) - Number(right.contentid),
  );
  const results = new Array(selectedItems.length);
  let nextIndex = 0;
  let completed = 0;
  let workerError;

  async function worker() {
    while (nextIndex < selectedItems.length && !workerError) {
      const index = nextIndex;
      nextIndex += 1;
      const list = selectedItems[index];
      try {
        results[index] = await fetchDetails(list, apiKey, calls);
        completed += 1;
        if (completed % 20 === 0) {
          console.log(`${completed}/${selectedItems.length} (calls ${calls.count})`);
        }
      } catch (error) {
        workerError = error;
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, selectedItems.length) }, () => worker()),
  );
  if (workerError) throw workerError;

  const output = {
    collectedAt: new Date().toISOString(),
    source: 'TourAPI KorService2',
    total,
    items: results,
  };
  await mkdir(dataDirectory, { recursive: true });
  const outputPath = resolve(
    dataDirectory,
    limit === null ? 'tourapi-cheongdo.json' : 'tourapi-cheongdo.sample.json',
  );
  await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
  console.log(`done: ${results.length} items, ${calls.count} calls`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : '수집에 실패했어요.');
  process.exitCode = 1;
});

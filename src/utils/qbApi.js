const API = 'https://www.qbreader.org/api';

export const CATEGORIES = [
  'Literature', 'History', 'Science', 'Fine Arts',
  'Mythology', 'Philosophy', 'Religion', 'Geography',
  'Social Science', 'Current Events', 'Other Academic',
];

// NAQT IS HS difficulty range: 3=Regular HS, 4=Hard HS, 5=National HS
export const HS_DIFFICULTIES = [3, 4, 5];

export const DIFFICULTY_LABELS = {
  1: 'Middle School', 2: 'Easy HS', 3: 'Regular HS',
  4: 'Hard HS', 5: 'National HS',
  6: 'Easy College', 7: 'Regular College', 8: 'Hard College', 9: 'Open',
};

const FETCH_TIMEOUT_MS = 12000;

async function apiFetch(path, params = {}) {
  const url = new URL(`${API}/${path}`);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
  });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url.toString(), { signal: controller.signal });
    if (!res.ok) throw new Error(`qbreader ${res.status}: ${path}`);
    return res.json();
  } finally {
    clearTimeout(timer);
  }
}

const VALID_DIRECTIVES = new Set(['accept', 'reject', 'prompt']);

function isValidTossup(t) {
  return t && typeof t.question === 'string' && t.question.length > 0
    && typeof t.answer === 'string' && t.answer.length > 0;
}

function isValidBonus(b) {
  return b && Array.isArray(b.parts) && b.parts.length > 0;
}

export async function fetchTossups({
  categories = [],
  difficulties = HS_DIFFICULTIES,
  num = 20,
  setName,
} = {}) {
  const data = await apiFetch('random-tossup', {
    difficulties: difficulties.join(','),
    categories: categories.length ? categories.join(',') : undefined,
    number: num,
    setName: setName || undefined,
  });
  return (data.tossups ?? []).filter(isValidTossup);
}

export async function fetchRandomBonus({
  categories = [],
  difficulties = HS_DIFFICULTIES,
} = {}) {
  const data = await apiFetch('random-bonus', {
    difficulties: difficulties.join(','),
    categories: categories.length ? categories.join(',') : undefined,
    number: 1,
  });
  const bonus = data.bonuses?.[0] ?? null;
  return isValidBonus(bonus) ? bonus : null;
}

export const ALL_CATEGORIES = [
  'Literature', 'History', 'Science', 'Fine Arts',
  'Mythology', 'Philosophy', 'Religion', 'Geography',
  'Social Science', 'Current Events', 'Other Academic', 'Pop Culture',
];

export const SUBCATEGORIES = {
  'Literature':     ['American Literature', 'British Literature', 'Classical Literature', 'European Literature', 'World Literature', 'Other Literature'],
  'History':        ['American History', 'Ancient History', 'European History', 'World History', 'Other History'],
  'Science':        ['Biology', 'Chemistry', 'Physics', 'Other Science'],
  'Fine Arts':      ['Visual Fine Arts', 'Auditory Fine Arts', 'Other Fine Arts'],
  'Religion':       [], 'Mythology': [], 'Philosophy': [],
  'Social Science': [], 'Current Events': [], 'Geography': [], 'Other Academic': [],
  'Pop Culture':    ['Movies', 'Music', 'Sports', 'Television', 'Video Games', 'Other Pop Culture'],
};

export const ALT_SUBCATEGORIES = {
  'Literature':     ['Drama', 'Long Fiction', 'Poetry', 'Short Fiction', 'Misc Literature'],
  'Science':        ['Math', 'Astronomy', 'Computer Science', 'Earth Science', 'Engineering', 'Misc Science'],
  'Fine Arts':      ['Architecture', 'Dance', 'Film', 'Jazz', 'Musicals', 'Opera', 'Photography', 'Misc Arts'],
  'Social Science': ['Anthropology', 'Economics', 'Linguistics', 'Psychology', 'Sociology', 'Other Social Science'],
};

export async function fetchFrequencyList({
  subcategory, category, alternateSubcategory,
  difficulties = [3, 4, 5], limit = 50, questionType = 'all',
  minYear, maxYear,
} = {}) {
  const params = { difficulties: difficulties.join(','), limit, questionType };
  if (subcategory) params.subcategory = subcategory;
  else if (alternateSubcategory) params.alternateSubcategory = alternateSubcategory;
  else if (category) params.category = category;
  if (minYear) params.minYear = minYear;
  if (maxYear) params.maxYear = maxYear;
  const data = await apiFetch('frequency-list', params);
  return data.frequencyList ?? [];
}

export async function fetchSetList() {
  const data = await apiFetch('set-list');
  return data.setList ?? [];
}

export async function searchQuestions({
  query = '', categories = [], difficulties = [],
  questionType = 'all', searchType = 'all',
  maxReturnLength = 25, tossupPagination = 1, bonusPagination = 1,
  minYear, maxYear,
} = {}) {
  const params = {
    queryString: query, questionType, searchType,
    maxReturnLength, tossupPagination, bonusPagination,
  };
  if (categories.length) params.categories = categories.join(',');
  if (difficulties.length) params.difficulties = difficulties.join(',');
  if (minYear) params.minYear = minYear;
  if (maxYear) params.maxYear = maxYear;
  const data = await apiFetch('query', params);
  return {
    tossups: data.tossups ?? { count: 0, questionArray: [] },
    bonuses: data.bonuses ?? { count: 0, questionArray: [] },
  };
}

export async function checkAnswer(answerline, givenAnswer, strictness = 2) {
  try {
    const result = await apiFetch('check-answer', { answerline, givenAnswer, strictness });
    if (!VALID_DIRECTIVES.has(result.directive)) {
      return { directive: 'reject' };
    }
    return result;
  } catch {
    const clean = (s) => s.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
    const a = clean(givenAnswer);
    const b = clean(answerline);
    return { directive: (b.includes(a) || a.includes(b)) ? 'accept' : 'reject' };
  }
}

const test = require('node:test');
const assert = require('node:assert');
const vm = require('node:vm');
const fs = require('node:fs');

const code = fs.readFileSync('./skill-manager/app.js', 'utf8');

function setupEnvironment() {
  const mockElement = {
    addEventListener: () => {},
    innerHTML: '',
    textContent: '',
    classList: { add: () => {}, remove: () => {} },
    dataset: {},
    querySelector: () => mockElement,
    querySelectorAll: () => [],
    closest: () => mockElement,
    value: ''
  };

  const mockDocument = {
    getElementById: () => mockElement,
    querySelectorAll: () => []
  };

  const context = {
    document: mockDocument,
    // fetch never resolves so init() hangs and doesn't overwrite our test variables
    fetch: () => new Promise(() => {}),
    console: console,
  };

  vm.createContext(context);

  const codeToRun = code + `
    globalThis.api = {
      getFilteredSkills,
      setCatalog: (c) => { catalog = c; },
      setAllSkills: (s) => { allSkills = s; },
      setActiveFilter: (f) => { activeFilter = f; },
      setSearchQuery: (q) => { searchQuery = q; }
    };
  `;

  vm.runInContext(codeToRun, context);
  return context.api;
}

test('getFilteredSkills - filters', async (t) => {
  const api = setupEnvironment();

  const mockSkills = [
    { name: 'Personal 1', description: 'desc P1', group: 'personal', subgroup: 'sg1' },
    { name: 'Workflow 1', description: 'desc W1', group: 'workflow', subgroup: 'sg2' },
    { name: 'Scientific 1', description: 'desc S1', group: 'scientific', subgroup: 'sg3' },
    { name: 'Subgroup Target', description: 'match me', group: 'personal', subgroup: 'Aspect Media' }
  ];

  const mockCatalog = {
    personal: mockSkills.filter(s => s.group === 'personal'),
    workflow: mockSkills.filter(s => s.group === 'workflow'),
    scientific: mockSkills.filter(s => s.group === 'scientific')
  };

  api.setCatalog(mockCatalog);
  api.setAllSkills(mockSkills);

  await t.test('returns all skills when activeFilter is "all" and no search query', () => {
    api.setActiveFilter('all');
    api.setSearchQuery('');
    const result = api.getFilteredSkills();
    assert.deepStrictEqual(result, mockSkills);
  });

  await t.test('returns empty array when activeFilter is "favorites"', () => {
    api.setActiveFilter('favorites');
    api.setSearchQuery('');
    const result = api.getFilteredSkills();
    assert.deepEqual(result, []); // Changed to deepEqual to ignore reference checks for empty arrays from within VM
  });

  await t.test('returns personal catalog when activeFilter is "personal"', () => {
    api.setActiveFilter('personal');
    api.setSearchQuery('');
    const result = api.getFilteredSkills();
    assert.deepStrictEqual(result, mockCatalog.personal);
  });

  await t.test('returns workflow catalog when activeFilter is "workflow"', () => {
    api.setActiveFilter('workflow');
    api.setSearchQuery('');
    const result = api.getFilteredSkills();
    assert.deepStrictEqual(result, mockCatalog.workflow);
  });

  await t.test('returns scientific catalog when activeFilter is "scientific"', () => {
    api.setActiveFilter('scientific');
    api.setSearchQuery('');
    const result = api.getFilteredSkills();
    assert.deepStrictEqual(result, mockCatalog.scientific);
  });

  await t.test('returns filtered skills by subgroup', () => {
    api.setActiveFilter('Aspect Media');
    api.setSearchQuery('');
    const result = api.getFilteredSkills();
    assert.deepStrictEqual(result, [mockSkills[3]]);
  });

  await t.test('filters by name (case-insensitive) when searchQuery is set', () => {
    api.setActiveFilter('all');
    api.setSearchQuery('pErSonal 1');
    const result = api.getFilteredSkills();
    assert.deepStrictEqual(result, [mockSkills[0]]);
  });

  await t.test('filters by description (case-insensitive) when searchQuery is set', () => {
    api.setActiveFilter('all');
    api.setSearchQuery('match ME');
    const result = api.getFilteredSkills();
    assert.deepStrictEqual(result, [mockSkills[3]]);
  });

  await t.test('combines activeFilter and searchQuery', () => {
    api.setActiveFilter('workflow');
    api.setSearchQuery('work');
    const result = api.getFilteredSkills();
    assert.deepStrictEqual(result, [mockSkills[1]]);
  });

  await t.test('combines subgroup activeFilter and searchQuery', () => {
    api.setActiveFilter('Aspect Media');
    api.setSearchQuery('subgroup target');
    const result = api.getFilteredSkills();
    assert.deepStrictEqual(result, [mockSkills[3]]);
  });

  await t.test('returns empty if search query does not match anything in filter', () => {
    api.setActiveFilter('workflow');
    api.setSearchQuery('scientific');
    const result = api.getFilteredSkills();
    assert.deepEqual(result, []); // Use deepEqual here too as filter() returning empty array from VM might not pass deepStrictEqual
  });
});

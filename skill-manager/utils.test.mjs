import test from 'node:test';
import assert from 'node:assert';
import { classifySkill, parseFrontmatter, buildCatalog } from './utils.mjs';

test('classifySkill categorizes personal skills correctly', () => {
  const result = classifySkill('bsa-shooting-sports');
  assert.deepStrictEqual(result, { group: 'personal', subgroup: 'BSA / Scouting' });
});

test('classifySkill categorizes workflow skills correctly', () => {
  const resultFirecrawl = classifySkill('firecrawl-scrape');
  assert.deepStrictEqual(resultFirecrawl, { group: 'workflow', subgroup: 'Firecrawl' });

  const resultGstack = classifySkill('gstack-auth');
  assert.deepStrictEqual(resultGstack, { group: 'workflow', subgroup: 'gstack' });

  const resultTool = classifySkill('pdf');
  assert.deepStrictEqual(resultTool, { group: 'workflow', subgroup: 'Tools' });
});

test('classifySkill categorizes scientific skills by default', () => {
  const result = classifySkill('unknown-scientific-skill');
  assert.deepStrictEqual(result, { group: 'scientific', subgroup: 'Scientific' });
});

test('parseFrontmatter parses basic inline description', () => {
  const content = `---
name: my-skill
description: This is a test skill
---`;
  const result = parseFrontmatter(content);
  assert.deepStrictEqual(result, { name: 'my-skill', description: 'This is a test skill' });
});

test('parseFrontmatter parses folded block description', () => {
  const content = `---
name: my-skill
description: >
  This is a
  folded description
---`;
  const result = parseFrontmatter(content);
  assert.deepStrictEqual(result, { name: 'my-skill', description: 'This is a folded description' });
});

test('parseFrontmatter handles missing description', () => {
  const content = `---
name: my-skill
---`;
  const result = parseFrontmatter(content);
  assert.deepStrictEqual(result, { name: 'my-skill', description: '' });
});

test('parseFrontmatter handles empty content gracefully', () => {
  const result = parseFrontmatter('no frontmatter here');
  assert.deepStrictEqual(result, { name: '', description: '' });
});

test('buildCatalog groups skills correctly', () => {
  const skills = [
    { name: 'skill1', group: 'personal', subgroup: 'A' },
    { name: 'skill2', group: 'workflow', subgroup: 'B' },
    { name: 'skill3', group: 'scientific', subgroup: 'C' },
    { name: 'skill4', group: 'personal', subgroup: 'D' },
  ];

  const catalog = buildCatalog(skills);

  assert.deepStrictEqual(catalog.personal, [
    { name: 'skill1', group: 'personal', subgroup: 'A' },
    { name: 'skill4', group: 'personal', subgroup: 'D' }
  ]);

  assert.deepStrictEqual(catalog.workflow, [
    { name: 'skill2', group: 'workflow', subgroup: 'B' }
  ]);

  assert.deepStrictEqual(catalog.scientific, [
    { name: 'skill3', group: 'scientific', subgroup: 'C' }
  ]);
});

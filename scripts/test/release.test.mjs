import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, symlink, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { collectStaticFiles, inspectPublicFile } from '../release-files.mjs';

test('public release excludes document caches and refuses private files and symlinks', async t => {
  const root = await mkdtemp(path.join(tmpdir(), 'onlyfunds-release-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(path.join(root, 'manual/.doctrees'), { recursive: true });
  await writeFile(path.join(root, 'index.html'), '<title>OnlyFunds</title>');
  await writeFile(path.join(root, 'manual/index.html'), '<title>Manual</title>');
  await writeFile(path.join(root, 'manual/.doctrees/environment.pickle'), 'private build cache');
  await writeFile(path.join(root, 'manual/theme.js.map'), 'development source map');
  assert.deepEqual(await collectStaticFiles(root), ['index.html', 'manual/index.html']);
  for (const name of ['.env', 'lab.sqlite', 'script.py']) {
    await writeFile(path.join(root, name), 'must never publish');
    await assert.rejects(collectStaticFiles(root), /Refusing/);
    await rm(path.join(root, name));
  }
  await symlink(path.join(root, 'index.html'), path.join(root, 'alias.html'));
  await assert.rejects(collectStaticFiles(root), /symlink/);
});

test('release audit detects credentials and local paths without returning secret values', () => {
  const sample = ['synthetic', 'test', 'value', 'never', 'issued'].join('-');
  const result = inspectPublicFile('app.js', Buffer.from(sample), [sample]);
  assert.deepEqual(result, ['local server secret']);
  assert.ok(!JSON.stringify(result).includes(sample));
  const localPath = ['/', 'Users', '/', 'example', '/'].join('');
  assert.deepEqual(inspectPublicFile('app.js', Buffer.from(localPath)), ['personal filesystem path']);
  assert.deepEqual(inspectPublicFile('server/.env.example', Buffer.from('SESSION_SECRET=replace-me')), []);
});

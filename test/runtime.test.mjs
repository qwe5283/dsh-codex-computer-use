import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, utimes, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { discoverCodexCli, discoverSky } from '../src/runtime.mjs';

async function skyFixture(root, version) {
  await mkdir(root, { recursive: true });
  await writeFile(join(root, 'package.json'), JSON.stringify({ name: '@oai/sky', version, main: 'index.js', exports: './index.js' }));
  await writeFile(join(root, 'index.js'), 'export const sky = {};\n');
}

test('独立 DSH 无 Codex 环境变量或 PATH 时自动查找本机 CLI，忽略不完整安装', async t => {
  const root = await mkdtemp(join(tmpdir(), 'dsh-codex-runtime-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const bin = join(root, 'OpenAI', 'Codex', 'bin');
  for (const name of ['old', 'new', 'incomplete']) await mkdir(join(bin, name), { recursive: true });
  const older = join(bin, 'old', 'codex.exe'), newer = join(bin, 'new', 'codex.exe');
  await writeFile(older, 'fixture'); await writeFile(newer, 'fixture');
  await utimes(older, 100, 100); await utimes(newer, 200, 200);
  assert.equal(await discoverCodexCli({ localAppData: root, env: {} }), newer);
  assert.equal(await discoverCodexCli({ localAppData: root, env: { CODEX_CLI_PATH: join(root, 'deleted.exe') } }), newer);
  assert.equal(await discoverCodexCli({ localAppData: root, codexPath: older, env: {} }), older);
  assert.equal(await discoverCodexCli({ localAppData: root, env: { CODEX_CLI_PATH: older } }), older);
  await assert.rejects(discoverCodexCli({ localAppData: root, codexPath: join(root, 'missing.exe'), env: {} }), /必须指向/);
});

test('支持 Windows Path 名称和带引号的目录；未安装时给出配置建议', async t => {
  const root = await mkdtemp(join(tmpdir(), 'dsh-codex-path-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const file = join(root, 'codex.exe'); await writeFile(file, 'fixture');
  assert.equal(await discoverCodexCli({ localAppData: join(root, 'empty'), env: { Path: `"${root}"` } }), file);
  await assert.rejects(discoverCodexCli({ localAppData: join(root, 'empty'), env: {} }), /未找到 codex.exe/);
});

test('优先使用当前 Codex Desktop 包内的 Sky 和配套 CLI', async t => {
  const root = await mkdtemp(join(tmpdir(), 'dsh-codex-package-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const packageLocation = join(root, 'OpenAI.Codex_current');
  const resources = join(packageLocation, 'app', 'resources');
  const skyRoot = join(resources, 'cua_node', 'bin', 'node_modules', '@oai', 'sky');
  const codexPath = join(resources, 'codex.exe');
  await skyFixture(skyRoot, '0.7.26');
  await writeFile(codexPath, 'fixture');
  const inheritedPath = join(root, 'inherited-codex.exe');
  await writeFile(inheritedPath, 'fixture');
  const runtime = await discoverSky({
    localAppData: join(root, 'empty'), env: {}, getPackageLocation: async () => packageLocation,
  });
  assert.equal(runtime.root, skyRoot);
  assert.equal(runtime.version, '0.7.26');
  assert.equal(runtime.source, 'package');
  assert.equal(runtime.packageCodexPath, codexPath);
  assert.equal(await discoverCodexCli({ localAppData: join(root, 'empty'), env: { CODEX_CLI_PATH: inheritedPath }, packageCodexPath: runtime.packageCodexPath }), codexPath);
  assert.equal(await discoverCodexCli({ localAppData: join(root, 'empty'), env: { DSH_CODEX_CLI_PATH: inheritedPath }, packageCodexPath: runtime.packageCodexPath }), inheritedPath);
});

test('包内运行时不完整时回退到提取目录，显式路径仍然优先', async t => {
  const root = await mkdtemp(join(tmpdir(), 'dsh-codex-fallback-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const extracted = join(root, 'local', 'OpenAI', 'Codex', 'runtimes', 'cua_node', 'old', 'bin', 'node_modules', '@oai', 'sky');
  const explicit = join(root, 'explicit-sky');
  await skyFixture(extracted, '0.7.18');
  await skyFixture(explicit, '0.7.5');
  const fallback = await discoverSky({ localAppData: join(root, 'local'), env: {}, getPackageLocation: async () => join(root, 'incomplete') });
  assert.equal(fallback.root, extracted);
  assert.equal(fallback.source, 'extracted');
  const selected = await discoverSky({ skyDir: explicit, env: {}, getPackageLocation: async () => { throw new Error('不应查询安装包'); } });
  assert.equal(selected.root, explicit);
  assert.equal(selected.version, '0.7.5');
});

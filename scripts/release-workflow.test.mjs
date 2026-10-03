import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { parse } from 'yaml'

const workflow = parse(
  readFileSync(new URL('../.github/workflows/release.yml', import.meta.url), 'utf8'),
)
for (const job of ['pack', 'publish']) {
  const script = workflow.jobs[job].steps.find((step) => step.run?.includes('for tarball')).run
  void test(`${job} handles partial publication and preserves Vue before Nuxt`, () => {
    const root = mkdtempSync(join(tmpdir(), 'photo-publish-order-'))
    try {
      mkdirSync(join(root, 'bin'))
      const npm = join(root, 'bin/npm')
      writeFileSync(
        npm,
        '#!/bin/sh\nif [ "$1" = view ]; then printf \'{"error":{"code":"E404"}}\\n\'; exit 1; fi\nprintf "%s\\n" "$2"\n',
      )
      chmodSync(npm, 0o755)
      for (const names of [[], ['nuxt'], ['vue'], ['nuxt', 'vue']]) {
        rmSync(join(root, 'release'), { recursive: true, force: true })
        mkdirSync(join(root, 'release'))
        mkdirSync(join(root, 'package'), { recursive: true })
        for (const name of names) {
          writeFileSync(
            join(root, 'package/package.json'),
            JSON.stringify({ name: `@lupinum/${name}-photo`, version: '1.0.0' }),
          )
          execFileSync(
            'tar',
            ['-czf', `release/lupinum-${name}-photo-1.0.0.tgz`, 'package/package.json'],
            { cwd: root },
          )
        }
        const result = spawnSync('bash', ['-e', '-o', 'pipefail', '-c', script], {
          cwd: root,
          encoding: 'utf8',
          env: {
            ...process.env,
            RUNNER_TEMP: root,
            PATH: `${join(root, 'bin')}:${process.env.PATH}`,
          },
        })
        assert.equal(result.status, names.length ? 0 : 1, result.stderr)
        if (names.length)
          assert.deepEqual(
            result.stdout.trim().split('\n'),
            ['vue', 'nuxt']
              .filter((name) => names.includes(name))
              .map((name) => `./release/lupinum-${name}-photo-1.0.0.tgz`),
          )
        else assert.match(result.stdout, /No package tarballs found/)
      }
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })
}

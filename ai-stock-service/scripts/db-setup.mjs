import { spawnSync } from 'node:child_process'

const steps = [
    ['db:migrate', true],
    ['db:migrate:watch-model', true],
    ['db:migrate:auth', true],
    ['db:migrate:account', true],
    ['db:migrate:account-fix', true],
    ['db:seed', false],
]

const ignorablePatterns = [
    /already exists/i,
    /duplicate column/i,
    /duplicate key name/i,
    /duplicate entry/i,
    /multiple primary key defined/i,
]

function runScript(scriptName, allowAlreadyApplied) {
    console.log(`\n[db:setup] running ${scriptName}`)

    const result = spawnSync('npm', ['run', scriptName], {
        cwd: process.cwd(),
        env: process.env,
        stdio: 'pipe',
        encoding: 'utf8',
        shell: process.platform === 'win32',
    })

    if (result.stdout) {
        process.stdout.write(result.stdout)
    }

    if (result.status === 0) {
        return
    }

    const stderr = `${result.stderr ?? ''}${result.stdout ?? ''}`
    if (allowAlreadyApplied && ignorablePatterns.some((pattern) => pattern.test(stderr))) {
        console.log(`[db:setup] skip ${scriptName}: migration appears already applied`)
        return
    }

    if (result.stderr) {
        process.stderr.write(result.stderr)
    }

    process.exit(result.status ?? 1)
}

for (const [scriptName, allowAlreadyApplied] of steps) {
    runScript(scriptName, allowAlreadyApplied)
}

console.log('\n[db:setup] complete')
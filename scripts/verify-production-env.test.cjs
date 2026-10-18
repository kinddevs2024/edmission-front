const assert = require('node:assert/strict')
const fs = require('node:fs'), os = require('node:os'), path = require('node:path')
const { verifyProductionEnv } = require('./verify-production-env.cjs')
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'edmission-build-env-'))
try {
 assert.throws(() => verifyProductionEnv(temp, {}), /Google/)
 fs.writeFileSync(path.join(temp, '.env'), 'VITE_GOOGLE_CLIENT_ID=test.apps.googleusercontent.com\nVITE_YANDEX_CLIENT_ID=test-yandex\nVITE_API_URL=/api\n')
 assert.equal(verifyProductionEnv(temp, {}), true)
 const baseline = path.join(temp, 'baseline'); fs.copyFileSync(path.join(temp, '.env'), baseline)
 assert.equal(verifyProductionEnv(temp, { ADMISSION_BUILD_BASELINE_ENV: baseline }), true)
 assert.throws(() => verifyProductionEnv(temp, { ADMISSION_BUILD_BASELINE_ENV: baseline, VITE_YANDEX_CLIENT_ID: '' }), /VITE_YANDEX_CLIENT_ID/)
 assert.throws(() => verifyProductionEnv(temp, { ADMISSION_BUILD_BASELINE_ENV: baseline, VITE_API_URL: 'https://wrong.invalid/api' }), /VITE_API_URL/)
 console.log('Production configuration guards passed: missing Google, provider preservation and active API baseline.')
} finally { fs.rmSync(temp, { recursive: true, force: true }) }

const fs = require('node:fs')
const path = require('node:path')
function readEnv(file) {
  if (!fs.existsSync(file)) return {}
  return Object.fromEntries(fs.readFileSync(file, 'utf8').split(/\r?\n/).flatMap(line => {
    const match = line.match(/^\s*(?:export\s+)?(VITE_[A-Z0-9_]+)\s*=\s*(.*?)\s*$/)
    if (!match) return []
    const value = match[2].replace(/^(["'])(.*)\1$/, '$2').replace(/\s+#.*$/, '').trim()
    return [[match[1], value]]
  }))
}
function verifyProductionEnv(directory = process.cwd(), environment = process.env) {
  const config = Object.assign({}, ...['.env', '.env.local', '.env.production', '.env.production.local'].map(file => readEnv(path.join(directory, file))), Object.fromEntries(Object.entries(environment).filter(([key]) => key.startsWith('VITE_'))))
  if (!config.VITE_GOOGLE_CLIENT_ID || !config.VITE_GOOGLE_CLIENT_ID.endsWith('.apps.googleusercontent.com')) throw new Error('Production Google sign-in configuration is missing or invalid. Values are hidden.')
  if (environment.ADMISSION_BUILD_BASELINE_ENV) {
    const baseline = readEnv(environment.ADMISSION_BUILD_BASELINE_ENV)
    if (!Object.keys(baseline).length) throw new Error('Production baseline could not be read. Values are hidden.')
    for (const [key, value] of Object.entries(baseline)) {
      if (value && config[key] !== value) throw new Error(`Production build configuration differs from the active site: ${key}. Values are hidden.`)
    }
  }
  return true
}
module.exports = { readEnv, verifyProductionEnv }
if (require.main === module) {
  try { verifyProductionEnv(); console.log('Production provider configuration verified; values hidden.') }
  catch (error) { console.error(error.message); process.exit(1) }
}

import fs from 'node:fs'
import path from 'node:path'

const iconSrc = fs.readFileSync('src/components/Icon.vue', 'utf8')
const defined = new Set(
  [...iconSrc.matchAll(/^\s{2}'?([a-z-]+)'?:\s*\[/gm)].map((m) => m[1])
)

const files = []
function walk(d) {
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f)
    const s = fs.statSync(p)
    if (s.isDirectory()) walk(p)
    else if (p.endsWith('.vue')) files.push(p)
  }
}
walk('src')

// Extract name attributes only inside <Icon ...> tags
const used = new Set()
for (const f of files) {
  const src = fs.readFileSync(f, 'utf8')
  for (const m of src.matchAll(/<Icon\b[^>]*>/g)) {
    const tag = m[0]
    const staticName = tag.match(/\bname="([a-z-]+)"/)
    const dynamicName = tag.match(/:name="([a-zA-Z]+)"/)
    if (staticName) used.add(staticName[1])
    if (dynamicName) used.add('(dynamic: ' + dynamicName[1] + ')')
  }
}

const missing = [...used].filter((n) => !defined.has(n) && !n.startsWith('(dynamic'))
console.log('defined:', defined.size, '| unique static names used:', [...used].filter((u) => !u.startsWith('(')).length)
console.log('dynamic bindings (skip):', [...used].filter((u) => u.startsWith('(')).join(', '))
if (missing.length) console.log('MISSING:', missing.join(', '))
else console.log('OK: every static icon name used is defined')

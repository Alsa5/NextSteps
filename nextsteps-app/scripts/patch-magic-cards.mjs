/**
 * Rewrites <div className="card..."> → <AppMagicCard ...> with balanced </div>.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PAGES = path.join(__dirname, '..', 'src', 'pages')

function computeImportLine(filePath) {
  const rel = path.relative(path.join(__dirname, '..', 'src'), filePath)
  const depth = rel.split(path.sep).length - 1
  return `import AppMagicCard from '${'../'.repeat(depth)}components/AppMagicCard'`
}

function findMatchingCloseDiv(html, startIdx) {
  let i = startIdx
  let depth = 0
  const len = html.length
  while (i < len) {
    const rest = html.slice(i)
    if (rest.startsWith('</div>')) {
      if (depth === 0) return i
      depth -= 1
      i += 6
      continue
    }
    const dm = rest.match(/^<motion\.div\b[^>]*>/)
    if (dm) {
      depth += 1
      i += dm[0].length
      continue
    }
    if (rest.startsWith('</motion.div>')) {
      depth -= 1
      i += 13
      continue
    }
    const d = rest.match(/^<div\b[^>]*>/)
    if (d) {
      depth += 1
      i += d[0].length
      continue
    }
    i += 1
  }
  return -1
}

function isMagicCardClass(cls) {
  if (!cls) return false
  const tokens = cls.trim().split(/\s+/).filter(Boolean)
  if (tokens.includes('stat-card') || tokens.includes('login-card')) return true
  if (tokens.includes('card')) return true
  return tokens.some((t) => t.startsWith('card-accent'))
}

function patchContent(text) {
  const re = /<div(\s+className=(?:"([^"]*)"|'([^']*)')([^>]*))>/g
  let out = ''
  let last = 0
  let m
  while ((m = re.exec(text)) !== null) {
    const cls = m[2] ?? m[3] ?? ''
    if (!isMagicCardClass(cls)) continue

    const matchStart = m.index
    const attrsCombined = m[1]
    const tagEnd = matchStart + m[0].length
    const closeIdx = findMatchingCloseDiv(text, tagEnd)
    if (closeIdx === -1) {
      console.warn('skip: no close', matchStart)
      continue
    }

    out += text.slice(last, matchStart)
    out += `<AppMagicCard${attrsCombined}>`
    const inner = text.slice(tagEnd, closeIdx)
    out += patchContent(inner)
    out += '</AppMagicCard>'
    last = closeIdx + 6
    re.lastIndex = last
  }
  out += text.slice(last)
  return out
}

function hasImport(text, line) {
  const base = line.replace(/^import AppMagicCard from '([^']+)'$/, '$1')
  return text.includes(`from '${base.split("'")[1]}`) || text.includes("components/AppMagicCard'")
}

function addImport(text, importLine) {
  if (text.includes("components/AppMagicCard'")) return text
  const lines = text.split('\n')
  let idx = 0
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('import ')) idx = i + 1
  }
  lines.splice(idx, 0, importLine)
  return lines.join('\n')
}

function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name)
    if (ent.isDirectory()) walk(p)
    else if (ent.name.endsWith('.jsx')) {
      let t = fs.readFileSync(p, 'utf8')
      const orig = t
      if (!t.includes('className=')) continue
      t = patchContent(t)
      if (t !== orig) {
        t = addImport(t, computeImportLine(p))
        fs.writeFileSync(p, t, 'utf8')
        console.log('patched', path.relative(PAGES, p))
      }
    }
  }
}

walk(PAGES)

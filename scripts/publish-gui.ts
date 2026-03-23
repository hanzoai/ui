import fs from 'node:fs'
import path from 'node:path'
import * as proc from 'node:child_process'
import { promisify } from 'node:util'

const exec = promisify(proc.exec)

const VERSION = '2.0.0-rc.29'
const DRY_RUN = process.argv.includes('--dry-run')
const DIST_TAG = 'rc'
const GUI_DIR = path.resolve(import.meta.dir, '../pkg/gui')

interface PackageInfo {
  name: string
  dir: string
}

function findPackages(): PackageInfo[] {
  const packages: PackageInfo[] = []
  const entries = fs.readdirSync(GUI_DIR, { withFileTypes: true })

  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    const pkgPath = path.join(GUI_DIR, entry.name, 'package.json')
    if (!fs.existsSync(pkgPath)) continue
    const json = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
    if (json.name?.startsWith('@hanzo/gui') && !json.private) {
      packages.push({ name: json.name, dir: path.join(GUI_DIR, entry.name) })
    }
  }

  return packages
}

function cpSync(src: string, dest: string) {
  fs.cpSync(src, dest, {
    recursive: true,
    filter: (s) => !s.includes('node_modules') && !s.includes('.turbo'),
  })
}

async function publishPackage(pkg: PackageInfo, tmpDir: string): Promise<'published' | 'skipped' | 'failed'> {
  // Check if already published
  try {
    await exec(`npm view ${pkg.name}@${VERSION} version`)
    console.log(`SKIP: ${pkg.name}@${VERSION} (already published)`)
    return 'skipped'
  } catch {}

  if (DRY_RUN) {
    console.log(`DRY: ${pkg.name}@${VERSION}`)
    return 'published'
  }

  const safeName = pkg.name.replace('/', '_')
  const tmpPkg = path.join(tmpDir, safeName)

  try {
    // Clean and copy
    fs.rmSync(tmpPkg, { recursive: true, force: true })
    cpSync(pkg.dir, tmpPkg)

    // Fix package.json
    const pkgJsonPath = path.join(tmpPkg, 'package.json')
    const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'))
    pkgJson.version = VERSION
    for (const field of ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies']) {
      if (!pkgJson[field]) continue
      for (const dep of Object.keys(pkgJson[field])) {
        if (pkgJson[field][dep].startsWith('workspace:')) {
          pkgJson[field][dep] = VERSION
        }
      }
    }
    fs.writeFileSync(pkgJsonPath, JSON.stringify(pkgJson, null, 2) + '\n')

    // Pack
    const { stdout: packOut } = await exec(`npm pack --pack-destination ${tmpDir}`, { cwd: tmpPkg })
    const tgzFile = packOut.trim().split('\n').pop()!

    // Publish
    await exec(`npm publish ${path.join(tmpDir, tgzFile)} --access public --tag ${DIST_TAG}`)
    console.log(`OK: ${pkg.name}@${VERSION}`)

    // Cleanup tgz
    fs.rmSync(path.join(tmpDir, tgzFile), { force: true })
    return 'published'
  } catch (err: any) {
    if (err.stderr?.includes('EPUBLISHCONFLICT') || err.stderr?.includes('cannot publish over')) {
      console.log(`SKIP: ${pkg.name}@${VERSION} (conflict)`)
      return 'skipped'
    }
    console.error(`FAIL: ${pkg.name} - ${err.stderr || err.message}`)
    return 'failed'
  } finally {
    fs.rmSync(tmpPkg, { recursive: true, force: true })
  }
}

async function main() {
  console.log(`Publishing ui/pkg/gui packages`)
  console.log(`Version: ${VERSION}`)
  console.log(`Tag: ${DIST_TAG}`)
  console.log(`Dry run: ${DRY_RUN}`)
  console.log('')

  const tmpDir = `/tmp/gui-ui-publish-${Date.now()}`
  fs.mkdirSync(tmpDir, { recursive: true })

  try {
    const packages = findPackages()
    console.log(`Found ${packages.length} publishable packages\n`)

    const results: ('published' | 'skipped' | 'failed')[] = []
    for (const pkg of packages) {
      results.push(await publishPackage(pkg, tmpDir))
    }

    const published = results.filter((r) => r === 'published').length
    const skipped = results.filter((r) => r === 'skipped').length
    const failed = results.filter((r) => r === 'failed').length

    console.log('')
    console.log('=== Results ===')
    console.log(`Published: ${published}`)
    console.log(`Skipped:   ${skipped}`)
    console.log(`Failed:    ${failed}`)

    if (failed > 0) process.exit(1)
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  }
}

main()

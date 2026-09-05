// Refuse a publish that would ship an unresolvable dependency range.
//
// Packages here depend on each other through the workspace catalog, e.g.
// `"@hanzo/events": "catalog:"`. That range is resolved when the tarball is
// packed, and only pnpm resolves it. Pack the same package with npm and the
// literal `catalog:` reaches the registry, where every installer answers
// EUNSUPPORTEDPROTOCOL and the install dies. @hanzo/event 0.3.38 shipped that
// way and took the whole observe family down with it.
//
// This has now bitten twice. @hanzo/ui 8.0.17 and 8.0.19 went out the same way
// and were fixed by pasting a guard into that one package, so when @hanzo/event
// was published by hand the lesson wasn't there to apply. Hence one guard, in
// one file, referenced by every publishable package.
//
// Runs from prepublishOnly, so it sees both `npm publish` and `pnpm publish`.

const agent = process.env.npm_config_user_agent ?? ''
const pm = agent.split(' ')[0] ?? 'unknown'

if (!pm.startsWith('pnpm/')) {
  console.error(
    `\nRefusing to publish: this workspace resolves catalog ranges with pnpm, ` +
      `but the publish is running under "${pm || 'unknown'}".\n` +
      `Publishing any other way ships the literal "catalog:" to the registry ` +
      `and every install of this package fails with EUNSUPPORTEDPROTOCOL.\n\n` +
      `Use: pnpm publish\n`,
  )
  process.exit(1)
}

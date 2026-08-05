import { beforeEach, describe as group, expect, it } from 'vitest'
import { accessibleName, annotate, componentName, describe as describeEl, roleOf } from './annotate'

beforeEach(() => {
  document.body.innerHTML = ''
})

function mount(html: string): HTMLElement {
  document.body.innerHTML = html
  return document.body.firstElementChild as HTMLElement
}

group('roleOf', () => {
  it('reads the explicit role, else the implicit role of the tag', () => {
    expect(roleOf(mount('<button>x</button>'))).toBe('button')
    expect(roleOf(mount('<nav>x</nav>'))).toBe('navigation')
    expect(roleOf(mount('<div role="tab">x</div>'))).toBe('tab')
    expect(roleOf(mount('<a href="/x">x</a>'))).toBe('link')
    expect(roleOf(mount('<a>x</a>'))).toBe('generic')
    expect(roleOf(mount('<h2>x</h2>'))).toBe('heading')
    expect(roleOf(mount('<input type="checkbox">'))).toBe('checkbox')
    expect(roleOf(mount('<input>'))).toBe('textbox')
  })
})

group('accessibleName', () => {
  it('prefers aria-label, then label/placeholder — never an input value', () => {
    expect(accessibleName(mount('<button aria-label="Save changes">💾</button>'))).toBe('Save changes')
    const input = mount('<input placeholder="Email" value="secret@x.com">')
    const name = accessibleName(input)
    expect(name).toBe('Email')
    expect(name).not.toContain('secret')
  })

  it('reads a <label for> association', () => {
    document.body.innerHTML = '<label for="e">Full name</label><input id="e" value="Ada">'
    expect(accessibleName(document.getElementById('e')!)).toBe('Full name')
  })

  it('uses trimmed text for buttons/links, bounded', () => {
    expect(accessibleName(mount('<a href="/x">  Go\n home </a>'))).toBe('Go home')
    const long = 'a'.repeat(200)
    expect(accessibleName(mount(`<button>${long}</button>`))!.length).toBeLessThanOrEqual(81)
  })
})

group('componentName', () => {
  it('reads data-hz-name / data-component (stable in production)', () => {
    expect(componentName(mount('<button data-hz-name="SaveButton">x</button>'))).toBe('SaveButton')
    expect(componentName(mount('<div data-component="UserCard">x</div>'))).toBe('UserCard')
    expect(componentName(mount('<button>x</button>'))).toBeUndefined()
  })
})

group('describe', () => {
  it('captures tag, role, testid, id, name, kind, component', () => {
    const el = mount('<button id="s" data-testid="save" data-hz-name="SaveButton" type="submit">Save</button>')
    expect(describeEl(el)).toEqual({
      tag: 'button',
      role: 'button',
      testid: 'save',
      id: 's',
      name: 'Save',
      kind: 'submit',
      component: 'SaveButton',
    })
  })
})

group('annotate', () => {
  it('derives a root→leaf semantic path, a target, and a compact label', () => {
    document.body.innerHTML = `
      <nav data-hz-name="Dashboard">
        <div class="wrapper">
          <section data-testid="user-card" data-hz-name="UserCard">
            <button data-testid="save"><span>Save</span></button>
          </section>
        </div>
      </nav>`
    const span = document.querySelector('span')!
    const sem = annotate(span)

    expect(sem['@type']).toBe('Interaction')
    expect(sem.target.tag).toBe('span')
    // Wrapper div drops out of the label; significant nodes remain, root→leaf.
    // The generic wrapper div AND the generic leaf span drop from the compact
    // label; the clicked span is still available as sem.target.
    //
    // A named node keeps its qualifier, exactly as `button[save]` always did:
    // the name says WHAT it is and the test id says WHICH one, and a library
    // renders many of each. Dropping it merged every UserCard into one row.
    expect(sem.label).toBe('Dashboard/UserCard[user-card]/button[save]')
    // The path is complete (includes the wrapper) even though the label is compact.
    expect(sem.path.some((n) => n.component === 'UserCard')).toBe(true)
    expect(sem.path.some((n) => n.component === 'Dashboard')).toBe(true)
  })

  it('bounds the walked depth', () => {
    let html = '<div>'
    for (let i = 0; i < 40; i++) html += '<div>'
    html += '<button>x</button>' + '</div>'.repeat(41)
    document.body.innerHTML = html
    const sem = annotate(document.querySelector('button')!, { maxDepth: 5 })
    expect(sem.path.length).toBeLessThanOrEqual(5)
    expect(sem.target.tag).toBe('button')
  })
})

group('build-time annotation (@hanzo/annotate)', () => {
  it('reads data-observe as the component name in a production build', () => {
    expect(componentName(mount('<div data-observe="UserCard">x</div>'))).toBe('UserCard')
  })

  it('lets a hand-written data-hz-name outrank the build stamp', () => {
    expect(componentName(mount('<div data-observe="Card" data-hz-name="Chosen">x</div>'))).toBe(
      'Chosen',
    )
  })

  it('never treats the redaction opt-out as a name', () => {
    expect(componentName(mount('<div data-observe="off">x</div>'))).toBeUndefined()
  })

  it('reads a design system data-slot as the component name', () => {
    // @hanzo/ui stamps one on every primitive through a single `slot()` helper,
    // so a component library becomes attributable in production without a
    // hand-written data-hz-name at every call site.
    expect(componentName(mount('<button data-slot="button">x</button>'))).toBe('button')
    expect(componentName(mount('<div data-slot="dialog-content">x</div>'))).toBe('dialog-content')
  })

  it('lets an explicit name and a build stamp both outrank data-slot', () => {
    expect(componentName(mount('<button data-slot="button" data-hz-name="SaveButton">x</button>'))).toBe(
      'SaveButton',
    )
    expect(componentName(mount('<button data-slot="button" data-observe="SaveButton">x</button>'))).toBe(
      'SaveButton',
    )
  })

  it('keeps WHICH one alongside WHAT it is', () => {
    // A component name identifies a KIND, and a library renders hundreds of each.
    // Dropping the qualifier collapsed every button on the page into one row.
    document.body.innerHTML = `
      <section data-slot="card">
        <button data-slot="button">Save</button>
        <button data-slot="button">Delete</button>
      </section>`
    const [save, del] = Array.from(document.querySelectorAll('button'))
    expect(annotate(save).label).toBe('card/button[Save]')
    expect(annotate(del).label).toBe('card/button[Delete]')
  })

  it('builds a readable hierarchy from stamped ancestors alone', () => {
    document.body.innerHTML = `
      <nav data-observe="Dashboard">
        <div data-observe="CardGrid">
          <section data-observe="UserCard">
            <button id="save">Save</button>
          </section>
        </div>
      </nav>`
    const el = document.getElementById('save') as Element
    // The stamped ancestors name themselves; the unstamped leaf still falls back
    // to role + accessible name, so the path reads end-to-end in production.
    expect(annotate(el).label).toBe('Dashboard/CardGrid/UserCard/button[Save]')
  })
})

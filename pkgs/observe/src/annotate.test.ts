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
    expect(sem.label).toBe('Dashboard/UserCard/button[save]')
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

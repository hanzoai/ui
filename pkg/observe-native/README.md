# @hanzo/observe-native

Native + desktop binding for [`@hanzo/observe`](../observe). Makes
[`@hanzo/gui`](https://github.com/hanzoai/gui) (Tamagui) / React Native apps and
Tauri desktop emit the **same canonical Events** as the web — same semantic
hierarchy, same privacy gate, same ONE entry point (`POST /v1/event` via
[`@hanzo/event`](../event)).

Native has no DOM to walk, so the semantic hierarchy is composed from explicit
per-element meta and the surrounding `ObserveScope` stack — the native equivalent
of the web's DOM ancestry, auto-derived from the React tree.

## Tamagui / React Native

```tsx
import { createAnalytics } from '@hanzo/event'
import { ObserveProvider, ObserveScope, useObserve } from '@hanzo/observe-native'

function App() {
  return (
    <ObserveProvider client={createAnalytics({ product: 'app' })}>
      <ObserveScope name="Dashboard">
        <ObserveScope name="UserCard">
          <UserCard />
        </ObserveScope>
      </ObserveScope>
    </ObserveProvider>
  )
}

function UserCard() {
  const o = useObserve()
  return (
    <>
      <Button onPress={o.press('SaveButton', save)} />          {/* Dashboard/UserCard/SaveButton */}
      <Input onChangeText={o.changeText('email', setEmail)} />  {/* value redacted */}
    </>
  )
}
```

`press` wraps `onPress`, `changeText` wraps `onChangeText` (RN/Tamagui props) — the
interaction is captured, then your handler runs. `o.event(name)` and
`o.screen(name)` cover custom events and screen views. `useEventStream()` gives the
live rolling window for session playback, same as the web.

## Tauri desktop

A Tauri window is a webview, so the DOM lives — `bindTauri` runs the
`@hanzo/observe` DOM engine to capture the in-webview UI exactly like the web, and
forwards Tauri's native window/app events. The `/tauri` entry is React-free:

```ts
import { createAnalytics } from '@hanzo/event'
import { bindTauri } from '@hanzo/observe-native/tauri'

const bridge = bindTauri(createAnalytics({ product: 'desktop' }))
// … later
bridge.stop()
```

`@tauri-apps/api` is an optional peer loaded at runtime; calling `bindTauri`
outside a Tauri runtime is safe (the native bridge no-ops, DOM capture still runs
in any webview).

## Privacy

Identical policy to the web, via the shared `@hanzo/observe` primitives: input
values are withheld by default, sensitive fields (password / email / card / …) are
always redacted, and everything is fail-soft. Pass `redaction={{ … }}` on
`ObserveProvider` (or `bindTauri`) to tune it.

## Same wire, everywhere

A native tap and a web click produce the identical event shape (`$click`, `$el`,
`$path`, `$component`, `$value`, …) because both go through the one `wireProps`
projection in `@hanzo/observe`. One vocabulary across web, mobile, and desktop.

## License

MIT © Hanzo AI — see [LICENSE.md](../../LICENSE.md). HIP-0137 (`hanzoai/hips`).

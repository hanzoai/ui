# @hanzo/desk

What a Hanzo surface must know without asking anyone: what a model id means,
what a lab is called and how its mark is drawn, and what a message may contain.

```
import { prose } from '@hanzo/desk/prose'
import { ProviderMark, orgDisplayName } from '@hanzo/desk/models'
```

## Why it exists

Three products are being separated out of the Hanzo workspace — the
single-player app, the team app, the builder — and forty-four files are reached
by all three. Reached by all three is the same statement as belonging to none of
them, and until now that had no consequence: the files sat in whichever app was
extracted first and the other two would have copied them.

The rule that decides where each one goes is **what a file knows, not who needs
it**. Needed by all three is why a file leaves the app. What it knows is where
it lands:

| what it knows | home |
| --- | --- |
| React and pixels, and would make sense in a stranger's product | `@hanzo/ui` |
| the gateway wire — which models exist, what a turn is, what a room holds | `@hanzo/ai` |
| who is signed in, and which organization | `@hanzo/iam` |
| Hanzo's own vocabulary — what a name means, what a message may contain, where `/v1` is, what a plan and a tier and a room are | **here** |

Vocabulary is neither a component nor a client, which is why these files had
nowhere to go. Nothing in this package reads the network, holds a session, or
owns a pixel of layout.

## What is here

**`./prose`** — one message's markdown as HTML.

`@hanzo/ui/chat` takes a `prose` callback and deliberately ships no parser,
because the plugin set is a surface's decision. This is Hanzo's answer to that
callback: one dialect (`marked`, gfm, breaks) and one safety rule, so a fence
means the same thing on every surface.

Safe by construction rather than by cleanup. Raw HTML is escaped at the token
and never produced, an image becomes its alt text, and a link keeps only a
scheme a message is allowed to carry — so there is nothing for a sanitizer to
undo and nothing that needs a DOM. The same bytes come out of a server pass and
a browser, which is also what keeps hydration quiet.

**`./models`** — what a model's name means, and the lab behind it.

`getOrgAndSlug`, `canonicalOrg` and `orgDisplayName` are three pure functions
over a string. `ProviderMark` draws the lab's own mark, in the lab's own colour,
resolved through the aliases the gateway namespace requires.

This is not a catalogue and must never become one. Which models exist is a
question for the gateway, and `@hanzo/ai`'s `models.list()` answers it live and
scoped to the reader's organization. What a name *means* is known without asking
anyone, so it is a table — and a table shipped beside the catalogue is a
snapshot of the catalogue that goes stale.

It is also not `@hanzo/ui/brands`, which draws a company's own sign for a link
to that company, nor `@hanzo/ui/models`, which groups a fetched catalog into
families for a picker. Family is a display grouping over a list; org is the
namespace an id carries. A model has both and they are not the same string.

## Dependencies

`marked` and `simple-icons` are pinned here rather than in the workspace
catalog, because no other package in this repo uses either. Fold them into the
catalog when a second one does.

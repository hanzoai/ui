#!/usr/bin/env python3
import pathlib, re, sys

FILES = """pkg/ui/package.json pkg/ui/src/agents/Attachments.tsx pkg/ui/src/agents/ChannelMembers.tsx pkg/ui/src/agents/ChannelNotes.tsx pkg/ui/src/agents/Console.tsx pkg/ui/src/agents/DiffViewer.tsx pkg/ui/src/agents/Feedback.tsx pkg/ui/src/agents/FileTabs.tsx pkg/ui/src/agents/LiveVoiceCall.tsx pkg/ui/src/agents/MCPHub.tsx pkg/ui/src/agents/Pane.tsx pkg/ui/src/agents/ShortcutsSheet.tsx pkg/ui/src/agents/SwarmBar.tsx pkg/ui/src/agents/TerminalViewer.tsx pkg/ui/src/backends/gui/animated-testimonials.tsx pkg/ui/src/backends/gui/announcement.tsx pkg/ui/src/backends/gui/apple-cards-carousel.tsx pkg/ui/src/backends/gui/banner.tsx pkg/ui/src/backends/gui/breadcrumb.tsx pkg/ui/src/backends/gui/calendar.tsx pkg/ui/src/backends/gui/carousel.tsx pkg/ui/src/backends/gui/code-block.tsx pkg/ui/src/backends/gui/code-editor.tsx pkg/ui/src/backends/gui/data-table.tsx pkg/ui/src/backends/gui/date-picker.tsx pkg/ui/src/backends/gui/desktop-window.tsx pkg/ui/src/backends/gui/dialog-stack.tsx pkg/ui/src/backends/gui/dialog.tsx pkg/ui/src/backends/gui/drawer.tsx pkg/ui/src/backends/gui/dropdown-menu.tsx pkg/ui/src/backends/gui/dropzone.tsx pkg/ui/src/backends/gui/gantt.tsx pkg/ui/src/backends/gui/image-crop.tsx pkg/ui/src/backends/gui/input.tsx pkg/ui/src/backends/gui/json-tree.tsx pkg/ui/src/backends/gui/kanban.tsx pkg/ui/src/backends/gui/message-dock.tsx pkg/ui/src/backends/gui/navigation-bar.tsx pkg/ui/src/backends/gui/navigation-menu.tsx pkg/ui/src/backends/gui/number-field.tsx pkg/ui/src/backends/gui/pagination.tsx pkg/ui/src/backends/gui/pill.tsx pkg/ui/src/backends/gui/safari.tsx pkg/ui/src/backends/gui/select.tsx pkg/ui/src/backends/gui/snippet.tsx pkg/ui/src/backends/gui/terminal.tsx pkg/ui/src/backends/gui/toaster.tsx pkg/ui/src/backends/gui/video-player.tsx pkg/ui/src/chat/Composer.tsx pkg/ui/src/chat/Dictation.tsx pkg/ui/src/chat/EmptyPrompt.tsx pkg/ui/src/chat/Failure.tsx pkg/ui/src/chat/Mention.tsx pkg/ui/src/chat/Palette.tsx pkg/ui/src/chat/Plus.tsx pkg/ui/src/chat/Tune.tsx pkg/ui/src/consent/Consent.tsx pkg/ui/src/corner/Corner.tsx pkg/ui/src/corner/logic.ts pkg/ui/src/framework/RecordCards.tsx pkg/ui/src/marketing/ClosingCta.tsx pkg/ui/src/marketing/Footer.tsx pkg/ui/src/marketing/Plans.tsx pkg/ui/src/masthead/Masthead.tsx pkg/ui/src/models/ModelPickerMenu.tsx pkg/ui/src/onboarding/ChatOnboarding.tsx pkg/ui/src/onboarding/Checkout.tsx pkg/ui/src/onboarding/account.tsx pkg/ui/src/onboarding/frame.tsx pkg/ui/src/onboarding/screens.tsx pkg/ui/src/product/AppHeader.tsx pkg/ui/src/product/BranchSelect.tsx pkg/ui/src/product/ChipSelect.tsx pkg/ui/src/product/ComboBox.tsx pkg/ui/src/product/CommandMenu.tsx pkg/ui/src/product/DetailPane.tsx pkg/ui/src/product/Donut.tsx pkg/ui/src/product/LimitedBanner.tsx pkg/ui/src/product/Metric.tsx pkg/ui/src/product/OrgSwitcher.tsx pkg/ui/src/product/Pagination.tsx pkg/ui/src/product/PlanUsage.tsx pkg/ui/src/product/RepoSelect.tsx pkg/ui/src/product/SlideOver.tsx pkg/ui/src/product/Toast.tsx pkg/ui/src/product/social/CampaignCard.tsx""".split()

def resolve_conflicts(text):
    # prefer INCOMING (theirs) side wherever a block exists, EXCEPT when
    # incoming is empty and HEAD has content, or vice versa handle naturally:
    # incoming-empty + HEAD has useTranslate -> that block is an import only;
    # the useI18n hook line lives in another block. Preferring incoming (empty)
    # would drop the HEAD import line which we later add ourselves anyway.
    lines = text.splitlines(keepends=True)
    out = []
    i = 0
    while i < len(lines):
        if lines[i].startswith('<<<<<<<'):
            head = []
            inc = []
            i += 1
            while i < len(lines) and not lines[i].startswith('======='):
                head.append(lines[i]); i += 1
            i += 1  # =======
            while i < len(lines) and not lines[i].startswith('>>>>>>>'):
                inc.append(lines[i]); i += 1
            i += 1  # >>>>>>>
            # choose: incoming if either side mentions useI18n/phrase/8.30,
            # else incoming (newer main), unless incoming is empty and head
            # carries the only real content in this block.
            hs = ''.join(head); cs = ''.join(inc)
            if cs.strip() == '' and hs.strip() != '':
                # keep HEAD only if it does NOT reintroduce a deleted module
                out.extend(head)
            else:
                out.extend(inc)
            continue
        out.append(lines[i]); i += 1
    return ''.join(out)

def normalize_i18n(text, path):
    # Drop local useTranslate mechanism, keep #254 useI18n mechanism.
    # 1. remove local import line(s)
    text = re.sub(r"import\s*\{\s*useTranslate[^}]*\}\s*from\s*['\"][^'\"]*i18n/react['\"][^\n]*\n", '', text)
    # 2. replace translate call sites
    text = re.sub(r'(\bconst\s+)tr\s*=\s*useTranslate\(\)', r'\1{ t } = useI18n()', text)
    text = re.sub(r'(\bconst\s+)t\s*=\s*useTranslate\(\)', r'\1{ t } = useI18n()', text)
    # also `useTranslate()` with other var names e.g. `const translate =`
    # only rename variable `tr`; other names keep but with useI18n destructure is invalid,
    # so handle generic: const X = useTranslate() -> const { t: X } = useI18n()
    def repl(m):
        return f"{m.group(1)}{{ t: {m.group(2)} }} = useI18n()"
    text = re.sub(r'(\bconst\s+)([A-Za-z_$][\w$]*)\s*=\s*useTranslate\(\)', repl, text)
    # 3. rename tr( calls to t(
    text = re.sub(r'\btr\(', 't(', text)
    # 4. ensure useI18n import when needed
    needs = ('useI18n()' in text or re.search(r'\bt\(', text)) and ("from '@hanzo/i18n/react'" in text or 'from "@hanzo/i18n/react"' in text or "from '@hanzo/i18n'" in text and 'phrase(' in text)
    if 'useI18n()' in text and "useI18n" not in text.split('useI18n()')[0][-2000:].split('\n')[-1]:
        pass
    # simpler: if useI18n() present but import missing, insert after first import block
    if 'useI18n()' in text and "@hanzo/i18n/react" not in text:
        # insert after the last top-level import line in the head of file
        lines = text.splitlines(keepends=True)
        last_import = -1
        for idx, ln in enumerate(lines):
            if re.match(r'^\s*import\s', ln):
                last_import = idx
        if last_import >= 0:
            lines.insert(last_import + 1, "import { useI18n } from '@hanzo/i18n/react'\n")
        else:
            lines.insert(0, "import { useI18n } from '@hanzo/i18n/react'\n")
        text = ''.join(lines)
    # 5. if we still have a duplicate `const { t }` in same scope from keeping both
    #    sides (shouldn't happen with prefer-incoming), leave; typecheck will catch.
    # 6. dedupe double import of useI18n
    # remove second identical import line
    seen = False
    out_lines = []
    for ln in text.splitlines(keepends=True):
        if ln.strip() in ("import { useI18n } from '@hanzo/i18n/react'", 'import { useI18n } from "@hanzo/i18n/react"'):
            if seen:
                continue
            seen = True
        out_lines.append(ln)
    text = ''.join(out_lines)
    # 7. If file now imports useI18n but never calls it (corner/logic.ts uses phrase only), drop import
    if "import { useI18n } from '@hanzo/i18n/react'" in text and 'useI18n()' not in text:
        text = text.replace("import { useI18n } from '@hanzo/i18n/react'\n", '')
    return text

for f in FILES:
    p = pathlib.Path(f)
    if not p.exists():
        print('MISSING', f); continue
    t = p.read_text()
    orig = t
    t = resolve_conflicts(t)
    if f.endswith('package.json'):
        # ensure version 8.30.0 (newer than main 8.29.48), keep i18n export,
        # code.css, test:composer — check and restore if missing
        t = re.sub(r'"version":\s*"[^"]*"', '"version": "8.30.0"', t, count=1)
        # ensure ./i18n export exists (from #266 tree)
        if '"./i18n"' not in t:
            t = t.replace('    "./blocks": {', '    "./i18n": {\n      "types": "./dist/i18n/index.d.ts",\n      "import": "./dist/i18n/index.js",\n      "require": "./dist/i18n/index.cjs",\n      "default": "./dist/i18n/index.js"\n    },\n    "./blocks": {', 1)
        if 'styles/code.css' not in t:
            t = t.replace('"./styles/motion.css": "./dist/styles/motion.css",', '"./styles/motion.css": "./dist/styles/motion.css",\n    "./styles/code.css": "./dist/styles/code.css",', 1)
        if 'code.css dist/styles/code.css' not in t and 'scripts/compose-theme.mjs && cp src/styles/motion.css' in t:
            t = t.replace('cp src/styles/document.css dist/styles/document.css', 'cp src/styles/document.css dist/styles/document.css && cp src/styles/code.css dist/styles/code.css', 1)
        if '"test:composer"' not in t:
            t = t.replace('"test:corner":', '"test:composer": "node scripts/composer.mjs",\n    "test:corner":', 1)
    else:
        t = normalize_i18n(t, f)
    # sanity: fix duplicate { t } declarations left by double-mapping
    # collapse `const { t } = useI18n()` appearing twice consecutively (keep one)
    # only exact duplicate lines in a row
    t = re.sub(r'(\s*const\s*\{\s*t\s*\}\s*=\s*useI18n\(\)\n)(\s*const\s*\{\s*t\s*\}\s*=\s*useI18n\(\)\n)+', r'\1', t)
    if t != orig or '<<<<<<<' in orig:
        p.write_text(t)
    left = t.count('<<<<<<<')
    print(f, 'markers_left=', left)

print('done')

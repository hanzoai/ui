#!/usr/bin/env python3
"""Fix broken import blocks from the prefer-incoming resolution.

Pattern: an import line `import {` with body lines + `} from 'react'` got split
by the prefer-incoming choice: HEAD contributed the import header + some lines,
incoming contributed the closing `} from 'react'`. The repair re-merges:
find `import {` ... `from 'react'` fragments where the opening line is present
but the closing `} from 'react'` line is orphaned after other imports.
Simpler: for each broken file, restore its import header from main, then re-apply
useI18n import + remove useTranslate remnants.
"""
import pathlib, re, subprocess

broken = ['pkg/ui/src/agents/FileTree.tsx','pkg/ui/src/agents/Workspace.tsx',
          'pkg/ui/src/backends/gui/command.tsx','pkg/ui/src/backends/gui/select.tsx',
          'pkg/ui/src/chat/Plus.tsx','pkg/ui/src/product/ChipSelect.tsx']

for f in broken:
    p = pathlib.Path('/work')/f
    t = p.read_text()
    main = subprocess.run(['git','show',f'main:{f}'],capture_output=True,text=True,cwd='/work').stdout
    # extract main's import block (up to end of consecutive imports)
    lines = main.splitlines(keepends=True)
    hdrs=[]; i=0
    # find first non-import after header comment region
    for ln in lines:
        if ln.strip().startswith('import '):
            hdrs.append(ln)
        elif hdrs and ln.strip()=='':
            continue
        elif hdrs and not ln.strip().startswith('//') and not ln.strip().startswith('*') and not ln.strip().startswith('/*'):
            break
        elif not hdrs and ln.strip().startswith('//') and False:
            pass
    # crude: take all import lines from main that use @hanzo/gui, react, lucide
    imp_lines=[]
    skip=False
    for ln in lines:
        if ln.strip().startswith('import ') or skip:
            imp_lines.append(ln)
            if "from '" in ln or 'from "' in ln:
                skip=False
            elif ln.strip().startswith('import '):
                skip=True
        elif 'import ' in ''.join(imp_lines) and not ln.strip().startswith('import '):
            # if we have started collecting and hit non-import, and last was closed import, stop
            if imp_lines and ("from '" in imp_lines[-1] or 'from "' in imp_lines[-1]):
                break
            continue
    # remove old import region from work: from first import line to last line before first non-import def
    wlines = t.splitlines(keepends=True)
    # locate import region: contiguous lines starting with import or continuation (indented, type X, useState...)
    # Simpler: remove every line matching ^import |^\s+type |^\s+use\w+,|^\s+} from
    # but that would also remove code. Instead: use regex to replace broken fragments.
    # Approach: delete lines from first 'import ' to the line 'import { useI18n' (inclusive of junk between),
    # then insert main imports + useI18n.
    start = next((i for i,l in enumerate(wlines) if l.startswith('import ')), None)
    end = None
    for i,l in enumerate(wlines):
        if 'import { useI18n }' in l or 'import { phrase' in l or 'import { useI18n,' in l:
            end = i
    if start is None:
        print(f, 'no imports'); continue
    if end is None:
        end = start
    before = wlines[:start]
    after = wlines[end+1:]
    # also drop a stray blank line duplication
    block = ''.join(imp_lines)
    # ensure useI18n present if used
    if 'useI18n()' in t and "@hanzo/i18n/react" not in block:
        block += "import { useI18n } from '@hanzo/i18n/react'\n"
    # strip any useTranslate from block
    block = '\n'.join(l for l in block.splitlines() if 'useTranslate' not in l) + '\n'
    new = ''.join(before) + block + ''.join(after)
    p.write_text(new)
    print(f, 'imports rebuilt:', block.count('import'))

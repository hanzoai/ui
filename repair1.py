#!/usr/bin/env python3
"""Repair conflict resolution: union imports, dedupe duplicated blocks."""
import pathlib, re, subprocess

# Files with "Cannot find name" -> restore missing GUI/lucide imports from main
# Files with Duplicate/redeclare -> dedupe
files = subprocess.run(['git','diff','main','--name-only','--','pkg/ui/src/'],
                       capture_output=True, text=True, cwd='/work').stdout.split()
files = [f for f in files if f.endswith(('.tsx','.ts')) and 'i18n/' not in f and 'index.ts' not in f]

def main_imports(f):
    out = subprocess.run(['git','show',f'main:{f}'], capture_output=True, text=True, cwd='/work').stdout
    return out

for f in files:
    p = pathlib.Path('/work')/f
    if not p.exists(): continue
    t = p.read_text()
    main = main_imports(f)
    # 1. Union of import statements: if main has an import line whose text is
    #    missing in work, reinsert it (except useTranslate / old i18n local imports
    #    and except imports that conflict with useI18n replacement).
    # Collect main import lines
    for line in main.splitlines():
        s = line.strip()
        if not s.startswith('import '): continue
        if 'useTranslate' in s or "../i18n" in s or "../../i18n" in s or "./i18n" in s: continue
        # only add if that exact import line not present and identifiers used
        if s and s not in [l.strip() for l in t.splitlines()]:
            # check if any named import in this line is used in t but missing
            m = re.search(r'import\s*\{([^}]*)\}\s*from\s*[\'"]([^\'"]+)[\'"]', s)
            if m:
                names = [n.strip().replace('type ','').split(' as ')[-1] for n in m.group(1).split(',')]
                names = [n for n in names if n and n != 'type']
                missing = [n for n in names if re.search(rf'\b{n}\b', t)]
                if missing:
                    # insert after first import
                    t = t.replace('\n', '\n', 1)  # noop
                    lines = t.splitlines(keepends=True)
                    idx = next((i for i,l in enumerate(lines) if l.strip().startswith('import ')), 0)
                    lines.insert(idx, line + '\n')
                    t = ''.join(lines)
            elif 'import ' in s and 'from' in s and s not in t:
                # side-effect / namespace imports: add if path used? skip unless lucide/gui
                if '@hanzo/gui' in s or '@hanzogui/lucide' in s:
                    lines = t.splitlines(keepends=True)
                    idx = next((i for i,l in enumerate(lines) if l.strip().startswith('import ')), 0)
                    lines.insert(idx, line + '\n')
                    t = ''.join(lines)
    # 2. Dedupe exact duplicate import lines (keep first)
    seen=set(); out=[]
    for ln in t.splitlines(keepends=True):
        s=ln.strip()
        if s.startswith('import ') and s in seen:
            continue
        if s.startswith('import '): seen.add(s)
        out.append(ln)
    t=''.join(out)
    # 3. Dedupe consecutive duplicate const { t } = useI18n() (keep first in a run of <=3)
    t = re.sub(r'^([ \t]*const\s*\{\s*t\s*\}\s*=\s*useI18n\(\)\n)(\s*const\s*\{\s*t\s*\}\s*=\s*useI18n\(\)\n)+',
               r'\1', t, flags=re.M)
    # 4. Dedupe duplicate `const { t: tr } = useI18n()` similarly
    t = re.sub(r'^([ \t]*const\s*\{\s*t:\s*tr\s*\}\s*=\s*useI18n\(\)\n)(\s*const\s*\{\s*t:\s*tr\s*\}\s*=\s*useI18n\(\)\n)+',
               r'\1', t, flags=re.M)
    # 5. Remove duplicate `const t = useTranslate()` remnants / duplicate useState etc:
    #    exact consecutive duplicate lines starting with const and ending properly
    lines=t.splitlines(keepends=True)
    out=[]
    for ln in lines:
        if out and out[-1]==ln and 'const ' in ln and ('useI18n()' in ln or 'useTranslate()' in ln):
            continue
        out.append(ln)
    t=''.join(out)
    p.write_text(t)
print('repair1 done')

# Report remaining dup t per file
for f in files:
    t=(pathlib.Path('/work')/f).read_text()
    c=t.count("const { t } = useI18n()")
    if c>1:
        print(f, c)

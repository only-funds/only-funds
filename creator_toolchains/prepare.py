#!/usr/bin/env python3
"""Turn local Markdown / Notion / SiYuan Markdown ZIP exports into reviewable drafts. No network or model calls."""
import argparse
import json
import re
import zipfile
from pathlib import Path

MAX_INPUT = 5 * 1024 * 1024

def read_notes(source: Path) -> str:
    if source.suffix.lower() == '.zip':
        with zipfile.ZipFile(source) as archive:
            members = sorted((m for m in archive.infolist() if m.filename.lower().endswith(('.md', '.markdown'))), key=lambda m: m.filename)
            if not members:
                raise ValueError('The ZIP contains no Markdown notes. Export as Markdown from Notion or SiYuan.')
            if sum(m.file_size for m in members) > MAX_INPUT:
                raise ValueError('The Markdown export exceeds 5 MB.')
            # Read entries in memory only. Never extract paths or fetch linked resources.
            return '\n\n'.join(f'<!-- Source: {m.filename.replace("--", "")} -->\n' + archive.read(m).decode('utf-8-sig') for m in members)
    if source.suffix.lower() not in ('.md', '.markdown', '.txt'):
        raise ValueError('Use a Markdown, text, or Markdown ZIP export.')
    if source.stat().st_size > MAX_INPUT:
        raise ValueError('Notes exceed 5 MB.')
    return source.read_text(encoding='utf-8-sig')

def prepare(text: str, author: str) -> dict:
    title = next((line.lstrip('# ').strip() for line in text.splitlines() if line.startswith('# ')), '本周研究更新')[:90]
    sections = re.split(r'^##\s+', text, flags=re.MULTILINE)[1:]
    scenes = []
    for section in sections[:6]:
        heading, _, body = section.partition('\n')
        body = re.sub(r'<!--.*?-->', '', body, flags=re.DOTALL).strip()
        scenes.append({'title': heading.strip()[:90], 'body': body[:400], 'narration': body, 'duration': 10})
    if not scenes:
        body = re.sub(r'^#.*$', '', text, flags=re.MULTILINE).strip()
        scenes = [{'title': title, 'body': body[:400], 'narration': body, 'duration': 15}]
    return {'title': title, 'author': author, 'scenes': scenes}

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', type=Path)
    parser.add_argument('--out', required=True, type=Path)
    parser.add_argument('--author', default='OnlyFunds creator')
    args = parser.parse_args()
    text = read_notes(args.source)
    if not text.strip():
        parser.error('Source notes are empty.')
    args.out.mkdir(parents=True, exist_ok=True)
    outputs = ['notes.md', 'storyboard.json', 'draft.json']
    if any((args.out / name).exists() for name in outputs):
        parser.error('Output already contains a draft. Choose a new --out directory to preserve edits.')
    storyboard = prepare(text, args.author)
    (args.out / 'notes.md').write_text(text, encoding='utf-8')
    (args.out / 'storyboard.json').write_text(json.dumps(storyboard, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    (args.out / 'draft.json').write_text(json.dumps({'title': storyboard['title'], 'body': text[:20000], 'kind': 'note', 'tags': ['科研周报'], 'sources': []}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'Prepared notes, storyboard and draft in {args.out}. Review sources and text before rendering or publishing. No AI claims or narration audio were generated.')

if __name__ == '__main__':
    try:
        main()
    except (ValueError, OSError, zipfile.BadZipFile) as error:
        raise SystemExit(str(error)) from error

import json
from pathlib import Path

base = Path('public/locales')
languages = ['en', 'ru', 'uz']
namespaces = sorted([p.stem for p in (base / 'en').glob('*.json')])


def flatten(obj, prefix=''):
    items = {}
    if isinstance(obj, dict):
        for k, v in obj.items():
            key = f'{prefix}.{k}' if prefix else k
            if isinstance(v, dict):
                items.update(flatten(v, key))
            else:
                items[key] = True
    return items

missing = {}
for ns in namespaces:
    keys_by_lang = {}
    for lng in languages:
        file = base / lng / f'{ns}.json'
        if not file.exists():
            continue
        data = json.loads(file.read_text(encoding='utf8'))
        keys_by_lang[lng] = set(flatten(data).keys())
    union = set().union(*keys_by_lang.values())
    ns_missing = {}
    for key in sorted(union):
        for lng in languages:
            if key not in keys_by_lang.get(lng, set()):
                ns_missing.setdefault(lng, []).append(key)
    if ns_missing:
        missing[ns] = ns_missing

print(json.dumps(missing, indent=2, ensure_ascii=False))

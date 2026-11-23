#!/usr/bin/env python3
"""Ежедневный открытый поиск компаний в OpenStreetMap.

Запрашивает ОГРАНИЧЕННЫЕ области, использует только публичные контакты организации,
не угадывает сайты, не рассылает сообщения, сохраняет прежнюю базу при сбоях.
Запуск: python tools/update_leads.py
Пробный локальный тест нормализации: python -m unittest discover -s tools -p 'test_*.py'
"""
from __future__ import annotations

import datetime as dt
import json
import os
import pathlib
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from typing import Any

ROOT = pathlib.Path(__file__).resolve().parents[1]
TARGET = ROOT / 'data' / 'leads.json'
JS_TARGET = ROOT / 'data' / 'leads.js'
ENDPOINT = os.getenv('OVERPASS_URL', 'https://overpass.private.coffee/api/interpreter')
MAX_LEADS = 1400
# Центральные компактные районы городов РФ. OSM содержит только те контакты, которые опубликованы в источнике.
# Сканируем ограниченное число районов в сутки, чтобы беречь Overpass и не превышать лимиты.
CITIES = [
    ('Брянск', (53.205, 34.320, 53.293, 34.440)),
    ('Тула', (54.159, 37.565, 54.228, 37.690)),
    ('Калуга', (54.495, 36.210, 54.550, 36.340)),
    ('Курск', (51.694, 36.140, 51.781, 36.240)),
    ('Орёл', (52.932, 36.015, 53.020, 36.123)),
    ('Смоленск', (54.745, 31.995, 54.830, 32.120)),
    ('Воронеж', (51.619, 39.140, 51.718, 39.240)),
    ('Рязань', (54.594, 39.646, 54.672, 39.792)),
    ('Владимир', (56.093, 40.315, 56.168, 40.470)),
    ('Ярославль', (57.586, 39.807, 57.680, 39.960)),
    ('Тверь', (56.820, 35.815, 56.910, 35.970)),
    ('Иваново', (56.961, 40.915, 57.045, 41.050)),
    ('Пенза', (53.155, 44.980, 53.242, 45.100)),
    ('Саратов', (51.489, 45.930, 51.573, 46.055)),
    ('Тамбов', (52.693, 41.402, 52.770, 41.510)),
    ('Москва', (55.72, 37.565, 55.795, 37.685)),
    ('Санкт-Петербург', (59.917, 30.275, 59.98, 30.4)),
    ('Казань', (55.762, 49.075, 55.835, 49.175)),
    ('Нижний Новгород', (56.292, 43.923, 56.363, 44.035)),
    ('Новосибирск', (54.979, 82.882, 55.062, 83.001)),
    ('Краснодар', (45.012, 38.919, 45.085, 39.058)),
    ('Ростов-на-Дону', (47.197, 39.638, 47.296, 39.79)),
    ('Екатеринбург', (56.799, 60.543, 56.889, 60.684)),
    ('Пермь', (57.976, 56.158, 58.068, 56.3)),
    ('Челябинск', (55.113, 61.338, 55.21, 61.477)),
    ('Самара', (53.161, 50.094, 53.235, 50.222)),
    ('Уфа', (54.686, 55.895, 54.792, 56.055)),
    ('Волгоград', (48.676, 44.472, 48.769, 44.6)),
    ('Сочи', (43.569, 39.676, 43.66, 39.79)),
    ('Белгород', (50.561, 36.525, 50.656, 36.655)),
    ('Оренбург', (51.733, 55.04, 51.836, 55.196)),
    ('Киров', (58.555, 49.602, 58.648, 49.727)),
    ('Тольятти', (53.487, 49.356, 53.56, 49.504)),
    ('Владивосток', (43.089, 131.837, 43.159, 131.975)),
    ('Хабаровск', (48.452, 135.01, 48.555, 135.158)),
    ('Омск', (54.947, 73.301, 55.048, 73.454)),
    ('Тюмень', (57.126, 65.463, 57.206, 65.621)),
    ('Барнаул', (53.301, 83.712, 53.392, 83.857)),
    ('Томск', (56.44, 84.897, 56.524, 85.038)),
    ('Иркутск', (52.251, 104.233, 52.326, 104.362)),
    ('Мурманск', (68.922, 33.01, 69.014, 33.168)),
    ('Архангельск', (64.493, 40.44, 64.575, 40.618)),
    ('Калининград', (54.674, 20.441, 54.751, 20.606)),
    ('Псков', (57.776, 28.276, 57.868, 28.412)),
    ('Кемерово', (55.329, 85.999, 55.426, 86.147)),
]
NICHES = {
    ('amenity', 'cafe'): 'Кофейня', ('amenity','restaurant'): 'Кафе / ресторан',
    ('amenity','fast_food'): 'Кафе / фастфуд',
    ('shop','beauty'): 'Красота', ('shop','hairdresser'): 'Красота',
    ('shop','florist'): 'Цветы', ('shop','bakery'): 'Пекарня',
    ('shop','confectionery'): 'Кондитерская', ('shop','car_repair'): 'Автосервис',
    ('shop','mobile_phone'): 'Техника', ('shop','computer'): 'Техника',
    ('shop','gift'): 'Магазин подарков', ('shop','books'): 'Книжный магазин',
    ('shop','pet'): 'Зоомагазин', ('shop','clothes'): 'Магазин одежды',
    ('craft','tailor'): 'Ателье', ('craft','shoemaker'): 'Мастерская',
    ('craft','photographer'): 'Фотостудия', ('craft','electronics_repair'): 'Ремонт техники',
}


def select_cities(date: dt.date) -> list[tuple[str, tuple[float, ...]]]:
    per_day = 3
    slots = (len(CITIES) + per_day - 1) // per_day
    slot = (date.toordinal() % slots) * per_day
    return CITIES[slot:slot + per_day]


def build_query(bbox: tuple[float, ...]) -> str:
    bounds = ','.join(str(x) for x in bbox)
    return (f'[out:json][timeout:40];('
            f'nwr["amenity"~"^(cafe|restaurant|fast_food)$"]({bounds});'
            f'nwr["shop"~"^(beauty|hairdresser|florist|bakery|confectionery|car_repair|mobile_phone|computer|gift|books|pet|clothes)$"]({bounds});'
            f'nwr["craft"~"^(tailor|shoemaker|photographer|electronics_repair)$"]({bounds});'
            f');out center 400;')


def fetch_city(city: str, bbox: tuple[float, ...]) -> list[dict]:
    payload = urllib.parse.urlencode({'data': build_query(bbox)}).encode()
    request = urllib.request.Request(ENDPOINT, payload, headers={
        'User-Agent': 'PolyScout/1.0 (personal research tool; low-frequency OSM fetch)',
        'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json',
    })
    with urllib.request.urlopen(request, timeout=55) as resp:
        result = json.load(resp)
    if not isinstance(result.get('elements'), list):
        raise ValueError('Неожиданный ответ Overpass')
    items = []
    for obj in result['elements']:
        lead = parse_element(obj, city)
        if lead is not None:
            items.append(lead)
    print(f'  {city}: {len(items)} кандидатов с контактами', flush=True)
    return items


def normal_url(value: Any) -> str:
    raw = str(value or '').strip().split(';')[0].strip()
    if raw and not re.match(r'^https?://', raw, flags=re.I) and re.match(r'^[\w.-]+\.[a-z]{2,}(/.*)?$', raw, flags=re.I):
        raw = 'https://' + raw
    try:
        parsed = urllib.parse.urlparse(raw)
        if parsed.scheme in ('https','http') and parsed.hostname and '.' in parsed.hostname:
            return raw
    except ValueError:
        pass
    return ''


def social(value: Any, network: str) -> str:
    raw = str(value or '').strip().split(';')[0].strip()
    if not raw:
        return ''
    if re.fullmatch(r'@?[\w.\-]{3,64}', raw):
        return 'https://' + ('t.me/' if network == 'telegram' else 'vk.com/') + raw.lstrip('@')
    if raw.startswith(('t.me/','vk.com/','vk.ru/')):
        raw = 'https://' + raw
    url = normal_url(raw)
    if not url:
        return ''
    host = (urllib.parse.urlparse(url).hostname or '').lower()
    valid = ('t.me','telegram.me') if network == 'telegram' else ('vk.com','www.vk.com','vk.ru','www.vk.ru')
    return url if host in valid else ''


def phone(value: Any) -> str:
    val = str(value or '').strip().split(';')[0].strip()
    return val[:55] if 8 <= len(re.sub(r'\D', '', val)) <= 16 else ''


def email(value: Any) -> str:
    val = str(value or '').strip().split(';')[0].strip()
    return val[:120] if re.fullmatch(r'[^\s@]+@[^\s@]+\.[^\s@]+', val) else ''


def first(tags: dict[str, Any], *keys: str) -> Any:
    return next((tags[k] for k in keys if tags.get(k)), '')


def parse_element(obj: dict, city: str) -> dict | None:
    tags = obj.get('tags') or {}
    name = str(tags.get('name:ru') or tags.get('name') or '').strip()
    if not 2 <= len(name) <= 125 or not obj.get('id') or obj.get('type') not in ('node','way','relation'):
        return None
    # Берём только контакты бизнеса; отдельные имена людей не собираем.
    tel = phone(first(tags, 'contact:phone','phone', 'contact:mobile'))
    tg = social(first(tags, 'contact:telegram','telegram'), 'telegram')
    vk = social(first(tags, 'contact:vk','vk'), 'vk')
    mail = email(first(tags,'contact:email','email'))
    if not (tel or tg or vk or mail):
        return None
    category = next((title for (key,value),title in NICHES.items() if tags.get(key)==value), 'Малый бизнес')
    web = normal_url(first(tags,'website','contact:website','url'))
    # "missing" означает ТОЛЬКО отсутствие тега сайта в OSM, а не отсутствие реального сайта.
    addr = ', '.join(filter(None, [tags.get('addr:street'),tags.get('addr:housenumber')]))
    return {
        'id': f"osm:{obj['type']}:{obj['id']}",
        'name': name, 'city': city, 'category': category,
        'address': addr, 'phone': tel, 'telegram': tg, 'vk': vk, 'email': mail,
        'website': web, 'site_status': 'yes' if web else 'missing',
        'source': 'OpenStreetMap / Overpass',
        'source_url': f"https://www.openstreetmap.org/{obj['type']}/{obj['id']}",
        'last_seen': dt.datetime.now(dt.timezone.utc).isoformat(timespec='seconds'),
    }


def main() -> int:
    if TARGET.exists():
        try:
            old = json.loads(TARGET.read_text(encoding='utf-8'))
        except (ValueError, OSError):
            print('Ошибка: существующий JSON повреждён. Не перезаписываем файл.', file=sys.stderr)
            return 1
    else:
        old = {'leads': []}
    all_leads = {x['id']: x for x in old.get('leads', []) if isinstance(x, dict) and x.get('id')}
    successes = 0
    names = []
    for city,bbox in select_cities(dt.datetime.now(dt.timezone.utc).date()):
        try:
            for lead in fetch_city(city,bbox):
                if lead['id'] in all_leads and 'first_seen' in all_leads[lead['id']]:
                    lead['first_seen'] = all_leads[lead['id']]['first_seen']
                else:
                    lead['first_seen'] = lead['last_seen']
                all_leads[lead['id']] = lead
            successes += 1
            names.append(city)
        except (TimeoutError, OSError, ValueError, urllib.error.HTTPError) as exc:
            print(f'  {city}: нет ответа: {exc}', file=sys.stderr, flush=True)
        time.sleep(2)  # щадящий доступ к общественному ресурсу
    if successes == 0:
        print('Все запросы не удались. Старая база сохранена.', file=sys.stderr)
        return 1
    combined = sorted(all_leads.values(), key=lambda x: (x.get('last_seen',''),x['id']), reverse=True)[:MAX_LEADS]
    data = {
        'updated_at': dt.datetime.now(dt.timezone.utc).isoformat(timespec='seconds'),
        'last_scan_cities': names,
        'source': 'OpenStreetMap via Overpass API',
        'leads': combined,
    }
    temp = TARGET.with_suffix('.json.tmp')
    temp.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    temp.replace(TARGET)
    js_temp = JS_TARGET.with_suffix('.js.tmp')
    js_temp.write_text('window.POLY_LIVE_DATA = ' + json.dumps(data,ensure_ascii=False,separators=(',',':')) + ';\n',encoding='utf-8')
    js_temp.replace(JS_TARGET)
    print(f'Готово: {len(combined)} компаний. Городов просканировано: {successes}')
    return 0

if __name__ == '__main__':
    sys.exit(main())

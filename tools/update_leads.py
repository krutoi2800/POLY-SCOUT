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
# Первый сервер можно заменить через OVERPASS_URL, второй — резервный.
# Резерв используется только при сбое первого: ограничиваем нагрузку на публичные API.
ENDPOINTS = [
    os.getenv('OVERPASS_URL', 'https://overpass.private.coffee/api/interpreter'),
    'https://overpass-api.de/api/interpreter',
]
MAX_LEADS = 9000
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

# Дополнительные города: небольшая область вокруг центральной точки.
# Это не граница населённого пункта: охватываются прежде всего центральные кварталы.
EXTRA_CITY_CENTERS = [('Абакан', 53.72, 91.44), ('Ачинск', 56.28, 90.5), ('Ангарск', 52.54, 103.89), ('Анапа', 44.9, 37.32), ('Арзамас', 55.39, 43.84), ('Армавир', 45.0, 41.12), ('Артём', 43.35, 132.19), ('Азов', 47.11, 39.42), ('Балаково', 52.02, 47.8), ('Балашиха', 55.8, 37.95), ('Батайск', 47.14, 39.75), ('Бийск', 52.54, 85.21), ('Биробиджан', 48.79, 132.93), ('Благовещенск', 50.29, 127.53), ('Борисоглебск', 51.37, 42.08), ('Братск', 56.15, 101.63), ('Великие Луки', 56.34, 30.53), ('Великий Новгород', 58.52, 31.27), ('Владикавказ', 43.04, 44.68), ('Волжский', 48.79, 44.78), ('Вологда', 59.22, 39.89), ('Волгодонск', 47.52, 42.15), ('Выборг', 60.71, 28.75), ('Гатчина', 59.57, 30.13), ('Геленджик', 44.56, 38.08), ('Глазов', 58.14, 52.66), ('Грозный', 43.32, 45.7), ('Губкин', 51.28, 37.54), ('Дербент', 42.06, 48.29), ('Дзержинск', 56.24, 43.46), ('Димитровград', 54.22, 49.6), ('Домодедово', 55.44, 37.77), ('Ейск', 46.7, 38.28), ('Елец', 52.62, 38.5), ('Ессентуки', 44.04, 42.86), ('Железногорск (Курская обл.)', 52.34, 35.35), ('Жигулёвск', 53.4, 49.5), ('Зеленодольск', 55.84, 48.52), ('Златоуст', 55.17, 59.67), ('Ижевск', 56.85, 53.2), ('Йошкар-Ола', 56.64, 47.9), ('Каменск-Уральский', 56.41, 61.93), ('Камышин', 50.08, 45.4), ('Канск', 56.2, 95.7), ('Каспийск', 42.88, 47.64), ('Кисловодск', 43.91, 42.72), ('Коломна', 55.09, 38.77), ('Комсомольск-на-Амуре', 50.55, 137.01), ('Королёв', 55.91, 37.82), ('Кострома', 57.77, 40.93), ('Красногорск', 55.83, 37.33), ('Красноярск', 56.01, 92.87), ('Кстово', 56.15, 44.21), ('Курган', 55.44, 65.34), ('Кызыл', 51.72, 94.45), ('Липецк', 52.6, 39.58), ('Люберцы', 55.68, 37.89), ('Магнитогорск', 53.42, 58.98), ('Майкоп', 44.61, 40.1), ('Махачкала', 42.98, 47.5), ('Миасс', 55.05, 60.11), ('Минеральные Воды', 44.21, 43.13), ('Минусинск', 53.71, 91.68), ('Мичуринск', 52.89, 40.5), ('Мытищи', 55.91, 37.73), ('Набережные Челны', 55.74, 52.41), ('Назрань', 43.23, 44.77), ('Нальчик', 43.48, 43.6), ('Находка', 42.82, 132.88), ('Невинномысск', 44.64, 41.94), ('Нефтекамск', 56.09, 54.25), ('Нефтеюганск', 61.09, 72.6), ('Нижневартовск', 60.93, 76.56), ('Нижнекамск', 55.64, 51.82), ('Нижний Тагил', 57.91, 59.96), ('Новокузнецк', 53.76, 87.1), ('Новокуйбышевск', 53.1, 49.95), ('Новомосковск', 54.01, 38.29), ('Новороссийск', 44.72, 37.77), ('Новый Уренгой', 66.08, 76.63), ('Норильск', 69.35, 88.2), ('Ноябрьск', 63.2, 75.45), ('Обнинск', 55.1, 36.61), ('Одинцово', 55.68, 37.28), ('Октябрьский', 54.48, 53.47), ('Орехово-Зуево', 55.8, 38.97), ('Петрозаводск', 61.79, 34.36), ('Петропавловск-Камчатский', 53.04, 158.65), ('Подольск', 55.43, 37.55), ('Прокопьевск', 53.88, 86.74), ('Пушкино', 56.01, 37.84), ('Пятигорск', 44.04, 43.06), ('Реутов', 55.76, 37.86), ('Россошь', 50.2, 39.57), ('Рубцовск', 51.5, 81.21), ('Рыбинск', 58.05, 38.84), ('Салават', 53.36, 55.92), ('Салехард', 66.53, 66.6), ('Саранск', 54.18, 45.18), ('Северодвинск', 64.56, 39.83), ('Северск', 56.6, 84.88), ('Сергиев Посад', 56.3, 38.13), ('Серпухов', 54.92, 37.43), ('Ставрополь', 45.04, 41.97), ('Старый Оскол', 51.3, 37.84), ('Стерлитамак', 53.63, 55.95), ('Сургут', 61.25, 73.39), ('Сызрань', 53.16, 48.47), ('Сыктывкар', 61.67, 50.84), ('Таганрог', 47.21, 38.93), ('Тобольск', 58.2, 68.25), ('Туапсе', 44.1, 39.1), ('Улан-Удэ', 51.83, 107.58), ('Ульяновск', 54.32, 48.38), ('Уссурийск', 43.8, 131.95), ('Усолье-Сибирское', 52.75, 103.65), ('Ханты-Мансийск', 61.0, 69.0), ('Химки', 55.89, 37.43), ('Чебоксары', 56.14, 47.25), ('Черкесск', 44.23, 42.05), ('Череповец', 59.13, 37.91), ('Чита', 52.03, 113.5), ('Шахты', 47.71, 40.22), ('Щёлково', 55.92, 38.0), ('Электросталь', 55.79, 38.45), ('Элиста', 46.31, 44.27), ('Энгельс', 51.48, 46.13), ('Южно-Сахалинск', 46.96, 142.73), ('Якутск', 62.03, 129.74), ('Ялуторовск', 56.65, 66.3), ('Зеленоград', 55.99, 37.19)]
CITIES.extend((name, (round(lat-.037, 4), round(lon-.055, 4), round(lat+.037, 4), round(lon+.055, 4)))
              for name, lat, lon in EXTRA_CITY_CENTERS)

NICHES = {('amenity', 'cafe'): 'Кофейня', ('amenity', 'restaurant'): 'Ресторан', ('amenity', 'fast_food'): 'Фастфуд', ('amenity', 'bar'): 'Бар', ('amenity', 'pub'): 'Паб', ('amenity', 'ice_cream'): 'Мороженое', ('shop', 'bakery'): 'Пекарня', ('shop', 'confectionery'): 'Кондитерская', ('shop', 'pastry'): 'Кондитерская', ('shop', 'coffee'): 'Кофейный магазин', ('shop', 'tea'): 'Чайный магазин', ('shop', 'deli'): 'Гастроном', ('shop', 'beauty'): 'Салон красоты', ('shop', 'hairdresser'): 'Парикмахерская', ('shop', 'cosmetics'): 'Косметика', ('shop', 'perfumery'): 'Парфюмерия', ('shop', 'massage'): 'Массажный салон', ('shop', 'tattoo'): 'Тату-студия', ('shop', 'optician'): 'Оптика', ('shop', 'hearing_aids'): 'Слуховые аппараты', ('shop', 'chemist'): 'Магазин косметики и здоровья', ('amenity', 'dentist'): 'Стоматология', ('amenity', 'clinic'): 'Клиника', ('amenity', 'veterinary'): 'Ветеринарная клиника', ('amenity', 'pharmacy'): 'Аптека', ('healthcare', 'physiotherapist'): 'Физиотерапия', ('healthcare', 'dentist'): 'Стоматология', ('shop', 'car_repair'): 'Автосервис', ('shop', 'car_parts'): 'Автозапчасти', ('shop', 'car'): 'Автосалон', ('shop', 'tyres'): 'Шиномонтаж', ('shop', 'motorcycle'): 'Мотомагазин', ('shop', 'bicycle'): 'Веломагазин', ('shop', 'bicycle_repair'): 'Ремонт велосипедов', ('amenity', 'car_wash'): 'Автомойка', ('amenity', 'car_rental'): 'Аренда автомобилей', ('amenity', 'driving_school'): 'Автошкола', ('craft', 'electrician'): 'Электрик', ('craft', 'plumber'): 'Сантехник', ('craft', 'carpenter'): 'Столярная мастерская', ('craft', 'painter'): 'Малярные работы', ('craft', 'locksmith'): 'Слесарная мастерская', ('craft', 'glaziery'): 'Стекольная мастерская', ('craft', 'builder'): 'Строительные услуги', ('craft', 'roofer'): 'Кровельные работы', ('craft', 'floorer'): 'Укладка полов', ('craft', 'hvac'): 'Климатическое оборудование', ('craft', 'electronics_repair'): 'Ремонт электроники', ('craft', 'shoemaker'): 'Ремонт обуви', ('craft', 'tailor'): 'Ателье', ('craft', 'photographer'): 'Фотостудия', ('craft', 'signmaker'): 'Изготовление вывесок', ('craft', 'upholsterer'): 'Реставрация мебели', ('shop', 'hardware'): 'Строительные товары', ('shop', 'doityourself'): 'Строймаркет', ('shop', 'trade'): 'Товары для ремонта', ('shop', 'paint'): 'Магазин красок', ('shop', 'electrical'): 'Электротовары', ('shop', 'clothes'): 'Магазин одежды', ('shop', 'shoes'): 'Обувной магазин', ('shop', 'fashion_accessories'): 'Аксессуары', ('shop', 'jewelry'): 'Ювелирный магазин', ('shop', 'gift'): 'Магазин подарков', ('shop', 'books'): 'Книжный магазин', ('shop', 'stationery'): 'Канцтовары', ('shop', 'toys'): 'Магазин игрушек', ('shop', 'pet'): 'Зоомагазин', ('shop', 'florist'): 'Цветочный магазин', ('shop', 'furniture'): 'Мебельный магазин', ('shop', 'interior_decoration'): 'Декор интерьера', ('shop', 'houseware'): 'Товары для дома', ('shop', 'electronics'): 'Магазин электроники', ('shop', 'computer'): 'Компьютерный магазин', ('shop', 'mobile_phone'): 'Салон связи', ('shop', 'sports'): 'Спортивный магазин', ('shop', 'musical_instrument'): 'Музыкальные инструменты', ('shop', 'art'): 'Товары для творчества', ('shop', 'second_hand'): 'Секонд-хенд', ('shop', 'fabric'): 'Магазин тканей', ('shop', 'curtain'): 'Шторы', ('shop', 'variety_store'): 'Универсальный магазин', ('shop', 'garden_centre'): 'Садовый центр', ('shop', 'greengrocer'): 'Овощной магазин', ('shop', 'seafood'): 'Рыбный магазин', ('shop', 'butcher'): 'Мясной магазин', ('shop', 'convenience'): 'Магазин у дома', ('shop', 'supermarket'): 'Продуктовый магазин', ('leisure', 'fitness_centre'): 'Фитнес-клуб', ('leisure', 'sports_centre'): 'Спортивный клуб', ('leisure', 'dance'): 'Танцевальная студия', ('leisure', 'bowling_alley'): 'Боулинг', ('amenity', 'cinema'): 'Кинотеатр', ('amenity', 'music_school'): 'Музыкальная школа', ('amenity', 'arts_centre'): 'Арт-центр', ('office', 'estate_agent'): 'Агентство недвижимости', ('office', 'travel_agent'): 'Турагентство', ('office', 'insurance'): 'Страхование', ('office', 'accountant'): 'Бухгалтерские услуги', ('office', 'lawyer'): 'Юридические услуги', ('office', 'advertising_agency'): 'Рекламное агентство', ('office', 'it'): 'IT-услуги', ('office', 'company'): 'Компания', ('office', 'employment_agency'): 'Кадровое агентство', ('office', 'consulting'): 'Консалтинг', ('shop', 'laundry'): 'Прачечная', ('shop', 'dry_cleaning'): 'Химчистка', ('shop', 'copyshop'): 'Копицентр', ('shop', 'printing'): 'Типография', ('shop', 'photo'): 'Фотосалон', ('craft', 'cleaning'): 'Клининговые услуги', ('tourism', 'hotel'): 'Отель', ('tourism', 'guest_house'): 'Гостевой дом', ('tourism', 'hostel'): 'Хостел', ('tourism', 'motel'): 'Мотель', ('tourism', 'apartment'): 'Апарт-отель', ('amenity', 'events_venue'): 'Площадка для мероприятий', ('amenity', 'language_school'): 'Языковая школа', ('amenity', 'training'): 'Учебный центр', ('amenity', 'kindergarten'): 'Детский сад', ('office', 'educational_institution'): 'Образовательный центр'}
NICHE_GROUPS = {'Кофейня': 'Кафе и питание', 'Ресторан': 'Кафе и питание', 'Фастфуд': 'Кафе и питание', 'Бар': 'Кафе и питание', 'Паб': 'Кафе и питание', 'Мороженое': 'Кафе и питание', 'Пекарня': 'Кафе и питание', 'Кондитерская': 'Кафе и питание', 'Кофейный магазин': 'Кафе и питание', 'Чайный магазин': 'Кафе и питание', 'Гастроном': 'Кафе и питание', 'Салон красоты': 'Красота и здоровье', 'Парикмахерская': 'Красота и здоровье', 'Косметика': 'Красота и здоровье', 'Парфюмерия': 'Красота и здоровье', 'Массажный салон': 'Красота и здоровье', 'Тату-студия': 'Красота и здоровье', 'Оптика': 'Красота и здоровье', 'Слуховые аппараты': 'Красота и здоровье', 'Магазин косметики и здоровья': 'Красота и здоровье', 'Стоматология': 'Красота и здоровье', 'Клиника': 'Красота и здоровье', 'Ветеринарная клиника': 'Красота и здоровье', 'Аптека': 'Красота и здоровье', 'Физиотерапия': 'Красота и здоровье', 'Автосервис': 'Авто и транспорт', 'Автозапчасти': 'Авто и транспорт', 'Автосалон': 'Авто и транспорт', 'Шиномонтаж': 'Авто и транспорт', 'Мотомагазин': 'Авто и транспорт', 'Веломагазин': 'Авто и транспорт', 'Ремонт велосипедов': 'Авто и транспорт', 'Автомойка': 'Авто и транспорт', 'Аренда автомобилей': 'Авто и транспорт', 'Автошкола': 'Авто и транспорт', 'Электрик': 'Ремонт и строительство', 'Сантехник': 'Ремонт и строительство', 'Столярная мастерская': 'Ремонт и строительство', 'Малярные работы': 'Ремонт и строительство', 'Слесарная мастерская': 'Ремонт и строительство', 'Стекольная мастерская': 'Ремонт и строительство', 'Строительные услуги': 'Ремонт и строительство', 'Кровельные работы': 'Ремонт и строительство', 'Укладка полов': 'Ремонт и строительство', 'Климатическое оборудование': 'Ремонт и строительство', 'Ремонт электроники': 'Ремонт и строительство', 'Ремонт обуви': 'Ремонт и строительство', 'Ателье': 'Ремонт и строительство', 'Фотостудия': 'Ремонт и строительство', 'Изготовление вывесок': 'Ремонт и строительство', 'Реставрация мебели': 'Ремонт и строительство', 'Строительные товары': 'Ремонт и строительство', 'Строймаркет': 'Ремонт и строительство', 'Товары для ремонта': 'Ремонт и строительство', 'Магазин красок': 'Ремонт и строительство', 'Электротовары': 'Ремонт и строительство', 'Магазин одежды': 'Магазины и товары', 'Обувной магазин': 'Магазины и товары', 'Аксессуары': 'Магазины и товары', 'Ювелирный магазин': 'Магазины и товары', 'Магазин подарков': 'Магазины и товары', 'Книжный магазин': 'Магазины и товары', 'Канцтовары': 'Магазины и товары', 'Магазин игрушек': 'Магазины и товары', 'Зоомагазин': 'Магазины и товары', 'Цветочный магазин': 'Магазины и товары', 'Мебельный магазин': 'Магазины и товары', 'Декор интерьера': 'Магазины и товары', 'Товары для дома': 'Магазины и товары', 'Магазин электроники': 'Магазины и товары', 'Компьютерный магазин': 'Магазины и товары', 'Салон связи': 'Магазины и товары', 'Спортивный магазин': 'Магазины и товары', 'Музыкальные инструменты': 'Магазины и товары', 'Товары для творчества': 'Магазины и товары', 'Секонд-хенд': 'Магазины и товары', 'Магазин тканей': 'Магазины и товары', 'Шторы': 'Магазины и товары', 'Универсальный магазин': 'Магазины и товары', 'Садовый центр': 'Магазины и товары', 'Овощной магазин': 'Магазины и товары', 'Рыбный магазин': 'Магазины и товары', 'Мясной магазин': 'Магазины и товары', 'Магазин у дома': 'Магазины и товары', 'Продуктовый магазин': 'Магазины и товары', 'Фитнес-клуб': 'Спорт и досуг', 'Спортивный клуб': 'Спорт и досуг', 'Танцевальная студия': 'Спорт и досуг', 'Боулинг': 'Спорт и досуг', 'Кинотеатр': 'Спорт и досуг', 'Музыкальная школа': 'Спорт и досуг', 'Арт-центр': 'Спорт и досуг', 'Агентство недвижимости': 'Услуги и специалисты', 'Турагентство': 'Услуги и специалисты', 'Страхование': 'Услуги и специалисты', 'Бухгалтерские услуги': 'Услуги и специалисты', 'Юридические услуги': 'Услуги и специалисты', 'Рекламное агентство': 'Услуги и специалисты', 'IT-услуги': 'Услуги и специалисты', 'Компания': 'Услуги и специалисты', 'Кадровое агентство': 'Услуги и специалисты', 'Консалтинг': 'Услуги и специалисты', 'Прачечная': 'Услуги и специалисты', 'Химчистка': 'Услуги и специалисты', 'Копицентр': 'Услуги и специалисты', 'Типография': 'Услуги и специалисты', 'Фотосалон': 'Услуги и специалисты', 'Клининговые услуги': 'Услуги и специалисты', 'Отель': 'Отдых и проживание', 'Гостевой дом': 'Отдых и проживание', 'Хостел': 'Отдых и проживание', 'Мотель': 'Отдых и проживание', 'Апарт-отель': 'Отдых и проживание', 'Площадка для мероприятий': 'Отдых и проживание', 'Языковая школа': 'Обучение и дети', 'Учебный центр': 'Обучение и дети', 'Детский сад': 'Обучение и дети', 'Образовательный центр': 'Обучение и дети'}


def select_cities(date: dt.date) -> list[tuple[str, tuple[float, ...]]]:
    per_day = max(1, min(10, int(os.getenv('POLY_CITIES_PER_RUN','6'))))
    slots = (len(CITIES) + per_day - 1) // per_day
    slot = (date.toordinal() % slots) * per_day
    return CITIES[slot:slot + per_day]


def build_query(bbox: tuple[float, ...]) -> str:
    """Запрос всех перечисленных коммерческих ниш в небольшой области."""
    bounds = ','.join(str(x) for x in bbox)
    by_key: dict[str, list[str]] = {}
    for key, value in NICHES:
        by_key.setdefault(key, []).append(value)
    clauses = []
    for key, values in by_key.items():
        regexp = '|'.join(re.escape(x) for x in sorted(set(values)))
        clauses.append(f'nwr["{key}"~"^({regexp})$"]({bounds});')
    return '[out:json][timeout:45];(' + ''.join(clauses) + ');out center 1000;'


def fetch_city(city: str, bbox: tuple[float, ...]) -> list[dict]:
    payload = urllib.parse.urlencode({'data': build_query(bbox)}).encode()
    result = None
    last_error = None
    for endpoint in dict.fromkeys(ENDPOINTS):
        request = urllib.request.Request(endpoint, payload, headers={
            'User-Agent': 'PolyScout/1.1 (personal research; low-frequency OSM fetch)',
            'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json',
        })
        try:
            with urllib.request.urlopen(request, timeout=55) as resp:
                candidate = json.load(resp)
            if not isinstance(candidate.get('elements'), list):
                raise ValueError('Неожиданный ответ Overpass')
            result = candidate
            break
        except (OSError, TimeoutError, ValueError, json.JSONDecodeError) as exc:
            last_error = exc
            print(f'    Сервер Overpass недоступен: {type(exc).__name__}', file=sys.stderr, flush=True)
            time.sleep(1)
    if result is None:
        raise ConnectionError(f'Нет ответа от Overpass: {last_error}')
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
    # Берём только публичные контакты бизнеса; отдельные имена людей не собираем.
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
        'name': name, 'city': city, 'category': category, 'group': NICHE_GROUPS.get(category, 'Прочее'),
        'address': addr, 'phone': tel, 'telegram': tg, 'vk': vk, 'email': mail,
        'website': web, 'site_status': 'yes' if web else 'missing',
        'source': 'OpenStreetMap / Overpass',
        'source_url': f"https://www.openstreetmap.org/{obj['type']}/{obj['id']}",
        'last_seen': dt.datetime.now(dt.timezone.utc).isoformat(timespec='seconds'),
    }


def main() -> int:
    import argparse
    parser = argparse.ArgumentParser(description='Сбор публичных контактов организаций из OSM')
    parser.add_argument('--city', help='Один город из каталога (ручной запуск)')
    parser.add_argument('--list-cities', action='store_true', help='Вывести города из каталога')
    args = parser.parse_args()
    if args.list_cities:
        for name, _ in sorted(CITIES, key=lambda x:x[0]): print(name)
        return 0
    target_cities = select_cities(dt.datetime.now(dt.timezone.utc).date())
    if args.city:
        names = {name.casefold(): (name,bbox) for name,bbox in CITIES}
        if args.city.strip().casefold() not in names:
            print('Город не найден в каталоге. Используй --list-cities.', file=sys.stderr)
            return 2
        target_cities = [names[args.city.strip().casefold()]]
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
    for city,bbox in target_cities:
        try:
            for lead in fetch_city(city,bbox):
                if lead['id'] in all_leads and 'first_seen' in all_leads[lead['id']]:
                    lead['first_seen'] = all_leads[lead['id']]['first_seen']
                else:
                    lead['first_seen'] = lead['last_seen']
                all_leads[lead['id']] = lead
            successes += 1
            names.append(city)
        except (TimeoutError, OSError, ValueError, urllib.error.HTTPError, ConnectionError) as exc:
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

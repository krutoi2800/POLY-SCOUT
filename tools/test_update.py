import unittest
from update_leads import parse_element, normal_url, social, select_cities, CITIES, NICHES, build_query
import datetime as dt

class ScraperTests(unittest.TestCase):
    def test_lead_with_phone_no_site(self):
        row = parse_element({'type':'node','id':23,'tags':{'name':'Пример мастерской','shop':'florist','phone':'+7 900 100 20 30'}}, 'Брянск')
        self.assertEqual(row['site_status'],'missing')
        self.assertEqual(row['source_url'],'https://www.openstreetmap.org/node/23')
        self.assertEqual(row['category'],'Цветочный магазин')
    def test_no_contact_discarded(self):
        self.assertIsNone(parse_element({'type':'node','id':12,'tags':{'name':'Без контактов','amenity':'cafe'}},'Тула'))
    def test_bad_url(self):
        self.assertEqual(normal_url('javascript:alert(1)'), '')
    def test_social_validation(self):
        self.assertEqual(social('https://evil.test/username','vk'),'')
        self.assertEqual(social('@studio','telegram'),'https://t.me/studio')
    def test_rotation(self):
        self.assertGreaterEqual(len(select_cities(dt.date(2026,11,22))),1)
        self.assertLessEqual(len(select_cities(dt.date(2026,11,22))),6)
    def test_catalog_scale(self):
        self.assertGreaterEqual(len(CITIES),150)
        self.assertGreaterEqual(len(set(c for c,_ in CITIES)),150)
        self.assertGreaterEqual(len(set(NICHES.values())),100)
    def test_extended_niches_in_request(self):
        query=build_query((53.2,34.32,53.29,34.44))
        for item in ('estate_agent','fitness_centre','dentist','car_repair','furniture','hotel'):
            self.assertIn(item,query)
    def test_extended_category_with_contact(self):
        lead=parse_element({'type':'node','id':75,'tags':{'name':'Пример спортклуба','leisure':'fitness_centre','contact:email':'club@example.com'}},'Тула')
        self.assertEqual(lead['category'],'Фитнес-клуб')
        self.assertEqual(lead['group'],'Спорт и досуг')

if __name__=='__main__': unittest.main()

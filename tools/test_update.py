import unittest
from update_leads import parse_element, normal_url, social, select_cities
import datetime as dt

class ScraperTests(unittest.TestCase):
    def test_lead_with_phone_no_site(self):
        row = parse_element({'type':'node','id':23,'tags':{'name':'Пример мастерской','shop':'florist','phone':'+7 900 100 20 30'}}, 'Брянск')
        self.assertEqual(row['site_status'],'missing')
        self.assertEqual(row['source_url'],'https://www.openstreetmap.org/node/23')
        self.assertEqual(row['category'],'Цветы')
    def test_no_contact_discarded(self):
        self.assertIsNone(parse_element({'type':'node','id':12,'tags':{'name':'Без контактов','amenity':'cafe'}},'Тула'))
    def test_bad_url(self):
        self.assertEqual(normal_url('javascript:alert(1)'), '')
    def test_social_validation(self):
        self.assertEqual(social('https://evil.test/username','vk'),'')
        self.assertEqual(social('@studio','telegram'),'https://t.me/studio')
    def test_rotation(self):
        self.assertEqual(len(select_cities(dt.date(2026,11,22))),3)

if __name__=='__main__': unittest.main()

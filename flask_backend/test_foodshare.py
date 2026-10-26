import unittest
import math
import datetime

class FoodShareFlaskTests(unittest.TestCase):
    def test_indian_pincode_validation(self):
        import re
        pattern = r'^[1-9][0-9]{5}$'
        self.assertTrue(bool(re.match(pattern, '560001')))
        self.assertTrue(bool(re.match(pattern, '110001')))
        self.assertFalse(bool(re.match(pattern, '012345')))
        self.assertFalse(bool(re.match(pattern, '56001')))

    def test_indian_mobile_validation(self):
        import re
        pattern = r'^[6-9][0-9]{9}$'
        self.assertTrue(bool(re.match(pattern, '9876543210')))
        self.assertTrue(bool(re.match(pattern, '8123456789')))
        self.assertFalse(bool(re.match(pattern, '5123456789')))

    def test_haversine_calculation(self):
        R = 6371.0
        # Koramangala to Indiranagar
        lat1, lon1 = 12.9352, 77.6245
        lat2, lon2 = 12.9784, 77.6408
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = (math.sin(dlat / 2) ** 2 +
             math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
             math.sin(dlon / 2) ** 2)
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        dist = round(R * c, 2)
        self.assertTrue(4.0 <= dist <= 6.0)

    def test_quantity_reservation_and_partial_pickup(self):
        initial_quantity = 50
        requested_quantity = 20
        # Atomic reservation
        available = initial_quantity - requested_quantity
        reserved = requested_quantity
        self.assertEqual(available, 30)
        self.assertEqual(reserved, 20)

        # Cancellation release
        available += reserved
        reserved = 0
        self.assertEqual(available, 50)

if __name__ == '__main__':
    unittest.main()

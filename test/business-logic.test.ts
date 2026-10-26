import test from 'node:test';
import assert from 'node:assert/strict';

interface FoodItem {
  id: string;
  donorName: string;
  donorPhone: string;
  foodName: string;
  quantity: number;
  quantityKg?: number;
  location: string;
  foodType: 'veg' | 'non-veg';
  status: 'available' | 'claimed';
  claimedBy?: {
    name: string;
    type: 'Registered NGO' | 'Helping Person';
    orgName: string;
    phone: string;
  };
}

function calculateDynamicStats(items: FoodItem[]) {
  const mealsDonated = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const activeDonors = new Set(items.map((item) => item.donorName.trim().toLowerCase())).size;
  const citiesCovered = new Set(
    items
      .map((item) => {
        const parts = item.location.split(',');
        return parts.length > 1 ? parts[parts.length - 1].trim().toLowerCase() : parts[0].trim().toLowerCase();
      })
      .filter(Boolean)
  ).size;

  return { mealsDonated, activeDonors, citiesCovered };
}

test('calculateDynamicStats calculates real metrics without hardcoded numbers', () => {
  const sampleItems: FoodItem[] = [
    {
      id: '1',
      donorName: 'Aarav Patel',
      donorPhone: '9876543210',
      foodName: 'Pulao',
      quantity: 50,
      location: 'Andheri, Mumbai',
      foodType: 'veg',
      status: 'available',
    },
    {
      id: '2',
      donorName: 'Aarav Patel',
      donorPhone: '9876543210',
      foodName: 'Roti & Dal',
      quantity: 30,
      location: 'Borivali, Mumbai',
      foodType: 'veg',
      status: 'claimed',
    },
    {
      id: '3',
      donorName: 'Sunita Sharma',
      donorPhone: '9822334455',
      foodName: 'Meals',
      quantity: 45,
      location: 'Kothrud, Pune',
      foodType: 'veg',
      status: 'available',
    },
  ];

  const stats = calculateDynamicStats(sampleItems);
  assert.equal(stats.mealsDonated, 125, 'Meals donated must equal exact sum of quantities');
  assert.equal(stats.activeDonors, 2, 'Unique donors must be 2');
  assert.equal(stats.citiesCovered, 2, 'Unique cities (Mumbai, Pune) must be 2');
});

test('claiming an item requires NGO or Helping Person', () => {
  const item: FoodItem = {
    id: 'f_test',
    donorName: 'Hotel Taj',
    donorPhone: '9988776655',
    foodName: 'Buffet surplus',
    quantity: 60,
    location: 'Colaba, Mumbai',
    foodType: 'veg',
    status: 'available',
  };

  function claimItem(
    target: FoodItem,
    claimant: { name: string; type: 'Registered NGO' | 'Helping Person'; orgName: string; phone: string }
  ) {
    if (!claimant.name || !claimant.phone || !claimant.orgName) {
      throw new Error('Claimant details are required');
    }
    if (target.status !== 'available') {
      throw new Error('Item is already claimed');
    }
    return {
      ...target,
      status: 'claimed' as const,
      claimedBy: claimant,
    };
  }

  const claimed = claimItem(item, {
    name: 'Brother Joseph',
    type: 'Registered NGO',
    orgName: 'Asha Bhavan Shelter',
    phone: '9820011223',
  });

  assert.equal(claimed.status, 'claimed');
  assert.equal(claimed.claimedBy?.name, 'Brother Joseph');
  assert.equal(claimed.claimedBy?.type, 'Registered NGO');
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isValidIndianPinCode,
  isValidIndianMobile,
  calculateHaversineDistance,
  filterDonationsByRadius,
  validateFoodRequest,
  reserveDonationQuantity,
  releaseDonationQuantity,
  completePickup,
  isDonationExpired,
  calculateDonorRecognition,
  Donation,
  FoodRequest,
} from './foodshare-logic';

test('1. India PIN code validation enforces 6 digits without leading zero', () => {
  assert.equal(isValidIndianPinCode('560001'), true); // Bengaluru
  assert.equal(isValidIndianPinCode('110001'), true); // Delhi
  assert.equal(isValidIndianPinCode('400001'), true); // Mumbai
  assert.equal(isValidIndianPinCode('012345'), false); // Leading zero disallowed
  assert.equal(isValidIndianPinCode('56001'), false); // 5 digits
  assert.equal(isValidIndianPinCode('5600001'), false); // 7 digits
  assert.equal(isValidIndianPinCode('ABCDEF'), false);
  assert.equal(isValidIndianPinCode(''), false);
});

test('2. India mobile number validation checks 10 digits starting with 6-9', () => {
  assert.equal(isValidIndianMobile('9876543210'), true);
  assert.equal(isValidIndianMobile('8123456789'), true);
  assert.equal(isValidIndianMobile('7012345678'), true);
  assert.equal(isValidIndianMobile('+91 9876543210'), true);
  assert.equal(isValidIndianMobile('5123456789'), false); // Starts with 5
  assert.equal(isValidIndianMobile('12345'), false); // Too short
  assert.equal(isValidIndianMobile(''), false);
});

test('3. Haversine distance calculation is mathematically accurate', () => {
  // Distance between MG Road Bangalore (12.9756, 77.6066) and Indiranagar (12.9784, 77.6408)
  const dist = calculateHaversineDistance(12.9756, 77.6066, 12.9784, 77.6408);
  assert.ok(dist >= 3.5 && dist <= 4.0, `Expected ~3.7 km, got ${dist}`);

  // Same coordinates should be 0 distance
  assert.equal(calculateHaversineDistance(12.9756, 77.6066, 12.9756, 77.6066), 0);
});

test('4. Radius filtering defaults and distance sorting (5km, 10km, 20km)', () => {
  const centerLat = 12.9716; // Bengaluru center
  const centerLon = 77.5946;

  const mockDonations: Donation[] = [
    {
      id: 'd1',
      donorId: 'u1',
      donorName: 'Spice Kitchen',
      donorRole: 'donor',
      donorVerified: true,
      donorPhone: '9876543210',
      donorAddress: 'Brigade Rd',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560001',
      latitude: 12.973, // ~1.5 km away
      longitude: 77.608,
      title: 'Vegetable Biryani',
      description: 'Hot fresh biryani',
      category: 'cooked_meals',
      foodType: 'veg',
      initialQuantityServings: 50,
      availableQuantityServings: 50,
      reservedQuantityServings: 0,
      approxWeightKg: 18,
      preparedAt: new Date(Date.now() - 3600000).toISOString(),
      expiryDeadline: new Date(Date.now() + 14400000).toISOString(),
      storageCondition: 'heated',
      packaging: 'foil_containers',
      allergenNotes: 'Contains nuts',
      status: 'available',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'd2',
      donorId: 'u2',
      donorName: 'Whitefield Bakery',
      donorRole: 'donor',
      donorVerified: true,
      donorPhone: '9876543211',
      donorAddress: 'Whitefield Main Rd',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560066',
      latitude: 12.9698, // ~16 km away
      longitude: 77.7499,
      title: 'Multigrain Breads',
      description: 'Day-old artisan bread',
      category: 'bakery',
      foodType: 'veg',
      initialQuantityServings: 30,
      availableQuantityServings: 30,
      reservedQuantityServings: 0,
      approxWeightKg: 10,
      preparedAt: new Date(Date.now() - 7200000).toISOString(),
      expiryDeadline: new Date(Date.now() + 28800000).toISOString(),
      storageCondition: 'ambient',
      packaging: 'packaged_sealed',
      allergenNotes: 'Gluten',
      status: 'available',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'd3',
      donorId: 'u3',
      donorName: 'Expired Food Joint',
      donorRole: 'donor',
      donorVerified: true,
      donorPhone: '9876543212',
      donorAddress: 'MG Road',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560001',
      latitude: 12.975, // ~1.6 km
      longitude: 77.609,
      title: 'Salads',
      description: 'Salad boxes',
      category: 'cooked_meals',
      foodType: 'veg',
      initialQuantityServings: 20,
      availableQuantityServings: 20,
      reservedQuantityServings: 0,
      approxWeightKg: 5,
      preparedAt: new Date(Date.now() - 86400000).toISOString(),
      expiryDeadline: new Date(Date.now() - 3600000).toISOString(), // EXPIRED 1hr ago!
      storageCondition: 'refrigerated',
      packaging: 'disposable_boxes',
      allergenNotes: 'None',
      status: 'available',
      createdAt: new Date().toISOString(),
    },
  ];

  // At 5 km: d1 is included (~1.5 km), d2 is excluded (~16 km), d3 is excluded because it's expired!
  const within5km = filterDonationsByRadius(mockDonations, centerLat, centerLon, 5);
  assert.equal(within5km.length, 1);
  assert.equal(within5km[0].id, 'd1');
  assert.ok(within5km[0].distanceKm < 5);

  // At 20 km: d1 and d2 are included, d3 (expired) still excluded
  const within20km = filterDonationsByRadius(mockDonations, centerLat, centerLon, 20);
  assert.equal(within20km.length, 2);
  assert.equal(within20km[0].id, 'd1'); // Nearest first
  assert.equal(within20km[1].id, 'd2');
});

test('5. Request validation gates unverified users and invalid parameters', () => {
  const futurePickup = new Date(Date.now() + 7200000).toISOString();
  const futureExpiry = new Date(Date.now() + 14400000).toISOString();

  // Unverified user is rejected
  const unverifiedCheck = validateFoodRequest({
    isRecipientVerified: false,
    quantityRequested: 10,
    availableQuantity: 50,
    reason: 'Distributing to 10 daily wage workers at construction site',
    intendedRecipients: 'Daily wage laborers',
    peopleToServe: 10,
    proposedPickupTime: futurePickup,
    expiryDeadline: futureExpiry,
  });
  assert.equal(unverifiedCheck.isValid, false);
  assert.ok(unverifiedCheck.error?.includes('Only verified users'));

  // Requesting more than available is rejected
  const overclaimCheck = validateFoodRequest({
    isRecipientVerified: true,
    quantityRequested: 60,
    availableQuantity: 50,
    reason: 'Distributing to shelter residents tonight for dinner',
    intendedRecipients: 'Shelter residents',
    peopleToServe: 60,
    proposedPickupTime: futurePickup,
    expiryDeadline: futureExpiry,
  });
  assert.equal(overclaimCheck.isValid, false);
  assert.ok(overclaimCheck.error?.includes('exceeds available quantity'));

  // Valid request passes
  const validCheck = validateFoodRequest({
    isRecipientVerified: true,
    quantityRequested: 25,
    availableQuantity: 50,
    reason: 'Distributing to 25 children and caregivers at Jeevan Jyothi orphanage',
    intendedRecipients: 'Orphanage residents and caretakers',
    peopleToServe: 25,
    proposedPickupTime: futurePickup,
    expiryDeadline: futureExpiry,
  });
  assert.equal(validCheck.isValid, true);
});

test('6. Atomic quantity reservation, partial collection, and completion lifecycle', () => {
  const initialDonation: Donation = {
    id: 'd100',
    donorId: 'u1',
    donorName: 'Royal Palace Banquet',
    donorRole: 'donor',
    donorVerified: true,
    donorPhone: '9876543210',
    donorAddress: 'MG Road',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560001',
    latitude: 12.97,
    longitude: 77.6,
    title: 'Veg Pulao & Dal Tadka',
    description: 'Fresh banquet surplus',
    category: 'cooked_meals',
    foodType: 'veg',
    initialQuantityServings: 60,
    availableQuantityServings: 60,
    reservedQuantityServings: 0,
    approxWeightKg: 20,
    preparedAt: new Date().toISOString(),
    expiryDeadline: new Date(Date.now() + 18000000).toISOString(),
    storageCondition: 'heated',
    packaging: 'foil_containers',
    allergenNotes: 'None',
    status: 'available',
    createdAt: new Date().toISOString(),
  };

  // 1. Partial reservation of 20 servings
  const res1 = reserveDonationQuantity(initialDonation, 20);
  assert.equal(res1.success, true);
  const dAfterRes1 = res1.updatedDonation!;
  assert.equal(dAfterRes1.availableQuantityServings, 40);
  assert.equal(dAfterRes1.reservedQuantityServings, 20);
  assert.equal(dAfterRes1.status, 'partially_collected');

  // 2. Cancellation of request releases quantity
  const dAfterCancel = releaseDonationQuantity(dAfterRes1, 20);
  assert.equal(dAfterCancel.availableQuantityServings, 60);
  assert.equal(dAfterCancel.reservedQuantityServings, 0);
  assert.equal(dAfterCancel.status, 'available');

  // 3. New reservation of full remaining 60 servings
  const resFull = reserveDonationQuantity(dAfterCancel, 60);
  assert.equal(resFull.success, true);
  const dFullRes = resFull.updatedDonation!;
  assert.equal(dFullRes.availableQuantityServings, 0);
  assert.equal(dFullRes.reservedQuantityServings, 60);
  assert.equal(dFullRes.status, 'requested');

  // 4. Pickup completed for full 60 servings -> donation marks completed
  const completion = completePickup(dFullRes, 60);
  assert.equal(completion.isFullyCompleted, true);
  assert.equal(completion.updatedDonation.status, 'completed');
  assert.equal(completion.updatedDonation.availableQuantityServings, 0);
  assert.equal(completion.updatedDonation.reservedQuantityServings, 0);
});

test('7. Expiration detection flags expired food accurately', () => {
  const activeDonation: Donation = {
    id: 'act1',
    donorId: 'u1',
    donorName: 'Test',
    donorRole: 'donor',
    donorVerified: true,
    donorPhone: '123',
    donorAddress: 'Test',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560001',
    latitude: 12.9,
    longitude: 77.6,
    title: 'Fresh Bread',
    description: 'Fresh',
    category: 'bakery',
    foodType: 'veg',
    initialQuantityServings: 10,
    availableQuantityServings: 10,
    reservedQuantityServings: 0,
    approxWeightKg: 2,
    preparedAt: new Date().toISOString(),
    expiryDeadline: new Date(Date.now() + 3600000).toISOString(),
    storageCondition: 'ambient',
    packaging: 'packaged_sealed',
    allergenNotes: '',
    status: 'available',
    createdAt: new Date().toISOString(),
  };

  const expiredDonation: Donation = {
    ...activeDonation,
    id: 'exp1',
    expiryDeadline: new Date(Date.now() - 60000).toISOString(), // 1 minute in the past
  };

  assert.equal(isDonationExpired(activeDonation), false);
  assert.equal(isDonationExpired(expiredDonation), true);
});

test('8. Donor recognition calculates points, kg saved, and badges from completed donations', () => {
  const mockCompletedDonations: Donation[] = [
    {
      id: 'cd1',
      donorId: 'u1',
      donorName: 'Asha Kitchen',
      donorRole: 'donor',
      donorVerified: true,
      donorPhone: '123',
      donorAddress: '123',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560001',
      latitude: 12.9,
      longitude: 77.6,
      title: 'Lunch Meals',
      description: 'Meals',
      category: 'cooked_meals',
      foodType: 'veg',
      initialQuantityServings: 80,
      availableQuantityServings: 0,
      reservedQuantityServings: 0,
      approxWeightKg: 25,
      preparedAt: new Date().toISOString(),
      expiryDeadline: new Date().toISOString(),
      storageCondition: 'heated',
      packaging: 'foil_containers',
      allergenNotes: '',
      status: 'completed',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'cd2',
      donorId: 'u1',
      donorName: 'Asha Kitchen',
      donorRole: 'donor',
      donorVerified: true,
      donorPhone: '123',
      donorAddress: '123',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560001',
      latitude: 12.9,
      longitude: 77.6,
      title: 'Dinner Rice & Sambar',
      description: 'Surplus',
      category: 'cooked_meals',
      foodType: 'veg',
      initialQuantityServings: 120,
      availableQuantityServings: 0,
      reservedQuantityServings: 0,
      approxWeightKg: 35,
      preparedAt: new Date().toISOString(),
      expiryDeadline: new Date().toISOString(),
      storageCondition: 'heated',
      packaging: 'foil_containers',
      allergenNotes: '',
      status: 'completed',
      createdAt: new Date().toISOString(),
    },
  ];

  const mockCompletedRequests: FoodRequest[] = [
    {
      id: 'r1',
      donationId: 'cd1',
      donationTitle: 'Lunch Meals',
      donorId: 'u1',
      recipientId: 'r_user',
      recipientName: 'Hope Shelter',
      recipientRole: 'ngo',
      recipientVerified: true,
      recipientPhone: '9876543210',
      quantityRequestedServings: 80,
      reason: 'Serving lunch to 80 daily wage earners',
      intendedRecipients: 'Daily wage workers',
      peopleToServe: 80,
      proposedPickupTime: new Date().toISOString(),
      transportNotes: 'Van with insulated boxes',
      status: 'completed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'r2',
      donationId: 'cd2',
      donationTitle: 'Dinner Rice & Sambar',
      donorId: 'u1',
      recipientId: 'r_user2',
      recipientName: 'Child Care Foundation',
      recipientRole: 'ngo',
      recipientVerified: true,
      recipientPhone: '9876543211',
      quantityRequestedServings: 120,
      reason: 'Serving night meals to children',
      intendedRecipients: 'Orphanage',
      peopleToServe: 120,
      proposedPickupTime: new Date().toISOString(),
      transportNotes: 'Auto rickshaw',
      status: 'completed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const impact = calculateDonorRecognition(mockCompletedDonations, mockCompletedRequests);
  assert.equal(impact.totalDonationsCompleted, 2);
  assert.equal(impact.totalServingsDonated, 200);
  assert.equal(impact.totalKgSaved, 60);
  assert.equal(impact.peopleFed, 200);
  assert.equal(impact.co2PreventedKg, 150); // 60 kg * 2.5
  assert.ok(impact.points > 0);

  // Check badges
  const firstHarvest = impact.badges.find((b) => b.id === 'first_harvest');
  assert.equal(firstHarvest?.earned, true);

  const hungerHero = impact.badges.find((b) => b.id === 'hunger_hero');
  assert.equal(hungerHero?.earned, true); // 200 >= 100

  const zeroWaste = impact.badges.find((b) => b.id === 'zero_waste_warrior');
  assert.equal(zeroWaste?.earned, true); // 60kg >= 50kg
});

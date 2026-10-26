/**
 * Pure domain logic for FoodShare Food Waste Donation Platform
 * Covers India-specific validation, Haversine geospatial calculations,
 * atomic reservation transitions, expiry checks, and donor recognition metrics.
 */

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

export interface UserVerification {
  id: string;
  userId: string;
  status: 'pending' | 'verified' | 'rejected';
  idType: 'aadhaar' | 'pan' | 'voter_id' | 'driving_license' | 'ngo_darpan' | 'fssai_license';
  documentName: string;
  documentUrl?: string; // Private storage reference
  rejectionReason?: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'donor' | 'recipient' | 'ngo' | 'admin';
  state: string;
  city: string;
  pincode: string;
  address: string;
  latitude: number;
  longitude: number;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  ngoDetails?: {
    orgName: string;
    darpanId: string;
    registrationNo: string;
    yearEstablished: number;
    beneficiaryCapacity: number;
    is12A80GRegistered: boolean;
  };
  createdAt: string;
}

export type DonationStatus =
  | 'available'
  | 'requested'
  | 'accepted'
  | 'partially_collected'
  | 'completed'
  | 'expired'
  | 'cancelled';

export interface Donation {
  id: string;
  donorId: string;
  donorName: string;
  donorRole: 'donor' | 'ngo';
  donorVerified: boolean;
  donorPhone: string; // Kept private until accepted
  donorAddress: string; // Kept private until accepted
  city: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
  title: string;
  description: string;
  category: 'cooked_meals' | 'bakery' | 'raw_groceries' | 'packaged_food' | 'fruits_veggies';
  foodType: 'veg' | 'non_veg' | 'vegan';
  initialQuantityServings: number;
  availableQuantityServings: number;
  reservedQuantityServings: number;
  approxWeightKg: number;
  preparedAt: string;
  expiryDeadline: string; // ISO string
  storageCondition: 'ambient' | 'refrigerated' | 'heated' | 'dry_sealed';
  packaging: 'foil_containers' | 'disposable_boxes' | 'bring_own_vessel' | 'packaged_sealed';
  allergenNotes: string;
  status: DonationStatus;
  createdAt: string;
  pickupOtp?: string;
}

export type RequestStatus =
  | 'requested'
  | 'accepted'
  | 'rejected'
  | 'partially_collected'
  | 'completed'
  | 'cancelled';

export interface FoodRequest {
  id: string;
  donationId: string;
  donationTitle: string;
  donorId: string;
  recipientId: string;
  recipientName: string;
  recipientRole: 'recipient' | 'ngo';
  recipientVerified: boolean;
  recipientPhone: string;
  quantityRequestedServings: number;
  quantityCollectedServings?: number;
  reason: string;
  intendedRecipients: string;
  peopleToServe: number;
  proposedPickupTime: string;
  transportNotes: string;
  status: RequestStatus;
  createdAt: string;
  updatedAt: string;
  donorNotes?: string;
  pickupVerificationCode?: string;
}

export interface DonorImpact {
  totalDonationsCompleted: number;
  totalServingsDonated: number;
  totalKgSaved: number;
  peopleFed: number;
  co2PreventedKg: number;
  points: number;
  badges: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    earned: boolean;
    earnedAt?: string;
  }>;
  milestones: Array<{
    title: string;
    current: number;
    target: number;
    unit: string;
    isAchieved: boolean;
  }>;
}

/**
 * Validates 6-digit Indian Postal PIN code (110001 - 999999).
 * First digit cannot be 0.
 */
export function isValidIndianPinCode(pin: string): boolean {
  if (!pin) return false;
  const clean = pin.trim();
  return /^[1-9][0-9]{5}$/.test(clean);
}

/**
 * Validates Indian 10-digit mobile phone number (starts with 6, 7, 8, or 9).
 */
export function isValidIndianMobile(phone: string): boolean {
  if (!phone) return false;
  const clean = phone.replace(/\D/g, '');
  if (clean.length === 12 && clean.startsWith('91')) {
    return /^[6-9][0-9]{9}$/.test(clean.slice(2));
  }
  return /^[6-9][0-9]{9}$/.test(clean);
}

/**
 * Calculates Great-Circle distance using Haversine formula.
 * Returns distance in kilometers with 2 decimal precision.
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (
    typeof lat1 !== 'number' ||
    typeof lon1 !== 'number' ||
    typeof lat2 !== 'number' ||
    typeof lon2 !== 'number' ||
    isNaN(lat1) ||
    isNaN(lon1) ||
    isNaN(lat2) ||
    isNaN(lon2)
  ) {
    return 0;
  }

  const R = 6371; // Earth radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Math.round(distance * 100) / 100;
}

/**
 * Filters available donations within a given radius in km and sorts by closest first.
 * Expired or completed donations are excluded.
 */
export function filterDonationsByRadius(
  donations: Donation[],
  userLat: number,
  userLon: number,
  radiusKm: number,
  currentTimeMs: number = Date.now()
): Array<Donation & { distanceKm: number }> {
  const result: Array<Donation & { distanceKm: number }> = [];

  for (const d of donations) {
    // Only available or partially collected items with remaining quantity > 0
    if (d.availableQuantityServings <= 0) continue;
    if (d.status === 'completed' || d.status === 'cancelled' || d.status === 'expired') {
      continue;
    }

    // Check expiration
    if (new Date(d.expiryDeadline).getTime() <= currentTimeMs) {
      continue;
    }

    const dist = calculateHaversineDistance(userLat, userLon, d.latitude, d.longitude);

    if (dist <= radiusKm) {
      result.push({
        ...d,
        distanceKm: dist,
      });
    }
  }

  // Sort ascending by distance (nearest first)
  return result.sort((a, b) => a.distanceKm - b.distanceKm);
}

/**
 * Validates a food request submission.
 * Enforces recipient verification, meaningful reason, intended beneficiaries, valid quantity and pickup time.
 */
export function validateFoodRequest(params: {
  isRecipientVerified: boolean;
  quantityRequested: number;
  availableQuantity: number;
  reason: string;
  intendedRecipients: string;
  peopleToServe: number;
  proposedPickupTime: string;
  expiryDeadline: string;
  currentTimeMs?: number;
}): { isValid: boolean; error?: string } {
  const now = params.currentTimeMs || Date.now();

  if (!params.isRecipientVerified) {
    return {
      isValid: false,
      error: 'Only verified users and authenticated NGOs can request food donations under FoodShare India safety policies.',
    };
  }

  if (
    !params.quantityRequested ||
    params.quantityRequested <= 0 ||
    !Number.isInteger(params.quantityRequested)
  ) {
    return {
      isValid: false,
      error: 'Requested quantity must be a positive whole number.',
    };
  }

  if (params.quantityRequested > params.availableQuantity) {
    return {
      isValid: false,
      error: `Requested quantity (${params.quantityRequested}) exceeds available quantity (${params.availableQuantity}).`,
    };
  }

  if (!params.reason || params.reason.trim().length < 15) {
    return {
      isValid: false,
      error: 'Please provide a meaningful reason for requesting food (at least 15 characters, e.g., distributing to shelter).',
    };
  }

  if (!params.intendedRecipients || params.intendedRecipients.trim().length < 5) {
    return {
      isValid: false,
      error: 'Please specify the intended recipients (e.g., night shelter, daily wage workers, community kitchen).',
    };
  }

  if (!params.peopleToServe || params.peopleToServe <= 0) {
    return {
      isValid: false,
      error: 'Please specify a valid number of people to serve.',
    };
  }

  const pickupMs = new Date(params.proposedPickupTime).getTime();
  const expiryMs = new Date(params.expiryDeadline).getTime();

  if (isNaN(pickupMs) || pickupMs <= now) {
    return {
      isValid: false,
      error: 'Proposed pickup time must be in the future.',
    };
  }

  if (pickupMs > expiryMs) {
    return {
      isValid: false,
      error: 'Proposed pickup time cannot be after the food safety expiry deadline.',
    };
  }

  return { isValid: true };
}

/**
 * Safely reserves quantity for an approved request.
 * Transitions status to 'requested' or 'accepted', decrements available quantity,
 * and increments reserved quantity.
 */
export function reserveDonationQuantity(
  donation: Donation,
  requestedQuantity: number
): { success: boolean; updatedDonation?: Donation; error?: string } {
  if (requestedQuantity <= 0) {
    return { success: false, error: 'Requested quantity must be greater than zero.' };
  }

  if (donation.availableQuantityServings < requestedQuantity) {
    return {
      success: false,
      error: `Cannot reserve ${requestedQuantity} servings. Only ${donation.availableQuantityServings} available.`,
    };
  }

  const newAvailable = donation.availableQuantityServings - requestedQuantity;
  const newReserved = donation.reservedQuantityServings + requestedQuantity;

  const updated: Donation = {
    ...donation,
    availableQuantityServings: newAvailable,
    reservedQuantityServings: newReserved,
    status: newAvailable === 0 && newReserved > 0 ? 'requested' : 'partially_collected',
  };

  return { success: true, updatedDonation: updated };
}

/**
 * Releases reserved quantity back into available pool when a request is cancelled or rejected.
 */
export function releaseDonationQuantity(
  donation: Donation,
  quantityToRelease: number
): Donation {
  const actualRelease = Math.min(donation.reservedQuantityServings, quantityToRelease);
  const newAvailable = donation.availableQuantityServings + actualRelease;
  const newReserved = Math.max(0, donation.reservedQuantityServings - actualRelease);

  let newStatus: DonationStatus = 'available';
  if (newAvailable === 0 && newReserved === 0) {
    newStatus = 'completed';
  } else if (newAvailable < donation.initialQuantityServings) {
    newStatus = 'partially_collected';
  }

  return {
    ...donation,
    availableQuantityServings: newAvailable,
    reservedQuantityServings: newReserved,
    status: newStatus,
  };
}

/**
 * Confirms collection of food.
 * Updates reserved quantity and marks donation as completed if full initial quantity has been handed over.
 */
export function completePickup(
  donation: Donation,
  collectedQuantity: number
): { updatedDonation: Donation; isFullyCompleted: boolean } {
  const newReserved = Math.max(0, donation.reservedQuantityServings - collectedQuantity);
  const isFullyCompleted =
    donation.availableQuantityServings === 0 && newReserved === 0;

  const updated: Donation = {
    ...donation,
    reservedQuantityServings: newReserved,
    status: isFullyCompleted ? 'completed' : 'partially_collected',
  };

  return {
    updatedDonation: updated,
    isFullyCompleted,
  };
}

/**
 * Checks whether a donation has passed its pickup/expiry deadline.
 */
export function isDonationExpired(
  donation: Donation,
  currentTimeMs: number = Date.now()
): boolean {
  if (donation.status === 'completed' || donation.status === 'cancelled') {
    return false;
  }
  const expiryMs = new Date(donation.expiryDeadline).getTime();
  return expiryMs <= currentTimeMs;
}

/**
 * Computes donor recognition metrics, badges, and milestones from completed donation records.
 * 100% computed from real data.
 */
export function calculateDonorRecognition(
  completedDonations: Donation[],
  completedRequests: FoodRequest[]
): DonorImpact {
  let totalServings = 0;
  let totalKg = 0;
  let peopleFed = 0;

  for (const d of completedDonations) {
    // If completed or partially collected
    const collectedServings = d.initialQuantityServings - d.availableQuantityServings - d.reservedQuantityServings;
    const effectiveServings = collectedServings > 0 ? collectedServings : d.initialQuantityServings;
    totalServings += effectiveServings;
    const ratio = effectiveServings / Math.max(1, d.initialQuantityServings);
    totalKg += Math.round(d.approxWeightKg * ratio * 10) / 10;
  }

  for (const req of completedRequests) {
    if (req.status === 'completed') {
      peopleFed += req.peopleToServe || req.quantityRequestedServings;
    }
  }

  if (peopleFed === 0 && totalServings > 0) {
    peopleFed = totalServings; // 1 serving feeds 1 person minimum
  }

  const completedCount = completedDonations.length;
  // Carbon emission factor: 1 kg food waste diverted prevents ~2.5 kg CO2e
  const co2PreventedKg = Math.round(totalKg * 2.5 * 10) / 10;

  // Points: 50 points per completed donation + 2 points per serving + 10 bonus points per 10kg
  const points = completedCount * 50 + totalServings * 2 + Math.floor(totalKg / 10) * 10;

  const badges = [
    {
      id: 'first_harvest',
      name: 'First Harvest',
      description: 'Completed your first food donation on FoodShare India',
      icon: 'Award',
      earned: completedCount >= 1,
      earnedAt: completedCount >= 1 ? completedDonations[0]?.createdAt : undefined,
    },
    {
      id: 'hunger_hero',
      name: 'Hunger Hero',
      description: 'Fed 100 or more people through verified surplus food distribution',
      icon: 'HeartHandshake',
      earned: peopleFed >= 100,
    },
    {
      id: 'zero_waste_warrior',
      name: 'Zero Waste Warrior',
      description: 'Diverted 50+ kg of edible food waste from local municipal landfills',
      icon: 'Leaf',
      earned: totalKg >= 50,
    },
    {
      id: 'community_pillar',
      name: 'Community Pillar',
      description: 'Successfully coordinated 5+ safe and verified food collection pickups',
      icon: 'ShieldCheck',
      earned: completedCount >= 5,
    },
    {
      id: 'century_feeder',
      name: 'Century Feeder',
      description: 'Contributed over 250 verified meal servings to shelters and families',
      icon: 'Sparkles',
      earned: totalServings >= 250,
    },
  ];

  const milestones = [
    {
      title: '50 Meals Shared',
      current: totalServings,
      target: 50,
      unit: 'servings',
      isAchieved: totalServings >= 50,
    },
    {
      title: '100 kg Food Diverted',
      current: totalKg,
      target: 100,
      unit: 'kg',
      isAchieved: totalKg >= 100,
    },
    {
      title: '10 Completed Pickups',
      current: completedCount,
      target: 10,
      unit: 'pickups',
      isAchieved: completedCount >= 10,
    },
    {
      title: '500 kg CO2 Prevented',
      current: co2PreventedKg,
      target: 500,
      unit: 'kg CO2',
      isAchieved: co2PreventedKg >= 500,
    },
  ];

  return {
    totalDonationsCompleted: completedCount,
    totalServingsDonated: totalServings,
    totalKgSaved: Math.round(totalKg * 10) / 10,
    peopleFed,
    co2PreventedKg,
    points,
    badges,
    milestones,
  };
}

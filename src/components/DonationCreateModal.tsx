import React, { useState } from 'react';
import { X, Utensils, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';
import { User } from '../utils/foodshare-logic';

interface DonationCreateModalProps {
  currentUser: User;
  onClose: () => void;
  onDonationCreated: () => void;
}

export const DonationCreateModal: React.FC<DonationCreateModalProps> = ({
  currentUser,
  onClose,
  onDonationCreated,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'cooked_meals' | 'bakery' | 'raw_groceries' | 'packaged_food' | 'fruits_veggies'>('cooked_meals');
  const [foodType, setFoodType] = useState<'veg' | 'non_veg' | 'vegan'>('veg');
  const [servings, setServings] = useState(40);
  const [weightKg, setWeightKg] = useState(15);
  const [expiryHours, setExpiryHours] = useState(6);
  const [storageCondition, setStorageCondition] = useState<'ambient' | 'refrigerated' | 'heated' | 'dry_sealed'>('heated');
  const [packaging, setPackaging] = useState<'foil_containers' | 'disposable_boxes' | 'bring_own_vessel' | 'packaged_sealed'>('foil_containers');
  const [allergenNotes, setAllergenNotes] = useState('Vegetarian, no eggs. Contains mild spices.');
  const [address, setAddress] = useState(currentUser.address || '');
  const [city, setCity] = useState(currentUser.city || 'Bengaluru');
  const [state, setState] = useState(currentUser.state || 'Karnataka');
  const [pincode, setPincode] = useState(currentUser.pincode || '560001');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!title.trim()) {
      setErrorMessage('Please enter a descriptive food title.');
      return;
    }

    if (servings <= 0 || weightKg <= 0) {
      setErrorMessage('Quantity and weight must be positive numbers.');
      return;
    }

    const expiryDate = new Date(Date.now() + expiryHours * 3600000).toISOString();

    setSubmitting(true);
    try {
      const res = await fetch('/api/donations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          donorId: currentUser.id,
          title,
          description,
          category,
          foodType,
          initialQuantityServings: servings,
          approxWeightKg: weightKg,
          expiryDeadline: expiryDate,
          storageCondition,
          packaging,
          allergenNotes,
          address,
          city,
          state,
          pincode,
          latitude: currentUser.latitude,
          longitude: currentUser.longitude,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Failed to list donation.');
      } else {
        setSuccessMessage('Surplus food donation listed successfully! Available for nearby verified recipients.');
        setTimeout(() => {
          onDonationCreated();
          onClose();
        }, 1500);
      }
    } catch (err) {
      setErrorMessage('Network or server error while listing donation.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full border border-stone-200 shadow-2xl overflow-hidden my-6">
        <div className="bg-stone-900 text-stone-100 p-5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                Post Surplus Food
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded bg-stone-800 text-stone-300">
                FSSAI Safety Compliant
              </span>
            </div>
            <h3 className="text-base font-bold text-white mt-0.5">
              Donate Edible Surplus Food
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Donor Identity Bar */}
          <div className="bg-emerald-50/70 border border-emerald-200 p-2.5 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span className="text-emerald-950 font-semibold truncate max-w-xs">
                Listing as: {currentUser.name} ({currentUser.city})
              </span>
            </div>
            <span className="text-[10px] text-emerald-700 bg-emerald-100 font-bold px-2 py-0.5 rounded">
              Verified Donor
            </span>
          </div>

          <div>
            <label className="block font-bold text-stone-800 mb-1">
              Food Title / Dish Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Vegetarian Buffet Surplus: Paneer Makhani & Pulao"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-stone-300 rounded-xl p-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-stone-800 mb-1">Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full border border-stone-300 rounded-xl p-2.5 bg-stone-50 focus:outline-none"
              >
                <option value="cooked_meals">Cooked Meals / Banquet</option>
                <option value="bakery">Bakery & Breads</option>
                <option value="raw_groceries">Raw Farm Produce</option>
                <option value="packaged_food">Packaged Groceries</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-stone-800 mb-1">Dietary Classification *</label>
              <select
                value={foodType}
                onChange={(e) => setFoodType(e.target.value as any)}
                className="w-full border border-stone-300 rounded-xl p-2.5 bg-stone-50 focus:outline-none"
              >
                <option value="veg">Vegetarian 🟢</option>
                <option value="vegan">Pure Vegan 🌱</option>
                <option value="non_veg">Non-Vegetarian 🔴</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-stone-800 mb-1">Servings *</label>
              <input
                type="number"
                min={1}
                required
                value={servings}
                onChange={(e) => setServings(parseInt(e.target.value, 10) || 1)}
                className="w-full border border-stone-300 rounded-xl p-2.5 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-800 mb-1">Approx Kg *</label>
              <input
                type="number"
                min={0.5}
                step={0.5}
                required
                value={weightKg}
                onChange={(e) => setWeightKg(parseFloat(e.target.value) || 1)}
                className="w-full border border-stone-300 rounded-xl p-2.5 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-800 mb-1">Pickup Deadline *</label>
              <select
                value={expiryHours}
                onChange={(e) => setExpiryHours(parseInt(e.target.value, 10))}
                className="w-full border border-stone-300 rounded-xl p-2.5 bg-stone-50 focus:outline-none"
              >
                <option value={3}>In 3 Hours</option>
                <option value={6}>In 6 Hours</option>
                <option value={12}>In 12 Hours</option>
                <option value={24}>In 24 Hours</option>
                <option value={48}>In 48 Hours</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-stone-800 mb-1">Storage Condition *</label>
              <select
                value={storageCondition}
                onChange={(e) => setStorageCondition(e.target.value as any)}
                className="w-full border border-stone-300 rounded-xl p-2.5 bg-stone-50 focus:outline-none"
              >
                <option value="heated">Heated (&gt;60°C)</option>
                <option value="ambient">Ambient Room Temp</option>
                <option value="refrigerated">Refrigerated (4°C)</option>
                <option value="dry_sealed">Dry & Sealed</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-stone-800 mb-1">Packaging *</label>
              <select
                value={packaging}
                onChange={(e) => setPackaging(e.target.value as any)}
                className="w-full border border-stone-300 rounded-xl p-2.5 bg-stone-50 focus:outline-none"
              >
                <option value="foil_containers">Sealed Foil Containers</option>
                <option value="disposable_boxes">Disposable Meal Boxes</option>
                <option value="bring_own_vessel">Recipient Must Bring Vessels</option>
                <option value="packaged_sealed">Packaged & Sealed</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-stone-800 mb-1">
              Food Safety & Allergen Notes
            </label>
            <input
              type="text"
              placeholder="e.g. Contains dairy/nuts; cooked today at 18:00; freshly packed"
              value={allergenNotes}
              onChange={(e) => setAllergenNotes(e.target.value)}
              className="w-full border border-stone-300 rounded-xl p-2.5 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-stone-800 mb-1">
              Pickup Address (Disclosed only upon request acceptance)
            </label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full border border-stone-300 rounded-xl p-2.5 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 font-semibold text-stone-600 hover:text-stone-900 border border-stone-200 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-5 py-2 rounded-xl transition shadow-sm active:scale-95 disabled:opacity-50"
            >
              {submitting ? 'Listing...' : 'List Donation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

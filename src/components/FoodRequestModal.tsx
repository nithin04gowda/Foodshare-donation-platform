import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  ShieldAlert,
  AlertCircle,
  Clock,
  Users,
  CheckCircle2,
} from 'lucide-react';
import { Donation, User } from '../utils/foodshare-logic';

interface FoodRequestModalProps {
  donation: Donation | null;
  currentUser: User;
  onClose: () => void;
  onRequestSubmitted: () => void;
  onRequestVerificationTab: () => void;
}

export const FoodRequestModal: React.FC<FoodRequestModalProps> = ({
  donation,
  currentUser,
  onClose,
  onRequestSubmitted,
  onRequestVerificationTab,
}) => {
  if (!donation) return null;

  const isVerified = currentUser.verificationStatus === 'verified';

  const [quantity, setQuantity] = useState(
    Math.min(20, donation.availableQuantityServings)
  );
  const [peopleToServe, setPeopleToServe] = useState(
    Math.min(20, donation.availableQuantityServings)
  );
  const [reason, setReason] = useState('');
  const [intendedRecipients, setIntendedRecipients] = useState('');
  const [proposedPickupTime, setProposedPickupTime] = useState('');
  const [transportNotes, setTransportNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleQuantityChange = (val: number) => {
    const clamped = Math.max(1, Math.min(donation.availableQuantityServings, val));
    setQuantity(clamped);
    setPeopleToServe(clamped);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!isVerified) {
      setErrorMessage(
        'Action Blocked: Only verified individual recipients and registered NGOs can request food donations. Please complete identity verification first.'
      );
      return;
    }

    if (quantity <= 0 || quantity > donation.availableQuantityServings) {
      setErrorMessage(
        `Quantity must be between 1 and ${donation.availableQuantityServings} servings.`
      );
      return;
    }

    if (!reason || reason.trim().length < 15) {
      setErrorMessage(
        'Please provide a detailed and meaningful reason for requesting food (minimum 15 characters, e.g. distributing to 20 shelter occupants).'
      );
      return;
    }

    if (!intendedRecipients || intendedRecipients.trim().length < 5) {
      setErrorMessage(
        'Please specify the intended beneficiaries (e.g., night shelter, daily wage workers).'
      );
      return;
    }

    if (!proposedPickupTime) {
      setErrorMessage('Please select a proposed pickup date and time.');
      return;
    }

    const pickupMs = new Date(proposedPickupTime).getTime();
    const expiryMs = new Date(donation.expiryDeadline).getTime();
    if (pickupMs <= Date.now()) {
      setErrorMessage('Proposed pickup time must be in the future.');
      return;
    }
    if (pickupMs > expiryMs) {
      setErrorMessage('Proposed pickup time cannot be after the food safety expiry deadline.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientId: currentUser.id,
          donationId: donation.id,
          quantityRequested: quantity,
          reason,
          intendedRecipients,
          peopleToServe,
          proposedPickupTime,
          transportNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Failed to submit request.');
      } else {
        setSuccessMessage(
          `Request submitted! ${quantity} servings have been safely reserved in the database. The donor will review your request.`
        );
        setTimeout(() => {
          onRequestSubmitted();
          onClose();
        }, 1800);
      }
    } catch (err) {
      setErrorMessage('Network or server error while submitting request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full border border-stone-200 shadow-2xl overflow-hidden my-6">
        {/* Modal Header */}
        <div className="bg-stone-900 text-stone-100 p-5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                Food Request & Pickup
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded bg-stone-800 text-stone-300">
                Atomic Reservation
              </span>
            </div>
            <h3 className="text-base font-bold text-white mt-0.5 truncate max-w-sm">
              {donation.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Verification Alert Banner if Not Verified */}
        {!isVerified ? (
          <div className="p-6 space-y-4">
            <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex items-start gap-3">
              <ShieldAlert className="w-6 h-6 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-amber-950 text-sm">
                  Identity Verification Required
                </h4>
                <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                  Your account is currently <strong>Pending Verification</strong>.
                  To ensure food safety compliance, prevent counterfeit claims, and protect food donors under FoodShare India rules, only verified individuals and accredited NGOs can request or collect food.
                </p>
                <div className="mt-3">
                  <button
                    onClick={() => {
                      onClose();
                      onRequestVerificationTab();
                    }}
                    className="bg-amber-700 hover:bg-amber-800 text-white font-medium px-4 py-2 rounded-xl text-xs transition shadow-sm"
                  >
                    Go to ID Verification Portal
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 text-xs text-stone-600 space-y-2">
              <div className="font-semibold text-stone-800">
                Why is identity verification mandatory?
              </div>
              <ul className="list-disc pl-4 space-y-1 text-stone-500">
                <li>Complies with FSSAI Food Safety and Standards Regulations for surplus food donation.</li>
                <li>Ensures food directly reaches genuine recipients and authenticated non-profit shelters.</li>
                <li>Prevents commercial resale or hoarding of zero-cost surplus food.</li>
              </ul>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 border border-stone-200 rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          /* Form for Verified Users */
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

            {/* Verification Status Tag */}
            <div className="bg-emerald-50/70 border border-emerald-200 p-2.5 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-900 font-semibold">
                  Verified Recipient: {currentUser.name}
                </span>
              </div>
              <span className="text-[10px] text-emerald-700 bg-emerald-100 font-bold px-2 py-0.5 rounded">
                Eligible for Collection
              </span>
            </div>

            {/* Quantity Slider / Number */}
            <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-bold text-stone-800">
                  Quantity to Request (Servings):
                </label>
                <div className="text-right">
                  <span className="text-base font-extrabold text-emerald-700">
                    {quantity} servings
                  </span>
                  <span className="text-[10px] text-stone-400 block">
                    (Max available: {donation.availableQuantityServings})
                  </span>
                </div>
              </div>

              <input
                type="range"
                min={1}
                max={donation.availableQuantityServings}
                value={quantity}
                onChange={(e) => handleQuantityChange(parseInt(e.target.value, 10))}
                className="w-full accent-emerald-600 cursor-pointer"
              />

              <div className="flex justify-between text-[10px] text-stone-400">
                <span>1 serving</span>
                <span>{Math.floor(donation.availableQuantityServings / 2)} servings</span>
                <span>{donation.availableQuantityServings} servings (Full)</span>
              </div>
            </div>

            {/* Intended Recipients & Beneficiary Count */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-stone-800 mb-1">
                  Intended Beneficiaries *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Night shelter residents, daily wage workers"
                  value={intendedRecipients}
                  onChange={(e) => setIntendedRecipients(e.target.value)}
                  className="w-full border border-stone-300 rounded-xl p-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-800 mb-1">
                  Number of People to Serve *
                </label>
                <div className="relative">
                  <Users className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
                  <input
                    type="number"
                    min={1}
                    max={quantity}
                    required
                    value={peopleToServe}
                    onChange={(e) => setPeopleToServe(parseInt(e.target.value, 10) || 1)}
                    className="w-full pl-9 pr-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Meaningful Reason (Mandatory) */}
            <div>
              <label className="block font-bold text-stone-800 mb-1">
                Reason for Requesting Food (Mandatory) *
              </label>
              <textarea
                required
                rows={2}
                placeholder="Explain why this food is requested, how it will be transported safely, and who will consume it (min 15 characters)..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full border border-stone-300 rounded-xl p-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:outline-none"
              />
              <span className="text-[10px] text-stone-400 block mt-0.5">
                The food donor reviews this reason before approving your collection.
              </span>
            </div>

            {/* Proposed Pickup Time & Transport */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-stone-800 mb-1">
                  Proposed Pickup Time *
                </label>
                <div className="relative">
                  <input
                    type="datetime-local"
                    required
                    value={proposedPickupTime}
                    onChange={(e) => setProposedPickupTime(e.target.value)}
                    className="w-full border border-stone-300 rounded-xl p-2 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:outline-none"
                  />
                </div>
                <span className="text-[10px] text-stone-400 flex items-center gap-1 mt-0.5">
                  <Clock className="w-3 h-3" /> Must be before deadline
                </span>
              </div>

              <div>
                <label className="block font-bold text-stone-800 mb-1">
                  Vessel / Transport Preparedness
                </label>
                <input
                  type="text"
                  placeholder="e.g. Carrying insulated cooler bag, 2 steel vessels"
                  value={transportNotes}
                  onChange={(e) => setTransportNotes(e.target.value)}
                  className="w-full border border-stone-300 rounded-xl p-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:outline-none"
                />
              </div>
            </div>

            {/* Note on Address Privacy */}
            <div className="p-2.5 rounded-xl bg-stone-100 border border-stone-200 text-[11px] text-stone-600">
              <strong>Privacy Protection:</strong> The donor's exact street address and phone number are kept private until the donor reviews and accepts this request.
            </div>

            {/* Submit / Cancel Buttons */}
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
                {submitting ? 'Reserving Quantity...' : 'Submit Request & Reserve'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { X, ShieldCheck, AlertCircle, CheckCircle2, Building2 } from 'lucide-react';
import { User } from '../utils/foodshare-logic';
import { INDIAN_STATES } from '../types';

interface RegistrationModalProps {
  onClose: () => void;
  onRegistered: (user: User) => void;
}

export const RegistrationModal: React.FC<RegistrationModalProps> = ({
  onClose,
  onRegistered,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'donor' | 'recipient' | 'ngo'>('recipient');
  const [state, setState] = useState('Karnataka');
  const [city, setCity] = useState('Bengaluru');
  const [pincode, setPincode] = useState('');
  const [address, setAddress] = useState('');

  // NGO specific
  const [orgName, setOrgName] = useState('');
  const [darpanId, setDarpanId] = useState('');
  const [registrationNo, setRegistrationNo] = useState('');
  const [beneficiaryCapacity, setBeneficiaryCapacity] = useState(100);
  const [is12A80G, setIs12A80G] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // PIN code validation: 6 digits starting with 1-9
    if (!/^[1-9][0-9]{5}$/.test(pincode.trim())) {
      setError('Registration is restricted to India. Please provide a valid 6-digit Indian PIN code (110001 - 999999).');
      return;
    }

    // Phone validation
    const cleanPhone = phone.replace(/\D/g, '');
    if (!/^[6-9][0-9]{9}$/.test(cleanPhone)) {
      setError('Please provide a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.');
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = {
        name,
        email,
        phone: cleanPhone,
        role,
        state,
        city,
        pincode: pincode.trim(),
        address,
        latitude: city.toLowerCase().includes('delhi') ? 28.6315 : 12.9716,
        longitude: city.toLowerCase().includes('delhi') ? 77.2167 : 77.5946,
      };

      if (role === 'ngo') {
        payload.ngoDetails = {
          orgName: orgName || name,
          darpanId: darpanId || 'KA/2026/0192831',
          registrationNo: registrationNo || 'REG/IN/2026/99',
          yearEstablished: 2020,
          beneficiaryCapacity,
          is12A80GRegistered: is12A80G,
        };
      }

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Registration failed.');
      } else {
        setSuccess('Registration successful! Account is Pending Verification. Switched to new account.');
        setTimeout(() => {
          onRegistered(data.user);
          onClose();
        }, 1500);
      }
    } catch (err) {
      setError('Network or server error during registration.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full border border-stone-200 shadow-2xl overflow-hidden my-6">
        <div className="bg-stone-900 text-stone-100 p-5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800">
                🇮🇳 India-Only Registration
              </span>
            </div>
            <h3 className="text-base font-bold text-white mt-1">
              Create New FoodShare Account
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
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          {/* Role selector */}
          <div>
            <label className="block font-bold text-stone-800 mb-1">
              Select Your Role in Food Redistribution *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'recipient', label: 'Individual Recipient / Volunteer' },
                { id: 'donor', label: 'Food Donor (Restaurant / Household)' },
                { id: 'ngo', label: 'Registered NGO / Charity' },
              ].map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRole(r.id as any)}
                  className={`p-2.5 rounded-xl border text-left font-medium transition ${
                    role === r.id
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold'
                      : 'border-stone-200 text-stone-600 hover:border-stone-300'
                  }`}
                >
                  <span className="text-xs leading-snug block">{r.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-stone-800 mb-1">Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Ananya Rao"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-stone-300 rounded-xl p-2.5 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-800 mb-1">Email Address *</label>
              <input
                type="email"
                required
                placeholder="e.g. ananya@example.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-stone-300 rounded-xl p-2.5 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-stone-800 mb-1">10-Digit Mobile *</label>
              <input
                type="tel"
                required
                placeholder="9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full border border-stone-300 rounded-xl p-2.5 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-800 mb-1">State in India *</label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full border border-stone-300 rounded-xl p-2.5 bg-stone-50 focus:outline-none"
              >
                {INDIAN_STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-stone-800 mb-1">6-Digit PIN Code *</label>
              <input
                type="text"
                maxLength={6}
                required
                placeholder="e.g. 560034"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                className="w-full border border-stone-300 rounded-xl p-2.5 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-stone-800 mb-1">City / District *</label>
              <input
                type="text"
                required
                placeholder="e.g. Bengaluru"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full border border-stone-300 rounded-xl p-2.5 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-800 mb-1">Local Address *</label>
              <input
                type="text"
                required
                placeholder="e.g. 4th Cross, Koramangala"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full border border-stone-300 rounded-xl p-2.5 focus:outline-none"
              />
            </div>
          </div>

          {/* NGO specific section */}
          {role === 'ngo' && (
            <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200 space-y-3">
              <div className="font-bold text-stone-900 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-emerald-600" />
                <span>NGO Trust & NITI Aayog Darpan Details</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-0.5">
                    Organization Registered Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Jeevan Asha Trust"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="w-full border border-stone-300 rounded-xl p-2 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-0.5">
                    NITI Aayog Darpan ID *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. KA/2022/0129845"
                    value={darpanId}
                    onChange={(e) => setDarpanId(e.target.value)}
                    className="w-full border border-stone-300 rounded-xl p-2 bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="chk12a"
                  checked={is12A80G}
                  onChange={(e) => setIs12A80G(e.target.checked)}
                  className="rounded text-emerald-600"
                />
                <label htmlFor="chk12a" className="text-stone-700 text-[11px]">
                  Registered under Section 12A / 80G of Income Tax Act
                </label>
              </div>
            </div>
          )}

          <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 leading-relaxed">
            <strong>Important Safety Notice:</strong> All newly registered accounts remain in <strong>Pending Verification</strong> status until government identity proof is uploaded and audited by platform moderators.
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
              {submitting ? 'Registering...' : 'Register Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

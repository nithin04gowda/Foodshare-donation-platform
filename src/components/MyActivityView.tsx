import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Phone,
  MapPin,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  AlertCircle,
  ArrowRight,
  Package,
  Calendar,
} from 'lucide-react';
import { FoodRequest, Donation, User } from '../utils/foodshare-logic';

interface MyActivityViewProps {
  currentUser: User;
  refreshTrigger: number;
  onActivityUpdated: () => void;
}

export const MyActivityView: React.FC<MyActivityViewProps> = ({
  currentUser,
  refreshTrigger,
  onActivityUpdated,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'incoming' | 'my_requests' | 'my_donations'>('incoming');
  const [requests, setRequests] = useState<any[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOtp, setSelectedOtp] = useState<{ [reqId: string]: string }>({});
  const [actionMessage, setActionMessage] = useState('');

  useEffect(() => {
    fetchActivity();
  }, [currentUser, refreshTrigger, activeSubTab]);

  const fetchActivity = async () => {
    setLoading(true);
    try {
      // Fetch user requests
      const reqRes = await fetch(`/api/requests?userId=${currentUser.id}&role=${currentUser.role}`);
      if (reqRes.ok) {
        const reqData = await reqRes.json();
        setRequests(reqData.requests || []);
      }

      // Fetch nearby/all donations to find user's own donations
      const donRes = await fetch('/api/donations/nearby?radius=5000');
      if (donRes.ok) {
        const donData = await donRes.json();
        const userDonations = (donData.donations || []).filter(
          (d: Donation) => d.donorId === currentUser.id
        );
        setDonations(userDonations);
      }
    } catch (err) {
      console.error('Failed to fetch activity:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      const res = await fetch(`/api/requests/${requestId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          donorNotes: 'Accepted. Please arrive at the scheduled pickup time with clean containers.',
        }),
      });

      if (res.ok) {
        setActionMessage('Request accepted! Donor pickup location and verification code are now shared with recipient.');
        setTimeout(() => setActionMessage(''), 3000);
        onActivityUpdated();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRejectOrCancel = async (requestId: string, action: 'reject' | 'cancel') => {
    try {
      const res = await fetch(`/api/requests/${requestId}/cancel-or-reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          reason: action === 'reject' ? 'Donor unable to fulfill request at this time.' : 'Cancelled by recipient.',
        }),
      });

      if (res.ok) {
        setActionMessage(`Request ${action}ed. Reserved quantity released back to available pool.`);
        setTimeout(() => setActionMessage(''), 3000);
        onActivityUpdated();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCompletePickup = async (requestId: string) => {
    const enteredOtp = selectedOtp[requestId] || '';
    try {
      const res = await fetch(`/api/requests/${requestId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enteredOtp }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to complete pickup');
      } else {
        setActionMessage('Pickup handover successfully verified and marked as Completed! Impact recorded.');
        setTimeout(() => setActionMessage(''), 3000);
        onActivityUpdated();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const incomingRequests = requests.filter((r) => r.donorId === currentUser.id);
  const mySentRequests = requests.filter((r) => r.recipientId === currentUser.id);

  return (
    <div className="space-y-6">
      {/* Action Notification */}
      {actionMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-900 text-xs flex items-center gap-2 shadow-sm animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-medium">{actionMessage}</span>
        </div>
      )}

      {/* Sub tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-2 text-xs font-semibold">
        {(currentUser.role === 'donor' || currentUser.role === 'admin' || currentUser.role === 'ngo') && (
          <button
            onClick={() => setActiveSubTab('incoming')}
            className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
              activeSubTab === 'incoming'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-500 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <span>Incoming Pickup Requests</span>
            {incomingRequests.filter((r) => r.status === 'requested').length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-stone-950 font-bold text-[10px]">
                {incomingRequests.filter((r) => r.status === 'requested').length}
              </span>
            )}
          </button>
        )}

        <button
          onClick={() => setActiveSubTab('my_requests')}
          className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
            activeSubTab === 'my_requests'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'text-stone-500 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <span>My Requested Food Pickups</span>
          {mySentRequests.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-stone-200 text-stone-700 font-bold text-[10px]">
              {mySentRequests.length}
            </span>
          )}
        </button>

        {(currentUser.role === 'donor' || currentUser.role === 'ngo') && (
          <button
            onClick={() => setActiveSubTab('my_donations')}
            className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
              activeSubTab === 'my_donations'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-500 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <span>My Active Donations</span>
            <span className="px-1.5 py-0.2 rounded-full bg-stone-200 text-stone-700 font-bold text-[10px]">
              {donations.length}
            </span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-stone-200 text-stone-400">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-emerald-500 border-t-transparent mb-3"></div>
          <p className="text-xs font-medium">Loading activity records...</p>
        </div>
      ) : activeSubTab === 'incoming' ? (
        /* ---------------- Incoming Requests (Donor View) ---------------- */
        <div className="space-y-4">
          {incomingRequests.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center border border-stone-200 text-stone-500 text-xs">
              No incoming food requests received yet. Available food listings are visible to nearby verified recipients.
            </div>
          ) : (
            incomingRequests.map((req) => (
              <div
                key={req.id}
                className="bg-white rounded-2xl border border-stone-200/90 p-5 shadow-sm space-y-4"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-stone-900 text-sm">{req.donationTitle}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          req.status === 'accepted'
                            ? 'bg-emerald-100 text-emerald-800'
                            : req.status === 'completed'
                            ? 'bg-blue-100 text-blue-800'
                            : req.status === 'rejected' || req.status === 'cancelled'
                            ? 'bg-stone-100 text-stone-500'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {req.status}
                      </span>
                    </div>
                    <div className="text-xs text-stone-500 mt-0.5 flex items-center gap-2">
                      <span>Requested by: <strong>{req.recipientName}</strong></span>
                      <span className="text-stone-300">•</span>
                      <span className="inline-flex items-center gap-0.5 text-emerald-700 text-[11px] font-semibold">
                        <ShieldCheck className="w-3 h-3" /> Verified {req.recipientRole?.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-base font-extrabold text-emerald-700">
                      {req.quantityRequestedServings} Servings
                    </span>
                    <span className="text-[11px] text-stone-400 block">
                      To feed {req.peopleToServe} people
                    </span>
                  </div>
                </div>

                {/* Reason & Intended Recipients */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-stone-50 p-3.5 rounded-xl border border-stone-100">
                  <div>
                    <span className="font-semibold text-stone-700 block mb-0.5">Purpose & Reason:</span>
                    <p className="text-stone-600 leading-relaxed">{req.reason}</p>
                  </div>
                  <div className="space-y-1">
                    <div>
                      <span className="font-semibold text-stone-700">Intended Beneficiaries:</span>{' '}
                      <span className="text-stone-600">{req.intendedRecipients}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-stone-600">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      <span>Proposed Pickup: {new Date(req.proposedPickupTime).toLocaleString('en-IN')}</span>
                    </div>
                    {req.transportNotes && (
                      <div className="text-stone-500">
                        <span>Preparedness: {req.transportNotes}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Handover & Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  {req.status === 'requested' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAcceptRequest(req.id)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 rounded-xl text-xs transition shadow-sm"
                      >
                        Accept Request & Reveal Pickup Details
                      </button>

                      <button
                        onClick={() => handleRejectOrCancel(req.id, 'reject')}
                        className="bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold px-4 py-2 rounded-xl text-xs transition border border-stone-200"
                      >
                        Reject (Release Quantity)
                      </button>
                    </div>
                  )}

                  {req.status === 'accepted' && (
                    <div className="flex flex-wrap items-center gap-3 w-full bg-emerald-50/60 p-3 rounded-xl border border-emerald-200">
                      <div className="flex-1">
                        <div className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                          <KeyRound className="w-4 h-4 text-emerald-700" />
                          <span>Recipient Pickup OTP Handover</span>
                        </div>
                        <p className="text-[11px] text-emerald-800 mt-0.5">
                          Enter the recipient's 4-digit verification code upon physical collection to finalize completion:
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          maxLength={6}
                          placeholder="e.g. 4821"
                          value={selectedOtp[req.id] || ''}
                          onChange={(e) =>
                            setSelectedOtp({ ...selectedOtp, [req.id]: e.target.value })
                          }
                          className="w-24 text-center tracking-widest font-mono font-bold text-sm bg-white border border-emerald-300 rounded-xl py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        />
                        <button
                          onClick={() => handleCompletePickup(req.id)}
                          className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold px-3 py-1.5 rounded-xl text-xs transition shadow-sm"
                        >
                          Verify & Complete
                        </button>
                      </div>
                    </div>
                  )}

                  {req.status === 'completed' && (
                    <div className="text-xs font-semibold text-emerald-800 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Pickup Handover Verified and Completed</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      ) : activeSubTab === 'my_requests' ? (
        /* ---------------- My Requests (Recipient View) ---------------- */
        <div className="space-y-4">
          {mySentRequests.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center border border-stone-200 text-stone-500 text-xs">
              You haven't requested any food yet. Explore the "Nearby Food Discovery" tab to view available donations.
            </div>
          ) : (
            mySentRequests.map((req) => (
              <div
                key={req.id}
                className="bg-white rounded-2xl border border-stone-200/90 p-5 shadow-sm space-y-4"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-stone-900 text-sm">{req.donationTitle}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          req.status === 'accepted'
                            ? 'bg-emerald-100 text-emerald-800'
                            : req.status === 'completed'
                            ? 'bg-blue-100 text-blue-800'
                            : req.status === 'rejected' || req.status === 'cancelled'
                            ? 'bg-stone-100 text-stone-500'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {req.status}
                      </span>
                    </div>
                    <div className="text-xs text-stone-500 mt-0.5">
                      Serving {req.peopleToServe} beneficiaries • Requested {new Date(req.createdAt).toLocaleDateString('en-IN')}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-base font-extrabold text-emerald-700">
                      {req.quantityRequestedServings} Servings Reserved
                    </span>
                  </div>
                </div>

                {/* Privacy & Details: Unlocked only if Accepted */}
                {req.status === 'accepted' ? (
                  <div className="bg-emerald-50/70 rounded-2xl p-4 border border-emerald-200 space-y-3 text-xs">
                    <div className="flex items-center gap-1.5 text-emerald-950 font-bold text-sm">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Request Approved! Pickup Location & Contact Details Unlocked</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-emerald-950">
                      <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-200">
                        <div className="text-[10px] text-emerald-700 font-semibold uppercase flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-emerald-600" /> Exact Pickup Address
                        </div>
                        <div className="font-medium mt-0.5">{req.donorAddress}</div>
                      </div>

                      <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-200">
                        <div className="text-[10px] text-emerald-700 font-semibold uppercase flex items-center gap-1">
                          <Phone className="w-3 h-3 text-emerald-600" /> Donor Contact Phone
                        </div>
                        <div className="font-medium mt-0.5">{req.donorPhone}</div>
                      </div>
                    </div>

                    {req.pickupOtp && (
                      <div className="bg-white p-3 rounded-xl border border-emerald-200 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-stone-900">Your Pickup Verification OTP:</div>
                          <div className="text-[11px] text-stone-500">
                            Present this 4-digit code to the donor upon collection.
                          </div>
                        </div>
                        <div className="text-xl font-extrabold font-mono tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-300">
                          {req.pickupOtp}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-stone-50 rounded-2xl p-3.5 border border-stone-200/80 text-xs text-stone-600 space-y-1">
                    <div className="font-semibold text-stone-800">
                      Awaiting Donor Review
                    </div>
                    <p className="text-stone-500 text-[11px]">
                      The donor is reviewing your requested quantity and purpose. To protect donor privacy, exact street address and contact number will be automatically revealed as soon as this request is accepted.
                    </p>
                  </div>
                )}

                {/* Cancel option */}
                {(req.status === 'requested' || req.status === 'accepted') && (
                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => handleRejectOrCancel(req.id, 'cancel')}
                      className="text-xs text-red-600 hover:text-red-700 font-medium underline"
                    >
                      Cancel Request (Release Quantity)
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      ) : (
        /* ---------------- My Donations (Donor Listings) ---------------- */
        <div className="space-y-4">
          {donations.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center border border-stone-200 text-stone-500 text-xs">
              You haven't listed any donations yet. Click "Donate Food" to list surplus food.
            </div>
          ) : (
            donations.map((d) => (
              <div
                key={d.id}
                className="bg-white rounded-2xl border border-stone-200/90 p-5 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-stone-900 text-sm">{d.title}</h3>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        d.status === 'completed'
                          ? 'bg-blue-100 text-blue-800'
                          : d.status === 'available'
                          ? 'bg-emerald-100 text-emerald-800'
                          : d.status === 'expired'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {d.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-emerald-700">
                    {d.availableQuantityServings} / {d.initialQuantityServings} servings left
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-xs bg-stone-50 p-3 rounded-xl border border-stone-100">
                  <div>
                    <span className="text-[10px] text-stone-400 block">Initial Quantity</span>
                    <span className="font-bold text-stone-800">{d.initialQuantityServings} servings ({d.approxWeightKg} kg)</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-400 block">Reserved / Claimed</span>
                    <span className="font-bold text-amber-700">{d.reservedQuantityServings} servings</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-400 block">Pickup Deadline</span>
                    <span className="font-bold text-stone-800">{new Date(d.expiryDeadline).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

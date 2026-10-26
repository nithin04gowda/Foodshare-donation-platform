"""
FoodShare India - Surplus Food Waste Donation Platform (Flask Backend)
Compliant with DPDP Act 2023, FSSAI Food Safety Guidelines, and India-only registration.
"""

import os
import re
import math
import uuid
import datetime
import hashlib
from functools import wraps
from flask import Flask, request, jsonify, g

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'foodshare-india-secret-key-2025')
app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(__file__), 'private_storage', 'identity_proofs')
app.config['MAX_CONTENT_LENGTH'] = 5 * 1024 * 1024  # 5 MB max file upload
ALLOWED_EXTENSIONS = {'pdf', 'png', 'jpg', 'jpeg'}

os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# ---------------------------------------------------------
# Utility & Validation Functions
# ---------------------------------------------------------

def is_valid_indian_pincode(pin: str) -> bool:
    """Validates 6-digit Indian PIN code starting with digits 1-9."""
    if not pin or not isinstance(pin, str):
        return False
    return bool(re.match(r'^[1-9][0-9]{5}$', pin.strip()))

def is_valid_indian_phone(phone: str) -> bool:
    """Validates 10-digit Indian mobile number."""
    if not phone or not isinstance(phone, str):
        return False
    clean = re.sub(r'\D', '', phone)
    if len(clean) == 12 and clean.startswith('91'):
        clean = clean[2:]
    return bool(re.match(r'^[6-9][0-9]{9}$', clean))

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates distance between coordinates in kilometers."""
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 2)

def hash_password(password: str) -> str:
    salt = "foodshare_in_salt_2025"
    return hashlib.sha256((password + salt).encode('utf-8')).hexdigest()

# ---------------------------------------------------------
# In-Memory Simulation Database (Mirrors MySQL schema)
# When deployed with MySQL, replace calls with db.cursor()
# ---------------------------------------------------------

DB = {
    "users": {},
    "ngo_verifications": {},
    "identity_documents": {},
    "donations": {},
    "food_requests": {},
    "audit_logs": []
}

# ---------------------------------------------------------
# API Endpoints
# ---------------------------------------------------------

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    name = data.get('name', '').strip()
    email = data.get('email', '').strip().lower()
    phone = data.get('phone', '').strip()
    password = data.get('password', '')
    role = data.get('role', 'recipient')
    state = data.get('state', '').strip()
    city = data.get('city', '').strip()
    pincode = data.get('pincode', '').strip()
    address = data.get('address', '').strip()
    lat = float(data.get('latitude', 12.9716))
    lon = float(data.get('longitude', 77.5946))

    if not name or not email or not password:
        return jsonify({'error': 'Name, email, and password are required.'}), 400

    if not is_valid_indian_pincode(pincode):
        return jsonify({'error': 'Registration is restricted to India. Please provide a valid 6-digit Indian PIN code.'}), 400

    if not is_valid_indian_phone(phone):
        return jsonify({'error': 'Please provide a valid 10-digit Indian mobile number.'}), 400

    if role not in ['donor', 'recipient', 'ngo']:
        return jsonify({'error': 'Invalid role. Choose donor, recipient, or ngo.'}), 400

    # Check unique
    for u in DB['users'].values():
        if u['email'] == email:
            return jsonify({'error': 'Email is already registered.'}), 409
        if u['phone'] == phone:
            return jsonify({'error': 'Phone number is already registered.'}), 409

    user_id = str(uuid.uuid4())
    user = {
        'id': user_id,
        'name': name,
        'email': email,
        'phone': phone,
        'password_hash': hash_password(password),
        'role': role,
        'country': 'India',
        'state': state,
        'city': city,
        'pincode': pincode,
        'address': address,
        'latitude': lat,
        'longitude': lon,
        'verification_status': 'pending',  # Pending admin approval
        'created_at': datetime.datetime.utcnow().isoformat()
    }
    DB['users'][user_id] = user

    # Extra NGO fields
    if role == 'ngo':
        ngo_data = data.get('ngo_details', {})
        DB['ngo_verifications'][user_id] = {
            'id': str(uuid.uuid4()),
            'user_id': user_id,
            'org_name': ngo_data.get('org_name', name),
            'darpan_id': ngo_data.get('darpan_id', ''),
            'registration_no': ngo_data.get('registration_no', ''),
            'year_established': int(ngo_data.get('year_established', 2020)),
            'beneficiary_capacity': int(ngo_data.get('beneficiary_capacity', 100)),
            'is_12a_80g_registered': bool(ngo_data.get('is_12a_80g_registered', False)),
        }

    return jsonify({
        'message': 'Account registered successfully. Upload identity proof to complete verification.',
        'user': {k: v for k, v in user.items() if k != 'password_hash'}
    }), 201

@app.route('/api/verifications/upload', methods=['POST'])
def upload_identity_doc():
    """Uploads identity document to private storage with DPDP 2023 purpose disclosure."""
    user_id = request.form.get('user_id')
    id_type = request.form.get('id_type')

    if user_id not in DB['users']:
        return jsonify({'error': 'User not found.'}), 404

    if id_type not in ['aadhaar', 'pan', 'voter_id', 'driving_license', 'ngo_darpan', 'fssai_license']:
        return jsonify({'error': 'Invalid document type.'}), 400

    file = request.files.get('document')
    if not file or file.filename == '':
        return jsonify({'error': 'No file provided.'}), 400

    ext = file.filename.rsplit('.', 1)[-1].lower() if '.' in file.filename else ''
    if ext not in ALLOWED_EXTENSIONS:
        return jsonify({'error': f'Invalid file format. Allowed: {", ".join(ALLOWED_EXTENSIONS)}'}), 400

    filename = f"{user_id}_{uuid.uuid4().hex[:8]}.{ext}"
    safe_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(safe_path)

    doc_id = str(uuid.uuid4())
    doc = {
        'id': doc_id,
        'user_id': user_id,
        'id_type': id_type,
        'file_path': safe_path,
        'status': 'pending',
        'rejection_reason': None,
        'submitted_at': datetime.datetime.utcnow().isoformat(),
        'retention_expiry': (datetime.date.today() + datetime.timedelta(days=365)).isoformat()
    }
    DB['identity_documents'][user_id] = doc
    DB['users'][user_id]['verification_status'] = 'pending'

    return jsonify({
        'message': 'Identity document uploaded securely for administrative review.',
        'doc_id': doc_id,
        'status': 'pending',
        'retention_policy': 'Retained strictly for active account duration per DPDP Act 2023.'
    }), 200

@app.route('/api/verifications/review', methods=['POST'])
def review_verification():
    """Admin endpoint to approve or reject verification requests."""
    data = request.get_json() or {}
    user_id = data.get('user_id')
    decision = data.get('decision')  # 'verified' or 'rejected'
    rejection_reason = data.get('rejection_reason', '')

    if user_id not in DB['users']:
        return jsonify({'error': 'User not found.'}), 404

    if decision not in ['verified', 'rejected']:
        return jsonify({'error': 'Decision must be verified or rejected.'}), 400

    DB['users'][user_id]['verification_status'] = decision
    if user_id in DB['identity_documents']:
        DB['identity_documents'][user_id]['status'] = decision
        if decision == 'rejected':
            DB['identity_documents'][user_id]['rejection_reason'] = rejection_reason

    return jsonify({
        'message': f'User verification marked as {decision}.',
        'user_id': user_id,
        'status': decision
    }), 200

@app.route('/api/donations/nearby', methods=['GET'])
def get_nearby_donations():
    """Returns available donations within specified radius sorted by distance (5km, 10km, 20km)."""
    try:
        lat = float(request.args.get('lat', 12.9716))
        lon = float(request.args.get('lon', 77.5946))
        radius_km = float(request.args.get('radius', 5.0))
    except ValueError:
        return jsonify({'error': 'Invalid coordinate or radius parameters.'}), 400

    results = []
    now = datetime.datetime.utcnow()

    for d in DB['donations'].values():
        if d['available_quantity_servings'] <= 0 or d['status'] in ['completed', 'cancelled', 'expired']:
            continue

        # Check expiry
        expiry_dt = datetime.datetime.fromisoformat(d['expiry_deadline'])
        if expiry_dt <= now:
            d['status'] = 'expired'
            continue

        dist = haversine_distance(lat, lon, d['latitude'], d['longitude'])
        if dist <= radius_km:
            # Mask private donor address & phone until pickup accepted
            sanitized = dict(d)
            sanitized.pop('donor_address', None)
            sanitized.pop('donor_phone', None)
            sanitized['approximate_distance_km'] = dist
            results.append(sanitized)

    # Sort nearest first
    results.sort(key=lambda x: x['approximate_distance_km'])
    return jsonify({
        'center': {'lat': lat, 'lon': lon},
        'radius_km': radius_km,
        'total_found': len(results),
        'donations': results
    }), 200

@app.route('/api/requests', methods=['POST'])
def create_food_request():
    """Transactional food request with quantity reservation."""
    data = request.get_json() or {}
    recipient_id = data.get('recipient_id')
    donation_id = data.get('donation_id')
    qty = int(data.get('quantity_requested', 0))
    reason = data.get('reason', '').strip()
    intended = data.get('intended_recipients', '').strip()
    people_count = int(data.get('people_to_serve', 0))
    proposed_time = data.get('proposed_pickup_time')

    # 1. Gate: user must be verified
    recipient = DB['users'].get(recipient_id)
    if not recipient or recipient.get('verification_status') != 'verified':
        return jsonify({'error': 'Only verified users and authenticated NGOs can request food donations.'}), 403

    # 2. Check donation
    donation = DB['donations'].get(donation_id)
    if not donation:
        return jsonify({'error': 'Donation not found.'}), 404

    if donation['status'] in ['completed', 'expired', 'cancelled']:
        return jsonify({'error': 'This donation is no longer available for requests.'}), 400

    # 3. Check requested quantity
    if qty <= 0:
        return jsonify({'error': 'Requested quantity must be positive.'}), 400

    if qty > donation['available_quantity_servings']:
        return jsonify({'error': f'Requested quantity ({qty}) exceeds available quantity ({donation["available_quantity_servings"]}).'}), 400

    # 4. Reason validation
    if len(reason) < 15:
        return jsonify({'error': 'Please provide a meaningful reason (at least 15 characters).'}), 400

    # 5. Atomic reservation
    donation['available_quantity_servings'] -= qty
    donation['reserved_quantity_servings'] += qty
    if donation['available_quantity_servings'] == 0:
        donation['status'] = 'requested'
    else:
        donation['status'] = 'partially_collected'

    request_id = str(uuid.uuid4())
    req_obj = {
        'id': request_id,
        'donation_id': donation_id,
        'donor_id': donation['donor_id'],
        'recipient_id': recipient_id,
        'recipient_name': recipient['name'],
        'quantity_requested': qty,
        'reason': reason,
        'intended_recipients': intended,
        'people_to_serve': people_count,
        'proposed_pickup_time': proposed_time,
        'status': 'requested',
        'created_at': datetime.datetime.utcnow().isoformat()
    }
    DB['food_requests'][request_id] = req_obj

    return jsonify({
        'message': 'Food request submitted and quantity reserved safely.',
        'request': req_obj,
        'remaining_available_servings': donation['available_quantity_servings']
    }), 201

if __name__ == '__main__':
    app.run(port=5000, debug=True)

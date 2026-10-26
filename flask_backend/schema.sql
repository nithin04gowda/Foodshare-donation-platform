-- =====================================================================
-- FoodShare India - Food Waste Donation Platform Schema (MySQL 8.0+)
-- Strict verification, DPDP Act 2023 compliance, transactional reservations
-- =====================================================================

CREATE DATABASE IF NOT EXISTS foodshare_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE foodshare_db;

-- 1. Users Table (India-only registration)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(15) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('donor', 'recipient', 'ngo', 'admin') NOT NULL DEFAULT 'recipient',
    country VARCHAR(20) NOT NULL DEFAULT 'India',
    state VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    pincode CHAR(6) NOT NULL,
    address TEXT NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    verification_status ENUM('pending', 'verified', 'rejected') NOT NULL DEFAULT 'pending',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_india_pincode CHECK (pincode REGEXP '^[1-9][0-9]{5}$'),
    CONSTRAINT chk_india_phone CHECK (phone REGEXP '^[6-9][0-9]{9}$'),
    INDEX idx_user_location (latitude, longitude),
    INDEX idx_user_status (verification_status)
) ENGINE=InnoDB;

-- 2. NGO Verification Details (for Registered Charities/Foundations)
CREATE TABLE IF NOT EXISTS ngo_verifications (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    org_name VARCHAR(200) NOT NULL,
    darpan_id VARCHAR(50) NOT NULL, -- NITI Aayog NGO Darpan unique ID
    registration_no VARCHAR(100) NOT NULL,
    year_established INT NOT NULL,
    beneficiary_capacity INT NOT NULL DEFAULT 50,
    is_12a_80g_registered BOOLEAN NOT NULL DEFAULT FALSE,
    authorized_signatory_name VARCHAR(150) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uq_ngo_darpan (darpan_id)
) ENGINE=InnoDB;

-- 3. Identity Verification Documents (Encrypted private storage reference)
-- Never expose ID documents publicly or in public static directories!
CREATE TABLE IF NOT EXISTS identity_documents (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    id_type ENUM('aadhaar', 'pan', 'voter_id', 'driving_license', 'ngo_darpan', 'fssai_license') NOT NULL,
    file_path VARCHAR(255) NOT NULL, -- Stored in private directory outside web root
    file_mime_type VARCHAR(50) NOT NULL,
    file_size_bytes INT NOT NULL,
    status ENUM('pending', 'verified', 'rejected') NOT NULL DEFAULT 'pending',
    rejection_reason TEXT,
    reviewed_by VARCHAR(36),
    reviewed_at TIMESTAMP NULL,
    retention_expiry_date DATE NOT NULL, -- Under DPDP Act 2023 retention policy
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_doc_status (status)
) ENGINE=InnoDB;

-- 4. Donations Table (Surplus food listings)
CREATE TABLE IF NOT EXISTS donations (
    id VARCHAR(36) PRIMARY KEY,
    donor_id VARCHAR(36) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    category ENUM('cooked_meals', 'bakery', 'raw_groceries', 'packaged_food', 'fruits_veggies') NOT NULL,
    food_type ENUM('veg', 'non_veg', 'vegan') NOT NULL DEFAULT 'veg',
    initial_quantity_servings INT NOT NULL,
    available_quantity_servings INT NOT NULL,
    reserved_quantity_servings INT NOT NULL DEFAULT 0,
    approx_weight_kg DECIMAL(8, 2) NOT NULL,
    state VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    pincode CHAR(6) NOT NULL,
    address TEXT NOT NULL, -- Donor address: private until pickup request is accepted
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    prepared_at TIMESTAMP NOT NULL,
    expiry_deadline TIMESTAMP NOT NULL,
    storage_condition ENUM('ambient', 'refrigerated', 'heated', 'dry_sealed') NOT NULL,
    packaging ENUM('foil_containers', 'disposable_boxes', 'bring_own_vessel', 'packaged_sealed') NOT NULL,
    allergen_notes TEXT,
    status ENUM('available', 'requested', 'accepted', 'partially_collected', 'completed', 'expired', 'cancelled') NOT NULL DEFAULT 'available',
    pickup_otp VARCHAR(6) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (donor_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_geo (latitude, longitude),
    INDEX idx_status_expiry (status, expiry_deadline),
    CONSTRAINT chk_positive_servings CHECK (initial_quantity_servings > 0),
    CONSTRAINT chk_available_servings CHECK (available_quantity_servings >= 0),
    CONSTRAINT chk_reserved_servings CHECK (reserved_quantity_servings >= 0)
) ENGINE=InnoDB;

-- 5. Food Requests Table (Transactional reservations & pickup workflow)
CREATE TABLE IF NOT EXISTS food_requests (
    id VARCHAR(36) PRIMARY KEY,
    donation_id VARCHAR(36) NOT NULL,
    donor_id VARCHAR(36) NOT NULL,
    recipient_id VARCHAR(36) NOT NULL,
    quantity_requested_servings INT NOT NULL,
    quantity_collected_servings INT DEFAULT 0,
    reason TEXT NOT NULL,
    intended_recipients VARCHAR(255) NOT NULL,
    people_to_serve INT NOT NULL,
    proposed_pickup_time TIMESTAMP NOT NULL,
    transport_notes TEXT,
    status ENUM('requested', 'accepted', 'rejected', 'partially_collected', 'completed', 'cancelled') NOT NULL DEFAULT 'requested',
    donor_notes TEXT,
    pickup_verification_code VARCHAR(6),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (donation_id) REFERENCES donations(id) ON DELETE CASCADE,
    FOREIGN KEY (donor_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_request_status (status)
) ENGINE=InnoDB;

-- 6. Audit & Moderation Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(36) PRIMARY KEY,
    action VARCHAR(100) NOT NULL,
    performed_by VARCHAR(36) NOT NULL,
    target_type VARCHAR(50) NOT NULL,
    target_id VARCHAR(36) NOT NULL,
    details JSON,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (performed_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =====================================================================
-- Helpful Stored Procedure for Safe Quantity Reservation Transaction
-- =====================================================================
DELIMITER //
CREATE PROCEDURE ReserveFoodQuantity(
    IN p_request_id VARCHAR(36),
    IN p_donation_id VARCHAR(36),
    IN p_recipient_id VARCHAR(36),
    IN p_quantity INT,
    OUT p_success BOOLEAN,
    OUT p_message VARCHAR(255)
)
BEGIN
    DECLARE v_available INT;
    DECLARE v_status VARCHAR(50);
    DECLARE v_user_verified VARCHAR(20);

    -- Check if recipient is verified
    SELECT verification_status INTO v_user_verified FROM users WHERE id = p_recipient_id;
    IF v_user_verified != 'verified' THEN
        SET p_success = FALSE;
        SET p_message = 'Recipient is not verified to collect food.';
    ELSE
        -- Lock donation row for safe atomic reservation
        SELECT available_quantity_servings, status INTO v_available, v_status
        FROM donations WHERE id = p_donation_id FOR UPDATE;

        IF v_status = 'expired' OR v_status = 'completed' OR v_status = 'cancelled' THEN
            SET p_success = FALSE;
            SET p_message = 'Donation is no longer available.';
        ELSEIF v_available < p_quantity THEN
            SET p_success = FALSE;
            SET p_message = CONCAT('Only ', v_available, ' servings available.');
        ELSE
            UPDATE donations
            SET available_quantity_servings = available_quantity_servings - p_quantity,
                reserved_quantity_servings = reserved_quantity_servings + p_quantity,
                status = IF(available_quantity_servings - p_quantity = 0, 'requested', 'partially_collected')
            WHERE id = p_donation_id;

            SET p_success = TRUE;
            SET p_message = 'Quantity reserved successfully.';
        END IF;
    END IF;
END //
DELIMITER ;

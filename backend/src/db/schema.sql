-- Schema for Kremlin Luxury Studios Boutique Hotel DB

-- Users Table for Host Admin Panel
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Guest Booking Inquiries Table
CREATE TABLE IF NOT EXISTS inquiries (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    check_in_date DATE,
    check_out_date DATE,
    guests INTEGER DEFAULT 1,
    message TEXT,
    status VARCHAR(50) DEFAULT 'new', -- new, contacting, confirmed, cancelled
    source VARCHAR(100) DEFAULT 'contact_form', -- contact_form, concierge_chat, check_availability_modal
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Concierge Chat Sessions
CREATE TABLE IF NOT EXISTS chat_sessions (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(100) UNIQUE NOT NULL,
    guest_name VARCHAR(255),
    guest_email VARCHAR(255),
    messages JSONB DEFAULT '[]'::jsonb, -- Array of { role: 'user'|'assistant', content: string, timestamp: string }
    qualified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Traffic Analytics
CREATE TABLE IF NOT EXISTS analytics_events (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL, -- page_view, cta_click, date_check, booking_click
    page_path VARCHAR(255) DEFAULT '/',
    referrer VARCHAR(255),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

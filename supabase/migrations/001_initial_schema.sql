-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create properties table
CREATE TABLE properties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  district VARCHAR(100),
  city VARCHAR(100) DEFAULT 'Hồ Chí Minh',
  description TEXT,
  total_rooms INTEGER DEFAULT 0,
  occupied_rooms INTEGER DEFAULT 0,
  available_rooms INTEGER DEFAULT 0,
  occupancy_percentage DECIMAL(5,2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create rooms table
CREATE TABLE rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  room_number VARCHAR(50) NOT NULL,
  floor VARCHAR(50),
  area_sqm DECIMAL(8,2),
  rent_amount DECIMAL(10,2) NOT NULL,
  deposit_amount DECIMAL(10,2),
  utilities TEXT[], -- Array of utilities like ['Điện', 'Nước', 'Internet']
  status VARCHAR(50) DEFAULT 'available', -- available, occupied, maintenance
  description TEXT,
  images TEXT[], -- Array of image URLs
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(property_id, room_number)
);

-- Create tenants table
CREATE TABLE tenants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255),
  id_number VARCHAR(50),
  birth_date DATE,
  address TEXT,
  occupation VARCHAR(255),
  emergency_contact VARCHAR(255),
  emergency_phone VARCHAR(20),
  avatar_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create rental contracts table
CREATE TABLE rental_contracts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE,
  monthly_rent DECIMAL(10,2) NOT NULL,
  deposit_amount DECIMAL(10,2),
  renewal_count INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'active', -- active, expired, terminated
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payment records table
CREATE TABLE payment_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID REFERENCES rental_contracts(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  payment_date DATE NOT NULL,
  due_date DATE NOT NULL,
  month_year VARCHAR(7) NOT NULL, -- Format: '2024-01'
  payment_type VARCHAR(50) DEFAULT 'rent', -- rent, deposit, utility, fee
  status VARCHAR(50) DEFAULT 'pending', -- pending, paid, overdue, cancelled
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create receipts table
CREATE TABLE receipts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_record_id UUID REFERENCES payment_records(id) ON DELETE CASCADE,
  receipt_number VARCHAR(50) UNIQUE NOT NULL,
  tenant_name VARCHAR(255) NOT NULL,
  room_info VARCHAR(255) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(50) DEFAULT 'cash', -- cash, bank_transfer, card
  issued_date DATE DEFAULT CURRENT_DATE,
  issued_by VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create function to update property room counts
CREATE OR REPLACE FUNCTION update_property_room_counts()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE properties 
  SET 
    total_rooms = (SELECT COUNT(*) FROM rooms WHERE property_id = COALESCE(NEW.property_id, OLD.property_id)),
    occupied_rooms = (SELECT COUNT(*) FROM rooms WHERE property_id = COALESCE(NEW.property_id, OLD.property_id) AND status = 'occupied'),
    available_rooms = (SELECT COUNT(*) FROM rooms WHERE property_id = COALESCE(NEW.property_id, OLD.property_id) AND status = 'available'),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.property_id, OLD.property_id);
  
  -- Update occupancy percentage
  UPDATE properties 
  SET occupancy_percentage = CASE 
    WHEN total_rooms > 0 THEN ROUND((occupied_rooms::DECIMAL / total_rooms::DECIMAL) * 100, 2)
    ELSE 0 
  END
  WHERE id = COALESCE(NEW.property_id, OLD.property_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update property counts
CREATE TRIGGER trigger_update_property_counts
  AFTER INSERT OR UPDATE OR DELETE ON rooms
  FOR EACH ROW
  EXECUTE FUNCTION update_property_room_counts();

-- Insert sample data
INSERT INTO properties (name, address, district, city) VALUES
  ('Bạch Đằng, P.Gia Định - TpHCM', '325/16/9 đường Bạch Đằng, Phường Gia Định - Tp.HCM', 'Bình Thạnh', 'Hồ Chí Minh'),
  ('Bình Chuẩn, P.An Phú, TpHCM', '37/07 đường Bình Chuẩn 30, Phường An Phú, Tp.HCM', 'Thủ Đức', 'Hồ Chí Minh');

-- Insert sample rooms for first property
INSERT INTO rooms (property_id, room_number, rent_amount, status) VALUES
  ((SELECT id FROM properties WHERE name LIKE '%Bạch Đằng%'), '101', 3000000, 'occupied'),
  ((SELECT id FROM properties WHERE name LIKE '%Bạch Đằng%'), '102', 3000000, 'occupied'),
  ((SELECT id FROM properties WHERE name LIKE '%Bạch Đằng%'), '103', 3000000, 'occupied'),
  ((SELECT id FROM properties WHERE name LIKE '%Bạch Đằng%'), '104', 3000000, 'occupied'),
  ((SELECT id FROM properties WHERE name LIKE '%Bạch Đằng%'), '105', 3000000, 'occupied'),
  ((SELECT id FROM properties WHERE name LIKE '%Bạch Đằng%'), '106', 3000000, 'occupied'),
  ((SELECT id FROM properties WHERE name LIKE '%Bạch Đằng%'), '107', 3000000, 'occupied'),
  ((SELECT id FROM properties WHERE name LIKE '%Bạch Đằng%'), '108', 3000000, 'occupied'),
  ((SELECT id FROM properties WHERE name LIKE '%Bạch Đằng%'), '109', 3000000, 'occupied'),
  ((SELECT id FROM properties WHERE name LIKE '%Bạch Đằng%'), '110', 3000000, 'available');

-- Insert sample rooms for second property
INSERT INTO rooms (property_id, room_number, rent_amount, status) VALUES
  ((SELECT id FROM properties WHERE name LIKE '%Bình Chuẩn%'), '201', 2500000, 'occupied'),
  ((SELECT id FROM properties WHERE name LIKE '%Bình Chuẩn%'), '202', 2500000, 'occupied'),
  ((SELECT id FROM properties WHERE name LIKE '%Bình Chuẩn%'), '203', 2500000, 'occupied'),
  ((SELECT id FROM properties WHERE name LIKE '%Bình Chuẩn%'), '204', 2500000, 'occupied'),
  ((SELECT id FROM properties WHERE name LIKE '%Bình Chuẩn%'), '205', 2500000, 'occupied');

-- Insert sample tenants
INSERT INTO tenants (full_name, phone, email) VALUES
  ('Nguyễn Văn A', '0901234567', 'nguyenvana@email.com'),
  ('Trần Thị B', '0902345678', 'tranthib@email.com'),
  ('Lê Văn C', '0903456789', 'levanc@email.com'),
  ('Phạm Thị D', '0904567890', 'phamthid@email.com');

-- Setup user-specific data isolation
-- Add user_id columns and RLS policies to ensure each user only sees their own data

-- 1. Add user_id column to all main tables
ALTER TABLE properties ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE rental_contracts ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE payment_records ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to rental_invoices if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rental_invoices') THEN
        ALTER TABLE rental_invoices ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END
$$;

-- 2. Create indexes on user_id columns for better performance
CREATE INDEX IF NOT EXISTS idx_properties_user_id ON properties(user_id);
CREATE INDEX IF NOT EXISTS idx_rooms_user_id ON rooms(user_id);
CREATE INDEX IF NOT EXISTS idx_tenants_user_id ON tenants(user_id);
CREATE INDEX IF NOT EXISTS idx_rental_contracts_user_id ON rental_contracts(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_records_user_id ON payment_records(user_id);
CREATE INDEX IF NOT EXISTS idx_receipts_user_id ON receipts(user_id);

-- 3. Enable RLS on all tables
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE rental_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

-- Enable RLS on rental_invoices if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rental_invoices') THEN
        ALTER TABLE rental_invoices ENABLE ROW LEVEL SECURITY;
    END IF;
END
$$;

-- 4. Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can only access their own properties" ON properties;
DROP POLICY IF EXISTS "Users can only access their own rooms" ON rooms;
DROP POLICY IF EXISTS "Users can only access their own tenants" ON tenants;
DROP POLICY IF EXISTS "Users can only access their own contracts" ON rental_contracts;
DROP POLICY IF EXISTS "Users can only access their own payments" ON payment_records;
DROP POLICY IF EXISTS "Users can only access their own receipts" ON receipts;

-- Drop rental_invoices policies if table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rental_invoices') THEN
        DROP POLICY IF EXISTS "Users can only access their own invoices" ON rental_invoices;
    END IF;
END
$$;

-- 5. Create RLS policies for user-specific data access
CREATE POLICY "Users can only access their own properties" ON properties
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own rooms" ON rooms
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own tenants" ON tenants
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own contracts" ON rental_contracts
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own payments" ON payment_records
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own receipts" ON receipts
    FOR ALL USING (auth.uid() = user_id);

-- Create policy for rental_invoices if table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rental_invoices') THEN
        CREATE POLICY "Users can only access their own invoices" ON rental_invoices
            FOR ALL USING (auth.uid() = user_id);
    END IF;
END
$$;

-- 6. Update existing data to assign it to the first user (for testing)
-- This will assign all existing data to the test user we created
DO $$
DECLARE
    test_user_id UUID;
BEGIN
    -- Get the test user ID
    SELECT id INTO test_user_id FROM auth.users WHERE email = 'test@rental.com' LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        -- Update all existing records to belong to the test user
        UPDATE properties SET user_id = test_user_id WHERE user_id IS NULL;
        UPDATE rooms SET user_id = test_user_id WHERE user_id IS NULL;
        UPDATE tenants SET user_id = test_user_id WHERE user_id IS NULL;
        UPDATE rental_contracts SET user_id = test_user_id WHERE user_id IS NULL;
        UPDATE payment_records SET user_id = test_user_id WHERE user_id IS NULL;
        UPDATE receipts SET user_id = test_user_id WHERE user_id IS NULL;
        
        -- Update rental_invoices if it exists
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rental_invoices') THEN
            UPDATE rental_invoices SET user_id = test_user_id WHERE user_id IS NULL;
        END IF;
        
        RAISE NOTICE 'Assigned all existing data to test user: %', test_user_id;
    ELSE
        RAISE NOTICE 'Test user not found. Please create test user first.';
    END IF;
END
$$;

-- 7. Create function to automatically set user_id on INSERT
CREATE OR REPLACE FUNCTION set_user_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.user_id = auth.uid();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Create triggers to automatically set user_id on INSERT
DROP TRIGGER IF EXISTS set_properties_user_id ON properties;
DROP TRIGGER IF EXISTS set_rooms_user_id ON rooms;
DROP TRIGGER IF EXISTS set_tenants_user_id ON tenants;
DROP TRIGGER IF EXISTS set_rental_contracts_user_id ON rental_contracts;
DROP TRIGGER IF EXISTS set_payment_records_user_id ON payment_records;
DROP TRIGGER IF EXISTS set_receipts_user_id ON receipts;

CREATE TRIGGER set_properties_user_id
    BEFORE INSERT ON properties
    FOR EACH ROW EXECUTE FUNCTION set_user_id();

CREATE TRIGGER set_rooms_user_id
    BEFORE INSERT ON rooms
    FOR EACH ROW EXECUTE FUNCTION set_user_id();

CREATE TRIGGER set_tenants_user_id
    BEFORE INSERT ON tenants
    FOR EACH ROW EXECUTE FUNCTION set_user_id();

CREATE TRIGGER set_rental_contracts_user_id
    BEFORE INSERT ON rental_contracts
    FOR EACH ROW EXECUTE FUNCTION set_user_id();

CREATE TRIGGER set_payment_records_user_id
    BEFORE INSERT ON payment_records
    FOR EACH ROW EXECUTE FUNCTION set_user_id();

CREATE TRIGGER set_receipts_user_id
    BEFORE INSERT ON receipts
    FOR EACH ROW EXECUTE FUNCTION set_user_id();

-- Create trigger for rental_invoices if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rental_invoices') THEN
        DROP TRIGGER IF EXISTS set_rental_invoices_user_id ON rental_invoices;
        CREATE TRIGGER set_rental_invoices_user_id
            BEFORE INSERT ON rental_invoices
            FOR EACH ROW EXECUTE FUNCTION set_user_id();
    END IF;
END
$$;

-- 9. Grant necessary permissions
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT SELECT ON auth.users TO authenticated;

SELECT 'User isolation setup completed successfully!' as result;

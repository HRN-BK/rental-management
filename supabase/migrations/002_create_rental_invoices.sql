-- Migration: Create rental_invoices table
-- Created at: 2025-08-28
-- Description: Add rental_invoices table for invoice management with detailed fee tracking

-- Create rental_invoices table
CREATE TABLE IF NOT EXISTS public.rental_invoices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- References
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    contract_id UUID REFERENCES rental_contracts(id) ON DELETE SET NULL,
    
    -- Invoice metadata
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    template_type VARCHAR(20) DEFAULT 'professional',
    status VARCHAR(20) DEFAULT 'draft', -- draft, sent, paid, overdue, cancelled
    
    -- Base rent
    rent_amount DECIMAL(12,2) DEFAULT 0,
    
    -- Electricity charges
    electricity_previous_reading INTEGER DEFAULT 0,
    electricity_current_reading INTEGER DEFAULT 0,
    electricity_unit_price DECIMAL(10,2) DEFAULT 0,
    electricity_amount DECIMAL(12,2) DEFAULT 0,
    electricity_note TEXT,
    
    -- Water charges
    water_previous_reading INTEGER DEFAULT 0,
    water_current_reading INTEGER DEFAULT 0,
    water_unit_price DECIMAL(10,2) DEFAULT 0,
    water_amount DECIMAL(12,2) DEFAULT 0,
    water_note TEXT,
    
    -- Internet charges
    internet_amount DECIMAL(12,2) DEFAULT 0,
    internet_note TEXT,
    
    -- Trash/cleaning charges
    trash_amount DECIMAL(12,2) DEFAULT 0,
    trash_note TEXT,
    
    -- Additional fees (JSON array for flexibility)
    other_fees JSONB DEFAULT '[]', -- [{name: "Phí gửi xe", amount: 100000, note: ""}]
    
    -- Totals and notes
    total_amount DECIMAL(12,2) NOT NULL,
    notes TEXT,
    pdf_url TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_rental_invoices_room_id ON rental_invoices(room_id);
CREATE INDEX IF NOT EXISTS idx_rental_invoices_tenant_id ON rental_invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_rental_invoices_contract_id ON rental_invoices(contract_id);
CREATE INDEX IF NOT EXISTS idx_rental_invoices_status ON rental_invoices(status);
CREATE INDEX IF NOT EXISTS idx_rental_invoices_period ON rental_invoices(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_rental_invoices_due_date ON rental_invoices(due_date);

-- Create function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_rental_invoices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-updating updated_at
CREATE TRIGGER trigger_update_rental_invoices_updated_at
    BEFORE UPDATE ON rental_invoices
    FOR EACH ROW
    EXECUTE FUNCTION update_rental_invoices_updated_at();

-- Enable Row Level Security (optional, disable if not needed)
-- ALTER TABLE rental_invoices ENABLE ROW LEVEL SECURITY;

-- Create basic policy (uncomment if RLS is enabled)
-- CREATE POLICY "Allow all operations on rental_invoices" ON rental_invoices
--     FOR ALL USING (true);

COMMENT ON TABLE rental_invoices IS 'Table to store rental invoices with detailed fee breakdown';
COMMENT ON COLUMN rental_invoices.other_fees IS 'JSON array storing additional fees: [{"name": "Fee name", "amount": 100000, "note": "Optional note"}]';

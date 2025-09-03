-- Create rental_invoices table (basic version)
CREATE TABLE IF NOT EXISTS public.rental_invoices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    contract_id UUID,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    template_type VARCHAR(20) DEFAULT 'professional',
    status VARCHAR(20) DEFAULT 'draft',
    
    -- Chi phí chi tiết
    rent_amount DECIMAL(12,2) DEFAULT 0,
    
    -- Tiền điện
    electricity_previous_reading INTEGER DEFAULT 0,
    electricity_current_reading INTEGER DEFAULT 0,
    electricity_unit_price DECIMAL(10,2) DEFAULT 0,
    electricity_amount DECIMAL(12,2) DEFAULT 0,
    electricity_note TEXT,
    
    -- Tiền nước
    water_previous_reading INTEGER DEFAULT 0,
    water_current_reading INTEGER DEFAULT 0,
    water_unit_price DECIMAL(10,2) DEFAULT 0,
    water_amount DECIMAL(12,2) DEFAULT 0,
    water_note TEXT,
    
    -- Các khoản khác
    internet_amount DECIMAL(12,2) DEFAULT 0,
    internet_note TEXT,
    trash_amount DECIMAL(12,2) DEFAULT 0,
    trash_note TEXT,
    
    -- Các khoản phụ thu khác
    other_fees JSONB DEFAULT '[]',
    
    total_amount DECIMAL(12,2) NOT NULL,
    notes TEXT,
    pdf_url TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

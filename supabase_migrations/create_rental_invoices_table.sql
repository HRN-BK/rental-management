-- Create rental_invoices table
CREATE TABLE IF NOT EXISTS public.rental_invoices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    contract_id UUID REFERENCES public.rental_contracts(id) ON DELETE SET NULL,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    template_type VARCHAR(20) DEFAULT 'professional' CHECK (template_type IN ('simple', 'professional')),
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
    
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
    
    -- Các khoản phụ thu khác (JSON array)
    other_fees JSONB DEFAULT '[]',
    
    total_amount DECIMAL(12,2) NOT NULL,
    notes TEXT,
    pdf_url TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_rental_invoices_room_id ON public.rental_invoices(room_id);
CREATE INDEX IF NOT EXISTS idx_rental_invoices_tenant_id ON public.rental_invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_rental_invoices_contract_id ON public.rental_invoices(contract_id);
CREATE INDEX IF NOT EXISTS idx_rental_invoices_status ON public.rental_invoices(status);
CREATE INDEX IF NOT EXISTS idx_rental_invoices_period_start ON public.rental_invoices(period_start);
CREATE INDEX IF NOT EXISTS idx_rental_invoices_created_at ON public.rental_invoices(created_at);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_rental_invoices_updated_at
    BEFORE UPDATE ON public.rental_invoices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE public.rental_invoices ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (adjust based on your authentication strategy)
-- For now, allowing all operations for authenticated users
CREATE POLICY "Allow all operations for authenticated users" ON public.rental_invoices
    FOR ALL USING (auth.role() = 'authenticated');

-- Insert some sample data for testing
INSERT INTO public.rental_invoices (
    room_id,
    tenant_id,
    contract_id,
    invoice_number,
    period_start,
    period_end,
    issue_date,
    due_date,
    template_type,
    status,
    rent_amount,
    electricity_previous_reading,
    electricity_current_reading,
    electricity_unit_price,
    electricity_amount,
    electricity_note,
    water_previous_reading,
    water_current_reading,
    water_unit_price,
    water_amount,
    water_note,
    internet_amount,
    internet_note,
    trash_amount,
    trash_note,
    other_fees,
    total_amount,
    notes
) 
SELECT 
    r.id as room_id,
    rc.tenant_id,
    rc.id as contract_id,
    'INV-' || EXTRACT(YEAR FROM CURRENT_DATE) || LPAD(EXTRACT(MONTH FROM CURRENT_DATE)::TEXT, 2, '0') || '-' || LPAD(r.room_number, 3, '0') as invoice_number,
    DATE_TRUNC('month', CURRENT_DATE) as period_start,
    (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::DATE as period_end,
    CURRENT_DATE as issue_date,
    CURRENT_DATE + INTERVAL '7 days' as due_date,
    'professional' as template_type,
    'draft' as status,
    rc.monthly_rent as rent_amount,
    FLOOR(RANDOM() * 100 + 100)::INTEGER as electricity_previous_reading,
    FLOOR(RANDOM() * 100 + 200)::INTEGER as electricity_current_reading,
    4000 as electricity_unit_price,
    FLOOR(RANDOM() * 100 + 100) * 4000 as electricity_amount,
    'Tính theo chỉ số công tơ điện' as electricity_note,
    FLOOR(RANDOM() * 10 + 10)::INTEGER as water_previous_reading,
    FLOOR(RANDOM() * 10 + 20)::INTEGER as water_current_reading,
    11000 as water_unit_price,
    FLOOR(RANDOM() * 10 + 10) * 11000 as water_amount,
    'Tính theo chỉ số đồng hồ nước' as water_note,
    50000 as internet_amount,
    'Cáp quang FPT' as internet_note,
    20000 as trash_amount,
    'Phí vệ sinh môi trường' as trash_note,
    '[]'::jsonb as other_fees,
    (rc.monthly_rent + FLOOR(RANDOM() * 100 + 100) * 4000 + FLOOR(RANDOM() * 10 + 10) * 11000 + 50000 + 20000) as total_amount,
    'Hóa đơn thu tiền tháng ' || EXTRACT(MONTH FROM CURRENT_DATE) || '/' || EXTRACT(YEAR FROM CURRENT_DATE) as notes
FROM public.rooms r
INNER JOIN public.rental_contracts rc ON r.id = rc.room_id
WHERE r.status = 'occupied' AND rc.status = 'active'
LIMIT 5; -- Only create sample invoices for first 5 occupied rooms

-- Grant necessary permissions
GRANT ALL ON public.rental_invoices TO authenticated;
GRANT ALL ON public.rental_invoices TO service_role;

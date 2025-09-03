-- Migration: Insert sample rental invoices
-- Created at: 2025-08-28
-- Description: Add sample rental invoices for testing

-- First, let's insert some rental contracts for occupied rooms if they don't exist
INSERT INTO rental_contracts (room_id, tenant_id, start_date, monthly_rent, status)
SELECT 
    r.id as room_id,
    t.id as tenant_id,
    CURRENT_DATE - INTERVAL '6 months' as start_date,
    r.rent_amount as monthly_rent,
    'active' as status
FROM rooms r
CROSS JOIN tenants t
WHERE r.status = 'occupied'
  AND NOT EXISTS (
    SELECT 1 FROM rental_contracts rc 
    WHERE rc.room_id = r.id AND rc.status = 'active'
  )
LIMIT 14; -- Match the number of occupied rooms

-- Insert sample rental invoices
INSERT INTO rental_invoices (
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
    rc.room_id,
    rc.tenant_id,
    rc.id as contract_id,
    'INV-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || LPAD(ROW_NUMBER() OVER()::TEXT, 4, '0') as invoice_number,
    DATE_TRUNC('month', CURRENT_DATE) as period_start,
    DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day' as period_end,
    CURRENT_DATE as issue_date,
    CURRENT_DATE + INTERVAL '7 days' as due_date,
    'professional' as template_type,
    CASE 
        WHEN ROW_NUMBER() OVER() % 4 = 0 THEN 'paid'
        WHEN ROW_NUMBER() OVER() % 4 = 1 THEN 'sent'
        WHEN ROW_NUMBER() OVER() % 4 = 2 THEN 'overdue'
        ELSE 'draft'
    END as status,
    rc.monthly_rent as rent_amount,
    -- Electricity readings (random but realistic)
    150 + (ROW_NUMBER() OVER() * 23) % 50 as electricity_previous_reading,
    180 + (ROW_NUMBER() OVER() * 31) % 80 as electricity_current_reading,
    3500 as electricity_unit_price,
    ((180 + (ROW_NUMBER() OVER() * 31) % 80) - (150 + (ROW_NUMBER() OVER() * 23) % 50)) * 3500 as electricity_amount,
    'Chỉ số điện tháng này' as electricity_note,
    -- Water readings (random but realistic)  
    45 + (ROW_NUMBER() OVER() * 17) % 20 as water_previous_reading,
    50 + (ROW_NUMBER() OVER() * 19) % 25 as water_current_reading,
    25000 as water_unit_price,
    ((50 + (ROW_NUMBER() OVER() * 19) % 25) - (45 + (ROW_NUMBER() OVER() * 17) % 20)) * 25000 as water_amount,
    'Chỉ số nước tháng này' as water_note,
    50000 as internet_amount,
    'Wifi tốc độ cao' as internet_note,
    20000 as trash_amount,
    'Phí vệ sinh chung' as trash_note,
    CASE 
        WHEN ROW_NUMBER() OVER() % 3 = 0 THEN '[{"name": "Phí gửi xe", "amount": 100000, "note": "Gửi xe máy trong tháng"}]'::jsonb
        WHEN ROW_NUMBER() OVER() % 3 = 1 THEN '[{"name": "Phí bảo trì", "amount": 50000, "note": "Bảo trì thiết bị chung"}]'::jsonb
        ELSE '[]'::jsonb
    END as other_fees,
    -- Calculate total amount
    rc.monthly_rent + 
    ((180 + (ROW_NUMBER() OVER() * 31) % 80) - (150 + (ROW_NUMBER() OVER() * 23) % 50)) * 3500 +
    ((50 + (ROW_NUMBER() OVER() * 19) % 25) - (45 + (ROW_NUMBER() OVER() * 17) % 20)) * 25000 +
    50000 + 20000 +
    CASE 
        WHEN ROW_NUMBER() OVER() % 3 = 0 THEN 100000
        WHEN ROW_NUMBER() OVER() % 3 = 1 THEN 50000
        ELSE 0
    END as total_amount,
    'Hóa đơn thuê phòng tháng ' || TO_CHAR(CURRENT_DATE, 'MM/YYYY') as notes
FROM rental_contracts rc
WHERE rc.status = 'active'
LIMIT 10; -- Create 10 sample invoices

-- Insert some invoices for previous months (historical data)
INSERT INTO rental_invoices (
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
    water_previous_reading,
    water_current_reading,
    water_unit_price,
    water_amount,
    internet_amount,
    trash_amount,
    total_amount,
    notes
)
SELECT 
    rc.room_id,
    rc.tenant_id,
    rc.id as contract_id,
    'INV-' || TO_CHAR(CURRENT_DATE - INTERVAL '1 month', 'YYYY') || '-' || LPAD((ROW_NUMBER() OVER() + 100)::TEXT, 4, '0') as invoice_number,
    DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month') as period_start,
    DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month') + INTERVAL '1 month' - INTERVAL '1 day' as period_end,
    CURRENT_DATE - INTERVAL '1 month' as issue_date,
    CURRENT_DATE - INTERVAL '1 month' + INTERVAL '7 days' as due_date,
    'professional' as template_type,
    'paid' as status, -- Historical invoices are typically paid
    rc.monthly_rent as rent_amount,
    120 + (ROW_NUMBER() OVER() * 19) % 40 as electricity_previous_reading,
    150 + (ROW_NUMBER() OVER() * 23) % 50 as electricity_current_reading,
    3400 as electricity_unit_price,
    ((150 + (ROW_NUMBER() OVER() * 23) % 50) - (120 + (ROW_NUMBER() OVER() * 19) % 40)) * 3400 as electricity_amount,
    40 + (ROW_NUMBER() OVER() * 13) % 15 as water_previous_reading,
    45 + (ROW_NUMBER() OVER() * 17) % 20 as water_current_reading,
    24000 as water_unit_price,
    ((45 + (ROW_NUMBER() OVER() * 17) % 20) - (40 + (ROW_NUMBER() OVER() * 13) % 15)) * 24000 as water_amount,
    50000 as internet_amount,
    20000 as trash_amount,
    rc.monthly_rent + 
    ((150 + (ROW_NUMBER() OVER() * 23) % 50) - (120 + (ROW_NUMBER() OVER() * 19) % 40)) * 3400 +
    ((45 + (ROW_NUMBER() OVER() * 17) % 20) - (40 + (ROW_NUMBER() OVER() * 13) % 15)) * 24000 +
    50000 + 20000 as total_amount,
    'Hóa đơn thuê phòng tháng ' || TO_CHAR(CURRENT_DATE - INTERVAL '1 month', 'MM/YYYY') as notes
FROM rental_contracts rc
WHERE rc.status = 'active'
LIMIT 5; -- Create 5 historical invoices

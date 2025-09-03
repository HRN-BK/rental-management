-- Insert sample rental invoices
-- Note: Replace the UUIDs below with actual UUIDs from your rooms and tenants tables

-- First, let's create some sample invoices with hardcoded data
-- You'll need to replace these UUIDs with actual ones from your database

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
) VALUES 
-- Sample Invoice 1
(
    (SELECT id FROM public.rooms WHERE room_number = '01' LIMIT 1),
    (SELECT tenant_id FROM public.rental_contracts rc 
     INNER JOIN public.rooms r ON rc.room_id = r.id 
     WHERE r.room_number = '01' AND rc.status = 'active' LIMIT 1),
    (SELECT id FROM public.rental_contracts rc 
     INNER JOIN public.rooms r ON rc.room_id = r.id 
     WHERE r.room_number = '01' AND rc.status = 'active' LIMIT 1),
    'INV-202508-001',
    '2025-08-01',
    '2025-08-31',
    '2025-08-28',
    '2025-09-05',
    'professional',
    'draft',
    2500000,
    120,
    135,
    4000,
    60000,
    'Tiền điện tháng 8/2025',
    25,
    30,
    11000,
    55000,
    'Tiền nước tháng 8/2025',
    50000,
    'Internet FPT',
    20000,
    'Phí vệ sinh',
    '[{"name": "Phí gửi xe", "amount": 100000, "note": "Xe máy tháng 8"}]'::jsonb,
    2785000,
    'Hóa đơn thu tiền phòng tháng 8/2025'
),
-- Sample Invoice 2
(
    (SELECT id FROM public.rooms WHERE room_number = '02' LIMIT 1),
    (SELECT tenant_id FROM public.rental_contracts rc 
     INNER JOIN public.rooms r ON rc.room_id = r.id 
     WHERE r.room_number = '02' AND rc.status = 'active' LIMIT 1),
    (SELECT id FROM public.rental_contracts rc 
     INNER JOIN public.rooms r ON rc.room_id = r.id 
     WHERE r.room_number = '02' AND rc.status = 'active' LIMIT 1),
    'INV-202508-002',
    '2025-08-01',
    '2025-08-31',
    '2025-08-28',
    '2025-09-05',
    'professional',
    'draft',
    2200000,
    85,
    95,
    4000,
    40000,
    'Tiền điện tháng 8/2025',
    15,
    18,
    11000,
    33000,
    'Tiền nước tháng 8/2025',
    50000,
    'Internet Viettel',
    20000,
    'Phí vệ sinh',
    '[]'::jsonb,
    2343000,
    'Hóa đơn thu tiền phòng tháng 8/2025'
),
-- Sample Invoice 3
(
    (SELECT id FROM public.rooms WHERE room_number = '03' LIMIT 1),
    (SELECT tenant_id FROM public.rental_contracts rc 
     INNER JOIN public.rooms r ON rc.room_id = r.id 
     WHERE r.room_number = '03' AND rc.status = 'active' LIMIT 1),
    (SELECT id FROM public.rental_contracts rc 
     INNER JOIN public.rooms r ON rc.room_id = r.id 
     WHERE r.room_number = '03' AND rc.status = 'active' LIMIT 1),
    'INV-202508-003',
    '2025-08-01',
    '2025-08-31',
    '2025-08-28',
    '2025-09-05',
    'professional',
    'paid',
    2800000,
    200,
    220,
    4000,
    80000,
    'Tiền điện tháng 8/2025',
    40,
    45,
    11000,
    55000,
    'Tiền nước tháng 8/2025',
    50000,
    'Internet VNPT',
    20000,
    'Phí vệ sinh',
    '[{"name": "Phí điều hòa", "amount": 150000, "note": "Bảo dưỡng điều hòa"}]'::jsonb,
    3155000,
    'Hóa đơn thu tiền phòng tháng 8/2025 - ĐÃ THANH TOÁN'
);

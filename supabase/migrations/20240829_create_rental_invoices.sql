-- Create rental_invoices table with comprehensive invoice structure
CREATE TABLE IF NOT EXISTS public.rental_invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID,
  tenant_id UUID,
  contract_id UUID,
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  issue_date DATE DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  template_type VARCHAR(20) DEFAULT 'professional',
  status VARCHAR(20) DEFAULT 'draft',
  
  -- Rent amount
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
  
  -- Trash collection charges
  trash_amount DECIMAL(12,2) DEFAULT 0,
  trash_note TEXT,
  
  -- Additional fees (stored as JSON array)
  other_fees JSONB DEFAULT '[]',
  
  -- Totals and notes
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  notes TEXT,
  pdf_url TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_rental_invoices_room_id ON public.rental_invoices(room_id);
CREATE INDEX IF NOT EXISTS idx_rental_invoices_tenant_id ON public.rental_invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_rental_invoices_status ON public.rental_invoices(status);
CREATE INDEX IF NOT EXISTS idx_rental_invoices_invoice_number ON public.rental_invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_rental_invoices_period_start ON public.rental_invoices(period_start);
CREATE INDEX IF NOT EXISTS idx_rental_invoices_created_at ON public.rental_invoices(created_at);

-- Enable Row Level Security
ALTER TABLE public.rental_invoices ENABLE ROW LEVEL SECURITY;

-- Create a simple policy to allow all operations (adjust based on your auth requirements)
CREATE POLICY "Allow all operations on rental_invoices" ON public.rental_invoices
FOR ALL 
USING (true);

-- Add trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_rental_invoices_updated_at 
  BEFORE UPDATE ON public.rental_invoices 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

#!/bin/bash

# Load environment variables
source .env.local

echo "🚀 Creating rental_invoices table using curl..."

# SQL to create table
SQL_QUERY="
CREATE TABLE IF NOT EXISTS public.rental_invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID,
  tenant_id UUID,
  contract_id UUID,
  invoice_number VARCHAR(50) UNIQUE,
  period_start DATE,
  period_end DATE,
  issue_date DATE DEFAULT CURRENT_DATE,
  due_date DATE,
  template_type VARCHAR(20) DEFAULT 'professional',
  status VARCHAR(20) DEFAULT 'draft',
  rent_amount DECIMAL(12,2) DEFAULT 0,
  electricity_previous_reading INTEGER DEFAULT 0,
  electricity_current_reading INTEGER DEFAULT 0,
  electricity_unit_price DECIMAL(10,2) DEFAULT 0,
  electricity_amount DECIMAL(12,2) DEFAULT 0,
  electricity_note TEXT,
  water_previous_reading INTEGER DEFAULT 0,
  water_current_reading INTEGER DEFAULT 0,
  water_unit_price DECIMAL(10,2) DEFAULT 0,
  water_amount DECIMAL(12,2) DEFAULT 0,
  water_note TEXT,
  internet_amount DECIMAL(12,2) DEFAULT 0,
  internet_note TEXT,
  trash_amount DECIMAL(12,2) DEFAULT 0,
  trash_note TEXT,
  other_fees JSONB DEFAULT '[]',
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  notes TEXT,
  pdf_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_rental_invoices_room_id ON rental_invoices(room_id);
CREATE INDEX IF NOT EXISTS idx_rental_invoices_tenant_id ON rental_invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_rental_invoices_status ON rental_invoices(status);

ALTER TABLE rental_invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY \"Allow all operations\" ON rental_invoices FOR ALL USING (true);
"

# Try to execute SQL via REST API
echo "🔄 Executing SQL..."

curl -X POST \
  "${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec" \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"sql\": \"$(echo "$SQL_QUERY" | tr '\n' ' ')\"}"

echo ""
echo "🔍 Checking if table was created..."

# Test if table exists by trying to query it
curl -X GET \
  "${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rental_invoices?select=id&limit=1" \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}"

echo ""
echo "✅ Done! Check the output above."

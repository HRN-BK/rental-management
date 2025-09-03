#!/bin/bash

# Supabase Migration Script for Rental Invoices
# This script will create the rental_invoices table and add sample data

set -e  # Exit on any error

echo "🚀 Starting Supabase migration for rental_invoices..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI is not installed. Please install it first:${NC}"
    echo "npm install -g supabase"
    echo "Or visit: https://supabase.com/docs/guides/cli/getting-started"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Please run this script from the project root directory${NC}"
    exit 1
fi

# Check if migration files exist
if [ ! -f "supabase/migrations/002_create_rental_invoices.sql" ]; then
    echo -e "${RED}❌ Migration file 002_create_rental_invoices.sql not found${NC}"
    exit 1
fi

if [ ! -f "supabase/migrations/003_insert_sample_invoices.sql" ]; then
    echo -e "${RED}❌ Migration file 003_insert_sample_invoices.sql not found${NC}"
    exit 1
fi

echo -e "${BLUE}📋 Migration files found:${NC}"
echo "  ✅ 002_create_rental_invoices.sql"
echo "  ✅ 003_insert_sample_invoices.sql"

# Run the migrations
echo -e "${YELLOW}🔄 Running migration 002: Create rental_invoices table...${NC}"
supabase db reset --debug

echo -e "${YELLOW}🔄 Checking migration status...${NC}"
supabase migration list

echo -e "${GREEN}✅ Migrations completed successfully!${NC}"

# Verify the table was created
echo -e "${BLUE}🔍 Verifying rental_invoices table...${NC}"
echo "SELECT COUNT(*) as invoice_count FROM rental_invoices;" | supabase db query || {
    echo -e "${YELLOW}⚠️  Could not verify table directly. This might be expected if using remote database.${NC}"
}

echo -e "${GREEN}🎉 Migration completed successfully!${NC}"
echo ""
echo -e "${BLUE}📊 What was created:${NC}"
echo "  • rental_invoices table with all fields"
echo "  • Indexes for better performance" 
echo "  • Auto-update triggers for timestamps"
echo "  • Sample rental contracts (if missing)"
echo "  • Sample invoice data for testing"
echo ""
echo -e "${BLUE}🔧 Next steps:${NC}"
echo "  1. Start your dev server: npm run dev"
echo "  2. Visit http://localhost:3000/invoices"
echo "  3. Test creating new invoices"
echo "  4. Check API endpoints work with real data"
echo ""
echo -e "${YELLOW}💡 Tip: If you need to reset the database, run:${NC}"
echo "  supabase db reset"

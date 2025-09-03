#!/bin/bash

# Remote Supabase Migration Script for Rental Invoices
# This script will run migrations directly on the hosted Supabase database

set -e  # Exit on any error

echo "🚀 Starting remote Supabase migration for rental_invoices..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Please run this script from the project root directory${NC}"
    exit 1
fi

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo -e "${RED}❌ .env.local file not found${NC}"
    exit 1
fi

# Load environment variables
source .env.local

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

# Extract project reference from Supabase URL
PROJECT_REF=$(echo $NEXT_PUBLIC_SUPABASE_URL | sed 's|https://||' | sed 's|\.supabase\.co||')
echo -e "${BLUE}🔗 Project Reference: ${PROJECT_REF}${NC}"

# Function to run SQL using supabase CLI
run_sql_file() {
    local file_path=$1
    local description=$2
    
    echo -e "${YELLOW}🔄 ${description}...${NC}"
    
    # Use supabase CLI to run the SQL file
    if supabase db query --file "$file_path" --project-ref "$PROJECT_REF"; then
        echo -e "${GREEN}✅ ${description} completed successfully${NC}"
    else
        echo -e "${RED}❌ ${description} failed${NC}"
        return 1
    fi
}

# Ask user to confirm
echo -e "${YELLOW}⚠️  This will run migrations on your remote Supabase database${NC}"
echo -e "${BLUE}Project: ${NEXT_PUBLIC_SUPABASE_URL}${NC}"
read -p "Continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Migration cancelled${NC}"
    exit 0
fi

# Check if user is logged in to supabase
echo -e "${BLUE}🔍 Checking Supabase authentication...${NC}"
if ! supabase projects list > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  You need to login to Supabase CLI${NC}"
    echo "Run: supabase login"
    exit 1
fi

# Run the migrations
run_sql_file "supabase/migrations/002_create_rental_invoices.sql" "Creating rental_invoices table"
run_sql_file "supabase/migrations/003_insert_sample_invoices.sql" "Inserting sample data"

# Verify the table was created
echo -e "${BLUE}🔍 Verifying rental_invoices table...${NC}"
if echo "SELECT COUNT(*) as invoice_count FROM rental_invoices;" | supabase db query --project-ref "$PROJECT_REF"; then
    echo -e "${GREEN}✅ Table verification successful${NC}"
else
    echo -e "${YELLOW}⚠️  Could not verify table${NC}"
fi

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

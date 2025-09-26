# Populate Outlines Table

This script scans your Supabase storage bucket and populates the outlines table with all the files found.

## Setup

1. **Install dependencies:**
   ```bash
   npm install @supabase/supabase-js
   ```

2. **Create config file:**
   ```bash
   cp config.example.js config.js
   ```

3. **Fill in your Supabase credentials in `config.js`:**
   ```javascript
   export const config = {
     supabaseUrl: 'https://your-project.supabase.co',
     supabaseKey: 'your-anon-key-here',
     bucketName: 'Outlines',
     bucketFolder: 'out'
   }
   ```

4. **Make sure your outlines table exists:**
   - Run the `create_outlines_table.sql` in your Supabase SQL editor first

## Usage

Run the population script:
```bash
node populate_outlines.js
```

## What it does

1. **Scans your bucket structure:**
   ```
   Outlines/out/
   ├── Class1/
   │   ├── Instructor1/
   │   │   ├── 2024/
   │   │   │   ├── GradeA/
   │   │   │   │   ├── outline1.pdf
   │   │   │   │   └── outline2.docx
   ```

2. **Extracts metadata:**
   - File name, path, type, size
   - Course, instructor, year, grade from folder structure
   - Sets default values for pages, rating, etc.

3. **Inserts into database:**
   - Batches inserts for better performance
   - Handles errors gracefully
   - Shows progress as it processes

## Notes

- **Pages field:** Currently set to 0 - you'll need to update this manually or extract from PDFs
- **File size:** Automatically retrieved from Supabase storage
- **File types:** Only processes .pdf and .docx files
- **Batch processing:** Inserts 100 records at a time for better performance

## Troubleshooting

- Make sure your Supabase credentials are correct
- Ensure the bucket name and folder structure match your setup
- Check that the outlines table exists and has the correct schema
- Verify your Supabase key has storage read permissions

#!/usr/bin/env python3
"""
One-time script to update page counts for all outlines in the database.
Extracts page counts from .docx and .pdf files stored in Supabase storage.
"""

import os
import sys
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Optional, Tuple
import tempfile
from concurrent.futures import ThreadPoolExecutor, as_completed
from supabase import create_client, Client
from PyPDF2 import PdfReader
from dotenv import load_dotenv
import threading
import subprocess

# Optional imports for Tier 2 (DOCX→PDF conversion)
try:
    import fitz  # PyMuPDF
    PYMUPDF_AVAILABLE = True
except ImportError:
    PYMUPDF_AVAILABLE = False
    fitz = None

# Load environment variables from .env.local
load_dotenv('.env.local')

# Supabase configuration
SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")  # Use service role key for full access
STORAGE_BUCKET = "Outlines"

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    print("Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local file")
    sys.exit(1)

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# Thread lock for print statements to avoid garbled output
print_lock = threading.Lock()


def get_docx_page_count(file_path: Path) -> Optional[int]:
    """
    Returns the page count from a .docx file by reading the internal
    docProps/app.xml metadata where the document stores the <Pages> value.
    """
    try:
        with zipfile.ZipFile(file_path, 'r') as docx:
            with docx.open('docProps/app.xml') as app_xml:
                tree = ET.parse(app_xml)
                root = tree.getroot()
                # Namespace handling for XML
                namespaces = {
                    'app': 'http://schemas.openxmlformats.org/officeDocument/2006/extended-properties'
                }
                # Try to find Pages element
                pages_elem = root.find('.//app:Pages', namespaces)
                if pages_elem is not None and pages_elem.text:
                    return int(pages_elem.text)
                
                # Fallback: search without namespace
                for elem in root.iter():
                    if elem.tag.endswith('Pages') and elem.text:
                        return int(elem.text)
        
        return None
    except Exception as e:
        print(f"Error reading DOCX: {e}")
        return None


def get_pdf_page_count(file_path: Path) -> Optional[int]:
    """
    Returns the page count from a PDF file.
    Tries PyMuPDF first (faster), falls back to PyPDF2.
    """
    # Try PyMuPDF first (faster)
    if PYMUPDF_AVAILABLE:
        try:
            doc = fitz.open(str(file_path))
            page_count = len(doc)
            doc.close()
            return page_count
        except Exception:
            pass
    
    # Fallback to PyPDF2
    try:
        reader = PdfReader(str(file_path))
        return len(reader.pages)
    except Exception as e:
        print(f"Error reading PDF: {e}")
        return None


def convert_docx_to_pdf(docx_path: Path) -> Optional[Path]:
    """
    Tier 2: Convert DOCX to PDF and return the PDF path.
    Uses LibreOffice (soffice) for conversion.
    Returns None if conversion fails.
    """
    pdf_path = docx_path.with_suffix('.pdf')
    
    # If PDF already exists from previous conversion, use it
    if pdf_path.exists():
        return pdf_path
    
    # Use LibreOffice for DOCX→PDF conversion (completely headless, no GUI)
    try:
        cmd = [
            "soffice", "--headless", "--norestore", "--nolockcheck", "--nodefault", "--invisible",
            "--convert-to", "pdf", "--outdir", str(pdf_path.parent),
            str(docx_path)
        ]
        # Run with no window and minimal system impact
        result = subprocess.run(
            cmd, 
            check=True, 
            stdout=subprocess.PIPE, 
            stderr=subprocess.PIPE, 
            timeout=60,
            creationflags=0  # No special flags needed, headless should prevent dock appearance
        )
        if pdf_path.exists():
            return pdf_path
    except (subprocess.CalledProcessError, FileNotFoundError, subprocess.TimeoutExpired) as e:
        with print_lock:
            print(f"  LibreOffice conversion failed: {str(e)[:80]}")
        return None
    
    return None




def get_page_count_for_outline(outline: dict, supabase_client: Client, bucket: str) -> Optional[int]:
    """
    Downloads the outline file and extracts page count based on file type.
    Thread-safe version that takes its own supabase client.
    """
    file_path = outline.get('file_path') or outline.get('file_name')
    file_type = outline.get('file_type', '').lower()
    
    if not file_path:
        with print_lock:
            print(f"  No file path found for outline {outline.get('id')}")
        return None
    
    # Download file (using the client passed in)
    possible_paths = [
        file_path,
        f"out/{file_path}",
        f"outlines/{file_path}",
        file_path.replace('out/', '') if 'out/' in file_path else file_path,
        file_path.replace('outlines/', '') if 'outlines/' in file_path else file_path,
    ]
    
    temp_file = None
    for path in possible_paths:
        try:
            storage_client = supabase_client.storage.from_(bucket)
            file_bytes = storage_client.download(path)
            
            if file_bytes:
                file_ext = Path(path).suffix
                if not file_ext:
                    file_ext = '.pdf'
                
                temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=file_ext)
                temp_file.write(file_bytes)
                temp_file.close()
                temp_file = Path(temp_file.name)
                break
        except Exception:
            continue
    
    if not temp_file:
        return None
    
    try:
        # Tier 1: Get page count based on file type
        page_count = None
        
        if file_type == 'docx':
            # For pages = 1 outlines, skip app.xml and go straight to Tier 2 (more accurate)
            # Tier 2: Convert to PDF and count for accurate verification
            with print_lock:
                print(f"  Verifying with DOCX→PDF conversion...")
            pdf_file = convert_docx_to_pdf(temp_file)
            if pdf_file and pdf_file.exists():
                page_count = get_pdf_page_count(pdf_file)
                # Clean up temporary PDF
                try:
                    pdf_file.unlink()
                except:
                    pass
            else:
                # Fallback to app.xml if conversion fails
                page_count = get_docx_page_count(temp_file)
                if page_count is None:
                    with print_lock:
                        print(f"  Conversion failed, trying app.xml...")
                    page_count = get_docx_page_count(temp_file)
        elif file_type == 'pdf':
            page_count = get_pdf_page_count(temp_file)
        else:
            return None
        
        return page_count
    finally:
        # Clean up temporary file
        if temp_file.exists():
            temp_file.unlink()


def process_outline(outline: dict, index: int, total: int, supabase_url: str, supabase_key: str) -> Tuple[str, Optional[int], bool]:
    """
    Process a single outline: get page count and return result.
    Returns (outline_id, page_count, success).
    If page count cannot be determined, sets it to NULL (None).
    """
    outline_id = outline.get('id')
    title = outline.get('title', 'Unknown')
    file_type = outline.get('file_type', '').lower()
    
    # Create a new supabase client for this thread
    client = create_client(supabase_url, supabase_key)
    
    try:
        page_count = get_page_count_for_outline(outline, client, STORAGE_BUCKET)
        
        if page_count is None:
            # Set to NULL if we can't determine page count
            client.table('outlines').update({'pages': None}).eq('id', outline_id).execute()
            with print_lock:
                print(f"[{index}/{total}] ⚠️  {outline_id[:8]}... - Could not determine, set to NULL")
            return (outline_id, None, True)
        
        # Update database with actual page count
        client.table('outlines').update({'pages': page_count}).eq('id', outline_id).execute()
        
        with print_lock:
            print(f"[{index}/{total}] ✅ {outline_id[:8]}... - Updated to {page_count} pages ({title[:30]}...)")
        
        return (outline_id, page_count, True)
    except Exception as e:
        # Set to NULL on error as well
        try:
            client.table('outlines').update({'pages': None}).eq('id', outline_id).execute()
            with print_lock:
                print(f"[{index}/{total}] ⚠️  {outline_id[:8]}... - Error, set to NULL: {str(e)[:50]}")
        except:
            pass
        return (outline_id, None, True)


def main():
    """
    Main function to update all outline page counts.
    """
    print("Starting outline page count update...")
    print(f"Supabase URL: {SUPABASE_URL}")
    print(f"Storage Bucket: {STORAGE_BUCKET}\n")
    
    # ============================================================================
    # ⚠️  CRITICAL WARNING ⚠️
    # ============================================================================
    # This script is configured to ONLY process outlines with pages = 1
    # DO NOT modify the filter below without explicit approval
    # Modifying '.eq('pages', 1)' to '.neq('pages', 1)' or removing the filter
    # could accidentally modify ALL outlines, potentially overwriting accurate
    # page counts that were already calculated.
    # ============================================================================
    # Fetch outlines with pages = 1 (to verify with Tier 2 conversion)
    print("Fetching outlines with pages = 1 (to verify with Tier 2 DOCX→PDF conversion)...")
    try:
        all_outlines = []
        batch_size = 1000
        offset = 0
        
        while True:
            response = supabase.table('outlines').select('id, title, file_path, file_name, file_type, pages').eq('pages', 1).range(offset, offset + batch_size - 1).execute()
            batch = response.data if hasattr(response, 'data') else []
            
            if not batch:
                break
                
            all_outlines.extend(batch)
            print(f"Fetched {len(all_outlines)} outlines so far...")
            
            if len(batch) < batch_size:
                break
                
            offset += batch_size
        
        outlines = all_outlines
        print(f"Found {len(outlines)} outlines with pages = 1 to verify with Tier 2 (DOCX→PDF conversion)\n")
        
        if not outlines:
            print("No outlines with pages = 1 found. Exiting.")
            return
        
        # Check for LibreOffice availability
        libreoffice_installed = subprocess.run(
            ["which", "soffice"], 
            capture_output=True
        ).returncode == 0
        
        if libreoffice_installed:
            print("✅ LibreOffice detected - Tier 2 conversion ready")
        else:
            print("⚠️  WARNING: LibreOffice not found.")
            print("   Install LibreOffice: brew install --cask libreoffice")
            print("   Without LibreOffice, Tier 2 conversions will fail.\n")
            
        if not libreoffice_installed:
            print("⚠️  NOTE: Without LibreOffice, conversions will fail.")
            print("   Files that can't be processed will remain with pages = NULL.\n")
        else:
            print()
    except Exception as e:
        print(f"Error fetching outlines: {e}")
        sys.exit(1)
    
    updated_count = 0
    error_count = 0
    skipped_count = 0
    
    # Process outlines with Tier 2
    # Note: LibreOffice runs in headless mode (no GUI, minimal system impact)
    # Reduced workers to avoid overwhelming system resources
    max_workers = 3  # Conservative to prevent system slowdown
    print(f"Processing {len(outlines)} outlines with Tier 2 conversion...")
    print(f"Using {max_workers} workers (LibreOffice runs headless, should not appear in dock)...\n")
    
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        # Submit all tasks
        future_to_outline = {
            executor.submit(process_outline, outline, i+1, len(outlines), SUPABASE_URL, SUPABASE_SERVICE_KEY): outline
            for i, outline in enumerate(outlines)
        }
        
        # Process results as they complete
        for future in as_completed(future_to_outline):
            outline_id, page_count, success = future.result()
            if success:
                updated_count += 1
                if page_count is None:
                    error_count += 1  # Count ones set to NULL as "errors" for reporting
    
    # Summary
    print("\n" + "="*50)
    print("SUMMARY")
    print("="*50)
    print(f"Total outlines: {len(outlines)}")
    print(f"Updated: {updated_count}")
    print(f"Errors: {error_count}")
    print(f"Skipped: {skipped_count}")
    print("="*50)


if __name__ == "__main__":
    main()


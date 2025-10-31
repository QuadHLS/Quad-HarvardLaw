# Page Count Extraction Methods - Tier 1 & Tier 2

This document explains the two-tier approach used to extract accurate page counts from outline files.

## Overview

The page count extraction system uses a two-tier approach:
- **Tier 1**: Fast metadata extraction (DOCX: app.xml, PDF: direct count)
- **Tier 2**: DOCX→PDF conversion fallback for files missing metadata

## Tier 1: Metadata Extraction

### For DOCX Files

**Method**: Read `docProps/app.xml` from the DOCX ZIP archive

**Location**: `update_outline_page_counts.py` - `get_docx_page_count()` function (lines 54-81)

**Code**:
```python
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
```

**How it works**:
1. DOCX files are ZIP archives containing XML files
2. Open the DOCX as a ZIP file
3. Read `docProps/app.xml` which contains document metadata
4. Parse XML and extract the `<Pages>` element value
5. Return the page count as an integer

**Advantages**:
- Very fast (no file conversion needed)
- Works for most DOCX files
- No external dependencies required

**Limitations**:
- Some DOCX files may not have `app.xml` or the `<Pages>` tag
- Older or non-Word generated DOCX files may be missing metadata

### For PDF Files

**Method**: Direct page count using PDF libraries

**Location**: `update_outline_page_counts.py` - `get_pdf_page_count()` function (lines 84-105)

**Code**:
```python
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
```

**How it works**:
1. First attempts to use PyMuPDF (fitz) - faster library
2. Opens the PDF and counts pages directly
3. Falls back to PyPDF2 if PyMuPDF fails
4. Returns the total page count

**Advantages**:
- Fast and reliable for PDFs
- Works with all standard PDF files
- Two library fallbacks ensure compatibility

**Limitations**:
- Corrupted PDF files may fail
- Very large PDFs may be slow to process

---

## Tier 2: DOCX→PDF Conversion Fallback

**Purpose**: Extract page count for DOCX files that don't have `app.xml` metadata

**Location**: `update_outline_page_counts.py` - `convert_docx_to_pdf()` function (lines 102-129)

**Code**:
```python
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
    
    # Use LibreOffice for DOCX→PDF conversion
    try:
        cmd = [
            "soffice", "--headless", "--norestore",
            "--convert-to", "pdf", "--outdir", str(pdf_path.parent),
            str(docx_path)
        ]
        result = subprocess.run(cmd, check=True, stdout=subprocess.PIPE, 
                              stderr=subprocess.PIPE, timeout=60)
        if pdf_path.exists():
            return pdf_path
    except (subprocess.CalledProcessError, FileNotFoundError, 
            subprocess.TimeoutExpired) as e:
        print(f"  LibreOffice conversion failed: {str(e)[:80]}")
        return None
    
    return None
```

**How it works**:
1. **LibreOffice** (`soffice` command)
   - Free, open-source office suite
   - Runs headless with flags: `--headless --norestore --nolockcheck --nodefault --invisible`
   - Converts DOCX to PDF via command line (no GUI window)
   - Should not appear in macOS dock/menu bar (completely background)
   - Timeout: 60 seconds per file
   - **Only conversion method** (no fallback)

2. After conversion:
   - Count pages in the generated PDF using `get_pdf_page_count()`
   - Delete the temporary PDF file
   - Return the page count

**Advantages**:
- Works even when DOCX metadata is missing
- More accurate than metadata (actual rendered page count)
- LibreOffice is free and reliable

**Limitations**:
- Requires LibreOffice to be installed
- Slower than Tier 1 (conversion takes time)
- May fail for corrupted or unsupported DOCX files

---

## Implementation Flow

The script implements Tier 1 and Tier 2 in `get_page_count_for_outline()` (lines 134-209):

```python
# For DOCX files:
if file_type == 'docx':
    # For pages = 1 outlines, skip app.xml and go straight to Tier 2 (more accurate)
    # Tier 2: Convert to PDF and count for accurate verification
    pdf_file = convert_docx_to_pdf(temp_file)
    if pdf_file and pdf_file.exists():
        page_count = get_pdf_page_count(pdf_file)
        # Clean up temporary PDF
        pdf_file.unlink()
    else:
        # Fallback to app.xml if conversion fails
        page_count = get_docx_page_count(temp_file)

# For PDF files:
elif file_type == 'pdf':
    page_count = get_pdf_page_count(temp_file)
```

**Note**: Currently, for DOCX files with `pages = 1`, the script skips Tier 1 (app.xml) and goes directly to Tier 2 (DOCX→PDF conversion) for more accurate verification, as some files may have incorrect metadata.

---

## Setup Requirements

### Python Dependencies

Required packages (in `requirements.txt`):
```
python-dotenv
supabase-py
PyPDF2
PyMuPDF
```

### System Requirements

**For Tier 2 DOCX→PDF conversion:**

**LibreOffice (Required)**
```bash
brew install --cask libreoffice
```
- Free and open-source
- No license required
- Works reliably for batch conversions
- **Required for Tier 2 conversion**

---

## Usage Statistics

From the latest run:
- **Total outlines**: 5,053
- **Tier 1 successful**: ~4,900+ (metadata extraction)
- **Tier 2 used**: ~116 outlines (DOCX→PDF conversion)
- **Final verified 1-page**: 53 outlines
- **Success rate**: 99.8%

---

## Troubleshooting

### Tier 1 Issues

**Problem**: DOCX returns `None` for page count
- **Cause**: Missing or corrupted `app.xml` metadata
- **Solution**: Script automatically falls back to Tier 2

**Problem**: PDF page count fails
- **Cause**: Corrupted PDF file
- **Solution**: File may need manual review

### Tier 2 Issues

**Problem**: LibreOffice conversion fails
- **Cause**: DOCX file is corrupted or unsupported format, or LibreOffice not installed
- **Solution**: Ensure LibreOffice is installed (`brew install --cask libreoffice`), or mark as NULL if file is corrupted

**Problem**: Conversion timeout
- **Cause**: Very large or complex DOCX file
- **Solution**: Timeout is 60 seconds - may need manual processing

---

## Related Files

- `update_outline_page_counts.py` - Main script with all extraction methods
- `PAGE_COUNT_PROTECTION.md` - Protection measures for page count values

## Quick Start

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Set environment variables in `.env.local`:**
   ```
   VITE_SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

3. **Install LibreOffice (for Tier 2):**
   ```bash
   brew install --cask libreoffice
   ```

4. **Run the script:**
   ```bash
   python3 update_outline_page_counts.py
   ```

**Note**: The script currently only processes outlines with `pages = 1` for verification. See `PAGE_COUNT_PROTECTION.md` for details on the safety filter.


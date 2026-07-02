import re

def validate_pesel(pesel: str) -> bool:
    if not re.match(r'^\d{11}$', pesel):
        return False
    weights = [1, 3, 7, 9, 1, 3, 7, 9, 1, 3]
    checksum = sum(int(pesel[i]) * weights[i] for i in range(10))
    return (10 - (checksum % 10)) % 10 == int(pesel[10])

def validate_luhn(card_number: str) -> bool:
    card_number = re.sub(r'\D', '', card_number)
    if not (13 <= len(card_number) <= 19):
        return False
    total = 0
    reverse_digits = card_number[::-1]
    for i, char in enumerate(reverse_digits):
        n = int(char)
        if i % 2 == 1:
            n *= 2
            if n > 9:
                n -= 9
        total += n
    return total % 10 == 0

def scan_text_for_sensitive_data(text: str):
    found_types = set()
    
    # 1. Scan for PESEL (11 digits)
    pesel_candidates = re.findall(r'\b\d{11}\b', text)
    for p in pesel_candidates:
        if validate_pesel(p):
            found_types.add("PESEL")
            break
            
    # 2. Scan for Credit Cards
    cc_candidates = re.findall(r'\b(?:\d[ -]*?){13,19}\b', text)
    for c in cc_candidates:
        clean_c = re.sub(r'\D', '', c)
        if 13 <= len(clean_c) <= 19 and validate_luhn(clean_c):
            found_types.add("CREDIT_CARD")
            break
            
    # 3. Scan for sensitive keywords
    keywords = ["TAJNE", "POUFNE", "TOP SECRET", "CONFIDENTIAL", "DO NIEJAWNYCH", "WRAŻLIWE"]
    upper_text = text.upper()
    for kw in keywords:
        if kw in upper_text:
            found_types.add(f"KEYWORD:{kw}")
            
    return {
        "has_sensitive_data": len(found_types) > 0,
        "types": list(found_types)
    }

def scan_document(document_instance, file_bytes=None) -> dict:
    """
    Scans a document's title, description and file contents.
    Returns {"has_sensitive_data": bool, "types": list[str]}
    """
    text_to_scan = f"{document_instance.title} {document_instance.description or ''}"
    
    if file_bytes and document_instance.file:
        ext = document_instance.file.name.split('.')[-1].lower()
        if ext in ['txt', 'csv', 'md']:
            try:
                text_to_scan += " " + file_bytes.decode('utf-8')
            except Exception:
                pass
        elif ext == 'docx':
            # Import here to avoid circular dependencies
            from .views import _get_docx_text_from_bytes 
            try:
                text_to_scan += " " + _get_docx_text_from_bytes(file_bytes)
            except Exception:
                pass
                
    return scan_text_for_sensitive_data(text_to_scan)

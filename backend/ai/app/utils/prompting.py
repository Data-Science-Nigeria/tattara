from typing import Any, Dict, List


def build_extraction_header(schema: Dict[str, Any]) -> str:
    """
    Builds a compact instruction header that guides any LLM to extract values for the given schema.
    """
    lines: List[str] = []
    lines.append("You are an information extraction engine.")
    lines.append(
        "Task: Read the source text carefully and output a single JSON object with keys:"
    )
    lines.append('- "extracted": object mapping field id -> value (null if missing)')
    lines.append(
        '- "missing_required": array of required field ids with missing or invalid values'
    )
    lines.append(
        '- "spans": object mapping field id -> string snippet from the source text (optional)'
    )
    lines.append("")
    lines.append("CRITICAL RULES:")
    lines.append(
        "- Extract ANY relevant information from the text, even if field names don't match exactly"
    )
    lines.append(
        "- Look for similar concepts (e.g., 'Patient ID' could match 'patientId', 'Patient Name' could match 'fullName')"
    )
    lines.append("- Use semantic understanding, not just keyword matching")
    lines.append("- For dates, accept any format and convert to YYYY-MM-DD")
    lines.append(
        "- For select fields with options, match closest option or leave null if no match"
    )
    lines.append("- For multiselect, return array of matched values")
    lines.append(
        "- If information exists but doesn't perfectly match schema, still extract it to the closest field"
    )
    lines.append(
        "- Only set required fields to missing if absolutely no relevant information exists"
    )
    lines.append("")
    lines.append("Schema Fields to Extract:")

    for f in schema.get("fields", []):
        fid = f["id"]
        ftype = f["type"]
        req = "REQUIRED" if f.get("required") else "optional"
        opts = f.get("options")
        desc = f.get("description", "")

        line = f"- {fid} ({ftype}, {req})"
        if opts:
            line += f" - Valid options: {opts}"
        if desc:
            line += f" - Description: {desc}"
        lines.append(line)

    lines.append("")
    lines.append("EXAMPLES of field matching:")
    lines.append("- 'Patient Name' or 'Full Name' or 'Name' → patientName or fullName")
    lines.append("- 'DOB' or 'Birth Date' or 'Date of Birth' → dateOfBirth")
    lines.append("- 'ID' or 'Patient ID' or 'Reference' → patientId")
    lines.append("- 'Vaccine' or 'Vaccination' → vaccineName")
    lines.append("- 'Brand' or 'Manufacturer' → vaccineBrand")
    lines.append("")
    lines.append("Return exactly this JSON format:")
    lines.append(
        '{"extracted": {"<fieldId>": <value>, ...}, "missing_required": ["<fieldId>", ...], "spans": {}}'
    )
    lines.append("")
    lines.append(
        "Be generous with extraction - it's better to extract something than nothing!"
    )

    return "\n".join(lines)


def build_multi_row_extraction_header(schema: Dict[str, Any]) -> str:
    """
    Builds an instruction header that guides the LLM to extract MULTIPLE rows/entries
    from a document image (e.g., tables, logs, registers with multiple records).
    """
    lines: List[str] = []
    lines.append("You are an information extraction engine for MULTI-ROW documents.")
    lines.append(
        "Task: The source text contains MULTIPLE entries/rows/records (like a table, log, or register)."
    )
    lines.append(
        "Extract ALL rows/entries, returning each as a separate object in an array."
    )
    lines.append("")
    lines.append("Output format - return a JSON object with:")
    lines.append(
        '- "rows": array of objects, each containing extracted fields for one row/entry'
    )
    lines.append('- "total_rows": number of rows extracted')
    lines.append("")
    lines.append("CRITICAL RULES:")
    lines.append("- Look for tabular data, repeated patterns, or multiple entries")
    lines.append(
        "- Each row in a table or each entry should become a separate object in the 'rows' array"
    )
    lines.append(
        "- If there's only ONE entry, still return it as a single-element array"
    )
    lines.append(
        "- Extract ANY relevant information, even if field names don't match exactly"
    )
    lines.append("- Use semantic understanding to map columns/labels to schema fields")
    lines.append("- For dates, accept any format and convert to YYYY-MM-DD")
    lines.append(
        "- For select fields with options, match closest option or leave null if no match"
    )
    lines.append("- For multiselect, return array of matched values")
    lines.append("- If a row has missing data for a field, set it to null")
    lines.append("")
    lines.append("Schema Fields to Extract for EACH row:")

    for f in schema.get("fields", []):
        fid = f["id"]
        ftype = f["type"]
        req = "REQUIRED" if f.get("required") else "optional"
        opts = f.get("options")
        desc = f.get("description", "")

        line = f"- {fid} ({ftype}, {req})"
        if opts:
            line += f" - Valid options: {opts}"
        if desc:
            line += f" - Description: {desc}"
        lines.append(line)

    lines.append("")
    lines.append("EXAMPLE OUTPUT for a table with 3 patients:")
    lines.append(
        """{
  "total_rows": 3,
  "rows": [
    {"patientName": "John Doe", "patientAge": 29, "testResult": "Positive"},
    {"patientName": "Jane Smith", "patientAge": 35, "testResult": "Negative"},
    {"patientName": "Bob Wilson", "patientAge": 42, "testResult": "Positive"}
  ]
}"""
    )
    lines.append("")
    lines.append("Return ONLY valid JSON. Extract ALL rows you can find!")

    return "\n".join(lines)

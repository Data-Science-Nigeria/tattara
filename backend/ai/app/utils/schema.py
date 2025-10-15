from typing import Any, Dict, List
import json

class BadFormSchema(ValueError):
    pass

def ensure_demo_schema(schema_in: Any) -> Dict[str, Any]:
    """
    Normalize to {"fields": [ {id,type,required}, ... ]}.
    Accept dict, JSON string, or list of fields.
    """
    data = schema_in
    if isinstance(schema_in, (bytes, bytearray)):
        schema_in = schema_in.decode("utf-8", errors="ignore")
    if isinstance(schema_in, str):
        try:
            data = json.loads(schema_in)
        except Exception as e:
            raise BadFormSchema(f"form_schema is not valid JSON: {e}")
    if isinstance(data, list):
        data = {"fields": data}
    if not isinstance(data, dict):
        raise BadFormSchema("form_schema must be an object with 'fields'.")

    fields = data.get("fields")
    if not isinstance(fields, list):
        raise BadFormSchema("form_schema.fields must be a list.")

    norm: List[Dict[str, Any]] = []
    for f in fields:
        if not isinstance(f, dict):
            raise BadFormSchema("Each field must be an object.")
        fid = f.get("id")
        ftype = f.get("type")
        req = f.get("required", False)
        if not isinstance(fid, str) or not isinstance(ftype, str):
            raise BadFormSchema("Each field needs 'id' (string) and 'type' (string).")
        if not isinstance(req, bool):
            raise BadFormSchema("'required' must be boolean when provided.")
        norm.append({"id": fid, "type": ftype, "required": req})
    return {"fields": norm}
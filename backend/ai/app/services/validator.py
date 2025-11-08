from typing import Dict, Any, List
from jsonschema import Draft7Validator


class SchemaValidator:
    def __init__(self, schema: Dict[str, Any]):
        self.schema = schema
        self.validator = Draft7Validator(self._to_jsonschema(schema))

    def _to_jsonschema(self, form_schema: Dict[str, Any]) -> Dict[str, Any]:
        props = {}
        required = []
        for f in form_schema.get("fields", []):
            t = f.get("type", "string")
            js_type = t if t in {"string", "integer", "number", "boolean", "array", "object"} else "string"
            p: Dict[str, Any] = {"type": js_type}
            if "enum" in f:
                p["enum"] = f["enum"]
            if t == "array" and "items" in f:
                p["items"] = f["items"]
            if "pattern" in f:
                p["pattern"] = f["pattern"]
            if "minLength" in f:
                p["minLength"] = f["minLength"]
            if "maxLength" in f:
                p["maxLength"] = f["maxLength"]
            if "minimum" in f:
                p["minimum"] = f["minimum"]
            if "maximum" in f:
                p["maximum"] = f["maximum"]
            props[f["id"]] = p
            if f.get("required"):
                required.append(f["id"])
        return {"type": "object", "properties": props, "required": required}

    def validate_and_report(self, obj: Dict[str, Any]) -> List[str]:
        errors = sorted(self.validator.iter_errors(obj), key=lambda e: e.path)
        missing: List[str] = []
        for e in errors:
            if e.validator == "required" and isinstance(e.message, str):
                if e.validator_value and isinstance(e.validator_value, list):
                    for f in e.validator_value:
                        if f not in obj:
                            missing.append(f)
            else:
                pass
        return list(set(missing))

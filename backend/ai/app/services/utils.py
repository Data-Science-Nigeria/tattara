import json
import re
from typing import Any, Dict


def safe_json_parse(s: str) -> Dict[str, Any]:
    """Parse JSON.

    If the model returns extra text, extract the first JSON object and parse it.
    """
    try:
        return json.loads(s)
    except Exception:
        m = re.search(r"\{[\s\S]*\}", s)
        if m:
            try:
                return json.loads(m.group(0))
            except Exception:
                pass
        raise

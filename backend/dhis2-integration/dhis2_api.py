# dhis2_api.py
from fastapi import FastAPI, Header, HTTPException, Query
import requests
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Base DHIS2 URL (change to your instance)
DHIS2_BASE_URL = "https://dhis.dsnsandbox.com/dhis/api"

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # for testing, allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/programs")
def get_programs(authorization: str = Header(...)):
    """
    Fetch all DHIS2 programs
    """
    url = f"{DHIS2_BASE_URL}/programs.json"
    headers = {"Authorization": authorization}
    try:
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/datasets")
def get_datasets(authorization: str = Header(...)):
    """
    Fetch all DHIS2 dataSets
    """
    url = f"{DHIS2_BASE_URL}/dataSets.json"
    headers = {"Authorization": authorization}
    try:
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=str(e))
    

@app.get("/schema")
def get_schema(
    id: str = Query(..., description="Program ID or Dataset ID"),
    type: str = Query(..., regex="^(program|dataset)$", description="Select 'program' or 'dataset'"),
    authorization: str = Header(...)
):
    """
    Generate a generic DHIS2 payload schema for a program or dataset,
    including data element IDs and names for frontend use.
    """
    headers = {"Authorization": authorization}

    if type == "program":
        url = (
            f"{DHIS2_BASE_URL}/programs/{id}.json"
            "?fields=id,name,programStages[id,programStageDataElements[dataElement[id,name]]]"
        )
    else:  # dataset
        url = (
            f"{DHIS2_BASE_URL}/dataSets/{id}.json"
            "?fields=id,name,dataSetElements[dataElement[id,name]]"
        )

    try:
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()
        data = response.json()
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=str(e))

    if type == "program":
        # Get first program stage (if any)
        program_stages = data.get("programStages", [])
        if not program_stages:
            raise ValueError("No program stages found for this program")

        program_stage = program_stages[0]  # first stage (e.g. QPIlefRyPzr)

        # Extract data elements from that stage
        data_elements = [
            {
                "dataElement": de["dataElement"]["id"],
                "dataElementName": de["dataElement"]["name"],
                "value": ""
            }
            for de in program_stage.get("programStageDataElements", [])
        ]

        # Build event schema
        schema = {
            "program": data["id"],
            "programStage": program_stage["id"],  # safe now, exists
            "orgUnit": "REPLACE_WITH_ORG_UNIT_ID",
            "occurredAt": "2025-09-19T00:00:00.000",  # ISO datetime format
            "status": "COMPLETED",
            "dataValues": data_elements
        }
    else:  # dataset
        data_elements = [
            {
                "dataElement": de["dataElement"]["id"],
                "dataElementName": de["dataElement"]["name"],
                "value": ""
            }
            for de in data.get("dataSetElements", [])
        ]
        schema = {
            "dataSet": data["id"],
            "completeDate": "YYYY-MM-DD",
            "period": "YYYYMM",
            "orgUnit": "REPLACE_WITH_ORG_UNIT_ID",
            "dataValues": data_elements
        }

    return schema


def detect_endpoint(payload: dict) -> str:
    """
    Detects whether the payload is for events or dataValueSets.
    - Event payloads usually contain 'program' and 'occurredAt'
    - Dataset payloads usually contain 'dataSet' and 'period'
    """
    if "program" in payload and "occurredAt" in payload:
        return "tracker"
    elif "dataSet" in payload and "period" in payload:
        return "dataValueSets"
    else:
        return None


@app.post("/dhis2-push")
def push_to_dhis2(
    payload: dict,
    authorization: str = Header(..., description="Basic or PAT auth for DHIS2")
):
    """
    Accepts a DHIS2 payload (event or dataset) and forwards it
    automatically to the correct DHIS2 API endpoint.
    """
    endpoint = detect_endpoint(payload)
    if not endpoint:
        raise HTTPException(
            status_code=400,
            detail="Could not determine DHIS2 endpoint. Payload must contain either "
                   "('program' + 'occurredAt') for events OR ('dataSet' + 'period') for datasets."
        )

    # ✅ Wrap single event payloads correctly
    if endpoint == "tracker" and "events" not in payload:
        payload = {"events": [payload]}

    # Add importStrategy if tracker
    if endpoint == "tracker":
        url = f"{DHIS2_BASE_URL}/{endpoint}?importStrategy=CREATE"
    else:
        url = f"{DHIS2_BASE_URL}/{endpoint}"

    headers = {
        "Content-Type": "application/json",
        "Authorization": authorization
    }

    try:
        response = requests.post(url, json=payload, headers=headers)

        if response.status_code not in [200, 201]:
            raise HTTPException(
                status_code=response.status_code,
                detail=response.json()
            )

        return {
            "status": "success",
            "endpoint": endpoint,
            "dhis2_response": response.json()
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    
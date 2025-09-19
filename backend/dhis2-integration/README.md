# 📖 DHIS2 API Proxy Service

This FastAPI service acts as a lightweight **proxy between a frontend application and a DHIS2 instance**.  
It simplifies retrieving metadata (programs, datasets, schemas) and pushing data (events or dataset values) into DHIS2, while handling headers and payload formatting.

---

## 🚀 Features
- Retrieve all **programs** from DHIS2  
- Retrieve all **datasets** from DHIS2  
- Generate a **generic payload schema** for a program or dataset  
- Push payloads to the correct DHIS2 endpoint (`/events` or `/dataValueSets`) automatically  

---

## ⚙️ Setup

### Requirements
- Python 3.9+
- [FastAPI](https://fastapi.tiangolo.com/)
- [Requests](https://requests.readthedocs.io/)
- [Uvicorn](https://www.uvicorn.org/)

### Install dependencies
```bash
pip install fastapi uvicorn requests
````

### Run the API

```bash
uvicorn dhis2_api:app --reload --port 4000
```

The service will be available at:
👉 `http://localhost:4000`

---

## 🔑 Authentication

All endpoints require the **Authorization** header.
You can use either:

* **Basic Auth** → `Authorization: Basic base64(username:password)`
* **Personal Access Token (PAT)** → `Authorization: ApiToken <your-token>`

---

## 📡 API Endpoints

### 1. **Get Programs**

Fetch all DHIS2 programs.

* **Endpoint**: `GET /programs`
* **Headers**:

  * `Authorization: <your-auth>`

**Example (cURL):**

```bash
curl -X GET "http://localhost:4000/programs" \
  -H "Authorization: Basic dXNlcjpwYXNz"
```

---

### 2. **Get Datasets**

Fetch all DHIS2 datasets.

* **Endpoint**: `GET /datasets`
* **Headers**:

  * `Authorization: <your-auth>`

**Example (cURL):**

```bash
curl -X GET "http://localhost:4000/datasets" \
  -H "Authorization: Basic dXNlcjpwYXNz"
```

---

### 3. **Get Assigned Organisation Units**

Fetch organisation units assigned to a program or dataset.

* **Endpoint**: `GET /orgunits?id={id}&type={program|dataset}`
* **Headers**:

  * `Authorization: <your-auth>`

**Parameters**:

* `id` → UID of the program or dataset
* `type` → `"program"` or `"dataset"`

**Example (cURL):**

```bash
curl -X GET "http://localhost:4000/orgunits?id=************=program" \
  -H "Authorization: Basic dXNlcjpwYXNz"
```

**Example Response:**

```json
{
  "organisationUnits": [
    { "id": "ABCDEFGH", "displayName": "District A" },
    { "id": "IJKLMNOP", "displayName": "District B" }
  ]
}
```

---

### 4. **Get Schema**

Generate a **payload template** for either a program or dataset.

* **Endpoint**: `GET /schema`
* **Query Parameters**:

  * `id` → Program ID or Dataset ID
  * `type` → `program` or `dataset`
* **Headers**:

  * `Authorization: <your-auth>`

**Example (Program):**

```bash
curl -X GET "http://localhost:4000/schema?id=*********&type=program" \
  -H "Authorization: Basic dXNlcjpwYXNz"
```

**Example Response (Program):**

```json
{
  "program": "*************",
  "orgUnit": "REPLACE_WITH_ORG_UNIT_ID",
  "eventDate": "YYYY-MM-DD",
  "status": "COMPLETED",
  "dataValues": [
    { "dataElement": "abc123", "dataElementName": "Patient Age", "value": "" }
  ]
}
```

---

### 5. **Push Data to DHIS2**

Submit a **program event** or **dataset values**.
The service auto-detects the correct DHIS2 endpoint (`/events` or `/dataValueSets`).

* **Endpoint**: `POST /dhis2-push`
* **Headers**:

  * `Authorization: <your-auth>`
  * `Content-Type: application/json`
* **Body**: DHIS2 event or dataset payload

**Event Payload Example:**

```json
{
  "program": "***********",
  "orgUnit": "***********",
  "eventDate": "2025-09-01",
  "status": "COMPLETED",
  "dataValues": [
    { "dataElement": "abc123", "value": "25" },
    { "dataElement": "xyz456", "value": "Male" }
  ]
}
```

**Dataset Payload Example:**

```json
{
  "dataSet": "************",
  "completeDate": "2025-09-01",
  "period": "202509",
  "orgUnit": "**********",
  "dataValues": [
    { "dataElement": "abc123", "value": "100" },
    { "dataElement": "xyz456", "value": "200" }
  ]
}
```

**Example (cURL):**

```bash
curl -X POST "http://localhost:4000/dhis2-push" \
  -H "Authorization: Basic **********" \
  -H "Content-Type: application/json" \
  -d @event_payload.json
```

---

## 🧭 Endpoint Auto-Detection

The API decides where to push based on payload structure:

* **Program Event** → must contain `"program"` + `"occuredAt"` → sent to `/tracker`
* **Dataset Values** → must contain `"dataSet"` + `"period"` → sent to `/dataValueSets`

---

## 🖥️ Frontend Usage Examples

You can call this proxy from any frontend app (React, Vue, Angular).
Here are examples with **React**:

### Fetching Programs (using `fetch`)

```javascript
const API_URL = "http://localhost:4000";

async function getPrograms(authToken) {
  const response = await fetch(`${API_URL}/programs`, {
    headers: {
      Authorization: authToken
    }
  });
  return response.json();
}

// Usage:
getPrograms("Basic *********").then(data => {
  console.log("Programs:", data);
});
```

---

### Fetching Schema (using `axios`)

```javascript
import axios from "axios";

const API_URL = "http://localhost:4000";

async function getSchema(authToken, programId) {
  const response = await axios.get(`${API_URL}/schema`, {
    params: { id: programId, type: "program" },
    headers: { Authorization: authToken }
  });
  return response.data;
}

// Usage:
getSchema("Basic ********", "**********")
  .then(schema => console.log("Program Schema:", schema));
```

---

### Submitting an Event (using `fetch`)

```javascript
async function submitEvent(authToken, payload) {
  const response = await fetch(`${API_URL}/dhis2-push`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: authToken
    },
    body: JSON.stringify(payload)
  });
  return response.json();
}

// Usage:
const eventPayload = {
  program: "**********",
  orgUnit: "**********",
  eventDate: "2025-09-01",
  status: "COMPLETED",
  dataValues: [
    { dataElement: "abc123", value: "25" },
    { dataElement: "xyz456", value: "Male" }
  ]
};

submitEvent("Basic ********", eventPayload)
  .then(res => console.log("DHIS2 Response:", res));
```

---

## 🛠️ Development Notes

* Update the DHIS2 base URL in `dhis2_api.py`:

  ```python
  DHIS2_BASE_URL = "http://localhost:8081/api"
  ```
* For production, restrict CORS origins instead of `allow_origins=["*"]`.
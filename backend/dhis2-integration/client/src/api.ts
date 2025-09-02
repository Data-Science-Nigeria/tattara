const API_URL = "http://localhost:4000";

export const api = {
  me: (auth: string) =>
    fetch(`${API_URL}/me`, { headers: { Authorization: auth } }).then(r => r.json()),

  programs: (auth: string) =>
    fetch(`${API_URL}/programs`, { headers: { Authorization: auth } }).then(r => r.json()),

  datasets: (auth: string) =>
    fetch(`${API_URL}/datasets`, { headers: { Authorization: auth } }).then(r => r.json()),

  postEvent: (auth: string, body: any) =>
    fetch(`${API_URL}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: auth },
      body: JSON.stringify(body),
    }).then(r => r.json()),

  postDataValues: (auth: string, body: any) =>
    fetch(`${API_URL}/dataValueSets`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: auth },
      body: JSON.stringify(body),
    }).then(r => r.json()),
};

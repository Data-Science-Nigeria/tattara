// client/src/api/dhis2.ts
export const fetchDHIS2 = async (
  username: string,
  password: string,
  path: string
) => {
  const res = await fetch(`/dhis2/${path}`, {
    headers: {
      Authorization: "Basic " + btoa(`${username}:${password}`),
    },
  });

  if (!res.ok) {
    throw new Error(`DHIS2 request failed: ${res.status} ${res.statusText}`);
  }

  return res.json();
};

export const postDHIS2 = async (
  username: string,
  password: string,
  path: string,
  payload: any
) => {
  const res = await fetch(`/dhis2/${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Basic " + btoa(`${username}:${password}`),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`POST failed: ${res.status} ${res.statusText}`);
  }

  return res.json();
};

// client/src/components/DatasetForm.tsx
import { useState } from "react";
import { postDHIS2 } from "../api/dhis2";



interface Props {
  meta: any;
  auth: { username: string; password: string };
}

export default function DatasetForm({ meta, auth }: Props) {
  const [preview, setPreview] = useState<any | null>(null);
  const [orgUnit, setOrgUnit] = useState("");
  const [period, setPeriod] = useState("");
  const [values, setValues] = useState<{ [key: string]: string }>({});
  const [status, setStatus] = useState<string | null>(null);

  const handleChange = (id: string, value: string) => {
    setValues((prev) => ({ ...prev, [id]: value }));
  };

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  const payload = {
    dataSet: meta.id,
    completeDate: new Date().toISOString().slice(0, 10),
    orgUnit,
    period,
    dataValues: Object.entries(values).map(([de, val]) => ({
      dataElement: de,
      value: val,
    })),
  };

  // 👇 set preview so it shows up on the page
  setPreview(payload);

  try {
    setStatus("Submitting...");
    const res = await postDHIS2(auth.username, auth.password, "dataValueSets", payload);
    setStatus("✅ Data sent successfully");
  } catch (err: any) {
    setStatus(`❌ Failed to submit: ${err.message}`);
  }
};


  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 border p-4 rounded bg-gray-50"
    >
      <h3 className="text-lg font-bold">{meta.displayName}</h3>

      {/* Org Unit */}
      <div>
        <label className="block text-sm">Organisation Unit</label>
        <select
          className="border p-2 w-full"
          value={orgUnit}
          onChange={(e) => setOrgUnit(e.target.value)}
          required
        >
          <option value="">-- Select Organisation Unit --</option>
          {meta.organisationUnits.map((ou: any) => (
            <option key={ou.id} value={ou.id}>
              {ou.displayName}
            </option>
          ))}
        </select>
      </div>

      {/* Period */}
      <div>
        <label className="block text-sm">Period ({meta.periodType})</label>
        <input
          className="border p-2 w-full"
          placeholder="e.g. 2025Q1 or 202508"
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          required
        />
      </div>

      {/* Data Elements */}
      <div>
        <h4 className="font-semibold">Data Elements</h4>
        <div className="space-y-2">
          {meta.dataSetElements.map((dse: any) => (
            <div key={dse.dataElement.id}>
              <label className="block text-sm">
                {dse.dataElement.displayName}
              </label>
              <input
                className="border p-2 w-full"
                value={values[dse.dataElement.id] || ""}
                onChange={(e) =>
                  handleChange(dse.dataElement.id, e.target.value)
                }
              />
            </div>
          ))}
        </div>
      </div>
     
      {preview && (
      <div className="mt-4 p-3 bg-gray-100 rounded border">
        <h4 className="font-semibold mb-2">📦 Preview your data before submitting.</h4>
        <pre className="text-xs whitespace-pre-wrap">
          {JSON.stringify(preview, null, 2)}
        </pre>
      </div>
    )}

      <button
        type="submit"
        className="bg-green-600 text-white px-4 py-2 rounded"
      >
        Submit Data
      </button>

      {status && <p className="mt-2 text-sm">{status}</p>}

   

    </form>
  );
}
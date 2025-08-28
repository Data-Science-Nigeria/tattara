// client/src/components/ProgramForm.tsx
import { useState } from "react";
import { postDHIS2 } from "../api/dhis2";

interface Props {
  meta: any; // program metadata
  auth: { username: string; password: string };
}

export default function ProgramForm({ meta, auth }: Props) {
  const [orgUnit, setOrgUnit] = useState("");
  const [eventDate, setEventDate] = useState(new Date().toISOString().slice(0, 10));
  const [values, setValues] = useState<{ [key: string]: string }>({});
  const [status, setStatus] = useState<string | null>(null);
  const [preview, setPreview] = useState<any | null>(null);

  const handleChange = (de: string, value: string) => {
    setValues((prev) => ({ ...prev, [de]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      program: meta.id,
      orgUnit,
      eventDate,
      status: "COMPLETED",
      dataValues: Object.entries(values).map(([de, val]) => ({
        dataElement: de,
        value: val,
      })),
    };

    setPreview(payload);

    try {
      setStatus("Submitting...");
      const res = await postDHIS2(auth.username, auth.password, "events", payload);
      console.log("✅ Event created:", res);
      setStatus("✅ Event saved successfully");
    } catch (err: any) {
      console.error("❌ Error:", err);
      setStatus(`❌ Failed: ${err.message}`);
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
          <option value="">-- Select Org Unit --</option>
          {meta.organisationUnits.map((ou: any) => (
            <option key={ou.id} value={ou.id}>
              {ou.displayName}
            </option>
          ))}
        </select>
      </div>

      {/* Event Date */}
      <div>
        <label className="block text-sm">Event Date</label>
        <input
          type="date"
          className="border p-2 w-full"
          value={eventDate}
          onChange={(e) => setEventDate(e.target.value)}
          required
        />
      </div>

      {/* Data Elements */}
      <div>
        <h4 className="font-semibold">Data Elements</h4>
        <div className="space-y-2">
          {meta.programStages[0]?.programStageDataElements.map((psde: any) => (
            <div key={psde.dataElement.id}>
              <label className="block text-sm">
                {psde.dataElement.displayName}
              </label>
              <input
                className="border p-2 w-full"
                value={values[psde.dataElement.id] || ""}
                onChange={(e) =>
                  handleChange(psde.dataElement.id, e.target.value)
                }
              />
            </div>
          ))}
        </div>
      </div>

      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Save Event
      </button>

      {status && <p className="mt-2 text-sm">{status}</p>}

      {preview && (
        <div className="mt-4 p-3 bg-gray-100 rounded border">
          <h4 className="font-semibold mb-2">📦 Payload Preview</h4>
          <pre className="text-xs whitespace-pre-wrap">
            {JSON.stringify(preview, null, 2)}
          </pre>
        </div>
      )}
    </form>
  );
}
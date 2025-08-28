import { useState } from "react";

export default function Login({ onLogin }: { onLogin: (auth: string) => void }) {
  const [pat, setPat] = useState("");

  const handleSubmit = () => {
    onLogin(`ApiToken ${pat}`);
  };

  return (
    <div className="p-6 space-y-3">
      <h2 className="text-xl font-semibold">Login with DHIS2 PAT</h2>
      <input
        type="text"
        placeholder="Paste Personal Access Token"
        value={pat}
        onChange={e => setPat(e.target.value)}
        className="border p-2 w-full"
      />
      <button onClick={handleSubmit} className="px-4 py-2 bg-blue-600 text-white rounded">
        Login
      </button>
    </div>
  );
}

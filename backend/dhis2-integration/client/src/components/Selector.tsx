import { useState, useEffect } from "react";
import { fetchDHIS2 } from "../api/dhis2";
import DatasetForm from "./DataSetForm";
import ProgramForm from "./ProgramForm";

interface Props {
  auth: { username: string; password: string };
}

export default function Selector({ auth }: Props) {
  const [mode, setMode] = useState<"programs" | "dataSets">("programs");
  const [items, setItems] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [formMeta, setFormMeta] = useState<any | null>(null);

  // Load list of programs or datasets
  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchDHIS2(
          auth.username,
          auth.password,
          `${mode}?fields=id,displayName&paging=false`
        );
        setItems(data[mode]);
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, [mode, auth]);

  // When dataset selected, fetch full dataset metadata
  useEffect(() => {
    if (!selected || mode !== "dataSets") return;

    const loadMeta = async () => {
      try {
        const meta = await fetchDHIS2(
          auth.username,
          auth.password,
          `dataSets/${selected.id}?fields=id,displayName,periodType,organisationUnits[id,displayName],dataSetElements[dataElement[id,displayName,valueType]]`
        );
        setFormMeta(meta);
      } catch (err) {
        console.error(err);
      }
    };
    loadMeta();
  }, [selected, mode, auth]);

  // When program selected, fetch full program metadata
  useEffect(() => {
    if (!selected || mode !== "programs") return;

    const loadMeta = async () => {
      try {
        const meta = await fetchDHIS2(
          auth.username,
          auth.password,
          `programs/${selected.id}?fields=id,displayName,organisationUnits[id,displayName],programStages[id,displayName,programStageDataElements[dataElement[id,displayName,valueType]]]`
        );
        setFormMeta(meta);
      } catch (err) {
        console.error(err);
      }
    };
    loadMeta();
  }, [selected, mode, auth]);

  return (
    <div className="p-4 space-y-4">
      {/* Tabs */}
      <div className="flex space-x-4 border-b pb-2">
        <button
          className={mode === "programs" ? "font-bold" : ""}
          onClick={() => {
            setSelected(null);
            setFormMeta(null);
            setMode("programs");
          }}
        >
          Programs
        </button>
        <button
          className={mode === "dataSets" ? "font-bold" : ""}
          onClick={() => {
            setSelected(null);
            setFormMeta(null);
            setMode("dataSets");
          }}
        >
          Datasets
        </button>
      </div>

      {/* Dropdown */}
      <div>
        <label className="block text-sm mb-1">
          Select {mode === "programs" ? "Program" : "Dataset"}
        </label>
        <select
          className="border rounded p-2 w-full"
          onChange={(e) =>
            setSelected(items.find((i) => i.id === e.target.value))
          }
        >
          <option value="">-- Choose --</option>
          {items.map((i) => (
            <option key={i.id} value={i.id}>
              {i.displayName}
            </option>
          ))}
        </select>
      </div>

      {/* Render dataset form */}
      {mode === "dataSets" && formMeta && (
        <DatasetForm meta={formMeta} auth={auth} />
      )}

      {/* Render program form */}
      {mode === "programs" && formMeta && (
        <ProgramForm meta={formMeta} auth={auth} />
      )}
    </div>
  );
}

import { Combobox } from "@headlessui/react";
import { useMemo, useState } from "react";

export default function CitySelect(props: {
  cities: string[];
  value: string;
  onChange: (city: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const { cities, value, onChange, placeholder, disabled } = props;
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = cities;
    if (!q) return base.slice(0, 60);
    return base.filter((c) => c.toLowerCase().includes(q)).slice(0, 60);
  }, [cities, query]);

  return (
    <Combobox
      value={value}
      onChange={(v) => onChange(typeof v === "string" ? v : "")}
      disabled={disabled}
    >
      <div style={{ position: "relative" }}>
        <Combobox.Input
          className="ease-up"
          value={value}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange(e.target.value);
          }}
          placeholder={placeholder ?? "Search by city"}
          style={{
            width: "100%",
            padding: "12px 14px",
            borderRadius: 18,
            border: "1px solid #e2e8f0",
            outline: "none",
            fontSize: 14,
            color: "#0A1628",
            background: disabled ? "#f8fafc" : "#fff",
          }}
        />

        <Combobox.Options
          style={{
            position: "absolute",
            zIndex: 50,
            marginTop: 8,
            width: "100%",
            maxHeight: 260,
            overflow: "auto",
            borderRadius: 14,
            border: "1px solid #e2e8f0",
            background: "#fff",
            boxShadow: "0 12px 30px rgba(15, 23, 42, 0.12)",
          }}
        >
          {filtered.length === 0 ? (
            <div style={{ padding: 12, color: "#64748b", fontSize: 13 }}>
              No matches
            </div>
          ) : (
            filtered.map((city) => (
              <Combobox.Option key={city} value={city}>
                {({ active }) => (
                  <div
                    style={{
                      padding: "10px 12px",
                      fontSize: 14,
                      cursor: "pointer",
                      background: active ? "#f1f5f9" : "#fff",
                      color: "#0A1628",
                    }}
                  >
                    {city}
                  </div>
                )}
              </Combobox.Option>
            ))
          )}
        </Combobox.Options>
      </div>
    </Combobox>
  );
}

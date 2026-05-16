export default function SettingsPanel({ settings, onChange, onReset }) {
  return (
    <details className="settings-panel">
      <summary>Settings</summary>
      <div className="settings-grid">
        <label>
          Pet Name
          <input
            value={settings.petName}
            onChange={(e) => onChange({ ...settings, petName: e.target.value })}
          />
        </label>
        <label>
          Personality Level ({settings.personalityLevel})
          <input
            type="range"
            min="1"
            max="5"
            value={settings.personalityLevel}
            onChange={(e) => onChange({ ...settings, personalityLevel: Number(e.target.value) })}
          />
        </label>
        <label>
          Response Style
          <select
            value={settings.responseStyle}
            onChange={(e) => onChange({ ...settings, responseStyle: e.target.value })}
          >
            <option value="balanced">Balanced</option>
            <option value="chaotic">Chaotic</option>
            <option value="soft">Soft</option>
          </select>
        </label>
        <button className="reset-btn" onClick={onReset} type="button">
          Reset Pet Memory
        </button>
      </div>
    </details>
  );
}

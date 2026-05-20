export default function SettingsPanel({ settings, onChange, open, onClose }) {
  if (!open) return null;

  return (
    <div className="settings-backdrop" onClick={onClose}>
      <section className="settings-panel" onClick={(e) => e.stopPropagation()}>
        <h3>Pet Settings</h3>
        <label>
          Pet name
          <input value={settings.petName} onChange={(e) => onChange('petName', e.target.value)} />
        </label>
        <label>
          Personality level
          <input
            type="range"
            min="1"
            max="10"
            value={settings.personalityLevel}
            onChange={(e) => onChange('personalityLevel', Number(e.target.value))}
          />
        </label>
        <label>
          Response style
          <select value={settings.responseStyle} onChange={(e) => onChange('responseStyle', e.target.value)}>
            <option>Snarky</option>
            <option>Chaotic</option>
            <option>Soft</option>
          </select>
        </label>
        <button onClick={onClose}>Done</button>
      </section>
    </div>
  );
}

import { useMemo, useState } from 'react';
import { MODES, modeLabels } from './data/responses';
import { petBrain } from './modules/petBrain';
import SettingsPanel from './components/SettingsPanel';

export default function App() {
  const [selectedMode, setSelectedMode] = useState('Talk');
  const [mood, setMood] = useState('Neutral');
  const [memory, setMemory] = useState([]);
  const [userText, setUserText] = useState('');
  const [reply, setReply] = useState('Boot complete. I am [NAME]. Your emotional support gremlin is online.');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState({ petName: '[NAME]', personalityLevel: 7, responseStyle: 'Snarky' });

  const moodClass = useMemo(() => `mood-${mood.toLowerCase()}`, [mood]);
  const moodPulse = useMemo(() => ({ Happy: '💖', Neutral: '😐', Suspicious: '🕵️', Annoyed: '😾', Curious: '🧪' }[mood] || '😐'), [mood]);

  const styleResponse = (text, style, personalityLevel) => {
    let styled = text;
    if (style === 'Chaotic') styled += ' ✨[GLITTER_NOISE]✨';
    if (style === 'Soft') styled = styled.replace(/!/g, '.').replace(/patience/gi, 'vibes');
    if (personalityLevel >= 8) styled += ' (sass overclocked)';
    return styled;
  };

  const submit = () => {
    const output = petBrain({ userText, selectedMode, currentMood: mood, memory });
    setReply(styleResponse(output.responseText, settings.responseStyle, settings.personalityLevel));
    setMood(output.updatedMood);
    setMemory(output.updatedMemory);
    setUserText('');
  };

  return (
    <main className="app-shell">
      <header className="top-status">
        <div>
          <h1>{settings.petName}</h1>
          <small>{moodPulse} Mood: {mood}</small>
        </div>
        <button className="ghost" onClick={() => setSettingsOpen(true)}>Settings</button>
      </header>

      <section className={`pet-card ${moodClass}`}>
        <div className="avatar" aria-label="pet avatar">◉⩊◉</div>
        <div className="bubble">{reply}</div>
      </section>

      <section className="mode-grid" aria-label="interaction buttons">
        {MODES.map((mode) => (
          <button key={mode} className={selectedMode === mode ? 'active' : ''} onClick={() => setSelectedMode(mode)}>
            {modeLabels[mode] || mode}
          </button>
        ))}
      </section>

      <section className="memory-strip">
        <p>Recent memory:</p>
        <div>
          {memory.filter((m) => m.role === 'user').slice(-3).map((m, i) => (
            <span key={`${m.at}-${i}`}>{m.text.slice(0, 26)}</span>
          ))}
        </div>
      </section>

      <section className="input-row">
        <input
          placeholder="Type something weird..."
          value={userText}
          onChange={(e) => setUserText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
        />
        <button onClick={submit}>Send</button>
      </section>

      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onChange={(key, value) => setSettings((s) => ({ ...s, [key]: value }))}
      />
    </main>
  );
}

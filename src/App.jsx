import ChatPanel from './components/ChatPanel';
import ModePad from './components/ModePad';
import PetHeader from './components/PetHeader';
import SettingsPanel from './components/SettingsPanel';
import { usePetState } from './state/usePetState';

export default function App() {
  const { petState, settings, input, setInput, setMode, setSettings, sendMessage, resetPet } =
    usePetState();

  return (
    <main className="app-shell">
      <section className="pet-card">
        <PetHeader petName={settings.petName} mood={petState.mood} mode={petState.selectedMode} />
        <ModePad selectedMode={petState.selectedMode} onSelect={setMode} />
        <ChatPanel
          petName={settings.petName}
          response={petState.response}
          input={input}
          onInputChange={setInput}
          onSend={sendMessage}
        />
        <SettingsPanel settings={settings} onChange={setSettings} onReset={resetPet} />
      </section>
    </main>
  );
}

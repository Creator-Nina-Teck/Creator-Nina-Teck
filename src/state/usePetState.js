import { useEffect, useMemo, useState } from 'react';
import { DEFAULT_PET_STATE, DEFAULT_SETTINGS, generatePetReply } from '../lib/petEngine';

const STORAGE_KEY = 'name_ai_tamagotchi_state_v1';

function loadSavedState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function persistState(snapshot) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
}

export function usePetState() {
  const boot = useMemo(() => loadSavedState(), []);

  const [petState, setPetState] = useState(boot?.petState || DEFAULT_PET_STATE);
  const [settings, setSettings] = useState(boot?.settings || DEFAULT_SETTINGS);
  const [input, setInput] = useState('');

  useEffect(() => {
    persistState({ petState, settings });
  }, [petState, settings]);

  const setMode = (mode) => setPetState((prev) => ({ ...prev, selectedMode: mode }));

  const sendMessage = () => {
    const text = input.trim();
    if (!text) return;

    const { responseText, updatedMood, updatedMemory } = generatePetReply({
      inputText: text,
      state: petState,
      settings,
    });

    setPetState((prev) => ({
      ...prev,
      response: responseText,
      mood: updatedMood,
      memory: updatedMemory,
    }));
    setInput('');
  };

  const resetPet = () => {
    setPetState(DEFAULT_PET_STATE);
    setSettings(DEFAULT_SETTINGS);
    setInput('');
  };

  return {
    petState,
    settings,
    input,
    setInput,
    setMode,
    setSettings,
    sendMessage,
    resetPet,
  };
}

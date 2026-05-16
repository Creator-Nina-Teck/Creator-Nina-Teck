import { runPetBrain, defaultSampleMemory } from '../modules/petBrain';

export const DEFAULT_SETTINGS = {
  petName: '[NAME]',
  personalityLevel: 3,
  responseStyle: 'balanced',
};

export const DEFAULT_PET_STATE = {
  selectedMode: 'Talk',
  mood: 'Neutral',
  memory: defaultSampleMemory,
  response: 'Poke a button or type. I am operationally dramatic.',
};

export function generatePetReply({ inputText, state, settings }) {
  return runPetBrain({
    userText: inputText,
    selectedMode: state.selectedMode,
    currentMood: state.mood,
    memory: state.memory,
    settings,
  });
}

// Future AI integration seam:
// Replace generatePetReply internals with service orchestration
// (prompt building + provider call + post-processing) while
// keeping the same output contract used by state layer.

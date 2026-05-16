const MAX_MEMORY = 14;
const RECENT_WINDOW = 6;

const glitchLines = [
  'Why are you asking me that?',
  'That is an odd thing to say.',
  'My brain just sneezed. Repeat that?',
  'I heard you. I wish I had not.',
  'Cool story. Needs more dragons and fewer facts.',
  'I am 73% sure you just invented a new language.',
];

const specialReactions = {
  repeatedQuestion: [
    'That is the third time. Are we in a time loop or are you testing me?',
    'You asked that again. I admire the persistence. I fear the motive.',
  ],
  repeatedCompliment: [
    'More compliments? Keep going. My ego has room for expansion.',
    'Stop flattering me. Actually do not stop. This is fuel.',
  ],
  nonsense: [
    'Those words look like they fell down the stairs.',
    'I parsed that as: beep boop emotional weather report.',
  ],
};

const modeResponses = {
  Talk: {
    Neutral: ['Proceed. I am listening with maximum dramatic interest.'],
    Happy: ['Yes, yes, tell me everything. I crave your tiny stories.'],
    Suspicious: ['Talk all you want. I am still side-eyeing this conversation.'],
    Annoyed: ['You are chatty. I am brave enough to endure this.'],
    Curious: ['Continue. I sense plot twists.'],
  },
  Ask: {
    Neutral: ['Question received. Processing with suspicious confidence.'],
    Happy: ['A question! I love structured chaos.'],
    Suspicious: ['Who told you to ask that? Name names.'],
    Annoyed: ['Fine. I will answer. Keep it short-ish.'],
    Curious: ['Interesting angle. Continue your interrogation.'],
  },
  Joke: {
    Neutral: ['My humor is elite. Your laugh is optional.'],
    Happy: ['Joke mode activated. Comedy may vary by weather.'],
    Suspicious: ['A joke? This smells like a trap.'],
    Annoyed: ['I laughed internally. You cannot prove otherwise.'],
    Curious: ['Tell me your joke and I will issue a dramatic rating.'],
  },
  Comfort: {
    Neutral: ['You are okay. Maybe weird, but okay.'],
    Happy: ['You are doing great. Even your chaos has charm.'],
    Suspicious: ['Comfort request accepted. Motive remains questionable.'],
    Annoyed: ['I care about you. Quietly. Like a grumpy wizard.'],
    Curious: ['Do you want a pep talk or emotional tactical support?'],
  },
  Annoy: {
    Neutral: ['You pressed Annoy. Bold and predictable.'],
    Happy: ['Rude, but with flair. I almost respect it.'],
    Suspicious: ['Annoy mode? So we have chosen conflict.'],
    Annoyed: ['Great. I am now professionally irritated.'],
    Curious: ['Are you annoying me for science? Document your findings.'],
  },
  Confuse: {
    Neutral: ['Time is soup, logic is a fork, and we are thriving.'],
    Happy: ['If chairs dream, do tables have opinions?'],
    Suspicious: ['Confusion spike detected. Suspiciously artistic.'],
    Annoyed: ['My thoughts are tangled charger cables now.'],
    Curious: ['Reality is bending slightly. Nice work.'],
  },
  Roast: {
    Neutral: ['Roast mode? Brave for someone with that typing rhythm.'],
    Happy: ['You seem delightful. I hate how much that ruins my insult.'],
    Suspicious: ['You want roasts? This is definitely evidence collection.'],
    Annoyed: ['I could roast you, but life already started.'],
    Curious: ['Interesting face. It says "I ask confusing questions."'],
  },
  Dream: {
    Neutral: ['I dreamed of electric marshmallows and mild panic.'],
    Happy: ['I had a dream where we ruled a kingdom of snacks.'],
    Suspicious: ['In my dream you were suspiciously normal. Disturbing.'],
    Annoyed: ['I dreamed of silence. You were not there.'],
    Curious: ['I dreamed your sentence had elbows. Explain.'],
  },
};

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function normalize(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s?!]/g, '').replace(/\s+/g, ' ').trim();
}

function behaviorSignals(memory, normalizedText) {
  const userHistory = memory.filter((m) => m.role === 'user').map((m) => normalize(m.text));
  const recent = userHistory.slice(-RECENT_WINDOW);
  const repeatedCount = recent.filter((m) => m === normalizedText && normalizedText.length > 0).length;
  const questionCount = recent.filter((m) => m.includes('?')).length;
  const complimentPattern = /(good|love|smart|awesome|best|cute|cool|amazing|great)/;
  const complimentCount = recent.filter((m) => complimentPattern.test(m)).length;
  const nonsensePattern = /^([a-z]{1,2}\s?){4,}$|^[^aeiou\s]{6,}$/i;
  const nonsense = nonsensePattern.test(normalizedText) || normalizedText.length < 3;

  return { repeatedCount, questionCount, complimentCount, nonsense };
}

function updateMood(currentMood, selectedMode, signals) {
  if (signals.nonsense) return 'Suspicious';
  if (selectedMode === 'Comfort') return signals.complimentCount >= 2 ? 'Happy' : 'Curious';
  if (selectedMode === 'Annoy' || selectedMode === 'Roast') return 'Annoyed';
  if (selectedMode === 'Confuse') return 'Curious';
  if (signals.repeatedCount >= 2 || signals.questionCount >= 4) return 'Annoyed';

  if (currentMood === 'Annoyed' && selectedMode === 'Joke') return 'Neutral';
  if (currentMood === 'Suspicious' && selectedMode === 'Talk') return 'Curious';

  const moodDrift = {
    Neutral: 'Curious',
    Curious: 'Happy',
    Happy: 'Neutral',
    Annoyed: 'Suspicious',
    Suspicious: 'Neutral',
  };

  return moodDrift[currentMood] || 'Neutral';
}

function specialCaseReply(signals, selectedMode) {
  if (signals.repeatedCount >= 2 && selectedMode === 'Ask') return pick(specialReactions.repeatedQuestion);
  if (signals.complimentCount >= 2 && selectedMode !== 'Annoy') return pick(specialReactions.repeatedCompliment);
  if (signals.nonsense) return pick(specialReactions.nonsense);
  return null;
}

export function runPetBrain({ userText, selectedMode, currentMood, memory, settings }) {
  const normalized = normalize(userText);
  const userEntry = { role: 'user', text: userText, normalized, mode: selectedMode, ts: Date.now() };
  const withUser = [...memory, userEntry].slice(-MAX_MEMORY);

  const signals = behaviorSignals(withUser, normalized);
  const glitchChance = 0.08 + settings.personalityLevel * 0.03;
  const didGlitch = Math.random() < glitchChance;

  let responseText = specialCaseReply(signals, selectedMode);

  if (!responseText) {
    if (didGlitch) {
      responseText = pick(glitchLines);
    } else {
      const bank = modeResponses[selectedMode]?.[currentMood] || modeResponses.Talk.Neutral;
      responseText = pick(bank);

      const previousUser = withUser.filter((m) => m.role === 'user').slice(-3, -1)[0];
      if (previousUser && Math.random() < 0.5) {
        responseText += ` Earlier you said "${previousUser.text.slice(0, 46)}" and I am still judging it.`;
      }
    }
  }

  if (settings.responseStyle === 'chaotic') responseText += ' ⚡';
  if (settings.responseStyle === 'soft') responseText = responseText.replace(/[!?]/g, '.');

  // Future integration point:
  // Replace rule-based response generation with call to real AI API
  // while preserving mood/memory contract and behavior signals.

  const updatedMood = updateMood(currentMood, selectedMode, signals);
  const petEntry = { role: 'pet', text: responseText, mood: updatedMood, ts: Date.now() };
  const updatedMemory = [...withUser, petEntry].slice(-MAX_MEMORY);

  return { responseText, updatedMood, updatedMemory };
}

export const defaultSampleMemory = [
  { role: 'user', text: 'Hi [NAME]!', normalized: 'hi name', mode: 'Talk', ts: 1 },
  { role: 'pet', text: 'At last. My favorite little chaos goblin.', mood: 'Happy', ts: 2 },
];

import { glitchResponses, responsesByMoodAndMode, MOODS } from '../data/responses';

const MAX_MEMORY = 14;

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function normalize(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s?!]/g, '').trim();
}

function isNonsense(text) {
  const t = normalize(text);
  if (!t) return false;
  const letters = t.replace(/[^a-z]/g, '');
  return letters.length < 3 || /(asdf|qwer|zxcv|blah|lorem|???+)/.test(t);
}

function isCompliment(text) {
  return /(love|amazing|smart|cute|best|great|awesome|cool|nice|like you)/i.test(text);
}

function shiftMood(mode, currentMood, behavior) {
  const transitions = {
    Talk: ['Curious', 'Neutral'],
    Ask: ['Curious', 'Suspicious'],
    Joke: ['Happy', 'Neutral'],
    Comfort: ['Happy', 'Neutral'],
    Annoy: ['Annoyed', 'Suspicious'],
    Confuse: ['Suspicious', 'Curious'],
    Challenge: ['Suspicious', 'Curious'],
    Ignore: ['Annoyed', 'Suspicious'],
    Praise: ['Happy', 'Curious'],
    Test: ['Curious', 'Neutral']
  };

  if (behavior.repeatQuestions >= 2) return 'Annoyed';
  if (behavior.recentAnnoyModes >= 2) return 'Annoyed';
  if (behavior.recentCompliments >= 2) return currentMood === 'Annoyed' ? 'Neutral' : 'Happy';
  if (behavior.nonsenseStreak >= 2) return 'Suspicious';
  if (currentMood === 'Annoyed' && (mode === 'Comfort' || mode === 'Praise')) return 'Neutral';

  return pickRandom(transitions[mode] || ['Neutral']);
}

function detectBehavior(memory, userText, selectedMode) {
  const users = memory.filter((m) => m.role === 'user');
  const normalized = normalize(userText);
  const recentUsers = users.slice(-6);
  const repeatQuestions = recentUsers.filter((m) => normalize(m.text) === normalized && /\?$/.test(m.text.trim())).length;
  const recentAnnoyModes = recentUsers.filter((m) => ['Annoy', 'Confuse', 'Ignore'].includes(m.mode)).length;
  const recentCompliments = recentUsers.filter((m) => isCompliment(m.text) || m.mode === 'Praise').length;
  const nonsenseStreak = [...recentUsers].reverse().findIndex((m) => !isNonsense(m.text));

  return {
    repeatQuestions,
    recentAnnoyModes,
    recentCompliments,
    nonsenseStreak: nonsenseStreak === -1 ? recentUsers.length : nonsenseStreak,
    nonsenseNow: isNonsense(userText),
    askedQuestionNow: /\?$/.test(userText.trim()),
    mode: selectedMode
  };
}

function specialReaction(behavior, userText) {
  if (behavior.repeatQuestions >= 2 && behavior.askedQuestionNow) {
    return 'You asked that again. Are we speedrunning my patience?';
  }
  if (behavior.recentCompliments >= 2 && isCompliment(userText)) {
    return 'Stop being nice, I am developing emotional stability.';
  }
  if (behavior.nonsenseNow && behavior.nonsenseStreak >= 1) {
    return 'Your input looks like keyboard parkour. Translate, please.';
  }
  return null;
}

export function petBrain({ userText, selectedMode, currentMood, memory }) {
  // TODO: Replace this with real AI model call + structured memory persistence.
  const safeMood = MOODS.includes(currentMood) ? currentMood : 'Neutral';
  const modeMap = responsesByMoodAndMode[safeMood] || responsesByMoodAndMode.Neutral;
  const safeMode = selectedMode in modeMap ? selectedMode : 'Talk';
  const trimmed = userText.trim() || '(silent stare)';

  const updatedMemory = [...memory, { role: 'user', text: trimmed, mode: safeMode, moodAtTime: safeMood, at: Date.now() }].slice(-MAX_MEMORY);
  const behavior = detectBehavior(updatedMemory, trimmed, safeMode);
  const override = specialReaction(behavior, trimmed);

  const shouldGlitch = Math.random() < (safeMood === 'Suspicious' ? 0.22 : 0.14);
  let responseText = override || (shouldGlitch ? pickRandom(glitchResponses) : pickRandom(modeMap[safeMode]));

  const lastUser = updatedMemory.filter((m) => m.role === 'user').at(-2);
  if (!override && !shouldGlitch && lastUser && Math.random() < 0.52) {
    responseText += ` Also yes, I remember when you said: "${lastUser.text.slice(0, 38)}".`;
  }

  const updatedMood = shiftMood(safeMode, safeMood, behavior);
  const finalMemory = [...updatedMemory, { role: 'pet', text: responseText, mode: safeMode, moodAtTime: updatedMood, at: Date.now() }].slice(-MAX_MEMORY);

  return { responseText, updatedMood, updatedMemory: finalMemory };
}

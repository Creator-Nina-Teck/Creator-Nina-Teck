const MOOD_EMOJI = {
  Neutral: '😐',
  Happy: '😸',
  Suspicious: '🧐',
  Annoyed: '😤',
  Curious: '👀',
};

export default function PetHeader({ petName, mood, mode }) {
  return (
    <header className="pet-header fade-in">
      <div className="avatar" aria-label="pet avatar">
        <span>{MOOD_EMOJI[mood] || '😐'}</span>
      </div>
      <div className="title-wrap">
        <h1>{petName}</h1>
        <p className="mood">Mood: {mood}</p>
        <p className="mode-label">
          Mode: <strong>{mode}</strong>
        </p>
      </div>
    </header>
  );
}

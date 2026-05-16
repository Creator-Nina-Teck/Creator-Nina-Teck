const MODES = ['Talk', 'Ask', 'Joke', 'Comfort', 'Annoy', 'Confuse', 'Roast', 'Dream'];

export default function ModePad({ selectedMode, onSelect }) {
  return (
    <div className="mode-grid" role="group" aria-label="Interaction modes">
      {MODES.map((mode) => (
        <button
          key={mode}
          className={selectedMode === mode ? 'active' : ''}
          onClick={() => onSelect(mode)}
        >
          {mode}
        </button>
      ))}
    </div>
  );
}

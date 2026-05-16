export default function ChatPanel({ petName, response, input, onInputChange, onSend }) {
  return (
    <>
      <section className="response-box pop-in" aria-live="polite">
        <strong>{petName}:</strong> {response}
      </section>

      <div className="input-row">
        <input
          value={input}
          placeholder={`Say something to ${petName}...`}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSend()}
        />
        <button onClick={onSend}>Send</button>
      </div>
    </>
  );
}

export default function VotePanel({ votes, deviceId, onRemove, onReset }) {
  const grouped = votes.reduce((acc, vote) => {
    if (!acc[vote.user]) acc[vote.user] = []
    acc[vote.user].push(vote)
    return acc
  }, {})

  if (votes.length === 0) return null

  return (
    <aside className="vote-panel">
      <div className="vote-panel-header">
        <h2>Votos ({votes.length})</h2>
        <button className="btn-danger-ghost" onClick={onReset}>
          Reiniciar
        </button>
      </div>
      <div className="vote-panel-list">
        {Object.entries(grouped).map(([user, userVotes]) => (
          <div key={user} className="vote-group">
            <div className="vote-group-name" style={{ '--user-color': userVotes[0].color }}>
              {user} <span className="vote-group-count">{userVotes.length}</span>
            </div>
            {userVotes.map(vote => (
              <div key={vote.id} className="vote-item">
                <span className="vote-coords">
                  {vote.country || `${vote.lat.toFixed(2)}, ${vote.lng.toFixed(2)}`}
                </span>
                {vote.deviceId === deviceId && (
                  <button
                    className="vote-remove"
                    onClick={() => onRemove(vote.id)}
                    title="Eliminar voto"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </aside>
  )
}

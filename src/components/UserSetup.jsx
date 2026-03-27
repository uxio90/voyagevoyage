import { useState } from 'react'

export default function UserSetup({ onSubmit, existingUsers }) {
  const [name, setName] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = name.trim()
    if (trimmed) onSubmit(trimmed)
  }

  return (
    <div className="setup-screen">
      <div className="setup-card">
        <h1>Pito Pito Viajecito</h1>
        <p className="setup-subtitle">Vota el destino que quieras, tienes tres votos.</p>

        <form onSubmit={handleSubmit} className="setup-form">
          <label htmlFor="username">¿Cómo te llamas?</label>
          <input
            id="username"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Tu nombre"
            autoFocus
            maxLength={30}
          />
          <button type="submit" disabled={!name.trim()}>
            Entrar al mapa
          </button>
        </form>

        {existingUsers.length > 0 && (
          <div className="existing-users">
            <p>Usuarios que ya votaron:</p>
            <div className="user-list">
              {existingUsers.map(user => (
                <button
                  key={user}
                  className="user-chip"
                  onClick={() => onSubmit(user)}
                >
                  {user}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

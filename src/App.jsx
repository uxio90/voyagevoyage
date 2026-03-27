import { useState, useEffect } from 'react'
import MapView from './components/MapView'
import UserSetup from './components/UserSetup'
import VotePanel from './components/VotePanel'
import './App.css'

const MAX_VOTES_PER_USER = 3
const STORAGE_KEY = 'voyagevoyage_votes'

function loadVotes() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []
  } catch {
    return []
  }
}

function saveVotes(votes) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(votes))
}

function playFart() {
  const audio = new Audio('/fart.webm')
  audio.play()
}

export default function App() {
  const [username, setUsername] = useState('')
  const [votes, setVotes] = useState(loadVotes)

  useEffect(() => {
    saveVotes(votes)
  }, [votes])

  const [toast, setToast] = useState('')
  const userVoteCount = votes.filter(v => v.user === username).length
  const canVote = userVoteCount < MAX_VOTES_PER_USER

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  function handleMapClick(lat, lng, country, countryCode) {
    if (!canVote) return
    const alreadyTaken = votes.some(v => v.countryCode?.toLowerCase() === countryCode.toLowerCase())
    if (alreadyTaken) {
      const taker = votes.find(v => v.countryCode?.toLowerCase() === countryCode.toLowerCase())
      showToast(`${country} ya fue votado por ${taker.user}`)
      return
    }
    if (['es', 'pt'].includes(countryCode.toLowerCase())) {
      playFart()
      showToast(`🚫 ${country} no cuenta 💨`)
      return
    }

    const newVote = {
      id: Date.now(),
      user: username,
      lat,
      lng,
      country,
      countryCode,
      color: getUserColor(username),
    }
    setVotes(prev => [...prev, newVote])
  }

  function handleRemoveVote(id) {
    const vote = votes.find(v => v.id === id)
    if (vote?.user !== username) return
    setVotes(prev => prev.filter(v => v.id !== id))
  }

  function handleReset() {
    if (confirm('¿Borrar todos los votos? Esta acción no se puede deshacer.')) {
      setVotes([])
    }
  }

  if (!username) {
    return <UserSetup onSubmit={setUsername} existingUsers={[...new Set(votes.map(v => v.user))]} />
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Pito Pito Viajecito</h1>
        <div className="header-meta">
          <span className="user-badge" style={{ '--user-color': getUserColor(username) }}>
            {username}
          </span>
          <span className="vote-count">
            {userVoteCount}/{MAX_VOTES_PER_USER} votos
          </span>
          <button className="btn-ghost" onClick={() => setUsername('')}>
            Cambiar usuario
          </button>
        </div>
      </header>

      <main className="app-main">
        <MapView
          votes={votes}
          onMapClick={handleMapClick}
          canVote={canVote}
        />
        <VotePanel
          votes={votes}
          username={username}
          onRemove={handleRemoveVote}
          onReset={handleReset}
        />
      </main>

      {!canVote && (
        <div className="toast">Ya usaste tus {MAX_VOTES_PER_USER} votos.</div>
      )}
      {toast && (
        <div className="toast toast-warning">{toast}</div>
      )}
    </div>
  )
}

const COLORS = [
  '#e63946', '#2a9d8f', '#f4a261', '#457b9d',
  '#8338ec', '#fb5607', '#06d6a0', '#118ab2',
]

const colorCache = {}

export function getUserColor(name) {
  if (!colorCache[name]) {
    const index = Object.keys(colorCache).length % COLORS.length
    colorCache[name] = COLORS[index]
  }
  return colorCache[name]
}

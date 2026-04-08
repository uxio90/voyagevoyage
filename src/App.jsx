import { useState, useEffect } from 'react'
import MapView from './components/MapView'
import UserSetup from './components/UserSetup'
import VotePanel from './components/VotePanel'
import { supabase } from './lib/supabase'
import './App.css'

const MAX_VOTES_PER_DEVICE = 3
const DEVICE_ID_KEY = 'voyagevoyage_device_id'

function getDeviceId() {
  let id = localStorage.getItem(DEVICE_ID_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(DEVICE_ID_KEY, id)
  }
  return id
}

function mapRow(row) {
  return {
    id: row.id,
    user: row.user_name,
    deviceId: row.device_id,
    lat: row.lat,
    lng: row.lng,
    country: row.country,
    countryCode: row.country_code,
    color: row.color,
  }
}

function playFart() {
  const audio = new Audio('/fart.webm')
  audio.play()
}

export default function App() {
  const [username, setUsername] = useState('')
  const [votes, setVotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')

  const deviceId = getDeviceId()
  const myVoteCount = votes.filter(v => v.deviceId === deviceId).length
  const canVote = myVoteCount < MAX_VOTES_PER_DEVICE

  // Load votes + subscribe to realtime
  useEffect(() => {
    supabase
      .from('votes')
      .select('*')
      .then(({ data, error }) => {
        if (!error && data) setVotes(data.map(mapRow))
        setLoading(false)
      })

    const channel = supabase
      .channel('votes-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'votes' },
        ({ new: row }) => setVotes(prev => [...prev, mapRow(row)])
      )
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'votes' },
        ({ old: row }) => setVotes(prev => prev.filter(v => v.id !== row.id))
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  async function handleMapClick(lat, lng, country, countryCode) {
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

    const { error } = await supabase.from('votes').insert({
      user_name: username,
      device_id: deviceId,
      lat,
      lng,
      country,
      country_code: countryCode,
      color: getUserColor(username),
    })

    if (error) showToast('Error al guardar el voto')
  }

  async function handleRemoveVote(id) {
    const vote = votes.find(v => v.id === id)
    if (vote?.deviceId !== deviceId) return
    const { error } = await supabase.from('votes').delete().eq('id', id)
    if (error) showToast('Error al eliminar el voto')
  }

  async function handleReset() {
    if (confirm('¿Borrar todos los votos? Esta acción no se puede deshacer.')) {
      const { error } = await supabase.from('votes').delete().gt('id', 0)
      if (error) showToast('Error al reiniciar')
    }
  }

  if (!username) {
    return (
      <UserSetup
        onSubmit={setUsername}
        existingUsers={[...new Set(votes.map(v => v.user))]}
        loading={loading}
      />
    )
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Pito Pito Viajecito</h1>
        <div className="header-meta">
          <span className="user-badge" style={{ '--user-color': getUserColor(username) }}>
            {username} · {myVoteCount}/{MAX_VOTES_PER_DEVICE}
          </span>
          <span className="vote-count">votos</span>
          <button className="btn-ghost" onClick={() => setUsername('')}>
            Cambiar usuario
          </button>
        </div>
      </header>

      <main className="app-main">
        <MapView votes={votes} onMapClick={handleMapClick} canVote={canVote} />
        <VotePanel
          votes={votes}
          deviceId={deviceId}
          onRemove={handleRemoveVote}
          onReset={handleReset}
        />
      </main>

      {!canVote && <div className="toast">Ya usaste tus {MAX_VOTES_PER_DEVICE} votos.</div>}
      {toast && <div className="toast toast-warning">{toast}</div>}
    </div>
  )
}

const COLORS = [
  '#e63946', '#2a9d8f', '#f4a261', '#457b9d',
  '#8338ec', '#fb5607', '#06d6a0', '#118ab2',
]

export function getUserColor(name) {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return COLORS[Math.abs(hash) % COLORS.length]
}

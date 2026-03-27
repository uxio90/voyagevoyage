import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

function createUserIcon(color, label) {
  return L.divIcon({
    className: '',
    html: `
      <div class="map-marker" style="--marker-color: ${color}">
        <div class="marker-dot"></div>
        <div class="marker-label">${label}</div>
      </div>
    `,
    iconAnchor: [12, 12],
    popupAnchor: [0, -16],
  })
}

const WORLD_BOUNDS = [[-75, -180], [85, 180]]

function FitWorld() {
  const map = useMap()

  useEffect(() => {
    const fit = () => {
      map.invalidateSize()
      map.fitBounds(WORLD_BOUNDS, { animate: false })
    }
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [map])

  return null
}

function ClickHandler({ onMapClick, canVote }) {
  const [loading, setLoading] = useState(false)

  useMapEvents({
    async click(e) {
      if (!canVote || loading) return
      setLoading(true)
      try {
        const { lat, lng } = e.latlng
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
          { headers: { 'Accept-Language': 'es' } }
        )
        const data = await res.json()
        const country = data.address?.country
        const countryCode = data.address?.country_code
        if (country && countryCode) {
          onMapClick(lat, lng, country, countryCode)
        }
      } catch {
        // océano o error — ignorar
      } finally {
        setLoading(false)
      }
    },
  })

  if (loading) return <div className="map-loading-hint">Detectando país...</div>
  return null
}

export default function MapView({ votes, onMapClick, canVote }) {
  return (
    <div className={`map-wrapper ${canVote ? 'can-vote' : 'no-votes'}`}>
      {canVote && <div className="map-hint">Haz clic en el mapa para votar un destino</div>}
      <MapContainer
        center={[20, 0]}
        zoom={2}
        style={{ height: '100%', width: '100%' }}
        maxBounds={WORLD_BOUNDS}
        maxBoundsViscosity={1.0}
        zoomSnap={0.1}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          noWrap={true}
        />
        <FitWorld />
        <ClickHandler onMapClick={onMapClick} canVote={canVote} />
        {votes.map(vote => (
          <Marker
            key={vote.id}
            position={[vote.lat, vote.lng]}
            icon={createUserIcon(vote.color, vote.user[0].toUpperCase())}
          >
            <Popup>
              <strong>{vote.country}</strong>
              <br />
              Votado por {vote.user}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}

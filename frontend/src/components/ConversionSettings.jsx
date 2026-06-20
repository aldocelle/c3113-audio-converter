import React from 'react'

const FORMATS = ['mp3', 'wav', 'flac', 'ogg', 'm4a']
const BITRATES = ['64k', '128k', '192k', '256k', '320k']
const SAMPLE_RATES = ['22050', '44100', '48000', '96000']
const CHANNELS = [
  { label: 'Mono', value: '1' },
  { label: 'Stereo', value: '2' },
]

const selectStyle = {
  background: 'var(--bg)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  color: 'var(--text)',
  padding: '8px 12px',
  width: '100%',
  fontSize: 14,
  outline: 'none',
}

const labelStyle = {
  display: 'block',
  color: 'var(--text-muted)',
  fontSize: 12,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginBottom: 6,
}

export default function ConversionSettings({ settings, onChange }) {
  const set = (key) => (e) => onChange({ ...settings, [key]: e.target.value })

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
      gap: 16,
    }}>
      <div>
        <label style={labelStyle}>Format</label>
        <select style={selectStyle} value={settings.format} onChange={set('format')}>
          {FORMATS.map((f) => <option key={f}>{f}</option>)}
        </select>
      </div>
      <div>
        <label style={labelStyle}>Bitrate</label>
        <select style={selectStyle} value={settings.bitrate} onChange={set('bitrate')}>
          {BITRATES.map((b) => <option key={b}>{b}</option>)}
        </select>
      </div>
      <div>
        <label style={labelStyle}>Sample Rate</label>
        <select style={selectStyle} value={settings.sampleRate} onChange={set('sampleRate')}>
          {SAMPLE_RATES.map((r) => <option key={r} value={r}>{r} Hz</option>)}
        </select>
      </div>
      <div>
        <label style={labelStyle}>Channels</label>
        <select style={selectStyle} value={settings.channels} onChange={set('channels')}>
          {CHANNELS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>
    </div>
  )
}

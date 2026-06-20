import React from 'react'

const FORMATS = ['mp3', 'wav', 'flac', 'ogg', 'm4a']
const BITRATES = ['64k', '128k', '192k', '256k', '320k']
const SAMPLE_RATES = ['22050', '44100', '48000', '96000']

// Sample rates each format supports (mirrors backend SUPPORTED_SAMPLE_RATES).
// MP3 (libmp3lame) cannot encode 96 kHz; all others can.
const RATES_BY_FORMAT = {
  mp3: ['22050', '44100', '48000'],
  m4a: ['22050', '44100', '48000', '96000'],
  wav: ['22050', '44100', '48000', '96000'],
  flac: ['22050', '44100', '48000', '96000'],
  ogg: ['22050', '44100', '48000', '96000'],
}
export const rateAllowed = (format, rate) =>
  (RATES_BY_FORMAT[format] || SAMPLE_RATES).includes(rate)
const CHANNELS = [
  { label: 'Mono', value: '1' },
  { label: 'Stereo', value: '2' },
]

// contextual hint shown under each control (color + text)
const BITRATE_HINT = {
  '64k': ['var(--text-muted)', 'Compact'],
  '128k': ['var(--text-muted)', 'Standard'],
  '192k': ['var(--accent-2)', 'High quality'],
  '256k': ['var(--accent-2)', 'Very high'],
  '320k': ['var(--success)', 'Maximum'],
}
const RATE_HINT = {
  '22050': ['var(--text-muted)', 'Voice'],
  '44100': ['var(--accent-2)', 'CD Quality'],
  '48000': ['var(--accent-2)', 'Studio'],
  '96000': ['var(--success)', 'Hi-Res'],
}

const ICONS = {
  format: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6',
  bitrate: 'M4 12h2v6H4z M9 6h2v12H9z M14 9h2v9h-2z M19 4h2v14h-2z',
  rate: 'M3 12h4l3 8 4-16 3 8h4',
  channels: 'M11 5L6 9H2v6h4l5 4V5z M15.5 8.5a5 5 0 010 7',
}

function Icon({ d }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="var(--accent-2)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  )
}

const selectStyle = {
  background: 'var(--bg-2)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  color: 'var(--text)',
  padding: '9px 30px 9px 12px',
  width: '100%',
  fontSize: 14,
  outline: 'none',
}

const labelStyle = {
  display: 'flex', alignItems: 'center', gap: 7,
  color: 'var(--text-muted)',
  fontSize: 11,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  marginBottom: 10,
}

function Hint({ color, text }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, display: 'inline-block' }} />
      <span style={{ fontSize: 11, color }}>{text}</span>
    </div>
  )
}

function Card({ children }) {
  return (
    <div style={{
      background: 'var(--surface-2)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-sm)',
      padding: 14,
    }}>{children}</div>
  )
}

export default function ConversionSettings({ settings, onChange }) {
  const set = (key) => (e) => {
    const next = { ...settings, [key]: e.target.value }
    // If the new format can't do the current sample rate, snap to 48000.
    if (key === 'format' && !rateAllowed(next.format, next.sampleRate)) {
      next.sampleRate = '48000'
    }
    onChange(next)
  }

  const [brColor, brText] = BITRATE_HINT[settings.bitrate] || ['var(--text-muted)', '']
  const [srColor, srText] = RATE_HINT[settings.sampleRate] || ['var(--text-muted)', '']
  const chHint = settings.channels === '2'
    ? ['var(--accent-2)', 'Stereo'] : ['var(--text-muted)', 'Mono']

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
      gap: 14,
    }}>
      <Card>
        <label style={labelStyle}><Icon d={ICONS.format} /> Format</label>
        <select style={selectStyle} value={settings.format} onChange={set('format')}>
          {FORMATS.map((f) => <option key={f} value={f}>{f.toUpperCase()}</option>)}
        </select>
        <Hint color="var(--accent-2)" text="Popular" />
      </Card>

      <Card>
        <label style={labelStyle}><Icon d={ICONS.bitrate} /> Bitrate</label>
        <select style={selectStyle} value={settings.bitrate} onChange={set('bitrate')}>
          {BITRATES.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
        <Hint color={brColor} text={brText} />
      </Card>

      <Card>
        <label style={labelStyle}><Icon d={ICONS.rate} /> Sample Rate</label>
        <select style={selectStyle} value={settings.sampleRate} onChange={set('sampleRate')}>
          {SAMPLE_RATES.map((r) => {
            const disabled = !rateAllowed(settings.format, r)
            return (
              <option key={r} value={r} disabled={disabled}>
                {r} Hz{disabled ? ` — n/a for ${settings.format.toUpperCase()}` : ''}
              </option>
            )
          })}
        </select>
        <Hint color={srColor} text={srText} />
      </Card>

      <Card>
        <label style={labelStyle}><Icon d={ICONS.channels} /> Channels</label>
        <select style={selectStyle} value={settings.channels} onChange={set('channels')}>
          {CHANNELS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <Hint color={chHint[0]} text={chHint[1]} />
      </Card>
    </div>
  )
}

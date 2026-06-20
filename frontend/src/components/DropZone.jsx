import React, { useRef, useState } from 'react'

const ACCEPTED_EXT = ['.mp3', '.wav', '.flac', '.ogg', '.m4a', '.aac']

export default function DropZone({ onFiles }) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef(null)

  const validate = (files) =>
    Array.from(files).filter((f) =>
      ACCEPTED_EXT.includes('.' + f.name.split('.').pop().toLowerCase())
    )

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const valid = validate(e.dataTransfer.files)
    if (valid.length) onFiles(valid)
  }

  const handleChange = (e) => {
    const valid = validate(e.target.files)
    if (valid.length) onFiles(valid)
    e.target.value = ''
  }

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      style={{
        position: 'relative',
        border: `1.5px dashed ${dragging ? 'var(--accent)' : 'var(--border-glow)'}`,
        borderRadius: 18,
        padding: '52px 24px',
        textAlign: 'center',
        background: dragging
          ? 'rgba(124,92,255,0.08)'
          : 'linear-gradient(180deg, rgba(124,92,255,0.04), rgba(124,92,255,0.01))',
        cursor: 'pointer',
        transition: 'border-color 0.2s, background 0.2s',
      }}
    >
      {/* glowing circular music-note icon */}
      <div style={{
        width: 72, height: 72, margin: '0 auto 20px',
        borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'radial-gradient(circle at 30% 30%, rgba(124,92,255,0.30), rgba(124,92,255,0.08))',
        border: '1px solid rgba(124,92,255,0.4)',
        animation: 'glowPulse 3s ease-in-out infinite',
      }}>
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="var(--accent-2)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18V5l12-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="16" r="3" />
        </svg>
      </div>

      <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>
        Drop audio files here
      </div>
      <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>
        or click to{' '}
        <span style={{ color: 'var(--accent-2)', fontWeight: 600 }}>browse</span>
        {' '}— {ACCEPTED_EXT.join(', ')}
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPTED_EXT.join(',')}
        style={{ display: 'none' }}
        onChange={handleChange}
      />
    </div>
  )
}

import React, { useRef, useState } from 'react'

const ACCEPTED_TYPES = ['audio/mpeg', 'audio/wav', 'audio/flac', 'audio/ogg', 'audio/mp4', 'audio/x-m4a']
const ACCEPTED_EXT = ['.mp3', '.wav', '.flac', '.ogg', '.m4a', '.aac']

export default function DropZone({ onFiles }) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef(null)

  const validate = (files) => {
    return Array.from(files).filter((f) => {
      const ext = '.' + f.name.split('.').pop().toLowerCase()
      return ACCEPTED_EXT.includes(ext)
    })
  }

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
      style={{
        border: `2px dashed ${dragging ? 'var(--accent)' : 'var(--border)'}`,
        borderRadius: 'var(--radius)',
        padding: '48px 24px',
        textAlign: 'center',
        background: dragging ? 'rgba(108,71,255,0.06)' : 'var(--surface)',
        cursor: 'pointer',
        transition: 'border-color 0.15s, background 0.15s',
      }}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      <div style={{ fontSize: 32, marginBottom: 12 }}>🎵</div>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>
        Drop audio files here
      </div>
      <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
        or click to browse — {ACCEPTED_EXT.join(', ')}
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

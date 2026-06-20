import React from 'react'

const formatSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function FileList({ files, onRemove }) {
  if (!files.length) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {files.map((f, i) => (
        <div key={i} style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '10px 14px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <span style={{ fontSize: 18 }}>🎧</span>
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontWeight: 500,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: 280,
              }}>{f.name}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{formatSize(f.size)}</div>
            </div>
          </div>
          <button
            onClick={() => onRemove(i)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: 18,
              padding: '0 4px',
              lineHeight: 1,
              flexShrink: 0,
            }}
            title="Remove"
          >×</button>
        </div>
      ))}
    </div>
  )
}

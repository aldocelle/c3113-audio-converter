import React from 'react'
import { downloadUrl } from '../services/api'

const STATUS_META = {
  pending:    { label: 'Queued',     color: 'var(--text-muted)', icon: '○' },
  processing: { label: 'Converting', color: 'var(--warning)',    icon: '◌' },
  completed:  { label: 'Done',       color: 'var(--success)',    icon: '●' },
  failed:     { label: 'Failed',     color: 'var(--error)',      icon: '✕' },
}

export default function ResultsList({ batch, idToName, format }) {
  const jobs = batch.jobs || []
  const done = batch.completed_count ?? 0
  const failed = batch.failed_count ?? 0
  const total = batch.total_files ?? jobs.length
  // Bar reflects everything that reached a terminal state, and is forced
  // to 100% once the batch itself is terminal (avoids a stuck-looking bar).
  const terminal = batch.status === 'completed' || batch.status === 'failed' || batch.status === 'partial_failure'
  const pct = terminal ? 100 : (total ? ((done + failed) / total) * 100 : 0)

  return (
    <div>
      {/* Batch summary + progress bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 12,
      }}>
        <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>
          {done}/{total} converted
        </span>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'capitalize' }}>
          {batch.status.replace('_', ' ')}
        </span>
      </div>
      <div style={{
        height: 6, background: 'var(--border)', borderRadius: 3,
        overflow: 'hidden', marginBottom: 16,
      }}>
        <div style={{
          width: `${pct}%`,
          height: '100%',
          background: failed > 0 ? 'var(--warning)' : 'var(--success)',
          transition: 'width 0.3s',
        }} />
      </div>

      {/* Per-file rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {jobs.map((job) => {
          const meta = STATUS_META[job.status] || STATUS_META.pending
          const name = idToName[job.file_id] || job.file_id
          const outName = name.replace(/\.[^.]+$/, '') + '.' + format
          return (
            <div key={job.job_id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', padding: '10px 14px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                <span style={{ color: meta.color, fontSize: 14 }}>{meta.icon}</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{
                    fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap', maxWidth: 320,
                  }}>{name}</div>
                  <div style={{ color: meta.color, fontSize: 12 }}>{meta.label}</div>
                </div>
              </div>

              {job.status === 'completed' ? (
                <a
                  href={downloadUrl(job.job_id)}
                  download={outName}
                  style={{
                    flexShrink: 0,
                    background: 'var(--accent)', color: '#fff',
                    textDecoration: 'none', fontSize: 13, fontWeight: 600,
                    padding: '6px 14px', borderRadius: 'var(--radius)',
                  }}
                >
                  Download
                </a>
              ) : (
                <span style={{ flexShrink: 0, fontSize: 12, color: 'var(--text-muted)' }}>
                  {job.status === 'failed' ? '—' : '…'}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

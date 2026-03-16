import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import { useWebSocket } from '@/hooks/useWebSocket'
import { fetchSignal, updateSignal, fetchNearMissByLeg } from '@/services/api'
import {
  getSignalConfig,
  saveSignalConfig,
  firebaseReady,
  getNearMissByLeg,
  seedNearMissIfEmpty,
  defaultNearMissByLeg,
  getTrafficLightConfig,
  saveTrafficLightConfig,
  defaultTrafficLightConfig,
  getSearchParams,
  saveSearchParams,
  type NearMissByLegData,
  type TrafficLightConfigData,
} from '@/services/firestore'
import type { TrafficSignal } from '@/types'

const LEG_ORDER = ['nLeg', 'sLeg', 'eLeg', 'wLeg'] as const
const LEG_LABELS: Record<(typeof LEG_ORDER)[number], string> = {
  nLeg: 'NLeg',
  sLeg: 'SLeg',
  eLeg: 'ELeg',
  wLeg: 'WLeg',
}
const COLUMNS: (keyof NearMissByLegData['nLeg'])[] = [
  'allRoadUsers',
  'onlyVehicles',
  'bicycleInvolved',
  'pedestrianInvolved',
]
const COLUMN_LABELS: Record<(typeof COLUMNS)[number], string> = {
  allRoadUsers: 'All road users',
  onlyVehicles: 'Only vehicles',
  bicycleInvolved: 'Bicycle involved',
  pedestrianInvolved: 'Pedestrian involved',
}

function getRiskClass(value: number): string {
  if (value === 0) return 'risk-none'
  if (value <= 3) return 'risk-safe'
  if (value <= 6) return 'risk-low'
  if (value <= 9) return 'risk-moderate'
  return 'risk-high'
}

/** Compare table data (Search Results) — includes High Risk, Moderate, Low, Safe and zero */
function getCompareTableData(): NearMissByLegData {
  return {
    dateTimeRange: '24 Feb, 12:00 AM - 24 Feb, 11:59 PM',
    nLeg: { allRoadUsers: 12, onlyVehicles: 8, bicycleInvolved: 2, pedestrianInvolved: 2 },
    sLeg: { allRoadUsers: 7, onlyVehicles: 4, bicycleInvolved: 1, pedestrianInvolved: 2 },
    eLeg: { allRoadUsers: 2, onlyVehicles: 1, bicycleInvolved: 0, pedestrianInvolved: 1 },
    wLeg: { allRoadUsers: 0, onlyVehicles: 0, bicycleInvolved: 0, pedestrianInvolved: 0 },
  }
}

const CYCLE_DRAFTS_KEY = 'traffic-signal-cycle-drafts'

function loadCycleDrafts(): Record<string, { cycleSeconds: number; signalName: string; deviceId: string; updatedAt: string }> {
  try {
    const raw = localStorage.getItem(CYCLE_DRAFTS_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveCycleDraftLocal(signalId: string, data: { cycleSeconds: number; signalName: string; deviceId: string }) {
  const drafts = loadCycleDrafts()
  drafts[signalId] = { ...data, updatedAt: new Date().toISOString() }
  localStorage.setItem(CYCLE_DRAFTS_KEY, JSON.stringify(drafts, null, 2))
}

async function loadCycleForSignal(signalId: string): Promise<number | null> {
  if (firebaseReady) {
    const config = await getSignalConfig(signalId)
    if (config?.cycleSeconds != null) return config.cycleSeconds
  }
  const drafts = loadCycleDrafts()
  const saved = drafts[signalId]
  return saved?.cycleSeconds ?? null
}

async function persistCycle(signalId: string, data: { cycleSeconds: number; signalName: string; deviceId: string }) {
  if (firebaseReady) {
    await saveSignalConfig(signalId, data)
    return
  }
  saveCycleDraftLocal(signalId, data)
}

export function SignalDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [signal, setSignal] = useState<TrafficSignal | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [cycleSeconds, setCycleSeconds] = useState(90)
  const [nearMissData, setNearMissData] = useState<NearMissByLegData | null>(null)
  const pageContentRef = useRef<HTMLDivElement>(null)
  const { lastMessage } = useWebSocket('/device-status/')

  const defaultSearchDates = () => ({
    timeFrom: new Date(2026, 2, 14, 0, 0),
    timeTo: new Date(2026, 2, 14, 23, 59),
    compareFrom: new Date(2026, 2, 14, 0, 0),
    compareTo: new Date(2026, 2, 14, 23, 59),
  })
  const [timeFrom, setTimeFrom] = useState<Date>(() => defaultSearchDates().timeFrom)
  const [timeTo, setTimeTo] = useState<Date>(() => defaultSearchDates().timeTo)
  const [compareFrom, setCompareFrom] = useState<Date>(() => defaultSearchDates().compareFrom)
  const [compareTo, setCompareTo] = useState<Date>(() => defaultSearchDates().compareTo)
  const searchParamsLoadedRef = useRef(false)

  const [trafficLightConfig, setTrafficLightConfig] = useState<TrafficLightConfigData>(() => defaultTrafficLightConfig())
  const [savingTrafficLight, setSavingTrafficLight] = useState(false)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    fetchSignal(id)
      .then((res) => {
        const s = res as TrafficSignal
        if (!cancelled) setSignal(s)
        return loadCycleForSignal(id).then((saved) => {
          if (!cancelled) {
            const base = (res as TrafficSignal).cycleSeconds ?? 90
            setCycleSeconds(saved ?? base)
          }
        })
      })
      .catch(() => {
        if (!cancelled) setSignal(MOCK(id))
        return loadCycleForSignal(id).then((saved) => {
          if (!cancelled) setCycleSeconds(saved ?? 90)
        })
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [id])

  useEffect(() => {
    if (lastMessage && signal && lastMessage.deviceId === signal.deviceId) {
      setSignal((prev) => prev ? { ...prev, status: lastMessage.status, phase: lastMessage.phase ?? prev.phase } : null)
    }
  }, [lastMessage, signal])

  useEffect(() => {
    if (!id) return
    let cancelled = false
    async function load() {
      try {
        const data = await fetchNearMissByLeg(id)
        if (cancelled) return
        if (data) {
          setNearMissData(data)
          return
        }
      } catch {
        /* ignore, fallback below */
      }
      if (firebaseReady) {
        getNearMissByLeg(id)
          .then((data) => {
            if (cancelled) return
            if (data) return setNearMissData(data)
            return seedNearMissIfEmpty(id).then((seeded) => {
              if (!cancelled) setNearMissData(seeded)
            })
          })
          .catch(() => {
            if (!cancelled) setNearMissData(defaultNearMissByLeg())
          })
      } else {
        setNearMissData(defaultNearMissByLeg())
      }
    }
    load()
    return () => { cancelled = true }
  }, [id])

  useEffect(() => {
    if (!id) return
    let cancelled = false
    if (firebaseReady) {
      getTrafficLightConfig(id)
        .then((data) => {
          if (!cancelled && data) setTrafficLightConfig(data)
        })
        .catch(() => {
          if (!cancelled) loadTrafficLightFallback(id)
        })
    } else {
      loadTrafficLightFallback(id)
    }
    return () => { cancelled = true }
  }, [id])

  useEffect(() => {
    if (!id) return
    let cancelled = false
    searchParamsLoadedRef.current = false
    function applySaved(data: { timeFrom: string; timeTo: string; compareFrom: string; compareTo: string }) {
      if (cancelled) return
      setTimeFrom(new Date(data.timeFrom))
      setTimeTo(new Date(data.timeTo))
      setCompareFrom(new Date(data.compareFrom))
      setCompareTo(new Date(data.compareTo))
      searchParamsLoadedRef.current = true
    }
    if (firebaseReady) {
      getSearchParams(id)
        .then((data) => {
          if (data) applySaved(data)
          else loadSearchParamsFallback(id, applySaved)
        })
        .catch(() => loadSearchParamsFallback(id, applySaved))
    } else {
      loadSearchParamsFallback(id, applySaved)
    }
    return () => { cancelled = true }
  }, [id])

  function loadSearchParamsFallback(
    signalId: string,
    apply: (data: { timeFrom: string; timeTo: string; compareFrom: string; compareTo: string }) => void
  ) {
    try {
      const raw = localStorage.getItem(`search-params-${signalId}`)
      if (raw) {
        const parsed = JSON.parse(raw) as { timeFrom: string; timeTo: string; compareFrom: string; compareTo: string }
        if (parsed.timeFrom && parsed.timeTo && parsed.compareFrom && parsed.compareTo) apply(parsed)
        else searchParamsLoadedRef.current = true
      } else {
        searchParamsLoadedRef.current = true
      }
    } catch {
      searchParamsLoadedRef.current = true
    }
  }

  useEffect(() => {
    if (!id || !searchParamsLoadedRef.current) return
    const payload = {
      timeFrom: timeFrom.toISOString(),
      timeTo: timeTo.toISOString(),
      compareFrom: compareFrom.toISOString(),
      compareTo: compareTo.toISOString(),
    }
    if (firebaseReady) {
      saveSearchParams(id, payload).catch(() => {})
    } else {
      try {
        localStorage.setItem(`search-params-${id}`, JSON.stringify(payload))
      } catch {
        /* ignore */
      }
    }
  }, [id, timeFrom, timeTo, compareFrom, compareTo])

  function loadTrafficLightFallback(signalId: string) {
    try {
      const raw = localStorage.getItem(`traffic-light-config-${signalId}`)
      if (raw) {
        const parsed = JSON.parse(raw) as TrafficLightConfigData
        if (parsed.nLeg && parsed.sLeg && parsed.eLeg && parsed.wLeg) setTrafficLightConfig(parsed)
        else setTrafficLightConfig(defaultTrafficLightConfig())
      } else {
        setTrafficLightConfig(defaultTrafficLightConfig())
      }
    } catch {
      setTrafficLightConfig(defaultTrafficLightConfig())
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!id || saving || !signal) return
    setSaving(true)
    try {
      const updated = await updateSignal(id, { cycle_seconds: cycleSeconds }) as TrafficSignal & { cycle_seconds?: number }
      setSignal({
        ...updated,
        cycleSeconds: updated.cycleSeconds ?? updated.cycle_seconds ?? cycleSeconds,
      })
      if (firebaseReady) {
        await saveSignalConfig(id, {
          cycleSeconds,
          signalName: signal.name,
          deviceId: signal.deviceId,
        })
      }
      setShowToast(true)
      setTimeout(() => setShowToast(false), 3000)
    } catch {
      setSignal((prev) => prev ? { ...prev, cycleSeconds } : null)
      if (firebaseReady) {
        await saveSignalConfig(id, {
          cycleSeconds,
          signalName: signal.name,
          deviceId: signal.deviceId,
        }).catch(() => {})
      }
      setShowToast(true)
      setTimeout(() => setShowToast(false), 3000)
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveTrafficLight(e: React.FormEvent) {
    e.preventDefault()
    if (!id || savingTrafficLight) return
    setSavingTrafficLight(true)
    try {
      if (firebaseReady) {
        await saveTrafficLightConfig(id, trafficLightConfig)
      } else {
        try {
          localStorage.setItem(
            `traffic-light-config-${id}`,
            JSON.stringify({ ...trafficLightConfig, updatedAt: new Date().toISOString() })
          )
        } catch {
          /* ignore */
        }
      }
      setShowToast(true)
      setTimeout(() => setShowToast(false), 3000)
    } finally {
      setSavingTrafficLight(false)
    }
  }

  function setTrafficLightPhase(
    leg: (typeof LEG_ORDER)[number],
    phase: keyof TrafficLightConfigData['nLeg'],
    value: number
  ) {
    setTrafficLightConfig((prev) => ({
      ...prev,
      [leg]: { ...prev[leg], [phase]: value },
    }))
  }

  async function handleDownloadPdf() {
    if (!pageContentRef.current) return
    try {
      const canvas = await html2canvas(pageContentRef.current, {
        scale: 1,
        useCORS: true,
        allowTaint: true,
        logging: false,
        imageTimeout: 0,
      })
      const imgData = canvas.toDataURL('image/jpeg', 0.92)
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'mm',
        format: 'a4',
      })
      const pdfW = pdf.internal.pageSize.getWidth()
      const pdfH = pdf.internal.pageSize.getHeight()
      const scale = Math.min(pdfW / canvas.width, pdfH / canvas.height)
      const w = canvas.width * scale
      const h = canvas.height * scale
      pdf.addImage(imgData, 'JPEG', 0, 0, w, h)
      pdf.save(`signal-${id ?? 'page'}-${new Date().toISOString().slice(0, 10)}.pdf`)
    } catch (e) {
      console.error('PDF export failed', e)
      window.print()
    }
  }

  function handleDownloadCsv() {
    const cols = COLUMNS.map((c) => COLUMN_LABELS[c])
    const header = ['Leg', ...cols].join(',')

    const rowsToCsv = (data: NearMissByLegData, sectionName: string): string[] => {
      const lines = [`Section,${sectionName}`, `Date range,${data.dateTimeRange ?? ''}`, '', header]
      LEG_ORDER.forEach((leg) => {
        const row = [LEG_LABELS[leg], ...COLUMNS.map((c) => String(data[leg][c]))]
        lines.push(row.join(','))
      })
      return lines
    }

    const lines: string[] = []
    if (nearMissData) {
      lines.push(...rowsToCsv(nearMissData, 'Search Results - Near-Miss Events by leg'), '')
    }
    lines.push(...rowsToCsv(getCompareTableData(), 'Compare to - Near-Miss Events by leg'))

    const csv = lines.join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `near-miss-tables-${id ?? 'export'}-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!id) return null
  if (loading) return <p data-testid="signal-detail-loading">Loading…</p>
  if (!signal) return <p>Signal not found.</p>

  const intersectionImageUrl = '/city-intersection.png'

  return (
    <div className="signal-detail" data-testid="signal-detail-page">
      <div className="signal-detail-pdf-content" ref={pageContentRef}>
      {showToast && (
        <div className="toast toast-success" role="status" data-testid="toast">
          Successful
        </div>
      )}
      <button type="button" className="back" onClick={() => navigate('/signals')}>← Back</button>
      <h1 data-testid="signal-name">{signal.name}</h1>
      <p data-testid="signal-status">Status: {signal.status} — Phase: {signal.phase}</p>

      <div className="signal-detail-image-and-params">
        <figure className="signal-intersection-image">
          <img
            src={intersectionImageUrl}
            alt="Traffic intersection in the United States"
            width={800}
            height={450}
          />
        </figure>
        <div className="search-params-panel">
          <div className="search-params-title">Search parameters</div>
          <div className="search-params-body search-params-body-aligned">
            <div className="search-params-block search-params-block-half">
              <span className="search-params-label">Time range</span>
              <div className="search-params-date-row">
                <div className="search-params-date-group">
                  <label className="search-params-field-label">From:</label>
                  <div className="search-params-date-time-split">
                    <DatePicker
                      selected={timeFrom}
                      onChange={(d) => d && setTimeFrom(new Date(d.getFullYear(), d.getMonth(), d.getDate(), timeFrom.getHours(), timeFrom.getMinutes()))}
                      dateFormat="dd/MM/yyyy"
                      className="search-params-input search-params-date-only"
                      placeholderText="Date"
                    />
                    <DatePicker
                      selected={timeFrom}
                      onChange={(d) => d && setTimeFrom(new Date(timeFrom.getFullYear(), timeFrom.getMonth(), timeFrom.getDate(), d.getHours(), d.getMinutes()))}
                      showTimeSelectOnly
                      timeIntervals={15}
                      timeFormat="HH:mm"
                      timeCaption="Time"
                      dateFormat="HH:mm"
                      popperPlacement="bottom-start"
                      className="search-params-input search-params-time-only"
                      placeholderText="Time"
                    />
                  </div>
                </div>
                <div className="search-params-date-group">
                  <label className="search-params-field-label">To:</label>
                  <div className="search-params-date-time-split">
                    <DatePicker
                      selected={timeTo}
                      onChange={(d) => d && setTimeTo(new Date(d.getFullYear(), d.getMonth(), d.getDate(), timeTo.getHours(), timeTo.getMinutes()))}
                      dateFormat="dd/MM/yyyy"
                      className="search-params-input search-params-date-only"
                      placeholderText="Date"
                    />
                    <DatePicker
                      selected={timeTo}
                      onChange={(d) => d && setTimeTo(new Date(timeTo.getFullYear(), timeTo.getMonth(), timeTo.getDate(), d.getHours(), d.getMinutes()))}
                      showTimeSelectOnly
                      timeIntervals={15}
                      timeFormat="HH:mm"
                      timeCaption="Time"
                      dateFormat="HH:mm"
                      popperPlacement="bottom-start"
                      className="search-params-input search-params-time-only"
                      placeholderText="Time"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="search-params-block search-params-block-half">
              <span className="search-params-label">Compare to</span>
              <div className="search-params-date-row">
                <div className="search-params-date-group">
                  <label className="search-params-field-label">From:</label>
                  <div className="search-params-date-time-split">
                    <DatePicker
                      selected={compareFrom}
                      onChange={(d) => d && setCompareFrom(new Date(d.getFullYear(), d.getMonth(), d.getDate(), compareFrom.getHours(), compareFrom.getMinutes()))}
                      dateFormat="dd/MM/yyyy"
                      className="search-params-input search-params-date-only"
                      placeholderText="Date"
                    />
                    <DatePicker
                      selected={compareFrom}
                      onChange={(d) => d && setCompareFrom(new Date(compareFrom.getFullYear(), compareFrom.getMonth(), compareFrom.getDate(), d.getHours(), d.getMinutes()))}
                      showTimeSelectOnly
                      timeIntervals={15}
                      timeFormat="HH:mm"
                      timeCaption="Time"
                      dateFormat="HH:mm"
                      popperPlacement="bottom-start"
                      className="search-params-input search-params-time-only"
                      placeholderText="Time"
                    />
                  </div>
                </div>
                <div className="search-params-date-group">
                  <label className="search-params-field-label">To:</label>
                  <div className="search-params-date-time-split">
                    <DatePicker
                      selected={compareTo}
                      onChange={(d) => d && setCompareTo(new Date(d.getFullYear(), d.getMonth(), d.getDate(), compareTo.getHours(), compareTo.getMinutes()))}
                      dateFormat="dd/MM/yyyy"
                      className="search-params-input search-params-date-only"
                      placeholderText="Date"
                    />
                    <DatePicker
                      selected={compareTo}
                      onChange={(d) => d && setCompareTo(new Date(compareTo.getFullYear(), compareTo.getMonth(), compareTo.getDate(), d.getHours(), d.getMinutes()))}
                      showTimeSelectOnly
                      timeIntervals={15}
                      timeFormat="HH:mm"
                      timeCaption="Time"
                      dateFormat="HH:mm"
                      popperPlacement="bottom-start"
                      className="search-params-input search-params-time-only"
                      placeholderText="Time"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="traffic-light-config-section">
        <h2 className="traffic-light-config-title">Traffic light configuration</h2>
        <form onSubmit={handleSaveTrafficLight} className="traffic-light-config-form">
          <div className="traffic-light-config-table-wrap">
            <table className="traffic-light-config-table">
              <thead>
                <tr>
                  <th className="traffic-light-config-th-light">Traffic light</th>
                  <th>Green (s)</th>
                  <th>Yellow (s)</th>
                  <th>Red (s)</th>
                </tr>
              </thead>
              <tbody>
                {LEG_ORDER.map((leg) => (
                  <tr key={leg}>
                    <td className="traffic-light-config-th-light">{LEG_LABELS[leg]}</td>
                    <td>
                      <input
                        type="number"
                        min={1}
                        max={120}
                        value={trafficLightConfig[leg].green}
                        onChange={(e) => setTrafficLightPhase(leg, 'green', Number(e.target.value) || 0)}
                        className="traffic-light-config-input"
                        aria-label={`${LEG_LABELS[leg]} green seconds`}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min={1}
                        max={30}
                        value={trafficLightConfig[leg].yellow}
                        onChange={(e) => setTrafficLightPhase(leg, 'yellow', Number(e.target.value) || 0)}
                        className="traffic-light-config-input"
                        aria-label={`${LEG_LABELS[leg]} yellow seconds`}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min={1}
                        max={120}
                        value={trafficLightConfig[leg].red}
                        onChange={(e) => setTrafficLightPhase(leg, 'red', Number(e.target.value) || 0)}
                        className="traffic-light-config-input"
                        aria-label={`${LEG_LABELS[leg]} red seconds`}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button type="submit" disabled={savingTrafficLight} className="traffic-light-config-save">
            {savingTrafficLight ? 'Saving…' : 'Save traffic light configuration'}
          </button>
          {!firebaseReady && (
            <p className="traffic-light-config-hint">Saving to local storage. Configure Firebase to save to the database.</p>
          )}
        </form>
      </section>

      <form onSubmit={handleSave}>
        <label>
          Cycle (seconds)
          <input
            type="number"
            min={30}
            max={300}
            value={cycleSeconds}
            onChange={(e) => {
              const value = Number(e.target.value)
              setCycleSeconds(value)
              if (signal && id) {
                persistCycle(id, {
                  cycleSeconds: value,
                  signalName: signal.name,
                  deviceId: signal.deviceId,
                })
              }
            }}
            data-testid="signal-cycle-input"
          />
        </label>
        <button type="submit" disabled={saving} data-testid="signal-save">
          {saving ? 'Saving…' : 'Update configuration'}
        </button>
      </form>

      <div className="near-miss-tables-row">
      {/* Left: Search Results — Near-Miss Events by leg (Firestore) */}
      {nearMissData && (
        <section className="near-miss-main-section" data-testid="near-miss-table">
        <h2 className="search-results-title">Search Results</h2>
        <div className="near-miss-container compare-container">
          <div className="near-miss-header compare-header">
            <span className="compare-to-label" aria-hidden="true"></span>
            <h2 className="near-miss-title">Near-Miss Events by leg</h2>
            <p className="near-miss-date-range">
              {nearMissData.dateTimeRange ?? '—'}
            </p>
            <p className="near-miss-subtitle">
              <b>Safety score</b> — Event location is according to the sensor that detected it
            </p>
          </div>
          <div className="near-miss-legends">
            <div className="near-miss-legend">
              <div className="near-miss-legend-indicator" style={{ backgroundColor: 'rgb(255, 17, 0)' }} />
              <span>High Risk</span>
            </div>
            <div className="near-miss-legend">
              <div className="near-miss-legend-indicator" style={{ backgroundColor: 'rgb(255, 164, 25)' }} />
              <span>Moderate Risk</span>
            </div>
            <div className="near-miss-legend">
              <div className="near-miss-legend-indicator" style={{ backgroundColor: 'rgb(255, 214, 0)' }} />
              <span>Low Concern</span>
            </div>
            <div className="near-miss-legend">
              <div className="near-miss-legend-indicator" style={{ backgroundColor: 'rgb(65, 181, 10)' }} />
              <span>Safe</span>
            </div>
          </div>
          <div className="near-miss-table-wrap">
            <table className="near-miss-table">
              <thead>
                <tr>
                  <th />
                  {COLUMNS.map((col) => (
                    <th key={col}>{COLUMN_LABELS[col]}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {LEG_ORDER.map((leg) => (
                  <tr key={leg}>
                    <th className="near-miss-row-label">{LEG_LABELS[leg]}</th>
                    {COLUMNS.map((col, colIndex) => {
                      const value = nearMissData[leg][col]
                      const isFirst = colIndex === 0
                      const isLast = colIndex === COLUMNS.length - 1
                      return (
                        <td
                          key={col}
                          className={isFirst ? 'near-miss-cell-first' : isLast ? 'near-miss-cell-last' : ''}
                        >
                          <div className={`near-miss-cell-inner ${getRiskClass(value)}`}>
                            {value}
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        </section>
      )}

      {/* Right: Compare to — Near-Miss Events by leg */}
      {(() => {
        const compareTableData = getCompareTableData()
        return (
      <section className="search-results-section" data-testid="search-results">
        <h2 className="search-results-title">Compare to</h2>
        <div className="near-miss-container compare-container">
          <div className="near-miss-header compare-header">
            <span className="compare-to-label">Compare to</span>
            <h3 className="near-miss-title">Near-Miss Events by leg</h3>
            <p className="near-miss-date-range">
              {compareTableData.dateTimeRange}
            </p>
            <p className="near-miss-subtitle">
              <b>Safety score</b> — Event location is according to the sensor that detected it
            </p>
          </div>
          <div className="near-miss-legends">
            <div className="near-miss-legend">
              <div className="near-miss-legend-indicator" style={{ backgroundColor: 'rgb(255, 17, 0)' }} />
              <span>High Risk</span>
            </div>
            <div className="near-miss-legend">
              <div className="near-miss-legend-indicator" style={{ backgroundColor: 'rgb(255, 164, 25)' }} />
              <span>Moderate Risk</span>
            </div>
            <div className="near-miss-legend">
              <div className="near-miss-legend-indicator" style={{ backgroundColor: 'rgb(255, 214, 0)' }} />
              <span>Low Concern</span>
            </div>
            <div className="near-miss-legend">
              <div className="near-miss-legend-indicator" style={{ backgroundColor: 'rgb(65, 181, 10)' }} />
              <span>Safe</span>
            </div>
          </div>
          <div className="near-miss-table-wrap">
            <table className="near-miss-table">
              <thead>
                <tr>
                  <th />
                  {COLUMNS.map((col) => (
                    <th key={col}>{COLUMN_LABELS[col]}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {LEG_ORDER.map((leg) => {
                  const row = compareTableData[leg]
                  return (
                    <tr key={leg}>
                      <th className="near-miss-row-label">{LEG_LABELS[leg]}</th>
                      {COLUMNS.map((col, colIndex) => {
                        const value = row[col]
                        const isFirst = colIndex === 0
                        const isLast = colIndex === COLUMNS.length - 1
                        return (
                          <td
                            key={col}
                            className={isFirst ? 'near-miss-cell-first' : isLast ? 'near-miss-cell-last' : ''}
                          >
                            <div className={`near-miss-cell-inner ${getRiskClass(value)}`}>
                              {value}
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>
        )
      })()}
      </div>
      </div>

      <div className="signal-detail-actions">
        <button type="button" className="btn-download btn-pdf" onClick={handleDownloadPdf} data-testid="download-pdf">
          Download PDF
        </button>
        <button type="button" className="btn-download btn-csv" onClick={handleDownloadCsv} data-testid="download-csv">
          Download CSV
        </button>
      </div>
    </div>
  )
}

function MOCK(id: string): TrafficSignal {
  return {
    id,
    deviceId: 'DEV-001',
    name: 'Main & 5th',
    status: 'online',
    phase: 'green',
    cycleSeconds: 90,
    lastUpdated: new Date().toISOString(),
  }
}

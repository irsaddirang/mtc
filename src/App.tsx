import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Activity,
  CalendarClock,
  CalendarPlus,
  PencilLine,
  Sparkles,
  Trash2,
  Zap,
} from 'lucide-react'
import clsx from 'clsx'
import { format } from 'date-fns'
import { id as localeID } from 'date-fns/locale'
import { supabase } from './lib/supabase'

type ImpactLevel = 'Low' | 'Medium' | 'High'
type MaintenanceStatus = 'Scheduled' | 'In Progress' | 'Completed'
type Environment = 'Production' | 'Staging' | 'Disaster Recovery'

interface MaintenanceEvent {
  id: string
  title: string
  system: string
  owner: string
  environment: Environment
  status: MaintenanceStatus
  impact: ImpactLevel
  notificationsSent: boolean
  startDate: string
  endDate: string
  description: string
  createdAt: string
}

interface MaintenanceDraft
  extends Omit<MaintenanceEvent, 'id' | 'createdAt'> {
  id?: string
}

const PASSCODE = '6666'
const MACHINE_OPTIONS = [
  'CX',
  'XL',
  'CD3',
  'CDLL',
  'ATN',
  'Brausse 1',
  'Brausse 2',
  'Brausse 3',
  'Brausse 5',
  'Brausse 6',
  'Brausse 7',
  'CER',
  'Spanthera',
  'SP 106',
  'SP 104 ER',
  'Jinyue 1',
  'Jinyue 2',
  'Jinyue 3',
  'Champion',
  'Diana',
  'FS 1',
  'FS 2',
  'FS 3',
  'FS 4',
  'Genset P1',
  'Genset P2',
  'VisionCut 01',
  'VisionCut 02',
  'Sun Dragon',
  'Omega',
  'Other',
  'SP104 Kanguru',
  'Plotter',
  'Pile Turner 1',
  'Pile Turner 2',
  'MBO',
  'SM74',
] as const

const impactStyles: Record<ImpactLevel, string> = {
  High: 'bg-rose-100 text-rose-600 border-rose-200',
  Medium: 'bg-amber-100 text-amber-600 border-amber-200',
  Low: 'bg-emerald-100 text-emerald-600 border-emerald-200',
}

const formatDate = (iso: string, pattern = "EEEE, d MMMM yyyy") => {
  try {
    return format(new Date(iso), pattern, { locale: localeID })
  } catch {
    return iso
  }
}

const getDateKey = (iso: string) => {
  try {
    return format(new Date(iso), 'yyyy-MM-dd')
  } catch {
    return iso
  }
}

function App() {
  const [events, setEvents] = useState<MaintenanceEvent[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [draft, setDraft] = useState<MaintenanceDraft | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const normaliseEvent = (row: Record<string, any>): MaintenanceEvent => ({
    id: row.id ?? row.uuid ?? '',
    title: row.title ?? '',
    system: row.system ?? row.machine ?? '',
    owner: row.owner ?? '',
    environment: (row.environment as Environment) ?? 'Production',
    status: (row.status as MaintenanceStatus) ?? 'Scheduled',
    impact: (row.impact as ImpactLevel) ?? 'Medium',
    notificationsSent: row.notifications_sent ?? row.notificationsSent ?? false,
    startDate: row.start_date ?? row.startDate ?? new Date().toISOString(),
    endDate:
      row.end_date ??
      row.endDate ??
      row.start_date ??
      row.startDate ??
      new Date().toISOString(),
    description: row.description ?? '',
    createdAt: row.created_at ?? row.createdAt ?? new Date().toISOString(),
  })

  const fetchEvents = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage('')
    const { data, error } = await supabase
      .from('maintenance_events')
      .select('*')
      .order('start_date', { ascending: true })

    if (error) {
      console.error(error)
      setErrorMessage('Gagal memuat data dari Supabase.')
      setIsLoading(false)
      return
    }

    setEvents((data ?? []).map(normaliseEvent))
    setIsLoading(false)
  }, [])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  const activeWindows = events.filter((event) => event.status !== 'Completed')
  const notificationsCoverage = Math.round(
    (events.filter((event) => event.notificationsSent).length /
      Math.max(events.length, 1)) *
      100,
  )
  const completedPercentage = Math.round(
    (events.filter((event) => event.status === 'Completed').length /
      Math.max(events.length, 1)) *
      100,
  )
  const availabilityScore = Math.min(
    100,
    Math.round(
      78 + notificationsCoverage / 5 + completedPercentage / 8 - activeWindows.length * 3,
    ),
  )
  const totalMachines = new Set(
    events
      .map((event) => event.system.trim())
      .filter((system) => system.length > 0),
  ).size
  const statCardGradients = [
    'from-aurora-teal via-sky-300 to-aurora-blue',
    'from-pink-400 via-red-400 to-amber-400',
    'from-violet-400 via-fuchsia-400 to-amber-300',
  ]
  const dayHeaderGradients = [
    'from-aurora-teal via-sky-300 to-aurora-blue',
    'from-pink-400 via-rose-300 to-orange-300',
    'from-purple-400 via-indigo-400 to-blue-400',
    'from-emerald-400 via-teal-300 to-cyan-300',
  ]

  const filteredEvents = useMemo(() => {
    return [...events].sort(
      (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
    )
  }, [events])

  const groupedEvents = useMemo(() => {
    const map = new Map<
      string,
      { key: string; label: string; items: MaintenanceEvent[] }
    >()
    filteredEvents.forEach((event) => {
      const key = getDateKey(event.startDate)
      if (!map.has(key)) {
        map.set(key, { key, label: formatDate(event.startDate), items: [] })
      }
      map.get(key)!.items.push(event)
    })
    return Array.from(map.values())
  }, [filteredEvents])

  const handleSubmit = async (payload: MaintenanceDraft) => {
    try {
      setIsSyncing(true)
      setErrorMessage('')

      if (payload.id) {
        const { error } = await supabase
          .from('maintenance_events')
          .update({
            title: payload.title,
            system: payload.system,
            owner: payload.owner,
            environment: payload.environment,
            status: payload.status,
            impact: payload.impact,
            notifications_sent: payload.notificationsSent,
            start_date: payload.startDate,
            end_date: payload.endDate,
            description: payload.description,
          })
          .eq('id', payload.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('maintenance_events').insert({
          title: payload.title,
          system: payload.system,
          owner: payload.owner,
          environment: payload.environment,
          status: payload.status,
          impact: payload.impact,
          notifications_sent: payload.notificationsSent,
          start_date: payload.startDate,
          end_date: payload.endDate,
          description: payload.description,
        })
        if (error) throw error
      }

      await fetchEvents()
      setIsFormOpen(false)
      setDraft(null)
    } catch (error) {
      console.error(error)
      window.alert('Gagal menyimpan jadwal. Coba lagi.')
    } finally {
      setIsSyncing(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (
      typeof window !== 'undefined' &&
      !window.confirm('Hapus jadwal maintenance ini?')
    ) {
      return
    }
    try {
      setIsSyncing(true)
      const { error } = await supabase
        .from('maintenance_events')
        .delete()
        .eq('id', id)
      if (error) throw error
      await fetchEvents()
    } catch (error) {
      console.error(error)
      window.alert('Gagal menghapus jadwal.')
    } finally {
      setIsSyncing(false)
    }
  }

  const createDefaultDateISO = () => {
    const base = new Date()
    base.setHours(9, 0, 0, 0)
    return base.toISOString()
  }

  const buildBlankDraft = (): MaintenanceDraft => {
    const defaultDate = createDefaultDateISO()
    return {
      title: '',
      system: '',
      owner: '',
      environment: 'Production',
      status: 'Scheduled',
      impact: 'Medium',
      notificationsSent: false,
      startDate: defaultDate,
      endDate: defaultDate,
      description: '',
    }
  }

  const openCreateModal = () => {
    setDraft(buildBlankDraft())
    setIsFormOpen(true)
  }

  const handleLogin = () => {
    if (typeof window === 'undefined') return
    const input = window.prompt('Masukkan password akses jadwal maintenance')
    if (input === PASSCODE) {
      setIsAuthenticated(true)
      window.alert('Login berhasil. Anda dapat membuka Jadwalkan Maint.')
    } else {
      window.alert('Password salah.')
    }
  }

  const openEditModal = (event: MaintenanceEvent) => {
    const { createdAt, ...rest } = event
    setDraft(rest)
    setIsFormOpen(true)
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-white via-slate-50 to-slate-100 text-slate-900">
      <div className="relative mx-auto max-w-6xl px-6 pb-20 pt-10">
        <motion.nav
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="animated-card mb-10 flex items-center justify-between rounded-full px-6 py-3 text-slate-900"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-aurora-teal via-aurora-blue to-aurora-purple p-[2px]">
              <div className="flex h-full w-full items-center justify-center rounded-2xl bg-white text-lg font-semibold text-slate-900">
                AO
              </div>
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
                Ops Dashboard
              </p>
              <p className="text-lg font-semibold text-slate-900">
                GPI Bawen Maintenance Studio
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleLogin}
              className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Login Akses
            </button>
            <button
              onClick={() => {
                if (!isAuthenticated) {
                  window.alert('Silakan login terlebih dahulu.')
                  return
                }
                openCreateModal()
              }}
              className={clsx(
                'flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold text-slate-900 shadow-xl transition',
                isAuthenticated && !isSyncing
                  ? 'bg-gradient-to-r from-aurora-teal via-aurora-blue to-aurora-purple hover:scale-[1.03]'
                  : 'bg-slate-300 text-slate-500 cursor-not-allowed',
              )}
              disabled={!isAuthenticated || isSyncing}
            >
              <CalendarPlus className="h-4 w-4" />
              {isSyncing ? 'Memproses...' : 'Jadwalkan Maint'}
            </button>
          </div>
        </motion.nav>

        <motion.section
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass-panel animated-header relative overflow-hidden p-8"
        >
          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight text-slate-900 md:text-5xl">
                Jadwal Pekerjaan Maintenance
              </h1>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm uppercase tracking-[0.3em] text-slate-400">
                HEALTH SCORE
              </p>
              <p className="mt-2 text-5xl font-semibold text-slate-900">
                {availabilityScore}%
              </p>
              <p className="text-sm text-slate-500">
                Adaptive SLO based on notifications &amp; completion
              </p>
            </div>
          </div>
        </motion.section>

        <section className="mt-10 grid gap-5 md:grid-cols-3">
          {[
            {
              label: 'Active windows',
              value: activeWindows.length,
              sub: `${events.length} jadwal keseluruhan`,
              icon: CalendarClock,
            },
            {
              label: 'High impact',
              value: events.filter((event) => event.impact === 'High').length,
              sub: 'latensi diawasi langsung',
              icon: Activity,
            },
            {
              label: 'Total machine',
              value: totalMachines,
              sub: 'mesin terjadwal',
              icon: Sparkles,
            },
          ].map((stat, index) => (
            <div
              key={stat.label}
              className={clsx(
                'relative overflow-hidden rounded-3xl p-[1px] shadow-xl bg-gradient-to-br',
                statCardGradients[index % statCardGradients.length],
              )}
            >
              <div className="glass-panel relative h-full w-full bg-white/90 p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.3em] text-slate-500">
                      {stat.label}
                    </p>
                    <p className="mt-2 text-4xl font-semibold text-slate-900">
                      {stat.value}
                    </p>
                    <p className="text-sm text-slate-500">{stat.sub}</p>
                  </div>
                  <div className="rounded-2xl bg-white/80 p-3 backdrop-blur-xl">
                    <stat.icon className="h-6 w-6 text-slate-900" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </section>
        {errorMessage && (
          <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-6 py-4 text-sm text-rose-700">
            {errorMessage}
          </div>
        )}

        <section className="mt-10 space-y-6">
          <div className="space-y-6">
            <div className="space-y-6">
              {isLoading ? (
                <div className="glass-panel flex flex-col items-center gap-2 px-6 py-12 text-center text-slate-500">
                  <Sparkles className="h-10 w-10 text-slate-300 animate-pulse" />
                  <p>Memuat jadwal dari Supabase...</p>
                </div>
              ) : groupedEvents.length > 0 ? (
                groupedEvents.map((group, index) => (
                  <div key={group.key} className="glass-panel overflow-hidden">
                    <div
                      className={clsx(
                        'px-6 py-4 text-sm font-semibold uppercase tracking-[0.3em] text-white shadow-inner bg-gradient-to-r',
                        dayHeaderGradients[index % dayHeaderGradients.length],
                      )}
                    >
                      {group.label}
                    </div>
                    <div className="grid grid-cols-[1fr,1.5fr,0.8fr,110px] border-b border-slate-100 px-6 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                      <span>Mesin</span>
                      <span>Detail Pekerjaan</span>
                      <span className="text-center">Criticality</span>
                      <span className="text-center">Aksi</span>
                    </div>
                    <div className="divide-y divide-slate-100">
                      <AnimatePresence initial={false}>
                        {group.items.map((event) => {
                          const jobDetail =
                            (event.description?.trim() || event.title).trim()
                          return (
                            <motion.div
                              layout
                              key={event.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="grid grid-cols-[1fr,1.5fr,0.8fr,110px] items-center gap-4 rounded-2xl border border-slate-100 bg-white/80 px-6 py-5 text-left shadow-sm transition hover:-translate-y-1 hover:bg-white hover:shadow-lg"
                            >
                              <div>
                                <p className="text-base font-semibold text-slate-900">
                                  {event.system}
                                </p>
                              </div>
                              <div>
                                <p className="text-base font-semibold text-slate-900">
                                  {jobDetail}
                                </p>
                              </div>
                              <span
                                className={clsx(
                                  'badge mx-auto inline-flex min-w-[120px] items-center justify-center rounded-full px-4 py-2 text-sm font-semibold',
                                  impactStyles[event.impact],
                                )}
                              >
                              {event.impact}
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => openEditModal(event)}
                                className="rounded-full bg-slate-900/10 p-2 transition hover:bg-slate-900/20"
                              >
                                <PencilLine className="h-4 w-4 text-slate-900" />
                              </button>
                              <button
                                onClick={() => handleDelete(event.id)}
                                className="rounded-full bg-rose-100 p-2 text-rose-600 transition hover:bg-rose-200"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </motion.div>
                          )
                        })}
                      </AnimatePresence>
                    </div>
                  </div>
                ))
              ) : (
                <div className="glass-panel flex flex-col items-center gap-2 px-6 py-12 text-center text-slate-500">
                  <Zap className="h-10 w-10 text-slate-300" />
                  <p>Tidak ada jadwal sesuai filter saat ini.</p>
                </div>
              )}
            </div>
          </div>

        </section>

        <footer className="mt-16 flex flex-col items-center gap-3 text-center text-xs font-semibold text-slate-500">
          <p className="chip inline-flex items-center gap-2 border-0 bg-white/90 px-5 py-2 text-[11px] shadow">
            Created by Dirang with ❤️ From Bawen, Indonesia <span className="flag-id" aria-label="Indonesian flag" />
          </p>
        </footer>
      </div>

      <AnimatePresence>
        {isFormOpen && draft && (
          <EventFormModal
            key={draft.id ?? 'new'}
            draft={draft}
            onClose={() => {
              setIsFormOpen(false)
              setDraft(null)
            }}
            onSubmit={handleSubmit}
          />
        )}
      </AnimatePresence>

    </div>
  )
}

interface EventFormModalProps {
  draft: MaintenanceDraft
  onClose: () => void
  onSubmit: (event: MaintenanceDraft) => void
}

const toDateInputValue = (iso: string) => {
  if (!iso) return ''
  const date = new Date(iso)
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

const fromDateInputValue = (value: string) => {
  if (!value) {
    const now = new Date()
    now.setHours(9, 0, 0, 0)
    return now.toISOString()
  }
  const [year, month, day] = value.split('-').map(Number)
  const localDate = new Date(year, (month ?? 1) - 1, day ?? 1, 9, 0, 0, 0)
  return localDate.toISOString()
}

function EventFormModal({ draft, onClose, onSubmit }: EventFormModalProps) {
  const [formState, setFormState] = useState<MaintenanceDraft>(draft)
  const [error, setError] = useState('')

  useEffect(() => {
    setFormState(draft)
  }, [draft])

  const updateField = (field: keyof MaintenanceDraft, value: string | boolean) => {
    setFormState((prev) => {
      const next = { ...prev, [field]: value }
      if (field === 'startDate' && typeof value === 'string') {
        next.endDate = value
      }
      return next
    })
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!formState.title.trim() || !formState.system.trim()) {
      setError('Detail pekerjaan dan nama mesin wajib diisi.')
      return
    }

    setError('')
    const payload: MaintenanceDraft = {
      ...formState,
      description: formState.description || formState.title,
    }
    onSubmit(payload)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
    >
      <motion.form
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.98 }}
        onSubmit={handleSubmit}
        className="glass-panel max-h-[90vh] w-full max-w-2xl overflow-y-auto p-8"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">
              {draft.id ? 'Edit window' : 'Buat window'}
            </p>
            <p className="text-2xl font-semibold text-slate-900">
              {draft.id ? 'Perbarui jadwal' : 'Window baru'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold uppercase tracking-wide text-slate-500"
          >
            Tutup
          </button>
        </div>

        <div className="mt-6 space-y-5">
          <label className="block space-y-2">
            <span className="text-xs uppercase tracking-[0.3em] text-slate-500">
              Detail Pekerjaan
            </span>
            <textarea
              value={formState.title}
              onChange={(e) =>
                setFormState((prev) => ({
                  ...prev,
                  title: e.target.value,
                  description: e.target.value,
                }))
              }
              rows={4}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-aurora-blue focus:outline-none"
              placeholder="Contoh: Peremajaan panel listrik line 2."
            />
          </label>
          <div className="space-y-3">
            <label className="block space-y-2">
              <span className="text-xs uppercase tracking-[0.3em] text-slate-500">
                Mesin
              </span>
              <select
                value={MACHINE_OPTIONS.includes(formState.system as any) ? formState.system : ''}
                onChange={(e) => updateField('system', e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-aurora-blue focus:outline-none"
              >
                <option value="">Pilih mesin cepat</option>
                {MACHINE_OPTIONS.map((machine) => (
                  <option key={machine} value={machine}>
                    {machine}
                  </option>
                ))}
              </select>
            </label>
            <input
              value={formState.system}
              onChange={(e) => updateField('system', e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-aurora-blue focus:outline-none"
              placeholder="Atau ketik nama mesin lainnya"
            />
          </div>
          <label className="block space-y-2">
            <span className="text-xs uppercase tracking-[0.3em] text-slate-500">
              Tanggal Pekerjaan
            </span>
            <input
              type="date"
              value={toDateInputValue(formState.startDate)}
              onChange={(e) => updateField('startDate', fromDateInputValue(e.target.value))}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-aurora-blue focus:outline-none"
            />
          </label>
          <div className="space-y-3">
            <span className="text-xs uppercase tracking-[0.3em] text-slate-500">
              Criticality
            </span>
            <div className="flex flex-wrap gap-3">
              {(['High', 'Medium', 'Low'] as ImpactLevel[]).map((level) => (
                <button
                  type="button"
                  key={level}
                  onClick={() => updateField('impact', level)}
                    className={clsx(
                      'rounded-2xl border px-4 py-2 text-sm font-semibold uppercase tracking-wide transition',
                      formState.impact === level
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-400',
                    )}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <p className="mt-4 rounded-2xl bg-rose-100 px-4 py-3 text-sm text-rose-700">
            {error}
          </p>
        )}

        <div className="mt-6 flex items-center justify-between">
          <div className="text-xs uppercase tracking-[0.3em] text-slate-500">
            {draft.id ? 'Update existing window' : 'Create a fresh window'}
          </div>
          <button
            type="submit"
            className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-slate-800"
          >
            {draft.id ? 'Simpan Perubahan' : 'Publikasikan'}
          </button>
        </div>
      </motion.form>
    </motion.div>
  )
}

export default App

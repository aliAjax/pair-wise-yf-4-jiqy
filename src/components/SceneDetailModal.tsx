import { useEffect, useState } from 'react'
import { X, Trash2, Clock, MapPin, Pencil, Save, History, RotateCcw } from 'lucide-react'
import { useSceneStore } from '@/store/useSceneStore'
import {
  formatTimestamp,
  getTimeOfDay,
  getWeatherIcon,
  getTreeIcon,
  getPedestrianIcon,
} from '@/utils/sceneHelpers'
import type {
  WindowScene,
  EditableSceneFields,
  Weather,
  TreeDensity,
  PedestrianStatus,
} from '@/types'

const WEATHERS: Weather[] = ['晴', '多云', '阴', '小雨', '大雨', '雪', '雾']
const TREES: TreeDensity[] = ['稀疏', '适中', '茂密']
const PEDESTRIANS: PedestrianStatus[] = ['稀少', '零星', '密集']

interface SceneDetailModalProps {
  scene: WindowScene
  onClose: () => void
}

function toForm(scene: WindowScene): EditableSceneFields {
  return {
    weather: scene.weather,
    signText: scene.signText,
    treeDensity: scene.treeDensity,
    pedestrianStatus: scene.pedestrianStatus,
    note: scene.note,
  }
}

export default function SceneDetailModal({ scene, onClose }: SceneDetailModalProps) {
  const { updateScene, restoreVersion, deleteScene } = useSceneStore()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<EditableSceneFields>(() => toForm(scene))
  const [restored, setRestored] = useState(false)

  const versions = scene.versions ?? []

  useEffect(() => {
    if (!restored) return
    const timer = setTimeout(() => setRestored(false), 1500)
    return () => clearTimeout(timer)
  }, [restored])

  const update = <K extends keyof EditableSceneFields>(key: K, val: EditableSceneFields[K]) =>
    setForm((prev) => ({ ...prev, [key]: val }))

  const isDirty =
    form.weather !== scene.weather ||
    form.signText !== scene.signText ||
    form.treeDensity !== scene.treeDensity ||
    form.pedestrianStatus !== scene.pedestrianStatus ||
    form.note !== scene.note

  const startEdit = () => {
    setForm(toForm(scene))
    setEditing(true)
  }

  const handleSave = () => {
    if (!isDirty) return
    updateScene(scene.id, form)
    setEditing(false)
  }

  const handleRestore = (index: number) => {
    restoreVersion(scene.id, index)
    setRestored(true)
  }

  const handleDelete = () => {
    deleteScene(scene.id)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative mx-4 max-h-[85vh] w-full max-w-md overflow-y-auto animate-scale-in rounded-2xl border border-teal-700 bg-teal-900 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-mist-400 hover:text-mist-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {editing ? (
          <>
            <div className="mb-4 flex items-center gap-3">
              <Pencil className="w-5 h-5 text-dusk-400" />
              <h2 className="text-xl font-bold text-dusk-400">修订窗景</h2>
            </div>

            <div className="mb-4 space-y-1.5 rounded-lg bg-teal-850/60 px-3 py-2 text-xs text-mist-400">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-dusk-400" />
                <span>{scene.routeName}</span>
                <span className="text-teal-600">·</span>
                <span>{scene.segment}</span>
                <span className="text-teal-600">·</span>
                <span>{scene.seatDirection}侧</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-dusk-400" />
                <span>{formatTimestamp(scene.timestamp)}</span>
                <span className="text-teal-600">·</span>
                <span>{getTimeOfDay(scene.timestamp)}</span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-mist-300 text-xs mb-1 block">天气</label>
                <div className="grid grid-cols-4 gap-2">
                  {WEATHERS.map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => update('weather', w)}
                      className={`flex flex-col items-center gap-1 py-2 rounded-xl text-xs transition ${
                        form.weather === w
                          ? 'bg-dusk-400/20 border border-dusk-400 text-dusk-400'
                          : 'bg-teal-850 border border-transparent text-mist-300'
                      }`}
                    >
                      {getWeatherIcon(w)}
                      {w}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-mist-300 text-xs mb-1 block">招牌文字</label>
                <input
                  className="w-full bg-teal-850 text-mist-100 rounded-xl px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-dusk-400"
                  value={form.signText}
                  onChange={(e) => update('signText', e.target.value)}
                />
              </div>
              <div>
                <label className="text-mist-300 text-xs mb-1 block">树木密度</label>
                <div className="grid grid-cols-3 gap-2">
                  {TREES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => update('treeDensity', t)}
                      className={`flex flex-col items-center gap-1 py-2 rounded-xl text-xs transition ${
                        form.treeDensity === t
                          ? 'bg-dusk-400/20 border border-dusk-400 text-dusk-400'
                          : 'bg-teal-850 border border-transparent text-mist-300'
                      }`}
                    >
                      {getTreeIcon(t)}
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-mist-300 text-xs mb-1 block">行人状态</label>
                <div className="grid grid-cols-3 gap-2">
                  {PEDESTRIANS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => update('pedestrianStatus', p)}
                      className={`flex flex-col items-center gap-1 py-2 rounded-xl text-xs transition ${
                        form.pedestrianStatus === p
                          ? 'bg-dusk-400/20 border border-dusk-400 text-dusk-400'
                          : 'bg-teal-850 border border-transparent text-mist-300'
                      }`}
                    >
                      {getPedestrianIcon(p)}
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-mist-300 text-xs mb-1 block">观察笔记</label>
                <textarea
                  className="w-full bg-teal-850 text-mist-100 rounded-xl px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-dusk-400 resize-none h-24"
                  value={form.note}
                  onChange={(e) => update('note', e.target.value)}
                />
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              <button
                onClick={handleSave}
                disabled={!isDirty}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-dusk-400 py-2.5 text-sm font-medium text-teal-950 transition-colors hover:bg-dusk-300 disabled:opacity-40 disabled:hover:bg-dusk-400"
              >
                <Save className="w-4 h-4" />
                保存修改
              </button>
              <button
                onClick={() => setEditing(false)}
                className="flex-1 rounded-lg bg-teal-800/60 py-2.5 text-sm text-mist-300 transition-colors hover:bg-teal-800"
              >
                取消
              </button>
            </div>
            <p className="mt-2 text-center text-[10px] text-mist-500">
              保存前会自动留档当前内容,之后可在历史版本中恢复
            </p>
          </>
        ) : (
          <>
            <div className="mb-4 flex items-center gap-3">
              {getWeatherIcon(scene.weather)}
              <h2 className="text-xl font-bold text-dusk-400">{scene.segment}</h2>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-mist-300">
                <MapPin className="w-4 h-4 text-dusk-400" />
                <span>{scene.routeName}</span>
                <span className="text-teal-600">·</span>
                <span>{scene.seatDirection}侧</span>
              </div>
              <div className="flex items-center gap-2 text-mist-300">
                <Clock className="w-4 h-4 text-dusk-400" />
                <span>{formatTimestamp(scene.timestamp)}</span>
                <span className="text-teal-600">·</span>
                <span>{getTimeOfDay(scene.timestamp)}</span>
              </div>
              <div className="flex items-center gap-3 text-mist-300">
                {getTreeIcon(scene.treeDensity)}
                <span>{scene.treeDensity}</span>
                {getPedestrianIcon(scene.pedestrianStatus)}
                <span>{scene.pedestrianStatus}</span>
              </div>
              {scene.signText && (
                <div className="rounded-lg bg-teal-800/50 px-3 py-2 text-mist-200">
                  招牌: {scene.signText}
                </div>
              )}
              {scene.note && (
                <div className="rounded-lg border border-teal-800 px-3 py-2 text-mist-300">
                  {scene.note}
                </div>
              )}
            </div>

            <div className="mt-5 flex gap-2">
              <button
                onClick={startEdit}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-dusk-400 py-2.5 text-sm font-medium text-teal-950 transition-colors hover:bg-dusk-300"
              >
                <Pencil className="w-4 h-4" />
                修订窗景
              </button>
              <button
                onClick={handleDelete}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-900/40 py-2.5 text-sm text-red-300 transition-colors hover:bg-red-900/60"
              >
                <Trash2 className="w-4 h-4" />
                删除
              </button>
            </div>

            {versions.length > 0 && (
              <div className="mt-5 border-t border-teal-800 pt-4">
                <div className="mb-3 flex items-center gap-2 text-xs text-mist-400">
                  <History className="w-3.5 h-3.5 text-dusk-400" />
                  <span>历史版本(最近 {versions.length} 版,最多保留 5 版)</span>
                  {restored && <span className="text-dusk-300">已恢复</span>}
                </div>
                <div className="space-y-2">
                  {versions.map((v, i) => (
                    <div
                      key={`${v.savedAt}-${i}`}
                      className="rounded-lg border border-teal-800 bg-teal-850/60 px-3 py-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] text-mist-500">
                          留档于 {formatTimestamp(v.savedAt)}
                        </span>
                        <button
                          onClick={() => handleRestore(i)}
                          className="flex items-center gap-1 rounded-full bg-dusk-400/15 px-2.5 py-1 text-[10px] text-dusk-300 transition-colors hover:bg-dusk-400/25"
                        >
                          <RotateCcw className="w-3 h-3" />
                          恢复此版
                        </button>
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-mist-300">
                        {getWeatherIcon(v.weather)}
                        <span>{v.weather}</span>
                        <span className="text-teal-700">·</span>
                        {getTreeIcon(v.treeDensity)}
                        <span>{v.treeDensity}</span>
                        <span className="text-teal-700">·</span>
                        {getPedestrianIcon(v.pedestrianStatus)}
                        <span>{v.pedestrianStatus}</span>
                      </div>
                      {v.signText && (
                        <p className="mt-1 text-xs text-mist-400">招牌: {v.signText}</p>
                      )}
                      {v.note && (
                        <p className="mt-1 text-xs text-mist-400 line-clamp-2">{v.note}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

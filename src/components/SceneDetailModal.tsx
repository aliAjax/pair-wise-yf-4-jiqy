import { useState } from 'react'
import {
  X, Trash2, Clock, MapPin, Lock, CloudSun, Signpost, TreePine, Users,
  FileText, Save, History, RotateCcw, ChevronDown,
} from 'lucide-react'
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
  SceneEditData,
  Weather,
  TreeDensity,
  PedestrianStatus,
} from '@/types'

const WEATHERS: Weather[] = ['晴', '多云', '阴', '小雨', '大雨', '雪', '雾']
const TREES: TreeDensity[] = ['稀疏', '适中', '茂密']
const PEDESTRIANS: PedestrianStatus[] = ['稀少', '零星', '密集']

function pickEditable(scene: WindowScene): SceneEditData {
  return {
    weather: scene.weather,
    signText: scene.signText,
    treeDensity: scene.treeDensity,
    pedestrianStatus: scene.pedestrianStatus,
    note: scene.note,
  }
}

interface SceneDetailModalProps {
  scene: WindowScene
  onClose: () => void
  onDelete: (id: string) => void
}

export default function SceneDetailModal({ scene, onClose, onDelete }: SceneDetailModalProps) {
  const updateScene = useSceneStore((s) => s.updateScene)
  const restoreVersion = useSceneStore((s) => s.restoreVersion)
  const [form, setForm] = useState<SceneEditData>(() => pickEditable(scene))
  const [historyOpen, setHistoryOpen] = useState(false)
  const [saved, setSaved] = useState(false)

  const versions = scene.versions ?? []
  const isDirty = (Object.keys(form) as (keyof SceneEditData)[]).some(
    (key) => form[key] !== scene[key]
  )

  const update = <K extends keyof SceneEditData>(key: K, val: SceneEditData[K]) =>
    setForm((prev) => ({ ...prev, [key]: val }))

  const handleSave = () => {
    if (!isDirty) return
    const updated = updateScene(scene.id, form)
    if (!updated) return
    setForm(pickEditable(updated))
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  const handleRestore = (versionId: string) => {
    const updated = restoreVersion(scene.id, versionId)
    if (updated) setForm(pickEditable(updated))
  }

  const optionCls = (active: boolean) =>
    `flex flex-col items-center gap-1 py-2 rounded-xl text-xs transition ${
      active
        ? 'bg-dusk-400/20 border border-dusk-400 text-dusk-400'
        : 'bg-teal-850 border border-transparent text-mist-300'
    }`

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative mx-4 max-h-[90vh] w-full max-w-md overflow-y-auto animate-scale-in rounded-2xl border border-teal-700 bg-teal-900 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-mist-400 hover:text-mist-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-4 flex items-center gap-3">
          {getWeatherIcon(form.weather)}
          <h2 className="text-xl font-bold text-dusk-400">{scene.segment}</h2>
        </div>

        <div className="space-y-2 rounded-xl border border-teal-800 bg-teal-950/40 px-3 py-2.5 text-sm">
          <div className="flex items-center gap-2 text-mist-300">
            <MapPin className="w-4 h-4 text-dusk-400" />
            <span>{scene.routeName}</span>
            <span className="text-teal-600">·</span>
            <span>{scene.seatDirection}侧</span>
            <Lock className="ml-auto w-3.5 h-3.5 text-mist-500" />
          </div>
          <div className="flex items-center gap-2 text-mist-300">
            <Clock className="w-4 h-4 text-dusk-400" />
            <span>{formatTimestamp(scene.timestamp)}</span>
            <span className="text-teal-600">·</span>
            <span>{getTimeOfDay(scene.timestamp)}</span>
          </div>
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <label className="text-mist-300 text-xs mb-1.5 flex items-center gap-1">
              <CloudSun className="w-3 h-3" />天气
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {WEATHERS.map((w) => (
                <button key={w} type="button" onClick={() => update('weather', w)} className={optionCls(form.weather === w)}>
                  {getWeatherIcon(w)}{w}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-mist-300 text-xs mb-1.5 flex items-center gap-1">
              <Signpost className="w-3 h-3" />招牌文字
            </label>
            <input
              className="w-full bg-teal-850 text-mist-100 rounded-xl px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-dusk-400"
              value={form.signText}
              onChange={(e) => update('signText', e.target.value)}
            />
          </div>

          <div>
            <label className="text-mist-300 text-xs mb-1.5 flex items-center gap-1">
              <TreePine className="w-3 h-3" />树木密度
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {TREES.map((t) => (
                <button key={t} type="button" onClick={() => update('treeDensity', t)} className={optionCls(form.treeDensity === t)}>
                  {getTreeIcon(t)}{t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-mist-300 text-xs mb-1.5 flex items-center gap-1">
              <Users className="w-3 h-3" />行人状态
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {PEDESTRIANS.map((p) => (
                <button key={p} type="button" onClick={() => update('pedestrianStatus', p)} className={optionCls(form.pedestrianStatus === p)}>
                  {getPedestrianIcon(p)}{p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-mist-300 text-xs mb-1.5 flex items-center gap-1">
              <FileText className="w-3 h-3" />观察笔记
            </label>
            <textarea
              className="w-full bg-teal-850 text-mist-100 rounded-xl px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-dusk-400 resize-none h-20"
              value={form.note}
              onChange={(e) => update('note', e.target.value)}
            />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={!isDirty}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm transition-colors ${
              isDirty
                ? 'bg-dusk-400 text-teal-950 font-medium hover:bg-dusk-300'
                : 'cursor-not-allowed bg-teal-800 text-mist-500'
            }`}
          >
            <Save className="w-4 h-4" />
            保存修改
          </button>
          {saved && <span className="text-xs text-dusk-300">已保存，旧内容已留档</span>}
        </div>

        <div className="mt-4 rounded-xl border border-teal-800">
          <button
            onClick={() => setHistoryOpen((v) => !v)}
            className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-mist-300 transition-colors hover:text-mist-100"
          >
            <History className="w-4 h-4 text-dusk-400" />
            历史版本（{versions.length}/5）
            <ChevronDown
              className={`ml-auto w-4 h-4 transition-transform ${historyOpen ? 'rotate-180' : ''}`}
            />
          </button>
          {historyOpen && (
            <div className="space-y-2 border-t border-teal-800 p-3">
              {versions.length === 0 ? (
                <p className="text-xs text-mist-500">
                  还没有历史版本，保存修改前会自动留档旧内容
                </p>
              ) : (
                versions.map((v) => (
                  <div key={v.id} className="rounded-lg bg-teal-950/50 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-mist-500">
                        留档于 {formatTimestamp(v.savedAt)}
                      </span>
                      <button
                        onClick={() => handleRestore(v.id)}
                        className="ml-auto flex items-center gap-1 text-xs text-dusk-300 transition-colors hover:text-dusk-400"
                      >
                        <RotateCcw className="w-3 h-3" />
                        恢复此版
                      </button>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2 text-xs text-mist-300">
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
                ))
              )}
            </div>
          )}
        </div>

        <button
          onClick={() => onDelete(scene.id)}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-red-900/40 py-2.5 text-sm text-red-300 transition-colors hover:bg-red-900/60"
        >
          <Trash2 className="w-4 h-4" />
          删除此窗景
        </button>
      </div>
    </div>
  )
}

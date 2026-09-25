import { create } from 'zustand'
import type { WindowScene, SceneFormData, SceneVersion, EditableSceneFields } from '@/types'
import {
  getAllScenes,
  saveScene as storageSaveScene,
  updateScene as storageUpdateScene,
  deleteScene as storageDeleteScene,
  getScenesByRoute,
  getAllRouteNames,
  getRandomScene,
} from '@/services/storage'

/** 历史版本最多保留条数 */
const MAX_VERSIONS = 5

/** 把当前可修订字段留档为一个历史版本 */
function snapshotScene(scene: WindowScene): SceneVersion {
  return {
    weather: scene.weather,
    signText: scene.signText,
    treeDensity: scene.treeDensity,
    pedestrianStatus: scene.pedestrianStatus,
    note: scene.note,
    savedAt: new Date().toISOString(),
  }
}

interface SceneState {
  scenes: WindowScene[]
  routeNames: string[]
  currentRouteScenes: WindowScene[]
  selectedRoute: string
  randomScene: WindowScene | null

  loadAll: () => void
  saveScene: (data: SceneFormData) => void
  updateScene: (id: string, patch: EditableSceneFields) => void
  restoreVersion: (id: string, versionIndex: number) => void
  deleteScene: (id: string) => void
  selectRoute: (routeName: string) => void
  refreshRandom: () => void
}

export const useSceneStore = create<SceneState>((set) => ({
  scenes: [],
  routeNames: [],
  currentRouteScenes: [],
  selectedRoute: '',
  randomScene: null,

  loadAll: () => {
    const scenes = getAllScenes()
    const routeNames = getAllRouteNames()
    set({ scenes, routeNames })
  },

  saveScene: (data: SceneFormData) => {
    const scene: WindowScene = {
      ...data,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    }
    storageSaveScene(scene)
    const scenes = getAllScenes()
    const routeNames = getAllRouteNames()
    set((state) => {
      const currentRouteScenes =
        state.selectedRoute ? getScenesByRoute(state.selectedRoute) : []
      return { scenes, routeNames, currentRouteScenes }
    })
  },

  updateScene: (id: string, patch: EditableSceneFields) => {
    const scene = getAllScenes().find((s) => s.id === id)
    if (!scene) return
    // 先把修改前的内容留档,按时间倒序,最多保留 5 个版本
    const versions = [snapshotScene(scene), ...(scene.versions ?? [])].slice(0, MAX_VERSIONS)
    const updated: WindowScene = { ...scene, ...patch, versions }
    storageUpdateScene(updated)
    const scenes = getAllScenes()
    const routeNames = getAllRouteNames()
    set((state) => {
      const currentRouteScenes =
        state.selectedRoute ? getScenesByRoute(state.selectedRoute) : []
      const randomScene = state.randomScene?.id === id ? updated : state.randomScene
      return { scenes, routeNames, currentRouteScenes, randomScene }
    })
  },

  restoreVersion: (id: string, versionIndex: number) => {
    const scene = getAllScenes().find((s) => s.id === id)
    if (!scene) return
    const versions = scene.versions ?? []
    const target = versions[versionIndex]
    if (!target) return
    // 恢复前先把当前内容留档;被恢复的版本成为当前内容,从列表中移除
    const rest = versions.filter((_, i) => i !== versionIndex)
    const nextVersions = [snapshotScene(scene), ...rest].slice(0, MAX_VERSIONS)
    const updated: WindowScene = {
      ...scene,
      weather: target.weather,
      signText: target.signText,
      treeDensity: target.treeDensity,
      pedestrianStatus: target.pedestrianStatus,
      note: target.note,
      versions: nextVersions,
    }
    storageUpdateScene(updated)
    const scenes = getAllScenes()
    const routeNames = getAllRouteNames()
    set((state) => {
      const currentRouteScenes =
        state.selectedRoute ? getScenesByRoute(state.selectedRoute) : []
      const randomScene = state.randomScene?.id === id ? updated : state.randomScene
      return { scenes, routeNames, currentRouteScenes, randomScene }
    })
  },

  deleteScene: (id: string) => {
    storageDeleteScene(id)
    const scenes = getAllScenes()
    const routeNames = getAllRouteNames()
    set((state) => {
      const currentRouteScenes =
        state.selectedRoute ? getScenesByRoute(state.selectedRoute) : []
      return { scenes, routeNames, currentRouteScenes }
    })
  },

  selectRoute: (routeName: string) => {
    const currentRouteScenes = routeName ? getScenesByRoute(routeName) : []
    set({ selectedRoute: routeName, currentRouteScenes })
  },

  refreshRandom: () => {
    const randomScene = getRandomScene()
    set({ randomScene })
  },
}))

import { create } from 'zustand'
import type { WindowScene, SceneFormData, SceneEditData, SceneVersion } from '@/types'
import {
  getAllScenes,
  saveScene as storageSaveScene,
  updateScene as storageUpdateScene,
  deleteScene as storageDeleteScene,
  getScenesByRoute,
  getAllRouteNames,
  getRandomScene,
} from '@/services/storage'

const MAX_VERSIONS = 5

function snapshotVersion(scene: WindowScene): SceneVersion {
  return {
    id: crypto.randomUUID(),
    savedAt: new Date().toISOString(),
    weather: scene.weather,
    signText: scene.signText,
    treeDensity: scene.treeDensity,
    pedestrianStatus: scene.pedestrianStatus,
    note: scene.note,
  }
}

function refreshedState(selectedRoute: string) {
  const scenes = getAllScenes()
  const routeNames = getAllRouteNames()
  const currentRouteScenes = selectedRoute ? getScenesByRoute(selectedRoute) : []
  return { scenes, routeNames, currentRouteScenes }
}

interface SceneState {
  scenes: WindowScene[]
  routeNames: string[]
  currentRouteScenes: WindowScene[]
  selectedRoute: string
  randomScene: WindowScene | null

  loadAll: () => void
  saveScene: (data: SceneFormData) => void
  updateScene: (id: string, patch: SceneEditData) => WindowScene | null
  restoreVersion: (id: string, versionId: string) => WindowScene | null
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
    set((state) => refreshedState(state.selectedRoute))
  },

  updateScene: (id: string, patch: SceneEditData) => {
    const scene = getAllScenes().find((s) => s.id === id)
    if (!scene) return null
    const versions = [snapshotVersion(scene), ...(scene.versions ?? [])].slice(0, MAX_VERSIONS)
    const updated: WindowScene = { ...scene, ...patch, versions }
    storageUpdateScene(updated)
    set((state) => refreshedState(state.selectedRoute))
    return updated
  },

  restoreVersion: (id: string, versionId: string) => {
    const scene = getAllScenes().find((s) => s.id === id)
    if (!scene) return null
    const version = (scene.versions ?? []).find((v) => v.id === versionId)
    if (!version) return null
    const remaining = (scene.versions ?? []).filter((v) => v.id !== versionId)
    const versions = [snapshotVersion(scene), ...remaining].slice(0, MAX_VERSIONS)
    const updated: WindowScene = {
      ...scene,
      weather: version.weather,
      signText: version.signText,
      treeDensity: version.treeDensity,
      pedestrianStatus: version.pedestrianStatus,
      note: version.note,
      versions,
    }
    storageUpdateScene(updated)
    set((state) => refreshedState(state.selectedRoute))
    return updated
  },

  deleteScene: (id: string) => {
    storageDeleteScene(id)
    set((state) => refreshedState(state.selectedRoute))
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

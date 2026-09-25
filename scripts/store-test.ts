// Headless smoke test for the versioning store logic.
// Run: node_modules/.bin/esbuild scripts/store-test.ts --bundle --platform=node --tsconfig=tsconfig.json --outfile=/tmp/store-test.mjs && node /tmp/store-test.mjs

// --- localStorage stub (must be set before importing the store) ---
const mem = new Map<string, string>()
;(globalThis as Record<string, unknown>).localStorage = {
  getItem: (k: string) => (mem.has(k) ? mem.get(k)! : null),
  setItem: (k: string, v: string) => void mem.set(k, v),
  removeItem: (k: string) => void mem.delete(k),
  clear: () => mem.clear(),
}

const { useSceneStore } = await import('../src/store/useSceneStore')
const { saveScene } = await import('../src/services/storage')

let failures = 0
function check(name: string, cond: boolean) {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}`)
  if (!cond) failures++
}

const store = () => useSceneStore.getState()

// 1. Seed an OLD-style record (no `versions` field), as saved before this feature
saveScene({
  id: 'old-1',
  routeName: '307路',
  segment: '体育馆 → 火车站',
  seatDirection: '左',
  timestamp: '2026-09-20T08:00:00.000Z',
  weather: '晴',
  signText: '老王烧饼',
  treeDensity: '适中',
  pedestrianStatus: '稀少',
  note: ' original note',
} as never)
store().loadAll()

// 2. Old record can be edited; pre-edit content gets archived
store().updateScene('old-1', {
  weather: '小雨',
  signText: '老王烧饼',
  treeDensity: '茂密',
  pedestrianStatus: '密集',
  note: 'edited note 1',
})
let s = store().scenes.find((x) => x.id === 'old-1')!
check('edit applies new values', s.note === 'edited note 1' && s.weather === '小雨')
check('fixed fields untouched', s.routeName === '307路' && s.segment === '体育馆 → 火车站' && s.timestamp === '2026-09-20T08:00:00.000Z' && s.seatDirection === '左')
check('pre-edit content archived', s.versions!.length === 1 && s.versions![0].note === ' original note' && s.versions![0].weather === '晴')
check('version has savedAt', typeof s.versions![0].savedAt === 'string' && s.versions![0].savedAt.length > 0)

// 3. Six more edits -> versions capped at 5, newest first
for (let i = 2; i <= 7; i++) {
  store().updateScene('old-1', {
    weather: '阴',
    signText: `sign ${i}`,
    treeDensity: '稀疏',
    pedestrianStatus: '零星',
    note: `edited note ${i}`,
  })
}
s = store().scenes.find((x) => x.id === 'old-1')!
check('versions capped at 5', s.versions!.length === 5)
check('newest version first', s.versions![0].note === 'edited note 6')
check('oldest retained is note 2 (note 1 evicted)', s.versions![4].note === 'edited note 2')
check('current note is latest edit', s.note === 'edited note 7')

// 4. Restore the oldest archived version: current content archived first, restored entry removed
store().restoreVersion('old-1', 4)
s = store().scenes.find((x) => x.id === 'old-1')!
check('restore applies version content', s.note === 'edited note 2' && s.signText === 'sign 2')
check('restore archives current content first', s.versions![0].note === 'edited note 7')
check('restored entry removed from list', s.versions!.length === 5 && !s.versions!.some((v) => v.note === 'edited note 2'))
check('fixed fields still untouched after restore', s.routeName === '307路' && s.timestamp === '2026-09-20T08:00:00.000Z')

// 5. Persistence: reload from storage keeps versions
store().loadAll()
s = store().scenes.find((x) => x.id === 'old-1')!
check('versions persist across reload', s.versions!.length === 5 && s.note === 'edited note 2')

// 6. Invalid restore index is a no-op
const before = JSON.stringify(store().scenes)
store().restoreVersion('old-1', 99)
check('out-of-range restore is a no-op', JSON.stringify(store().scenes) === before)

console.log(failures === 0 ? '\nAll checks passed' : `\n${failures} check(s) FAILED`)
process.exit(failures === 0 ? 0 : 1)

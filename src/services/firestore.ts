import { doc, getDoc, setDoc } from 'firebase/firestore'
import { getDb, firebaseReady } from '@/lib/firebase'

const COLLECTION = 'signalConfig'
const NEAR_MISS_COLLECTION = 'nearMissByLeg'
const TRAFFIC_LIGHT_COLLECTION = 'trafficLightConfig'
const SEARCH_PARAMS_COLLECTION = 'searchParams'

export interface NearMissLegRow {
  allRoadUsers: number
  onlyVehicles: number
  bicycleInvolved: number
  pedestrianInvolved: number
}

export interface NearMissByLegData {
  dateTimeRange?: string
  nLeg: NearMissLegRow
  sLeg: NearMissLegRow
  eLeg: NearMissLegRow
  wLeg: NearMissLegRow
  updatedAt?: string
}

export interface SignalConfigData {
  cycleSeconds: number
  signalName: string
  deviceId: string
  updatedAt: string
}

export type TrafficLightLegKey = 'nLeg' | 'sLeg' | 'eLeg' | 'wLeg'
export interface TrafficLightPhaseConfig {
  green: number
  yellow: number
  red: number
}
export interface TrafficLightConfigData {
  nLeg: TrafficLightPhaseConfig
  sLeg: TrafficLightPhaseConfig
  eLeg: TrafficLightPhaseConfig
  wLeg: TrafficLightPhaseConfig
  updatedAt?: string
}

export function defaultTrafficLightConfig(): TrafficLightConfigData {
  return {
    nLeg: { green: 25, yellow: 4, red: 30 },
    sLeg: { green: 25, yellow: 4, red: 30 },
    eLeg: { green: 22, yellow: 4, red: 33 },
    wLeg: { green: 22, yellow: 4, red: 33 },
    updatedAt: new Date().toISOString(),
  }
}

export async function getTrafficLightConfig(signalId: string): Promise<TrafficLightConfigData | null> {
  const db = getDb()
  if (!db) return null
  const ref = doc(db, TRAFFIC_LIGHT_COLLECTION, signalId)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  return snap.data() as TrafficLightConfigData
}

export async function saveTrafficLightConfig(
  signalId: string,
  data: Omit<TrafficLightConfigData, 'updatedAt'>
): Promise<void> {
  const db = getDb()
  if (!db) return
  const ref = doc(db, TRAFFIC_LIGHT_COLLECTION, signalId)
  await setDoc(ref, {
    ...data,
    updatedAt: new Date().toISOString(),
  })
}

export interface SearchParamsData {
  timeFrom: string
  timeTo: string
  compareFrom: string
  compareTo: string
  updatedAt?: string
}

export async function getSearchParams(signalId: string): Promise<SearchParamsData | null> {
  const db = getDb()
  if (!db) return null
  const ref = doc(db, SEARCH_PARAMS_COLLECTION, signalId)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  return snap.data() as SearchParamsData
}

export async function saveSearchParams(
  signalId: string,
  data: Omit<SearchParamsData, 'updatedAt'>
): Promise<void> {
  const db = getDb()
  if (!db) return
  const ref = doc(db, SEARCH_PARAMS_COLLECTION, signalId)
  await setDoc(ref, {
    ...data,
    updatedAt: new Date().toISOString(),
  })
}

export async function getSignalConfig(
  signalId: string
): Promise<SignalConfigData | null> {
  const db = getDb()
  if (!db) return null
  const ref = doc(db, COLLECTION, signalId)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  const data = snap.data()
  return data as SignalConfigData
}

export async function saveSignalConfig(
  signalId: string,
  data: Omit<SignalConfigData, 'updatedAt'>
): Promise<void> {
  const db = getDb()
  if (!db) return
  const ref = doc(db, COLLECTION, signalId)
  await setDoc(ref, {
    ...data,
    updatedAt: new Date().toISOString(),
  })
}

const emptyLegRow = (): NearMissLegRow => ({
  allRoadUsers: 0,
  onlyVehicles: 0,
  bicycleInvolved: 0,
  pedestrianInvolved: 0,
})

export function defaultNearMissByLeg(): NearMissByLegData {
  const now = new Date()
  const start = new Date(now)
  start.setDate(start.getDate() - 30)
  const format = (d: Date) => d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
  return {
    dateTimeRange: `${format(start)} - ${format(now)}`,
    nLeg: { allRoadUsers: 2, onlyVehicles: 1, bicycleInvolved: 0, pedestrianInvolved: 1 },
    sLeg: { allRoadUsers: 5, onlyVehicles: 3, bicycleInvolved: 1, pedestrianInvolved: 1 },
    eLeg: { allRoadUsers: 1, onlyVehicles: 1, bicycleInvolved: 0, pedestrianInvolved: 0 },
    wLeg: { allRoadUsers: 3, onlyVehicles: 2, bicycleInvolved: 0, pedestrianInvolved: 1 },
    updatedAt: new Date().toISOString(),
  }
}

export async function getNearMissByLeg(signalId: string): Promise<NearMissByLegData | null> {
  const db = getDb()
  if (!db) return null
  const ref = doc(db, NEAR_MISS_COLLECTION, signalId)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  return snap.data() as NearMissByLegData
}

export async function setNearMissByLeg(signalId: string, data: NearMissByLegData): Promise<void> {
  const db = getDb()
  if (!db) return
  const ref = doc(db, NEAR_MISS_COLLECTION, signalId)
  await setDoc(ref, { ...data, updatedAt: new Date().toISOString() })
}

export async function seedNearMissIfEmpty(signalId: string): Promise<NearMissByLegData> {
  const existing = await getNearMissByLeg(signalId)
  if (existing) return existing
  const defaultData = defaultNearMissByLeg()
  await setNearMissByLeg(signalId, defaultData)
  return defaultData
}

export { firebaseReady }

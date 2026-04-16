import { SECT_NAME_PARTS } from '@/config'
import { sample, uid } from '@/utils'

export const OFFICIAL_FACTION_TYPES = new Set(['court', 'bureau', 'garrison'])
export const FACTION_LEAVE_REPUTATION_COST = 8
export const FACTION_REJOIN_COOLDOWN_DAYS = 12
export const OFFICIAL_PURSUIT_DAYS = 12
export const FACTION_TYPE_LABELS: Record<string, string> = {
  village: '乡社', society: '行社', guild: '商帮', escort: '镖局',
  court: '官府', bureau: '转运司', garrison: '军府', order: '行院',
}

const PLAYER_FACTION_NAME_PARTS = {
  prefix: ['河埠', '听潮', '玄灯', '归帆', '雁行', '青禾', '云泽', '赤崖'],
  suffix: ['商社', '会盟', '行号', '驿团', '外局', '义行', '柜坊', '货盟'],
}

export const PLAYER_FACTION_BRANCHES: Record<string, { label: string; desc: string; baseCost: number }> = {
  caravan: { label: '商队线', desc: '扩车队、压货线和跨城分销。', baseCost: 180 },
  safehouse: { label: '货栈点', desc: '设栈屯货，减缓断供和路损。', baseCost: 140 },
  watch: { label: '耳目网', desc: '布置门路和线人，方便接单、疏通和护路。', baseCost: 160 },
}

export function createTask(ownerType: string, kind: string, payload: Record<string, unknown> = {}) {
  return { id: uid(`${ownerType}-${kind}`), ownerType, kind, ...payload }
}

export function createFactionName() {
  return `${sample(PLAYER_FACTION_NAME_PARTS.prefix)}${sample(PLAYER_FACTION_NAME_PARTS.suffix)}`
}

export function createSectName() {
  return `${sample(SECT_NAME_PARTS.prefix)}${sample(SECT_NAME_PARTS.suffix)}`
}
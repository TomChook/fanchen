export interface KnowledgeData {
  id: string
  itemId: string
  name: string
  rarity: string
  tier: number
  minRankIndex: number
  minInsight: number
  baseValue: number
  desc: string
  effect: Record<string, number>
  tags: string[]
}

export const KNOWLEDGE_ENTRIES: KnowledgeData[] = [
  {
    id: 'knowledge-field-rotation',
    itemId: 'field-rotation-notes',
    name: '田亩轮作札记',
    rarity: 'uncommon',
    tier: 1,
    minRankIndex: 0,
    minInsight: 4,
    baseValue: 180,
    desc: '把薄田轮作、补地和省种之法记成短册，读过后能少走不少农事弯路。',
    effect: { farming: 1, insight: 1 },
    tags: ['农学', '轮作', '启蒙'],
  },
  {
    id: 'knowledge-forge-primer',
    itemId: 'forge-opening-record',
    name: '百工开炉要录',
    rarity: 'uncommon',
    tier: 1,
    minRankIndex: 1,
    minInsight: 5,
    baseValue: 220,
    desc: '讲的是火候、翻锤和看料，读懂后能让工坊手艺更稳，出手也更有章法。',
    effect: { crafting: 1, power: 0.8 },
    tags: ['工学', '开炉', '锻打'],
  },
  {
    id: 'knowledge-merchant-ledger',
    itemId: 'merchant-ledger',
    name: '行商算筹录',
    rarity: 'uncommon',
    tier: 1,
    minRankIndex: 1,
    minInsight: 5,
    baseValue: 240,
    desc: '记着压货、点价和算路费的诀窍，适合想把买卖做稳的人。',
    effect: { trading: 1, charisma: 1 },
    tags: ['商学', '账册', '压货'],
  },
  {
    id: 'knowledge-etiquette-handbook',
    itemId: 'etiquette-handbook',
    name: '门礼应对篇',
    rarity: 'rare',
    tier: 2,
    minRankIndex: 1,
    minInsight: 7,
    baseValue: 360,
    desc: '宗门、官面、商会三套场面话都在里头，读懂后与人打交道会顺得多。',
    effect: { charisma: 2, trading: 1 },
    tags: ['礼法', '应对', '门路'],
  },
  {
    id: 'knowledge-pulse-observation',
    itemId: 'pulse-observation-record',
    name: '望气辨脉录',
    rarity: 'rare',
    tier: 2,
    minRankIndex: 2,
    minInsight: 8,
    baseValue: 420,
    desc: '以望气和辨脉入手，适合提升悟性与对自身气机的感知。',
    effect: { insight: 2, power: 0.4 },
    tags: ['望气', '辨脉', '识机'],
  },
  {
    id: 'knowledge-route-gazetteer',
    itemId: 'route-gazetteer',
    name: '驿路地志抄',
    rarity: 'rare',
    tier: 2,
    minRankIndex: 2,
    minInsight: 8,
    baseValue: 460,
    desc: '按水路、驿路和关隘记下各地物产与人情，对跑商和周转都很有帮助。',
    effect: { trading: 1, insight: 1, farming: 1 },
    tags: ['地志', '驿路', '货路'],
  },
]

export const KNOWLEDGE_MAP = new Map(KNOWLEDGE_ENTRIES.map((knowledge) => [knowledge.id, knowledge]))

export function getKnowledge(knowledgeId: string) {
  return KNOWLEDGE_MAP.get(knowledgeId)
}
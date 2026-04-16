<template>
  <div class="inventory-panel">
    <p class="panel-intro">行囊里装着兵刃、护具、秘籍与契物；已学功法则单独记在心法与术法里，随时影响你的修行、战斗与宗门传承。</p>

    <div class="inventory-grid">
      <UiPanelCard tone="item">
        <UiCardHeader kicker="兵器" :title="equippedItem(player.equipment.weapon)?.name || '未装备'" title-class="item-title">
          <template #aside>
            <UiPill variant="rarity" :tone="equippedItem(player.equipment.weapon) ? RARITY_META[equippedItem(player.equipment.weapon)!.rarity].color : 'common'">
              {{ equippedItem(player.equipment.weapon) ? RARITY_META[equippedItem(player.equipment.weapon)!.rarity].label : '空位' }}
            </UiPill>
          </template>
        </UiCardHeader>
        <p class="item-meta">{{ equippedItem(player.equipment.weapon)?.desc || '行囊中的兵器可以在这里替换。' }}</p>
        <p class="item-meta">{{ describeItemEffect(equippedItem(player.equipment.weapon)) }}</p>
      </UiPanelCard>
      <UiPanelCard tone="item">
        <UiCardHeader kicker="护甲" :title="equippedItem(player.equipment.armor)?.name || '未装备'" title-class="item-title">
          <template #aside>
            <UiPill variant="rarity" :tone="equippedItem(player.equipment.armor) ? RARITY_META[equippedItem(player.equipment.armor)!.rarity].color : 'common'">
              {{ equippedItem(player.equipment.armor) ? RARITY_META[equippedItem(player.equipment.armor)!.rarity].label : '空位' }}
            </UiPill>
          </template>
        </UiCardHeader>
        <p class="item-meta">{{ equippedItem(player.equipment.armor)?.desc || '护甲会直接影响你的生存能力。' }}</p>
        <p class="item-meta">{{ describeItemEffect(equippedItem(player.equipment.armor)) }}</p>
      </UiPanelCard>
      <UiPanelCard tone="item">
        <UiCardHeader kicker="当前心法" :title="currentHeart?.name || '未启用心法'" title-class="item-title">
          <template #aside>
            <UiPill variant="rarity" :tone="currentHeart ? RARITY_META[currentHeart.rarity].color : 'common'">
              {{ currentHeart ? RARITY_META[currentHeart.rarity].label : '空位' }}
            </UiPill>
          </template>
        </UiCardHeader>
        <p class="item-meta">{{ currentHeart?.desc || '一次只能启用一门心法；修炼相关行动会提升它的熟练度。' }}</p>
        <p class="item-meta">{{ currentHeart ? `${getTechniqueKindLabel(currentHeart.kind)} · 第${heartState?.stage || 1}阶 · 熟练 ${techniquePercent(currentHeart.id)}%` : '学会心法后即可在下方切换。' }}</p>
        <p class="item-meta">{{ currentHeart ? describeTechniqueEffect(currentHeart.effect) : '' }}</p>
      </UiPanelCard>
    </div>

    <h3 class="subsection-title">已学功法</h3>
    <div class="inventory-grid">
      <template v-if="learnedTechniques.length">
        <UiPanelCard v-for="entry in learnedTechniques" :key="entry.technique.id" tone="item">
          <UiCardHeader :kicker="getTechniqueKindLabel(entry.technique.kind)" :title="entry.technique.name" title-class="item-title">
            <template #aside>
              <UiPill variant="rarity" :tone="RARITY_META[entry.technique.rarity].color">
                {{ RARITY_META[entry.technique.rarity].label }}
              </UiPill>
            </template>
          </UiCardHeader>
          <p class="item-meta">{{ entry.technique.desc }}</p>
          <p class="item-meta">需求：{{ getRankName(entry.technique.minRankIndex) }} · 悟性 {{ entry.technique.minInsight }}</p>
          <p class="item-meta">熟练：第{{ entry.state.stage }}阶 · {{ techniquePercent(entry.technique.id) }}%<span v-if="entry.state.scribeCharges"> · 可誊写 {{ entry.state.scribeCharges }} 册</span></p>
          <p class="item-meta">效果：{{ describeTechniqueEffect(entry.technique.effect) || '暂无特殊效果。' }}</p>
          <UiActionGroup>
            <button
              v-if="entry.technique.kind === 'heart'"
              class="item-button"
              :aria-disabled="player.equipment.heart === entry.technique.id ? 'true' : 'false'"
              :disabled="player.equipment.heart === entry.technique.id"
              @click="doEquipHeart(entry.technique.id)"
            >
              {{ player.equipment.heart === entry.technique.id ? '当前心法' : '设为心法' }}
            </button>
            <button
              v-if="canScribe(entry.technique.id)"
              class="item-button"
              @click="doScribe(entry.technique.id)"
            >
              誊写秘籍
            </button>
          </UiActionGroup>
        </UiPanelCard>
      </template>
      <div v-else class="empty-state">你暂时还没学会任何功法，先从秘籍开始入门。</div>
    </div>

    <h3 class="subsection-title">行囊</h3>
    <div class="inventory-grid">
      <template v-if="sortedInventory.length">
        <UiPanelCard v-for="entry in sortedInventory" :key="entry.itemId" tone="item">
          <UiCardHeader :title="`${itemOf(entry).name} x${entry.quantity}`" title-class="item-title">
            <template #aside>
              <UiPill variant="rarity" :tone="RARITY_META[itemOf(entry).rarity].color">{{ RARITY_META[itemOf(entry).rarity].label }}</UiPill>
            </template>
          </UiCardHeader>
          <p class="item-meta">{{ itemOf(entry).desc }}</p>
          <p class="item-meta">效果：{{ describeItemEffect(itemOf(entry)) || '可在交易、建宗或战斗中使用。' }}</p>
          <UiActionGroup>
            <button
              class="item-button"
              :aria-disabled="isManualLearnDisabled(entry.itemId) ? 'true' : 'false'"
              :disabled="isManualLearnDisabled(entry.itemId)"
              @click="doConsume(entry.itemId)"
            >
              {{ primaryActionLabel(entry.itemId) }}
            </button>
            <button class="item-button" @click="doSell(entry.itemId)">出售一件</button>
            <button v-if="player.sect && itemOf(entry).type === 'manual' && itemOf(entry).manualSkillId" class="item-button" @click="doStash(entry.itemId)">收入藏经阁</button>
          </UiActionGroup>
        </UiPanelCard>
      </template>
      <div v-else class="empty-state">你的行囊暂时空空如也，出去历练或做生意吧。</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useGameStore } from '@/stores/game'
import { RARITY_META, RANKS, getItem, getTechnique } from '@/config'
import { describeItemEffect, describeTechniqueEffect, getTechniqueKindLabel } from '@/composables/useUIHelpers'
import { consumeItem, sellItem, stashManualToSect } from '@/systems/player'
import {
  canScribeTechnique,
  equipHeartTechnique,
  getLearnedTechniques,
  getTechniqueMasteryPercent,
  hasLearnedTechnique,
  scribeTechnique,
} from '@/systems/techniques'
import UiActionGroup from '@/components/ui/UiActionGroup.vue'
import UiCardHeader from '@/components/ui/UiCardHeader.vue'
import UiPanelCard from '@/components/ui/UiPanelCard.vue'
import UiPill from '@/components/ui/UiPill.vue'

const store = useGameStore()
const { player } = storeToRefs(store)

function equippedItem(itemId: string | null) {
  return itemId ? getItem(itemId) : null
}

function itemOf(entry: { itemId: string }) {
  return getItem(entry.itemId)!
}

function getRankName(idx: number) {
  return RANKS[Math.min(idx, RANKS.length - 1)].name
}

const sortedInventory = computed(() =>
  [...player.value.inventory].sort((a, b) => (getItem(b.itemId)?.baseValue || 0) - (getItem(a.itemId)?.baseValue || 0))
)

const currentHeart = computed(() => player.value.equipment.heart ? getTechnique(player.value.equipment.heart) || null : null)

const heartState = computed(() => currentHeart.value ? player.value.learnedTechniques[currentHeart.value.id] || null : null)

const learnedTechniques = computed(() => {
  void player.value.learnedTechniques
  return getLearnedTechniques()
})

function techniquePercent(skillId: string) {
  return getTechniqueMasteryPercent(skillId)
}

function canScribe(skillId: string) {
  return canScribeTechnique(skillId)
}

function primaryActionLabel(itemId: string) {
  const item = getItem(itemId)
  if (!item) return '使用'
  if (item.type === 'weapon' || item.type === 'armor') return '装备'
  if (item.type === 'manual') return item.manualSkillId && hasLearnedTechnique(item.manualSkillId) ? '已学会' : '学习秘籍'
  return '使用'
}

function isManualLearnDisabled(itemId: string) {
  const item = getItem(itemId)
  return Boolean(item?.type === 'manual' && item.manualSkillId && hasLearnedTechnique(item.manualSkillId))
}

function doConsume(itemId: string) { consumeItem(itemId) }
function doSell(itemId: string) { sellItem(itemId) }
function doStash(itemId: string) { stashManualToSect(itemId) }
function doEquipHeart(skillId: string) { equipHeartTechnique(skillId) }
function doScribe(skillId: string) { scribeTechnique(skillId) }
</script>

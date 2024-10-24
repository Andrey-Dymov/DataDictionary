<template>
  <div class="relations-list">
    <div class="text-h6 q-mb-md">
      Связи
      <q-btn
        flat
        round
        dense
        color="primary"
        icon="add"
        @click="$emit('addRelation')"
        class="float-right"
      >
        <q-tooltip>Добавить связь</q-tooltip>
      </q-btn>
    </div>
    <q-list bordered separator>
      <q-item
        v-for="(relation, name) in relations"
        :key="name"
        class="q-py-md"
        clickable
        @click="$emit('editRelation', { name, ...relation })"
      >
        <q-item-section>
          <div class="text-subtitle1 text-weight-medium text-center q-mb-sm">{{ name }}</div>
          <div class="row items-center justify-between q-col-gutter-md">
            <div class="col-4 text-center">
              <div class="text-caption text-grey-7">{{ getSourceRole(relation.type) }}</div>
              <div class="text-subtitle2">{{ sourceName }} - {{ sourcePrompt }}</div>
              <q-badge
                color="primary"
                text-color="white"
                class="q-mt-xs field-badge"
              >
                {{ getSourceField(relation) }}
              </q-badge>
            </div>
            <div class="col-4 text-center">
              <div class="relation-icon" v-html="getRelationIcon(relation.type)"></div>
              <div class="text-caption q-mt-xs">{{ getRelationTypeText(relation.type) }}</div>
            </div>
            <div class="col-4 text-center">
              <div class="text-caption text-grey-7">{{ getTargetRole(relation.type) }}</div>
              <div class="text-subtitle2">{{ relation.target }} - {{ getTargetPrompt(relation.target) }}</div>
              <q-badge
                color="primary"
                text-color="white"
                class="q-mt-xs field-badge"
              >
                {{ getTargetField(relation) }}
              </q-badge>
            </div>
          </div>
        </q-item-section>
        <q-item-section side>
          <q-btn flat round color="grey" icon="delete" @click.stop="$emit('deleteRelation', name)">
            <q-tooltip>Удалить связь</q-tooltip>
          </q-btn>
        </q-item-section>
      </q-item>
    </q-list>
  </div>
</template>

<script>
import { defineComponent } from 'vue'
import { manyToManySvg, oneToManySvg, manyToOneSvg } from '../assets/icons/relations'
import { useSchemaStore } from '../stores/schema'

export default defineComponent({
  name: 'RelationsList',

  props: {
    relations: {
      type: Object,
      required: true
    },
    sourceName: {
      type: String,
      required: true
    },
    sourcePrompt: {
      type: String,
      required: true
    }
  },

  emits: ['editRelation', 'deleteRelation', 'addRelation'],

  setup(props) {
    const schemaStore = useSchemaStore()

    const getSourceRole = (type) => {
      switch (type) {
        case 'hasMany':
          return 'Родитель'
        case 'belongsTo':
        case 'belongsToMany':
          return 'Ребенок'
        default:
          return ''
      }
    }

    const getTargetRole = (type) => {
      switch (type) {
        case 'hasMany':
          return 'Ребенок'
        case 'belongsTo':
        case 'belongsToMany':
          return 'Родитель'
        default:
          return ''
      }
    }

    const getRelationIcon = (type) => {
      switch (type) {
        case 'hasMany':
          return oneToManySvg
        case 'belongsTo':
          return manyToOneSvg
        case 'belongsToMany':
          return manyToManySvg
        default:
          return ''
      }
    }

    const getTargetPrompt = (targetName) => {
      const targetCollection = schemaStore.collections.find(c => c.name === targetName)
      return targetCollection ? targetCollection.prompt : ''
    }

    const getSourceField = (relation) => {
      switch (relation.type) {
        case 'hasMany':
          return 'id'
        case 'belongsTo':
        case 'belongsToMany':
          return relation.foreignKey
        default:
          return ''
      }
    }

    const getTargetField = (relation) => {
      switch (relation.type) {
        case 'hasMany':
          return relation.foreignKey
        case 'belongsTo':
        case 'belongsToMany':
          return 'id'
        default:
          return ''
      }
    }

    const getRelationTypeText = (type) => {
      switch (type) {
        case 'hasMany':
          return 'Один ко многим'
        case 'belongsTo':
          return 'Многие к одному'
        case 'belongsToMany':
          return 'Многие ко многим'
        default:
          return ''
      }
    }

    return {
      getSourceRole,
      getTargetRole,
      getRelationIcon,
      getTargetPrompt,
      getSourceField,
      getTargetField,
      getRelationTypeText
    }
  }
})
</script>

<style lang="sass" scoped>
.relations-list
  .relation-icon
    width: 24px
    height: 24px
    margin: 0 auto
    svg
      width: 100%
      height: 100%

  .field-badge
    border-radius: 4px
    font-size: 0.7rem
    padding: 2px 6px

  .text-caption
    font-size: 0.75rem
    line-height: 1.2

  .text-grey-7
    opacity: 0.7

  .q-item
    cursor: pointer
</style>

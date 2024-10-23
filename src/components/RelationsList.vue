<template>
  <q-card flat bordered>
    <q-card-section>
      <div class="row items-center q-mb-sm">
        <div class="text-subtitle2">Связи</div>
        <q-space />
        <q-btn flat round dense color="primary" icon="add" @click="$emit('addRelation')">
          <q-tooltip>Добавить связь</q-tooltip>
        </q-btn>
      </div>
      <q-list dense separator>
        <q-item v-for="(relation, name) in relations" 
                :key="name" 
                class="q-py-xs" 
                clickable 
                @click="$emit('editRelation', { name, ...relation })">
          <q-item-section avatar>
            <div class="relation-icon" v-html="getRelationSvg(relation.type)" />
          </q-item-section>
          
          <q-item-section>
            <q-item-label class="text-subtitle2">{{ name }}</q-item-label>
            <q-item-label caption>
              <div class="row items-center q-gutter-x-sm">
                <q-badge color="primary">
                  {{ getRelationTypeLabel(relation.type) }}
                </q-badge>
                <q-badge color="secondary">
                  {{ relation.target }}
                </q-badge>
                <q-badge :color="getRestrictionColor(relation.restriction)">
                  {{ getRestrictionLabel(relation.restriction) }}
                </q-badge>
              </div>
            </q-item-label>
          </q-item-section>

          <q-item-section side>
            <q-btn flat round dense color="grey-6" icon="delete" @click.stop="confirmDelete(name)">
              <q-tooltip>Удалить связь</q-tooltip>
            </q-btn>
          </q-item-section>
        </q-item>
      </q-list>
    </q-card-section>
  </q-card>
</template>

<script>
import { defineComponent } from 'vue'
import { useQuasar } from 'quasar'
import { manyToManySvg, oneToManySvg, manyToOneSvg } from '../assets/icons/relations'

export default defineComponent({
  name: 'RelationsList',
  props: {
    relations: {
      type: Object,
      required: true
    }
  },
  emits: ['deleteRelation', 'addRelation', 'editRelation'],
  setup(props, { emit }) {
    const $q = useQuasar()

    const getRelationSvg = (type) => {
      switch (type) {
        case 'hasMany': return oneToManySvg
        case 'belongsTo': return manyToOneSvg
        case 'belongsToMany': return manyToManySvg
        default: return oneToManySvg
      }
    }

    const getRelationTypeLabel = (type) => {
      switch (type) {
        case 'hasMany': return 'Один ко многим'
        case 'belongsTo': return 'Многие к одному'
        case 'belongsToMany': return 'Многие ко многим'
        default: return type
      }
    }

    const getRestrictionLabel = (restriction) => {
      switch (restriction) {
        case 'restrict': return 'Запрет'
        case 'cascade': return 'Каскад'
        case 'setnull': return 'Обнуление'
        default: return 'Запрет'
      }
    }

    const getRestrictionColor = (restriction) => {
      switch (restriction) {
        case 'restrict': return 'negative'
        case 'cascade': return 'warning'
        case 'setnull': return 'info'
        default: return 'grey'
      }
    }

    const confirmDelete = (name) => {
      $q.dialog({
        title: 'Подтверждение',
        message: `Вы уверены, что хотите удалить связь "${name}"?`,
        cancel: true,
        persistent: true
      }).onOk(() => {
        emit('deleteRelation', name)
      })
    }

    return {
      getRelationSvg,
      getRelationTypeLabel,
      getRestrictionLabel,
      getRestrictionColor,
      confirmDelete
    }
  }
})
</script>

<style lang="sass">
.relation-icon
  width: 24px
  height: 24px
  display: flex
  align-items: center
  justify-content: center
  color: var(--q-primary)

  svg
    width: 100%
    height: 100%

.q-badge
  font-size: 12px
  padding: 4px 8px
  
  .q-icon
    font-size: 14px
    margin-right: 4px
</style>
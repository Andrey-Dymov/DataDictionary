<template>
  <div class="entity-list">
    <div class="row items-center q-mb-md q-px-md">
      <div class="text-h4 q-mr-auto">Сущности</div>
      <q-btn
        flat
        round
        dense
        color="primary"
        icon="add"
        @click="onAddEntity"
      >
        <q-tooltip>Добавить сущность</q-tooltip>
      </q-btn>
    </div>

    <q-list padding dense>
      <template v-if="entities.length > 0">
        <q-item
          v-for="entity in entities"
          :key="entity.name"
          :active="entity.name === selectedEntityName"
          active-class="bg-primary text-white"
          dense
        >
          <div 
            class="row full-width items-center cursor-pointer"
            @click="onSelectEntity(entity.name)"
          >
            <q-item-section
              v-if="entity.icon"
              avatar
            >
              <q-icon :name="entity.icon" :color="entity.name === selectedEntityName ? 'white' : 'primary'" />
            </q-item-section>

            <q-item-section>
              <q-item-label>{{ entity.name }} - {{ entity.prompt }}</q-item-label>
              <q-item-label caption>{{ entity.description }}</q-item-label>
            </q-item-section>
          </div>

          <q-item-section side>
            <div class="row items-center no-wrap">
              <q-btn
                flat
                round
                dense
                color="grey-6"
                icon="edit"
                @click.stop="onEditEntity(entity)"
              >
                <q-tooltip>Редактировать сущность</q-tooltip>
              </q-btn>
              <q-btn
                flat
                round
                dense
                color="grey-6"
                icon="delete"
                @click.stop="confirmDelete(entity)"
              >
                <q-tooltip>Удалить сущность</q-tooltip>
              </q-btn>
            </div>
          </q-item-section>
        </q-item>
      </template>
      <q-item v-else class="text-grey" dense>
        <q-item-section>
          Нет доступных сущностей
        </q-item-section>
      </q-item>
    </q-list>
  </div>
</template>

<script>
import { defineComponent } from 'vue'
import { useQuasar } from 'quasar'

export default defineComponent({
  name: 'EntityList',

  props: {
    entities: {
      type: Array,
      required: true
    },
    selectedEntityName: {
      type: String,
      default: ''
    }
  },

  emits: ['addEntity', 'selectEntity', 'deleteEntity', 'editEntity'],

  setup(props, { emit }) {
    const $q = useQuasar()

    const onAddEntity = () => {
      console.log('[EntityList] Add entity clicked')
      emit('addEntity')
    }

    const onSelectEntity = (name) => {
      console.log('[EntityList] Select entity:', name)
      emit('selectEntity', name)
    }

    const onEditEntity = (entity) => {
      console.log('[EntityList] Edit entity:', entity.name)
      emit('editEntity', entity)
    }

    const confirmDelete = (entity) => {
      $q.dialog({
        title: 'Подтверждение',
        message: `Вы уверены, что хотите удалить сущность "${entity.prompt || entity.name}"?`,
        cancel: true,
        persistent: true
      }).onOk(() => {
        console.log('[EntityList] Delete entity confirmed:', entity.name)
        emit('deleteEntity', entity.name)
      })
    }

    return {
      onAddEntity,
      onSelectEntity,
      onEditEntity,
      confirmDelete
    }
  }
})
</script>

<style lang="sass">
.q-item
  &:hover
    background: rgba($primary, 0.1)
    &.q-item--active
      background: scale($primary, 10%) !important
    &:not(.q-item--active)
      background-color: rgba($primary, 0.1)

  &.q-item--active
    background: $primary
    color: white
    .text-grey-7
      color: rgba(255,255,255,0.7) !important

.entity-item
  padding: 8px 16px
  border-radius: 4px
  margin-bottom: 4px
  transition: all 0.3s ease

  &:hover
    background: rgba($primary, 0.1)

  &.selected
    background: scale($primary, 10%)
    color: white

    .text-grey-7
      color: rgba(255,255,255,0.7)

.entity-actions
  opacity: 0
  transition: opacity 0.3s ease

  .q-item:hover &
    opacity: 1

.entity-icon
  width: 24px
  height: 24px
  margin-right: 12px

.cursor-pointer
  cursor: pointer

.q-item__section--side
  .row
    gap: 4px
</style>

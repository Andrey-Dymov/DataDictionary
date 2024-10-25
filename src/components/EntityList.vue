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
        @click="$emit('addEntity')"
      >
        <q-tooltip>Добавить сущность</q-tooltip>
      </q-btn>
    </div>

    <q-list padding>
      <template v-if="entities.length > 0">
        <q-item
          v-for="entity in entities"
          :key="entity.name"
          :active="entity.name === selectedEntityName"
          active-class="bg-primary text-white"
        >
          <div 
            class="row full-width items-center cursor-pointer"
            @click="$emit('selectEntity', entity.name)"
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
            <div class="row items-center">
              <q-btn
                flat
                round
                dense
                color="grey-6"
                icon="edit"
                @click.stop="$emit('editEntity', entity.name)"
              >
                <q-tooltip>Редактировать сущность</q-tooltip>
              </q-btn>
              <q-btn
                flat
                round
                dense
                color="grey-6"
                icon="delete"
                @click.stop="$emit('deleteEntity', entity.name)"
              >
                <q-tooltip>Удалить сущность</q-tooltip>
              </q-btn>
            </div>
          </q-item-section>
        </q-item>
      </template>
      <q-item v-else class="text-grey">
        <q-item-section>
          Нет доступных сущностей
        </q-item-section>
      </q-item>
    </q-list>
  </div>
</template>

<script>
import { defineComponent } from 'vue'

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

  setup() {
    // Здесь может быть дополнительная логика, если потребуется
    return {}
  }
})
</script>

<style lang="sass" scoped>
.entity-list
  .q-item
    transition: all 0.3s ease
    border-radius: 8px
    margin: 4px 8px

    &:hover
      background-color: rgba($primary, 0.1)

    &.q-router-link--active
      font-weight: 600

    .q-item__section--side
      .q-btn
        transition: opacity 0.3s ease

    &.q-router-link--active
      .q-item__section--side
        .q-btn
          color: white

.cursor-pointer
  cursor: pointer
</style>

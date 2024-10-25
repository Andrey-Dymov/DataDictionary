<template>
  <q-item
    :active="active"
    active-class="bg-primary text-white"
  >
    <div 
      class="row full-width items-center cursor-pointer"
      @click="$emit('click')"
    >
      <q-item-section
        v-if="icon"
        avatar
      >
        <q-icon :name="icon" :color="active ? 'white' : 'primary'" />
      </q-item-section>

      <q-item-section>
        <q-item-label>{{ name }} - {{ prompt }}</q-item-label>
        <q-item-label caption>{{ description }}</q-item-label>
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
          @click="$emit('editCollection', name)"
        >
          <q-tooltip>Редактировать сущность</q-tooltip>
        </q-btn>
        <q-btn
          flat
          round
          dense
          color="grey-6"
          icon="delete"
          @click="$emit('delete')"
        >
          <q-tooltip>Удалить сущность</q-tooltip>
        </q-btn>
      </div>
    </q-item-section>
  </q-item>
</template>

<script>
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'EssentialLink',
  props: {
    name: {
      type: String,
      required: true
    },
    prompt: {
      type: String,
      required: true
    },
    description: {
      type: String,
      default: ''
    },
    link: {
      type: String,
      default: '#'
    },
    icon: {
      type: String,
      default: ''
    },
    active: {
      type: Boolean,
      default: false
    }
  },
  emits: ['click', 'delete', 'editCollection']
})
</script>

<style lang="sass" scoped>
.q-item
  transition: all 0.3s ease

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

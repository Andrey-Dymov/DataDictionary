<template>
  <q-item
    clickable
    :to="link"
    :active="active"
    active-class="bg-primary text-white"
    @click="$emit('click')"
  >
    <q-item-section
      v-if="icon"
      avatar
    >
      <q-icon :name="icon" color="primary" />
    </q-item-section>

    <q-item-section>
      <q-item-label>{{ prompt }}</q-item-label>
      <q-item-label caption>{{ description }}</q-item-label>
    </q-item-section>

    <q-item-section side>
      <q-btn
        flat
        round
        dense
        color="grey-6"
        icon="delete"
        @click.stop="$emit('delete')"
      >
        <q-tooltip>Удалить сущность</q-tooltip>
      </q-btn>
    </q-item-section>
  </q-item>
</template>

<script>
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'EssentialLink',
  props: {
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
  emits: ['click', 'delete']
})
</script>

<style lang="sass" scoped>
.q-item
  transition: all 0.3s ease

  &:hover
    background-color: rgba($primary, 0.1)

  &.q-router-link--active
    font-weight: 600
    .q-icon
      color: white !important

  .q-item__section--side
    .q-btn
      transition: opacity 0.3s ease

  &.q-router-link--active
    .q-item__section--side
      .q-btn
        color: white
</style>
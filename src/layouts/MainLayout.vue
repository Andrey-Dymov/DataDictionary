<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated class="bg-white text-black">
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="toggleLeftDrawer"
        />

        <q-toolbar-title class="text-primary">
          Data Dictionary
        </q-toolbar-title>

        <q-select
          v-model="currentDictionary"
          :options="dictionaryOptions"
          label="Dictionary"
          dense
          options-dense
          outlined
          emit-value
          map-options
          class="q-ml-md dictionary-select"
          @update:model-value="changeDictionary"
        />
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      bordered
      :width="280"
      class="bg-grey-1"
    >
      <q-scroll-area class="fit">
        <q-list padding>
          <q-item-label header class="text-grey-8">
            Entities
          </q-item-label>

          <template v-if="collections.length > 0">
            <EssentialLink
              v-for="collection in collections"
              :key="collection.name"
              v-bind="collection"
              :title="`${collection.name} - ${collection.prompt}`"
              :link="`/collection/${collection.name}`"
              :active="collection.name === selectedCollectionName"
              @click="setSelectedCollection(collection.name)"
            />
          </template>
          <q-item v-else class="text-grey">
            <q-item-section>
              No entities available
            </q-item-section>
          </q-item>
        </q-list>
      </q-scroll-area>
    </q-drawer>

    <q-page-container>
      <router-view v-slot="{ Component }">
        <keep-alive>
          <component :is="Component" />
        </keep-alive>
      </router-view>
    </q-page-container>
  </q-layout>
</template>

<script>
import { defineComponent, ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import EssentialLink from '../components/EssentialLink.vue'
import { useSchemaStore } from '../stores/schema'

export default defineComponent({
  name: 'MainLayout',

  components: {
    EssentialLink
  },

  setup() {
    console.log('[Layout] Setup started')
    const leftDrawerOpen = ref(false)
    const schemaStore = useSchemaStore()
    const router = useRouter()
    const route = useRoute()

    const currentDictionary = computed({
      get: () => schemaStore.getCurrentDictionary,
      set: (value) => schemaStore.setCurrentDictionary(value)
    })

    const collections = computed(() => schemaStore.collections || [])
    const selectedCollectionName = computed(() => schemaStore.selectedCollectionName)
    
    const dictionaryOptions = computed(() => {
      return Object.entries(schemaStore.dictionaries).map(([value, label]) => ({
        label,
        value
      }))
    })

    // Следим за изменением маршрута
    watch(() => route.params.name, (newName) => {
      console.log('[Layout] Route collection changed:', newName)
      if (newName && newName !== selectedCollectionName.value) {
        console.log('[Layout] Updating selected collection:', newName)
        schemaStore.setSelectedCollection(newName)
      }
    }, { immediate: true })

    // Следим за изменением выбранной коллекции
    watch(selectedCollectionName, (newName) => {
      console.log('[Layout] Selected collection changed:', newName)
      if (newName && route.params.name !== newName) {
        console.log('[Layout] Navigating to collection:', newName)
        router.push(`/collection/${newName}`)
      }
    })

    const changeDictionary = async (value) => {
      console.log('[Layout] Dictionary changed:', value)
      try {
        await schemaStore.loadSchema(value)
        if (schemaStore.collections?.length > 0) {
          const savedCollection = localStorage.getItem('selectedCollectionName')
          const collectionToSelect = savedCollection && 
            schemaStore.collections.find(c => c.name === savedCollection) 
              ? savedCollection 
              : schemaStore.collections[0].name

          console.log('[Layout] Selecting collection:', collectionToSelect)
          schemaStore.setSelectedCollection(collectionToSelect)
          router.push(`/collection/${collectionToSelect}`)
        }
      } catch (error) {
        console.error('[Layout] Error changing dictionary:', error)
      }
    }

    const setSelectedCollection = (name) => {
      console.log('[Layout] Setting selected collection:', name)
      schemaStore.setSelectedCollection(name)
    }

    console.log('[Layout] Setup completed')
    return {
      leftDrawerOpen,
      toggleLeftDrawer() {
        leftDrawerOpen.value = !leftDrawerOpen.value
      },
      collections,
      selectedCollectionName,
      currentDictionary,
      dictionaryOptions,
      changeDictionary,
      setSelectedCollection
    }
  }
})
</script>

<style lang="sass">
.q-header
  border-bottom: 1px solid rgba(0,0,0,0.1)
  .q-toolbar
    height: 64px

.dictionary-select
  min-width: 200px
  .q-field__native
    color: $primary
  .q-field__label
    color: rgba(0,0,0,0.6)

.q-drawer
  border-right: 1px solid rgba(0,0,0,0.1)
  .q-item
    border-radius: 8px
    margin: 4px 8px
    &:hover
      background: rgba($primary, 0.1)
    &.q-router-link--active
      background: $primary
      color: white
      .q-icon
        color: white !important
</style>

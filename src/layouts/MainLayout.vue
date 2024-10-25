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
        <EntityList
          :entities="collections"
          :selectedEntityName="selectedCollectionName"
          @addEntity="showAddCollectionDialog"
          @selectEntity="setSelectedCollection"
          @deleteEntity="deleteCollection"
          @editEntity="showEditCollectionDialog"
        />
      </q-scroll-area>
    </q-drawer>

    <q-page-container>
      <router-view v-slot="{ Component }">
        <keep-alive>
          <component :is="Component" />
        </keep-alive>
      </router-view>
    </q-page-container>

    <CollectionDialog ref="collectionDialog" @ok="handleCollectionSave" />
  </q-layout>
</template>

<script>
import { defineComponent, ref, computed, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import EntityList from '../components/EntityList.vue'
import CollectionDialog from '../components/CollectionDialog.vue'
import { useSchemaStore } from '../stores/schema'
import { useQuasar } from 'quasar'

export default defineComponent({
  name: 'MainLayout',

  components: {
    EntityList,
    CollectionDialog
  },

  setup() {
    console.log('[Layout] Setup started')
    const leftDrawerOpen = ref(false)
    const schemaStore = useSchemaStore()
    const router = useRouter()
    const route = useRoute()
    const collectionDialog = ref(null)
    const $q = useQuasar()

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

    // Следим за изменением аршрта
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

    const showAddCollectionDialog = () => {
      collectionDialog.value.show()
    }

    const showEditCollectionDialog = (collectionName) => {
      const collection = schemaStore.getCollectionByName(collectionName)
      if (collection) {
        collectionDialog.value.show(collection)
      }
    }

    const handleCollectionSave = async (collectionData) => {
      try {
        if (collectionData.name) {
          await schemaStore.updateCollection(collectionData.name, collectionData)
        } else {
          await schemaStore.addCollection(collectionData)
        }
        $q.notify({
          type: 'positive',
          message: `Сущность успешно ${collectionData.name ? 'обновлена' : 'добавлена'}`
        })
      } catch (error) {
        console.error('Error saving collection:', error)
        $q.notify({
          type: 'negative',
          message: `Ошибка при ${collectionData.name ? 'обновлении' : 'добавлении'} сущности`
        })
      }
    }

    const deleteCollection = async (collectionName) => {
      try {
        await schemaStore.deleteCollection(collectionName)
        $q.notify({
          type: 'positive',
          message: 'Сущность успешно удалена'
        })
      } catch (error) {
        console.error('Error deleting collection:', error)
        $q.notify({
          type: 'negative',
          message: 'Ошибка при удалении сущности'
        })
      }
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
      setSelectedCollection,
      showAddCollectionDialog,
      showEditCollectionDialog,
      handleCollectionSave,
      deleteCollection,
      collectionDialog
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
</style>

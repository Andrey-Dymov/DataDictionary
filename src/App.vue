<template>
  <router-view v-if="!schemaStore.isLoading && schemaStore.isLoaded" />
  <div v-else-if="schemaStore.error" class="flex flex-center full-height">
    <div class="text-center">
      <p class="text-negative">{{ schemaStore.error }}</p>
      <q-btn color="primary" @click="retryLoading">Повторить загрузку</q-btn>
    </div>
  </div>
  <div v-else class="flex flex-center full-height">
    <q-spinner color="primary" size="3em" />
    <p class="q-ml-md">Загрузка данных...</p>
  </div>
</template>

<script>
import { defineComponent, onMounted } from 'vue'
import { useSchemaStore } from './stores/schema'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'

export default defineComponent({
  name: 'App',
  setup() {
    console.log('[App] Setup started')
    const schemaStore = useSchemaStore()
    const router = useRouter()
    const $q = useQuasar()

    const loadData = async () => {
      console.log('[App] Starting data load')
      try {
        console.log('[App] Loading dictionaries')
        await schemaStore.loadDictionaries()
        console.log('[App] Dictionaries loaded')
        
        const currentDict = schemaStore.getCurrentDictionary
        console.log('[App] Current dictionary:', currentDict)
        
        if (!currentDict) {
          throw new Error('Словарь не выбран')
        }
        
        console.log('[App] Loading schema for dictionary:', currentDict)
        await schemaStore.loadSchema(currentDict)
        console.log('[App] Schema loaded successfully')

        // Восстанавливаем выбранную сущность
        const savedCollection = localStorage.getItem('selectedCollectionName')
        console.log('[App] Saved collection:', savedCollection)
        
        if (savedCollection && schemaStore.collections.find(c => c.name === savedCollection)) {
          console.log('[App] Restoring saved collection:', savedCollection)
          schemaStore.setSelectedCollection(savedCollection)
          router.push(`/collection/${savedCollection}`)
        } else if (schemaStore.collections.length > 0) {
          console.log('[App] Using first collection:', schemaStore.collections[0].name)
          schemaStore.setSelectedCollection(schemaStore.collections[0].name)
          router.push(`/collection/${schemaStore.collections[0].name}`)
        } else {
          console.log('[App] No collections available')
          router.push('/')
        }
      } catch (error) {
        console.error('[App] Error loading data:', error)
        schemaStore.error = error.message
      }
    }

    const retryLoading = () => {
      console.log('[App] Retrying data load')
      schemaStore.error = null
      schemaStore.isLoaded = false
      loadData()
    }

    onMounted(async () => {
      console.log('[App] Component mounted')
      await loadData()
    })

    console.log('[App] Setup completed')
    return {
      schemaStore,
      retryLoading
    }
  }
})
</script>

<style>
.full-height {
  height: 100vh;
}
</style>
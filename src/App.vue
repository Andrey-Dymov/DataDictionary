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
import { useDictionaryStore } from './stores/dictionary'

export default defineComponent({
  name: 'App',
  setup() {
    console.log('[App] Setup started')
    const schemaStore = useSchemaStore()
    const dictionaryStore = useDictionaryStore()
    const router = useRouter()
    const $q = useQuasar()

    const loadData = async () => {
      console.log('[App] Starting data load')
      try {
        console.log('[App] Loading dictionaries')
        await dictionaryStore.loadDictionariesMeta()
        console.log('[App] Data loaded successfully')

        // Если есть текущий словарь, загружаем его данные
        if (dictionaryStore.currentDictionaryId) {
          console.log('[App] Loading current dictionary data')
          await schemaStore.loadSchema(dictionaryStore.currentDictionaryId)
        }
      } catch (error) {
        console.error('[App] Error loading data:', error)
        schemaStore.error = error.message
        if ($q) {  // Проверяем наличие $q перед использованием
          $q.notify({
            type: 'negative',
            message: error.message || 'Ошибка загрузки данных',
            position: 'top'
          })
        }
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

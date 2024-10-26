<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated class="bg-white text-black">
      <q-toolbar class="row no-wrap items-center justify-between">
        <div class="row no-wrap items-center">
          <q-btn
            flat
            dense
            round
            icon="menu"
            aria-label="Menu"
            @click="toggleLeftDrawer"
          />
          <div class="text-primary q-ml-sm">Data Dictionary</div>
        </div>

        <div class="row items-center">
          <!-- Информация о текущем словаре -->
          <div v-if="currentDictionary" class="text-caption q-mr-md text-grey-8">
            {{ getDictionaryInfo }}
          </div>

          <!-- Выбор словаря -->
          <q-select
            v-model="currentDictionary"
            :options="dictionaryOptions"
            label="Словарь"
            dense
            options-dense
            outlined
            emit-value
            map-options
            class="dictionary-select"
            @update:model-value="changeDictionary"
          />

          <!-- Кнопки управления словарями -->
          <q-btn-group flat class="q-ml-sm">
            <q-btn
              flat
              dense
              icon="add"
              @click="showAddDictionaryDialog"
            >
              <q-tooltip>Добавить словарь</q-tooltip>
            </q-btn>
            <q-btn
              flat
              dense
              icon="edit"
              :disable="!currentDictionary"
              @click="showEditDictionaryDialog"
            >
              <q-tooltip>Редактировать словарь</q-tooltip>
            </q-btn>
            <q-btn
              flat
              dense
              icon="delete"
              :disable="!currentDictionary"
              @click="confirmDeleteDictionary"
            >
              <q-tooltip>Удалить словарь</q-tooltip>
            </q-btn>
          </q-btn-group>
        </div>
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
          @addEntity="showAddEntityDialog"
          @selectEntity="setSelectedEntity"
          @deleteEntity="deleteEntity"
          @editEntity="showEditEntityDialog"
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

    <EntityForm ref="entityForm" @ok="handleEntitySave" />

    <!-- Добавляем форму словаря -->
    <DictionaryForm ref="dictionaryForm" @ok="handleDictionarySave" />
  </q-layout>
</template>

<script>
import { defineComponent, ref, computed, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import EntityList from '../components/EntityList.vue'
import EntityForm from '../components/EntityForm.vue'
import { useSchemaStore } from '../stores/schema'
import { useQuasar } from 'quasar'
import DictionaryForm from '../components/DictionaryForm.vue'
import { useDictionaryStore } from '../stores/dictionary'

export default defineComponent({
  name: 'MainLayout',

  components: {
    EntityList,
    EntityForm,
    DictionaryForm
  },

  setup() {
    console.log('[Layout] Setup started')
    const leftDrawerOpen = ref(false)
    const schemaStore = useSchemaStore()
    const router = useRouter()
    const route = useRoute()
    const entityForm = ref(null)  // Изменено от collectionForm
    const $q = useQuasar()
    const dictionaryStore = useDictionaryStore()  // Добавляем dictionaryStore

    const currentDictionary = computed({
      get: () => dictionaryStore.currentDictionaryId,
      set: (value) => dictionaryStore.setCurrentDictionary(value)
    })

    const collections = computed(() => schemaStore.collections || [])
    const selectedCollectionName = computed(() => schemaStore.selectedCollectionName)
    
    const dictionaryOptions = computed(() => dictionaryStore.dictionaryOptions)

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

    const changeDictionary = async (id) => {
      console.log('[Layout] Dictionary changed:', id)
      try {
        await dictionaryStore.setCurrentDictionary(id)
        // Загружаем данные словаря в schemaStore
        await schemaStore.loadSchema(id)
        
        // Выбираем первую сущность из нового словаря
        if (schemaStore.collections?.length > 0) {
          const savedCollection = localStorage.getItem('selectedCollectionName')
          const collectionToSelect = savedCollection && 
            schemaStore.collections.find(c => c.name === savedCollection) 
              ? savedCollection 
              : schemaStore.collections[0].name

          console.log('[Layout] Selecting collection:', collectionToSelect)
          schemaStore.setSelectedCollection(collectionToSelect)
          router.push(`/collection/${collectionToSelect}`)
        } else {
          // Если сущностей нет, очищаем выбор
          schemaStore.setSelectedCollection('')
          router.push('/')
        }
      } catch (error) {
        console.error('[Layout] Error changing dictionary:', error)
        $q.notify({
          type: 'negative',
          message: 'Ошибка при смене словаря'
        })
      }
    }

    const setSelectedEntity = (name) => {
      console.log('[Layout] Setting selected entity:', name)
      schemaStore.setSelectedCollection(name)
    }

    const showAddEntityDialog = () => {
      console.log('[MainLayout] Showing add entity dialog')
      entityForm.value.show()
    }

    const showEditEntityDialog = (entity) => {
      console.log('[MainLayout] Showing edit entity dialog:', entity)
      entityForm.value.show(entity)
    }

    const handleEntitySave = async (entityData) => {
      try {
        if (entityData.name) {
          await schemaStore.updateEntity(entityData.name, entityData)
        } else {
          await schemaStore.addEntity(entityData)
        }
        $q.notify({
          type: 'positive',
          message: `Сущность успешно ${entityData.name ? 'обновлена' : 'добавлена'}`
        })
      } catch (error) {
        console.error('Error saving entity:', error)
        $q.notify({
          type: 'negative',
          message: `Ошибка при ${entityData.name ? 'обновлени' : 'добавлении'} сущности`
        })
      }
    }

    const deleteEntity = async (entityName) => {
      try {
        await schemaStore.deleteCollection(entityName)
        $q.notify({
          type: 'positive',
          message: 'Сущность успешно удалена'
        })
      } catch (error) {
        console.error('Error deleting entity:', error)
        $q.notify({
          type: 'negative',
          message: 'Ошибка при удаении сущности'
        })
      }
    }

    // Получение информации о текущем словаре
    const getDictionaryInfo = computed(() => {
      const dict = dictionaryStore.getCurrentDictionaryInfo
      if (!dict) return ''
      return `${dict.name} (${dict.fileName} - ${dict.filePath})`
    })

    // Обновляем метод смены словаря
    const showAddDictionaryDialog = () => {
      dictionaryForm.value.show()
    }

    const showEditDictionaryDialog = () => {
      const currentDict = dictionaryStore.getCurrentDictionaryInfo
      if (currentDict) {
        dictionaryForm.value.show(currentDict)
      }
    }

    const confirmDeleteDictionary = () => {
      const currentDict = dictionaryStore.getCurrentDictionaryInfo
      if (!currentDict) return

      $q.dialog({
        title: 'Подтверждение',
        message: `Вы уверены, что хотите удалить словарь "${currentDict.name}"?`,
        cancel: true,
        persistent: true
      }).onOk(async () => {
        try {
          await dictionaryStore.deleteDictionary(currentDict.id)
          $q.notify({
            type: 'positive',
            message: 'Словарь успешно удален'
          })
        } catch (error) {
          $q.notify({
            type: 'negative',
            message: 'Ошибка при удалении словаря'
          })
        }
      })
    }

    const handleDictionarySave = async (dictionaryData) => {
      try {
        if (dictionaryData.id) {
          // Редактирование
          await dictionaryStore.updateDictionary(dictionaryData.id, dictionaryData)
          $q.notify({
            type: 'positive',
            message: 'Словарь успешно обновлен'
          })
        } else {
          // Добавление
          const newDictionary = await dictionaryStore.addDictionary(dictionaryData)
          await dictionaryStore.setCurrentDictionary(newDictionary.id)
          $q.notify({
            type: 'positive',
            message: 'Словарь успешно добавлен'
          })
        }
      } catch (error) {
        $q.notify({
          type: 'negative',
          message: 'Ошибка при сохранении словаря'
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
      setSelectedEntity,
      showAddEntityDialog,
      showEditEntityDialog,
      handleEntitySave,
      deleteEntity,
      entityForm,
      getDictionaryInfo,
      showAddDictionaryDialog,
      showEditDictionaryDialog,
      confirmDeleteDictionary,
      handleDictionarySave
    }
  }
})
</script>

<style lang="sass">
.q-header
  border-bottom: 1px solid rgba(0,0,0,0.1)
  .q-toolbar
    height: 64px
    padding: 0 12px

    .text-primary
      font-size: 1.2rem
      white-space: nowrap

.dictionary-select
  width: 300px  // Увеличиваем ширину для отображения полной информации
  .q-field__control
    height: 40px
  .q-field__native
    color: $primary
    padding-top: 0 !important
  &.q-field--labeled .q-field__native
    padding-top: 0

.q-drawer
  border-right: 1px solid rgba(0,0,0,0.1)
</style>

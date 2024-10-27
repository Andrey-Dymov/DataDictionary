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
          <div v-if="getCurrentDictionaryInfo" class="dictionary-info">
            <div class="dictionary-title">
              {{ getCurrentDictionaryInfo.name }}
              <span v-if="getCurrentDictionaryInfo.fileName !== getCurrentDictionaryInfo.name" 
                    class="text-grey-7">({{ getCurrentDictionaryInfo.fileName }})</span>
              <span v-if="getCurrentDictionaryInfo.description && getCurrentDictionaryInfo.description !== getCurrentDictionaryInfo.name" 
                    class="text-grey-7"> - {{ getCurrentDictionaryInfo.description }}</span>
            </div>
            <div class="dictionary-path text-grey-7">
              {{ getCurrentDictionaryInfo.filePath }}
            </div>
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
            class="dictionary-select q-ml-md"
            @update:model-value="onDictionaryChange"
          >
            <!-- Изменяем слот для опций в q-select -->
            <template v-slot:option="{ opt, selected, toggleOption }">
              <q-item
                v-ripple
                :active="selected"
                clickable
                @click="toggleOption(opt)"
              >
                <q-item-section>
                  <div class="dictionary-option">
                    <div class="dictionary-title">
                      {{ opt.name }}
                      <template v-if="opt.fileName !== opt.name || (opt.description && opt.description !== opt.name)">
                        ({{ opt.fileName }}
                        <template v-if="opt.description && opt.description !== opt.name">
                          - {{ opt.description }}
                        </template>)
                      </template>
                    </div>
                    <div class="dictionary-path text-grey-7">
                      {{ opt.filePath }}
                    </div>
                  </div>
                </q-item-section>
              </q-item>
            </template>
          </q-select>

          <!-- Кнопки управления словарями -->
          <q-btn-group flat class="q-ml-md">
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
            <q-btn
              flat
              dense
              icon="add"
              @click="showAddDictionaryDialog"
            >
              <q-tooltip>Добавить словарь</q-tooltip>
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
    const dictionaryStore = useDictionaryStore()
    const router = useRouter()
    const route = useRoute()
    const entityForm = ref(null)
    const dictionaryForm = ref(null)  // Добавляем ref для формы словаря
    const $q = useQuasar()

    // Объявляем changeDictionary до его использования
    const changeDictionary = async (id) => {
      console.log('[Layout] Dictionary changed:', id)
      try {
        await dictionaryStore.setCurrentDictionary(id)
        await schemaStore.loadSchema(id)
        
        // Теперь selectedCollectionName уже установлен в loadSchema
        if (schemaStore.selectedCollectionName) {
          router.push(`/collection/${schemaStore.selectedCollectionName}`)
        } else {
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

    // Тепер можем использовать changeDictionary в computed
    const currentDictionary = computed({
      get: () => dictionaryStore.currentDictionaryId,
      set: (value) => {
        console.log('[Layout] Setting dictionary:', value)
        changeDictionary(value)
      }
    })

    // Получаем информацию о текущем словаре
    const getCurrentDictionaryInfo = computed(() => dictionaryStore.getCurrentDictionaryInfo)

    // Получаем опции для выпадающего списка
    const dictionaryOptions = computed(() => {
      return dictionaryStore.dictionaries.map(dict => ({
        label: dict.name,
        value: dict.id,
        ...dict
      }))
    })

    const collections = computed(() => schemaStore.collections || [])
    const selectedCollectionName = computed(() => schemaStore.selectedCollectionName)
    
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
        dictionaryForm.value.show(currentDict)  // Теперь это будет работать
      }
    }

    const confirmDeleteDictionary = () => {
      const currentDict = dictionaryStore.getCurrentDictionaryInfo
      if (!currentDict) return

      $q.dialog({
        title: 'одтверждение',
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

    // Добавляем геттер для отображения имени словаря
    const getCurrentDictionaryName = computed(() => {
      const dict = dictionaryStore.getCurrentDictionaryInfo
      if (!dict) return ''
      return dict.name
    })

    // Добавляем метод обработки выбора словаря
    const onDictionaryChange = async (value) => {
      console.log('[Layout] Dictionary selected:', value)
      if (value) {
        try {
          await changeDictionary(value)
        } catch (error) {
          console.error('[Layout] Error changing dictionary:', error)
          $q.notify({
            type: 'negative',
            message: 'Ошибка при смене словаря'
          })
        }
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
      handleDictionarySave,
      getCurrentDictionaryName,
      getCurrentDictionaryInfo,
      onDictionaryChange,
      dictionaryForm,  // Добавляем в return
      showEditDictionaryDialog,
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
  width: 200px
  .q-field__control
    height: 40px
  .q-field__native
    color: $primary
    padding-top: 0 !important
  &.q-field--labeled .q-field__native
    padding-top: 0

.q-menu
  .q-item
    min-height: unset
    padding: 8px 16px
    cursor: pointer
    transition: all 0.3s ease
    
    .column
      width: 100%
      
    .text-caption
      line-height: 1.2
      
    .ellipsis
      white-space: nowrap
      overflow: hidden
      text-overflow: ellipsis
      max-width: 300px
    
    &:hover
      &.q-item--active
        background: lighten($primary, 10%) !important
      &:not(.q-item--active)
        background-color: rgba($primary, 0.1)

    &.q-item--active
      background: $primary
      color: white
      .text-grey-7
        color: rgba(255,255,255,0.7) !important

.dictionary-info
  min-width: 200px
  max-width: 500px
  line-height: 1.2

  .dictionary-title
    font-size: 0.9rem
    font-weight: 500
    white-space: nowrap
    overflow: hidden
    text-overflow: ellipsis

  .dictionary-path
    font-size: 0.8rem
    white-space: nowrap
    overflow: hidden
    text-overflow: ellipsis

.dictionary-select
  width: 200px
  
  .q-field__control
    height: 40px
  
  .q-field__native
    padding-top: 0 !important
</style>






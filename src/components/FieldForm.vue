<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin" style="min-width: 500px">
      <q-card-section>
        <div class="text-h6">{{ isEdit ? 'Редактировать' : 'Добавить' }} поле</div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <div class="row q-col-gutter-md q-mb-sm">
          <div class="col-6">
            <q-input v-model="form.name" label="Название" outlined dense
              :rules="[val => !!val || 'Обязательное поле']" >
              <template v-slot:append v-if="['reference', 'references'].includes(form.type) && form.parent">
                <q-btn
                  flat
                  dense
                  round
                  icon="auto_awesome"
                  color="primary"
                  @click.stop="generateFieldName"
                >
                  <q-tooltip>
                    Сгенерировать название поля из родителя
                  </q-tooltip>
                </q-btn>
              </template>
            </q-input>
          </div>


          <div class="col-6">
            <q-select v-model="form.type" :options="dataTypeOptions" label="Тип данных" outlined dense emit-value
              map-options behavior="menu">
              <template v-slot:option="scope">
                <q-item v-bind="scope.itemProps" v-on="scope.itemEvents">
                  <q-item-section avatar style="width: 32px; min-width: 32px">
                    <q-icon :name="getFieldIcon(scope.opt.value)" color="primary" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>{{ scope.opt.label }}</q-item-label>
                  </q-item-section>
                </q-item>
              </template>

              <template v-slot:selected>
                <div class="row items-center no-wrap">
                  <q-icon :name="getFieldIcon(form.type)" color="primary" size="24px" class="q-mr-sm"
                    style="width: 24px; min-width: 24px" />
                  <div class="ellipsis">
                    {{ dataTypeOptions.find(opt => opt.value === form.type)?.label }}
                  </div>
                </div>
              </template>
            </q-select>
          </div>
        </div>
        <div class="col-6" v-if="['reference', 'references'].includes(form.type)">
          <q-select 
            v-model="form.parent" 
            :options="entityOptions" 
            label="Родитель" 
            outlined 
            dense
            emit-value
            map-options
            clearable
            @update:model-value="val => form.parent = val"
            behavior="menu"
          >
            <template v-slot:append>
              <q-btn
                flat
                dense
                round
                icon="auto_awesome"
                color="primary"
                @click.stop="detectParentFromName(form.name)"
              >
                <q-tooltip>
                  Определить родителя по названию поля
                </q-tooltip>
              </q-btn>
            </template>

            <template v-slot:option="scope">
              <q-item v-bind="scope.itemProps" v-on="scope.itemEvents">
                <q-item-section avatar style="width: 32px; min-width: 32px">
                  <q-icon :name="scope.opt.icon || 'category'" color="primary" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ scope.opt.label }}</q-item-label>
                </q-item-section>
              </q-item>
            </template>

            <template v-slot:selected>
              <div class="row items-center no-wrap" v-if="form.parent">
                <q-icon 
                  :name="entityOptions.find(opt => opt.value === form.parent)?.icon || 'category'" 
                  color="primary"
                  size="24px"
                  class="q-mr-sm"
                  style="width: 24px; min-width: 24px"
                />
                <div class="ellipsis">
                  {{ entityOptions.find(opt => opt.value === form.parent)?.label }}
                </div>
              </div>
            </template>
          </q-select>
        </div>

        <div class="row q-col-gutter-md q-mb-sm">

          <div class="col-6">
            <q-select 
                v-model="form.list"
                :options="listOptions" 
                label="Тип в списке" 
                outlined 
                dense 
                emit-value
                map-options 
                behavior="menu"
            >
                <template v-slot:option="scope">
                    <q-item v-bind="scope.itemProps" v-on="scope.itemEvents">
                        <q-item-section avatar style="width: 32px; min-width: 32px">
                            <q-icon :name="getListTypeIcon(scope.opt.value.split('-')[1])" color="primary" />
                        </q-item-section>
                        <q-item-section>
                            <q-item-label>{{ scope.opt.label }}</q-item-label>
                        </q-item-section>
                    </q-item>
                </template>

                <template v-slot:selected>
                    <div class="row items-center no-wrap">
                        <q-icon 
                            :name="getListTypeIcon(form.list?.split('-')[1])" 
                            color="primary"
                            size="24px" 
                            class="q-mr-sm" 
                            style="width: 24px; min-width: 24px" 
                        />
                        <div class="ellipsis">
                            {{ listOptions.find(opt => opt.value === form.list)?.label }}
                        </div>
                    </div>
                </template>
            </q-select>
          </div>

          <div class="col-6">
            <q-select v-model="form.input" :options="inputTypeOptions" label="Тип ввода в форме" outlined dense
              emit-value map-options behavior="menu">
              <template v-slot:option="scope">
                <q-item v-bind="scope.itemProps" v-on="scope.itemEvents">
                  <q-item-section avatar style="width: 32px; min-width: 32px">
                    <q-icon :name="getInputIcon(scope.opt.value)" color="primary" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>{{ scope.opt.label }}</q-item-label>
                  </q-item-section>
                </q-item>
              </template>

              <template v-slot:selected>
                <div class="row items-center no-wrap">
                  <q-icon :name="getInputIcon(form.input)" color="primary" size="24px" class="q-mr-sm"
                    style="width: 24px; min-width: 24px" />
                  <div class="ellipsis">
                    {{ inputTypeOptions.find(opt => opt.value === form.input)?.label }}
                  </div>
                </div>
              </template>
            </q-select>
          </div>

        </div>

        <div class="row q-col-gutter-md items-center">

          <div class="col-6">
            <q-input v-model="form.prompt" label="Метка" outlined dense />
          </div>
          <div class="col-6">
            <q-toggle v-model="form.req" label="Обязательное" left-label color="green" dense />
          </div>
        </div>

      </q-card-section>

      <q-card-actions align="right" class="text-primary">
        <q-btn flat label="Отмена" v-close-popup />
        <q-btn flat label="OK" @click = "onOKClick" :disable="!isFormValid" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
import { ref, computed, watch } from 'vue'
import { useDialogPluginComponent, useQuasar } from 'quasar'
import dictionaryService from '../services/dictionaryService'
import {
  dataTypeOptions,
  sectionOptions,
  listTypeOptions,
  inputTypeOptions,
  getFieldIcon,
  getInputIcon,
  getListTypeIcon
} from '../dictionaries/fieldTypes'
import { useSchemaStore } from '../stores/schema'

export default {
  name: 'FieldForm',

  props: {
    entityName: {
      type: String,
      required: true
    }
  },

  emits: [
    ...useDialogPluginComponent.emits,
    'ok'
  ],

  setup(props, { emit }) {
    const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent()
    const $q = useQuasar()
    const schemaStore = useSchemaStore()
    const isEdit = ref(false)
    const editingFieldName = ref(null)

    const form = ref({
      name: '',
      type: '',
      list: 'main-none',
      input: 'none',
      prompt: '',
      req: false,
      parent: null
    })

    const isFormValid = computed(() => {
      return !!form.value.name && 
             !!form.value.type && 
             !!form.value.list && 
             !!form.value.input
    })

    const show = (field = null) => {
      console.log('[FieldForm] Show called with:', field)
      if (field) {
        form.value = {
          name: field.name,
          type: field.type,
          list: field.list,
          input: field.input,
          prompt: field.prompt || '',
          req: field.req || false,
          parent: field.parent || null
        }
        editingFieldName.value = field.name
        isEdit.value = true
      } else {
        form.value = {
          name: '',
          type: '',
          list: 'main-none',
          input: 'none',
          prompt: '',
          req: false,
          parent: null
        }
        editingFieldName.value = null
        isEdit.value = false
      }
      dialogRef.value.show()
    }

    const onOKClick = () => {
      console.log('[FieldForm] OK clicked, form valid:', isFormValid.value)
      if (isFormValid.value) {
        saveField(form.value)
      }
    }

    const saveField = async (fieldData) => {
      try {
        if (editingFieldName.value) {
          await schemaStore.updateField(props.entityName, editingFieldName.value, fieldData, $q)
        } else {
          await schemaStore.addField(props.entityName, fieldData, $q)
        }

        // Сначала вызываем emit для события ok
        emit('ok', fieldData)
        
        // Затем закрываем диалог
        dialogRef.value?.hide()
      } catch (error) {
        console.error('[FieldForm] Error saving field:', error)
        console.error('[FieldForm] Error details:', { 
          error, 
          fieldData, 
          entityName: props.entityName, 
          editingFieldName: editingFieldName.value 
        })
      }
    }

    const entityOptions = computed(() => {
      const schemaStore = useSchemaStore()
      return schemaStore.entities
        .filter(e => e.name !== props.entityName)
        .map(e => ({
          label: `${e.name} - ${e.prompt}`,
          value: e.name,
          icon: e.icon
        }))
    })

    // Функция для преобразования snake_case в camelCase
    const snakeToCamel = (str) => {
      return str.toLowerCase().replace(/([-_][a-z])/g, group =>
        group.toUpperCase().replace('-', '').replace('_', '')
      )
    }

    // Функция для преобразования camelCase в snake_case
    const camelToSnake = (str) => {
      return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
    }

    // Обновляем функцию определения родителя
    const detectParentFromName = (fieldName) => {
      if (!fieldName || !['reference', 'references'].includes(form.value.type)) return

      // Получаем базовое имя до преобразования в нижний регистр
      let baseName = fieldName
      if (baseName.endsWith('Ids')) {
        baseName = baseName.slice(0, -3)
      } else if (baseName.endsWith('Id')) {
        baseName = baseName.slice(0, -2)
      }

      // Преобразуем baseName в snake_case
      const snakeBaseName = camelToSnake(baseName)
      
      // Добавляем 's' к snake_case имени для поиска множественной формы
      const pluralSnakeBaseName = snakeBaseName + 's'
      
      console.log('[FieldForm] Detecting parent for:', { 
        originalName: fieldName,
        baseName,
        snakeBaseName,
        pluralSnakeBaseName,
        availableEntities: entityOptions.value.map(e => e.value)
      })

      // Ищем сущность, учитывая разные форматы имен
      const matchingEntity = entityOptions.value.find(opt => {
        const optValue = opt.value.toLowerCase()
        
        // Проверяем точное совпадение с множественной формой
        const exactPluralMatch = optValue === pluralSnakeBaseName
        
        console.log('[FieldForm] Checking entity:', { 
          entity: optValue,
          snakeBaseName,
          pluralSnakeBaseName,
          exactPluralMatch
        })

        return exactPluralMatch
      })

      if (matchingEntity) {
        console.log('[FieldForm] Found parent:', matchingEntity.value)
        form.value.parent = matchingEntity.value
      } else {
        console.log('[FieldForm] No parent found')
      }
    }

    watch([
      () => form.value.type,
      () => form.value.name
    ], ([newType, newName]) => {
      // Если тип изменился на reference/references и есть имя
      if (['reference', 'references'].includes(newType) && newName && !form.value.parent) {
        detectParentFromName(newName)
      }
    })

    // Обновляем функцию генерации имени поля
    const generateFieldName = () => {
      if (!form.value.parent || !['reference', 'references'].includes(form.value.type)) return

      // Получаем имя родителя и преобразуем его в camelCase
      let baseName = snakeToCamel(form.value.parent.toLowerCase())
      
      // Убираем окончание 's' или 'es' если есть
      if (baseName.endsWith('es')) {
        baseName = baseName.slice(0, -2)
      } else if (baseName.endsWith('s')) {
        baseName = baseName.slice(0, -1)
      }

      // Добавляем нужный суффикс в зависимости от типа
      form.value.name = form.value.type === 'reference' 
        ? `${baseName}Id`
        : `${baseName}Ids`
      
      console.log('[FieldForm] Generated field name:', form.value.name)
    }

    // Добавляем новые опции для list
    const listOptions = [
        { label: 'main-none - Нет', value: 'main-none', icon: 'not_interested' },
        { label: 'main-title - Заголовок', value: 'main-title', icon: 'title' },
        { label: 'main-subtitle - Подзаголовок', value: 'main-subtitle', icon: 'subtitles' },
        { label: 'main-label - Метка', value: 'main-label', icon: 'label' },
        { label: 'main-highlite - Подсветка', value: 'main-highlite', icon: 'highlight' },
        { label: 'main-badge - Бэдж', value: 'main-badge', icon: 'local_offer' },
        { label: 'main-toggle - Переключатель', value: 'main-toggle', icon: 'toggle_on' },
        { label: 'main-checkbox - Флажок', value: 'main-checkbox', icon: 'check_box' },
        { label: 'main-value - Значение', value: 'main-value', icon: 'tag' },
        { label: 'data-order - Порядок', value: 'data-order', icon: 'sort' },
        { label: 'data-count - Счетчик', value: 'data-count', icon: 'filter_9_plus' },
        { label: 'data-date - Дата', value: 'data-date', icon: 'event' },
        { label: 'main-content - Содержание', value: 'main-content', icon: 'article' },
        { label: 'main-code - Код', value: 'main-code', icon: 'code' },
        { label: 'main-inline - В строку', value: 'main-inline', icon: 'short_text' }
    ]

    return {
      dialogRef,
      onDialogHide,
      onOKClick,
      form,
      isEdit,
      dataTypeOptions,
      sectionOptions,
      listTypeOptions,
      inputTypeOptions,
      isFormValid,
      show,
      saveField,
      getFieldIcon,
      getInputIcon,
      getListTypeIcon,
      entityOptions,
      detectParentFromName,
      generateFieldName,
      listOptions
    }
  }
}
</script>

<style lang="sass">
.q-dialog-plugin
  max-width: 95vw

.q-select
  .q-item
    min-height: 40px
    padding: 8px 16px

  .q-item__section--avatar
    width: 32px !important
    min-width: 32px !important
    padding-right: 12px !important

  .q-item__section--main
    flex: 1 !important
    min-width: 0 !important
    padding-left: 0 !important

  .q-item__label
    font-size: 14px
    line-height: 1.2
    white-space: normal
    word-break: break-word
    color: inherit

.ellipsis
  text-overflow: ellipsis
  white-space: nowrap
  overflow: hidden
  flex: 1
  min-width: 0
  color: inherit
</style>

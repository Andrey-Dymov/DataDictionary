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
              <template v-slot:append v-if="['reference', 'references'].includes(form.dataType) && form.parent">
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
            <q-select v-model="form.dataType" :options="dataTypeOptions" label="Тип данных" outlined dense emit-value
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
                  <q-icon :name="getFieldIcon(form.dataType)" color="primary" size="24px" class="q-mr-sm"
                    style="width: 24px; min-width: 24px" />
                  <div class="ellipsis">
                    {{ dataTypeOptions.find(opt => opt.value === form.dataType)?.label }}
                  </div>
                </div>
              </template>
            </q-select>
          </div>
        </div>
        <div class="col-6" v-if="['reference', 'references'].includes(form.dataType)">
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
            <q-select v-model="form.listType" :options="listTypeOptions" label="Тип в списке" outlined dense emit-value
              map-options behavior="menu">
              <template v-slot:option="scope">
                <q-item v-bind="scope.itemProps" v-on="scope.itemEvents">
                  <q-item-section avatar style="width: 32px; min-width: 32px">
                    <q-icon :name="scope.opt.icon" color="primary" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>{{ scope.opt.label }}</q-item-label>
                  </q-item-section>
                </q-item>
              </template>

              <template v-slot:selected>
                <div class="row items-center no-wrap">
                  <q-icon :name="listTypeOptions.find(opt => opt.value === form.listType)?.icon" color="primary"
                    size="24px" class="q-mr-sm" style="width: 24px; min-width: 24px" />
                  <div class="ellipsis">
                    {{ listTypeOptions.find(opt => opt.value === form.listType)?.label }}
                  </div>
                </div>
              </template>
            </q-select>
          </div>

          <div class="col-6">
            <q-select v-model="form.inputType" :options="inputTypeOptions" label="Тип ввода в форме" outlined dense
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
                  <q-icon :name="getInputIcon(form.inputType)" color="primary" size="24px" class="q-mr-sm"
                    style="width: 24px; min-width: 24px" />
                  <div class="ellipsis">
                    {{ inputTypeOptions.find(opt => opt.value === form.inputType)?.label }}
                  </div>
                </div>
              </template>
            </q-select>
          </div>

        </div>

        <div class="q-mb-sm">
          <div class="text-subtitle2 q-mb-xs">Секция</div>
          <q-btn-toggle v-model="form.section" :options="sectionOptions" unelevated dense toggle-color="primary"
            spread />
        </div>

        <div class="row q-col-gutter-md items-center">

          <div class="col-6">
            <q-input v-model="form.prompt" label="Метка" outlined dense />
          </div>
          <div class="col-6">
            <q-toggle v-model="form.required" label="Обязательное" left-label color="green" dense />
          </div>
        </div>

      </q-card-section>

      <q-card-actions align="right" class="text-primary">
        <q-btn flat label="Отмена" v-close-popup />
        <q-btn flat label="OK" @click="onOKClick" :disable="!isFormValid" />
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
  getInputIcon
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
    ...useDialogPluginComponent.emits
  ],

  setup(props, { emit }) {
    const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent()
    const $q = useQuasar()
    const schemaStore = useSchemaStore()
    const isEdit = ref(false)
    const editingFieldName = ref(null)

    const form = ref({
      name: '',
      dataType: '',
      section: 'main',
      listType: '',
      inputType: '',
      prompt: '',
      required: false,
      parent: null
    })

    const isFormValid = computed(() => {
      return form.value.name &&
        form.value.dataType &&
        form.value.section &&
        form.value.listType &&
        form.value.inputType
    })

    const show = (field = null) => {
      if (field) {
        form.value = {
          name: field.name,
          dataType: field.type,
          section: field.list ? field.list.split('-')[0] : 'main',
          listType: field.list ? field.list.split('-')[1] : '',
          inputType: field.input,
          prompt: field.prompt,
          required: field.req || false,
          parent: field.parent || null
        }
        editingFieldName.value = field.name
        isEdit.value = true
      } else {
        form.value = {
          name: '',
          dataType: '',
          section: 'main',
          listType: '',
          inputType: '',
          prompt: '',
          required: false,
          parent: null
        }
        editingFieldName.value = null
        isEdit.value = false
      }
      dialogRef.value.show()
    }

    const onOKClick = () => {
      if (isFormValid.value) {
        saveField(form.value)
      }
    }

    const saveField = async (fieldData) => {
      try {
        const fieldToSave = {
          name: fieldData.name,
          type: fieldData.dataType,
          list: `${fieldData.section}-${fieldData.listType}`,
          input: fieldData.inputType,
          prompt: fieldData.prompt,
          req: fieldData.required,
          parent: fieldData.parent || undefined
        }

        console.log('[FieldForm] Saving field:', {
          editingFieldName: editingFieldName.value,
          fieldToSave,
          entityName: props.entityName
        })

        if (editingFieldName.value) {
          await schemaStore.updateField(props.entityName, editingFieldName.value, fieldToSave)
          $q.notify({
            type: 'positive',
            message: 'Поле успешно обновлено'
          })
        } else {
          await schemaStore.addField(props.entityName, fieldToSave)
          $q.notify({
            type: 'positive',
            message: 'Поле успешно добавлено'
          })
        }

        emit('ok', fieldToSave)
        emit('hide')

      } catch (error) {
        console.error('[FieldForm] Error saving field:', error)
        console.error('[FieldForm] Error details:', {
          error,
          fieldData,
          entityName: props.entityName,
          editingFieldName: editingFieldName.value
        })
        $q.notify({
          type: 'negative',
          message: `Ошибка при ${editingFieldName.value ? 'обновлении' : 'добавлении'} поля`
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
      if (!fieldName || !['reference', 'references'].includes(form.value.dataType)) return

      // Получаем базовое имя до преобразования в нижний регистр
      let baseName = fieldName
      if (baseName.endsWith('Ids')) {
        baseName = baseName.slice(0, -3)
      } else if (baseName.endsWith('Id')) {
        baseName = baseName.slice(0, -2)
      }

      // Теперь у нас есть baseName с сохраненным CamelCase: "meetingType"
      const camelBaseName = baseName // уже в camelCase
      const snakeBaseName = camelToSnake(baseName) // преобразуем в snake_case
      
      console.log('[FieldForm] Detecting parent for:', { 
        originalName: fieldName,
        baseName,
        camelBaseName,
        snakeBaseName,
        availableEntities: entityOptions.value.map(e => e.value.toLowerCase())
      })

      // Ищем сущность, учитывая разные форматы имен
      const matchingEntity = entityOptions.value.find(opt => {
        const optValue = opt.value.toLowerCase()
        const snakeOptValue = optValue // уже в snake_case
        const camelOptValue = snakeToCamel(optValue)
        
        // Проверяем, содержится ли имя сущности в имени поля
        const snakeMatch = snakeBaseName.includes(snakeOptValue) || snakeOptValue.includes(snakeBaseName)
        const camelMatch = camelBaseName.includes(camelOptValue) || camelOptValue.includes(camelBaseName)
        
        // Проверяем точное совпадение
        const exactSnakeMatch = snakeBaseName === snakeOptValue
        const exactCamelMatch = camelBaseName === camelOptValue

        console.log('[FieldForm] Checking entity:', { 
          entity: optValue,
          snakeCase: snakeOptValue,
          camelCase: camelOptValue,
          matches: {
            snakeMatch,
            camelMatch,
            exactSnakeMatch,
            exactCamelMatch
          }
        })

        return snakeMatch || camelMatch || exactSnakeMatch || exactCamelMatch
      })

      if (matchingEntity) {
        console.log('[FieldForm] Found parent:', matchingEntity.value)
        form.value.parent = matchingEntity.value
      } else {
        console.log('[FieldForm] No parent found')
      }
    }

    watch([
      () => form.value.dataType,
      () => form.value.name
    ], ([newType, newName]) => {
      // Если тип изменился на reference/references и есть имя
      if (['reference', 'references'].includes(newType) && newName && !form.value.parent) {
        detectParentFromName(newName)
      }
    })

    // Обновляем функцию генерации имени поля
    const generateFieldName = () => {
      if (!form.value.parent || !['reference', 'references'].includes(form.value.dataType)) return

      // Получаем имя родителя и преобразуем его в camelCase
      let baseName = snakeToCamel(form.value.parent.toLowerCase())
      
      // Убираем окончание 's' или 'es' если есть
      if (baseName.endsWith('es')) {
        baseName = baseName.slice(0, -2)
      } else if (baseName.endsWith('s')) {
        baseName = baseName.slice(0, -1)
      }

      // Добавляем нужный суффикс в зависимости от типа
      form.value.name = form.value.dataType === 'reference' 
        ? `${baseName}Id`
        : `${baseName}Ids`
      
      console.log('[FieldForm] Generated field name:', form.value.name)
    }

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
      entityOptions,
      detectParentFromName,
      generateFieldName,
      snakeToCamel,
      camelToSnake
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

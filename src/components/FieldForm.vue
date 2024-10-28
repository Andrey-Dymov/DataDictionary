<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin" style="min-width: 500px">
      <q-card-section>
        <div class="text-h6">{{ isEdit ? 'Редактировать' : 'Добавить' }} поле</div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <div class="row q-col-gutter-md q-mb-sm">
          <div class="col-6">
            <q-input v-model="form.name" label="Название" standout dense
              :rules="[val => !!val || 'Обязательное поле']" />
          </div>
          <div class="col-6">
            <q-toggle v-model="form.required" label="Обязательное" left-label color="green" dense />
          </div>
        </div>

        <div class="row q-col-gutter-md q-mb-sm">
          <div class="col-6">
            <q-select 
              v-model="form.dataType" 
              :options="dataTypeOptions" 
              label="Тип данных" 
              standout 
              dense 
              emit-value
              map-options
            >
              <template v-slot:option="{ opt, selected }">
                <q-item v-bind="opt.attrs">
                  <q-item-section avatar style="width: 32px; min-width: 32px">
                    <q-icon :name="getFieldIcon(opt.value)" color="primary" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>{{ opt.label }}</q-item-label>
                  </q-item-section>
                </q-item>
              </template>

              <template v-slot:selected>
                <div class="row items-center no-wrap">
                  <q-icon 
                    :name="getFieldIcon(form.dataType)" 
                    color="primary"
                    size="24px"
                    class="q-mr-sm"
                    style="width: 24px; min-width: 24px"
                  />
                  <div class="ellipsis">
                    {{ dataTypeOptions.find(opt => opt.value === form.dataType)?.label }}
                  </div>
                </div>
              </template>
            </q-select>
          </div>
          <div class="col-6">
            <q-select 
              v-model="form.listType" 
              :options="listTypeOptions" 
              label="Тип в списке" 
              standout 
              dense 
              emit-value
              map-options
            >
              <template v-slot:option="{ opt, selected }">
                <q-item v-bind="opt.attrs">
                  <q-item-section avatar style="width: 32px; min-width: 32px">
                    <q-icon :name="opt.icon" color="primary" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>{{ opt.label }}</q-item-label>
                  </q-item-section>
                </q-item>
              </template>

              <template v-slot:selected>
                <div class="row items-center no-wrap">
                  <q-icon 
                    :name="listTypeOptions.find(opt => opt.value === form.listType)?.icon" 
                    color="primary"
                    size="24px"
                    class="q-mr-sm"
                    style="width: 24px; min-width: 24px"
                  />
                  <div class="ellipsis">
                    {{ listTypeOptions.find(opt => opt.value === form.listType)?.label }}
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
            <q-input v-model="form.prompt" label="Метка" standout dense />
          </div>
          <div class="col-6">
            <q-select 
              v-model="form.inputType" 
              :options="inputTypeOptions" 
              label="Тип ввода в форме" 
              standout 
              dense
              emit-value
              map-options
            >
              <template v-slot:option="{ opt, selected }">
                <q-item v-bind="opt.attrs">
                  <q-item-section avatar style="width: 32px; min-width: 32px">
                    <q-icon :name="getInputIcon(opt.value)" color="primary" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>{{ opt.label }}</q-item-label>
                  </q-item-section>
                </q-item>
              </template>

              <template v-slot:selected>
                <div class="row items-center no-wrap">
                  <q-icon 
                    :name="getInputIcon(form.inputType)" 
                    color="primary"
                    size="24px"
                    class="q-mr-sm"
                    style="width: 24px; min-width: 24px"
                  />
                  <div class="ellipsis">
                    {{ inputTypeOptions.find(opt => opt.value === form.inputType)?.label }}
                  </div>
                </div>
              </template>
            </q-select>
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
import { ref, computed } from 'vue'
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
      required: false
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
          required: field.req || false
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
          required: false
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
          req: fieldData.required
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
      getInputIcon
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

.ellipsis
  text-overflow: ellipsis
  white-space: nowrap
  overflow: hidden
  flex: 1
  min-width: 0
</style>

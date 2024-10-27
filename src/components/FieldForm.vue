<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin" style="min-width: 500px">
      <q-card-section>
        <div class="text-h6">{{ isEdit ? 'Редактировать' : 'Добавить' }} поле</div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <div class="row q-col-gutter-md q-mb-sm">
          <div class="col-6">
            <q-input 
              v-model="form.name" 
              label="Название" 
              standout 
              dense
              :rules="[val => !!val || 'Обязательное поле']"
            />
          </div>
          <div class="col-6">
            <q-select
              v-model="form.dataType"
              :options="dataTypeOptions"
              label="Тип данных"
              standout
              dense
              emit-value
              map-options
            />
          </div>
        </div>

        <div class="q-mb-sm">
          <div class="text-subtitle2 q-mb-xs">Секция</div>
          <q-btn-toggle
            v-model="form.section"
            :options="sectionOptions"
            unelevated
            dense
            toggle-color="primary"
            spread
          />
        </div>

        <div class="row q-col-gutter-md q-mb-sm">
          <div class="col-6">
            <q-select
              v-model="form.listType"
              :options="listTypeOptions"
              label="Тип в списке"
              standout
              dense
              emit-value
              map-options
            />
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
            />
          </div>
        </div>

        <div class="row q-col-gutter-md items-center">
          <div class="col-6">
            <q-input 
              v-model="form.prompt" 
              label="Метка" 
              standout 
              dense
            />
          </div>
          <div class="col-6">
            <q-toggle
              v-model="form.required"
              label="Обязательное"
              left-label
              color="green"
              dense
            />
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
import schemaService from '../services/schemaService'
import { 
  dataTypeOptions, 
  sectionOptions, 
  listTypeOptions, 
  inputTypeOptions 
} from '../dictionaries/fieldTypes'

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

  setup(props) {
    const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent()
    const $q = useQuasar()
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
        if (editingFieldName.value) {
          // Обновляем существующее поле через единый интерфейс
          await schemaService.update('field', editingFieldName.value, fieldData, props.entityName)
          $q.notify({
            type: 'positive',
            message: 'Поле успешно обновлено'
          })
        } else {
          // Создаем новое поле через единый интерфейс
          await schemaService.create('field', fieldData, props.entityName)
          $q.notify({
            type: 'positive',
            message: 'Поле успешно добавлено'
          })
        }

        onDialogOK(fieldData)
      } catch (error) {
        console.error('Error saving field:', error)
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
      saveField
    }
  }
}
</script>

<style lang="sass">
.q-dialog-plugin
  max-width: 95vw
</style>

<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin" style="min-width: 500px">
      <q-card-section>
        <div class="text-h6">{{ isEdit ? 'Редактировать' : 'Добавить' }} поле</div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <q-input 
          v-model="form.name" 
          label="Название" 
          standout 
          dense
          class="q-mb-sm"
          :rules="[val => !!val || 'Обязательное поле']"
        />

        <q-select
          v-model="form.dataType"
          :options="dataTypeOptions"
          label="Тип данных"
          standout
          dense
          class="q-mb-sm"
          emit-value
          map-options
        />

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

        <q-select
          v-model="form.listType"
          :options="listTypeOptions"
          label="Тип в списке"
          standout
          dense
          class="q-mb-sm"
          emit-value
          map-options
        />

        <q-select
          v-model="form.inputType"
          :options="inputTypeOptions"
          label="Тип ввода в форме"
          standout
          dense
          class="q-mb-sm"
          emit-value
          map-options
        />

        <q-input 
          v-model="form.prompt" 
          label="Метка" 
          standout 
          dense
          class="q-mb-sm"
        />

        <q-toggle
          v-model="form.required"
          label="Обязательное"
          left-label
          color="green"
          dense
          class="q-mb-sm"
        />
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
import { useDialogPluginComponent } from 'quasar'
import { useSchemaStore } from '../stores/schema'

export default {
  name: 'FieldDialog',

  emits: [
    ...useDialogPluginComponent.emits
  ],

  setup () {
    const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent()
    const schemaStore = useSchemaStore()
    const isEdit = ref(false)

    const form = ref({
      name: '',
      dataType: '',
      section: 'main',
      listType: '',
      inputType: '',
      prompt: '',
      required: false
    })

    const dataTypeOptions = [
      { label: 'number - Число', value: 'number' },
      { label: 'string - Строка', value: 'string' },
      { label: 'reference - Ссылка', value: 'reference' },
      { label: 'textarea - Текстовое поле', value: 'textarea' },
      { label: 'date - Дата', value: 'date' },
      { label: 'time - Время', value: 'time' },
      { label: 'checkbox - Флажок', value: 'checkbox' },
      { label: 'email - Электронная почта', value: 'email' },
      { label: 'numbers - Массив чисел', value: 'numbers' }
    ]

    const sectionOptions = [
      { label: 'Avatar', value: 'avatar' },
      { label: 'Main', value: 'main' },
      { label: 'Data', value: 'data' }
    ]

    const listTypeOptions = [
      { label: 'title - Заголовок', value: 'title' },
      { label: 'subtitle - Подзаголовок', value: 'subtitle' },
      { label: 'content - Содержание', value: 'content' },
      { label: 'label - Метка', value: 'label' },
      { label: 'chips - Чипы', value: 'chips' },
      { label: 'count - Счетчик', value: 'count' },
      { label: 'date - Дата', value: 'date' },
      { label: 'switch - Переключатель', value: 'switch' }
    ]

    const inputTypeOptions = [
      { label: 'select - Выбор', value: 'select' },
      { label: 'string - Строка', value: 'string' },
      { label: 'textarea - Текстовое поле', value: 'textarea' },
      { label: 'date - Дата', value: 'date' },
      { label: 'numbers - Массив чисел', value: 'numbers' },
      { label: 'checkbox - Флажок', value: 'checkbox' },
      { label: 'email - Электронная почта', value: 'email' },
      { label: 'time - Время', value: 'time' }
    ]

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
        isEdit.value = false
      }
      dialogRef.value.show()
    }

    const onOKClick = () => {
      if (isFormValid.value) {
        const fieldData = {
          name: form.value.name,
          type: form.value.dataType,
          list: `${form.value.section}-${form.value.listType}`,
          input: form.value.inputType,
          prompt: form.value.prompt,
          req: form.value.required
        }
        onDialogOK(fieldData)
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
      show
    }
  }
}
</script>

<style lang="sass">
.q-dialog-plugin
  max-width: 95vw
</style>

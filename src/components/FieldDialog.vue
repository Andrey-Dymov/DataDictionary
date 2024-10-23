<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin" style="min-width: 500px">
      <q-card-section>
        <div class="text-h6">{{ isEdit ? 'Редактировать' : 'Добавить' }} поле</div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-6">
            <q-input v-model="form.name" label="Название" standout class="q-mb-sm" />
            <q-select 
              v-model="form.type" 
              :options="typeOptions" 
              label="Тип" 
              standout 
              class="q-mb-sm"
              emit-value
              map-options
            />
            <q-select
              v-model="form.input"
              :options="inputTypeOptions"
              label="Тип ввода"
              standout
              class="q-mb-sm"
              emit-value
              map-options
            />
            <q-input v-model="form.prompt" label="Подсказка" standout class="q-mb-sm" />
          </div>
          <div class="col-12 col-md-6">
            <q-select
              v-model="form.list"
              :options="listTypeOptions"
              label="Тип отображения в списке"
              standout
              class="q-mb-sm"
              emit-value
              map-options
            />
            <div class="row items-center justify-between q-mb-sm">
              <div class="text-subtitle2">Обязательное</div>
              <q-toggle v-model="form.req" color="positive" />
            </div>
          </div>
        </div>
      </q-card-section>

      <q-card-actions align="right" class="text-primary">
        <q-btn flat label="Отмена" v-close-popup />
        <q-btn flat label="OK" @click="onOKClick" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
import { ref, defineEmits } from 'vue'
import { useDialogPluginComponent } from 'quasar'

export default {
  emits: [...useDialogPluginComponent.emits],

  setup() {
    const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent()
    const form = ref({
      name: '',
      type: '',
      input: '',
      list: '',
      prompt: '',
      req: false
    })
    const isEdit = ref(false)

    const typeOptions = [
      { label: 'Строка', value: 'string' },
      { label: 'Число', value: 'number' },
      { label: 'Дата', value: 'date' },
      { label: 'Время', value: 'time' },
      { label: 'Флаг', value: 'checkbox' },
      { label: 'Объект', value: 'object' },
      { label: 'Массив', value: 'array' },
      { label: 'Email', value: 'email' },
      { label: 'Ссылка', value: 'reference' },
      { label: 'Массив чисел', value: 'numbers' }
    ]

    const inputTypeOptions = [
      { label: 'Текст', value: 'string' },
      { label: 'Текстовая область', value: 'textarea' },
      { label: 'Выбор', value: 'select' },
      { label: 'Числа', value: 'numbers' },
      { label: 'Дата', value: 'date' },
      { label: 'Время', value: 'time' },
      { label: 'Флажок', value: 'checkbox' },
      { label: 'Email', value: 'email' },
      { label: 'Ссылка', value: 'reference' }
    ]

    const listTypeOptions = [
      { label: 'Основной заголовок', value: 'main-title' },
      { label: 'Подзаголовок', value: 'main-subtitle' },
      { label: 'Основной контент', value: 'main-content' },
      { label: 'Метки', value: 'main-chips' },
      { label: 'Счетчик', value: 'data-count' },
      { label: 'Дата', value: 'data-date' },
      { label: 'Переключатель', value: 'data-switch' },
      { label: 'Аватар с меткой', value: 'avatar-label' }
    ]

    const show = (field = null) => {
      if (field) {
        form.value = { 
          ...field,
          input: field.input || field.inputType,
          list: field.list || field.displayType
        }
        isEdit.value = true
      } else {
        form.value = {
          name: '',
          type: 'string',
          input: 'string',
          list: 'main-title',
          prompt: '',
          req: false
        }
        isEdit.value = false
      }
      dialogRef.value.show()
    }

    const onOKClick = () => {
      onDialogOK(form.value)
    }

    return {
      dialogRef,
      onDialogHide,
      onOKClick,
      form,
      isEdit,
      typeOptions,
      inputTypeOptions,
      listTypeOptions,
      show
    }
  }
}
</script>

<style lang="sass" scoped>
.q-dialog-plugin
  max-width: 95vw

.custom-input
  border-radius: 8px
  .q-field__control
    height: 56px
    border-radius: 8px
  .q-field__marginal
    height: 56px
</style>
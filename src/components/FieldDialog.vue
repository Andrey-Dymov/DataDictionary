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
          class="q-mb-md"
          :rules="[val => !!val || 'Обязательное поле']"
        />

        <q-select
          v-model="form.dataType"
          :options="dataTypeOptions"
          label="Тип данных"
          standout
          class="q-mb-md"
          emit-value
          map-options
        />

        <q-select
          v-model="form.listType"
          :options="listTypeOptions"
          label="Тип вывода в списке"
          standout
          class="q-mb-md"
          emit-value
          map-options
        />

        <q-select
          v-model="form.inputType"
          :options="inputTypeOptions"
          label="Тип ввода в форме"
          standout
          class="q-mb-md"
          emit-value
          map-options
        />

        <q-input 
          v-model="form.prompt" 
          label="Метка" 
          standout 
          class="q-mb-md"
        />

        <q-toggle
          v-model="form.required"
          label="Обязательное"
          class="q-mb-md"
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
      listType: '',
      inputType: '',
      prompt: '',
      required: false
    })

    const dataTypeOptions = computed(() => schemaStore.dataTypes)
    const listTypeOptions = computed(() => schemaStore.listTypes)
    const inputTypeOptions = computed(() => schemaStore.inputTypes)

    const isFormValid = computed(() => {
      return form.value.name && 
             form.value.dataType && 
             form.value.listType && 
             form.value.inputType
    })

    const show = (field = null) => {
      if (field) {
        form.value = { 
          ...field
        }
        isEdit.value = true
      } else {
        form.value = {
          name: '',
          dataType: '',
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
        onDialogOK(form.value)
      }
    }

    return {
      dialogRef,
      onDialogHide,
      onOKClick,
      form,
      isEdit,
      dataTypeOptions,
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

<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin" style="min-width: 500px">
      <q-card-section>
        <div class="text-h6">{{ isEdit ? 'Редактировать' : 'Добавить' }} сущность</div>
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

        <q-input 
          v-model="form.prompt" 
          label="Метка" 
          standout 
          dense
          class="q-mb-sm"
        />

        <q-input 
          v-model="form.promptSingle" 
          label="Метка единственного числа" 
          standout 
          dense
          class="q-mb-sm"
        />

        <q-input 
          v-model="form.description" 
          label="Описание" 
          type="textarea" 
          standout 
          dense
          class="q-mb-sm"
        />

        <q-input 
          v-model="form.icon" 
          label="Иконка" 
          standout 
          dense
          class="q-mb-sm"
        >
          <template v-slot:append>
            <q-icon :name="form.icon" />
          </template>
        </q-input>
      </q-card-section>

      <q-card-actions align="right" class="text-primary">
        <q-btn flat label="Отмена" v-close-popup />
        <q-btn flat label="OK" @click="onOKClick" :disable="!isFormValid" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useDialogPluginComponent } from 'quasar'

const props = defineProps({
  collection: {
    type: Object,
    default: () => ({})
  },
  isEdit: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits([...useDialogPluginComponent.emits])

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent()

const form = ref({
  name: '',
  prompt: '',
  promptSingle: '',
  description: '',
  icon: ''
})

const isEdit = ref(false)

const isFormValid = computed(() => {
  return !!form.value.name
})

function onOKClick () {
  if (isFormValid.value) {
    onDialogOK(form.value)
  }
}

defineExpose({
  show(collection = null) {
    if (collection) {
      form.value = { ...collection }
      isEdit.value = true
    } else {
      form.value = { name: '', prompt: '', promptSingle: '', description: '', icon: '' }
      isEdit.value = false
    }
    dialogRef.value.show()
  },
  hide() {
    dialogRef.value.hide()
  }
})
</script>

<style lang="sass">
.q-dialog-plugin
  max-width: 95vw
</style>

<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin" style="min-width: 350px">
      <q-card-section>
        <div class="text-h6">{{ isEdit ? 'Edit' : 'Add' }} Entity</div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <q-input dense v-model="form.name" label="Name" autofocus @keyup.enter="onOKClick" />
        <q-input dense v-model="form.description" label="Description" />
        <q-input dense v-model="form.icon" label="Icon" />
        <q-input dense v-model="form.prompt" label="Prompt" />
        <q-input dense v-model="form.promptSingle" label="Prompt Single" />
      </q-card-section>

      <q-card-actions align="right" class="text-primary">
        <q-btn flat label="Cancel" v-close-popup />
        <q-btn flat label="OK" @click="onOKClick" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, defineEmits, defineExpose } from 'vue'
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
  description: '',
  icon: '',
  prompt: '',
  promptSingle: ''
})

function onOKClick () {
  onDialogOK(form.value)
}

defineExpose({
  show () {
    form.value = { ...props.collection }
    dialogRef.value.show()
  },
  hide () {
    dialogRef.value.hide()
  }
})
</script>
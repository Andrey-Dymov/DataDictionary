<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin" style="min-width: 500px">
      <q-card-section>
        <div class="text-h6">{{ isEdit ? 'Редактировать' : 'Добавить' }} сущность</div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <div class="row q-col-gutter-xs">
          <div class="col-12 q-mb-xs">
            <q-input 
              v-model="form.name" 
              label="Название" 
              standout 
              dense
              :rules="[val => !!val || 'Обязательное поле']"
            />
          </div>

          <div class="col-12 q-mb-xs">
            <q-input 
              v-model="form.prompt" 
              label="Метка" 
              standout 
              dense
            />
          </div>

          <div class="col-12 q-mb-xs">
            <q-input 
              v-model="form.promptSingle" 
              label="Метка единственного числа" 
              standout 
              dense
            />
          </div>

          <div class="col-12 q-mb-xs">
            <q-input 
              v-model="form.description" 
              label="Описание" 
              type="textarea" 
              standout 
              dense
            />
          </div>

          <div class="col-12 q-mb-xs">
            <q-input 
              v-model="form.icon" 
              label="Иконка" 
              standout 
              dense
            >
              <template v-slot:append>
                <q-icon :name="form.icon" />
              </template>
            </q-input>
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
import { useDialogPluginComponent } from 'quasar'

export default {
  name: 'CollectionForm',

  emits: [
    ...useDialogPluginComponent.emits
  ],

  setup() {
    const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent()

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

    const onOKClick = () => {
      console.log('[CollectionForm] OK clicked')
      if (isFormValid.value) {
        onDialogOK(form.value)
      }
    }

    // Добавляем метод show
    const show = (collection = null) => {
      console.log('[CollectionForm] Show called with:', collection)
      if (collection) {
        console.log('[CollectionForm] Setting form data for edit')
        form.value = { ...collection }
        isEdit.value = true
      } else {
        console.log('[CollectionForm] Setting empty form for new collection')
        form.value = { 
          name: '', 
          prompt: '', 
          promptSingle: '', 
          description: '', 
          icon: '' 
        }
        isEdit.value = false
      }
      dialogRef.value.show()
    }

    return {
      dialogRef,
      onDialogHide,
      onOKClick,
      form,
      isEdit,
      isFormValid,
      show // Добавляем show в return
    }
  }
}
</script>

<style lang="sass">
.q-dialog-plugin
  max-width: 95vw
</style>

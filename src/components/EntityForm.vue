<!-- Переименовываем из CollectionForm.vue -->
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
              outlined 
              dense
              :rules="[val => !!val || 'Обязательное поле']"
            />
          </div>

          <div class="col-12 q-mb-xs">
            <q-input 
              v-model="form.prompt" 
              label="Метка" 
              outlined 
              dense
            />
          </div>

          <div class="col-12 q-mb-xs">
            <q-input 
              v-model="form.promptSingle" 
              label="Метка единственного числа" 
              outlined 
              dense
            />
          </div>

          <div class="col-12 q-mb-xs">
            <q-input 
              v-model="form.description" 
              label="Описание" 
              type="textarea" 
              outlined 
              dense
            />
          </div>

          <div class="col-12 q-mb-xs">
            <q-input 
              v-model="form.icon" 
              label="Иконка" 
              outlined 
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
import { useDialogPluginComponent, useQuasar } from 'quasar'
import dictionaryService from '../services/dictionaryService'

export default {
  name: 'EntityForm',

  emits: [
    ...useDialogPluginComponent.emits
  ],

  setup() {
    const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent()
    const $q = useQuasar()
    const isEdit = ref(false)
    const editingEntityName = ref(null)

    const form = ref({
      name: '',
      prompt: '',
      promptSingle: '',
      description: '',
      icon: '',
      fields: [],
      relations: {}
    })

    const isFormValid = computed(() => {
      return !!form.value.name
    })

    const saveEntity = async (entityData) => {
      try {
        if (editingEntityName.value) {
          // Обновляем существующую сущность через единый интерфейс
          await dictionaryService.update('entity', editingEntityName.value, entityData)
          $q.notify({
            type: 'positive',
            message: 'Сущность успешно обновлена'
          })
        } else {
          // Создаем новую сущность через единый интерфейс
          await dictionaryService.create('entity', entityData)
          $q.notify({
            type: 'positive',
            message: 'Сущность успешно добавлена'
          })
        }

        onDialogOK(entityData)
      } catch (error) {
        console.error('Error saving entity:', error)
        $q.notify({
          type: 'negative',
          message: `Ошибка при ${editingEntityName.value ? 'обновлении' : 'добавлении'} сущности`
        })
      }
    }

    const onOKClick = () => {
      if (isFormValid.value) {
        saveEntity(form.value)
      }
    }

    const show = (entity = null) => {
      console.log('[EntityForm] Show called with:', entity)
      if (entity) {
        console.log('[EntityForm] Setting form data for edit')
        form.value = { ...entity }
        editingEntityName.value = entity.name
        isEdit.value = true
      } else {
        console.log('[EntityForm] Setting empty form for new entity')
        form.value = { 
          name: '', 
          prompt: '', 
          promptSingle: '', 
          description: '', 
          icon: '',
          fields: [],
          relations: {}
        }
        editingEntityName.value = null
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
      show,
      saveEntity
    }
  }
}
</script>

<style lang="sass">
.q-dialog-plugin
  max-width: 95vw
</style>


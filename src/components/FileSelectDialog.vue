<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card style="min-width: 600px">
      <q-card-section>
        <div class="text-h6">Выбор файла</div>
      </q-card-section>

      <q-card-section class="q-pa-none">
        <q-list separator>
          <q-item
            v-for="file in files"
            :key="file.value"
            clickable
            v-ripple
            @click="selectFile(file)"
          >
            <q-item-section avatar>
              <q-icon name="description" color="primary" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ file.label }}</q-item-label>
              <q-item-label caption>
                Последнее изменение: {{ new Date(file.modified).toLocaleString() }}
              </q-item-label>
            </q-item-section>
            <q-item-section side>
              {{ file.size }}
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Отмена" color="primary" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
import { ref } from 'vue'
import { useDialogPluginComponent } from 'quasar'
import { api } from '../boot/axios'

export default {
  name: 'FileSelectDialog',

  props: {
    path: {
      type: String,
      required: true
    }
  },

  emits: [
    ...useDialogPluginComponent.emits
  ],

  setup (props) {
    const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent()
    const files = ref([])

    const loadFiles = async () => {
      try {
        const response = await api.get(`/api/filesystem/files?path=${encodeURIComponent(props.path)}`)
        files.value = response.data
      } catch (error) {
        console.error('Error loading files:', error)
      }
    }

    const selectFile = (file) => {
      onDialogOK(file)
    }

    const show = async () => {
      await loadFiles()
      dialogRef.value.show()
    }

    return {
      dialogRef,
      onDialogHide,
      files,
      selectFile,
      show
    }
  }
}
</script>

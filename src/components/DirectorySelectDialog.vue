<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card style="min-width: 600px">
      <q-card-section>
        <div class="text-h6">Выбор каталога</div>
      </q-card-section>

      <q-card-section class="q-pa-none">
        <q-list separator>
          <q-item
            v-for="dir in directories"
            :key="dir.value"
            clickable
            v-ripple
            @click="selectDirectory(dir)"
          >
            <q-item-section avatar>
              <q-icon name="folder" color="primary" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ dir.label }}</q-item-label>
              <q-item-label caption>{{ dir.value }}</q-item-label>
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
  name: 'DirectorySelectDialog',

  emits: [
    ...useDialogPluginComponent.emits
  ],

  setup () {
    const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent()
    const directories = ref([])

    const loadDirectories = async () => {
      try {
        const response = await api.get('/api/filesystem/directories')
        directories.value = response.data
      } catch (error) {
        console.error('Error loading directories:', error)
      }
    }

    const selectDirectory = (dir) => {
      onDialogOK(dir)
    }

    const show = async () => {
      await loadDirectories()
      dialogRef.value.show()
    }

    return {
      dialogRef,
      onDialogHide,
      directories,
      selectDirectory,
      show
    }
  }
}
</script>

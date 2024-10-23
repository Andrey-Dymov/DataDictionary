<template>
  <q-page class="flex flex-center column">
    <img
      alt="Логотип Data Dictionary"
      src="@/assets/vue.svg"
      style="width: 200px; height: 200px"
      class="q-mb-md"
    >
    <h4 class="text-weight-light text-grey-8">
      Добро пожаловать в Data Dictionary
    </h4>
    <p class="text-grey-6">
      Выберите сущность из меню слева, чтобы начать работу
    </p>
  </q-page>
</template>

<script>
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'IndexPage'
})
</script>
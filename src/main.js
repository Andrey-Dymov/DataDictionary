import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { Quasar, Dialog } from 'quasar'

// Импорт библиотек иконок
import '@quasar/extras/material-icons/material-icons.css'
import '@mdi/font/css/materialdesignicons.css'

// Импорт стилей Quasar
import 'quasar/src/css/index.sass'

// Импорт компонента приложения и стилей
import App from './App.vue'
import './style.css'

// Импорт маршрутизатора
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(Quasar, {
  plugins: {
    Dialog
  },
  config: {
    brand: {
      primary: '#007AFF',
      secondary: '#5AC8FA',
      accent: '#FF2D55',
      dark: '#1d1d1d',
      positive: '#34C759',
      negative: '#FF3B30',
      info: '#5AC8FA',
      warning: '#FF9500'
    }
  }
})

app.mount('#app')
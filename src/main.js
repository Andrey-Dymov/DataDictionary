import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { Quasar, Notify } from 'quasar'

// Импорт библиотек иконок
import '@quasar/extras/material-icons/material-icons.css'

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
    Notify
  }
})

app.mount('#app')

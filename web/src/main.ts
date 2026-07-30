import { createApp } from 'vue'
import './assets/css/main.css'
import App from './App.vue'
import router from './router'
import { ruleService } from './utils/ruleService'

ruleService.initRules()

const app = createApp(App)

app.use(router)

app.mount('#app')

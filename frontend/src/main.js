import './assets/main.css'

import { createApp, reactive } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { languages, LanguagePlugin } from './module/languages.js';
const lang = window.localStorage.getItem('lang');
const globalSettings = reactive({
    "$l": languages[ lang || 'enUS'],
    setLanguage: (lang) => {
        globalSettings.$l = languages[lang],
        window.localStorage.setItem('lang',lang)
    },

   
})
const app = createApp(App)
app.provide("globalSettings", globalSettings);
// setTimeout(() => {
//     globalSettings.$l = languages.enUS
//     console.log("l:", globalSettings.$l)
// }, 10000)

app.use(createPinia())
app.use(router)

app.mount('#app')

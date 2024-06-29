<script setup>
import { RouterLink, RouterView } from 'vue-router'
import { NTabs, NTabPane, NMessageProvider, NNotificationProvider, useNotification, createDiscreteApi, NConfigProvider,darkTheme } from 'naive-ui'

import HomeView from './views/HomeView.vue'
import Settings from './views/Settings.vue'
// import HelloWorld  from './components/HelloWorld.vue'
// import { useAttrs } from 'vue';
// const {$l} = useAttrs();
// console.log($l)
// import {inject} from 'vue';
// const {$l} = getCurrentInstance().appContext.config.globalProperties
import { inject, computed, onMounted, onUnmounted } from 'vue';
import { Ws } from './module/ws.js';
import { wsHost } from '@/module/const.js';
import { useCounterStore } from './stores/counter.js'
const globalSettings = inject('globalSettings');
const $l = computed(() => globalSettings.$l)

const counter = useCounterStore();

let ws = null;
// const notification = useNotification();
const { notification } = createDiscreteApi(['notification']);

onMounted(() => {
  if (!ws) {
    ws = new Ws(wsHost)
    ws.onmessage = (e) => {
      let msg = JSON.parse(e.data);
      const { content, info: { from, time } } = msg
      counter.increment()
      // list.value.unshift({
      //   type: 'in',
      //   id: 1,
      //   from: from,
      //   content: content,
      //   time: time
      // })
      notification.info({
        title: $l.value['incomeNewSms'],
        content: `${content}`,
        duration: 10000
      })
    }
  }
})
onUnmounted(() => {
  ws.close();
})

</script>

<template>
  <!-- <RouterLink to="/">Home</RouterLink> -->

  <!-- <RouterView /> -->
  <n-config-provider :theme="darkTheme">
    <n-message-provider>
      <NNotificationProvider>
        <div class="w-full flex flex-col justify-center items-center">
          <div class="w-1/2  min-w-96 h-screen tabs flex">
            <n-tabs type="line" class="h-full" animated>
              <n-tab-pane name="msg" :tab="$l['message']">

                <home-view />
              </n-tab-pane>
              <n-tab-pane name="settings" :tab="$l['settings']">
                <settings></settings>
              </n-tab-pane>
            </n-tabs>
          </div>
        </div>
      </NNotificationProvider>
    </n-message-provider>
  </n-config-provider>
</template>

<style scoped>
.tabs :deep(.n-tabs-pane-wrapper) {
  flex: 1 1 auto;
}

.tabs :deep(.n-tab-pane) {
  height: 100%;

}

.tabs :deep(.n-tabs-tab__label) {
  width: 4rem;
  justify-content: center;
}
</style>

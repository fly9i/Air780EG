<script setup>
import { NInput, NIcon, NDataTable, NInfiniteScroll, useMessage } from 'naive-ui'
import { ref, watch, onMounted, onUnmounted, computed, inject } from 'vue'
import { IosSend, IosPhonePortrait } from '@vicons/ionicons4';
import dayjs from 'dayjs';
import MsgBox from '@/components/MsgBox.vue';
import { Ws } from '@/module/ws.js'
import { fetch } from '@/module/fetch.js'
import { wsHost } from '@/module/const.js';
import { useCounterStore } from '@/stores/counter.js';

const counter = useCounterStore();
const globalSettings = inject('globalSettings');
const $l = computed(() => globalSettings.$l)

const sms = ref('');
const message = useMessage();

const enterSend = (e) => {
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault()
    send();
  }
}

const sendColor = ref('#ccc');

const phoneNumber = ref('');
const phoneNumberAllow = (v) => {
  console.log(v)
  return !v || /^[0-9 +]+$/.test(v)
}

watch(sms, () => {
  if (sms.value.length > 0) {
    sendColor.value = '#000'
  } else {
    sendColor.value = '#ccc'
  }
})
watch(() => counter.count, async () => {
  console.log("counter change:" + counter.count);
  await listAllSms();
})
const allSmsList = ref([])
const loadMessage = async () => {
  // return list.push()
  console.log("load messages.")
}
const send = async () => {
  console.log(sms.value)

  try {
    let res = await fetch("/api/sendsms", {
      method: 'post',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: sms.value,
        to: phoneNumber.value,
        time: new Date()
      })
    })
    let json = await res.json();
    if (json.code == 0) {
      message.success(`${$l.value['sendSuccess']}`)
      await listAllSms();
    } else {
      message.error(`${$l.value['sendFail']}`)
    }
  } catch (e) {
    console.error(e)
    message.error(`${$l.value['sendFail']}`)
  }

}

const setPhoneNumber = (phone) => {
  phoneNumber.value = phone
}

async function listAllSms() {

  let res = await fetch("/api/listsms");
  let json = await res.json();
  let data = json.data.sort((a, b) => new Date(b.msg_time) - new Date(a.msg_time))
  allSmsList.value = [];
  for (let { type, id, from, to, content, msg_time } of data) {
    allSmsList.value.push({
      type,
      id,
      from,
      to,
      content,
      time: dayjs(msg_time).format('YYYY-MM-DD HH:mm:ss')
    })

  }

}

onMounted(async () => {
  await listAllSms();
});

onUnmounted(() => {

})
</script>

<template>
  <div class="w-full h-full flex flex-col p-1">
    <div class="w-full p-1">
      <n-input type="text" class="borderd-container text-left p-1" v-model:value="phoneNumber"
        :placeholder="$l['inputPhoneNumber']" :allow-input="phoneNumberAllow">
        <template #prefix>
          <n-icon :component="IosPhonePortrait" />
        </template>
      </n-input>
      <n-input v-model:value="sms" type="textarea" class="borderd-container text-left mt-1 p-1"
        :placeholder="$l['inputSmsHint']" @keydown.enter="enterSend">
        <template #suffix>
          <n-icon :component="IosSend" class="cursor-pointer" :size="22" :color="sendColor" @click="send" />
        </template>
      </n-input>
    </div>
    <div class="w-full flex-auto overflow-auto p-1  min-h-[300px]">
      <div class="border-2 border-blue-200 rounded-lg h-full">
        <msg-box class="p-1" v-bind:list="allSmsList" @loadMessage="loadMessage" @setPhoneNumber="setPhoneNumber" />
      </div>
    </div>
  </div>
</template>
<style scoped>
.borderd-container {
  @apply border-solid border rounded-lg;
}
</style>

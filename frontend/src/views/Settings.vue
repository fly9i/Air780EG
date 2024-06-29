<script setup>
import { NCollapse, NIcon, NCollapseItem, NH3, NButton, NInput, NH2, NDivider, NSelect, useMessage, NTag, NDataTable, NScrollbar } from 'naive-ui';
import { h, ref, onMounted, watch, computed, inject } from 'vue';
import { fetch } from '@/module/fetch.js';
import { IosArrowForward } from '@vicons/ionicons4';
import hljs from 'highlight.js/lib/core';
import bash from 'highlight.js/lib/languages/bash';
import CopyableData from '@/components/CopyableData.vue';
import { Codemirror } from 'vue-codemirror';
import { javascript } from "@codemirror/lang-javascript";
import { oneDark } from "@codemirror/theme-one-dark";
const extensions = [javascript(), oneDark];

const globalSettings = inject('globalSettings');
const $l = computed(() => globalSettings.$l)

const language = ref(window.localStorage.getItem('lang') || 'enUS');
const languageOptions = ref([
    {
        label: $l.value['zhCN'],
        value: 'zhCN'
    },
    {
        label: $l.value['enUS'],
        value: 'enUS'
    }
])

const message = useMessage();
const serialport = ref(null);
const serialportOptions = ref([]);
const info = ref([]);
const demoCode = computed(() => {
    return `
# ${$l.value['scriptExample']}

{
    "method":"POST",
    "url":"https://example.com/callback/{from}",
    "headers":{
        "Content-Type":"application/json"
    },
    "body":{
        "chat_id":"\${chat_id}",
        "text":"*-- \${from}*\\n\\n_\${from}_\\n\\n\${content}",
        "parse_mode":"MarkdownV2"
    }
}

# ${$l.value['orTelegramCallbak']}
{
    "type":"telegram",
    "chat_id":"{your_chat_id}",
    "token":"{your_bot_token}",
    "base_url":"optional {https://api.telegram.org or some telegram proxy}"
}
`
})

const getCurrentSerialPort = async () => {
    let res = await fetch('/api/serialport');
    let json = await res.json();
    if (json?.port?.path) {
        serialport.value = json.port.path;
    }

    if (json?.sca) {
        let d = [{
            name: $l.value['myNum'],
            value: json?.mynum?.split(",")[1].replace(/"/g, '')
        },
        {
            "name": $l.value['operator'],
            "value": json.cops?.mcc?.operator
        },
        {
            name: $l.value['netlight'],
            value: json?.netlight
        },
        {
            name: $l.value['sca'],
            value: json?.sca
        }, {
            name: $l.value['csq'],
            value: json?.csq
        }
        ]
        for (let key in json.info) {
            d.push({ name: key, value: json.info[key] })
        }

        info.value = d;
    } else {
        info.value = [];
    }

}

const setLight = async (value) => {
    await fetch('/api/setlight', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: value == '1' ? '0' : '1' })
    })
    message.success(`${$l.value['netlight']} ${value == '1' ? $l.value['off'] : $l.value['on']}`)
    await getCurrentSerialPort();
}
const infoCols = ref([
    {
        title: $l.value['prop'],
        key: "name"
    },
    {
        title: $l.value['value'],
        key: "value",
        render(row) {
            if (row.name === $l.value['myNum'] || row.name === "IMEI" || row.name === "ICCID" || row.name === "IMSI") {
                return h(CopyableData, {
                    data: row.value
                }, {
                    default: () => row.value
                })
            } else if (row.name === $l.value['netlight']) {
                return h('div', {
                    class: row.value == '1' ? 'w-3 h-3 rounded-full bg-green-500 cursor-pointer' : 'w-3 h-3 rounded-full bg-red-500 cursor-pointer',
                    onClick: async () => {
                        await setLight(row.value);
                    }
                }, {
                    default: () => ''
                })
            } else {
                return row.value
            }
        }
    }
])



const getSerialPorts = async () => {
    let res = await fetch('/api/serialports');
    let json = await res.json();
    for (let s of json) {
        serialportOptions.value.push({ label: s, value: s })
    }
}

const serialportChange = async (val) => {
    // console.log(val)
    let res = await fetch('/api/setserialport', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ serialport: val })
    });
    let json = await res.json();
    if (json.fail) {
        message.error(`${$l.value['setPortFail']}`)
    } else {
        message.success(`${$l.value['setPortAs']}: + ${val}`)
    }
    await getCurrentSerialPort();
}

const testParams = ref({
    content: '',
    from: '',
    timestamp: ''
});
const testCallback = async () => {
    let re = {}
    testParams.value.config = callbackconfig.value;
    // console.log(testParams.value)
    try {
        let res = await fetch('/api/testcallback', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testParams.value)
        });
        if (res.ok) {
            let json = await res.json();
            re = {
                ok: json?.code == 0,
                status: res.status,
                msg: json.msg,
                data: json.data
            }
        } else {
            re = {
                ok: false,
                status: res.status,
                data: await res.text()
            }
        }

    } catch (e) {
        console.error(e)
        res = {
            ok: false,
            msg: e.message
        }
    }
    console.log(re)
    testResult.value = re;
}

const getCallback = async () => {
    let res = await fetch('/api/getcallback');
    let json = await res.json();

    if (json?.data) {
        // console.log(json.data.body)
        callbackconfig.value = json.data.body;
    }
    // pushOptions.value = await res.json();
};
const setCallback = async (e) => {
    e.preventDefault();

    let res = await fetch('/api/setcallback', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            body: callbackconfig.value
        })
    });
    if (res?.ok) {
        message.success(`${$l.value['operateSuccess']}`)
    } else {
        message.error(`${$l.value['operateFail']}`)
    }
}

hljs.registerLanguage('bash', bash);
const hDemoCode = computed(() => {
    return hljs.highlight(demoCode.value, { language: 'bash' }).value
})

const langUpdate = (val) => {
    globalSettings.setLanguage(val);
    getCurrentSerialPort();
}

const callbackconfig = ref('');
const testResult = ref('');

onMounted(async () => {
    await getSerialPorts();
    await getCurrentSerialPort();
    await getCallback();

})

</script>
<template>

    <!-- <div class="w-full h-full p-1 flex-auto overflow-auto"> -->
    <n-scrollbar class="w-full p-4">
        <n-h2>{{ $l['language'] }}</n-h2>
        <div class="ml-2">
            <n-select :placeholder="$l['selectLanguage']" v-model:value="language" :options="languageOptions" filterable
                clearable tag @update:value="langUpdate"></n-select>
        </div>
        <n-h2>{{ $l['serialport'] }}</n-h2>
        <div class="ml-2">
            <n-select :placeholder="$l['selectPort']" v-model:value="serialport" :options="serialportOptions" filterable
                clearable tag @update:value="serialportChange"></n-select>

            <n-data-table :bordered="false" :columns="infoCols" :data="info" size="small" :max-height="200"
                class="mt-2"></n-data-table>

        </div>
        <n-divider></n-divider>
        <n-h2>{{ $l['callbackHint'] }}</n-h2>
        <n-collapse class="w-full ">
            <template #arrow>
                <n-icon :component="IosArrowForward" class="text-gray-400" />
            </template>
            <n-collapse-item name="1" class="w-full pl-2 pt-2 text-gray-400">

                <template #header>
                    <span class="text-gray-400">{{ $l['clickShowDesc'] }}</span>
                </template>
                <div class="text-gray-400 text-sm p-2">
                    <ul>
                        <li>{{ $l['callbackDesc1'] }}</li>
                        <li>{{ $l['callbackDesc2'] }}</li>
                    </ul>
                    <pre class="w-full overflow-auto bordered bg-slate-900 p-4 rounded-lg shadow-lg"><code class="language-bash"
                v-html="hDemoCode"></code></pre>
                </div>
            </n-collapse-item>
        </n-collapse>
        <div class="flex flex-col ml-2 mt-2">
            <!-- <n-input v-model:value="push.body" type="textarea" :placeholder="$l['callbackInputHint']"
                class="rounded-lg"></n-input> -->
            <div class="w-full rounded-2xl overflow-hidden h-56">
                <codemirror v-model="callbackconfig" :autofocus="true" :extensions="extensions"
                    class="text-sm font-sans rounded-lg" :style="{ height: '100%' }"
                    placeholder="Enter your script here,Press Ctrl/Command+S to save" @keydown.ctrl.s="setCallback"
                    @keydown.meta.s="setCallback"></codemirror>
            </div>
            <div class="flex w-full flex-row p-2 items-center">
                <div class="border-dashed border border-lime-500 rounded-lg py-1 px-2">
                    <n-input placeholder="test content" v-model:value="testParams.content" autosize
                        class="w-32 mr-2"></n-input>
                    <n-input placeholder="test from" v-model:value="testParams.from" autosize
                        class="w-32 mr-2"></n-input>
                    <n-input placeholder="test timestamp" v-model:value="testParams.timestamp" autosize
                        class="w-32 mr-2"></n-input>
                    <n-button type="primary" @click="testCallback">{{ $l['scriptTest'] }}</n-button>
                </div>
                <div class="flex-grow flex justify-end">
                    <n-button type="primary" @click="setCallback" class="mr-5">{{ $l['callbackSetButton'] }}</n-button>
                </div>
            </div>
            <div class="w-full p-2 flex flex-col bg-slate-900 rounded-lg text-slate-200" v-if="testResult">
                <n-scrollbar class="w-full max-h-[300px]">
                    <div class="flex flex-row items-center">
                        <div :class="`w-4 h-4 rounded-full ${testResult.ok ? 'bg-green-500' : 'bg-red-500'}`"></div>
                        <span class="ml-2">HTTP Status: {{ testResult.status }} {{ testResult.msg ? ` -
                            Result - ${testResult.msg}` : ''
                            }}</span>
                    </div>
                    <div class="w-full mt-5">
                        <b>output:</b>
                    </div>
                    <div class="w-full text-slate-200">
                        <pre>{{ testResult.data }}</pre>
                    </div>
                </n-scrollbar>
            </div>

        </div>

        <n-divider></n-divider>
    </n-scrollbar>
    <!-- </div> -->
</template>
<style>
@import 'highlight.js/styles/an-old-hope.css';
</style>
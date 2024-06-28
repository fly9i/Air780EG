const zhCN = {
    settings: "设置",
    message: "消息",
    push: "推送",
    incomeNewSms: '收到新短信',
    inputPhoneNumber: '输入手机号码',
    inputSmsHint: '输入短信内容, 按 Command/Ctrl+回车键发送',
    prop: '属性',
    value: '值',
    setPortAs: '端口设置为',
    myNum: '本机号码',
    operator: '运营商',
    netlight: '网络灯',
    sca: '短信中心',
    csq: '信号强度',
    serialport: '串口设备',
    selectPort: '请选择串口设备',
    callbackHint: '收信回调 [执行Shell]',
    clickShowDesc:'使用说明 [点击查看]',
    callbackDesc1: '1. 在下方输入框中输入回调配置(JSON 格式)',
    callbackDesc2: '2. 短信内容/来电号码/来电时间 将分别作为 ${content} ${from} ${timestamp} 传入',
    callbackInputHint: '输入调用脚本内容',
    callbackSetButton: '设置回调',
    click2Copy: '点击复制',
    copySuccess: '复制成功',
    copy: '复制',
    scriptExample: '回调请求配置示例:',
    language: '语言',
    zhCN: '简体中文',
    enUS: 'English',
    selectLanguage: '请选择语言',
    on: 'On',
    off: 'Off',
    setPortFail: '检测失败，无效的串口设备',
    sendSuccess: '发送成功',
    sendFail: '发送失败',
    scriptTest: '脚本测试',
    operateSuccess: '操作成功',
    operateFail: '操作失败',
    orTelegramCallbak: "或者配置Telegram回调",
}
const enUS = {
    settings: "Settings",
    message: "Message",
    push: "Push",
    incomeNewSms: 'Received new SMS',
    inputPhoneNumber: 'Enter phone number',
    inputSmsHint: 'Enter SMS content, press Command/Ctrl+Enter to send',
    prop: 'Property',
    value: 'Value',
    setPortAs: 'Set port as',
    myNum: 'My number',
    operator: 'Operator',
    netlight: 'Network light',
    sca: 'SMSC (Short Message Service Center)',
    csq: 'Signal strength',
    serialport: 'Serial port device',
    selectPort: 'Please select the serial port device',
    callbackHint: 'Receive callback [Execute Shell]',
    clickShowDesc:'Usage description [Click to view]',
    callbackDesc1: '1. Enter the callback configuration in the input box below (JSON format)',
    callbackDesc2: '2. SMS content/caller number/call time will be passed as ${content} ${from} ${timestamp} respectively',
    callbackInputHint: 'Enter the script content to call',
    callbackSetButton: 'Set callback',
    click2Copy: 'Click to copy',
    copySuccess: 'Copy success',
    copy: 'Copy',
    scriptExample: 'Callback Request configuration example:',
    language: 'Language',
    zhCN: '简体中文',
    enUS: 'English',
    selectLanguage: 'Please select language',
    on: 'On',
    off: 'Off',
    setPortFail: 'Detection failed, invalid serial port device',
    sendSuccess: 'Send success',
    sendFail: 'Send failed',
    scriptTest: 'TestScript',
    operateSuccess: 'Operation success',
    operateFail: 'Operation failed',
    orTelegramCallbak: 'or configure Telegram callback'
}

const LanguagePlugin = {

    install(app) {
        
        app.config.globalProperties.$l = function (key) {
            return enUS[key]
        }
    }
}
const languages = {
    zhCN,
    enUS
}

export { languages, LanguagePlugin }
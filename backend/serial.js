import { SerialPort } from 'serialport'
import { ReadlineParser } from '@serialport/parser-readline'
import { EventEmitter } from 'events';
import fs from 'fs';
import { Deliver, parse, Submit } from 'node-pdu';

import { fileURLToPath } from 'url';
import path, { dirname, join } from 'path';


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const mapFile = join(__dirname, './mcc.map.json');
const mccMap = JSON.parse(fs.readFileSync(mapFile, 'utf8'));

function sleep(ms) {
    console.log("sleep %s", ms)
    return new Promise((r, j) => {
        setTimeout(function () {
            r();
        }, ms)
    })
}

function getUnicode2(s) {
    var u = "";
    for (var i = 0; i < s.length; i++) {
        u += s.charCodeAt(i).toString(16);
    }
    return u;
}
function getUnicode(s) {
    var u = "";
    for (var i = 0; i < s.length; i++) {
        let t = s.charCodeAt(i).toString(16);
        if (t.length < 4) {
            for (var j = 0; j < 4 - t.length; j++) {
                u += '0';
            }
        }
        u += t;
    }
    return u;
}
function parseUnicode(s) {
    if (s.length % 4 == 0) {
        var t = s.length / 4;
        let ss = "";
        for (let i = 0; i < t; i++) {
            let unicodeHex = s.substring(i * 4, (i + 1) * 4);
            let charCode = parseInt(unicodeHex, 16);
            ss += String.fromCharCode(charCode);
        }
        return ss;
    } else {
        throw new Error("length error")
    }
}

const atCmd = {
    setupSMSText: "AT+CMGF=0",
    getAllSMS: "AT+CMGL=\"ALL\"",
    getState: "AT+CPIN?",
    getSignal: "AT+CSQ",
    setAPNAuto: "AT+CSTT",
    getNetState: "AT+CGATT?",
    setAPN: 'AT+SAPBR=3,1,"APN","${APN}"',
    getIMEI: "AT+CGSN",
    getIMSI: "AT+CIMI",
    getIMEI2: "AT+CGMI",
    getIMSI2: "AT+CIMI",
    getICCID: "AT+CCID",
    getModuleType: "AT+CGMM",
    getModuleInfo: "AT+CGMR",
    reset: "AT+RESET",
    setLight: "AT+CNETLIGHT=${light}",
    getLight: "AT+CNETLIGHT?",
    setFlightMode: "AT+CFUN=${mode}", // 0: off, 1: on, 
    setCSQAuto: "AT*CSQ=${csq}", // 0: off, 1: on  网络质量主动上报
    getLocation: 'AT+CIPGSMLOC=1,1', // +CIPGSMLOC: 0,40.1168327,116.4012222,2024/06/11,15:49:50
    setLocationEnable: 'AT+SAPBR=1,1', // 激活位置获取

    getMyNumber: 'AT+CNUM',
    //获取运营商
    getOperator: "AT+COPS?",
    setOperatorFormat: 'AT+COPS=3,0',
}

String.prototype.format = function (args) {
    return this.replace(/\${(.+?)}/g, function (match, key) {
        return key in args ? args[key] : match;
    })
}


class Port extends EventEmitter {
    constructor(path, baudRate = 115200) {
        super()
        this.path = path;
        this.serialPort = new SerialPort({
            path: path,

            //波特率，可在设备管理器中对应端口的属性中查看
            baudRate: baudRate,
            autoOpen: false
        })
        const parser = new ReadlineParser({ delimiter: '\r\n' });

        this.serialPort.pipe(parser);
        this.serialPort.on('open',()=>{
            console.log("Serial port open")
        })

        this.pendingCommands = [];

        this.serialPort.on('error', (err) => {
            console.error('Error: ', err.message);
            if (this.pendingCommands.length > 0) {
                const currentCommand = this.pendingCommands.shift();
                currentCommand.reject(err);
            }
        });

        parser.on('data', async (data) => {
            console.log('data received', data.slice(0, 100));

            if (data.indexOf('+CMTI:') >= 0) {
                // 收到短信
                let r = data.split(':')[1].split(',');
                let index = r[1];
                let sms = await this.readSms(index);
                this.emit('sms', sms);
                return;
            }

            if (this.pendingCommands.length > 0) {
                const currentCommand = this.pendingCommands[0];
                if (data.includes('OK') || data.includes('ERROR')) {
                    // console.log("partial response:%o", currentCommand.partialResponse)
                    // currentCommand.resolve();
                    // this.pendingCommands.shift(); // 移除已处理的命令

                    // 完整的响应已接收
                    // let res = currentCommand.partialResponse.split('\r\n\r\n');
                    // res = res.map(str => str.trim());
                    let res = currentCommand.partialResponse;
                    if (!res) {
                        this.pendingCommands.unshift();
                        currentCommand.resolve('');
                        return;
                    }
                    if (data.includes('ERROR')) {
                        currentCommand.reject(`CMD:${res[0]} - ${new Error(data)}`);
                    } else {

                        currentCommand.resolve({
                            cmd: res[0],
                            res: res.length > 1 ? res.slice(1) : []
                        });
                    }
                    this.pendingCommands.shift(); // 移除已处理的命令
                } else {
                    // 累积响应
                    // currentCommand.partialResponse = (currentCommand.partialResponse || '') + data + '\n';
                    if (currentCommand.partialResponse) {
                        currentCommand.partialResponse.push(data)
                    } else {
                        currentCommand.partialResponse = [data]
                    }
                    // currentCommand.partialResponse?currentCommand.partialResponse.push(data):[data];
                }
            }
        });
        this.serialPort.open(async (err) => {
            console.log('IsOpen:', this.serialPort.isOpen)
            console.log('err:', err)
            if (!err) {
                // setTimeout(() => {
                //     this.init()
                // }, 1000)
            }
        });
    }

    isOpen() {
        return this.serialPort.isOpen
    }

    async waitForOpen() {
        if (this.serialPort.isOpen) {
            return;
        }
        return new Promise((resolve, reject) => {
            this.serialPort.once('open', () => {
                resolve();
            })
        })
    }

    open() {
        return new Promise((resolve, reject) => {
            this.serialPort.open((err) => {
                if (!err) {
                    resolve();
                } else {
                    reject(err);
                }
            })
        })
    }

    close() {
        return new Promise((resolve, reject) => {
            this.serialPort.close((err) => {
                console.log("close serial port", err)
                if (!err) {
                    resolve();
                } else {
                    reject(err);
                }
            })
        })
    }

    async test() {
        // console.log("test serial port")
        let result = 1;
        for (let i = 0; i < 2; i++) {
            try {
                await this.sendCmd('AT', 1000);
            } catch (err) {
                console.warn(err.message)
                return 0;
            }
        }
        return result;
    }

    onlySend(cmd) {
        return new Promise((resolve, reject) => {
            this.serialPort.write(Buffer.from(cmd) + '\r', (err) => {
                if (!err) {
                    console.log(`${cmd} execute success`);
                    resolve();
                } else {
                    reject(err)
                }
            })
        })
    }

    async init() {


        await sleep(1000)
        await this.onlySend('ATE1')
        await this.sendCmd('AT');
        //AT+CMGF=1  1:文本模式
        await this.sendCmd('AT+CMGF=0');
        await this.sendCmd('AT+CSMP=17,167,0,8');
        //AT+COPS=3,2  3:国家码 2:网络码
        await this.sendCmd('AT+COPS=3,2');

        //AT+CSDH=1  控制 TEXT 模式下短信头信息显示：
        await this.sendCmd('AT+CSDH=1');

        //AT+CPMS="SM","SM","SM" 设置短信存储空间 sim卡
        await this.sendCmd('AT+CPMS="SM","SM","SM"');

        //AT+CNMI=2,1,0,0,0  设置短信通知
        await this.sendCmd('AT+CNMI=2,1,0,0,0');

        //AT+CSCS="UCS2" 设置短信编码
        await this.sendCmd('AT+CSCS="IRA"');
    }


    sendCmd(cmd, timeout) {
        return new Promise((resolve, reject) => {
            const timer = timeout ? setTimeout(() => {
                reject(new Error('timeout'))
            }, timeout) : null
            this.pendingCommands.push({
                cmd: cmd,
                resolve: (value) => {
                    if (timer) {
                        clearTimeout(timer)
                    }
                    resolve(value)
                },
                reject: (err) => {
                    if (timer) {
                        clearTimeout(timer)
                    }
                    reject(err)
                },
            })
            this.serialPort.write(Buffer.from(cmd) + '\r')
        })
    }

    async getInfo() {
        let data = await this.sendCmd('AT*I');
        let r = {}
        let res = data.res[0].split('\n');
        for (let ifo of res) {
            let t = ifo.split(':');
            r[t[0]] = t[1].trim();
        }
        return r;
    }

    async getCSQ() {
        let data = await this.sendCmd('AT+CSQ');
        if (data.res.length) {
            return data.res[0].split(':')[1].trim();
        }
    }

    async getNetLightStatus() {
        let data = await this.sendCmd('AT+CNETLIGHT?');
        if (data.res.length) {
            return data.res[0].split(':')[1].trim();
        }
    }
    async setNetlightStatus(status) {
        await this.sendCmd(`AT+CNETLIGHT=${status}`);
    }

    async getMyNum() {
        let data = await this.sendCmd('AT+CNUM');
        if (data.res.length) {
            return data.res[0].split(':')[1].trim();
        }
    }

    async getSCA() {
        let data = await this.sendCmd('AT+CSCA?');
        if (data.res.length) {
            return data.res[0].split(':')[1].trim();
        }
    }

    async getCOPS() {
        let data = await this.sendCmd('AT+COPS?');
        if (data.res.length) {
            let d = data.res[0].split(':')[1].trim();
            let dd = d.split(',').map(str => str.trim().replace(/"/g, ''));
            return {
                code: dd[2],
                mcc: mccMap[dd[2]] || dd[2]
            }
        }
    }

    async deleteSms(idx) {
        let data = await this.sendCmd(`AT+CMGD=${idx}`);
        console.log("delete cmgr data res:%o", data.res)
    }

    parseSms(data) {
        let out = parse(data)

        let info = {}
        let content = '';
        if (out instanceof Deliver) {
            content = out.data.getText();
            info.from = out.address.phone;
            info.time = out.serviceCenterTimeStamp.time * 1000;
        }
        return {
            info,
            content
        }
    }

    async readSms(idx) {
        let data = await this.sendCmd(`AT+CMGR=${idx}`);
        console.log("read cmgr data res:%o", data.res)
        if (data.res.length == 2) {
            let smsData = this.parseSms(data.res[1].trim().replace(/"/g, ''));
            if (smsData){
                smsData.index = idx;
            }
            return smsData;
        }
    }

    async sendSms(number, str) {

        const submit = new Submit(number, str);

        let content = submit.toString();
        let len = content.length / 2 - 1;
        this.serialPort.write(Buffer.from(`AT+CMGS=${len}`) + '\r')
        await sleep(1000);
        this.serialPort.write(Buffer.from(content) + '\x1A')

    }
    async cancelSms() {
        this.serialPort.write(Buffer.from('\x1B\r'));
    }

    async listAllSms() {
        let data = await this.sendCmd('AT+CMGL=4');
        let all = [];
        if (data?.res?.length) {
            let cs = data.res;
            for (let i = 0; i < cs.length; i += 2) {
                let index = -1
                try {
                    let meta = cs[i]
                    if (meta) {
                        if (meta.indexOf("+CMGL: ") == 0) {
                            let s = meta.substring(7).split(',')[0];
                            index = parseInt(s)
                        }
                    }

                    let smsData = this.parseSms(cs[i + 1]);

                    if (smsData) {
                       smsData.index = index;
                    }
                    all.push(smsData);
                } catch (e) {
                    console.error(e)
                }
            }
        }
        return all;

    }

}


export { Port }


// console.log(parseUnicode('4f60597d'))

// console.log(getUnicode('你好'));
// console.log(getUnicode2('你好'));
import { getAllSerialPorts } from './dev.js';
import { Port } from './serial.js';
import { PrismaClient } from '@prisma/client';
import { Callback } from './module/callback.js';
import crypto from 'crypto';
import { allSettledWithThrow } from 'openai/lib/Util.mjs';
const prisma = new PrismaClient();



let port = null;
let globalEmitter = null;

function md5(str) {
    return crypto.createHash('md5').update(str).digest('hex');
}

async function getCallback() {
    let res = await prisma.callback.findFirst({});
    if (res && res.body && res.body.trim().length > 0) {
        return res.body;
    } else {
        return null;
    }
}

async function updateSimSms(port) {
    let smsList = await port.listAllSms();

    for (let sms of smsList) {
        console.log("sms:%o", sms)
        const { info: { from, time }, content, index } = sms;
        let uid = md5(`in_${from}_${time}_${content}`);
        try {
            await prisma.message.create({
                data: {
                    uid,
                    type: 'in',
                    from,
                    msg_time: new Date(time),
                    content
                }
            })
            await port.deleteSms(index);
        } catch (e) {

            if (e?.message && e.message.indexOf('Unique constraint failed on the fields: (`uid`)') > -1) {
                console.warn("duplicate sms, from:%s,time:%s,content:%s", from, time, content)
                await port.deleteSms(index);
            } else {
                console.error(e)
            }
        }
    }
}
async function init() {
    if (port && port.isOpen()) {
        await port.close()
    }
    let d = await prisma.serialport.findFirst({});
    if (d?.path) {
        const tmpPort = new Port(d.path, d.baudrate || 115200);
        await tmpPort.waitForOpen();
        let test = await tmpPort.test();
        // let test = 1;
        console.log("Serial port test result:", test)
        if (test) {
            await tmpPort.init();
            tmpPort.on('sms', async (data) => {
                await prisma.message.create({
                    data: {
                        uid: md5(`in_${data.info.from}_${data.info.time}_${data.content}`),
                        type: 'in',
                        from: data.info.from,
                        msg_time: new Date(data.info.time),
                        content: data.content
                    }
                })

                const config = await getCallback();
                if (config) {
                    const call = new Callback(JSON.parse(config), data.content, data.info.from, data.info.time);
                    await call.request();
                }

                await port.deleteSms(data.index);
                if (globalEmitter) {
                    globalEmitter.emit('sms', data);
                }
            })
            port = tmpPort;
            await updateSimSms(tmpPort);
            return 1;
        } else {
            await tmpPort.close();
        }
    }
    return 0;
}

async function mainRoutes(emitter) {
    globalEmitter = emitter;
    await init();

    return async function (fastify, options) {

        fastify.get('/serialports', async (request, reply) => {
            let res = getAllSerialPorts();
            reply.send(res);
        })
        fastify.post('/setlight', async (request, reply) => {
            await port.setNetlightStatus(request.body.status);
            reply.send({});
        });
        fastify.get('/serialport', async (request, reply) => {
            let res = await prisma.serialport.findFirst({})
            if (port != null && port.isOpen()) {
                reply.send({
                    port: res,
                    mynum: await port.getMyNum(),
                    info: await port.getInfo(),
                    csq: await port.getCSQ(),
                    netlight: await port.getNetLightStatus(),
                    sca: await port.getSCA(),
                    cops: await port.getCOPS()
                });
            } else {
                reply.send({
                    port: res
                });
            }
        });
        fastify.get('/listsms', async (request, reply) => {
            let res = await prisma.message.findMany({
                where: {
                    status: 1
                }
            })
            reply.send({ data: res });
        });
        fastify.post('/sendsms', async (request, reply) => {
            let body = request.body;
            if (body.to && body.content) {
                let res = await port.sendSms(body.to, body.content);
                await prisma.message.create({
                    data: {
                        uid: md5(`out_${body.to}_${new Date()}_${body.content}`),
                        type: 'out',
                        to: body.to,
                        msg_time: new Date(),
                        content: body.content
                    }
                })
                reply.send({
                    code: 0,
                    data: res
                });
            } else {
                reply.send({
                    code: 1
                })
            }
        });
        fastify.post('/setserialport', async (request, reply) => {
            let body = request.body;
            let port = body.serialport;
            let baudrate = body.baudrate || 115200;
            let res = await prisma.serialport.upsert({
                where: { id: 1 },
                update: { path: port, baudrate: baudrate },
                create: { path: port, baudrate: baudrate },
            })
            let opened = await init();
            if (!opened) {
                reply.send({ fail: 1 });
            } else {
                reply.send(res);
            }

        });
        fastify.post('/setcallback', async (request, reply) => {
            let body = request.body.body;
            let res = await prisma.callback.upsert({
                where: { id: 1 },
                update: { body },
                create: { body },
            })
            reply.send(res);
        });
        fastify.get('/getcallback', async (request, reply) => {
            let res = await prisma.callback.findFirst({})
            reply.send({
                data: res
            });
        })
        fastify.post('/testcallback', async (request, reply) => {
            const { content, from, timestamp, config } = request.body;
            console.log("req.body:%o", request.body)
            // let callbackscript = await getCallback();
            let result = { code: 1, msg: 'Empty config' };
            if (config) {
                const call = new Callback(JSON.parse(config), content, from, timestamp);
                try {
                    let data = await call.request();
                    result = {
                        code: 0,
                        data
                    }
                } catch (e) {
                    result = {
                        code: 2,
                        msg: e.message
                    }
                }
            }
            reply.send(result);
        })
    }
}

export { mainRoutes }
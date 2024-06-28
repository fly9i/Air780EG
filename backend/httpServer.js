import Fastify from 'fastify';
import cors from '@fastify/cors';
import fstatic from '@fastify/static';
import websocket from '@fastify/websocket';

import { EventEmitter } from 'events';
import { Port } from './serial.js';

import { mainRoutes } from './mainRoutes.js';

import fs from 'fs';
import { fileURLToPath } from 'url';
import path, { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const frontendBaseDir = join(__dirname, '../frontend/dist/')

const htmlFile = join(frontendBaseDir,'index.html');


class Server {
    constructor() {
        this.emitter = new EventEmitter();
        const fastify = Fastify({
            logger: true
        })
        this.fastify = fastify;
        fastify.register(cors, {
            origin: "*",
            methods: ["GET", "PUT", "POST"],
        });

        fastify.register(fstatic, {
            root: join(frontendBaseDir, 'assets'),
            prefix: '/assets/'
        })

        fastify.register(websocket);
        fastify.register(async (fastify) => {
            fastify.get('/ws', { websocket: true }, async (socket, request) => {
                if (this.emitter) {
                    this.emitter.removeAllListeners('sms');
                    this.emitter.on('sms', (data) => {
                        socket.send(JSON.stringify(data));
                    })
                }
                socket.on('message', (message) => {
                    if (message.toString() === 'ping') {
                        socket.send('pong');
                    }else {
                        console.log('received: %o', message);
                    }
                });
                socket.on('close', () => {
                    console.log('disconnected');
                });
                
            });
        })

        fastify.register(mainRoutes(this.emitter), { prefix: '/api' });

        fastify.get('*', (req, reply) => {
            if (req.url.startsWith('/api')) {
                return reply.callNotFound();
            }

            reply.code(200).header('Content-Type', 'text/html').send(fs.readFileSync(htmlFile, 'utf-8'))
        });
    }

    async start() {
        try {
            await this.fastify.listen({ port: 3000, host: '0.0.0.0' });
        } catch (e) {
            this.fastify.log.error(e)
            process.exit(1)
        }
    }
}



export { Server }
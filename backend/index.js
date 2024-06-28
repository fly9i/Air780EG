import { Server } from './httpServer.js';


(async () => {
    const server = new Server();
    await server.start();
})()

process.on('uncaughtException',async (error) => {
    console.error("uncaughtException:%o", error)
})
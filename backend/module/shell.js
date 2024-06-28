import { spawn } from 'child_process';
import { EventEmitter } from 'events';

class Command extends EventEmitter {
    constructor(cmd) {
        super()
        this.cmd = cmd;
    }

    exec() {
        return new Promise((r, j) => {
            let toExec = ["-c", this.cmd,'--'];
            let args = arguments;
            if (args.length > 0) {
                for (let arg of args){
                    toExec.push(arg)
                }
            }
            

            let sh = spawn("sh",toExec);

            sh.stderr.on('data', (data) => {
                process.stderr.write(`${data}`);
                this.emit('error',data);
            });
            sh.stdout.on('data', (data) => {
                process.stdout.write(`${data}`);
                this.emit('data',data);
            });
            sh.on('close', (code) => {
                console.log(`child process exited with code ${code}`);
                if (code != 0) {
                    console.log(`command: ${this.cmd}`);
                    j(new Error(`FAILED execute command : ${this.cmd}`));
                } else {
                    r();
                }
            });
        })
    }
}

export { Command }

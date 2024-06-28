import fs from 'fs';
import path from 'path';

const serialPath = '/dev/serial/by-id/';


function getAllSerialPorts() {
    const files = fs.readdirSync(serialPath);
    const allSerialPorts = files.map((file) => {
        return path.join(serialPath, file)
    })
    return allSerialPorts;
}

export { getAllSerialPorts };

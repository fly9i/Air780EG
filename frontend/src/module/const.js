const host = document.location.host;
// const host = '192.168.1.124:53000';
const apiHost = `http://${host}`;
const wsHost = `ws://${host}/ws`;

export {
    apiHost,
    wsHost
}
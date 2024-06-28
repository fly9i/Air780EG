const host = document.location.host;
const apiHost = `http://${host}`;
const wsHost = `ws://${host}/ws`;

export {
    apiHost,
    wsHost
}

class Ws {

    constructor(url) {
        this.pingInterval = 5000;
        this.pingTimeout = 5000;
        this.url = url;
        this.connect();
        this.onmessage = null;

    }

    connect() {

        const websocket = new WebSocket(this.url);
        // let connectionTimer = setTimeout(() => {
        //     websocket.close();
        // },this.pingTimeout)
        // websocket.onopen = ()=>{
        //     clearTimeout(connectionTimer);
        //     return this.onopen.bind(this)()
        // }

        websocket.onopen = this._onopen.bind(this);
        websocket.onclose = this._onclose.bind(this);
        websocket.onerror = this._onerror.bind(this);
        websocket.onmessage = this._onmessage.bind(this);
        this.websocket = websocket
    }
    _onopen() {
        console.log('WebSocket connected');
        this.pingTimer = setInterval(() => {
            // console.log('send ping');
            this.websocket.send('ping');

            // 设定超时时间
            this.pingTimeoutTimer = setTimeout(() => {
                console.log('Close connection due to inactivity');
                this.websocket.close();
            }, this.pingTimeout);
        }, this.pingInterval);

    }

    _onclose(e) {

        console.log('WebSocket closed', e.code);
        if (this.pingTimer) {
            clearInterval(this.pingTimer)
        }
        if (e.code !== 3001) {
            setTimeout(() => {
                this.connect();    
            },3000)
            
        }
    }

    _onerror(e) {
        console.log('WebSocket error', e);
        this.websocket.close();


    }

    _onmessage(e) {
        // console.log(e.data)
        if (e.data === 'pong') {
            if (this.pingTimeoutTimer) {
                clearTimeout(this.pingTimeoutTimer);
            }
        } else if (this.onmessage && typeof this.onmessage === 'function') {
            this.onmessage(e);
        }
    }
    close() {
        this.websocket.close(3001, 'close');
    }

}

export { Ws }
import fetch from 'node-fetch';
import dayjs from 'dayjs';
String.prototype.format = function (args) {
    return this.replace(/\${(.+?)}/g, function (match, key) {
        return key in args ? args[key] : match;
    })
}
class Callback {
    constructor(config, content, from, timestamp) {
        /**
         this:
        {
            type: http| telegram
            config,
            requestType: form/json/text
        }
         */

        this.config = config;
        this.content = content;
        this.from = from;
        try{
            this.timestamp = parseInt(timestamp);
        }catch(e){
            this.timestamp = Date.now();
        }

        this.type = this.config.type;
        if (!this.type || this.type.trim() == 'http') {
            this.type = 'http';
            this.config.url = this.config.url.format({ content: encodeURIComponent(content), from: encodeURIComponent(from), timestamp: timestamp })
            if (this.config.form && Object.prototype.toString.call(this.config.form) == '[object Object]') {
                for (let key in this.config.form) {
                    this.config.form[key] = this.config.form[key].format({ content: encodeURIComponent(content), from: encodeURIComponent(from), timestamp: timestamp })
                }
            }

            if (this.config.body && Object.prototype.toString.call(this.config.body) == '[object Object]') {
                for (let key in this.config.body) {
                    this.config.body[key] = this.config.body[key].format({ content: content, from: from, timestamp: timestamp })
                }
            }

            if (this.config.headers && Object.prototype.toString.call(this.config.headers) == '[object Object]') {
                let contentType = '';
                for (let key in this.config.headers) {
                    if (key.toLowerCase() in ['content-type', 'contenttype']) {
                        contentType = this.config.headers[key]
                    }
                }
                if (contentType && contentType.toLowerCase().indexOf('application/json') > -1) {
                    this.requestType = 'json';
                } else if (contentType && contentType.toLowerCase().indexOf('application/x-www-form-urlencoded') > -1) {
                    this.requestType = 'form';
                } else if (contentType && contentType.toLowerCase().indexOf('text/plain') > -1) {
                    this.requestType = 'text';
                } else {
                    if (this.config.body) {
                        this.requestType = 'json';
                    } else if (this.config.form) {
                        this.requestType = 'form';
                    }
                }
            }

            if (this.requestType == 'text' && this.config.body && Object.prototype.toString.call(this.config.body) == '[object String]') {
                this.config.body = this.config.body.format({ content: content, from: from, timestamp: timestamp })
            }

            if (this.config.method && this.config.method.toLowerCase() != 'get') {
                this.params = {
                    method: this.config.method,
                    headers: this.config.headers || {}
                }
                if (this.requestType == 'json' && this.config.body && Object.prototype.toString.call(this.config.body) == '[object Object]') {
                    this.params.body = JSON.stringify(this.config.body)
                } else if (this.requestType == 'form' && this.config.form && Object.prototype.toString.call(this.config.form) == '[object Object]') {
                    const form = new URLSearchParams();
                    for (let key in this.config.form) {
                        form.append(key, this.config.form[key]);
                    }
                    this.params.body = form
                } else if (this.requestType == 'text' && this.config.body && Object.prototype.toString.call(this.config.body) == '[object String]') {
                    this.params.body = this.config.body
                }
            } else {
                this.params = {
                    method: 'GET',
                    headers: this.config.headers || {}
                }
            }

        }

    }

    async request() {
        if (this.type == 'http') {
            let res = await fetch(this.config.url, this.params);
            let result = await res.text();
            console.log("Callback result:%s", result);
            return result;
        } else if (this.type.trim() == 'telegram') {
            const { chat_id, token, base_url } = this.config;
            
            let url = `${base_url || 'https://api.telegram.org'}/bot${token}/sendMessage`;
            let regex = /[_*\[\]()~`>#+-=|{}.!]/g
            let content = this.content.replace(regex,s=>'\\'+s)

            let time = dayjs(this.timestamp).format('YYYY-MM-DD HH:mm:ss').replace(regex,s=>'\\'+s);
            let reqContent = `☎️ ${this.from}\n📅 ${time}\n \n\n\`\n${content}\``;
            // console.log("telegram request:[%s] - [%s] - [%s]",url,reqContent,this.timestamp)
            let res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    chat_id,
                    text: reqContent,
                    parse_mode:"MarkdownV2"
                })
            });
            console.log("telegram request res:%s",await res.text())
        }
    }
}

export { Callback }

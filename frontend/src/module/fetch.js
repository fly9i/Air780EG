import { apiHost } from '@/module/const.js';

function fetch(url,options){
    const fullUrl = `${apiHost}${url}`;
    return window.fetch(fullUrl, options);
}

export { fetch }
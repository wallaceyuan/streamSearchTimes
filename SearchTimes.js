/**
 * Created by yuan on 2018/1/25.
 */
let EventEmitter = require('events')
let util = require('util')
let fs = require('fs')

class SearchTimes extends EventEmitter {
    constructor(path, options) {
        super(path, options);
        this.path = path;
        this.text = options.text || '';
        this.highWaterMark = options.highWaterMark || 64 * 1024;
        this.buffer = Buffer.alloc(this.highWaterMark);
        this.flags = options.flags || 'r';
        this.encoding = options.encoding || 'utf-8';
        this.mode = options.mode || 0o666;
        this.start = options.start || 0;
        this.end = options.end;
        this.pos = this.start;
        this.autoClose = options.autoClose || true;
        this.bytesRead = 0;
        this.closed = false;
        this.buffers = '';
        this._reader = fs.createReadStream(path);
        this.on('newListener',(type)=>{
            if(type == 'searchTimes'){
                this.read();
            }
        })
        this.open();
    }
    read(){
        if(typeof this.fd != 'number'){
            return this.once('open',()=>this.read())
        }
        let howMuchToRead = this.end?Math.min(this.end-this.pos+1,this.highWaterMark):this.highWaterMark
        fs.read(this.fd,this.buffer,0,howMuchToRead,this.pos,(err,bytes)=>{
            if(err){
                if(this.autoClose)
                    this.destroy()
                return this.emit('err',err)
            }
            if(bytes){
                let data = this.buffer.slice(0,bytes)
                this.pos += bytes
                data = this.encoding?data.toString(this.encoding):data
                this.emit('searchTimes',data)
                this.buffers += data
                if(this.end && this.pos > this.end){
                    return this.endFn();
                }else{
                    this.read();
                }
            }else{
                return this.endFn();
            }
       })
    }
    getPlaceholderCount(strSource,text) {
        var thisCount = 0;
        strSource.replace(new RegExp(this.unicode(text),'g'), function (m, i) {
            thisCount++;
        });
        return thisCount;
    }
    unicode(str){
        var value='';
        for (var i = 0; i < str.length; i++) {
            value += '\\u' + this.left_zero_4(parseInt(str.charCodeAt(i)).toString(16));
        }
        return value;
    }
    left_zero_4(str) {
        if (str != null && str != '' && str != 'undefined') {
            if (str.length == 2) {
                return '00' + str;
            }
        }
        return str;
    }
    endFn(){
        const count = this.getPlaceholderCount(this.buffers,this.text)
        this.emit('end',count);
        this.destroy();
    }
    open(){
        fs.open(this.path,this.flags,this.mode,(err,fd)=>{
            if(err){
                if(this.autoClose){
                    this.destroy()
                    return this.emit('err',err)
                }
            }
            this.fd = fd
            this.emit('open')
        })
    }
    destroy(){
        fs.close(this.fd,(err)=>{
            this.emit('close')
        })
    }
}

module.exports = SearchTimes
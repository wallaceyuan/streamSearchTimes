/**
 * Created by yuan on 2018/1/25.
 */
let SearchTime = require('./SearchTimes')
let reader = new SearchTime('./1.txt',{
    text:'好好',
    highWaterMark:30
})
reader.on('searchTimes',(data)=>{
    console.log(data)
})
reader.on('end',data=>{
    console.log('count',data)
})

reader.on('error',(error)=>{
    console.log('error',error)
})
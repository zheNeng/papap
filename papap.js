const axios = require('axios')
const cheerio = require('cheerio')
const fs = require("fs");
const path = require('path');
var baseUrl = 'https://www.3344mf.com'  //爬取的网站
var sum = 0
var htmlNo = 1 //爬虫得到起始页面，一个页面有20个图片库，每个图片库有20+的图片
var htmlLimt = htmlNo + 10  //爬虫的结束页面
let type = 'yazhou'   //图片分类   //katong yazhou zipai  taotu siwa  oumei
var time = ''
try {
  fs.mkdirSync(`./dist`)  //创建文件夹
} catch (e) { }
try {
  fs.mkdirSync(`./dist/${type}`)//创建文件夹
} catch (e) { }
let newdir = path.join(__dirname, `dist`)
let picdir = newdir + `/${type}`

var config = {
  timeout: 2000,
  url: 'http://pic.58pic.com/58pic/14/62/50/62558PICxm8_1024.jpg',
  method: 'get',
  responseType: 'arraybuffer'
}
var f = function (e) { //封装函数
  let n = 0
  let result = []
  return new Promise((res, rej) => {
    e.forEach((a, i) => {
      a.then((t) => {
        n++
        result[i] = t
        if (n == e.length) {
          res(result)
        }
      }).catch(a => {
        n++
        console.log(`第${n+1}张图片请求失败`)
        // result[i] = a
        // if (n == e.length) {
        //   res(result)
        // }
      })
    })
  })

}

function getImgArr(imgArr) {
  console.log('请求全部图片资源')
  time = new Date()
  let arr = []
  for (let i = 0; i < imgArr.length; i++) {
   config.url = imgArr[i]
    arr.push(axios(config))
    // config.url = imgArr[i]
    // axios(config).then(e => {
    //   arr[i] = e.data
    // }).catch(e => console.log('图片资源请求失败'))
  }
  return f(arr)
}
async function searchImg(htmlArr) {
  for (let i = 0; i < htmlArr.length; i++) {
    try {
      let e = await axios.get(htmlArr[i])
      let docC = cheerio.load(e.data)
      let imgArr = []
      docC(".news img").each((iImg, img) => {
        imgArr.push(docC(img).attr('src'))
      })
      console.log(`${htmlNo}页${i}条:${htmlArr[i]}`, )
      let imgStream
      imgStream = await getImgArr(imgArr)
      console.log('请求图片耗时间', (new Date() - time) / 1000 + '秒')
      time = new Date()
      imgStream.forEach((e, ii) => {
        if (e.data.length < 500000) {
          let ws = fs.createWriteStream(`${picdir}/${htmlNo}_${i}-${ii}.jpg`, {
            defaultEncoding: 'utf8',
            fd: null,
            mode: 0o666,
            autoClose: true
          })
          let write = ws.write(e.data)
          let end = ws.end()
        } else {
          console.log('图片过大')
        }
      })
      console.log('写入所有消耗时间', (new Date() - time) / 1000 + '秒')
    } catch (e) { console.log('子页面读取失败') }
  }
  if (htmlNo == htmlLimt) {
    return
  } else {
    htmlNo++
    searchHtml(htmlNo)
  }
}
function searchHtml(htmlNo) {

  console.log(`${baseUrl}/tupianqu/${type}/${htmlNo == 1 ? '' : `index_${htmlNo}.html`}`)
  axios.get(`${baseUrl}/tupianqu/${type}/${htmlNo == 1 ? '' : `index_${htmlNo}.html`}`).then(e => {
    let doc = cheerio.load(e.data)
    let htmlArr = []
    doc(".news_list a").each((iHtml, html) => {
      if (iHtml < 7) return
      htmlArr.push(`${baseUrl}${doc(html).attr('href')}`)
    })
    //搜索图片
    console.log(htmlArr)
    searchImg(htmlArr)
  }).catch(e => {
    console.log('主页面请求失败')
    searchHtml(htmlNo)
  })

}
searchHtml(htmlNo)




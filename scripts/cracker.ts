import axios from 'axios';
import { imgDetectHelperHost } from '../utils/settings'

async function getImage(page:any){
  let imgSelector = 'div.geetest_widget > div > a > div.geetest_canvas_img.geetest_absolute';
  let img = await page.waitForSelector(imgSelector);
  await page.waitFor(1e3)
  let screenshotBuffer = await img.screenshot()
  let b = new Buffer(screenshotBuffer);
  let s = b.toString('base64');
  return s
}

async function deleteImgStyle(page:any){
  let js = 'document.querySelector("div.geetest_canvas_img.geetest_absolute > canvas").style=""';
  await page.evaluate(js);
}

async function getSlider(page:any){
  let slider = await page.$('div.geetest_slider_button');
  return slider
}

function getTracks(distance:number){
  let overMoveDistance = 12;
  let tracks = [];
  let current  = 0;
  let mid = distance * 0.6;
  let t = 0.2;
  let v = 0;
  distance += overMoveDistance;
  let a;
  while(current <= distance) { 
    if (current < mid){
      a = 1.3;
    } else {
      a = -1;
    }
    let v0 = v;
    v = v0 + a * t * t;
    let move =  v0 * t + 1 / 2 * a * t * t;
    current += move;
    tracks.push(move);
 };

 return tracks; 
}



async function detectGap(img1:string,img2:string){
  let url = `${imgDetectHelperHost}/slide/detect-gap`;
  const data = { img1, img2 };

  let res = await axios.post(url, data);
  try{
    return res.data.distance || 80;
  } catch {
    return 80
  }
}


async function moveImgToGap(page:any,slider:any,tracks:any){
  let location = await slider.boundingBox()
  let sliderX = location.x + location.width / 2;
  let sliderY = location.y + location.height / 2;
  await page.mouse.move(sliderX, sliderY);
  await page.mouse.down();
  for (let value of tracks) {
    await page.mouse.move(sliderX + value, sliderY);
    sliderX = sliderX + value;
  }

  let back_tracks = [-1, -1, -2, -2, -2, -1, -1, -1]; // 距离之和为getTracks中的
  for (let value of back_tracks) {
    await page.mouse.move(sliderX + value, sliderY);
    sliderX = sliderX + value;
  }
  await page.mouse.move(sliderX, sliderY + 1)
  await page.mouse.move(sliderX-1, sliderY - 2)
  await page.mouse.move(sliderX, sliderY - 2)
  await page.mouse.move(sliderX+1, sliderY - 2)
  await page.mouse.up()
}

async function initCrack(page:any){
  let img1 = await getImage(page);
  await deleteImgStyle(page);
  await page.waitFor(0.5e3);
  let img2 = await getImage(page);
  let distance = await detectGap(img1,img2);
  let tracks = getTracks(distance);
  let slider = await getSlider(page);
  await moveImgToGap(page,slider,tracks);
  await page.waitFor(1e3);
  return 'move';
}

async function smsSent(page:any): Promise<string>{
  await page.waitForResponse((res:any) => {return /passport\.zhaopin\.com\/jsonp\/sendSms/.test(res.url())}, {timeout: 60e3});
  return 'sms';
}

async function imgShows(page:any){
  let res = await page.waitForResponse((res:any)=>{return /api\.geetest\.com\/ajax\.php/.test(res.url())}, {timeout: 60e3});
  let text = await res.text();
  if(/\"result\"\:\s*\"slide\"/.test(text)){
    return 'img';
  }else if (/\"result\"\:\s*\"success\"/.test(text) && /validate/.test(text)){
    return 'sms';
  }else if (/error_code/.test(text)){
    return 'netErr'
  } else {
    return 'unknown'
  }
}

async function imgCrossed(page:any){
  let res = await page.waitForResponse((res:any)=>{return /api\.geetest\.com\/ajax\.php/.test(res.url())}, {timeout: 60e3});
  let text = await res.text();
  console.log(text);
  if (/\"message\"\:\s*\"forbidden\"/.test(text)){
    return 'forbidden';
  }else if(/\"message\"\:\s*\"fail\"/.test(text)){
    return 'failed';
  }else if (/\"message\"\:\s*\"success\"/.test(text)){
    return 'success'
  }else if (/error_code/.test(text)){
    return 'netErr'
  } else {
    return 'unknown'
  }
}
export async function crackIfNeeded(page:any){
  let res = await Promise.race([
    smsSent(page),
    imgShows(page),
  ]);
  console.log(res,typeof res);
  if (res == 'sms'){
    console.log('no img shows');
    return 'sms';
  } 
  for (let i=0; i<1; i++){
    console.log(i,'start')
    try {
      let crackStatus = await Promise.race([
        imgCrossed(page),
        initCrack(page),
      ]);
      console.log(crackStatus);

      if (['forbidden', 'failed', 'unknown', 'move'].includes(crackStatus)){
        continue;
      } else if (crackStatus == 'netErr'){
        return 'netErr'
      } else{
        return 'sms';
      }
    } catch {
      continue;
    }
  };
}
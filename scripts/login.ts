import * as fs from 'fs';
import axios from 'axios';
import { executablePath, browserWSEndpoint, userAgent, smsHelperHost } from '../utils/settings';
import { crackIfNeeded } from './cracker'
const puppeteer = require('puppeteer');
// const iPhone = puppeteer.devices['iPhone 6'];

async function getBrowser(proxy:string = ''){
  let args = ['--window-size=1200,800',
  "--disable-popup-blocking",
  '--safebrowsing-disable-download-protection',
  '--no-sandbox',
  '--disable-gpu'];
  if (proxy){
    args.push(proxy)
  };
  // 如果是executablePath,则使用launch；否则是connect；
  // return await puppeteer.launch({
  //   headless: false,
  //   executablePath,
  //   args
  // }); 
  return await puppeteer.connect({
    headless: true,
    browserWSEndpoint,
    args
  });  
}

async function getPage(browser:any){
  const page = await browser.newPage();
  // await page.emulate(iPhone);
  await page.setUserAgent(userAgent);
  await page.setViewport( { width:1200, height:800 } );
  const preloadScript = fs.readFileSync('./utils/preload.ts').toString();
  await page.evaluateOnNewDocument(preloadScript);
  return page
}

async function getAllCookies(page:any){
  let resp = await page._client.send('Network.getAllCookies', {})
  let cookies = resp.cookies || {}
  for (let cookie of cookies){
    if (cookie.session){
      cookie.expires = -1
    }
  };
  return cookies;
}


async function inputMobile(page:any, mobile:string){
  await page.type('div.zp-passport-widget-b-login-sms__number-box > input', mobile)
}

async function generateSMS(page:any){
  await page.click('button.zp-passport-widget-b-login-sms__send-code')
}
async function waitSMS(mobile:string,channel:string='2'){
  let url = `${smsHelperHost}/sms-get/${channel}/${mobile}`;
  console.log(url);
  let res = await axios.get(url);
  console.log(res.data);
  try{
    return res.data.sms || '';
  } catch {
    return '';
  }
}

async function inputSMS(page:any, sms:string){
  let input_box = await page.waitForSelector('div.zp-passport-widget-b-login-sms__code-box > input');
  await input_box.type(sms);
  console.log('sms input finished')
}

async function smsStatusCache(mobile:string,status:string,channel:string='2'){
  let url = `${smsHelperHost}/sms-status-cache/`;
  let data = {mobile, status, channel}
  let res = await axios.post(url, data);
  console.log(res.data);
  try{
    return res.data.sms || '';
  } catch {
    return '';
  }
}

async function finishLogin(page:any){
  await page.click('#login__message > div > div > button');
  let r = await page.waitForResponse((res:any)=>{return /passport\.zhaopin\.com\/jsonp\/smsLoginAndRegister/.test(res.url())});
  let text = await r.text();
  if ( /\"code\"\:\s*501/.test(text) ){
    console.log(text);
    return 'sms-err'
  }
  await page.waitForResponse((res:any)=>{return /https:\/\/rd5\.zhaopin\.com/.test(res.url())});
  await page.waitFor(0.5e3);
  await page.reload();
  await Promise.race([
    page.goto('https://rd5.zhaopin.com/resume/apply'),
    page.waitForResponse((res:any)=>{return /https:\/\/rd5\.zhaopin\.com\/api\/rd\/resume\/list\/counts/.test(res.url())})
  ]);
  console.log(page.url());
  let cookies = await getAllCookies(page);
  console.log(typeof cookies,cookies.length)
  return cookies;
}

export default async function mobileLogin ( mobile:string, proxy:string='' ) {
  const browser = await getBrowser(proxy);
  let page = await getPage(browser);
  await page.goto('https://passport.zhaopin.com/org/login');
  await page.waitForSelector('#login__message > div > div > button');
  await page.waitFor(0.5e3)
  await page.click('div.k-tabs__header > div > div > a:nth-child(2)');
  let getSmsTabClassJS = 'document.querySelector("div.k-tabs__header > div > div > a:nth-child(2)").className';
  let tabClassName = await page.evaluate(getSmsTabClassJS);
  if (!tabClassName.includes('is-active')){
    await browser.close();
    return 'failed';
  }
  await inputMobile(page,mobile);
  await generateSMS(page);
  let res = await crackIfNeeded(page);
  if (res !== 'sms'){
    await browser.close();
    return 'failed';
  } else {
    let channel = '2';
    let sms = await waitSMS(mobile,channel);
    if (sms.length<6){
      await browser.close();
      return 'failed'
    };
    await inputSMS(page,sms);
    let r = await finishLogin(page);
    if (r == 'sms-err'){
      await smsStatusCache(mobile,'err',channel);
    }else{
      await smsStatusCache(mobile,'good',channel);
    }

    await browser.close();
    return r;
  }
}

// console.log(waitSMS('13021983040'))
// mobileLogin('13021983040');

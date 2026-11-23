import {chromium} from '/tmp/nsoc-atelier3425/frontend/node_modules/playwright/index.mjs';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const out=process.argv[2];
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const report=[];
try {
 for(const width of [390,1280]){
  const page=await browser.newPage({viewport:{width,height:900},hasTouch:width===390});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4295/assets/labs/lensing.html');
  const toggle=page.getByRole('button',{name:'Toggle lensing starfield',exact:true});
  await toggle.click();
  await page.waitForFunction(()=>ArcadeLensing.renderTimes.length>=30);
  const mass=page.getByRole('button',{name:/Move black hole/});
  const before=await mass.boundingBox();
  await mass.focus();await page.keyboard.press('ArrowRight');
  const after=await mass.boundingBox();
  assert.ok(Math.abs(after.x-before.x-20)<1);
  const box=await mass.boundingBox();
  await page.mouse.move(box.x+29,box.y+29);await page.mouse.down();
  await page.mouse.move(width*0.7,600,{steps:5});await page.mouse.up();
  assert.ok(Math.abs((await mass.boundingBox()).y+29-600)<2);
  if(width===390){
   const session=await page.context().newCDPSession(page);
   const target=await mass.boundingBox();
   await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:target.x+29,y:target.y+29}]});
   await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:120,y:500}]});
   await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
   assert.ok(Math.abs((await mass.boundingBox()).y+29-500)<2);
  }
  const pixels=await page.locator('canvas').evaluate(c=>{
   const data=c.getContext('2d').getImageData(0,0,c.width,c.height).data;
   return {nonBlack:data.filter((v,i)=>i%4!==3&&v>30).length,size:[c.width,c.height]};
  });
  assert.ok(pixels.nonBlack>100);
  const intervals=await page.evaluate(()=>new Promise(resolve=>{
   const samples=[];let previous;
   function tick(now){if(previous)samples.push(now-previous);previous=now;if(samples.length>=60)resolve(samples);else requestAnimationFrame(tick);}
   requestAnimationFrame(tick);
  }));
  const medianInterval=intervals.slice().sort((a,b)=>a-b)[30];
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.waitForTimeout(100);
  const count=await page.evaluate(()=>ArcadeLensing.renderTimes.length);
  await page.waitForTimeout(150);
  assert.equal(await page.evaluate(()=>ArcadeLensing.renderTimes.length),count);
  await mass.focus();await page.keyboard.press('Home');await page.waitForTimeout(60);
  assert.equal(await mass.evaluate(e=>Math.round(e.getBoundingClientRect().x+29)),Math.round(width/2));
  const times=await page.evaluate(()=>ArcadeLensing.renderTimes);
  const sorted=times.slice().sort((a,b)=>a-b);
  const p95=sorted[Math.floor(sorted.length*.95)];
  await page.addScriptTag({path:'/tmp/nsoc-atelier3425/frontend/node_modules/axe-core/axe.min.js'});
  const violations=await page.evaluate(async()=> (await axe.run()).violations.map(v=>v.id));
  assert.deepEqual(violations,[]);
  assert.deepEqual(errors,[]);
  await page.screenshot({path:out+'/lensing-'+width+'.png',fullPage:true});
  await toggle.click();
  assert.equal(await mass.isVisible(),false);
  assert.equal(await page.locator('canvas').evaluate(c=>c.width),1);
  report.push({width,renderP95ms:p95,medianFrameIntervalMs:medianInterval,pixels,keyboard:true,pointer:true,reducedMotionPaused:true,disableReleasedBuffer:true,violations});
  await page.goto('http://127.0.0.1:4295/');
  const catalogToggle=page.getByRole('button',{name:'Toggle lensing starfield',exact:true});
  await catalogToggle.click();
  await page.getByRole('button',{name:/Move black hole/}).waitFor();
  await catalogToggle.click();
  await page.close();
 }
}finally{await browser.close();}
await fs.writeFile(out+'/lensing-browser.json',JSON.stringify(report,null,2)+'\n');
console.log(report);

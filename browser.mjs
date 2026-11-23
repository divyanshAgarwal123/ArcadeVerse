import {chromium} from '/tmp/nsoc-atelier3425/frontend/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const out=process.argv[2];
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const results=[];
try {
 for(const width of [390,1280]){
  const page=await browser.newPage({viewport:{width,height:900}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4294/assets/labs/morse.html');
  await page.locator('#text').fill('SOS TEST');
  await page.getByRole('button',{name:'Text to Morse',exact:true}).click();
  assert.equal(await page.locator('#code').inputValue(),'... --- ... / - . ... -');
  await page.locator('#speed').fill('35');await page.locator('#speed').dispatchEvent('input');
  await page.getByRole('button',{name:'Play message'}).click();
  await page.getByText('Playing message.',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Stop',exact:true}).click();
  await page.getByText('Stopped.',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Clear received'}).click();
  await page.locator('#speed').fill('15');await page.locator('#speed').dispatchEvent('input');
  await page.locator('#key').focus();await page.keyboard.down('Space');
  await page.waitForTimeout(70);await page.keyboard.up('Space');await page.waitForTimeout(700);
  assert.equal((await page.locator('#received-text').textContent()).trim(),'E');
  await page.locator('#code').fill('......');
  await page.getByRole('button',{name:'Morse to text',exact:true}).click();
  await page.getByText('Unknown Morse symbol: ......',{exact:true}).waitFor();
  await page.locator('#code').fill('.');
  await page.getByRole('button',{name:'Play message'}).click();
  await page.getByText('Playback complete.',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Clear received'}).click();
  const key=page.locator('#key');
  await key.scrollIntoViewIfNeeded();
  const point=await key.boundingBox();
  await page.mouse.move(point.x+30,point.y+30);await page.mouse.down();
  await page.waitForTimeout(65);await page.mouse.up();await page.waitForTimeout(350);
  assert.equal((await page.locator('#received-text').textContent()).trim(),'E');
  await page.locator('#code').fill('... --- ...');
  const pcm=await page.evaluate(async()=>{
   const ctx=new OfflineAudioContext(1,48000,48000);
   const osc=ctx.createOscillator(),gain=ctx.createGain();
   osc.frequency.value=650;osc.connect(gain);gain.connect(ctx.destination);
   MorseKeyer.envelope(gain.gain,0.1,0.1,0.2);
   osc.start(0.1);osc.stop(0.202);
   const data=(await ctx.startRendering()).getChannelData(0);
   let peak=0,jump=0,silent=0,crossings=0;
   for(let i=1;i<data.length;i++){
    peak=Math.max(peak,Math.abs(data[i]));jump=Math.max(jump,Math.abs(data[i]-data[i-1]));
    if(i>12000)silent=Math.max(silent,Math.abs(data[i]));
    if(i>6000&&i<8400&&data[i-1]<0&&data[i]>=0)crossings++;
   }
   return {peak,jump,silent,crossings};
  });
  assert.ok(pcm.peak>0.19 && pcm.peak<0.201 && pcm.jump<0.02 && pcm.silent===0);
  assert.ok(pcm.crossings>=31 && pcm.crossings<=34);
  await page.addScriptTag({path:'/tmp/nsoc-atelier3425/frontend/node_modules/axe-core/axe.min.js'});
  const violations=await page.evaluate(async()=> (await axe.run()).violations.map(x=>x.id));
  assert.deepEqual(violations,[]);assert.deepEqual(errors,[]);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.screenshot({path:out+'/morse-'+width+'.png',fullPage:true});
  results.push({width,keyboardDecode:'E',translation:true,offlineAudio:pcm,violations,errors});
  await page.close();
 }
}finally{await browser.close();}
await fs.writeFile(out+'/morse-browser.json',JSON.stringify(results,null,2)+'\n');
console.log(results);

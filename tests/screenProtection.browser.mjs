import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const { browserHash } = JSON.parse(
  readFileSync(new URL('../node_modules/.vite/deps/_metadata.json', import.meta.url), 'utf8')
);
const { chromium } = await import(process.env.BROWSER_MODULE || 'playwright');
const browser = await chromium.launch({
  executablePath: process.env.BROWSER_EXECUTABLE || undefined,
  headless: true,
  args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'],
});
const report = message => process.stdout.write(message + '\n');
const base = process.env.SCREEN_PROTECTION_TEST_URL || 'http://127.0.0.1:3000';
const html = `<!doctype html><html><head><meta charset="utf-8"><script type="module">
import RefreshRuntime from '/@react-refresh';
RefreshRuntime.injectIntoGlobalHook(window);
window.$RefreshReg$ = () => {}; window.$RefreshSig$ = () => type => type;
window.__vite_plugin_react_preamble_installed__ = true;
</script></head><body style="margin:0"><div id="root"></div><script type="module">
import React from '/node_modules/.vite/deps/react.js';
import ReactDOM from '/node_modules/.vite/deps/react-dom_client.js';
import {BrowserRouter, useNavigate} from '/node_modules/.vite/deps/react-router-dom.js';
import {SettingsProvider} from '/src/contexts/SettingsContext.jsx';
// Share the player's canonical context URL even after Vite hot updates.
const playerSource=await (await fetch('/src/components/RadioPlayer.jsx')).text();
const appSpecifier=playerSource.match(/import\\s*\\{\\s*DeviceContext\\s*\\}\\s*from\\s*["']([^"']+)["']/)[1];
const {DeviceContext}=await import(appSpecifier);
import ScreenProtection from '/src/components/ScreenProtection.jsx';
import SettingsModal from '/src/components/SettingsModal.jsx';
import RadioPlayer from '/src/components/RadioPlayer.jsx';
import WeatherBackground from '/src/components/WeatherBackground.jsx';
import '/src/styles/globals.css';
const h=React.createElement;
const station={id:'fm',name:'Radio Constanța',coverArt:'/rcfm.png',qualities:[{id:'mp3_128',label:'128 kbps'}]};
// A real looping silent WAV proves the audio element survives overlay transitions.
const bytes=new Uint8Array(44+16000); const view=new DataView(bytes.buffer);
const str=(offset,text)=>[...text].forEach((c,i)=>bytes[offset+i]=c.charCodeAt(0));
str(0,'RIFF');view.setUint32(4,bytes.length-8,true);str(8,'WAVE');str(12,'fmt ');
view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,1,true);
view.setUint32(24,8000,true);view.setUint32(28,16000,true);view.setUint16(32,2,true);view.setUint16(34,16,true);
str(36,'data');view.setUint32(40,16000,true);
const audioSource=URL.createObjectURL(new Blob([bytes],{type:'audio/wav'}));
window.__clicks=0;window.__pauses=0;
function UI(){
 const [settings,setSettings]=React.useState(false);
 const [video,setVideo]=React.useState(false);
 const navigate=useNavigate();window.__navigate=navigate;window.__setVideo=setVideo;
 const current=React.useMemo(()=>video?{...station,coverMedia:{type:'video',videoUrl:'/oled-test-video.mp4'}}:station,[video]);
 const noop=()=>{};
 return h(React.Fragment,null,
  h('audio',{id:'test-audio',src:audioSource,loop:true,onPause:()=>window.__pauses++}),
  h('button',{id:'control',style:{position:'relative',zIndex:50},onClick:()=>window.__clicks++},'Player control'),
  h('button',{id:'open-settings',style:{position:'relative',zIndex:50},onClick:()=>setSettings(true)},'Settings'),
  h('div',{id:'news',style:{height:100,overflow:'auto'}},h('div',{style:{height:1200}},'News reading position')),
  h(WeatherBackground),
  h('div',{style:{height:'80vh',width:'100%'}},h(RadioPlayer,{radioState:{currentStation:current,isPlaying:true,isLoading:false,metadata:'',stations:[station],
    availableQualities:station.qualities,selectedQuality:'mp3_128',togglePlay:noop,switchStation:noop,switchQuality:noop,
    audioAnalyserRef:{current:null},showAudioAnalyser:true,availablePaneAspectRatio:1.78}})),
  settings&&h(SettingsModal,{isOpen:true,onClose:()=>setSettings(false),stations:[station],selectedQualities:{fm:'mp3_128'}}));
}
const device={isTV:true,viewportWidth:1920,viewportHeight:1080,policy:{isDesktopShell:true}};
ReactDOM.createRoot(document.getElementById('root')).render(h(SettingsProvider,null,
 h(DeviceContext.Provider,{value:device},h(BrowserRouter,null,h(ScreenProtection,{stationName:station.name},h(UI))))));
</script></body></html>`.replaceAll(
  '/node_modules/.vite/deps/react-router-dom.js',
  `/node_modules/.vite/deps/react-router-dom.js?v=${browserHash}`
);
async function open({
  ua = 'Mozilla/5.0 (Web0S; Linux/SmartTV) Chrome/108',
  mode,
  viewport = { width: 1920, height: 1080 },
} = {}) {
  const context = await browser.newContext({ userAgent: ua, viewport });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/oled-test', route =>
    route.fulfill({ contentType: 'text/html', body: html })
  );
  await page.route('**/api/**', route =>
    route.fulfill({ contentType: 'application/json', body: '{}' })
  );
  await page.addInitScript(
    ({ mode }) => {
      localStorage.setItem('backgroundAnimation', 'weather');
      localStorage.setItem('weatherMode', 'manual');
      localStorage.setItem(
        'manualWeatherState',
        JSON.stringify({ weatherType: 'rain', timeOfDay: 'day' })
      );
      if (mode) localStorage.setItem('screenProtectionMode', mode);
      // Native video events drive the real RadioPlayer reporting, without an external stream.
      Object.defineProperty(HTMLVideoElement.prototype, 'src', {
        configurable: true,
        get: () => '',
        set: () => {},
      });
      HTMLVideoElement.prototype.load = () => {};
    },
    { mode }
  );
  await page.clock.install({ time: new Date('2026-10-30T12:00:00Z') });
  await page.goto(base + '/oled-test');
  await page
    .locator('#control')
    .waitFor({ timeout: 10000 })
    .catch(error => {
      throw new Error(errors.join('\n') || error.message);
    });
  await page.clock.pauseAt(new Date('2026-10-30T12:00:01Z'));
  return { context, page, errors };
}
const stage = (page, value) => page.locator(`[data-screen-protection-stage="${value}"]`).waitFor();
const awake = async page =>
  assert.equal(await page.locator('[data-screen-protection-stage]').count(), 0);
try {
  {
    const { context, page, errors } = await open();
    assert.equal(await page.evaluate(() => localStorage.getItem('screenProtectionMode')), 'auto');
    assert.ok((await page.locator('canvas').count()) > 0);
    await page.locator('#control').focus();
    await page.evaluate(async () => {
      window.__originalAudio = document.querySelector('audio');
      await window.__originalAudio.play();
    });
    await page.clock.fastForward(120000);
    await stage(page, 'text');
    assert.equal(await page.locator('[data-screen-protection-ui]').getAttribute('inert'), '');
    assert.equal(
      await page
        .locator('[data-screen-protection-stage]')
        .evaluate(el => getComputedStyle(el).backgroundColor),
      'rgb(0, 0, 0)'
    );
    assert.equal(await page.locator('canvas').count(), 0);
    const position = await page.locator('.screen-protection-station').boundingBox();
    await page.clock.fastForward(25000);
    assert.notDeepEqual(await page.locator('.screen-protection-station').boundingBox(), position);
    await page.clock.fastForward(155000);
    await stage(page, 'black');
    assert.equal(await page.locator('.screen-protection-station').count(), 0);
    assert.equal(
      await page.evaluate(
        () =>
          document.querySelector('audio') === window.__originalAudio &&
          !window.__originalAudio.paused
      ),
      true
    );
    assert.equal(await page.evaluate(() => window.__pauses), 0);
    await page.keyboard.down('Enter');
    await page.keyboard.down('Enter');
    await page.keyboard.up('Enter');
    await awake(page);
    assert.equal(await page.evaluate(() => window.__clicks), 0);
    assert.equal(await page.evaluate(() => document.activeElement.id), 'control');
    await page.keyboard.press('Enter');
    assert.equal(await page.evaluate(() => window.__clicks), 1);
    assert.deepEqual(errors, []);
    report(
      'PASS TV auto timings, moving text, black screen, effect suspension, audio continuity and safe wake'
    );
    await context.close();
  }
  {
    const { context, page, errors } = await open();
    await page.evaluate(() => {
      window.__navigate('/news');
      document.querySelector('#news').scrollTop = 300;
    });
    await page.locator('#open-settings').click();
    await page.getByRole('button', { name: /Automat.*Vreme reală/ }).click();
    await page.getByRole('button', { name: 'Ecran negru', exact: true }).click();
    await page.getByRole('button', { name: '1 min', exact: true }).click();
    await page.getByPlaceholder('Oraș').fill('Brașov');
    await page.clock.fastForward(60000);
    await stage(page, 'black');
    await page.keyboard.press('Enter');
    await awake(page);
    assert.equal(await page.getByPlaceholder('Oraș').inputValue(), 'Brașov');
    assert.equal(
      await page.evaluate(() => document.activeElement.getAttribute('placeholder')),
      'Oraș'
    );
    assert.equal(await page.evaluate(() => document.querySelector('#news').scrollTop), 300);
    assert.equal(await page.evaluate(() => localStorage.getItem('screenProtectionMode')), 'black');
    assert.equal(
      await page.evaluate(() => localStorage.getItem('screenProtectionTimeoutMinutes')),
      '1'
    );
    await page.locator('[data-dpad-scope="settings-modal"] [data-dpad-default="true"]').click();
    await page.evaluate(() => window.__navigate('/admin'));
    await page.clock.fastForward(1200000);
    await awake(page);
    await page.evaluate(() => window.__navigate('/news'));
    await page.clock.fastForward(60000);
    await stage(page, 'black');
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, value: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await awake(page);
    await page.clock.fastForward(1200000);
    await awake(page);
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, value: false });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await page.clock.fastForward(59000);
    await awake(page);
    await page.clock.fastForward(1000);
    await stage(page, 'black');
    assert.deepEqual(errors, []);
    report(
      'PASS real Settings controls, news/form preservation, saved preferences, admin and hidden-tab exclusions'
    );
    await context.close();
  }
  {
    const { context, page, errors } = await open({
      mode: 'text',
      viewport: { width: 320, height: 180 },
    });
    await page.clock.fastForward(120000);
    await stage(page, 'text');
    const box = await page.locator('.screen-protection-station').boundingBox();
    assert.ok(box.x >= 0 && box.y >= 0 && box.x + box.width <= 320 && box.y + box.height <= 180);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.clock.fastForward(600000);
    await stage(page, 'text');
    assert.equal(
      await page
        .locator('.screen-protection-station')
        .evaluate(el => getComputedStyle(el).animationName),
      'none'
    );
    await page.mouse.click(120, 80);
    await awake(page);
    assert.equal(await page.evaluate(() => window.__clicks), 0);
    assert.deepEqual(errors, []);
    report('PASS text-only mode, small viewport, reduced motion and pointer wake');
    await context.close();
  }
  {
    const { context, page, errors } = await open();
    await page.evaluate(() => window.__setVideo(true));
    await page.clock.runFor(1000);
    await page
      .locator('video')
      .waitFor({ state: 'attached', timeout: 5000 })
      .catch(error => {
        throw new Error(errors.join('\n') || error.message);
      });
    await page.evaluate(() => document.querySelector('video').dispatchEvent(new Event('playing')));
    await page.clock.fastForward(600000);
    await awake(page);
    await page.evaluate(() => document.querySelector('video').dispatchEvent(new Event('waiting')));
    await page.clock.fastForward(600000);
    await awake(page);
    await page.evaluate(() => document.querySelector('video').dispatchEvent(new Event('pause')));
    await page.clock.fastForward(120000);
    await stage(page, 'text');
    await page.evaluate(() => document.querySelector('video').dispatchEvent(new Event('playing')));
    await awake(page);
    await page.evaluate(() => document.querySelector('video').dispatchEvent(new Event('error')));
    await page.clock.runFor(1000);
    await page.clock.fastForward(120000);
    await stage(page, 'text');
    assert.deepEqual(errors, []);
    report(
      'PASS real player video reporting, buffering exemption, pause and failed-video fallback'
    );
    await context.close();
  }
  {
    const { context, page, errors } = await open({
      ua: 'Mozilla/5.0 (X11; Linux x86_64) Chrome/132',
    });
    assert.equal(await page.evaluate(() => localStorage.getItem('screenProtectionMode')), 'off');
    await page.clock.fastForward(1200000);
    await awake(page);
    assert.deepEqual(errors, []);
    report('PASS desktop defaults to off');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(base + '/');
    await page.getByRole('button', { name: 'Setări', exact: true }).click();
    await page.clock.runFor(1000);
    await page.getByRole('heading', { name: 'Protecție ecran OLED' }).scrollIntoViewIfNeeded();
    assert.equal(
      await page
        .getByRole('button', { name: 'Dezactivat', exact: true })
        .getAttribute('aria-pressed'),
      'true'
    );
    assert.deepEqual(errors, []);
    report('PASS actual mobile layout exposes Settings for OLED opt-in');
    await context.close();
  }
} finally {
  await browser.close();
}

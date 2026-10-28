const {defineConfig,devices}=require('@playwright/test');
module.exports=defineConfig({
 testDir:'./tests/browser',testMatch:'summitbound.spec.cjs',timeout:30000,
 expect:{timeout:6000},retries:process.env.CI?1:0,workers:process.env.CI?1:undefined,
 reporter:process.env.CI?[['github'],['html',{open:'never'}]]:'list',
 use:{baseURL:'http://127.0.0.1:4173',trace:'retain-on-failure',screenshot:'only-on-failure',video:'retain-on-failure'},
 projects:[
  {name:'desktop-chromium',use:{...devices['Desktop Chrome']}},
  {name:'mobile-landscape',use:{...devices['Pixel 7'],viewport:{width:915,height:412},isMobile:true}}
 ],
 webServer:{command:'npm run dev -- --host 127.0.0.1 --port 4173',url:'http://127.0.0.1:4173/game/summit-leap-v081.html',reuseExistingServer:!process.env.CI,timeout:45000}
});

import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Listen to console logs
  page.on('console', msg => {
    console.log(`💬 [${msg.type().toUpperCase()}]`, msg.text());
  });
  
  page.on('pageerror', err => {
    console.log('❌ [ERROR]', err.message);
  });

  // Navigate to designer page
  await page.goto('https://sohoavn.github.io/workflow-static-app-ai/#designer');
  await page.waitForTimeout(3000);
  
  // Check if form exists
  const formExists = await page.$('#chat-form');
  console.log('📝 Form exists:', !!formExists);
  
  // Check if button exists
  const buttonExists = await page.$('#btn-generate');
  console.log('🔘 Button exists:', !!buttonExists);
  
  // Check if textarea exists
  const textareaExists = await page.$('#workflow-description');
  console.log('📄 Textarea exists:', !!textareaExists);
  
  // Try to fill and submit
  console.log('\n🧪 Testing form submission...');
  await page.fill('#workflow-description', 'Create a student enrollment workflow');
  console.log('✅ Filled textarea');
  
  // Check button state before click
  const buttonDisabled = await page.$eval('#btn-generate', btn => btn.disabled);
  console.log('🔘 Button disabled:', buttonDisabled);
  
  // Click the button
  await page.click('#btn-generate');
  console.log('✅ Clicked Generate button');
  
  // Wait and check for loading state
  await page.waitForTimeout(2000);
  
  const hasLoadingMsg = await page.$('.bg-blue-50');
  console.log('⏳ Loading message appeared:', !!hasLoadingMsg);
  
  await browser.close();
})();

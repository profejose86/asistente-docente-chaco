module.exports.clickGear=async page=>{
 const gear=page.locator('#adcDesignGear');
 if(await gear.getAttribute('data-adc-locked')!==null){for(let i=0;i<5;i++)await gear.click();}
 await gear.click();
};
module.exports.openTool=async(page,locator)=>{
 if(await locator.count()===0)for(const tab of await page.locator('#adcDesignPanel [role=tab]').all()){await tab.click();if(await locator.count())break;}
 const panel=await locator.evaluate(node=>node.closest('[role=tabpanel]')?.id);
 if(panel)await page.locator('[role=tab][aria-controls="'+panel+'"]').click();
};
module.exports.clickTool=async(page,selector)=>{
 const locator=typeof selector==='string'?page.locator(selector):selector;
 await module.exports.openTool(page,locator);await locator.click();
};

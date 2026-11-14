module.exports.clickGear=async page=>{
 const gear=page.locator('#adcDesignGear');
 if(await gear.getAttribute('data-adc-locked')!==null){for(let i=0;i<5;i++)await gear.click();}
 await gear.click();
};

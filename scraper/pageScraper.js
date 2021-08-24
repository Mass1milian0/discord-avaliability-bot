module.exports = function(callback1,callback2){
    keyword = require("./../index") //echo dot
    console.log(keyword);
    var productDetails = {
        names : [],
        prices: [],
        url: []
    }
    const scraperObject = {
        url: 'https://www.unieuro.it',
        async scraper(browser){
            let page = await browser.newPage();
            console.log(`Navigating to ${this.url}...`);
            await page.goto(this.url);
            await page.waitForSelector('input[name=algolia-search]');
            await page.type("input[name=algolia-search]",keyword)
            await page.click(".icon-search")
            await page.waitForTimeout(4000);
            console.log("done waiting");
            const products = (await page.$$('.product-tile'))
            for (product of products){
                productDetails.names.push(await product.evaluate(node => node.querySelector(".product-tile__title > a").innerText))
                priceint = await product.evaluate(node => node.querySelector(".product-tile__price").innerText);
                productDetails.prices.push(priceint)
                productDetails.url.push(await product.evaluate(node => node.querySelector(".product-tile__img-container > a").href))
            }
            console.log(productDetails);
            callback2(productDetails)
        }
    }
    callback1(scraperObject)
}
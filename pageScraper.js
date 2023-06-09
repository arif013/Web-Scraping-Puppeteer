export const scraperObject = {
    url: 'https://firstcopyshoe.com/product-category/first-copy-replica-7a-men-shoes/',
    async scraper(browser){
        let page = await browser.newPage();
        console.log(`Navigating to ${this.url}...`);
        await page.goto(this.url);
		let scrapedData = [];
		
        // Wait for the required DOM to be rendered
		async function scrapeCurrentPage(){
        await page.waitForSelector('.products');
        // Get the link to all the required books
        let urls = await page.$$eval('main ul > li', links=>{
            links = links.map(el => el.querySelector('h3>a')?.href||null)
            return links.filter(link=>link !==null);
        });
        // console.log(urls)

        // Loop through each of those links, open a new page instance and get the relevant data from them
		let pagePromise = (link) => new Promise(async(resolve, reject) => {
			let dataObj = {};
			let newPage = await browser.newPage();
			await newPage.goto(link);
			dataObj['Title'] = await newPage.$eval('.summary > h1', text => text.textContent);
			dataObj['Price'] = await newPage.$eval('.price ins > span > bdi', text => text.textContent);
			// dataObj['noAvailable'] = await newPage.$eval('.instock.availability', text => {
			// 	// Strip new line and tab spaces
			// 	text = text.textContent.replace(/(\r\n\t|\n|\r|\t)/gm, "");
			// 	// Get the number of stock available
			// 	let regexp = /^.*\((.*)\).*$/i;
			// 	let stockAvailable = regexp.exec(text)[1].split(' ')[0];
			// 	return stockAvailable;
			// });
			dataObj['imageUrl'] = await newPage.$eval('.woocommerce-product-gallery__wrapper a > img', img => img.src);
			// dataObj['Description'] = await newPage.$eval('#product_description', div => div.nextSibling.nextSibling.textContent);
			// dataObj['upc'] = await newPage.$eval('.table.table-striped > tbody > tr > td', table => table.textContent);
			resolve(dataObj);
			await newPage.close();
		});

		for(let link of urls){
			let currentPageData = await pagePromise(link);
			scrapedData.push(currentPageData);
			// console.log(currentPageData);
		}
		// When all the data on this page is done, click the next button and start the scraping of the next page
			// You are going to check if this button exist first, so you know if there really is a next page.
			let nextButtonExist = false;
			try{
				const nextButton = await page.$eval('.next ', a => a.textContent);
				nextButtonExist = true;
			}
			catch(err){
				nextButtonExist = false;
			}
			if(nextButtonExist){
				await page.click('.next ');	
				return scrapeCurrentPage(); // Call this function recursively
			}
			await page.close();
			return scrapedData;
		}
		let data = await scrapeCurrentPage();
		console.log(data);
		return data;
    }
}

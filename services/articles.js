const Parser = require('rss-parser');
const moment = require('moment');

const parser = new Parser();
moment.locale('zh-tw');

const getRSS = (linkRss) => new Promise(async (resolve, reject) => {
	try{
		const feed = await parser.parseURL(linkRss);
		resolve(feed);
	}catch(e){
		reject(e);
	}
});

const getLatest = (linkRss) => new Promise(async (resolve, reject) => {
	try{
		const feed = await getRSS(linkRss);
		const article = feed.items[0];
		resolve({
			siteTitle: feed.title,
			...article,
		});
	}catch(e){
		reject(e);
	}
});

const getRecent = (linkRss, n = 7, unit = 'days') => new Promise(async (resolve, reject) => {
	try{
		const feed = await getRSS(linkRss);
		const articles = feed.items.filter(x => Math.abs(moment(new Date()).diff(x.isoDate, unit)) <= n);
		resolve({
			siteTitle: feed.title,
			articles,
		});
	}catch(e){
		reject(e);
	}
});

const getThisWeek = (linkRss) => new Promise(async (resolve, reject) => {
	try{
		const feed = await getRSS(linkRss);
		const Sunday = moment(new Date()).day('Sunday').startOf('day');
		const articles = feed.items.filter(x => Sunday.unix() < moment(x.isoDate).unix());
		resolve({
			siteTitle: feed.title,
			articles,
		});
	}catch(e){
		reject(e);
	}
});

module.exports = {
	getRSS,
	getLatest,
	getRecent,
	getThisWeek,
}
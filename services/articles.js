const Parser = require('rss-parser');
const moment = require('moment');

const parser = new Parser();
moment.locale('zh-tw');

const getRSS = linkRss => parser.parseURL(linkRss);

const getLatest = async (linkRss) => {
	const feed = await getRSS(linkRss);
	const article = feed.items[0];
	return {
		siteTitle: feed.title,
		...article,
	};
};

const getRecent = async (linkRss, n = 7, unit = 'days') => {
	const feed = await getRSS(linkRss);
	const articles = feed.items.filter(x => Math.abs(moment(new Date()).diff(x.isoDate, unit)) <= n);
	return {
		siteTitle: feed.title,
		articles,
	};
};

const getThisWeek = async (linkRss) => {
	const feed = await getRSS(linkRss);
	const Sunday = moment(new Date()).day('Sunday').startOf('day');
	const articles = feed.items.filter(x => Sunday.unix() < moment(x.isoDate).unix());
	return {
		siteTitle: feed.title,
		articles,
	};
};

module.exports = {
	getRSS,
	getLatest,
	getRecent,
	getThisWeek,
}

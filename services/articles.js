const Parser = require('rss-parser');
const moment = require('moment');

const parser = new Parser();
moment.locale('zh-tw');

const getRSS = linkRss => parser.parseURL(encodeURI(linkRss));

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

const newArticlesCheck = async (blogs) => {
	const theBlogs = await Promise.all(blogs.map(x => getRecent(x.link, 30, 'minutes')));
	let articles = [];
	Array.from(theBlogs).forEach(async (blog, i) => {
		if(blog.articles.length){
			articles.push({
				username: blogs[i].username,
				article: blog.articles[0]
			});
		}
	});
	articles = articles.sort((a, b) => moment(b.article.isoDate).unix() - moment(a.article.isoDate).unix());
	return articles;
}

const weeklyCheck = async (blogs) => {
	let y = [];
	let n = [];
	let articles = await Promise.all(blogs.map(x => getThisWeek(x.link)));
	articles = articles.sort((a, b) => moment(b.isoDate).unix() - moment(a.isoDate).unix());
	Array.from(articles).forEach(async (blog, i) => {
		if(blog.articles.length){
			y.push({
				username: blogs[i].username,
				count: blog.articles.length
			});
		}else{
			n.push(blogs[i].username);
		}
	});
	y = y.sort((a, b) => b.count - a.count); // count sort desc.
	n = n.sort((a, b) => a.username > b.username); // alphabetical sort asc.
	return {y, n};
}

module.exports = {
	getRSS,
	getLatest,
	getRecent,
	getThisWeek,
	newArticlesCheck,
	weeklyCheck,
}

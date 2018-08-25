const should = require('should');
const moment = require('moment');
const Parser = require('rss-parser');
const Articles = require('../services/articles');
const blogs = require('../blogs.json');

const parser = new Parser();
const TEST_URL = blogs[0].link;

describe('Blogs.json', () => {
	it('should be a valid JSON', () => {
		blogs.should.be.instanceOf(Object);
	});
	it('should have correct properties', () => {
		Array.from(blogs).forEach(blog => {
			blog.should.have.property('username');
			blog.should.have.property('link');
		});
	});

	const timeout = blogs.length * 5000;
	it('should be correct RSS', async () => {
		let theBlogs = await Promise.all(blogs.map(x => parser.parseURL(x.link)));
		Array.from(theBlogs).forEach(rss => {
			rss.should.have.property('title');
			rss.should.have.property('items');
		});
	}).timeout(timeout);
});

describe('Articles', () => {
	it('should parse RSS succesfully', async () => {
		const data = await Articles.getRSS(TEST_URL);
		data.should.be.instanceOf(Object);
	}).timeout(5000);
	it('should get latest article', async () => {
		const data = await Articles.getLatest(TEST_URL);
		data.title.should.be.instanceOf(String);
		data.title.length.should.be.above(0);
	}).timeout(5000);
	it('should get recent articles', async () => {
		const articles = await Articles.getRecent(TEST_URL);
		articles.articles.length.should.be.above(0);

		const data = articles.articles[0];
		data.title.should.be.instanceOf(String);
		data.title.length.should.be.above(0);
		moment(data.isoDate).diff(new Date, 'days').should.be.below(7);
	}).timeout(5000);
	it('should get articles from this week', async () => {
		const articles = await Articles.getThisWeek(TEST_URL);
		articles.articles.length.should.be.aboveOrEqual(0);

		if(articles.articles.length){
			const data = articles.articles[0];
			data.title.should.be.instanceOf(String);
			data.title.length.should.be.above(0);
			moment(data.isoDate).diff(new Date, 'days').should.be.below(7);
		}
	}).timeout(5000);

	const timeout = blogs.length * 5000;
	it('should do new articless check without an error', async () => {
		await Articles.newArticlesCheck(blogs);
	}).timeout(timeout);
	it('should do weekly check without an error', async () => {
		await Articles.weeklyCheck(blogs);
	}).timeout(timeout);
});

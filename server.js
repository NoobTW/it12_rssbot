require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const CronJob = require('cron').CronJob;
const moment = require('moment');
const Articles = require('./services/articles');
const blogs = require('./blogs');

const bot = new TelegramBot(process.env.TGTOKEN, {polling: true});

// 每三十分鐘抓新文章
new CronJob('* */30 * * * *', async () => {
	bot.sendChatAction(process.env.KP3am_CHATID, 'typing');
	const blogs = await Promise.all(blogs.map(x => x.getRecent(x.link, 30, 'minutes')));
	let articles = [];
	Array.from(blogs).forEach(async blog => {
		if(blog.articles) articles.push(blog.articles[0]);
	});
	articles = articles.sort((a, b) => moment(b.isoDate).unix() - moment(a.isoDate).unix());
	if(articles.length > 1){
		let msg = '最近的新文章：\n';
		Array.from(articles).forEach(article => {
			msg += `*${article.title}* \n🔗 ${article.link}\n`;
		});
		bot.sendMessage(process.env.KP3am_CHATID, msg.trim(), {parse_mode: 'Markdown', disable_web_page_preview: true});
	}else if(articles.length === 1){
		const article = articles[0];
		const content = article.contentSnippet.length > 100 ?
			`${article.contentSnippet.slice(0, 100)}...` : article.contentSnippet;
		let msg = `${article.author} 的新文章：*${article.title}*\n${content}\n🔗 ${article.link}`;
		bot.sendMessage(process.env.KP3am_CHATID, msg.trim(), {parse_mode: 'Markdown', disable_web_page_preview: true});
	}
});

// 每週檢查有沒有寫文章
new CronJob('0 50 23 * * 6', async () => {
	bot.sendChatAction(process.env.KP3am_CHATID, 'typing');
	const y = [];
	const n = [];
	let articles = await Promise.all(blogs.map(x => Articles.getThisWeek(x.link)));
	articles = articles.sort((a, b) => moment(b.isoDate).unix() - moment(a.isoDate).unix());
	Array.from(articles).forEach(async (blog, i) => {
		if(blog.articles.length){
			y.push({
				username: blogs[i].username,
				count: articles.length
			});
		}else{
			n.push(blogs[i].username);
		}
	});
	let msg = '';
	if(y.length && n.length){
		msg += '本週文章達成數：\n';
		Array.from(y).forEach(blog => {
			msg += `@${blog.username} 寫了 ${blog.count} 篇文章\n`
		});
		msg += `然而 `;
		Array.from(n).forEach((blog, i) => {
			msg += `@${blog.username}`;
			if(i !== n.length - 1) msg += ', ';
		});
		msg += ' 在這個禮拜並沒有撰寫文章 🤔';
	}else if(y.length && n.length === 0){
		msg += '本週文章達成數：\n';
		Array.from(y).forEach(blog => {
			msg += `@${blog.username} 寫了 ${blog.count} 篇文章\n`
		});
		msg += '🎉 恭喜，每週每個人都寫了文章！';
	}else{
		msg += 'Oops, 本週沒有人寫文章 😕';
	}
	bot.sendMessage(process.env.KP3am_CHATID, msg.trim());
});

bot.onText(/\/recents/, async (msg) => {
	bot.sendChatAction(msg.chat.id, 'typing');
	let message = '大家最近的新文章：\n';
	let articles = await Promise.all(blogs.map(x => Articles.getLatest(x.link)));
	articles = articles.sort((a, b) => moment(b.isoDate).unix() - moment(a.isoDate).unix());
	Array.from(articles).forEach(article => {
		if(article){
			const content = article.contentSnippet.length > 100 ?
				`${article.contentSnippet.slice(0, 100)}...` : article.contentSnippet;
			message += `*${article.title}* ${moment(article.isoDate).fromNow()}\n`;
			message += `${content}\n🔗 ${article.link}\n\n`;
		}
	});
	bot.sendMessage(msg.chat.id, message.trim(), {parse_mode: 'Markdown', disable_web_page_preview: true});
})

bot.onText(/\/about/, (msg) => {
	bot.sendMessage(msg.chat.id, '鼓勵大家寫文章，所以我會定期檢查大家有沒有寫文章。\n歡迎送 PR；https://github.com/KP3am/rssbot');
});

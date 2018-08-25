require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const CronJob = require('cron').CronJob;
const moment = require('moment');
const Articles = require('./services/articles');
const blogs = require('./blogs');

const bot = new TelegramBot(process.env.TGTOKEN, {polling: true});

// 每三十分鐘抓新文章
new CronJob('0 */30 * * * *', async () => {
	bot.sendChatAction(process.env.KP3am_CHAT, 'typing');
	const articles = await Articles.newArticlesCheck(blogs);
	if(articles.length > 1){
		let msg = '最近的新文章：\n';
		Array.from(articles).forEach(article => {
			msg += `*${article.article.title}* \n🔗 ${article.article.link}\n\n`;
		});
		bot.sendMessage(process.env.KP3am_CHAT, msg.trim(), {parse_mode: 'Markdown', disable_web_page_preview: true});
	}else if(articles.length === 1){
		const article = articles[0];
		const content = article.article.contentSnippet.length > 100 ?
			`${article.article.contentSnippet.slice(0, 100)}...` : article.article.contentSnippet;
		let msg = `@${article.username} 的新文章：*${article.article.title}*\n${content}\n🔗 ${article.article.link}`;
		bot.sendMessage(process.env.KP3am_CHAT, msg.trim(), {parse_mode: 'Markdown', disable_web_page_preview: true});
	}
}, null, true, 'Asia/Taipei');

// 每週檢查有沒有寫文章
new CronJob('0 50 23 * * 6', async () => {
	bot.sendChatAction(process.env.KP3am_CHAT, 'typing');
	const { y, n } = await Articles.weeklyCheck(blogs);

	let msg = '';
	if(y.length && n.length){
		msg += '本週文章達成數：\n';
		Array.from(y).forEach(blog => {
			msg += `@${blog.username} 寫了 ${blog.count} 篇文章\n`
		});
		msg += `然而 `;
		Array.from(n).forEach((username, i) => {
			msg += `@${username}`;
			if(i !== n.length - 1) msg += ', ';
		});
		msg += ' 在這個禮拜並沒有撰寫文章 🤔';
	}else if(y.length && n.length === 0){
		msg += '本週文章達成數：\n';
		Array.from(y).forEach(blog => {
			msg += `@${blog.username} 寫了 ${blog.count} 篇文章\n`
		});
		msg += '🎉 恭喜，本週每個人都寫了文章！';
	}else{
		msg += 'Oops, 本週沒有人寫文章 😕';
	}
	bot.sendMessage(process.env.KP3am_CHAT, msg.trim());
}, null, true, 'Asia/Taipei');

bot.onText(/\/recents/, async (msg) => {
	bot.sendChatAction(msg.chat.id, 'typing');
	let message = '最近的三篇新文章：\n';
	let articles = await Promise.all(blogs.map(x => Articles.getLatest(x.link)));
	articles = articles.sort((a, b) => moment(b.isoDate).unix() - moment(a.isoDate).unix()).slice(0, 3);
	Array.from(articles).forEach(article => {
		if(article){
			const content = article.contentSnippet.length > 100 ?
				`${article.contentSnippet.slice(0, 100)}...` : article.contentSnippet;
			message += `*${article.title}* ${moment(article.isoDate).fromNow()}\n`;
			message += `${content}\n🔗 ${article.link}\n\n`;
		}
	});
	bot.sendMessage(msg.chat.id, message.trim(), {parse_mode: 'Markdown', disable_web_page_preview: true});
});

bot.onText(/\/all/, async (msg) => {
	bot.sendChatAction(msg.chat.id, 'typing');
	let message = '大家最近的新文章：\n';
	let articles = await Promise.all(blogs.map(x => Articles.getLatest(x.link)));
	articles = articles.sort((a, b) => moment(b.isoDate).unix() - moment(a.isoDate).unix());
	Array.from(articles).forEach(article => {
		if(article){
			message += `*${article.title}* ${moment(article.isoDate).fromNow()}\n`;
			message += `🔗 ${article.link}\n\n`;
		}
	});
	bot.sendMessage(msg.chat.id, message.trim(), {parse_mode: 'Markdown', disable_web_page_preview: true});
});

bot.onText(/\/about/, (msg) => {
	bot.sendMessage(msg.chat.id, '鼓勵大家寫文章，所以我會定期檢查大家有沒有寫文章。\n歡迎送 PR；https://github.com/KP3am/rssbot');
});

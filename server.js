require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const CronJob = require('cron').CronJob;
const moment = require('moment');
const Articles = require('./services/articles');
const blogs = require('./blogs');

const bot = new TelegramBot(process.env.TGTOKEN, {polling: true});

const escapeHTML = (str) => {
	return str.replace(/<|>/g, '');
	// return str.replace(/<[^>]+>/g, '');
}

// 每三十分鐘抓新文章
new CronJob('0 */30 * * * *', async () => {
	bot.sendChatAction(process.env.KP3am_CHAT, 'typing');
	const articles = await Articles.newArticlesCheck(blogs);
	if(articles.length > 1){
		let msg = '最近的新文章：\n';
		Array.from(articles).forEach(article => {
			msg += `<b>${article.article.title}</b> \n🔗 ${article.article.link}\n\n`;
		});
		bot.sendMessage(process.env.KP3am_CHAT, msg.trim(), {parse_mode: 'HTML', disable_web_page_preview: true});
	}else if(articles.length === 1){
		const article = articles[0];
		const c = escapeHTML(article.article.contentSnippet);
		const content = c.length > 100 ? `${c.slice(0, 100)}...` : c;
		let msg = `@${article.username} 的新文章：<b>${article.article.title}</b>\n${content}\n🔗 ${article.article.link}`;
		bot.sendMessage(process.env.KP3am_CHAT, msg.trim(), {parse_mode: 'HTML', disable_web_page_preview: true});
	}
}, null, true, 'Asia/Taipei');

bot.onText(/^\/recent/, async (msg) => {
	bot.sendChatAction(msg.chat.id, 'typing');
	let message = '最近的三篇新文章：\n';
	let articles = await Promise.all(blogs.map(x => Articles.getLatest(x.link)));
	articles = articles.filter(x => x);
	articles = articles.sort((a, b) => moment(b.isoDate).unix() - moment(a.isoDate).unix()).slice(0, 3);
	Array.from(articles).forEach(article => {
		if(article){
			let c = escapeHTML(article.contentSnippet);
			console.log(c);

			const content = c.length > 100 ?
				`${c.slice(0, 100)}...` : c;
			console.log(content);
			message += `<b>${article.title}</b> ${moment(article.isoDate).fromNow()}\n`;
			message += `${escapeHTML(content)}\n🔗 ${article.link}\n\n`;
		}
	});
	bot.sendMessage(msg.chat.id, message.trim(), {parse_mode: 'HTML', disable_web_page_preview: true});
});

bot.onText(/^\/all/, async (msg) => {
	bot.sendChatAction(msg.chat.id, 'typing');
	let message = '大家最近的新文章：\n';
	let articles = await Promise.all(blogs.map(x => Articles.getLatest(x.link)));
	articles = articles.filter(x => x);
	articles = articles.sort((a, b) => moment(b.isoDate).unix() - moment(a.isoDate).unix());
	Array.from(articles).forEach(article => {
		if(article){
			message += `<b>${article.title}</b> ${moment(article.isoDate).fromNow()}\n`;
			message += `🔗 ${article.link}\n\n`;
		}
	});
	bot.sendMessage(msg.chat.id, message.trim(), {parse_mode: 'HTML', disable_web_page_preview: true});
});

bot.onText(/^\/about/, (msg) => {
	bot.sendMessage(msg.chat.id, '鼓勵大家寫文章，所以我會定期檢查大家有沒有寫文章。\n歡迎送 PR；https://github.com/noobtw/rssbot');
});

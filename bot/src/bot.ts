import 'dotenv/config'
import { Bot, InlineKeyboard, InputFile } from 'grammy'
import { generateReport, generatePdfReport } from './pdf.js'
import { getClientRecords } from './db.js'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!
const MINI_APP_URL = process.env.MINI_APP_URL!

const bot = new Bot(BOT_TOKEN)

bot.command('start', async (ctx) => {
  const param = ctx.message.text.split(' ')[1]
  const appUrl = param ? `${MINI_APP_URL}?startapp=${param}` : MINI_APP_URL
  const keyboard = new InlineKeyboard().webApp('Відкрити Ручнік 💎', appUrl)

  const text = param
    ? 'Привіт! Тебе запросили в Ручнік. Натисни кнопку щоб прийняти запрошення:'
    : 'Привіт! Я бот Ручнік — твій фінансовий записник майстра по граніту.\n\nНатисни кнопку щоб відкрити додаток:'

  await ctx.reply(text, { reply_markup: keyboard })
})

// Handle report request from Mini App via sendData / web_app_data
bot.on('message:web_app_data', async (ctx) => {
  try {
    const data = JSON.parse(ctx.message.web_app_data.data)
    if (data.action === 'send_report') {
      const { clientTelegramId, clientName, records } = data
      const textReport = generateReport(clientName, records)

      // Send text report to the master (current user)
      await ctx.reply(`📋 Звіт для ${clientName}:\n\n${textReport}`)

      // If client has telegram_id, send to them too
      if (clientTelegramId) {
        await bot.api.sendMessage(clientTelegramId, `📋 Звіт від Ручнік:\n\n${textReport}`)
      }

      // Generate and send PDF
      const pdfBytes = await generatePdfReport(clientName, records)
      const pdfBuffer = Buffer.from(pdfBytes)
      await ctx.replyWithDocument(
        new InputFile(pdfBuffer, `Звіт_${clientName}_${new Date().toLocaleDateString('uk-UA')}.pdf`),
        { caption: `📄 Звіт для ${clientName}` }
      )
    }
  } catch (e) {
    console.error('web_app_data error:', e)
  }
})

bot.start()
console.log('Ruchnik bot started')

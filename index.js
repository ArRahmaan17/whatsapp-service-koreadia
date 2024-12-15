const express = require('express')
const fs = require('fs');
const qrcode = require('qrcode-terminal');
const app = express();
const cors = require('cors')
const port = 4000;
const multer = require('multer')
const os = require('os');
const moment = require('moment');
const backend_url = 'http://127.0.0.1:8000';
const limiter = require('express-rate-limit');
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        let folder = 'task-files';
        if (req.params.phone_number != undefined) {
            folder = req.params.phone_number;
        }
        if (!fs.existsSync(`my-uploads/${folder}/`)) {
            fs.mkdirSync(`my-uploads/${folder}/`);
        }
        cb(null, `my-uploads/${folder}/`)
    },
    filename: function (req, file, cb) {
        const extension = file.originalname.split('.')[1]
        const date = new Date();
        const uniqueSuffix = `${date.getDate()}${date.getMonth()}${date.getFullYear()}.${extension}`;
        cb(null, file.originalname)
    }
})
const upload = multer({ storage: storage });
const { Client, LocalAuth, MessageMedia, Location } = require('whatsapp-web.js');
const { default: axios } = require('axios');

const client = new Client({
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        headless: true,
    },
    authStrategy: new LocalAuth({
        clientId: "Doglex",
    }),
});
const corsConfig = {
    origin: backend_url,
}
app.use(cors(corsConfig));
app.listen(port, () => {
    console.log(`Application Started`);
})
client.on('qr', async qr => {
    qrcode.generate(qr, { small: true });
});

client.on('ready', async () => {
    console.log('Client is ready!');
    function translateStatusMail(text) {
        switch (text) {
            case 'IN':
                return 'MASUK';
            case 'PROCESS':
                return 'PROSES';
            case 'FILED':
                return 'DIAJUKAN';
            case 'DISPOSITION':
                return 'DISPOSISI';
            case 'REPLIED':
                return 'DIBALAS';
            case 'ACCELERATION':
                return 'DIPERCEPAT';
            case 'OUT':
                return 'KELUAR';
            case 'ARCHIVE':
                return 'DIARSIPKAN';
            case 'ALERT':
                return 'PERINGATAN';
            default:
                break;
        }
    }
    const bodyParser = require('body-parser')
    client.on('message', async function (message) {
        if (message.body == 'test') {
            setTimeout(async () => {
                let msg = await message.getChat();
                msg.sendSeen();
                msg.sendStateTyping();
                setTimeout(() => {
                    message.reply('bot is online 🇵🇸');
                }, 30000);
            }, (60 * 1) * 1000);
        } else if (message.body == 'resources') {
            setTimeout(async () => {
                let msg = await message.getChat();
                msg.sendSeen();
                msg.sendStateTyping();
                setTimeout(() => {
                    message.reply(`CPU: ${os.cpus().map((core) => { return `${core.speed / 1000} Ghz` })} \n MEM: ${(os.freemem() / 1000000000).toFixed(2)} GB \n UP: ${Math.round(os.uptime() / 3600)} Hours`);
                }, 30000);
            }, (60 * 3) * 1000);
        } else if (message.body.startsWith('tracking ')) {
            let msg = await message.getChat();
            msg.sendSeen();
            // message.react('⏳')
            let mail_number = message.body.split('tracking ')[1];
            msg.sendStateTyping();
            setTimeout(async () => {
                try {
                    let response = await axios.get(`${backend_url}/tracking-surat?number=${mail_number}`);
                    message.reply(response.data.message);
                    msg.sendStateTyping();
                    setTimeout(async () => {
                        let detailHistory = ``;
                        response.data.data.histories.forEach((history, index) => {
                            if (history.current_status == 'FILED') {
                                detailHistory += `${index + 1}.  ${translateStatusMail(history.current_status)} kepada *${history.validator.name}* pada ${moment(history.created_at).locale('Id').format('dddd, MMMM Do YYYY, h:mm:ss a')} penanggung jawab admin ${history.user.name}\n`;
                            } else {
                                detailHistory += `${index + 1}.  ${translateStatusMail(history.current_status)} pada ${moment(history.created_at).locale('Id').format('dddd, MMMM Do YYYY, h:mm:ss a')} penanggung jawab admin ${history.user.name}\n`;
                            }
                        });
                        let histories_message = `Bapak/Ibu *${response.data.data.sender}* dengan ini kami informasikan tentang history surat anda *${response.data.data.number}*\nHistory: \n${detailHistory}`;
                        message.reply(histories_message);
                        // message.react('✅')
                    }, 15 * 1000);
                } catch (error) {
                    message.reply(error.response.data.message ?? "Aplikasi dalam pemeliharaan");
                    await message.react('✅')
                }
            }, 5 * 1000);
        } else {
            let msg = await message.getChat();
            setTimeout(async () => {
                msg.sendSeen();
                // try {
                //     // let lists = new List(
                //     //     "Test",
                //     //     "Menu",
                //     //     [{
                //     //         title: 'sectionTitle',
                //     //         rows: [
                //     //             { id: 'customId', title: 'ListItem2', description: 'desc' },
                //     //             { title: 'ListItem2' }
                //     //         ],
                //     //     }, {
                //     //         title: 'sectionTitle',
                //     //         rows: [
                //     //             { id: 'customId', title: 'ListItem2', description: 'desc' },
                //     //             { title: 'ListItem2' }
                //     //         ],
                //     //     }]
                //     // );
                //     // msg.sendStateTyping();
                //     setTimeout(() => {
                //         console.log('kirim harus e iki')
                //         // client.sendMessage(message.from, lists);
                //     }, 20000);
                // } catch (error) {
                //     console.log(error)
                // }
            }, (15) * 1000);
        }
    })

    app.use(bodyParser.json())
    app.use(bodyParser.urlencoded({ extended: true }));
    const rateLimiter = await limiter.rateLimit({
        windowMs: 1 * 60 * 1000, // 15 minutes
        limit: 5, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
        standardHeaders: 'draft-7', // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
        legacyHeaders: false,
        handler: (request, response) => {
            // console.log(request.params.phone_number != undefined && request.params.status)
            response.status(429).send({ message: `Limited Access, please try again in ${response.getHeader('retry-after')} seconds` });
        },
    });
    app.use(rateLimiter);
    app.get('/', async (req, res) => {
        res.send('Welcome to Whatsapp Services')
    });
    app.post('/mail-status/:phone_number/:status', upload.single('file_attachment'), async (req, res) => {
        let contact = await client.isRegisteredUser(`${req.params.phone_number}@c.us`);
        if (contact) {
            let media = req.file ? MessageMedia.fromFilePath(req.file.path) : undefined;
            let message = undefined;
            switch (req.params.status) {
                case 'IN':
                    message = `Bapak/Ibu *${req.body.sender}* dengan ini kami informasikan bahwa surat anda *${req.body.number}* sudah diinput ke aplikasi kami dengan status *${req.params.status}* oleh admin *${req.body.admin}*. Harap bersabar, dan kami akan segera memberi kabar perkembangan tentang surat anda. Terima kasih atas perhatian Anda.\n\nuntuk melakukan pemantauan surat bisa melalui nomer wa ini dengan cara\n\n*_tracking nomer-surat-anda_*\n\nkirimkan ke nomer ini atau bisa melalui link di bawah ini\n\n${backend_url}/tracking/`;
                    break;
                case 'OUT':
                    message = `Bapak/Ibu *${req.body.sender}* dengan ini kami informasikan bahwa surat anda *${req.body.number}* sudah diinput ke aplikasi kami dengan status *${req.params.status}* oleh admin *${req.body.admin}*. Harap bersabar, dan kami akan segera memberi kabar perkembangan tentang surat anda. Terima kasih atas perhatian Anda.\n\nuntuk melakukan pemantauan surat bisa melalui nomer wa ini dengan cara\n\n*_tracking ${req.body.number}_*\n\nkirimkan ke nomer ini atau bisa melalui link di bawah ini\n\n${backend_url}/tracking`;
                    break;
                case 'ACCELERATION':
                    message = `Bapak/Ibu *${req.body.sender}* dengan ini kami informasikan bahwa surat Anda *${req.body.number}* telah di percepat oleh admin *${req.body.admin}*. Harap bersabar, dan kami akan segera memberi kabar perkembangan tentang surat anda. Terima kasih atas perhatian Anda.\n\nuntuk melakukan pemantauan surat bisa melalui nomer wa ini dengan cara\n\n*_tracking ${req.body.number}_*\n\nkirimkan ke nomer ini atau bisa melalui link di bawah ini\n\n${backend_url}/tracking`;
                    break;
                case 'ALERT':
                    message = `Bapak/Ibu ${req.body.user} yang kami hormati ingin menginformasikan bahwa ada surat tentang ${req.body.regarding} dikirim oleh ${req.body.sender} yang diajukan oleh ${req.body.validator} kepada anda, mohon untuk dilakukan pengecekan terkait surat tersebut di aplikasi\n${backend_url}`;
                    break;
                default:
                    message = `Bapak/Ibu *${req.body.sender}* dengan ini kami informasikan bahwa surat Anda *${req.body.number}* sudah berubah status menjadi *${req.params.status}* oleh admin *${req.body.admin}*. Harap bersabar, dan kami akan segera memberi kabar perkembangan tentang surat anda. Terima kasih atas perhatian Anda.\n\nuntuk melakukan pemantauan surat bisa melalui nomer wa ini dengan cara\n\n*_tracking ${req.body.number}_*\n\nkirimkan ke nomer ini atau bisa melalui link di bawah ini\n\n${backend_url}/tracking`;
                    break;
            }
            if (media == undefined) {
                await client.sendMessage(`${req.params.phone_number}@c.us`, message);
            } else {
                await client.sendMessage(`${req.params.phone_number}@c.us`, media, { caption: message });
            }
            // client.sendMessage(`${req.params.phone_number}@c.us`, `tracking ${req.body.number}`)
            // client.sendMessage(`${req.params.phone_number}@c.us`, location, { caption: message });
            res.status(200).send({ 'status': 'Success', 'message': `Success send notification for ${req.params.phone_number}` });
        } else {
            res.status(422).send({ 'status': 'Failed', 'message': `Failed send notification for ${req.params.phone_number} because number is not registered yet` });
        }
    });
    app.post('/broadcast-event/:phone_number', upload.single('file_attachment'), async (req, res) => {
        let contact = await client.isRegisteredUser(`${req.params.phone_number}@c.us`);
        if (contact) {
            let media = req.file ? MessageMedia.fromFilePath(req.file.path) : undefined;
            let agendaList = '';
            let agendas = JSON.parse(req.body.agendas);

            agendas.forEach((agenda, index) => {
                if (agenda.online) {
                    agenda.meeting = JSON.parse(agenda.meeting);
                }
                console.log(agenda)
                agendaList += `${index + 1}. Jam : ${agenda.time} Wit
${agenda.name}
Tempat : ${agenda.location ?? 'Zoon Meeting'}
${(agenda.online) ? `Topic: ${agenda.meeting.topic ?? 'kosong'}
Meeting ID: ${agenda.meeting.id ?? 'kosong'}
Passcode: ${agenda.meeting.passcode ?? 'kosong'}` : ``}
Pejabat yang datang & Pengangung jawab acara :
-${agenda.speaker.split(',').join('\n-')}

`
            });
            let message = `Yth. ${req.body.recipient}
Dengan Hormat Disampaikan Acara ${req.body.name}
${req.body.date}

${agendaList}
Linimasa acara:
${backend_url}/event/timeline/${req.body.id}

TTD
PJ. SEKDA`;
            client.sendMessage(`${req.params.phone_number}@c.us`, media, { caption: message });
            // client.sendMessage(`${req.params.phone_number}@c.us`, location, { caption: message });
            res.status(200).send({ 'status': 'Success', 'message': `Success send notification for ${req.params.phone_number}` });
        } else {
            res.status(422).send({ 'status': 'Failed', 'message': `Failed send notification for ${req.params.phone_number} because number is not registered yet` });
        }
    });
    app.get('/phone-check/:phone_number', async (req, res) => {
        let contact = await client.isRegisteredUser(`${req.params.phone_number}@c.us`);
        if (contact) {
            res.status(200).send({ 'status': 'Success', 'message': `Success ${req.params.phone_number} is registered` });
        } else {
            res.status(404).send({ 'status': 'Failed', 'message': `Failed ${req.params.phone_number} is not registered` });
        }
    });
    app.post('/otp/:phone_number', async (req, res) => {
        let contact = await client.isRegisteredUser(`${req.params.phone_number}@c.us`);
        if (contact) {
            res.status(200).send({ 'status': 'Success', 'message': `Success ${req.params.phone_number} is registered` });
        } else {
            res.status(404).send({ 'status': 'Failed', 'message': `Failed ${req.params.phone_number} is not registered` });
        }
    });
});
client.initialize();
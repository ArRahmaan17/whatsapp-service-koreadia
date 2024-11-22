const express = require('express')
const fs = require('fs');
const qrcode = require('qrcode-terminal');
const app = express();
const cors = require('cors')
const port = 4000;
const multer = require('multer')
const os = require('os');
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
const { Client, LocalAuth, MessageMedia, Location, Contact } = require('whatsapp-web.js');
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
            setTimeout(async () => {
                let msg = await message.getChat();
                msg.sendSeen();
                // msg.sendStateTyping();
                let mail_number = message.body.split('tracking ')[1];
                let response = await axios.get(`${backend_url}/tracking?number=${mail_number}`);
                console.log(response.data.data);
            }, (10) * 1000);
        } else {
            setTimeout(async () => {
                let msg = await message.getChat();
                msg.sendSeen();
            }, (60 * 5) * 1000);
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
            const location = new Location((-7.8137244), 110.376889, { 'address': '59PH+GQ4, Wirogunan, Kec. Mergangsan, Kota Yogyakarta, Daerah Istimewa Yogyakarta 55151', 'name': 'Kost Putra Bu Jarwo' });
            let message = undefined;
            switch (req.params.status) {
                case 'IN':
                    message = `Bapak/Ibu *${req.body.sender}* dengan ini kami informasikan bahwa surat anda *${req.body.number}* sudah diinput ke aplikasi kami dengan status *${req.params.status}* oleh admin *${req.body.admin}*. Harap bersabar, dan kami akan segera memberi kabar perkembangan tentang surat anda. Terima kasih atas perhatian Anda.\n\nuntuk melakukan pemantauan surat bisa melalui nomer wa ini dengan cara\n\n*_tracking nomer-surat-anda_*\n\nkirimkan ke nomer ini atau bisa melalui link di bawah ini\n\n${backend_url}/tracking/`;
                    break;
                case 'OUT':
                    message = `Bapak/Ibu *${req.body.sender}* dengan ini kami informasikan bahwa surat anda *${req.body.number}* sudah diinput ke aplikasi kami dengan status *${req.params.status}* oleh admin *${req.body.admin}*. Harap bersabar, dan kami akan segera memberi kabar perkembangan tentang surat anda. Terima kasih atas perhatian Anda.\n\nuntuk melakukan pemantauan surat bisa melalui nomer wa ini dengan cara\n\n*_tracking nomer-surat-anda_*\n\nkirimkan ke nomer ini atau bisa melalui link di bawah ini\n\n${backend_url}/tracking/`;
                    break;
                case 'ACCELERATION':
                    message = `Bapak/Ibu *${req.body.sender}* dengan ini kami informasikan bahwa surat Anda *${req.body.number}* telah di percepat oleh admin *${req.body.admin}*. Harap bersabar, dan kami akan segera memberi kabar perkembangan tentang surat anda. Terima kasih atas perhatian Anda.\n\nuntuk melakukan pemantauan surat bisa melalui nomer wa ini dengan cara\n\n*_tracking nomer-surat-anda_*\n\nkirimkan ke nomer ini atau bisa melalui link di bawah ini\n\n${backend_url}/tracking/`;
                    break;
                default:
                    message = `Bapak/Ibu *${req.body.sender}* dengan ini kami informasikan bahwa surat Anda *${req.body.number}* sudah berubah status menjadi *${req.params.status}* oleh admin *${req.body.admin}*. Harap bersabar, dan kami akan segera memberi kabar perkembangan tentang surat anda. Terima kasih atas perhatian Anda.\n\nuntuk melakukan pemantauan surat bisa melalui nomer wa ini dengan cara\n\n*_tracking nomer-surat-anda_*\n\nkirimkan ke nomer ini atau bisa melalui link di bawah ini\n\n${backend_url}/tracking/`;
                    break;
            }
            if (media == undefined) {
                client.sendMessage(`${req.params.phone_number}@c.us`, message);
            } else {
                client.sendMessage(`${req.params.phone_number}@c.us`, media, { caption: message });
            }
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
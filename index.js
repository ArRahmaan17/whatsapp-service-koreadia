const express = require('express')
const fs = require('fs');
const qrcode = require('qrcode-terminal');
const app = express();
const cors = require('cors')
const port = 4000;
const multer = require('multer')
const os = require('os')
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

const client = new Client({
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        headless: true,
    },
    authStrategy: new LocalAuth({
        clientId: "Doglex",
    }),
});
app.use(cors())
app.listen(port, () => {
    console.log(`Application Started`);
})
client.on('qr', async qr => {
    qrcode.generate(qr, { small: true });
});

client.on('ready', async () => {
    console.log('Client is ready!');
    const bodyParser = require('body-parser')
    app.get('/', async (req, res) => {
        res.send('Welcome to Whatsapp Services')
    });
    client.on('message', async function (message) {
        if (message.body == 'test') {
            message.reply('bot is online 🇵🇸');
        } else if (message.body == 'resources') {
            message.reply(`CPU: ${os.cpus().map((core) => { return `${core.speed / 1000} Ghz` })} \n MEM: ${(os.freemem() / 1000000000).toFixed(2)} GB \n UP: ${Math.round(os.uptime() / 3600)} Hours`);
        } else if (message.body.startsWith('tracking ')) {
            console.log(message.body.split(' ')[1]);
        } else {
            let msg = await message.getChat();
            msg.sendSeen();
        }
    })

    app.use(bodyParser.json())
    app.use(bodyParser.urlencoded({ extended: true }));
    app.post('/mail-status/:phone_number/:status', upload.single('file_attachment'), async (req, res) => {
        let contact = await client.isRegisteredUser(`${req.params.phone_number}@c.us`);
        if (contact) {
            const media = MessageMedia.fromFilePath(req.file.path);
            const location = new Location((-7.8137244), 110.376889, { 'address': '59PH+GQ4, Wirogunan, Kec. Mergangsan, Kota Yogyakarta, Daerah Istimewa Yogyakarta 55151', 'name': 'Kost Putra Bu Jarwo' });
            let message = null;
            switch (req.params.status) {
                case 'IN':
                    message = `Bapak/Ibu *${req.body.sender}* dengan ini kami informasikan bahwa surat Anda sudah diinput ke aplikasi kami dengan status *${req.params.status}*. Harap bersabar, dan kami akan segera memberi kabar perkembangan tentang surat anda. Terima kasih atas perhatian Anda.\n\nuntuk melakukan pemantauan surat bisa melalui\n\nhttp://127.0.0.1:8000/tracking \n\natau bisa melalui nomer wa ini dengan cara \n\n*_tracking nomer-surat-anda_*\n\nkirimkan ke nomer ini`;
                    break;
                default:
                    message = `Bapak/Ibu *${req.body.sender}* dengan ini kami informasikan bahwa surat Anda sudah berubah status menjadi *${req.params.status}*. Harap bersabar, dan kami akan segera memberi kabar perkembangan tentang surat anda. Terima kasih atas perhatian Anda.\n\nuntuk melakukan pemantauan surat bisa melalui\n\nhttp://127.0.0.1:8000/tracking \n\natau bisa melalui nomer wa ini dengan cara \n\n*_tracking nomer-surat-anda_*\n\nkirimkan ke nomer ini`;
                    break;
            }
            client.sendMessage(`${req.params.phone_number}@c.us`, media, { caption: message });
            // client.sendMessage(`${req.params.phone_number}@c.us`, location, { caption: message });
            res.status(200).send({ 'status': 'Success', 'Message': `Success send notification for ${req.params.phone_number}` });
        } else {
            res.status(422).send({ 'status': 'Failed', 'Message': `Failed send notification for ${req.params.phone_number} because number is not registered yet` });
        }
    });
    app.get('/phone-check/:phone_number', async (req, res) => {
        let contact = await client.isRegisteredUser(`${req.params.phone_number}@c.us`);
        if (contact) {
            res.status(200).send({ 'status': 'Success', 'Message': `Success ${req.params.phone_number} is registered` });
        } else {
            res.status(404).send({ 'status': 'Failed', 'Message': `Failed ${req.params.phone_number} is not registered` });
        }
    });
});
client.initialize();
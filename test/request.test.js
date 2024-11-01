const test = require('jest');
const express = require('express')
const app = express();
const request = require('supertest');

app.get('/', async (req, res) => {
    res.send('Welcome to Whatsapp Services')
});

describe('GET /', () => {
    it("should return home page", async () => {
        let response = await request(app).get('/');
        expect(response.text).toBe('Welcome to Whatsapp Services');
    })
})

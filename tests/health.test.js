const app = require('../app')
const request = require('supertest')

describe('routes: health', () => {
    test('should respond as expected', async () => {
        const response = await request(app.callback()).get('/health')

        expect(response.status).toEqual(200)
    })
})

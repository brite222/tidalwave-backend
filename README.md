Hey! TidalWave API is deployed and ready 🌊

🔗 API Base: https://tidalwave-api.onrender.com/api/v1
📚 Swagger Docs: https://tidalwave-api.onrender.com/docs
❤️ Health: https://tidalwave-api.onrender.com/health

🔐 Test Credentials (all use password: Password123!):
- Admin:      admin@lawma.gov.ng
- Contractor: contractor@tidalwave.ng
- Driver:     ibrahim.adeyemi@lawma.gov.ng
- Citizen:    adebayo.okonkwo@email.com

🚀 Quick start:
1. POST /auth/login → get access_token
2. Add header: Authorization: Bearer <token>
3. Browse /docs for all endpoints

📡 Real-time WebSocket:
const socket = io('https://tidalwave-api.onrender.com', {
  auth: { token: '<access_token>' }
});
socket.on('bin:update', (data) => { /* live bin updates */ });

⚠️ Free tier sleeps after 15 min idle.
First request after sleep ~30 sec. After that, instant.

📦 Repo: https://github.com/YOUR_USERNAME/tidalwave-backend

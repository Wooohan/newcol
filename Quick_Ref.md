# MessengerFlow - Quick Reference Guide

## 🚀 Quick Start

```bash
# 1. Setup
npm run setup

# 2. Configure
nano server/.env  # Add your credentials

# 3. Database
# Run database/schema.sql in Supabase SQL Editor

# 4. Develop
Terminal 1: cd server && npm run dev
Terminal 2: npm run dev

# 5. Deploy
npm run build
pm2 start ecosystem.config.js
```

## 📝 Environment Variables

```env
# server/.env
SUPABASE_URL=https://fiuodbhgvmylvbanbfve.supabase.co
SUPABASE_SERVICE_KEY=sb_secret_x33xGa8YmioWvfyvDtWNXA_fT_8VL9V
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
FB_APP_ID=1148755260666274
FB_VERIFY_TOKEN=my_secret_123
PORT=3000
NODE_ENV=production
```

## 🔧 Common Commands

### Development
```bash
npm run dev          # Start Vite dev server
npm run server       # Start Express server (dev mode)
npm run build        # Build for production
```

### Production
```bash
pm2 start ecosystem.config.js    # Start with PM2
pm2 logs messengerflow-server    # View logs
pm2 restart messengerflow-server # Restart
pm2 stop messengerflow-server    # Stop
pm2 delete messengerflow-server  # Remove
```

### Monitoring
```bash
pm2 monit                        # Monitor resources
pm2 status                       # Check status
tail -f logs/combined.log        # View app logs
tail -f logs/error.log           # View errors
```

## 🌐 API Endpoints

### Health Check
```bash
curl http://localhost:3000/health
```

### Webhook
```bash
# Verify
curl "http://localhost:3000/webhook?hub.mode=subscribe&hub.verify_token=my_secret_123&hub.challenge=test"

# Receive event
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{"object":"page","entry":[]}'
```

### Sync Conversations
```bash
curl -X POST http://localhost:3000/api/sync-conversations \
  -H "Content-Type: application/json" \
  -d '{"pageId":"123","limit":5}'
```

### Get Messages
```bash
curl http://localhost:3000/api/messages/conversation-id
```

### Send Message
```bash
curl -X POST http://localhost:3000/api/send-message \
  -H "Content-Type: application/json" \
  -d '{"conversationId":"123","text":"Hello","senderId":"agent"}'
```

## 🗄️ Database Queries

### Check Tables
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';
```

### Check Indexes
```sql
SELECT * FROM pg_indexes 
WHERE tablename IN ('messages', 'conversations');
```

### Count Records
```sql
SELECT 
  (SELECT COUNT(*) FROM agents) as agents,
  (SELECT COUNT(*) FROM pages) as pages,
  (SELECT COUNT(*) FROM conversations) as conversations,
  (SELECT COUNT(*) FROM messages) as messages;
```

### Recent Messages
```sql
SELECT * FROM messages 
ORDER BY timestamp DESC 
LIMIT 10;
```

### Active Conversations
```sql
SELECT * FROM conversations 
WHERE status = 'OPEN' 
ORDER BY "lastTimestamp" DESC;
```

## 🔍 Troubleshooting

### Server Won't Start
```bash
# Check port
sudo lsof -i :3000

# Check logs
pm2 logs messengerflow-server --err

# Verify env
cat server/.env
```

### Webhook Not Working
```bash
# Test locally
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{"object":"page","entry":[{"messaging":[{"sender":{"id":"123"},"recipient":{"id":"456"},"message":{"mid":"test","text":"Hello"}}]}]}'

# Check logs
pm2 logs messengerflow-server | grep webhook
```

### Real-Time Not Working
```sql
-- Check realtime is enabled
SELECT * FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';
```

### High Memory Usage
```bash
pm2 monit                        # Check memory
pm2 restart messengerflow-server # Restart if needed
```

## 📊 Performance Checks

### Response Time
```bash
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:3000/health
```

Create `curl-format.txt`:
```
time_namelookup:  %{time_namelookup}\n
time_connect:  %{time_connect}\n
time_starttransfer:  %{time_starttransfer}\n
time_total:  %{time_total}\n
```

### Database Performance
```sql
-- Slow queries
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

## 🔒 Security Checklist

- [ ] Change default admin password
- [ ] Use strong FB_VERIFY_TOKEN
- [ ] Enable SSL/HTTPS
- [ ] Configure firewall
- [ ] Update Node.js and dependencies
- [ ] Use environment variables for secrets
- [ ] Enable rate limiting
- [ ] Regular backups
- [ ] Monitor logs

## 📁 Important Files

```
server/index.js              # Main server file
server/routes/webhook.js     # Webhook handler
server/services/realtime.js  # Realtime subscriptions
database/schema.sql          # Database schema
ecosystem.config.js          # PM2 configuration
DEPLOYMENT_GUIDE.md          # Deployment instructions
```

## 🎯 Key Metrics

Target performance:
- Message delivery: < 100ms
- Page load: < 2s
- API response: < 200ms
- Webhook processing: < 500ms
- Initial sync: < 2s (5 conversations)

## 🔗 Useful Links

- Supabase Dashboard: https://supabase.com/dashboard
- Meta Developer: https://developers.facebook.com
- PM2 Docs: https://pm2.keymetrics.io
- Nginx Docs: https://nginx.org/en/docs/

## 💡 Tips

1. **Always check logs first** when debugging
2. **Use PM2 monit** to watch resource usage
3. **Test webhooks locally** before deploying
4. **Enable Supabase Realtime** in dashboard
5. **Keep dependencies updated** for security
6. **Monitor database size** and clean old data
7. **Use PM2 cluster mode** for better performance
8. **Set up log rotation** to save disk space

## 🆘 Emergency Commands

```bash
# Restart everything
pm2 restart all && sudo systemctl restart nginx

# Check all services
pm2 status && sudo systemctl status nginx

# View all logs
pm2 logs --lines 100

# Clear PM2 logs
pm2 flush

# Rebuild and restart
npm run build && pm2 restart messengerflow-server
```

## 📞 Support

1. Check logs: `pm2 logs messengerflow-server`
2. Review Supabase dashboard
3. Check Meta Developer console
4. Test endpoints with curl
5. Review documentation

---

**Keep this handy for quick reference!** 📌

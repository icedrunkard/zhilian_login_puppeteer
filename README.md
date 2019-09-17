# zhilian_login_puppeteer

安装好 node 环境

安装好typescript环境

安装好python3.7环境


```
> git clone ...
> cd zhilian_login_puppeteer
> docker-compose up -d
> tsc
> pm2 start gap_detection_server.py --interpreter python3.7
> pm2 start sms_service.py --interpreter python3.7
> pm2 start server.js --name zhilian_login_server
```
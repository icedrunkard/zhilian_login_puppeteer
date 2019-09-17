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

POST http://127.0.0.1:4007/
    {"mobile":"12312341234","proxy":"--proxy-server=http://ip:port"}

  如果验证码识别正确，手机号会收到短信，此时：
    POST http://127.0.0.1:4006/sms-cache/
        {"channel":"2","mobile":"12312341234","sms":"123456"}
        此接口会把短信传到运行中的browserless 浏览器中，完成登录

    登录完成后，4007接口会返回[{}]类型的cookies。
    登录过程如果出错，4007接口会返回"failed"字符串
  
  如果验证码识别失败，4007接口会直接返回字符串“failed”


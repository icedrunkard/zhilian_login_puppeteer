import mobileLogin from './scripts/login';

const http = require("http");
const server = http.createServer(async function(req:any, res:any) {
  let body='';
  req.on('data', function (chunk:any) {
    body += chunk;
  });
  req.on('end', async function () {
    // 解析参数
    try { 
      JSON.parse(body);
    } catch {
      res.writeHead(200, {'Content-Type': 'text/plain'});
      res.end('failed');
      return;
    };
    let parsedBody = JSON.parse(body);

    // 设置响应头部信息及编码
    console.log(parsedBody);

    let mobile = parsedBody.mobile || '';
    let proxy = parsedBody.proxy || '';

    if ( mobile.length === 11 ) { 
      // mobile 11 位
      try {
        let resp = await mobileLogin(mobile, proxy);
        if (resp === 'failed'){
          res.writeHead(200, {'Content-Type': 'text/plain'});
          res.end('failed');
        } else {
          res.writeHead(200, {'Content-Type': 'application/json'});
          res.write(JSON.stringify(resp));
          res.end();
        };
      } catch {
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end('failed');
      };
    } else {
      //mobile不是11位
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end('mobile err');
      }
  });
});
const port=4007;
server.listen(port, function() {
  console.log("zhilian mobile login server start " + port.toString());
});


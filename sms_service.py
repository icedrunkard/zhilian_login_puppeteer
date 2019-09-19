# coding=utf-8
# python3.7
import json
import time
import aioredis
import asyncio
from aiohttp import web


class Redis:
    _redis = None

    async def get_redis_pool(self, *args, **kwargs):
        if not self._redis:
            self._redis = await aioredis.create_redis_pool(*args, **kwargs)
        return self._redis

    async def close(self):
        if self._redis:
            self._redis.close()
            await self._redis.wait_closed()


async def sms_cache(request):
    try:
        obj = await request.json()
    except Exception as e:
        try:
            text = await request.text()
            obj = json.loads(text)
        except Exception as e:
            data = {"code": 500, "msg": "参数错误，无法解析"}
            text = json.dumps(data, ensure_ascii=False)
            return web.json_response(status=200, text=text)
    print(obj)
    if not (isinstance(obj.get('mobile'), str) and isinstance(obj.get('channel'), str) and isinstance(obj.get('sms'),
                                                                                                      str)):
        data = {"code": 400, "msg": "存储sms时，必须带有 mobile/channel/sms三个字段,且是字符串"}
        text = json.dumps(data, ensure_ascii=False)
        return web.json_response(status=200, text=text)
    channel = obj['channel']
    mobile = obj['mobile']
    sms = obj['sms']
    t = time.time()
    ts = time.strftime('%Y-%m-%d %H:%M:%S')
    sms_obj = {'sms': sms, 'update_time': t, 'update_time_str': ts}
    redis = Redis()
    pool = await redis.get_redis_pool(('127.0.0.1', 7001), db=1, password='redis7001', encoding='utf-8')
    await pool.hset(channel, mobile, json.dumps(sms_obj))
    value = str(await pool.hget(channel, mobile, ))
    await redis.close()
    data = {"code": 200, "msg": "set value successfully {}".format(value)}
    text = json.dumps(data, ensure_ascii=False)
    return web.json_response(status=200, text=text)


async def sms_get(request):
    channel = request.match_info.get('channel', '')
    mobile = request.match_info.get('mobile', '')
    if not (len(channel) and len(mobile)):
        data = {"code": 500, "msg": "参数错误，无法解析"}
        text = json.dumps(data, ensure_ascii=False)
        return web.json_response(status=200, text=text)
    if not (isinstance(channel, str) and isinstance(mobile, str)):
        data = {"code": 400, "msg": "读取sms时，必须带有 mobile/channel两个字段,且是字符串"}
        text = json.dumps(data, ensure_ascii=False)
        return web.json_response(status=200, text=text)
    redis = Redis()
    pool = await redis.get_redis_pool(('127.0.0.1', 7001), db=1, password='redis7001', encoding='utf-8')
    t0 = time.time()
    while True:
        try:
            sms_obj = json.loads(await pool.hget(channel, mobile))
            if time.time() - sms_obj.get('update_time') < 60:
                sms = sms_obj['sms']
                data = {"code": 200, "msg": "success", 'sms': sms}
                text = json.dumps(data, ensure_ascii=False)
                return web.json_response(status=200, text=text)
        except:
            pass
        if time.time() - t0 < 90:
            await asyncio.sleep(0.3)
        else:
            data = {"code": 404, "msg": "sms not found"}
            text = json.dumps(data, ensure_ascii=False)
            return web.json_response(status=200, text=text)

async def is_sms_good_after_post(request):
    channel = request.match_info.get('channel', '')
    mobile = request.match_info.get('mobile', '')
    if not (len(channel) and len(mobile)):
        data = {"code": 500, "msg": "参数错误，无法解析"}
        text = json.dumps(data, ensure_ascii=False)
        return web.json_response(status=200, text=text)
    if not (isinstance(channel, str) and isinstance(mobile, str)):
        data = {"code": 400, "msg": "读取sms时，必须带有 mobile/channel两个字段,且是字符串"}
        text = json.dumps(data, ensure_ascii=False)
        return web.json_response(status=200, text=text)
    redis = Redis()
    pool = await redis.get_redis_pool(('127.0.0.1', 7001), db=1, password='redis7001', encoding='utf-8')
    t0 = time.time()
    while True:
        try:
            sms_obj = json.loads(await pool.hget(channel, mobile))
            if time.time() - sms_obj.get('update_time') < 60:
                sms_status = sms_obj['sms_status']
                data = {"code": 200, 'sms_status': sms_status}
                text = json.dumps(data, ensure_ascii=False)
                return web.json_response(status=200, text=text)
        except:
            pass
        if time.time() - t0 < 60:
            await asyncio.sleep(0.3)
        else:
            data = {"code": 404, "msg": "sms status not found"}
            text = json.dumps(data, ensure_ascii=False)
            return web.json_response(status=200, text=text)

async def sms_status_cache(request):
    try:
        obj = await request.json()
    except Exception as e:
        try:
            text = await request.text()
            obj = json.loads(text)
        except Exception as e:
            data = {"code": 500, "msg": "参数错误，无法解析"}
            text = json.dumps(data, ensure_ascii=False)
            return web.json_response(status=200, text=text)
    print('sms_status_cache obj',obj)
    if not (isinstance(obj.get('mobile'), str) and isinstance(obj.get('channel'), str) and isinstance(obj.get('sms_status'),
                                                                                                      str)):
        data = {"code": 400, "msg": "存储sms时，必须带有 mobile/channel/sms_status三个字段,且是字符串"}
        text = json.dumps(data, ensure_ascii=False)
        return web.json_response(status=200, text=text)
    channel = obj['channel']
    mobile = obj['mobile']
    sms_status = obj['sms_status']
    t = time.time()
    ts = time.strftime('%Y-%m-%d %H:%M:%S')
    sms_status_obj = {'sms_status': sms_status, 'update_time': t, 'update_time_str': ts}
    print(sms_status_obj)
    redis = Redis()
    pool = await redis.get_redis_pool(('127.0.0.1', 7001), db=1, password='redis7001', encoding='utf-8')
    await pool.hset(channel, mobile, json.dumps(sms_status_obj))
    value = str(await pool.hget(channel, mobile, ))
    await redis.close()
    data = {"code": 200, "msg": "set value successfully {}".format(value)}
    text = json.dumps(data, ensure_ascii=False)
    return web.json_response(status=200, text=text)


if __name__ == '__main__':
    app = web.Application()
    routes = [
        web.get('/sms-get/{channel}/{mobile}', sms_get),
        web.post('/sms-cache', sms_cache),
        web.get('/is-sms-good-after-post/{channel}/{mobile}', is_sms_good_after_post),
        web.post('/sms-status-cache', sms_status_cache),
    ]
    app.add_routes(routes)
    print('sms_service listening port 4006...')
    web.run_app(app, port=4006)

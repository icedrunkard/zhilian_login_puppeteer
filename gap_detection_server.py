# coding=utf-8
# python3.7
import json
import asyncio
from io import BytesIO
from PIL import Image
from base64 import b64decode
from aiohttp import web


def is_pixel_equal(img_1, img_2, x, y):
    """
    判断两个像素是否相同
    :param img_1: 带缺口图片
    :param img_2: 不带缺口图片
    :param x: 位置x
    :param y: 位置y
    :return: 像素是否相同
    """
    # 取两个图片的像素点
    pix_1 = img_1.load()[x, y]
    pix_2 = img_2.load()[x, y]
    threshold = 60  # 阀值
    if abs(pix_1[0] - pix_2[0]) < threshold \
            and abs(pix_1[1] - pix_2[1]) < threshold \
            and abs(pix_1[2] - pix_2[2]) < threshold:
        return True
    else:
        return False


def get_gap(img_1, img_2):
    """
    获取缺口偏移量
    :param img_1: 带缺口图片
    :param img_2: 不带缺口图片
    :return: 缺口位置
    """
    distance = 60
    for i in range(distance, img_2.size[0]):
        for j in range(img_2.size[1]):
            if not is_pixel_equal(img_1, img_2, i, j):
                distance = i
                return distance
    print(img_2.size[0], img_2.size[1])
    return distance


async def detect_gap(request):
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
    if not obj.get('img1') or not obj.get('img2'):
        data = {"code": 400, "msg": "必须有img1, img2 字段"}
        text = json.dumps(data, ensure_ascii=False)
        return web.json_response(status=200, text=text)
    try:
        img1bytes = b64decode(obj['img1'].encode())
        img_1 = Image.open(BytesIO(img1bytes))
        img2bytes = b64decode(obj['img2'].encode())
        img_2 = Image.open(BytesIO(img2bytes))
    except Exception as e:
        data = {"code": 501, "msg": "传入的img格式不对，无法解析"}
        text = json.dumps(data, ensure_ascii=False)
        return web.json_response(status=200, text=text)
    distance = get_gap(img_1,img_2) - 7
    data = {"code": 200, "msg": "ok", 'distance':distance}
    text = json.dumps(data, ensure_ascii=False)
    return web.json_response(status=200, text=text)

if __name__ == '__main__':
    app = web.Application()
    routes = [
        web.post('/slide/detect-gap', detect_gap),
    ]
    app.add_routes(routes)
    print('listening port 4005...')
    web.run_app(app, port=4005)
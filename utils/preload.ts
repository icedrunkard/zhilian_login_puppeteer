Object.defineProperty(navigator, "languages", {
  get: function() {
    return ["zh", 'zh-CN'];
  }
});

Object.defineProperty(navigator, 'webdriver', {
  get: function() {
    return undefined;
  }
});

Object.defineProperty(Notification, 'permission', {
  get: function() {
    return 'default';
  }
});

Object.defineProperty(navigator, 'platform', {
  get: function() {
    return 'iOS';
  }
});

Object.defineProperty(navigator, 'plugins', {
  get: () => [
    {
      description: 'Portable Document Format',
      filename: 'internal-pdf-viewer',
      name: 'Chrome PDF Plugin',
    },
    {
      description: '',
      filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai',
      name: 'Chrome PDF Viewer',
    }
  ]
});


# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - link "Back to Home" [ref=e4] [cursor=pointer]:
      - /url: /
      - img [ref=e5] [cursor=pointer]
      - generic [ref=e7] [cursor=pointer]: Back to Home
    - generic [ref=e10]:
      - generic [ref=e11]:
        - heading "创建账户" [level=1] [ref=e12]
        - paragraph [ref=e13]: 加入 Appesso 社区
      - generic [ref=e14]:
        - generic [ref=e16]:
          - img [ref=e18]
          - textbox "手机号码" [ref=e20]
          - generic [ref=e21]: 手机号码
        - generic [ref=e23]:
          - img [ref=e25]
          - textbox "设置密码" [ref=e28]
          - generic [ref=e29]: 设置密码
        - generic [ref=e31]:
          - img [ref=e33]
          - textbox "确认密码" [ref=e36]
          - generic [ref=e37]: 确认密码
        - button "注册" [ref=e38] [cursor=pointer]:
          - img [ref=e39] [cursor=pointer]
          - text: 注册
      - paragraph [ref=e42]:
        - text: 已有账户？
        - link "立即登录" [ref=e43] [cursor=pointer]:
          - /url: /login
  - generic [ref=e44]:
    - img [ref=e46]
    - button "Open Tanstack query devtools" [ref=e94] [cursor=pointer]:
      - img [ref=e95] [cursor=pointer]
  - alert [ref=e143]
```
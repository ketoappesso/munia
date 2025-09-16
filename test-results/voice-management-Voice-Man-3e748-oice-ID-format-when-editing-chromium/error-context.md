# Page snapshot

```yaml
- generic [ref=e2]:
  - link "Back to Home" [ref=e4] [cursor=pointer]:
    - /url: /
    - img [ref=e5] [cursor=pointer]
    - generic [ref=e7] [cursor=pointer]: Back to Home
  - generic [ref=e10]:
    - generic [ref=e11]:
      - heading "欢迎回来" [level=1] [ref=e12]
      - paragraph [ref=e13]: 登录您的 Appesso 账户
    - generic [ref=e14]:
      - generic [ref=e16]:
        - img [ref=e18]
        - textbox "手机号码" [ref=e20]
        - generic [ref=e21]: 手机号码
      - generic [ref=e22]:
        - button "密码登录" [ref=e23] [cursor=pointer]
        - button "短信验证" [ref=e24] [cursor=pointer]
      - generic [ref=e26]:
        - img [ref=e28]
        - textbox "密码" [ref=e31]
        - generic [ref=e32]: 密码
      - button "登录" [ref=e33] [cursor=pointer]:
        - img [ref=e34] [cursor=pointer]
        - text: 登录
    - paragraph [ref=e37]:
      - text: 还没有账户？
      - link "立即注册" [ref=e38] [cursor=pointer]:
        - /url: /register
```
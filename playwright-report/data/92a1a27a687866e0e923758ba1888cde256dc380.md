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
        - textbox "手机号码" [ref=e20]: "18874748888"
        - generic [ref=e21]: 手机号码
        - button "Clear" [ref=e22]:
          - img [ref=e23]
      - generic [ref=e25]:
        - button "密码登录" [ref=e26]
        - button "短信验证" [ref=e27]
      - generic [ref=e29]:
        - img [ref=e31]
        - textbox "密码" [active] [ref=e34]: "123456"
        - generic [ref=e35]: 密码
        - button "Clear" [ref=e36]:
          - img [ref=e37]
      - button "登录" [ref=e39]:
        - img [ref=e40]
        - text: 登录
    - paragraph [ref=e43]:
      - text: 还没有账户？
      - link "立即注册" [ref=e44] [cursor=pointer]:
        - /url: /register
```
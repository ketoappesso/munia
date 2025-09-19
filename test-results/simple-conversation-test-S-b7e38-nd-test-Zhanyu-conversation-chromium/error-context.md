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
        - heading "欢迎使用 Appesso" [level=1] [ref=e12]
        - paragraph [ref=e13]: 系统将自动识别您的账号
      - generic [ref=e14]:
        - generic [ref=e16]:
          - img [ref=e18]
          - textbox "手机号码" [ref=e20]
          - generic [ref=e21]: 手机号码
        - generic [ref=e23]:
          - img [ref=e25]
          - textbox "密码" [ref=e28]
          - generic [ref=e29]: 密码
        - generic [ref=e30]:
          - generic [ref=e31]:
            - img [ref=e33]
            - textbox "短信验证码（暂时关闭）" [ref=e35]
            - generic [ref=e36]: 短信验证码（暂时关闭）
          - paragraph [ref=e37]: 由于服务商原因，短信验证功能暂时关闭，仅使用密码认证
        - button "登录/注册" [ref=e38] [cursor=pointer]:
          - img [ref=e39] [cursor=pointer]
          - text: 登录/注册
      - paragraph [ref=e42]: 新用户将自动注册并登录 | 老用户将直接登录
  - alert [ref=e43]
```
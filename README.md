# AI 智能对话 Web 应用

一个使用 React、TypeScript 与 FastAPI 开发的 AI 对话项目。项目支持多轮对话、历史会话管理、模型选择和 SSE 流式回复，并提供 Docker + Nginx 部署配置。

在线演示：<https://jzp-221.github.io/ai-chat-web/>

> 在线演示使用前端 Mock 流式接口，不包含任何大模型密钥；本地运行时可以连接 FastAPI 后端。

## 功能

- 新建、切换、删除和清空历史会话
- 每个会话独立选择对话模型
- 基于 SSE 的逐字流式回复
- 停止生成与重新生成功能
- Markdown、表格、任务列表和代码高亮
- 空输入、加载中、请求失败及网络超时处理
- 使用 `localStorage` 保存本地聊天记录
- FastAPI 模拟接口及 OpenAI 兼容接口入口
- Docker Compose 与 Nginx 部署配置

## 技术栈

- 前端：React、TypeScript、Vite、CSS
- 后端：FastAPI、Pydantic、HTTPX
- 部署：Docker、Docker Compose、Nginx

## 本地启动

### 1. 启动后端

```bash
cd backend
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

后端地址：<http://localhost:8000>

接口文档：<http://localhost:8000/docs>

### 2. 启动前端

打开另一个终端：

```bash
npm install
npm run dev
```

根据终端提示打开 <http://localhost:5173>。如果该端口已被占用，Vite 会显示其他端口，请以终端地址为准。

## 配置真实大模型

前端不会保存大模型密钥。复制后端的示例配置：

```bash
cd backend
cp .env.example .env
```

在 `backend/.env` 中填写兼容 OpenAI Chat Completions 格式的服务配置：

```dotenv
LLM_API_KEY=your-api-key-here
LLM_API_BASE_URL=https://your-provider.example/v1
LLM_MODEL=your-model-name
```

然后使用环境变量文件启动后端：

```bash
uvicorn app.main:app --reload --port 8000 --env-file .env
```

在网页中选择 `Real AI（后端）` 即可测试。`backend/.env` 已被 `.gitignore` 忽略，不要把真实密钥写进前端或提交到 Git。

## 生产构建

```bash
npm run build
npm run preview
```

## Docker 部署

```bash
docker compose up --build
```

构建完成后访问 <http://localhost:8080>。

## 项目结构

```text
ai-chat-web/
├── backend/              # FastAPI 后端
├── src/
│   ├── components/       # 页面组件
│   ├── constants/        # 模型配置
│   ├── services/         # 模拟及后端请求
│   ├── types/            # TypeScript 类型
│   ├── App.tsx           # 会话状态与业务逻辑
│   └── App.css           # 页面样式
├── Dockerfile            # 前端构建及 Nginx 镜像
├── docker-compose.yml    # 前后端容器编排
└── nginx.conf            # 静态资源及 API 反向代理
```

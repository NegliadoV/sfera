---
description: Deploy Horizon Project to Production (Ubuntu PM2 via SSH)
---

## Серверы

| Сервер | Хост | Пользователь | Назначение |
|--------|------|--------------|------------|
| **Прод** | `192.168.0.129` (порт 2222) | `admin` | roominate.rest |
| **Тест** | `64.188.71.246` (порт 22) | `root` | Тестовый сервер |

**ОСНОВНОЕ ПРАВИЛО:** В первую очередь выкатываем обновления на прод только через **GITHUB** (`git push` локально → `git pull` на сервере).

## Деплой на тестовый сервер (64.188.71.246)

```bash
# 1. Пушим изменения
git push origin master
git push origin master:main --force

# 2. На сервере (SSH root@64.188.71.246):
cd /opt/sfera && git pull origin main && npm install --legacy-peer-deps && npm run build && pm2 restart all && pm2 save
```

## Способ 1: Деплой на прод через GitHub (Основной)
1. Убедитесь, что все изменения закоммичены: `git add .` и `git commit -m "update"`.
2. `git push origin master`
3. На сервере (`cd /opt/sfera`): `git pull origin master && npm install && npm run build && pm2 restart all && pm2 save`

## Способ 2: Деплой через TAR (Запасной)
Если Git сломался, используйте этот метод для быстрого ручного патча.

1. Упаковка нужных файлов локально. Исключаем `node_modules`, `.git` и папку `logs/`, чтобы сэкономить пропускную способность:
2. `tar.exe -czvf sfera-patch.tar.gz --exclude node_modules --exclude .git --exclude logs --exclude .env --exclude .env.example --exclude sfera-patch*.tar.gz .`

3. Запуск локального Node HTTP-сервера для раздачи архива (порт 8085 выделен под патчи):
4. `node -e "require('http').createServer((q,s)=>{s.end(require('fs').readFileSync('sfera-patch.tar.gz'))}).listen(8085)"`

5. Команда для Сервера (SSH) — скачиваем архив к себе в `/opt/sfera`, распаковываем, запускаем билд и перезагружаем PM2:
6. `cd /opt/sfera && curl -sS -o sfera-patch.tar.gz http://192.168.0.210:8085/ && tar -xzvf sfera-patch.tar.gz && npm run build && pm2 restart all && pm2 save`

7. Зайти в терминал с локальным сервером для раздачи файла и остановить его (Ctrl+C или Terminate).

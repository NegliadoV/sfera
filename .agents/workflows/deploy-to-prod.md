---
description: Deploy Horizon Project to Production (Ubuntu PM2 via SSH)
---

Этот воркфлоу описывает проверенный метод быстрой сборки и переноса патчей на сервер, обходя сложности с Git-авторизацией.

1. Упаковка нужных файлов локально. Исключаем `node_modules`, `.git` и папку `logs/`, чтобы сэкономить пропускную способность:
// turbo
2. `tar.exe -czvf sfera-patch.tar.gz --exclude node_modules --exclude .git --exclude logs .`

3. Запуск локального Node HTTP-сервера для раздачи архива (порт 8085 выделен под патчи):
// turbo
4. `node -e "require('http').createServer((q,s)=>{s.end(require('fs').readFileSync('sfera-patch.tar.gz'))}).listen(8085)"`

5. Команда для Сервера (SSH) — скачиваем архив к себе в `/opt/sfera`, распаковываем, запускаем билд и перезагружаем PM2:
// turbo
6. `cd /opt/sfera && curl -sS -o sfera-patch.tar.gz http://192.168.0.210:8085/ && tar -xzvf sfera-patch.tar.gz && npm run build && pm2 restart all && pm2 save`

7. Зайти в терминал с локальным сервером для раздачи файла и остановить его (Ctrl+C или Terminate).

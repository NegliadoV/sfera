#!/bin/bash
# Скрипт развёртывания SFERA на Ubuntu (Часть 2 плана деплоя).
# Запуск: скопируйте на сервер и выполните: chmod +x deploy-ubuntu.sh && ./deploy-ubuntu.sh
# Требуется: sudo без пароля или ввод пароля по запросу.
# Если пароль БД содержит #, @, кавычки — после скрипта отредактируйте .env вручную.
#
# Клонирование GitHub: по умолчанию используется SSH (git@github.com:...). Добавьте
# SSH-ключ сервера в GitHub (Settings → SSH keys) — тогда запрос пароля не появится.
# Если используете HTTPS (REPO_URL=https://...): при запросе "Password" вводите не пароль
# от аккаунта, а Personal Access Token (GitHub → Settings → Developer settings → PAT).

set -e

# Настройки. Репозиторий не спрашивается — по умолчанию SSH (без запроса пароля при ключе).
# Переопределить: REPO_URL=https://github.com/NegliadoV/sfera.git ./deploy-ubuntu.sh
# Если package.json не в корне клона, укажите подкаталог: PROJECT_SUBDIR=web ./deploy-ubuntu.sh
REPO_URL="${REPO_URL:-git@github.com:NegliadoV/sfera.git}"
INSTALL_DIR="${INSTALL_DIR:-/opt/sfera}"
PROJECT_SUBDIR="${PROJECT_SUBDIR:-}"
EXTERNAL_IP="${EXTERNAL_IP:-193.194.100.15}"

echo "=== SFERA: установка на Ubuntu ==="
echo "Репозиторий:    $REPO_URL (по умолчанию, без запроса)"
echo "Каталог клона:  $INSTALL_DIR"
[ -n "$PROJECT_SUBDIR" ] && echo "Подкаталог app: $PROJECT_SUBDIR"
echo "Внешний IP:     $EXTERNAL_IP"
echo ""

# Пароль БД
read -sp "Введите пароль для пользователя PostgreSQL 'sfera': " DB_PASSWORD
echo ""
if [ -z "$DB_PASSWORD" ]; then
  echo "Пароль не задан. Выход."
  exit 1
fi

# AUTH_SECRET генерируем автоматически
AUTH_SECRET=$(openssl rand -base64 32)
echo "AUTH_SECRET сгенерирован."

# Запускать ли db:seed
read -p "Выполнить db:seed (начальные данные)? [y/N]: " RUN_SEED
RUN_SEED=${RUN_SEED:-n}

echo ""
echo "--- 1. Обновление системы и установка пакетов ---"
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git

echo ""
echo "--- 2. Node.js 20 LTS ---"
# Удалить старый Node из репозитория Ubuntu (конфликт с NodeSource: libnode-dev и т.д.)
sudo apt remove -y nodejs npm libnode-dev 2>/dev/null || true
sudo apt autoremove -y
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v

echo ""
echo "--- 3. PostgreSQL ---"
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable postgresql
sudo systemctl start postgresql || true

echo ""
echo "--- 4. Redis (опционально) ---"
sudo apt install -y redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server || true

echo ""
echo "--- 5. Пользователь и база PostgreSQL ---"
sudo -u postgres psql -c "CREATE USER sfera WITH PASSWORD '$DB_PASSWORD';" 2>/dev/null || true
sudo -u postgres psql -c "CREATE DATABASE sfera OWNER sfera;" 2>/dev/null || true
export PGPASSWORD="$DB_PASSWORD"
psql -h localhost -U sfera -d sfera -c "SELECT 1" >/dev/null 2>&1 || {
  echo "Ошибка: не удалось подключиться к БД. Проверьте пароль и что пользователь sfera создан."
  exit 1
}
unset PGPASSWORD
echo "Подключение к БД OK."

echo ""
echo "--- 6. Клонирование и сборка ---"
if echo "$REPO_URL" | grep -q '^https://'; then
  echo "Используется HTTPS. Если Git запросит пароль — введите Personal Access Token (не пароль от GitHub)."
fi
sudo mkdir -p "$(dirname "$INSTALL_DIR")"
if [ -d "$INSTALL_DIR/.git" ] && [ -f "$INSTALL_DIR/package-lock.json" ]; then
  echo "Каталог $INSTALL_DIR уже существует и содержит репозиторий. Обновление: git pull"
  cd "$INSTALL_DIR"
  sudo chown -R "$USER:$USER" .
  git pull
else
  if [ -d "$INSTALL_DIR" ]; then
    echo "Каталог $INSTALL_DIR есть, но нет полного клона (нет package-lock.json). Пересоздаём."
    sudo rm -rf "$INSTALL_DIR"
  fi
  sudo git clone "$REPO_URL" "$INSTALL_DIR"
  cd "$INSTALL_DIR"
  sudo chown -R "$USER:$USER" .
fi
# Переход в каталог с приложением (корень клона или подкаталог)
if [ -n "$PROJECT_SUBDIR" ]; then
  cd "$INSTALL_DIR/$PROJECT_SUBDIR"
else
  cd "$INSTALL_DIR"
fi
# Если package.json не в текущем каталоге — ищем в подкаталогах (не в node_modules)
if [ ! -f package.json ]; then
  FOUND=$(find . -maxdepth 4 -name package.json -type f ! -path '*/node_modules/*' 2>/dev/null | head -1)
  if [ -n "$FOUND" ]; then
    APP_DIR=$(dirname "$FOUND")
    echo "Найден package.json в подкаталоге: $APP_DIR"
    cd "$APP_DIR"
  fi
fi
if [ ! -f package.json ]; then
  echo "Ошибка: package.json не найден в $(pwd)."
  echo "Если приложение в подкаталоге репозитория, запустите: PROJECT_SUBDIR=имя_папки ./deploy-ubuntu.sh"
  echo "Узнать подкаталог на сервере: find $INSTALL_DIR -name package.json -type f ! -path '*/node_modules/*'"
  exit 1
fi
if [ -f package-lock.json ]; then
  npm ci
else
  echo "package-lock.json отсутствует в репозитории — выполняем npm install."
  npm install
fi
npm run build

echo ""
echo "--- 7. Файл .env ---"
cat > .env << ENVFILE
DATABASE_URL=postgres://sfera:${DB_PASSWORD}@localhost:5432/sfera
AUTH_SECRET=$AUTH_SECRET
NEXTAUTH_URL=http://${EXTERNAL_IP}:3000
WS_PORT=3002
NEXT_PUBLIC_WS_URL=http://${EXTERNAL_IP}:3002
WS_SERVER_URL=http://127.0.0.1:3002
# Опционально: вход через GitHub (создайте OAuth App на github.com/settings/developers)
# AUTH_GITHUB_ID=
# AUTH_GITHUB_SECRET=
ENVFILE
echo ".env создан."

echo ""
echo "--- 8. Миграции БД ---"
npm run db:push
if [ "$(echo "$RUN_SEED" | tr '[:upper:]' '[:lower:]')" = "y" ]; then
  npm run db:seed || echo "db:seed завершился с ошибкой или не выполнился (не критично)."
fi

echo ""
echo "--- 9. PM2 ---"
sudo npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup | tail -1 | sudo bash || true
pm2 status

echo ""
echo "--- 10. Фаервол UFW ---"
sudo ufw allow 22/tcp
sudo ufw allow 3000/tcp
sudo ufw allow 3002/tcp
echo "y" | sudo ufw enable
sudo ufw status

echo ""
echo "=== Готово. ==="
echo "Сайт:        http://${EXTERNAL_IP}:3000"
echo "WebSocket:   http://${EXTERNAL_IP}:3002"
echo "Логи:        pm2 logs"
echo "Статус:      pm2 status"
echo ""
echo "Мобильное приложение: EXPO_PUBLIC_API_URL=http://${EXTERNAL_IP}:3000, EXPO_PUBLIC_WS_URL=ws://${EXTERNAL_IP}:3002"

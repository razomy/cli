#!/bin/bash
cd ../
set -e

# Имя твоего CLI
CLI_NAME="razomy" # ВПИШИ СВОЕ ИМЯ ЗДЕСЬ

echo "📦 1. Собираем JS код..."
npm run build

echo "🗜 2. Создаем Standalone-архив (включает Node.js внутри)..."
# Флаг -t указывает, что нам нужен только архив для Linux x64 (чтобы не ждать сборку для Mac/Win)
npx oclif pack:tarballs -t linux-x64

echo "🔍 3. Ищем созданный архив в папке dist/..."
# Oclif создает архив с именем вида mycli-v1.0.0-linux-x64.tar.gz
TARBALL=$(find dist -name "*-linux-x64.tar.gz" | head -n 1)

if [ -z "$TARBALL" ]; then
  echo "❌ Ошибка: Архив не найден в папке dist/"
  exit 1
fi

echo "Нашли архив: $TARBALL"
TARBALL_NAME=$(basename "$TARBALL")

echo "🐳 4. Запускаем ЧИСТУЮ Ubuntu (БЕЗ Node.js)..."
# Мы используем ubuntu:latest, монтируем только что созданный архив
docker run --rm -it \
  --platform linux/amd64 \
  -v "$(pwd)/$TARBALL:/tmp/$TARBALL_NAME" \
  ubuntu:latest \
  bash -c "
    echo '🛠 Обновляем пакеты и ставим tar (в голом докере его может не быть)'
    apt-get update -qq && apt-get install -y -qq tar curl > /dev/null

    echo '🧐 Проверяем, есть ли Node.js в системе (спойлер: его нет!)'
    node -v || echo '✅ Ура, Node.js НЕ установлен в ОС!'

    echo '📦 Распаковываем наш standalone CLI в /usr/local/lib...'
    mkdir -p /usr/local/lib/$CLI_NAME
    tar -xzf /tmp/$TARBALL_NAME -C /usr/local/lib/$CLI_NAME --strip-components=1 --warning=no-unknown-keyword

    echo '🔗 Создаем симлинк, чтобы команда была доступна отовсюду...'
    ln -s /usr/local/lib/$CLI_NAME/bin/$CLI_NAME /usr/local/bin/$CLI_NAME

    echo ''
    echo '🎉 ГОТОВО! CLI установлен как самостоятельная программа.'
    echo 'Пробуем запустить:'
    $CLI_NAME --version

    echo '---------------------------------------------------'
    echo 'Теперь вы в чистой Ubuntu. Попробуйте свои команды.'
    echo 'Например: $CLI_NAME --help'
    echo 'Для выхода введите: exit'
    echo '---------------------------------------------------'

    bash
  "

echo "🧹 Тест завершен."